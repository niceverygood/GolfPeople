import { describe, it, expect, beforeEach } from 'vitest'
import {
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
} from '../storage'

beforeEach(() => {
  localStorage.clear()
})

describe('STORAGE_KEYS', () => {
  it('주요 키가 정의됨', () => {
    expect(STORAGE_KEYS.PROFILE).toBe('gp_profile')
    expect(STORAGE_KEYS.ONBOARDED).toBe('gp_onboarded')
    expect(STORAGE_KEYS.MARKER_BALANCE).toBe('gp_marker_balance')
    expect(STORAGE_KEYS.SETTINGS).toBe('gp_settings')
  })
})

describe('getItem / setItem', () => {
  it('객체 저장 및 불러오기', () => {
    const data = { name: '홍길동', age: 30 }
    setItem('test_key', data)
    expect(getItem('test_key')).toEqual(data)
  })

  it('배열 저장 및 불러오기', () => {
    setItem('arr', [1, 2, 3])
    expect(getItem('arr')).toEqual([1, 2, 3])
  })

  it('존재하지 않는 키면 기본값 반환', () => {
    expect(getItem('nonexistent')).toBeNull()
    expect(getItem('nonexistent', 'default')).toBe('default')
  })

  it('잘못된 JSON이면 기본값 반환', () => {
    localStorage.setItem('bad_json', '{invalid}')
    expect(getItem('bad_json', 'fallback')).toBe('fallback')
  })
})

describe('removeItem', () => {
  it('키 삭제', () => {
    setItem('to_remove', 'value')
    removeItem('to_remove')
    expect(getItem('to_remove')).toBeNull()
  })
})

describe('getString / setString', () => {
  it('문자열 저장 및 불러오기 (JSON 없이)', () => {
    setString('str_key', 'hello')
    expect(getString('str_key')).toBe('hello')
  })

  it('존재하지 않는 키면 기본값', () => {
    expect(getString('no_key', 'default')).toBe('default')
  })
})

describe('getNumber / setNumber', () => {
  it('숫자 저장 및 불러오기', () => {
    setNumber('num_key', 42)
    expect(getNumber('num_key')).toBe(42)
  })

  it('존재하지 않는 키면 기본값', () => {
    expect(getNumber('no_key')).toBe(0)
    expect(getNumber('no_key', 10)).toBe(10)
  })

  it('NaN이면 기본값', () => {
    localStorage.setItem('nan_key', 'not_a_number')
    expect(getNumber('nan_key', 5)).toBe(5)
  })
})

describe('getBoolean / setBoolean', () => {
  it('true 저장 및 불러오기', () => {
    setBoolean('bool_key', true)
    expect(getBoolean('bool_key')).toBe(true)
  })

  it('false 저장 및 불러오기', () => {
    setBoolean('bool_key', false)
    expect(getBoolean('bool_key')).toBe(false)
  })

  it('존재하지 않는 키면 기본값', () => {
    expect(getBoolean('no_key')).toBe(false)
    expect(getBoolean('no_key', true)).toBe(true)
  })
})

describe('addToArray / removeFromArray / arrayIncludes', () => {
  it('배열에 항목 추가', () => {
    addToArray('arr_key', 'a')
    addToArray('arr_key', 'b')
    expect(getItem('arr_key')).toEqual(['b', 'a'])
  })

  it('중복 항목은 추가 안 됨', () => {
    addToArray('arr_key', 'a')
    addToArray('arr_key', 'a')
    expect(getItem('arr_key')).toEqual(['a'])
  })

  it('maxLength 초과 시 오래된 항목 제거', () => {
    addToArray('arr_key', 'a', 2)
    addToArray('arr_key', 'b', 2)
    addToArray('arr_key', 'c', 2)
    expect(getItem('arr_key')).toEqual(['c', 'b'])
  })

  it('배열에서 항목 제거', () => {
    addToArray('arr_key', 'a')
    addToArray('arr_key', 'b')
    removeFromArray('arr_key', 'a')
    expect(getItem('arr_key')).toEqual(['b'])
  })

  it('포함 여부 확인', () => {
    addToArray('arr_key', 'hello')
    expect(arrayIncludes('arr_key', 'hello')).toBe(true)
    expect(arrayIncludes('arr_key', 'world')).toBe(false)
  })
})

describe('clearAllGpData', () => {
  it('모든 gp_ 키 삭제', () => {
    setItem(STORAGE_KEYS.PROFILE, { name: 'test' })
    setItem(STORAGE_KEYS.ONBOARDED, true)
    localStorage.setItem('other_key', 'keep')

    clearAllGpData()

    expect(getItem(STORAGE_KEYS.PROFILE)).toBeNull()
    expect(getItem(STORAGE_KEYS.ONBOARDED)).toBeNull()
    expect(localStorage.getItem('other_key')).toBe('keep')
  })
})
