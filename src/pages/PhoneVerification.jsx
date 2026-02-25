import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, Check, Loader2, RefreshCw, ShieldCheck, ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { setupRecaptcha, sendVerificationCode, verifyCode, isFirebaseConfigured } from '../lib/firebase'
import { db } from '../lib/supabase'

export default function PhoneVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isChangeMode = searchParams.get('mode') === 'change'
  
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState('phone') // 'phone' | 'code' | 'success'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const codeInputRefs = useRef([])
  const recaptchaContainerRef = useRef(null)
  
  // 현재 인증된 전화번호
  const currentPhone = profile?.phone || localStorage.getItem('gp_verified_phone')

  // 이미 인증된 사용자는 홈으로 리다이렉트 (번호 변경 모드 제외)
  useEffect(() => {
    if (profile?.phone_verified && !isChangeMode) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate, isChangeMode])

  // reCAPTCHA 초기화
  useEffect(() => {
    if (isFirebaseConfigured() && recaptchaContainerRef.current) {
      setupRecaptcha('recaptcha-container')
    }
  }, [])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 전화번호 포맷팅 (010-0000-0000)
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  const handlePhoneChange = (e) => {
    setPhoneNumber(formatPhone(e.target.value))
    setError('')
  }

  // 인증번호 발송
  const handleSendCode = async () => {
    const phoneDigits = phoneNumber.replace(/\D/g, '')
    
    if (phoneDigits.length !== 11) {
      setError('올바른 전화번호를 입력해주세요')
      return
    }

    if (!isFirebaseConfigured()) {
      setError('전화번호 인증 서비스가 설정되지 않았습니다')
      return
    }

    setLoading(true)
    setError('')

    const result = await sendVerificationCode(phoneDigits)
    
    if (result.success) {
      setStep('code')
      setCountdown(180) // 3분
      setVerificationCode(['', '', '', '', '', ''])
    } else {
      if (result.error.includes('too-many-requests')) {
        setError('너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.')
      } else if (result.error.includes('invalid-phone-number')) {
        setError('유효하지 않은 전화번호입니다.')
      } else {
        setError(result.error || '인증번호 발송에 실패했습니다.')
      }
    }
    
    setLoading(false)
  }

  // 인증코드 입력 처리
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1)
    setVerificationCode(newCode)
    setError('')

    // 다음 입력칸으로 자동 이동
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index, e) => {
    // 백스페이스로 이전 칸으로 이동
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  // 인증코드 확인
  const handleVerifyCode = async () => {
    const code = verificationCode.join('')
    
    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyCode(code)
      
      if (result.success) {
        // Supabase 프로필에 전화번호 저장
        if (user) {
          const phoneDigits = phoneNumber.replace(/\D/g, '')
          try {
            await db.profiles.update(user.id, {
              phone: phoneDigits,
              phone_verified: true
            })
          } catch (err) {
            console.log('Profile update failed, continuing anyway:', err)
          }
        }
        
        // 로컬스토리지에 인증 완료 플래그 및 전화번호 저장
        localStorage.setItem('gp_phone_verified', 'true')
        localStorage.setItem('gp_verified_phone', phoneNumber)
        
        setStep('success')
        setLoading(false)
        
        // 2초 후 페이지 이동
        setTimeout(() => {
          if (isChangeMode) {
            navigate('/profile', { replace: true })
          } else {
            window.location.href = '/'
          }
        }, 2000)
      } else {
        setLoading(false)
        if (result.error?.includes('invalid-verification-code')) {
          setError('인증코드가 올바르지 않습니다.')
        } else if (result.error?.includes('code-expired')) {
          setError('인증코드가 만료되었습니다. 다시 요청해주세요.')
        } else {
          setError(result.error || '인증에 실패했습니다.')
        }
      }
    } catch (err) {
      console.error('Verification error:', err)
      setLoading(false)
      setError('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 재발송
  const handleResend = () => {
    if (countdown === 0) {
      handleSendCode()
    }
  }

  // 스킵하기 (나중에 인증)
  const handleSkip = () => {
    if (location.key === 'default') {
      navigate('/profile', { replace: true })
    } else {
      navigate(-1)
    }
  }

  const formatCountdown = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gp-black flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => {
            if (location.key === 'default') {
              navigate(isChangeMode ? '/profile' : '/', { replace: true })
            } else {
              navigate(-1)
            }
          }}
          className="mb-4 flex items-center gap-1 text-gp-text-secondary hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>돌아가기</span>
        </button>
        
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gp-gold to-yellow-600 flex items-center justify-center">
            <Phone className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {isChangeMode ? '전화번호 변경' : '전화번호 인증'}
            </h1>
            <p className="text-sm text-gp-text-secondary">
              {isChangeMode ? '새로운 번호로 변경해주세요' : '안전한 서비스 이용을 위해'}
            </p>
          </div>
        </motion.div>
        
        {/* 현재 번호 표시 (변경 모드일 때) */}
        {isChangeMode && currentPhone && (
          <div className="bg-gp-card rounded-xl p-4">
            <p className="text-sm text-gp-text-secondary mb-1">현재 인증된 번호</p>
            <p className="font-semibold text-gp-gold">{currentPhone}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Phone Input */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-gp-text-secondary">
                  휴대폰 번호
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-4 bg-gp-surface text-white rounded-xl text-lg tracking-wider
                    border border-gp-border focus:border-gp-gold focus:ring-1 focus:ring-gp-gold
                    transition-all outline-none placeholder:text-gp-text-secondary/50"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}

              <button
                onClick={handleSendCode}
                disabled={loading || phoneNumber.replace(/\D/g, '').length !== 11}
                className="w-full py-4 rounded-xl font-semibold text-lg
                  bg-gradient-to-r from-gp-gold to-yellow-500 text-black
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:from-yellow-500 hover:to-gp-gold transition-all
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>인증번호 받기</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gp-text-secondary">
                입력하신 번호로 인증번호가 발송됩니다
              </p>
            </motion.div>
          )}

          {/* Step 2: Code Input */}
          {step === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <p className="text-gp-text-secondary">
                  <span className="text-gp-gold font-semibold">{phoneNumber}</span>
                  로<br />인증번호가 발송되었습니다
                </p>
              </div>

              {/* 6자리 코드 입력 */}
              <div className="flex justify-center gap-2 mb-4">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (codeInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold text-white
                      bg-gp-surface rounded-xl border border-gp-border
                      focus:border-gp-gold focus:ring-1 focus:ring-gp-gold
                      transition-all outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* 타이머 & 재발송 */}
              <div className="flex items-center justify-center gap-4">
                <span className={`text-lg font-mono ${countdown <= 30 ? 'text-red-400' : 'text-gp-gold'}`}>
                  {formatCountdown(countdown)}
                </span>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="flex items-center gap-1 text-sm text-gp-text-secondary
                    disabled:opacity-50 enabled:hover:text-gp-gold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  재발송
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.some(d => !d)}
                className="w-full py-4 rounded-xl font-semibold text-lg
                  bg-gradient-to-r from-gp-gold to-yellow-500 text-black
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:from-yellow-500 hover:to-gp-gold transition-all
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>확인</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* 번호 변경 */}
              <button
                onClick={() => {
                  setStep('phone')
                  setVerificationCode(['', '', '', '', '', ''])
                  setError('')
                }}
                className="w-full text-center text-sm text-gp-text-secondary hover:text-white transition-colors"
              >
                다른 번호로 인증하기
              </button>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600
                  flex items-center justify-center mb-6"
              >
                <ShieldCheck className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-2"
              >
                {isChangeMode ? '번호 변경 완료!' : '인증 완료!'}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gp-text-secondary text-center"
              >
                {isChangeMode ? (
                  <>
                    <span className="text-gp-gold font-semibold">{phoneNumber}</span>
                    <br />으로 변경되었습니다
                  </>
                ) : (
                  '골프피플에 오신 것을 환영합니다'
                )}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip Button (only on phone/code steps) */}
      {step !== 'success' && (
        <div className="px-6 pb-8">
          <button
            onClick={handleSkip}
            className="w-full py-3 text-gp-text-secondary hover:text-white transition-colors"
          >
            나중에 하기
          </button>
        </div>
      )}

      {/* reCAPTCHA Container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
    </motion.div>
  )
}

