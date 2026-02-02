# 골프피플 (GolfPeople) 프로젝트 문서

## 프로젝트 개요

**골프피플**은 골프를 즐기는 사람들을 위한 소셜 매칭 플랫폼입니다. 함께 라운딩할 파트너를 찾고, 조인(그룹 라운딩)을 생성하거나 참여할 수 있습니다.

### 주요 기능
- 스와이프 기반 골퍼 매칭
- 조인(그룹 라운딩) 생성 및 참여
- 실시간 채팅
- 스코어 기록 및 통계
- 마커(인앱 화폐) 시스템
- 푸시 알림 / 카카오 알림톡

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3.1 | UI 프레임워크 |
| Vite | 5.x | 빌드 도구 |
| React Router | v6 | SPA 라우팅 |
| Tailwind CSS | 3.x | 스타일링 |
| Framer Motion | - | 애니메이션 |
| Lucide React | - | 아이콘 |

### Backend
| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL DB, Auth, Realtime, Storage, Edge Functions |
| Firebase | 전화번호 SMS 인증, FCM 푸시 알림 |
| Aligo API | 카카오 알림톡 발송 |
| PortOne | 결제 게이트웨이 (이니시스) |
| RevenueCat | iOS/Android 인앱 결제 |

### Mobile (Cross-Platform)
| 기술 | 버전 | 용도 |
|------|------|------|
| Capacitor | 7.4.5 | 네이티브 앱 빌드 |
| iOS | - | App Store 배포 |
| Android | - | Google Play 배포 |

### 배포
| 플랫폼 | 용도 |
|--------|------|
| Vercel | 웹 호스팅 |
| App Store | iOS 앱 배포 |
| Google Play | Android 앱 배포 |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   iOS App   │  │ Android App │  │   Web App   │         │
│  │ (Capacitor) │  │ (Capacitor) │  │   (Vite)    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Supabase  │
                    │  (Backend)  │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───┴───┐            ┌─────┴─────┐          ┌────┴────┐
│  DB   │            │Edge Funcs │          │ Storage │
│(Postgres)│         │  (Deno)   │          │ (S3)    │
└───────┘            └─────┬─────┘          └─────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
    │  Firebase │    │   Aligo   │    │  PortOne  │
    │(FCM/Auth) │    │(알림톡)    │    │  (결제)   │
    └───────────┘    └───────────┘    └───────────┘
```

---

## 폴더 구조

```
GolfPeople/
├── src/
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── Home.jsx           # 메인 (스와이프 매칭)
│   │   ├── Join.jsx           # 조인 목록
│   │   ├── CreateJoin.jsx     # 조인 생성
│   │   ├── JoinDetail.jsx     # 조인 상세
│   │   ├── Profile.jsx        # 내 프로필
│   │   ├── ProfileDetail.jsx  # 타인 프로필
│   │   ├── Saved.jsx          # 저장된 목록
│   │   ├── Store.jsx          # 마커 상점
│   │   ├── ScoreRecord.jsx    # 스코어 기록
│   │   ├── ScoreStats.jsx     # 스코어 통계
│   │   ├── ChatList.jsx       # 채팅 목록
│   │   ├── ChatRoom.jsx       # 채팅방
│   │   ├── PhoneVerification.jsx  # 전화번호 인증
│   │   ├── Login.jsx          # 로그인
│   │   ├── Onboarding.jsx     # 온보딩
│   │   ├── AuthCallback.jsx   # OAuth 콜백
│   │   └── Splash.jsx         # 스플래시
│   │
│   ├── components/            # 재사용 컴포넌트
│   │   ├── SwipeCard.tsx      # 스와이프 카드
│   │   ├── TabBar.jsx         # 하단 탭바
│   │   ├── ProposalModal.jsx  # 제안 모달
│   │   ├── MarkerModal.jsx    # 마커 모달
│   │   └── ...
│   │
│   ├── context/               # React Context
│   │   ├── AuthContext.jsx    # 인증 상태
│   │   ├── AppContext.jsx     # 앱 전역 상태
│   │   └── MarkerContext.jsx  # 마커 지갑
│   │
│   ├── hooks/                 # Custom Hooks
│   │   ├── usePhoneVerification.js
│   │   └── useMarkerSpend.js
│   │
│   ├── lib/                   # 라이브러리 래퍼
│   │   ├── supabase.js        # Supabase 클라이언트
│   │   ├── firebase.js        # Firebase 설정
│   │   ├── native.js          # Capacitor 네이티브
│   │   ├── pushService.js     # 푸시 알림
│   │   ├── notificationService.js  # 통합 알림
│   │   ├── iap.js             # 인앱 결제
│   │   └── portone.js         # PortOne 결제
│   │
│   ├── utils/                 # 유틸리티
│   │   ├── errorHandler.js    # 에러 처리
│   │   ├── validation.js      # 입력 검증
│   │   ├── formatTime.js      # 시간 포맷
│   │   └── storage.js         # 로컬스토리지
│   │
│   ├── App.jsx                # 앱 진입점
│   └── main.jsx               # React 렌더링
│
├── supabase/
│   ├── schema.sql             # DB 스키마 전체
│   ├── migrations/            # 마이그레이션
│   │   ├── 001_marker_spend_function.sql
│   │   └── 002_notifications.sql
│   └── functions/             # Edge Functions
│       ├── send-push/         # FCM 푸시
│       └── send-kakao/        # 알림톡
│
├── ios/                       # iOS 네이티브
├── android/                   # Android 네이티브
├── public/                    # 정적 파일
│   └── .well-known/           # Universal Links
│
├── .env                       # 환경변수
├── package.json
├── vite.config.js
├── tailwind.config.js
└── capacitor.config.json
```

---

## 데이터베이스 스키마

### 핵심 테이블

#### profiles (사용자)
```sql
- id: UUID (PK, auth.users 참조)
- name: VARCHAR(50) NOT NULL
- email: VARCHAR(255) UNIQUE
- phone: VARCHAR(20)
- phone_verified: BOOLEAN
- gender: VARCHAR(10)
- birth_year: INTEGER
- photos: TEXT[]
- regions: TEXT[]
- handicap: VARCHAR(20)
- styles: TEXT[]
- intro: TEXT
```

#### joins (조인/라운딩)
```sql
- id: UUID (PK)
- host_id: UUID (profiles 참조)
- title: VARCHAR(100)
- date: DATE
- time: TIME
- location: VARCHAR(100)
- course_name: VARCHAR(100)
- spots_total: INTEGER
- spots_filled: INTEGER
- handicap_range: VARCHAR(50)
- status: VARCHAR(20) -- open, closed, completed
```

#### 마커 시스템
```sql
-- marker_wallets: 사용자 잔액
-- marker_transactions: 거래 내역
-- marker_products: 상품 정보
-- marker_prices: 액션별 비용
```

### Row Level Security (RLS)
- 모든 테이블에 RLS 활성화
- 민감 데이터(좋아요, 차단, 알림)는 본인만 조회
- 메시지는 채팅방 참가자만 조회

---

## 기능 구현 현황

### ✅ 완료
| 기능 | 파일 |
|------|------|
| 소셜 로그인 (카카오, 구글, 애플) | AuthContext.jsx |
| 전화번호 인증 (Firebase SMS) | PhoneVerification.jsx |
| 프로필 관리 | Profile.jsx |
| 스와이프 매칭 | Home.jsx |
| 조인 CRUD | Join.jsx, CreateJoin.jsx |
| 스코어 기록/통계 | ScoreRecord.jsx, ScoreStats.jsx |
| 푸시 알림 (FCM) | send-push Edge Function |
| 카카오 알림톡 | send-kakao Edge Function |
| 마커 시스템 DB | schema.sql |

### ⚠️ 부분 구현
| 기능 | 상태 |
|------|------|
| 채팅 | UI 완성, 실시간 동기화 미구현 |
| 마커 결제 | 상품 표시만, 결제 로직 필요 |
| 인앱 결제 | 라이브러리 준비됨, 플로우 필요 |

### ❌ 미구현
- 조인 수정 기능
- 라운딩 후 평가/후기
- 자동화 테스트

---

## 환경 설정

### 필수 환경변수 (.env)
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# RevenueCat
VITE_REVENUECAT_IOS_KEY=
VITE_REVENUECAT_ANDROID_KEY=

# PortOne
VITE_PORTONE_IMP_CODE=
VITE_PORTONE_PG_MID=
```

### Supabase Secrets (Edge Functions)
```bash
# Firebase (푸시 알림)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Aligo (알림톡)
ALIGO_API_KEY=
ALIGO_USER_ID=
ALIGO_SENDER_KEY=
ALIGO_SENDER=
```

---

## 빌드 및 실행

### 개발
```bash
npm install          # 의존성 설치
npm run dev          # 로컬 개발 서버 (port 3000)
```

### 빌드
```bash
npm run build        # 웹 빌드
npm run build:native # 웹 + Capacitor 동기화
```

### 모바일
```bash
# iOS
npm run ios          # Xcode 열기
npm run ios:run      # 기기/시뮬레이터 실행

# Android
npm run android      # Android Studio 열기
npm run android:run  # 기기/에뮬레이터 실행
```

### 배포
- **웹**: GitHub push → Vercel 자동 배포
- **iOS**: Xcode → Archive → App Store Connect
- **Android**: Android Studio → Build Bundle → Play Console

---

## 디자인 시스템

### 컬러 팔레트
```css
--gp-black: #0D0D0D      /* 배경 */
--gp-card: #1A1A1A       /* 카드 */
--gp-surface: #262626    /* 표면 */
--gp-gold: #D4AF37       /* 강조 (골드) */
--gp-green: #52A567      /* 보조 (그린) */
--gp-text: #FFFFFF       /* 텍스트 */
--gp-text-secondary: #888 /* 보조 텍스트 */
```

### 폰트
- 기본: 시스템 폰트 (-apple-system, BlinkMacSystemFont)

---

## API 레퍼런스

### Supabase Client (lib/supabase.js)

#### 인증
```javascript
auth.signUp(email, password, metadata)
auth.signIn(email, password)
auth.signInWithKakao()
auth.signInWithGoogle()
auth.signOut()
```

#### 프로필
```javascript
db.profiles.get(userId)
db.profiles.update(userId, data)
db.profiles.getAll(filters)
```

#### 조인
```javascript
db.joins.getAll(filters)
db.joins.create(data)
db.joins.update(joinId, data)
db.joins.delete(joinId)
```

### Edge Functions

#### send-push
```javascript
POST /functions/v1/send-push
{
  recipientId: string,
  title: string,
  body: string,
  data?: object
}
```

#### send-kakao
```javascript
POST /functions/v1/send-kakao
{
  recipientId: string,
  templateCode: string,
  variables: object
}
```

---

## 문서 버전
- **작성일**: 2026년 2월 2일
- **프로젝트 버전**: 1.0.0
- **작성자**: Claude (AI Assistant)
