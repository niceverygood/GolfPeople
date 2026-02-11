-- 009: 조인 완료 자동화 + 스코어↔조인 연결 + likes RLS 수정

-- 1. scores 테이블에 join_id 추가 (조인↔스코어 연결)
ALTER TABLE scores ADD COLUMN IF NOT EXISTS join_id UUID REFERENCES joins(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scores_join ON scores(join_id);

-- 2. 지난 조인 자동 완료 RPC (open → completed)
--    date < today AND spots_filled > 1인 open 조인 → completed
CREATE OR REPLACE FUNCTION complete_past_joins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE joins
  SET status = 'completed'
  WHERE status = 'open'
    AND date < CURRENT_DATE
    AND spots_filled > 1;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 3. likes RLS 수정: 나를 좋아한 사람 수 조회 허용
--    기존 정책이 있다면 먼저 삭제
DO $$
BEGIN
  -- 기존 SELECT 정책 삭제 (있을 경우)
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can view own likes'
  ) THEN
    DROP POLICY "Users can view own likes" ON likes;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'likes_select_own'
  ) THEN
    DROP POLICY "likes_select_own" ON likes;
  END IF;
END $$;

-- 새 정책: 내가 좋아한 사람 + 나를 좋아한 사람 모두 조회 가능
CREATE POLICY "likes_select_own_or_liked"
  ON likes FOR SELECT
  USING (user_id = auth.uid() OR liked_user_id = auth.uid());
