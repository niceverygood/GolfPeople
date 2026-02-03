import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Search, Users, X, Loader2, MapPin, Trophy } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import * as friendService from '../lib/friendService'

export default function ChatList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { chatRooms, loading, loadChatRooms, totalUnreadCount, startDirectChat } = useChat()

  // 메인 탭: 'chat' | 'friends'
  const [mainTab, setMainTab] = useState('chat')

  // 친구 목록 상태
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)

  // 컴포넌트 마운트 시 채팅방 목록 새로고침
  useEffect(() => {
    loadChatRooms()
  }, [])

  // 친구 목록 로드
  const loadFriends = useCallback(async () => {
    if (!user?.id) return
    setFriendsLoading(true)
    const result = await friendService.getFriends(user.id)
    if (result.success) {
      setFriends(result.friends)
    }
    setFriendsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (mainTab === 'friends') {
      loadFriends()
    }
  }, [mainTab, loadFriends])

  // 친구와 채팅 시작
  const handleStartChat = async (friendId) => {
    const result = await startDirectChat(friendId)
    if (result.success) {
      navigate(`/chat/${result.roomId}`)
    }
  }

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

  const totalUnread = totalUnreadCount

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
      <div className="px-6 pt-6 pb-4 bg-gp-black/80 backdrop-blur-lg sticky top-0 z-10">
        {/* 메인 탭: 채팅 / 친구 */}
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={() => setMainTab('chat')}
            className={`text-2xl font-bold transition-colors ${
              mainTab === 'chat' ? 'text-white' : 'text-gp-text-secondary'
            }`}
          >
            채팅
            {totalUnread > 0 && mainTab !== 'chat' && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs text-white font-normal">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab('friends')}
            className={`text-2xl font-bold transition-colors ${
              mainTab === 'friends' ? 'text-white' : 'text-gp-text-secondary'
            }`}
          >
            친구
            {friends.length > 0 && mainTab !== 'friends' && (
              <span className="ml-2 px-2 py-0.5 bg-gp-border rounded-full text-xs text-gp-text-secondary font-normal">
                {friends.length}
              </span>
            )}
          </button>
        </div>

        {/* 채팅 탭일 때만 표시 */}
        {mainTab === 'chat' && (
          <>
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
          </>
        )}

        {/* 친구 탭일 때 검색 */}
        {mainTab === 'friends' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="친구 검색..."
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
        )}
      </div>

      {/* 채팅 목록 */}
      {mainTab === 'chat' && (
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
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gp-card transition-all"
                  >
                    {/* 프로필 이미지 */}
                    <div className="relative">
                      <img
                        src={chat.partnerPhoto}
                        alt={chat.partnerName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      {chat.type === 'join' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gp-green rounded-full flex items-center justify-center border-2 border-gp-black">
                          <Users className="w-3 h-3 text-white" />
                        </div>
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
                          {chat.partnerName}
                        </h3>
                        <span className="text-xs text-gp-text-secondary ml-2 shrink-0">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>

                      {chat.type === 'join' && chat.joinTitle && (
                        <p className="text-xs text-gp-gold truncate mb-0.5">
                          {chat.joinTitle}
                        </p>
                      )}

                      <p className={`text-sm truncate ${
                        chat.unreadCount > 0 ? 'text-gp-text font-medium' : 'text-gp-text-secondary'
                      }`}>
                        {chat.lastMessage || '새로운 대화를 시작해보세요'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* 친구 목록 */}
      {mainTab === 'friends' && (
        <div className="flex-1 overflow-y-auto">
          {friendsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gp-gold animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gp-text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">아직 친구가 없어요</h3>
              <p className="text-sm text-gp-text-secondary mb-6">
                홈에서 마음에 드는 골퍼에게<br />친구 요청을 보내보세요!
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl btn-gold font-semibold"
              >
                골퍼 둘러보기
              </button>
            </div>
          ) : (
            <div className="px-4 space-y-2">
              {friends
                .filter(friend => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-gp-card rounded-xl p-4 flex items-center gap-4"
                  >
                    {/* 프로필 */}
                    <button
                      onClick={() => navigate(`/user/${friend.id}`)}
                      className="relative flex-shrink-0"
                    >
                      <img
                        src={friend.photo}
                        alt={friend.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-gp-green rounded-full border-2 border-gp-card" />
                      )}
                    </button>

                    {/* 정보 */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/user/${friend.id}`)}
                    >
                      <h3 className="font-semibold truncate">{friend.name}</h3>
                      <div className="flex items-center gap-2 text-gp-text-secondary text-xs mt-1">
                        {friend.region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {friend.region}
                          </span>
                        )}
                        {friend.handicap && (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {friend.handicap}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 채팅 버튼 */}
                    <button
                      onClick={() => handleStartChat(friend.id)}
                      className="w-10 h-10 rounded-full bg-gp-gold flex items-center justify-center flex-shrink-0"
                    >
                      <MessageCircle className="w-5 h-5 text-gp-black" />
                    </button>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

