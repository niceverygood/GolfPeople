import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, MapPin, Trophy, Clock, Shield, UserPlus, Heart, MoreVertical, Flag, Ban } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ProfileDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { users, sendFriendRequest, friendRequests, likedUsers, likeUser, unlikeUser } = useApp()
  
  const user = users.find(u => u.id === parseInt(userId))
  const [friendRequested, setFriendRequested] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const isLiked = user ? likedUsers.includes(user.id) : false
  
  useEffect(() => {
    if (user) {
      setFriendRequested(friendRequests.some(req => req.userId === user.id))
    }
  }, [user, friendRequests])
  
  const handleToggleLike = () => {
    if (!user) return
    if (isLiked) {
      unlikeUser(user.id)
    } else {
      likeUser(user.id)
    }
  }
  
  const handleFriendRequest = () => {
    if (!friendRequested) {
      setShowRequestModal(true)
    }
  }
  
  const handleSendRequest = (message) => {
    if (user) {
      const success = sendFriendRequest(user, message)
      if (success) {
        setFriendRequested(true)
      }
    }
    setShowRequestModal(false)
  }
  
  const handleReport = () => {
    setShowMoreMenu(false)
    alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
  }
  
  const handleBlock = () => {
    setShowMoreMenu(false)
    if (confirm(`${user?.name}님을 차단하시겠습니까?`)) {
      alert('차단되었습니다. 더 이상 이 사용자를 볼 수 없습니다.')
      navigate(-1)
    }
  }
  
  const handleBack = () => {
    navigate(-1)
  }
  
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gp-text-secondary">사용자를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 flex flex-col h-full overflow-auto bg-gp-black"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: 'tween', duration: 0.25 }}
    >
      {/* 헤더 (뒤로가기 + 저장 + 더보기) */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-top flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* 저장(관심) 버튼 */}
          <button
            onClick={handleToggleLike}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
              isLiked ? 'bg-gp-gold' : 'bg-black/50'
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'text-gp-black fill-current' : 'text-white'}`}
            />
          </button>
          
          {/* 더보기 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            
            {/* 더보기 메뉴 */}
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  {/* 백드롭 */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMoreMenu(false)}
                  />
                  
                  {/* 메뉴 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute top-12 right-0 z-20 bg-gp-card rounded-xl overflow-hidden shadow-xl min-w-[140px]"
                  >
                    <button
                      onClick={handleReport}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gp-border transition-colors"
                    >
                      <Flag className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">신고하기</span>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gp-border transition-colors border-t border-gp-border"
                    >
                      <Ban className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">차단하기</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* 큰 사진 */}
      <div className="relative h-96 flex-shrink-0">
        <img
          src={user.photos[0]}
          alt={user.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gp-black via-transparent to-transparent" />
      </div>
      
      {/* 상세 정보 */}
      <div className="px-6 pb-8 -mt-20 relative flex-1">
        {/* 기본 정보 */}
        <div className="flex items-end gap-3 mb-4">
          <h2 className="text-3xl font-bold">{user.name}, {user.age}</h2>
          {user.verified && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gp-green/20 text-gp-green text-xs mb-1">
              <Shield className="w-3 h-3" />
              인증됨
            </div>
          )}
        </div>
        
        {/* 정보 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary text-sm mb-1">
              <MapPin className="w-4 h-4" />
              지역
            </div>
            <p className="font-medium">{user.region}</p>
          </div>
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary text-sm mb-1">
              <Trophy className="w-4 h-4" />
              실력
            </div>
            <p className="font-medium">{user.handicap}</p>
          </div>
          <div className="bg-gp-card rounded-xl p-4 col-span-2">
            <div className="flex items-center gap-2 text-gp-text-secondary text-sm mb-1">
              <Clock className="w-4 h-4" />
              선호 시간
            </div>
            <p className="font-medium">{user.availableTime}</p>
          </div>
        </div>
        
        {/* 스타일 태그 */}
        <div className="mb-6">
          <h3 className="text-sm text-gp-text-secondary mb-3">라운딩 스타일</h3>
          <div className="flex flex-wrap gap-2">
            {user.style.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* 소개 */}
        <div className="mb-6">
          <h3 className="text-sm text-gp-text-secondary mb-3">소개</h3>
          <p className="text-gp-text leading-relaxed bg-gp-card rounded-xl p-4">
            {user.intro}
          </p>
        </div>
        
        {/* 라운딩 횟수 */}
        {user.roundCount > 0 && (
          <div className="bg-gp-gold/10 rounded-xl p-4 mb-6">
            <p className="text-gp-gold font-medium flex items-center gap-2">
              🏌️ 골프피플에서 {user.roundCount}회 라운딩 완료
            </p>
          </div>
        )}
        
        {/* 친구 요청 버튼 */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-gp-black via-gp-black to-transparent">
          <button
            onClick={handleFriendRequest}
            disabled={friendRequested}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              friendRequested
                ? 'bg-gp-green/20 text-gp-green'
                : 'btn-gold'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            {friendRequested ? '친구 요청 완료!' : '친구 요청하기'}
          </button>
        </div>
      </div>
      
      {/* 친구 요청 모달 */}
      <AnimatePresence>
        {showRequestModal && user && (
          <FriendRequestModal
            user={user}
            onClose={() => setShowRequestModal(false)}
            onSend={handleSendRequest}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 친구 요청 모달
function FriendRequestModal({ user, onClose, onSend }) {
  const [message, setMessage] = useState('')
  
  const handleSubmit = () => {
    onSend(message)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-gp-black rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />

        {/* 상대방 정보 */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user.photos[0]}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold">{user.name}님에게</h2>
            <p className="text-gp-text-secondary">친구 요청 보내기</p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="안녕하세요! 함께 라운딩하고 싶어요 😊"
          className="w-full h-32 bg-gp-card rounded-xl p-4 text-gp-text placeholder:text-gp-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-gp-gold mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl bg-gp-card text-gp-text font-semibold"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-4 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            요청 보내기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

