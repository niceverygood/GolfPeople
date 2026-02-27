/**
 * 전화번호 SMS 인증 (알리고 API + Supabase DB RPC)
 * Firebase Phone Auth 대체
 */
import { supabase } from './supabase'

/**
 * SMS 인증번호 발송
 * @param {string} phoneNumber - 전화번호 (010-XXXX-XXXX 또는 01XXXXXXXXX)
 * @returns {{ success: boolean, error?: string }}
 */
export const sendVerificationCode = async (phoneNumber) => {
  if (!supabase) {
    return { success: false, error: '서비스에 연결할 수 없습니다.' }
  }

  const phone = phoneNumber.replace(/\D/g, '')

  if (phone.length !== 11 || !phone.startsWith('010')) {
    return { success: false, error: '올바른 전화번호를 입력해주세요.' }
  }

  try {
    const { data, error } = await supabase.rpc('send_phone_verification', {
      p_phone: phone,
    })

    if (error) {
      console.error('SMS 발송 RPC 오류:', error)
      return { success: false, error: '인증번호 발송에 실패했습니다.' }
    }

    if (data?.success) {
      return { success: true }
    }

    // 에러 코드별 메시지
    const errorMessages = {
      invalid_phone: '올바른 전화번호를 입력해주세요.',
      too_many_requests: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.',
      sms_config_missing: '인증 서비스가 설정되지 않았습니다.',
      sms_send_failed: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      sms_parse_error: '인증 서비스에 일시적인 오류가 발생했습니다.',
    }

    return {
      success: false,
      error: errorMessages[data?.error] || '인증번호 발송에 실패했습니다.',
    }
  } catch (err) {
    console.error('SMS 발송 오류:', err)
    return { success: false, error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
  }
}

/**
 * SMS 인증번호 확인
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 6자리 인증코드
 * @returns {{ success: boolean, error?: string }}
 */
export const verifyCode = async (phoneNumber, code) => {
  if (!supabase) {
    return { success: false, error: '서비스에 연결할 수 없습니다.' }
  }

  const phone = phoneNumber.replace(/\D/g, '')

  try {
    const { data, error } = await supabase.rpc('verify_phone_code', {
      p_phone: phone,
      p_code: code,
    })

    if (error) {
      console.error('인증 확인 RPC 오류:', error)
      return { success: false, error: '인증 확인에 실패했습니다.' }
    }

    if (data?.success) {
      return { success: true }
    }

    const errorMessages = {
      no_verification: '인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.',
      code_expired: '인증번호가 만료되었습니다. 다시 요청해주세요.',
      too_many_attempts: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.',
      invalid_code: '인증번호가 올바르지 않습니다.',
    }

    return {
      success: false,
      error: errorMessages[data?.error] || '인증에 실패했습니다.',
    }
  } catch (err) {
    console.error('인증 확인 오류:', err)
    return { success: false, error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
  }
}
