/**
 * 채팅 서비스 - Supabase Realtime 연동
 */

import { supabase, isConnected } from './supabase'

// 활성 구독 저장
let activeSubscription = null
let roomSubscriptions = new Map()

/**
 * 사용자의 채팅방 목록 가져오기
 */
export const getChatRooms = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, rooms: [] }
  }

  try {
    // 내가 참여한 채팅방 조회
    const { data: participants, error: participantError } = await supabase
      .from('chat_participants')
      .select(`
        room_id,
        last_read_at,
        chat_rooms (
          id,
          type,
          name,
          join_id,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (participantError) throw participantError

    if (!participants || participants.length === 0) {
      return { success: true, rooms: [] }
    }

    // 각 채팅방의 상세 정보 조회 (개별 실패 허용)
    const results = await Promise.allSettled(
      participants.map(async (p) => {
        const room = p.chat_rooms
        if (!room) return null

        // 채팅방의 다른 참가자 조회
        const { data: otherParticipants } = await supabase
          .from('chat_participants')
          .select(`
            user_id,
            profiles (
              id,
              name,
              photos
            )
          `)
          .eq('room_id', room.id)
          .neq('user_id', userId)

        const allPartners = (otherParticipants || []).map(p => p.profiles).filter(Boolean)
        const partner = allPartners[0]

        // 마지막 메시지 조회
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMessage = lastMessages?.[0]

        // 읽지 않은 메시지 수
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .gt('created_at', p.last_read_at || '1970-01-01')
          .neq('sender_id', userId)

        // 조인 정보 조회 (조인 채팅방인 경우)
        let joinInfo = null
        if (room.join_id) {
          const { data: join } = await supabase
            .from('joins')
            .select('title, date, time, location')
            .eq('id', room.join_id)
            .single()

          if (join) {
            joinInfo = {
              title: join.title,
              date: new Date(join.date).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              }),
              location: join.location
            }
          }
        }

        return {
          id: room.id,
          type: room.type === 'direct' ? 'friend' : 'join',
          partnerId: partner?.id,
          partnerName: room.type === 'group'
            ? allPartners.map(p => p.name).join(', ') || '그룹 채팅'
            : (partner?.name || '알 수 없음'),
          partnerPhoto: partner?.photos?.[0] || 'https://via.placeholder.com/100',
          memberCount: (allPartners?.length || 0) + 1,
          joinId: room.join_id,
          joinTitle: joinInfo?.title || room.name,
          joinInfo: joinInfo,
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.created_at,
          unreadCount: unreadCount || 0
        }
      })
    )

    const rooms = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    return {
      success: true,
      rooms: rooms.filter(r => r !== null).sort((a, b) =>
        new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
      )
    }
  } catch (e) {
    console.error('채팅방 목록 조회 에러:', e)
    return { success: false, rooms: [], error: e.message }
  }
}

/**
 * 채팅방의 메시지 가져오기
 */
export const getMessages = async (roomId, limit = 50) => {
  if (!isConnected() || !roomId) {
    return { success: false, messages: [] }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        type,
        created_at,
        sender_id,
        profiles:sender_id (
          name,
          photos
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    const messages = (data || []).map(msg => ({
      id: msg.id,
      text: msg.content,
      type: msg.type,
      senderId: msg.sender_id,
      senderName: msg.profiles?.name,
      senderPhoto: msg.profiles?.photos?.[0],
      timestamp: msg.created_at
    }))

    return { success: true, messages }
  } catch (e) {
    console.error('메시지 조회 에러:', e)
    return { success: false, messages: [], error: e.message }
  }
}

/**
 * 메시지 보내기
 */
export const sendMessage = async (roomId, userId, content, type = 'text') => {
  if (!isConnected() || !roomId || !userId || !content) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        content: content.trim(),
        type
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, message: data }
  } catch (e) {
    console.error('메시지 전송 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 채팅방 읽음 처리
 */
export const markAsRead = async (roomId, userId) => {
  if (!isConnected() || !roomId || !userId) return

  try {
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)
  } catch (e) {
    console.error('읽음 처리 에러:', e)
  }
}

/**
 * 채팅방 실시간 구독
 */
export const subscribeToRoom = (roomId, userId, onNewMessage) => {
  if (!roomId) return () => {}

  // 기존 구독 해제
  if (roomSubscriptions.has(roomId)) {
    roomSubscriptions.get(roomId).unsubscribe()
  }

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        const newMessage = payload.new

        // 발신자 정보 조회
        const { data: sender } = await supabase
          .from('profiles')
          .select('name, photos')
          .eq('id', newMessage.sender_id)
          .single()

        const formattedMessage = {
          id: newMessage.id,
          text: newMessage.content,
          type: newMessage.type,
          senderId: newMessage.sender_id,
          senderName: sender?.name,
          senderPhoto: sender?.photos?.[0],
          timestamp: newMessage.created_at
        }

        onNewMessage(formattedMessage)

        // 내가 보낸 메시지가 아니면 읽음 처리
        if (newMessage.sender_id !== userId) {
          await markAsRead(roomId, userId)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onNewMessage({ _event: 'UPDATE', id: payload.new.id, text: payload.new.content })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onNewMessage({ _event: 'DELETE', id: payload.old.id })
      }
    )
    .subscribe()

  roomSubscriptions.set(roomId, channel)

  return () => {
    channel.unsubscribe()
    roomSubscriptions.delete(roomId)
  }
}

/**
 * 전체 채팅방 새 메시지 구독 (채팅 목록용)
 */
export const subscribeToAllRooms = (userId, onUpdate) => {
  if (!userId) return () => {}

  // 기존 구독 해제
  if (activeSubscription) {
    activeSubscription.unsubscribe()
  }

  const channel = supabase
    .channel('all-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      async () => {
        // 새 메시지가 오면 채팅방 목록 갱신
        onUpdate()
      }
    )
    .subscribe()

  activeSubscription = channel

  return () => {
    channel.unsubscribe()
    activeSubscription = null
  }
}

/**
 * 1:1 채팅방 생성 또는 가져오기
 */
export const getOrCreateDirectRoom = async (userId, partnerId) => {
  if (!isConnected() || !userId || !partnerId) {
    return { success: false }
  }

  // 자기 자신과 채팅 방지
  if (String(userId) === String(partnerId)) {
    return { success: false, error: '자기 자신과는 채팅할 수 없습니다' }
  }

  try {
    // 기존 1:1 채팅방 찾기
    const { data: myRooms } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', userId)

    if (myRooms && myRooms.length > 0) {
      const roomIds = myRooms.map(r => r.room_id)

      const { data: partnerInRoom } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms!inner (type)
        `)
        .eq('user_id', partnerId)
        .in('room_id', roomIds)
        .eq('chat_rooms.type', 'direct')

      if (partnerInRoom && partnerInRoom.length > 0) {
        return { success: true, roomId: partnerInRoom[0].room_id, isNew: false }
      }
    }

    // 새 채팅방 생성
    const { data: newRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ type: 'direct' })
      .select()
      .single()

    if (roomError) throw roomError

    // 참가자 추가
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert([
        { room_id: newRoom.id, user_id: userId },
        { room_id: newRoom.id, user_id: partnerId }
      ])

    if (participantError) throw participantError

    return { success: true, roomId: newRoom.id, isNew: true }
  } catch (e) {
    console.error('채팅방 생성 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 채팅방 생성 또는 가져오기
 */
export const getOrCreateJoinRoom = async (joinId, userIds) => {
  if (!isConnected() || !joinId || !userIds || userIds.length === 0) {
    return { success: false }
  }

  try {
    // 기존 조인 채팅방 찾기
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('join_id', joinId)
      .single()

    if (existingRoom) {
      return { success: true, roomId: existingRoom.id, isNew: false }
    }

    // 새 채팅방 생성
    const { data: newRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ type: 'group', join_id: joinId })
      .select()
      .single()

    if (roomError) throw roomError

    // 참가자 추가
    const participants = userIds.map(uid => ({
      room_id: newRoom.id,
      user_id: uid
    }))

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participants)

    if (participantError) throw participantError

    return { success: true, roomId: newRoom.id, isNew: true }
  } catch (e) {
    console.error('조인 채팅방 생성 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 채팅방 나가기 (DB에서 참가자 삭제)
 */
export const leaveChatRoom = async (roomId, userId) => {
  if (!isConnected() || !roomId || !userId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('채팅방 나가기 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 채팅방 멤버 목록 가져오기
 */
export const getChatMembers = async (roomId) => {
  if (!isConnected() || !roomId) {
    return { success: false, members: [] }
  }

  try {
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        user_id,
        profiles:user_id (
          id,
          name,
          photos
        )
      `)
      .eq('room_id', roomId)

    if (error) throw error

    const members = (data || []).map(p => ({
      id: p.profiles?.id,
      name: p.profiles?.name || '알 수 없음',
      photo: p.profiles?.photos?.[0] || null
    })).filter(m => m.id)

    return { success: true, members }
  } catch (e) {
    console.error('멤버 목록 조회 에러:', e)
    return { success: false, members: [], error: e.message }
  }
}

/**
 * 메시지 수정
 */
export const editMessage = async (messageId, userId, newContent) => {
  if (!isConnected() || !messageId || !userId || !newContent?.trim()) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ content: newContent.trim() })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, message: data }
  } catch (e) {
    console.error('메시지 수정 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 메시지 삭제
 */
export const deleteMessage = async (messageId, userId) => {
  if (!isConnected() || !messageId || !userId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('메시지 삭제 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 모든 구독 해제
 */
export const unsubscribeAll = () => {
  if (activeSubscription) {
    activeSubscription.unsubscribe()
    activeSubscription = null
  }

  roomSubscriptions.forEach(channel => channel.unsubscribe())
  roomSubscriptions.clear()
}

export default {
  getChatRooms,
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToRoom,
  subscribeToAllRooms,
  getOrCreateDirectRoom,
  getOrCreateJoinRoom,
  leaveChatRoom,
  getChatMembers,
  editMessage,
  deleteMessage,
  unsubscribeAll
}
