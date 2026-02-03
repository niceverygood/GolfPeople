-- =============================================
-- 친구 요청 수락 시 1:1 채팅방 자동 생성
-- 조인 신청 수락 시 조인 채팅방에 참가자 자동 추가
-- =============================================

-- 친구 요청 수락 시 친구 관계 생성 + 1:1 채팅방 생성
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_existing_room UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 양방향 친구 관계 생성
    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.from_user_id, NEW.to_user_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.to_user_id, NEW.from_user_id)
    ON CONFLICT DO NOTHING;

    -- 기존 1:1 채팅방 확인
    SELECT cp1.room_id INTO v_existing_room
    FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
    JOIN chat_rooms cr ON cr.id = cp1.room_id
    WHERE cp1.user_id = NEW.from_user_id
      AND cp2.user_id = NEW.to_user_id
      AND cr.type = 'direct'
    LIMIT 1;

    -- 기존 채팅방이 없으면 새로 생성
    IF v_existing_room IS NULL THEN
      -- 1:1 채팅방 생성
      INSERT INTO chat_rooms (type)
      VALUES ('direct')
      RETURNING id INTO v_room_id;

      -- 참가자 추가
      INSERT INTO chat_participants (room_id, user_id)
      VALUES (v_room_id, NEW.from_user_id), (v_room_id, NEW.to_user_id);

      -- 시스템 메시지 추가
      INSERT INTO messages (room_id, sender_id, content, type)
      VALUES (v_room_id, NEW.to_user_id, '친구가 되었습니다! 대화를 시작해보세요.', 'system');
    END IF;

    -- 알림 생성 (친구 요청 수락됨)
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.from_user_id,
      'match',
      '친구 매칭 완료!',
      '친구 요청이 수락되었어요',
      jsonb_build_object('friend_id', NEW.to_user_id, 'room_id', COALESCE(v_existing_room, v_room_id))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION handle_friend_request_accepted();

-- 조인 신청 수락 시 조인 채팅방에 참가자 추가
CREATE OR REPLACE FUNCTION handle_join_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_join_title TEXT;
  v_host_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 조인 정보 가져오기
    SELECT j.title, j.host_id INTO v_join_title, v_host_id
    FROM joins j
    WHERE j.id = NEW.join_id;

    -- 기존 조인 채팅방 확인
    SELECT id INTO v_room_id
    FROM chat_rooms
    WHERE join_id = NEW.join_id;

    -- 채팅방이 없으면 생성
    IF v_room_id IS NULL THEN
      INSERT INTO chat_rooms (type, join_id, name)
      VALUES ('group', NEW.join_id, v_join_title)
      RETURNING id INTO v_room_id;

      -- 호스트를 첫 번째 참가자로 추가
      INSERT INTO chat_participants (room_id, user_id)
      VALUES (v_room_id, v_host_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- 신청자를 채팅방 참가자로 추가
    INSERT INTO chat_participants (room_id, user_id)
    VALUES (v_room_id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    -- 조인 참가자 수 업데이트
    UPDATE joins
    SET spots_filled = spots_filled + 1
    WHERE id = NEW.join_id;

    -- join_participants 테이블에도 추가
    INSERT INTO join_participants (join_id, user_id, role)
    VALUES (NEW.join_id, NEW.user_id, 'participant')
    ON CONFLICT DO NOTHING;

    -- 시스템 메시지 추가
    INSERT INTO messages (room_id, sender_id, content, type)
    SELECT v_room_id, NEW.user_id,
           (SELECT name FROM profiles WHERE id = NEW.user_id) || '님이 조인에 참여했습니다.',
           'system';

    -- 알림 생성 (신청자에게)
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'join_accepted',
      '조인 참가 확정!',
      '"' || v_join_title || '" 조인 신청이 수락되었어요',
      jsonb_build_object('join_id', NEW.join_id, 'room_id', v_room_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_join_application_accepted ON join_applications;
CREATE TRIGGER on_join_application_accepted
  AFTER UPDATE ON join_applications
  FOR EACH ROW EXECUTE FUNCTION handle_join_application_accepted();
