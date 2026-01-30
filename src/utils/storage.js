/**
 * localStorage 유틸리티 함수
 * 중앙 집중식 스토리지 관리
 */

// 스토리지 키 상수
export const STORAGE_KEYS = {
  // 인증 관련
  PHONE_VERIFIED: 'gp_phone_verified',
  VERIFIED_PHONE: 'gp_verified_phone',
  PROFILE: 'gp_profile',
  ONBOARDED: 'gp_onboarded',

  // 마커 관련
  MARKER_BALANCE: 'gp_marker_balance',
  MARKER_TRANSACTIONS: 'gp_marker_transactions',

  // 사용자 활동
  REVEALED_CARDS: 'gp_revealed_cards',
  REVEALED_DATE: 'gp_revealed_date',
  VIEWED_PROFILES: 'gp_viewed_profiles',
  PAST_CARDS: 'gp_past_cards',
  RECOMMENDATION_HISTORY: 'gp_recommendation_history',

  // 조인/채팅
  MY_JOINS: 'gp_my_joins',
  CHAT_ROOMS: 'gp_chat_rooms',

  // 설정
  SETTINGS: 'gp_settings',
  BLOCKED_USERS: 'gp_blocked_users',
}

/**
 * localStorage에서 값 가져오기
 * @param {string} key - 스토리지 키
 * @param {*} defaultValue - 기본값
 * @returns {*} 저장된 값 또는 기본값
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch (e) {
    console.warn(`localStorage getItem 오류 (${key}):`, e)
    return defaultValue
  }
}

/**
 * localStorage에 값 저장하기
 * @param {string} key - 스토리지 키
 * @param {*} value - 저장할 값
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`localStorage setItem 오류 (${key}):`, e)
  }
}

/**
 * localStorage에서 값 제거하기
 * @param {string} key - 스토리지 키
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error(`localStorage removeItem 오류 (${key}):`, e)
  }
}

/**
 * 문자열 값 가져오기 (JSON 파싱 없이)
 * @param {string} key - 스토리지 키
 * @param {string} defaultValue - 기본값
 * @returns {string} 저장된 문자열 또는 기본값
 */
export const getString = (key, defaultValue = '') => {
  try {
    return localStorage.getItem(key) || defaultValue
  } catch (e) {
    console.warn(`localStorage getString 오류 (${key}):`, e)
    return defaultValue
  }
}

/**
 * 문자열 값 저장하기 (JSON 변환 없이)
 * @param {string} key - 스토리지 키
 * @param {string} value - 저장할 문자열
 */
export const setString = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.error(`localStorage setString 오류 (${key}):`, e)
  }
}

/**
 * 숫자 값 가져오기
 * @param {string} key - 스토리지 키
 * @param {number} defaultValue - 기본값
 * @returns {number} 저장된 숫자 또는 기본값
 */
export const getNumber = (key, defaultValue = 0) => {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return defaultValue
    const num = parseInt(value, 10)
    return isNaN(num) ? defaultValue : num
  } catch (e) {
    console.warn(`localStorage getNumber 오류 (${key}):`, e)
    return defaultValue
  }
}

/**
 * 숫자 값 저장하기
 * @param {string} key - 스토리지 키
 * @param {number} value - 저장할 숫자
 */
export const setNumber = (key, value) => {
  try {
    localStorage.setItem(key, value.toString())
  } catch (e) {
    console.error(`localStorage setNumber 오류 (${key}):`, e)
  }
}

/**
 * 불리언 값 가져오기
 * @param {string} key - 스토리지 키
 * @param {boolean} defaultValue - 기본값
 * @returns {boolean} 저장된 불리언 또는 기본값
 */
export const getBoolean = (key, defaultValue = false) => {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return defaultValue
    return value === 'true'
  } catch (e) {
    console.warn(`localStorage getBoolean 오류 (${key}):`, e)
    return defaultValue
  }
}

/**
 * 불리언 값 저장하기
 * @param {string} key - 스토리지 키
 * @param {boolean} value - 저장할 불리언
 */
export const setBoolean = (key, value) => {
  try {
    localStorage.setItem(key, value ? 'true' : 'false')
  } catch (e) {
    console.error(`localStorage setBoolean 오류 (${key}):`, e)
  }
}

/**
 * 배열에 항목 추가 (중복 제거)
 * @param {string} key - 스토리지 키
 * @param {*} item - 추가할 항목
 * @param {number} maxLength - 최대 배열 길이 (기본 100)
 */
export const addToArray = (key, item, maxLength = 100) => {
  try {
    const arr = getItem(key, [])
    if (!arr.includes(item)) {
      const updated = [item, ...arr].slice(0, maxLength)
      setItem(key, updated)
    }
  } catch (e) {
    console.error(`localStorage addToArray 오류 (${key}):`, e)
  }
}

/**
 * 배열에서 항목 제거
 * @param {string} key - 스토리지 키
 * @param {*} item - 제거할 항목
 */
export const removeFromArray = (key, item) => {
  try {
    const arr = getItem(key, [])
    const updated = arr.filter(i => i !== item)
    setItem(key, updated)
  } catch (e) {
    console.error(`localStorage removeFromArray 오류 (${key}):`, e)
  }
}

/**
 * 배열에 항목 포함 여부 확인
 * @param {string} key - 스토리지 키
 * @param {*} item - 확인할 항목
 * @returns {boolean} 포함 여부
 */
export const arrayIncludes = (key, item) => {
  try {
    const arr = getItem(key, [])
    return arr.includes(item)
  } catch (e) {
    console.warn(`localStorage arrayIncludes 오류 (${key}):`, e)
    return false
  }
}

/**
 * 모든 gp_ 키 초기화 (로그아웃 시 사용)
 */
export const clearAllGpData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (e) {
    console.error('localStorage clearAllGpData 오류:', e)
  }
}

export default {
  STORAGE_KEYS,
  getItem,
  setItem,
  removeItem,
  getString,
  setString,
  getNumber,
  setNumber,
  getBoolean,
  setBoolean,
  addToArray,
  removeFromArray,
  arrayIncludes,
  clearAllGpData,
}
