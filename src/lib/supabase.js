import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Auth helpers
export const auth = {
  // 회원가입
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  },

  // 로그인
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // 소셜 로그인 (카카오)
  signInWithKakao: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  // 소셜 로그인 (Google)
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 현재 사용자
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // 세션
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // 비밀번호 재설정 이메일
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  },

  // 비밀번호 업데이트
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },
}

// Database helpers
export const db = {
  // 프로필
  profiles: {
    get: async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    },
    
    update: async (userId, updates) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      return { data, error }
    },
    
    getAll: async (filters = {}) => {
      let query = supabase.from('profiles').select('*')
      
      if (filters.region) {
        query = query.contains('regions', [filters.region])
      }
      if (filters.handicap) {
        query = query.eq('handicap', filters.handicap)
      }
      
      const { data, error } = await query
      return { data, error }
    },
  },

  // 조인
  joins: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('joins')
        .select(`
          *,
          host:profiles!joins_host_id_fkey(id, name, photos),
          participants:join_participants(
            user:profiles(id, name, photos)
          )
        `)
        .order('date', { ascending: true })
      return { data, error }
    },
    
    get: async (joinId) => {
      const { data, error } = await supabase
        .from('joins')
        .select(`
          *,
          host:profiles!joins_host_id_fkey(*),
          participants:join_participants(
            user:profiles(*)
          )
        `)
        .eq('id', joinId)
        .single()
      return { data, error }
    },
    
    create: async (joinData) => {
      const { data, error } = await supabase
        .from('joins')
        .insert(joinData)
        .select()
        .single()
      return { data, error }
    },
    
    update: async (joinId, updates) => {
      const { data, error } = await supabase
        .from('joins')
        .update(updates)
        .eq('id', joinId)
        .select()
        .single()
      return { data, error }
    },
    
    delete: async (joinId) => {
      const { error } = await supabase
        .from('joins')
        .delete()
        .eq('id', joinId)
      return { error }
    },
    
    getMyJoins: async (userId) => {
      const { data, error } = await supabase
        .from('joins')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
  },

  // 친구 요청
  friendRequests: {
    send: async (fromUserId, toUserId, message = '') => {
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message,
          status: 'pending',
        })
        .select()
        .single()
      return { data, error }
    },
    
    getSent: async (userId) => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          to_user:profiles!friend_requests_to_user_id_fkey(*)
        `)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    getReceived: async (userId) => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          from_user:profiles!friend_requests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    accept: async (requestId) => {
      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .select()
        .single()
      return { data, error }
    },
    
    reject: async (requestId) => {
      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .select()
        .single()
      return { data, error }
    },
    
    cancel: async (requestId) => {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
      return { error }
    },
  },

  // 조인 신청
  joinApplications: {
    apply: async (joinId, userId, message = '') => {
      const { data, error } = await supabase
        .from('join_applications')
        .insert({
          join_id: joinId,
          user_id: userId,
          message,
          status: 'pending',
        })
        .select()
        .single()
      return { data, error }
    },
    
    getSent: async (userId) => {
      const { data, error } = await supabase
        .from('join_applications')
        .select(`
          *,
          join:joins(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    getReceived: async (userId) => {
      const { data, error } = await supabase
        .from('join_applications')
        .select(`
          *,
          user:profiles(*),
          join:joins!inner(*)
        `)
        .eq('join.host_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    accept: async (applicationId) => {
      const { data, error } = await supabase
        .from('join_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)
        .select()
        .single()
      return { data, error }
    },
    
    reject: async (applicationId) => {
      const { data, error } = await supabase
        .from('join_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)
        .select()
        .single()
      return { data, error }
    },
  },

  // 좋아요 (관심)
  likes: {
    add: async (userId, likedUserId) => {
      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          liked_user_id: likedUserId,
        })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, likedUserId) => {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('liked_user_id', likedUserId)
      return { error }
    },
    
    getAll: async (userId) => {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          liked_user:profiles!likes_liked_user_id_fkey(*)
        `)
        .eq('user_id', userId)
      return { data, error }
    },
  },

  // 저장 (조인)
  savedJoins: {
    add: async (userId, joinId) => {
      const { data, error } = await supabase
        .from('saved_joins')
        .insert({
          user_id: userId,
          join_id: joinId,
        })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, joinId) => {
      const { error } = await supabase
        .from('saved_joins')
        .delete()
        .eq('user_id', userId)
        .eq('join_id', joinId)
      return { error }
    },
    
    getAll: async (userId) => {
      const { data, error } = await supabase
        .from('saved_joins')
        .select(`
          *,
          join:joins(*)
        `)
        .eq('user_id', userId)
      return { data, error }
    },
  },

  // 알림
  notifications: {
    getAll: async (userId) => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    markAsRead: async (notificationId) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()
      return { data, error }
    },
    
    markAllAsRead: async (userId) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select()
      return { data, error }
    },
    
    delete: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      return { error }
    },
  },

  // 차단
  blocks: {
    add: async (userId, blockedUserId) => {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          user_id: userId,
          blocked_user_id: blockedUserId,
        })
        .select()
        .single()
      return { data, error }
    },
    
    remove: async (userId, blockedUserId) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('user_id', userId)
        .eq('blocked_user_id', blockedUserId)
      return { error }
    },
    
    getAll: async (userId) => {
      const { data, error } = await supabase
        .from('blocks')
        .select(`
          *,
          blocked_user:profiles!blocks_blocked_user_id_fkey(*)
        `)
        .eq('user_id', userId)
      return { data, error }
    },
  },
}

// Storage helpers
export const storage = {
  // 프로필 이미지 업로드
  uploadProfileImage: async (userId, file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (error) return { url: null, error }
    
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)
    
    return { url: publicUrl, error: null }
  },
  
  // 이미지 삭제
  deleteImage: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    return { error }
  },
}

// Realtime subscriptions
export const realtime = {
  // 알림 구독
  subscribeToNotifications: (userId, callback) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },
  
  // 친구 요청 구독
  subscribeToFriendRequests: (userId, callback) => {
    return supabase
      .channel(`friend_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },
  
  // 채널 해제
  unsubscribe: (channel) => {
    supabase.removeChannel(channel)
  },
}

export default supabase

