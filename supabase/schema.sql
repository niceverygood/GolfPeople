-- =============================================
-- 골프피플 Supabase 데이터베이스 스키마
-- =============================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. 프로필 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  gender VARCHAR(10), -- '남성', '여성'
  birth_year INTEGER,
  photos TEXT[] DEFAULT '{}', -- 프로필 사진 배열 (최대 6장)
  regions TEXT[] DEFAULT '{}', -- 활동 지역 (중복 선택)
  handicap VARCHAR(20), -- '100대', '90대 초반' 등
  styles TEXT[] DEFAULT '{}', -- 라운딩 스타일 (최대 8개)
  times TEXT[] DEFAULT '{}', -- 선호 시간 (중복 선택)
  intro TEXT, -- 자기소개
  is_verified BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_regions ON profiles USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_profiles_handicap ON profiles(handicap);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

-- =============================================
-- 2. 조인 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS joins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  region VARCHAR(50) NOT NULL,
  course_name VARCHAR(100),
  spots_total INTEGER DEFAULT 4,
  spots_filled INTEGER DEFAULT 1,
  handicap_range VARCHAR(50),
  styles TEXT[] DEFAULT '{}',
  description TEXT,
  meeting_type VARCHAR(50), -- 만남 유형
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조인 인덱스
CREATE INDEX IF NOT EXISTS idx_joins_host_id ON joins(host_id);
CREATE INDEX IF NOT EXISTS idx_joins_date ON joins(date);
CREATE INDEX IF NOT EXISTS idx_joins_region ON joins(region);
CREATE INDEX IF NOT EXISTS idx_joins_status ON joins(status);

-- =============================================
-- 3. 조인 참가자 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS join_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  join_id UUID NOT NULL REFERENCES joins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'participant', -- 'host', 'participant'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(join_id, user_id)
);

-- =============================================
-- 4. 조인 신청 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS join_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  join_id UUID NOT NULL REFERENCES joins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(join_id, user_id)
);

-- =============================================
-- 5. 친구 요청 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- 친구 요청 인덱스
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- =============================================
-- 6. 친구 테이블 (매칭 완료된 친구)
-- =============================================
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- =============================================
-- 7. 좋아요 (관심) 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, liked_user_id)
);

-- =============================================
-- 8. 저장된 조인 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS saved_joins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_id UUID NOT NULL REFERENCES joins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, join_id)
);

-- =============================================
-- 9. 알림 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'friend_request', 'join_request', 'match', 'system'
  title VARCHAR(100) NOT NULL,
  message TEXT,
  data JSONB, -- 추가 데이터 (관련 ID 등)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- 10. 차단 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- =============================================
-- 11. 신고 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. 채팅방 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group'
  name VARCHAR(100),
  join_id UUID REFERENCES joins(id) ON DELETE SET NULL, -- 조인 관련 채팅방
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. 채팅방 참가자 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- =============================================
-- 14. 메시지 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 프로필
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필은 누구나 조회 가능" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "본인 프로필만 수정 가능" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "본인 프로필 생성" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 조인
ALTER TABLE joins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "조인은 누구나 조회 가능" ON joins
  FOR SELECT USING (true);

CREATE POLICY "로그인한 사용자만 조인 생성" ON joins
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "본인 조인만 수정 가능" ON joins
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "본인 조인만 삭제 가능" ON joins
  FOR DELETE USING (auth.uid() = host_id);

-- 친구 요청
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관련 사용자만 친구 요청 조회" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "로그인한 사용자만 친구 요청 생성" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "관련 사용자만 친구 요청 수정" ON friend_requests
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 좋아요
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 좋아요만 조회" ON likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인만 좋아요 생성" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인만 좋아요 삭제" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 알림
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 알림만 조회" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 삭제" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 차단
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 차단 목록만 조회" ON blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인만 차단 생성" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인만 차단 해제" ON blocks
  FOR DELETE USING (auth.uid() = user_id);

-- 메시지
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "참가자만 메시지 조회" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "참가자만 메시지 작성" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- 트리거 함수
-- =============================================

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER joins_updated_at
  BEFORE UPDATE ON joins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER join_applications_updated_at
  BEFORE UPDATE ON join_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 새 사용자 가입 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', '골프인'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 친구 요청 수락 시 친구 관계 생성
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 양방향 친구 관계 생성
    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.from_user_id, NEW.to_user_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.to_user_id, NEW.from_user_id)
    ON CONFLICT DO NOTHING;
    
    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.from_user_id,
      'match',
      '친구 매칭 완료!',
      '친구 요청이 수락되었어요 🎉',
      jsonb_build_object('friend_id', NEW.to_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION handle_friend_request_accepted();


