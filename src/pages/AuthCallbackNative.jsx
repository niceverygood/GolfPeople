import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * 네이티브 앱용 OAuth 콜백 페이지
 *
 * 웹에서 OAuth 완료 후 앱으로 리다이렉트
 * golfpeople:// 스킴을 사용하여 앱 열기
 */
export default function AuthCallbackNative() {
  const [status, setStatus] = useState('redirecting')

  useEffect(() => {
    // URL에서 토큰 정보 가져오기
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)

    const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
    const error = hashParams.get('error') || queryParams.get('error')

    if (error) {
      setStatus('error')
      // 에러 시 앱으로 에러 전달
      setTimeout(() => {
        window.location.href = `golfpeople://auth/callback?error=${error}`
      }, 1000)
      return
    }

    if (accessToken) {
      // 토큰이 있으면 앱으로 리다이렉트
      const appUrl = `golfpeople://auth/callback?access_token=${accessToken}${refreshToken ? `&refresh_token=${refreshToken}` : ''}`

      // 즉시 리다이렉트 시도
      window.location.href = appUrl

      // 2초 후에도 여기 있으면 수동 버튼 표시
      setTimeout(() => {
        setStatus('manual')
      }, 2000)
    } else {
      // 토큰 없으면 일반 콜백 페이지로 이동
      window.location.href = '/auth/callback' + window.location.hash
    }
  }, [])

  const handleOpenApp = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken) {
      window.location.href = `golfpeople://auth/callback?access_token=${accessToken}${refreshToken ? `&refresh_token=${refreshToken}` : ''}`
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-white">
      {status === 'redirecting' && (
        <>
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
          <p className="text-lg">앱으로 이동 중...</p>
        </>
      )}

      {status === 'manual' && (
        <>
          <p className="text-lg mb-4">앱이 자동으로 열리지 않았나요?</p>
          <button
            onClick={handleOpenApp}
            className="bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-lg"
          >
            앱 열기
          </button>
          <p className="text-sm text-gray-400 mt-4">
            앱이 설치되어 있지 않다면 먼저 설치해주세요.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="text-lg text-red-400">로그인 중 오류가 발생했습니다.</p>
          <p className="text-sm text-gray-400 mt-2">앱에서 다시 시도해주세요.</p>
        </>
      )}
    </div>
  )
}
