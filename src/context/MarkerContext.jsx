import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, db, isConnected } from '../lib/supabase'
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
// 친구 요청: 3마커 (약 450~600원)
// 조인 신청: 5마커 (약 750~1,000원)
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
  const [balance, setBalance] = useState(() => {
    // localStorage에서 잔액 복원
    const saved = localStorage.getItem('gp_marker_balance')
    return saved ? parseInt(saved, 10) : 10 // 기본 10개
  })
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [prices, setPrices] = useState(DEFAULT_PRICES)
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('gp_marker_transactions')
    return saved ? JSON.parse(saved) : []
  })

  // 지갑 정보 조회
  const fetchWallet = useCallback(async () => {
    if (!isConnected() || !user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('marker_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('지갑 조회 오류:', error)
      }

      if (data) {
        setBalance(data.balance)
      } else {
        // 지갑이 없으면 생성
        const { data: newWallet, error: createError } = await supabase
          .from('marker_wallets')
          .insert({ user_id: user.id, balance: 10 }) // 신규 보너스
          .select()
          .single()

        if (!createError && newWallet) {
          setBalance(newWallet.balance)
          
          // 보너스 거래 내역 추가
          await supabase.from('marker_transactions').insert({
            user_id: user.id,
            amount: 10,
            type: 'bonus',
            description: '신규 가입 보너스'
          })
        }
      }
    } catch (err) {
      console.error('지갑 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 상품 목록 조회
  const fetchProducts = useCallback(async () => {
    if (!isConnected()) {
      setProducts(DEFAULT_PRODUCTS)
      return
    }

    try {
      const { data, error } = await supabase
        .from('marker_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (!error && data && data.length > 0) {
        setProducts(data)
      } else {
        setProducts(DEFAULT_PRODUCTS)
      }
    } catch (err) {
      console.error('상품 조회 오류:', err)
      setProducts(DEFAULT_PRODUCTS)
    }
  }, [])

  // 가격 설정 조회
  const fetchPrices = useCallback(async () => {
    if (!isConnected()) {
      setPrices(DEFAULT_PRICES)
      return
    }

    try {
      const { data, error } = await supabase
        .from('marker_prices')
        .select('*')

      if (!error && data && data.length > 0) {
        const priceMap = {}
        data.forEach(p => {
          priceMap[p.action_type] = p.marker_cost
        })
        setPrices(priceMap)
      } else {
        setPrices(DEFAULT_PRICES)
      }
    } catch (err) {
      console.error('가격 조회 오류:', err)
      setPrices(DEFAULT_PRICES)
    }
  }, [])

  // 거래 내역 조회
  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!isConnected() || !user) return

    try {
      const { data, error } = await supabase
        .from('marker_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        setTransactions(data)
      }
    } catch (err) {
      console.error('거래내역 조회 오류:', err)
    }
  }, [user])

  // 잔액 저장 헬퍼
  const saveBalance = (newBalance) => {
    setBalance(newBalance)
    localStorage.setItem('gp_marker_balance', newBalance.toString())
  }
  
  // 거래 내역 저장 헬퍼
  const saveTransaction = (tx) => {
    const newTx = { id: Date.now(), ...tx, created_at: new Date().toISOString() }
    setTransactions(prev => {
      const updated = [newTx, ...prev]
      localStorage.setItem('gp_marker_transactions', JSON.stringify(updated.slice(0, 50)))
      return updated
    })
  }

  // 마커 사용
  const spendMarkers = async (actionType, referenceId = null) => {
    const cost = prices[actionType]
    if (!cost) {
      return { success: false, error: 'Invalid action type' }
    }

    if (balance < cost) {
      return { success: false, error: 'insufficient_balance', message: '마커가 부족합니다' }
    }

    // 로컬에서 처리
    const newBalance = balance - cost
    saveBalance(newBalance)
    
    // 거래 내역 추가
    saveTransaction({
      amount: -cost,
      type: actionType,
      description: actionType === 'friend_request' ? '친구 요청' : '조인 신청'
    })

    // Supabase 연결되어 있으면 서버에도 저장
    if (isConnected() && user) {
      try {
        await supabase.rpc('spend_markers', {
          p_user_id: user.id,
          p_amount: cost,
          p_action_type: actionType,
          p_reference_id: referenceId
        })
      } catch (err) {
        console.error('서버 동기화 오류:', err)
      }
    }
    
    return { success: true, cost }
  }

  // 마커 충전 (결제 후 호출)
  const addMarkers = async (amount, type = 'purchase', description = '마커 충전') => {
    console.log('마커 충전 시작:', { amount, type, description })
    
    // 로컬에서 처리
    const newBalance = balance + amount
    saveBalance(newBalance)
    
    // 거래 내역 추가
    saveTransaction({
      amount: amount,
      type: type,
      description: description
    })
    
    console.log('마커 충전 완료! 새 잔액:', newBalance)

    // Supabase 연결되어 있으면 서버에도 저장
    if (isConnected() && user) {
      try {
        await supabase
          .from('marker_wallets')
          .update({ balance: newBalance })
          .eq('user_id', user.id)

        await supabase.from('marker_transactions').insert({
          user_id: user.id,
          amount: amount,
          type: type,
          description: description
        })
      } catch (err) {
        console.error('서버 동기화 오류:', err)
      }
    }
    
    return { success: true, newBalance }
    
    return { success: true }
  }

  // 잔액 충분한지 확인
  const hasEnoughMarkers = (actionType) => {
    const cost = prices[actionType] || 0
    return balance >= cost
  }

  // 특정 액션의 비용 가져오기
  const getCost = (actionType) => {
    return prices[actionType] || 0
  }

  // 초기 데이터 로드 - 상품과 가격은 항상 로드
  useEffect(() => {
    // 상품과 가격은 인증 여부와 관계없이 로드
    fetchProducts()
    fetchPrices()
    setLoading(false)
  }, [])
  
  // 지갑은 인증 후 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallet()
    }
  }, [isAuthenticated, user, fetchWallet])

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
    refreshWallet: fetchWallet,
    refreshTransactions: fetchTransactions
  }

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  )
}

export default MarkerContext

