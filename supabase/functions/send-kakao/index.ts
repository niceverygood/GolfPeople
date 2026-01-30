/**
 * 카카오 알림톡 발송 Edge Function
 *
 * 카카오 비즈니스 알림톡 API를 통해 알림 발송
 *
 * 환경변수 필요:
 * - KAKAO_REST_API_KEY: 카카오 REST API 키
 * - KAKAO_SENDER_KEY: 발신 프로필 키 (카카오톡 채널)
 *
 * 사전 설정 필요:
 * 1. 카카오 비즈니스 계정 생성
 * 2. 카카오톡 채널 생성
 * 3. 알림톡 템플릿 등록 및 승인
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KakaoRequest {
  recipientId: string
  templateCode: string
  variables: Record<string, string>
}

// 알림톡 템플릿 정의 (카카오 비즈니스에서 승인받은 템플릿과 동일해야 함)
const TEMPLATES: Record<string, {
  templateId: string
  content: string
  buttons?: Array<{ type: string; name: string; urlMobile?: string; urlPc?: string }>
}> = {
  FRIEND_REQUEST_01: {
    templateId: 'FRIEND_REQUEST_01',
    content: '[골프피플] 새로운 친구 요청\n\n#{senderName}님이 친구 요청을 보냈습니다.\n\n앱에서 확인해보세요!',
    buttons: [
      { type: 'WL', name: '앱에서 확인', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  FRIEND_ACCEPTED_01: {
    templateId: 'FRIEND_ACCEPTED_01',
    content: '[골프피플] 친구 요청 수락\n\n#{senderName}님이 친구 요청을 수락했습니다.\n\n이제 함께 라운딩을 즐겨보세요!',
    buttons: [
      { type: 'WL', name: '앱에서 확인', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  JOIN_APPLICATION_01: {
    templateId: 'JOIN_APPLICATION_01',
    content: '[골프피플] 새로운 조인 신청\n\n#{senderName}님이 "#{joinTitle}" 조인에 신청했습니다.\n\n앱에서 확인하고 수락/거절해주세요.',
    buttons: [
      { type: 'WL', name: '신청 확인하기', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  JOIN_ACCEPTED_01: {
    templateId: 'JOIN_ACCEPTED_01',
    content: '[골프피플] 조인 참가 확정\n\n"#{joinTitle}" 조인 참가가 확정되었습니다!\n\n일시: #{joinDate}\n장소: #{joinLocation}\n\n즐거운 라운딩 되세요!',
    buttons: [
      { type: 'WL', name: '상세 정보 보기', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  JOIN_REJECTED_01: {
    templateId: 'JOIN_REJECTED_01',
    content: '[골프피플] 조인 신청 결과\n\n아쉽게도 "#{joinTitle}" 조인 신청이 거절되었습니다.\n\n다른 조인을 찾아보세요!',
    buttons: [
      { type: 'WL', name: '다른 조인 찾기', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  NEW_MESSAGE_01: {
    templateId: 'NEW_MESSAGE_01',
    content: '[골프피플] 새 메시지\n\n#{senderName}님의 새 메시지가 있습니다.\n\n앱에서 확인해보세요!',
    buttons: [
      { type: 'WL', name: '메시지 확인', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
  JOIN_REMINDER_01: {
    templateId: 'JOIN_REMINDER_01',
    content: '[골프피플] 라운딩 리마인더\n\n내일 "#{joinTitle}" 라운딩이 예정되어 있습니다.\n\n일시: #{joinDate}\n장소: #{joinLocation}\n\n준비 잘 하시고, 즐거운 라운딩 되세요!',
    buttons: [
      { type: 'WL', name: '상세 정보 보기', urlMobile: 'https://golf-people.vercel.app', urlPc: 'https://golf-people.vercel.app' }
    ]
  },
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientId, templateCode, variables } = await req.json() as KakaoRequest

    if (!recipientId || !templateCode) {
      return new Response(
        JSON.stringify({ error: 'recipientId and templateCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 환경변수 확인
    const kakaoApiKey = Deno.env.get('KAKAO_REST_API_KEY')
    const senderKey = Deno.env.get('KAKAO_SENDER_KEY')

    if (!kakaoApiKey || !senderKey) {
      console.log('카카오 API 설정 안됨 - 알림톡 발송 스킵')
      return new Response(
        JSON.stringify({ success: false, error: 'kakao_not_configured', message: '카카오 API가 설정되지 않았습니다' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 사용자 전화번호 조회
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('phone, kakao_notification_enabled')
      .eq('id', recipientId)
      .single()

    if (userError || !userData?.phone) {
      console.log('사용자 전화번호 없음:', recipientId)
      return new Response(
        JSON.stringify({ success: false, error: 'no_phone' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 카카오 알림 비활성화 확인
    if (userData.kakao_notification_enabled === false) {
      console.log('카카오 알림 비활성화:', recipientId)
      return new Response(
        JSON.stringify({ success: false, error: 'kakao_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 템플릿 조회
    const template = TEMPLATES[templateCode]
    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 알림톡 발송
    const result = await sendKakaoAlimtalk({
      apiKey: kakaoApiKey,
      senderKey: senderKey,
      phoneNumber: userData.phone,
      templateCode: template.templateId,
      content: formatContent(template.content, variables),
      buttons: template.buttons,
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('카카오 알림톡 발송 에러:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * 템플릿 내용에 변수 치환
 */
function formatContent(template: string, variables: Record<string, string>): string {
  let content = template
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`#\\{${key}\\}`, 'g'), value || '')
  })
  return content
}

/**
 * 카카오 알림톡 API 호출
 *
 * 참고: 실제 카카오 비즈메시지 API 연동 시
 * 공식 문서 확인 필요: https://business.kakao.com/
 */
async function sendKakaoAlimtalk({
  apiKey,
  senderKey,
  phoneNumber,
  templateCode,
  content,
  buttons,
}: {
  apiKey: string
  senderKey: string
  phoneNumber: string
  templateCode: string
  content: string
  buttons?: Array<{ type: string; name: string; urlMobile?: string; urlPc?: string }>
}) {
  try {
    // 전화번호 포맷 (010-1234-5678 -> 01012345678)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '')

    // 카카오 비즈메시지 API 호출
    // 실제 연동 시 카카오 비즈니스 공식 API 엔드포인트 사용
    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: 'text',
          text: content,
          link: {
            web_url: 'https://golf-people.vercel.app',
            mobile_web_url: 'https://golf-people.vercel.app',
          },
          button_title: buttons?.[0]?.name || '앱에서 확인',
        }),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('카카오 알림톡 발송 실패:', result)

      // 실패 시 대안: 직접 알림톡 API 사용 (사업자 인증 후)
      // 이 부분은 카카오 비즈니스 설정 완료 후 실제 알림톡 API로 교체 필요
      return {
        success: false,
        error: result.msg || 'kakao_api_error',
        code: result.code,
      }
    }

    console.log('카카오 알림톡 발송 성공')
    return { success: true, result }
  } catch (error) {
    console.error('카카오 API 호출 에러:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ===================================
 * 카카오 비즈니스 알림톡 실제 연동 가이드
 * ===================================
 *
 * 1. 카카오 비즈니스 계정 생성 (business.kakao.com)
 *
 * 2. 카카오톡 채널 생성
 *    - 비즈니스 대시보드 → 카카오톡 채널 → 새 채널 만들기
 *
 * 3. 알림톡 템플릿 등록
 *    - 비즈 메시지 → 알림톡 → 템플릿 등록
 *    - 위 TEMPLATES 객체와 동일한 내용으로 등록
 *    - 검수 승인까지 1~3일 소요
 *
 * 4. 발신 프로필 키 발급
 *    - 채널 설정 → 발신 프로필 → 키 복사
 *    - KAKAO_SENDER_KEY 환경변수에 설정
 *
 * 5. API 연동
 *    - 실제 알림톡 발송은 카카오 비즈메시지 API 사용
 *    - 공식 문서: https://developers.kakao.com/docs/latest/ko/message/rest-api
 *
 * 6. 비용
 *    - 알림톡: 건당 7~15원
 *    - 월정액 요금제 별도
 */
