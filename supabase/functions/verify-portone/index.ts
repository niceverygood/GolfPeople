/**
 * PortOne 결제 검증 Edge Function
 *
 * 클라이언트에서 결제 완료 후 imp_uid를 전달받아
 * PortOne REST API로 결제 검증 후 마커 지급
 *
 * 환경변수:
 * - PORTONE_IMP_KEY
 * - PORTONE_IMP_SECRET
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 상품별 마커 수량 (iap.js PRODUCT_INFO와 동기화)
const PRODUCT_MARKERS: Record<number, { markers: number; bonus: number; price: number }> = {
  1: { markers: 5, bonus: 0, price: 1000 },
  2: { markers: 10, bonus: 1, price: 1900 },
  3: { markers: 30, bonus: 5, price: 4900 },
  4: { markers: 50, bonus: 10, price: 7900 },
  5: { markers: 100, bonus: 25, price: 14900 },
}

interface VerifyRequest {
  imp_uid: string
  merchant_uid: string
  product_id: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imp_uid, merchant_uid, product_id } = await req.json() as VerifyRequest

    if (!imp_uid || !merchant_uid || !product_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'imp_uid, merchant_uid, product_id 필수' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // JWT에서 사용자 ID 추출
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey)

    // JWT 검증으로 user_id 확인
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // 상품 정보 확인
    const product = PRODUCT_MARKERS[product_id]
    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_product' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PortOne REST API 토큰 발급
    const impKey = Deno.env.get('PORTONE_IMP_KEY')
    const impSecret = Deno.env.get('PORTONE_IMP_SECRET')

    if (!impKey || !impSecret) {
      console.error('PortOne 환경변수 누락')
      return new Response(
        JSON.stringify({ success: false, error: 'portone_config_missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
    })
    const tokenData = await tokenRes.json()

    if (tokenData.code !== 0) {
      console.error('PortOne 토큰 발급 실패:', tokenData)
      return new Response(
        JSON.stringify({ success: false, error: 'portone_auth_failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = tokenData.response.access_token

    // 결제 정보 조회
    const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { 'Authorization': accessToken },
    })
    const paymentData = await paymentRes.json()

    if (paymentData.code !== 0 || !paymentData.response) {
      console.error('결제 조회 실패:', paymentData)
      return new Response(
        JSON.stringify({ success: false, error: 'payment_not_found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payment = paymentData.response

    // 결제 상태 확인
    if (payment.status !== 'paid') {
      return new Response(
        JSON.stringify({ success: false, error: 'payment_not_paid', status: payment.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 결제 금액 검증
    if (payment.amount !== product.price) {
      console.error('금액 불일치:', { paid: payment.amount, expected: product.price })
      return new Response(
        JSON.stringify({ success: false, error: 'amount_mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // merchant_uid 검증
    if (payment.merchant_uid !== merchant_uid) {
      return new Response(
        JSON.stringify({ success: false, error: 'merchant_uid_mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 서버 마커 지급 (service_role로 RPC 호출)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const totalMarkers = product.markers + product.bonus

    const { data: creditResult, error: creditError } = await supabase.rpc('credit_markers_verified', {
      p_user_id: userId,
      p_amount: totalMarkers,
      p_transaction_id: imp_uid,
      p_platform: 'portone',
      p_product_id: product_id.toString(),
      p_paid_amount: payment.amount,
      p_receipt_data: payment,
    })

    if (creditError) {
      console.error('마커 지급 실패:', creditError)
      return new Response(
        JSON.stringify({ success: false, error: 'credit_failed', message: creditError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PortOne 결제 검증 완료:', { userId, imp_uid, markers: totalMarkers })

    return new Response(
      JSON.stringify(creditResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('PortOne 검증 에러:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
