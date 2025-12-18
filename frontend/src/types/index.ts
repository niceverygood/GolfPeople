// 유저 프로필
export interface User {
  id: string;
  nickname: string;
  age?: number;
  gender?: 'male' | 'female';
  region: string;
  district?: string;
  handicap: HandicapLevel;
  photos: string[];
  tags: string[];
  bio?: string;
  availableTime: AvailableTime[];
  style: PlayStyle[];
  verified: boolean;
  roundCount: number;
  createdAt: Date;
}

// 핸디캡 레벨
export type HandicapLevel = 
  | '비기너' 
  | '100+ 타' 
  | '90대' 
  | '80대' 
  | '70대' 
  | '싱글';

// 가능 시간
export type AvailableTime = 
  | '주말 오전' 
  | '주말 오후' 
  | '평일 오전' 
  | '평일 오후' 
  | '새벽';

// 플레이 스타일
export type PlayStyle = 
  | '빠른 플레이' 
  | '여유로운 플레이' 
  | '내기 환영' 
  | '내기 안함' 
  | '카트 선호' 
  | '캐디 선호'
  | '조용한 플레이'
  | '수다 환영'
  | '음주 OK'
  | '금연 선호';

// 라운딩 제안
export interface RoundProposal {
  id: string;
  fromUserId: string;
  toUserId: string;
  dateOption1: string;
  dateOption2?: string;
  region: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
}

// 조인 모집글
export interface JoinPost {
  id: string;
  hostId: string;
  host: User;
  title: string;
  date: string;
  time: string;
  region: string;
  course?: string;
  currentMembers: number;
  maxMembers: number;
  handicapRange: [HandicapLevel, HandicapLevel];
  description?: string;
  photo?: string;
  status: 'open' | 'full' | 'closed' | 'completed';
  createdAt: Date;
}

// 조인 신청
export interface JoinRequest {
  id: string;
  postId: string;
  userId: string;
  user: User;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

// 좋아요/관심
export interface Like {
  id: string;
  userId: string;
  targetUserId: string;
  createdAt: Date;
}

// 앱 상태
export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 카드 스와이프 방향
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// 탭 타입
export type TabType = 'home' | 'join' | 'saved' | 'profile';

