-- =============================================
-- 회원 탈퇴 개선: 신고/차단 기록 보존 + 탈퇴 아카이브
-- Supabase SQL Editor에서 실행
-- =============================================

-- 1. 탈퇴 계정 아카이브 테이블
CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  reason TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  report_count INT DEFAULT 0,
  reported_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_user_id ON deleted_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_deleted_at ON deleted_accounts(deleted_at);

-- 2. reports 테이블 FK를 SET NULL로 변경 (신고 기록 보존)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;

ALTER TABLE reports
  ADD CONSTRAINT reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE reports
  ADD CONSTRAINT reports_reported_user_id_fkey
  FOREIGN KEY (reported_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- reporter_id, reported_user_id nullable로 변경
ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN reported_user_id DROP NOT NULL;

-- 3. blocks 테이블 FK를 SET NULL로 변경 (차단 기록 보존)
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_user_id_fkey;
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_blocked_user_id_fkey;

ALTER TABLE blocks
  ADD CONSTRAINT blocks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE blocks
  ADD CONSTRAINT blocks_blocked_user_id_fkey
  FOREIGN KEY (blocked_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE blocks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE blocks ALTER COLUMN blocked_user_id DROP NOT NULL;

-- UNIQUE 제약 조건도 업데이트 (NULL 허용)
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_user_id_blocked_user_id_key;

-- 4. delete_user_account 함수 업데이트 (신고/차단 보존 + 아카이브)
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller_id UUID;
  v_name VARCHAR;
  v_email VARCHAR;
  v_report_count INT;
  v_reported_count INT;
BEGIN
  -- 호출자 확인 (본인만 탈퇴 가능)
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR v_caller_id != p_user_id THEN
    RAISE EXCEPTION '본인만 계정을 삭제할 수 있습니다';
  END IF;

  -- 아카이브용 정보 수집
  SELECT name INTO v_name FROM profiles WHERE id = p_user_id;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  SELECT COUNT(*) INTO v_report_count FROM reports WHERE reporter_id = p_user_id;
  SELECT COUNT(*) INTO v_reported_count FROM reports WHERE reported_user_id = p_user_id;

  -- 탈퇴 아카이브 저장
  INSERT INTO deleted_accounts (user_id, name, email, report_count, reported_count)
  VALUES (p_user_id, v_name, v_email, v_report_count, v_reported_count);

  -- 1. 푸시 토큰 삭제
  DELETE FROM push_tokens WHERE user_id = p_user_id;

  -- 2. 알림 설정 삭제
  DELETE FROM notification_settings WHERE user_id = p_user_id;

  -- 3. 알림 삭제
  DELETE FROM notifications WHERE user_id = p_user_id;

  -- 4. 마커 거래 내역 삭제
  DELETE FROM marker_transactions WHERE user_id = p_user_id;

  -- 5. 마커 지갑 삭제
  DELETE FROM marker_wallets WHERE user_id = p_user_id;

  -- 6. 리뷰 삭제 (내가 작성한 + 내가 받은)
  DELETE FROM reviews WHERE reviewer_id = p_user_id OR reviewed_id = p_user_id;

  -- 7. 스코어 기록 삭제
  DELETE FROM scores WHERE user_id = p_user_id;

  -- 8. 채팅 메시지 삭제 (내가 보낸)
  DELETE FROM messages WHERE sender_id = p_user_id;

  -- 9. 채팅방 참가 정보 삭제
  DELETE FROM chat_participants WHERE user_id = p_user_id;

  -- 10. 신고 기록: 삭제하지 않고 보존 (FK가 SET NULL로 변경됨)
  -- 내가 신고한 기록: reporter_id가 NULL로 설정됨
  -- 나를 신고한 기록: reported_user_id가 NULL로 설정됨 → 아카이브에서 user_id로 추적 가능

  -- 11. 차단 기록: 삭제하지 않고 보존 (FK가 SET NULL로 변경됨)

  -- 12. 좋아요 삭제
  DELETE FROM likes WHERE user_id = p_user_id OR liked_user_id = p_user_id;

  -- 13. 저장된 조인 삭제
  DELETE FROM saved_joins WHERE user_id = p_user_id;

  -- 14. 조인 신청 삭제
  DELETE FROM join_applications WHERE user_id = p_user_id;

  -- 15. 조인 참가 정보 삭제
  DELETE FROM join_participants WHERE user_id = p_user_id;

  -- 16. 내가 만든 조인 삭제
  DELETE FROM joins WHERE host_id = p_user_id;

  -- 17. 친구 관계 삭제
  DELETE FROM friends WHERE user_id = p_user_id OR friend_id = p_user_id;

  -- 18. 친구 요청 삭제
  DELETE FROM friend_requests WHERE from_user_id = p_user_id OR to_user_id = p_user_id;

  -- 19. 프로필 삭제 (CASCADE로 남은 것들도 정리, reports/blocks는 SET NULL)
  DELETE FROM profiles WHERE id = p_user_id;

  -- 20. auth.users 삭제 (SECURITY DEFINER 권한 필요)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: deleted_accounts는 관리자만 조회 가능 (일반 유저 접근 불가)
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '탈퇴 개선 마이그레이션 완료: 신고/차단 보존 + 아카이브 테이블 생성';
END $$;
