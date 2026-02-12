-- 012: join_participants RLS 무한 재귀 수정
-- 문제: 정책에서 자기 테이블을 서브쿼리로 참조 → infinite recursion
-- 해결: SECURITY DEFINER 함수로 우회

-- 1. 같은 조인의 참가자인지 확인하는 헬퍼 함수
CREATE OR REPLACE FUNCTION is_join_participant(p_join_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM join_participants
    WHERE join_id = p_join_id AND user_id = p_user_id
  );
$$;

-- 2. 조인의 호스트인지 확인하는 헬퍼 함수
CREATE OR REPLACE FUNCTION is_join_host(p_join_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM joins
    WHERE id = p_join_id AND host_id = p_user_id
  );
$$;

-- 3. 기존 정책 삭제
DROP POLICY IF EXISTS "조인 참가자 조회" ON join_participants;

-- 4. 새 정책 생성 (SECURITY DEFINER 함수 사용으로 재귀 방지)
CREATE POLICY "조인 참가자 조회" ON join_participants
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_join_host(join_id, auth.uid())
    OR is_join_participant(join_id, auth.uid())
  );
