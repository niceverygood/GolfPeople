-- 마커 사용 RPC 함수 (서버 측 잔액 검증)
-- Supabase SQL Editor에서 실행하세요

-- 1. marker_wallets 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS marker_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. marker_transactions 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS marker_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS 정책 (행 수준 보안)
ALTER TABLE marker_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marker_transactions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 지갑만 조회/수정 가능
CREATE POLICY "Users can view own wallet" ON marker_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON marker_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON marker_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 거래내역만 조회/추가 가능
CREATE POLICY "Users can view own transactions" ON marker_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON marker_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 마커 사용 RPC 함수
CREATE OR REPLACE FUNCTION spend_markers(
  p_user_id UUID,
  p_action_type TEXT,
  p_cost INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  action_description TEXT;
BEGIN
  -- 액션 타입 검증
  IF p_action_type NOT IN ('friend_request', 'join_application', 'profile_view') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_action_type',
      'message', '유효하지 않은 액션 타입입니다'
    );
  END IF;

  -- 비용 검증
  IF p_cost <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_cost',
      'message', '유효하지 않은 비용입니다'
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
  IF current_balance < p_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message', '마커가 부족합니다',
      'current_balance', current_balance,
      'required', p_cost
    );
  END IF;

  -- 잔액 차감
  new_balance := current_balance - p_cost;

  UPDATE marker_wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 액션 설명
  action_description := CASE p_action_type
    WHEN 'friend_request' THEN '친구 요청'
    WHEN 'join_application' THEN '조인 신청'
    WHEN 'profile_view' THEN '프로필 열람'
    ELSE p_action_type
  END;

  -- 거래 내역 저장
  INSERT INTO marker_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_cost, p_action_type, action_description);

  -- 성공 반환
  RETURN json_build_object(
    'success', true,
    'new_balance', new_balance,
    'cost', p_cost,
    'action_type', p_action_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'server_error',
      'message', SQLERRM
    );
END;
$$;

-- 5. 마커 충전 RPC 함수
CREATE OR REPLACE FUNCTION add_markers(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT '마커 충전'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- 금액 검증
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', '유효하지 않은 금액입니다'
    );
  END IF;

  -- 현재 잔액 조회 (행 잠금)
  SELECT balance INTO current_balance
  FROM marker_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 지갑이 없으면 생성
  IF current_balance IS NULL THEN
    INSERT INTO marker_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    current_balance := 0;
  END IF;

  -- 잔액 추가
  new_balance := current_balance + p_amount;

  UPDATE marker_wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 거래 내역 저장
  INSERT INTO marker_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);

  -- 성공 반환
  RETURN json_build_object(
    'success', true,
    'new_balance', new_balance,
    'added', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'server_error',
      'message', SQLERRM
    );
END;
$$;

-- 6. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION spend_markers(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_markers(UUID, INTEGER, TEXT, TEXT) TO authenticated;
