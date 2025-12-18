import { create } from 'zustand';
import type { User, TabType, JoinPost, RoundProposal } from '../types';
import { mockUsers, mockJoinPosts } from '../data/mockData';

interface AppStore {
  // 현재 유저
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // 인증 상태
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  
  // 온보딩 완료 여부
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  
  // 현재 탭
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  
  // 추천 유저 목록
  recommendedUsers: User[];
  setRecommendedUsers: (users: User[]) => void;
  removeUser: (userId: string) => void;
  
  // 조인 모집글
  joinPosts: JoinPost[];
  setJoinPosts: (posts: JoinPost[]) => void;
  
  // 저장한 유저/조인
  savedUsers: User[];
  savedPosts: JoinPost[];
  saveUser: (user: User) => void;
  unsaveUser: (userId: string) => void;
  savePost: (post: JoinPost) => void;
  unsavePost: (postId: string) => void;
  
  // 라운딩 제안
  proposals: RoundProposal[];
  addProposal: (proposal: RoundProposal) => void;
  
  // 모달 상태
  isProposalModalOpen: boolean;
  proposalTargetUser: User | null;
  openProposalModal: (user: User) => void;
  closeProposalModal: () => void;
  
  // 초기화
  initializeApp: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // 초기 상태
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  isAuthenticated: false,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
  
  currentTab: 'home',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  recommendedUsers: [],
  setRecommendedUsers: (users) => set({ recommendedUsers: users }),
  removeUser: (userId) => set((state) => ({
    recommendedUsers: state.recommendedUsers.filter(u => u.id !== userId)
  })),
  
  joinPosts: [],
  setJoinPosts: (posts) => set({ joinPosts: posts }),
  
  savedUsers: [],
  savedPosts: [],
  saveUser: (user) => set((state) => ({
    savedUsers: state.savedUsers.some(u => u.id === user.id) 
      ? state.savedUsers 
      : [...state.savedUsers, user]
  })),
  unsaveUser: (userId) => set((state) => ({
    savedUsers: state.savedUsers.filter(u => u.id !== userId)
  })),
  savePost: (post) => set((state) => ({
    savedPosts: state.savedPosts.some(p => p.id === post.id)
      ? state.savedPosts
      : [...state.savedPosts, post]
  })),
  unsavePost: (postId) => set((state) => ({
    savedPosts: state.savedPosts.filter(p => p.id !== postId)
  })),
  
  proposals: [],
  addProposal: (proposal) => set((state) => ({
    proposals: [...state.proposals, proposal]
  })),
  
  isProposalModalOpen: false,
  proposalTargetUser: null,
  openProposalModal: (user) => set({ 
    isProposalModalOpen: true, 
    proposalTargetUser: user 
  }),
  closeProposalModal: () => set({ 
    isProposalModalOpen: false, 
    proposalTargetUser: null 
  }),
  
  // 앱 초기화 (목데이터 로드)
  initializeApp: () => {
    set({
      recommendedUsers: mockUsers,
      joinPosts: mockJoinPosts,
    });
  },
}));

