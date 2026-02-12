-- 011: completePastJoins 조건 수정
-- spots_filled > 1 → spots_filled >= 1 (호스트만 있어도 자동 완료)

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
    AND spots_filled >= 1;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
