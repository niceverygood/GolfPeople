import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { db, isConnected, realtime } from '../lib/supabase'
import { getSentFriendRequests, getReceivedFriendRequests, sendFriendRequest as sendFriendRequestApi, acceptFriendRequest as acceptFriendRequestApi, rejectFriendRequest as rejectFriendRequestApi, cancelFriendRequest as cancelFriendRequestApi } from '../lib/friendService'
import { getJoins, getMyJoins, getSentJoinApplications, getReceivedJoinApplications, applyToJoin as applyToJoinApi, acceptJoinApplication, rejectJoinApplication, cancelJoinApplication as cancelJoinApplicationApi, createJoin as createJoinApi, deleteJoin as deleteJoinApi } from '../lib/joinService'
import { getNotifications, markNotificationAsRead as markNotificationAsReadApi, markAllNotificationsAsRead as markAllNotificationsAsReadApi } from '../lib/notificationService'
import { mapProfileToUser, mapNotification } from '../utils/profileMapper'

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
  const [proposals, setProposals] = useState([])
  const [pastCards, setPastCards] = useState(() => {
    const saved = localStorage.getItem('gp_past_cards')
    return saved ? JSON.parse(saved) : []
  })
  const [recommendationHistory, setRecommendationHistory] = useState(() => {
    const saved = localStorage.getItem('gp_recommendation_history')
    return saved ? JSON.parse(saved) : {}
  })

  // === currentUser (하위 호환) ===
  const currentUser = profile ? mapProfileToUser(profile) : null

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
      const [
        profilesRes,
        joinsRes,
        myJoinsRes,
        likesRes,
        savedJoinsRes,
        sentFriendsRes,
        receivedFriendsRes,
        sentJoinAppsRes,
        receivedJoinAppsRes,
        notificationsRes,
      ] = await Promise.all([
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

      // 유저 프로필 (자신 제외)
      if (profilesRes.data) {
        setUsers(profilesRes.data
          .filter(p => p.id !== userId)
          .map(p => mapProfileToUser(p))
        )
      }

      // 조인
      if (joinsRes.success) setJoins(joinsRes.joins || [])
      if (myJoinsRes.success) setMyJoins(myJoinsRes.joins || [])

      // 좋아요 / 저장
      if (likesRes.data) setLikedUsers(likesRes.data.map(l => l.liked_user_id))
      if (savedJoinsRes.data) setSavedJoins(savedJoinsRes.data.map(s => s.join_id))

      // 친구 요청
      if (sentFriendsRes.requests) {
        setFriendRequests(sentFriendsRes.requests.map(r => ({
          id: r.id,
          userId: r.to_user_id,
          userName: r.to_user?.name || '',
          userPhoto: r.to_user?.photos?.[0] || 'https://via.placeholder.com/100',
          userRegion: r.to_user?.regions?.[0] || '',
          userHandicap: r.to_user?.handicap || '',
          message: r.message || '',
          status: r.status,
          createdAt: r.created_at,
          isDbRequest: true,
        })))
      }
      if (receivedFriendsRes.requests) {
        setReceivedFriendRequests(receivedFriendsRes.requests.map(r => ({
          id: r.id,
          userId: r.from_user_id,
          userName: r.from_user?.name || '',
          userPhoto: r.from_user?.photos?.[0] || 'https://via.placeholder.com/100',
          userRegion: r.from_user?.regions?.[0] || '',
          userHandicap: r.from_user?.handicap || '',
          message: r.message || '',
          status: r.status,
          createdAt: r.created_at,
          isDbRequest: true,
        })))
      }

      // 조인 신청
      if (sentJoinAppsRes.applications) {
        setJoinApplications(sentJoinAppsRes.applications.map(a => ({
          id: a.id,
          joinId: a.joinId,
          joinTitle: a.joinTitle || '',
          joinDate: a.joinDate || '',
          joinTime: a.joinTime || '',
          joinRegion: a.joinRegion || '',
          hostId: a.hostId,
          hostName: a.hostName || '',
          hostPhoto: a.hostPhoto || 'https://via.placeholder.com/100',
          message: a.message || '',
          status: a.status,
          createdAt: a.createdAt,
          isDbRequest: true,
        })))
      }
      if (receivedJoinAppsRes.applications) {
        setReceivedJoinRequests(receivedJoinAppsRes.applications.map(a => ({
          id: a.id,
          userId: a.userId,
          userName: a.userName || '',
          userPhoto: a.userPhoto || 'https://via.placeholder.com/100',
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
      if (notificationsRes.success) {
        setNotifications((notificationsRes.notifications || []).map(mapNotification))
      }
    } catch (e) {
      console.error('AppContext 데이터 로드 에러:', e)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

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
  }, [userId])

  // ==============================
  // 새로고침 함수들
  // ==============================

  const refreshUsers = useCallback(async () => {
    if (!userId) return
    const { data } = await db.profiles.getAll()
    if (data) setUsers(data.filter(p => p.id !== userId).map(p => mapProfileToUser(p)))
  }, [userId])

  const refreshJoins = useCallback(async () => {
    const result = await getJoins()
    if (result.success) setJoins(result.joins || [])
  }, [])

  const refreshMyJoins = useCallback(async () => {
    if (!userId) return
    const result = await getMyJoins(userId)
    if (result.success) setMyJoins(result.joins || [])
  }, [userId])

  const refreshFriendRequests = useCallback(async () => {
    if (!userId) return
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
  }, [userId])

  const refreshJoinApplications = useCallback(async () => {
    if (!userId) return
    const [sent, received] = await Promise.all([
      getSentJoinApplications(userId),
      getReceivedJoinApplications(userId),
    ])
    if (sent.applications) {
      setJoinApplications(sent.applications.map(a => ({
        id: a.id, joinId: a.joinId, joinTitle: a.joinTitle || '',
        joinDate: a.joinDate || '', joinTime: a.joinTime || '', joinRegion: a.joinRegion || '',
        hostId: a.hostId, hostName: a.hostName || '', hostPhoto: a.hostPhoto || 'https://via.placeholder.com/100',
        message: a.message || '', status: a.status, createdAt: a.createdAt, isDbRequest: true,
      })))
    }
    if (received.applications) {
      setReceivedJoinRequests(received.applications.map(a => ({
        id: a.id, userId: a.userId,
        userName: a.userName || '', userPhoto: a.userPhoto || 'https://via.placeholder.com/100',
        userRegion: a.userRegion || '', userHandicap: a.userHandicap || '',
        joinId: a.joinId, joinTitle: a.joinTitle || '',
        message: a.message || '', status: a.status, createdAt: a.createdAt, isDbRequest: true,
      })))
    }
  }, [userId])

  const refreshNotifications = useCallback(async () => {
    if (!userId) return
    const result = await getNotifications(userId)
    if (result.success) setNotifications((result.notifications || []).map(mapNotification))
  }, [userId])

  // ==============================
  // 액션 함수들 (Supabase 연동)
  // ==============================

  // 좋아요
  const likeUser = async (targetUserId) => {
    if (!userId) return
    setLikedUsers(prev => [...prev, targetUserId])
    await db.likes.add(userId, targetUserId)
  }

  const unlikeUser = async (targetUserId) => {
    if (!userId) return
    setLikedUsers(prev => prev.filter(id => id !== targetUserId))
    await db.likes.remove(userId, targetUserId)
  }

  // 조인 저장
  const saveJoin = async (joinId) => {
    if (!userId) return
    setSavedJoins(prev => [...prev, joinId])
    await db.savedJoins.add(userId, joinId)
  }

  const unsaveJoin = async (joinId) => {
    if (!userId) return
    setSavedJoins(prev => prev.filter(id => id !== joinId))
    await db.savedJoins.remove(userId, joinId)
  }

  // 친구 요청
  const sendFriendRequest = async (targetUser, message = '') => {
    if (!userId) return false
    if (friendRequests.some(req => req.userId === targetUser.id)) return false
    const result = await sendFriendRequestApi(userId, targetUser.id, message)
    if (result.success) {
      await refreshFriendRequests()
      return true
    }
    return false
  }

  const cancelFriendRequest = async (requestId) => {
    const req = friendRequests.find(r => r.id === requestId)
    if (req?.isDbRequest) {
      await cancelFriendRequestApi(requestId)
    }
    setFriendRequests(prev => prev.filter(r => r.id !== requestId))
  }

  const acceptFriendRequest = async (requestId) => {
    const result = await acceptFriendRequestApi(requestId)
    if (result.success) {
      await refreshFriendRequests()
    }
  }

  const rejectFriendRequest = async (requestId) => {
    const result = await rejectFriendRequestApi(requestId)
    if (result.success) {
      await refreshFriendRequests()
    }
  }

  // 조인 신청
  const applyToJoin = async (join, message = '') => {
    if (!userId) return false
    if (joinApplications.some(app => app.joinId === join.id)) return false
    const result = await applyToJoinApi(userId, join.id, message)
    if (result.success) {
      await refreshJoinApplications()
      return true
    }
    return false
  }

  const cancelJoinApplication = async (applicationId) => {
    await cancelJoinApplicationApi(applicationId)
    setJoinApplications(prev => prev.filter(a => a.id !== applicationId))
  }

  const acceptJoinRequest = async (requestId) => {
    const result = await acceptJoinApplication(requestId)
    if (result.success) {
      await refreshJoinApplications()
      await refreshJoins()
    }
  }

  const rejectJoinRequest = async (requestId) => {
    const result = await rejectJoinApplication(requestId)
    if (result.success) {
      await refreshJoinApplications()
    }
  }

  // 조인 생성/삭제
  const createJoin = async (joinData) => {
    if (!userId) return null
    const result = await createJoinApi(userId, joinData)
    if (result.success) {
      await refreshMyJoins()
      await refreshJoins()
      return result.join
    }
    return null
  }

  const deleteMyJoin = async (joinId) => {
    if (!userId) return
    await deleteJoinApi(joinId, userId)
    await refreshMyJoins()
  }

  // 알림
  const markNotificationAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
    await markNotificationAsReadApi(notificationId)
  }

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    if (userId) await markAllNotificationsAsReadApi(userId)
  }

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    await db.notifications.delete(notificationId)
  }

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length

  // 프로필 업데이트 (하위 호환)
  const updateProfile = () => {}

  // 제안
  const sendProposal = (proposal) => {
    setProposals(prev => [...prev, { ...proposal, id: Date.now(), status: 'pending' }])
  }

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

  const value = {
    // 데이터
    users,
    joins,
    currentUser,
    likedUsers,
    savedJoins,
    proposals,
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
    sendProposal,
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
    addPastCard,
    saveDailyRecommendation,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    // 새로고침
    refreshUsers,
    refreshJoins,
    refreshMyJoins,
    refreshFriendRequests,
    refreshJoinApplications,
    refreshNotifications,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
