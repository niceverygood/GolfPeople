import { createPortal } from 'react-dom'

/**
 * React Portal — 모달을 DOM 트리 최상위(document.body)에 렌더링
 * 부모의 overflow, z-index, position 영향을 받지 않음
 */
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
