-- =============================================
-- 회원 탈퇴 (계정 완전 삭제) RPC 함수
-- Supabase SQL Editor에서 실행
-- =============================================

-- 사용자 계정 및 관련 데이터 완전 삭제
-- SECURITY DEFINER: service_role 권한으로 실행 (auth.users 삭제 가능)
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  -- 호출자 확인 (본인만 탈퇴 가능)
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR v_caller_id != p_user_id THEN
    RAISE EXCEPTION '본인만 계정을 삭제할 수 있습니다';
  END IF;

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

  -- 10. 신고 기록 삭제
  DELETE FROM reports WHERE reporter_id = p_user_id OR reported_user_id = p_user_id;

  -- 11. 차단 기록 삭제
  DELETE FROM blocks WHERE user_id = p_user_id OR blocked_user_id = p_user_id;

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

  -- 19. 프로필 삭제 (CASCADE로 남은 것들도 정리됨)
  DELETE FROM profiles WHERE id = p_user_id;

  -- 20. auth.users 삭제 (SECURITY DEFINER 권한 필요)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '회원 탈퇴 RPC 함수 생성 완료!';
END $$;
