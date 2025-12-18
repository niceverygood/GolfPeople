import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Join from './pages/Join';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import TabBar from './components/TabBar';
import ProposalModal from './components/ProposalModal';
import { useAppStore } from './stores/useAppStore';
import type { TabType } from './types';

function AppContent() {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, currentTab } = useAppStore();
  const [showTabs, setShowTabs] = useState(false);

  useEffect(() => {
    // URL과 탭 상태 동기화
    if (hasCompletedOnboarding) {
      setShowTabs(true);
    }
  }, [hasCompletedOnboarding]);

  const handleTabChange = (tab: TabType) => {
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'join':
        navigate('/join');
        break;
      case 'saved':
        navigate('/saved');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gp-dark">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {/* 탭바 (온보딩 완료 후에만 표시) */}
      {showTabs && <TabBar onTabChange={handleTabChange} />}

      {/* 라운딩 제안 모달 */}
      <ProposalModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
