import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import SwipeCard, { ActionButtons } from '../components/SwipeCard';
import type { SwipeDirection } from '../types';

export default function Home() {
  const {
    recommendedUsers,
    removeUser,
    saveUser,
    openProposalModal,
  } = useAppStore();

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const topUser = recommendedUsers[0];
      if (!topUser) return;

      setTimeout(() => {
        switch (direction) {
          case 'right':
            // LIKE - 저장
            saveUser(topUser);
            break;
          case 'up':
            // 라운딩 제안
            openProposalModal(topUser);
            break;
          case 'left':
            // PASS - 아무것도 안함
            break;
        }
        removeUser(topUser.id);
      }, 200);
    },
    [recommendedUsers, removeUser, saveUser, openProposalModal]
  );

  const handlePass = useCallback(() => {
    if (recommendedUsers[0]) {
      removeUser(recommendedUsers[0].id);
    }
  }, [recommendedUsers, removeUser]);

  const handleLike = useCallback(() => {
    if (recommendedUsers[0]) {
      saveUser(recommendedUsers[0]);
      removeUser(recommendedUsers[0].id);
    }
  }, [recommendedUsers, removeUser, saveUser]);

  const handlePropose = useCallback(() => {
    if (recommendedUsers[0]) {
      openProposalModal(recommendedUsers[0]);
    }
  }, [recommendedUsers, openProposalModal]);

  return (
    <div className="h-full flex flex-col bg-gp-dark">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 safe-area-inset-top">
        <h1 className="text-2xl font-bold">
          골프<span className="text-gp-green">피플</span>
        </h1>
        <button className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center">
          <Filter className="w-5 h-5 text-gp-text-secondary" />
        </button>
      </header>

      {/* 카드 영역 */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {recommendedUsers.length > 0 ? (
            <>
              {/* 뒤에 있는 카드들 (최대 2장) */}
              {recommendedUsers.slice(1, 3).reverse().map((user, index) => (
                <SwipeCard
                  key={user.id}
                  user={user}
                  onSwipe={() => {}}
                  isTop={false}
                />
              ))}
              {/* 맨 위 카드 */}
              <SwipeCard
                key={recommendedUsers[0].id}
                user={recommendedUsers[0]}
                onSwipe={handleSwipe}
                isTop={true}
              />
            </>
          ) : (
            // 카드가 없을 때
            <motion.div
              className="absolute inset-4 rounded-3xl bg-gp-card border border-gp-border flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 rounded-full bg-gp-border/50 flex items-center justify-center mb-6">
                <RefreshCw className="w-10 h-10 text-gp-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                추천이 없어요
              </h3>
              <p className="text-gp-text-secondary text-center px-8">
                새로운 골퍼들이 들어오면<br />다시 알려드릴게요!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-8 px-6 py-3 bg-gp-green text-black font-semibold rounded-xl"
              >
                새로고침
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 액션 버튼 */}
      {recommendedUsers.length > 0 && (
        <ActionButtons
          onPass={handlePass}
          onLike={handleLike}
          onPropose={handlePropose}
        />
      )}
    </div>
  );
}

