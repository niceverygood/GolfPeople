-- =============================================
-- 카카오 알림톡 현재 상태 확인 쿼리
-- Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- 1. kakao_notification_enabled 컬럼 존재 확인
SELECT
  '=== 1. kakao_notification_enabled 컬럼 확인 ===' as section,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'kakao_notification_enabled';

-- 2. 전화번호 등록된 사용자 목록 확인 (알림톡 발송 대상)
SELECT
  '=== 2. 전화번호 등록된 사용자 목록 (최근 10명) ===' as section,
  id,
  name,
  phone,
  kakao_notification_enabled,
  created_at
FROM profiles
WHERE phone IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. 현재 알림 설정 현황 통계
SELECT
  '=== 3. 카카오 알림 설정 현황 ===' as section,
  CASE
    WHEN kakao_notification_enabled IS NULL THEN 'NULL (미설정)'
    WHEN kakao_notification_enabled = true THEN 'true (활성화)'
    WHEN kakao_notification_enabled = false THEN 'false (비활성화)'
  END as kakao_status,
  COUNT(*) as user_count
FROM profiles
GROUP BY kakao_notification_enabled
ORDER BY kakao_notification_enabled DESC NULLS LAST;

-- 4. 전화번호 + 알림 활성화 사용자 (실제 발송 가능한 사용자)
SELECT
  '=== 4. 알림톡 발송 가능한 사용자 ===' as section,
  COUNT(*) as ready_users
FROM profiles
WHERE phone IS NOT NULL
  AND kakao_notification_enabled = true;
