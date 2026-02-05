/**
 * 공통 에러 처리 유틸리티
 * 일관된 에러 메시지 및 사용자 피드백 제공
 */

// 에러 코드별 사용자 친화적 메시지
const ERROR_MESSAGES = {
  // 네트워크 에러
  network_error: '네트워크 연결을 확인해주세요.',
  timeout: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // 인증 에러
  not_authenticated: '로그인이 필요합니다.',
  session_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  phone_not_verified: '전화번호 인증이 필요합니다.',

  // 마커 에러
  insufficient_balance: '마커가 부족합니다. 스토어에서 충전해주세요.',
  marker_spend_failed: '마커 사용에 실패했습니다.',

  // 결제 에러
  payment_failed: '결제에 실패했습니다.',
  payment_cancelled: '결제가 취소되었습니다.',
  product_not_found: '상품 정보를 찾을 수 없습니다.',

  // 데이터 에러
  not_found: '요청한 정보를 찾을 수 없습니다.',
  already_exists: '이미 존재하는 항목입니다.',
  validation_error: '입력 정보를 확인해주세요.',

  // 권한 에러
  permission_denied: '권한이 없습니다.',
  blocked_user: '차단된 사용자입니다.',

  // 파일 에러
  file_too_large: '파일 크기가 너무 큽니다.',
  invalid_file_type: '지원하지 않는 파일 형식입니다.',
  upload_failed: '파일 업로드에 실패했습니다.',

  // 기본
  unknown: '오류가 발생했습니다. 다시 시도해주세요.',
}

/**
 * 에러 코드에서 사용자 친화적 메시지 가져오기
 * @param {string} errorCode - 에러 코드
 * @param {string} fallback - 대체 메시지
 * @returns {string} 사용자 친화적 에러 메시지
 */
export const getErrorMessage = (errorCode, fallback = null) => {
  return ERROR_MESSAGES[errorCode] || fallback || ERROR_MESSAGES.unknown
}

/**
 * Supabase 에러를 사용자 친화적 메시지로 변환
 * @param {Object} error - Supabase 에러 객체
 * @returns {string} 사용자 친화적 에러 메시지
 */
export const parseSupabaseError = (error) => {
  if (!error) return ERROR_MESSAGES.unknown

  // Supabase 에러 코드 매핑
  const supabaseErrorMap = {
    'PGRST116': 'not_found',
    '23505': 'already_exists',
    '23503': 'validation_error',
    '42501': 'permission_denied',
    'invalid_grant': 'invalid_credentials',
    'user_not_found': 'not_found',
  }

  const code = error.code || error.error_code
  const mappedCode = supabaseErrorMap[code]

  if (mappedCode) {
    return ERROR_MESSAGES[mappedCode]
  }

  // 에러 메시지에서 힌트 추출
  if (error.message) {
    if (error.message.includes('network')) return ERROR_MESSAGES.network_error
    if (error.message.includes('timeout')) return ERROR_MESSAGES.timeout
    if (error.message.includes('JWT')) return ERROR_MESSAGES.session_expired
  }

  return error.message || ERROR_MESSAGES.unknown
}

/**
 * 에러 로깅 및 사용자 피드백
 * @param {string} context - 에러 발생 위치
 * @param {Error|Object} error - 에러 객체
 * @param {Object} options - 옵션
 * @param {boolean} options.silent - true면 console.error만 출력
 * @param {Function} options.onError - 커스텀 에러 핸들러
 * @returns {string} 사용자 친화적 에러 메시지
 */
export const handleError = (context, error, options = {}) => {
  const { silent = false, onError = null } = options

  // 개발 환경에서만 상세 로그
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  } else {
    console.error(`[${context}] Error occurred`)
  }

  const message = error?.code
    ? getErrorMessage(error.code)
    : parseSupabaseError(error)

  if (!silent && onError) {
    onError(message)
  }

  return message
}

/**
 * API 호출 래퍼 with 에러 처리
 * @param {Function} apiCall - API 호출 함수
 * @param {Object} options - 옵션
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const safeApiCall = async (apiCall, options = {}) => {
  const { context = 'API', onError = null } = options

  try {
    const result = await apiCall()

    // Supabase 스타일 응답 처리
    if (result && typeof result === 'object') {
      if (result.error) {
        const message = handleError(context, result.error, { onError })
        return { success: false, error: message }
      }
      return { success: true, data: result.data }
    }

    return { success: true, data: result }
  } catch (error) {
    const message = handleError(context, error, { onError })
    return { success: false, error: message }
  }
}

/**
 * 토스트 알림 (toastStore 기반)
 */
import { toast } from '../lib/toastStore'

export const showToast = toast

export default {
  ERROR_MESSAGES,
  getErrorMessage,
  parseSupabaseError,
  handleError,
  safeApiCall,
  showToast,
}
