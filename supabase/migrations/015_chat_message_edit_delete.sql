-- 015: 채팅 메시지 수정/삭제 + Realtime DELETE 지원

-- 1) messages 테이블 REPLICA IDENTITY FULL (DELETE 이벤트에서 old row 전달)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2) 자기 메시지 수정 허용
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update own messages'
  ) THEN
    CREATE POLICY "Users can update own messages"
      ON messages FOR UPDATE
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());
  END IF;
END $$;

-- 3) 자기 메시지 삭제 허용
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can delete own messages'
  ) THEN
    CREATE POLICY "Users can delete own messages"
      ON messages FOR DELETE
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- 4) 채팅방 나가기 허용 (자기 참가 레코드 삭제)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'Users can leave chat rooms'
  ) THEN
    CREATE POLICY "Users can leave chat rooms"
      ON chat_participants FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;
