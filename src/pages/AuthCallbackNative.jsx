import { useEffect, useState } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'

/**
 * 네이티브 앱용 OAuth 콜백 페이지
 *
 * 웹에서 OAuth 완료 후 앱으로 리다이렉트
 * iOS는 자동 리다이렉트가 차단되므로 버튼 클릭 방식 사용
 */
export default function AuthCallbackNative() {
  const [status, setStatus] = useState('loading')
  const [appUrl, setAppUrl] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    // URL에서 토큰 정보 가져오기
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)

    const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
    const errorParam = hashParams.get('error') || queryParams.get('error')
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')

    if (errorParam) {
      setStatus('error')
      setError(errorDescription || errorParam)
      return
    }

    if (accessToken) {
      // 앱으로 리다이렉트할 URL 생성 (Android/iOS 모두 kr.golfpeople.app 스킴 사용)
      const url = `kr.golfpeople.app://auth/callback?access_token=${encodeURIComponent(accessToken)}${refreshToken ? `&refresh_token=${encodeURIComponent(refreshToken)}` : ''}`
      setAppUrl(url)
      setStatus('ready')
    } else {
      // 토큰이 없으면 에러
      setStatus('error')
      setError('로그인 정보를 찾을 수 없습니다.')
    }
  }, [])

  const handleOpenApp = () => {
    if (appUrl) {
      // iOS에서는 a 태그 클릭으로 URL scheme 열기
      const link = document.createElement('a')
      link.href = appUrl
      link.click()
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-white">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
          <p className="text-lg">로그인 확인 중...</p>
        </>
      )}

      {status === 'ready' && (
        <>
          <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mb-6">
            <ExternalLink className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-xl font-bold mb-2">로그인 완료!</h2>
          <p className="text-gray-400 mb-8 text-center">
            아래 버튼을 눌러<br />앱으로 돌아가세요
          </p>
          <button
            onClick={handleOpenApp}
            className="bg-[#D4AF37] text-black font-bold py-4 px-8 rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            골프피플 앱 열기
          </button>
          <p className="text-xs text-gray-500 mt-6">
            버튼이 작동하지 않으면 앱을 직접 실행해주세요
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-red-400">로그인 실패</h2>
          <p className="text-gray-400 text-center mb-4">{error}</p>
          <p className="text-sm text-gray-500">앱에서 다시 시도해주세요</p>
        </>
      )}
    </div>
  )
}
