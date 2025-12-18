import { motion } from 'framer-motion';
import { Home, Users, Heart, User } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { TabType } from '../types';

const tabs: { id: TabType; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'join', icon: Users, label: '조인' },
  { id: 'saved', icon: Heart, label: '저장' },
  { id: 'profile', icon: User, label: '프로필' },
];

interface TabBarProps {
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ onTabChange }: TabBarProps) {
  const { currentTab, setCurrentTab, savedUsers } = useAppStore();

  const handleTabClick = (tab: TabType) => {
    setCurrentTab(tab);
    onTabChange(tab);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gp-darker/90 bg-blur border-t border-gp-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === 'saved' && savedUsers.length > 0;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center w-16 h-full relative"
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-gp-green' : 'text-gp-text-muted'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showBadge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gp-red rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {savedUsers.length > 9 ? '9+' : savedUsers.length}
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-1 transition-colors ${
                  isActive ? 'text-gp-green font-medium' : 'text-gp-text-muted'
                }`}
              >
                {tab.label}
              </span>
              
              {/* 활성 인디케이터 */}
              {isActive && (
                <motion.div
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gp-green rounded-full"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

