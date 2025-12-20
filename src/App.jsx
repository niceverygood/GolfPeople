import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Pages
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Join from './pages/Join'
import JoinDetail from './pages/JoinDetail'
import CreateJoin from './pages/CreateJoin'
import Saved from './pages/Saved'
import Profile from './pages/Profile'
import ProfileDetail from './pages/ProfileDetail'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import PhoneVerification from './pages/PhoneVerification'

// Components
import TabBar from './components/TabBar'
import ProposalModal from './components/ProposalModal'

// Context
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// 메인 앱 콘텐츠 (AuthProvider 내부에서 사용)
function AppContent() {
  const location = useLocation()
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  
  const [showSplash, setShowSplash] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [proposalModal, setProposalModal] = useState({ open: false, user: null })

  // 전화번호 인증 여부
  const isPhoneVerified = profile?.phone_verified === true

  useEffect(() => {
    // 스플래시 화면 2초 후 종료
    const timer = setTimeout(() => setShowSplash(false), 2000)
    
    // 온보딩 여부 체크 (로컬스토리지)
    const onboarded = localStorage.getItem('gp_onboarded')
    if (onboarded) setIsOnboarded(true)
    
    return () => clearTimeout(timer)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('gp_onboarded', 'true')
    setIsOnboarded(true)
  }

  const openProposalModal = (user) => {
    setProposalModal({ open: true, user })
  }

  const closeProposalModal = () => {
    setProposalModal({ open: false, user: null })
  }

  // 1. 스플래시 화면
  if (showSplash) {
    return <Splash />
  }

  // 2. 인증 로딩 중
  if (authLoading) {
    return <Splash /> // 로딩 중에도 스플래시 표시
  }

  // 3. 로그인 안 되어 있으면 로그인 화면 (콜백 페이지 제외)
  if (!isAuthenticated && location.pathname !== '/auth/callback') {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </AnimatePresence>
    )
  }

  // 4. 로그인 후 전화번호 인증 (인증 안 된 사용자만)
  // phone-verify 경로이거나, 전화번호 인증 안 된 경우
  if (location.pathname === '/phone-verify' || (!isPhoneVerified && isAuthenticated)) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="*" element={<PhoneVerification />} />
        </Routes>
      </AnimatePresence>
    )
  }

  // 5. 전화번호 인증 후 온보딩 (처음 사용자만)
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // 6. 메인 앱
  // 탭바 표시 여부
  const showTabBar = ['/', '/join', '/saved', '/profile'].includes(location.pathname)

  return (
    <AppProvider>
      <div className="app-container">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home onPropose={openProposalModal} />} />
            <Route path="/join" element={<Join />} />
            <Route path="/join/create" element={<CreateJoin />} />
            <Route path="/join/:id" element={<JoinDetail />} />
            <Route path="/saved" element={<Saved onPropose={openProposalModal} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:userId" element={<ProfileDetail />} />
            <Route path="/phone-verify" element={<PhoneVerification />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AnimatePresence>

        {showTabBar && <TabBar />}

        <ProposalModal
          isOpen={proposalModal.open}
          user={proposalModal.user}
          onClose={closeProposalModal}
        />
      </div>
    </AppProvider>
  )
}

// 앱 최상위 - AuthProvider로 감싸기
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
