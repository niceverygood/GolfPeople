import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, MapPin, Trophy, Clock, Settings, ChevronRight, LogOut, 
  Shield, Edit2, X, Bell, Eye, Moon, Trash2, ChevronLeft
} from 'lucide-react'
import { useApp } from '../context/AppContext'

// 지역 옵션
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주']

// 핸디캡 옵션
const HANDICAPS = ['100대', '90대 초반', '90대 후반', '80대', '싱글']

// 스타일 옵션
const STYLE_OPTIONS = ['카트 선호', '도보 가능', '빠르게', '여유롭게', '내기 OK', '내기 X', '초보 환영', '맥주 한잔']

// 시간 옵션
const TIME_OPTIONS = ['주말 오전', '주말 오후', '평일 오전', '평일 오후', '상관없음']

export default function Profile() {
  const { currentUser, proposals } = useApp()
  const [profile, setProfile] = useState(null)
  
  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const savedProfile = localStorage.getItem('gp_profile')
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [])

  const stats = [
    { label: '관심받음', value: 23 },
    { label: '라운딩 제안', value: proposals.length },
    { label: '완료 라운딩', value: 0 },
  ]

  const menuItems = [
    { icon: Edit2, label: '프로필 수정', action: () => setShowEditModal(true) },
    { icon: Settings, label: '설정', action: () => setShowSettingsModal(true) },
    { icon: Shield, label: '차단 관리', action: () => setShowBlockModal(true) },
    { icon: LogOut, label: '로그아웃', action: () => setShowLogoutConfirm(true) },
  ]
  
  const handleLogout = () => {
    localStorage.removeItem('gp_onboarded')
    localStorage.removeItem('gp_profile')
    localStorage.removeItem('gp_revealed_cards')
    window.location.reload()
  }
  
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
    localStorage.setItem('gp_profile', JSON.stringify(updatedProfile))
    setShowEditModal(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-24">
      {/* 헤더 배경 */}
      <div className="relative h-40 bg-gradient-to-br from-gp-gold/20 to-gp-green-dark/20">
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
              {profile?.photo ? (
                <img
                  src={profile.photo}
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
              {currentUser.name || '닉네임 설정'}
            </h2>

            {/* 지역 & 핸디캡 */}
            {profile && (
              <div className="flex items-center gap-4 text-gp-text-secondary text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.region}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>{profile.handicap}</span>
                </div>
              </div>
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

          {/* 가능 시간 */}
          {profile?.time && (
            <div className="flex items-center justify-center gap-1 text-gp-text-secondary text-sm">
              <Clock className="w-4 h-4" />
              <span>{profile.time}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* 통계 */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gp-card rounded-2xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-gp-gold mb-1">{stat.value}</p>
              <p className="text-gp-text-secondary text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 보낸 제안 */}
      {proposals.length > 0 && (
        <div className="px-6 mt-6">
          <h3 className="font-semibold mb-3">보낸 라운딩 제안</h3>
          <div className="space-y-2">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-gp-card rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{proposal.userName}</p>
                  <p className="text-gp-text-secondary text-sm">
                    {proposal.datePreference} · {proposal.region}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  proposal.status === 'pending'
                    ? 'bg-gp-gold/20 text-gp-gold'
                    : proposal.status === 'accepted'
                    ? 'bg-gp-green/20 text-gp-green'
                    : 'bg-gp-red/20 text-gp-red'
                }`}>
                  {proposal.status === 'pending' ? '대기중' : 
                   proposal.status === 'accepted' ? '수락됨' : '거절됨'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <div className="px-6 mt-6">
        <div className="bg-gp-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 hover:bg-gp-border/50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gp-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${
                  item.label === '로그아웃' ? 'text-gp-red' : 'text-gp-text-secondary'
                }`} />
                <span className={item.label === '로그아웃' ? 'text-gp-red' : ''}>
                  {item.label}
                </span>
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
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEditModal(false)}
            onSave={handleProfileUpdate}
          />
        )}
      </AnimatePresence>
      
      {/* 설정 모달 */}
      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal onClose={() => setShowSettingsModal(false)} />
        )}
      </AnimatePresence>
      
      {/* 차단 관리 모달 */}
      <AnimatePresence>
        {showBlockModal && (
          <BlockManageModal onClose={() => setShowBlockModal(false)} />
        )}
      </AnimatePresence>
      
      {/* 로그아웃 확인 모달 */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <ConfirmModal
            title="로그아웃"
            message="정말 로그아웃 하시겠습니까?"
            confirmText="로그아웃"
            confirmColor="red"
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// 프로필 수정 모달
function EditProfileModal({ profile, onClose, onSave }) {
  const [editedProfile, setEditedProfile] = useState(profile || {
    photo: '',
    region: '',
    handicap: '',
    styles: [],
    time: '',
  })
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, photo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const toggleStyle = (style) => {
    const styles = editedProfile.styles || []
    if (styles.includes(style)) {
      setEditedProfile({ ...editedProfile, styles: styles.filter(s => s !== style) })
    } else if (styles.length < 5) {
      setEditedProfile({ ...editedProfile, styles: [...styles, style] })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gp-black"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gp-border">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">프로필 수정</h2>
        <button 
          onClick={() => onSave(editedProfile)}
          className="text-gp-gold font-semibold"
        >
          저장
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-60px)] pb-20">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {editedProfile.photo ? (
              <img
                src={editedProfile.photo}
                alt="프로필"
                className="w-28 h-28 rounded-full object-cover border-4 border-gp-gold"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gp-card flex items-center justify-center border-4 border-gp-gold">
                <Camera className="w-10 h-10 text-gp-text-secondary" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gp-gold flex items-center justify-center cursor-pointer">
              <Camera className="w-5 h-5 text-gp-black" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                className="hidden" 
              />
            </label>
          </div>
          <p className="text-gp-text-secondary text-sm mt-2">사진 변경</p>
        </div>
        
        {/* 지역 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">지역</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setEditedProfile({ ...editedProfile, region })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.region === region
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        {/* 핸디캡 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">실력 (핸디캡)</label>
          <div className="flex flex-wrap gap-2">
            {HANDICAPS.map((handicap) => (
              <button
                key={handicap}
                onClick={() => setEditedProfile({ ...editedProfile, handicap })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.handicap === handicap
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary'
                }`}
              >
                {handicap}
              </button>
            ))}
          </div>
        </div>
        
        {/* 스타일 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">
            라운딩 스타일 (최대 5개)
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.styles?.includes(style)
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {/* 선호 시간 */}
        <div className="mb-6">
          <label className="block text-sm text-gp-text-secondary mb-2">선호 시간</label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => setEditedProfile({ ...editedProfile, time })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.time === time
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-card text-gp-text-secondary'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 설정 모달
function SettingsModal({ onClose }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('gp_settings')
    return saved ? JSON.parse(saved) : {
      pushNotification: true,
      matchNotification: true,
      messageNotification: true,
      profilePublic: true,
      showOnline: true,
      darkMode: true,
    }
  })
  
  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    localStorage.setItem('gp_settings', JSON.stringify(newSettings))
  }
  
  const settingItems = [
    { key: 'pushNotification', label: '푸시 알림', icon: Bell, description: '앱 알림을 받습니다' },
    { key: 'matchNotification', label: '매칭 알림', icon: Bell, description: '새로운 추천이 있을 때 알림' },
    { key: 'messageNotification', label: '메시지 알림', icon: Bell, description: '새 메시지 알림' },
    { key: 'profilePublic', label: '프로필 공개', icon: Eye, description: '다른 사용자에게 프로필 노출' },
    { key: 'showOnline', label: '온라인 상태 표시', icon: Eye, description: '접속 중임을 표시' },
    { key: 'darkMode', label: '다크 모드', icon: Moon, description: '어두운 테마 사용' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gp-black"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gp-border">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">설정</h2>
        <div className="w-10" />
      </div>
      
      <div className="p-4 overflow-y-auto">
        <div className="bg-gp-card rounded-2xl overflow-hidden">
          {settingItems.map((item, index) => (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 ${
                index !== settingItems.length - 1 ? 'border-b border-gp-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gp-text-secondary" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gp-text-secondary">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-7 rounded-full transition-all ${
                  settings[item.key] ? 'bg-gp-gold' : 'bg-gp-border'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
        
        {/* 계정 관리 */}
        <div className="mt-6">
          <h3 className="text-sm text-gp-text-secondary mb-2 px-2">계정 관리</h3>
          <div className="bg-gp-card rounded-2xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 border-b border-gp-border">
              <span>비밀번호 변경</span>
              <ChevronRight className="w-5 h-5 text-gp-text-secondary" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-gp-red">
              <span>계정 탈퇴</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 차단 관리 모달
function BlockManageModal({ onClose }) {
  const [blockedUsers, setBlockedUsers] = useState(() => {
    const saved = localStorage.getItem('gp_blocked_users')
    return saved ? JSON.parse(saved) : []
  })
  
  const handleUnblock = (userId) => {
    const newList = blockedUsers.filter(u => u.id !== userId)
    setBlockedUsers(newList)
    localStorage.setItem('gp_blocked_users', JSON.stringify(newList))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gp-black"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gp-border">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">차단 관리</h2>
        <div className="w-10" />
      </div>
      
      <div className="p-4">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
