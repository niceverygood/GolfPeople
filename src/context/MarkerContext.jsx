import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isConnected } from '../lib/supabase'
import { useAuth } from './AuthContext'

const MarkerContext = createContext({})

// 기본 마커 상품 (Supabase 연결 안되어도 표시)
const DEFAULT_PRODUCTS = [
  { id: 1, name: '마커 5개', marker_amount: 5, bonus_amount: 0, price: 1000, discount_percent: 0, is_popular: false, description: '가볍게 시작하기' },
  { id: 2, name: '마커 10개', marker_amount: 10, bonus_amount: 1, price: 1900, discount_percent: 5, is_popular: false, description: '1개 보너스!' },
  { id: 3, name: '마커 30개', marker_amount: 30, bonus_amount: 5, price: 4900, discount_percent: 10, is_popular: true, description: '가장 인기있는 패키지 🔥' },
  { id: 4, name: '마커 50개', marker_amount: 50, bonus_amount: 10, price: 7900, discount_percent: 15, is_popular: false, description: '10개 보너스!' },
  { id: 5, name: '마커 100개', marker_amount: 100, bonus_amount: 25, price: 14900, discount_percent: 20, is_popular: false, description: '최고의 가성비 💎' },
]

// 기본 가격 설정 (마커 개수)
const DEFAULT_PRICES = {
  friend_request: 3,
  join_application: 5,
}

export const useMarker = () => {
  const context = useContext(MarkerContext)
  if (!context) {
    throw new Error('useMarker must be used within a MarkerProvider')
  }
  return context
}

export const MarkerProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  
  // 로컬 스토리지에서 잔액 복원
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('gp_marker_balance')
    return saved ? parseInt(saved, 10) : 10
  })
  
  const [loading, setLoading] = useState(false)
  const [products] = useState(DEFAULT_PRODUCTS)
  const [prices] = useState(DEFAULT_PRICES)
  
  // 로컬 스토리지에서 거래 내역 복원
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_marker_transactions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // 잔액 저장 (로컬 우선)
  const saveBalance = useCallback((newBalance) => {
    console.log('잔액 저장:', newBalance)
    setBalance(newBalance)
    localStorage.setItem('gp_marker_balance', newBalance.toString())
    
    // Supabase 동기화 (비동기, 에러 무시)
    if (isConnected() && user) {
      supabase
        .from('marker_wallets')
        .upsert({ user_id: user.id, balance: newBalance }, { onConflict: 'user_id' })
        .then(() => console.log('Supabase 잔액 동기화 완료'))
        .catch(err => console.log('Supabase 동기화 실패 (무시됨):', err.message))
    }
  }, [user])

  // 거래 내역 저장 (로컬 우선)
  const saveTransaction = useCallback((tx) => {
    console.log('📝 거래 내역 저장:', tx)
    
    const newTx = { 
      id: `local_${Date.now()}`, 
      ...tx, 
      created_at: new Date().toISOString() 
    }
    
    // 현재 localStorage에서 직접 불러와서 업데이트
    let currentTransactions = []
    try {
      const saved = localStorage.getItem('gp_marker_transactions')
      currentTransactions = saved ? JSON.parse(saved) : []
    } catch (e) {
      console.log('거래 내역 파싱 오류:', e)
    }
    
    const updated = [newTx, ...currentTransactions].slice(0, 50)
    localStorage.setItem('gp_marker_transactions', JSON.stringify(updated))
    setTransactions(updated)
    
    console.log('✅ 거래 내역 저장 완료:', updated.length, '건')
    
    // Supabase 동기화 (비동기, 에러 무시)
    if (isConnected() && user) {
      supabase
        .from('marker_transactions')
        .insert({ user_id: user.id, ...tx })
        .then(() => console.log('Supabase 거래내역 동기화 완료'))
        .catch(err => console.log('Supabase 동기화 실패 (무시됨):', err.message))
    }
  }, [user])

  // 마커 사용
  const spendMarkers = useCallback((actionType) => {
    const cost = prices[actionType]
    if (!cost) {
      return { success: false, error: 'Invalid action type' }
    }

    if (balance < cost) {
      return { success: false, error: 'insufficient_balance', message: '마커가 부족합니다' }
    }

    const newBalance = balance - cost
    saveBalance(newBalance)
    
    saveTransaction({
      amount: -cost,
      type: actionType,
      description: actionType === 'friend_request' ? '친구 요청' : '조인 신청'
    })
    
    return { success: true, cost, newBalance }
  }, [balance, prices, saveBalance, saveTransaction])

  // 마커 충전 (결제 후 호출)
  const addMarkers = useCallback((amount, type = 'purchase', description = '마커 충전') => {
    console.log('💰 마커 충전:', { amount, type, description })
    
    const newBalance = balance + amount
    saveBalance(newBalance)
    
    saveTransaction({
      amount: amount,
      type: type,
      description: description
    })
    
    console.log('✅ 마커 충전 완료! 새 잔액:', newBalance)
    return { success: true, newBalance }
  }, [balance, saveBalance, saveTransaction])

  // 잔액 충분한지 확인
  const hasEnoughMarkers = useCallback((actionType) => {
    const cost = prices[actionType] || 0
    return balance >= cost
  }, [balance, prices])

  // 특정 액션의 비용 가져오기
  const getCost = useCallback((actionType) => {
    return prices[actionType] || 0
  }, [prices])

  // 거래 내역 새로고침
  const refreshTransactions = useCallback(() => {
    // 로컬 데이터 사용 (이미 state에 있음)
    console.log('거래 내역:', transactions.length, '건')
  }, [transactions])

  // 지갑 새로고침
  const refreshWallet = useCallback(() => {
    console.log('현재 잔액:', balance)
  }, [balance])

  const value = {
    balance,
    loading,
    products,
    prices,
    transactions,
    spendMarkers,
    addMarkers,
    hasEnoughMarkers,
    getCost,
    refreshWallet,
    refreshTransactions
  }

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  )
}

export default MarkerContext
