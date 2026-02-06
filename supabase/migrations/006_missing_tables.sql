-- =============================================
-- 누락 테이블 생성 + 트리거 수정
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

-- 1. likes 테이블
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, liked_user_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 좋아요 조회" ON likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 생성" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 삭제" ON likes FOR DELETE USING (auth.uid() = user_id);

-- 2. saved_joins 테이블
CREATE TABLE IF NOT EXISTS saved_joins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_id UUID NOT NULL REFERENCES joins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, join_id)
);
ALTER TABLE saved_joins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 저장 조회" ON saved_joins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 저장 생성" ON saved_joins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 저장 삭제" ON saved_joins FOR DELETE USING (auth.uid() = user_id);

-- 3. blocks 테이블
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 차단 조회" ON blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 차단 생성" ON blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 차단 삭제" ON blocks FOR DELETE USING (auth.uid() = user_id);

-- 4. reports 테이블
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 신고 조회" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "본인 신고 생성" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 5. scores 테이블
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  course_region VARCHAR(50),
  total_score INTEGER NOT NULL,
  front_nine INTEGER,
  back_nine INTEGER,
  par INTEGER DEFAULT 72,
  putts INTEGER,
  fairway_hits INTEGER,
  greens_in_regulation INTEGER,
  weather VARCHAR(20),
  note TEXT,
  partners TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 스코어 조회" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 스코어 생성" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 스코어 수정" ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 스코어 삭제" ON scores FOR DELETE USING (auth.uid() = user_id);

-- 6. reviews 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_id UUID REFERENCES joins(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id, join_id)
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "공개 리뷰 조회" ON reviews FOR SELECT USING (is_public = TRUE OR auth.uid() = reviewer_id OR auth.uid() = reviewed_id);
CREATE POLICY "본인 리뷰 생성" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 7. 트리거 수정 (notifications.message → notifications.body)
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_existing_room UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friends (user_id, friend_id) VALUES (NEW.from_user_id, NEW.to_user_id) ON CONFLICT DO NOTHING;
    INSERT INTO friends (user_id, friend_id) VALUES (NEW.to_user_id, NEW.from_user_id) ON CONFLICT DO NOTHING;

    SELECT cp1.room_id INTO v_existing_room
    FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
    JOIN chat_rooms cr ON cr.id = cp1.room_id
    WHERE cp1.user_id = NEW.from_user_id AND cp2.user_id = NEW.to_user_id AND cr.type = 'direct'
    LIMIT 1;

    IF v_existing_room IS NULL THEN
      INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO v_room_id;
      INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, NEW.from_user_id), (v_room_id, NEW.to_user_id);
      INSERT INTO messages (room_id, sender_id, content, type)
      VALUES (v_room_id, NEW.to_user_id, '친구가 되었습니다! 대화를 시작해보세요.', 'system');
    END IF;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.from_user_id, 'match', '친구 매칭 완료!',
      '친구 요청이 수락되었어요 🎉',
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

CREATE OR REPLACE FUNCTION handle_join_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_join_title TEXT;
  v_host_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT j.title, j.host_id INTO v_join_title, v_host_id FROM joins j WHERE j.id = NEW.join_id;
    SELECT id INTO v_room_id FROM chat_rooms WHERE join_id = NEW.join_id;

    IF v_room_id IS NULL THEN
      INSERT INTO chat_rooms (type, join_id, name) VALUES ('group', NEW.join_id, v_join_title) RETURNING id INTO v_room_id;
      INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, v_host_id) ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, NEW.user_id) ON CONFLICT DO NOTHING;
    UPDATE joins SET spots_filled = spots_filled + 1 WHERE id = NEW.join_id;
    INSERT INTO join_participants (join_id, user_id, role) VALUES (NEW.join_id, NEW.user_id, 'participant') ON CONFLICT DO NOTHING;

    INSERT INTO messages (room_id, sender_id, content, type)
    SELECT v_room_id, NEW.user_id, (SELECT name FROM profiles WHERE id = NEW.user_id) || '님이 조인에 참여했습니다.', 'system';

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id, 'join_accepted', '조인 참가 확정!',
      '"' || v_join_title || '" 조인 신청이 수락되었어요 🎉',
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

-- 8. PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
