-- =============================================
-- 시드 데이터 전체 삭제 스크립트
-- Supabase SQL Editor에서 실행
-- =============================================
--
-- 삭제 대상:
--   - 테스트 프로필 15명 (02-06 삽입) + 관련 모든 데이터
--   - 조인 모집글 + 참가자 + 신청
--   - 채팅방 + 메시지
--   - 알림, 좋아요, 친구요청, 친구, 저장, 차단, 신고
--   - 스코어 기록
--
-- ⚠️ 주의: 실제 사용자 데이터도 모두 삭제됩니다!
-- 실 서비스 시작 전에만 실행하세요.
-- =============================================

BEGIN;

-- 1) 메시지 전체 삭제 (FK: room_id, sender_id)
DELETE FROM messages;

-- 2) 채팅방 참가자 전체 삭제
DELETE FROM chat_participants;

-- 3) 채팅방 나간 기록 (있을 경우)
DELETE FROM conversation_leaves;

-- 4) 채팅방 전체 삭제
DELETE FROM chat_rooms;

-- 5) 조인 신청 전체 삭제
DELETE FROM join_applications;

-- 6) 조인 참가자 전체 삭제
DELETE FROM join_participants;

-- 7) 저장된 조인 전체 삭제
DELETE FROM saved_joins;

-- 8) 조인 전체 삭제
DELETE FROM joins;

-- 9) 알림 전체 삭제
DELETE FROM notifications;

-- 10) 친구 전체 삭제
DELETE FROM friends;

-- 11) 친구 요청 전체 삭제
DELETE FROM friend_requests;

-- 12) 좋아요 전체 삭제
DELETE FROM likes;

-- 13) 차단 전체 삭제
DELETE FROM blocks;

-- 14) 신고 전체 삭제
DELETE FROM reports;

-- 15) 스코어 전체 삭제
DELETE FROM scores;

-- 16) 알림 설정 전체 삭제
DELETE FROM notification_settings;

-- 17) 마커 거래내역 전체 삭제 (있을 경우)
DO $$ BEGIN
  DELETE FROM marker_transactions;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 18) 프로필 전체 삭제 (auth.users는 유지 — 재로그인 시 온보딩)
DELETE FROM profiles;

COMMIT;

-- 결과 확인
SELECT 'profiles' AS table_name, COUNT(*) AS remaining FROM profiles
UNION ALL SELECT 'joins', COUNT(*) FROM joins
UNION ALL SELECT 'join_applications', COUNT(*) FROM join_applications
UNION ALL SELECT 'chat_rooms', COUNT(*) FROM chat_rooms
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'friends', COUNT(*) FROM friends
UNION ALL SELECT 'friend_requests', COUNT(*) FROM friend_requests
UNION ALL SELECT 'likes', COUNT(*) FROM likes;
