import { motion } from 'framer-motion';
import {
  Settings,
  ChevronRight,
  MapPin,
  Award,
  Camera,
  Clock,
  Flag,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Star,
} from 'lucide-react';

// 임시 현재 유저 데이터
const currentUser = {
  id: 'me',
  nickname: '골프매니아',
  age: 29,
  region: '서울',
  district: '강남구',
  handicap: '90대',
  photos: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=1200&fit=crop',
  ],
  tags: ['주말 오전', '여유로운 플레이', '수다 환영', '금연 선호'],
  bio: '주말에 같이 라운딩해요! 🏌️‍♂️',
  verified: true,
  roundCount: 18,
  likeCount: 32,
  proposalCount: 5,
};

const menuItems = [
  { icon: Bell, label: '알림 설정', badge: null },
  { icon: Shield, label: '개인정보 보호', badge: null },
  { icon: Star, label: '프리미엄', badge: 'NEW' },
  { icon: HelpCircle, label: '고객센터', badge: null },
];

export default function Profile() {
  return (
    <div className="h-full flex flex-col bg-gp-dark overflow-y-auto hide-scrollbar">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-white">프로필</h1>
        <button className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center">
          <Settings className="w-5 h-5 text-gp-text-secondary" />
        </button>
      </header>

      {/* 프로필 카드 */}
      <div className="px-5 pb-6">
        <div className="relative bg-gp-card rounded-3xl overflow-hidden border border-gp-border">
          {/* 커버 영역 */}
          <div className="h-28 bg-gradient-to-br from-gp-green/20 to-gp-dark" />

          {/* 프로필 정보 */}
          <div className="px-5 pb-6">
            {/* 프로필 이미지 */}
            <div className="relative -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-gp-card">
                <img
                  src={currentUser.photos[0]}
                  alt={currentUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-gp-green rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-black" />
              </button>
              {currentUser.verified && (
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-gp-green rounded-full flex items-center justify-center border-2 border-gp-card">
                  <Award className="w-4 h-4 text-black" />
                </div>
              )}
            </div>

            {/* 닉네임 & 기본 정보 */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    {currentUser.nickname}
                  </h2>
                  <span className="text-gp-text-secondary">{currentUser.age}</span>
                </div>
                <div className="flex items-center gap-2 text-gp-text-secondary text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{currentUser.region} {currentUser.district}</span>
                  <span className="text-gp-green font-medium">
                    • {currentUser.handicap}
                  </span>
                </div>
              </div>
              <button className="px-4 py-2 bg-gp-border rounded-lg text-white text-sm font-medium">
                수정
              </button>
            </div>

            {/* 자기소개 */}
            <p className="text-gp-text-secondary mt-4">{currentUser.bio}</p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mt-4">
              {currentUser.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white/5 rounded-full text-white text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Flag}
            value={currentUser.roundCount}
            label="라운딩"
            color="text-gp-green"
          />
          <StatCard
            icon={Star}
            value={currentUser.likeCount}
            label="받은 관심"
            color="text-gp-accent"
          />
          <StatCard
            icon={Clock}
            value={currentUser.proposalCount}
            label="제안"
            color="text-blue-400"
          />
        </div>
      </div>

      {/* 메뉴 */}
      <div className="px-5 pb-6">
        <div className="bg-gp-card rounded-2xl border border-gp-border overflow-hidden">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gp-border' : ''
              }`}
              whileTap={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gp-text-secondary" />
                <span className="text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="px-2 py-0.5 bg-gp-green text-black text-xs font-semibold rounded">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-gp-text-muted" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="px-5 pb-32">
        <button className="w-full flex items-center justify-center gap-2 py-4 text-gp-red">
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
        <p className="text-center text-gp-text-muted text-xs mt-4">
          골프피플 v2.0.0
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-gp-card rounded-2xl border border-gp-border p-4 text-center">
      <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gp-text-muted text-xs mt-1">{label}</div>
    </div>
  );
}

