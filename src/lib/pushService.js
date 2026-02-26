/**
 * 푸시 알림 서비스
 * 
 * 이 서비스는 앱에서 푸시 알림을 관리합니다.
 * - FCM (Firebase Cloud Messaging) 토큰 관리
 * - 알림 권한 요청
 * - 알림 수신 처리
 * 
 * 서버 측 푸시 발송은 Supabase Edge Functions 또는 별도 백엔드에서 처리해야 합니다.
 */

import { pushNotifications, localNotifications, isNative, isWeb } from './native'
import { supabase, isConnected } from './supabase'

// 푸시 토큰 저장 키
const PUSH_TOKEN_KEY = 'gp_push_token'

/**
 * 푸시 알림 초기화
 */
export const initializePush = async (userId) => {
  if (isWeb()) {
    // 웹에서는 Web Push API 사용 (선택적)
    return initializeWebPush()
  }
  
  if (!isNative()) {
    return { success: false }
  }
  
  try {
    // 권한 요청
    const permission = await pushNotifications.requestPermission()

    if (!permission.granted) {
      return { success: false, reason: 'permission_denied' }
    }

    // 토큰 수신 리스너 설정 (register() 호출 전에 리스너 등록)
    const unsubscribeToken = pushNotifications.onRegistration(async (token) => {
      await savePushToken(token, userId)
    })

    // FCM 등록 (토큰 요청)
    await pushNotifications.register()
    
    // 푸시 알림 수신 리스너
    const unsubscribePush = pushNotifications.onPushReceived((notification) => {
      handlePushNotification(notification)
    })
    
    // 푸시 알림 탭 리스너
    const unsubscribeAction = pushNotifications.onPushActionPerformed((action) => {
      handlePushAction(action)
    })
    
    // 에러 리스너
    const unsubscribeError = pushNotifications.onRegistrationError((error) => {
      console.error('❌ 푸시 등록 에러:', error)
    })
    
    return {
      success: true,
      cleanup: () => {
        unsubscribeToken()
        unsubscribePush()
        unsubscribeAction()
        unsubscribeError()
      }
    }
  } catch (e) {
    console.error('푸시 알림 초기화 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 웹 푸시 초기화 (선택적)
 */
const initializeWebPush = async () => {
  if (!('Notification' in window)) {
    return { success: false }
  }
  
  try {
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' }
    }
    
    return { success: true }
  } catch (e) {
    console.error('웹 푸시 초기화 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * FCM 토큰 저장 (서버에)
 */
const savePushToken = async (token, userId) => {
  // 로컬 저장
  localStorage.setItem(PUSH_TOKEN_KEY, token)
  
  // 서버에 저장 (Supabase)
  if (isConnected() && userId) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: isNative() ? (window.Capacitor?.getPlatform() || 'unknown') : 'web',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
      
      if (error) {
        console.error('FCM 토큰 저장 에러:', error)
      }
    } catch (e) {
      console.error('FCM 토큰 저장 에러:', e)
    }
  }
}

/**
 * 푸시 알림 처리 (앱이 열려있을 때)
 */
const handlePushNotification = (notification) => {
  const { title, body, data } = notification
  
  // 로컬 알림으로 표시 (앱이 포그라운드일 때도 알림 표시)
  localNotifications.show({
    title: title || '골프피플',
    body: body || '',
    id: Date.now()
  })
  
  // 데이터에 따른 추가 처리
  if (data) {
    // 예: 친구 요청, 조인 신청 등
  }
}

/**
 * 푸시 알림 탭 처리
 */
const handlePushAction = (action) => {
  const { notification, actionId } = action
  const data = notification.data
  
  if (!data) return
  
  // 알림 유형에 따른 네비게이션
  switch (data.type) {
    case 'friend_request':
      // 친구 요청 보낸 사용자 프로필로 이동
      window.location.href = `/user/${data.senderId}`
      break
      
    case 'friend_accepted':
      // 친구 수락한 사용자 프로필로 이동
      window.location.href = `/user/${data.senderId}`
      break
      
    case 'join_application':
      // 조인 상세 페이지로 이동
      window.location.href = `/join/${data.joinId}`
      break

    case 'join_accepted':
    case 'join_rejected':
      // 조인 상세 페이지로 이동
      window.location.href = `/join/${data.joinId}`
      break
      
    case 'new_message':
      // 채팅 목록으로 이동
      window.location.href = '/chat'
      break

    case 'join_reminder':
      // 조인 상세 페이지로 이동
      window.location.href = `/join/${data.joinId}`
      break

    case 'review_received':
      // 리뷰 페이지로 이동
      window.location.href = '/review'
      break
      
    default:
      // 기본: 홈으로 이동
      window.location.href = '/'
  }
}

/**
 * 저장된 FCM 토큰 가져오기
 */
export const getPushToken = () => {
  return localStorage.getItem(PUSH_TOKEN_KEY)
}

/**
 * 푸시 알림 권한 상태 확인
 */
export const checkPushPermission = async () => {
  if (isWeb()) {
    if (!('Notification' in window)) return { granted: false }
    return { granted: Notification.permission === 'granted' }
  }
  
  if (!isNative()) return { granted: false }
  
  return await pushNotifications.checkPermission()
}

/**
 * 테스트 알림 보내기
 */
export const sendTestNotification = async () => {
  await localNotifications.show({
    title: '골프피플 🏌️',
    body: '푸시 알림이 정상적으로 작동합니다!',
    id: Date.now()
  })
}

export default {
  initializePush,
  getPushToken,
  checkPushPermission,
  sendTestNotification
}


