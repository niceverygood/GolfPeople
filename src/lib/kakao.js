/**
 * 카카오 SDK 초기화 및 공유 기능
 */

const KAKAO_JS_KEY = '7b10e73198b86b183e7dd0aac0c18433'

// 카카오 SDK 초기화
export const initKakao = () => {
  if (typeof window === 'undefined' || !window.Kakao) return false

  if (!window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(KAKAO_JS_KEY)
      console.log('Kakao SDK initialized')
      return true
    } catch (e) {
      console.error('Kakao SDK init error:', e)
      return false
    }
  }
  return true
}

// 모바일 디바이스 판별
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/**
 * 카카오톡 조인 공유
 * PC에서는 카카오 팝업 에러가 발생할 수 있어 모바일에서만 사용 권장
 */
export const shareJoinToKakao = ({ title, date, time, location, url }) => {
  // PC 브라우저에서는 카카오 공유 대신 링크 복사 안내
  if (!isMobile()) {
    return { success: false, reason: 'pc_browser' }
  }

  if (!window.Kakao) {
    console.error('Kakao SDK not loaded')
    return { success: false, reason: 'sdk_not_loaded' }
  }

  const initialized = initKakao()
  if (!initialized) {
    return { success: false, reason: 'init_failed' }
  }

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🏌️ ${title}`,
        description: `📅 ${date} ${time}\n📍 ${location}\n\n골프피플에서 함께 라운딩해요!`,
        imageUrl: 'https://golf-people.vercel.app/og-image.png',
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
      buttons: [
        {
          title: '조인 보기',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      ],
    })
    return { success: true }
  } catch (e) {
    console.error('Kakao share error:', e)
    return { success: false, reason: 'share_error', message: e.message }
  }
}
