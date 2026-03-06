-- 인증된 유저가 다른 유저에게 알림을 보낼 수 있도록 INSERT 정책 추가
-- 기존 "Service role can insert notifications" 정책이 service_role에만 적용될 수 있어서
-- authenticated 역할도 INSERT 가능하도록 보장

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 알림 삭제도 본인 것만 가능하도록
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
