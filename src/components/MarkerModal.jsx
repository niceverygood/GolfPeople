import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle } from 'lucide-react'

// 마커 아이콘
const MarkerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#markerGradientModal)" />
    <path d="M12 6L14.5 11H17L12 18L7 11H9.5L12 6Z" fill="#0D0D0D" />
    <defs>
      <linearGradient id="markerGradientModal" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D4AF37" />
        <stop offset="1" stopColor="#B8962E" />
      </linearGradient>
    </defs>
  </svg>
)

// 마커 부족 모달
export function InsufficientMarkerModal({ isOpen, onClose, requiredAmount, currentBalance, actionName }) {
  const navigate = useNavigate()
  
  const handleGoToStore = () => {
    onClose()
    navigate('/store')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-gp-card rounded-2xl p-6 mx-6 max-w-sm w-full"
          >
            {/* 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-xl font-bold text-center mb-2">마커가 부족해요</h3>
            
            {/* 설명 */}
            <p className="text-gp-text-secondary text-center mb-4">
              {actionName}에 마커 {requiredAmount}개가 필요해요
            </p>

            {/* 잔액 정보 */}
            <div className="bg-gp-surface rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gp-text-secondary">필요한 마커</span>
                <div className="flex items-center gap-1">
                  <MarkerIcon className="w-4 h-4" />
                  <span className="font-bold text-red-400">{requiredAmount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gp-text-secondary">내 마커</span>
                <div className="flex items-center gap-1">
                  <MarkerIcon className="w-4 h-4" />
                  <span className="font-bold">{currentBalance}</span>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gp-border font-semibold"
              >
                닫기
              </button>
              <button
                onClick={handleGoToStore}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gp-gold to-yellow-500 text-black font-semibold"
              >
                충전하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 마커 사용 확인 모달
export function ConfirmMarkerModal({ isOpen, onClose, onConfirm, requiredAmount, currentBalance, actionName, loading }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-gp-card rounded-2xl p-6 mx-6 max-w-sm w-full"
          >
            {/* 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gp-gold/20 flex items-center justify-center">
                <MarkerIcon className="w-10 h-10" />
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-xl font-bold text-center mb-2">{actionName}</h3>
            
            {/* 설명 */}
            <p className="text-gp-text-secondary text-center mb-4">
              마커 {requiredAmount}개를 사용합니다
            </p>

            {/* 잔액 정보 */}
            <div className="bg-gp-surface rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gp-text-secondary">사용할 마커</span>
                <div className="flex items-center gap-1">
                  <MarkerIcon className="w-4 h-4" />
                  <span className="font-bold text-gp-gold">-{requiredAmount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gp-text-secondary">사용 후 잔액</span>
                <div className="flex items-center gap-1">
                  <MarkerIcon className="w-4 h-4" />
                  <span className="font-bold">{currentBalance - requiredAmount}</span>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gp-border font-semibold disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gp-gold to-yellow-500 text-black font-semibold disabled:opacity-50"
              >
                {loading ? '처리 중...' : '확인'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 마커 잔액 표시 배지
export function MarkerBadge({ balance, onClick, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 bg-gp-gold/20 border border-gp-gold/30 rounded-full ${sizeClasses[size]} hover:bg-gp-gold/30 transition-colors`}
    >
      <MarkerIcon className={iconSizes[size]} />
      <span className="font-bold">{balance}</span>
    </button>
  )
}

export { MarkerIcon }

