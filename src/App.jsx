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
import AuthCallbackNative from './pages/AuthCallbackNative'
import PhoneVerification from './pages/PhoneVerification'
import Store from './pages/Store'
import ScoreRecord from './pages/ScoreRecord'
import ScoreStats from './pages/ScoreStats'
import ChatList from './pages/ChatList'
import ChatRoom from './pages/ChatRoom'
import Friends from './pages/Friends'
import Review from './pages/Review'
import RoundingHistory from './pages/RoundingHistory'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Support from './pages/Support'

// Components
import TabBar from './components/TabBar'
import ToastContainer from './components/ToastContainer'
import OfflineBanner from './components/OfflineBanner'

// Context
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MarkerProvider } from './context/MarkerContext'
import { ChatProvider } from './context/ChatContext'

// Native
import { initializeNative, isNative, app, haptic } from './lib/native'
import { initializePush } from './lib/pushService'
import { initializeIAP, setUserId as setIAPUserId } from './lib/iap'
import { supabase } from './lib/supabase'

// 공개 페이지 (인증 없이 접근 가능)
const PUBLIC_PATHS = ['/privacy', '/terms', '/support']
const PUBLIC_COMPONENTS = {
  '/privacy': Privacy,
  '/terms': Terms,
  '/support': Support,
}

// 인증이 필요한 라우트를 보호하는 컴포넌트
function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/callback/native" element={<AuthCallbackNative />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return children
}

// 메인 앱 콘텐츠 (AuthProvider 내부에서 사용)
function AppContent() {
  const location = useLocation()
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()

  const [showSplash, setShowSplash] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  useEffect(() => {
    // 저장된 테마 복원
    const theme = localStorage.getItem('gp_theme') || 'dark'
    if (theme === 'light') document.documentElement.classList.add('light')

    // 네이티브 기능 초기화
    initializeNative()
    // 인앱 결제 초기화 (게스트 모드로 우선 초기화)
    initializeIAP()
    
    // 스플래시 화면 2초 후 종료
    const timer = setTimeout(() => setShowSplash(false), 2000)
    
    // 온보딩 여부 체크 (로컬스토리지)
    const onboarded = localStorage.getItem('gp_onboarded')
    if (onboarded) setIsOnboarded(true)
    
    // 전화번호 인증 여부 체크 (Supabase 또는 로컬스토리지)
    const phoneVerified = localStorage.getItem('gp_phone_verified')
    if (phoneVerified || profile?.phone_verified) {
      setIsPhoneVerified(true)
    }
    
    // Android 뒤로가기 버튼 처리
    const unsubscribeBackButton = app.onBackButton(({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      }
    })

    // 딥링크 처리 (OAuth 콜백)
    const unsubscribeAppUrlOpen = app.onAppUrlOpen(async ({ url }) => {
      console.log('Deep link received:', url)

      // OAuth 콜백 URL인지 확인
      if (url.includes('auth/callback')) {
        try {
          // 브라우저 닫기 (OAuth 완료)
          try {
            const { Browser } = await import('@capacitor/browser')
            await Browser.close()
          } catch (browserErr) {
            console.log('Browser close skipped:', browserErr)
          }

          // URL에서 토큰 추출
          const urlObj = new URL(url)
          const params = new URLSearchParams(urlObj.search || urlObj.hash?.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && supabase) {
            console.log('Setting session from deep link...')
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })

            if (error) {
              console.error('Failed to set session:', error)
            } else {
              console.log('Session set successfully from deep link')
            }
          }
        } catch (e) {
          console.error('Deep link handling error:', e)
        }
      }
    })

    return () => {
      clearTimeout(timer)
      if (typeof unsubscribeBackButton === 'function') {
        unsubscribeBackButton()
      }
      if (typeof unsubscribeAppUrlOpen === 'function') {
        unsubscribeAppUrlOpen()
      }
    }
  }, [profile])

  // DB 프로필 기반 온보딩 상태 자동 감지
  // profile이 로드되었고, regions/handicap이 이미 있으면 온보딩 완료로 처리
  useEffect(() => {
    if (profile && !isOnboarded) {
      const hasRegions = profile.regions && profile.regions.length > 0
      const hasHandicap = !!profile.handicap
      if (hasRegions && hasHandicap) {
        console.log('프로필에 이미 정보가 있어 온보딩 건너뜀')
        localStorage.setItem('gp_onboarded', 'true')
        setIsOnboarded(true)
      }
    }
  }, [profile, isOnboarded])
  
  // 로그인 후 푸시 및 인앱결제 사용자 식별자 설정
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializePush(user.id)
      setIAPUserId(user.id)
    }
  }, [isAuthenticated, user?.id])

  const handleOnboardingComplete = () => {
    localStorage.setItem('gp_onboarded', 'true')
    setIsOnboarded(true)
  }

  // 1. 스플래시 화면
  if (showSplash) {
    return <Splash />
  }

  // 2. 인증 로딩 중
  if (authLoading) {
    return <Splash /> // 로딩 중에도 스플래시 표시
  }

  // 2.5. 로그인됐지만 프로필 아직 로딩 중 — 온보딩 판단 전 대기
  if (isAuthenticated && !profile && !isOnboarded) {
    return <Splash />
  }

  // 3. 공개 페이지 - 인증 없이 접근 가능
  const PublicPage = PUBLIC_COMPONENTS[location.pathname]
  if (PublicPage) {
    return <PublicPage />
  }

  // 4. 인증 보호 영역 (로그인 필요)
  return (
    <ProtectedRoute>
      <AuthenticatedApp
        isOnboarded={isOnboarded}
        onOnboardingComplete={handleOnboardingComplete}
      />
    </ProtectedRoute>
  )
}

// 인증 후 메인 앱 (온보딩 + 라우팅)
function AuthenticatedApp({ isOnboarded, onOnboardingComplete }) {
  const location = useLocation()

  if (!isOnboarded) {
    return <Onboarding onComplete={onOnboardingComplete} />
  }

  const showTabBar = ['/', '/join', '/chat', '/saved', '/profile'].includes(location.pathname)

  return (
    <AppProvider>
      <MarkerProvider>
        <ChatProvider>
        <div className="app-container">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/join" element={<Join />} />
              <Route path="/join/create" element={<CreateJoin />} />
              <Route path="/join/:id" element={<JoinDetail />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<ProfileDetail />} />
              <Route path="/store" element={<Store />} />
              <Route path="/score" element={<ScoreRecord />} />
              <Route path="/score-stats" element={<ScoreStats />} />
              <Route path="/phone-verify" element={<PhoneVerification />} />
              <Route path="/chat" element={<ChatList />} />
              <Route path="/chat/:chatId" element={<ChatRoom />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/review" element={<Review />} />
              <Route path="/rounding-history" element={<RoundingHistory />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/callback/native" element={<AuthCallbackNative />} />
            </Routes>
          </AnimatePresence>

          {showTabBar && <TabBar />}

          <ToastContainer />
          <OfflineBanner />
        </div>
        </ChatProvider>
      </MarkerProvider>
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
