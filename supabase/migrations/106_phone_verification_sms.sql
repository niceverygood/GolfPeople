-- =============================================
-- 전화번호 SMS 인증 (알리고 API 직접 발송)
-- Firebase Phone Auth 대체
-- =============================================

-- 1. 인증 코드 저장 테이블
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (직접 접근 차단, SECURITY DEFINER 함수에서만)
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- 만료된 인증 코드 자동 정리 인덱스
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications (expires_at) WHERE verified = FALSE;

-- 2. 인증 코드 발송 함수 (알리고 SMS API)
CREATE OR REPLACE FUNCTION send_phone_verification(
  p_phone TEXT
) RETURNS JSONB AS $$
DECLARE
  v_code TEXT;
  v_phone TEXT;
  v_body TEXT;
  v_response RECORD;
  v_result JSONB;
  v_api_key TEXT;
  v_user_id TEXT;
  v_sender TEXT;
  v_recent_count INT;
  v_message TEXT;
BEGIN
  -- 전화번호 정규화 (숫자만)
  v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

  IF length(v_phone) != 11 OR v_phone NOT LIKE '010%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_phone');
  END IF;

  -- Rate limiting: 같은 번호로 5분 내 3회 이상 요청 차단
  SELECT COUNT(*) INTO v_recent_count
  FROM phone_verifications
  WHERE phone = v_phone
    AND created_at > NOW() - INTERVAL '5 minutes';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_requests');
  END IF;

  -- 6자리 랜덤 코드 생성
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');

  -- 기존 미인증 코드 무효화
  DELETE FROM phone_verifications
  WHERE phone = v_phone AND verified = FALSE;

  -- 새 인증 코드 저장 (3분 만료)
  INSERT INTO phone_verifications (phone, code, expires_at)
  VALUES (v_phone, v_code, NOW() + INTERVAL '3 minutes');

  -- 알리고 API 키 조회
  SELECT value INTO v_api_key FROM app_config WHERE key = 'aligo_api_key';
  SELECT value INTO v_user_id FROM app_config WHERE key = 'aligo_user_id';
  SELECT value INTO v_sender FROM app_config WHERE key = 'aligo_sender';

  IF v_api_key IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'sms_config_missing');
  END IF;

  -- SMS 메시지
  v_message := '[골프피플] 인증번호 ' || v_code || ' 를 입력해주세요.';

  -- 알리고 SMS API 호출 (단문 SMS)
  v_body := concat(
    'key=', v_api_key,
    '&user_id=', v_user_id,
    '&sender=', v_sender,
    '&receiver=', v_phone,
    '&msg=', urlencode(v_message)
  );

  SELECT status, content::text
  INTO v_response
  FROM http((
    'POST',
    'https://apis.aligo.in/send/',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_body
  )::http_request);

  -- 결과 파싱
  BEGIN
    v_result := (v_response.content)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'sms_parse_error'
    );
  END;

  -- 알리고 응답 확인 (result_code=1 성공)
  IF (v_result->>'result_code')::int = 1 THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'sms_send_failed',
      'detail', v_result->>'message'
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 인증 코드 확인 함수
CREATE OR REPLACE FUNCTION verify_phone_code(
  p_phone TEXT,
  p_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_phone TEXT;
  v_record RECORD;
BEGIN
  -- 전화번호 정규화
  v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

  -- 가장 최근 인증 코드 조회
  SELECT * INTO v_record
  FROM phone_verifications
  WHERE phone = v_phone
    AND verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  -- 인증 요청 없음
  IF v_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_verification');
  END IF;

  -- 만료 확인
  IF v_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'code_expired');
  END IF;

  -- 시도 횟수 초과 (5회)
  IF v_record.attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_attempts');
  END IF;

  -- 시도 횟수 증가
  UPDATE phone_verifications
  SET attempts = attempts + 1
  WHERE id = v_record.id;

  -- 코드 비교
  IF v_record.code != p_code THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- 인증 성공
  UPDATE phone_verifications
  SET verified = TRUE
  WHERE id = v_record.id;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC 접근 권한
GRANT EXECUTE ON FUNCTION send_phone_verification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_phone_verification(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_phone_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_phone_code(TEXT, TEXT) TO anon;

-- 5. 만료된 인증 코드 정리 (24시간 이상 된 것)
-- Supabase pg_cron이 있으면 자동 정리, 없으면 수동
-- SELECT cron.schedule('clean_phone_verifications', '0 * * * *', $$
--   DELETE FROM phone_verifications WHERE created_at < NOW() - INTERVAL '24 hours';
-- $$);

NOTIFY pgrst, 'reload schema';
