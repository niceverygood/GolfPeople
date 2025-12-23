# 골프피플 네이티브 앱 출시 가이드

이 가이드는 골프피플 웹앱을 iOS App Store와 Google Play Store에 출시하는 방법을 상세히 설명합니다.

## 목차
1. [사전 준비](#1-사전-준비)
2. [개발자 계정 설정](#2-개발자-계정-설정)
3. [인앱 결제 설정 (RevenueCat)](#3-인앱-결제-설정-revenuecat)
4. [푸시 알림 설정](#4-푸시-알림-설정)
5. [iOS 앱 빌드 및 출시](#5-ios-앱-빌드-및-출시)
6. [Android 앱 빌드 및 출시](#6-android-앱-빌드-및-출시)
7. [심사 준비](#7-심사-준비)

---

## 1. 사전 준비

### 필수 소프트웨어
- **Mac** (iOS 개발 필수)
- **Xcode** 15+ (App Store에서 설치)
- **Android Studio** (https://developer.android.com/studio)
- **CocoaPods**: `sudo gem install cocoapods`
- **Node.js** 18+

### 프로젝트 빌드 명령어

```bash
# 웹 빌드 후 네이티브 동기화
npm run build
npx cap sync

# iOS 프로젝트 열기
npx cap open ios

# Android 프로젝트 열기
npx cap open android
```

---

## 2. 개발자 계정 설정

### Apple Developer Program ($99/년)
1. https://developer.apple.com 방문
2. "Enroll" 클릭 → Apple ID로 로그인
3. 개인 또는 조직으로 등록 (사업자등록증 필요 시 조직)
4. 연 $99 결제
5. 승인까지 24-48시간 소요

### Google Play Developer ($25 일회성)
1. https://play.google.com/console 방문
2. Google 계정으로 로그인
3. "시작하기" → 개발자 등록
4. $25 결제
5. 즉시 사용 가능

---

## 3. 인앱 결제 설정 (RevenueCat)

> ⚠️ **중요**: 앱스토어에서 디지털 상품(마커) 판매 시 반드시 Apple/Google의 네이티브 결제 시스템을 사용해야 합니다. 웹 결제(PortOne)는 앱에서 사용할 수 없습니다.

### 3.1 RevenueCat 계정 설정

1. https://www.revenuecat.com 에서 계정 생성
2. 새 프로젝트 생성: "GolfPeople"
3. API 키 복사:
   - iOS: `Settings` → `API Keys` → iOS 키 복사
   - Android: `Settings` → `API Keys` → Android 키 복사

4. `src/lib/iap.js` 파일에서 API 키 설정:
```javascript
const REVENUECAT_IOS_KEY = 'appl_xxxxxxxxxxxxxxxx' // 실제 키로 교체
const REVENUECAT_ANDROID_KEY = 'goog_xxxxxxxxxxxxxxxx' // 실제 키로 교체
```

### 3.2 App Store Connect 인앱 상품 등록

1. https://appstoreconnect.apple.com 접속
2. "나의 앱" → 앱 선택 → "기능" → "인앱 구매"
3. 상품 추가 (소모성 인앱 구매):

| Product ID | 상품명 | 가격 |
|------------|-------|------|
| kr.golfpeople.marker5 | 마커 5개 | ₩1,100 (Tier 1) |
| kr.golfpeople.marker10 | 마커 10개 | ₩2,200 (Tier 2) |
| kr.golfpeople.marker30 | 마커 30개 | ₩5,500 (Tier 5) |
| kr.golfpeople.marker50 | 마커 50개 | ₩8,800 (Tier 8) |
| kr.golfpeople.marker100 | 마커 100개 | ₩15,000 (Tier 15) |

4. 각 상품에 대해:
   - 표시 이름: "마커 5개", "마커 10개" 등
   - 설명: "골프피플 마커 5개 충전"
   - 스크린샷 첨부 (필수)

### 3.3 Google Play Console 인앱 상품 등록

1. https://play.google.com/console 접속
2. 앱 선택 → "수익 창출" → "제품" → "인앱 상품"
3. 위와 동일한 Product ID로 상품 등록

### 3.4 RevenueCat에 상품 연동

1. RevenueCat 대시보드 → "Products"
2. iOS/Android 상품 추가
3. "Offerings" 생성 → 상품 패키지 구성

---

## 4. 푸시 알림 설정

### 4.1 Firebase Cloud Messaging 설정

1. https://console.firebase.google.com 접속
2. 기존 프로젝트(golfpeople-9cbb0) 선택
3. "프로젝트 설정" → "Cloud Messaging"

### 4.2 iOS APNs 설정

1. Apple Developer 사이트 → "Certificates, IDs & Profiles"
2. "Keys" → "Create a Key"
3. "Apple Push Notifications service (APNs)" 체크
4. 키 다운로드 (.p8 파일)
5. Firebase Console → "프로젝트 설정" → "Cloud Messaging"
6. "Apple 앱 구성" → APNs 키 업로드

### 4.3 Android FCM 설정

1. Firebase Console → "프로젝트 설정"
2. Android 앱 추가 (패키지명: kr.golfpeople.app)
3. `google-services.json` 다운로드
4. 파일을 `android/app/` 폴더에 복사

---

## 5. iOS 앱 빌드 및 출시

### 5.1 Xcode 프로젝트 설정

```bash
npx cap open ios
```

1. **Bundle Identifier 설정**:
   - 프로젝트 선택 → "Signing & Capabilities"
   - Bundle Identifier: `kr.golfpeople.app`

2. **Team 설정**:
   - Team: 개발자 계정 선택
   - "Automatically manage signing" 체크

3. **앱 아이콘 설정**:
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset` 에 아이콘 추가
   - 필요한 크기: 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt (1x, 2x, 3x)

4. **Capabilities 추가**:
   - "+ Capability" 클릭
   - "Push Notifications" 추가
   - "In-App Purchase" 추가
   - "Background Modes" → "Remote notifications" 체크

### 5.2 앱 빌드 및 제출

```bash
# 1. 웹 빌드
npm run build

# 2. iOS 동기화
npx cap sync ios

# 3. Xcode에서 빌드
# Product → Archive → Distribute App → App Store Connect
```

### 5.3 App Store Connect 제출

1. 앱 정보 입력:
   - 앱 이름: 골프피플
   - 부제목: 골프 파트너 매칭
   - 카테고리: 소셜 네트워킹 / 스포츠

2. 스크린샷 업로드:
   - iPhone 6.9" (1320 x 2868)
   - iPhone 6.5" (1284 x 2778)
   - iPad Pro 12.9" (2048 x 2732)

3. 앱 설명 (500자 이내):
```
골프피플은 함께 라운드할 골프 파트너를 찾는 소셜 앱입니다.

🏌️ 주요 기능:
• 나와 맞는 골프 파트너 추천
• 라운드 조인 생성 및 참여
• 골프장 예약 매칭
• 실시간 채팅

골프를 더 즐겁게, 골프피플과 함께하세요!
```

4. 개인정보 처리방침 URL 입력

---

## 6. Android 앱 빌드 및 출시

### 6.1 Android Studio 프로젝트 설정

```bash
npx cap open android
```

1. **Package Name 확인**:
   - `android/app/build.gradle` 파일에서 applicationId 확인
   - `kr.golfpeople.app`

2. **앱 아이콘 설정**:
   - `android/app/src/main/res/` 폴더의 mipmap 폴더들에 아이콘 추가

### 6.2 서명 키 생성

```bash
cd android

# Release 키 생성
keytool -genkey -v -keystore golfpeople-release.keystore -alias golfpeople -keyalg RSA -keysize 2048 -validity 10000
```

### 6.3 Gradle 설정

`android/app/build.gradle` 파일에 서명 설정 추가:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('golfpeople-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'golfpeople'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 6.4 앱 빌드

```bash
# 1. 웹 빌드
npm run build

# 2. Android 동기화
npx cap sync android

# 3. AAB 빌드 (Play Store용)
cd android
./gradlew bundleRelease

# 빌드 결과: android/app/build/outputs/bundle/release/app-release.aab
```

### 6.5 Google Play Console 제출

1. 새 앱 만들기
2. 앱 정보 입력:
   - 앱 이름: 골프피플
   - 짧은 설명: 골프 파트너 매칭
   - 전체 설명: (위 iOS 설명 참고)

3. 스크린샷 업로드:
   - 휴대전화 (최소 2장, 16:9 또는 9:16)
   - 7인치 태블릿
   - 10인치 태블릿 (선택)

4. 콘텐츠 등급 설문지 작성

5. 프로덕션 트랙에 AAB 업로드

---

## 7. 심사 준비

### 7.1 필수 문서

1. **개인정보 처리방침** (웹페이지로 작성):
   - 수집하는 개인정보
   - 정보 사용 목적
   - 제3자 제공 여부
   - 데이터 보관 기간
   - 사용자 권리

2. **이용약관**

### 7.2 심사 거절 대비 체크리스트

#### iOS 심사 주의사항:
- [ ] 앱 내 모든 결제는 Apple IAP 사용
- [ ] 외부 결제 링크 없음
- [ ] 로그인 필수 기능에 Apple로 로그인 옵션 제공
- [ ] 푸시 알림 권한 요청 전 설명 표시
- [ ] 개인정보 처리방침 링크 작동

#### Android 심사 주의사항:
- [ ] 타겟 API 레벨 33 이상
- [ ] 권한 요청 사유 명시
- [ ] 데이터 안전성 섹션 작성

### 7.3 테스터 계정

심사자가 앱을 테스트할 수 있도록 테스트 계정 정보 제공:
```
이메일: reviewer@golfpeople.kr
비밀번호: TestReview123!
```

---

## 빠른 참조 명령어

```bash
# 개발 모드 실행
npm run dev

# 웹 빌드
npm run build

# 네이티브 동기화
npx cap sync

# iOS 실행
npx cap run ios

# Android 실행
npx cap run android

# iOS 프로젝트 열기
npx cap open ios

# Android 프로젝트 열기
npx cap open android
```

---

## 문의

문제가 발생하면 다음을 확인하세요:
- Capacitor 문서: https://capacitorjs.com/docs
- RevenueCat 문서: https://www.revenuecat.com/docs
- Firebase 문서: https://firebase.google.com/docs

Happy shipping! 🚀

