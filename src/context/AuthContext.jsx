import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase, auth, db, isConnected } from '../lib/supabase'
import { isNative, app, appleSignIn } from '../lib/native'

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
    setLoading(true) // 세션 설정 중에는 로딩 표시

    // 인앱 브라우저 닫기 (OAuth 완료 후 흰색 화면 방지)
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.close()
    } catch (_) {
      // Browser 플러그인 없거나 닫기 실패 시 무시
    }

    try {
      // URL에서 해시(#) 또는 쿼리(?) 이후의 토큰 추출 시도
      let tokenString = ''
      if (url.includes('#')) {
        tokenString = url.split('#')[1]
      } else if (url.includes('?')) {
        tokenString = url.split('?')[1]
      }

      if (!tokenString) {
        setLoading(false)
        return false
      }

      // Intent URL 등에 포함된 부가 정보(#Intent;...) 제거
      if (tokenString.includes('#')) {
        tokenString = tokenString.split('#')[0]
      }

      const params = new URLSearchParams(tokenString)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Failed to set session:', error.message)
          setLoading(false)
          return false
        }

        // 세션 설정 후 onAuthStateChange가 호출되면서 user 상태가 업데이트됨
        return true
      }

      setLoading(false)
      return false
    } catch (err) {
      console.error('Error handling OAuth deep link:', err)
      setLoading(false)
      return false
    }
  }

  // 세션 체크 및 프로필 로드
  useEffect(() => {
    // Supabase 미연결 시 데모 모드로 바로 진입
    if (!isConnected()) {
      setLoading(false)
      return
    }

    let mounted = true
    let deepLinkUnsubscribe = null

    // Auth 상태 변경 리스너 (먼저 설정)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
            .catch(err => console.error('Profile load failed:', err))
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
      // 1. 이미 열려있는 상태에서 딥링크 수신
      deepLinkUnsubscribe = app.onAppUrlOpen(async (data) => {
        // Firebase reCAPTCHA 콜백은 무시 (전화번호 인증용, Firebase SDK가 자체 처리)
        if (data.url.includes('firebaseauth') || data.url.includes('googleusercontent.apps') || data.url.includes('app-1-356155765246')) {
          return
        }
        if (data.url.includes('callback') || data.url.includes('access_token')) {
          await handleOAuthDeepLink(data.url)
        }
      })

      // 2. 앱이 종료된 상태에서 딥링크로 시작된 경우
      import('@capacitor/app').then(({ App }) => {
        App.getLaunchUrl().then(async (launchUrl) => {
          if (launchUrl?.url) {
            // Firebase reCAPTCHA 콜백은 무시
            if (launchUrl.url.includes('firebaseauth') || launchUrl.url.includes('googleusercontent.apps') || launchUrl.url.includes('app-1-356155765246')) {
              return
            }
            if (launchUrl.url.includes('callback') || launchUrl.url.includes('access_token')) {
              await handleOAuthDeepLink(launchUrl.url)
            }
          }
        })
      })
    }

    // 초기 세션 확인
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
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
            .catch(err => console.error('Profile load failed:', err))
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

  // Apple 로그인 (iOS만)
  const signInWithApple = async () => {
    setLoading(true)
    setError(null)

    try {
      // nonce를 한 번만 생성
      const rawNonce = crypto.randomUUID()

      // Apple에는 SHA-256 해시된 nonce를 전달해야 함
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawNonce))
      const hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // 네이티브 Apple Sign In 실행 (해시된 nonce 전달)
      const result = await appleSignIn.signIn(hashedNonce)

      if (!result.success) {
        throw new Error(result.error || 'Apple 로그인에 실패했습니다')
      }

      // Apple Identity Token을 사용해 Supabase에 로그인 (동일한 rawNonce 사용)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: result.user.identityToken,
        nonce: rawNonce,
      })

      if (error) {
        throw error
      }

      // 사용자 정보가 있으면 프로필 업데이트 (Apple은 최초 로그인 시에만 이름/이메일 제공)
      if (data.user && result.user.name) {
        await db.profiles.update(data.user.id, {
          name: result.user.name,
          email: result.user.email,
        }).catch(console.error)
      }

      return { data, error: null }
    } catch (err) {
      // Apple Sign In 취소 (error 1001)는 무시
      if (err.message?.includes('1001') || err.message?.includes('canceled') || err.message?.includes('cancelled')) {
        return { data: null, error: null }
      }
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // 회원 탈퇴 (계정 삭제)
  const deleteAccount = async () => {
    if (!user) return { error: new Error('Not authenticated') }
    
    setLoading(true)
    setError(null)
    
    try {
      // 1. Supabase Edge Function으로 계정 삭제 요청 (서버에서 auth.admin.deleteUser 호출)
      // Edge Function이 없는 경우 RPC 호출로 대체
      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        p_user_id: user.id
      })
      
      if (deleteError) {
        // RPC 실패 시 직접 프로필 삭제 후 로그아웃 처리
        console.error('RPC 실패, 프로필 삭제 후 로그아웃:', deleteError)
        await supabase.from('profiles').delete().eq('id', user.id)
      }
      
      // 2. 로컬 데이터 전부 삭제
      const keysToRemove = [
        'gp_onboarded', 'gp_profile', 'gp_revealed_cards',
        'gp_phone_verified', 'gp_settings', 'gp_theme',
        'gp_notif_settings', 'gp_push_token', 'gp_my_joins',
        'gp_past_cards', 'gp_recommendation_history',
        'gp_chat_rooms', 'gp_blocked_users'
      ]
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // 3. 로그아웃
      await auth.signOut()
      
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

  // 로그아웃
  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await auth.signOut()

      if (error) {
        throw error
      }

      // 세션 관련 localStorage 정리 — gp_ 접두사 키 전체 삭제
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('gp_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

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

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithKakao,
    signInWithGoogle,
    signInWithApple,
    signOut,
    deleteAccount,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  }), [user, profile, loading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

