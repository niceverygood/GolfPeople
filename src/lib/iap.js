/**
 * 인앱 결제 서비스 (RevenueCat)
 * 
 * ⚠️ 중요: 앱스토어/플레이스토어에서 디지털 상품 판매 시
 * 반드시 Apple/Google의 네이티브 결제 시스템을 사용해야 합니다.
 * 
 * RevenueCat은 Apple/Google 인앱 결제를 쉽게 구현할 수 있게 해주는 서비스입니다.
 * 
 * 설정 방법:
 * 1. https://www.revenuecat.com/ 에서 계정 생성
 * 2. 프로젝트 생성 후 API 키 발급
 * 3. Apple App Store Connect에서 인앱 상품 등록
 * 4. Google Play Console에서 인앱 상품 등록
 * 5. RevenueCat에 상품 연동
 */

import { Capacitor } from '@capacitor/core'
import { isNative, isWeb, haptic } from './native'

// RevenueCat API 키 (설정 필요)
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_API_KEY'
const REVENUECAT_ANDROID_KEY = 'YOUR_REVENUECAT_ANDROID_API_KEY'

// 상품 ID (App Store Connect / Google Play Console에서 설정)
export const PRODUCTS = {
  MARKER_5: 'kr.golfpeople.marker5',      // 마커 5개 - ₩1,100
  MARKER_10: 'kr.golfpeople.marker10',    // 마커 10개 - ₩2,200
  MARKER_30: 'kr.golfpeople.marker30',    // 마커 30개 - ₩5,500
  MARKER_50: 'kr.golfpeople.marker50',    // 마커 50개 - ₩8,800
  MARKER_100: 'kr.golfpeople.marker100',  // 마커 100개 - ₩15,000
}

// 상품 정보 (로컬 백업)
export const PRODUCT_INFO = {
  [PRODUCTS.MARKER_5]: { markers: 5, bonus: 0, tier: '₩1,100' },
  [PRODUCTS.MARKER_10]: { markers: 10, bonus: 1, tier: '₩2,200' },
  [PRODUCTS.MARKER_30]: { markers: 30, bonus: 5, tier: '₩5,500' },
  [PRODUCTS.MARKER_50]: { markers: 50, bonus: 10, tier: '₩8,800' },
  [PRODUCTS.MARKER_100]: { markers: 100, bonus: 25, tier: '₩15,000' },
}

let Purchases = null
let isConfigured = false

/**
 * RevenueCat 초기화
 */
export const initializeIAP = async (userId = null) => {
  if (!isNative()) {
    console.log('IAP: Web environment, using PortOne')
    return { success: true, native: false }
  }
  
  try {
    // 동적 import (네이티브 환경에서만)
    const module = await import('@revenuecat/purchases-capacitor')
    Purchases = module.Purchases
    
    const platform = Capacitor.getPlatform()
    const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY
    
    if (apiKey.startsWith('YOUR_')) {
      console.warn('IAP: RevenueCat API key not configured')
      return { success: false, error: 'API key not configured' }
    }
    
    await Purchases.configure({
      apiKey,
      appUserID: userId || null,
    })
    
    isConfigured = true
    console.log('IAP: RevenueCat initialized')
    
    return { success: true, native: true }
  } catch (e) {
    console.error('IAP initialization error:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 사용자 ID 설정 (로그인 후 호출)
 */
export const setUserId = async (userId) => {
  if (!isNative() || !isConfigured || !Purchases) return
  
  try {
    await Purchases.logIn({ appUserID: userId })
    console.log('IAP: User logged in:', userId)
  } catch (e) {
    console.error('IAP login error:', e)
  }
}

/**
 * 로그아웃
 */
export const logoutIAP = async () => {
  if (!isNative() || !isConfigured || !Purchases) return
  
  try {
    await Purchases.logOut()
    console.log('IAP: User logged out')
  } catch (e) {
    console.error('IAP logout error:', e)
  }
}

/**
 * 상품 목록 가져오기
 */
export const getProducts = async () => {
  if (!isNative() || !isConfigured || !Purchases) {
    // 웹 환경에서는 로컬 상품 정보 반환
    return {
      success: true,
      products: Object.entries(PRODUCT_INFO).map(([id, info]) => ({
        identifier: id,
        ...info,
        priceString: info.tier,
      }))
    }
  }
  
  try {
    const offerings = await Purchases.getOfferings()
    const currentOffering = offerings.current
    
    if (!currentOffering) {
      console.log('IAP: No offerings available')
      return { success: false, error: 'No offerings' }
    }
    
    const products = currentOffering.availablePackages.map(pkg => ({
      identifier: pkg.product.identifier,
      title: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.price,
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
      packageType: pkg.packageType,
      ...PRODUCT_INFO[pkg.product.identifier]
    }))
    
    return { success: true, products }
  } catch (e) {
    console.error('IAP getProducts error:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 상품 구매
 */
export const purchaseProduct = async (productId) => {
  if (!isNative() || !isConfigured || !Purchases) {
    return { success: false, error: 'Native IAP not available', usePortOne: true }
  }
  
  try {
    // 햅틱 피드백
    await haptic.medium()
    
    const offerings = await Purchases.getOfferings()
    const currentOffering = offerings.current
    
    if (!currentOffering) {
      return { success: false, error: 'No offerings available' }
    }
    
    // 해당 상품 패키지 찾기
    const pkg = currentOffering.availablePackages.find(
      p => p.product.identifier === productId
    )
    
    if (!pkg) {
      return { success: false, error: 'Product not found' }
    }
    
    // 구매 진행
    const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg })
    
    // 구매 성공
    await haptic.success()
    
    const productInfo = PRODUCT_INFO[productId]
    const totalMarkers = productInfo ? productInfo.markers + productInfo.bonus : 0
    
    return {
      success: true,
      transactionId: purchaseResult.transaction?.transactionIdentifier || Date.now().toString(),
      productId,
      markers: totalMarkers,
      customerInfo: purchaseResult.customerInfo
    }
  } catch (e) {
    await haptic.error()
    
    // 사용자가 취소한 경우
    if (e.code === 'PURCHASE_CANCELLED') {
      return { success: false, cancelled: true }
    }
    
    console.error('IAP purchase error:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 구매 복원 (이전 구매 복원)
 */
export const restorePurchases = async () => {
  if (!isNative() || !isConfigured || !Purchases) {
    return { success: false, error: 'Native IAP not available' }
  }
  
  try {
    const customerInfo = await Purchases.restorePurchases()
    console.log('IAP: Purchases restored', customerInfo)
    return { success: true, customerInfo }
  } catch (e) {
    console.error('IAP restore error:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 고객 정보 가져오기
 */
export const getCustomerInfo = async () => {
  if (!isNative() || !isConfigured || !Purchases) {
    return { success: false }
  }
  
  try {
    const info = await Purchases.getCustomerInfo()
    return { success: true, info }
  } catch (e) {
    console.error('IAP getCustomerInfo error:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 네이티브 환경인지 확인 (IAP 사용 가능 여부)
 */
export const shouldUseNativeIAP = () => {
  return isNative() && isConfigured
}

export default {
  initializeIAP,
  setUserId,
  logoutIAP,
  getProducts,
  purchaseProduct,
  restorePurchases,
  getCustomerInfo,
  shouldUseNativeIAP,
  PRODUCTS,
  PRODUCT_INFO
}

