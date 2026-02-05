import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { subscribe } from '../lib/toastStore'

const TOAST_CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-gp-green/90', duration: 3000 },
  error: { icon: XCircle, bg: 'bg-gp-red/90', duration: 4000 },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-500/90', duration: 4000 },
  info: { icon: Info, bg: 'bg-blue-500/90', duration: 3000 },
}

const MAX_TOASTS = 3

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe((toast) => {
      setToasts(prev => {
        const updated = [...prev, toast]
        return updated.slice(-MAX_TOASTS)
      })

      const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info
      setTimeout(() => removeToast(toast.id), config.duration)
    })

    return unsubscribe
  }, [removeToast])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center pt-[env(safe-area-inset-top,12px)] px-4 gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info
          const Icon = config.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto w-full max-w-sm ${config.bg} backdrop-blur-sm rounded-xl shadow-lg`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-5 h-5 text-white flex-shrink-0" />
                <p className="text-sm text-white font-medium flex-1 leading-tight">
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-white/70 hover:text-white flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
