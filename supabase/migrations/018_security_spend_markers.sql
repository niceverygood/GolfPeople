-- =============================================
-- 보안 수정: spend_markers auth.uid() 검증 + 서버사이드 가격 조회
-- =============================================

-- 1. marker_prices 테이블은 이미 존재 (컬럼: action_type, marker_cost, description)
-- 가격 데이터 확인/업데이트
INSERT INTO marker_prices (action_type, marker_cost, description) VALUES
  ('friend_request', 3, '친구 요청'),
  ('join_application', 5, '조인 신청'),
  ('profile_view', 3, '프로필 열람')
ON CONFLICT (action_type) DO UPDATE SET marker_cost = EXCLUDED.marker_cost;

-- 2. spend_markers 함수 재생성: auth.uid() 검증 + 서버 가격 조회
CREATE OR REPLACE FUNCTION spend_markers(
  p_user_id UUID,
  p_action_type TEXT,
  p_cost INTEGER DEFAULT 0  -- 하위 호환성 유지, 실제로는 무시됨
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  actual_cost INTEGER;
  action_description TEXT;
BEGIN
  -- ★ 보안: 호출자가 자기 자신의 마커만 사용 가능
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '권한이 없습니다'
    );
  END IF;

  -- ★ 보안: 서버사이드 가격 조회 (클라이언트 p_cost 무시)
  SELECT marker_cost, description INTO actual_cost, action_description
  FROM marker_prices
  WHERE action_type = p_action_type;

  IF actual_cost IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_action_type',
      'message', '유효하지 않은 액션 타입입니다'
    );
  END IF;

  -- 현재 잔액 조회 (행 잠금으로 race condition 방지)
  SELECT balance INTO current_balance
  FROM marker_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 지갑이 없으면 생성
  IF current_balance IS NULL THEN
    INSERT INTO marker_wallets (user_id, balance)
    VALUES (p_user_id, 10)
    ON CONFLICT (user_id) DO NOTHING;
    current_balance := 10;
  END IF;

  -- 잔액 검증
  IF current_balance < actual_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message', '마커가 부족합니다',
      'current_balance', current_balance,
      'required', actual_cost
    );
  END IF;

  -- 잔액 차감
  new_balance := current_balance - actual_cost;

  UPDATE marker_wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 거래 내역 저장
  INSERT INTO marker_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -actual_cost, p_action_type, action_description);

  -- 성공 반환
  RETURN json_build_object(
    'success', true,
    'new_balance', new_balance,
    'cost', actual_cost,
    'action_type', p_action_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'server_error',
      'message', '서버 오류가 발생했습니다'
    );
END;
$$;

-- 3. marker_wallets UPDATE/INSERT 정책 제거 → SECURITY DEFINER 함수만 수정 가능
DROP POLICY IF EXISTS "Users can update own wallet" ON marker_wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON marker_wallets;

-- 4. add_markers revoke (존재하는 경우에만)
DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION add_markers(UUID, INTEGER, TEXT, TEXT) FROM authenticated';
EXCEPTION WHEN undefined_function THEN
  -- 함수가 존재하지 않으면 무시
  NULL;
END;
$$;
