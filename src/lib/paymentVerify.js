/**
 * 결제 서버 검증 라이브러리
 *
 * PortOne / RevenueCat 결제 완료 후 서버에서 검증하고 마커를 지급받는 함수들
 */

import { supabase, isConnected } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PENDING_PURCHASE_KEY = 'gp_pending_purchase'

/**
 * PortOne 결제 서버 검증
 * Edge Function을 호출하여 결제를 검증하고 마커를 지급받음
 *
 * @param {string} impUid - PortOne imp_uid
 * @param {string} merchantUid - 주문번호
 * @param {number} productId - 상품 ID (1~5)
 * @returns {Promise<{success: boolean, new_balance?: number, credited?: number, error?: string}>}
 */
export const verifyPortOnePayment = async (impUid, merchantUid, productId) => {
  if (!isConnected() || !SUPABASE_URL) {
    return { success: false, error: 'not_connected' }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'not_authenticated' }
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-portone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        imp_uid: impUid,
        merchant_uid: merchantUid,
        product_id: productId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || '결제 검증에 실패했습니다' }
    }

    return result
  } catch (error) {
    console.error('PortOne 검증 요청 실패:', error)
    return { success: false, error: error.message || '네트워크 오류' }
  }
}

/**
 * RevenueCat 구매 후 서버 처리 대기 (폴링)
 * 웹훅이 처리될 때까지 purchase_records를 확인
 *
 * @param {string} transactionId - RevenueCat transaction ID
 * @param {number} timeout - 최대 대기 시간 (ms), 기본 15초
 * @returns {Promise<boolean>} - 서버 처리 완료 여부
 */
export const pollPurchaseConfirmation = async (transactionId, timeout = 15000) => {
  if (!isConnected() || !supabase) return false

  const startTime = Date.now()
  const interval = 2000 // 2초 간격

  let consecutiveErrors = 0

  while (Date.now() - startTime < timeout) {
    try {
      const { data, error } = await supabase
        .from('purchase_records')
        .select('verification_status')
        .eq('transaction_id', transactionId)
        .single()

      if (data?.verification_status === 'verified') {
        return true
      }
      // PGRST116 = 레코드 없음 (정상 → 계속 폴링)
      if (error && error.code !== 'PGRST116') {
        consecutiveErrors++
        if (consecutiveErrors >= 3) {
          console.error('결제 확인 반복 에러:', error)
          return false
        }
      } else {
        consecutiveErrors = 0
      }
    } catch (e) {
      consecutiveErrors++
      if (consecutiveErrors >= 3) {
        console.error('결제 확인 네트워크 에러:', e)
        return false
      }
    }

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  return false
}

/**
 * 미완료 결제 정보를 localStorage에 저장
 * 결제 시작 시 호출하여, 앱 크래시/종료 시에도 복구 가능하게 함
 *
 * @param {Object} purchase - { transactionId, productId, markers, timestamp }
 */
export const savePendingPurchase = (purchase) => {
  try {
    localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({
      ...purchase,
      timestamp: Date.now(),
    }))
  } catch (e) {
    console.error('미완료 결제 저장 실패:', e)
  }
}

/**
 * 미완료 결제 정보 조회
 * @returns {Object|null}
 */
export const getPendingPurchase = () => {
  try {
    const data = localStorage.getItem(PENDING_PURCHASE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/**
 * 미완료 결제 정보 제거 (검증 완료 후 호출)
 */
export const clearPendingPurchase = () => {
  localStorage.removeItem(PENDING_PURCHASE_KEY)
}

/**
 * 앱 시작 시 미완료 결제 복구
 * pending purchase가 있으면 서버에서 검증 여부를 확인하고,
 * 검증 완료됐으면 서버 잔액을 동기화
 *
 * @returns {Promise<{recovered: boolean, markers?: number}>}
 */
export const recoverPendingPurchase = async () => {
  const pending = getPendingPurchase()
  if (!pending) return { recovered: false }

  // 24시간 이상 된 미완료 결제는 무시 (수동 문의 필요)
  const MAX_AGE = 24 * 60 * 60 * 1000
  if (Date.now() - pending.timestamp > MAX_AGE) {
    clearPendingPurchase()
    return { recovered: false }
  }

  if (!isConnected() || !supabase) return { recovered: false }

  try {
    const { data } = await supabase
      .from('purchase_records')
      .select('verification_status')
      .eq('transaction_id', pending.transactionId)
      .single()

    if (data?.verification_status === 'verified') {
      clearPendingPurchase()
      return { recovered: true, markers: pending.markers }
    }
  } catch {
    // 레코드 아직 없거나 조회 실패 → 다음 앱 실행 시 재시도
  }

  return { recovered: false }
}
