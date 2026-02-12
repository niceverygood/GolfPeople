-- 014: 조인 라이프사이클 상태 추가
-- open → confirmed → in_progress → completed

-- 1) 타임스탬프 컬럼 추가
ALTER TABLE joins ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE joins ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 2) complete_past_joins() 업데이트: confirmed/in_progress도 자동 완료 처리
CREATE OR REPLACE FUNCTION complete_past_joins()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt1 INTEGER;
  cnt2 INTEGER;
BEGIN
  -- open/confirmed 조인: 날짜 지나면 → completed
  UPDATE joins
  SET status = 'completed'
  WHERE status IN ('open', 'confirmed')
    AND date < CURRENT_DATE;

  GET DIAGNOSTICS cnt1 = ROW_COUNT;

  -- in_progress 조인: 시작 후 6시간 경과 → completed
  UPDATE joins
  SET status = 'completed'
  WHERE status = 'in_progress'
    AND started_at IS NOT NULL
    AND started_at < NOW() - INTERVAL '6 hours';

  GET DIAGNOSTICS cnt2 = ROW_COUNT;

  RETURN cnt1 + cnt2;
END;
$$;

-- 3) confirm_join(): 호스트가 조인 확정 (open → confirmed, 2명 이상 필요)
CREATE OR REPLACE FUNCTION confirm_join(p_join_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_join RECORD;
BEGIN
  SELECT * INTO v_join FROM joins WHERE id = p_join_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'join_not_found');
  END IF;

  IF v_join.host_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'not_host');
  END IF;

  IF v_join.status != 'open' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_status');
  END IF;

  IF v_join.spots_filled < 2 THEN
    RETURN json_build_object('success', false, 'error', 'not_enough_participants');
  END IF;

  UPDATE joins
  SET status = 'confirmed', confirmed_at = NOW()
  WHERE id = p_join_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 4) start_rounding(): 참가자가 라운딩 시작 (confirmed → in_progress, 당일만)
CREATE OR REPLACE FUNCTION start_rounding(p_join_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_join RECORD;
  v_is_participant BOOLEAN;
BEGIN
  SELECT * INTO v_join FROM joins WHERE id = p_join_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'join_not_found');
  END IF;

  IF v_join.status != 'confirmed' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_status');
  END IF;

  -- 당일만 시작 가능
  IF v_join.date != CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'not_today');
  END IF;

  -- 참가자인지 확인 (호스트도 참가자에 포함)
  SELECT EXISTS(
    SELECT 1 FROM join_participants
    WHERE join_id = p_join_id AND user_id = p_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN json_build_object('success', false, 'error', 'not_participant');
  END IF;

  UPDATE joins
  SET status = 'in_progress', started_at = NOW()
  WHERE id = p_join_id;

  RETURN json_build_object('success', true);
END;
$$;
