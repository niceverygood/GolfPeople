/**
 * 포트원 결제 모듈 (V1 - KG이니시스)
 */

// 가맹점 식별코드
const IMP_CODE = 'imp20122888'

/**
 * 포트원 초기화
 */
const initIMP = () => {
  if (typeof window.IMP !== 'undefined') {
    window.IMP.init(IMP_CODE)
    return true
  }
  return false
}

/**
 * 결제 요청
 * @param {Object} params - 결제 파라미터
 * @param {string} params.orderName - 주문명 (예: "마커 30개")
 * @param {number} params.totalAmount - 결제 금액
 * @param {string} params.paymentId - 고유 주문번호
 * @param {Object} params.customer - 고객 정보
 * @returns {Promise<Object>} - 결제 결과
 */
export const requestPayment = ({
  orderName,
  totalAmount,
  paymentId,
  customer = {}
}) => {
  return new Promise((resolve) => {
    if (!initIMP()) {
      resolve({
        success: false,
        error: '결제 모듈을 불러오는데 실패했습니다.'
      })
      return
    }

    const merchantUid = paymentId || `GP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    console.log('결제 요청 시작:', { orderName, totalAmount, merchantUid })
    
    window.IMP.request_pay({
      pg: 'html5_inicis.MOIplay998', // KG이니시스 MID
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: orderName,
      amount: totalAmount,
      buyer_name: customer.name || '골프피플 회원',
      buyer_email: customer.email || '',
      buyer_tel: customer.phone || '',
      m_redirect_url: `${window.location.origin}/store?payment=complete&merchant_uid=${merchantUid}`,
    }, (response) => {
      console.log('결제 응답:', response)
      
      if (response.success) {
        console.log('결제 성공!')
        resolve({
          success: true,
          paymentId: response.merchant_uid,
          impUid: response.imp_uid,
          paidAmount: response.paid_amount
        })
      } else {
        console.log('결제 실패/취소:', response.error_msg)
        resolve({
          success: false,
          error: response.error_msg || '결제가 취소되었습니다.'
        })
      }
    })
  })
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
