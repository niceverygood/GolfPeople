/**
 * 입력값 검증 유틸리티
 * 공통 유효성 검사 함수 모음
 */

/**
 * 전화번호 유효성 검사
 * @param {string} phone - 전화번호
 * @returns {{valid: boolean, message?: string}}
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, message: '전화번호를 입력해주세요' }
  }

  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '')

  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
  const phoneRegex = /^01[0-9]{8,9}$/

  if (!phoneRegex.test(numbers)) {
    return { valid: false, message: '올바른 전화번호 형식이 아닙니다' }
  }

  return { valid: true }
}

/**
 * 이메일 유효성 검사
 * @param {string} email - 이메일
 * @returns {{valid: boolean, message?: string}}
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, message: '이메일을 입력해주세요' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { valid: false, message: '올바른 이메일 형식이 아닙니다' }
  }

  return { valid: true }
}

/**
 * 이름 유효성 검사
 * @param {string} name - 이름
 * @param {number} minLength - 최소 길이
 * @param {number} maxLength - 최대 길이
 * @returns {{valid: boolean, message?: string}}
 */
export const validateName = (name, minLength = 2, maxLength = 20) => {
  if (!name || !name.trim()) {
    return { valid: false, message: '이름을 입력해주세요' }
  }

  const trimmed = name.trim()

  if (trimmed.length < minLength) {
    return { valid: false, message: `이름은 ${minLength}자 이상이어야 합니다` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, message: `이름은 ${maxLength}자 이하여야 합니다` }
  }

  // 특수문자 제한 (한글, 영문, 숫자만 허용)
  const nameRegex = /^[가-힣a-zA-Z0-9\s]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, message: '이름에 특수문자를 사용할 수 없습니다' }
  }

  return { valid: true }
}

/**
 * 비밀번호 유효성 검사
 * @param {string} password - 비밀번호
 * @returns {{valid: boolean, message?: string, strength?: string}}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: '비밀번호를 입력해주세요' }
  }

  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 6자 이상이어야 합니다' }
  }

  if (password.length > 50) {
    return { valid: false, message: '비밀번호가 너무 깁니다' }
  }

  // 강도 체크
  let strength = 'weak'
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*]/.test(password)

  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (score >= 3 && password.length >= 8) {
    strength = 'strong'
  } else if (score >= 2) {
    strength = 'medium'
  }

  return { valid: true, strength }
}

/**
 * 숫자 범위 검사
 * @param {number|string} value - 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {string} fieldName - 필드명
 * @returns {{valid: boolean, message?: string}}
 */
export const validateNumberRange = (value, min, max, fieldName = '값') => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(num)) {
    return { valid: false, message: `${fieldName}은(는) 숫자여야 합니다` }
  }

  if (num < min) {
    return { valid: false, message: `${fieldName}은(는) ${min} 이상이어야 합니다` }
  }

  if (num > max) {
    return { valid: false, message: `${fieldName}은(는) ${max} 이하여야 합니다` }
  }

  return { valid: true }
}

/**
 * 필수 입력 검사
 * @param {*} value - 값
 * @param {string} fieldName - 필드명
 * @returns {{valid: boolean, message?: string}}
 */
export const validateRequired = (value, fieldName = '필드') => {
  if (value === null || value === undefined) {
    return { valid: false, message: `${fieldName}을(를) 입력해주세요` }
  }

  if (typeof value === 'string' && !value.trim()) {
    return { valid: false, message: `${fieldName}을(를) 입력해주세요` }
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, message: `${fieldName}을(를) 선택해주세요` }
  }

  return { valid: true }
}

/**
 * 골프 스코어 검사
 * @param {number|string} score - 스코어
 * @returns {{valid: boolean, message?: string}}
 */
export const validateGolfScore = (score) => {
  return validateNumberRange(score, 50, 200, '스코어')
}

/**
 * 날짜 유효성 검사 (미래 날짜)
 * @param {string|Date} date - 날짜
 * @returns {{valid: boolean, message?: string}}
 */
export const validateFutureDate = (date) => {
  if (!date) {
    return { valid: false, message: '날짜를 선택해주세요' }
  }

  const inputDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (inputDate < today) {
    return { valid: false, message: '과거 날짜는 선택할 수 없습니다' }
  }

  return { valid: true }
}

/**
 * 텍스트 길이 검사
 * @param {string} text - 텍스트
 * @param {number} maxLength - 최대 길이
 * @param {string} fieldName - 필드명
 * @returns {{valid: boolean, message?: string}}
 */
export const validateTextLength = (text, maxLength, fieldName = '내용') => {
  if (!text) {
    return { valid: true } // 빈 값은 허용 (필수 체크는 별도)
  }

  if (text.length > maxLength) {
    return { valid: false, message: `${fieldName}은(는) ${maxLength}자 이하여야 합니다` }
  }

  return { valid: true }
}

/**
 * 폼 전체 검증
 * @param {Object} values - 폼 값들
 * @param {Object} rules - 검증 규칙
 * @returns {{valid: boolean, errors: Object}}
 */
export const validateForm = (values, rules) => {
  const errors = {}

  Object.entries(rules).forEach(([field, validators]) => {
    const value = values[field]

    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) {
        errors[field] = result.message
        break
      }
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export default {
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
  validateNumberRange,
  validateRequired,
  validateGolfScore,
  validateFutureDate,
  validateTextLength,
  validateForm,
}
