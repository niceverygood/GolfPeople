import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MoreVertical, Calendar, MapPin, Flag, Ban, Trash2, Loader2, Users, Pencil, X, Check } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { formatChatTime } from '../utils/formatTime'
import { showToast } from '../utils/errorHandler'

// 메시지 sanitize 함수 (XSS 방지)
const sanitizeMessage = (text) => {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

export default function ChatRoom() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { chatRooms, messages, loading, enterRoom, leaveRoom, sendMessage, leaveChatRoom, loadMembers, editMessage, deleteMessage } = useChat()

  const [messageInput, setMessageInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState([])
  const [sending, setSending] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 현재 채팅방 정보
  const chat = chatRooms.find(c => c.id === chatId)

  // 채팅방 입장
  useEffect(() => {
    if (chatId) {
      enterRoom(chatId)
    }

    return () => {
      leaveRoom()
    }
  }, [chatId, enterRoom, leaveRoom])

  // 새 메시지 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return

    const sanitizedText = sanitizeMessage(messageInput.trim())
    if (!sanitizedText) return

    setSending(true)
    setMessageInput('')

    const result = await sendMessage(sanitizedText)

    if (!result.success) {
      showToast.error('메시지 전송에 실패했습니다')
      setMessageInput(sanitizedText)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 멤버 목록 보기
  const handleShowMembers = async () => {
    setShowMenu(false)
    const result = await loadMembers(chatId)
    if (result.success) {
      setMembers(result.members)
      setShowMembers(true)
    }
  }

  const handleReport = () => {
    setShowMenu(false)
    setShowReportModal(true)
  }

  const handleSubmitReport = async (reason) => {
    setShowReportModal(false)
    if (!chat?.partnerId || !user?.id) return

    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (isConnected() && supabase) {
        const { error } = await supabase.from('reports').insert({
          reporter_id: user.id,
          reported_user_id: chat.partnerId,
          reason: reason,
          status: 'pending'
        })
        if (error) throw error
      }
      showToast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
    } catch (e) {
      console.error('신고 저장 에러:', e)
      showToast.error('신고 접수에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleBlock = async () => {
    setShowMenu(false)
    if (!chat?.partnerId || !user?.id) return

    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (isConnected() && supabase) {
        const { error } = await supabase.from('blocks').insert({
          user_id: user.id,
          blocked_user_id: chat.partnerId
        })
        if (error) throw error
      }
      let blockedList = []
      try { blockedList = JSON.parse(localStorage.getItem('gp_blocked_users') || '[]') } catch { blockedList = [] }
      blockedList.push({ id: chat.partnerId, name: chat.partnerName, photo: chat.partnerPhoto })
      // localStorage 무한 증가 방지: 최근 200명만 유지
      if (blockedList.length > 200) blockedList = blockedList.slice(-200)
      localStorage.setItem('gp_blocked_users', JSON.stringify(blockedList))

      showToast.success('차단되었습니다.')
      if (location.key === 'default') {
        navigate('/chat', { replace: true })
      } else {
        navigate(-1)
      }
    } catch (e) {
      console.error('차단 에러:', e)
      showToast.error('차단에 실패했습니다.')
    }
  }

  const handleLeave = () => {
    setShowMenu(false)
    setShowLeaveConfirm(true)
  }

  const confirmLeave = async () => {
    setShowLeaveConfirm(false)
    const result = await leaveChatRoom(chatId)
    if (result.success) {
      showToast.success('채팅방을 나갔습니다')
    } else {
      showToast.error('채팅방 나가기에 실패했습니다')
    }
    navigate('/chat', { replace: true })
  }

  // 메시지 길게 누르기 (자기 메시지만)
  const handleMessageLongPress = (msg) => {
    if (msg.senderId !== user?.id || msg.type === 'system' || msg.pending) return
    setSelectedMessage(msg)
  }

  // 메시지 수정
  const handleEditMessage = () => {
    if (!selectedMessage) return
    setEditingMessage(selectedMessage)
    setEditText(selectedMessage.text)
    setSelectedMessage(null)
  }

  // 메시지 수정 확인
  const handleEditConfirm = async () => {
    if (!editingMessage || !editText.trim()) return

    const sanitized = sanitizeMessage(editText.trim())
    if (!sanitized) return

    const result = await editMessage(editingMessage.id, sanitized)
    if (result.success) {
      showToast.success('메시지가 수정되었습니다')
    } else {
      showToast.error('메시지 수정에 실패했습니다')
    }
    setEditingMessage(null)
    setEditText('')
  }

  // 나에게서 삭제 (로컬 숨김)
  const handleDeleteForMe = () => {
    if (!selectedMessage) return
    let hidden = []
    try { hidden = JSON.parse(localStorage.getItem('gp_hidden_messages') || '[]') } catch { hidden = [] }
    if (!hidden.includes(selectedMessage.id)) {
      hidden.push(selectedMessage.id)
      // localStorage 무한 증가 방지: 최근 500건만 유지
      if (hidden.length > 500) hidden = hidden.slice(-500)
      localStorage.setItem('gp_hidden_messages', JSON.stringify(hidden))
    }
    setSelectedMessage(null)
    showToast.success('나에게서 삭제되었습니다')
  }

  // 모두에게서 삭제 (DB 삭제)
  const handleDeleteForAll = async () => {
    if (!selectedMessage) return

    const result = await deleteMessage(selectedMessage.id)
    if (result.success) {
      showToast.success('모두에게서 삭제되었습니다')
    } else {
      showToast.error('메시지 삭제에 실패했습니다')
    }
    setSelectedMessage(null)
  }

  // 숨긴 메시지 필터링 (memoized + error guard)
  const hiddenMessages = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('gp_hidden_messages') || '[]')
    } catch {
      localStorage.removeItem('gp_hidden_messages')
      return []
    }
  }, [messages])
  const visibleMessages = messages.filter(m => !hiddenMessages.includes(m.id))

  // 로딩 중
  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gp-black">
        <div className="flex items-center px-4 py-3 bg-gp-card border-b border-gp-border safe-top">
          <button
            onClick={() => location.key === 'default' ? navigate('/chat', { replace: true }) : navigate(-1)}
            className="p-2 -ml-2 hover:bg-gp-border rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gp-gold animate-spin" />
        </div>
      </div>
    )
  }

  // 채팅방 없음
  if (!chat && !loading) {
    return (
      <div className="flex flex-col h-full bg-gp-black">
        <div className="flex items-center px-4 py-3 bg-gp-card border-b border-gp-border safe-top">
          <button
            onClick={() => location.key === 'default' ? navigate('/chat', { replace: true }) : navigate(-1)}
            className="p-2 -ml-2 hover:bg-gp-border rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gp-text-secondary">채팅방을 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  const getDateGroupLabel = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    }
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }

  // 메시지를 날짜별로 그룹화
  const groupedMessages = visibleMessages.reduce((groups, msg) => {
    const date = getDateGroupLabel(msg.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(msg)
    return groups
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-gp-black"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gp-card border-b border-gp-border safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => location.key === 'default' ? navigate('/chat', { replace: true }) : navigate(-1)}
            className="p-2 -ml-2 hover:bg-gp-border rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (chat?.type === 'join' && chat?.joinId) {
                navigate(`/join/${chat.joinId}`)
              } else if (chat?.partnerId) {
                navigate(`/user/${chat.partnerId}`)
              }
            }}
            className="flex items-center gap-3"
          >
            {chat?.type === 'join' ? (
              <div className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center">
                <Users className="w-5 h-5 text-gp-gold" />
              </div>
            ) : (
              <img
                src={chat?.partnerPhoto || '/default-profile.png'}
                alt={chat?.partnerName || ''}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="text-left">
              <h2 className="font-semibold">{chat?.type === 'join' ? (chat?.joinTitle || '그룹 채팅') : (chat?.partnerName || '채팅')}</h2>
              {chat?.type === 'join' && (
                <p className="text-xs text-gp-text-secondary">조인 상세 보기</p>
              )}
            </div>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gp-border rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-40 bg-gp-card rounded-xl overflow-hidden shadow-xl z-50 border border-gp-border"
                >
                  {chat?.type === 'join' && (
                    <button
                      onClick={handleShowMembers}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gp-border flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-gp-text-secondary" />
                      멤버 목록
                    </button>
                  )}
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gp-border flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4 text-gp-text-secondary" />
                    신고하기
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gp-border flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4 text-gp-text-secondary" />
                    차단하기
                  </button>
                  <button
                    onClick={handleLeave}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gp-border flex items-center gap-2 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    나가기
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 조인 정보 */}
      {chat?.type === 'join' && chat?.joinInfo && (
        <div className="px-4 py-3 bg-gp-card/50 border-b border-gp-border">
          <div className="flex items-center gap-4 text-sm text-gp-text-secondary">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{chat.joinInfo.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{chat.joinInfo.location}</span>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {visibleMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gp-text-secondary text-sm">메시지를 보내 대화를 시작하세요</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-gp-card rounded-full text-xs text-gp-text-secondary">
                  {date}
                </span>
              </div>

              {dateMessages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id
                const isSystem = msg.type === 'system'
                const showTime = !isSystem && (idx === dateMessages.length - 1 ||
                  dateMessages[idx + 1]?.senderId !== msg.senderId ||
                  new Date(dateMessages[idx + 1]?.timestamp).getMinutes() !== new Date(msg.timestamp).getMinutes())
                const showSenderName = !isMe && !isSystem && chat?.type === 'join' && (
                  idx === 0 || dateMessages[idx - 1]?.senderId !== msg.senderId || dateMessages[idx - 1]?.type === 'system'
                )
                const showAvatar = !isMe && !isSystem && (
                  idx === 0 || dateMessages[idx - 1]?.senderId !== msg.senderId || dateMessages[idx - 1]?.type === 'system'
                )

                // 시스템 메시지 (카카오톡 스타일)
                if (isSystem) {
                  return (
                    <div key={msg.id || idx} className="flex justify-center my-3">
                      <span className="px-4 py-1.5 bg-gp-card/60 rounded-full text-xs text-gp-text-secondary">
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="w-8 mr-2">
                        {showAvatar ? (
                          <img
                            src={msg.senderPhoto || '/default-profile.png'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover mt-1 cursor-pointer"
                            onClick={() => msg.senderId && navigate(`/user/${msg.senderId}`)}
                          />
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showSenderName && msg.senderName && (
                        <span className="text-xs text-gp-text-secondary mb-1 px-1">{msg.senderName}</span>
                      )}
                      <div
                        onClick={() => isMe && !msg.pending && handleMessageLongPress(msg)}
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? 'bg-gp-gold text-gp-black rounded-br-md cursor-pointer active:opacity-80'
                            : 'bg-gp-card text-gp-text rounded-bl-md'
                        } ${msg.pending ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-keep leading-relaxed">{msg.text}</p>
                      </div>

                      {showTime && (
                        <span className="text-xs text-gp-text-secondary mt-1 px-1">
                          {formatChatTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-3 bg-gp-card border-t border-gp-border safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gp-surface rounded-2xl">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-sm resize-none focus:outline-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            className={`p-3 rounded-full transition-all ${
              messageInput.trim() && !sending
                ? 'bg-gp-gold text-gp-black'
                : 'bg-gp-border text-gp-text-secondary'
            }`}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {/* 신고 모달 */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            userName={chat?.partnerName}
            onSubmit={handleSubmitReport}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 멤버 목록 모달 */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
            onClick={() => setShowMembers(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-app bg-gp-dark rounded-t-3xl p-6 safe-bottom"
            >
              <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />
              <h2 className="text-lg font-bold mb-4">멤버 ({members.length}명)</h2>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setShowMembers(false)
                      if (member.id !== user?.id) navigate(`/user/${member.id}`)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gp-card transition-colors"
                  >
                    <img
                      src={member.photo || '/default-profile.png'}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium">
                      {member.name}
                      {member.id === user?.id && <span className="text-xs text-gp-text-secondary ml-1">(나)</span>}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="w-full mt-4 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메시지 액션 모달 (수정/삭제) */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-64 bg-gp-dark rounded-2xl overflow-hidden border border-gp-border"
            >
              <button
                onClick={handleEditMessage}
                className="w-full px-4 py-3.5 text-left text-sm hover:bg-gp-card flex items-center gap-3 border-b border-gp-border"
              >
                <Pencil className="w-4 h-4 text-gp-gold" />
                수정
              </button>
              <button
                onClick={handleDeleteForMe}
                className="w-full px-4 py-3.5 text-left text-sm hover:bg-gp-card flex items-center gap-3 border-b border-gp-border"
              >
                <X className="w-4 h-4 text-gp-text-secondary" />
                나에게서 삭제
              </button>
              <button
                onClick={handleDeleteForAll}
                className="w-full px-4 py-3.5 text-left text-sm hover:bg-gp-card flex items-center gap-3 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                모두에게서 삭제
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메시지 수정 모드 */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gp-card border-t border-gp-border safe-bottom z-30"
          >
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gp-border">
              <Pencil className="w-4 h-4 text-gp-gold" />
              <span className="text-xs text-gp-gold flex-1">메시지 수정 중</span>
              <button onClick={() => { setEditingMessage(null); setEditText('') }}>
                <X className="w-4 h-4 text-gp-text-secondary" />
              </button>
            </div>
            <div className="flex items-end gap-2 px-4 py-3">
              <div className="flex-1 bg-gp-surface rounded-2xl">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleEditConfirm()
                    }
                  }}
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent text-sm resize-none focus:outline-none max-h-32"
                  style={{ minHeight: '44px' }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleEditConfirm}
                disabled={!editText.trim()}
                className={`p-3 rounded-full transition-all ${
                  editText.trim()
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-border text-gp-text-secondary'
                }`}
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 채팅방 나가기 확인 모달 */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[85%] max-w-sm bg-gp-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold mb-2">채팅방 나가기</h3>
              <p className="text-sm text-gp-text-secondary mb-5">
                나가면 대화 내용이 사라집니다. 정말 나가시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium"
                >
                  나가기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const REPORT_REASONS = [
  '허위 프로필 (사진/정보 불일치)',
  '불쾌한 메시지 또는 행동',
  '광고/스팸',
  '욕설/비방/성희롱',
  '사기 의심',
  '기타',
]

function ReportModal({ userName, onSubmit, onClose }) {
  const [selectedReason, setSelectedReason] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-gp-black rounded-t-3xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-gp-border rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">{userName}님 신고하기</h2>
        <p className="text-sm text-gp-text-secondary mb-5">신고 사유를 선택해주세요.</p>

        <div className="space-y-2 mb-6">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                selectedReason === reason
                  ? 'bg-gp-green/20 text-gp-green border border-gp-green'
                  : 'bg-gp-card text-white border border-transparent'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gp-border text-gp-text-secondary font-medium"
          >
            취소
          </button>
          <button
            onClick={() => selectedReason && onSubmit(selectedReason)}
            disabled={!selectedReason}
            className={`flex-1 py-3 rounded-xl font-medium ${
              selectedReason ? 'bg-gp-red text-white' : 'bg-gp-border/50 text-gp-text-secondary'
            }`}
          >
            신고하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
