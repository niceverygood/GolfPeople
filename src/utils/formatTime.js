/**
 * 시간 포맷팅 유틸리티
 * 중복 제거를 위한 공통 함수
 */

/**
 * 상대적 시간 표시 (n분 전, n시간 전 등)
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 시간 문자열
 */
export const getTimeAgo = (dateInput) => {
  if (!dateInput) return ''

  const now = new Date()
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR')
}

/**
 * 간단한 상대적 시간 (오늘, n일 전)
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 시간 문자열
 */
export const getSimpleTimeAgo = (dateInput) => {
  if (!dateInput) return ''

  const now = new Date()
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays < 1) return '오늘'
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR')
}

/**
 * 채팅용 시간 포맷 (오전/오후 HH:MM)
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 시간 문자열
 */
export const formatChatTime = (dateInput) => {
  if (!dateInput) return ''

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * 날짜 포맷 (YYYY.MM.DD)
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return ''

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * 조인 날짜 포맷 (M월 D일 (요일))
 * @param {string} dateStr - YYYY-MM-DD 형식 날짜 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatJoinDate = (dateStr) => {
  if (!dateStr) return ''
  if (dateStr.includes('월')) return dateStr
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

export default {
  getTimeAgo,
  getSimpleTimeAgo,
  formatChatTime,
  formatDate,
  formatJoinDate,
}
