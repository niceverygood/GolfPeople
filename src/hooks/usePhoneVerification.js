/**
 * 전화번호 인증 커스텀 훅
 * 5개 파일에서 반복되던 로직 통합
 */

import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { STORAGE_KEYS, getBoolean } from '../utils/storage'

/**
 * 전화번호 인증 상태 및 모달 관리 훅
 * @returns {Object} 인증 상태 및 제어 함수
 */
export const usePhoneVerification = () => {
  const { profile } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // 전화번호 인증 여부 확인
  const isVerified = profile?.phone_verified || getBoolean(STORAGE_KEYS.PHONE_VERIFIED)

  /**
   * 인증이 필요한 액션 실행 전 체크
   * @param {Function} action - 인증 후 실행할 액션
   * @param {string} message - 모달에 표시할 메시지 (옵션)
   * @returns {boolean} 인증 완료 여부 (true면 바로 실행 가능)
   */
  const requireVerification = useCallback((action, message = null) => {
    if (isVerified) {
      // 이미 인증됨 - 바로 실행
      if (action) action()
      return true
    }

    // 인증 필요 - 모달 표시
    setPendingAction({ action, message })
    setShowModal(true)
    return false
  }, [isVerified])

  /**
   * 인증 없이 체크만 하고 싶을 때
   * @returns {boolean} 인증 완료 여부
   */
  const checkVerification = useCallback(() => {
    if (!isVerified) {
      setShowModal(true)
      return false
    }
    return true
  }, [isVerified])

  /**
   * 모달 닫기
   */
  const closeModal = useCallback(() => {
    setShowModal(false)
    setPendingAction(null)
  }, [])

  /**
   * 인증 완료 후 콜백
   */
  const onVerificationComplete = useCallback(() => {
    setShowModal(false)
    if (pendingAction?.action) {
      pendingAction.action()
    }
    setPendingAction(null)
  }, [pendingAction])

  return {
    isVerified,
    showModal,
    pendingMessage: pendingAction?.message,
    requireVerification,
    checkVerification,
    closeModal,
    onVerificationComplete,
  }
}

export default usePhoneVerification
