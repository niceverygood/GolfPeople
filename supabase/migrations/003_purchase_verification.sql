-- 결제 서버 검증 마이그레이션
-- purchase_records 테이블 + credit_markers_verified RPC

-- 1. purchase_records 테이블 (결제 감사 추적)
CREATE TABLE IF NOT EXISTS purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  platform TEXT NOT NULL,          -- 'portone', 'revenuecat_ios', 'revenuecat_android'
  product_id TEXT,
  marker_amount INTEGER NOT NULL,
  paid_amount INTEGER DEFAULT 0,
  receipt_data JSONB DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending','verified','failed','refunded'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_purchase_records_user ON purchase_records(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_txn ON purchase_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_status ON purchase_records(verification_status);

-- 2. RLS 정책 (service_role만 쓰기 가능)
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 구매 기록 조회" ON purchase_records
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE 정책 없음 → authenticated 유저는 쓰기 불가
-- Edge Function이 SUPABASE_SERVICE_ROLE_KEY로 접근하므로 RLS 우회

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_records_updated_at
  BEFORE UPDATE ON purchase_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 서버 검증된 마커 충전 RPC
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

-- 5. add_markers 클라이언트 직접 호출 차단
REVOKE EXECUTE ON FUNCTION add_markers(UUID, INTEGER, TEXT, TEXT) FROM authenticated;
