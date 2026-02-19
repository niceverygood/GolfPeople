import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="max-w-app mx-auto">
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gp-red/90 text-white text-sm">
          <WifiOff className="w-4 h-4" />
          <span>네트워크 연결이 끊겼습니다</span>
        </div>
      </div>
    </div>
  )
}
