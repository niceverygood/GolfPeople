import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, db, isConnected } from '../lib/supabase'
import { useAuth } from './AuthContext'

const MarkerContext = createContext({})

export const useMarker = () => {
  const context = useContext(MarkerContext)
  if (!context) {
    throw new Error('useMarker must be used within a MarkerProvider')
  }
  return context
}

export const MarkerProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [prices, setPrices] = useState({})
  const [transactions, setTransactions] = useState([])

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
    if (!isConnected()) return

    try {
      const { data, error } = await supabase
        .from('marker_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (!error && data) {
        setProducts(data)
      }
    } catch (err) {
      console.error('상품 조회 오류:', err)
    }
  }, [])

  // 가격 설정 조회
  const fetchPrices = useCallback(async () => {
    if (!isConnected()) return

    try {
      const { data, error } = await supabase
        .from('marker_prices')
        .select('*')

      if (!error && data) {
        const priceMap = {}
        data.forEach(p => {
          priceMap[p.action_type] = p.marker_cost
        })
        setPrices(priceMap)
      }
    } catch (err) {
      console.error('가격 조회 오류:', err)
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

  // 마커 사용
  const spendMarkers = async (actionType, referenceId = null) => {
    if (!isConnected() || !user) {
      return { success: false, error: 'Not connected' }
    }

    const cost = prices[actionType]
    if (!cost) {
      return { success: false, error: 'Invalid action type' }
    }

    if (balance < cost) {
      return { success: false, error: 'insufficient_balance', message: '마커가 부족합니다' }
    }

    try {
      // RPC 함수 호출로 마커 사용
      const { data, error } = await supabase.rpc('spend_markers', {
        p_user_id: user.id,
        p_amount: cost,
        p_action_type: actionType,
        p_reference_id: referenceId
      })

      if (error) {
        console.error('마커 사용 오류:', error)
        return { success: false, error: error.message }
      }

      // 잔액 업데이트
      setBalance(prev => prev - cost)
      
      return { success: true, cost }
    } catch (err) {
      console.error('마커 사용 오류:', err)
      return { success: false, error: err.message }
    }
  }

  // 마커 충전 (결제 후 호출)
  const addMarkers = async (amount, type = 'purchase', description = '마커 충전') => {
    if (!isConnected() || !user) {
      return { success: false, error: 'Not connected' }
    }

    try {
      // 지갑 업데이트
      const { error: walletError } = await supabase
        .from('marker_wallets')
        .update({ 
          balance: balance + amount,
          total_purchased: supabase.raw(`total_purchased + ${amount}`)
        })
        .eq('user_id', user.id)

      if (walletError) throw walletError

      // 거래 내역 추가
      const { error: txError } = await supabase
        .from('marker_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: type,
          description: description
        })

      if (txError) throw txError

      setBalance(prev => prev + amount)
      
      return { success: true }
    } catch (err) {
      console.error('마커 충전 오류:', err)
      return { success: false, error: err.message }
    }
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

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet()
      fetchProducts()
      fetchPrices()
    }
  }, [isAuthenticated, fetchWallet, fetchProducts, fetchPrices])

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

