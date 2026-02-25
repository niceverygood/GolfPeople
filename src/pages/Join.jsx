import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Users, Plus, Bookmark, Trash2, Edit2, MoreVertical, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useMarker } from '../context/MarkerContext'
import PhoneVerifyModal from '../components/PhoneVerifyModal'
import MarkerConfirmModal from '../components/MarkerConfirmModal'
import MarkerIcon from '../components/icons/MarkerIcon'
import { usePhoneVerification } from '../hooks/usePhoneVerification'
import { getSimpleTimeAgo, formatJoinDate } from '../utils/formatTime'
import { STORAGE_KEYS, getItem, setItem } from '../utils/storage'
import { showToast, getErrorMessage } from '../utils/errorHandler'
import golfCourses from '../data/golfCourses.json'

// 골프장 데이터에서 지역 자동 추출
const ALL_REGIONS = (() => {
  const uniqueRegions = [...new Set(golfCourses.map(c => c.region))].sort()
  return uniqueRegions
})()

// 주요 지역 우선순위 (골프장 데이터에 실제 존재하는 것만)
const PRIORITY_REGIONS = ['서울', '경기', '인천', '부산', '제주']
const MAIN_REGIONS = ['전체', ...ALL_REGIONS.filter(r => PRIORITY_REGIONS.includes(r))]

// 기타 지역 (주요 지역 제외)
const OTHER_REGIONS = ALL_REGIONS.filter(r => !PRIORITY_REGIONS.includes(r))

// 메인 탭
const TABS = [
  { id: 'all', label: '모든 조인' },
  { id: 'participating', label: '참여중' },
  { id: 'pending', label: '신청중' },
  { id: 'my', label: '내조인' },
]

export default function Join() {
  const navigate = useNavigate()
  const { joins, savedJoins, saveJoin, unsaveJoin, myJoins, deleteMyJoin, receivedJoinRequests, joinApplications, cancelJoinApplication, currentUser } = useApp()
  const { balance, spendMarkers } = useMarker()

  // 전화번호 인증 훅
  const phoneVerify = usePhoneVerification()

  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('join_active_tab') || 'all'
  })
  const [showAllRegions, setShowAllRegions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showMarkerConfirm, setShowMarkerConfirm] = useState(null) // { userId }
  const [isProcessing, setIsProcessing] = useState(false)

  // 모든 조인 필터링
  const filteredJoins = joins.filter(join => {
    if (selectedRegion === '전체') return true
    return join.region.includes(selectedRegion)
  })
  
  // 내가 올린 조인 필터링
  const filteredMyJoins = myJoins.filter(join => {
    if (selectedRegion === '전체') return true
    return join.region.includes(selectedRegion)
  })

  // 참여중 (승인받은 조인 신청)
  const participatingApps = joinApplications.filter(app => app.status === 'accepted')
  const filteredParticipating = participatingApps.filter(app => {
    if (selectedRegion === '전체') return true
    return (app.joinRegion || '').includes(selectedRegion)
  })

  // 신청중 (대기중인 조인 신청)
  const pendingApps = joinApplications.filter(app => app.status === 'pending')
  const filteredPending = pendingApps.filter(app => {
    if (selectedRegion === '전체') return true
    return (app.joinRegion || '').includes(selectedRegion)
  })

  const handleSave = (e, joinId) => {
    e.stopPropagation()
    if (savedJoins.includes(joinId)) {
      unsaveJoin(joinId)
    } else {
      saveJoin(joinId)
    }
  }
  
  const handleDelete = (joinId) => {
    deleteMyJoin(joinId)
    setShowDeleteConfirm(null)
  }
  
  // 프로필 사진 클릭 - 마커 확인 모달 표시
  const handleProfileClick = (userId) => {
    // 전화번호 미인증 시 인증 모달 표시
    if (!phoneVerify.checkVerification()) return

    // 자기 자신이면 마이페이지로 무료 이동
    if (currentUser && String(userId) === String(currentUser.id)) {
      navigate('/profile')
      return
    }

    // 이미 본 프로필인지 확인
    const viewedProfiles = getItem(STORAGE_KEYS.VIEWED_PROFILES, [])
    if (viewedProfiles.includes(userId)) {
      // 이미 본 프로필은 무료로 이동
      navigate(`/user/${userId}`)
      return
    }

    setShowMarkerConfirm({ userId })
  }

  // 조인 상세 보기 클릭
  const handleJoinClick = (joinId) => {
    // 전화번호 미인증 시 인증 모달 표시
    if (!phoneVerify.checkVerification()) return
    navigate(`/join/${joinId}`)
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
    if (!viewedProfiles.includes(showMarkerConfirm.userId)) {
      viewedProfiles.push(showMarkerConfirm.userId)
      setItem(STORAGE_KEYS.VIEWED_PROFILES, viewedProfiles)
    }

    // 프로필 페이지로 이동
    navigate(`/user/${showMarkerConfirm.userId}`)
    setShowMarkerConfirm(null)
    setIsProcessing(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 pt-4 pb-2 safe-top">
        <h1 className="text-2xl font-bold mb-1">조인</h1>
        <p className="text-gp-text-secondary text-sm">함께 칠 라운딩을 찾아보세요</p>
      </div>
      
      {/* 메인 탭 */}
      <div className="px-4 py-2">
        <div className="flex bg-gp-card rounded-xl p-1 gap-1">
          {TABS.map((tab) => {
            const count = tab.id === 'my' ? myJoins.length
              : tab.id === 'participating' ? participatingApps.length
              : tab.id === 'pending' ? pendingApps.length
              : 0
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); sessionStorage.setItem('join_active_tab', tab.id) }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gp-gold text-gp-black'
                    : 'text-gp-text-secondary'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-gp-black/20' : 'bg-gp-border'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 지역 필터 */}
      <div className="px-6 py-2">
        <div className="flex flex-wrap gap-2">
          {/* 주요 지역 */}
          {MAIN_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedRegion === region
                  ? 'bg-gp-gold text-gp-black'
                  : 'bg-gp-card text-gp-text-secondary'
              }`}
            >
              {region}
            </button>
          ))}

          {/* 기타 지역 (더보기 시) */}
          {showAllRegions && OTHER_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedRegion === region
                  ? 'bg-gp-gold text-gp-black'
                  : 'bg-gp-card text-gp-text-secondary'
              }`}
            >
              {region}
            </button>
          ))}

          {/* 더보기/접기 버튼 */}
          <button
            onClick={() => setShowAllRegions(!showAllRegions)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gp-border text-gp-text hover:bg-gp-card transition-all"
          >
            {showAllRegions ? '접기 ▲' : '더보기 ▼'}
          </button>
        </div>
      </div>

      {/* 조인 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* 모든 조인 */}
          {activeTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {filteredJoins.length === 0 ? (
                <EmptyState message="조인이 없어요" />
              ) : (
                filteredJoins.map((join, index) => {
                  const pendingCount = receivedJoinRequests.filter(req => req.joinId === join.id && req.status === 'pending').length
                  return (
                    <JoinCard
                      key={join.id}
                      join={join}
                      index={index}
                      isSaved={savedJoins.includes(join.id)}
                      onSave={handleSave}
                      onClick={() => handleJoinClick(join.id)}
                      onProfileClick={handleProfileClick}
                      pendingCount={pendingCount}
                    />
                  )
                })
              )}
            </motion.div>
          )}
          
          {/* 참여중 (승인받은 조인) */}
          {activeTab === 'participating' && (
            <motion.div
              key="participating"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {filteredParticipating.length === 0 ? (
                <EmptyState
                  message="참여중인 조인이 없어요"
                  subMessage="조인에 신청하고 승인받으면 여기에 표시됩니다"
                />
              ) : (
                filteredParticipating.map((app, index) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    index={index}
                    onClick={() => handleJoinClick(app.joinId)}
                    variant="accepted"
                  />
                ))
              )}
            </motion.div>
          )}

          {/* 신청중 (대기중인 신청) */}
          {activeTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {filteredPending.length === 0 ? (
                <EmptyState
                  message="대기중인 신청이 없어요"
                  subMessage="조인에 신청하면 여기에 표시됩니다"
                />
              ) : (
                filteredPending.map((app, index) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    index={index}
                    onClick={() => handleJoinClick(app.joinId)}
                    onCancel={() => cancelJoinApplication(app.id)}
                    variant="pending"
                  />
                ))
              )}
            </motion.div>
          )}

          {/* 내가 올린 조인 */}
          {activeTab === 'my' && (
            <motion.div
              key="my"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {filteredMyJoins.length === 0 ? (
                <EmptyState 
                  message="올린 조인이 없어요" 
                  subMessage="새로운 조인을 만들어보세요!"
                  showButton
                  onButtonClick={() => navigate('/join/create')}
                />
              ) : (
                filteredMyJoins.map((join, index) => {
                  const pendingCount = receivedJoinRequests.filter(req => req.joinId === join.id && req.status === 'pending').length
                  return (
                    <MyJoinCard
                      key={join.id}
                      join={join}
                      index={index}
                      onDelete={() => setShowDeleteConfirm(join.id)}
                      onEdit={() => navigate(`/join/create?edit=${join.id}`)}
                      onClick={() => handleJoinClick(join.id)}
                      pendingCount={pendingCount}
                    />
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB: 조인 만들기 */}
      <Link
        to="/join/create"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full btn-gold flex items-center justify-center shadow-lg shadow-gp-gold/30"
      >
        <Plus className="w-6 h-6" />
      </Link>
      
      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gp-card rounded-2xl p-6 mx-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold mb-2">조인 삭제</h3>
              <p className="text-gp-text-secondary mb-6">
                정말 이 조인을 삭제하시겠습니까? 삭제된 조인은 복구할 수 없습니다.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-gp-border font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
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
        message="조인에 참여하려면 전화번호 인증이 필요해요."
      />
    </div>
  )
}

// 조인 카드 (모든 조인)
function JoinCard({ join, index, isSaved, onSave, onClick, onProfileClick, pendingCount = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="bg-gp-card rounded-2xl overflow-hidden cursor-pointer hover:bg-gp-border/50 transition-colors"
    >
      {/* 상단: 주최자 정보 */}
      <div className="flex items-center gap-3 p-4 border-b border-gp-border">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onProfileClick(join.hostId)
          }}
          className="relative group"
        >
          <img
            src={join.hostPhoto}
            alt={join.hostName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gp-gold transition-all"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gp-dark rounded-full flex items-center justify-center border border-gp-border">
            <MarkerIcon className="w-3 h-3" />
          </div>
        </button>
        <div className="flex-1">
          <h3 className="font-semibold">{join.title}</h3>
          <p className="text-gp-text-secondary text-sm">{join.hostName} 주최</p>
        </div>
        
        {/* 저장 버튼 */}
        <button
          onClick={(e) => onSave(e, join.id)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isSaved
              ? 'bg-gp-gold'
              : 'bg-gp-border hover:bg-gp-gold/20'
          }`}
        >
          <Bookmark 
            className={`w-4 h-4 ${
              isSaved 
                ? 'text-gp-black fill-current' 
                : 'text-gp-text-secondary'
            }`}
          />
        </button>
      </div>

      {/* 하단: 상세 정보 */}
      <div className="p-4">
        <div className="flex flex-wrap gap-4 text-sm text-gp-text-secondary mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatJoinDate(join.date)} {join.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{join.location}</span>
          </div>
        </div>

        {/* 참석자 & 자리 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(join.participants || []).slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onProfileClick(p.id)
                  }}
                  className="relative group"
                >
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="w-8 h-8 rounded-full border-2 border-gp-card object-cover group-hover:border-gp-gold transition-all"
                  />
                </button>
              ))}
            </div>
            <span className="text-sm">
              <span className="text-gp-gold font-semibold">{join.spotsFilled}</span>
              <span className="text-gp-text-secondary">/{join.spotsTotal}명</span>
            </span>
          </div>

          {/* 스타일 태그 */}
          <div className="flex gap-1">
            {(join.style || join.styles || []).slice(0, 2).map((tag) => (
              <span key={tag} className="tag text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 내가 올린 조인 카드
function MyJoinCard({ join, index, onDelete, onEdit, onClick, pendingCount = 0 }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gp-card rounded-2xl overflow-hidden"
    >
      {/* 상단: 내 조인 정보 */}
      <div className="flex items-center gap-3 p-4 border-b border-gp-border">
        <div 
          className="flex-1 cursor-pointer"
          onClick={onClick}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{join.title}</h3>
            <span className="px-2 py-0.5 rounded-full bg-gp-gold/20 text-gp-gold text-xs">
              내 조인
            </span>
          </div>
          <p className="text-gp-text-secondary text-xs mt-0.5">
            {getSimpleTimeAgo(join.createdAt)}에 생성
          </p>
        </div>
        
        {/* 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gp-border hover:bg-gp-gold/20 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gp-text-secondary" />
          </button>
          
          {/* 드롭다운 메뉴 */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-gp-dark border border-gp-border rounded-xl overflow-hidden shadow-lg min-w-[120px]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gp-card transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gp-card transition-colors text-sm text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 하단: 상세 정보 */}
      <div className="p-4 cursor-pointer" onClick={onClick}>
        <div className="flex flex-wrap gap-4 text-sm text-gp-text-secondary mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatJoinDate(join.date)} {join.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{join.location}</span>
          </div>
        </div>

        {/* 참석자 & 자리 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(join.participants || []).slice(0, 3).map((p) => (
                <img
                  key={p.id}
                  src={p.photo}
                  alt={p.name}
                  className="w-8 h-8 rounded-full border-2 border-gp-card object-cover"
                />
              ))}
            </div>
            <span className="text-sm">
              <span className="text-gp-gold font-semibold">{join.spotsFilled}</span>
              <span className="text-gp-text-secondary">/{join.spotsTotal}명</span>
            </span>
          </div>

          {/* 스타일 태그 */}
          <div className="flex gap-1">
            {(join.style || join.styles || []).slice(0, 2).map((tag) => (
              <span key={tag} className="tag text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* 신청 현황 */}
        <div className="mt-3 pt-3 border-t border-gp-border flex items-center justify-between">
          <span className="text-sm text-gp-text-secondary">
            신청 대기중: <span className="text-gp-gold font-semibold">{pendingCount}명</span>
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            join.status === 'in_progress'
              ? 'bg-gp-green/20 text-gp-green'
              : join.status === 'confirmed'
                ? 'bg-gp-blue/20 text-gp-blue'
                : join.status === 'completed'
                  ? 'bg-gp-gold/20 text-gp-gold'
                  : join.spotsFilled >= join.spotsTotal
                    ? 'bg-gp-text-secondary/20 text-gp-text-secondary'
                    : 'bg-gp-green/20 text-gp-green'
          }`}>
            {join.status === 'in_progress'
              ? '라운딩중'
              : join.status === 'confirmed'
                ? '확정'
                : join.status === 'completed'
                  ? '완료'
                  : join.spotsFilled >= join.spotsTotal
                    ? '마감'
                    : '모집중'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// 신청 카드 (참여중 / 신청중)
function ApplicationCard({ app, index, onClick, onCancel, variant }) {
  const isAccepted = variant === 'accepted'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="bg-gp-card rounded-2xl overflow-hidden cursor-pointer hover:bg-gp-border/50 transition-colors"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={app.hostPhoto || '/default-profile.png'}
            alt={app.hostName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{app.joinTitle}</h3>
            <p className="text-gp-text-secondary text-sm">{app.hostName} 주최</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            isAccepted
              ? 'bg-gp-green/20 text-gp-green'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isAccepted ? '승인됨' : '대기중'}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gp-text-secondary">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatJoinDate(app.joinDate)} {app.joinTime}</span>
          </div>
          {app.joinRegion && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{app.joinRegion}</span>
            </div>
          )}
        </div>

        {/* 신청중일 때만 취소 버튼 */}
        {!isAccepted && onCancel && (
          <div className="mt-3 pt-3 border-t border-gp-border">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('신청을 취소하시겠습니까?')) onCancel()
              }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              신청 취소
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// 빈 상태
function EmptyState({ message, subMessage, showButton, onButtonClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-gp-text-secondary" />
      </div>
      <h3 className="font-semibold mb-1">{message}</h3>
      {subMessage && (
        <p className="text-gp-text-secondary text-sm mb-4">{subMessage}</p>
      )}
      {showButton && (
        <button
          onClick={onButtonClick}
          className="px-6 py-2 btn-gold rounded-xl font-semibold"
        >
          조인 만들기
        </button>
      )}
    </div>
  )
}
