import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

// Firebase 설정 (Firebase Console에서 가져온 값으로 교체 필요)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Firebase 초기화
let app = null
let auth = null

const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId

if (!isMissingConfig) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  auth.languageCode = 'ko' // 한국어 설정
} else {
  console.warn('⚠️ Firebase 설정이 없습니다. 전화번호 인증이 비활성화됩니다.')
}

// reCAPTCHA 설정
export const setupRecaptcha = (containerId) => {
  if (!auth) return null
  
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved')
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired')
    }
  })
  
  return window.recaptchaVerifier
}

// 전화번호로 인증코드 발송
export const sendVerificationCode = async (phoneNumber) => {
  if (!auth) {
    return { success: false, error: 'Firebase not configured' }
  }
  
  try {
    // 한국 전화번호 형식으로 변환 (+82)
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const appVerifier = window.recaptchaVerifier
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
    
    // 확인 결과를 window에 저장 (나중에 코드 확인에 사용)
    window.confirmationResult = confirmationResult
    
    return { success: true, confirmationResult }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return { success: false, error: error.message }
  }
}

// 인증코드 확인
export const verifyCode = async (code) => {
  if (!window.confirmationResult) {
    return { success: false, error: 'No verification in progress' }
  }
  
  try {
    const result = await window.confirmationResult.confirm(code)
    return { success: true, user: result.user }
  } catch (error) {
    console.error('인증 코드 오류:', error)
    return { success: false, error: error.message }
  }
}

// 전화번호 형식 변환 (한국)
const formatPhoneNumber = (phone) => {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '')
  
  // 010으로 시작하면 +82로 변환
  if (numbers.startsWith('010')) {
    return '+82' + numbers.slice(1)
  }
  
  // 이미 +82로 시작하면 그대로
  if (numbers.startsWith('82')) {
    return '+' + numbers
  }
  
  // 그 외에는 +82 추가
  return '+82' + numbers
}

export { auth }
export const isFirebaseConfigured = () => !isMissingConfig

