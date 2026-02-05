import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTimeAgo, getSimpleTimeAgo, formatChatTime, formatDate } from '../formatTime'

describe('getTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-05T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('빈 값이면 빈 문자열 반환', () => {
    expect(getTimeAgo(null)).toBe('')
    expect(getTimeAgo('')).toBe('')
  })

  it('방금 전 (30초)', () => {
    const date = new Date('2026-02-05T11:59:35')
    expect(getTimeAgo(date)).toBe('방금 전')
  })

  it('N분 전', () => {
    const date = new Date('2026-02-05T11:45:00')
    expect(getTimeAgo(date)).toBe('15분 전')
  })

  it('N시간 전', () => {
    const date = new Date('2026-02-05T09:00:00')
    expect(getTimeAgo(date)).toBe('3시간 전')
  })

  it('N일 전', () => {
    const date = new Date('2026-02-03T12:00:00')
    expect(getTimeAgo(date)).toBe('2일 전')
  })

  it('7일 이상이면 날짜 표시', () => {
    const date = new Date('2026-01-20T12:00:00')
    const result = getTimeAgo(date)
    // toLocaleDateString('ko-KR') 형태
    expect(result).toContain('2026')
  })
})

describe('getSimpleTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-05T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('빈 값이면 빈 문자열 반환', () => {
    expect(getSimpleTimeAgo(null)).toBe('')
  })

  it('오늘이면 "오늘"', () => {
    const date = new Date('2026-02-05T09:00:00')
    expect(getSimpleTimeAgo(date)).toBe('오늘')
  })

  it('N일 전', () => {
    const date = new Date('2026-02-02T12:00:00')
    expect(getSimpleTimeAgo(date)).toBe('3일 전')
  })

  it('7일 이상이면 날짜 표시', () => {
    const date = new Date('2026-01-20T12:00:00')
    const result = getSimpleTimeAgo(date)
    expect(result).toContain('2026')
  })
})

describe('formatChatTime', () => {
  it('빈 값이면 빈 문자열 반환', () => {
    expect(formatChatTime(null)).toBe('')
  })

  it('시간 포맷 반환', () => {
    const result = formatChatTime(new Date('2026-02-05T14:30:00'))
    // ko-KR 오후 2:30 형태
    expect(result).toContain('2')
    expect(result).toContain('30')
  })
})

describe('formatDate', () => {
  it('빈 값이면 빈 문자열 반환', () => {
    expect(formatDate(null)).toBe('')
  })

  it('YYYY.MM.DD 형태', () => {
    expect(formatDate(new Date('2026-02-05'))).toBe('2026.02.05')
  })

  it('문자열 날짜도 처리', () => {
    expect(formatDate('2026-12-25')).toBe('2026.12.25')
  })

  it('한 자리 월/일에 0 패딩', () => {
    expect(formatDate(new Date('2026-03-01'))).toBe('2026.03.01')
  })
})
