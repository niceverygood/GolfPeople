import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Google 아이콘 SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
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
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#000000"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.55 6.73-.2.74-.73 2.68-.84 3.1-.13.52.19.51.4.37.17-.11 2.65-1.8 3.73-2.53.7.1 1.42.15 2.16.15 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"
    />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, signInWithKakao, loading, error } = useAuth()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setFormError('')

    // 유효성 검사
    if (!formData.email || !formData.password) {
      setFormError('이메일과 비밀번호를 입력해주세요')
      return
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다')
      return
    }

    if (formData.password.length < 6) {
      setFormError('비밀번호는 6자 이상이어야 합니다')
      return
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password)
        if (error) throw error
        alert('회원가입 완료! 이메일을 확인해주세요.')
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        navigate('/profile')
      }
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // OAuth는 리다이렉트되므로 navigate 불필요
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleKakaoLogin = async () => {
    try {
      const { error } = await signInWithKakao()
      if (error) throw error
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gp-black flex flex-col"
    >
      <div className="flex-1 flex flex-col px-6 pt-12">
        {/* 로고 & 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gp-gold to-gp-green flex items-center justify-center">
            <span className="text-4xl">⛳</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">골프피플</h1>
          <p className="text-gp-text-secondary">
            {isSignUp ? '회원가입하고 골프 파트너를 찾아보세요' : '로그인하고 골프 파트너를 만나보세요'}
          </p>
        </motion.div>

        {/* 소셜 로그인 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-8"
        >
          {/* Google 로그인 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>Google로 계속하기</span>
              </>
            )}
          </button>

          {/* Kakao 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FEE500] text-gray-900 rounded-2xl font-semibold hover:bg-[#FDD800] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <KakaoIcon />
                <span>카카오로 계속하기</span>
              </>
            )}
          </button>
        </motion.div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gp-border" />
          <span className="text-gp-text-secondary text-sm">또는</span>
          <div className="flex-1 h-px bg-gp-border" />
        </div>

        {/* 이메일 로그인 폼 */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleEmailAuth}
          className="space-y-4"
        >
          {/* 이메일 */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 bg-gp-card rounded-2xl text-white placeholder:text-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold"
            />
          </div>

          {/* 비밀번호 */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-12 py-4 bg-gp-card rounded-2xl text-white placeholder:text-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gp-text-secondary" />
              ) : (
                <Eye className="w-5 h-5 text-gp-text-secondary" />
              )}
            </button>
          </div>

          {/* 비밀번호 확인 (회원가입 시) */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gp-card rounded-2xl text-white placeholder:text-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold"
              />
            </motion.div>
          )}

          {/* 에러 메시지 */}
          {(formError || error) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {formError || error}
            </motion.p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 btn-gold rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isSignUp ? '회원가입' : '로그인'
            )}
          </button>
        </motion.form>

        {/* 회원가입/로그인 전환 */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setFormError('')
            }}
            className="text-gp-text-secondary"
          >
            {isSignUp ? (
              <>
                이미 계정이 있으신가요?{' '}
                <span className="text-gp-gold font-semibold">로그인</span>
              </>
            ) : (
              <>
                계정이 없으신가요?{' '}
                <span className="text-gp-gold font-semibold">회원가입</span>
              </>
            )}
          </button>
        </div>

        {/* 비밀번호 찾기 (로그인 시) */}
        {!isSignUp && (
          <div className="text-center mt-4">
            <button className="text-gp-text-secondary text-sm">
              비밀번호를 잊으셨나요?
            </button>
          </div>
        )}
      </div>

      {/* 하단 여백 */}
      <div className="h-8" />
    </motion.div>
  )
}

