/**
 * 알리고 알림톡 발송 Edge Function
 *
 * 알리고 API를 통해 카카오 알림톡 발송
 * https://smartsms.aligo.in/admin/api/kakao.html
 *
 * 환경변수 필요 (Supabase Edge Function Secrets):
 * - ALIGO_API_KEY: 알리고 API 키
 * - ALIGO_USER_ID: 알리고 사용자 ID
 * - ALIGO_SENDER_KEY: 발신프로필 키 (카카오톡 채널)
 * - ALIGO_SENDER: 발신번호 (사업자 등록된 번호)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AligoRequest {
  recipientId: string
  templateCode: string
  variables: Record<string, string>
}

// 알림톡 템플릿 정의 (알리고에서 승인받은 템플릿과 동일해야 함)
const TEMPLATES: Record<string, {
  tplCode: string
  subject: string
  message: string
  buttonName?: string
  buttonUrl?: string
}> = {
  FRIEND_REQUEST_01: {
    tplCode: 'FRIEND_REQUEST_01',
    subject: '새로운 친구 요청',
    message: '[골프피플] 새로운 친구 요청\n\n#{senderName}님이 친구 요청을 보냈습니다.\n\n앱에서 확인해보세요!',
    buttonName: '앱에서 확인',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  FRIEND_ACCEPTED_01: {
    tplCode: 'FRIEND_ACCEPTED_01',
    subject: '친구 요청 수락',
    message: '[골프피플] 친구 요청 수락\n\n#{senderName}님이 친구 요청을 수락했습니다.\n\n이제 함께 라운딩을 즐겨보세요!',
    buttonName: '앱에서 확인',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  JOIN_APPLICATION_01: {
    tplCode: 'JOIN_APPLICATION_01',
    subject: '새로운 조인 신청',
    message: '[골프피플] 새로운 조인 신청\n\n#{senderName}님이 "#{joinTitle}" 조인에 신청했습니다.\n\n앱에서 확인하고 수락/거절해주세요.',
    buttonName: '신청 확인하기',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  JOIN_ACCEPTED_01: {
    tplCode: 'JOIN_ACCEPTED_01',
    subject: '조인 참가 확정',
    message: '[골프피플] 조인 참가 확정\n\n"#{joinTitle}" 조인 참가가 확정되었습니다!\n\n일시: #{joinDate}\n장소: #{joinLocation}\n\n즐거운 라운딩 되세요!',
    buttonName: '상세 정보 보기',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  JOIN_REJECTED_01: {
    tplCode: 'JOIN_REJECTED_01',
    subject: '조인 신청 결과',
    message: '[골프피플] 조인 신청 결과\n\n아쉽게도 "#{joinTitle}" 조인 신청이 거절되었습니다.\n\n다른 조인을 찾아보세요!',
    buttonName: '다른 조인 찾기',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  NEW_MESSAGE_01: {
    tplCode: 'NEW_MESSAGE_01',
    subject: '새 메시지',
    message: '[골프피플] 새 메시지\n\n#{senderName}님의 새 메시지가 있습니다.\n\n앱에서 확인해보세요!',
    buttonName: '메시지 확인',
    buttonUrl: 'https://golf-people.vercel.app',
  },
  JOIN_REMINDER_01: {
    tplCode: 'JOIN_REMINDER_01',
    subject: '라운딩 리마인더',
    message: '[골프피플] 라운딩 리마인더\n\n내일 "#{joinTitle}" 라운딩이 예정되어 있습니다.\n\n일시: #{joinDate}\n장소: #{joinLocation}\n\n준비 잘 하시고, 즐거운 라운딩 되세요!',
    buttonName: '상세 정보 보기',
    buttonUrl: 'https://golf-people.vercel.app',
  },
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientId, templateCode, variables } = await req.json() as AligoRequest

    if (!recipientId || !templateCode) {
      return new Response(
        JSON.stringify({ error: 'recipientId and templateCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 환경변수 확인
    const aligoApiKey = Deno.env.get('ALIGO_API_KEY')
    const aligoUserId = Deno.env.get('ALIGO_USER_ID')
    const aligoSenderKey = Deno.env.get('ALIGO_SENDER_KEY')
    const aligoSender = Deno.env.get('ALIGO_SENDER')

    if (!aligoApiKey || !aligoUserId || !aligoSenderKey || !aligoSender) {
      console.log('알리고 API 설정 안됨 - 알림톡 발송 스킵')
      return new Response(
        JSON.stringify({ success: false, error: 'aligo_not_configured', message: '알리고 API가 설정되지 않았습니다' }),
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
    const result = await sendAligoAlimtalk({
      apiKey: aligoApiKey,
      userId: aligoUserId,
      senderKey: aligoSenderKey,
      sender: aligoSender,
      phoneNumber: userData.phone,
      template: template,
      variables: variables,
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('알림톡 발송 에러:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * 템플릿 내용에 변수 치환
 */
function formatMessage(template: string, variables: Record<string, string>): string {
  let content = template
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`#\\{${key}\\}`, 'g'), value || '')
  })
  return content
}

/**
 * 알리고 알림톡 API 호출
 * API 문서: https://smartsms.aligo.in/admin/api/kakao.html
 */
async function sendAligoAlimtalk({
  apiKey,
  userId,
  senderKey,
  sender,
  phoneNumber,
  template,
  variables,
}: {
  apiKey: string
  userId: string
  senderKey: string
  sender: string
  phoneNumber: string
  template: {
    tplCode: string
    subject: string
    message: string
    buttonName?: string
    buttonUrl?: string
  }
  variables: Record<string, string>
}) {
  try {
    // 전화번호 포맷 (010-1234-5678 -> 01012345678)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '')

    // 메시지 내용 생성
    const message = formatMessage(template.message, variables)

    // 알리고 API 요청 바디 구성
    const formData = new URLSearchParams({
      apikey: apiKey,
      userid: userId,
      senderkey: senderKey,
      tpl_code: template.tplCode,
      sender: sender,
      receiver_1: formattedPhone,
      subject_1: template.subject,
      message_1: message,
    })

    // 버튼이 있는 경우 추가
    if (template.buttonName && template.buttonUrl) {
      formData.append('button_1', JSON.stringify({
        button: [{
          name: template.buttonName,
          linkType: 'WL',
          linkTypeName: '웹링크',
          linkMo: template.buttonUrl,
          linkPc: template.buttonUrl,
        }]
      }))
    }

    // 알리고 API 호출
    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await response.json()

    // 알리고 응답 코드 확인
    // code: 0 = 성공, 그 외 = 실패
    if (result.code !== 0) {
      console.error('알리고 알림톡 발송 실패:', result)
      return {
        success: false,
        error: result.message || 'aligo_api_error',
        code: result.code,
      }
    }

    console.log('알리고 알림톡 발송 성공:', result.info)
    return {
      success: true,
      messageId: result.info?.mid,
      result: result.info,
    }
  } catch (error) {
    console.error('알리고 API 호출 에러:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ===================================
 * 알리고 연동 가이드
 * ===================================
 *
 * 1. 알리고 회원가입 (https://smartsms.aligo.in)
 *
 * 2. API 키 발급
 *    - 마이페이지 → API 연동 → API 키 확인
 *    - ALIGO_API_KEY, ALIGO_USER_ID 설정
 *
 * 3. 카카오톡 채널 연동
 *    - 카카오 비즈니스 → 채널 생성
 *    - 알리고 → 카카오 알림톡 → 발신프로필 등록
 *    - ALIGO_SENDER_KEY 설정
 *
 * 4. 발신번호 등록
 *    - 알리고 → 발신번호 관리 → 사업자 번호 등록
 *    - ALIGO_SENDER 설정
 *
 * 5. 템플릿 등록
 *    - 알리고 → 카카오 알림톡 → 템플릿 관리
 *    - 위 TEMPLATES 객체와 동일한 내용으로 등록
 *    - 검수 승인 후 사용 가능
 *
 * 6. 비용
 *    - 알림톡: 건당 9~15원
 *    - 충전식 선불제
 */
