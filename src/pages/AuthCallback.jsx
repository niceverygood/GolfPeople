import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase, isConnected } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('로그인 중...')

  useEffect(() => {
    if (!isConnected()) {
      setStatus('error')
      setMessage('Supabase 연결이 필요합니다')
      setTimeout(() => navigate('/login', { replace: true }), 3000)
      return
    }

    // Supabase 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session)
      
      if (event === 'SIGNED_IN' && session) {
        setStatus('success')
        setMessage('로그인 성공!')
        
        try {
          // 프로필 확인 및 생성
          // 참고: handle_new_user() 트리거가 auth.users 생성 시 자동으로 프로필 생성
          const userId = session.user.id
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 트리거가 실패했거나 프로필이 없으면 수동 생성
            const userMeta = session.user.user_metadata
            const avatarUrl = userMeta.avatar_url || userMeta.picture

            const { error: insertError } = await supabase.from('profiles').insert({
              id: userId,
              name: userMeta.name || userMeta.full_name || '골퍼',
              email: session.user.email,
              photos: avatarUrl ? [avatarUrl] : [],
            })

            if (insertError) {
              console.error('Profile insert error:', insertError)
            }
          }
        } catch (err) {
          console.error('Profile error:', err)
        }

        // 홈으로 이동
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    })

    // 5초 후에도 로그인 안되면 홈으로 강제 이동
    const timeout = setTimeout(() => {
      console.log('Auth timeout - redirecting to home')
      window.location.href = '/'
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gp-black flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {/* 상태 아이콘 */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gp-card flex items-center justify-center">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-gp-gold animate-spin" />
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <XCircle className="w-12 h-12 text-red-500" />
            </motion.div>
          )}
        </div>

        {/* 메시지 */}
        <h2 className="text-xl font-bold mb-2">
          {status === 'loading' && '로그인 처리 중'}
          {status === 'success' && '환영합니다! 🎉'}
          {status === 'error' && '오류 발생'}
        </h2>
        <p className="text-gp-text-secondary">{message}</p>

        {/* 로딩 바 */}
        {status === 'loading' && (
          <div className="mt-8 w-48 h-1 bg-gp-card rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gp-gold"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* 에러 시 안내 */}
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-gp-text-secondary"
          >
            잠시 후 로그인 페이지로 이동합니다...
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}


