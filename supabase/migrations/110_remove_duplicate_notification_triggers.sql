-- 알림 중복 생성 수정: DB 트리거와 클라이언트 createNotification이 동시에 알림 생성
-- 클라이언트에서 createNotification을 호출하므로 DB 트리거는 제거

DROP TRIGGER IF EXISTS on_friend_request_created ON friend_requests;
DROP TRIGGER IF EXISTS on_join_application_created ON join_applications;

-- 함수도 제거 (더 이상 사용 안 함)
DROP FUNCTION IF EXISTS notify_friend_request();
DROP FUNCTION IF EXISTS notify_join_application();
