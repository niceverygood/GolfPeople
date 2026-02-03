/**
 * 친구 목록 페이지
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, MessageCircle, UserX, ChevronLeft, MapPin, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import * as friendService from '../lib/friendService'

export default function Friends() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { startDirectChat } = useChat()

  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRemoveModal, setShowRemoveModal] = useState(null)

  // 친구 목록 로드
  const loadFriends = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    const result = await friendService.getFriends(user.id)
    if (result.success) {
      setFriends(result.friends)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  // 채팅 시작
  const handleStartChat = async (friendId) => {
    const result = await startDirectChat(friendId)
    if (result.success) {
      navigate(`/chat/${result.roomId}`)
    }
  }

  // 친구 삭제
  const handleRemoveFriend = async (friendId) => {
    if (!user?.id) return

    const result = await friendService.removeFriend(user.id, friendId)
    if (result.success) {
      setFriends(prev => prev.filter(f => f.id !== friendId))
      setShowRemoveModal(null)
    }
  }

  // 검색 필터링
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">내 친구</h1>
            <p className="text-gp-text-secondary text-sm">{friends.length}명의 골프 친구</p>
          </div>
        </div>

        {/* 검색 */}
        {friends.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="친구 검색..."
              className="w-full pl-12 pr-4 py-3 bg-gp-card rounded-xl text-gp-text placeholder:text-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold"
            />
          </div>
        )}
      </div>

      {/* 친구 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gp-text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">아직 친구가 없어요</h3>
            <p className="text-gp-text-secondary text-sm mb-6">
              홈에서 마음에 드는 골퍼에게<br />친구 요청을 보내보세요!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl btn-gold font-semibold"
            >
              골퍼 둘러보기
            </button>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gp-text-secondary">검색 결과가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onProfileClick={() => navigate(`/user/${friend.id}`)}
                onChatClick={() => handleStartChat(friend.id)}
                onRemoveClick={() => setShowRemoveModal(friend)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 친구 삭제 확인 모달 */}
      <AnimatePresence>
        {showRemoveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowRemoveModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-gp-card rounded-2xl p-6 z-50"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">친구 삭제</h3>
                <p className="text-gp-text-secondary text-sm mb-6">
                  {showRemoveModal.name}님을 친구 목록에서<br />삭제하시겠습니까?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRemoveModal(null)}
                    className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(showRemoveModal.id)}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// 친구 카드 컴포넌트
function FriendCard({ friend, onProfileClick, onChatClick, onRemoveClick }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-center gap-4">
        {/* 프로필 사진 */}
        <button onClick={onProfileClick} className="flex-shrink-0">
          <div className="relative">
            <img
              src={friend.photo}
              alt={friend.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            {friend.isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-gp-green rounded-full border-2 border-gp-card" />
            )}
          </div>
        </button>

        {/* 정보 */}
        <div className="flex-1 min-w-0" onClick={onProfileClick}>
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
          onClick={onChatClick}
          className="w-10 h-10 rounded-full bg-gp-gold flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5 text-gp-black" />
        </button>
      </div>
    </motion.div>
  )
}
