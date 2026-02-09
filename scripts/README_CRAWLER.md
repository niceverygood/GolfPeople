# 골프장 크롤링 자동화 시스템

## 개요
국내 골프장 데이터를 자동으로 수집, 병합, 업데이트하는 시스템입니다.

## 데이터 소스

### 1. 공공데이터포털 CSV (현재 활성화)
- 파일: `골프장현황.csv`
- 제공: 경기도 골프장 현황 (163개)
- 항목: 사업장명, 주소, 위경도, 연락처 등
- 업데이트 주기: 분기별 (공공데이터포털에서 다운로드)

### 2. 기존 수동 수집 데이터
- 전국 주요 골프장 100개
- 모든 지역 커버 (서울, 경기, 강원, 충청, 전라, 경상, 제주)

### 3. 추가 가능한 데이터 소스 (향후 확장)
- 한국골프장경영협회 (KGBA) 회원사 목록
- 네이버/카카오 맵 API
- 골프존, 스마트스코어 등 골프 정보 사이트

## 사용 방법

### 수동 실행
```bash
cd /Users/bottle/GolfPeople
python3 scripts/crawl_golf_courses.py
```

### 자동 실행 (cron)
```bash
# crontab 편집
crontab -e

# 매월 1일 오전 3시 실행
0 3 1 * * cd /Users/bottle/GolfPeople && python3 scripts/crawl_golf_courses.py >> logs/golf_crawler.log 2>&1
```

## 처리 과정

1. **기존 데이터 로드**
   - `src/data/golfCourses.json` 읽기
   - 백업 파일 생성 (`golfCourses.backup.YYYYMMDD.json`)

2. **신규 데이터 수집**
   - CSV 파일에서 영업 중인 골프장만 추출
   - 이름, 주소, 지역, 위경도 파싱

3. **중복 제거 및 병합**
   - 골프장 이름 정규화 (공백/특수문자 제거, CC/GC 통일)
   - 기존 데이터에 없는 골프장만 추가

4. **ID 재정렬 및 저장**
   - 1번부터 순차적으로 ID 재할당
   - JSON 형식으로 저장

## 출력 형식

```json
{
  "id": 1,
  "name": "레이크사이드CC",
  "region": "경기",
  "city": "용인",
  "address": "경기도 용인시 처인구 양지면",
  "holes": 18,
  "type": "회원제",
  "difficulty": "중",
  "latitude": "37.2345",
  "longitude": "127.1234"
}
```

## CSV 업데이트 방법

1. 공공데이터포털 접속
   - https://www.data.go.kr/

2. "골프장 현황" 검색

3. 최신 CSV 파일 다운로드

4. `Downloads/골프장현황.csv`에 저장

5. 크롤러 실행
   ```bash
   python3 scripts/crawl_golf_courses.py
   ```

## 통계

### 현재 상태 (2026-02-09)
- 총 골프장: **242개**
- 데이터 소스:
  - 기존 데이터: 101개
  - CSV 추가: 141개

### 지역별 분포
| 지역 | 개수 |
|------|------|
| 경기 | 181 |
| 강원 | 9 |
| 제주 | 10 |
| 인천 | 6 |
| 경남 | 6 |
| 충남 | 5 |
| 경북 | 4 |
| 전남 | 4 |
| 충북 | 4 |
| 전북 | 3 |
| 부산 | 3 |
| 세종 | 2 |
| 서울 | 1 |
| 광주 | 1 |
| 대구 | 1 |
| 대전 | 1 |
| 울산 | 1 |

## 향후 개선 방안

### 1. 데이터 품질 향상
- [ ] 홀 수 정보 정확도 개선 (현재 기본값 18홀)
- [ ] 회원제/퍼블릭 구분 자동 분류
- [ ] 난이도 정보 수집
- [ ] 골프장 사진 URL 추가

### 2. 추가 데이터 소스
- [ ] 서울/부산 등 타 지역 공공데이터 CSV 통합
- [ ] 카카오 로컬 API 연동
- [ ] KGBA 웹사이트 크롤링

### 3. 자동화 강화
- [ ] GitHub Actions로 월간 자동 업데이트
- [ ] Supabase DB 직접 연동
- [ ] 변경사항 알림 (Slack/이메일)

### 4. 데이터 검증
- [ ] 폐업/휴업 골프장 자동 제거
- [ ] 주소 형식 표준화
- [ ] 위경도 정확성 검증

## 파일 구조

```
scripts/
├── crawl_golf_courses.py      # 메인 크롤러 스크립트
├── analyze_golf_courses.py    # CSV 분석 도구
├── merge_golf_courses.py      # 수동 병합 스크립트
├── missing_courses.json       # 누락된 골프장 목록
└── README_CRAWLER.md          # 이 문서

src/data/
├── golfCourses.json           # 최신 골프장 데이터
└── golfCourses.backup.*.json  # 백업 파일들
```

## 문의
이슈나 개선사항은 프로젝트 리포지토리에 올려주세요.
