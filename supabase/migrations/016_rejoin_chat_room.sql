-- 016: 채팅방 재입장 지원 (나간 채팅방에 다시 참가)

-- 채팅방 재입장 RPC 함수
-- join_participants에 속한 사용자만 해당 조인 채팅방에 재입장 가능
CREATE OR REPLACE FUNCTION rejoin_chat_room(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_join_id UUID;
  v_is_participant BOOLEAN;
BEGIN
  -- 채팅방의 조인 ID 확인
  SELECT join_id INTO v_join_id
  FROM chat_rooms
  WHERE id = p_room_id;

  IF v_join_id IS NULL THEN
    -- 1:1 채팅방이면 거부 (direct 채팅은 startDirectChat으로만 생성)
    RETURN json_build_object('success', false, 'error', 'not_join_room');
  END IF;

  -- 해당 조인의 참가자인지 확인 (join_participants 테이블)
  SELECT EXISTS(
    SELECT 1 FROM join_participants
    WHERE join_id = v_join_id AND user_id = v_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN json_build_object('success', false, 'error', 'not_participant');
  END IF;

  -- chat_participants에 재추가 (이미 있으면 무시)
  INSERT INTO chat_participants (room_id, user_id)
  VALUES (p_room_id, v_user_id)
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
