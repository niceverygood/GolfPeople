import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Clock, Target, Camera } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const onboardingSlides = [
  {
    icon: Camera,
    title: '사진이 전부예요',
    subtitle: '프로필 사진 한 장으로\n나를 표현하세요',
    color: 'from-gp-green/20 to-transparent',
  },
  {
    icon: Target,
    title: '채팅? 필요없어요',
    subtitle: '마음에 들면 바로\n라운딩을 제안하세요',
    color: 'from-amber-500/20 to-transparent',
  },
  {
    icon: Clock,
    title: '시간 맞는 사람만',
    subtitle: '가능한 시간대가 맞는\n동반자를 추천해드려요',
    color: 'from-blue-500/20 to-transparent',
  },
  {
    icon: MapPin,
    title: '내 주변 골퍼들',
    subtitle: '같은 지역권의\n골퍼들을 만나보세요',
    color: 'from-purple-500/20 to-transparent',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { setHasCompletedOnboarding, initializeApp } = useAppStore();

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    initializeApp();
    navigate('/home');
  };

  const slide = onboardingSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="h-full w-full flex flex-col bg-gp-dark relative overflow-hidden">
      {/* 배경 그라디언트 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className={`absolute inset-0 bg-gradient-radial ${slide.color}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* 스킵 버튼 */}
      <div className="absolute top-4 right-4 z-20 safe-area-inset-top">
        <button
          onClick={handleComplete}
          className="px-4 py-2 text-gp-text-secondary text-sm hover:text-white transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* 아이콘 */}
            <motion.div
              className="w-24 h-24 rounded-full bg-gp-card border border-gp-border flex items-center justify-center mb-10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <Icon className="w-12 h-12 text-gp-green" strokeWidth={1.5} />
            </motion.div>

            {/* 타이틀 */}
            <motion.h1
              className="text-3xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* 서브타이틀 */}
            <motion.p
              className="text-gp-text-secondary text-lg whitespace-pre-line leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {slide.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 영역 */}
      <div className="px-8 pb-12 safe-area-inset-bottom">
        {/* 인디케이터 */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-gp-green'
                  : 'w-1.5 bg-gp-border hover:bg-gp-text-muted'
              }`}
            />
          ))}
        </div>

        {/* 다음/시작 버튼 */}
        <motion.button
          onClick={handleNext}
          className="w-full py-4 bg-gp-green hover:bg-gp-green-dark text-black font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors btn-press"
          whileTap={{ scale: 0.98 }}
        >
          {currentSlide === onboardingSlides.length - 1 ? (
            '시작하기'
          ) : (
            <>
              다음
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

