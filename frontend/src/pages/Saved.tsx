import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, X, MessageCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

type TabType = 'users' | 'posts';

export default function Saved() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { savedUsers, savedPosts, unsaveUser, unsavePost, openProposalModal } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-gp-dark">
      {/* 헤더 */}
      <header className="px-5 py-4 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-white">저장함</h1>
      </header>

      {/* 탭 */}
      <div className="px-5 pb-4">
        <div className="flex bg-gp-card rounded-xl p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-gp-green text-black'
                : 'text-gp-text-secondary hover:text-white'
            }`}
          >
            관심 골퍼 ({savedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-gp-green text-black'
                : 'text-gp-text-secondary hover:text-white'
            }`}
          >
            저장한 조인 ({savedPosts.length})
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {savedUsers.length > 0 ? (
                savedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-gp-card rounded-2xl border border-gp-border"
                  >
                    {/* 프로필 이미지 */}
                    <div className="relative">
                      <img
                        src={user.photos[0]}
                        alt={user.nickname}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      {user.verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gp-green rounded-full flex items-center justify-center">
                          <span className="text-black text-xs">✓</span>
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{user.nickname}</h3>
                        {user.age && (
                          <span className="text-gp-text-secondary text-sm">{user.age}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gp-text-secondary text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{user.region} {user.district}</span>
                        <span className="text-gp-green">• {user.handicap}</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {user.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/5 rounded text-gp-text-muted text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openProposalModal(user)}
                        className="w-10 h-10 rounded-full bg-gp-green/10 flex items-center justify-center hover:bg-gp-green/20 transition-colors"
                      >
                        <Calendar className="w-5 h-5 text-gp-green" />
                      </button>
                      <button
                        onClick={() => unsaveUser(user.id)}
                        className="w-10 h-10 rounded-full bg-gp-red/10 flex items-center justify-center hover:bg-gp-red/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-gp-red" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={Heart}
                  title="저장한 골퍼가 없어요"
                  description="마음에 드는 골퍼를 LIKE하면 여기에 저장돼요"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="posts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {savedPosts.length > 0 ? (
                savedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gp-card rounded-2xl border border-gp-border"
                  >
                    <div className="flex gap-4">
                      <img
                        src={post.photo || post.host.photos[0]}
                        alt={post.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold line-clamp-1">
                          {post.title}
                        </h3>
                        <div className="text-gp-text-secondary text-sm mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{post.date} {post.time}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{post.region}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => unsavePost(post.id)}
                        className="w-8 h-8 rounded-full bg-gp-red/10 flex items-center justify-center self-start"
                      >
                        <X className="w-4 h-4 text-gp-red" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="저장한 조인이 없어요"
                  description="관심있는 조인을 저장하면 여기에서 볼 수 있어요"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-gp-card border border-gp-border flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gp-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gp-text-secondary text-center text-sm">{description}</p>
    </div>
  );
}

