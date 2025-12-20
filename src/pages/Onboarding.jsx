import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ChevronRight, MapPin, Trophy, Clock, Check, ChevronDown } from 'lucide-react'

// 전국 지역 데이터
const REGION_DATA = {
  '서울': ['강남', '서초', '송파', '강동', '마포', '용산', '종로', '중구', '성동', '광진', '동대문', '중랑', '성북', '강북', '도봉', '노원', '은평', '서대문', '영등포', '동작', '관악', '금천', '구로', '양천', '강서'],
  '경기': ['성남 분당', '성남 수정', '용인 수지', '용인 기흥', '수원 영통', '수원 권선', '화성', '평택', '안양', '안산', '고양 일산', '고양 덕양', '파주', '김포', '부천', '광명', '시흥', '군포', '의왕', '과천', '안성', '오산', '하남', '광주', '이천', '여주', '양평', '포천', '동두천', '의정부', '구리', '남양주'],
  '인천': ['연수', '남동', '부평', '계양', '서구', '중구', '동구', '미추홀', '강화', '옹진'],
  '부산': ['해운대', '수영', '남구', '동래', '부산진', '연제', '금정', '북구', '사상', '사하', '강서', '서구', '중구', '동구', '영도', '기장'],
  '대구': ['수성', '달서', '북구', '동구', '서구', '남구', '중구', '달성'],
  '대전': ['유성', '서구', '중구', '동구', '대덕'],
  '광주': ['광산', '서구', '북구', '남구', '동구'],
  '울산': ['남구', '중구', '동구', '북구', '울주'],
  '세종': ['세종시'],
  '강원': ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'],
  '충북': ['청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'],
  '충남': ['천안', '아산', '서산', '논산', '계룡', '당진', '공주', '보령', '홍성', '예산', '태안', '청양', '부여', '서천', '금산'],
  '전북': ['전주', '익산', '군산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
  '전남': ['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
  '경북': ['포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'],
  '경남': ['창원', '김해', '진주', '양산', '거제', '통영', '사천', '밀양', '함안', '거창', '합천', '창녕', '고성', '남해', '하동', '산청', '함양', '의령'],
  '제주': ['제주시', '서귀포시']
}

const HANDICAPS = ['100 이상', '100대', '90대 후반', '90대 중반', '90대 초반', '80대', '싱글']
const STYLES = ['카트 선호', '도보 가능', '빠르게', '여유롭게', '내기 OK', '내기 X', '초보 환영', '사진 찍기', '맥주 한잔']
const TIMES = ['평일 오전', '평일 오후', '주말 오전', '주말 오후', '주말 전체', '상관없음']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [selectedProvince, setSelectedProvince] = useState('') // 선택된 시/도
  const [regions, setRegions] = useState([]) // 선택된 지역들 (다중)
  const [handicap, setHandicap] = useState('')
  const [styles, setStyles] = useState([])
  const [time, setTime] = useState('')

  // 지역 선택 토글 (다중 선택)
  const toggleRegion = (province, district) => {
    const fullRegion = `${province} ${district}`
    if (regions.includes(fullRegion)) {
      setRegions(regions.filter(r => r !== fullRegion))
    } else if (regions.length < 5) { // 최대 5개
      setRegions([...regions, fullRegion])
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleStyle = (style) => {
    if (styles.includes(style)) {
      setStyles(styles.filter(s => s !== style))
    } else if (styles.length < 5) {
      setStyles([...styles, style])
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return true // 사진은 선택
      case 1: return regions.length > 0 && handicap
      case 2: return styles.length > 0 && time
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      // 로컬스토리지에 프로필 저장
      const profile = { photo, regions, handicap, styles, time }
      localStorage.setItem('gp_profile', JSON.stringify(profile))
      onComplete()
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-2 text-center">프로필 사진을 올려주세요</h2>
              <p className="text-gp-text-secondary text-center mb-8">
                골프치는 모습이면 더 좋아요 ⛳
              </p>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {photo ? (
                  <div className="relative">
                    <img
                      src={photo}
                      alt="프로필"
                      className="w-48 h-64 object-cover rounded-3xl"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-64 rounded-3xl bg-gp-card border-2 border-dashed border-gp-border flex flex-col items-center justify-center gap-3 hover:border-gp-gold transition-colors">
                    <Camera className="w-12 h-12 text-gp-text-secondary" />
                    <span className="text-gp-text-secondary text-sm">탭하여 업로드</span>
                  </div>
                )}
              </label>

              <p className="text-gp-text-secondary text-xs mt-6 text-center">
                나중에 추가할 수도 있어요
              </p>
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-1">기본 정보</h2>
            <p className="text-gp-text-secondary mb-6">
              맞는 메이트를 찾기 위해 필요해요
            </p>

            {/* 지역 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-gp-gold" />
                <span className="font-medium">주 활동 지역</span>
                <span className="text-xs text-gp-text-secondary">(최대 5개)</span>
              </div>
              
              {/* 선택된 지역 표시 */}
              {regions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {regions.map((r) => (
                    <span
                      key={r}
                      onClick={() => setRegions(regions.filter(reg => reg !== r))}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-gp-gold text-gp-black cursor-pointer flex items-center gap-1"
                    >
                      {r} ✕
                    </span>
                  ))}
                </div>
              )}

              {/* 시/도 선택 탭 */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.keys(REGION_DATA).map((province) => (
                  <button
                    key={province}
                    onClick={() => setSelectedProvince(selectedProvince === province ? '' : province)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedProvince === province
                        ? 'bg-gp-gold text-gp-black'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                    }`}
                  >
                    {province}
                    {selectedProvince === province && <ChevronDown className="w-3 h-3 inline ml-0.5" />}
                  </button>
                ))}
              </div>

              {/* 구/군 선택 */}
              {selectedProvince && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gp-surface rounded-xl p-3 mb-3"
                >
                  <p className="text-xs text-gp-text-secondary mb-2">{selectedProvince} 지역</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {REGION_DATA[selectedProvince].map((district) => {
                      const fullRegion = `${selectedProvince} ${district}`
                      const isSelected = regions.includes(fullRegion)
                      return (
                        <button
                          key={district}
                          onClick={() => toggleRegion(selectedProvince, district)}
                          disabled={!isSelected && regions.length >= 5}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-gp-gold text-gp-black'
                              : regions.length >= 5
                                ? 'bg-gp-border/50 text-gp-text-secondary/50 cursor-not-allowed'
                                : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-0.5" />}
                          {district}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* 핸디캡 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-gp-gold" />
                <span className="font-medium">평균 타수</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {HANDICAPS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHandicap(h)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      handicap === h
                        ? 'bg-gp-gold text-gp-black'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-1">라운딩 스타일</h2>
            <p className="text-gp-text-secondary mb-6">
              최대 5개까지 선택할 수 있어요
            </p>

            {/* 스타일 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      styles.includes(s)
                        ? 'bg-gp-gold text-gp-black'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                    }`}
                  >
                    {styles.includes(s) && <Check className="w-4 h-4" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gp-gold" />
                <span className="font-medium">선호 시간대</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      time === t
                        ? 'bg-gp-gold text-gp-black'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app-container flex flex-col bg-gp-black safe-top safe-bottom">
      {/* 프로그레스 바 */}
      <div className="px-6 pt-4 pb-2">
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
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* 하단 버튼 */}
      <div className="px-6 py-4">
        <button
          type="button"
          onClick={() => handleNext()}
          disabled={!canProceed()}
          className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            canProceed()
              ? 'btn-gold'
              : 'bg-gp-border text-gp-text-secondary cursor-not-allowed'
          }`}
        >
          <span>{step === 2 ? '시작하기' : '다음'}</span>
          <ChevronRight className="w-5 h-5 pointer-events-none" />
        </button>
      </div>

      {/* 목적 고지 (마지막 단계) */}
      {step === 2 && (
        <p className="text-center text-xs text-gp-text-secondary pb-4 px-6">
          골프피플은 <span className="text-gp-gold">라운딩 동반 목적</span> 서비스입니다
        </p>
      )}
    </div>
  )
}

