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
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

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
      // SplashScreen hide not available
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
      // SplashScreen show not available
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
      // StatusBar not available
    }
  },
  setLight: async () => {
    if (!isNative()) return
    try {
      await StatusBar.setStyle({ style: Style.Light })
    } catch (e) {
      // StatusBar not available
    }
  },
  hide: async () => {
    if (!isNative()) return
    try {
      await StatusBar.hide()
    } catch (e) {
      // StatusBar not available
    }
  },
  show: async () => {
    if (!isNative()) return
    try {
      await StatusBar.show()
    } catch (e) {
      // StatusBar not available
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
      // Haptics not available
    }
  },
  // 중간 터치 (선택)
  medium: async () => {
    if (!isNative()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch (e) {
      // Haptics not available
    }
  },
  // 강한 터치 (확인, 완료)
  heavy: async () => {
    if (!isNative()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch (e) {
      // Haptics not available
    }
  },
  // 성공 알림
  success: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Success })
    } catch (e) {
      // Haptics not available
    }
  },
  // 경고 알림
  warning: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Warning })
    } catch (e) {
      // Haptics not available
    }
  },
  // 에러 알림
  error: async () => {
    if (!isNative()) return
    try {
      await Haptics.notification({ type: NotificationType.Error })
    } catch (e) {
      // Haptics not available
    }
  },
  // 선택 변경
  selection: async () => {
    if (!isNative()) return
    try {
      await Haptics.selectionChanged()
    } catch (e) {
      // Haptics not available
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
      // Keyboard not available
    }
  },
  onShow: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    Keyboard.addListener('keyboardWillShow', callback).then(h => { handle = h })
    return () => handle?.remove()
  },
  onHide: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    Keyboard.addListener('keyboardWillHide', callback).then(h => { handle = h })
    return () => handle?.remove()
  }
}

// ============================================
// 앱 라이프사이클
// ============================================
export const app = {
  // 앱이 백그라운드로 갈 때
  onPause: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    App.addListener('pause', callback).then(h => { handle = h })
    return () => handle?.remove()
  },
  // 앱이 포그라운드로 올 때
  onResume: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    App.addListener('resume', callback).then(h => { handle = h })
    return () => handle?.remove()
  },
  // 뒤로가기 버튼 (Android)
  onBackButton: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    App.addListener('backButton', callback).then(h => { handle = h })
    return () => handle?.remove()
  },
  // 앱 URL 스킴 처리 (딥링크)
  onAppUrlOpen: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    App.addListener('appUrlOpen', callback).then(h => { handle = h })
    return () => handle?.remove()
  },
  // 앱 상태 가져오기
  getState: async () => {
    if (!isNative()) return { isActive: true }
    try {
      return await App.getState()
    } catch (e) {
      // App state not available
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
      // Firebase 설정(google-services.json)이 없으면 PushNotifications.register()에서 크래시가 발생합니다.
      // 당장 푸시가 필요 없으므로 권한 요청만 하고 등록 과정은 생략합니다.
      const permission = await PushNotifications.requestPermissions()
      return { granted: permission.receive === 'granted' }
    } catch (e) {
      // Push permission not available
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
      // Push check not available
      return { granted: false }
    }
  },
  
  // 푸시 알림 등록 (FCM 토큰 받기)
  register: async () => {
    if (!isNative()) return
    try {
      await PushNotifications.register()
    } catch (e) {
      // Push register not available
    }
  },

  // 토큰 수신 리스너
  onRegistration: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    PushNotifications.addListener('registration', (token) => {
      callback(token.value)
    }).then(h => { handle = h })
    return () => handle?.remove()
  },

  // 푸시 알림 수신 리스너 (앱이 열려있을 때)
  onPushReceived: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    PushNotifications.addListener('pushNotificationReceived', callback).then(h => { handle = h })
    return () => handle?.remove()
  },

  // 푸시 알림 탭 리스너
  onPushActionPerformed: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    PushNotifications.addListener('pushNotificationActionPerformed', callback).then(h => { handle = h })
    return () => handle?.remove()
  },

  // 에러 리스너
  onRegistrationError: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    PushNotifications.addListener('registrationError', callback).then(h => { handle = h })
    return () => handle?.remove()
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
      // Local notification permission not available
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
      // Local notification not available
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
      // Local notification schedule not available
    }
  },
  
  // 알림 취소
  cancel: async (ids) => {
    if (!isNative()) return
    try {
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) })
    } catch (e) {
      // Local notification cancel not available
    }
  },
  
  // 알림 탭 리스너
  onActionPerformed: (callback) => {
    if (!isNative()) return () => {}
    let handle = null
    LocalNotifications.addListener('localNotificationActionPerformed', callback).then(h => { handle = h })
    return () => handle?.remove()
  }
}

// ============================================
// Apple Sign In (iOS only)
// ============================================
export const appleSignIn = {
  // Apple 로그인 가능 여부 (iOS만)
  isAvailable: () => isIOS(),
  
  // Apple 로그인 실행
  signIn: async (rawNonce) => {
    if (!isIOS()) {
      return { success: false, error: 'Apple Sign In is only available on iOS' }
    }

    try {
      const options = {
        clientId: 'com.bottle.golfpeople',
        redirectURI: 'https://golf-people.vercel.app/auth/callback',
        scopes: 'email name',
        state: 'golfpeople_state',
      }

      // nonce가 전달된 경우에만 설정 (Supabase signInWithIdToken과 동일한 nonce 사용)
      if (rawNonce) {
        options.nonce = rawNonce
      }

      const result = await SignInWithApple.authorize(options)

      return {
        success: true,
        response: result.response,
        // Apple은 최초 로그인 시에만 이메일/이름을 제공
        user: {
          id: result.response.user,
          email: result.response.email || null,
          name: result.response.givenName
            ? `${result.response.givenName} ${result.response.familyName || ''}`.trim()
            : null,
          identityToken: result.response.identityToken,
          authorizationCode: result.response.authorizationCode,
        }
      }
    } catch (error) {
      console.error('Apple Sign In error:', error)
      return {
        success: false,
        error: error.message || 'Apple Sign In failed'
      }
    }
  }
}

// ============================================
// 네이티브 초기화
// ============================================
export const initializeNative = async () => {
  if (!isNative()) {
    return
  }
  
  // 상태바 설정 — overlay 모드로 WebView 위에 겹치게
  try {
    await StatusBar.setOverlaysWebView({ overlay: true })
  } catch (e) {
    // setOverlaysWebView not available
  }
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
          // 토스트 메시지 표시
          import('./toastStore.js').then(({ toast }) => {
            toast.info('한번 더 누르면 앱이 종료됩니다')
          })
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
  appleSignIn,
  initializeNative
}


