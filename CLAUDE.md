# 골프피플 (GolfPeople) 개발 일지

## 프로젝트 개요
- 골프 소셜 매칭 앱 (React + Vite + Capacitor + Supabase)
- 배포: https://golf-people.vercel.app
- iOS/Android 네이티브 빌드 (Capacitor 7)

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
