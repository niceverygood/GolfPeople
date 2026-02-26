import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { db, isConnected, realtime } from '../lib/supabase'
import { getSentFriendRequests, getReceivedFriendRequests, sendFriendRequest as sendFriendRequestApi, acceptFriendRequest as acceptFriendRequestApi, rejectFriendRequest as rejectFriendRequestApi, cancelFriendRequest as cancelFriendRequestApi } from '../lib/friendService'
import { getJoins, getMyJoins, getSentJoinApplications, getReceivedJoinApplications, applyToJoin as applyToJoinApi, acceptJoinApplication, rejectJoinApplication, cancelJoinApplication as cancelJoinApplicationApi, createJoin as createJoinApi, deleteJoin as deleteJoinApi, completePastJoins, confirmJoin as confirmJoinApi, startRounding as startRoundingApi } from '../lib/joinService'
import { getNotifications, markNotificationAsRead as markNotificationAsReadApi, markAllNotificationsAsRead as markAllNotificationsAsReadApi, deleteAllNotifications as deleteAllNotificationsApi } from '../lib/notificationService'
import { mapProfileToUser, mapNotification } from '../utils/profileMapper'
import { showToast } from '../utils/errorHandler'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { user, profile } = useAuth()
  const userId = user?.id

  // === 로딩 상태 ===
  const [loading, setLoading] = useState(true)

  // === 유저 프로필 목록 (추천용) ===
  const [users, setUsers] = useState([])

  // === 조인 ===
  const [joins, setJoins] = useState([])
  const [myJoins, setMyJoins] = useState([])

  // === 좋아요 / 저장 ===
  const [likedUsers, setLikedUsers] = useState([])
  const [savedJoins, setSavedJoins] = useState([])

  // === 친구 요청 ===
  const [friendRequests, setFriendRequests] = useState([])
  const [receivedFriendRequests, setReceivedFriendRequests] = useState([])

  // === 조인 신청 ===
  const [joinApplications, setJoinApplications] = useState([])
  const [receivedJoinRequests, setReceivedJoinRequests] = useState([])

  // === 알림 ===
  const [notifications, setNotifications] = useState([])

  // === 로컬 전용 (localStorage) ===
  const [pastCards, setPastCards] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_past_cards')
      return saved ? JSON.parse(saved) : []
    } catch {
      localStorage.removeItem('gp_past_cards')
      return []
    }
  })
  const [recommendationHistory, setRecommendationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_recommendation_history')
      return saved ? JSON.parse(saved) : {}
    } catch {
      localStorage.removeItem('gp_recommendation_history')
      return {}
    }
  })

  // === currentUser (하위 호환) ===
  const currentUser = profile ? mapProfileToUser(profile) : null

  // === 로그아웃 시 전체 상태 초기화 ===
  useEffect(() => {
    if (!userId) {
      setUsers([])
      setJoins([])
      setMyJoins([])
      setLikedUsers([])
      setSavedJoins([])
      setFriendRequests([])
      setReceivedFriendRequests([])
      setJoinApplications([])
      setReceivedJoinRequests([])
      setNotifications([])
    }
  }, [userId])

  // ==============================
  // 데이터 로드
  // ==============================

  const loadAllData = useCallback(async () => {
    if (!userId || !isConnected()) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 지난 조인 자동 완료 (앱 로드 시 1회)
      completePastJoins().catch(() => {})

      const results = await Promise.allSettled([
        db.profiles.getAll(),
        getJoins(),
        getMyJoins(userId),
        db.likes.getAll(userId),
        db.savedJoins.getAll(userId),
        getSentFriendRequests(userId),
        getReceivedFriendRequests(userId),
        getSentJoinApplications(userId),
        getReceivedJoinApplications(userId),
        getNotifications(userId),
      ])

      const v = (i) => results[i].status === 'fulfilled' ? results[i].value : null
      const [profilesRes, joinsRes, myJoinsRes, likesRes, savedJoinsRes, sentFriendsRes, receivedFriendsRes, sentJoinAppsRes, receivedJoinAppsRes, notificationsRes] = results.map((_, i) => v(i))

      // 유저 프로필 (자신 제외)
      if (profilesRes?.data) {
        setUsers(profilesRes.data
          .filter(p => p.id !== userId)
          .map(p => mapProfileToUser(p))
        )
      }

      // 조인
      if (joinsRes?.success) setJoins(joinsRes.joins || [])
      if (myJoinsRes?.success) setMyJoins(myJoinsRes.joins || [])

      // 좋아요 / 저장
      if (likesRes?.data) setLikedUsers(likesRes.data.map(l => l.liked_user_id))
      if (savedJoinsRes?.data) setSavedJoins(savedJoinsRes.data.map(s => s.join_id))

      // 친구 요청
      if (sentFriendsRes?.requests) {
        setFriendRequests(sentFriendsRes.requests.map(r => ({
          id: r.id,
          userId: r.to_user_id,
          userName: r.to_user?.name || '',
          userPhoto: r.to_user?.photos?.[0] || '/default-profile.png',
          userRegion: r.to_user?.regions?.[0] || '',
          userHandicap: r.to_user?.handicap || '',
          message: r.message || '',
          status: r.status,
          createdAt: r.created_at,
          isDbRequest: true,
        })))
      }
      if (receivedFriendsRes?.requests) {
        setReceivedFriendRequests(receivedFriendsRes.requests.map(r => ({
          id: r.id,
          userId: r.from_user_id,
          userName: r.from_user?.name || '',
          userPhoto: r.from_user?.photos?.[0] || '/default-profile.png',
          userRegion: r.from_user?.regions?.[0] || '',
          userHandicap: r.from_user?.handicap || '',
          message: r.message || '',
          status: r.status,
          createdAt: r.created_at,
          isDbRequest: true,
        })))
      }

      // 조인 신청
      if (sentJoinAppsRes?.applications) {
        setJoinApplications(sentJoinAppsRes.applications.map(a => ({
          id: a.id,
          joinId: a.joinId,
          joinTitle: a.joinTitle || '',
          joinDate: a.joinDate || '',
          joinTime: a.joinTime || '',
          joinRegion: a.joinRegion || '',
          hostId: a.hostId,
          hostName: a.hostName || '',
          hostPhoto: a.hostPhoto || '/default-profile.png',
          message: a.message || '',
          status: a.status,
          createdAt: a.createdAt,
          isDbRequest: true,
        })))
      }
      if (receivedJoinAppsRes?.applications) {
        setReceivedJoinRequests(receivedJoinAppsRes.applications.map(a => ({
          id: a.id,
          userId: a.userId,
          userName: a.userName || '',
          userPhoto: a.userPhoto || '/default-profile.png',
          userRegion: a.userRegion || '',
          userHandicap: a.userHandicap || '',
          joinId: a.joinId,
          joinTitle: a.joinTitle || '',
          message: a.message || '',
          status: a.status,
          createdAt: a.createdAt,
          isDbRequest: true,
        })))
      }

      // 알림
      if (notificationsRes?.success) {
        setNotifications((notificationsRes.notifications || []).map(mapNotification))
      }
    } catch (e) {
      console.error('AppContext 데이터 로드 에러:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ==============================
  // 새로고침 함수들 (Realtime 구독보다 먼저 선언해야 TDZ 방지)
  // ==============================

  const refreshUsers = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await db.profiles.getAll()
      if (data) setUsers(data.filter(p => p.id !== userId).map(p => mapProfileToUser(p)))
    } catch (e) {
      console.error('refreshUsers 에러:', e)
    }
  }, [userId])

  const refreshJoins = useCallback(async () => {
    try {
      const result = await getJoins()
      if (result.success) setJoins(result.joins || [])
    } catch (e) {
      console.error('refreshJoins 에러:', e)
    }
  }, [])

  const refreshMyJoins = useCallback(async () => {
    if (!userId) return
    try {
      const result = await getMyJoins(userId)
      if (result.success) setMyJoins(result.joins || [])
    } catch (e) {
      console.error('refreshMyJoins 에러:', e)
    }
  }, [userId])

  const refreshFriendRequests = useCallback(async () => {
    if (!userId) return
    try {
      const [sent, received] = await Promise.all([
        getSentFriendRequests(userId),
        getReceivedFriendRequests(userId),
      ])
      if (sent.requests) {
        setFriendRequests(sent.requests.map(r => ({
          id: r.id, userId: r.to_user_id,
          userName: r.to_user?.name || '', userPhoto: r.to_user?.photos?.[0] || '',
          userRegion: r.to_user?.regions?.[0] || '', userHandicap: r.to_user?.handicap || '',
          message: r.message || '', status: r.status, createdAt: r.created_at, isDbRequest: true,
        })))
      }
      if (received.requests) {
        setReceivedFriendRequests(received.requests.map(r => ({
          id: r.id, userId: r.from_user_id,
          userName: r.from_user?.name || '', userPhoto: r.from_user?.photos?.[0] || '',
          userRegion: r.from_user?.regions?.[0] || '', userHandicap: r.from_user?.handicap || '',
          message: r.message || '', status: r.status, createdAt: r.created_at, isDbRequest: true,
        })))
      }
    } catch (e) {
      console.error('refreshFriendRequests 에러:', e)
    }
  }, [userId])

  const refreshJoinApplications = useCallback(async () => {
    if (!userId) return
    try {
      const [sent, received] = await Promise.all([
        getSentJoinApplications(userId),
        getReceivedJoinApplications(userId),
      ])
      if (sent.applications) {
        setJoinApplications(sent.applications.map(a => ({
          id: a.id, joinId: a.joinId, joinTitle: a.joinTitle || '',
          joinDate: a.joinDate || '', joinTime: a.joinTime || '', joinRegion: a.joinRegion || '',
          hostId: a.hostId, hostName: a.hostName || '', hostPhoto: a.hostPhoto || '',
          message: a.message || '', status: a.status, createdAt: a.createdAt, isDbRequest: true,
        })))
      }
      if (received.applications) {
        setReceivedJoinRequests(received.applications.map(a => ({
          id: a.id, userId: a.userId,
          userName: a.userName || '', userPhoto: a.userPhoto || '',
          userRegion: a.userRegion || '', userHandicap: a.userHandicap || '',
          joinId: a.joinId, joinTitle: a.joinTitle || '',
          message: a.message || '', status: a.status, createdAt: a.createdAt, isDbRequest: true,
        })))
      }
    } catch (e) {
      console.error('refreshJoinApplications 에러:', e)
    }
  }, [userId])

  const refreshNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const result = await getNotifications(userId)
      if (result.success) setNotifications((result.notifications || []).map(mapNotification))
    } catch (e) {
      console.error('refreshNotifications 에러:', e)
    }
  }, [userId])

  // === 실시간 알림 구독 ===
  useEffect(() => {
    if (!userId || !isConnected()) return

    const notifChannel = realtime.subscribeToNotifications(userId, (payload) => {
      const n = payload.new
      if (n) {
        setNotifications(prev => [mapNotification(n), ...prev])
      }
    })

    const friendChannel = realtime.subscribeToFriendRequests(userId, () => {
      // 친구 요청 변경 시 새로고침
      refreshFriendRequests()
    })

    return () => {
      realtime.unsubscribe(notifChannel)
      realtime.unsubscribe(friendChannel)
    }
  }, [userId, refreshFriendRequests])

  // ==============================
  // 액션 함수들 (Supabase 연동)
  // ==============================

  // 좋아요
  const likeUser = useCallback(async (targetUserId) => {
    if (!userId) return
    const prevLiked = likedUsers
    setLikedUsers(prev => [...prev, targetUserId])
    try {
      await db.likes.add(userId, targetUserId)
    } catch {
      setLikedUsers(prevLiked)
    }
  }, [userId, likedUsers])

  const unlikeUser = useCallback(async (targetUserId) => {
    if (!userId) return
    const prevLiked = likedUsers
    setLikedUsers(prev => prev.filter(id => id !== targetUserId))
    try {
      await db.likes.remove(userId, targetUserId)
    } catch {
      setLikedUsers(prevLiked)
    }
  }, [userId, likedUsers])

  // 조인 저장
  const saveJoin = useCallback(async (joinId) => {
    if (!userId) return
    const prevSaved = savedJoins
    setSavedJoins(prev => [...prev, joinId])
    try {
      await db.savedJoins.add(userId, joinId)
    } catch {
      setSavedJoins(prevSaved)
    }
  }, [userId, savedJoins])

  const unsaveJoin = useCallback(async (joinId) => {
    if (!userId) return
    const prevSaved = savedJoins
    setSavedJoins(prev => prev.filter(id => id !== joinId))
    try {
      await db.savedJoins.remove(userId, joinId)
    } catch {
      setSavedJoins(prevSaved)
    }
  }, [userId, savedJoins])

  // 친구 요청
  const sendFriendRequest = useCallback(async (targetUser, message = '') => {
    if (!userId) return false
    if (friendRequests.some(req => req.userId === targetUser.id)) return false
    const result = await sendFriendRequestApi(userId, targetUser.id, message)
    if (result.success) {
      await refreshFriendRequests()
      return true
    }
    return false
  }, [userId, friendRequests, refreshFriendRequests])

  const cancelFriendRequest = useCallback(async (requestId) => {
    const req = friendRequests.find(r => r.id === requestId)
    if (req?.isDbRequest) {
      await cancelFriendRequestApi(requestId)
    }
    setFriendRequests(prev => prev.filter(r => r.id !== requestId))
  }, [friendRequests])

  const acceptFriendRequest = useCallback(async (requestId) => {
    const result = await acceptFriendRequestApi(requestId)
    if (result.success) {
      await refreshFriendRequests()
    }
  }, [refreshFriendRequests])

  const rejectFriendRequest = useCallback(async (requestId) => {
    const result = await rejectFriendRequestApi(requestId)
    if (result.success) {
      await refreshFriendRequests()
    }
  }, [refreshFriendRequests])

  // 조인 신청
  const applyToJoin = useCallback(async (join, message = '') => {
    if (!userId) return false
    if ((join.hostId || join.host_id) === userId) return false
    if (joinApplications.some(app => app.joinId === join.id)) return false
    const result = await applyToJoinApi(userId, join.id, message)
    if (result.success) {
      await refreshJoinApplications()
      return true
    }
    return false
  }, [userId, joinApplications, refreshJoinApplications])

  const cancelJoinApplication = useCallback(async (applicationId) => {
    const prevApps = joinApplications
    setJoinApplications(prev => prev.filter(a => a.id !== applicationId))
    const result = await cancelJoinApplicationApi(applicationId, userId)
    if (!result.success) {
      setJoinApplications(prevApps)
      showToast.error('신청 취소에 실패했습니다')
    }
  }, [joinApplications, userId])

  const acceptJoinRequest = useCallback(async (requestId) => {
    const result = await acceptJoinApplication(requestId, userId)
    if (result.success) {
      await refreshJoinApplications()
      await refreshJoins()
    }
  }, [refreshJoinApplications, refreshJoins, userId])

  const rejectJoinRequest = useCallback(async (requestId) => {
    const result = await rejectJoinApplication(requestId, userId)
    if (result.success) {
      await refreshJoinApplications()
    }
  }, [refreshJoinApplications, userId])

  // 조인 생성/삭제
  const createJoin = useCallback(async (joinData) => {
    if (!userId) return { success: false, error: '로그인이 필요합니다' }
    const result = await createJoinApi(userId, joinData)
    if (result.success) {
      await refreshMyJoins()
      await refreshJoins()
      return { success: true, join: result.join }
    }
    return { success: false, error: result.error || '조인 생성에 실패했습니다' }
  }, [userId, refreshMyJoins, refreshJoins])

  const deleteMyJoin = useCallback(async (joinId) => {
    if (!userId) return
    await deleteJoinApi(joinId, userId)
    await refreshMyJoins()
    await refreshJoins()
  }, [userId, refreshMyJoins, refreshJoins])

  // 조인 확정 / 라운딩 시작
  const confirmJoin = useCallback(async (joinId) => {
    if (!userId) return { success: false }
    const result = await confirmJoinApi(joinId, userId)
    if (result.success) {
      await refreshJoins()
      await refreshMyJoins()
    }
    return result
  }, [userId, refreshJoins, refreshMyJoins])

  const startRoundingAction = useCallback(async (joinId) => {
    if (!userId) return { success: false }
    const result = await startRoundingApi(joinId, userId)
    if (result.success) {
      await refreshJoins()
      await refreshMyJoins()
    }
    return result
  }, [userId, refreshJoins, refreshMyJoins])

  // 알림
  const markNotificationAsRead = useCallback(async (notificationId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
    await markNotificationAsReadApi(notificationId)
  }, [])

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    if (userId) await markAllNotificationsAsReadApi(userId)
  }, [userId])

  const deleteNotification = useCallback(async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    try {
      await db.notifications.delete(notificationId)
    } catch (e) {
      console.error('알림 삭제 에러:', e)
    }
  }, [])

  const deleteAllNotifications = useCallback(async () => {
    setNotifications([])
    if (userId) await deleteAllNotificationsApi(userId)
  }, [userId])

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length

  // 프로필 업데이트 (하위 호환)
  const updateProfile = useCallback(() => {}, [])

  // 지난 카드 (localStorage)
  const addPastCard = useCallback((user) => {
    setPastCards(prev => {
      const filtered = prev.filter(c => c.id !== user.id)
      const updated = [{ ...user, viewedAt: new Date().toISOString() }, ...filtered]
      localStorage.setItem('gp_past_cards', JSON.stringify(updated.slice(0, 50)))
      return updated
    })
  }, [])

  // 추천 기록 (localStorage)
  const saveDailyRecommendation = useCallback((dateKey, recommendations) => {
    setRecommendationHistory(prev => {
      const newHistory = { ...prev, [dateKey]: recommendations }
      const dates = Object.keys(newHistory).sort().reverse()
      if (dates.length > 14) {
        dates.slice(14).forEach(d => delete newHistory[d])
      }
      localStorage.setItem('gp_recommendation_history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  // 매칭 불가능한 오래된 추천 히스토리 정리 + 빈 히스토리 시드 생성
  useEffect(() => {
    if (users.length === 0) return
    const userIdSet = new Set(users.map(u => u.id))

    setRecommendationHistory(prev => {
      let changed = false
      const cleaned = { ...prev }

      // 1) 매칭 불가 날짜 삭제
      Object.entries(cleaned).forEach(([date, recs]) => {
        if (!recs) return
        const allIds = Object.values(recs).flat()
        const hasMatch = allIds.some(id => userIdSet.has(id))
        if (!hasMatch) {
          delete cleaned[date]
          changed = true
        }
      })

      // 2) 유효한 과거 데이터가 없으면 최근 7일분 시드 생성
      const today = new Date().toISOString().split('T')[0]
      const pastDates = Object.keys(cleaned).filter(d => d !== today)
      if (pastDates.length === 0 && users.length >= 2) {
        const userIds = users.map(u => u.id)
        const timeSlots = ['noon', 'afternoon', 'evening', 'night']

        for (let i = 1; i <= 7; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateKey = d.toISOString().split('T')[0]
          const dateSeed = dateKey.split('-').reduce((sum, n) => sum * 100 + parseInt(n), 0)

          const dayRecs = {}
          const usedIds = new Set()
          timeSlots.forEach((slot, slotIdx) => {
            // 간단한 시드 기반 셔플
            let s = dateSeed + slotIdx * 7919
            const shuffled = [...userIds]
            for (let j = shuffled.length - 1; j > 0; j--) {
              s = (s * 1103515245 + 12345) & 0x7fffffff
              const k = s % (j + 1)
              ;[shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]]
            }
            const picked = []
            for (const id of shuffled) {
              if (picked.length >= 2) break
              if (!usedIds.has(id)) {
                picked.push(id)
                usedIds.add(id)
              }
            }
            if (picked.length < 2) {
              for (const id of shuffled) {
                if (picked.length >= 2) break
                if (!picked.includes(id)) picked.push(id)
              }
            }
            dayRecs[slot] = picked
          })
          cleaned[dateKey] = dayRecs
        }
        changed = true
      }

      if (changed) {
        localStorage.setItem('gp_recommendation_history', JSON.stringify(cleaned))
      }
      return changed ? cleaned : prev
    })
  }, [users])

  const value = useMemo(() => ({
    // 데이터
    users,
    joins,
    currentUser,
    likedUsers,
    savedJoins,
    pastCards,
    recommendationHistory,
    friendRequests,
    receivedFriendRequests,
    joinApplications,
    receivedJoinRequests,
    myJoins,
    notifications,
    unreadNotificationCount,
    loading,
    // 액션
    likeUser,
    unlikeUser,
    saveJoin,
    unsaveJoin,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    applyToJoin,
    cancelJoinApplication,
    acceptJoinRequest,
    rejectJoinRequest,
    updateProfile,
    createJoin,
    deleteMyJoin,
    confirmJoin,
    startRounding: startRoundingAction,
    addPastCard,
    saveDailyRecommendation,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    // 새로고침
    refreshUsers,
    refreshJoins,
    refreshMyJoins,
    refreshFriendRequests,
    refreshJoinApplications,
    refreshNotifications,
  }), [
    users, joins, currentUser, likedUsers, savedJoins, pastCards,
    recommendationHistory, friendRequests, receivedFriendRequests, joinApplications,
    receivedJoinRequests, myJoins, notifications, unreadNotificationCount, loading,
    likeUser, unlikeUser, saveJoin, unsaveJoin,
    sendFriendRequest, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest,
    applyToJoin, cancelJoinApplication, acceptJoinRequest, rejectJoinRequest,
    updateProfile, createJoin, deleteMyJoin, confirmJoin, startRoundingAction, addPastCard, saveDailyRecommendation,
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications,
    refreshUsers, refreshJoins, refreshMyJoins, refreshFriendRequests, refreshJoinApplications, refreshNotifications,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
