/**
 * 마커 사용 커스텀 훅
 * 여러 파일에서 반복되던 마커 차감 로직 통합
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarker } from '../context/MarkerContext'
import { showToast, getErrorMessage } from '../utils/errorHandler'

// 액션별 마커 비용
export const MARKER_COSTS = {
  profile_view: 3,
  friend_request: 3,
  join_application: 5,
}

/**
 * 마커 사용 훅
 * @returns {Object} 마커 상태 및 제어 함수
 */
export const useMarkerSpend = () => {
  const navigate = useNavigate()
  const { balance, spendMarkers } = useMarker()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * 마커 잔액 확인
   * @param {string} actionType - 액션 타입
   * @returns {boolean} 잔액 충분 여부
   */
  const hasEnoughBalance = useCallback((actionType) => {
    const cost = MARKER_COSTS[actionType] || 0
    return balance >= cost
  }, [balance])

  /**
   * 마커 사용 확인 모달 표시
   * @param {string} actionType - 액션 타입
   * @param {Function} onConfirm - 확인 시 실행할 함수
   * @param {Object} options - 추가 옵션
   */
  const requestSpend = useCallback((actionType, onConfirm, options = {}) => {
    const cost = MARKER_COSTS[actionType] || 0

    // 잔액 부족 체크
    if (balance < cost) {
      showToast.error(getErrorMessage('insufficient_balance'))
      if (options.navigateToStore !== false) {
        navigate('/store')
      }
      return false
    }

    // 확인 모달 표시
    setPendingAction({
      actionType,
      cost,
      onConfirm,
      ...options,
    })
    setShowConfirmModal(true)
    return true
  }, [balance, navigate])

  /**
   * 마커 사용 실행 (모달 확인 후)
   */
  const confirmSpend = useCallback(async () => {
    if (!pendingAction || isProcessing) return false

    setIsProcessing(true)

    try {
      const result = await spendMarkers(pendingAction.actionType)

      if (!result.success) {
        showToast.error(result.message || getErrorMessage('marker_spend_failed'))
        if (result.error === 'insufficient_balance') {
          navigate('/store')
        }
        return false
      }

      // 성공 - 콜백 실행
      setShowConfirmModal(false)
      if (pendingAction.onConfirm) {
        await pendingAction.onConfirm()
      }
      setPendingAction(null)
      return true
    } catch (error) {
      showToast.error(getErrorMessage('marker_spend_failed'))
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [pendingAction, isProcessing, spendMarkers, navigate])

  /**
   * 모달 닫기
   */
  const cancelSpend = useCallback(() => {
    setShowConfirmModal(false)
    setPendingAction(null)
  }, [])

  /**
   * 확인 없이 바로 마커 사용 (이미 확인받은 경우)
   * @param {string} actionType - 액션 타입
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  const spendDirect = useCallback(async (actionType) => {
    const cost = MARKER_COSTS[actionType] || 0

    if (balance < cost) {
      return { success: false, error: 'insufficient_balance' }
    }

    return await spendMarkers(actionType)
  }, [balance, spendMarkers])

  return {
    balance,
    showConfirmModal,
    pendingAction,
    isProcessing,
    hasEnoughBalance,
    requestSpend,
    confirmSpend,
    cancelSpend,
    spendDirect,
    getCost: (actionType) => MARKER_COSTS[actionType] || 0,
  }
}

export default useMarkerSpend
