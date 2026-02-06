import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isMissingEnv = !supabaseUrl || !supabaseAnonKey

// OAuth 리다이렉트 URL 결정
const getRedirectUrl = (path = '/auth/callback') => {
  // 네이티브 앱에서는 Custom URL Scheme 사용 (명확한 스킴)
  if (Capacitor.isNativePlatform()) {
    return `kr.golfpeople.app://auth/callback`
  }
  // 웹에서는 현재 origin 사용
  return `${window.location.origin}${path}`
}

// 네이티브 앱에서 OAuth URL을 브라우저로 열기
const openOAuthInBrowser = async (url) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, windowName: '_self' })
    return true
  }
  return false
}

if (isMissingEnv) {
  console.warn('⚠️ Missing Supabase environment variables. App will run in offline/demo mode.')
}

// 환경변수가 있을 때만 클라이언트 생성
export const supabase = isMissingEnv 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })

// 에러 없이 빈 결과 반환하는 헬퍼
const notConnected = () => ({ data: null, error: new Error('Supabase not connected') })
const notConnectedVoid = () => ({ error: new Error('Supabase not connected') })

// Auth helpers
export const auth = {
  signUp: async (email, password, metadata = {}) => {
    if (!supabase) return notConnected()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    if (!supabase) return notConnected()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signInWithKakao: async () => {
    if (!supabase) return notConnected()

    // 네이티브 앱에서는 커스텀 URL Scheme으로 직접 리다이렉트
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: 'kr.golfpeople.app://auth/callback',
          skipBrowserRedirect: true,
        },
      })
      if (data?.url) {
        await Browser.open({
          url: data.url,
          toolbarColor: '#0D0D0D',
          presentationStyle: 'fullscreen'
        })
      }
      return { data, error }
    }

    // 웹: 기본 동작
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: getRedirectUrl('/auth/callback') },
    })
    return { data, error }
  },

  signInWithGoogle: async () => {
    if (!supabase) return notConnected()

    // 네이티브 앱에서는 커스텀 URL Scheme으로 직접 리다이렉트
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'kr.golfpeople.app://auth/callback',
          skipBrowserRedirect: true
        },
      })
      if (data?.url) {
        await Browser.open({
          url: data.url,
          toolbarColor: '#0D0D0D',
          presentationStyle: 'fullscreen'
        })
      }
      return { data, error }
    }

    // 웹에서는 기본 동작
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { data, error }
  },

  signOut: async () => {
    if (!supabase) return notConnectedVoid()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getUser: async () => {
    if (!supabase) return { user: null, error: null }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    if (!supabase) return { session: null, error: null }
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  resetPassword: async (email) => {
    if (!supabase) return notConnected()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('/auth/reset-password'),
    })
    return { data, error }
  },

  updatePassword: async (newPassword) => {
    if (!supabase) return notConnected()
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
  },
}

// Database helpers
export const db = {
  profiles: {
    get: async (userId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    },
    
    update: async (userId, updates) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      return { data, error }
    },
    
    getAll: async (filters = {}) => {
      if (!supabase) return { data: [], error: null }
      let query = supabase.from('profiles').select('*')
      if (filters.region) query = query.contains('regions', [filters.region])
      if (filters.handicap) query = query.eq('handicap', filters.handicap)
      const { data, error } = await query
      return { data, error }
    },
  },

  joins: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null }
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('joins')
        .select(`*, host:profiles!joins_host_id_fkey(id, name, photos), participants:join_participants(user:profiles(id, name, photos))`)
        .eq('status', 'open')
        .gte('date', today)
        .order('date', { ascending: true })
      return { data, error }
    },
    
    get: async (joinId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('joins')
        .select(`*, host:profiles!joins_host_id_fkey(*), participants:join_participants(user:profiles(*))`)
        .eq('id', joinId)
        .single()
      return { data, error }
    },
    
    create: async (joinData) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('joins')
        .insert(joinData)
        .select()
        .single()
      return { data, error }
    },
    
    update: async (joinId, updates) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('joins')
        .update(updates)
        .eq('id', joinId)
        .select()
        .single()
      return { data, error }
    },
    
    delete: async (joinId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('joins').delete().eq('id', joinId)
      return { error }
    },
    
    getMyJoins: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('joins')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
  },

  friendRequests: {
    send: async (fromUserId, toUserId, message = '') => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({ from_user_id: fromUserId, to_user_id: toUserId, message, status: 'pending' })
        .select()
        .single()
      return { data, error }
    },
    
    getSent: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`*, to_user:profiles!friend_requests_to_user_id_fkey(*)`)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    getReceived: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`*, from_user:profiles!friend_requests_from_user_id_fkey(*)`)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    accept: async (requestId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .select()
        .single()
      return { data, error }
    },
    
    reject: async (requestId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .select()
        .single()
      return { data, error }
    },
    
    cancel: async (requestId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId)
      return { error }
    },
  },

  joinApplications: {
    apply: async (joinId, userId, message = '') => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('join_applications')
        .insert({ join_id: joinId, user_id: userId, message, status: 'pending' })
        .select()
        .single()
      return { data, error }
    },
    
    getSent: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('join_applications')
        .select(`*, join:joins(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    getReceived: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('join_applications')
        .select(`*, user:profiles(*), join:joins!inner(*)`)
        .eq('join.host_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    accept: async (applicationId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('join_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)
        .select()
        .single()
      return { data, error }
    },
    
    reject: async (applicationId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('join_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)
        .select()
        .single()
      return { data, error }
    },
  },

  likes: {
    add: async (userId, likedUserId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('likes')
        .insert({ user_id: userId, liked_user_id: likedUserId })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, likedUserId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('liked_user_id', likedUserId)
      return { error }
    },
    
    getAll: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('likes')
        .select(`*, liked_user:profiles!likes_liked_user_id_fkey(*)`)
        .eq('user_id', userId)
      return { data, error }
    },
  },

  savedJoins: {
    add: async (userId, joinId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('saved_joins')
        .insert({ user_id: userId, join_id: joinId })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, joinId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('saved_joins').delete().eq('user_id', userId).eq('join_id', joinId)
      return { error }
    },
    
    getAll: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('saved_joins')
        .select(`*, join:joins(*)`)
        .eq('user_id', userId)
      return { data, error }
    },
  },

  notifications: {
    getAll: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    markAsRead: async (notificationId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()
      return { data, error }
    },
    
    markAllAsRead: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select()
      return { data, error }
    },
    
    delete: async (notificationId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
      return { error }
    },
  },

  blocks: {
    add: async (userId, blockedUserId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('blocks')
        .insert({ user_id: userId, blocked_user_id: blockedUserId })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, blockedUserId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('blocks').delete().eq('user_id', userId).eq('blocked_user_id', blockedUserId)
      return { error }
    },
    
    getAll: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('blocks')
        .select(`*, blocked_user:profiles!blocks_blocked_user_id_fkey(*)`)
        .eq('user_id', userId)
      return { data, error }
    },
  },

  scores: {
    create: async (scoreData) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('scores')
        .insert(scoreData)
        .select()
        .single()
      return { data, error }
    },

    getAll: async (userId) => {
      if (!supabase) return { data: [], error: null }
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      return { data, error }
    },

    get: async (scoreId) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('id', scoreId)
        .single()
      return { data, error }
    },

    update: async (scoreId, updates) => {
      if (!supabase) return notConnected()
      const { data, error } = await supabase
        .from('scores')
        .update(updates)
        .eq('id', scoreId)
        .select()
        .single()
      return { data, error }
    },

    delete: async (scoreId) => {
      if (!supabase) return notConnectedVoid()
      const { error } = await supabase.from('scores').delete().eq('id', scoreId)
      return { error }
    },

    getStats: async (userId) => {
      if (!supabase) return { data: null, error: null }
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
      
      if (error || !data || data.length === 0) {
        return { data: null, error }
      }

      // 통계 계산
      const totalRounds = data.length
      const scores = data.map(s => s.total_score)
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalRounds)
      const bestScore = Math.min(...scores)
      const recentScores = data.slice(-10) // 최근 10라운드
      
      // 핸디캡 계산 (최근 20라운드 중 상위 10개 평균 - 72)
      const recent20 = data.slice(-20).map(s => s.total_score - (s.par || 72))
      recent20.sort((a, b) => a - b)
      const best10 = recent20.slice(0, Math.min(10, recent20.length))
      const handicap = best10.length > 0 
        ? Math.round((best10.reduce((a, b) => a + b, 0) / best10.length) * 0.96 * 10) / 10
        : null

      // 월별 평균
      const monthlyAvg = {}
      data.forEach(s => {
        const month = s.date.substring(0, 7) // YYYY-MM
        if (!monthlyAvg[month]) {
          monthlyAvg[month] = { total: 0, count: 0 }
        }
        monthlyAvg[month].total += s.total_score
        monthlyAvg[month].count++
      })

      const monthlyData = Object.entries(monthlyAvg).map(([month, val]) => ({
        month,
        avgScore: Math.round(val.total / val.count)
      }))

      return {
        data: {
          totalRounds,
          avgScore,
          bestScore,
          handicap,
          recentScores,
          monthlyData
        },
        error: null
      }
    },
  },
}

// Storage helpers
export const storage = {
  uploadProfileImage: async (userId, file) => {
    if (!supabase) return { url: null, error: new Error('Supabase not connected') }
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    
    if (error) return { url: null, error }
    
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)
    
    return { url: publicUrl, error: null }
  },
  
  deleteImage: async (bucket, path) => {
    if (!supabase) return notConnectedVoid()
    const { error } = await supabase.storage.from(bucket).remove([path])
    return { error }
  },
}

// Realtime subscriptions
export const realtime = {
  subscribeToNotifications: (userId, callback) => {
    if (!supabase) return null
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callback)
      .subscribe()
  },
  
  subscribeToFriendRequests: (userId, callback) => {
    if (!supabase) return null
    return supabase
      .channel(`friend_requests:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `to_user_id=eq.${userId}` }, callback)
      .subscribe()
  },
  
  unsubscribe: (channel) => {
    if (supabase && channel) supabase.removeChannel(channel)
  },
}

// 연결 상태 확인
export const isConnected = () => !!supabase

export default supabase
