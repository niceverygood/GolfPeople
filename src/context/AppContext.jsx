import { createContext, useContext, useState } from 'react'
import { mockUsers, mockJoins, currentUser as initialUser } from '../data/mockData'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [users] = useState(mockUsers)
  const [joins] = useState(mockJoins)
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [likedUsers, setLikedUsers] = useState([])
  const [savedJoins, setSavedJoins] = useState([])
  const [proposals, setProposals] = useState([]) // 보낸 제안들
  
  // 지난 카드 (뒤집어본 프로필들 - 기존 기능 유지하되 추천 기록 위주로 변경 가능)
  const [pastCards, setPastCards] = useState(() => {
    const saved = localStorage.getItem('gp_past_cards')
    return saved ? JSON.parse(saved) : []
  })

  // 일별 추천 기록 저장 (7일 보관)
  const [recommendationHistory, setRecommendationHistory] = useState(() => {
    const saved = localStorage.getItem('gp_recommendation_history')
    return saved ? JSON.parse(saved) : {}
  })

  // 오늘의 추천 생성 및 저장
  const saveDailyRecommendation = (dateKey, recommendations) => {
    setRecommendationHistory(prev => {
      const newHistory = { ...prev, [dateKey]: recommendations }
      
      // 7일 지난 데이터 삭제 (문자열 비교로 정렬 가능하도록 YYYY-MM-DD 형식 권장)
      const dates = Object.keys(newHistory).sort().reverse()
      if (dates.length > 7) {
        const updatedHistory = { ...newHistory }
        dates.slice(7).forEach(d => delete updatedHistory[d])
        localStorage.setItem('gp_recommendation_history', JSON.stringify(updatedHistory))
        return updatedHistory
      }
      
      localStorage.setItem('gp_recommendation_history', JSON.stringify(newHistory))
      return newHistory
    })
  }

  // 친구 요청 (내가 보낸)
  const [friendRequests, setFriendRequests] = useState([])
  
  // 친구 요청 (내가 받은) - 데모 데이터
  const [receivedFriendRequests, setReceivedFriendRequests] = useState([
    {
      id: 1001,
      userId: 1,
      userName: '민준',
      userPhoto: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
      userRegion: '서울 강남',
      userHandicap: '90대 초반',
      message: '같이 라운딩 해요! 주말 오전 좋아요 ⛳',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
    },
    {
      id: 1002,
      userId: 3,
      userName: '서윤',
      userPhoto: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400',
      userRegion: '경기 분당',
      userHandicap: '80대',
      message: '',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    },
  ])
  
  // 조인 신청 (내가 신청한)
  const [joinApplications, setJoinApplications] = useState([])
  
  // 내가 만든 조인 (localStorage에서 복원)
  const [myJoins, setMyJoins] = useState(() => {
    const saved = localStorage.getItem('gp_my_joins')
    if (saved) {
      return JSON.parse(saved)
    }
    // 기본 데모 데이터
    return [
      {
        id: 101,
        title: '주말 오전 여유롭게',
        date: '12월 28일 (토)',
        time: '오전 8시',
        location: '남서울CC',
        region: '서울',
        spotsTotal: 4,
        spotsFilled: 2,
        style: ['여유롭게', '도보 가능'],
        handicapRange: '90대~100대',
        description: '편하게 치실 분 구합니다',
        hostId: currentUser.id,
        hostName: currentUser.name,
        hostPhoto: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400',
        participants: [
          { id: 0, name: '나', photo: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400' },
          { id: 101, name: '지민', photo: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400' },
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ]
  })
  
  // 조인 신청 (내가 받은 - 내가 호스트인 조인에 신청한 사람들) - 데모 데이터
  const [receivedJoinRequests, setReceivedJoinRequests] = useState([
    {
      id: 2001,
      userId: 2,
      userName: '서준',
      userPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      userRegion: '서울 송파',
      userHandicap: '90대 후반',
      joinId: 99,
      joinTitle: '내가 만든 조인',
      message: '참여하고 싶습니다!',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
    },
  ])
  
  // 알림 데이터
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'friend_request',
      title: '새 친구 요청',
      message: '민준님이 친구 요청을 보냈어요',
      userPhoto: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      type: 'join_request',
      title: '조인 신청',
      message: '서준님이 조인에 신청했어요',
      userPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      isRead: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 3,
      type: 'match',
      title: '새 추천 도착!',
      message: '오늘의 골프 친구 추천이 도착했어요 ⛳',
      userPhoto: null,
      isRead: false,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 4,
      type: 'system',
      title: '환영합니다!',
      message: '골프피플에 오신 것을 환영해요 🎉',
      userPhoto: null,
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ])
  
  // 알림 읽음 처리
  const markNotificationAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
  }
  
  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }
  
  // 알림 삭제
  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId))
  }
  
  // 읽지 않은 알림 개수
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length

  // 유저 좋아요
  const likeUser = (userId) => {
    if (!likedUsers.includes(userId)) {
      setLikedUsers([...likedUsers, userId])
    }
  }

  // 유저 좋아요 취소
  const unlikeUser = (userId) => {
    setLikedUsers(likedUsers.filter(id => id !== userId))
  }

  // 조인 저장
  const saveJoin = (joinId) => {
    if (!savedJoins.includes(joinId)) {
      setSavedJoins([...savedJoins, joinId])
    }
  }

  // 조인 저장 취소
  const unsaveJoin = (joinId) => {
    setSavedJoins(savedJoins.filter(id => id !== joinId))
  }

  // 라운딩 제안 보내기
  const sendProposal = (proposal) => {
    setProposals([...proposals, { ...proposal, id: Date.now(), status: 'pending' }])
  }
  
  // 친구 요청 보내기
  const sendFriendRequest = (user, message = '') => {
    // 이미 요청한 유저인지 확인
    if (friendRequests.some(req => req.userId === user.id)) {
      return false
    }
    setFriendRequests([...friendRequests, {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userPhoto: user.photos[0],
      userRegion: user.region,
      userHandicap: user.handicap,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }])
    return true
  }
  
  // 친구 요청 취소
  const cancelFriendRequest = (requestId) => {
    setFriendRequests(friendRequests.filter(req => req.id !== requestId))
  }
  
  // 받은 친구 요청 수락
  const acceptFriendRequest = (requestId) => {
    setReceivedFriendRequests(receivedFriendRequests.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ))
  }
  
  // 받은 친구 요청 거절
  const rejectFriendRequest = (requestId) => {
    setReceivedFriendRequests(receivedFriendRequests.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ))
  }
  
  // 조인 신청하기
  const applyToJoin = (join, message = '') => {
    // 이미 신청한 조인인지 확인
    if (joinApplications.some(app => app.joinId === join.id)) {
      return false
    }
    setJoinApplications([...joinApplications, {
      id: Date.now(),
      joinId: join.id,
      joinTitle: join.title || join.courseName,
      joinDate: join.date,
      joinTime: join.time,
      joinRegion: join.region,
      hostName: join.hostName,
      hostPhoto: join.hostPhoto,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }])
    return true
  }
  
  // 조인 신청 취소
  const cancelJoinApplication = (applicationId) => {
    setJoinApplications(joinApplications.filter(app => app.id !== applicationId))
  }
  
  // 받은 조인 요청 수락
  const acceptJoinRequest = (requestId) => {
    setReceivedJoinRequests(receivedJoinRequests.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ))
  }
  
  // 받은 조인 요청 거절
  const rejectJoinRequest = (requestId) => {
    setReceivedJoinRequests(receivedJoinRequests.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ))
  }

  // 프로필 업데이트
  const updateProfile = (updates) => {
    setCurrentUser({ ...currentUser, ...updates })
  }
  
  // 조인 생성
  const createJoin = (joinData) => {
    const newJoin = {
      id: Date.now(),
      ...joinData,
      hostId: currentUser.id,
      hostName: currentUser.name,
      hostPhoto: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400',
      participants: [
        { id: 0, name: '나', photo: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400' },
      ],
      createdAt: new Date().toISOString(),
    }
    const updated = [newJoin, ...myJoins]
    setMyJoins(updated)
    localStorage.setItem('gp_my_joins', JSON.stringify(updated))
    return newJoin
  }
  
  // 지난 카드 추가
  const addPastCard = (user) => {
    setPastCards(prev => {
      // 이미 목록에 있는지 확인 (중복 제거)
      if (prev.some(c => c.id === user.id)) {
        // 이미 있으면 순서만 맨 앞으로
        const filtered = prev.filter(c => c.id !== user.id)
        const updated = [{ ...user, viewedAt: new Date().toISOString() }, ...filtered]
        localStorage.setItem('gp_past_cards', JSON.stringify(updated.slice(0, 50))) // 최대 50개만 저장
        return updated
      }
      const updated = [{ ...user, viewedAt: new Date().toISOString() }, ...prev]
      localStorage.setItem('gp_past_cards', JSON.stringify(updated.slice(0, 50)))
      return updated
    })
  }

  // 내 조인 삭제
  const deleteMyJoin = (joinId) => {
    const updated = myJoins.filter(j => j.id !== joinId)
    setMyJoins(updated)
    localStorage.setItem('gp_my_joins', JSON.stringify(updated))
  }

  const value = {
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
