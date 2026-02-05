import { describe, it, expect } from 'vitest'
import {
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
} from '../validation'

describe('validatePhone', () => {
  it('유효한 전화번호', () => {
    expect(validatePhone('01012345678')).toEqual({ valid: true })
  })

  it('하이픈 포함 번호도 유효', () => {
    expect(validatePhone('010-1234-5678')).toEqual({ valid: true })
  })

  it('011 번호도 유효', () => {
    expect(validatePhone('01112345678')).toEqual({ valid: true })
  })

  it('빈 값이면 실패', () => {
    expect(validatePhone('')).toEqual({ valid: false, message: '전화번호를 입력해주세요' })
  })

  it('잘못된 형식이면 실패', () => {
    expect(validatePhone('0201234')).toEqual({ valid: false, message: '올바른 전화번호 형식이 아닙니다' })
  })

  it('너무 짧은 번호면 실패', () => {
    expect(validatePhone('0101234')).toEqual({ valid: false, message: '올바른 전화번호 형식이 아닙니다' })
  })
})

describe('validateEmail', () => {
  it('유효한 이메일', () => {
    expect(validateEmail('test@example.com')).toEqual({ valid: true })
  })

  it('빈 값이면 실패', () => {
    expect(validateEmail('')).toEqual({ valid: false, message: '이메일을 입력해주세요' })
  })

  it('@ 없으면 실패', () => {
    expect(validateEmail('testexample.com')).toEqual({ valid: false, message: '올바른 이메일 형식이 아닙니다' })
  })

  it('도메인 없으면 실패', () => {
    expect(validateEmail('test@')).toEqual({ valid: false, message: '올바른 이메일 형식이 아닙니다' })
  })
})

describe('validateName', () => {
  it('유효한 한글 이름', () => {
    expect(validateName('홍길동')).toEqual({ valid: true })
  })

  it('유효한 영문 이름', () => {
    expect(validateName('John')).toEqual({ valid: true })
  })

  it('빈 값이면 실패', () => {
    expect(validateName('')).toEqual({ valid: false, message: '이름을 입력해주세요' })
  })

  it('공백만 있으면 실패', () => {
    expect(validateName('   ')).toEqual({ valid: false, message: '이름을 입력해주세요' })
  })

  it('1자면 최소 길이 실패', () => {
    expect(validateName('김').valid).toBe(false)
  })

  it('특수문자 포함하면 실패', () => {
    expect(validateName('홍길동!@')).toEqual({ valid: false, message: '이름에 특수문자를 사용할 수 없습니다' })
  })

  it('커스텀 최대 길이 초과 실패', () => {
    expect(validateName('abcdef', 2, 5).valid).toBe(false)
  })
})

describe('validatePassword', () => {
  it('유효한 비밀번호 (강함)', () => {
    const result = validatePassword('Abc123!@')
    expect(result.valid).toBe(true)
    expect(result.strength).toBe('strong')
  })

  it('중간 강도 비밀번호', () => {
    const result = validatePassword('abc123')
    expect(result.valid).toBe(true)
    expect(result.strength).toBe('medium')
  })

  it('약한 비밀번호', () => {
    const result = validatePassword('aaaaaa')
    expect(result.valid).toBe(true)
    expect(result.strength).toBe('weak')
  })

  it('빈 값이면 실패', () => {
    expect(validatePassword('').valid).toBe(false)
  })

  it('5자 이하면 실패', () => {
    expect(validatePassword('abc12').valid).toBe(false)
  })

  it('50자 초과면 실패', () => {
    expect(validatePassword('a'.repeat(51)).valid).toBe(false)
  })
})

describe('validateNumberRange', () => {
  it('범위 내 숫자 유효', () => {
    expect(validateNumberRange(50, 1, 100)).toEqual({ valid: true })
  })

  it('문자열 숫자도 유효', () => {
    expect(validateNumberRange('50', 1, 100)).toEqual({ valid: true })
  })

  it('최소값 미만이면 실패', () => {
    expect(validateNumberRange(0, 1, 100).valid).toBe(false)
  })

  it('최대값 초과면 실패', () => {
    expect(validateNumberRange(101, 1, 100).valid).toBe(false)
  })

  it('숫자가 아니면 실패', () => {
    expect(validateNumberRange('abc', 1, 100).valid).toBe(false)
  })
})

describe('validateRequired', () => {
  it('값이 있으면 유효', () => {
    expect(validateRequired('hello')).toEqual({ valid: true })
  })

  it('숫자 0도 유효', () => {
    expect(validateRequired(0)).toEqual({ valid: true })
  })

  it('null이면 실패', () => {
    expect(validateRequired(null).valid).toBe(false)
  })

  it('undefined면 실패', () => {
    expect(validateRequired(undefined).valid).toBe(false)
  })

  it('빈 문자열이면 실패', () => {
    expect(validateRequired('  ').valid).toBe(false)
  })

  it('빈 배열이면 실패', () => {
    expect(validateRequired([]).valid).toBe(false)
  })

  it('비어있지 않은 배열이면 유효', () => {
    expect(validateRequired([1])).toEqual({ valid: true })
  })
})

describe('validateGolfScore', () => {
  it('유효한 스코어 (72)', () => {
    expect(validateGolfScore(72)).toEqual({ valid: true })
  })

  it('최소 경계값 (50)', () => {
    expect(validateGolfScore(50)).toEqual({ valid: true })
  })

  it('최대 경계값 (200)', () => {
    expect(validateGolfScore(200)).toEqual({ valid: true })
  })

  it('49는 범위 밖', () => {
    expect(validateGolfScore(49).valid).toBe(false)
  })

  it('201은 범위 밖', () => {
    expect(validateGolfScore(201).valid).toBe(false)
  })
})

describe('validateFutureDate', () => {
  it('미래 날짜는 유효', () => {
    const future = new Date()
    future.setDate(future.getDate() + 1)
    expect(validateFutureDate(future)).toEqual({ valid: true })
  })

  it('빈 값이면 실패', () => {
    expect(validateFutureDate('').valid).toBe(false)
  })

  it('과거 날짜면 실패', () => {
    expect(validateFutureDate('2020-01-01').valid).toBe(false)
  })
})

describe('validateTextLength', () => {
  it('길이 이내면 유효', () => {
    expect(validateTextLength('hello', 10)).toEqual({ valid: true })
  })

  it('빈 값은 허용', () => {
    expect(validateTextLength('', 10)).toEqual({ valid: true })
  })

  it('null도 허용', () => {
    expect(validateTextLength(null, 10)).toEqual({ valid: true })
  })

  it('길이 초과면 실패', () => {
    expect(validateTextLength('hello world', 5).valid).toBe(false)
  })
})

describe('validateForm', () => {
  it('모든 규칙 통과하면 유효', () => {
    const result = validateForm(
      { email: 'test@test.com', name: '홍길동' },
      {
        email: [validateEmail],
        name: [validateName],
      }
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('실패한 필드의 에러 반환', () => {
    const result = validateForm(
      { email: 'invalid', name: '홍길동' },
      {
        email: [validateEmail],
        name: [validateName],
      }
    )
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBeDefined()
    expect(result.errors.name).toBeUndefined()
  })

  it('여러 필드 실패', () => {
    const result = validateForm(
      { email: '', name: '' },
      {
        email: [validateEmail],
        name: [validateName],
      }
    )
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(2)
  })
})
