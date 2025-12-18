import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Clock, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { JoinPost } from '../types';

export default function Join() {
  const { joinPosts, savePost, savedPosts } = useAppStore();
  const [selectedPost, setSelectedPost] = useState<JoinPost | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
  };

  return (
    <div className="h-full flex flex-col bg-gp-dark">
      {/* 헤더 */}
      <header className="px-5 py-4 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-white">조인</h1>
        <p className="text-gp-text-secondary text-sm mt-1">
          함께 라운딩할 자리를 찾아보세요
        </p>
      </header>

      {/* 필터 바 */}
      <div className="px-5 pb-4 flex gap-2">
        <button className="px-4 py-2 bg-gp-green text-black text-sm font-medium rounded-full">
          전체
        </button>
        <button className="px-4 py-2 bg-gp-card text-white text-sm rounded-full border border-gp-border">
          서울/경기
        </button>
        <button className="px-4 py-2 bg-gp-card text-white text-sm rounded-full border border-gp-border">
          이번 주
        </button>
      </div>

      {/* 조인 리스트 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-24">
        <div className="space-y-4">
          {joinPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPost(post)}
              className="bg-gp-card rounded-2xl overflow-hidden border border-gp-border cursor-pointer hover:border-gp-green/30 transition-all"
            >
              {/* 상단 이미지 */}
              <div className="relative h-40">
                <img
                  src={post.photo || post.host.photos[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* 남은 자리 뱃지 */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-gp-green rounded-full">
                  <span className="text-black text-sm font-semibold">
                    {post.maxMembers - post.currentMembers}자리 남음
                  </span>
                </div>

                {/* 호스트 정보 */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img
                    src={post.host.photos[0]}
                    alt={post.host.nickname}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                  <span className="text-white text-sm font-medium">
                    {post.host.nickname}
                  </span>
                </div>
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3 line-clamp-1">
                  {post.title}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gp-text-secondary text-sm">
                    <Calendar className="w-4 h-4 text-gp-green" />
                    <span>{formatDate(post.date)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{post.time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gp-text-secondary text-sm">
                    <MapPin className="w-4 h-4 text-gp-green" />
                    <span>{post.region}</span>
                    {post.course && (
                      <>
                        <span className="text-gp-text-muted">•</span>
                        <span>{post.course}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gp-text-secondary text-sm">
                    <Users className="w-4 h-4 text-gp-green" />
                    <span>{post.currentMembers}/{post.maxMembers}명</span>
                    <span className="text-gp-text-muted">•</span>
                    <span>{post.handicapRange[0]} ~ {post.handicapRange[1]}</span>
                  </div>
                </div>

                {/* 신청 버튼 */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-gp-text-muted text-sm line-clamp-1 flex-1 mr-4">
                    {post.description}
                  </p>
                  <button className="px-4 py-2 bg-gp-green/10 text-gp-green text-sm font-medium rounded-lg flex items-center gap-1 hover:bg-gp-green/20 transition-colors">
                    신청
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 빈 상태 */}
        {joinPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gp-card border border-gp-border flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gp-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              아직 조인이 없어요
            </h3>
            <p className="text-gp-text-secondary text-center">
              첫 번째 조인 모집글을 올려보세요!
            </p>
          </div>
        )}
      </div>

      {/* 플로팅 버튼 */}
      <motion.button
        className="fixed bottom-24 right-5 w-14 h-14 bg-gp-green rounded-full flex items-center justify-center shadow-gp-lg z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-7 h-7 text-black" />
      </motion.button>
    </div>
  );
}

