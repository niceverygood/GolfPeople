#!/usr/bin/env python3
"""
GolfPeople 시드 데이터 삽입 스크립트
- 테스트용 프로필 15명 생성
- 조인 모집글 5개 생성
- 마커 지갑 생성
"""

import urllib.request
import json
import uuid
import random
from datetime import datetime, timedelta

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHh5ZWlzc2RzcG9vbWJybXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyMjg5MywiZXhwIjoyMDgxNTk4ODkzfQ.PKT5hHJjniqVm9KQPlxu9lB43wojs7C1Rb6Ie4cBQyI"
BASE = "https://yxpxyeissdspoombrmsm.supabase.co"

def api_request(method, path, data=None, expect_list=False):
    """Supabase REST API 호출"""
    url = f"{BASE}{path}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body[:200]}")
        return None

def create_auth_user(email, password="testpass123!"):
    """Supabase Auth Admin API로 유저 생성"""
    url = f"{BASE}/auth/v1/admin/users"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    data = json.dumps({
        "email": email,
        "password": password,
        "email_confirm": True,
    }).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        return result.get("id")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        if "already been registered" in error_body:
            print(f"  이미 존재: {email}")
            # 기존 유저 ID 조회
            return get_user_by_email(email)
        print(f"  Auth ERROR: {error_body[:200]}")
        return None

def get_user_by_email(email):
    """이메일로 기존 유저 ID 조회"""
    url = f"{BASE}/auth/v1/admin/users?page=1&per_page=50"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        users = result.get("users", result) if isinstance(result, dict) else result
        for u in users:
            if u.get("email") == email:
                return u.get("id")
    except:
        pass
    return None

# ============================================================
# 시드 프로필 데이터 (15명)
# ============================================================
SEED_PROFILES = [
    {
        "email": "seed_jihoon@golfpeople.test",
        "name": "김지훈",
        "gender": "남성",
        "birth_year": 1985,
        "regions": ["서울", "경기"],
        "handicap": "80대",
        "styles": ["즐거운 라운딩", "네트워킹"],
        "times": ["주말 오전", "주말 오후"],
        "intro": "서울 근교에서 주말 라운딩 즐깁니다. 편하게 연락주세요!",
        "photo_url": "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        "email": "seed_minji@golfpeople.test",
        "name": "박민지",
        "gender": "여성",
        "birth_year": 1992,
        "regions": ["서울", "인천"],
        "handicap": "90대",
        "styles": ["즐거운 라운딩", "초보 환영"],
        "times": ["주말 오전"],
        "intro": "골프 시작한 지 2년차! 같이 즐겁게 라운딩해요 :)",
        "photo_url": "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        "email": "seed_sungjae@golfpeople.test",
        "name": "이성재",
        "gender": "남성",
        "birth_year": 1978,
        "regions": ["경기", "충남"],
        "handicap": "70대",
        "styles": ["진지한 플레이", "싱글 목표"],
        "times": ["평일 오전", "주말 오전"],
        "intro": "10년차 골퍼입니다. 싱글 달성이 목표!",
        "photo_url": "https://randomuser.me/api/portraits/men/45.jpg",
        "is_verified": True,
    },
    {
        "email": "seed_yuna@golfpeople.test",
        "name": "최유나",
        "gender": "여성",
        "birth_year": 1990,
        "regions": ["서울", "경기"],
        "handicap": "100대",
        "styles": ["즐거운 라운딩", "초보 환영"],
        "times": ["주말 오후"],
        "intro": "작년에 골프 입문했어요! 초보지만 열심히 하고 있습니다.",
        "photo_url": "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
        "email": "seed_donghyun@golfpeople.test",
        "name": "정동현",
        "gender": "남성",
        "birth_year": 1982,
        "regions": ["부산", "경남"],
        "handicap": "80대",
        "styles": ["네트워킹", "비즈니스"],
        "times": ["평일 오후", "주말 오전"],
        "intro": "부산에서 활동중입니다. 비즈니스 라운딩도 환영합니다.",
        "photo_url": "https://randomuser.me/api/portraits/men/22.jpg",
        "is_verified": True,
    },
    {
        "email": "seed_soojin@golfpeople.test",
        "name": "한수진",
        "gender": "여성",
        "birth_year": 1988,
        "regions": ["경기", "강원"],
        "handicap": "90대 초반",
        "styles": ["즐거운 라운딩", "자연 힐링"],
        "times": ["주말 오전", "주말 오후"],
        "intro": "강원도 골프장 자주 갑니다. 드라이브 겸 라운딩 좋아해요.",
        "photo_url": "https://randomuser.me/api/portraits/women/33.jpg",
    },
    {
        "email": "seed_minsoo@golfpeople.test",
        "name": "오민수",
        "gender": "남성",
        "birth_year": 1995,
        "regions": ["서울", "경기"],
        "handicap": "100대",
        "styles": ["초보 환영", "즐거운 라운딩"],
        "times": ["주말 오후"],
        "intro": "올해 입문한 완전 초보입니다. 같이 배우실 분!",
        "photo_url": "https://randomuser.me/api/portraits/men/11.jpg",
    },
    {
        "email": "seed_hyejin@golfpeople.test",
        "name": "강혜진",
        "gender": "여성",
        "birth_year": 1986,
        "regions": ["대구", "경북"],
        "handicap": "80대",
        "styles": ["진지한 플레이", "대회 준비"],
        "times": ["평일 오전", "주말 오전"],
        "intro": "대구 거주. 아마추어 대회 나가고 있어요. 함께 연습할 분 찾습니다.",
        "photo_url": "https://randomuser.me/api/portraits/women/28.jpg",
        "is_verified": True,
    },
    {
        "email": "seed_youngho@golfpeople.test",
        "name": "신영호",
        "gender": "남성",
        "birth_year": 1975,
        "regions": ["제주"],
        "handicap": "70대",
        "styles": ["진지한 플레이", "네트워킹"],
        "times": ["평일 오전", "평일 오후"],
        "intro": "제주도 골프 전문! 제주 오시면 연락주세요.",
        "photo_url": "https://randomuser.me/api/portraits/men/55.jpg",
        "is_verified": True,
    },
    {
        "email": "seed_jiyoung@golfpeople.test",
        "name": "임지영",
        "gender": "여성",
        "birth_year": 1993,
        "regions": ["서울", "경기"],
        "handicap": "90대",
        "styles": ["즐거운 라운딩", "네트워킹"],
        "times": ["주말 오전"],
        "intro": "IT 업계에서 일하고 있어요. 주말 라운딩 함께해요!",
        "photo_url": "https://randomuser.me/api/portraits/women/17.jpg",
    },
    {
        "email": "seed_taehyung@golfpeople.test",
        "name": "배태형",
        "gender": "남성",
        "birth_year": 1980,
        "regions": ["광주", "전남"],
        "handicap": "80대 초반",
        "styles": ["즐거운 라운딩", "비즈니스"],
        "times": ["평일 오후", "주말 오전"],
        "intro": "광주에서 사업하고 있습니다. 골프 좋아하시는 분 환영!",
        "photo_url": "https://randomuser.me/api/portraits/men/36.jpg",
    },
    {
        "email": "seed_eunji@golfpeople.test",
        "name": "서은지",
        "gender": "여성",
        "birth_year": 1991,
        "regions": ["서울"],
        "handicap": "100대",
        "styles": ["초보 환영", "즐거운 라운딩"],
        "times": ["주말 오후"],
        "intro": "골프 3개월차 왕초보! 편하게 라운딩하실 분 구합니다 ㅎㅎ",
        "photo_url": "https://randomuser.me/api/portraits/women/52.jpg",
    },
    {
        "email": "seed_jaehyuk@golfpeople.test",
        "name": "조재혁",
        "gender": "남성",
        "birth_year": 1987,
        "regions": ["대전", "충북"],
        "handicap": "90대",
        "styles": ["즐거운 라운딩", "자연 힐링"],
        "times": ["주말 오전", "주말 오후"],
        "intro": "대전 근처 골프장 위주로 다닙니다. 같이 치실 분!",
        "photo_url": "https://randomuser.me/api/portraits/men/41.jpg",
    },
    {
        "email": "seed_nayoung@golfpeople.test",
        "name": "윤나영",
        "gender": "여성",
        "birth_year": 1989,
        "regions": ["인천", "경기"],
        "handicap": "90대 후반",
        "styles": ["즐거운 라운딩", "초보 환영"],
        "times": ["평일 오후", "주말 오전"],
        "intro": "인천 영종도 근처 살아요. 가까운 분들 같이 치러가요!",
        "photo_url": "https://randomuser.me/api/portraits/women/22.jpg",
    },
    {
        "email": "seed_sangwoo@golfpeople.test",
        "name": "황상우",
        "gender": "남성",
        "birth_year": 1983,
        "regions": ["경기", "서울"],
        "handicap": "80대",
        "styles": ["네트워킹", "진지한 플레이"],
        "times": ["평일 오전", "주말 오전"],
        "intro": "경기도 용인 거주. 꾸준히 치고 있습니다. 함께 라운딩해요!",
        "photo_url": "https://randomuser.me/api/portraits/men/19.jpg",
        "is_verified": True,
    },
]

# ============================================================
# 실행
# ============================================================

print("=" * 50)
print("GolfPeople 시드 데이터 삽입 시작")
print("=" * 50)

# 1. 기존 프로필 업데이트 (테스트유저 + 서연)
print("\n[1/4] 기존 프로필 업데이트...")

# 테스트유저 업데이트
test_user_update = {
    "gender": "남성",
    "birth_year": 1990,
    "regions": ["서울", "경기"],
    "handicap": "90대",
    "styles": ["즐거운 라운딩", "네트워킹"],
    "times": ["주말 오전", "주말 오후"],
    "intro": "골프피플 개발자입니다. 같이 라운딩해요!",
    "is_verified": True,
}
result = api_request("PATCH", "/rest/v1/profiles?id=eq.1bd21e33-f1f5-46b2-98dd-8a723fa04b6c", test_user_update)
print(f"  테스트유저 업데이트: {'성공' if result else '실패'}")

# 서연 업데이트
seoyeon_update = {
    "gender": "여성",
    "birth_year": 1994,
    "regions": ["서울", "경기"],
    "handicap": "100대",
    "styles": ["즐거운 라운딩", "초보 환영"],
    "times": ["주말 오전"],
    "intro": "골프 좋아하는 서연입니다! 즐겁게 라운딩해요 :)",
    "is_verified": False,
}
result = api_request("PATCH", "/rest/v1/profiles?id=eq.aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", seoyeon_update)
print(f"  서연 업데이트: {'성공' if result else '실패'}")

# 2. 새 유저 + 프로필 생성
print("\n[2/4] 새 프로필 15명 생성...")
created_user_ids = []

for i, profile_data in enumerate(SEED_PROFILES):
    email = profile_data["email"]
    print(f"  [{i+1}/15] {profile_data['name']} ({email})...")

    # Auth 유저 생성
    user_id = create_auth_user(email)
    if not user_id:
        print(f"    유저 생성 실패, 건너뜀")
        continue

    created_user_ids.append(user_id)

    # 프로필 업데이트 (trigger가 기본 프로필 생성했을 것)
    profile_update = {
        "name": profile_data["name"],
        "gender": profile_data["gender"],
        "birth_year": profile_data["birth_year"],
        "regions": profile_data["regions"],
        "handicap": profile_data["handicap"],
        "styles": profile_data["styles"],
        "times": profile_data["times"],
        "intro": profile_data["intro"],
        "photos": [profile_data["photo_url"]],
        "is_verified": profile_data.get("is_verified", False),
        "is_online": random.choice([True, False]),
    }

    result = api_request("PATCH", f"/rest/v1/profiles?id=eq.{user_id}", profile_update)
    if result:
        print(f"    프로필 업데이트 완료 (id: {user_id[:8]}...)")
    else:
        # trigger가 안 됐으면 직접 INSERT
        profile_insert = {"id": user_id, "email": email, **profile_update}
        result = api_request("POST", "/rest/v1/profiles", profile_insert)
        print(f"    프로필 직접 삽입: {'성공' if result else '실패'}")

# 3. 조인 모집글 생성
print("\n[3/4] 조인 모집글 5개 생성...")

# 호스트로 사용할 유저 ID (생성된 유저 중에서)
if len(created_user_ids) >= 5:
    join_hosts = created_user_ids[:5]
else:
    join_hosts = created_user_ids + ["1bd21e33-f1f5-46b2-98dd-8a723fa04b6c"] * (5 - len(created_user_ids))

JOINS = [
    {
        "title": "주말 서울 근교 라운딩 같이 하실 분!",
        "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        "time": "07:00",
        "location": "서울 근교",
        "region": "경기",
        "course_name": "남서울CC",
        "spots_total": 4,
        "spots_filled": 1,
        "handicap_range": "80~100",
        "styles": ["즐거운 라운딩"],
        "description": "편하게 라운딩 하실 분 구합니다. 초보도 환영!",
        "meeting_type": "현장 집결",
        "status": "open",
    },
    {
        "title": "경기도 평일 조조 1자리 급구",
        "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "06:30",
        "location": "경기도 용인",
        "region": "경기",
        "course_name": "레이크사이드CC",
        "spots_total": 4,
        "spots_filled": 3,
        "handicap_range": "70~90",
        "styles": ["진지한 플레이"],
        "description": "1자리 급구합니다! 핸디 90 이하분 부탁드려요.",
        "meeting_type": "현장 집결",
        "status": "open",
    },
    {
        "title": "제주도 2박3일 골프 여행 함께할 분",
        "date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
        "time": "08:00",
        "location": "제주도",
        "region": "제주",
        "course_name": "핀크스GC",
        "spots_total": 4,
        "spots_filled": 2,
        "handicap_range": "제한없음",
        "styles": ["즐거운 라운딩", "자연 힐링"],
        "description": "2월 제주도 골프여행 계획 중입니다. 2라운드 예정이에요. 같이 가실 분!",
        "meeting_type": "함께 이동",
        "status": "open",
    },
    {
        "title": "부산 해운대 근처 주말 라운딩",
        "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
        "time": "07:30",
        "location": "부산 기장",
        "region": "부산",
        "course_name": "기장CC",
        "spots_total": 4,
        "spots_filled": 2,
        "handicap_range": "80~100",
        "styles": ["네트워킹", "즐거운 라운딩"],
        "description": "부산 기장에서 라운딩합니다. 라운딩 후 횟집도 갈 예정!",
        "meeting_type": "현장 집결",
        "status": "open",
    },
    {
        "title": "여성 골퍼 모임 - 서울 라운딩",
        "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "time": "08:00",
        "location": "서울",
        "region": "서울",
        "course_name": "한양CC",
        "spots_total": 4,
        "spots_filled": 1,
        "handicap_range": "제한없음",
        "styles": ["즐거운 라운딩", "초보 환영"],
        "description": "여성 골퍼분들 같이 편하게 라운딩해요! 초보도 대환영입니다.",
        "meeting_type": "현장 집결",
        "status": "open",
    },
]

for i, join_data in enumerate(JOINS):
    host_id = join_hosts[i] if i < len(join_hosts) else join_hosts[0]
    join_data["host_id"] = host_id
    join_data["id"] = str(uuid.uuid4())

    result = api_request("POST", "/rest/v1/joins", join_data)
    print(f"  [{i+1}/5] '{join_data['title'][:20]}...' : {'성공' if result else '실패'}")

    # 호스트를 join_participants에도 추가
    if result:
        participant = {
            "join_id": join_data["id"],
            "user_id": host_id,
            "role": "host",
        }
        api_request("POST", "/rest/v1/join_participants", participant)

# 4. 마커 지갑 확인/생성
print("\n[4/4] 마커 지갑 확인...")
for user_id in created_user_ids:
    wallet = api_request("GET", f"/rest/v1/marker_wallets?user_id=eq.{user_id}&select=id")
    if not wallet or len(wallet) == 0:
        wallet_data = {
            "user_id": user_id,
            "balance": 10,
            "total_purchased": 0,
            "total_spent": 0,
        }
        result = api_request("POST", "/rest/v1/marker_wallets", wallet_data)
        if result:
            print(f"  마커 지갑 생성: {user_id[:8]}...")

print("\n" + "=" * 50)
print("시드 데이터 삽입 완료!")
print(f"  - 프로필: 15명 + 기존 2명 업데이트")
print(f"  - 조인 모집글: 5개")
print("=" * 50)
