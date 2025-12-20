import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, MessageSquare, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

const DATE_OPTIONS = [
  { id: 'this-weekend', label: '이번 주말' },
  { id: 'next-weekend', label: '다음 주말' },
  { id: 'weekday', label: '평일' },
  { id: 'flexible', label: '조율 가능' },
]

const REGION_OPTIONS = [
  '서울/경기 북부',
  '경기 남부',
  '인천/서해안',
  '조율 가능',
]

export default function ProposalModal({ isOpen, user, onClose }) {
  const { sendProposal } = useApp()
  const [step, setStep] = useState(0) // 0: 날짜, 1: 지역, 2: 메시지, 3: 완료
  const [datePreference, setDatePreference] = useState('')
  const [region, setRegion] = useState('')
  const [message, setMessage] = useState('')

  const handleClose = () => {
    setStep(0)
    setDatePreference('')
    setRegion('')
    setMessage('')
    onClose()
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      // 제안 보내기
      sendProposal({
        userId: user.id,
        userName: user.name,
        datePreference,
        region,
        message,
      })
      setStep(3)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!datePreference
      case 1: return !!region
      case 2: return true // 메시지는 선택
      default: return false
    }
  }

  if (!isOpen || !user) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[430px] bg-gp-dark rounded-t-3xl overflow-hidden"
        >
          {/* 핸들 */}
          <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mt-3 mb-2" />

          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gp-border">
            <div className="flex items-center gap-3">
              <img
                src={user.photos[0]}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">{user.name}님에게</h3>
                <p className="text-gp-text-secondary text-sm">라운딩 제안하기</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gp-card flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gp-text-secondary" />
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className="px-6 py-6 safe-bottom">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <StepContent key="date" title="언제가 좋으세요?" icon={Calendar}>
                  <div className="grid grid-cols-2 gap-3">
                    {DATE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDatePreference(option.label)}
                        className={`py-4 rounded-xl font-medium transition-all ${
                          datePreference === option.label
                            ? 'bg-gp-gold text-gp-black'
                            : 'bg-gp-card text-gp-text hover:bg-gp-border'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </StepContent>
              )}

              {step === 1 && (
                <StepContent key="region" title="어디가 좋으세요?" icon={MapPin}>
                  <div className="grid grid-cols-2 gap-3">
                    {REGION_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRegion(r)}
                        className={`py-4 rounded-xl font-medium transition-all ${
                          region === r
                            ? 'bg-gp-gold text-gp-black'
                            : 'bg-gp-card text-gp-text hover:bg-gp-border'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </StepContent>
              )}

              {step === 2 && (
                <StepContent key="message" title="한 마디 남기기 (선택)" icon={MessageSquare}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="안녕하세요! 프로필 보고 연락드려요 😊"
                    className="w-full h-28 bg-gp-card rounded-xl p-4 text-gp-text placeholder:text-gp-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-gp-gold"
                  />
                </StepContent>
              )}

              {step === 3 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-gp-green flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">제안을 보냈어요!</h3>
                  <p className="text-gp-text-secondary text-center">
                    {user.name}님이 수락하면 알려드릴게요
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 버튼 */}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`w-full py-4 rounded-2xl font-semibold text-lg mt-6 transition-all ${
                  canProceed()
                    ? 'btn-gold'
                    : 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
                }`}
              >
                {step === 2 ? '제안 보내기' : '다음'}
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl btn-gold font-semibold text-lg mt-6"
              >
                확인
              </button>
            )}

            {/* 프로그레스 */}
            {step < 3 && (
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === step ? 'bg-gp-gold w-6' : i < step ? 'bg-gp-gold' : 'bg-gp-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function StepContent({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gp-gold" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}


