/**
 * 통합 알림 서비스
 * - 앱 푸시 알림 (FCM)
 * - 카카오 알림톡 (추후 연동)
 * - 인앱 알림
 *
 * 서버 발송은 Supabase Edge Functions에서 처리
 */

import { supabase, isConnected } from './supabase'

// 알림 타입
export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'friend_request',      // 친구 요청 받음
  FRIEND_ACCEPTED: 'friend_accepted',    // 친구 요청 수락됨
  JOIN_APPLICATION: 'join_application',  // 조인 신청 받음
  JOIN_ACCEPTED: 'join_accepted',        // 조인 신청 수락됨
  JOIN_REJECTED: 'join_rejected',        // 조인 신청 거절됨
  NEW_MESSAGE: 'new_message',            // 새 메시지
  JOIN_REMINDER: 'join_reminder',        // 조인 리마인더 (D-1)
  REVIEW_RECEIVED: 'review_received',    // 리뷰 받음
}

// 알림 템플릿 (인앱/푸시용 - 영문 변수)
// 카카오 알림톡은 convertToKakaoVariables에서 한글 변수로 변환
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.FRIEND_REQUEST]: {
    title: '새로운 친구 요청',
    body: '{senderName}님이 친구 요청을 보냈습니다.',
    kakaoTemplate: 'FRIEND_REQUEST',
  },
  [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: {
    title: '친구 요청 수락',
    body: '{senderName}님이 친구 요청을 수락했습니다.',
    kakaoTemplate: 'FRIEND_ACCEPTED',
  },
  [NOTIFICATION_TYPES.JOIN_APPLICATION]: {
    title: '새로운 조인 신청',
    body: '{senderName}님이 "{joinTitle}" 조인에 신청했습니다.',
    kakaoTemplate: 'JOIN_APPLICATION',
  },
  [NOTIFICATION_TYPES.JOIN_ACCEPTED]: {
    title: '조인 참가 확정',
    body: '"{joinTitle}" 조인 참가가 확정되었습니다.',
    kakaoTemplate: 'JOIN_ACCEPTED',
  },
  [NOTIFICATION_TYPES.JOIN_REJECTED]: {
    title: '조인 신청 결과',
    body: '"{joinTitle}" 조인 신청이 거절되었습니다.',
    kakaoTemplate: 'JOIN_REJECTED',
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    title: '새 메시지',
    body: '{senderName}님의 새 메시지가 있습니다.',
    kakaoTemplate: null, // 카카오 알림톡 미사용 (정책상 일반 메시지는 어뷰징 우려로 승인 어려움)
  },
  [NOTIFICATION_TYPES.JOIN_REMINDER]: {
    title: '라운딩 일정 안내',
    body: '내일 "{joinTitle}" 라운딩이 예정되어 있습니다.',
    kakaoTemplate: 'JOIN_REMINDER',
  },
  [NOTIFICATION_TYPES.REVIEW_RECEIVED]: {
    title: '새로운 리뷰 도착',
    body: '{reviewerName}님이 회원님에게 {rating}점 리뷰를 남겼습니다.',
    kakaoTemplate: 'REVIEW_RECEIVED',
  },
}

/**
 * 알림 데이터를 알리고 변수명으로 변환
 */
const convertToKakaoVariables = (type, data) => {
  const now = new Date().toLocaleString('ko-KR')

  switch (type) {
    case NOTIFICATION_TYPES.FRIEND_REQUEST:
      return {
        회원명: data.recipientName || '',
        요청자명: data.senderName || '',
        요청일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.FRIEND_ACCEPTED:
      return {
        회원명: data.recipientName || '',
        수락자명: data.senderName || '',
        수락일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.JOIN_APPLICATION:
      return {
        회원명: data.recipientName || '',
        조인명: data.joinTitle || '',
        신청자명: data.senderName || '',
        신청일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.JOIN_ACCEPTED:
      return {
        회원명: data.recipientName || '',
        조인명: data.joinTitle || '',
        라운딩일시: data.roundingDate || '',
        장소: data.location || '',
        확정일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.JOIN_REJECTED:
      return {
        회원명: data.recipientName || '',
        조인명: data.joinTitle || '',
        처리일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return {
        회원명: data.recipientName || '',
        발신자명: data.senderName || '',
        수신일시: data.timestamp || now,
      }
    case NOTIFICATION_TYPES.JOIN_REMINDER:
      return {
        회원명: data.recipientName || '',
        조인명: data.joinTitle || '',
        라운딩일시: data.roundingDate || '',
        장소: data.location || '',
      }
    case NOTIFICATION_TYPES.REVIEW_RECEIVED:
      return {
        회원명: data.recipientName || '',
        평가자명: data.reviewerName || '',
        평점: data.rating || '',
        평가일시: data.timestamp || now,
      }
    default:
      return data
  }
}

/**
 * 템플릿에 변수 치환
 */
const formatTemplate = (template, variables) => {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value || '')
  })
  return result
}

/**
 * 알림 생성 및 발송 요청
 *
 * @param {Object} params
 * @param {string} params.type - 알림 타입 (NOTIFICATION_TYPES)
 * @param {string} params.recipientId - 수신자 user_id
 * @param {Object} params.data - 알림 데이터 (템플릿 변수, 추가 정보)
 * @param {Object} params.options - 옵션 (push, kakao, inApp)
 */
export const createNotification = async ({
  type,
  recipientId,
  data = {},
  options = { push: true, kakao: false, inApp: true }
}) => {
  if (!isConnected()) {
    console.warn('알림 생성 실패: Supabase 연결 안됨')
    return { success: false, error: 'not_connected' }
  }

  const template = NOTIFICATION_TEMPLATES[type]
  if (!template) {
    console.error('알림 생성 실패: 알 수 없는 알림 타입', type)
    return { success: false, error: 'invalid_type' }
  }

  try {
    // 알림 내용 생성
    const title = formatTemplate(template.title, data)
    const body = formatTemplate(template.body, data)

    // 인앱 알림 저장
    // 주의: schema.sql은 'message' 컬럼, 002_notifications.sql은 'body' 컬럼 사용
    // 양쪽 모두 호환되도록 둘 다 넣음
    if (options.inApp) {
      const { error: inAppError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: type,
          title: title,
          message: body,
          body: body,
          data: data,
          is_read: false,
        })

      if (inAppError) {
        console.error('인앱 알림 저장 실패:', inAppError)
      }
    }

    // 푸시 알림 요청 (Edge Function 호출)
    if (options.push) {
      await requestPushNotification({
        recipientId,
        title,
        body,
        data: { type, ...data }
      })
    }

    // 카카오 알림톡 요청 (Edge Function 호출)
    if (options.kakao && template.kakaoTemplate) {
      const kakaoVariables = convertToKakaoVariables(type, data)
      await requestKakaoNotification({
        recipientId,
        templateCode: template.kakaoTemplate,
        variables: kakaoVariables
      })
    }

    return { success: true }
  } catch (e) {
    console.error('알림 생성 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 푸시 알림 발송 요청 (Supabase Edge Function 호출)
 */
const requestPushNotification = async ({ recipientId, title, body, data }) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push', {
      body: {
        recipientId,
        title,
        body,
        data
      }
    })

    if (error) {
      console.error('푸시 알림 발송 요청 실패:', error)
      return { success: false, error }
    }

    return { success: true, result }
  } catch (e) {
    console.error('푸시 알림 발송 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 카카오 알림톡 발송 요청 (Supabase Edge Function 호출)
 */
const requestKakaoNotification = async ({ recipientId, templateCode, variables }) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-kakao', {
      body: {
        recipientId,
        templateCode,
        variables
      }
    })

    if (error) {
      console.error('카카오 알림톡 발송 요청 실패:', error)
      return { success: false, error }
    }

    return { success: true, result }
  } catch (e) {
    console.error('카카오 알림톡 발송 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 사용자 알림 목록 가져오기
 */
export const getNotifications = async (userId, limit = 20) => {
  if (!isConnected() || !userId) {
    return { success: false, notifications: [] }
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, notifications: data || [] }
  } catch (e) {
    console.error('알림 목록 조회 에러:', e)
    return { success: false, notifications: [], error: e.message }
  }
}

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!isConnected()) return { success: false }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('알림 읽음 처리 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 모든 알림 읽음 처리
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!isConnected() || !userId) return { success: false }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('전체 알림 읽음 처리 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 읽지 않은 알림 개수
 */
export const getUnreadCount = async (userId) => {
  if (!isConnected() || !userId) return 0

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    return count || 0
  } catch (e) {
    console.error('읽지 않은 알림 개수 조회 에러:', e)
    return 0
  }
}

/**
 * 알림 설정 가져오기
 */
export const getNotificationSettings = async (userId) => {
  if (!isConnected() || !userId) {
    return {
      push_enabled: true,
      kakao_enabled: false,
      friend_request: true,
      join_application: true,
      new_message: true,
      join_reminder: true,
    }
  }

  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data || {
      push_enabled: true,
      kakao_enabled: false,
      friend_request: true,
      join_application: true,
      new_message: true,
      join_reminder: true,
    }
  } catch (e) {
    console.error('알림 설정 조회 에러:', e)
    return {
      push_enabled: true,
      kakao_enabled: false,
      friend_request: true,
      join_application: true,
      new_message: true,
      join_reminder: true,
    }
  }
}

/**
 * 알림 설정 저장
 */
export const updateNotificationSettings = async (userId, settings) => {
  if (!isConnected() || !userId) return { success: false }

  try {
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('알림 설정 저장 에러:', e)
    return { success: false, error: e.message }
  }
}

export default {
  NOTIFICATION_TYPES,
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
}
