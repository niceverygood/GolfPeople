-- 013: join_participants RLS 단순화
-- 기존 SECURITY DEFINER 함수 방식에서도 재귀가 해결되지 않아
-- 인증된 사용자 전체 SELECT 허용으로 변경
-- (조인 참가 정보는 조인 상세에서 공개되므로 보안 이슈 없음)

DROP POLICY IF EXISTS "조인 참가자 조회" ON join_participants;

CREATE POLICY "조인 참가자 조회" ON join_participants
  FOR SELECT USING (auth.role() = 'authenticated');
