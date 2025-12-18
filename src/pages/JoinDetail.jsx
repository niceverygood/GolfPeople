import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Trophy, Bookmark, BookmarkCheck, Share2, Copy, MessageCircle, Link, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function JoinDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { joins, savedJoins, saveJoin, unsaveJoin, applyToJoin, joinApplications } = useApp()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const join = joins.find(j => j.id === parseInt(id))
  const isSaved = savedJoins.includes(join?.id)
  const isApplied = joinApplications.some(app => app.joinId === join?.id)

  if (!join) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gp-text-secondary">조인을 찾을 수 없습니다</p>
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

  const spotsLeft = join.spotsTotal - join.spotsFilled

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* 헤더 이미지 */}
      <div className="relative h-72">
        <img
          src={join.hostPhoto}
          alt={join.hostName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gp-black via-gp-black/20 to-transparent" />

        {/* 상단 네비게이션 */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => navigate(-1)}
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
            <img
              src={join.hostPhoto}
              alt={join.hostName}
              className="w-14 h-14 rounded-full border-2 border-gp-gold object-cover"
            />
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
            <p className="font-semibold">{join.date}</p>
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
            {join.style.map((tag) => (
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
          <div className="flex flex-wrap gap-3">
            {join.participants.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <img
                  src={p.photo}
                  alt={p.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gp-border"
                />
                <span className="text-sm text-gp-text-secondary">{p.name}</span>
              </div>
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

      {/* 하단 신청 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-6 glass safe-bottom">
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={() => setShowApplyModal(true)}
            disabled={spotsLeft === 0 || isApplied}
            className={`w-full py-4 rounded-2xl font-semibold text-lg ${
              isApplied
                ? 'bg-gp-green/20 text-gp-green cursor-not-allowed'
                : spotsLeft > 0
                  ? 'btn-gold'
                  : 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
            }`}
          >
            {isApplied 
              ? '✓ 신청 완료' 
              : spotsLeft > 0 
                ? `신청하기 (${spotsLeft}자리 남음)` 
                : '마감되었습니다'}
          </button>
        </div>
      </div>

      {/* 신청 모달 */}
      {showApplyModal && (
        <ApplyModal join={join} onClose={() => setShowApplyModal(false)} />
      )}
      
      {/* 공유 모달 */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal join={join} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ApplyModal({ join, onClose }) {
  const { applyToJoin } = useApp()
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    const success = applyToJoin(join, message)
    if (success) {
      alert('신청이 완료되었습니다! 저장함에서 확인하세요.')
    } else {
      alert('이미 신청한 조인입니다.')
    }
    onClose()
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
        className="w-full max-w-[430px] bg-gp-dark rounded-t-3xl p-6 safe-bottom"
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
          className="w-full py-4 rounded-2xl btn-gold font-semibold text-lg mt-4"
        >
          신청 보내기
        </button>
      </motion.div>
    </motion.div>
  )
}

// 공유 모달
function ShareModal({ join, onClose }) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `${window.location.origin}/join/${join.id}`
  const shareText = `🏌️ ${join.title}\n📅 ${join.date} ${join.time}\n📍 ${join.location}\n\n골프피플에서 함께 라운딩해요!`
  
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
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
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
  
  // 카카오톡 공유 (카카오 SDK가 없으므로 URL scheme 사용)
  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(kakaoUrl, '_blank', 'width=500,height=600')
  }
  
  // 문자 공유
  const handleSMSShare = () => {
    const smsBody = encodeURIComponent(`${shareText}\n${shareUrl}`)
    window.location.href = `sms:?body=${smsBody}`
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
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FEE500">
          <path d="M12 3C6.477 3 2 6.463 2 10.586c0 2.648 1.758 4.976 4.396 6.306-.179.67-.656 2.433-.752 2.81-.118.464.171.458.36.334.148-.098 2.357-1.599 3.318-2.248.55.078 1.11.117 1.678.117 5.523 0 10-3.463 10-7.319C21 6.463 17.523 3 12 3z"/>
        </svg>
      ), 
      label: '카카오톡', 
      color: 'bg-[#FEE500]',
      action: handleKakaoShare,
      iconColor: 'text-black'
    },
    { 
      icon: MessageCircle, 
      label: '문자', 
      color: 'bg-gp-green',
      action: handleSMSShare,
      iconColor: 'text-white'
    },
  ]

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
        className="w-full max-w-[430px] bg-gp-dark rounded-t-3xl p-6 safe-bottom"
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
                {join.date} · {join.location}
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

