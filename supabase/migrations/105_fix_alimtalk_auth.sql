-- send_kakao_alimtalk 함수에서 auth.uid() 검증을 service_role도 허용하도록 수정
-- 기존: auth.uid() IS NULL → unauthorized 반환
-- 수정: auth.uid() IS NULL일 때 현재 역할이 service_role이면 허용

CREATE OR REPLACE FUNCTION send_kakao_alimtalk(
  p_recipient_id UUID,
  p_template_code TEXT,
  p_variables JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_phone TEXT;
  v_name TEXT;
  v_kakao_enabled BOOLEAN;
  v_tpl_code TEXT;
  v_subject TEXT;
  v_message TEXT;
  v_body TEXT;
  v_response RECORD;
  v_result JSONB;
  v_api_key TEXT;
  v_user_id TEXT;
  v_sender_key TEXT;
  v_sender TEXT;
BEGIN
  -- ★ 보안: app_config 테이블에서 API 키 읽기
  SELECT value INTO v_api_key FROM app_config WHERE key = 'aligo_api_key';
  SELECT value INTO v_user_id FROM app_config WHERE key = 'aligo_user_id';
  SELECT value INTO v_sender_key FROM app_config WHERE key = 'aligo_sender_key';
  SELECT value INTO v_sender FROM app_config WHERE key = 'aligo_sender';

  IF v_api_key IS NULL OR v_api_key = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'aligo_config_missing');
  END IF;

  -- ★ 보안: 호출자 검증 (인증된 사용자 또는 service_role)
  IF auth.uid() IS NULL AND current_setting('role', true) != 'service_role' THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- 수신자 정보 조회
  SELECT
    regexp_replace(phone, '[^0-9]', '', 'g'),
    name,
    kakao_notification_enabled
  INTO v_phone, v_name, v_kakao_enabled
  FROM profiles
  WHERE id = p_recipient_id;

  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_phone');
  END IF;

  IF v_kakao_enabled IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'kakao_disabled');
  END IF;

  -- 템플릿 처리
  CASE p_template_code
    WHEN 'FRIEND_REQUEST' THEN
      v_tpl_code := 'UF_2416';
      v_subject := '새로운 친구 요청';
      v_message := concat(
        E'[골프피플] 새로운 친구 요청\n\n',
        COALESCE(p_variables->>'회원명', v_name, ''), E'님, ',
        COALESCE(p_variables->>'요청자명', ''), E'님이 회원님의\n',
        E'프로필을 확인하고 친구 요청을 보냈습니다.\n\n',
        '- 요청자: ', COALESCE(p_variables->>'요청자명', ''), E'\n',
        '- 요청일시: ', COALESCE(p_variables->>'요청일시', ''), E'\n\n',
        E'앱에서 요청을 확인하고 수락 또는\n',
        E'거절해주세요.\n\n',
        E'본 메시지는 고객님께서 골프피플 앱 [마이페이지 > 설정 > 알림 설정]에서 ',
        E'''친구 요청 알림'' 수신을 직접 설정(ON)하신 경우에 한하여, ',
        E'새로운 친구 요청이 접수될 때마다 발송됩니다\n',
        E'수신을 원하지 않으시면 앱 내 알림 설정에서 해제하실 수 있습니다.'
      );

    WHEN 'FRIEND_ACCEPTED' THEN
      v_tpl_code := 'UF_2418';
      v_subject := '친구 요청 수락';
      v_message := concat(
        E'[골프피플] 친구 요청 수락\n\n',
        COALESCE(p_variables->>'회원명', v_name, ''), E'님, ',
        E'회원님이 보낸 친구 요청이 수락되었습니다.\n\n',
        '- 수락자: ', COALESCE(p_variables->>'수락자명', ''), E'\n',
        '- 수락일시: ', COALESCE(p_variables->>'수락일시', ''), E'\n\n',
        E'앱에서 대화를 시작해보세요!'
      );

    WHEN 'JOIN_APPLICATION' THEN
      v_tpl_code := 'UF_2419';
      v_subject := '새로운 조인 신청';
      v_message := concat(
        E'[골프피플] 새로운 조인 신청\n\n',
        COALESCE(p_variables->>'회원명', v_name, ''), E'님, ',
        E'회원님이 만든 조인에 새로운 신청이 있습니다.\n\n',
        '- 조인명: ', COALESCE(p_variables->>'조인명', ''), E'\n',
        '- 신청자: ', COALESCE(p_variables->>'신청자명', ''), E'\n',
        '- 신청일시: ', COALESCE(p_variables->>'신청일시', ''), E'\n\n',
        E'앱에서 신청을 확인하고 수락 또는 거절해주세요.'
      );

    WHEN 'JOIN_ACCEPTED' THEN
      v_tpl_code := 'UF_2420';
      v_subject := '조인 참가 확정';
      v_message := concat(
        E'[골프피플] 조인 참가 확정\n\n',
        COALESCE(p_variables->>'회원명', v_name, ''), E'님, ',
        E'조인 참가가 확정되었습니다.\n\n',
        '- 조인명: ', COALESCE(p_variables->>'조인명', ''), E'\n',
        '- 일시: ', COALESCE(p_variables->>'라운딩일시', ''), E'\n',
        '- 장소: ', COALESCE(p_variables->>'장소', ''), E'\n',
        '- 확정일시: ', COALESCE(p_variables->>'확정일시', ''), E'\n\n',
        E'앱에서 조인 채팅방을 확인해주세요.'
      );

    WHEN 'JOIN_REJECTED' THEN
      v_tpl_code := 'UF_2421';
      v_subject := '조인 신청 결과';
      v_message := concat(
        E'[골프피플] 조인 신청 결과\n\n',
        COALESCE(p_variables->>'회원명', v_name, ''), E'님, ',
        E'조인 신청 결과를 안내드립니다.\n\n',
        '- 조인명: ', COALESCE(p_variables->>'조인명', ''), E'\n',
        '- 결과: 참가 불가', E'\n',
        '- 처리일시: ', COALESCE(p_variables->>'처리일시', ''), E'\n\n',
        E'다른 조인을 찾아보세요.'
      );

    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'unsupported_template');
  END CASE;

  -- HTTP 요청 body 구성 (★ app_config 테이블에서 읽은 키 사용)
  v_body := concat(
    'apikey=', v_api_key,
    '&userid=', v_user_id,
    '&senderkey=', v_sender_key,
    '&tpl_code=', urlencode(v_tpl_code),
    '&sender=', v_sender,
    '&receiver_1=', v_phone,
    '&subject_1=', urlencode(v_subject),
    '&message_1=', urlencode(v_message),
    '&button_1=', urlencode('{"button":[{"name":"앱에서 확인","linkType":"WL","linkTypeName":"웹링크","linkMo":"https://golf-people.vercel.app","linkPc":"https://golf-people.vercel.app"}]}')
  );

  -- 알리고 API 호출
  SELECT status, content::text
  INTO v_response
  FROM http((
    'POST',
    'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
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
      'error', 'parse_error',
      'raw', v_response.content
    );
  END;

  -- 성공 여부 확인
  IF (v_result->>'code')::int = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message_id', v_result->'info'->>'mid',
      'result', v_result
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', v_result->>'message',
      'code', v_result->>'code'
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 모든 역할에 실행 권한 부여
GRANT EXECUTE ON FUNCTION send_kakao_alimtalk(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION send_kakao_alimtalk(UUID, TEXT, JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';
