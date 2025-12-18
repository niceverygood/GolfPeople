import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ChevronRight, MapPin, Trophy, Clock, Check } from 'lucide-react'

const REGIONS = ['서울 강남', '서울 송파', '서울 마포', '서울 강서', '경기 분당', '경기 용인', '경기 수원', '인천']
const HANDICAPS = ['100 이상', '100대', '90대 후반', '90대 중반', '90대 초반', '80대', '싱글']
const STYLES = ['카트 선호', '도보 가능', '빠르게', '여유롭게', '내기 OK', '내기 X', '초보 환영', '사진 찍기', '맥주 한잔']
const TIMES = ['평일 오전', '평일 오후', '주말 오전', '주말 오후', '주말 전체', '상관없음']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [region, setRegion] = useState('')
  const [handicap, setHandicap] = useState('')
  const [styles, setStyles] = useState([])
  const [time, setTime] = useState('')

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
      case 1: return region && handicap
      case 2: return styles.length > 0 && time
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      // 로컬스토리지에 프로필 저장
      const profile = { photo, region, handicap, styles, time }
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
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-gp-gold" />
                <span className="font-medium">주 활동 지역</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      region === r
                        ? 'bg-gp-gold text-gp-black'
                        : 'bg-gp-card text-gp-text-secondary hover:bg-gp-border'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
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

