import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { Capacitor } from '@capacitor/core'

// Firebase 설정 (환경변수에서 로드)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
auth.languageCode = 'ko' // 한국어 설정

const isNative = () => Capacitor.isNativePlatform()

// reCAPTCHA 설정 (웹 전용)
export const setupRecaptcha = (containerId) => {
  if (isNative()) return null // 네이티브에서는 불필요
  if (!auth) return null

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // reCAPTCHA expired
    }
  })

  return window.recaptchaVerifier
}

// 전화번호로 인증코드 발송
export const sendVerificationCode = async (phoneNumber) => {
  const formattedPhone = formatPhoneNumber(phoneNumber)

  // 네이티브: Capacitor Firebase 플러그인 사용
  if (isNative()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
      const result = await FirebaseAuthentication.signInWithPhoneNumber({
        phoneNumber: formattedPhone,
      })
      if (!result?.verificationId) {
        console.error('verificationId가 반환되지 않음:', result)
        return { success: false, error: '전화번호 인증 서비스를 사용할 수 없습니다. 앱을 업데이트해주세요.' }
      }
      window.nativeVerificationId = result.verificationId
      return { success: true }
    } catch (error) {
      console.error('네이티브 SMS 발송 오류:', error)
      // 플러그인 미설치 또는 Firebase 미설정 시 친절한 에러
      if (error.message?.includes('not implemented') || error.message?.includes('not available')) {
        return { success: false, error: '전화번호 인증 기능이 이 기기에서 지원되지 않습니다.' }
      }
      return { success: false, error: error.message }
    }
  }

  // 웹: 기존 reCAPTCHA 방식
  if (!auth) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    const appVerifier = window.recaptchaVerifier
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
    window.confirmationResult = confirmationResult
    return { success: true, confirmationResult }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return { success: false, error: error.message }
  }
}

// 인증코드 확인 (타임아웃 포함)
export const verifyCode = async (code) => {
  // 네이티브: Capacitor Firebase 플러그인 사용
  if (isNative()) {
    if (!window.nativeVerificationId) {
      return { success: false, error: 'No verification in progress' }
    }
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
      const result = await FirebaseAuthentication.confirmVerificationCode({
        verificationId: window.nativeVerificationId,
        verificationCode: code,
      })
      return { success: true, user: result.user }
    } catch (error) {
      console.error('네이티브 인증 코드 오류:', error)
      return { success: false, error: error.message || '인증에 실패했습니다.' }
    }
  }

  // 웹: 기존 방식
  if (!window.confirmationResult) {
    return { success: false, error: 'No verification in progress' }
  }

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('인증 시간이 초과되었습니다. 다시 시도해주세요.')), 10000)
    })

    const result = await Promise.race([
      window.confirmationResult.confirm(code),
      timeoutPromise
    ])

    return { success: true, user: result.user }
  } catch (error) {
    console.error('인증 코드 오류:', error)
    return { success: false, error: error.message || '인증에 실패했습니다.' }
  }
}

// 전화번호 형식 변환 (한국)
const formatPhoneNumber = (phone) => {
  const numbers = phone.replace(/\D/g, '')

  if (numbers.startsWith('010')) {
    return '+82' + numbers.slice(1)
  }

  if (numbers.startsWith('82')) {
    return '+' + numbers
  }

  return '+82' + numbers
}

export { auth }
export const isFirebaseConfigured = () => true
