import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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

// Components
import TabBar from './components/TabBar'
import ProposalModal from './components/ProposalModal'

// Context
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [proposalModal, setProposalModal] = useState({ open: false, user: null })

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

  // 스플래시 화면
  if (showSplash) {
    return <Splash />
  }

  // 온보딩 화면
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // 탭바 표시 여부
  const showTabBar = ['/', '/join', '/saved', '/profile'].includes(location.pathname)

  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App

