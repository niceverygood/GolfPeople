#!/usr/bin/env python3
"""
골프장 데이터 분석 스크립트
- CSV 파일에서 골프장 데이터 추출
- 기존 JSON 데이터와 비교
- 누락된 골프장 식별
"""

import csv
import json
import re
from pathlib import Path
from collections import Counter

# CSV 파일 읽기 (euc-kr 인코딩)
csv_path = Path('/Users/bottle/Downloads/골프장현황.csv')
json_path = Path('/Users/bottle/GolfPeople/src/data/golfCourses.json')

def extract_region_from_address(address):
    """주소에서 시도 추출"""
    if not address:
        return None

    # 경기도 → 경기, 서울특별시 → 서울, 부산광역시 → 부산
    region_patterns = {
        '서울': '서울',
        '경기도': '경기',
        '인천': '인천',
        '부산': '부산',
        '대구': '대구',
        '대전': '대전',
        '광주광역시': '광주',
        '울산': '울산',
        '세종': '세종',
        '강원': '강원',
        '충청남도': '충남',
        '충남': '충남',
        '충청북도': '충북',
        '충북': '충북',
        '경상남도': '경남',
        '경남': '경남',
        '경상북도': '경북',
        '경북': '경북',
        '전라남도': '전남',
        '전남': '전남',
        '전라북도': '전북',
        '전북': '전북',
        '제주': '제주',
    }

    for pattern, region in region_patterns.items():
        if pattern in address:
            return region

    return None

def extract_city_from_address(address):
    """주소에서 시군구 추출"""
    if not address:
        return None

    # "경기도 가평군" → "가평군"
    # "서울특별시 강서구" → "강서구"
    parts = address.split()
    if len(parts) >= 2:
        # 두 번째 파트가 보통 시군구
        city = parts[1]
        # "XX시", "XX군", "XX구" 형태 추출
        return city

    return None

# CSV 데이터 읽기
csv_courses = []
with open(csv_path, 'r', encoding='euc-kr') as f:
    reader = csv.DictReader(f)
    for row in reader:
        address = row.get('소재지도로명주소', '') or row.get('소재지지번주소', '')
        name = row['사업장명'].strip()

        # 영업중인 골프장만 (폐업 제외)
        if row.get('영업상태명') == '영업중':
            region = extract_region_from_address(address)
            city = extract_city_from_address(address)

            csv_courses.append({
                'name': name,
                'region': region,
                'city': city,
                'address': address,
                'latitude': row.get('WGS84위도'),
                'longitude': row.get('WGS84경도'),
            })

print(f"📊 CSV 파일 분석 결과")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"총 골프장 수: {len(csv_courses)}개")
print()

# 지역별 분포
region_counts = Counter([c['region'] for c in csv_courses if c['region']])
print("🗺️  지역별 분포:")
for region, count in sorted(region_counts.items(), key=lambda x: -x[1]):
    print(f"  {region}: {count}개")
print()

# 기존 JSON 데이터 읽기
with open(json_path, 'r', encoding='utf-8') as f:
    json_courses = json.load(f)

print(f"📁 기존 JSON 파일: {len(json_courses)}개")
print()

# 이름 기반 비교 (정규화)
def normalize_name(name):
    """골프장 이름 정규화"""
    # 공백, 특수문자 제거
    name = re.sub(r'[\s\-\.()]', '', name.lower())
    # CC, G.C, 골프장, 컨트리클럽 등 제거
    name = re.sub(r'(cc|gc|골프장|컨트리클럽|country|club|golf)', '', name)
    return name

json_names = {normalize_name(c['name']): c['name'] for c in json_courses}
csv_names = {normalize_name(c['name']): c for c in csv_courses}

# 누락된 골프장 찾기
missing = []
for normalized, course in csv_names.items():
    if normalized not in json_names:
        missing.append(course)

print(f"🔍 누락된 골프장: {len(missing)}개")
print()

if missing:
    print("누락된 골프장 목록 (상위 20개):")
    for i, course in enumerate(missing[:20], 1):
        print(f"  {i}. {course['name']} ({course['region']} {course['city']})")

    if len(missing) > 20:
        print(f"  ... 외 {len(missing) - 20}개")
print()

# JSON 파일에만 있는 골프장 (CSV에 없음)
json_only = []
for normalized, name in json_names.items():
    if normalized not in csv_names:
        json_only.append(name)

if json_only:
    print(f"⚠️  JSON에만 있는 골프장 (CSV에 없음): {len(json_only)}개")
    for name in json_only[:10]:
        print(f"  - {name}")
    if len(json_only) > 10:
        print(f"  ... 외 {len(json_only) - 10}개")
    print()

# 결과 요약
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"📈 요약:")
print(f"  CSV 골프장: {len(csv_courses)}개")
print(f"  JSON 골프장: {len(json_courses)}개")
print(f"  누락된 골프장: {len(missing)}개")
print(f"  JSON 전용: {len(json_only)}개")
print()

# 누락된 골프장을 JSON 형식으로 저장
if missing:
    output_path = Path('/Users/bottle/GolfPeople/scripts/missing_courses.json')

    # ID는 기존 최대 ID + 1부터 시작
    max_id = max([c['id'] for c in json_courses])

    missing_json = []
    for i, course in enumerate(missing, 1):
        # 홀 수는 기본 18홀, type은 기본 '퍼블릭', difficulty는 '중'
        missing_json.append({
            'id': max_id + i,
            'name': course['name'],
            'region': course['region'] or '기타',
            'city': course['city'] or '',
            'address': course['address'],
            'holes': 18,
            'type': '퍼블릭',
            'difficulty': '중',
            'latitude': course['latitude'] if course['latitude'] else None,
            'longitude': course['longitude'] if course['longitude'] else None,
        })

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(missing_json, f, ensure_ascii=False, indent=2)

    print(f"💾 누락된 골프장 JSON 저장: {output_path}")
    print()
