<!--
[CLAUDE 지시사항]
이 파일은 골프피플 프로젝트 전용 문서입니다.
- 위치: /Users/bottle/GolfPeople/CLAUDE.md (프로젝트 루트)
- 용도: 이 프로젝트의 모든 정보를 여기에 기록
  - 프로젝트 구조, 기술 스택, 핵심 파일
  - 진행 상황, 남은 일정, TODO
  - 코드 수정 내역, 버그 트래킹
  - 노션 작성 초안, 회의 메모 등
- 작업 일지(일별 요약)는 여기가 아니라 상위 폴더 /Users/bottle/CLAUDE.md에 작성
- 이 파일은 Git에 커밋되어 다른 환경에서도 동일한 컨텍스트를 공유함
-->

# 골프피플 (GolfPeople) 개발 일지

## 프로젝트 개요
- 골프 소셜 매칭 앱 (React + Vite + Capacitor + Supabase)
- 배포: https://golf-people.vercel.app
- iOS/Android 네이티브 빌드 (Capacitor 7)

## 기술 스택
- **프론트엔드**: React 18 + Vite + Tailwind CSS + Framer Motion
- **백엔드/DB**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **네이티브**: Capacitor 7 (iOS/Android)
- **상태관리**: React Context (AppContext, AuthContext, MarkerContext)
- **라우팅**: React Router v6
- **배포**: Vercel (Web) + App Store (iOS) + Google Play (Android)

## 주요 파일 구조
```
src/
├── context/       # AppContext, AuthContext, MarkerContext
├── pages/         # Home, Join, JoinDetail, Profile, Saved, ChatList, ChatRoom 등
├── components/    # 공통 컴포넌트 (VerificationBadges, OfflineBanner 등)
├── lib/           # Supabase 서비스 (joinService, friendService, notificationService, kakao 등)
├── utils/         # 유틸리티 (formatTime, errorHandler, storage, profileMapper 등)
└── hooks/         # 커스텀 훅 (usePhoneVerification 등)
```

## 주요 컨벤션
- Supabase RPC/쿼리 사용 (직접 SQL 없음)
- showToast로 사용자 피드백 (alert() 사용 안 함)
- Tailwind CSS 클래스 (gp-dark, gp-card, gp-gold, gp-border, gp-text, gp-text-secondary)
- lucide-react 아이콘 사용
- framer-motion 애니메이션

---

## 2026-02-11 (수) 작업일지

### 사용자 플로우 정비 (라운딩 완료 → 리뷰 → 스코어 연결)

#### DB 마이그레이션 (009)
- `supabase/migrations/009_join_completion_and_score_link.sql`
  - `scores.join_id` UUID 컬럼 추가 (조인↔스코어 연결)
  - `complete_past_joins()` RPC 함수 (date < today인 open 조인 → completed 자동 전환)
  - `likes` RLS 정책 수정 (`liked_user_id = auth.uid()` 조회 허용 → "관심받음" 실수치)
- Supabase CLI로 원격 DB 적용 완료 (`supabase db push`)

#### 서비스 함수
- `src/lib/joinService.js`: 3개 함수 추가
  - `completePastJoins()` — 앱 로드 시 지난 조인 자동 완료
  - `getCompletedRoundings(userId)` — 완료 라운딩 목록 (참가자 포함)
  - `getCompletedRoundingCount(userId)` — 완료 라운딩 수
- `src/lib/profileStatsService.js` (신규)
  - `getLikedByCount(userId)` — 나를 좋아한 사람 수
  - `getReceivedApplicationCount(userId)` — 내 조인에 들어온 pending 신청 수

#### AppContext 정리
- `proposals` 상태 + `sendProposal` 제거 (메모리 전용, DB 미연동, 새로고침 시 소실)
- `loadAllData()`에 `completePastJoins()` 호출 추가

#### UI 변경
- `src/pages/Profile.jsx`: 3개 통계칸 실데이터 연동
  | 기존 | 변경 | 데이터 소스 |
  |------|------|-------------|
  | 관심받음 (23 하드코딩) | 관심받음 (실수치) | `getLikedByCount()` |
  | 라운딩 제안 (메모리) | 받은 신청 (실수치) | `getReceivedApplicationCount()` |
  | 완료 라운딩 (0 하드코딩) | 완료 라운딩 (실수치) | `getCompletedRoundingCount()` |
  - 통계칸 클릭 시 네비게이션 (받은 신청 → `/saved?tab=applications`, 완료 라운딩 → `/rounding-history`)
  - "보낸 라운딩 제안" 섹션 삭제
  - 메뉴에 "라운딩 기록" 항목 추가
- `src/pages/RoundingHistory.jsx` (신규): 과거 참여 조인 목록, 리뷰/스코어 버튼
- `src/pages/ScoreRecord.jsx`: `?fromJoin={joinId}` 지원 (날짜/골프장 자동 채움, join_id 저장)
- `src/App.jsx`: `/rounding-history` 라우트 추가, ProposalModal 제거
- `src/pages/Saved.jsx`: `onPropose` 제거, "라운딩 제안" → "프로필 보기"
- `src/pages/Home.jsx`: `onPropose` prop 제거
- `src/components/ProposalModal.jsx`: 삭제

### 앱 전체 코드 리뷰 및 수정 (이전 세션)

#### CRITICAL (7건) - 커밋 f30d6a0, e949141
- `.gitignore`: Firebase 서비스 파일 + 키스토어/서명 파일 제외
- `android/app/build.gradle`: 서명 비밀번호 → signing.properties 외부화
- `src/lib/friendService.js`: UUID 검증 추가 (SQL 인젝션 방지)
- `src/context/AppContext.jsx`: Provider value useMemo + 로그아웃 상태 클리어
- `src/context/AppContext.jsx`: Realtime 구독 의존성 배열 수정
- `src/lib/chatService.js`: Promise.all → Promise.allSettled

#### HIGH (7건) - 커밋 335fad7
- `src/context/MarkerContext.jsx`: 서버 동기화 1회 재시도 + null 안전성
- `src/context/ChatContext.jsx`: enterRoomIdRef 레이스 컨디션 방지 + 로그아웃 클리어
- `src/pages/Saved.jsx`: startDirectChat 실패 시 에러 토스트
- `src/pages/Profile.jsx`: 이미지 업로드 실패 피드백
- `src/lib/notificationService.js`: push/kakao 개별 try-catch
- `src/lib/paymentVerify.js`: 에러 타입 구분 (PGRST116 vs 실 에러)

#### MEDIUM (5건+) - 커밋 2f2b606
- `src/context/AppContext.jsx`: loadAllData Promise.allSettled + null-safe
- `capacitor.config.json`: allowNavigation 와일드카드 정리
- `vercel.json`: 보안 헤더 + 에셋 캐싱 추가
- `vite.config.js`: 코드 스플리팅 (메인 번들 1,096KB → 778KB, 29% 감소)
- `supabase/migrations/008_rls_security_fixes.sql`: RLS 활성화 + 정책 생성 (수동 실행 완료)

#### 코드 품질 (2건) - 커밋 52bde45
- `src/pages/ChatRoom.jsx`: formatDate → getDateGroupLabel 이름 변경 (공유 유틸과 혼동 방지)
- `src/App.jsx`: ProtectedRoute + AuthenticatedApp 컴포넌트 분리 (인증 보호 명시적 패턴)

#### 번들 최적화 (추가)
- `src/App.jsx`: 비핵심 페이지 8개 React.lazy 전환 (Store, ScoreRecord, ScoreStats, Friends, Review, Privacy, Terms, Support)
- `src/App.jsx`: IAP 초기화 dynamic import로 지연 로딩
- `vite.config.js`: manualChunks 추가 (vendor-router, vendor-capacitor, vendor-firebase)
- **메인 번들: 778KB → 342KB (56% 추가 감소, 총 1,096KB → 342KB = 69% 감소)**

### 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | v1.0.2 | ⚠️ 심사 리젝 → 수정 중 |
| Android | v1.0.2 | ⚠️ 심사 리젝 → 수정 중 |
| Web | 최신 | Vercel 자동 배포 완료 |

### 카카오 알림톡 검수 현황 (4차 반려)
- **템플릿**: 친구 요청 알림 (UF_2416)
- **반려 이력**:
  - 1차 (02-02): 수신 대상 불명확 → 수신자 액션 기반 고정값 필요
  - 2차 (02-03): 동일 사유 → 메시지 내 액션 근거 추가 필요
  - 3차 (02-06): 다발성 메시지 → 수신자 동의/고지 문구 필요
  - 4차 (02-09): 다발성 문구 부족 → **"고객님께서 요청하신" 형태의 명확한 고정값 필요**
- **핵심 반려 사유**: 수신자가 직접 동의/요청했음을 확인할 수 있는 **고정 문구**가 메시지 본문에 포함되어야 함
- **5차 재신청 (02-11)**: 동의 문구 강화 — `[마이페이지 > 설정 > 알림 설정]에서 직접 설정(ON)` + 다발성 고지 + 해제 방법 안내
- Edge Function 템플릿 동기화 배포 완료 (`supabase functions deploy send-kakao`)

### 남은 작업
| 우선순위 | 항목 | 상태 |
|---------|------|------|
| 🔴 | iOS/Android 심사 리젝 수정 후 재제출 | 수정 중 |
| 🟡 | 카카오 알림톡 5차 검수 결과 대기 | 재신청 완료 (02-11) |
| ✅ | 사용자 플로우 정비 (라운딩 완료→리뷰→스코어) | 완료 |
| ✅ | 번들 최적화 | 완료 (342KB, 커밋 92017c0) |
| 🟢 | Web Service Worker (백그라운드 푸시) | 나중에 |
| 🟢 | 시드 데이터 정리 (실 서비스 전 삭제) | 나중에 |

---

## 2026-02-10 (화) 작업일지

### 이전 커밋 (오늘 오전~오후)
- 조인 신청 관련 4가지 버그 수정 (1d270c8)
- 카카오 SDK 공유 기능 추가 (c79c32f)
- 추천 카드 '상세' 텍스트 제거 + 카카오 공유→네이티브 공유 시트 (876016d)
- 전체 앱 뒤로가기 네비게이션 안전 처리 10개 페이지 (8322a48)
- 조인 만들기 더블클릭 중복 생성 방지 (0539a1e)

### 현재 세션 수정사항
1. **카카오톡 공유 에러 수정**
   - `src/lib/kakao.js`: `shareJoinToKakao` 반환값을 `{ success, reason }` 객체로 변경
   - `initKakao()` 실패 시 공유 시도하지 않도록 수정
   - `src/pages/JoinDetail.jsx`: SDK 미로드 시 네이티브 공유로 폴백, 에러 원인별 메시지 분기

2. **알림 모달 UI 개선**
   - 닫기(X) 버튼 → 뒤로가기(←) 버튼 변경 (ArrowLeft 아이콘)
   - "전체 삭제" 버튼 신규 추가 (빨간색 Trash2 아이콘, 텍스트 라벨 포함)
   - "전체 읽기" 버튼에 텍스트 라벨 추가 (아이콘만 → 아이콘+텍스트)
   - `src/lib/notificationService.js`: `deleteAllNotifications()` 함수 신규
   - `src/context/AppContext.jsx`: `deleteAllNotifications` 상태 함수 + export
   - `src/pages/Home.jsx`: NotificationModal에 `onDeleteAll` prop 연결

3. **자기 조인에 자기 신청 방지**
   - `src/lib/joinService.js`: `applyToJoin`에서 host_id === userId 체크 추가
   - `src/context/AppContext.jsx`: 클라이언트 사이드 hostId 체크 추가
   - `src/pages/JoinDetail.jsx`: `isHost` 비교를 String 변환으로 타입 안전하게 수정

### 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | v1.0.2 | App Store 심사 제출 완료 |
| Android | v1.0.2 | Google Play 심사 제출 완료 |
| Web | 최신 | Vercel 자동 배포 (git push 시) |

### 남은 작업
| 우선순위 | 항목 | 상태 |
|---------|------|------|
| 🔴 | iOS/Android 심사 승인 대기 | 심사 중 |
| 🟡 | 카카오 알림톡 템플릿 검수 완료 확인 | 카카오 심사 대기 |
| 🟡 | 카카오 JS 키 교체 확인 (현재 키 유효성) | 확인 필요 |
| 🟢 | Web Service Worker (백그라운드 푸시) | 나중에 |
| 🟢 | 시드 데이터 정리 (실 서비스 전 삭제) | 나중에 |

---

## 2026-02-09 (일) 작업일지

### 완료된 작업
- async/await 누락 수정 7곳 (createNotification 6곳, markAsRead 1곳)
- ChatRoom 신고 결과 미확인 → DB 에러 체크 후 토스트 분기 처리
- formatTime.js Invalid Date 가드 추가 (4개 함수 전체)
- 추천 카드 알고리즘 전면 개선: modulo → seeded shuffle + 시간대별 중복 제거
- 추천 카드 3장 레이아웃, 지나간 추천 14일 보관
- 저장함 조인신청 호스트 정보 매핑 수정
- 하단 탭 '프로필' → '마이페이지' 변경
- 채팅 페이지 '친구' 탭 제거
- 저장함 친구요청 프로필 이미지 fallback
- 조인 지역 필터 UI 개선 (주요 5개 + 더보기)
- 카카오 알림톡 동의 고지 문구 추가 (검수 재신청)
- 골프장 크롤링 자동화 (101개 → 242개)
- 지역 필터 동적 생성 (하드코딩 제거)
- 조인 생성 async/await 누락 버그 수정
- 매칭완료 "대화 시작하기" 버튼 수정
- 회원탈퇴 로직 개선 (신고/차단 기록 보존 + 아카이브)

---

## 2026-02-06 (목) 작업일지

### 완료된 개발 작업 (6개)
1. **AppContext mock → Supabase 전환** - 가짜 유저 15명/조인 3개 mock 데이터 전부 제거, Supabase 실 데이터로 전환. AppContext 전면 리팩토링, profileMapper.js 신규 생성. Realtime 구독(알림/친구요청) 추가
2. **ChatRoom 신고/차단 DB 연동** - reports 테이블 저장 (6가지 사유 선택 모달), blocks 테이블 저장 + localStorage 차단 목록
3. **프로필 이미지 리사이징** - imageResize.js 신규 생성. 최대 1024x1024, JPEG 80% 압축. Profile.jsx + Onboarding.jsx 적용
4. **오프라인 모드 안내** - OfflineBanner.jsx 신규 생성. 인터넷 끊기면 빨간 배너 표시, 복구 시 자동 숨김
5. **결제 검증 실패 복구** - 미완료 결제를 localStorage에 저장, 앱 재시작 시 자동 확인 후 서버 잔액 동기화. 24시간 만료
6. **Android versionCode 올리기** - versionCode 2→3, versionName 1.0.1→1.0.2

### 추가 작업
- Android 넓은 화면 지원 - AndroidManifest.xml에 `resizeableActivity="true"` 추가
- Supabase 시드 데이터 삽입 - 테스트 프로필 15명 + 기존 2명 업데이트 + 조인 모집글 5개
- send-kakao Edge Function 배포 완료
- Notion 태스크 관리 연동 (7개 생성, 6개 완료 처리)

### 현재 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | v1.0 (Build 1) | App Store 심사 대기 중 (02-05 제출) |
| Android | v1.0.1 (versionCode 2) | Google Play 배포 완료 |
| Web | v1.0.2 | Vercel 자동 배포 완료 (02-06 push) |

### 남은 작업
| 우선순위 | 항목 | 상태 |
|---------|------|------|
| 🔴 | iOS v1.0 심사 승인 대기 → v1.0.2 업데이트 제출 | iOS 빌드 필요 |
| 🔴 | Android v1.0.2 빌드 및 Google Play 업로드 | Android 빌드 필요 |
| 🟡 | 카카오 알림톡 템플릿 검수 완료 확인 | 카카오 심사 대기 |
| 🟢 | Web Service Worker (백그라운드 푸시) | 나중에 |
| 🟢 | 시드 데이터 정리 (실 서비스 전 삭제) | 나중에 |

---

## 2026-02-05 (수) 작업일지

골프피플 – 결제 검증, 알림, Toast UI, 다크모드, 인증 배지, 테스트, App Store 심사 제출
- iOS Firebase 네이티브 인증 및 푸시 설정
- 결제 서버 검증 웹훅 구현 (RevenueCat 웹훅 + SQL 마이그레이션)
- add_markers REVOKE 조건부 실행 수정
- 알림 설정 화면 구현 (5개 토글 + Supabase 서버 연동) + iOS APS 프로덕션 전환
- Toast UI 구현 및 alert() 30곳 전면 교체 (애니메이션 토스트)
- Vercel 빌드 수정 (firebase 피어 의존성 충돌 해결, legacy-peer-deps)
- 다크모드/라이트모드 토글 구현 (CSS Variables, 26개 파일 수정 없이)
- VerificationBadges 컴포넌트 신규 개발 (인증됨/경험자/매너왕 3종 배지)
- Home, Profile, ProfileDetail, Friends 4개 페이지에 배지 통합
- Vitest + jsdom 테스트 환경 구축, 5개 파일 108개 테스트 전체 통과
- 서연 ↔ 테스트유저 채팅 목업 데이터 12건 삽입
- chat_participants RLS 무한재귀 버그 수정 (SECURITY DEFINER 함수)
- 서연 프로필 이미지 Supabase Storage 업로드 및 연동
- 스크린샷 리사이즈 및 포맷 변환 (iPhone 1284x2778, iPad 2064x2752)
- 개인정보 처리방침 페이지 신규 개발 (/privacy) 및 Vercel 배포
- 앱 개인정보 수집 항목 설정 및 심사 메모 작성
- App Store 심사 제출 완료

⏺ CIS 마이그레이션 – Git 설정, 회원관리 완료, 게시판 완료, 미변환 현황 분석
  - 전체 미변환 ASP 파일 현황 분석 (7,325개 중 153개 완료 → 7,172개 잔여 확인)
  - mem_mdpre.asp → PHP 변환 (3,277줄, DB호출 33개, eregi_replace 함수 충돌 방지)
  - admin/member/ 폴더 100% 완료 (52개 파일)                     
  - bbs_files/CheckReadFunc.asp 변환 (FuncNotReadSql 함수, PDO 전환)
  - bbs_files/include/ 10개 파일 일괄 변환 (del, list, NewschoolList, NewSchoolSearch, OrgList, OrgSearch, schoolList, SchoolList2, SchoolSearch, SchoolSearch2)
  - bbs_files/includeFilesCampBBS/ 5개 파일 일괄 변환(AddFileup,AddpreFileForm, DelFileup, MDfileup, MDpreFileForm)
  - admin/bbs_files/ 폴더 100% 완료 (77개 파일)
  - 전체 변환 완료 파일 약 169개, 1단계 기반구축+게시판 마일스톤 달성

  핀라이브 – 하자보수 16건 완료 + 추가 개선 3건

  - #21 리뷰 시스템 구축 (reviews API + UI, 목업 제거, 별점/리뷰수 DB 자동 업데이트)
  - #22 HOT 상담사 + 팔로워 수 시각화 (베이지안 가중 정렬, HOT 배지 상위 3명)
  - #23 해시태그 클릭 → 검색 연동 (MainBoard + PostDetail 태그 onClick)
  - #28 팔로우 토글 표시 (상담사 카드에 하트 팔로우/언팔로우 버튼)
  - #29 팔로우 취소 (ConsultantsPage + ConsultantProfile 양쪽 지원)
  - #30 화상상담 금액 오류 (적용 안되는 가짜 할인 표시 제거).      
  - #32 파일 첨부 삭제 (댓글 삭제 시 Supabase Storage 첨부파일 연쇄 삭제)
  - #33 댓글 파일 첨부 삭제 (#32와 동일 처리)
  - #34 태그 엔터 시 글 바로 발행 방지 (Enter 키 preventDefault)
  - #36 상담사 전문분야 검색 (이미 구현되어 있음 확인)
  - #37 상담사 정렬 (추천/별점/리뷰/답변/게시글순)
  - #38 상담신청 버튼 위치 통일 (flex layout + mt-auto 하단 고정)
  - #42 마이페이지 새로고침 시 메인 이동 (history.state + hash 파싱 복원)
  - 상담사 최신등록순 정렬 추가
  - 인기글 더보기 버튼 동작 연결 (10개씩 추가 로드 + 남은 개수 표시)
  - 사이드바 인기글 수 30일 필터 누락 수정
