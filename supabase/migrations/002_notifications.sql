-- 알림 시스템 테이블
-- Supabase SQL Editor에서 실행

-- 1. 푸시 토큰 테이블
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT 'unknown', -- ios, android, web
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- friend_request, join_application, new_message, etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  kakao_enabled BOOLEAN DEFAULT FALSE,
  friend_request BOOLEAN DEFAULT TRUE,
  join_application BOOLEAN DEFAULT TRUE,
  new_message BOOLEAN DEFAULT TRUE,
  join_reminder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. RLS 정책
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- push_tokens 정책
CREATE POLICY "Users can view own push token" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push token" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push token" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- notifications 정책
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications (Edge Functions에서 사용)
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- notification_settings 정책
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- 6. profiles 테이블에 카카오 알림 설정 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'kakao_notification_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN kakao_notification_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 7. 알림 생성 트리거 함수 (친구 요청 시 자동 알림)
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  -- 인앱 알림 생성
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.to_user_id,
    'friend_request',
    '새로운 친구 요청',
    (SELECT name FROM profiles WHERE id = NEW.from_user_id) || '님이 친구 요청을 보냈습니다.',
    jsonb_build_object(
      'fromUserId', NEW.from_user_id,
      'requestId', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 친구 요청 트리거 (friend_requests 테이블이 있으면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_requests') THEN
    DROP TRIGGER IF EXISTS on_friend_request_created ON friend_requests;
    CREATE TRIGGER on_friend_request_created
      AFTER INSERT ON friend_requests
      FOR EACH ROW
      EXECUTE FUNCTION notify_friend_request();
  END IF;
END $$;

-- 9. 조인 신청 알림 트리거 함수
CREATE OR REPLACE FUNCTION notify_join_application()
RETURNS TRIGGER AS $$
DECLARE
  join_host_id UUID;
  join_title TEXT;
  applicant_name TEXT;
BEGIN
  -- 조인 정보 조회
  SELECT host_id, title INTO join_host_id, join_title
  FROM joins WHERE id = NEW.join_id;

  -- 신청자 이름 조회
  SELECT name INTO applicant_name
  FROM profiles WHERE id = NEW.user_id;

  -- 인앱 알림 생성 (호스트에게)
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    join_host_id,
    'join_application',
    '새로운 조인 신청',
    applicant_name || '님이 "' || join_title || '" 조인에 신청했습니다.',
    jsonb_build_object(
      'joinId', NEW.join_id,
      'applicantId', NEW.user_id,
      'applicationId', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 조인 신청 트리거 (join_applications 테이블이 있으면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_applications') THEN
    DROP TRIGGER IF EXISTS on_join_application_created ON join_applications;
    CREATE TRIGGER on_join_application_created
      AFTER INSERT ON join_applications
      FOR EACH ROW
      EXECUTE FUNCTION notify_join_application();
  END IF;
END $$;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '알림 시스템 테이블 생성 완료!';
END $$;
