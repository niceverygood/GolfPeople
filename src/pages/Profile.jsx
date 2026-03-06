import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, MapPin, Trophy, Clock, Settings, ChevronRight, LogOut,
  Shield, Edit2, X, Bell, Eye, Moon, Trash2, ChevronLeft, Coins, Plus, Phone,
  TrendingUp, Target, Users, Star, MessageSquare, Calendar, Check, ChevronDown
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useMarker } from '../context/MarkerContext'
import { db, storage } from '../lib/supabase'
import { getNotificationSettings, updateNotificationSettings } from '../lib/notificationService'
import { getUserRating } from '../lib/reviewService'
import { getLikedByCount, getReceivedApplicationCount } from '../lib/profileStatsService'
import { getCompletedRoundingCount } from '../lib/joinService'
import VerificationBadges from '../components/VerificationBadges'
import { showToast } from '../utils/errorHandler'
import Portal from '../components/Portal'
import MarkerIcon from '../components/icons/MarkerIcon'

// 지역 데이터 (Onboarding과 동일)
const REGION_DATA = {
  '서울': ['강남', '서초', '송파', '강동', '마포', '용산', '종로', '중구', '성동', '광진', '동대문', '중랑', '성북', '강북', '도봉', '노원', '은평', '서대문', '영등포', '동작', '관악', '금천', '구로', '양천', '강서'],
  '경기': ['성남 분당', '성남 수정', '용인 수지', '용인 기흥', '수원 영통', '수원 권선', '화성', '평택', '안양', '안산', '고양 일산', '고양 덕양', '파주', '김포', '부천', '광명', '시흥', '군포', '의왕', '과천', '안성', '오산', '하남', '광주', '이천', '여주', '양평', '포천', '동두천', '의정부', '구리', '남양주'],
  '인천': ['연수', '남동', '부평', '계양', '서구', '중구', '동구', '미추홀', '강화', '옹진'],
  '부산': ['해운대', '수영', '남구', '동래', '부산진', '연제', '금정', '북구', '사상', '사하', '강서', '서구', '중구', '동구', '영도', '기장'],
  '대구': ['수성', '달서', '북구', '동구', '서구', '남구', '중구', '달성'],
  '대전': ['유성', '서구', '중구', '동구', '대덕'],
  '광주': ['광산', '서구', '북구', '남구', '동구'],
  '울산': ['남구', '중구', '동구', '북구', '울주'],
  '세종': ['세종시'],
  '강원': ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'],
  '충북': ['청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'],
  '충남': ['천안', '아산', '서산', '논산', '계룡', '당진', '공주', '보령', '홍성', '예산', '태안', '청양', '부여', '서천', '금산'],
  '전북': ['전주', '익산', '군산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
  '전남': ['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
  '경북': ['포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'],
  '경남': ['창원', '김해', '진주', '양산', '거제', '통영', '사천', '밀양', '함안', '거창', '합천', '창녕', '고성', '남해', '하동', '산청', '함양', '의령'],
  '제주': ['제주시', '서귀포시']
}

// 핸디캡 옵션 (Onboarding과 동일)
const HANDICAPS = ['100 이상', '100대', '90대 후반', '90대 중반', '90대 초반', '80대', '싱글']

// 스타일 옵션 (Onboarding과 동일)
const STYLES = ['카트 선호', '도보 가능', '빠르게', '여유롭게', '내기 OK', '내기 X', '초보 환영', '사진 찍기', '맥주 한잔']

// 시간 옵션 (Onboarding과 동일)
const TIMES = ['평일 오전', '평일 오후', '주말 오전', '주말 오후', '주말 전체', '상관없음']

// 골프복 브랜드 옵션 (마크앤로나 제일 먼저)
const GOLF_BRANDS = [
  { name: '마크앤로나', emoji: '👑', premium: true },
  { name: 'PXG', emoji: '🔥', premium: true },
  { name: '타이틀리스트', emoji: '⛳', premium: false },
  { name: '캘러웨이', emoji: '🏌️', premium: false },
  { name: '테일러메이드', emoji: '🎯', premium: false },
  { name: '풋조이', emoji: '👟', premium: false },
  { name: '나이키 골프', emoji: '✔️', premium: false },
  { name: '아디다스 골프', emoji: '🏃', premium: false },
  { name: '언더아머', emoji: '💪', premium: false },
  { name: '지포어', emoji: '🌟', premium: true },
  { name: '말본골프', emoji: '🦆', premium: true },
  { name: '파리게이츠', emoji: '🇫🇷', premium: true },
  { name: '마스터바니', emoji: '🐰', premium: true },
  { name: '데상트골프', emoji: '🏔️', premium: false },
  { name: '르꼬끄골프', emoji: '🐓', premium: false },
  { name: '휠라골프', emoji: '🎾', premium: false },
  { name: '와이드앵글', emoji: '📐', premium: false },
  { name: '볼빅', emoji: '🌈', premium: false },
  { name: '기타', emoji: '👕', premium: false },
]

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentUser } = useApp()
  const { user, profile: authProfile, isAuthenticated, signOut, updateProfile, loading: authLoading } = useAuth()
  const { balance } = useMarker()
  const [profile, setProfile] = useState(null)
  const [scoreStats, setScoreStats] = useState(null)
  const [myRating, setMyRating] = useState(null)
  const [profileStats, setProfileStats] = useState({ likedBy: 0, receivedApps: 0, completedRoundings: 0 })

  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // URL 파라미터로 설정 모달 자동 열기 (?settings=open)
  useEffect(() => {
    if (searchParams.get('settings') === 'open') {
      setShowSettingsModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    // Supabase 프로필이 있으면 그것을 사용, 없으면 로컬스토리지
    if (authProfile) {
      setProfile(authProfile)
    } else {
      const savedProfile = localStorage.getItem('gp_profile')
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile))
        } catch {
          localStorage.removeItem('gp_profile')
        }
      }
    }
  }, [authProfile])

  // 스코어 통계 로드
  useEffect(() => {
    const loadScoreStats = async () => {
      if (user?.id) {
        const { data } = await db.scores.getStats(user.id)
        if (data) setScoreStats(data)
      }
    }
    loadScoreStats()
  }, [user?.id])

  // 내 평점 로드
  useEffect(() => {
    const loadMyRating = async () => {
      if (user?.id) {
        const rating = await getUserRating(user.id)
        setMyRating(rating)
      }
    }
    loadMyRating()
  }, [user?.id])

  // 프로필 통계 로드 (관심받음, 받은 신청, 완료 라운딩)
  useEffect(() => {
    const loadProfileStats = async () => {
      if (user?.id) {
        const results = await Promise.allSettled([
          getLikedByCount(user.id),
          getReceivedApplicationCount(user.id),
          getCompletedRoundingCount(user.id),
        ])
        setProfileStats({
          likedBy: results[0].status === 'fulfilled' ? results[0].value : 0,
          receivedApps: results[1].status === 'fulfilled' ? results[1].value : 0,
          completedRoundings: results[2].status === 'fulfilled' ? results[2].value : 0,
        })
      }
    }
    loadProfileStats()
  }, [user?.id])

  const stats = [
    { label: '관심받음', value: profileStats.likedBy, action: null },
    { label: '받은 신청', value: profileStats.receivedApps, action: () => navigate('/saved?tab=applications') },
    { label: '완료 라운딩', value: profileStats.completedRoundings, action: () => navigate('/rounding-history') },
  ]

  // 전화번호 인증 여부
  const isPhoneVerified = profile?.phone_verified || localStorage.getItem('gp_phone_verified')

  const menuItems = [
    { icon: Users, label: '내 친구', action: () => navigate('/friends') },
    { icon: Calendar, label: '내 조인 기록', action: () => navigate('/rounding-history') },
    { icon: Star, label: '라운딩 리뷰', action: () => navigate('/review') },
    { icon: Edit2, label: '프로필 수정', action: () => setShowEditModal(true) },
    // 전화번호 미인증시 인증 메뉴 표시
    ...(!isPhoneVerified ? [{
      icon: Phone,
      label: '전화번호 인증',
      action: () => navigate('/phone-verify'),
      highlight: true
    }] : []),
    { icon: Settings, label: '설정', action: () => setShowSettingsModal(true) },
    { icon: Shield, label: '차단 관리', action: () => setShowBlockModal(true) },
    { icon: LogOut, label: '로그아웃', action: () => setShowLogoutConfirm(true) },
  ]
  
  const handleLogout = async () => {
    // Supabase 로그아웃 (signOut 내부에서 세션 데이터 정리됨)
    if (isAuthenticated) {
      await signOut()
    }
    // gp_onboarded는 유지 (재로그인 시 온보딩 다시 안 뜨도록)
    localStorage.removeItem('gp_profile')
    window.location.href = '/'
  }
  
  const handleProfileUpdate = async (updatedProfile) => {
    if (isSaving) return
    setIsSaving(true)

    try {
      // base64 사진을 Supabase Storage에 병렬 업로드
      const photos = updatedProfile.photos || []
      const uploadResults = await Promise.allSettled(
        photos.map(async (photo) => {
          if (photo.startsWith('data:')) {
            const res = await fetch(photo)
            const blob = await res.blob()
            const file = new File([blob], `photo.jpg`, { type: 'image/jpeg' })
            const { url, error } = await storage.uploadProfileImage(user.id, file)
            if (error || !url) return photo // 실패 시 base64 유지
            return url
          }
          return photo
        })
      )
      const uploadedPhotos = uploadResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
      const uploadFailed = uploadResults.some(r => r.status === 'rejected')
      if (uploadFailed) {
        showToast.error('일부 사진 업로드에 실패했습니다')
      }

      // Supabase DB 저장 (brands 컬럼 미존재 → 제외)
      if (isAuthenticated && user?.id) {
        const { error } = await updateProfile({
          photos: uploadedPhotos,
          regions: updatedProfile.regions || [],
          handicap: updatedProfile.handicap || '',
          styles: updatedProfile.styles || [],
          times: updatedProfile.times || [],
        })
        if (error) {
          showToast.error('프로필 저장에 실패했습니다')
          console.error('프로필 업데이트 에러:', error)
          return
        }
        showToast.success('프로필이 저장되었습니다')
      }

      // brands 로컬 저장 (DB 컬럼 추가 전)
      if (updatedProfile.brands?.length) {
        localStorage.setItem('gp_brands', JSON.stringify(updatedProfile.brands))
      }

      // 로컬 상태 업데이트 + 모달 닫기
      const merged = { ...updatedProfile, photos: uploadedPhotos }
      setProfile(merged)
      localStorage.setItem('gp_profile', JSON.stringify(merged))
      setShowEditModal(false)
    } catch (err) {
      console.error('프로필 저장 중 에러:', err)
      showToast.error('저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 유저 이름 (Supabase 프로필 또는 로컬)
  const displayName = authProfile?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || currentUser?.name || '닉네임 설정'
  const displayPhoto = authProfile?.photos?.[0] || authProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || profile?.photos?.[0] || profile?.photo

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-tab">
      {/* 헤더 배경 */}
      <div className="relative h-40 bg-gradient-to-br from-gp-gold/20 to-gp-green-dark/20 flex-shrink-0">
        <div className="absolute inset-0 bg-gp-black/50" />
      </div>

      {/* 프로필 카드 */}
      <div className="px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gp-card rounded-3xl p-6"
        >
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-3">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="프로필"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gp-gold"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gp-border flex items-center justify-center border-4 border-gp-gold">
                  <Camera className="w-8 h-8 text-gp-text-secondary" />
                </div>
              )}
              <button 
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gp-gold flex items-center justify-center"
              >
                <Camera className="w-4 h-4 text-gp-black" />
              </button>
            </div>

            <h2 className="text-xl font-bold mb-1">
              {displayName}
            </h2>

            {/* 인증 배지 */}
            <div className="mb-2 flex justify-center">
              <VerificationBadges
                user={{ ...profile, phone_verified: isPhoneVerified }}
                scoreStats={scoreStats}
                rating={myRating}
              />
            </div>

            {/* 지역 & 핸디캡 */}
            {profile && (
              <div className="flex items-center gap-4 text-gp-text-secondary text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.regions?.join(', ') || '미설정'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>{profile.handicap}</span>
                </div>
              </div>
            )}
            
            {/* 인증된 전화번호 */}
            {isPhoneVerified && (
              <button
                onClick={() => navigate('/phone-verify?mode=change')}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-gp-green/20 rounded-full text-sm"
              >
                <div className="flex items-center gap-1 text-gp-green">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">인증됨</span>
                </div>
                <span className="text-gp-text-secondary">
                  {profile?.phone || localStorage.getItem('gp_verified_phone') || '번호 변경'}
                </span>
                <ChevronRight className="w-4 h-4 text-gp-text-secondary" />
              </button>
            )}
          </div>

          {/* 스타일 태그 */}
          {profile?.styles && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {profile.styles.map((tag) => (
                <span key={tag} className="tag text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* 좋아하는 브랜드 */}
          {profile?.brands?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gp-text-secondary mb-2 text-center">👕 좋아하는 브랜드</p>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.brands.map((brand) => {
                  const brandData = GOLF_BRANDS.find(b => b.name === brand)
                  return (
                    <span 
                      key={brand} 
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        brandData?.premium 
                          ? 'bg-gp-gold/20 text-gp-gold border border-gp-gold/30' 
                          : 'bg-gp-card text-gp-text-secondary'
                      }`}
                    >
                      {brandData?.emoji} {brand}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* 가능 시간 */}
          {profile?.times?.length > 0 && (
            <div className="flex items-center justify-center gap-1 text-gp-text-secondary text-sm">
              <Clock className="w-4 h-4" />
              <span>{profile.times.join(', ')}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* 마커 잔액 카드 */}
      <div className="px-6 mt-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/store')}
          className="w-full bg-gradient-to-r from-gp-gold/20 to-yellow-600/10 rounded-2xl p-4 flex items-center justify-between border border-gp-gold/30 hover:border-gp-gold/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gp-gold/20 flex items-center justify-center">
              <MarkerIcon className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-sm text-gp-text-secondary">내 마커</p>
              <p className="text-2xl font-bold">{balance}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gp-gold text-black px-4 py-2 rounded-xl font-semibold">
            <Plus className="w-4 h-4" />
            <span>충전</span>
          </div>
        </motion.button>
      </div>

      {/* 스코어 기록 카드 */}
      <div className="px-6 mt-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/score')}
          className="w-full bg-gradient-to-r from-green-500/10 to-emerald-600/5 rounded-2xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">스코어 기록</p>
                <p className="text-xs text-gp-text-secondary">나의 성장 기록하기</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
          </div>
          
          {scoreStats ? (
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-green-500/10">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{scoreStats.totalRounds}</p>
                <p className="text-[10px] text-gp-text-secondary">라운드</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gp-gold">{scoreStats.avgScore}</p>
                <p className="text-[10px] text-gp-text-secondary">평균</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-400">{scoreStats.bestScore}</p>
                <p className="text-[10px] text-gp-text-secondary">베스트</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">
                  {scoreStats.handicap !== null ? scoreStats.handicap : '-'}
                </p>
                <p className="text-[10px] text-gp-text-secondary">핸디캡</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-green-500/10 text-gp-text-secondary text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>첫 라운딩 스코어를 기록해보세요!</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* 통계 */}
      <div className="px-6 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Wrapper = stat.action ? 'button' : 'div'
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Wrapper
                  onClick={stat.action || undefined}
                  className={`w-full bg-gp-card rounded-2xl p-4 text-center ${stat.action ? 'hover:bg-gp-border/50 transition-colors' : ''}`}
                >
                  <p className="text-2xl font-bold text-gp-gold mb-1">{stat.value}</p>
                  <p className="text-gp-text-secondary text-xs">{stat.label}</p>
                </Wrapper>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 메뉴 */}
      <div className="px-6 mt-6">
        <div className="bg-gp-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 hover:bg-gp-border/50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gp-border' : ''
              } ${item.highlight ? 'bg-gp-gold/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${
                  item.label === '로그아웃' ? 'text-gp-red' : 
                  item.highlight ? 'text-gp-gold' : 'text-gp-text-secondary'
                }`} />
                <span className={
                  item.label === '로그아웃' ? 'text-gp-red' : 
                  item.highlight ? 'text-gp-gold font-semibold' : ''
                }>
                  {item.label}
                </span>
                {item.highlight && (
                  <span className="text-xs bg-gp-gold text-black px-2 py-0.5 rounded-full">
                    권장
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
            </button>
          ))}
        </div>
      </div>

      {/* 버전 */}
      <p className="text-center text-gp-text-secondary text-xs mt-8">
        골프피플 v2.0.0
      </p>
      
      {/* 프로필 수정 모달 */}
      <AnimatePresence>
        {showEditModal && (
          <Portal><EditProfileModal
            profile={profile}
            onClose={() => setShowEditModal(false)}
            onSave={handleProfileUpdate}
            isSaving={isSaving}
          /></Portal>
        )}
      </AnimatePresence>

      {/* 설정 모달 */}
      <AnimatePresence>
        {showSettingsModal && (
          <Portal><SettingsModal onClose={() => setShowSettingsModal(false)} /></Portal>
        )}
      </AnimatePresence>

      {/* 차단 관리 모달 */}
      <AnimatePresence>
        {showBlockModal && (
          <Portal><BlockManageModal onClose={() => setShowBlockModal(false)} currentUserId={user?.id} /></Portal>
        )}
      </AnimatePresence>

      {/* 로그아웃 확인 모달 */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <Portal><ConfirmModal
            title="로그아웃"
            message="정말 로그아웃 하시겠습니까?"
            confirmText="로그아웃"
            confirmColor="red"
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          /></Portal>
        )}
      </AnimatePresence>
    </div>
  )
}

// 프로필 수정 모달
function EditProfileModal({ profile, onClose, onSave, isSaving }) {
  const [editedProfile, setEditedProfile] = useState(() => {
    const base = profile ? { ...profile } : {
      photos: [],
      regions: [],
      handicap: '',
      styles: [],
      times: [],
      brands: [],
    }
    // 기존 photo를 photos 배열로 변환
    if (base.photo && !base.photos?.length) {
      base.photos = [base.photo]
    }
    // brands 배열 초기화
    if (!base.brands) {
      base.brands = []
    }
    return base
  })
  
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [selectedProvince, setSelectedProvince] = useState('')
  
  // 사진 추가 (리사이즈 적용)
  const handlePhotoAdd = async (e) => {
    const { resizeImage } = await import('../utils/imageResize')
    const files = Array.from(e.target.files)
    const photos = editedProfile.photos || []

    if (photos.length + files.length > 6) {
      showToast.warning('최대 6장까지 업로드 가능합니다')
      return
    }

    for (const file of files) {
      try {
        const resized = await resizeImage(file)
        setEditedProfile(prev => ({
          ...prev,
          photos: [...(prev.photos || []), resized]
        }))
      } catch (err) {
        console.error('이미지 리사이즈 에러:', err)
      }
    }
    
    // input 초기화
    e.target.value = ''
  }
  
  // 사진 삭제
  const handlePhotoDelete = (index) => {
    const photos = editedProfile.photos || []
    setEditedProfile({
      ...editedProfile,
      photos: photos.filter((_, i) => i !== index)
    })
  }
  
  // 드래그 시작
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  // 드래그 오버
  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  
  // 드롭
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    
    const photos = [...(editedProfile.photos || [])]
    const [draggedItem] = photos.splice(draggedIndex, 1)
    photos.splice(dropIndex, 0, draggedItem)
    
    setEditedProfile({ ...editedProfile, photos })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  // 지역 토글 (시/도 + 구/군 형식, 최대 5개)
  const toggleRegion = (province, district) => {
    const fullRegion = `${province} ${district}`
    const regions = editedProfile.regions || []
    if (regions.includes(fullRegion)) {
      setEditedProfile({ ...editedProfile, regions: regions.filter(r => r !== fullRegion) })
    } else if (regions.length < 5) {
      setEditedProfile({ ...editedProfile, regions: [...regions, fullRegion] })
    }
  }
  
  // 스타일 토글 (최대 8개)
  const toggleStyle = (style) => {
    const styles = editedProfile.styles || []
    if (styles.includes(style)) {
      setEditedProfile({ ...editedProfile, styles: styles.filter(s => s !== style) })
    } else if (styles.length < 8) {
      setEditedProfile({ ...editedProfile, styles: [...styles, style] })
    }
  }
  
  // 시간 토글 (중복 선택)
  const toggleTime = (time) => {
    const times = editedProfile.times || []
    if (times.includes(time)) {
      setEditedProfile({ ...editedProfile, times: times.filter(t => t !== time) })
    } else {
      setEditedProfile({ ...editedProfile, times: [...times, time] })
    }
  }
  
  // 브랜드 토글 (최대 5개)
  const toggleBrand = (brandName) => {
    const brands = editedProfile.brands || []
    if (brands.includes(brandName)) {
      setEditedProfile({ ...editedProfile, brands: brands.filter(b => b !== brandName) })
    } else if (brands.length < 5) {
      setEditedProfile({ ...editedProfile, brands: [...brands, brandName] })
    }
  }
  
  // 저장 시 기존 형식 호환
  const handleSave = () => {
    if (!editedProfile.photos?.length) {
      showToast.warning('대표 사진 1장은 필수입니다')
      return
    }
    
    const saveData = {
      ...editedProfile,
      // 기존 호환용
      photo: editedProfile.photos?.[0] || '',
      region: editedProfile.regions?.join(', ') || '',
      time: editedProfile.times?.join(', ') || '',
    }
    onSave(saveData)
  }
  
  const photos = editedProfile.photos || []
  const canAddMore = photos.length < 6

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-gp-black flex flex-col"
    >
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-gp-border bg-gp-black safe-top">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">프로필 수정</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`font-semibold ${isSaving ? 'text-gp-text-secondary' : 'text-gp-gold'}`}
        >
          {isSaving ? '저장중...' : '저장'}
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 pb-20">
        {/* 프로필 사진 (최대 6장) */}
        <div className="mb-8">
          <label className="block text-sm text-gp-text-secondary mb-3">
            📸 프로필 사진 (최대 6장, 드래그로 순서 변경)
            <span className="ml-2 text-gp-gold">{photos.length}/6</span>
            {photos.length === 0 && <span className="ml-2 text-red-400">* 대표 사진 1장 필수</span>}
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {/* 업로드된 사진들 */}
            {photos.map((photo, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-gp-gold' : ''}`}
              >
                <img
                  src={photo}
                  alt={`프로필 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* 대표 사진 배지 */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 px-2 py-0.5 bg-gp-gold text-gp-black text-[10px] font-bold rounded-full">
                    대표
                  </div>
                )}
                
                {/* 순서 번호 */}
                <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/60 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                
                {/* 삭제 버튼 */}
                <button
                  onClick={() => handlePhotoDelete(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* 드래그 핸들 표시 */}
                <div className="absolute bottom-1 right-1 text-white/60">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>
              </div>
            ))}
            
            {/* 사진 추가 버튼 */}
            {canAddMore && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gp-border hover:border-gp-gold bg-gp-card flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Camera className="w-8 h-8 text-gp-text-secondary mb-1" />
                <span className="text-xs text-gp-text-secondary">추가</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden" 
                />
              </label>
            )}
          </div>
          
          <p className="text-xs text-gp-text-secondary mt-2">
            💡 첫 번째 사진이 대표 사진으로 표시됩니다. 드래그해서 순서를 변경하세요.
          </p>
        </div>
        
        {/* 지역 (시/도 → 구/군 선택, 최대 5개) */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">
            📍 활동 지역 (최대 5개)
            {editedProfile.regions?.length > 0 && (
              <span className="ml-2 text-gp-gold">
                {editedProfile.regions.length}/5
              </span>
            )}
          </label>

          {/* 선택된 지역 표시 */}
          {editedProfile.regions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {editedProfile.regions.map((r) => (
                <span
                  key={r}
                  onClick={() => setEditedProfile({ ...editedProfile, regions: editedProfile.regions.filter(reg => reg !== r) })}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gp-gold text-gp-black cursor-pointer flex items-center gap-1"
                >
                  {r} ✕
                </span>
              ))}
            </div>
          )}

          {/* 시/도 선택 탭 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.keys(REGION_DATA).map((province) => (
              <button
                key={province}
                onClick={() => setSelectedProvince(selectedProvince === province ? '' : province)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedProvince === province
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                }`}
              >
                {province}
                {selectedProvince === province && <ChevronDown className="w-3 h-3 inline ml-0.5" />}
              </button>
            ))}
          </div>

          {/* 구/군 선택 */}
          {selectedProvince && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gp-card rounded-xl p-3"
            >
              <p className="text-xs text-gp-text-secondary mb-2">{selectedProvince} 지역</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {REGION_DATA[selectedProvince].map((district) => {
                  const fullRegion = `${selectedProvince} ${district}`
                  const isSelected = editedProfile.regions?.includes(fullRegion)
                  return (
                    <button
                      key={district}
                      onClick={() => toggleRegion(selectedProvince, district)}
                      disabled={!isSelected && editedProfile.regions?.length >= 5}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-gp-gold text-gp-black'
                          : editedProfile.regions?.length >= 5
                            ? 'bg-gp-border/50 text-gp-text-secondary/50 cursor-not-allowed'
                            : 'bg-gp-border text-gp-text-secondary hover:bg-gp-gold/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-0.5" />}
                      {district}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* 핸디캡 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">🏌️ 실력 (핸디캡)</label>
          <div className="flex flex-wrap gap-2">
            {HANDICAPS.map((handicap) => (
              <button
                key={handicap}
                onClick={() => setEditedProfile({ ...editedProfile, handicap })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.handicap === handicap
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                }`}
              >
                {handicap}
              </button>
            ))}
          </div>
        </div>
        
        {/* 스타일 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-3">
            ⛳ 라운딩 스타일 (최대 8개)
            {editedProfile.styles?.length > 0 && (
              <span className="ml-2 text-gp-gold">
                {editedProfile.styles.length}/8
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                disabled={!editedProfile.styles?.includes(style) && editedProfile.styles?.length >= 8}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  editedProfile.styles?.includes(style)
                    ? 'bg-gp-gold text-gp-black'
                    : editedProfile.styles?.length >= 8
                      ? 'bg-gp-border/50 text-gp-text-secondary/50 cursor-not-allowed'
                      : 'bg-gp-border text-gp-text-secondary hover:bg-gp-gold/20'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {/* 선호 시간 (중복 선택) */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-3">
            🕐 선호 시간 (중복 선택 가능)
            {editedProfile.times?.length > 0 && (
              <span className="ml-2 text-gp-gold">
                {editedProfile.times.length}개 선택
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {TIMES.map((time) => (
              <button
                key={time}
                onClick={() => toggleTime(time)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  editedProfile.times?.includes(time)
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-border text-gp-text-secondary hover:bg-gp-gold/20'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
        
        {/* 좋아하는 골프복 브랜드 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-3">
            👕 좋아하는 브랜드 (최대 5개)
            {editedProfile.brands?.length > 0 && (
              <span className="ml-2 text-gp-gold">
                {editedProfile.brands.length}/5
              </span>
            )}
          </label>
          
          {/* 프리미엄 브랜드 */}
          <div className="bg-gradient-to-r from-gp-gold/10 to-yellow-600/5 rounded-xl p-4 mb-3 border border-gp-gold/20">
            <div className="text-xs font-medium text-gp-gold mb-3 flex items-center gap-1">
              ✨ 프리미엄 브랜드
            </div>
            <div className="flex flex-wrap gap-2">
              {GOLF_BRANDS.filter(b => b.premium).map((brand) => (
                <button
                  key={brand.name}
                  onClick={() => toggleBrand(brand.name)}
                  disabled={!editedProfile.brands?.includes(brand.name) && editedProfile.brands?.length >= 5}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    editedProfile.brands?.includes(brand.name)
                      ? 'bg-gp-gold text-gp-black'
                      : editedProfile.brands?.length >= 5
                        ? 'bg-gp-border/50 text-gp-text-secondary/50 cursor-not-allowed'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-gold/20 border border-gp-border'
                  }`}
                >
                  <span>{brand.emoji}</span>
                  <span>{brand.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 일반 브랜드 */}
          <div className="bg-gp-card rounded-xl p-4">
            <div className="text-xs font-medium text-gp-text-secondary mb-3">
              일반 브랜드
            </div>
            <div className="flex flex-wrap gap-2">
              {GOLF_BRANDS.filter(b => !b.premium).map((brand) => (
                <button
                  key={brand.name}
                  onClick={() => toggleBrand(brand.name)}
                  disabled={!editedProfile.brands?.includes(brand.name) && editedProfile.brands?.length >= 5}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    editedProfile.brands?.includes(brand.name)
                      ? 'bg-gp-gold text-gp-black'
                      : editedProfile.brands?.length >= 5
                        ? 'bg-gp-border/50 text-gp-text-secondary/50 cursor-not-allowed'
                        : 'bg-gp-border text-gp-text-secondary hover:bg-gp-gold/20'
                  }`}
                >
                  <span>{brand.emoji}</span>
                  <span>{brand.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 선택한 항목 요약 */}
        {(editedProfile.styles?.length > 0 || editedProfile.regions?.length > 0 || editedProfile.times?.length > 0 || editedProfile.brands?.length > 0) && (
          <div className="bg-gp-card rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold mb-3">✅ 선택한 항목</h4>
            
            {editedProfile.regions?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gp-text-secondary">지역: </span>
                <span className="text-xs text-gp-gold">{editedProfile.regions.join(', ')}</span>
              </div>
            )}
            
            {editedProfile.styles?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gp-text-secondary">스타일: </span>
                <span className="text-xs text-gp-gold">{editedProfile.styles.join(', ')}</span>
              </div>
            )}
            
            {editedProfile.times?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gp-text-secondary">시간: </span>
                <span className="text-xs text-gp-gold">{editedProfile.times.join(', ')}</span>
              </div>
            )}
            
            {editedProfile.brands?.length > 0 && (
              <div>
                <span className="text-xs text-gp-text-secondary">브랜드: </span>
                <span className="text-xs text-gp-gold">{editedProfile.brands.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// 설정 모달
function SettingsModal({ onClose }) {
  const { user, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // 로컬 설정 (개인정보)
  const [localSettings, setLocalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_settings')
      return saved ? JSON.parse(saved) : { profilePublic: true, showOnline: true }
    } catch {
      localStorage.removeItem('gp_settings')
      return { profilePublic: true, showOnline: true }
    }
  })

  // 다크모드 설정
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (localStorage.getItem('gp_theme') || 'dark') === 'dark'
  })

  const handleThemeToggle = () => {
    const newDark = !isDarkMode
    setIsDarkMode(newDark)
    localStorage.setItem('gp_theme', newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }

  // 알림 설정 (서버 연동)
  const [notifSettings, setNotifSettings] = useState({
    push_enabled: true,
    friend_request: true,
    join_application: true,
    new_message: true,
    join_reminder: true,
  })
  const [loadingNotif, setLoadingNotif] = useState(true)

  // 서버에서 알림 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        const settings = await getNotificationSettings(user.id)
        setNotifSettings({
          push_enabled: settings.push_enabled ?? true,
          friend_request: settings.friend_request ?? true,
          join_application: settings.join_application ?? true,
          new_message: settings.new_message ?? true,
          join_reminder: settings.join_reminder ?? true,
        })
      }
      setLoadingNotif(false)
    }
    loadSettings()
  }, [user?.id])

  // 알림 설정 토글 (서버 실패 시 롤백)
  const handleNotifToggle = async (key) => {
    const prevSettings = { ...notifSettings }
    const newSettings = { ...notifSettings, [key]: !notifSettings[key] }
    setNotifSettings(newSettings)

    // 서버 저장
    if (user?.id) {
      try {
        await updateNotificationSettings(user.id, newSettings)
        localStorage.setItem('gp_notif_settings', JSON.stringify(newSettings))
      } catch {
        setNotifSettings(prevSettings)
        showToast.error('설정 저장에 실패했습니다')
      }
    } else {
      localStorage.setItem('gp_notif_settings', JSON.stringify(newSettings))
    }
  }

  // 로컬 설정 토글
  const handleLocalToggle = (key) => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] }
    setLocalSettings(newSettings)
    localStorage.setItem('gp_settings', JSON.stringify(newSettings))
  }

  const pushEnabled = notifSettings.push_enabled

  const notificationItems = [
    { key: 'push_enabled', label: '푸시 알림', icon: Bell, description: '앱 푸시 알림을 받습니다', isMaster: true },
    { key: 'friend_request', label: '친구 요청 알림', icon: Users, description: '새로운 친구 요청이 올 때' },
    { key: 'join_application', label: '조인 신청 알림', icon: Calendar, description: '조인 신청이 올 때' },
    { key: 'new_message', label: '메시지 알림', icon: MessageSquare, description: '새 메시지가 올 때' },
    { key: 'join_reminder', label: '라운딩 리마인더', icon: Clock, description: '라운딩 하루 전 알림' },
  ]

  const privacyItems = [
    { key: 'profilePublic', label: '프로필 공개', icon: Eye, description: '다른 사용자에게 프로필 노출' },
    { key: 'showOnline', label: '온라인 상태 표시', icon: Eye, description: '접속 중임을 표시' },
  ]

  const renderToggle = (value, onToggle, disabled = false) => (
    <button
      onClick={disabled ? undefined : onToggle}
      className={`w-12 h-7 rounded-full transition-all flex-shrink-0 ${
        disabled ? 'bg-gp-border cursor-not-allowed' :
        value ? 'bg-gp-gold' : 'bg-gp-border'
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
        value && !disabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-gp-black flex flex-col"
    >
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-gp-border bg-gp-black safe-top">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">설정</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto" style={{ paddingBottom: 'max(10rem, calc(5rem + env(safe-area-inset-bottom)))', WebkitOverflowScrolling: 'touch' }}>
        {/* 알림 설정 */}
        <h3 className="text-sm text-gp-text-secondary mb-2 px-2">알림 설정</h3>
        <div className="bg-gp-card rounded-2xl overflow-hidden mb-6">
          {loadingNotif ? (
            <div className="p-4 text-center text-gp-text-secondary text-sm">설정 불러오는 중...</div>
          ) : (
            notificationItems.map((item, index) => {
              const disabled = !item.isMaster && !pushEnabled
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-4 ${
                    index !== notificationItems.length - 1 ? 'border-b border-gp-border' : ''
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="w-5 h-5 text-gp-text-secondary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-gp-text-secondary">{item.description}</p>
                    </div>
                  </div>
                  {renderToggle(
                    notifSettings[item.key],
                    () => handleNotifToggle(item.key),
                    disabled
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 외관 설정 */}
        <h3 className="text-sm text-gp-text-secondary mb-2 px-2">외관</h3>
        <div className="bg-gp-card rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Moon className="w-5 h-5 text-gp-text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">다크 모드</p>
                <p className="text-xs text-gp-text-secondary">어두운 테마 사용</p>
              </div>
            </div>
            {renderToggle(isDarkMode, handleThemeToggle)}
          </div>
        </div>

        {/* 개인정보 설정 */}
        <h3 className="text-sm text-gp-text-secondary mb-2 px-2">개인정보 설정</h3>
        <div className="bg-gp-card rounded-2xl overflow-hidden mb-6">
          {privacyItems.map((item, index) => (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 ${
                index !== privacyItems.length - 1 ? 'border-b border-gp-border' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className="w-5 h-5 text-gp-text-secondary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gp-text-secondary">{item.description}</p>
                </div>
              </div>
              {renderToggle(
                localSettings[item.key],
                () => handleLocalToggle(item.key)
              )}
            </div>
          ))}
        </div>

        {/* 정보 */}
        <h3 className="text-sm text-gp-text-secondary mb-2 px-2">정보</h3>
        <div className="bg-gp-card rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => { onClose(); navigate('/support') }}
            className="w-full flex items-center justify-between p-4 border-b border-gp-border text-left"
          >
            <span>고객 지원</span>
            <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
          </button>
          <button
            onClick={() => { onClose(); navigate('/privacy') }}
            className="w-full flex items-center justify-between p-4 border-b border-gp-border text-left"
          >
            <span>개인정보처리방침</span>
            <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
          </button>
          <button
            onClick={() => { onClose(); navigate('/terms') }}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span>이용약관</span>
            <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
          </button>
        </div>

        {/* 계정 관리 */}
        <h3 className="text-sm text-gp-text-secondary mb-2 px-2">계정 관리</h3>
        <div className="bg-gp-card rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-gp-red"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span>계정 탈퇴</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 계정 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
          <div className="bg-gp-card rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-gp-text-secondary mb-4">
              탈퇴 시 모든 데이터(프로필, 친구, 채팅, 마커 등)가 영구 삭제되며 복구할 수 없습니다.
            </p>
            <p className="text-sm text-gp-text-secondary mb-3">
              확인을 위해 <span className="text-gp-red font-bold">"탈퇴합니다"</span>를 입력해주세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="탈퇴합니다"
              className="w-full p-3 bg-gp-black rounded-xl text-white text-sm mb-4 border border-gp-border focus:border-gp-red outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 py-3 rounded-xl bg-gp-border text-white font-medium"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmText !== '탈퇴합니다') return
                  setIsDeleting(true)
                  const { error } = await deleteAccount()
                  setIsDeleting(false)
                  if (!error) {
                    window.location.reload()
                  }
                }}
                disabled={deleteConfirmText !== '탈퇴합니다' || isDeleting}
                className={`flex-1 py-3 rounded-xl font-medium ${
                  deleteConfirmText === '탈퇴합니다' && !isDeleting
                    ? 'bg-gp-red text-white' 
                    : 'bg-gp-border/50 text-gp-text-secondary'
                }`}
              >
                {isDeleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// 차단 관리 모달
function BlockManageModal({ onClose, currentUserId }) {
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_blocked_users')
      return saved ? JSON.parse(saved) : []
    } catch {
      localStorage.removeItem('gp_blocked_users')
      return []
    }
  })
  
  const handleUnblock = async (userId) => {
    const newList = blockedUsers.filter(u => u.id !== userId)
    setBlockedUsers(newList)
    localStorage.setItem('gp_blocked_users', JSON.stringify(newList))

    // DB에서도 차단 해제
    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (isConnected() && supabase) {
        await supabase.from('blocks').delete()
          .eq('user_id', currentUserId)
          .eq('blocked_user_id', userId)
      }
    } catch (e) {
      console.error('차단 해제 DB 에러:', e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-gp-black flex flex-col"
    >
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-gp-border bg-gp-black safe-top">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">차단 관리</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-gp-text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">차단한 사용자가 없어요</h3>
            <p className="text-gp-text-secondary text-sm">
              프로필에서 차단한 사용자가 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-gp-card rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gp-text-secondary">{user.region}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="px-4 py-2 rounded-lg bg-gp-border text-sm font-medium hover:bg-gp-gold hover:text-gp-black transition-all"
                >
                  차단 해제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// 확인 모달
function ConfirmModal({ title, message, confirmText, confirmColor, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gp-card rounded-2xl p-6 mx-6 max-w-sm w-full"
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gp-text-secondary mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gp-border font-semibold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold ${
              confirmColor === 'red' 
                ? 'bg-red-500 text-white' 
                : 'btn-gold'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
