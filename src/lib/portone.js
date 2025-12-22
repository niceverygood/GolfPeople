/**
 * 포트원 결제 모듈
 * KG이니시스 연동
 */

import * as PortOne from '@portone/browser-sdk/v2'

// 상점 설정 (KG이니시스)
// MID: MOIplay998
// signkey: TU5vYzk0L2Q2Z2ZaL28wN0JJczlVQT09
const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || '' // 포트원 관리자 > 상점 설정에서 확인
const CHANNEL_KEY = 'channel-key-696dc6ff-e438-4482-b6fb-d43f91db472e'

/**
 * 결제 요청
 * @param {Object} params - 결제 파라미터
 * @param {string} params.orderName - 주문명 (예: "마커 30개")
 * @param {number} params.totalAmount - 결제 금액
 * @param {string} params.paymentId - 고유 주문번호
 * @param {Object} params.customer - 고객 정보
 * @returns {Promise<Object>} - 결제 결과
 */
export const requestPayment = async ({
  orderName,
  totalAmount,
  paymentId,
  customer = {}
}) => {
  try {
    const response = await PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY,
      paymentId: paymentId || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderName,
      totalAmount,
      currency: 'CURRENCY_KRW',
      payMethod: 'CARD',
      customer: {
        fullName: customer.name || '골프피플 회원',
        phoneNumber: customer.phone || '',
        email: customer.email || '',
      },
      // 모바일 결제 후 리다이렉트 URL
      redirectUrl: `${window.location.origin}/store?payment=complete`,
      // 결제창 UI 설정
      windowType: {
        pc: 'IFRAME',
        mobile: 'REDIRECTION'
      },
      // 앱 스킴 (앱에서 결제 후 복귀용)
      appScheme: 'golfpeople',
    })

    if (response.code) {
      // 에러 발생
      return {
        success: false,
        error: response.message || '결제 중 오류가 발생했습니다.',
        code: response.code
      }
    }

    // 결제 성공
    return {
      success: true,
      paymentId: response.paymentId,
      transactionType: response.transactionType
    }
  } catch (error) {
    console.error('결제 요청 오류:', error)
    return {
      success: false,
      error: error.message || '결제 요청 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 고유 결제 ID 생성
 * @param {string} userId - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {string} - 고유 결제 ID
 */
export const generatePaymentId = (userId, productId) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 6)
  return `GP_${timestamp}_${productId}_${random}`
}

/**
 * 결제 금액 검증
 * @param {number} amount - 결제 금액
 * @returns {boolean} - 유효성 여부
 */
export const validateAmount = (amount) => {
  return amount >= 100 && amount <= 10000000 // 100원 ~ 1000만원
}

export default {
  requestPayment,
  generatePaymentId,
  validateAmount
}

