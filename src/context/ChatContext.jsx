/**
 * 채팅 Context - Supabase Realtime 연동
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { showToast } from '../utils/errorHandler'
import {
  getChatRooms,
  getMessages,
  sendMessage as sendChatMessage,
  markAsRead,
  subscribeToRoom,
  subscribeToAllRooms,
  getOrCreateDirectRoom,
  leaveChatRoom as leaveChatRoomService,
  getChatMembers,
  editMessage as editChatMessage,
  deleteMessage as deleteChatMessage,
  unsubscribeAll
} from '../lib/chatService'

const ChatContext = createContext()

export function ChatProvider({ children }) {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const roomUnsubscribeRef = useRef(null)
  const allRoomsUnsubscribeRef = useRef(null)

  // 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const result = await getChatRooms(user.id)
      if (result.success) {
        setChatRooms(result.rooms)
      } else {
        setError(result.error)
        showToast.error('채팅방 목록을 불러오지 못했습니다')
      }
    } catch (e) {
      console.error('loadChatRooms 에러:', e)
      setError(e.message)
      showToast.error('채팅방 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 채팅방 입장
  const enterRoomIdRef = useRef(null)

  const enterRoom = useCallback(async (roomId) => {
    if (!user?.id || !roomId) return

    // race condition 방지: 현재 요청 ID 기록
    enterRoomIdRef.current = roomId
    setLoading(true)

    // 기존 구독 즉시 해제
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current()
      roomUnsubscribeRef.current = null
    }

    // 메시지 로드
    const result = await getMessages(roomId)

    // 로드 완료 시점에 다른 방으로 전환된 경우 무시
    if (enterRoomIdRef.current !== roomId) {
      setLoading(false)
      return
    }

    if (result.success) {
      setMessages(result.messages)
      setCurrentRoom(roomId)

      // 읽음 처리
      await markAsRead(roomId, user.id)

      // 채팅방 목록 업데이트 (unread count 갱신)
      setChatRooms(prev =>
        prev.map(room =>
          room.id === roomId ? { ...room, unreadCount: 0 } : room
        )
      )

      // 실시간 구독 (stale-room guard: 다른 방으로 전환된 경우 무시)
      const expectedRoomId = roomId
      roomUnsubscribeRef.current = subscribeToRoom(roomId, user.id, (newMessage) => {
        if (enterRoomIdRef.current !== expectedRoomId) return

        // UPDATE 이벤트
        if (newMessage._event === 'UPDATE') {
          setMessages(prev =>
            prev.map(m => m.id === newMessage.id ? { ...m, text: newMessage.text } : m)
          )
          return
        }

        // DELETE 이벤트
        if (newMessage._event === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== newMessage.id))
          return
        }

        // INSERT 이벤트
        setMessages(prev => {
          // 중복 체크
          if (prev.some(m => m.id === newMessage.id)) {
            return prev
          }
          return [...prev, newMessage]
        })

        // 채팅방 목록의 마지막 메시지 업데이트
        setChatRooms(prev =>
          prev.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  lastMessage: newMessage.text,
                  lastMessageTime: newMessage.timestamp
                }
              : room
          )
        )
      })
    } else {
      setError(result.error)
    }

    setLoading(false)
  }, [user?.id])

  // 채팅방 퇴장
  const leaveRoom = useCallback(() => {
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current()
      roomUnsubscribeRef.current = null
    }
    setCurrentRoom(null)
    setMessages([])
  }, [])

  // 메시지 전송
  const sendMessage = useCallback(async (content) => {
    if (!user?.id || !currentRoom || !content?.trim()) {
      return { success: false }
    }

    // 낙관적 업데이트 - 즉시 UI에 표시
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: content.trim(),
      senderId: user.id,
      timestamp: new Date().toISOString(),
      pending: true
    }

    setMessages(prev => [...prev, tempMessage])

    // 실제 전송
    const result = await sendChatMessage(currentRoom, user.id, content)

    if (result.success) {
      // 임시 메시지를 실제 메시지로 교체 (Realtime에서 처리됨)
      setMessages(prev =>
        prev.filter(m => m.id !== tempMessage.id)
      )
    } else {
      // 전송 실패 - 임시 메시지 제거
      setMessages(prev =>
        prev.filter(m => m.id !== tempMessage.id)
      )
      setError(result.error)
    }

    return result
  }, [user?.id, currentRoom])

  // 채팅방 나가기 (DB에서 실제 삭제)
  const leaveChatRoom = useCallback(async (roomId) => {
    if (!user?.id || !roomId) return { success: false }

    // 구독 해제
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current()
      roomUnsubscribeRef.current = null
    }

    const result = await leaveChatRoomService(roomId, user.id)

    if (result.success) {
      setChatRooms(prev => prev.filter(room => room.id !== roomId))
      if (currentRoom === roomId) {
        setCurrentRoom(null)
        setMessages([])
      }
    }

    return result
  }, [user?.id, currentRoom])

  // 멤버 목록 조회
  const loadMembers = useCallback(async (roomId) => {
    if (!roomId) return { success: false, members: [] }
    return await getChatMembers(roomId)
  }, [])

  // 메시지 수정
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!user?.id || !messageId) return { success: false }

    const result = await editChatMessage(messageId, user.id, newContent)

    if (result.success) {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, text: newContent.trim() } : m)
      )
    }

    return result
  }, [user?.id])

  // 메시지 삭제
  const deleteMessage = useCallback(async (messageId) => {
    if (!user?.id || !messageId) return { success: false }

    const result = await deleteChatMessage(messageId, user.id)

    if (result.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }

    return result
  }, [user?.id])

  // 1:1 채팅 시작
  const startDirectChat = useCallback(async (partnerId) => {
    if (!user?.id || !partnerId) return { success: false }

    const result = await getOrCreateDirectRoom(user.id, partnerId)

    if (result.success) {
      await loadChatRooms()
    }

    return result
  }, [user?.id, loadChatRooms])

  // 읽지 않은 메시지 총 개수
  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)

  // 로그아웃 시 상태 초기화
  useEffect(() => {
    if (!user?.id) {
      setChatRooms([])
      setCurrentRoom(null)
      setMessages([])
      setError(null)
    }
  }, [user?.id])

  // 초기 로드 및 전체 채팅방 구독
  useEffect(() => {
    if (user?.id) {
      loadChatRooms()

      // 전체 채팅방 새 메시지 구독
      allRoomsUnsubscribeRef.current = subscribeToAllRooms(user.id, () => {
        loadChatRooms()
      })
    }

    return () => {
      if (allRoomsUnsubscribeRef.current) {
        allRoomsUnsubscribeRef.current()
      }
      unsubscribeAll()
    }
  }, [user?.id, loadChatRooms])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current()
      }
    }
  }, [])

  const value = {
    chatRooms,
    currentRoom,
    messages,
    loading,
    error,
    totalUnreadCount,
    loadChatRooms,
    enterRoom,
    leaveRoom,
    sendMessage,
    startDirectChat,
    leaveChatRoom,
    loadMembers,
    editMessage,
    deleteMessage
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export default ChatContext
