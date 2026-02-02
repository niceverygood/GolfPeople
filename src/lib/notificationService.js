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
}

// 알림 템플릿 (알리고 템플릿 코드 연동)
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.FRIEND_REQUEST]: {
    title: '새로운 친구 요청',
    body: '{senderName}님이 친구 요청을 보냈습니다.',
    kakaoTemplate: 'FRIEND_REQUEST',  // 알리고 UF_2416
  },
  [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: {
    title: '친구 요청 수락',
    body: '{senderName}님이 친구 요청을 수락했습니다.',
    kakaoTemplate: 'FRIEND_ACCEPTED',  // 알리고 UF_2418
  },
  [NOTIFICATION_TYPES.JOIN_APPLICATION]: {
    title: '새로운 조인 신청',
    body: '{senderName}님이 "{joinTitle}" 조인에 신청했습니다.',
    kakaoTemplate: 'JOIN_APPLICATION',  // 알리고 UF_2419
  },
  [NOTIFICATION_TYPES.JOIN_ACCEPTED]: {
    title: '조인 참가 확정',
    body: '"{joinTitle}" 조인 참가가 확정되었습니다.',
    kakaoTemplate: 'JOIN_ACCEPTED',  // 알리고 UF_2420
  },
  [NOTIFICATION_TYPES.JOIN_REJECTED]: {
    title: '조인 신청 결과',
    body: '"{joinTitle}" 조인 신청이 거절되었습니다.',
    kakaoTemplate: 'JOIN_REJECTED',  // 알리고 UF_2421
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    title: '새 메시지',
    body: '{senderName}님의 새 메시지가 있습니다.',
    kakaoTemplate: 'NEW_MESSAGE',  // 알리고 UF_2422
  },
  [NOTIFICATION_TYPES.JOIN_REMINDER]: {
    title: '내일 라운딩 리마인더',
    body: '내일 "{joinTitle}" 라운딩이 예정되어 있습니다.',
    kakaoTemplate: 'JOIN_REMINDER',  // 알리고 UF_2423
  },
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
    if (options.inApp) {
      const { error: inAppError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: type,
          title: title,
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
    if (options.kakao) {
      await requestKakaoNotification({
        recipientId,
        templateCode: template.kakaoTemplate,
        variables: data
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
