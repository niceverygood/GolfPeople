/**
 * RevenueCat 웹훅 Edge Function
 *
 * RevenueCat 서버에서 구매 이벤트 발생 시 호출
 * 구매 검증 후 마커 지급
 *
 * 환경변수:
 * - REVENUECAT_WEBHOOK_AUTH_KEY
 *
 * RevenueCat 대시보드 설정:
 * - Webhook URL: https://<project-ref>.supabase.co/functions/v1/webhook-revenuecat
 * - Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_KEY>
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 상품 ID → 마커 수량 매핑 (iap.js PRODUCT_INFO와 동기화)
const PRODUCT_MARKERS: Record<string, { markers: number; bonus: number }> = {
  'marker5':   { markers: 5,   bonus: 0 },
  'marker10':  { markers: 10,  bonus: 1 },
  'marker30':  { markers: 30,  bonus: 5 },
  'marker50':  { markers: 50,  bonus: 10 },
  'marker100': { markers: 100, bonus: 25 },
}

// 처리할 이벤트 타입
const PURCHASE_EVENTS = [
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
]

/**
 * 타이밍 공격 방지 상수 시간 비교
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 웹훅 인증 검증
    const webhookKey = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY')
    if (!webhookKey) {
      console.error('REVENUECAT_WEBHOOK_AUTH_KEY 미설정')
      return new Response(
        JSON.stringify({ error: 'webhook_not_configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization') || ''
    const providedKey = authHeader.replace('Bearer ', '')

    if (!constantTimeCompare(providedKey, webhookKey)) {
      console.error('웹훅 인증 실패')
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 웹훅 페이로드 파싱
    const payload = await req.json()
    const event = payload.event

    if (!event) {
      return new Response(
        JSON.stringify({ success: true, message: 'no_event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const eventType = event.type
    console.log('RevenueCat 웹훅 수신:', eventType)

    // 구매 이벤트만 처리
    if (!PURCHASE_EVENTS.includes(eventType)) {
      console.log('무시할 이벤트:', eventType)
      return new Response(
        JSON.stringify({ success: true, message: 'event_ignored', type: eventType }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 이벤트 데이터 추출
    const appUserId = event.app_user_id          // Supabase user UUID
    const productId = event.product_id           // 'marker5', 'marker10' 등
    const transactionId = event.transaction_id || event.id
    const store = event.store                    // 'APP_STORE' or 'PLAY_STORE'
    const priceInPurchasedCurrency = event.price_in_purchased_currency || 0

    if (!appUserId || !productId || !transactionId) {
      console.error('필수 필드 누락:', { appUserId, productId, transactionId })
      return new Response(
        JSON.stringify({ success: false, error: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 상품 마커 수량 확인
    const productInfo = PRODUCT_MARKERS[productId]
    if (!productInfo) {
      console.error('알 수 없는 상품:', productId)
      // 200 반환하여 RevenueCat 재시도 방지
      return new Response(
        JSON.stringify({ success: true, message: 'unknown_product', productId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalMarkers = productInfo.markers + productInfo.bonus
    const platform = store === 'PLAY_STORE' ? 'revenuecat_android' : 'revenuecat_ios'

    // Supabase service_role 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 마커 지급
    const { data: creditResult, error: creditError } = await supabase.rpc('credit_markers_verified', {
      p_user_id: appUserId,
      p_amount: totalMarkers,
      p_transaction_id: transactionId,
      p_platform: platform,
      p_product_id: productId,
      p_paid_amount: Math.round(priceInPurchasedCurrency),
      p_receipt_data: event,
    })

    if (creditError) {
      console.error('마커 지급 실패:', creditError)
      return new Response(
        JSON.stringify({ success: false, error: 'credit_failed', message: creditError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('RevenueCat 구매 처리 완료:', {
      userId: appUserId,
      product: productId,
      markers: totalMarkers,
      platform,
      result: creditResult,
    })

    return new Response(
      JSON.stringify({ success: true, ...creditResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('RevenueCat 웹훅 에러:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
