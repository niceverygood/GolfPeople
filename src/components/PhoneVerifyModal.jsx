import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ShieldCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PhoneVerifyModal({ isOpen, onClose, message }) {
  const navigate = useNavigate()

  const handleVerify = () => {
    onClose()
    navigate('/phone-verify')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[90%] max-w-sm bg-gp-dark rounded-3xl overflow-hidden"
        >
          {/* 상단 아이콘 */}
          <div className="pt-8 pb-4 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gp-gold/20 to-yellow-600/20 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-gp-gold" />
            </div>
          </div>

          {/* 내용 */}
          <div className="px-6 pb-6 text-center">
            <h3 className="text-xl font-bold mb-2">전화번호 인증이 필요해요</h3>
            <p className="text-gp-text-secondary mb-6">
              {message || '안전한 서비스 이용을 위해 전화번호 인증을 완료해주세요.'}
            </p>

            {/* 혜택 리스트 */}
            <div className="bg-gp-card rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gp-gold mb-3">인증하면 이런 점이 좋아요</p>
              <ul className="space-y-2 text-sm text-gp-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-gp-green">✓</span> 다른 회원들에게 신뢰도 UP
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gp-green">✓</span> 친구 요청 가능
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gp-green">✓</span> 조인 신청 가능
                </li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gp-card text-gp-text-secondary font-medium"
              >
                나중에
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-3 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                인증하기
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

