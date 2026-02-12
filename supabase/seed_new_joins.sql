-- =============================================
-- 시드 데이터: 새 조인 생성 (2026-02-20 금요일)
-- 실행 전 기존 만료/문제 데이터 정리
-- =============================================

-- 1) 기존 만료된 조인 신청 정리 (날짜 지난 조인의 pending 신청 → expired 처리는 앱에서)
-- 날짜가 지난 조인은 status를 closed로 변경
UPDATE joins
SET status = 'closed', updated_at = NOW()
WHERE date < CURRENT_DATE AND status = 'open';

-- 2) 새 조인 생성 (기존 프로필 중 랜덤 호스트)
-- 프로필 ID를 변수로 추출
DO $$
DECLARE
  host1_id UUID;
  host2_id UUID;
  host3_id UUID;
  host4_id UUID;
  host5_id UUID;
  join1_id UUID;
  join2_id UUID;
  join3_id UUID;
  join4_id UUID;
  join5_id UUID;
BEGIN
  -- 기존 프로필에서 5명 선택 (이름순)
  SELECT id INTO host1_id FROM profiles ORDER BY name ASC LIMIT 1 OFFSET 0;
  SELECT id INTO host2_id FROM profiles ORDER BY name ASC LIMIT 1 OFFSET 1;
  SELECT id INTO host3_id FROM profiles ORDER BY name ASC LIMIT 1 OFFSET 2;
  SELECT id INTO host4_id FROM profiles ORDER BY name ASC LIMIT 1 OFFSET 3;
  SELECT id INTO host5_id FROM profiles ORDER BY name ASC LIMIT 1 OFFSET 4;

  -- 조인 1: 2/20(금) 오전 - 경기 남부
  INSERT INTO joins (id, host_id, title, date, time, location, region, course_name, spots_total, spots_filled, handicap_range, styles, description, meeting_type, status)
  VALUES (
    uuid_generate_v4(), host1_id,
    '금요 모닝 라운드 같이 하실 분', '2026-02-20', '07:00',
    '경기도 용인시 처인구', '경기 남부', '레이크사이드CC',
    4, 1, '90~110', ARRAY['즐겁게', '초보환영'],
    '금요일 아침 여유롭게 한 라운드 하실 분 모집합니다. 초보자도 환영해요!', '첫만남', 'open'
  ) RETURNING id INTO join1_id;

  -- 조인 2: 2/20(금) 오후 - 서울/경기 북부
  INSERT INTO joins (id, host_id, title, date, time, location, region, course_name, spots_total, spots_filled, handicap_range, styles, description, meeting_type, status)
  VALUES (
    uuid_generate_v4(), host2_id,
    '금요 오후 가볍게 9홀', '2026-02-20', '14:00',
    '경기도 파주시', '경기 북부', '서원밸리CC',
    4, 1, '80~100', ARRAY['즐겁게', '내기좋아'],
    '금요 오후 하프만 가볍게 치실 분! 끝나고 저녁 한잔도 가능합니다.', '첫만남', 'open'
  ) RETURNING id INTO join2_id;

  -- 조인 3: 2/21(토) 오전 - 충청
  INSERT INTO joins (id, host_id, title, date, time, location, region, course_name, spots_total, spots_filled, handicap_range, styles, description, meeting_type, status)
  VALUES (
    uuid_generate_v4(), host3_id,
    '주말 이른 새벽 라운드', '2026-02-21', '06:30',
    '충청남도 천안시', '충청', '천안상록CC',
    4, 1, '85~100', ARRAY['진지하게', '빠른플레이'],
    '토요일 새벽 얼리버드 라운드합니다. 4시간 내 마무리 목표!', '첫만남', 'open'
  ) RETURNING id INTO join3_id;

  -- 조인 4: 2/22(일) 오전 - 경기 남부
  INSERT INTO joins (id, host_id, title, date, time, location, region, course_name, spots_total, spots_filled, handicap_range, styles, description, meeting_type, status)
  VALUES (
    uuid_generate_v4(), host4_id,
    '일요일 편하게 즐기는 라운드', '2026-02-22', '08:00',
    '경기도 이천시', '경기 남부', '사우스스프링스CC',
    4, 2, '100~120', ARRAY['즐겁게', '초보환영', '사진촬영'],
    '부담 없이 즐기는 일요 라운드! 2명 더 모집합니다.', '첫만남', 'open'
  ) RETURNING id INTO join4_id;

  -- 조인 5: 2/25(수) 오전 - 강원
  INSERT INTO joins (id, host_id, title, date, time, location, region, course_name, spots_total, spots_filled, handicap_range, styles, description, meeting_type, status)
  VALUES (
    uuid_generate_v4(), host5_id,
    '평일 강원도 힐링 라운드', '2026-02-25', '09:00',
    '강원도 원주시', '강원', '오크밸리CC',
    4, 1, '90~110', ARRAY['즐겁게', '경치감상'],
    '평일 한적한 강원도에서 힐링 라운드 하실 분 구합니다.', '첫만남', 'open'
  ) RETURNING id INTO join5_id;

  -- 각 조인에 호스트를 참가자로 등록
  INSERT INTO join_participants (join_id, user_id, role) VALUES (join1_id, host1_id, 'host');
  INSERT INTO join_participants (join_id, user_id, role) VALUES (join2_id, host2_id, 'host');
  INSERT INTO join_participants (join_id, user_id, role) VALUES (join3_id, host3_id, 'host');
  INSERT INTO join_participants (join_id, user_id, role) VALUES (join4_id, host4_id, 'host');
  INSERT INTO join_participants (join_id, user_id, role) VALUES (join5_id, host5_id, 'host');

  RAISE NOTICE '5개 조인 생성 완료: %, %, %, %, %', join1_id, join2_id, join3_id, join4_id, join5_id;
END $$;
