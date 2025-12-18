import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { MapPin, Award, Heart, X, Calendar } from 'lucide-react';
import type { User, SwipeDirection } from '../types';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: SwipeDirection) => void;
  isTop: boolean;
}

export default function SwipeCard({ user, onSwipe, isTop }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);

  // 오버레이 투명도
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);
  const proposeOpacity = useTransform(y, [-200, -100, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;

    const xOffset = info.offset.x;
    const yOffset = info.offset.y;
    const xVelocity = info.velocity.x;
    const yVelocity = info.velocity.y;

    if (yOffset < -threshold || yVelocity < -velocityThreshold) {
      setExitDirection('up');
      onSwipe('up');
    } else if (xOffset > threshold || xVelocity > velocityThreshold) {
      setExitDirection('right');
      onSwipe('right');
    } else if (xOffset < -threshold || xVelocity < -velocityThreshold) {
      setExitDirection('left');
      onSwipe('left');
    }
  };

  const getExitAnimation = () => {
    switch (exitDirection) {
      case 'left':
        return { x: -500, opacity: 0 };
      case 'right':
        return { x: 500, opacity: 0 };
      case 'up':
        return { y: -500, opacity: 0 };
      default:
        return {};
    }
  };

  const handlePhotoTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const width = rect.width;

    if (tapX < width / 3) {
      // 왼쪽 탭 - 이전 사진
      setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
    } else if (tapX > (width * 2) / 3) {
      // 오른쪽 탭 - 다음 사진
      setCurrentPhotoIndex((prev) => Math.min(user.photos.length - 1, prev + 1));
    }
  };

  if (!isTop) {
    return (
      <div className="absolute inset-4 rounded-3xl overflow-hidden bg-gp-card scale-95 opacity-50">
        <img
          src={user.photos[0]}
          alt={user.nickname}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-4 rounded-3xl overflow-hidden bg-gp-card shadow-card cursor-grab active:cursor-grabbing swipe-card"
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? getExitAnimation() : {}}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      whileDrag={{ scale: 1.02 }}
    >
      {/* 사진 영역 */}
      <div className="absolute inset-0" onClick={handlePhotoTap}>
        <img
          src={user.photos[currentPhotoIndex]}
          alt={user.nickname}
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* 사진 인디케이터 */}
        {user.photos.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {user.photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentPhotoIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* LIKE 오버레이 */}
      <motion.div
        className="absolute top-8 left-8 px-4 py-2 border-4 border-gp-green rounded-lg rotate-[-20deg]"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-gp-green text-3xl font-bold">LIKE</span>
      </motion.div>

      {/* NOPE 오버레이 */}
      <motion.div
        className="absolute top-8 right-8 px-4 py-2 border-4 border-gp-red rounded-lg rotate-[20deg]"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-gp-red text-3xl font-bold">NOPE</span>
      </motion.div>

      {/* 라운딩 제안 오버레이 */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 px-6 py-3 border-4 border-gp-accent rounded-lg"
        style={{ opacity: proposeOpacity }}
      >
        <span className="text-gp-accent text-2xl font-bold">라운딩 제안!</span>
      </motion.div>

      {/* 유저 정보 */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* 인증 뱃지 */}
        {user.verified && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gp-green/20 rounded-full text-gp-green text-xs mb-3">
            <Award className="w-3 h-3" />
            인증됨
          </div>
        )}

        {/* 닉네임 & 나이 */}
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-3xl font-bold text-white">{user.nickname}</h2>
          {user.age && <span className="text-xl text-white/80">{user.age}</span>}
        </div>

        {/* 지역 & 핸디캡 */}
        <div className="flex items-center gap-3 text-white/70 text-sm mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{user.region} {user.district}</span>
          </div>
          <span>•</span>
          <span className="text-gp-green font-medium">{user.handicap}</span>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {user.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-white/10 rounded-full text-white text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 자기소개 */}
        {user.bio && (
          <p className="text-white/60 text-sm line-clamp-2">{user.bio}</p>
        )}
      </div>
    </motion.div>
  );
}

// 하단 액션 버튼들
interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onPropose: () => void;
}

export function ActionButtons({ onPass, onLike, onPropose }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {/* NOPE 버튼 */}
      <motion.button
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-gp-card border-2 border-gp-red/50 flex items-center justify-center shadow-lg btn-press"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <X className="w-8 h-8 text-gp-red" />
      </motion.button>

      {/* 라운딩 제안 버튼 */}
      <motion.button
        onClick={onPropose}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-gp-green to-gp-green-dark flex items-center justify-center shadow-gp-lg btn-press"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Calendar className="w-9 h-9 text-black" />
      </motion.button>

      {/* LIKE 버튼 */}
      <motion.button
        onClick={onLike}
        className="w-16 h-16 rounded-full bg-gp-card border-2 border-gp-green/50 flex items-center justify-center shadow-lg btn-press"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Heart className="w-8 h-8 text-gp-green" />
      </motion.button>
    </div>
  );
}

