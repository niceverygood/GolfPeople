#!/usr/bin/env python3
"""
골프장 데이터 병합 스크립트
- CSV에서 추출한 누락 골프장을 기존 JSON에 추가
- 중복 제거 및 정렬
"""

import json
from pathlib import Path

# 파일 경로
json_path = Path('/Users/bottle/GolfPeople/src/data/golfCourses.json')
missing_path = Path('/Users/bottle/GolfPeople/scripts/missing_courses.json')
backup_path = Path('/Users/bottle/GolfPeople/src/data/golfCourses.backup.json')

# 기존 JSON 읽기
with open(json_path, 'r', encoding='utf-8') as f:
    existing = json.load(f)

# 누락된 골프장 읽기
with open(missing_path, 'r', encoding='utf-8') as f:
    missing = json.load(f)

print(f"📁 기존 골프장: {len(existing)}개")
print(f"➕ 추가할 골프장: {len(missing)}개")
print()

# 백업 저장
with open(backup_path, 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)
print(f"💾 백업 저장: {backup_path}")

# 병합
merged = existing + missing

# ID 재정렬 (1부터 시작)
for i, course in enumerate(merged, 1):
    course['id'] = i

print(f"✅ 병합 완료: {len(merged)}개")
print()

# 지역별 통계
from collections import Counter
region_counts = Counter([c['region'] for c in merged])
print("🗺️  지역별 분포:")
for region, count in sorted(region_counts.items()):
    print(f"  {region}: {count}개")
print()

# 저장
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print(f"💾 저장 완료: {json_path}")
print(f"📊 총 {len(merged)}개 골프장")
