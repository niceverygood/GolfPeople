import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, Bookmark, User, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const tabs = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/join', icon: Users, label: '조인' },
  { path: '/chat', icon: MessageCircle, label: '채팅' },
  { path: '/saved', icon: Bookmark, label: '저장함' },
  { path: '/profile', icon: User, label: '프로필' },
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalUnreadMessages } = useApp()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-[430px] mx-auto">
        <div className="glass border-t border-gp-border safe-bottom">
          <div className="flex items-center justify-around py-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path
              const Icon = tab.icon
              const showBadge = tab.path === '/chat' && totalUnreadMessages > 0

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-1 px-3 py-2 relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tabIndicator"
                      className="absolute -top-0.5 w-6 h-1 rounded-full bg-gp-gold"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive ? 'text-gp-gold' : 'text-gp-text-secondary'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                        {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs transition-colors ${
                      isActive ? 'text-gp-gold font-medium' : 'text-gp-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}




