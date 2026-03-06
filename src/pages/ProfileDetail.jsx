import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, MapPin, Trophy, Clock, Shield, UserPlus, Heart, MoreVertical, Flag, Ban, TrendingUp, TrendingDown, Minus, Target, MessageCircle, Star, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useMarker } from '../context/MarkerContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import * as friendService from '../lib/friendService'
import { getUserRating, REVIEW_TAGS } from '../lib/reviewService'
import PhoneVerifyModal from '../components/PhoneVerifyModal'
import MarkerConfirmModal from '../components/MarkerConfirmModal'
import VerificationBadges from '../components/VerificationBadges'
import MarkerIcon from '../components/icons/MarkerIcon'
import { usePhoneVerification } from '../hooks/usePhoneVerification'
import { showToast, getErrorMessage } from '../utils/errorHandler'
import Portal from '../components/Portal'

// 친구 요청 마커 비용
const FRIEND_REQUEST_COST = 3

export default function ProfileDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser } = useAuth()
  const { startDirectChat } = useChat()
  const { users, sendFriendRequest, friendRequests, likedUsers, likeUser, unlikeUser } = useApp()
  const { balance, useMarkers } = useMarker()

  // 전화번호 인증 훅
  const phoneVerify = usePhoneVerification()

  // 마커 확인 모달
  const [showMarkerModal, setShowMarkerModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const user = users.find(u => u.id === userId)
  const [friendRequested, setFriendRequested] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const isLiked = user ? likedUsers.includes(user.id) : false

  // 친구 여부 상태 (Supabase)
  const [friendshipStatus, setFriendshipStatus] = useState({
    isFriend: false,
    isPending: false,
    sentByMe: false,
    loading: true
  })

  // 유저 평점 상태
  const [userRating, setUserRating] = useState({
    avgRating: 0,
    reviewCount: 0,
    commonTags: []
  })

  // 친구 여부 확인
  const checkFriendship = useCallback(async () => {
    if (!currentUser?.id || !userId) return

    const result = await friendService.checkFriendship(currentUser.id, userId)
    setFriendshipStatus({
      ...result,
      loading: false
    })
  }, [currentUser?.id, userId])

  useEffect(() => {
    checkFriendship()
  }, [checkFriendship])

  // 유저 평점 로드
  useEffect(() => {
    const loadRating = async () => {
      if (userId) {
        const rating = await getUserRating(userId)
        setUserRating(rating)
      }
    }
    loadRating()
  }, [userId])

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
    // 전화번호 미인증 시 인증 모달 표시
    if (!phoneVerify.checkVerification()) return

    if (!friendRequested) {
      // 마커 확인 모달 표시
      setShowMarkerModal(true)
    }
  }

  // 마커 확인 후 친구 요청 모달 표시
  // 마커 차감은 실제 요청 전송 시점으로 지연 (요청 취소/실패 시 마커 손실 방지)
  const handleConfirmMarker = async () => {
    if (isProcessing) return

    // 마커 잔액 사전 확인 (UX용)
    if (balance < FRIEND_REQUEST_COST) {
      showToast.error(getErrorMessage('insufficient_balance'))
      setShowMarkerModal(false)
      navigate('/store')
      return
    }

    setShowMarkerModal(false)
    // 친구 요청 모달 표시 (마커 차감은 handleSendRequest에서)
    setShowRequestModal(true)
  }

  const handleSendRequest = async (message) => {
    if (!user || isProcessing) {
      setShowRequestModal(false)
      return
    }
    setIsProcessing(true)

    // 1. 마커 차감 (서버 검증 포함)
    const markerResult = await useMarkers('friend_request')
    if (!markerResult.success) {
      showToast.error(markerResult.message || getErrorMessage('marker_spend_failed'))
      if (markerResult.error === 'insufficient_balance') {
        setShowRequestModal(false)
        navigate('/store')
      }
      setIsProcessing(false)
      return
    }

    // 2. 친구 요청 전송 (마커 차감 성공 후)
    const success = await sendFriendRequest(user, message)
    if (success) {
      setFriendRequested(true)
      showToast.success('친구 요청을 보냈습니다!')
    } else {
      showToast.error('친구 요청에 실패했습니다')
    }
    setShowRequestModal(false)
    setIsProcessing(false)
  }

  const [showReportModal, setShowReportModal] = useState(false)

  const handleReport = () => {
    setShowMoreMenu(false)
    setShowReportModal(true)
  }

  const handleSubmitReport = async (reason) => {
    setShowReportModal(false)
    if (!user || !currentUser) return

    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (!isConnected() || !supabase) {
        showToast.error('오프라인 상태에서는 신고할 수 없습니다.')
        return
      }
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        reported_user_id: user.id,
        reason: reason,
        status: 'pending'
      })
      if (error) throw error
      showToast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
    } catch (e) {
      console.error('신고 저장 에러:', e)
      showToast.error('신고 접수에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleBlock = async () => {
    setShowMoreMenu(false)
    if (!user || !currentUser) return

    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (!isConnected() || !supabase) {
        showToast.error('오프라인 상태에서는 차단할 수 없습니다.')
        return
      }
      const { error } = await supabase.from('blocks').insert({
        user_id: currentUser.id,
        blocked_user_id: user.id
      })
      if (error) throw error

      // 로컬 차단 목록에도 추가
      const saved = localStorage.getItem('gp_blocked_users')
      const blockedList = saved ? JSON.parse(saved) : []
      blockedList.push({ id: user.id, name: user.name, photo: user.photos?.[0], region: user.region })
      localStorage.setItem('gp_blocked_users', JSON.stringify(blockedList))

      showToast.success('차단되었습니다.')
      if (location.key === 'default') {
        navigate('/', { replace: true })
      } else {
        navigate(-1)
      }
    } catch (e) {
      console.error('차단 에러:', e)
      showToast.error('차단에 실패했습니다.')
    }
  }

  // 채팅 시작 핸들러
  const handleStartChat = async () => {
    if (!currentUser?.id || !userId) return

    const result = await startDirectChat(userId)
    if (result.success) {
      navigate(`/chat/${result.roomId}`)
    } else {
      showToast.error('채팅방을 열 수 없습니다.')
    }
  }

  const handleBack = () => {
    if (location.key === 'default') {
      navigate('/', { replace: true })
    } else {
      navigate(-1)
    }
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
      
      {/* safe-area 상단 여백 (노치/상태바 뒤에 사진이 숨지 않도록) */}
      <div className="w-full bg-gp-black safe-top flex-shrink-0" />

      {/* 프로필 사진 (스와이프) */}
      <ProfilePhotoCarousel photos={user.photos} name={user.name} />
      
      {/* 상세 정보 */}
      <div className="px-6 pb-8 -mt-20 relative flex-1">
        {/* 기본 정보 */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
          <VerificationBadges user={user} scoreStats={user.scoreStats} rating={userRating} />
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
            {(user.style || []).map((tag) => (
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

        {/* 동반자 평가 */}
        {userRating.reviewCount > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              동반자 평가
            </h3>
            <div className="bg-gp-card rounded-xl p-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-gp-gold fill-gp-gold" />
                  <span className="text-2xl font-bold">{userRating.avgRating}</span>
                </div>
                <span className="text-gp-text-secondary text-sm">
                  ({userRating.reviewCount}개의 리뷰)
                </span>
              </div>
              {userRating.commonTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {userRating.commonTags.map((tagId) => {
                    const tagInfo = REVIEW_TAGS.find(t => t.id === tagId)
                    return tagInfo ? (
                      <span
                        key={tagId}
                        className="px-2.5 py-1 bg-gp-gold/10 text-gp-gold rounded-lg text-xs"
                      >
                        {tagInfo.emoji} {tagInfo.label}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 스코어 기록 */}
        {user.scoreStats && (
          <div className="mb-6">
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              스코어 기록
            </h3>
            <div className="bg-gradient-to-r from-gp-card to-gp-card/50 rounded-xl p-4 border border-gp-border">
              {/* 메인 통계 */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gp-gold">{user.scoreStats.averageScore}</p>
                  <p className="text-xs text-gp-text-secondary">평균 스코어</p>
                </div>
                <div className="text-center border-x border-gp-border">
                  <p className="text-2xl font-bold text-gp-green">{user.scoreStats.bestScore}</p>
                  <p className="text-xs text-gp-text-secondary">베스트</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{user.scoreStats.handicap?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gp-text-secondary">핸디캡</p>
                </div>
              </div>
              
              {/* 하단 정보 */}
              <div className="flex items-center justify-between pt-3 border-t border-gp-border">
                <div className="flex items-center gap-2 text-sm text-gp-text-secondary">
                  <span>🏌️ {user.scoreStats.totalRounds}회 라운딩</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  user.scoreStats.recentTrend === 'improving' 
                    ? 'bg-gp-green/20 text-gp-green' 
                    : user.scoreStats.recentTrend === 'declining'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gp-border text-gp-text-secondary'
                }`}>
                  {user.scoreStats.recentTrend === 'improving' && <TrendingUp className="w-3 h-3" />}
                  {user.scoreStats.recentTrend === 'declining' && <TrendingDown className="w-3 h-3" />}
                  {user.scoreStats.recentTrend === 'stable' && <Minus className="w-3 h-3" />}
                  {user.scoreStats.recentTrend === 'improving' ? '성장 중' : 
                   user.scoreStats.recentTrend === 'declining' ? '슬럼프' : '유지 중'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 라운딩 횟수 (스코어 통계 없을 때만) */}
        {!user.scoreStats && user.roundCount > 0 && (
          <div className="bg-gp-gold/10 rounded-xl p-4 mb-6">
            <p className="text-gp-gold font-medium flex items-center gap-2">
              🏌️ 골프피플에서 {user.roundCount}회 라운딩 완료
            </p>
          </div>
        )}
        
        {/* 하단 버튼 - 친구 여부에 따라 다르게 표시 */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-gp-black via-gp-black to-transparent">
          {friendshipStatus.loading ? (
            <div className="w-full py-4 rounded-xl bg-gp-card flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friendshipStatus.isFriend ? (
            // 친구인 경우 - 채팅하기 버튼
            <button
              onClick={handleStartChat}
              className="w-full py-4 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              채팅하기
            </button>
          ) : friendshipStatus.isPending ? (
            // 친구 요청 대기 중
            <button
              disabled
              className="w-full py-4 rounded-xl bg-gp-card text-gp-text-secondary font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {friendshipStatus.sentByMe ? '친구 요청 대기 중...' : '상대방이 친구 요청을 보냈어요'}
            </button>
          ) : friendRequested ? (
            // Mock 데이터에서 이미 요청한 경우
            <button
              disabled
              className="w-full py-4 rounded-xl bg-gp-green/20 text-gp-green font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              친구 요청 완료!
            </button>
          ) : (
            // 친구가 아닌 경우 - 친구 요청하기 버튼
            <button
              onClick={handleFriendRequest}
              className="w-full py-4 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              친구 요청하기
            </button>
          )}
        </div>
      </div>
      
      {/* 친구 요청 모달 */}
      <AnimatePresence>
        {showRequestModal && user && (
          <Portal><FriendRequestModal
            user={user}
            onClose={() => setShowRequestModal(false)}
            onSend={handleSendRequest}
          /></Portal>
        )}
      </AnimatePresence>
      
      {/* 마커 확인 모달 */}
      <AnimatePresence>
        {showMarkerModal && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5"
              style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', position: 'fixed' }}
              onClick={() => setShowMarkerModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full bg-gp-card rounded-2xl p-6"
                style={{ maxWidth: 'min(384px, 90vw)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gp-gold/20 flex items-center justify-center mx-auto mb-4">
                    <MarkerIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">친구 요청</h3>
                  <p className="text-gp-text-secondary text-sm mb-4">
                    친구 요청을 보내시겠습니까?
                  </p>

                  <div className="bg-gp-black/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gp-text-secondary">필요 마커</span>
                      <span className="font-bold text-gp-gold flex items-center gap-1">
                        <MarkerIcon className="w-4 h-4" />
                        {FRIEND_REQUEST_COST}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gp-text-secondary">보유 마커</span>
                      <span className={`font-bold flex items-center gap-1 ${balance < FRIEND_REQUEST_COST ? 'text-red-400' : 'text-white'}`}>
                        <MarkerIcon className="w-4 h-4" />
                        {balance}개
                      </span>
                    </div>
                  </div>

                  {balance < FRIEND_REQUEST_COST && (
                    <p className="text-red-400 text-sm mb-4">
                      마커가 부족합니다
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowMarkerModal(false)}
                      className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
                    >
                      취소
                    </button>
                    {balance < FRIEND_REQUEST_COST ? (
                      <button
                        onClick={() => {
                          setShowMarkerModal(false)
                          navigate('/store')
                        }}
                        className="flex-1 py-3 rounded-xl btn-gold font-semibold"
                      >
                        충전하기
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmMarker}
                        className="flex-1 py-3 rounded-xl btn-gold font-semibold"
                      >
                        요청하기
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* 전화번호 인증 모달 */}
      <PhoneVerifyModal
        isOpen={phoneVerify.showModal}
        onClose={phoneVerify.closeModal}
        message="친구 요청을 보내려면 전화번호 인증이 필요해요."
      />

      {/* 신고 모달 */}
      <AnimatePresence>
        {showReportModal && (
          <Portal><ReportModal
            userName={user?.name}
            onSubmit={handleSubmitReport}
            onClose={() => setShowReportModal(false)}
          /></Portal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 프로필 사진 캐러셀 (스와이프 + 인디케이터 + 그라데이션 + 전체화면 뷰어)
function ProfilePhotoCarousel({ photos, name }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const photoList = photos?.length > 0 ? photos : ['/default-profile.png']

  const handleSwipe = (setIdx, length) => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) setIdx(i => Math.min(i + 1, length - 1))
      if (diff < 0) setIdx(i => Math.max(i - 1, 0))
    }
  }

  return (
    <>
      <div
        className="relative w-full flex-shrink-0 overflow-hidden"
        style={{ height: '60vh', maxHeight: '480px', minHeight: '320px' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX }}
        onTouchEnd={() => handleSwipe(setCurrentIndex, photoList.length)}
        onClick={() => setFullscreen(true)}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {photoList.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${name} ${i + 1}`}
              className="w-full h-full object-cover flex-shrink-0"
              draggable={false}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" style={{ height: '35%' }} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gp-black via-gp-black/70 to-transparent pointer-events-none" style={{ height: '40%' }} />
        {photoList.length > 1 && (
          <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-10 px-8">
            {photoList.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 전체화면 사진 뷰어 */}
      <AnimatePresence>
        {fullscreen && (
          <FullscreenPhotoViewer
            photos={photoList}
            initialIndex={currentIndex}
            onClose={() => setFullscreen(false)}
            onIndexChange={setCurrentIndex}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// 전체화면 사진 뷰어
function FullscreenPhotoViewer({ photos, initialIndex, onClose, onIndexChange }) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const go = (dir) => {
    setIndex(i => {
      const next = i + dir
      if (next < 0 || next >= photos.length) return i
      onIndexChange?.(next)
      return next
    })
  }

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black flex flex-col"
        style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', position: 'fixed' }}
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-4 pt-4 safe-top shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {photos.length > 1 && (
            <span className="text-white/70 text-sm">{index + 1} / {photos.length}</span>
          )}
          <div className="w-10" />
        </div>

        {/* 사진 */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX }}
          onTouchEnd={() => {
            const diff = touchStartX.current - touchEndX.current
            if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
          }}
        >
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {photos.map((src, i) => (
              <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                <img
                  src={src}
                  alt={`${i + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 하단 인디케이터 */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 pb-6 safe-bottom shrink-0">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </Portal>
  )
}

function FriendRequestModal({ user, onClose, onSend }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    await onSend(message)
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-gp-black rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />

        {/* 상대방 정보 */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user.photos?.[0] || '/default-profile.png'}
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
            disabled={submitting}
            className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${submitting ? 'bg-gp-border text-gp-text-secondary cursor-not-allowed' : 'btn-gold'}`}
          >
            <UserPlus className="w-5 h-5" />
            {submitting ? '보내는 중...' : '요청 보내기'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 신고 사유 선택 모달
const REPORT_REASONS = [
  '허위 프로필 (사진/정보 불일치)',
  '불쾌한 메시지 또는 행동',
  '광고/스팸',
  '욕설/비방/성희롱',
  '사기 의심',
  '기타',
]

function ReportModal({ userName, onSubmit, onClose }) {
  const [selectedReason, setSelectedReason] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-gp-black rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">{userName}님 신고하기</h2>
        <p className="text-sm text-gp-text-secondary mb-5">신고 사유를 선택해주세요.</p>

        <div className="space-y-2 mb-6">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                selectedReason === reason
                  ? 'bg-gp-green/20 text-gp-green border border-gp-green'
                  : 'bg-gp-card text-white border border-transparent'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
          >
            취소
          </button>
          <button
            onClick={() => selectedReason && onSubmit(selectedReason)}
            disabled={!selectedReason}
            className={`flex-1 py-3 rounded-xl font-medium ${
              selectedReason ? 'bg-gp-red text-white' : 'bg-gp-border/50 text-gp-text-secondary'
            }`}
          >
            신고하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
