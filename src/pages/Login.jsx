import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isIOS, appleSignIn } from '../lib/native'

// Apple 아이콘 SVG
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

// Google 아이콘 SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// 카카오 아이콘 SVG
const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path
      fill="#000000"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.55 6.73-.2.74-.73 2.68-.84 3.1-.13.52.19.51.4.37.17-.11 2.65-1.8 3.73-2.53.7.1 1.42.15 2.16.15 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"
    />
  </svg>
)

export default function Login() {
  const { signInWithGoogle, signInWithKakao, signInWithApple, loading, error } = useAuth()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState('')
  const showAppleLogin = isIOS() // iOS에서만 Apple 로그인 표시

  const handleGoogleLogin = async () => {
    setLoginError('')
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const handleKakaoLogin = async () => {
    setLoginError('')
    try {
      const { error } = await signInWithKakao()
      if (error) throw error
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const handleAppleLogin = async () => {
    setLoginError('')
    try {
      const { error } = await signInWithApple()
      if (error) throw error
    } catch (err) {
      setLoginError(err.message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gp-black flex flex-col items-center justify-center px-6"
    >
      {/* 로고 & 타이틀 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gp-gold via-gp-gold/80 to-gp-green shadow-2xl shadow-gp-gold/20 flex items-center justify-center">
          <span className="text-5xl">⛳</span>
        </div>
        <h1 className="text-3xl font-bold mb-3">골프피플</h1>
        <p className="text-gp-text-secondary text-lg">
          함께 라운딩할 파트너를 찾아보세요
        </p>
      </motion.div>

      {/* 소셜 로그인 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Apple 로그인 (iOS만) */}
        {showAppleLogin && (
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white text-black rounded-2xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <AppleIcon />
                <span className="text-lg">Apple로 시작하기</span>
              </>
            )}
          </button>
        )}

        {/* Google 로그인 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="text-lg">Google로 시작하기</span>
            </>
          )}
        </button>

        {/* Kakao 로그인 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-[#FEE500] text-gray-900 rounded-2xl font-semibold hover:bg-[#FDD800] transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <KakaoIcon />
              <span className="text-lg">카카오로 시작하기</span>
            </>
          )}
        </button>

        {/* 에러 메시지 */}
        {(loginError || error) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mt-4"
          >
            {loginError || error}
          </motion.p>
        )}
      </motion.div>

      {/* 하단 안내 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 text-center"
      >
        <p className="text-gp-text-secondary text-sm">
          로그인하면 <button onClick={() => navigate('/terms')} className="text-gp-gold underline">이용약관</button> 및{' '}
          <button onClick={() => navigate('/privacy')} className="text-gp-gold underline">개인정보처리방침</button>에 동의하게 됩니다
        </p>
      </motion.div>

      {/* 하단 장식 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-8 flex items-center gap-2 text-gp-text-secondary/50"
      >
        <span className="text-2xl">🏌️</span>
        <span className="text-sm">Golf People</span>
        <span className="text-2xl">⛳</span>
      </motion.div>
    </motion.div>
  )
}
