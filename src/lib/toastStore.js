/**
 * 모듈 레벨 토스트 이벤트 스토어
 * React 외부(서비스, 유틸)에서도 토스트를 발행할 수 있음
 */

let listeners = []
let idCounter = 0

export const subscribe = (fn) => {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter(l => l !== fn)
  }
}

const emit = (toastData) => {
  const toast = { id: ++idCounter, ...toastData }
  listeners.forEach(fn => fn(toast))
}

export const toast = {
  success: (message) => emit({ type: 'success', message }),
  error: (message) => emit({ type: 'error', message }),
  warning: (message) => emit({ type: 'warning', message }),
  info: (message) => emit({ type: 'info', message }),
}
