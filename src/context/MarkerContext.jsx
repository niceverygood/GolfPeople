import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isConnected } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { recoverPendingPurchase } from '../lib/paymentVerify'

const MarkerContext = createContext(null)

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

  // 잔액 저장 (로컬 캐시만 — 서버 동기화는 RPC 결과로만)
  const saveBalanceLocal = useCallback((newBalance) => {
    setBalance(newBalance)
    localStorage.setItem('gp_marker_balance', newBalance.toString())
  }, [])

  // 거래 내역 저장 (로컬 우선)
  const saveTransaction = useCallback(async (tx) => {
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
      // 거래 내역 파싱 오류
    }
    
    const updated = [newTx, ...currentTransactions].slice(0, 50)
    localStorage.setItem('gp_marker_transactions', JSON.stringify(updated))
    setTransactions(updated)
    
    // Supabase 동기화
    if (isConnected() && user) {
      try {
        await supabase
          .from('marker_transactions')
          .insert({ user_id: user.id, ...tx })
      } catch (err) {
        console.error('Supabase 거래 동기화 실패:', err.message)
      }
    }
  }, [user])

  // 마커 사용 (서버 검증 필수 — 로컬 fallback 제거)
  const spendMarkers = useCallback(async (actionType) => {
    const cost = prices[actionType]
    if (!cost) {
      return { success: false, error: 'Invalid action type' }
    }

    // 클라이언트 사전 검증 (UX용 — 실제 검증은 서버)
    if (balance < cost) {
      return { success: false, error: 'insufficient_balance', message: '마커가 부족합니다' }
    }

    // 서버 검증 필수 (Supabase RPC 호출)
    if (!isConnected() || !user) {
      return { success: false, error: 'network_error', message: '네트워크 연결을 확인해주세요' }
    }

    try {
      const { data, error } = await supabase.rpc('spend_markers', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_cost: cost  // 하위 호환성 유지, 서버에서는 무시하고 marker_prices에서 조회
      })

      if (error) {
        console.error('서버 마커 검증 실패:', error)
        return { success: false, error: 'server_error', message: '서버 오류가 발생했습니다. 다시 시도해주세요.' }
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'insufficient_balance', message: data.message || '마커가 부족합니다' }
      }

      if (data && data.success) {
        // 서버 잔액으로 동기화
        const serverBalance = typeof data.new_balance === 'number' ? data.new_balance : balance - cost
        saveBalanceLocal(serverBalance)

        saveTransaction({
          amount: -(data.cost || cost),
          type: actionType,
          description: actionType === 'friend_request' ? '친구 요청' :
                       actionType === 'join_application' ? '조인 신청' :
                       actionType === 'profile_view' ? '프로필 열람' : actionType
        })

        return { success: true, cost: data.cost || cost, newBalance: serverBalance }
      }

      return { success: false, error: 'unknown_error', message: '알 수 없는 오류가 발생했습니다' }
    } catch (e) {
      console.error('서버 마커 검증 예외:', e)
      return { success: false, error: 'network_error', message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
    }
  }, [balance, prices, saveBalanceLocal, saveTransaction, user])

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
  }, [transactions])

  // 서버에서 실제 잔액 동기화 (addMarkers보다 먼저 선언해야 TDZ 방지)
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
        // 서버 잔액 동기화 완료
      }
    } catch (e) {
      console.error('서버 잔액 조회 실패:', e)
    }
  }, [user])

  // 마커 충전 (결제 검증 후 서버 잔액 동기화 — 웹훅 처리 대기 포함)
  const addMarkers = useCallback(async (amount, type = 'purchase', description = '마커 충전') => {
    if (!user) return { success: false }
    const prevBalance = balance
    // 웹훅 처리 시간을 고려해 최대 3회 재시도 (1초 간격)
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from('marker_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      if (data && data.balance > prevBalance) {
        setBalance(data.balance)
        localStorage.setItem('gp_marker_balance', data.balance.toString())
        return { success: true }
      }
      if (i < 2) await new Promise(r => setTimeout(r, 1000))
    }
    // 3회 시도 후에도 잔액 미반영이면 마지막 서버 값으로 동기화
    await refreshWalletFromServer()
    return { success: false, error: 'webhook_pending' }
  }, [refreshWalletFromServer, balance, user])

  // 앱 시작 시 서버 잔액 동기화 + 미완료 결제 복구
  useEffect(() => {
    if (!isAuthenticated || !user) return
    // ★ 보안: 항상 서버 잔액으로 동기화 (localStorage 조작 방지)
    refreshWalletFromServer()
    recoverPendingPurchase().then(({ recovered }) => {
      if (recovered) {
        // 미완료 결제 복구 완료
        refreshWalletFromServer()
      }
    })
  }, [isAuthenticated, user, refreshWalletFromServer])

  // 지갑 새로고침
  const refreshWallet = useCallback(() => {
    // 현재 잔액 조회
  }, [balance])

  const value = useMemo(() => ({
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
  }), [balance, loading, products, prices, transactions, spendMarkers,
       addMarkers, hasEnoughMarkers, getCost, refreshWallet, refreshWalletFromServer, refreshTransactions])

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  )
}

export default MarkerContext
