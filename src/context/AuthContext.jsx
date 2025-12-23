import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, auth, db, isConnected } from '../lib/supabase'
import { isNative, app } from '../lib/native'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // OAuth 딥링크 URL에서 토큰 추출
  const handleOAuthDeepLink = async (url) => {
    console.log('🔗 OAuth Deep Link received:', url)
    
    try {
      // URL 파싱 (hash fragment에서 토큰 추출)
      // 형식: kr.golfpeople.app://auth/callback#access_token=xxx&refresh_token=xxx...
      const hashIndex = url.indexOf('#')
      if (hashIndex === -1) {
        console.log('No hash fragment in URL')
        return false
      }
      
      const hashParams = new URLSearchParams(url.substring(hashIndex + 1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        console.log('🔑 Setting session from deep link tokens')
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        if (error) {
          console.error('Failed to set session:', error)
          return false
        }
        
        console.log('✅ Session set successfully:', data.user?.email)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error handling OAuth deep link:', err)
      return false
    }
  }

  // 세션 체크 및 프로필 로드
  useEffect(() => {
    // Supabase 미연결 시 데모 모드로 바로 진입
    if (!isConnected()) {
      console.log('Running in demo mode (Supabase not connected)')
      setLoading(false)
      return
    }

    let mounted = true
    let deepLinkUnsubscribe = null

    // Auth 상태 변경 리스너 (먼저 설정)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          // 로딩 먼저 해제
          setLoading(false)
          // 프로필은 백그라운드에서 로드
          db.profiles.get(session.user.id)
            .then(({ data }) => {
              if (mounted && data) setProfile(data)
            })
            .catch(err => console.log('Profile load failed:', err))
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else {
          // 다른 이벤트에서도 로딩 해제
          setLoading(false)
        }
      }
    )

    // 네이티브 앱에서 딥링크 리스너 설정
    if (isNative()) {
      deepLinkUnsubscribe = app.onAppUrlOpen(async (data) => {
        console.log('📱 App URL opened:', data.url)
        if (data.url.includes('/auth/callback') || data.url.includes('access_token')) {
          await handleOAuthDeepLink(data.url)
        }
      })
    }

    // 초기 세션 확인
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session:', session?.user?.email)
        
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          // 로딩 먼저 해제
          setLoading(false)
          // 프로필은 백그라운드에서 로드
          db.profiles.get(session.user.id)
            .then(({ data }) => {
              if (mounted && data) setProfile(data)
            })
            .catch(err => console.log('Profile load failed:', err))
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
      subscription?.unsubscribe()
      if (typeof deepLinkUnsubscribe === 'function') {
        deepLinkUnsubscribe()
      }
    }
  }, [])

  // 회원가입
  const signUp = async (email, password, metadata = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: signUpError } = await auth.signUp(email, password, metadata)
      
      if (signUpError) {
        throw signUpError
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 로그인
  const signIn = async (email, password) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: signInError } = await auth.signIn(email, password)
      
      if (signInError) {
        throw signInError
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 카카오 로그인
  const signInWithKakao = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await auth.signInWithKakao()
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 구글 로그인
  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await auth.signInWithGoogle()
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃
  const signOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
      setProfile(null)
      
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  // 비밀번호 재설정 이메일
  const resetPassword = async (email) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await auth.resetPassword(email)
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 비밀번호 변경
  const updatePassword = async (newPassword) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await auth.updatePassword(newPassword)
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 프로필 업데이트
  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('Not authenticated') }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await db.profiles.update(user.id, updates)
      
      if (error) {
        throw error
      }
      
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (!user) return
    
    try {
      const { data } = await db.profiles.get(user.id)
      setProfile(data)
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithKakao,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

