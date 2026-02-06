/**
 * 친구 서비스 - Supabase 연동
 * 친구 요청 수락 시 DB 트리거에서 자동으로 채팅방 생성됨
 */

import { supabase, isConnected } from './supabase'
import { createNotification, NOTIFICATION_TYPES } from './notificationService'

/**
 * 보낸 친구 요청 목록 가져오기
 */
export const getSentFriendRequests = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, requests: [] }
  }

  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        message,
        status,
        created_at,
        to_user:to_user_id (
          id,
          name,
          photos,
          regions,
          handicap
        )
      `)
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const requests = (data || []).map(req => ({
      id: req.id,
      userId: req.to_user?.id,
      userName: req.to_user?.name || '알 수 없음',
      userPhoto: req.to_user?.photos?.[0] || 'https://via.placeholder.com/100',
      userRegion: req.to_user?.regions?.[0] || '',
      userHandicap: req.to_user?.handicap || '',
      message: req.message,
      status: req.status,
      createdAt: req.created_at,
    }))

    return { success: true, requests }
  } catch (e) {
    console.error('보낸 친구 요청 조회 에러:', e)
    return { success: false, requests: [], error: e.message }
  }
}

/**
 * 받은 친구 요청 목록 가져오기
 */
export const getReceivedFriendRequests = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, requests: [] }
  }

  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        message,
        status,
        created_at,
        from_user:from_user_id (
          id,
          name,
          photos,
          regions,
          handicap
        )
      `)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const requests = (data || []).map(req => ({
      id: req.id,
      userId: req.from_user?.id,
      userName: req.from_user?.name || '알 수 없음',
      userPhoto: req.from_user?.photos?.[0] || 'https://via.placeholder.com/100',
      userRegion: req.from_user?.regions?.[0] || '',
      userHandicap: req.from_user?.handicap || '',
      message: req.message,
      status: req.status,
      createdAt: req.created_at,
    }))

    return { success: true, requests }
  } catch (e) {
    console.error('받은 친구 요청 조회 에러:', e)
    return { success: false, requests: [], error: e.message }
  }
}

/**
 * 친구 요청 보내기
 */
export const sendFriendRequest = async (fromUserId, toUserId, message = '') => {
  if (!isConnected() || !fromUserId || !toUserId) {
    return { success: false, error: 'invalid_params' }
  }

  try {
    // 이미 요청이 있는지 확인
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        return { success: false, error: 'already_requested' }
      }
      if (existing.status === 'accepted') {
        return { success: false, error: 'already_friends' }
      }
    }

    // 친구 요청 생성
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        message: message.trim() || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // 알림 발송 (친구 요청 받음)
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', fromUserId)
      .single()

    createNotification({
      type: NOTIFICATION_TYPES.FRIEND_REQUEST,
      recipientId: toUserId,
      data: {
        senderName: senderProfile?.name || '골퍼',
        senderId: fromUserId,
      },
      options: { push: true, kakao: true, inApp: true }
    })

    return { success: true, request: data }
  } catch (e) {
    console.error('친구 요청 보내기 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 친구 요청 수락
 * DB 트리거에서 자동으로:
 * - friends 테이블에 양방향 관계 생성
 * - 1:1 채팅방 생성
 * - 알림 생성
 */
export const acceptFriendRequest = async (requestId) => {
  if (!isConnected() || !requestId) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    // 알림 발송 (친구 요청 수락됨 - 요청자에게)
    const { data: acceptorProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.to_user_id)
      .single()

    createNotification({
      type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
      recipientId: data.from_user_id,
      data: {
        senderName: acceptorProfile?.name || '골퍼',
        senderId: data.to_user_id,
      },
      options: { push: true, kakao: true, inApp: true }
    })

    return { success: true, request: data }
  } catch (e) {
    console.error('친구 요청 수락 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 친구 요청 거절
 */
export const rejectFriendRequest = async (requestId) => {
  if (!isConnected() || !requestId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('친구 요청 거절 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 친구 요청 취소 (삭제)
 */
export const cancelFriendRequest = async (requestId) => {
  if (!isConnected() || !requestId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('친구 요청 취소 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 친구 목록 가져오기
 */
export const getFriends = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, friends: [] }
  }

  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        created_at,
        friend:friend_id (
          id,
          name,
          photos,
          regions,
          handicap,
          is_online,
          last_seen_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const friends = (data || []).map(f => ({
      id: f.friend?.id,
      name: f.friend?.name || '알 수 없음',
      photo: f.friend?.photos?.[0] || 'https://via.placeholder.com/100',
      region: f.friend?.regions?.[0] || '',
      handicap: f.friend?.handicap || '',
      isOnline: f.friend?.is_online || false,
      lastSeenAt: f.friend?.last_seen_at,
      friendedAt: f.created_at,
    }))

    return { success: true, friends }
  } catch (e) {
    console.error('친구 목록 조회 에러:', e)
    return { success: false, friends: [], error: e.message }
  }
}

/**
 * 친구 삭제
 */
export const removeFriend = async (userId, friendId) => {
  if (!isConnected() || !userId || !friendId) {
    return { success: false }
  }

  try {
    // 양방향 삭제
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('친구 삭제 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 두 사용자가 친구인지 확인
 */
export const checkFriendship = async (userId, targetUserId) => {
  if (!isConnected() || !userId || !targetUserId) {
    return { isFriend: false, isPending: false }
  }

  try {
    // 친구 관계 확인
    const { data: friendData } = await supabase
      .from('friends')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', targetUserId)
      .single()

    if (friendData) {
      return { isFriend: true, isPending: false }
    }

    // 대기 중인 요청 확인
    const { data: requestData } = await supabase
      .from('friend_requests')
      .select('id, from_user_id')
      .eq('status', 'pending')
      .or(`and(from_user_id.eq.${userId},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${userId})`)
      .single()

    if (requestData) {
      return {
        isFriend: false,
        isPending: true,
        sentByMe: requestData.from_user_id === userId
      }
    }

    return { isFriend: false, isPending: false }
  } catch (e) {
    return { isFriend: false, isPending: false }
  }
}

export default {
  getSentFriendRequests,
  getReceivedFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
  checkFriendship,
}
