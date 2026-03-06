import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Trophy, Bookmark, BookmarkCheck, Share2, Copy, MessageCircle, Link, Check, Star, Target, Play, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useMarker } from '../context/MarkerContext'
import PhoneVerifyModal from '../components/PhoneVerifyModal'
import MarkerConfirmModal from '../components/MarkerConfirmModal'
import MarkerIcon from '../components/icons/MarkerIcon'
import { usePhoneVerification } from '../hooks/usePhoneVerification'
import { STORAGE_KEYS, getItem, setItem } from '../utils/storage'
import { showToast, getErrorMessage } from '../utils/errorHandler'
import { shareJoinToKakao } from '../lib/kakao'
import { getJoinDetail, confirmJoin, startRounding } from '../lib/joinService'
import { formatJoinDate } from '../utils/formatTime'
import Portal from '../components/Portal'

export default function JoinDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { joins, savedJoins, saveJoin, unsaveJoin, applyToJoin, joinApplications, refreshJoins, refreshMyJoins } = useApp()
  const { user } = useAuth()
  const { balance, spendMarkers } = useMarker()
  const [actionProcessing, setActionProcessing] = useState(false)

  // 전화번호 인증 훅
  const phoneVerify = usePhoneVerification()

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMarkerConfirm, setShowMarkerConfirm] = useState(null) // userId
  const [isProcessing, setIsProcessing] = useState(false)
  const [fetchedJoin, setFetchedJoin] = useState(null)
  const [loadingJoin, setLoadingJoin] = useState(false)

  // joins 상태에 없으면 DB에서 직접 조회 (완료된 조인 등)
  const stateJoin = joins.find(j => String(j.id) === String(id))
  useEffect(() => {
    if (!stateJoin && id) {
      setLoadingJoin(true)
      getJoinDetail(id).then(result => {
        if (result.success) setFetchedJoin(result.join)
      }).finally(() => setLoadingJoin(false))
    }
  }, [stateJoin, id])

  const join = stateJoin || fetchedJoin
  const isSaved = savedJoins.includes(join?.id)
  const isApplied = joinApplications.some(app => app.joinId === join?.id)
  const isHost = join?.hostId && user?.id && String(join.hostId) === String(user.id)
  // fetchedJoin은 host.id로 오고 stateJoin은 hostId로 옴
  const joinHostId = join?.hostId || join?.host?.id
  const isHostCheck = joinHostId && user?.id && String(joinHostId) === String(user.id)
  const isParticipant = (join?.participants || []).some(p => String(p.id || p.user?.id) === String(user?.id))
  const isMember = isHostCheck || isParticipant
  const joinStatus = join?.status || 'open'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = join?.date === today
  const isExpired = join?.date && join.date < today
  const isClosed = joinStatus !== 'open' && joinStatus !== 'confirmed'

  // D-day 계산
  const getDDay = () => {
    if (!join?.date) return ''
    const diff = Math.ceil((new Date(join.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'D-Day'
    if (diff > 0) return `D-${diff}`
    return ''
  }

  // 조인 확정 처리
  const handleConfirm = async () => {
    if (actionProcessing || !user?.id || !join?.id) return
    setActionProcessing(true)
    const result = await confirmJoin(join.id, user.id)
    if (result.success) {
      showToast.success('조인이 확정되었습니다!')
      // 상태 갱신 (stateJoin이 refreshJoins 후 사라질 수 있으므로 fetchedJoin에 저장)
      setFetchedJoin(prev => ({ ...(prev || join), status: 'confirmed', confirmed_at: new Date().toISOString() }))
      refreshJoins()
      refreshMyJoins()
    } else {
      const msgs = {
        not_host: '호스트만 확정할 수 있습니다.',
        invalid_status: '이미 확정된 조인입니다.',
        not_enough_participants: '2명 이상 참가해야 확정할 수 있습니다.',
      }
      showToast.error(msgs[result.error] || '조인 확정에 실패했습니다.')
    }
    setActionProcessing(false)
  }

  // 라운딩 시작 처리
  const handleStartRounding = async () => {
    if (actionProcessing || !user?.id || !join?.id) return
    setActionProcessing(true)
    const result = await startRounding(join.id, user.id)
    if (result.success) {
      showToast.success('라운딩을 시작합니다! 즐거운 라운딩 되세요!')
      // stateJoin이 refreshJoins 후 사라질 수 있으므로 fetchedJoin에 저장
      setFetchedJoin(prev => ({ ...(prev || join), status: 'in_progress', started_at: new Date().toISOString() }))
      refreshJoins()
      refreshMyJoins()
    } else {
      const msgs = {
        invalid_status: '확정된 조인만 시작할 수 있습니다.',
        not_today: '라운딩 당일에만 시작할 수 있습니다.',
        not_participant: '참가자만 라운딩을 시작할 수 있습니다.',
      }
      showToast.error(msgs[result.error] || '라운딩 시작에 실패했습니다.')
    }
    setActionProcessing(false)
  }

  // 프로필 사진 클릭 - 마커 확인 모달 표시
  const handleProfileClick = (userId) => {
    // 자기 자신은 무료로 프로필 페이지 이동
    if (user?.id && String(userId) === String(user.id)) {
      navigate('/profile')
      return
    }

    // 전화번호 미인증 시 인증 모달 표시
    if (!phoneVerify.checkVerification()) return

    // 이미 본 프로필인지 확인
    const viewedProfiles = getItem(STORAGE_KEYS.VIEWED_PROFILES, [])
    if (viewedProfiles.includes(userId)) {
      // 이미 본 프로필은 무료로 이동
      navigate(`/user/${userId}`)
      return
    }

    setShowMarkerConfirm(userId)
  }

  // 조인 신청 버튼 클릭
  const handleApplyClick = () => {
    // 전화번호 미인증 시 인증 모달 표시
    if (!phoneVerify.checkVerification()) return
    setShowApplyModal(true)
  }

  // 마커 사용 확인 후 프로필 보기
  const confirmViewProfile = async () => {
    if (!showMarkerConfirm || isProcessing) return

    if (balance < 3) {
      showToast.error(getErrorMessage('insufficient_balance'))
      setShowMarkerConfirm(null)
      navigate('/store')
      return
    }

    setIsProcessing(true)

    // 마커 3개 차감 (서버 검증 포함)
    const result = await spendMarkers('profile_view')
    if (!result.success) {
      showToast.error(result.message || getErrorMessage('marker_spend_failed'))
      if (result.error === 'insufficient_balance') {
        navigate('/store')
      }
      setShowMarkerConfirm(null)
      setIsProcessing(false)
      return
    }

    // 본 프로필 목록에 추가
    const viewedProfiles = getItem(STORAGE_KEYS.VIEWED_PROFILES, [])
    if (!viewedProfiles.includes(showMarkerConfirm)) {
      viewedProfiles.push(showMarkerConfirm)
      setItem(STORAGE_KEYS.VIEWED_PROFILES, viewedProfiles)
    }

    // 프로필 페이지로 이동
    navigate(`/user/${showMarkerConfirm}`)
    setShowMarkerConfirm(null)
    setIsProcessing(false)
  }

  if (!join) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {loadingJoin ? (
          <div className="animate-spin w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full" />
        ) : (
          <p className="text-gp-text-secondary">조인을 찾을 수 없습니다</p>
        )}
      </div>
    )
  }

  const handleSave = () => {
    if (isSaved) {
      unsaveJoin(join.id)
    } else {
      saveJoin(join.id)
    }
  }

  const spotsLeft = Math.max(0, (join.spotsTotal || 0) - (join.spotsFilled || 0))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* 헤더 이미지 */}
      <div className="relative h-72">
        <img
          src={join.hostPhoto || '/default-profile.png'}
          alt={join.hostName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/default-profile.png' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gp-black via-gp-black/20 to-transparent" />

        {/* 상단 네비게이션 */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => location.key === 'default' ? navigate('/join', { replace: true }) : navigate(-1)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5 text-gp-gold" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 주최자 정보 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleProfileClick(join.hostId)}
              className="relative group"
            >
              <img
                src={join.hostPhoto}
                alt={join.hostName}
                className="w-14 h-14 rounded-full border-2 border-gp-gold object-cover group-hover:border-white transition-all"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gp-dark rounded-full flex items-center justify-center border border-gp-gold">
                <MarkerIcon className="w-3 h-3" />
              </div>
            </button>
            <div>
              <h1 className="text-xl font-bold">{join.title}</h1>
              <p className="text-gp-text-secondary">{join.hostName} 주최</p>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">날짜</span>
            </div>
            <p className="font-semibold">{formatJoinDate(join.date)}</p>
          </div>
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">시간</span>
            </div>
            <p className="font-semibold">{join.time}</p>
          </div>
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">장소</span>
            </div>
            <p className="font-semibold">{join.location}</p>
          </div>
          <div className="bg-gp-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-gp-text-secondary mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">실력대</span>
            </div>
            <p className="font-semibold">{join.handicapRange}</p>
          </div>
        </div>

        {/* 스타일 */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">라운딩 스타일</h3>
          <div className="flex flex-wrap gap-2">
            {(join.style || join.styles || []).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 설명 */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">소개</h3>
          <p className="text-gp-text-secondary leading-relaxed">
            {join.description}
          </p>
        </div>

        {/* 참석자 */}
        <div>
          <h3 className="font-semibold mb-3">
            참석자 <span className="text-gp-gold">{join.spotsFilled}</span>/{join.spotsTotal}
          </h3>
          <p className="text-xs text-gp-text-secondary mb-3 flex items-center gap-1">
            <MarkerIcon className="w-3 h-3" />
            프로필 클릭 시 마커 3개 소모
          </p>
          <div className="flex flex-wrap gap-3">
            {(join.participants || []).map((p) => (
              <button 
                key={p.id} 
                onClick={() => handleProfileClick(p.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative">
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gp-border group-hover:border-gp-gold transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gp-dark rounded-full flex items-center justify-center border border-gp-border group-hover:border-gp-gold">
                    <MarkerIcon className="w-3 h-3" />
                  </div>
                </div>
                <span className="text-sm text-gp-text-secondary group-hover:text-gp-gold transition-colors">{p.name}</span>
              </button>
            ))}
            {/* 빈 자리 */}
            {Array.from({ length: spotsLeft }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-gp-card border-2 border-dashed border-gp-border flex items-center justify-center">
                  <Users className="w-6 h-6 text-gp-text-secondary" />
                </div>
                <span className="text-sm text-gp-text-secondary">모집중</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 상태별 액션바 */}
      <div className="fixed bottom-0 left-0 right-0 p-6 glass safe-bottom">
        <div className="max-w-app mx-auto">
          {/* completed: 리뷰/스코어 버튼 (멤버) 또는 안내 (방문자) */}
          {joinStatus === 'completed' && isMember && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/review?joinId=${join.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gp-border font-semibold text-base hover:bg-gp-gold/20 hover:text-gp-gold transition-all"
              >
                <Star className="w-5 h-5" />
                리뷰 작성
              </button>
              <button
                onClick={() => navigate(`/score?fromJoin=${join.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl btn-gold font-semibold text-base"
              >
                <Target className="w-5 h-5" />
                스코어 기록
              </button>
            </div>
          )}
          {joinStatus === 'completed' && !isMember && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-border text-gp-text-secondary cursor-not-allowed font-semibold text-lg">
              완료된 조인입니다
            </button>
          )}

          {/* in_progress: 라운딩 중 표시 */}
          {joinStatus === 'in_progress' && isMember && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-green/20 text-gp-green cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              라운딩 중...
            </button>
          )}
          {joinStatus === 'in_progress' && !isMember && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-border text-gp-text-secondary cursor-not-allowed font-semibold text-lg">
              진행중인 조인입니다
            </button>
          )}

          {/* confirmed: 당일이면 '라운딩 시작'(호스트만), 미래면 D-day 표시 */}
          {joinStatus === 'confirmed' && isHostCheck && isToday && (
            <button
              onClick={handleStartRounding}
              disabled={actionProcessing}
              className="w-full py-4 rounded-2xl bg-gp-green text-white font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {actionProcessing ? '처리 중...' : '라운딩 시작'}
            </button>
          )}
          {joinStatus === 'confirmed' && isMember && !(isHostCheck && isToday) && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-blue/20 text-gp-blue cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              확정됨 — {getDDay()}
            </button>
          )}
          {joinStatus === 'confirmed' && !isMember && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-border text-gp-text-secondary cursor-not-allowed font-semibold text-lg">
              마감된 조인입니다
            </button>
          )}

          {/* open: 호스트는 확정/대기, 방문자는 신청 */}
          {joinStatus === 'open' && isHostCheck && join.spotsFilled >= 2 && (
            <button
              onClick={handleConfirm}
              disabled={actionProcessing}
              className="w-full py-4 rounded-2xl btn-gold font-semibold text-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {actionProcessing ? '처리 중...' : '조인 확정하기'}
            </button>
          )}
          {joinStatus === 'open' && isHostCheck && join.spotsFilled < 2 && (
            <button disabled className="w-full py-4 rounded-2xl bg-gp-border text-gp-text-secondary cursor-not-allowed font-semibold text-lg">
              참가자를 기다리는 중...
            </button>
          )}
          {joinStatus === 'open' && !isHostCheck && (
            <button
              onClick={handleApplyClick}
              disabled={spotsLeft === 0 || isApplied || isExpired}
              className={`w-full py-4 rounded-2xl font-semibold text-lg ${
                isExpired
                  ? 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
                  : isApplied
                    ? 'bg-gp-green/20 text-gp-green cursor-not-allowed'
                    : spotsLeft > 0
                      ? 'btn-gold'
                      : 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
              }`}
            >
              {isExpired
                ? '만료된 조인입니다'
                : isApplied
                  ? '✓ 신청 완료'
                  : spotsLeft > 0
                    ? `신청하기 (${spotsLeft}자리 남음)`
                    : '마감되었습니다'}
            </button>
          )}
        </div>
      </div>

      {/* 신청 모달 */}
      {showApplyModal && (
        <ApplyModal join={join} onClose={() => setShowApplyModal(false)} />
      )}
      
      {/* 공유 모달 */}
      <AnimatePresence>
        {showShareModal && (
          <Portal><ShareModal join={join} onClose={() => setShowShareModal(false)} /></Portal>
        )}
      </AnimatePresence>
      
      {/* 마커 사용 확인 모달 */}
      <MarkerConfirmModal
        isOpen={!!showMarkerConfirm}
        onClose={() => setShowMarkerConfirm(null)}
        onConfirm={confirmViewProfile}
        actionType="profile_view"
        cost={3}
        balance={balance}
        isProcessing={isProcessing}
      />

      {/* 전화번호 인증 모달 */}
      <PhoneVerifyModal
        isOpen={phoneVerify.showModal}
        onClose={phoneVerify.closeModal}
        message="조인 신청을 하려면 전화번호 인증이 필요해요."
      />
    </motion.div>
  )
}

function ApplyModal({ join, onClose }) {
  const { applyToJoin } = useApp()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    const success = await applyToJoin(join, message)
    if (success) {
      showToast.success('신청이 완료되었습니다! 저장함에서 확인하세요.')
    } else {
      showToast.error(getErrorMessage('already_exists'))
    }
    setSubmitting(false)
    onClose()
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
        className="w-full max-w-app bg-gp-dark rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold mb-2">조인 신청</h2>
        <p className="text-gp-text-secondary mb-6">
          {join.hostName}님에게 간단히 인사해보세요
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="안녕하세요! 함께 라운딩하고 싶어요 😊"
          className="w-full h-32 bg-gp-card rounded-xl p-4 text-gp-text placeholder:text-gp-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-gp-gold"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-2xl font-semibold text-lg mt-4 ${submitting ? 'bg-gp-border text-gp-text-secondary cursor-not-allowed' : 'btn-gold'}`}
        >
          {submitting ? '보내는 중...' : '신청 보내기'}
        </button>
      </motion.div>
    </motion.div>
  )
}

// 공유 모달
function ShareModal({ join, onClose }) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `${window.location.origin}/join/${join.id}`
  const shareText = `🏌️ ${join.title}\n📅 ${formatJoinDate(join.date)} ${join.time}\n📍 ${join.location}\n\n골프피플에서 함께 라운딩해요!`
  
  // 네이티브 공유 API 지원 여부
  const canShare = navigator.share !== undefined
  
  // 네이티브 공유
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `골프피플 - ${join.title}`,
        text: shareText,
        url: shareUrl,
      })
      onClose()
    } catch (err) {
      // AbortError는 사용자가 공유를 취소한 경우 - 무시
      if (err.name !== 'AbortError') {
        showToast.error('공유에 실패했습니다.')
      }
    }
  }
  
  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!window.Kakao) {
      // SDK 미로드 시 네이티브 공유로 폴백
      if (navigator.share) {
        handleNativeShare()
      } else {
        showToast.error('카카오톡 공유를 사용할 수 없습니다. 링크를 복사해주세요.')
      }
      return
    }

    const result = shareJoinToKakao({
      title: join.title,
      date: formatJoinDate(join.date),
      time: join.time,
      location: join.location,
      url: shareUrl
    })

    if (result.success) {
      onClose()
    } else if (result.reason === 'pc_browser') {
      // PC에서는 자동으로 링크 복사
      handleCopyLink()
      showToast.success('PC에서는 링크가 복사됩니다. 카카오톡에 붙여넣기 해주세요!')
    } else if (result.reason === 'init_failed') {
      showToast.error('카카오 SDK 초기화에 실패했습니다. 다시 시도해주세요.')
    } else {
      showToast.error('카카오톡 공유에 실패했습니다. 링크 복사를 이용해주세요.')
    }
  }

  const shareOptions = [
    {
      icon: Link,
      label: copied ? '복사됨!' : '링크 복사',
      color: copied ? 'bg-gp-green' : 'bg-gp-card',
      action: handleCopyLink,
      iconColor: copied ? 'text-white' : 'text-gp-text'
    },
    {
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#3C1E1E">
          <path d="M12 3C6.477 3 2 6.463 2 10.586c0 2.648 1.758 4.976 4.396 6.306-.179.67-.656 2.433-.752 2.81-.118.464.171.458.36.334.148-.098 2.357-1.599 3.318-2.248.55.078 1.11.117 1.678.117 5.523 0 10-3.463 10-7.319C21 6.463 17.523 3 12 3z"/>
        </svg>
      ),
      label: '카카오톡',
      color: 'bg-[#FEE500]',
      action: handleKakaoShare,
      iconColor: 'text-black'
    },
    {
      icon: Share2,
      label: '더보기',
      color: 'bg-gp-blue',
      action: handleNativeShare,
      iconColor: 'text-white'
    },
  ]

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
        className="w-full max-w-app bg-gp-dark rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold mb-2">공유하기</h2>
        <p className="text-gp-text-secondary mb-6">
          친구들에게 이 조인을 공유해보세요
        </p>
        
        {/* 공유 미리보기 카드 */}
        <div className="bg-gp-card rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={join.hostPhoto} 
              alt={join.hostName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{join.title}</h3>
              <p className="text-sm text-gp-text-secondary">
                {formatJoinDate(join.date)} · {join.location}
              </p>
            </div>
          </div>
        </div>
        
        {/* 공유 옵션 버튼들 */}
        <div className="flex justify-center gap-6 mb-6">
          {shareOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                {typeof option.icon === 'function' ? (
                  <option.icon />
                ) : (
                  <option.icon className={`w-6 h-6 ${option.iconColor}`} />
                )}
              </div>
              <span className="text-xs text-gp-text-secondary">{option.label}</span>
            </button>
          ))}
        </div>
        
        {/* 네이티브 공유 버튼 (지원하는 경우) */}
        {canShare && (
          <button
            onClick={handleNativeShare}
            className="w-full py-4 rounded-2xl btn-gold font-semibold text-lg"
          >
            다른 앱으로 공유
          </button>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-3 text-gp-text-secondary mt-2"
        >
          취소
        </button>
      </motion.div>
    </motion.div>
  )
}

