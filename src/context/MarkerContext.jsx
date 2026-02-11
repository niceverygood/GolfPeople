import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isConnected } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { recoverPendingPurchase } from '../lib/paymentVerify'

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
  friend_request: 3,      // 친구 요청
  join_application: 5,    // 조인 신청
  profile_view: 3,        // 프로필 열람
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

  // 잔액 저장 (로컬 우선 + 서버 동기화 재시도)
  const saveBalance = useCallback((newBalance) => {
    setBalance(newBalance)
    localStorage.setItem('gp_marker_balance', newBalance.toString())

    // Supabase 동기화 (실패 시 1회 재시도)
    if (isConnected() && user) {
      const syncToServer = (retryCount = 0) => {
        supabase
          .from('marker_wallets')
          .upsert({ user_id: user.id, balance: newBalance }, { onConflict: 'user_id' })
          .then(() => {})
          .catch(err => {
            if (retryCount < 1) {
              setTimeout(() => syncToServer(retryCount + 1), 3000)
            } else {
              console.error('마커 잔액 동기화 실패 (재시도 소진):', err.message)
            }
          })
      }
      syncToServer()
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

  // 마커 사용 (서버 검증 포함)
  const spendMarkers = useCallback(async (actionType) => {
    const cost = prices[actionType]
    if (!cost) {
      return { success: false, error: 'Invalid action type' }
    }

    // 클라이언트 사전 검증 (UX용)
    if (balance < cost) {
      return { success: false, error: 'insufficient_balance', message: '마커가 부족합니다' }
    }

    // 서버 검증 (Supabase RPC 호출)
    if (isConnected() && user) {
      try {
        const { data, error } = await supabase.rpc('spend_markers', {
          p_user_id: user.id,
          p_action_type: actionType,
          p_cost: cost
        })

        if (error) {
          console.error('서버 마커 검증 실패:', error)
          // 서버 에러 시에도 로컬에서 처리 (오프라인 지원)
        } else if (data && !data.success) {
          // 서버에서 잔액 부족 판정
          return { success: false, error: 'insufficient_balance', message: data.message || '마커가 부족합니다' }
        } else if (data && data.success) {
          // 서버 검증 성공 - 서버 잔액으로 동기화
          const serverBalance = typeof data.new_balance === 'number' ? data.new_balance : balance - cost
          setBalance(serverBalance)
          localStorage.setItem('gp_marker_balance', serverBalance.toString())

          const actionDescriptions = {
            friend_request: '친구 요청',
            join_application: '조인 신청',
            profile_view: '프로필 열람'
          }

          saveTransaction({
            amount: -cost,
            type: actionType,
            description: actionDescriptions[actionType] || actionType
          })

          return { success: true, cost, newBalance: serverBalance }
        }
      } catch (e) {
        console.error('서버 마커 검증 예외:', e)
        // 네트워크 오류 시 로컬에서 처리
      }
    }

    // 로컬 처리 (오프라인 또는 서버 연결 안됨)
    const actionDescriptions = {
      friend_request: '친구 요청',
      join_application: '조인 신청',
      profile_view: '프로필 열람'
    }
    const newBalance = balance - cost
    saveBalance(newBalance)

    saveTransaction({
      amount: -cost,
      type: actionType,
      description: actionDescriptions[actionType] || actionType
    })

    return { success: true, cost, newBalance }
  }, [balance, prices, saveBalance, saveTransaction, user])

  // 마커 충전 (로컬 폴백 — 서버 검증 우선 사용 권장)
  const addMarkers = useCallback((amount, type = 'purchase', description = '마커 충전') => {
    console.warn('⚠️ addMarkers 직접 호출 (서버 검증 경로 사용 권장)')
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

  // 서버에서 실제 잔액 동기화
  const refreshWalletFromServer = useCallback(async () => {
    if (!isConnected() || !user) return
    try {
      const { data, error } = await supabase
        .from('marker_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      if (!error && data) {
        setBalance(data.balance)
        localStorage.setItem('gp_marker_balance', data.balance.toString())
        console.log('서버 잔액 동기화:', data.balance)
      }
    } catch (e) {
      console.error('서버 잔액 조회 실패:', e)
    }
  }, [user])

  // 앱 시작 시 미완료 결제 복구
  useEffect(() => {
    if (!isAuthenticated || !user) return
    recoverPendingPurchase().then(({ recovered }) => {
      if (recovered) {
        console.log('미완료 결제 복구 완료 → 서버 잔액 동기화')
        refreshWalletFromServer()
      }
    })
  }, [isAuthenticated, user, refreshWalletFromServer])

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
    useMarkers: spendMarkers, // alias (하위 호환성)
    addMarkers,
    hasEnoughMarkers,
    getCost,
    refreshWallet,
    refreshWalletFromServer,
    refreshTransactions
  }

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  )
}

export default MarkerContext
