import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Calendar, MapPin, Trophy, Clock, X, UserPlus, Send, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, History, MessageCircle, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useMarker } from '../context/MarkerContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

// 메인 탭 정의
const TABS = [
  { id: 'saved', label: '관심', icon: Heart },
  { id: 'friends', label: '친구요청', icon: UserPlus },
  { id: 'applications', label: '조인신청', icon: Send },
  { id: 'matched', label: '매칭완료', icon: CheckCircle },
]

// 관심 서브탭
const SAVED_SUB_TABS = [
  { id: 'people', label: '동반자' },
  { id: 'joins', label: '조인' },
]

// 매칭완료 서브탭
const MATCHED_SUB_TABS = [
  { id: 'friends', label: '친구' },
  { id: 'joins', label: '조인' },
]

// 상태 배지 컴포넌트
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: '대기중', color: 'bg-yellow-500/20 text-yellow-400', icon: Loader },
    accepted: { label: '매칭완료', color: 'bg-gp-green/20 text-gp-green', icon: CheckCircle },
    rejected: { label: '거절됨', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  }
  
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === 'pending' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

// 섹션 컴포넌트 (내가 보낸 / 내가 받은)
function Section({ title, count, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-1"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-gp-border text-xs">
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gp-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gp-text-secondary" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Saved({ onPropose }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { loadChatRooms, startDirectChat } = useChat()
  const {
    users,
    joins,
    likedUsers,
    savedJoins,
    unlikeUser,
    unsaveJoin,
    friendRequests,
    receivedFriendRequests,
    joinApplications,
    receivedJoinRequests,
    cancelFriendRequest,
    cancelJoinApplication,
    acceptFriendRequest,
    rejectFriendRequest,
    acceptJoinRequest,
    rejectJoinRequest,
    pastCards,
    refreshFriendRequests,
    refreshJoinApplications,
  } = useApp()

  // 친구 요청 수락
  const handleAcceptFriendRequest = async (requestId) => {
    await acceptFriendRequest(requestId)
    await loadChatRooms()
  }

  // 친구 요청 거절
  const handleRejectFriendRequest = async (requestId) => {
    await rejectFriendRequest(requestId)
  }

  // 친구 요청 취소
  const handleCancelFriendRequest = async (requestId) => {
    await cancelFriendRequest(requestId)
  }

  // 조인 신청 수락
  const handleAcceptJoinRequest = async (applicationId) => {
    await acceptJoinRequest(applicationId)
    await loadChatRooms()
  }

  // 조인 신청 거절
  const handleRejectJoinRequest = async (applicationId) => {
    await rejectJoinRequest(applicationId)
  }

  // 조인 신청 취소
  const handleCancelJoinApplication = async (applicationId) => {
    await cancelJoinApplication(applicationId)
  }

  // 친구 채팅 시작 핸들러
  const handleStartFriendChat = async (request) => {
    if (request.userId) {
      const result = await startDirectChat(request.userId)
      if (result.success) {
        navigate(`/chat/${result.roomId}`)
      }
    }
  }

  // 조인 채팅 시작 핸들러
  const handleStartJoinChat = async (request, type) => {
    const targetUserId = type === 'sent' ? request.hostId : request.userId
    if (targetUserId) {
      const result = await startDirectChat(targetUserId)
      if (result.success) {
        navigate(`/chat/${result.roomId}`)
      }
    }
  }
  
  // 번호 확인 모달 상태
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInfo, setPhoneInfo] = useState({ name: '', phone: '' })
  
  // 번호 확인 핸들러
  const handleShowPhone = (info) => {
    setPhoneInfo(info)
    setShowPhoneModal(true)
  }
  
  const [activeTab, setActiveTab] = useState('saved')
  const [savedSubTab, setSavedSubTab] = useState('people')
  const [matchedSubTab, setMatchedSubTab] = useState('friends')

  // URL 파라미터에 따라 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && TABS.find(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const likedUsersList = users.filter(u => likedUsers.includes(u.id))
  const savedJoinsList = joins.filter(j => savedJoins.includes(j.id))
  
  // 친구요청 - 대기중만 (내가 보낸 + 내가 받은)
  const sentPendingFriends = friendRequests.filter(r => r.status === 'pending')
  const receivedPendingFriends = receivedFriendRequests.filter(r => r.status === 'pending')
  
  // 조인신청 - 대기중만 (내가 보낸 + 내가 받은)
  const sentPendingJoins = joinApplications.filter(a => a.status === 'pending')
  const receivedPendingJoins = receivedJoinRequests.filter(r => r.status === 'pending')
  
  // 매칭완료 - 친구 (수락된 것들)
  const matchedSentFriends = friendRequests.filter(r => r.status === 'accepted')
  const matchedReceivedFriends = receivedFriendRequests.filter(r => r.status === 'accepted')
  
  // 매칭완료 - 조인 (수락된 것들)
  const matchedSentJoins = joinApplications.filter(a => a.status === 'accepted')
  const matchedReceivedJoins = receivedJoinRequests.filter(r => r.status === 'accepted')
  
  // 탭별 총 개수
  const savedTotalCount = likedUsersList.length + savedJoinsList.length
  const friendsPendingCount = sentPendingFriends.length + receivedPendingFriends.length
  const applicationsPendingCount = sentPendingJoins.length + receivedPendingJoins.length
  const matchedTotalCount = matchedSentFriends.length + matchedReceivedFriends.length + matchedSentJoins.length + matchedReceivedJoins.length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 pt-4 pb-2 safe-top">
        <h1 className="text-2xl font-bold mb-1">저장함</h1>
        <p className="text-gp-text-secondary text-sm">관심 표시 및 신청 관리</p>
      </div>

      {/* 메인 탭 */}
      <div className="px-4 py-3">
        <div className="flex bg-gp-card rounded-xl p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            let count = 0
            if (tab.id === 'saved') count = savedTotalCount
            else if (tab.id === 'friends') count = friendsPendingCount
            else if (tab.id === 'applications') count = applicationsPendingCount
            else if (tab.id === 'matched') count = matchedTotalCount
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-0.5 ${
                  activeTab === tab.id
                    ? 'bg-gp-gold text-gp-black'
                    : 'text-gp-text-secondary'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`ml-0.5 px-1 py-0.5 rounded-full text-[9px] ${
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
      
      {/* 관심 서브탭 */}
      {activeTab === 'saved' && (
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            {SAVED_SUB_TABS.map((subTab) => {
              const count = subTab.id === 'people' ? likedUsersList.length : savedJoinsList.length
              return (
                <button
                  key={subTab.id}
                  onClick={() => setSavedSubTab(subTab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    savedSubTab === subTab.id
                      ? 'bg-gp-border text-gp-text'
                      : 'text-gp-text-secondary'
                  }`}
                >
                  {subTab.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* 매칭완료 서브탭 */}
      {activeTab === 'matched' && (
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            {MATCHED_SUB_TABS.map((subTab) => {
              const count = subTab.id === 'friends' 
                ? matchedSentFriends.length + matchedReceivedFriends.length
                : matchedSentJoins.length + matchedReceivedJoins.length
              return (
                <button
                  key={subTab.id}
                  onClick={() => setMatchedSubTab(subTab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    matchedSubTab === subTab.id
                      ? 'bg-gp-border text-gp-text'
                      : 'text-gp-text-secondary'
                  }`}
                >
                  {subTab.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* 관심 탭 */}
          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {savedSubTab === 'people' && (
                <>
                  {likedUsersList.length === 0 ? (
                    <EmptyState
                      icon={<Heart className="w-12 h-12 text-gp-text-secondary" />}
                      title="저장한 동반자가 없어요"
                      description="홈에서 마음에 드는 골퍼를 저장해보세요"
                    />
                  ) : (
                    likedUsersList.map((user) => (
                      <SavedUserCard
                        key={user.id}
                        user={user}
                        onRemove={() => unlikeUser(user.id)}
                        onPropose={() => onPropose(user)}
                      />
                    ))
                  )}
                </>
              )}
              
              {savedSubTab === 'joins' && (
                <>
                  {savedJoinsList.length === 0 ? (
                    <EmptyState
                      icon={<Calendar className="w-12 h-12 text-gp-text-secondary" />}
                      title="저장한 조인이 없어요"
                      description="조인 탭에서 관심있는 라운딩을 저장해보세요"
                    />
                  ) : (
                    savedJoinsList.map((join) => (
                      <SavedJoinCard
                        key={join.id}
                        join={join}
                        onRemove={() => unsaveJoin(join.id)}
                        onClick={() => navigate(`/join/${join.id}`)}
                      />
                    ))
                  )}
                </>
              )}
            </motion.div>
          )}
          
          {/* 친구요청 탭 (대기중만) */}
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* 내가 받은 */}
              <Section
                title="📥 내가 받은"
                count={receivedPendingFriends.length}
                defaultOpen={true}
              >
                {receivedPendingFriends.length === 0 ? (
                  <p className="text-center text-gp-text-secondary text-sm py-4">
                    받은 요청이 없어요
                  </p>
                ) : (
                  receivedPendingFriends.map((request) => (
                    <ReceivedFriendCard
                      key={request.id}
                      request={request}
                      onAccept={() => handleAcceptFriendRequest(request.id)}
                      onReject={() => handleRejectFriendRequest(request.id)}
                      onProfileClick={(userId) => navigate(`/user/${userId}`)}
                    />
                  ))
                )}
              </Section>

              {/* 내가 보낸 */}
              <Section
                title="📤 내가 보낸"
                count={sentPendingFriends.length}
                defaultOpen={true}
              >
                {sentPendingFriends.length === 0 ? (
                  <p className="text-center text-gp-text-secondary text-sm py-4">
                    보낸 요청이 없어요
                  </p>
                ) : (
                  sentPendingFriends.map((request) => (
                    <SentFriendCard
                      key={request.id}
                      request={request}
                      onCancel={() => handleCancelFriendRequest(request.id)}
                      onProfileClick={(userId) => navigate(`/user/${userId}`)}
                    />
                  ))
                )}
              </Section>
            </motion.div>
          )}
          
          {/* 조인신청 탭 (대기중만) */}
          {activeTab === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* 내가 받은 */}
              <Section
                title="📥 내가 받은"
                count={receivedPendingJoins.length}
                defaultOpen={true}
              >
                {receivedPendingJoins.length === 0 ? (
                  <p className="text-center text-gp-text-secondary text-sm py-4">
                    받은 신청이 없어요
                  </p>
                ) : (
                  receivedPendingJoins.map((request) => (
                    <ReceivedJoinCard
                      key={request.id}
                      request={request}
                      onAccept={() => handleAcceptJoinRequest(request.id)}
                      onReject={() => handleRejectJoinRequest(request.id)}
                      onProfileClick={(userId) => navigate(`/user/${userId}`)}
                    />
                  ))
                )}
              </Section>

              {/* 내가 보낸 */}
              <Section
                title="📤 내가 보낸"
                count={sentPendingJoins.length}
                defaultOpen={true}
              >
                {sentPendingJoins.length === 0 ? (
                  <p className="text-center text-gp-text-secondary text-sm py-4">
                    보낸 신청이 없어요
                  </p>
                ) : (
                  sentPendingJoins.map((application) => (
                    <SentJoinCard
                      key={application.id}
                      application={application}
                      onCancel={() => handleCancelJoinApplication(application.id)}
                      onClick={() => navigate(`/join/${application.joinId}`)}
                    />
                  ))
                )}
              </Section>
            </motion.div>
          )}
          
          {/* 매칭완료 탭 */}
          {activeTab === 'matched' && (
            <motion.div
              key={`matched-${matchedSubTab}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* 친구 서브탭 */}
              {matchedSubTab === 'friends' && (
                <>
                  {matchedSentFriends.length + matchedReceivedFriends.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle className="w-12 h-12 text-gp-text-secondary" />}
                      title="매칭된 친구가 없어요"
                      description="친구 요청이 수락되면 여기에 표시됩니다"
                    />
                  ) : (
                    <>
                      {/* 내가 받은 친구 (수락한) */}
                      {matchedReceivedFriends.length > 0 && (
                        <Section
                          title="📥 내가 수락한"
                          count={matchedReceivedFriends.length}
                          defaultOpen={true}
                        >
                          {matchedReceivedFriends.map((request) => (
                            <MatchedFriendCard
                              key={request.id}
                              request={request}
                              onProfileClick={(userId) => navigate(`/user/${userId}`)}
                              onStartChat={() => handleStartFriendChat(request)}
                            />
                          ))}
                        </Section>
                      )}

                      {/* 내가 보낸 친구 (수락받은) */}
                      {matchedSentFriends.length > 0 && (
                        <Section
                          title="📤 내가 보낸 (수락됨)"
                          count={matchedSentFriends.length}
                          defaultOpen={true}
                        >
                          {matchedSentFriends.map((request) => (
                            <MatchedFriendCard
                              key={request.id}
                              request={request}
                              onProfileClick={(userId) => navigate(`/user/${userId}`)}
                              onStartChat={() => handleStartFriendChat(request)}
                            />
                          ))}
                        </Section>
                      )}
                    </>
                  )}
                </>
              )}
              
              {/* 조인 서브탭 */}
              {matchedSubTab === 'joins' && (
                <>
                  {matchedSentJoins.length + matchedReceivedJoins.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle className="w-12 h-12 text-gp-text-secondary" />}
                      title="매칭된 조인이 없어요"
                      description="조인 신청이 수락되면 여기에 표시됩니다"
                    />
                  ) : (
                    <>
                      {/* 내가 받은 조인 (수락한) */}
                      {matchedReceivedJoins.length > 0 && (
                        <Section 
                          title="📥 내가 수락한" 
                          count={matchedReceivedJoins.length}
                          defaultOpen={true}
                        >
                          {matchedReceivedJoins.map((request) => (
                            <MatchedJoinCard
                              key={request.id}
                              request={request}
                              type="received"
                              onProfileClick={(userId) => navigate(`/user/${userId}`)}
                              onShowPhone={handleShowPhone}
                            />
                          ))}
                        </Section>
                      )}
                      
                      {/* 내가 보낸 조인 (수락받은) */}
                      {matchedSentJoins.length > 0 && (
                        <Section 
                          title="📤 내가 신청한 (수락됨)" 
                          count={matchedSentJoins.length}
                          defaultOpen={true}
                        >
                          {matchedSentJoins.map((application) => (
                            <MatchedJoinCard
                              key={application.id}
                              request={application}
                              type="sent"
                              onClick={() => navigate(`/join/${application.joinId}`)}
                              onProfileClick={(userId) => navigate(`/user/${userId}`)}
                              onShowPhone={handleShowPhone}
                            />
                          ))}
                        </Section>
                      )}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 번호 확인 모달 */}
      <AnimatePresence>
        {showPhoneModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowPhoneModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-gp-card rounded-2xl p-6 z-50"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gp-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gp-gold" />
                </div>
                <h3 className="text-lg font-bold mb-2">{phoneInfo.name}님의 연락처</h3>
                <p className="text-gp-text-secondary text-sm mb-4">
                  매칭된 조인 멤버의 연락처입니다
                </p>
                
                <div className="bg-gp-black/30 rounded-xl p-4 mb-6">
                  <p className="text-2xl font-bold text-gp-gold tracking-wider">
                    {phoneInfo.phone}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPhoneModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
                  >
                    닫기
                  </button>
                  <a
                    href={`tel:${phoneInfo.phone.replace(/-/g, '')}`}
                    className="flex-1 py-3 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    전화걸기
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// 관심 유저 카드
function SavedUserCard({ user, onRemove, onPropose }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl overflow-hidden"
    >
      <div className="flex">
        <div className="w-28 h-36 flex-shrink-0">
          <img
            src={user.photos[0]}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg">{user.name}, {user.age}</h3>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="w-6 h-6 rounded-full bg-gp-border flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gp-text-secondary" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-gp-text-secondary text-sm mb-2">
              <MapPin className="w-3 h-3" />
              <span>{user.region}</span>
              <Trophy className="w-3 h-3 ml-1" />
              <span>{user.handicap}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {user.style.slice(0, 2).map((tag) => (
                <span key={tag} className="tag text-xs py-0.5 px-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onPropose}
            className="w-full py-2 rounded-xl btn-gold text-sm font-semibold"
          >
            라운딩 제안
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// 저장된 조인 카드
function SavedJoinCard({ join, onRemove, onClick }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="flex">
        <div className="w-28 h-36 flex-shrink-0">
          <img
            src={join.hostPhoto}
            alt={join.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold">{join.title}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="w-6 h-6 rounded-full bg-gp-border flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gp-text-secondary" />
              </button>
            </div>

            <div className="text-gp-text-secondary text-sm space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{join.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{join.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gp-text-secondary">
              {join.spotsFilled}/{join.spotsTotal}명 참여
            </span>
            <span className="tag text-xs py-0.5 px-2">
              {join.spotsTotal - join.spotsFilled}자리 남음
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 내가 보낸 친구 요청 카드 (대기중)
function SentFriendCard({ request, onCancel, onProfileClick }) {
  const timeAgo = getTimeAgo(request.createdAt)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onProfileClick && onProfileClick(request.userId)}
          className="flex-shrink-0"
        >
          <img
            src={request.userPhoto}
            alt={request.userName}
            className="w-14 h-14 rounded-xl object-cover hover:ring-2 hover:ring-gp-gold transition-all"
          />
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold">{request.userName}</h3>
              <div className="flex items-center gap-2 text-gp-text-secondary text-xs mt-0.5">
                <span>{request.userRegion}</span>
                <span>·</span>
                <span>{request.userHandicap}</span>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>
          
          <p className="text-gp-text-secondary text-xs mt-1">{timeAgo}</p>
        </div>
      </div>
      
      {request.message && (
        <div className="mt-3 p-3 bg-gp-black/30 rounded-lg">
          <p className="text-sm text-gp-text">"{request.message}"</p>
        </div>
      )}
      
      {request.status === 'pending' && (
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 rounded-xl bg-gp-border text-gp-text-secondary text-sm font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          요청 취소
        </button>
      )}
    </motion.div>
  )
}

// 내가 받은 친구 요청 카드 (대기중)
function ReceivedFriendCard({ request, onAccept, onReject, onProfileClick }) {
  const timeAgo = getTimeAgo(request.createdAt)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onProfileClick && onProfileClick(request.userId)}
          className="flex-shrink-0"
        >
          <img
            src={request.userPhoto}
            alt={request.userName}
            className="w-14 h-14 rounded-xl object-cover hover:ring-2 hover:ring-gp-gold transition-all"
          />
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold">{request.userName}</h3>
              <div className="flex items-center gap-2 text-gp-text-secondary text-xs mt-0.5">
                <span>{request.userRegion}</span>
                <span>·</span>
                <span>{request.userHandicap}</span>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>
          
          <p className="text-gp-text-secondary text-xs mt-1">{timeAgo}</p>
        </div>
      </div>
      
      {request.message && (
        <div className="mt-3 p-3 bg-gp-black/30 rounded-lg">
          <p className="text-sm text-gp-text">"{request.message}"</p>
        </div>
      )}
      
      {request.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl bg-gp-border text-gp-text-secondary text-sm font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            거절
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2 rounded-xl btn-gold text-sm font-semibold"
          >
            수락
          </button>
        </div>
      )}
    </motion.div>
  )
}

// 매칭완료 친구 카드
function MatchedFriendCard({ request, onProfileClick, onStartChat }) {
  const timeAgo = getTimeAgo(request.createdAt)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onProfileClick && onProfileClick(request.userId)}
          className="flex-shrink-0"
        >
          <img
            src={request.userPhoto}
            alt={request.userName}
            className="w-14 h-14 rounded-xl object-cover border-2 border-gp-green hover:ring-2 hover:ring-gp-gold transition-all"
          />
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold">{request.userName}</h3>
              <div className="flex items-center gap-2 text-gp-text-secondary text-xs mt-0.5">
                <span>{request.userRegion}</span>
                <span>·</span>
                <span>{request.userHandicap}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gp-green/20 text-gp-green">
              <CheckCircle className="w-3 h-3" />
              매칭됨
            </span>
          </div>
          
          <p className="text-gp-text-secondary text-xs mt-1">{timeAgo}</p>
        </div>
      </div>
      
      <button
        onClick={() => onStartChat && onStartChat()}
        className="w-full mt-4 py-3 rounded-xl btn-gold text-sm font-semibold flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        대화 시작하기
      </button>
    </motion.div>
  )
}

// 내가 보낸 조인 신청 카드 (대기중)
function SentJoinCard({ application, onCancel, onClick }) {
  const timeAgo = getTimeAgo(application.createdAt)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {application.hostPhoto && (
            <img
              src={application.hostPhoto}
              alt={application.hostName}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold">{application.joinTitle}</h3>
            <p className="text-gp-text-secondary text-sm">{application.hostName || '호스트'}</p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gp-text-secondary mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{application.joinDate}</span>
        </div>
        {application.joinTime && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{application.joinTime}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{application.joinRegion}</span>
        </div>
      </div>
      
      {application.message && (
        <p className="text-sm text-gp-text bg-gp-black/30 rounded-lg p-3 mb-3">
          "{application.message}"
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-gp-text-secondary text-xs">{timeAgo}</p>
        
        {application.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            className="px-4 py-1.5 rounded-lg bg-gp-border text-gp-text-secondary text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            신청 취소
          </button>
        )}
      </div>
    </motion.div>
  )
}

// 내가 받은 조인 신청 카드 (대기중)
function ReceivedJoinCard({ request, onAccept, onReject, onProfileClick }) {
  const timeAgo = getTimeAgo(request.createdAt)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onProfileClick && onProfileClick(request.userId)}
            className="flex-shrink-0"
          >
            <img
              src={request.userPhoto}
              alt={request.userName}
              className="w-12 h-12 rounded-xl object-cover hover:ring-2 hover:ring-gp-gold transition-all"
            />
          </button>
          <div>
            <h3 className="font-semibold">{request.userName}</h3>
            <div className="flex items-center gap-2 text-gp-text-secondary text-xs">
              <span>{request.userRegion}</span>
              <span>·</span>
              <span>{request.userHandicap}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>
      
      <div className="bg-gp-black/30 rounded-lg p-3 mb-3">
        <p className="text-xs text-gp-text-secondary mb-1">신청한 조인</p>
        <p className="font-medium">{request.joinTitle}</p>
      </div>
      
      {request.message && (
        <p className="text-sm text-gp-text bg-gp-black/30 rounded-lg p-3 mb-3">
          "{request.message}"
        </p>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <p className="text-gp-text-secondary text-xs">{timeAgo}</p>
      </div>
      
      {request.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl bg-gp-border text-gp-text-secondary text-sm font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            거절
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2 rounded-xl btn-gold text-sm font-semibold"
          >
            수락
          </button>
        </div>
      )}
    </motion.div>
  )
}

// 매칭완료 조인 카드
function MatchedJoinCard({ request, type, onClick, onProfileClick, onShowPhone }) {
  const timeAgo = getTimeAgo(request.createdAt)
  
  // 더미 전화번호 (실제로는 서버에서 받아와야 함)
  const partnerPhone = type === 'sent' 
    ? request.hostPhone || '010-1234-5678' 
    : request.userPhone || '010-9876-5432'
  const partnerName = type === 'sent' ? request.hostName : request.userName
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gp-card rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              const userId = type === 'sent' ? request.hostId : request.userId
              onProfileClick && onProfileClick(userId)
            }}
            className="flex-shrink-0"
          >
            <img
              src={type === 'sent' ? request.hostPhoto : request.userPhoto}
              alt={type === 'sent' ? request.hostName : request.userName}
              className="w-12 h-12 rounded-xl object-cover border-2 border-gp-green hover:ring-2 hover:ring-gp-gold transition-all"
            />
          </button>
          <div>
            <h3 className="font-semibold">
              {type === 'sent' ? request.joinTitle : request.userName}
            </h3>
            <p className="text-gp-text-secondary text-sm">
              {type === 'sent' ? request.hostName : request.joinTitle}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gp-green/20 text-gp-green">
          <CheckCircle className="w-3 h-3" />
          {type === 'sent' ? '참가 확정' : '수락됨'}
        </span>
      </div>

      {type === 'sent' && (
        <div className="flex items-center gap-4 text-sm text-gp-text-secondary mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{request.joinDate}</span>
          </div>
          {request.joinTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{request.joinTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{request.joinRegion}</span>
          </div>
        </div>
      )}
      
      <p className="text-gp-text-secondary text-xs">{timeAgo}</p>
      
      <button 
        onClick={() => onShowPhone && onShowPhone({ name: partnerName, phone: partnerPhone })}
        className="w-full mt-4 py-3 rounded-xl btn-gold text-sm font-semibold flex items-center justify-center gap-2"
      >
        <Phone className="w-4 h-4" />
        번호 확인
      </button>
    </motion.div>
  )
}

// 빈 상태
function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gp-text-secondary text-sm">{description}</p>
    </div>
  )
}

// 시간 계산
function getTimeAgo(dateString) {
  if (!dateString) return '알 수 없음'

  const now = new Date()
  const date = new Date(dateString)

  // Invalid Date 처리
  if (isNaN(date.getTime())) return '알 수 없음'

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
