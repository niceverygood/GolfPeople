import { describe, it, expect, vi, beforeEach } from 'vitest'

// 매 테스트마다 모듈을 새로 로드해서 상태를 초기화
let subscribe, toast

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../toastStore')
  subscribe = mod.subscribe
  toast = mod.toast
})

describe('subscribe', () => {
  it('리스너를 등록하면 토스트 수신', () => {
    const listener = vi.fn()
    subscribe(listener)

    toast.success('테스트')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: '테스트' })
    )
  })

  it('unsubscribe하면 더 이상 수신 안 함', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    toast.success('첫 번째')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    toast.success('두 번째')
    expect(listener).toHaveBeenCalledTimes(1) // 더 안 늘어남
  })

  it('여러 리스너 등록 가능', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    subscribe(listener1)
    subscribe(listener2)

    toast.error('에러')
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)
  })
})

describe('toast 메서드', () => {
  it('toast.success → type: success', () => {
    const listener = vi.fn()
    subscribe(listener)

    toast.success('성공!')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: '성공!' })
    )
  })

  it('toast.error → type: error', () => {
    const listener = vi.fn()
    subscribe(listener)

    toast.error('실패!')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: '실패!' })
    )
  })

  it('toast.warning → type: warning', () => {
    const listener = vi.fn()
    subscribe(listener)

    toast.warning('주의!')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning', message: '주의!' })
    )
  })

  it('toast.info → type: info', () => {
    const listener = vi.fn()
    subscribe(listener)

    toast.info('안내')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', message: '안내' })
    )
  })

  it('각 토스트에 고유 id 부여', () => {
    const received = []
    subscribe((t) => received.push(t))

    toast.success('1')
    toast.success('2')
    toast.success('3')

    expect(received).toHaveLength(3)
    const ids = received.map(t => t.id)
    expect(new Set(ids).size).toBe(3) // 모두 다른 id
  })
})
