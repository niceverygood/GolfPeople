# 골프피플 (GolfPeople) 개발 일지

## 프로젝트 개요
- 골프 소셜 매칭 앱 (React + Vite + Capacitor + Supabase)
- 배포: https://golf-people.vercel.app
- iOS/Android 네이티브 빌드 (Capacitor 7)

---

## 2026-02-05 (수)

골프피플 – 인증 배지, 테스트 코드, 채팅 데이터 구성 및 App Store 심사 제출
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
