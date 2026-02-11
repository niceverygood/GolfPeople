import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin, Calendar, Users, Star, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCompletedRoundings } from '../lib/joinService'
import { db } from '../lib/supabase'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

export default function RoundingHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [roundings, setRoundings] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoading(true)

      const [roundingResult, scoreResult] = await Promise.all([
        getCompletedRoundings(user.id),
        db.scores.getAll(user.id),
      ])

      if (roundingResult.success) setRoundings(roundingResult.roundings)
      if (scoreResult.data) setScores(scoreResult.data)

      setLoading(false)
    }
    load()
  }, [user?.id])

  // 해당 조인에 스코어가 기록되었는지 확인
  const hasScoreForJoin = (joinId) => {
    return scores.some(s => s.join_id === joinId)
  }

  // 해당 날짜에 스코어가 기록되었는지 확인 (join_id 없는 경우 날짜 매칭)
  const hasScoreForDate = (dateStr) => {
    return scores.some(s => s.date === dateStr)
  }

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
          <h1 className="text-lg font-bold">라운딩 기록</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : roundings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gp-card flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-gp-text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">아직 완료된 라운딩이 없어요</h3>
            <p className="text-gp-text-secondary text-sm">
              조인에 참가하고 라운딩을 완료하면 여기에 기록됩니다
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
              총 {roundings.length}회 라운딩
            </p>

            {roundings.map((rounding) => {
              const scored = hasScoreForJoin(rounding.id) || hasScoreForDate(rounding.date)
              const otherParticipants = rounding.participants.filter(p => p.id !== user?.id)

              return (
                <motion.div
                  key={rounding.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gp-card rounded-2xl p-4"
                >
                  {/* 날짜 & 골프장 */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gp-text-secondary mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(rounding.date)}</span>
                        {rounding.time && <span>· {rounding.time}</span>}
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
                  </div>

                  {/* 참가자 */}
                  {otherParticipants.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-gp-text-secondary" />
                      <div className="flex -space-x-2">
                        {otherParticipants.slice(0, 4).map((p) => (
                          <img
                            key={p.id}
                            src={p.photo}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gp-card"
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

                  {/* 액션 버튼들 */}
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
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
