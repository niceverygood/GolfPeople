import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MoreVertical, Calendar, MapPin, Flag, Ban, Trash2, Loader2 } from 'lucide-react'
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
  const { user } = useAuth()
  const { chatRooms, messages, loading, enterRoom, leaveRoom, sendMessage } = useChat()

  const [messageInput, setMessageInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [sending, setSending] = useState(false)
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
        await supabase.from('reports').insert({
          reporter_id: user.id,
          reported_user_id: chat.partnerId,
          reason: reason,
          status: 'pending'
        })
      }
    } catch (e) {
      console.error('신고 저장 에러:', e)
    }
    showToast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
  }

  const handleBlock = async () => {
    setShowMenu(false)
    if (!chat?.partnerId || !user?.id) return

    try {
      const { default: supabase, isConnected } = await import('../lib/supabase')
      if (isConnected() && supabase) {
        await supabase.from('blocks').insert({
          user_id: user.id,
          blocked_user_id: chat.partnerId
        })
      }
      const saved = localStorage.getItem('gp_blocked_users')
      const blockedList = saved ? JSON.parse(saved) : []
      blockedList.push({ id: chat.partnerId, name: chat.partnerName, photo: chat.partnerPhoto })
      localStorage.setItem('gp_blocked_users', JSON.stringify(blockedList))

      showToast.success('차단되었습니다.')
      navigate(-1)
    } catch (e) {
      console.error('차단 에러:', e)
      showToast.error('차단에 실패했습니다.')
    }
  }

  const handleLeave = () => {
    setShowMenu(false)
    if (confirm('채팅방을 나가시겠습니까?')) {
      navigate('/chat')
    }
  }

  // 로딩 중
  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gp-black">
        <div className="flex items-center px-4 py-3 bg-gp-card border-b border-gp-border safe-top">
          <button
            onClick={() => navigate(-1)}
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
            onClick={() => navigate(-1)}
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

  const formatDate = (timestamp) => {
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
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp)
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
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gp-border rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => chat?.partnerId && navigate(`/user/${chat.partnerId}`)}
            className="flex items-center gap-3"
          >
            <img
              src={chat?.partnerPhoto || 'https://via.placeholder.com/100'}
              alt={chat?.partnerName || ''}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-left">
              <h2 className="font-semibold">{chat?.partnerName || '채팅'}</h2>
              {chat?.type === 'join' && chat?.joinTitle && (
                <p className="text-xs text-gp-text-secondary">{chat.joinTitle}</p>
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
        {messages.length === 0 ? (
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
                const showTime = idx === dateMessages.length - 1 ||
                  dateMessages[idx + 1]?.senderId !== msg.senderId ||
                  new Date(dateMessages[idx + 1]?.timestamp).getMinutes() !== new Date(msg.timestamp).getMinutes()

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={chat?.partnerPhoto || 'https://via.placeholder.com/100'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                      />
                    )}

                    <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? 'bg-gp-gold text-gp-black rounded-br-md'
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
              onKeyPress={handleKeyPress}
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
        className="w-full max-w-[430px] bg-gp-black rounded-t-3xl p-6 safe-bottom"
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
