import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Coins, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Gift,
  CreditCard,
  History,
  X,
  Smartphone
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMarker } from '../context/MarkerContext'
import { useAuth } from '../context/AuthContext'
import { requestPayment, generatePaymentId } from '../lib/portone'
import { isNative } from '../lib/native'
import { shouldUseNativeIAP, purchaseProduct as nativePurchase, PRODUCT_INFO, PRODUCTS } from '../lib/iap'
import { haptic } from '../lib/native'

// 마커 아이콘 컴포넌트
const MarkerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#markerGradient)" />
    <path d="M12 6L14.5 11H17L12 18L7 11H9.5L12 6Z" fill="#0D0D0D" />
    <defs>
      <linearGradient id="markerGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D4AF37" />
        <stop offset="1" stopColor="#B8962E" />
      </linearGradient>
    </defs>
  </svg>
)

// 상품 카드 컴포넌트
const ProductCard = ({ product, onPurchase, isSelected }) => {
  const totalMarkers = product.marker_amount + product.bonus_amount
  const originalPrice = Math.round(product.price / (1 - product.discount_percent / 100))
  
  return (
    <motion.button
      onClick={() => onPurchase(product)}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full p-4 rounded-2xl border-2 transition-all text-left ${
        isSelected 
          ? 'border-gp-gold bg-gp-gold/10' 
          : 'border-gp-border bg-gp-card hover:border-gp-gold/50'
      }`}
    >
      {/* 인기 뱃지 */}
      {product.is_popular && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          인기
        </div>
      )}
      
      {/* 할인 뱃지 */}
      {product.discount_percent > 0 && (
        <div className="absolute -top-2 left-3 bg-gp-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
          {product.discount_percent}% OFF
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gp-gold/20 to-yellow-600/20 flex items-center justify-center">
            <MarkerIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{product.marker_amount}</span>
              {product.bonus_amount > 0 && (
                <span className="text-sm text-gp-gold">+{product.bonus_amount} 보너스</span>
              )}
            </div>
            <p className="text-xs text-gp-text-secondary">{product.description}</p>
          </div>
        </div>
        
        <div className="text-right">
          {product.discount_percent > 0 && (
            <p className="text-xs text-gp-text-secondary line-through">
              ₩{originalPrice.toLocaleString()}
            </p>
          )}
          <p className="text-lg font-bold text-gp-gold">
            ₩{product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

// 거래 내역 아이템
const TransactionItem = ({ transaction }) => {
  const isPositive = transaction.amount > 0
  
  const getIcon = () => {
    switch (transaction.type) {
      case 'purchase': return <CreditCard className="w-4 h-4" />
      case 'bonus': return <Gift className="w-4 h-4" />
      case 'spend': return <Coins className="w-4 h-4" />
      case 'refund': return <TrendingUp className="w-4 h-4" />
      default: return <Coins className="w-4 h-4" />
    }
  }
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gp-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {getIcon()}
        </div>
        <div>
          <p className="text-sm font-medium">{transaction.description}</p>
          <p className="text-xs text-gp-text-secondary">
            {new Date(transaction.created_at).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{transaction.amount}
      </span>
    </div>
  )
}

export default function Store() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { balance, products, prices, transactions, refreshTransactions, addMarkers } = useMarker()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState(null)

  useEffect(() => {
    refreshTransactions()
    
    // 모바일 결제 후 리다이렉트 처리
    const paymentComplete = searchParams.get('payment')
    if (paymentComplete === 'complete') {
      // URL에서 결제 완료 파라미터 제거
      navigate('/store', { replace: true })
    }
  }, [])

  // 네이티브 IAP 사용 여부 확인
  const useNativeIAP = shouldUseNativeIAP()
  
  // 네이티브 상품 ID 매핑
  const getNativeProductId = (product) => {
    const markerCount = product.marker_amount
    if (markerCount === 5) return PRODUCTS.MARKER_5
    if (markerCount === 10) return PRODUCTS.MARKER_10
    if (markerCount === 30) return PRODUCTS.MARKER_30
    if (markerCount === 50) return PRODUCTS.MARKER_50
    if (markerCount === 100) return PRODUCTS.MARKER_100
    return null
  }

  // 결제 처리 (네이티브 IAP 또는 포트원)
  const handlePurchase = async () => {
    if (!selectedProduct) return
    
    // 햅틱 피드백
    await haptic.medium()
    
    setPurchasing(true)
    
    try {
      // 네이티브 앱에서는 Apple/Google IAP 사용
      if (useNativeIAP) {
        const nativeProductId = getNativeProductId(selectedProduct)
        if (!nativeProductId) {
          throw new Error('상품을 찾을 수 없습니다')
        }
        
        const result = await nativePurchase(nativeProductId)
        setPurchasing(false)
        
        if (result.success) {
          await haptic.success()
          const totalMarkers = result.markers || (selectedProduct.marker_amount + selectedProduct.bonus_amount)
          addMarkers(totalMarkers, 'purchase', `${selectedProduct.name} 구매`)
          setPurchaseResult({ success: true, amount: totalMarkers })
        } else if (result.cancelled) {
          // 사용자가 취소
          setShowPayment(false)
          setSelectedProduct(null)
        } else {
          await haptic.error()
          setPurchaseResult({ success: false, error: result.error || '결제에 실패했습니다' })
          setTimeout(() => setPurchaseResult(null), 3000)
        }
        return
      }
      
      // 웹에서는 포트원 사용
      const paymentId = generatePaymentId(
        user?.id || 'guest',
        selectedProduct.id
      )
      
      // 포트원 결제 요청
      const paymentResult = await requestPayment({
        orderName: selectedProduct.name,
        totalAmount: selectedProduct.price,
        paymentId,
        customer: {
          name: user?.profile?.name || '골프피플 회원',
          email: user?.email || '',
          phone: user?.profile?.phone || ''
        }
      })
      
      console.log('결제 결과:', paymentResult)
      
      setPurchasing(false) // 결제창 닫히면 바로 로딩 해제
      
      if (paymentResult.success) {
        // 결제 성공 - 마커 충전
        const totalMarkers = selectedProduct.marker_amount + selectedProduct.bonus_amount
        console.log('💰 마커 충전 요청:', totalMarkers)
        
        try {
          const result = addMarkers(
            totalMarkers, 
            'purchase', 
            `${selectedProduct.name} 구매`
          )
          console.log('✅ 마커 충전 결과:', result)
        } catch (markerError) {
          console.error('마커 충전 오류:', markerError)
        }
        
        // 충전 완료 팝업 표시 (확인 버튼 누르면 새로고침)
        setPurchaseResult({ success: true, amount: totalMarkers })
      } else {
        // 결제 실패 또는 취소
        if (paymentResult.error) {
          setPurchaseResult({ success: false, error: paymentResult.error })
          setTimeout(() => {
            setPurchaseResult(null)
          }, 3000)
        } else {
          // 사용자가 결제창을 닫은 경우
          setShowPayment(false)
          setSelectedProduct(null)
        }
      }
    } catch (error) {
      console.error('결제 오류:', error)
      setPurchasing(false)
      setPurchaseResult({ success: false, error: error.message || '결제 중 오류가 발생했습니다.' })
      setTimeout(() => {
        setPurchaseResult(null)
      }, 3000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gp-black"
    >
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gp-black/95 backdrop-blur-lg border-b border-gp-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">마커 스토어</h1>
          <button 
            onClick={() => { setShowHistory(true); refreshTransactions(); }}
            className="p-2 -mr-2"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 pb-32">
        {/* 내 마커 잔액 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-gp-gold/20 via-yellow-600/10 to-gp-card rounded-3xl p-6 border border-gp-gold/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gp-text-secondary mb-1">내 마커</p>
              <div className="flex items-center gap-2">
                <MarkerIcon className="w-8 h-8" />
                <span className="text-4xl font-bold">{balance}</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-gp-gold/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gp-gold" />
            </div>
          </div>
          
          {/* 사용처 안내 */}
          <div className="mt-4 pt-4 border-t border-gp-gold/20 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-gp-surface flex items-center justify-center">
                <MarkerIcon className="w-4 h-4" />
              </div>
              <span className="text-gp-text-secondary">
                친구 요청 <span className="text-gp-gold font-medium">{prices.friend_request || 3}개</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-gp-surface flex items-center justify-center">
                <MarkerIcon className="w-4 h-4" />
              </div>
              <span className="text-gp-text-secondary">
                조인 신청 <span className="text-gp-gold font-medium">{prices.join_application || 5}개</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* 상품 목록 */}
        <div>
          <h2 className="text-lg font-bold mb-3">마커 충전</h2>
          <div className="space-y-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onPurchase={(p) => {
                    setSelectedProduct(p)
                    setShowPayment(true)
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="bg-gp-surface rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gp-gold flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gp-text-secondary">
              <p className="font-medium text-white mb-1">마커 사용 안내</p>
              <ul className="space-y-1">
                <li>• 친구 요청 시 마커 {prices.friend_request || 3}개가 사용됩니다 (약 500원)</li>
                <li>• 조인 신청 시 마커 {prices.join_application || 5}개가 사용됩니다 (약 800원)</li>
                <li>• 상대방이 거절해도 마커는 환불되지 않습니다</li>
                <li>• 구매한 마커는 환불이 불가능합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      <AnimatePresence>
        {showPayment && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
            onClick={() => !purchasing && setShowPayment(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gp-card rounded-t-3xl p-6"
            >
              {purchaseResult ? (
                // 결제 결과
                <div className="text-center py-6">
                  {purchaseResult.success ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-gp-gold/30 to-yellow-500/20 flex items-center justify-center mx-auto mb-5"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, type: 'spring' }}
                        >
                          <CheckCircle2 className="w-12 h-12 text-gp-gold" />
                        </motion.div>
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold mb-3"
                      >
                        🎉 충전 완료!
                      </motion.h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gp-surface rounded-xl p-4 mb-6"
                      >
                        <div className="flex items-center justify-center gap-2 text-xl">
                          <MarkerIcon className="w-6 h-6" />
                          <span className="font-bold text-gp-gold">{purchaseResult.amount}개</span>
                          <span className="text-gp-text-secondary">충전되었습니다</span>
                        </div>
                      </motion.div>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => {
                          setShowPayment(false)
                          setPurchaseResult(null)
                          setSelectedProduct(null)
                        }}
                        className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-gp-gold to-yellow-500 text-black"
                      >
                        확인
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">결제 실패</h3>
                      <p className="text-gp-text-secondary mb-6">{purchaseResult.error}</p>
                      <button
                        onClick={() => {
                          setPurchaseResult(null)
                          setShowPayment(false)
                        }}
                        className="w-full py-3 rounded-xl font-medium bg-gp-surface"
                      >
                        닫기
                      </button>
                    </>
                  )}
                </div>
              ) : (
                // 결제 확인
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">결제 확인</h3>
                    <button onClick={() => setShowPayment(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-gp-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gp-text-secondary">상품</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gp-text-secondary">마커</span>
                      <div className="flex items-center gap-1">
                        <MarkerIcon className="w-4 h-4" />
                        <span className="font-medium">{selectedProduct.marker_amount}</span>
                        {selectedProduct.bonus_amount > 0 && (
                          <span className="text-gp-gold text-sm">+{selectedProduct.bonus_amount}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gp-border">
                      <span className="font-medium">결제 금액</span>
                      <span className="text-xl font-bold text-gp-gold">
                        ₩{selectedProduct.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-gp-gold to-yellow-500 text-black disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {purchasing ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        <span>결제 처리 중...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>결제하기</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gp-text-secondary mt-3">
                    {useNativeIAP ? (
                      <span className="flex items-center justify-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {isNative() && window.Capacitor?.getPlatform() === 'ios' ? 'Apple Pay' : 'Google Pay'}로 결제됩니다
                      </span>
                    ) : (
                      '신용카드/간편결제로 결제됩니다'
                    )}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 거래 내역 모달 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gp-card rounded-t-3xl p-6 max-h-[70vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">거래 내역</h3>
                <button onClick={() => setShowHistory(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gp-text-secondary mx-auto mb-3" />
                    <p className="text-gp-text-secondary">거래 내역이 없습니다</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


