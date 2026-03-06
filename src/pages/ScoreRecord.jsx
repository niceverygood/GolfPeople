import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/supabase'
import { haptic } from '../lib/native'
import { getJoinDetail } from '../lib/joinService'
import golfCourses from '../data/golfCourses.json'
import { showToast } from '../utils/errorHandler'
import { validateRequired, validateGolfScore } from '../utils/validation'
import { ButtonLoading } from '../components/LoadingSpinner'
import Portal from '../components/Portal'

// 날씨 옵션
const WEATHER_OPTIONS = [
  { value: 'sunny', label: '☀️ 맑음', icon: '☀️' },
  { value: 'cloudy', label: '☁️ 흐림', icon: '☁️' },
  { value: 'rainy', label: '🌧️ 비', icon: '🌧️' },
  { value: 'windy', label: '💨 바람', icon: '💨' },
]

export default function ScoreRecord() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingScore, setEditingScore] = useState(null)
  const [stats, setStats] = useState(null)
  const [fromJoinId, setFromJoinId] = useState(null)

  // 폼 상태
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    course_name: '',
    course_region: '',
    total_score: '',
    front_nine: '',
    back_nine: '',
    par: 72,
    putts: '',
    fairway_hits: '',
    greens_in_regulation: '',
    weather: 'sunny',
    note: '',
    partners: [],
  })

  const [searchCourse, setSearchCourse] = useState('')
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)
  
  // 코스 검색 결과
  const filteredCourses = searchCourse.length > 0
    ? golfCourses.filter(c => 
        c.name.toLowerCase().includes(searchCourse.toLowerCase()) ||
        c.region?.toLowerCase().includes(searchCourse.toLowerCase())
      ).slice(0, 10)
    : []

  useEffect(() => {
    if (user?.id) {
      loadScores()
      loadStats()
    }
  }, [user?.id])

  // fromJoin 파라미터로 조인 데이터 자동 채움
  useEffect(() => {
    const joinId = searchParams.get('fromJoin')
    if (!joinId) return

    setFromJoinId(joinId)

    const loadJoinData = async () => {
      const result = await getJoinDetail(joinId)
      if (result.success && result.join) {
        const j = result.join
        setForm(prev => ({
          ...prev,
          date: j.date || prev.date,
          course_name: j.course_name || j.location || '',
          course_region: j.region || '',
        }))
        setSearchCourse(j.course_name || j.location || '')
        setShowAddModal(true)
      }
    }
    loadJoinData()
  }, [searchParams])

  const loadScores = async () => {
    const { data } = await db.scores.getAll(user.id)
    if (data) setScores(data)
  }

  const loadStats = async () => {
    const { data } = await db.scores.getStats(user.id)
    if (data) setStats(data)
  }

  const handleSelectCourse = (course) => {
    setForm(prev => ({
      ...prev,
      course_name: course.name,
      course_region: course.region || ''
    }))
    setSearchCourse(course.name)
    setShowCourseDropdown(false)
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      showToast.error('로그인이 필요합니다')
      return
    }

    // 입력값 검증
    const courseValidation = validateRequired(form.course_name, '코스명')
    if (!courseValidation.valid) {
      showToast.warning(courseValidation.message)
      return
    }

    const scoreValidation = validateGolfScore(form.total_score)
    if (!scoreValidation.valid) {
      showToast.warning(scoreValidation.message)
      return
    }

    setLoading(true)
    haptic.impact('medium')

    try {
      const scoreData = {
        user_id: user.id,
        date: form.date,
        course_name: form.course_name,
        course_region: form.course_region,
        total_score: parseInt(form.total_score),
        front_nine: form.front_nine ? parseInt(form.front_nine) : null,
        back_nine: form.back_nine ? parseInt(form.back_nine) : null,
        par: form.par,
        putts: form.putts ? parseInt(form.putts) : null,
        fairway_hits: form.fairway_hits ? parseInt(form.fairway_hits) : null,
        greens_in_regulation: form.greens_in_regulation ? parseInt(form.greens_in_regulation) : null,
        weather: form.weather,
        note: form.note,
        partners: form.partners,
        ...(fromJoinId && !editingScore ? { join_id: fromJoinId } : {}),
      }

      let result
      if (editingScore) {
        result = await db.scores.update(editingScore.id, scoreData)
      } else {
        result = await db.scores.create(scoreData)
      }

      if (result?.error) {
        throw result.error
      }

      await loadScores()
      await loadStats()
      resetForm()
      setShowAddModal(false)
      setEditingScore(null)
      showToast.success('스코어가 저장되었습니다!')
    } catch (error) {
      console.error('스코어 저장 실패:', error)
      showToast.error('저장에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (score) => {
    setEditingScore(score)
    setForm({
      date: score.date,
      course_name: score.course_name,
      course_region: score.course_region || '',
      total_score: score.total_score.toString(),
      front_nine: score.front_nine?.toString() || '',
      back_nine: score.back_nine?.toString() || '',
      par: score.par || 72,
      putts: score.putts?.toString() || '',
      fairway_hits: score.fairway_hits?.toString() || '',
      greens_in_regulation: score.greens_in_regulation?.toString() || '',
      weather: score.weather || 'sunny',
      note: score.note || '',
      partners: score.partners || [],
    })
    setSearchCourse(score.course_name)
    setShowAddModal(true)
  }

  const handleDelete = async (scoreId) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return

    haptic.impact('medium')
    const { error } = await db.scores.delete(scoreId)
    if (error) {
      console.error('스코어 삭제 실패:', error)
      showToast.error('삭제에 실패했습니다')
      return
    }
    await loadScores()
    await loadStats()
  }

  const resetForm = () => {
    setFromJoinId(null)
    setForm({
      date: new Date().toISOString().split('T')[0],
      course_name: '',
      course_region: '',
      total_score: '',
      front_nine: '',
      back_nine: '',
      par: 72,
      putts: '',
      fairway_hits: '',
      greens_in_regulation: '',
      weather: 'sunny',
      note: '',
      partners: [],
    })
    setSearchCourse('')
  }

  const getScoreColor = (score, par = 72) => {
    const diff = score - par
    if (diff <= -5) return 'text-purple-400' // Eagle 이하
    if (diff <= 0) return 'text-green-400' // 언더파
    if (diff <= 10) return 'text-gp-gold' // 80대 초반
    if (diff <= 18) return 'text-orange-400' // 90대
    return 'text-red-400' // 100 이상
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
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
          <h1 className="text-lg font-bold text-white">스코어 기록</h1>
          <button
            onClick={() => {
              resetForm()
              setEditingScore(null)
              setShowAddModal(true)
            }}
            className="p-2 -mr-2"
          >
            <svg className="w-6 h-6 text-gp-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="pb-tab overflow-y-auto">
        {/* 통계 요약 */}
        {stats && (
          <div className="px-4 py-6 border-b border-gp-gray/20">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gp-gray/30 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-gp-gold">{stats.totalRounds}</p>
                <p className="text-xs text-gp-text-secondary mt-1">총 라운드</p>
              </div>
              <div className="bg-gp-gray/30 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}</p>
                <p className="text-xs text-gp-text-secondary mt-1">평균</p>
              </div>
              <div className="bg-gp-gray/30 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>{stats.bestScore}</p>
                <p className="text-xs text-gp-text-secondary mt-1">베스트</p>
              </div>
              <div className="bg-gp-gray/30 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {stats.handicap !== null ? stats.handicap : '-'}
                </p>
                <p className="text-xs text-gp-text-secondary mt-1">핸디캡</p>
              </div>
            </div>

            {/* 성장 그래프 미니 버전 */}
            {stats.recentScores.length > 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gp-text-secondary">최근 {stats.recentScores.length}라운드</span>
                  <button 
                    onClick={() => navigate('/score-stats')}
                    className="text-xs text-gp-gold"
                  >
                    상세 보기 →
                  </button>
                </div>
                <div className="h-16 flex items-end gap-1">
                  {stats.recentScores.map((score, idx) => {
                    const minScore = Math.min(...stats.recentScores.map(s => s.total_score)) - 5
                    const maxScore = Math.max(...stats.recentScores.map(s => s.total_score)) + 5
                    const height = ((score.total_score - minScore) / (maxScore - minScore)) * 100
                    return (
                      <div
                        key={score.id || idx}
                        className="flex-1 rounded-t transition-all"
                        style={{
                          height: `${Math.max(20, 100 - height)}%`,
                          backgroundColor: score.total_score <= 72 ? '#4ADE80' : 
                                          score.total_score <= 85 ? '#D4AF37' : 
                                          score.total_score <= 95 ? '#FB923C' : '#EF4444'
                        }}
                        title={`${score.total_score}타`}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 스코어 목록 */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-medium text-gp-text-secondary mb-3">기록 히스토리</h2>
          
          {scores.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gp-gray/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-gp-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gp-text-secondary mb-2">아직 기록이 없어요</p>
              <p className="text-sm text-gp-text-secondary/60">
                라운딩 후 스코어를 기록해보세요
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2 bg-gp-gold text-gp-black rounded-full font-medium"
              >
                첫 기록 남기기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <motion.div
                  key={score.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gp-gray/20 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gp-text-secondary">{formatDate(score.date)}</span>
                        {score.weather && (
                          <span className="text-xs">
                            {WEATHER_OPTIONS.find(w => w.value === score.weather)?.icon}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-white">{score.course_name}</h3>
                      {score.course_region && (
                        <p className="text-xs text-gp-text-secondary">{score.course_region}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(score.total_score, score.par)}`}>
                        {score.total_score}
                      </p>
                      <p className="text-xs text-gp-text-secondary">
                        {score.total_score - (score.par || 72) > 0 ? '+' : ''}
                        {score.total_score - (score.par || 72)} (Par {score.par || 72})
                      </p>
                    </div>
                  </div>
                  
                  {/* 추가 정보 */}
                  <div className="mt-3 pt-3 border-t border-gp-gray/20 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-gp-text-secondary">
                      {score.front_nine && score.back_nine && (
                        <span>전반 {score.front_nine} / 후반 {score.back_nine}</span>
                      )}
                      {score.putts && <span>퍼팅 {score.putts}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(score)}
                        className="p-1.5 text-gp-text-secondary hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(score.id)}
                        className="p-1.5 text-gp-text-secondary hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {score.note && (
                    <p className="mt-2 text-sm text-gp-text-secondary italic">"{score.note}"</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 스코어 입력 모달 */}
      <AnimatePresence>
        {showAddModal && (
          <Portal><motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-end"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[90vh] bg-gp-black rounded-t-3xl overflow-hidden"
            >
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-gp-black border-b border-gp-gray/20 px-4 py-4 flex items-center justify-between">
                <button 
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingScore(null)
                  }}
                  className="text-gp-text-secondary"
                >
                  취소
                </button>
                <h2 className="font-bold text-white">
                  {editingScore ? '기록 수정' : '스코어 기록'}
                </h2>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-gp-gold font-medium disabled:opacity-50"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="overflow-y-auto p-4 pb-8 space-y-6" style={{ maxHeight: 'calc(90vh - 60px)' }}>
                {/* 날짜 */}
                <div>
                  <label className="block text-sm text-gp-text-secondary mb-2">날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                  />
                </div>

                {/* 코스 검색 */}
                <div className="relative">
                  <label className="block text-sm text-gp-text-secondary mb-2">골프장</label>
                  <input
                    type="text"
                    value={searchCourse}
                    onChange={(e) => {
                      setSearchCourse(e.target.value)
                      setForm(prev => ({ ...prev, course_name: e.target.value }))
                      setShowCourseDropdown(true)
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    placeholder="골프장 이름 검색"
                    className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                  />
                  {showCourseDropdown && filteredCourses.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gp-gray rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                      {filteredCourses.map((course, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectCourse(course)}
                          className="w-full px-4 py-3 text-left hover:bg-gp-gray/50 border-b border-gp-gray/30 last:border-b-0"
                        >
                          <p className="text-white font-medium">{course.name}</p>
                          {course.region && (
                            <p className="text-xs text-gp-text-secondary">{course.region}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 스코어 입력 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gp-text-secondary mb-2">총 스코어 *</label>
                    <input
                      type="number"
                      value={form.total_score}
                      onChange={(e) => setForm(prev => ({ ...prev, total_score: e.target.value }))}
                      placeholder="85"
                      className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white text-center text-xl font-bold placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gp-text-secondary mb-2">전반</label>
                    <input
                      type="number"
                      value={form.front_nine}
                      onChange={(e) => setForm(prev => ({ ...prev, front_nine: e.target.value }))}
                      placeholder="42"
                      className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white text-center placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gp-text-secondary mb-2">후반</label>
                    <input
                      type="number"
                      value={form.back_nine}
                      onChange={(e) => setForm(prev => ({ ...prev, back_nine: e.target.value }))}
                      placeholder="43"
                      className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white text-center placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                    />
                  </div>
                </div>

                {/* Par 설정 */}
                <div>
                  <label className="block text-sm text-gp-text-secondary mb-2">코스 Par</label>
                  <div className="flex gap-2">
                    {[70, 71, 72, 73].map((par) => (
                      <button
                        key={par}
                        onClick={() => setForm(prev => ({ ...prev, par }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                          form.par === par
                            ? 'bg-gp-gold text-gp-black'
                            : 'bg-gp-gray/30 text-gp-text-secondary'
                        }`}
                      >
                        {par}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 날씨 */}
                <div>
                  <label className="block text-sm text-gp-text-secondary mb-2">날씨</label>
                  <div className="flex gap-2">
                    {WEATHER_OPTIONS.map((weather) => (
                      <button
                        key={weather.value}
                        onClick={() => setForm(prev => ({ ...prev, weather: weather.value }))}
                        className={`flex-1 py-3 rounded-xl text-sm transition-colors ${
                          form.weather === weather.value
                            ? 'bg-gp-gold/20 border border-gp-gold text-gp-gold'
                            : 'bg-gp-gray/30 text-gp-text-secondary'
                        }`}
                      >
                        {weather.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 상세 기록 (선택) */}
                <div>
                  <label className="block text-sm text-gp-text-secondary mb-2">상세 기록 (선택)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gp-text-secondary/60 mb-1 text-center">총 퍼팅</p>
                      <input
                        type="number"
                        value={form.putts}
                        onChange={(e) => setForm(prev => ({ ...prev, putts: e.target.value }))}
                        placeholder="32"
                        className="w-full bg-gp-gray/30 rounded-xl px-3 py-2 text-white text-center text-sm placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gp-text-secondary/60 mb-1 text-center">FW 안착</p>
                      <input
                        type="number"
                        value={form.fairway_hits}
                        onChange={(e) => setForm(prev => ({ ...prev, fairway_hits: e.target.value }))}
                        placeholder="8"
                        className="w-full bg-gp-gray/30 rounded-xl px-3 py-2 text-white text-center text-sm placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gp-text-secondary/60 mb-1 text-center">GIR</p>
                      <input
                        type="number"
                        value={form.greens_in_regulation}
                        onChange={(e) => setForm(prev => ({ ...prev, greens_in_regulation: e.target.value }))}
                        placeholder="6"
                        className="w-full bg-gp-gray/30 rounded-xl px-3 py-2 text-white text-center text-sm placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm text-gp-text-secondary mb-2">메모</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="오늘 라운딩 느낀 점을 기록해보세요"
                    rows={3}
                    className="w-full bg-gp-gray/30 rounded-xl px-4 py-3 text-white placeholder-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold/50 resize-none"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div></Portal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

