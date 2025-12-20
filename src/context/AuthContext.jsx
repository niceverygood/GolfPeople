import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, auth, db, isConnected } from '../lib/supabase'

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

  // 세션 체크 및 프로필 로드
  useEffect(() => {
    // Supabase 미연결 시 데모 모드로 바로 진입
    if (!isConnected()) {
      console.log('Running in demo mode (Supabase not connected)')
      setLoading(false)
      return
    }

    // 로딩 타임아웃 (5초 후 강제 진행)
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing continue')
      setLoading(false)
    }, 5000)

    const initAuth = async () => {
      try {
        // 현재 세션 확인
        const { session } = await auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          // 프로필 로드 (실패해도 진행)
          try {
            const { data: profileData } = await db.profiles.get(session.user.id)
            setProfile(profileData)
          } catch (profileErr) {
            console.log('Profile load failed, continuing:', profileErr)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err.message)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }

    initAuth()

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (session?.user) {
          setUser(session.user)
          // 프로필 로드 (실패해도 진행)
          try {
            const { data: profileData } = await db.profiles.get(session.user.id)
            setProfile(profileData)
          } catch (profileErr) {
            console.log('Profile load failed:', profileErr)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription?.unsubscribe()
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

