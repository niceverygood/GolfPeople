import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAMJ8gdZ6hvZhVnZ-DpEWDzpsu1LlrSHKs",
  authDomain: "golfpeople-9cbb0.firebaseapp.com",
  databaseURL: "https://golfpeople-9cbb0.firebaseio.com",
  projectId: "golfpeople-9cbb0",
  storageBucket: "golfpeople-9cbb0.firebasestorage.app",
  messagingSenderId: "625021580962",
  appId: "1:625021580962:web:e9167bd102a25c7f5b89fb",
  measurementId: "G-MFZVF6BZV5"
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
auth.languageCode = 'ko' // 한국어 설정

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

// 인증코드 확인 (타임아웃 포함)
export const verifyCode = async (code) => {
  if (!window.confirmationResult) {
    return { success: false, error: 'No verification in progress' }
  }
  
  try {
    // 10초 타임아웃
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
export const isFirebaseConfigured = () => true

