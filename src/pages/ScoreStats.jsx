import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/supabase'

export default function ScoreStats() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const [stats, setStats] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // 'all', '6months', '3months', '1month'

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    setLoading(true)
    const [statsRes, scoresRes] = await Promise.all([
      db.scores.getStats(user.id),
      db.scores.getAll(user.id)
    ])
    
    if (statsRes.data) setStats(statsRes.data)
    if (scoresRes.data) setScores(scoresRes.data)
    setLoading(false)
  }

  // 기간 필터링
  const getFilteredScores = () => {
    if (period === 'all') return scores
    
    const now = new Date()
    const months = period === '6months' ? 6 : period === '3months' ? 3 : 1
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    
    return scores.filter(s => new Date(s.date) >= cutoff)
  }

  const filteredScores = getFilteredScores()
  
  // 필터된 데이터로 통계 재계산
  const calculateStats = () => {
    if (filteredScores.length === 0) return null
    
    const scoreValues = filteredScores.map(s => s.total_score)
    const avgScore = Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    const bestScore = Math.min(...scoreValues)
    const worstScore = Math.max(...scoreValues)
    
    // 핸디캡 계산
    const diffs = filteredScores.map(s => s.total_score - (s.par || 72))
    diffs.sort((a, b) => a - b)
    const best10 = diffs.slice(0, Math.min(10, diffs.length))
    const handicap = best10.length > 0 
      ? Math.round((best10.reduce((a, b) => a + b, 0) / best10.length) * 0.96 * 10) / 10
      : null

    // 코스별 통계
    const courseStats = {}
    filteredScores.forEach(s => {
      if (!courseStats[s.course_name]) {
        courseStats[s.course_name] = { scores: [], count: 0 }
      }
      courseStats[s.course_name].scores.push(s.total_score)
      courseStats[s.course_name].count++
    })

    const courseData = Object.entries(courseStats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
        best: Math.min(...data.scores)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { avgScore, bestScore, worstScore, handicap, courseData }
  }

  const displayStats = calculateStats()

  // 월별 평균 — filteredScores 기반으로 계산
  const filteredMonthly = (() => {
    const monthlyMap = {}
    filteredScores.forEach(s => {
      const month = s.date?.slice(0, 7) // "YYYY-MM"
      if (!month) return
      if (!monthlyMap[month]) monthlyMap[month] = { total: 0, count: 0 }
      monthlyMap[month].total += s.total_score
      monthlyMap[month].count++
    })
    return Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        avgScore: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  })()

  const getScoreColor = (score, par = 72) => {
    const diff = score - par
    if (diff <= -5) return 'text-purple-400'
    if (diff <= 0) return 'text-green-400'
    if (diff <= 10) return 'text-gp-gold'
    if (diff <= 18) return 'text-orange-400'
    return 'text-red-400'
  }

  const getProgressMessage = () => {
    if (!stats || stats.totalRounds < 2) return null
    
    const recent5 = filteredScores.slice(0, 5)
    const earlier5 = filteredScores.slice(5, 10)
    
    if (recent5.length < 3 || earlier5.length < 3) return null
    
    const recentAvg = recent5.reduce((a, b) => a + b.total_score, 0) / recent5.length
    const earlierAvg = earlier5.reduce((a, b) => a + b.total_score, 0) / earlier5.length
    const diff = Math.round(earlierAvg - recentAvg)
    
    if (diff > 0) {
      return { type: 'improve', message: `최근 5라운드 평균이 ${diff}타 줄었어요! 🔥` }
    } else if (diff < 0) {
      return { type: 'decline', message: `최근 조금 힘드셨나요? 화이팅! 💪` }
    }
    return { type: 'stable', message: '꾸준히 실력을 유지하고 있어요 👍' }
  }

  const progress = getProgressMessage()

  if (loading) {
    return (
      <div className="app-container bg-gp-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="app-container bg-gp-black"
    >
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gp-black/95 backdrop-blur-sm border-b border-gp-gray/30 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => location.key === 'default' ? navigate('/profile', { replace: true }) : navigate(-1)} className="p-2 -ml-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">내 성장 기록</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="pb-tab overflow-y-auto">
        {/* 기간 필터 */}
        <div className="px-4 py-4 border-b border-gp-gray/20">
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: '6months', label: '6개월' },
              { value: '3months', label: '3개월' },
              { value: '1month', label: '1개월' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-gp-gold text-gp-black'
                    : 'bg-gp-gray/30 text-gp-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {filteredScores.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gp-text-secondary">해당 기간에 기록이 없어요</p>
          </div>
        ) : (
          <>
            {/* 성장 메시지 */}
            {progress && (
              <div className={`mx-4 mt-4 p-4 rounded-2xl ${
                progress.type === 'improve' ? 'bg-green-500/10 border border-green-500/30' :
                progress.type === 'decline' ? 'bg-orange-500/10 border border-orange-500/30' :
                'bg-gp-gold/10 border border-gp-gold/30'
              }`}>
                <p className={`text-center font-medium ${
                  progress.type === 'improve' ? 'text-green-400' :
                  progress.type === 'decline' ? 'text-orange-400' :
                  'text-gp-gold'
                }`}>
                  {progress.message}
                </p>
              </div>
            )}

            {/* 주요 통계 */}
            {displayStats && (
              <div className="px-4 py-6">
                <h2 className="text-sm font-medium text-gp-text-secondary mb-3">요약</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gp-gray/20 rounded-2xl p-4">
                    <p className="text-xs text-gp-text-secondary mb-1">평균 스코어</p>
                    <p className={`text-3xl font-bold ${getScoreColor(displayStats.avgScore)}`}>
                      {displayStats.avgScore}
                    </p>
                  </div>
                  <div className="bg-gp-gray/20 rounded-2xl p-4">
                    <p className="text-xs text-gp-text-secondary mb-1">핸디캡</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {displayStats.handicap !== null ? displayStats.handicap : '-'}
                    </p>
                  </div>
                  <div className="bg-gp-gray/20 rounded-2xl p-4">
                    <p className="text-xs text-gp-text-secondary mb-1">베스트</p>
                    <p className={`text-3xl font-bold ${getScoreColor(displayStats.bestScore)}`}>
                      {displayStats.bestScore}
                    </p>
                  </div>
                  <div className="bg-gp-gray/20 rounded-2xl p-4">
                    <p className="text-xs text-gp-text-secondary mb-1">라운드 수</p>
                    <p className="text-3xl font-bold text-gp-gold">{filteredScores.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 스코어 추이 그래프 */}
            <div className="px-4 py-4">
              <h2 className="text-sm font-medium text-gp-text-secondary mb-3">스코어 추이</h2>
              <div className="bg-gp-gray/20 rounded-2xl p-4">
                <div className="h-40 flex items-end gap-1">
                  {filteredScores.slice(0, 20).reverse().map((score, idx) => {
                    const scores = filteredScores.map(s => s.total_score)
                    const minScore = Math.min(...scores) - 5
                    const maxScore = Math.max(...scores) + 5
                    const range = maxScore - minScore
                    const height = ((score.total_score - minScore) / range) * 100
                    
                    return (
                      <div key={score.id || idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t transition-all relative group"
                          style={{
                            height: `${Math.max(10, 100 - height)}%`,
                            backgroundColor: score.total_score <= 72 ? '#4ADE80' : 
                                            score.total_score <= 85 ? '#D4AF37' : 
                                            score.total_score <= 95 ? '#FB923C' : '#EF4444'
                          }}
                        >
                          {/* 툴팁 */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-gp-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {score.total_score}타
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gp-text-secondary">
                  <span>과거</span>
                  <span>최근</span>
                </div>
              </div>
            </div>

            {/* 월별 평균 — 기간 필터 적용 */}
            {filteredMonthly.length > 1 && (
              <div className="px-4 py-4">
                <h2 className="text-sm font-medium text-gp-text-secondary mb-3">월별 평균</h2>
                <div className="bg-gp-gray/20 rounded-2xl p-4">
                  <div className="space-y-3">
                    {filteredMonthly.slice(-6).map((month) => {
                      const [, m] = month.month.split('-')
                      const label = `${m}월`
                      const maxAvg = Math.max(...filteredMonthly.map(d => d.avgScore))
                      const minAvg = Math.min(...filteredMonthly.map(d => d.avgScore))
                      const range = maxAvg - minAvg || 1
                      const width = ((maxAvg - month.avgScore) / range) * 60 + 40

                      return (
                        <div key={month.month} className="flex items-center gap-3">
                          <span className="text-xs text-gp-text-secondary w-8">{label}</span>
                          <div className="flex-1 h-6 bg-gp-gray/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center justify-end px-2"
                              style={{
                                width: `${width}%`,
                                backgroundColor: month.avgScore <= 72 ? '#4ADE80' :
                                                month.avgScore <= 85 ? '#D4AF37' :
                                                month.avgScore <= 95 ? '#FB923C' : '#EF4444'
                              }}
                            >
                              <span className="text-xs font-bold text-gp-black">{month.avgScore}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 자주 가는 코스 */}
            {displayStats?.courseData && displayStats.courseData.length > 0 && (
              <div className="px-4 py-4">
                <h2 className="text-sm font-medium text-gp-text-secondary mb-3">자주 가는 코스</h2>
                <div className="space-y-2">
                  {displayStats.courseData.map((course, idx) => (
                    <div key={idx} className="bg-gp-gray/20 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{course.name}</p>
                        <p className="text-xs text-gp-text-secondary">{course.count}회 방문</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getScoreColor(course.avg)}`}>
                          평균 {course.avg}
                        </p>
                        <p className="text-xs text-green-400">베스트 {course.best}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 스코어 분포 */}
            <div className="px-4 py-4 pb-8">
              <h2 className="text-sm font-medium text-gp-text-secondary mb-3">스코어 분포</h2>
              <div className="bg-gp-gray/20 rounded-2xl p-4">
                {(() => {
                  const distribution = {
                    under80: 0,
                    '80s': 0,
                    '90s': 0,
                    over100: 0,
                  }
                  
                  filteredScores.forEach(s => {
                    if (s.total_score < 80) distribution.under80++
                    else if (s.total_score < 90) distribution['80s']++
                    else if (s.total_score < 100) distribution['90s']++
                    else distribution.over100++
                  })
                  
                  const total = filteredScores.length
                  
                  return (
                    <div className="space-y-3">
                      {[
                        { label: '70대', key: 'under80', color: 'bg-green-400' },
                        { label: '80대', key: '80s', color: 'bg-gp-gold' },
                        { label: '90대', key: '90s', color: 'bg-orange-400' },
                        { label: '100+', key: 'over100', color: 'bg-red-400' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-3">
                          <span className="text-xs text-gp-text-secondary w-10">{item.label}</span>
                          <div className="flex-1 h-6 bg-gp-gray/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full flex items-center justify-end px-2`}
                              style={{ width: `${(distribution[item.key] / total) * 100}%` }}
                            >
                              {distribution[item.key] > 0 && (
                                <span className="text-xs font-bold text-gp-black">
                                  {distribution[item.key]}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gp-text-secondary w-10 text-right">
                            {Math.round((distribution[item.key] / total) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

