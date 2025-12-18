import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gp-dark relative overflow-hidden">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-radial from-gp-green-glow via-transparent to-transparent opacity-50" />
      
      {/* 배경 원형 패턴 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-gp-green/10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-gp-green/20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full border border-gp-green/30"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
      />

      {/* 로고 */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {/* 골프공 아이콘 */}
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-gp-lg flex items-center justify-center mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.3
          }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-white relative">
            {/* 골프공 딤플 패턴 */}
            <div className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="absolute top-3 right-4 w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="absolute top-5 left-5 w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="absolute top-6 right-5 w-1.5 h-1.5 rounded-full bg-gray-200" />
          </div>
        </motion.div>

        {/* 앱 이름 */}
        <motion.h1
          className="text-4xl font-bold text-white tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          골프<span className="text-gp-green">피플</span>
        </motion.h1>
        
        {/* 슬로건 */}
        <motion.p
          className="text-gp-text-secondary text-sm mt-3 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          라운딩, 사진 한 장으로 시작해요
        </motion.p>
      </motion.div>

      {/* 하단 로딩 인디케이터 */}
      <motion.div
        className="absolute bottom-20 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gp-green"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

