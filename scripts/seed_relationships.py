#!/usr/bin/env python3
"""
GolfPeople 관계 시드 데이터 삽입 스크립트
- 가상 회원 간 친구 관계 (수락됨 + 대기중)
- 테스트유저에게 오는 친구 요청
- 조인 신청 (수락됨 → 참가자 + 채팅방 자동생성)
- 1:1 채팅 메시지 (자연스러운 대화)
- 조인 채팅방 메시지
- 알림 데이터
- 리뷰/평가 데이터
- 스코어 기록
"""

import urllib.request
import json
import uuid
import random
import ssl
from datetime import datetime, timedelta

# SSL 인증서 검증 비활성화 (로컬 테스트용)
ssl._create_default_https_context = ssl._create_unverified_context

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHh5ZWlzc2RzcG9vbWJybXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyMjg5MywiZXhwIjoyMDgxNTk4ODkzfQ.PKT5hHJjniqVm9KQPlxu9lB43wojs7C1Rb6Ie4cBQyI"
BASE = "https://yxpxyeissdspoombrmsm.supabase.co"

# ============================================================
# API 헬퍼
# ============================================================

def api(method, path, data=None):
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
        text = resp.read().decode()
        return json.loads(text) if text else []
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        # 409 conflict (이미 존재) 는 무시
        if e.code == 409:
            return None
        print(f"  ⚠️  {method} {path[:60]} → {e.code}: {error_body[:150]}")
        return None

def get_all_profiles():
    """모든 프로필 목록 가져오기"""
    result = api("GET", "/rest/v1/profiles?select=id,name,email,photos,regions,handicap&order=created_at.asc")
    return result or []

def get_user_by_email(email):
    """이메일로 유저 ID 조회"""
    url = f"{BASE}/auth/v1/admin/users?page=1&per_page=100"
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
    except Exception as ex:
        print(f"  유저 조회 에러: {ex}")
    return None

def get_joins():
    """조인 목록 가져오기"""
    result = api("GET", "/rest/v1/joins?select=id,title,host_id,spots_total,spots_filled,date,time,location,region&status=eq.open&order=date.asc")
    return result or []

def ts(days_ago=0, hours_ago=0, minutes_ago=0):
    """타임스탬프 생성 (과거 시점)"""
    dt = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")

# ============================================================
# 메인 실행
# ============================================================

print("=" * 60)
print("🏌️ GolfPeople 관계 시드 데이터 삽입")
print("=" * 60)

# 1. 기존 유저 목록 가져오기
print("\n[1/8] 기존 유저 목록 조회...")
profiles = get_all_profiles()
print(f"  → 프로필 {len(profiles)}명 발견")

if len(profiles) < 3:
    print("❌ 프로필이 3명 미만입니다. seed_data.py를 먼저 실행하세요.")
    exit(1)

# dev@bottlecorp.kr 유저 찾기
dev_user_id = get_user_by_email("dev@bottlecorp.kr")
if not dev_user_id:
    print("  ⚠️ dev@bottlecorp.kr 계정 못 찾음, 첫번째 프로필을 테스트유저로 사용")
    dev_user_id = profiles[0]["id"]

# 테스트유저 외 시드유저 분리
seed_users = [p for p in profiles if p["id"] != dev_user_id]
dev_profile = next((p for p in profiles if p["id"] == dev_user_id), profiles[0])

print(f"  테스트유저: {dev_profile.get('name', '?')} ({dev_user_id[:8]}...)")
print(f"  시드유저: {len(seed_users)}명")

for p in seed_users[:5]:
    print(f"    - {p.get('name', '?')} ({p['id'][:8]}...)")
if len(seed_users) > 5:
    print(f"    ... +{len(seed_users)-5}명")

# ============================================================
# 2. 친구 요청 + 친구 관계 (트리거 활용)
# ============================================================
print("\n[2/8] 친구 요청 생성...")

# 시드유저끼리 친구 관계 (수락됨) - 최대 8쌍
friend_pairs_accepted = []
for i in range(min(8, len(seed_users) - 1)):
    a = seed_users[i]["id"]
    b = seed_users[(i + 1) % len(seed_users)]["id"]
    friend_pairs_accepted.append((a, b))

# 시드유저 → 테스트유저 친구 요청 (수락됨 2개 + 대기중 3개)
friend_to_dev_accepted = [(seed_users[i]["id"], dev_user_id) for i in range(min(2, len(seed_users)))]
friend_to_dev_pending = [(seed_users[i]["id"], dev_user_id) for i in range(2, min(5, len(seed_users)))]

# 친구 관계 생성: pending 삽입 → accepted 업데이트 (트리거 발동)
accepted_count = 0
for from_id, to_id in friend_pairs_accepted + friend_to_dev_accepted:
    req_id = str(uuid.uuid4())
    # Step 1: pending 삽입
    result = api("POST", "/rest/v1/friend_requests", {
        "id": req_id,
        "from_user_id": from_id,
        "to_user_id": to_id,
        "message": random.choice([
            "안녕하세요! 같이 라운딩해요 ⛳",
            "반갑습니다~ 골프 좋아하시나요?",
            "프로필 보고 연락드려요!",
            "같은 지역이시네요! 함께 치면 좋겠어요",
            "골프피플에서 만나뵙게 되어 반갑습니다 😊",
        ]),
        "status": "pending",
        "created_at": ts(days_ago=random.randint(1, 7)),
    })
    if result:
        # Step 2: accepted 업데이트 (트리거: 친구관계+채팅방+알림 자동생성)
        api("PATCH", f"/rest/v1/friend_requests?id=eq.{req_id}", {"status": "accepted"})
        accepted_count += 1

print(f"  ✅ 친구 관계 {accepted_count}쌍 (수락됨, 채팅방 자동생성)")

# 대기중 친구 요청 (테스트유저에게)
pending_count = 0
for from_id, to_id in friend_to_dev_pending:
    result = api("POST", "/rest/v1/friend_requests", {
        "from_user_id": from_id,
        "to_user_id": to_id,
        "message": random.choice([
            "안녕하세요! 주말 라운딩 같이 하실래요?",
            "프로필이 인상적이에요! 친구 맺어요",
            "같은 타수대시네요~ 함께 라운딩해요!",
        ]),
        "status": "pending",
        "created_at": ts(hours_ago=random.randint(1, 24)),
    })
    if result:
        pending_count += 1

print(f"  ✅ 대기중 친구 요청 {pending_count}개 (테스트유저에게)")

# ============================================================
# 3. 조인 신청 + 참가자 (트리거 활용)
# ============================================================
print("\n[3/8] 조인 신청 생성...")

joins = get_joins()
print(f"  → 조인 {len(joins)}개 발견")

app_accepted = 0
app_pending = 0

for join in joins:
    join_id = join["id"]
    host_id = join["host_id"]
    spots_total = join.get("spots_total", 4)
    spots_filled = join.get("spots_filled", 1)
    available = spots_total - spots_filled

    # 신청 가능한 유저 (호스트 제외)
    applicants = [s for s in seed_users if s["id"] != host_id]
    random.shuffle(applicants)

    # 수락될 신청 (빈 자리만큼)
    for i in range(min(available - 1, 2, len(applicants))):
        app_id = str(uuid.uuid4())
        user = applicants[i]
        result = api("POST", "/rest/v1/join_applications", {
            "id": app_id,
            "join_id": join_id,
            "user_id": user["id"],
            "message": random.choice([
                "안녕하세요! 참가 신청합니다 😊",
                "자리 있으면 같이 치고 싶어요!",
                "라운딩 함께하고 싶습니다~",
                "좋은 기회네요! 신청합니다",
            ]),
            "status": "pending",
            "created_at": ts(days_ago=random.randint(0, 3)),
        })
        if result:
            # 수락 (트리거: 참가자+채팅방+알림 자동생성)
            api("PATCH", f"/rest/v1/join_applications?id=eq.{app_id}", {"status": "accepted"})
            app_accepted += 1

    # 대기 중 신청 1개 (테스트유저에게 보이도록)
    if dev_user_id != host_id and available > 0:
        # 테스트유저가 호스트인 조인이 아닌 경우, 테스트유저를 신청자로
        pass  # 테스트유저의 신청은 별도로

    # 시드유저의 대기중 신청 1개
    remaining = [a for a in applicants[3:] if a["id"] != host_id]
    if remaining:
        api("POST", "/rest/v1/join_applications", {
            "join_id": join_id,
            "user_id": remaining[0]["id"],
            "message": "참가하고 싶어요! 아직 자리 있나요?",
            "status": "pending",
            "created_at": ts(hours_ago=random.randint(1, 12)),
        })
        app_pending += 1

print(f"  ✅ 조인 신청 수락 {app_accepted}개 (참가자+채팅방 자동생성)")
print(f"  ✅ 조인 신청 대기 {app_pending}개")

# ============================================================
# 4. 채팅 메시지 삽입 (기존 채팅방에)
# ============================================================
print("\n[4/8] 채팅 메시지 생성...")

# 1:1 채팅 (친구가 된 사람들의 채팅방에 메시지 추가)
chat_rooms = api("GET", "/rest/v1/chat_rooms?select=id,type,name,join_id&order=created_at.desc&limit=20")
chat_rooms = chat_rooms or []

# 각 채팅방의 참가자 목록 가져오기
msg_count = 0

DIRECT_CONVERSATIONS = [
    [
        "안녕하세요! 골프피플에서 인사드려요 😊",
        "안녕하세요~ 반갑습니다!",
        "프로필 보니까 경기도 쪽이시네요?",
        "네! 용인 근처에서 주로 쳐요",
        "오 저도 분당이에요! 가까우시네",
        "그러게요ㅎㅎ 주말에 한번 같이 치실래요?",
        "좋아요! 이번 주말 토요일 어떠세요?",
        "토요일 오전이면 좋을 것 같아요 👍",
    ],
    [
        "반갑습니다~ 같은 90대시네요!",
        "네 ㅎㅎ 요즘 90 깨려고 노력중이에요",
        "저도요! 드라이버가 문제에요 😅",
        "아 드라이버.. 저도 OB가 너무 많아서ㅋㅋ",
        "연습장에서 열심히 치는데 필드가면 또 달라요ㅎㅎ",
        "그쵸 ㅋㅋ 필드 갈 때마다 긴장되더라고요",
        "그래도 재밌잖아요! 언제 같이 한번 치러가요",
        "좋죠! 다음주 평일에 시간 되세요?",
        "화요일이면 가능합니다!",
        "화요일로 해요 👍 코스는 어디로 할까요?",
    ],
    [
        "안녕하세요! 제주도 골프 좋아하시나요?",
        "네! 제주 자주 가요 ⛳",
        "다음달에 제주 여행 가는데 추천 코스 있나요?",
        "핀크스 강추합니다! 제가 안내해드릴까요?",
        "정말요? 그러면 너무 감사하죠!!",
        "ㅎㅎ 연락주세요~ 제주 오시면 같이 라운딩해요",
    ],
    [
        "골프 시작한지 얼마 안됐는데 많이 가르쳐주세요!",
        "환영합니다~ 저도 초보일 때 많이 힘들었어요ㅎㅎ",
        "스코어가 아직 100 넘어요 😭",
        "다들 처음엔 그래요! 꾸준히 하면 금방 늘어요",
        "감사해요 ㅠㅠ 주말에 연습장이라도 같이 가실래요?",
        "좋아요! 일요일 오후에 어떠세요?",
    ],
]

GROUP_CONVERSATIONS = [
    [
        ("이번 라운딩 날씨가 좋았으면 좋겠네요!", 2),
        ("맞아요 ㅎㅎ 비만 안 오면 좋겠어요", 1),
        ("일기예보 봤는데 맑대요 ☀️", 0),
        ("오 다행이다! 기대됩니다", 2),
        ("카트 예약은 했나요?", 1),
        ("네! 2대 예약해놨어요 👍", 0),
        ("혹시 점심은 코스 내 식당에서 먹을까요?", 2),
        ("그렇죠! 해장국이 맛있다고 들었어요", 1),
        ("좋아요 그럼 당일 아침 7시에 만나요!", 0),
    ],
    [
        ("다들 라운딩 준비 잘 되셨나요?", 0),
        ("넵! 오늘 컨디션 좋습니다 💪", 1),
        ("저도 어제 연습장 갔다왔어요ㅎㅎ", 2),
        ("오늘 날씨 완벽하네요!", 0),
        ("바람도 별로 안 불고 좋다~", 1),
    ],
]

for room in chat_rooms:
    room_id = room["id"]
    room_type = room.get("type", "direct")
    
    # 참가자 목록 가져오기
    participants = api("GET", f"/rest/v1/chat_participants?room_id=eq.{room_id}&select=user_id")
    if not participants or len(participants) < 2:
        continue
    
    participant_ids = [p["user_id"] for p in participants]
    
    if room_type == "direct" and msg_count < 15:
        # 1:1 대화
        conv = random.choice(DIRECT_CONVERSATIONS)
        for i, msg_text in enumerate(conv):
            sender_idx = i % 2
            sender_id = participant_ids[sender_idx % len(participant_ids)]
            minutes_ago = (len(conv) - i) * random.randint(3, 15)
            api("POST", "/rest/v1/messages", {
                "room_id": room_id,
                "sender_id": sender_id,
                "content": msg_text,
                "type": "text",
                "created_at": ts(hours_ago=random.randint(0, 48), minutes_ago=minutes_ago),
            })
            msg_count += 1
    
    elif room_type == "group" and msg_count < 30:
        # 그룹 대화
        conv = random.choice(GROUP_CONVERSATIONS)
        for msg_text, sender_offset in conv:
            sender_id = participant_ids[sender_offset % len(participant_ids)]
            minutes_ago = random.randint(5, 60)
            api("POST", "/rest/v1/messages", {
                "room_id": room_id,
                "sender_id": sender_id,
                "content": msg_text,
                "type": "text",
                "created_at": ts(hours_ago=random.randint(0, 24), minutes_ago=minutes_ago),
            })
            msg_count += 1

print(f"  ✅ 채팅 메시지 {msg_count}개 생성")

# ============================================================
# 5. 테스트유저에게 직접 채팅 메시지 추가
# ============================================================
print("\n[5/8] 테스트유저 채팅방에 메시지 추가...")

# 테스트유저가 참여중인 채팅방 찾기
dev_rooms = api("GET", f"/rest/v1/chat_participants?user_id=eq.{dev_user_id}&select=room_id")
dev_msg_count = 0

DEV_CONVERSATIONS = [
    [
        "안녕하세요! 같이 라운딩 하고 싶어요 😊",
        "안녕하세요~ 반갑습니다!",
        "이번 주말에 시간 되시나요?",
        "토요일 오전이면 가능해요!",
        "좋아요~ 남서울CC 어떠세요?",
        "좋습니다! 토요일 7시에 만나요 ⛳",
        "넵! 그때 봬요~ 기대돼요!",
        "저도 기대됩니다 😄",
    ],
    [
        "프로필 보고 연락드려요!",
        "네 반갑습니다~",
        "혹시 다음주에 라운딩 계획 있으세요?",
        "아직 없어요! 같이 가실래요?",
        "좋죠! 어디로 갈까요?",
        "이천쪽은 어떠세요? 코스가 좋대요",
        "오 좋아요! 이천으로 해요 👍",
    ],
]

if dev_rooms:
    for room_info in dev_rooms[:3]:
        room_id = room_info["room_id"]
        # 상대방 찾기
        room_participants = api("GET", f"/rest/v1/chat_participants?room_id=eq.{room_id}&select=user_id")
        if not room_participants:
            continue
        
        other_ids = [p["user_id"] for p in room_participants if p["user_id"] != dev_user_id]
        if not other_ids:
            continue
        
        other_id = other_ids[0]
        conv = random.choice(DEV_CONVERSATIONS)
        
        for i, msg_text in enumerate(conv):
            # 번갈아가며 메시지 (짝수=상대, 홀수=나)
            sender_id = other_id if i % 2 == 0 else dev_user_id
            minutes_ago = (len(conv) - i) * random.randint(5, 20)
            api("POST", "/rest/v1/messages", {
                "room_id": room_id,
                "sender_id": sender_id,
                "content": msg_text,
                "type": "text",
                "created_at": ts(hours_ago=random.randint(1, 12), minutes_ago=minutes_ago),
            })
            dev_msg_count += 1

print(f"  ✅ 테스트유저 채팅 메시지 {dev_msg_count}개 생성")

# ============================================================
# 6. 알림 데이터 (테스트유저용)
# ============================================================
print("\n[6/8] 알림 데이터 생성...")

notif_data = []

# 친구 요청 알림
for i in range(min(3, len(seed_users))):
    user = seed_users[i]
    notif_data.append({
        "user_id": dev_user_id,
        "type": "friend_request",
        "title": "새로운 친구 요청",
        "body": f"{user.get('name', '골퍼')}님이 친구 요청을 보냈습니다",
        "data": json.dumps({"senderId": user["id"], "senderName": user.get("name", "골퍼"), "userPhoto": (user.get("photos") or [""])[0]}),
        "is_read": i > 0,  # 첫번째만 안읽음
        "created_at": ts(hours_ago=random.randint(1, 48)),
    })

# 조인 관련 알림
if joins:
    notif_data.append({
        "user_id": dev_user_id,
        "type": "join_request",
        "title": "조인 신청 알림",
        "body": f"'{joins[0].get('title', '라운딩')[:20]}' 조인에 새로운 신청이 왔습니다",
        "data": json.dumps({"joinId": joins[0]["id"], "joinTitle": joins[0].get("title", "")}),
        "is_read": False,
        "created_at": ts(hours_ago=3),
    })

# 매칭 완료 알림
if len(seed_users) > 1:
    matched_user = seed_users[0]
    notif_data.append({
        "user_id": dev_user_id,
        "type": "match",
        "title": "친구 매칭 완료! 🎉",
        "body": f"{matched_user.get('name', '골퍼')}님과 친구가 되었어요",
        "data": json.dumps({"friend_id": matched_user["id"], "userPhoto": (matched_user.get("photos") or [""])[0]}),
        "is_read": True,
        "created_at": ts(days_ago=1),
    })

# 시스템 알림
notif_data.append({
    "user_id": dev_user_id,
    "type": "system",
    "title": "환영합니다! ⛳",
    "body": "골프피플에 가입해주셔서 감사합니다. 매일 새로운 골프 친구를 추천해드릴게요!",
    "data": "{}",
    "is_read": True,
    "created_at": ts(days_ago=3),
})

notif_count = 0
for n in notif_data:
    result = api("POST", "/rest/v1/notifications", n)
    if result:
        notif_count += 1

print(f"  ✅ 알림 {notif_count}개 생성")

# ============================================================
# 7. 리뷰/평가 데이터
# ============================================================
print("\n[7/8] 리뷰 데이터 생성...")

REVIEW_TAGS = [
    ["매너 좋음", "시간 약속 준수", "실력 좋음"],
    ["친절함", "재밌음", "다시 만나고 싶음"],
    ["매너 좋음", "초보에게 친절", "분위기 메이커"],
    ["실력 좋음", "시간 약속 준수", "매너 좋음"],
    ["재밌음", "다시 만나고 싶음", "네트워킹"],
]

REVIEW_COMMENTS = [
    "함께 라운딩해서 정말 즐거웠습니다! 다음에 또 같이 치면 좋겠어요 ⛳",
    "매너가 좋으시고 분위기도 밝으셔서 라운딩이 즐거웠어요",
    "실력도 좋으시고 초보인 저한테도 친절하게 대해주셨어요 감사합니다!",
    "시간 약속도 잘 지키시고 매너도 좋으셔서 추천드립니다 👍",
    "재밌는 분이에요! 같이 치면 시간 가는 줄 몰라요 ㅎㅎ",
    "비즈니스 라운딩으로도 좋을 것 같은 분이에요. 매너 최고!",
    "드라이버가 진짜 멀리 가시더라고요 ㅎㅎ 부러웠어요",
    "페어웨이 관리가 좋은 분이에요. 플레이가 안정적이십니다",
]

review_count = 0
# 시드유저끼리 리뷰 (최대 12개)
review_pairs = []
for i in range(min(6, len(seed_users) - 1)):
    a = seed_users[i]
    b = seed_users[(i + 1) % len(seed_users)]
    review_pairs.append((a, b))
    review_pairs.append((b, a))

for reviewer, reviewed in review_pairs[:12]:
    result = api("POST", "/rest/v1/reviews", {
        "reviewer_id": reviewer["id"],
        "reviewed_id": reviewed["id"],
        "rating": random.choice([4, 4, 5, 5, 5]),  # 긍정적 리뷰 위주
        "tags": random.choice(REVIEW_TAGS),
        "comment": random.choice(REVIEW_COMMENTS),
        "is_public": True,
        "created_at": ts(days_ago=random.randint(1, 14)),
    })
    if result:
        review_count += 1

# 시드유저 → 테스트유저 리뷰 2개
for i in range(min(2, len(seed_users))):
    result = api("POST", "/rest/v1/reviews", {
        "reviewer_id": seed_users[i]["id"],
        "reviewed_id": dev_user_id,
        "rating": 5,
        "tags": random.choice(REVIEW_TAGS),
        "comment": random.choice(REVIEW_COMMENTS),
        "is_public": True,
        "created_at": ts(days_ago=random.randint(1, 7)),
    })
    if result:
        review_count += 1

print(f"  ✅ 리뷰 {review_count}개 생성")

# ============================================================
# 8. 스코어 기록 (시드유저 + 테스트유저)
# ============================================================
print("\n[8/8] 스코어 기록 생성...")

COURSES = [
    ("남서울CC", "경기"),
    ("레이크사이드CC", "경기"),
    ("한양CC", "서울"),
    ("기장CC", "부산"),
    ("핀크스GC", "제주"),
    ("블루원CC", "경기"),
    ("이천 사우스CC", "경기"),
    ("곤지암CC", "경기"),
]

score_count = 0

# 테스트유저 스코어 5개
for i in range(5):
    course = random.choice(COURSES)
    total = random.randint(88, 105)
    front = random.randint(42, 55)
    back = total - front
    result = api("POST", "/rest/v1/scores", {
        "user_id": dev_user_id,
        "date": (datetime.now() - timedelta(days=random.randint(7, 90))).strftime("%Y-%m-%d"),
        "course_name": course[0],
        "course_region": course[1],
        "total_score": total,
        "front_nine": front,
        "back_nine": back,
        "par": 72,
        "putts": random.randint(28, 38),
        "fairway_hits": random.randint(5, 11),
        "greens_in_regulation": random.randint(3, 10),
        "weather": random.choice(["sunny", "cloudy", "windy"]),
        "note": random.choice([
            "드라이버 컨디션 좋았음",
            "퍼팅이 아쉬웠다",
            "아이언이 잘 맞았음!",
            "날씨가 좋아서 기분 좋은 라운딩",
            "다음엔 80대 노려야지",
        ]),
    })
    if result:
        score_count += 1

# 시드유저 스코어 (유저당 2~3개, 최대 10명)
for user in seed_users[:10]:
    for _ in range(random.randint(2, 3)):
        course = random.choice(COURSES)
        # 핸디캡에 맞는 스코어 범위
        handicap = user.get("handicap", "90대")
        if "70" in handicap or "싱글" in handicap:
            total = random.randint(74, 85)
        elif "80" in handicap:
            total = random.randint(82, 95)
        elif "100" in handicap:
            total = random.randint(100, 115)
        else:
            total = random.randint(90, 105)
        
        front = random.randint(max(35, total // 2 - 5), min(60, total // 2 + 5))
        back = total - front
        
        result = api("POST", "/rest/v1/scores", {
            "user_id": user["id"],
            "date": (datetime.now() - timedelta(days=random.randint(7, 120))).strftime("%Y-%m-%d"),
            "course_name": course[0],
            "course_region": course[1],
            "total_score": total,
            "front_nine": front,
            "back_nine": back,
            "par": 72,
            "putts": random.randint(28, 40),
            "fairway_hits": random.randint(4, 12),
            "greens_in_regulation": random.randint(2, 12),
            "weather": random.choice(["sunny", "cloudy", "rainy", "windy"]),
        })
        if result:
            score_count += 1

print(f"  ✅ 스코어 기록 {score_count}개 생성")

# ============================================================
# 9. 좋아요 데이터
# ============================================================
print("\n[보너스] 좋아요 데이터 생성...")

like_count = 0
# 시드유저 → 테스트유저 좋아요
for i in range(min(5, len(seed_users))):
    result = api("POST", "/rest/v1/likes", {
        "user_id": seed_users[i]["id"],
        "liked_user_id": dev_user_id,
    })
    if result:
        like_count += 1

# 시드유저끼리 좋아요
for i in range(min(8, len(seed_users) - 1)):
    api("POST", "/rest/v1/likes", {
        "user_id": seed_users[i]["id"],
        "liked_user_id": seed_users[(i + 2) % len(seed_users)]["id"],
    })
    like_count += 1

print(f"  ✅ 좋아요 {like_count}개 생성")

# ============================================================
# 완료
# ============================================================
print("\n" + "=" * 60)
print("🎉 관계 시드 데이터 삽입 완료!")
print("=" * 60)
print(f"""
  📊 생성 결과 요약:
  ├─ 친구 관계 (수락됨): {accepted_count}쌍
  ├─ 친구 요청 (대기중): {pending_count}개
  ├─ 조인 신청 (수락됨): {app_accepted}개
  ├─ 조인 신청 (대기중): {app_pending}개
  ├─ 채팅 메시지: {msg_count + dev_msg_count}개
  ├─ 알림: {notif_count}개
  ├─ 리뷰: {review_count}개
  ├─ 스코어 기록: {score_count}개
  └─ 좋아요: {like_count}개

  💡 앱에서 확인하세요:
  - 홈: 추천 카드에 시드유저 표시
  - 조인: 참가자 + 채팅방 생성됨
  - 채팅: 자연스러운 대화 내역
  - 저장함: 친구 요청 대기 목록
  - 알림: 다양한 알림 표시
""")
