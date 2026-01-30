/**
 * 푸시 알림 발송 Edge Function
 *
 * FCM (Firebase Cloud Messaging)을 통해 푸시 알림 발송
 *
 * 환경변수 필요:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushRequest {
  recipientId: string
  title: string
  body: string
  data?: Record<string, string>
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientId, title, body, data } = await req.json() as PushRequest

    if (!recipientId || !title) {
      return new Response(
        JSON.stringify({ error: 'recipientId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 사용자의 푸시 토큰 조회
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', recipientId)
      .single()

    if (tokenError || !tokenData?.token) {
      console.log('푸시 토큰 없음:', recipientId)
      return new Response(
        JSON.stringify({ success: false, error: 'no_token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FCM 발송
    const fcmResult = await sendFCM({
      token: tokenData.token,
      title,
      body,
      data
    })

    return new Response(
      JSON.stringify({ success: fcmResult.success, messageId: fcmResult.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('푸시 발송 에러:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * FCM HTTP v1 API로 푸시 발송
 */
async function sendFCM({
  token,
  title,
  body,
  data
}: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')

  if (!projectId || !privateKey || !clientEmail) {
    console.error('Firebase 환경변수 누락')
    return { success: false, error: 'firebase_config_missing' }
  }

  try {
    // Google OAuth 토큰 생성
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey)

    // FCM 메시지 구성
    const message = {
      message: {
        token: token,
        notification: {
          title: title,
          body: body,
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            }
          }
        }
      }
    }

    // FCM API 호출
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('FCM 발송 실패:', result)
      return { success: false, error: result }
    }

    console.log('FCM 발송 성공:', result.name)
    return { success: true, messageId: result.name }
  } catch (error) {
    console.error('FCM 발송 에러:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Google OAuth Access Token 생성
 */
async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // JWT Payload
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  }

  // JWT 생성
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  // RSA 서명
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${unsignedToken}.${signatureB64}`

  // Access Token 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

/**
 * PEM 형식의 키를 바이너리로 변환
 */
function pemToBinary(pem: string): ArrayBuffer {
  const lines = pem.split('\n')
  const base64 = lines
    .filter(line => !line.includes('-----'))
    .join('')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
