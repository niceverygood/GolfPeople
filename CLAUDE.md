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

## iOS App Store 심사 리젝 수정 체크리스트 (2026-02-12)

### 코드 수정 (자동 — 이미 완료)
- [x] **1.1.6** "Apple Pay" 표기 → "App Store 인앱 결제" 수정 (Store.jsx, commit ce0888a)
- [x] **2.1 PassKit** App.entitlements에서 `com.apple.developer.in-app-payments` 제거
- [x] **4.0** 설정 모달 스크롤 개선 — `pb-40` + `safe-area-inset-bottom` 적용 (Profile.jsx)
- [x] **2.1 카메라 크래시** Info.plist에 NSCameraUsageDescription 등 4개 키 추가 (commit b36fdf0)
- [x] **1.5** Login.jsx에서 이용약관/개인정보 링크 클릭 가능하게 수정

### Supabase 설정 (수동)
- [x] **2.1 Sign in with Apple** Supabase Dashboard → Authentication → Providers → Apple 활성화 ✅

### Xcode / 앱 빌드 (수동)
- [x] **2.3.8** 앱 아이콘 교체 — SVG → cairosvg/qlmanage 1024x1024 PNG 생성, GP 텍스트 포함 ✅
- [x] **2.3.3** iPad 지원 해제 — `TARGETED_DEVICE_FAMILY = 1` (iPhone 전용) → iPad 스크린샷 불필요 ✅
- [x] 빌드 번호 3 → 5, cap sync + archive 빌드 ✅
- [x] Xcode Organizer → App Store Connect 업로드 완료 (1.0.2 빌드 5) ✅
- [ ] **2.1 카메라** 직접 테스트: 프로필 사진 촬영 시 카메라 권한 요청 정상 동작 확인

### App Store Connect (수동)
- [x] **2.1 데모 계정** 심사 메모에 테스트 계정 추가 ✅
- [x] **1.5** 지원 URL 변경 완료 ✅
- [x] 앱 버전/빌드 번호 올리기 (1.0.2 빌드 5) ✅
- [ ] 빌드 5 처리 완료 후 심사 제출

### App Store Connect 심사 메모 (Review Notes) — 복사해서 붙여넣기

```
본 앱은 소셜 로그인(Apple/Google/Kakao)만 지원합니다.
위에 입력된 계정 정보는 Google 로그인용입니다.

로그인 방법:
1. "Google로 시작하기" 버튼을 탭합니다.
2. 위 심사 정보에 입력된 Google 계정으로 로그인합니다.

로그인 후 안내:
- 전화번호 인증(SMS)은 "나중에 하기" 버튼으로 건너뛸 수 있습니다.
- 홈 화면에서 추천 프로필과 조인 목록을 확인하실 수 있습니다.
- 인앱 결제(마커 구매)는 App Store 인앱 결제를 통해 이루어집니다.
- 결제 없이도 조인 목록, 채팅, 프로필 기능을 이용하실 수 있습니다.
```

---

## 2026-02-27 (금) 작업일지

### 전체 코드 리뷰 2차 수행 + HIGH 4건 + MEDIUM 15건 수정 (17파일, +183/-73)

#### 리뷰 수행
- 3개 에이전트 병렬 실행: Context/Service (11건) + Pages (12건) + Utils/기타 (12건)
- 전체 ~30개 소스 파일 정밀 분석
- 발견: **HIGH 4건 + MEDIUM 15건** (이전 `540abaa` 커밋 이후 잔존 이슈)

#### HIGH 4건

| # | 파일 | 버그 | 수정 |
|---|------|------|------|
| 1 | `ChatContext.jsx` | cleanup에서 `unsubscribeAll()` 호출 → 활성 채팅방 구독 파괴 | allRooms 구독만 해제 + enterRoom try-catch |
| 2 | `AuthContext.jsx` | `initAuth()`에서 중복 프로필 fetch → onAuthStateChange와 경쟁 | 중복 fetch 제거, INITIAL_SESSION 이벤트에 위임 |
| 3 | `Profile.jsx` | BlockManageModal 차단 해제 시 `user_id` 필터 없음 → 타인 차단 삭제 가능 | `.eq('user_id', currentUserId)` 추가 |
| 4 | `Home.jsx` | saveDailyRecommendation useEffect 의존성 → 무한 루프 위험 | useRef로 안정화, 의존성 배열에서 제거 |

#### MEDIUM 15건

| # | 파일 | 수정 |
|---|------|------|
| 1 | `AppContext.jsx` | sendFriendRequest 더블클릭 방지 (sendingFriendRef) |
| 2 | `AppContext.jsx` | cancelJoinApplication 롤백용 snapshot 캡처 (functional updater) |
| 3 | `AppContext.jsx` | saveDailyRecommendation 14일 트림 immutable (in-place delete 제거) |
| 4 | `friendService.js` | accept/reject/cancel에 UUID 검증 추가 |
| 5 | `ProfileDetail.jsx` | handleSendRequest isProcessing 더블클릭 방지 |
| 6 | `ChatRoom.jsx` | 메시지 수 증가 시에만 스크롤 (편집/삭제 시 스크롤 방지) |
| 7 | `ScoreRecord.jsx` | DB 에러 체크 후 throw + handleDelete 에러 토스트 |
| 8 | `ScoreRecord.jsx` | handleSubmit user null guard 추가 |
| 9 | `RoundingHistory.jsx` | today 계산 UTC → 로컬 날짜 |
| 10 | `Saved.jsx` | rejoin_chat_room RPC 에러 처리 |
| 11 | `errorHandler.js` | parseSupabaseError raw 메시지 노출 방지 |
| 12 | `paymentVerify.js` | catch 블록 error.message 노출 제거 |
| 13 | `ScoreStats.jsx` | 월별 평균 차트가 기간 필터 무시 → filteredScores 기반 filteredMonthly로 변경 |
| 14 | `Review.jsx` | 프로필 이미지 4곳에 onError fallback + null-safe src 추가 |
| 15 | `storage.js` | addToArray 객체 중복 체크: id 기반 some() 사용 (기존 includes()는 원시값만) |

#### 빌드 결과
- 에러 0개, 빌드 성공 (8.62s)
- 수정 파일 17개, +183/-73

---

## 2026-02-26 (목) 작업일지

### iOS 1.0.4 + Android 1.0.5 빌드 + CRITICAL/HIGH 7건 수정 + 알림톡 디버깅

#### CRITICAL/HIGH 코드 수정 (7건) — 커밋 `92ebcf5`
- `App.jsx`: 중복 딥링크 핸들러 제거 (AuthContext와 충돌 방지)
- `AuthContext.jsx`: context value useMemo 최적화 + 로그아웃 시 `gp_*` localStorage 동적 정리
- `ProfileDetail.jsx`: 신고/차단 오프라인 체크 + DB 에러 처리 + 친구요청 더블클릭 방지
- `Onboarding.jsx`: `isSaving` 더블클릭 방지 + 프로필 저장 실패 시 onComplete 차단 + 에러 토스트
- `JoinDetail.jsx`: 조인 신청 ApplyModal `submitting` 더블클릭 방지
- `joinService.js`: 수락/거절/취소에 `currentUserId` 파라미터 추가 (호스트 본인 검증)
- `Splash.jsx`: GP 로고 + 골드 스피너 (이중 로고 방지)

#### OAuth 콜백 자동 리다이렉트 — 커밋 `195686b`
- **문제**: 로그아웃 → Google 재로그인 시 흰색 화면에서 "완료" 버튼 눌러야 앱 복귀
- **수정**: `AuthCallbackNative.jsx`에서 `window.location.href = url` 자동 리다이렉트 시도, 1.5초 후 실패 시에만 버튼 표시

#### 카카오 알림톡 디버깅 + 수정
- **문제**: `send_kakao_alimtalk` RPC 호출 시 `{"error": "unauthorized"}` 반환
- **원인**: DB 함수 내부에 `auth.uid() IS NULL` 체크 → service_role 호출 시 auth.uid()가 NULL
- **수정** (마이그레이션 105): `auth.uid() IS NULL AND current_setting('role') != 'service_role'` 조건으로 변경
- Supabase DB outbound IP 확인: `52.76.56.94` (변경 없음)
- 알림톡 발송 테스트 성공 (010-4944-1503, UF_2416 친구 요청 템플릿)

#### 알리고 IP 대역 분석
- Supabase Singapore(ap-southeast-1) outbound IP: `52.76.56.94`
- AWS IP 대역: `52.76.0.0/17` (52.76.0.0 ~ 52.76.127.255)
- 알리고 발송 서버 IP 대역 등록 지원: 마지막 옥텟만 공란 가능 (예: `52.76.56.` → 0~255)

#### iOS Firebase 전화번호 인증 완전 수정 (4회 반복 디버깅 끝에 성공)
- `capacitor.config.json`: `FirebaseAuthentication.providers: ["phone"]` 설정 추가 — **핵심 원인**: 빈 배열이라 phoneAuthProviderHandler가 nil
- `GoogleService-Info.plist`: 잘못된 CLIENT_ID/REVERSED_CLIENT_ID 제거 (다른 GCP 프로젝트 번호였음)
- `Info.plist`: Firebase reCAPTCHA URL scheme `app-1-356155765246-ios-920d3953de51f1470dd0af` 추가
- `AuthContext.jsx`: Firebase reCAPTCHA 딥링크를 Supabase OAuth 핸들러가 가로채는 문제 수정 (URL 필터 추가)
- `AppDelegate.swift`: FirebaseApp.configure() + APNs 토큰/푸시 포워딩 추가
- `firebase.js`: 이벤트 기반 API로 재작성 (phoneCodeSent/phoneVerificationFailed 리스너)

#### 프로필 수정 ↔ 온보딩 데이터 형식 통일
- **원인**: 온보딩은 `"서울 강남"` 형식으로 저장하지만, 프로필 수정은 `"서울"` flat 버튼 → 데이터 불일치
- 지역: flat 버튼 → 시/도 탭 → 구/군 선택 피커 (REGION_DATA, 최대 5개)
- 스타일: STYLE_CATEGORIES 그룹 → STYLES flat 배열
- 시간: TIME_OPTIONS 그룹 → TIMES flat 배열
- 핸디캡: Onboarding 옵션과 동일하게 통일

#### 전체 11개 화면 safe-area-inset-top 적용 (iOS 노치/상태바 헤더 잘림 방지)
- Profile.jsx: 설정 모달, 프로필 수정 모달, 차단 관리 모달 (3개)
- ChatList, Store, ScoreRecord, ScoreStats, RoundingHistory (5개)
- Terms, Privacy, Support (3개)

#### 온보딩 프로필 이미지 base64 fallback 추가
- Storage 업로드 실패 시 base64 데이터로 fallback 저장 (사진 유실 방지)

#### 전체 코드 리뷰 28건 수정 — 커밋 `a83752b` (14파일, +178/-118)

**HIGH 8건:**
| # | 파일 | 버그 | 수정 |
|---|------|------|------|
| 1 | AppContext.jsx | 친구요청 이중매핑 (r.to_user_id → undefined) | 서비스 매핑 데이터 스프레드 사용 |
| 2 | Profile.jsx:314 | profile.region → undefined | profile.regions?.join(', ') |
| 3 | Profile.jsx:377 | profile.time → undefined | profile.times?.join(', ') |
| 4 | AuthContext.jsx:450 | updateProfile 전역 loading → Splash 깜빡임 | 전역 loading 제거 |
| 5 | App.jsx:85-123 | [profile] 의존성 → 네이티브 초기화 반복 | [] 분리 + profile 별도 useEffect |
| 6 | joinService.js:546 | query.eq() 반환값 미할당 → 인가 우회 | query = query.eq(...) |
| 7 | joinService.js:getJoinDetail | raw DB 데이터 미매핑 | camelCase 매핑 추가 |
| 8 | MarkerContext.jsx:addMarkers | 파라미터 무시 → 잔액 미반영 | 웹훅 대기 3회 재시도 |

**MEDIUM 12건:**
| # | 파일 | 수정 |
|---|------|------|
| 1 | Profile.jsx EditProfileModal | { ...profile } shallow copy (부모 prop 변경 방지) |
| 2 | Profile.jsx REGION_DATA | Onboarding과 전체 지역 동기화 (강원 7→18개 등) |
| 3 | Home.jsx 핸디캡 필터 | user.handicap \|\| '' null guard |
| 4 | Home.jsx blockedUserIds | useMemo [] → useState + visibility/storage 리스너 |
| 5 | Home.jsx handleCardClick | nested state immutable 업데이트 |
| 6 | ChatList.jsx 검색 | (partnerName \|\| '') null-safety |
| 7 | JoinDetail.jsx spotsLeft | Math.max(0, ...) 음수 방지 |
| 8 | Onboarding.jsx 사진 | 리사이즈 base64 → Blob → File 변환 후 업로드 |
| 9 | Profile.jsx 알림 토글 | try-catch + 실패 시 이전값 롤백 + error toast |
| 10 | Store.jsx timer | clearTimeout 추가 (4곳) |
| 11 | Home.jsx 날짜 | UTC → getLocalToday() 로컬 날짜 |
| 12 | Home.jsx 지역 필터 | user.region \|\| '' null guard |

**LOW 8건:**
| # | 파일 | 수정 |
|---|------|------|
| 1 | Home.jsx | visibilitychange 리스너 변수 참조로 클린업 |
| 2 | Home.jsx | filteredUsers useMemo에 blockedUserIds 의존성 추가 |
| 3 | JoinDetail.jsx | toISOString UTC → 로컬 날짜 계산 |
| 4 | ScoreRecord.jsx | resetForm에서 fromJoinId null 초기화 |
| 5 | Friends.jsx | 미사용 showMenu state 제거 |
| 6 | AppContext.jsx | like/save functional updater로 stale closure 방지 |
| 7 | ChatRoom.jsx | hiddenMessages useMemo → useState (즉시 반영) |
| 8 | Home.jsx | PastRecommendations D-day T00:00:00 파싱 |

#### 빌드 및 배포
- iOS 1.0.4 빌드 9: 심사 제출 완료 (이전)
- Android 1.0.5 versionCode 8: AAB 빌드 (6.8MB) → Google Play Console 제출 완료
- iOS 1.0.5 빌드 10: 버전 준비 완료 (Xcode Archive 대기)
- Git 커밋 8건 (`92ebcf5`~`21b5ece`), push 완료
- Vercel 웹 자동 배포

#### 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | 1.0.5 (빌드 10) | App Store 심사 승인 + 배포 완료 (02-27) |
| Android | 1.0.5 (versionCode 8) | Google Play 심사 승인 + 배포 완료 (02-27) |
| Web | 최신 | Vercel 자동 배포 완료 |

---

## 2026-02-25 (수) 작업일지

### iOS 1.0.2 배포 완료 + 1.0.3 심사 제출 + 스플래시 이중 로고 수정

#### iOS 1.0.2 배포
- App Store 심사 통과 (2026-02-25 09:58 승인)
- App Store Connect에서 배포 완료
- 가격 및 사용 가능 여부: 대한민국 설정 완료 (무료)
- App Store 검색 정상 노출 확인 (GP 아이콘 정상)

#### iOS 1.0.3 (빌드 7) 심사 제출
- 버전: 1.0.2 → 1.0.3, 빌드: 6 → 7
- `npm run build` + `npx cap sync ios` + Xcode Archive + 업로드
- 변경 내용: 네이티브 스플래시 골프피플 브랜딩 교체 (검정 배경 + 골드 로고)
- 심사 제출 완료

#### Android 1.0.4 배포 완료
- Google Play 배포 완료 확인 (2026-02-25)

#### 스플래시 이중 로고 문제 수정
- **원인 분석**: 3단계 전환 (네이티브 스플래시 → React Splash → 로그인) 에서 서로 다른 이미지가 2개 표시
  - 네이티브: 골드 사각 아이콘 + "골프피플" 텍스트 (splash-2732x2732.png)
  - React: android-chrome-512.png GP 아이콘 (별도 이미지)
- **LaunchScreen.storyboard 배경색 수정**: `systemBackgroundColor`(흰색) → `#0D0D0D`(검정)
  - 흰색 배경 → 검정 WebView 전환 시 번쩍임 제거
- **네이티브 스플래시 이미지 교체**: Pillow로 GP 앱 아이콘을 검정 배경에 중앙 배치
  - iOS: 2732×2732 / 1822×1822 / 911×911 px 3종 생성
  - Android: 480×480 px 생성
- **React Splash.jsx 단순화**: 로고/텍스트 제거 → 검정 배경 + 골드 스피너만 (이중 표시 방지)
- **capacitor.config.json**: `launchFadeOutDuration: 0` 추가 (전환 페이드 제거)
- **iOS 캐시 주의**: 스플래시 변경 후 기기에서 **앱 삭제** + Xcode **Clean Build Folder** 필수

#### 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | 1.0.2 | App Store 배포 완료 |
| iOS | 1.0.3 (빌드 7) | 심사 중 (스플래시 브랜딩) |
| Android | 1.0.4 (versionCode 5) | Google Play 배포 완료 |
| Web | 최신 | Vercel 자동 배포 완료 |

---

## 2026-02-23 (월) 작업일지

### iOS App Store 심사 리젝 대응 (2차) + 심사 재제출

#### 리젝 사유 분석 (Submission ID: 33a61b67)
- **Guideline 2.1**: Apple Sign In → "Nonces mismatch" 에러 메시지 표시
- **Guideline 2.1**: Google 로그인 후 앱 무한 로딩
- **Guideline 2.1 Information Needed**: 인증 코드 없이 앱 콘텐츠 접근 불가 (Google 계정 2FA + 의심스러운 로그인 감지)

#### 코드 수정

**1. Apple Sign In nonce 수정 (`src/context/AuthContext.jsx`)**
- 기존: `rawNonce`를 Apple에 그대로 전달 → Apple 토큰에 raw 값 포함 → Supabase가 SHA-256 해시해서 비교 → 불일치
- 수정: `crypto.subtle.digest('SHA-256', rawNonce)` 해시 후 Apple에 전달, Supabase에는 rawNonce 전달 → 일치

**2. Google 로그인 후 무한 로딩 수정 (`src/App.jsx`)**
- 기존: `isAuthenticated && !profile && !isOnboarded` → 프로필 로드 실패 시 Splash 무한 표시
- 수정: `profileTimeout` 상태 추가, 5초 타임아웃 후 온보딩으로 진행

#### 심사 메모 변경
- Google 로그인 안내 → **Apple Sign In을 주 로그인 경로로 안내**
- Google 계정은 새 기기에서 의심스러운 로그인 감지 가능성 명시

#### 빌드 및 제출
- 빌드 번호: 5 → **6**
- `npx cap sync ios` → Xcode Archive → App Store Connect 업로드
- 심사 재제출 완료 (1.0.2 빌드 6)
- Git 커밋 `a97951f`, push 완료, Vercel 웹 자동 배포

#### 배포 현황
| 플랫폼 | 버전 | 상태 |
|--------|------|------|
| iOS | 1.0.2 (빌드 6) | 심사 중 (2차 재제출) |
| Android | 1.0.4 (versionCode 5) | Google Play 심사 제출 (02-24) |
| Web | 최신 | Vercel 자동 배포 완료 |

#### 다음 iOS 빌드에 포함할 변경사항
- **네이티브 스플래시 이미지 교체**: Capacitor 기본 파란색 X → 골프피플 브랜딩 — Android 반영 완료, iOS는 다음 빌드 시 반영

---

## 2026-02-13 (금) 작업일지

### iOS App Store 심사 재제출 준비 완료

#### 앱 아이콘 교체
- SVG → 1024x1024 PNG 변환 (`qlmanage -t -s 1024`)
- GP 텍스트 + 골프공 + 깃발 + 다크 배경 정상 렌더링
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` 교체 완료
- `sips`는 SVG 텍스트 미지원 → `qlmanage` (Quick Look) 사용으로 해결

#### iPad 지원 해제 (iPhone 전용)
- `TARGETED_DEVICE_FAMILY = "1,2"` → `1` (iPhone only)
- iPad 스크린샷 불필요 → 리젝 사유 "2.3.3 iPad 스크린샷" 해결
- 기존 iPad 스크린샷 (`~/Downloads/appstore_screenshots/ipad/`) 5장은 사용 안 함

#### 빌드 및 업로드
- 빌드 번호: 3 → 5 (4는 iPad 포함 버전으로 이미 업로드)
- `npx cap sync ios` → `xcodebuild archive` → Xcode Organizer 업로드
- App Store Connect에서 빌드 5 처리 중

#### App Store Connect 수동 작업 (완료)
- 심사 메모 (Review Notes): 테스트 계정 정보 추가 ✅
- 지원 URL 변경 ✅

#### Android 빌드 및 심사 제출
- versionCode 3 → 4, versionName 1.0.2 → 1.0.3
- `npx cap sync android` → `./gradlew bundleRelease` (JAVA_HOME: Android Studio 내장 JDK 21)
- `app-release.aab` (6.8MB) Google Play Console 업로드 → 심사 제출 완료

#### 심사 현황
- **iOS**: 1.0.2 (빌드 5) — 심사 중
- **Android**: 1.0.3 (versionCode 4) — 심사 중

---

## 2026-02-12 (목) 작업일지

### 카카오 알림톡 연동 완료 (알리고 API + DB 직접 발송)

#### 문제
- 카카오 알림톡 템플릿 검수 승인 완료 (UF_2416 친구 요청)
- Supabase Edge Function은 고정 IP가 없어 알리고 API 호출 불가 (에러 -99)
- 알리고 보안정책상 고정 IP 필수

#### 해결: DB 직접 발송 (Edge Function → DB RPC)
- Supabase PostgreSQL DB는 고정 outbound IP 보유 (52.76.56.94)
- `http` 확장 + `pg_net` 확장으로 DB에서 직접 알리고 API 호출
- **AWS EC2 프록시 서버 불필요!**

#### DB 변경사항
- `profiles.kakao_notification_enabled` BOOLEAN 컬럼 추가
- `notification_settings` 테이블 생성 + RLS 정책
- `urlencode()` SQL 함수 신규 (한글 URL 인코딩, lpad 2자리 hex)
- `send_kakao_alimtalk()` SQL 함수 신규 (5개 템플릿 지원)
  - FRIEND_REQUEST (UF_2416) ✅ 승인됨
  - FRIEND_ACCEPTED (UF_2418)
  - JOIN_APPLICATION (UF_2419)
  - JOIN_ACCEPTED (UF_2420)
  - JOIN_REJECTED (UF_2421)
- 마이그레이션: `010_kakao_alimtalk_function.sql`

#### 프론트엔드 변경
- `notificationService.js`: `supabase.functions.invoke('send-kakao')` → `supabase.rpc('send_kakao_alimtalk')` 변경
- `send-kakao/index.ts`: 템플릿 메시지 승인본과 일치하도록 줄바꿈 수정

#### 알리고 설정
- 발송 서버 IP 등록: 52.76.56.94
- API Key: emv0p0khgywmdl5wtt1aidjnx95dicdz
- Sender Key: 072dd3d32fdd6a1e9f24d133f01868060b95fd86 (@bottle)
- 발신번호: 010-8739-9771

#### 테스트 결과
- 로컬 테스트 (test-aligo-local.js): 성공 ✅
- DB RPC 테스트 (send_kakao_alimtalk): 성공 ✅
- 카카오톡 실제 도착: 확인 ✅ (010-4944-1503)

### 채팅 기능 대폭 개선 + 조인 UX 정비

#### 채팅 기능 (커밋 8c770aa, ae9440c)
- **채팅 프로필 사진**: `chat?.partnerPhoto` → `msg.senderPhoto`로 변경 (발신자별 실제 프로필)
- **시스템 메시지**: 카카오톡 스타일 가운데 정렬 텍스트 (프로필 사진 없음)
- **채팅방 멤버 목록**: 헤더 Users 아이콘 클릭 → 멤버 리스트 모달
- **채팅방 나가기**: DB에서 실제 삭제 (`leaveChatRoom` + 015 RLS)
- **메시지 수정/삭제**: 자기 메시지 클릭 → 수정/삭제 모달
- **삭제 옵션 분리**: "나에게서 삭제" (localStorage) / "모두에게서 삭제" (DB)
- **알림 클릭 네비게이션**: `join_application`, `join_accepted` → 조인 상세 페이지 이동

#### DB 마이그레이션
- **015**: messages REPLICA IDENTITY FULL + UPDATE/DELETE RLS + chat_participants DELETE RLS
- **016**: `rejoin_chat_room()` RPC (SECURITY DEFINER) — 나간 채팅방 재입장
- **017**: `confirm_join()` 수정 — 확정 시 pending 신청 자동 rejected 처리

#### 조인 UX (커밋 ae9440c, 646d5d6, deb6c1a, ae4e4e3)
- **조인 탭 4개**: 모든 조인 / 참여중 / 신청중 / 내조인
- **매칭완료 카드 클릭** → 조인 상세 페이지 이동
- **"대화 시작하기"** → 기존 조인 채팅방으로 이동 (1:1 생성 안 함)
- **받은 조인 신청** → 조인 제목 클릭 시 상세 페이지 이동
- **조인 확정 시** pending 신청 자동 거절 (기존 데이터 8건 수동 정리 완료)

#### 버그 수정 (커밋 bddc895, deb6c1a, 804358f)
- **내 프로필 무료 이동**: JoinDetail/Join에서 자기 프로필 클릭 시 마커 미요구
- **채팅방 재입장**: upsert → `rejoin_chat_room` RPC (RLS 우회)
- **"라운딩 시작" 호스트 전용**: `isMember` → `isHostCheck`으로 변경
- **상태 변경 후 화면 유지**: `fetchedJoin`에 상태 저장 (refreshJoins 후 사라짐 방지)
- **PC 카카오 공유**: 팝업 에러 대신 자동 링크 복사 폴백

#### Git 커밋 (8건)
- `8c770aa` feat: 채팅 기능 개선 + 알림 클릭 네비게이션
- `ae9440c` feat: 메시지 삭제 옵션 분리 + 조인 탭 4개 구성
- `646d5d6` fix: 매칭완료 조인 카드 클릭→조인 상세 + 대화시작→기존 조인 채팅방
- `bddc895` fix: 내 프로필 무료 이동 + 나간 채팅방 재입장
- `deb6c1a` fix: 채팅방 재입장 RPC + 라운딩 시작 호스트 전용 + 내 프로필 무료
- `804358f` fix: PC 브라우저 카카오 공유 → 자동 링크 복사 폴백
- `ae4e4e3` feat: 받은 조인 신청 → 조인 상세 클릭 + 확정 시 자동 거절

### 남은 작업
| 우선순위 | 항목 | 상태 |
|---------|------|------|
| ✅ | iOS 1.0.2 App Store 배포 완료 | 02-25 배포 |
| ✅ | Android 1.0.4 Google Play 배포 완료 | 02-25 배포 |
| ✅ | iOS 1.0.5 App Store 심사 승인 + 배포 완료 | 02-27 승인 |
| ✅ | Android 1.0.5 Google Play 심사 승인 + 배포 완료 | 02-27 승인 |
| ✅ | CRITICAL/HIGH 7건 수정 (더블클릭 방지, 호스트 검증, 오프라인 체크) | 완료 (02-26) |
| ✅ | OAuth 콜백 자동 리다이렉트 개선 | 완료 (02-26) |
| ✅ | 알림톡 service_role 호출 수정 | 완료 (02-26) |
| ✅ | 시드 데이터 삭제 (테스트 프로필 15명 + 조인 5개 + 채팅 12건) | 완료 (02-27) |
| ✅ | 카카오 알림톡 연동 (알리고 + DB 직접 발송) | 완료 |
| ✅ | 채팅 기능 대폭 개선 (멤버/나가기/수정/삭제/재입장) | 완료 |
| ✅ | 조인 UX 정비 (4탭/매칭/자동거절) | 완료 |
| 🟡 | 알리고 IP 대역 등록 (`52.76.56.` 공란) | 대기 |
| 🟢 | Web Service Worker (백그라운드 푸시) | 나중에 |

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

### 카카오 알림톡 검수 현황 (전체 완료 ✅)
- **템플릿 6종 전체 검수 승인 완료**
  - UF_2416 친구 요청 ✅
  - UF_2418 친구 수락 ✅
  - UF_2419 조인 신청 ✅
  - UF_2420 조인 수락 ✅
  - UF_2421 조인 거절 ✅
  - UF_2423 기타 ✅
- Edge Function 템플릿 동기화 배포 완료 (`supabase functions deploy send-kakao`)

### 남은 작업
| 우선순위 | 항목 | 상태 |
|---------|------|------|
| 🔴 | iOS/Android 심사 리젝 수정 후 재제출 | 수정 중 |
| ✅ | 카카오 알림톡 템플릿 전체 검수 완료 (UF_2416~2423) | 완료 |
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
