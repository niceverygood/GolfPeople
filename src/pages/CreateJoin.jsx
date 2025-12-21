import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Trophy, Search, X, Check, ChevronRight, UserPlus, Heart } from 'lucide-react'
import golfCourses from '../data/golfCourses.json'
import { useApp } from '../context/AppContext'
import TimePicker from '../components/TimePicker'

// 지역 필터 옵션
const REGIONS = ['전체', '경기', '인천', '강원', '충남', '충북', '세종', '대전', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주']

// 성별 옵션
const GENDERS = ['남성', '여성']

// 나이대 옵션
const AGE_RANGES = ['20대', '30대', '40대', '50대+']

// 실력대 옵션
const HANDICAP_RANGES = ['누구나', '초보(100+)', '중수(90~100)', '고수(~90)', '싱글']

// 스타일 옵션
const STYLE_OPTIONS = ['카트 선호', '도보 가능', '빠르게', '여유롭게', '내기 OK', '내기 X', '초보 환영', '맥주 한잔']

// 만남 유형 옵션
const MEETING_TYPES = [
  { id: 'treat_green', label: '그린피 내드림 🎁', desc: '제가 그린피 쏩니다' },
  { id: 'split_green', label: '그린피 각자 💰', desc: '비용은 각자 부담' },
  { id: 'full_treat', label: '식사까지 풀어렌지 🍽️', desc: '그린피+식사 대접' },
  { id: 'golf_only', label: '볼만치고 헤어져요 ⛳', desc: '라운딩만 함께' },
  { id: 'meal_after', label: '라운딩 후 식사 🍻', desc: '식사는 같이 (각자부담)' },
]

export default function CreateJoin() {
  const navigate = useNavigate()
  const { createJoin } = useApp()
  
  const [step, setStep] = useState(0) // 0: 골프장, 1: 일정, 2: 상세
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [showCourseSearch, setShowCourseSearch] = useState(false)
  
  // 일정 정보
  const [date, setDate] = useState('')
  const [time, setTime] = useState('07:00')
  
  // 주최자(나) 정보 - 항상 1명
  const [myGender, setMyGender] = useState('')
  const [myAgeRange, setMyAgeRange] = useState('')
  
  // 우리쪽 동행자 (최대 2명까지 추가 가능)
  const [companions, setCompanions] = useState([])
  
  // 원하는 상대 조건 (모집 인원별로 각각 설정)
  const [wantedConditions, setWantedConditions] = useState([
    { genders: [], ageRanges: [] },
    { genders: [], ageRanges: [] },
    { genders: [], ageRanges: [] },
  ])
  
  // 동행자 추가
  const addCompanion = () => {
    if (companions.length < 2) {
      setCompanions([...companions, { gender: '', ageRange: '' }])
    }
  }
  
  // 동행자 삭제
  const removeCompanion = (index) => {
    setCompanions(companions.filter((_, i) => i !== index))
  }
  
  // 동행자 정보 업데이트
  const updateCompanion = (index, field, value) => {
    const newCompanions = [...companions]
    newCompanions[index] = { ...newCompanions[index], [field]: value }
    setCompanions(newCompanions)
  }
  
  // 우리쪽 총 인원 (나 + 동행자)
  const ourTeamCount = 1 + companions.length
  
  // 모집 인원 (4명 - 우리쪽)
  const recruitCount = 4 - ourTeamCount
  
  // 상세 정보
  const [handicapRange, setHandicapRange] = useState('')
  const [styles, setStyles] = useState([])
  const [meetingType, setMeetingType] = useState('') // 만남 유형 (선택사항)
  const [description, setDescription] = useState('')
  
  // 원하는 성별 토글 (인덱스별)
  const toggleWantedGender = (index, gender) => {
    const newConditions = [...wantedConditions]
    const current = newConditions[index].genders
    if (current.includes(gender)) {
      newConditions[index].genders = current.filter(g => g !== gender)
    } else {
      newConditions[index].genders = [...current, gender]
    }
    setWantedConditions(newConditions)
  }
  
  // 원하는 나이대 토글 (인덱스별)
  const toggleWantedAgeRange = (index, ageRange) => {
    const newConditions = [...wantedConditions]
    const current = newConditions[index].ageRanges
    if (current.includes(ageRange)) {
      newConditions[index].ageRanges = current.filter(a => a !== ageRange)
    } else {
      newConditions[index].ageRanges = [...current, ageRange]
    }
    setWantedConditions(newConditions)
  }
  
  // 성별 무관 설정 (인덱스별)
  const setAllGenders = (index) => {
    const newConditions = [...wantedConditions]
    newConditions[index].genders = ['남성', '여성']
    setWantedConditions(newConditions)
  }
  
  // 나이대 무관 설정 (인덱스별)
  const setAllAgeRanges = (index) => {
    const newConditions = [...wantedConditions]
    newConditions[index].ageRanges = [...AGE_RANGES]
    setWantedConditions(newConditions)
  }
  
  // 전체 인원 (항상 4명)
  const totalSpots = 4

  // 골프장 필터링
  const filteredCourses = useMemo(() => {
    let result = golfCourses
    
    if (selectedRegion !== '전체') {
      result = result.filter(c => c.region === selectedRegion)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.city.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [selectedRegion, searchQuery])

  const toggleStyle = (style) => {
    if (styles.includes(style)) {
      setStyles(styles.filter(s => s !== style))
    } else if (styles.length < 5) {
      setStyles([...styles, style])
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return selectedCourse !== null
      case 1: {
        // 날짜, 시간 체크
        if (!date || !time) return false
        // 주최자(나) 정보 체크
        if (!myGender || !myAgeRange) return false
        // 동행자 정보가 모두 입력되었는지 체크
        const allCompanionsFilled = companions.every(c => c.gender && c.ageRange)
        if (!allCompanionsFilled) return false
        // 모집 인원별 원하는 상대 조건이 모두 선택되었는지
        for (let i = 0; i < recruitCount; i++) {
          if (wantedConditions[i].genders.length === 0 || wantedConditions[i].ageRanges.length === 0) {
            return false
          }
        }
        return true
      }
      case 2: return handicapRange && styles.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      // 조인 생성 완료
      const joinData = {
        title: `${selectedCourse.name} 라운딩`,
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        location: selectedCourse.address,
        region: `${selectedCourse.region} ${selectedCourse.city}`,
        date,
        time,
        spotsTotal: totalSpots,
        spotsFilled: ourTeamCount,
        recruitCount,
        ourTeam: [
          { gender: myGender, ageRange: myAgeRange, isHost: true },
          ...companions.map(c => ({ ...c, isHost: false }))
        ],
        wantedConditions: wantedConditions.slice(0, recruitCount), // 모집 인원만큼만
        handicapRange,
        style: styles, // AppContext에서 style로 사용
        styles,
        meetingType: meetingType || null,
        description,
      }
      
      // AppContext에 저장
      const created = createJoin(joinData)
      console.log('Created join:', created)
      
      alert('조인이 생성되었습니다!')
      navigate('/join')
    }
  }

  // 오늘 이후 14일간의 날짜 옵션 생성
  const dateOptions = useMemo(() => {
    const options = []
    const today = new Date()
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const month = date.getMonth() + 1
      const day = date.getDate()
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
      
      options.push({
        value: `${month}월 ${day}일 (${dayOfWeek})`,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    return options
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-gp-black overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 safe-top">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
          className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">조인 만들기</h1>
          <p className="text-gp-text-secondary text-sm">
            {step === 0 && '골프장 선택'}
            {step === 1 && '일정 선택'}
            {step === 2 && '상세 정보'}
          </p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="px-6 py-3">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-gp-gold' : 'bg-gp-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          {/* Step 0: 골프장 선택 */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              {/* 선택된 골프장 표시 */}
              {selectedCourse ? (
                <div className="bg-gp-card rounded-2xl p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{selectedCourse.name}</h3>
                      <p className="text-gp-text-secondary text-sm mt-1">
                        {selectedCourse.region} {selectedCourse.city}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="tag text-xs">{selectedCourse.type}</span>
                        <span className="tag text-xs">{selectedCourse.holes}홀</span>
                        <span className="tag text-xs">난이도 {selectedCourse.difficulty}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="w-8 h-8 rounded-full bg-gp-border flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCourseSearch(true)}
                  className="w-full bg-gp-card rounded-2xl p-6 text-center border-2 border-dashed border-gp-border hover:border-gp-gold transition-colors"
                >
                  <MapPin className="w-8 h-8 text-gp-gold mx-auto mb-2" />
                  <p className="font-semibold">골프장 선택하기</p>
                  <p className="text-gp-text-secondary text-sm mt-1">
                    전국 {golfCourses.length}개 골프장에서 검색
                  </p>
                </button>
              )}

              {/* 골프장 검색 모달 */}
              {showCourseSearch && (
                <GolfCourseSearchModal
                  courses={filteredCourses}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedRegion={selectedRegion}
                  setSelectedRegion={setSelectedRegion}
                  onSelect={(course) => {
                    setSelectedCourse(course)
                    setShowCourseSearch(false)
                  }}
                  onClose={() => setShowCourseSearch(false)}
                />
              )}
            </motion.div>
          )}

          {/* Step 1: 일정 선택 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* 선택된 골프장 요약 */}
              <div className="bg-gp-card rounded-xl p-3 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gp-gold" />
                <span className="font-medium">{selectedCourse?.name}</span>
              </div>

              {/* 날짜 선택 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gp-gold" />
                  <span className="font-medium">날짜</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDate(option.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        date === option.value
                          ? 'bg-gp-gold text-gp-black'
                          : option.isWeekend
                          ? 'bg-gp-gold/10 text-gp-gold hover:bg-gp-gold/20'
                          : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                      }`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간 선택 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-gp-gold" />
                  <span className="font-medium">티오프 시간</span>
                </div>
                <div className="bg-gp-card rounded-2xl p-4">
                  <TimePicker
                    value={time || '07:00'}
                    onChange={setTime}
                  />
                </div>
              </div>

              {/* 우리쪽 정보 */}
              <div className="bg-gp-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-gp-gold" />
                    <span className="font-medium">우리쪽 정보</span>
                  </div>
                  <span className="text-gp-gold text-sm font-bold">{ourTeamCount}명</span>
                </div>
                
                {/* 나의 정보 */}
                <div className="bg-gp-black/30 rounded-xl p-3 mb-3">
                  <p className="text-sm text-gp-gold font-medium mb-2">👤 나 (필수)</p>
                  <div className="flex gap-2">
                    {/* 성별 */}
                    <div className="flex-1">
                      <div className="flex gap-1">
                        {GENDERS.map((gender) => (
                          <button
                            key={gender}
                            onClick={() => setMyGender(gender)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                              myGender === gender
                                ? 'bg-gp-gold text-gp-black'
                                : 'bg-gp-border text-gp-text-secondary'
                            }`}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 나이대 */}
                    <div className="flex-1">
                      <div className="flex gap-1">
                        {AGE_RANGES.map((age) => (
                          <button
                            key={age}
                            onClick={() => setMyAgeRange(age)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                              myAgeRange === age
                                ? 'bg-gp-gold text-gp-black'
                                : 'bg-gp-border text-gp-text-secondary'
                            }`}
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 동행자 목록 */}
                {companions.map((companion, index) => (
                  <div key={index} className="bg-gp-black/30 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gp-text-secondary">👤 동행 {index + 1}</p>
                      <button
                        onClick={() => removeCompanion(index)}
                        className="text-gp-red text-xs hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {/* 성별 */}
                      <div className="flex-1">
                        <div className="flex gap-1">
                          {GENDERS.map((gender) => (
                            <button
                              key={gender}
                              onClick={() => updateCompanion(index, 'gender', gender)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                companion.gender === gender
                                  ? 'bg-gp-gold text-gp-black'
                                  : 'bg-gp-border text-gp-text-secondary'
                              }`}
                            >
                              {gender}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* 나이대 */}
                      <div className="flex-1">
                        <div className="flex gap-1">
                          {AGE_RANGES.map((age) => (
                            <button
                              key={age}
                              onClick={() => updateCompanion(index, 'ageRange', age)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                companion.ageRange === age
                                  ? 'bg-gp-gold text-gp-black'
                                  : 'bg-gp-border text-gp-text-secondary'
                              }`}
                            >
                              {age}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 동행자 추가 버튼 */}
                {companions.length < 2 && (
                  <button
                    onClick={addCompanion}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gp-border text-gp-text-secondary hover:border-gp-gold hover:text-gp-gold transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm font-medium">동행자 추가</span>
                  </button>
                )}
                
                {/* 인원 요약 */}
                <div className="mt-4 pt-3 border-t border-gp-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gp-text-secondary">총 라운딩 인원</span>
                    <span className="font-bold">
                      <span className="text-gp-gold">{ourTeamCount}명</span>
                      <span className="text-gp-text-secondary"> + 모집 </span>
                      <span className="text-gp-green">{recruitCount}명</span>
                      <span className="text-gp-text-secondary"> = {totalSpots}명</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 원하는 상대 조건 */}
              <div className="bg-gp-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-gp-gold" />
                  <span className="font-medium">원하는 상대 조건</span>
                  <span className="text-gp-green text-sm font-bold">{recruitCount}명 모집</span>
                </div>
                
                {/* 모집 인원별 조건 설정 */}
                <div className="space-y-4">
                  {Array.from({ length: recruitCount }).map((_, index) => (
                    <div key={index} className="bg-gp-black/30 rounded-xl p-3">
                      <p className="text-sm text-gp-green font-medium mb-3">
                        🎯 원하는 상대 {index + 1}
                      </p>
                      
                      {/* 성별 */}
                      <div className="mb-3">
                        <p className="text-xs text-gp-text-secondary mb-2">성별</p>
                        <div className="flex gap-1">
                          {GENDERS.map((gender) => (
                            <button
                              key={gender}
                              onClick={() => toggleWantedGender(index, gender)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                wantedConditions[index].genders.includes(gender)
                                  ? 'bg-gp-green text-gp-black'
                                  : 'bg-gp-border text-gp-text-secondary'
                              }`}
                            >
                              {wantedConditions[index].genders.includes(gender) && <Check className="w-3 h-3" />}
                              {gender}
                            </button>
                          ))}
                          <button
                            onClick={() => setAllGenders(index)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                              wantedConditions[index].genders.length === 2
                                ? 'bg-gp-green text-gp-black'
                                : 'bg-gp-border text-gp-text-secondary'
                            }`}
                          >
                            무관
                          </button>
                        </div>
                      </div>
                      
                      {/* 나이대 */}
                      <div>
                        <p className="text-xs text-gp-text-secondary mb-2">나이대</p>
                        <div className="flex gap-1">
                          {AGE_RANGES.map((age) => (
                            <button
                              key={age}
                              onClick={() => toggleWantedAgeRange(index, age)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                wantedConditions[index].ageRanges.includes(age)
                                  ? 'bg-gp-green text-gp-black'
                                  : 'bg-gp-border text-gp-text-secondary'
                              }`}
                            >
                              {age}
                            </button>
                          ))}
                          <button
                            onClick={() => setAllAgeRanges(index)}
                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                              wantedConditions[index].ageRanges.length === AGE_RANGES.length
                                ? 'bg-gp-green text-gp-black'
                                : 'bg-gp-border text-gp-text-secondary'
                            }`}
                          >
                            무관
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: 상세 정보 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* 요약 */}
              <div className="bg-gp-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gp-gold" />
                  <span>{selectedCourse?.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gp-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{time}</span>
                  </div>
                </div>
                
                {/* 인원 정보 */}
                <div className="pt-2 border-t border-gp-border">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gp-text-secondary">우리쪽 ({ourTeamCount}명)</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      <span className="inline-block px-2 py-0.5 bg-gp-gold/20 text-gp-gold rounded text-xs">
                        나: {myGender} {myAgeRange}
                      </span>
                      {companions.map((c, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-gp-border rounded text-xs">
                          동행{i+1}: {c.gender} {c.ageRange}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gp-text-secondary">모집</span>
                    <span className="text-gp-green font-medium">{recruitCount}명</span>
                  </div>
                  {/* 모집 인원별 원하는 상대 */}
                  {Array.from({ length: recruitCount }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gp-text-secondary">상대 {i + 1}</span>
                      <span className="text-xs">
                        {wantedConditions[i].genders.length === 2 ? '성별무관' : wantedConditions[i].genders.join('/')} · 
                        {wantedConditions[i].ageRanges.length === AGE_RANGES.length ? '나이무관' : wantedConditions[i].ageRanges.join('/')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 실력대 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-gp-gold" />
                  <span className="font-medium">참가 실력대</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HANDICAP_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => setHandicapRange(range)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        handicapRange === range
                          ? 'bg-gp-gold text-gp-black'
                          : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* 스타일 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium">라운딩 스타일</span>
                  <span className="text-gp-text-secondary text-sm">(최대 5개)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        styles.includes(style)
                          ? 'bg-gp-gold text-gp-black'
                          : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                      }`}
                    >
                      {styles.includes(style) && <Check className="w-4 h-4" />}
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* 만남 유형 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium">만남 유형</span>
                  <span className="text-gp-text-secondary text-sm">(선택)</span>
                </div>
                <div className="space-y-2">
                  {MEETING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setMeetingType(meetingType === type.id ? '' : type.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                        meetingType === type.id
                          ? 'bg-gp-gold/20 border-2 border-gp-gold'
                          : 'bg-gp-card border-2 border-transparent hover:bg-gp-border'
                      }`}
                    >
                      <div>
                        <span className={`font-medium ${meetingType === type.id ? 'text-gp-gold' : 'text-gp-text'}`}>
                          {type.label}
                        </span>
                        <p className="text-xs text-gp-text-secondary mt-0.5">{type.desc}</p>
                      </div>
                      {meetingType === type.id && (
                        <Check className="w-5 h-5 text-gp-gold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 설명 */}
              <div>
                <span className="font-medium block mb-3">소개 (선택)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="함께 라운딩하실 분들께 한 마디!"
                  className="w-full h-24 bg-gp-card rounded-xl p-4 text-gp-text placeholder:text-gp-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-gp-gold"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass safe-bottom">
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? 'btn-gold'
                : 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
            }`}
          >
            {step === 2 ? '조인 만들기' : '다음'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 골프장 검색 모달 컴포넌트
function GolfCourseSearchModal({ courses, searchQuery, setSearchQuery, selectedRegion, setSelectedRegion, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gp-black"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 safe-top">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">골프장 검색</h1>
      </div>

      {/* 검색창 */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gp-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="골프장 이름, 지역으로 검색"
            className="w-full pl-12 pr-4 py-3 bg-gp-card rounded-xl text-gp-text placeholder:text-gp-text-secondary focus:outline-none focus:ring-2 focus:ring-gp-gold"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gp-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* 지역 필터 */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedRegion === region
                  ? 'bg-gp-gold text-gp-black'
                  : 'bg-gp-card text-gp-text-secondary'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-20" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <p className="text-gp-text-secondary text-sm mb-3">
          {courses.length}개 골프장
        </p>
        <div className="space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => onSelect(course)}
              className="w-full bg-gp-card rounded-xl p-4 text-left hover:bg-gp-border/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="text-gp-text-secondary text-sm mt-1">
                    {course.region} {course.city} · {course.type}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 rounded text-xs bg-gp-border text-gp-text-secondary">
                    {course.holes}H
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

