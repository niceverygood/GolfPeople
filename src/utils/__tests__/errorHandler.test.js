import { describe, it, expect, vi } from 'vitest'

// toastStore 모킹 (errorHandler에서 import함)
vi.mock('../../lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }
}))

const mod = await import('../errorHandler')
const getErrorMessage = mod.getErrorMessage
const parseSupabaseError = mod.parseSupabaseError
const ERROR_MESSAGES = mod.default.ERROR_MESSAGES

describe('ERROR_MESSAGES', () => {
  it('주요 에러 코드가 정의되어 있음', () => {
    expect(ERROR_MESSAGES.network_error).toBeDefined()
    expect(ERROR_MESSAGES.not_authenticated).toBeDefined()
    expect(ERROR_MESSAGES.insufficient_balance).toBeDefined()
    expect(ERROR_MESSAGES.payment_failed).toBeDefined()
    expect(ERROR_MESSAGES.unknown).toBeDefined()
  })
})

describe('getErrorMessage', () => {
  it('정의된 에러 코드의 메시지 반환', () => {
    expect(getErrorMessage('network_error')).toBe('네트워크 연결을 확인해주세요.')
  })

  it('마커 부족 에러', () => {
    expect(getErrorMessage('insufficient_balance')).toBe('마커가 부족합니다. 스토어에서 충전해주세요.')
  })

  it('존재하지 않는 코드면 기본 메시지', () => {
    expect(getErrorMessage('nonexistent_code')).toBe(ERROR_MESSAGES.unknown)
  })

  it('fallback 메시지 사용', () => {
    expect(getErrorMessage('nonexistent_code', '커스텀 메시지')).toBe('커스텀 메시지')
  })
})

describe('parseSupabaseError', () => {
  it('null이면 기본 메시지', () => {
    expect(parseSupabaseError(null)).toBe(ERROR_MESSAGES.unknown)
  })

  it('PGRST116 → not_found 매핑', () => {
    expect(parseSupabaseError({ code: 'PGRST116' })).toBe(ERROR_MESSAGES.not_found)
  })

  it('23505 → already_exists 매핑', () => {
    expect(parseSupabaseError({ code: '23505' })).toBe(ERROR_MESSAGES.already_exists)
  })

  it('42501 → permission_denied 매핑', () => {
    expect(parseSupabaseError({ code: '42501' })).toBe(ERROR_MESSAGES.permission_denied)
  })

  it('network 메시지 포함 시 네트워크 에러', () => {
    expect(parseSupabaseError({ message: 'network connection failed' })).toBe(ERROR_MESSAGES.network_error)
  })

  it('JWT 메시지 포함 시 세션 만료', () => {
    expect(parseSupabaseError({ message: 'JWT expired' })).toBe(ERROR_MESSAGES.session_expired)
  })

  it('timeout 메시지 포함 시 타임아웃', () => {
    expect(parseSupabaseError({ message: 'request timeout' })).toBe(ERROR_MESSAGES.timeout)
  })

  it('알 수 없는 에러면 message 반환', () => {
    expect(parseSupabaseError({ message: 'Something went wrong' })).toBe('Something went wrong')
  })

  it('message도 없으면 기본 메시지', () => {
    expect(parseSupabaseError({})).toBe(ERROR_MESSAGES.unknown)
  })
})
