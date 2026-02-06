-- =============================================
-- 라운딩 D-1 리마인더 알림 자동 발송
-- Supabase SQL Editor에서 실행
-- =============================================

-- 내일 라운딩 예정인 참가자들에게 리마인더 알림 생성
CREATE OR REPLACE FUNCTION send_join_reminders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_join RECORD;
  v_participant RECORD;
  v_participant_name TEXT;
BEGIN
  -- 내일 날짜의 open 상태 조인 조회
  FOR v_join IN
    SELECT j.id, j.title, j.date, j.time, j.location, j.host_id
    FROM joins j
    WHERE j.date = CURRENT_DATE + INTERVAL '1 day'
      AND j.status = 'open'
  LOOP
    -- 해당 조인의 참가자들에게 알림 발송
    FOR v_participant IN
      SELECT jp.user_id
      FROM join_participants jp
      WHERE jp.join_id = v_join.id
      UNION
      SELECT v_join.host_id -- 호스트도 포함
    LOOP
      -- 참가자 이름 조회
      SELECT name INTO v_participant_name
      FROM profiles WHERE id = v_participant.user_id;

      -- 중복 알림 방지 (같은 날 같은 조인에 대해 이미 발송했는지 확인)
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_participant.user_id
          AND type = 'join_reminder'
          AND data->>'joinId' = v_join.id::TEXT
          AND created_at > CURRENT_DATE
      ) THEN
        -- 인앱 알림 생성
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_participant.user_id,
          'join_reminder',
          '라운딩 일정 안내',
          '내일 "' || v_join.title || '" 라운딩이 예정되어 있습니다.',
          jsonb_build_object(
            'joinId', v_join.id,
            'joinTitle', v_join.title,
            'roundingDate', v_join.date || ' ' || COALESCE(v_join.time::TEXT, ''),
            'location', COALESCE(v_join.location, ''),
            'recipientName', COALESCE(v_participant_name, '')
          )
        );

        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '라운딩 리마인더 알림 % 건 발송 완료', v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- pg_cron 스케줄 설정 (Supabase Dashboard에서 실행)
-- 매일 오후 8시(KST) = UTC 11:00에 실행
-- =============================================
-- 
-- ⚠️ 아래 명령은 Supabase Dashboard > SQL Editor에서 직접 실행하세요:
--
-- SELECT cron.schedule(
--   'send-join-reminders',
--   '0 11 * * *',
--   $$ SELECT send_join_reminders(); $$
-- );
--
-- pg_cron이 활성화되어 있지 않다면:
-- Supabase Dashboard > Database > Extensions > pg_cron 활성화
-- =============================================

-- 수동 테스트용: SELECT send_join_reminders();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '라운딩 리마인더 함수 생성 완료! pg_cron 스케줄은 Supabase Dashboard에서 설정하세요.';
END $$;
