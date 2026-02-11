-- =============================================
-- RLS 보안 경고 수정 (Supabase Dashboard 경고 4건)
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

-- 1. friends 테이블 RLS 활성화
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 친구 조회" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "본인 친구 삭제" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- INSERT는 트리거(handle_friend_request_accepted)가 SECURITY DEFINER로 처리

-- 2. join_applications 테이블 RLS 활성화
ALTER TABLE join_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 신청 조회" ON join_applications
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT host_id FROM joins WHERE id = join_id)
  );

CREATE POLICY "본인 신청 생성" ON join_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 신청 수정" ON join_applications
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT host_id FROM joins WHERE id = join_id)
  );

CREATE POLICY "본인 신청 삭제" ON join_applications
  FOR DELETE USING (auth.uid() = user_id);

-- 3. join_participants 테이블 RLS 활성화
ALTER TABLE join_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "조인 참가자 조회" ON join_participants
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT host_id FROM joins WHERE id = join_id)
    OR auth.uid() IN (SELECT user_id FROM join_participants jp2 WHERE jp2.join_id = join_participants.join_id)
  );

-- INSERT는 트리거(handle_join_application_accepted)가 SECURITY DEFINER로 처리

-- 4. credit_markers_verified 함수 search_path 고정
CREATE OR REPLACE FUNCTION credit_markers_verified(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_id TEXT,
  p_platform TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_paid_amount INTEGER DEFAULT 0,
  p_receipt_data JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
  v_existing RECORD;
BEGIN
  -- 금액 검증
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- 멱등성 체크: 이미 처리된 거래인지 확인
  SELECT * INTO v_existing
  FROM purchase_records
  WHERE transaction_id = p_transaction_id AND platform = p_platform;

  IF v_existing IS NOT NULL THEN
    IF v_existing.verification_status = 'verified' THEN
      SELECT balance INTO new_balance FROM marker_wallets WHERE user_id = p_user_id;
      RETURN json_build_object(
        'success', true,
        'already_processed', true,
        'new_balance', COALESCE(new_balance, 0),
        'purchase_record_id', v_existing.id
      );
    ELSE
      RETURN json_build_object('success', false, 'error', 'transaction_failed_previously');
    END IF;
  END IF;

  -- 구매 기록 삽입
  INSERT INTO purchase_records (
    user_id, transaction_id, platform, product_id,
    marker_amount, paid_amount, receipt_data, verification_status
  ) VALUES (
    p_user_id, p_transaction_id, p_platform, p_product_id,
    p_amount, p_paid_amount, p_receipt_data, 'verified'
  );

  -- 지갑 잔액 증가 (행 잠금)
  SELECT balance INTO new_balance
  FROM marker_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF new_balance IS NULL THEN
    INSERT INTO marker_wallets (user_id, balance)
    VALUES (p_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
    new_balance := 0;
  END IF;

  new_balance := new_balance + p_amount;

  UPDATE marker_wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO marker_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'purchase',
    CASE p_platform
      WHEN 'portone' THEN '마커 충전 (카드결제)'
      WHEN 'revenuecat_ios' THEN '마커 충전 (앱스토어)'
      WHEN 'revenuecat_android' THEN '마커 충전 (플레이스토어)'
      ELSE '마커 충전'
    END
  );

  RETURN json_build_object(
    'success', true,
    'new_balance', new_balance,
    'credited', p_amount
  );

EXCEPTION
  WHEN unique_violation THEN
    SELECT balance INTO new_balance FROM marker_wallets WHERE user_id = p_user_id;
    RETURN json_build_object('success', true, 'already_processed', true, 'new_balance', COALESCE(new_balance, 0));
  WHEN OTHERS THEN
    INSERT INTO purchase_records (
      user_id, transaction_id, platform, product_id,
      marker_amount, paid_amount, receipt_data, verification_status, error_message
    ) VALUES (
      p_user_id, p_transaction_id, p_platform, p_product_id,
      p_amount, p_paid_amount, p_receipt_data, 'failed', SQLERRM
    ) ON CONFLICT (transaction_id, platform) DO UPDATE
    SET verification_status = 'failed', error_message = SQLERRM, updated_at = NOW();

    RETURN json_build_object('success', false, 'error', 'server_error', 'message', SQLERRM);
END;
$$;

-- 5. 다른 SECURITY DEFINER 함수들도 search_path 고정
ALTER FUNCTION handle_friend_request_accepted() SET search_path = public;
ALTER FUNCTION handle_join_application_accepted() SET search_path = public;
ALTER FUNCTION update_updated_at_column() SET search_path = public;

-- 6. PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
