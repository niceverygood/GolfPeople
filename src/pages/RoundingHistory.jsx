import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin, Calendar, Users, Star, Target, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyJoinHistory } from '../lib/joinService'
import { db } from '../lib/supabase'
import { formatJoinDate as formatDate } from '../utils/formatTime'

const STATUS_LABELS = {
  open: { text: '모집중', color: 'bg-gp-green/20 text-gp-green' },
  confirmed: { text: '확정', color: 'bg-gp-blue/20 text-gp-blue' },
  in_progress: { text: '라운딩중', color: 'bg-gp-green/20 text-gp-green' },
  completed: { text: '완료', color: 'bg-gp-gold/20 text-gp-gold' },
  closed: { text: '마감', color: 'bg-gp-border text-gp-text-secondary' },
  cancelled: { text: '취소됨', color: 'bg-red-500/20 text-red-400' },
}

export default function RoundingHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [joins, setJoins] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, completed

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoading(true)

      const [joinResult, scoreResult] = await Promise.allSettled([
        getMyJoinHistory(user.id),
        db.scores.getAll(user.id),
      ])

      if (joinResult.status === 'fulfilled' && joinResult.value.success) {
        setJoins(joinResult.value.joins)
      }
      if (scoreResult.status === 'fulfilled' && scoreResult.value.data) {
        setScores(scoreResult.value.data)
      }

      setLoading(false)
    }
    load()
  }, [user?.id])

  const today = new Date().toISOString().split('T')[0]

  const filteredJoins = joins.filter(j => {
    if (filter === 'upcoming') return ['open', 'confirmed', 'in_progress'].includes(j.status)
    if (filter === 'completed') return j.status === 'completed'
    return true
  })

  const hasScoreForJoin = (joinId) => scores.some(s => s.join_id === joinId)
  const hasScoreForDate = (dateStr) => scores.some(s => s.date === dateStr)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="app-container bg-gp-black"
    >
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gp-black/95 backdrop-blur-sm border-b border-gp-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => location.key === 'default' ? navigate('/profile', { replace: true }) : navigate(-1)}
            className="p-2 -ml-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">내 조인 기록</h1>
          <div className="w-10" />
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { key: 'all', label: '전체' },
            { key: 'upcoming', label: '예정' },
            { key: 'completed', label: '완료' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-gp-gold text-gp-black'
                  : 'bg-gp-card text-gp-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredJoins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-gp-text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">
              {filter === 'upcoming' ? '예정된 조인이 없어요' : filter === 'completed' ? '완료된 라운딩이 없어요' : '참여한 조인이 없어요'}
            </h3>
            <p className="text-gp-text-secondary text-sm">
              조인에 참가하면 여기에 기록됩니다
            </p>
            <button
              onClick={() => navigate('/join')}
              className="mt-6 px-6 py-3 bg-gp-gold text-gp-black rounded-xl font-semibold"
            >
              조인 둘러보기
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            <p className="text-sm text-gp-text-secondary mb-2">
              총 {filteredJoins.length}건
            </p>

            {filteredJoins.map((rounding) => {
              const isCompleted = rounding.status === 'completed' || rounding.date < today
              const scored = hasScoreForJoin(rounding.id) || hasScoreForDate(rounding.date)
              const otherParticipants = (rounding.participants || []).filter(p => p.id !== user?.id)
              const statusInfo = STATUS_LABELS[rounding.status] || STATUS_LABELS.open
              const isHost = rounding.hostId === user?.id

              return (
                <motion.div
                  key={rounding.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gp-card rounded-2xl p-4"
                >
                  {/* 상태 배지 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      {isHost && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gp-gold/20 text-gp-gold">
                          호스트
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gp-text-secondary">
                      {rounding.spotsFilled}/{rounding.spotsTotal}명
                    </span>
                  </div>

                  {/* 날짜 & 골프장 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm text-gp-text-secondary mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(rounding.date)}</span>
                      {rounding.time && (
                        <>
                          <Clock className="w-3 h-3 ml-1" />
                          <span>{rounding.time}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">
                      {rounding.courseName || rounding.location || rounding.title}
                    </h3>
                    {rounding.region && (
                      <div className="flex items-center gap-1 text-gp-text-secondary text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{rounding.region}</span>
                      </div>
                    )}
                  </div>

                  {/* 참가자 */}
                  {otherParticipants.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-gp-text-secondary" />
                      <div className="flex -space-x-2">
                        {otherParticipants.slice(0, 4).map((p) => (
                          <img
                            key={p.id}
                            src={p.photo || '/default-profile.png'}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gp-card"
                            onError={(e) => { e.target.src = '/default-profile.png' }}
                          />
                        ))}
                        {otherParticipants.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gp-border flex items-center justify-center text-xs border-2 border-gp-card">
                            +{otherParticipants.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gp-text-secondary">
                        {otherParticipants.map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* 액션 버튼들 — 완료된 조인만 */}
                  {isCompleted && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/review?joinId=${rounding.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gp-border text-sm font-medium hover:bg-gp-gold/20 hover:text-gp-gold transition-all"
                      >
                        <Star className="w-4 h-4" />
                        리뷰 작성
                      </button>
                      <button
                        onClick={() => navigate(`/score?fromJoin=${rounding.id}`)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          scored
                            ? 'bg-gp-green/20 text-gp-green'
                            : 'btn-gold'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        {scored ? '기록 완료' : '스코어 기록'}
                      </button>
                    </div>
                  )}

                  {/* 예정 조인 — 상세보기 */}
                  {!isCompleted && (
                    <button
                      onClick={() => navigate(`/join/${rounding.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gp-border text-sm font-medium hover:bg-gp-gold/20 hover:text-gp-gold transition-all"
                    >
                      상세 보기
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
