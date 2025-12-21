import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Sparkles, SlidersHorizontal, Check, Bell, UserPlus, Calendar, Star, X, CheckCheck, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useMarker } from '../context/MarkerContext'

// 마커 아이콘
const MarkerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#markerGradientHome)" />
    <path d="M12 6L14.5 11H17L12 18L7 11H9.5L12 6Z" fill="#0D0D0D" />
    <defs>
      <linearGradient id="markerGradientHome" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D4AF37" />
        <stop offset="1" stopColor="#B8962E" />
      </linearGradient>
    </defs>
  </svg>
)

// 추천 시간대
const RECOMMENDATION_TIMES = [
  { id: 'midnight', hour: 0, label: '자정', icon: '🌙' },
  { id: 'afternoon', hour: 15, label: '오후 3시', icon: '☀️' },
  { id: 'evening', hour: 18, label: '저녁 6시', icon: '🌅' },
  { id: 'night', hour: 21, label: '밤 9시', icon: '🌃' },
]

// 필터 옵션들
const FILTER_OPTIONS = {
  genders: ['남성', '여성'],
  ageRanges: ['20대', '30대', '40대', '50대+'],
  handicaps: ['초보(100+)', '중수(90~100)', '고수(~90)', '싱글'],
  regions: ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'],
}

export default function Home({ onPropose }) {
  const navigate = useNavigate()
  const { users, notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useApp()
  const { balance } = useMarker()
  const [recommendations, setRecommendations] = useState({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [revealedCards, setRevealedCards] = useState(() => {
    // localStorage에서 뒤집힌 카드 상태 복원
    const saved = localStorage.getItem('gp_revealed_cards')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  
  // 필터 상태
  const [filters, setFilters] = useState({
    genders: [], // 빈 배열 = 전체
    ageRanges: [],
    handicaps: [],
    regions: [],
  })
  
  // 활성화된 필터 개수
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)
  
  // 필터링된 유저 목록
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 성별 필터
      if (filters.genders.length > 0) {
        const userGender = user.gender || (user.name.endsWith('준') || user.name.endsWith('민') || user.name.endsWith('훈') ? '남성' : '여성')
        if (!filters.genders.includes(userGender)) return false
      }
      
      // 나이대 필터
      if (filters.ageRanges.length > 0) {
        const age = user.age
        let ageRange = '50대+'
        if (age >= 20 && age < 30) ageRange = '20대'
        else if (age >= 30 && age < 40) ageRange = '30대'
        else if (age >= 40 && age < 50) ageRange = '40대'
        if (!filters.ageRanges.includes(ageRange)) return false
      }
      
      // 타수(핸디캡) 필터
      if (filters.handicaps.length > 0) {
        const handicap = user.handicap
        let handicapRange = '중수(90~100)'
        if (handicap.includes('100') || handicap.includes('초보') || handicap.includes('초반')) handicapRange = '초보(100+)'
        else if (handicap.includes('90') && !handicap.includes('100')) handicapRange = '고수(~90)'
        else if (handicap.includes('싱글') || handicap.includes('80')) handicapRange = '싱글'
        if (!filters.handicaps.includes(handicapRange)) return false
      }
      
      // 지역 필터
      if (filters.regions.length > 0) {
        const userRegion = user.region
        const matchesRegion = filters.regions.some(region => userRegion.includes(region))
        if (!matchesRegion) return false
      }
      
      return true
    })
  }, [users, filters])
  
  // 시간대별 추천 카드 생성 (필터링된 유저 기반)
  useEffect(() => {
    const currentHour = new Date().getHours()
    const newRecommendations = {}
    
    // 필터링된 유저가 없으면 전체 유저 사용
    const targetUsers = filteredUsers.length > 0 ? filteredUsers : users
    
    RECOMMENDATION_TIMES.forEach((time, timeIndex) => {
      // 현재 시간 이전의 추천만 공개 가능
      const isUnlocked = currentHour >= time.hour || (time.hour === 0 && currentHour < 3)
      
      // 각 시간대별로 2명씩 배정
      const startIndex = (timeIndex * 2) % targetUsers.length
      const assignedUsers = [
        targetUsers[startIndex % targetUsers.length],
        targetUsers[(startIndex + 1) % targetUsers.length],
      ].filter(Boolean) // undefined 제거
      
      newRecommendations[time.id] = {
        ...time,
        isUnlocked,
        cards: assignedUsers.map((user, idx) => {
          const cardId = `${time.id}-${idx}`
          return {
            user,
            state: revealedCards.has(cardId) ? 'revealed' : 'hidden', // 저장된 상태 복원
            id: cardId,
          }
        }),
      }
    })
    
    setRecommendations(newRecommendations)
  }, [users, filteredUsers, revealedCards])

  // 카드 클릭 - 숨겨진 카드면 뒤집기, 공개된 카드면 상세로 이동
  const handleCardClick = (timeId, cardIndex) => {
    const card = recommendations[timeId]?.cards[cardIndex]
    if (!card || !card.user) return
    
    if (card.state === 'hidden') {
      // 숨겨진 카드면 뒤집기만 (약식 프로필 보여주기)
      const cardId = card.id
      
      // revealedCards에 추가하고 localStorage에 저장
      setRevealedCards(prev => {
        const newSet = new Set(prev)
        newSet.add(cardId)
        localStorage.setItem('gp_revealed_cards', JSON.stringify([...newSet]))
        return newSet
      })
      
      // 추천 상태도 업데이트
      setRecommendations(prev => {
        const newRecs = { ...prev }
        newRecs[timeId].cards[cardIndex].state = 'revealed'
        return newRecs
      })
    } else {
      // 이미 공개된 카드면 프로필 상세 페이지로 이동
      navigate(`/user/${card.user.id}`)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-auto pb-24">
      {/* 헤더 */}
      <div className="px-6 pt-4 pb-4 safe-top sticky top-0 bg-gp-black/90 backdrop-blur-lg z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display gold-gradient">골프피플</h1>
            <p className="text-gp-text-secondary text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-gp-gold" />
              오늘의 추천 카드
              {activeFilterCount > 0 && (
                <span className="ml-1 text-gp-gold">({filteredUsers.length}명)</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 마커 잔액 버튼 */}
            <button
              onClick={() => navigate('/store')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gp-gold/10 border border-gp-gold/30 rounded-full hover:bg-gp-gold/20 transition-all"
            >
              <MarkerIcon className="w-4 h-4" />
              <span className="text-sm font-semibold text-gp-gold">{balance}</span>
              <Plus className="w-3 h-3 text-gp-gold" />
            </button>
            
            {/* 알림 버튼 */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl bg-gp-card hover:bg-gp-border transition-all"
            >
              <Bell className="w-5 h-5 text-gp-text" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            
            {/* 필터 버튼 */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="relative p-2 rounded-xl bg-gp-card hover:bg-gp-border transition-all"
            >
              <SlidersHorizontal className="w-5 h-5 text-gp-text" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gp-gold text-gp-black text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 시간대별 추천 섹션 */}
      <div className="px-4 space-y-6">
        {Object.values(recommendations).map((timeSlot) => (
          <div key={timeSlot.id} className="space-y-3">
            {/* 시간대 헤더 */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{timeSlot.icon}</span>
              <span className="font-medium">{timeSlot.label}</span>
              {!timeSlot.isUnlocked && (
                <span className="text-xs text-gp-text-secondary bg-gp-card px-2 py-0.5 rounded-full">
                  잠금
                </span>
              )}
            </div>
            
            {/* 카드 2장 */}
            <div className="flex gap-3">
              {timeSlot.cards.map((card, idx) => (
                <FlipCard
                  key={card.id}
                  card={card}
                  isUnlocked={timeSlot.isUnlocked}
                  onClick={() => timeSlot.isUnlocked && handleCardClick(timeSlot.id, idx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 모달 */}
      <AnimatePresence>
        {showFilterModal && (
          <FilterModal
            filters={filters}
            setFilters={setFilters}
            onClose={() => setShowFilterModal(false)}
            matchCount={filteredUsers.length}
          />
        )}
      </AnimatePresence>
      
      {/* 알림 모달 */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationModal
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onDelete={deleteNotification}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// 뒤집기 카드 컴포넌트
function FlipCard({ card, isUnlocked, onClick }) {
  const isRevealed = card.state === 'revealed'
  
  return (
    <motion.div
      className={`flex-1 aspect-[3/4] rounded-2xl cursor-pointer perspective-1000 ${
        !isUnlocked ? 'opacity-50' : ''
      }`}
      onClick={onClick}
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 뒷면 (숨겨진 카드) - 프리미엄 디자인 */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* 다크 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]" />
          
          {/* 골드 패턴 오버레이 */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D4AF37" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* 코너 장식 */}
          <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-gp-gold/40 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-gp-gold/40 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-gp-gold/40 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-gp-gold/40 rounded-br-lg" />
          
          {/* 중앙 컨텐츠 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* 골프공 아이콘 */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gp-gold/20 to-transparent flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/90 to-white/60 flex items-center justify-center shadow-lg">
                  {/* 골프공 딤플 패턴 */}
                  <svg viewBox="0 0 40 40" className="w-10 h-10">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#ccc" strokeWidth="0.5"/>
                    <circle cx="12" cy="14" r="2" fill="#ddd"/>
                    <circle cx="20" cy="12" r="2" fill="#ddd"/>
                    <circle cx="28" cy="14" r="2" fill="#ddd"/>
                    <circle cx="10" cy="22" r="2" fill="#ddd"/>
                    <circle cx="18" cy="20" r="2" fill="#ddd"/>
                    <circle cx="26" cy="20" r="2" fill="#ddd"/>
                    <circle cx="30" cy="22" r="2" fill="#ddd"/>
                    <circle cx="14" cy="28" r="2" fill="#ddd"/>
                    <circle cx="22" cy="28" r="2" fill="#ddd"/>
                  </svg>
                </div>
              </div>
              {/* 글로우 효과 */}
              <div className="absolute inset-0 rounded-full bg-gp-gold/20 blur-xl animate-pulse" />
            </div>
            
            {/* 텍스트 */}
            <p className="text-gp-gold/80 text-xs font-medium tracking-widest uppercase">New Match</p>
            <p className="text-white/40 text-[10px] mt-1">탭하여 확인</p>
          </div>
          
          {/* 하단 로고 */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <span className="text-gp-gold/30 text-xs font-display tracking-wider">GOLF PEOPLE</span>
          </div>
          
          {/* 테두리 */}
          <div className="absolute inset-0 rounded-2xl border border-gp-gold/20" />
        </div>
        
        {/* 앞면 (공개된 카드) */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card.user && (
            <>
              <img
                src={card.user.photos[0]}
                alt={card.user.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white">
                  {card.user.name}, {card.user.age}
                </p>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {card.user.region}
                </p>
              </div>
              {/* 탭 힌트 */}
              <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
                <span className="text-[10px] text-white/80">탭하여 상세</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// 필터 모달 컴포넌트
function FilterModal({ filters, setFilters, onClose, matchCount }) {
  const [localFilters, setLocalFilters] = useState(filters)
  
  // 필터 토글
  const toggleFilter = (category, value) => {
    setLocalFilters(prev => {
      const current = prev[category]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
  }
  
  // 필터 적용
  const applyFilters = () => {
    setFilters(localFilters)
    onClose()
  }
  
  // 필터 초기화
  const resetFilters = () => {
    const emptyFilters = {
      genders: [],
      ageRanges: [],
      handicaps: [],
      regions: [],
    }
    setLocalFilters(emptyFilters)
    setFilters(emptyFilters)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 백드롭 */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <motion.div
        className="relative w-full bg-gp-black rounded-t-3xl overflow-hidden max-h-[85vh] max-w-lg mx-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* 핸들바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gp-border" />
        </div>
        
        {/* 헤더 */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-gp-border">
          <h2 className="text-xl font-bold">추천 필터</h2>
          <button
            onClick={resetFilters}
            className="text-gp-gold text-sm font-medium"
          >
            초기화
          </button>
        </div>
        
        {/* 필터 옵션들 */}
        <div className="px-6 py-4 space-y-6 overflow-auto max-h-[50vh]">
          {/* 성별 */}
          <div>
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <span>👤</span> 성별
            </h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.genders.map((gender) => (
                <button
                  key={gender}
                  onClick={() => toggleFilter('genders', gender)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    localFilters.genders.includes(gender)
                      ? 'bg-gp-gold text-gp-black'
                      : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                  }`}
                >
                  {localFilters.genders.includes(gender) && <Check className="w-4 h-4" />}
                  {gender}
                </button>
              ))}
            </div>
          </div>
          
          {/* 나이대 */}
          <div>
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <span>🎂</span> 나이대
            </h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.ageRanges.map((age) => (
                <button
                  key={age}
                  onClick={() => toggleFilter('ageRanges', age)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    localFilters.ageRanges.includes(age)
                      ? 'bg-gp-gold text-gp-black'
                      : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                  }`}
                >
                  {localFilters.ageRanges.includes(age) && <Check className="w-4 h-4" />}
                  {age}
                </button>
              ))}
            </div>
          </div>
          
          {/* 타수(핸디캡) */}
          <div>
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <span>🏌️</span> 타수
            </h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.handicaps.map((handicap) => (
                <button
                  key={handicap}
                  onClick={() => toggleFilter('handicaps', handicap)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    localFilters.handicaps.includes(handicap)
                      ? 'bg-gp-gold text-gp-black'
                      : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                  }`}
                >
                  {localFilters.handicaps.includes(handicap) && <Check className="w-4 h-4" />}
                  {handicap}
                </button>
              ))}
            </div>
          </div>
          
          {/* 지역 */}
          <div>
            <h3 className="text-sm text-gp-text-secondary mb-3 flex items-center gap-2">
              <span>📍</span> 지역
            </h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.regions.map((region) => (
                <button
                  key={region}
                  onClick={() => toggleFilter('regions', region)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    localFilters.regions.includes(region)
                      ? 'bg-gp-gold text-gp-black'
                      : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                  }`}
                >
                  {localFilters.regions.includes(region) && <Check className="w-4 h-4" />}
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gp-border safe-bottom">
          <button
            onClick={applyFilters}
            className="w-full py-4 btn-gold rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <span>필터 적용하기</span>
            {matchCount > 0 && (
              <span className="bg-gp-black/20 px-2 py-0.5 rounded-full text-sm">
                {matchCount}명
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 알림 모달
function NotificationModal({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-5 h-5 text-blue-400" />
      case 'join_request': return <Calendar className="w-5 h-5 text-green-400" />
      case 'match': return <Star className="w-5 h-5 text-gp-gold" />
      default: return <Bell className="w-5 h-5 text-gp-text-secondary" />
    }
  }
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gp-dark overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gp-border safe-top">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gp-gold" />
            <h2 className="text-lg font-bold">알림</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-2 text-gp-text-secondary hover:text-gp-gold transition-colors"
                title="모두 읽음"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gp-text-secondary hover:text-gp-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gp-card flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gp-text-secondary" />
              </div>
              <h3 className="font-semibold mb-1">알림이 없어요</h3>
              <p className="text-gp-text-secondary text-sm">새로운 소식이 오면 알려드릴게요</p>
            </div>
          ) : (
            <div className="divide-y divide-gp-border">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-4 hover:bg-gp-card/50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-gp-card/30' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* 아이콘 또는 사진 */}
                    {notification.userPhoto ? (
                      <img
                        src={notification.userPhoto}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    
                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-semibold text-sm ${!notification.isRead ? 'text-gp-text' : 'text-gp-text-secondary'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gp-text-secondary line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gp-text-secondary mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(notification.id)
                      }}
                      className="p-1 text-gp-text-secondary hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
