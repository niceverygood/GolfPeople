-- 017: 조인 확정 시 남은 대기중 신청 자동 거절

-- confirm_join() 업데이트: 확정 후 pending 신청 → rejected 처리
CREATE OR REPLACE FUNCTION confirm_join(p_join_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_join RECORD;
  v_rejected_count INTEGER;
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

  -- 조인 확정
  UPDATE joins
  SET status = 'confirmed', confirmed_at = NOW()
  WHERE id = p_join_id;

  -- 남은 대기중 신청 자동 거절
  UPDATE join_applications
  SET status = 'rejected'
  WHERE join_id = p_join_id AND status = 'pending';

  GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'rejected_count', v_rejected_count);
END;
$$;

NOTIFY pgrst, 'reload schema';
