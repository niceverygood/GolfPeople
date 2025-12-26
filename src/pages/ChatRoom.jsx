import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Image, MoreVertical, Phone, Calendar, MapPin, X, Flag, Ban, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ChatRoom() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { chatRooms, sendMessage, markChatAsRead } = useApp()
  const [message, setMessage] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const chat = chatRooms.find(c => c.id === chatId)

  // 채팅방 진입 시 읽음 처리
  useEffect(() => {
    if (chat) {
      markChatAsRead(chatId)
    }
  }, [chatId, chat, markChatAsRead])

  // 새 메시지 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  const handleSend = () => {
    if (!message.trim()) return
    
    sendMessage(chatId, {
      text: message.trim(),
      senderId: 'me',
      timestamp: new Date().toISOString()
    })
    setMessage('')
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
    alert('신고가 접수되었습니다.')
  }

  const handleBlock = () => {
    setShowMenu(false)
    if (confirm(`${chat?.partnerName}님을 차단하시겠습니까?`)) {
      alert('차단되었습니다.')
      navigate(-1)
    }
  }

  const handleLeave = () => {
    setShowMenu(false)
    if (confirm('채팅방을 나가시겠습니까?')) {
      navigate('/saved?tab=matched')
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gp-text-secondary">채팅방을 찾을 수 없습니다</p>
      </div>
    )
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
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
  const groupedMessages = chat.messages.reduce((groups, msg) => {
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
            onClick={() => navigate(`/user/${chat.partnerId}`)}
            className="flex items-center gap-3"
          >
            <img
              src={chat.partnerPhoto}
              alt={chat.partnerName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-left">
              <h2 className="font-semibold">{chat.partnerName}</h2>
              {chat.type === 'join' && (
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

          {/* 메뉴 드롭다운 */}
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

      {/* 조인 정보 (조인 채팅방인 경우) */}
      {chat.type === 'join' && chat.joinInfo && (
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
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date}>
            {/* 날짜 구분선 */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-gp-card rounded-full text-xs text-gp-text-secondary">
                {date}
              </span>
            </div>

            {/* 메시지들 */}
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === 'me'
              const showTime = idx === messages.length - 1 || 
                messages[idx + 1]?.senderId !== msg.senderId ||
                new Date(messages[idx + 1]?.timestamp).getMinutes() !== new Date(msg.timestamp).getMinutes()

              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <img
                      src={chat.partnerPhoto}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                    />
                  )}
                  
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`inline-block px-4 py-2.5 rounded-2xl ${
                        isMe
                          ? 'bg-gp-gold text-gp-black rounded-br-md'
                          : 'bg-gp-card text-gp-text rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    </div>
                    
                    {showTime && (
                      <span className="text-xs text-gp-text-secondary mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-3 bg-gp-card border-t border-gp-border safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gp-surface rounded-2xl">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-sm resize-none focus:outline-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`p-3 rounded-full transition-all ${
              message.trim()
                ? 'bg-gp-gold text-gp-black'
                : 'bg-gp-border text-gp-text-secondary'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

