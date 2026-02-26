import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Search, Users, X, Loader2, Trash2 } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { showToast } from '../utils/errorHandler'

export default function ChatList() {
  const navigate = useNavigate()
  const { chatRooms, loading, loadChatRooms, leaveChatRoom } = useChat()

  const handleLeaveChat = async (e, roomId, roomName) => {
    e.stopPropagation()
    if (confirm(`"${roomName}" 채팅방을 나가시겠습니까?`)) {
      const result = await leaveChatRoom(roomId)
      if (result.success) {
        showToast.success('채팅방을 나갔습니다')
      } else {
        showToast.error('채팅방 나가기에 실패했습니다')
      }
    }
  }

  // 컴포넌트 마운트 시 채팅방 목록 새로고침
  useEffect(() => {
    loadChatRooms()
  }, [loadChatRooms])

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'friend' | 'join'

  // 필터링된 채팅방
  const filteredChats = chatRooms
    .filter(chat => {
      if (filter === 'friend') return chat.type === 'friend'
      if (filter === 'join') return chat.type === 'join'
      return true
    })
    .filter(chat => 
      chat.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  // 로딩 중
  if (loading && chatRooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gp-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pb-20">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-4 bg-gp-black/80 backdrop-blur-lg sticky top-0 z-10 safe-top">
        <h1 className="text-2xl font-bold text-white mb-4">채팅</h1>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름 또는 메시지 검색..."
            className="w-full pl-10 pr-10 py-3 bg-gp-surface rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gp-gold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gp-text-secondary" />
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'friend', label: '친구' },
            { key: 'join', label: '조인' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-gp-gold text-gp-black'
                  : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gp-text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '아직 대화가 없습니다'}
            </h3>
            <p className="text-sm text-gp-text-secondary">
              {searchQuery
                ? '다른 검색어를 입력해보세요'
                : '친구나 조인 매칭 후 대화를 시작해보세요!'
              }
            </p>
          </div>
        ) : (
          <div className="px-4">
            <AnimatePresence>
              {filteredChats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-gp-card transition-all min-w-0"
                  >
                    {/* 프로필 이미지 */}
                    <div className="relative shrink-0">
                      {chat.type === 'join' ? (
                        <div className="w-14 h-14 rounded-full bg-gp-card flex items-center justify-center">
                          <Users className="w-7 h-7 text-gp-gold" />
                        </div>
                      ) : (
                        <img
                          src={chat.partnerPhoto}
                          alt={chat.partnerName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1">
                          <span className="text-xs font-bold text-white">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 채팅 정보 */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${chat.unreadCount > 0 ? 'text-white' : 'text-gp-text'}`}>
                          {chat.type === 'join' ? (chat.joinTitle || chat.partnerName) : chat.partnerName}
                        </h3>
                        <span className="text-xs text-gp-text-secondary ml-2 shrink-0">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>

                      {chat.type === 'join' && chat.partnerName && (
                        <p className="text-xs text-gp-text-secondary truncate mb-0.5">
                          {chat.partnerName}
                        </p>
                      )}

                      <p className={`text-sm truncate ${
                        chat.unreadCount > 0 ? 'text-gp-text font-medium' : 'text-gp-text-secondary'
                      }`}>
                        {chat.lastMessage || '새로운 대화를 시작해보세요'}
                      </p>
                    </div>
                  </button>

                  {/* 나가기 버튼 */}
                  <button
                    onClick={(e) => handleLeaveChat(e, chat.id, chat.type === 'join' ? chat.joinTitle : chat.partnerName)}
                    className="p-2 rounded-full hover:bg-red-500/20 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-gp-text-secondary hover:text-red-400" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

