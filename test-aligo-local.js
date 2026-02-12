/**
 * 알리고 알림톡 로컬 테스트
 *
 * 실행 방법:
 * node test-aligo-local.js
 */

// 알리고 설정
const ALIGO_CONFIG = {
  apiKey: 'emv0p0khgywmdl5wtt1aidjnx95dicdz',
  userId: 'golfpeople',
  senderKey: '072dd3d32fdd6a1e9f24d133f01868060b95fd86',
  sender: '01087399771',
}

// 테스트 수신자 (본인 번호)
const TEST_RECIPIENT = {
  phone: '01049441503',
  name: '테스트유저',
}

// 템플릿 (FRIEND_REQUEST - UF_2416)
const TEMPLATE = {
  tplCode: 'UF_2416',
  subject: '새로운 친구 요청',
  message: `[골프피플] 새로운 친구 요청

#{회원명}님, #{요청자명}님이 회원님의
프로필을 확인하고 친구 요청을 보냈습니다.

- 요청자: #{요청자명}
- 요청일시: #{요청일시}

앱에서 요청을 확인하고 수락 또는
거절해주세요.

본 메시지는 고객님께서 골프피플 앱 [마이페이지 > 설정 > 알림 설정]에서 '친구 요청 알림' 수신을 직접 설정(ON)하신 경우에 한하여, 새로운 친구 요청이 접수될 때마다 발송됩니다
수신을 원하지 않으시면 앱 내 알림 설정에서 해제하실 수 있습니다.`,
  buttonName: '앱에서 확인',
  buttonUrl: 'https://golf-people.vercel.app',
}

// 메시지에 변수 치환
function formatMessage(template, variables) {
  let content = template
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`#\\{${key}\\}`, 'g'), value || '')
  })
  return content
}

// 알리고 알림톡 발송
async function sendAlimtalk() {
  try {
    console.log('🚀 알리고 알림톡 테스트 시작...\n')

    // 변수 설정
    const variables = {
      회원명: TEST_RECIPIENT.name,
      요청자명: '개발자',
      요청일시: new Date().toLocaleString('ko-KR'),
    }

    // 메시지 생성
    const message = formatMessage(TEMPLATE.message, variables)

    console.log('📝 발송 정보:')
    console.log(`  - 수신자: ${TEST_RECIPIENT.phone}`)
    console.log(`  - 템플릿: ${TEMPLATE.tplCode}`)
    console.log(`  - 제목: ${TEMPLATE.subject}`)
    console.log('')

    // 전화번호 포맷 (하이픈 제거)
    const formattedPhone = TEST_RECIPIENT.phone.replace(/[^0-9]/g, '')

    // 알리고 API 요청 바디
    const formData = new URLSearchParams({
      apikey: ALIGO_CONFIG.apiKey,
      userid: ALIGO_CONFIG.userId,
      senderkey: ALIGO_CONFIG.senderKey,
      tpl_code: TEMPLATE.tplCode,
      sender: ALIGO_CONFIG.sender,
      receiver_1: formattedPhone,
      subject_1: TEMPLATE.subject,
      message_1: message,
    })

    // 버튼 추가
    if (TEMPLATE.buttonName && TEMPLATE.buttonUrl) {
      formData.append('button_1', JSON.stringify({
        button: [{
          name: TEMPLATE.buttonName,
          linkType: 'WL',
          linkTypeName: '웹링크',
          linkMo: TEMPLATE.buttonUrl,
          linkPc: TEMPLATE.buttonUrl,
        }]
      }))
    }

    console.log('📡 알리고 API 호출 중...\n')

    // 알리고 API 호출
    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await response.json()

    console.log('📨 알리고 응답:')
    console.log(JSON.stringify(result, null, 2))
    console.log('')

    // 결과 확인
    if (result.code === 0) {
      console.log('✅ 알림톡 발송 성공!')
      console.log(`📱 ${TEST_RECIPIENT.phone}로 카카오톡을 확인하세요!`)
    } else {
      console.log('❌ 알림톡 발송 실패')
      console.log(`   에러 코드: ${result.code}`)
      console.log(`   에러 메시지: ${result.message}`)
    }

  } catch (error) {
    console.error('💥 에러 발생:', error.message)
  }
}

// 실행
sendAlimtalk()
