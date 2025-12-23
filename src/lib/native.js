/**
 * 네이티브 기능 유틸리티
 * Capacitor 플러그인 래퍼
 */

import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { App } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * 네이티브 환경인지 확인
 */
export const isNative = () => Capacitor.isNativePlatform()
export const getPlatform = () => Capacitor.getPlatform() // 'ios', 'android', 'web'
export const isIOS = () => Capacitor.getPlatform() === 'ios'
export const isAndroid = () => Capacitor.getPlatform() === 'android'
export const isWeb = () => Capacitor.getPlatform() === 'web'

// ============================================
// 스플래시 스크린
// ============================================
export const splash = {
  hide: async () => {
    if (!isNative()) return
    try {
      await SplashScreen.hide()
    } catch (e) {
      console.log('SplashScreen hide error:', e)
    }
  },
  show: async () => {
    if (!isNative()) return
    try {
      await SplashScreen.show({
        autoHide: false,
        fadeInDuration: 300,
        fadeOutDuration: 300
      })
    } catch (e) {
      console.log('SplashScreen show error:', e)
    }
  }
}

// ============================================
// 상태바
// ============================================
export const statusBar = {
  setDark: async () => {
    if (!isNative()) return
    try {
      await StatusBar.setStyle({ style: Style.Dark })
      if (isAndroid()) {
        await StatusBar.setBackgroundColor({ color: '#0D0D0D' })
      }
    } catch (e) {
      console.log('StatusBar error:', e)
    }
  },
  setLight: async () => {
    if (!isNative()) return
    try {
      await StatusBar.setStyle({ style: Style.Light })
    } catch (e) {
      console.log('StatusBar error:', e)
    }
  },
  hide: async () => {
    if (!isNative()) return
    try {
      await StatusBar.hide()
    } catch (e) {
      console.log('StatusBar error:', e)
    }
  },
  show: async () => {
    if (!isNative()) return
    try {
      await StatusBar.show()
    } catch (e) {
      console.log('StatusBar error:', e)
    }
  }
}

// ============================================
// 햅틱 피드백
// ============================================
export const haptic = {
  // 가벼운 터치 (버튼 탭)
  light: async () => {
    if (!isNative()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 중간 터치 (선택)
  medium: async () => {
    if (!isNative()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 강한 터치 (확인, 완료)
  heavy: async () => {
    if (!isNative()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 성공 알림
  success: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Success })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 경고 알림
  warning: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Warning })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 에러 알림
  error: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Error })
    } catch (e) {
      console.log('Haptics error:', e)
    }
  },
  // 선택 변경
  selection: async () => {
    if (!isNative()) return
    try {
      await Haptics.selectionChanged()
    } catch (e) {
      console.log('Haptics error:', e)
    }
  }
}

// ============================================
// 키보드
// ============================================
export const keyboard = {
  hide: async () => {
    if (!isNative()) return
    try {
      await Keyboard.hide()
    } catch (e) {
      console.log('Keyboard error:', e)
    }
  },
  onShow: (callback) => {
    if (!isNative()) return () => {}
    const listener = Keyboard.addListener('keyboardWillShow', callback)
    return () => listener.remove()
  },
  onHide: (callback) => {
    if (!isNative()) return () => {}
    const listener = Keyboard.addListener('keyboardWillHide', callback)
    return () => listener.remove()
  }
}

// ============================================
// 앱 라이프사이클
// ============================================
export const app = {
  // 앱이 백그라운드로 갈 때
  onPause: (callback) => {
    if (!isNative()) return () => {}
    const listener = App.addListener('pause', callback)
    return () => listener.remove()
  },
  // 앱이 포그라운드로 올 때
  onResume: (callback) => {
    if (!isNative()) return () => {}
    const listener = App.addListener('resume', callback)
    return () => listener.remove()
  },
  // 뒤로가기 버튼 (Android)
  onBackButton: (callback) => {
    if (!isNative()) return () => {}
    const listener = App.addListener('backButton', callback)
    return () => listener.remove()
  },
  // 앱 URL 스킴 처리 (딥링크)
  onAppUrlOpen: (callback) => {
    if (!isNative()) return () => {}
    const listener = App.addListener('appUrlOpen', callback)
    return () => listener.remove()
  },
  // 앱 상태 가져오기
  getState: async () => {
    if (!isNative()) return { isActive: true }
    try {
      return await App.getState()
    } catch (e) {
      console.log('App state error:', e)
      return { isActive: true }
    }
  },
  // 앱 종료 (Android)
  exit: () => {
    if (isAndroid()) {
      App.exitApp()
    }
  }
}

// ============================================
// 푸시 알림
// ============================================
export const pushNotifications = {
  // 푸시 알림 권한 요청
  requestPermission: async () => {
    if (!isNative()) return { granted: false }
    try {
      const permission = await PushNotifications.requestPermissions()
      if (permission.receive === 'granted') {
        await PushNotifications.register()
        return { granted: true }
      }
      return { granted: false }
    } catch (e) {
      console.log('Push permission error:', e)
      return { granted: false, error: e.message }
    }
  },
  
  // 권한 상태 확인
  checkPermission: async () => {
    if (!isNative()) return { granted: false }
    try {
      const permission = await PushNotifications.checkPermissions()
      return { granted: permission.receive === 'granted' }
    } catch (e) {
      console.log('Push check error:', e)
      return { granted: false }
    }
  },
  
  // 토큰 수신 리스너
  onRegistration: (callback) => {
    if (!isNative()) return () => {}
    const listener = PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value)
      callback(token.value)
    })
    return () => listener.remove()
  },
  
  // 푸시 알림 수신 리스너 (앱이 열려있을 때)
  onPushReceived: (callback) => {
    if (!isNative()) return () => {}
    const listener = PushNotifications.addListener('pushNotificationReceived', callback)
    return () => listener.remove()
  },
  
  // 푸시 알림 탭 리스너
  onPushActionPerformed: (callback) => {
    if (!isNative()) return () => {}
    const listener = PushNotifications.addListener('pushNotificationActionPerformed', callback)
    return () => listener.remove()
  },
  
  // 에러 리스너
  onRegistrationError: (callback) => {
    if (!isNative()) return () => {}
    const listener = PushNotifications.addListener('registrationError', callback)
    return () => listener.remove()
  }
}

// ============================================
// 로컬 알림
// ============================================
export const localNotifications = {
  // 권한 요청
  requestPermission: async () => {
    if (!isNative()) return { granted: false }
    try {
      const permission = await LocalNotifications.requestPermissions()
      return { granted: permission.display === 'granted' }
    } catch (e) {
      console.log('Local notification permission error:', e)
      return { granted: false }
    }
  },
  
  // 즉시 알림 표시
  show: async ({ title, body, id = Date.now() }) => {
    if (!isNative()) {
      // 웹에서는 Web Notification API 사용
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
      }
      return
    }
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          actionTypeId: '',
          extra: null
        }]
      })
    } catch (e) {
      console.log('Local notification error:', e)
    }
  },
  
  // 예약 알림
  schedule: async ({ title, body, at, id = Date.now() }) => {
    if (!isNative()) return
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id,
          schedule: { at },
          sound: 'default'
        }]
      })
    } catch (e) {
      console.log('Local notification schedule error:', e)
    }
  },
  
  // 알림 취소
  cancel: async (ids) => {
    if (!isNative()) return
    try {
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) })
    } catch (e) {
      console.log('Local notification cancel error:', e)
    }
  },
  
  // 알림 탭 리스너
  onActionPerformed: (callback) => {
    if (!isNative()) return () => {}
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', callback)
    return () => listener.remove()
  }
}

// ============================================
// 네이티브 초기화
// ============================================
export const initializeNative = async () => {
  if (!isNative()) {
    console.log('Running on web, native features disabled')
    return
  }
  
  console.log('Initializing native features for:', getPlatform())
  
  // 상태바 설정
  await statusBar.setDark()
  
  // 스플래시 숨기기 (앱 로드 완료 후)
  setTimeout(() => {
    splash.hide()
  }, 1000)
  
  // 안드로이드 뒤로가기 버튼 처리
  if (isAndroid()) {
    let lastBackPress = 0
    app.onBackButton(({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        const now = Date.now()
        if (now - lastBackPress < 2000) {
          app.exit()
        } else {
          lastBackPress = now
          // 토스트 메시지 표시 (나중에 구현)
          console.log('한번 더 누르면 앱이 종료됩니다')
        }
      }
    })
  }
}

export default {
  isNative,
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  splash,
  statusBar,
  haptic,
  keyboard,
  app,
  pushNotifications,
  localNotifications,
  initializeNative
}

