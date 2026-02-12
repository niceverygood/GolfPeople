/**
 * 조인 서비스 - Supabase 연동
 * 조인 신청 수락 시 DB 트리거에서 자동으로 채팅방에 참가자 추가됨
 */

import { supabase, isConnected } from './supabase'
import { createNotification, NOTIFICATION_TYPES } from './notificationService'

/**
 * 조인 목록 가져오기
 */
export const getJoins = async (filters = {}) => {
  if (!isConnected()) {
    return { success: false, joins: [] }
  }

  try {
    let query = supabase
      .from('joins')
      .select(`
        id,
        title,
        date,
        time,
        location,
        region,
        course_name,
        spots_total,
        spots_filled,
        handicap_range,
        styles,
        description,
        meeting_type,
        status,
        created_at,
        host:host_id (
          id,
          name,
          photos,
          handicap
        ),
        participants:join_participants (
          user:user_id (
            id,
            name,
            photos
          )
        )
      `)
      .in('status', ['open', 'confirmed'])
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (filters.region) {
      query = query.eq('region', filters.region)
    }

    const { data, error } = await query

    if (error) throw error

    const joins = (data || []).map(j => ({
      id: j.id,
      title: j.title,
      date: j.date,
      time: j.time,
      location: j.location,
      region: j.region,
      courseName: j.course_name,
      spotsTotal: j.spots_total,
      spotsFilled: j.spots_filled,
      handicapRange: j.handicap_range,
      styles: j.styles || [],
      style: j.styles || [], // JoinCard 호환 alias
      description: j.description,
      meetingType: j.meeting_type,
      status: j.status,
      createdAt: j.created_at,
      hostId: j.host?.id,
      hostName: j.host?.name || '알 수 없음',
      hostPhoto: j.host?.photos?.[0] || 'https://via.placeholder.com/100',
      hostHandicap: j.host?.handicap || '',
      participants: (j.participants || []).map(p => ({
        id: p.user?.id,
        name: p.user?.name || '',
        photo: p.user?.photos?.[0] || 'https://via.placeholder.com/100',
      })).filter(p => p.id),
    }))

    return { success: true, joins }
  } catch (e) {
    console.error('조인 목록 조회 에러:', e)
    return { success: false, joins: [], error: e.message }
  }
}

/**
 * 내가 만든 조인 목록
 */
export const getMyJoins = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, joins: [] }
  }

  try {
    const { data, error } = await supabase
      .from('joins')
      .select(`
        id,
        title,
        date,
        time,
        location,
        region,
        course_name,
        spots_total,
        spots_filled,
        handicap_range,
        styles,
        description,
        status,
        created_at,
        participants:join_participants (
          user:user_id (
            id,
            name,
            photos
          )
        )
      `)
      .eq('host_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    // MyJoinCard 호환을 위해 매핑
    const mappedJoins = (data || []).map(j => ({
      id: j.id,
      title: j.title,
      date: j.date,
      time: j.time,
      location: j.location,
      region: j.region,
      courseName: j.course_name,
      spotsTotal: j.spots_total,
      spotsFilled: j.spots_filled,
      handicapRange: j.handicap_range,
      styles: j.styles || [],
      style: j.styles || [],
      description: j.description,
      status: j.status,
      createdAt: j.created_at,
      participants: (j.participants || []).map(p => ({
        id: p.user?.id,
        name: p.user?.name || '',
        photo: p.user?.photos?.[0] || 'https://via.placeholder.com/100',
      })).filter(p => p.id),
    }))

    return { success: true, joins: mappedJoins }
  } catch (e) {
    console.error('내 조인 목록 조회 에러:', e)
    return { success: false, joins: [], error: e.message }
  }
}

/**
 * 보낸 조인 신청 목록
 */
export const getSentJoinApplications = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, applications: [] }
  }

  try {
    const { data, error } = await supabase
      .from('join_applications')
      .select(`
        id,
        message,
        status,
        created_at,
        join:join_id (
          id,
          title,
          date,
          time,
          location,
          region,
          status,
          host:host_id (
            id,
            name,
            photos
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const today = new Date().toISOString().split('T')[0]
    const applications = (data || []).map(app => {
      const joinActive = ['open', 'confirmed', 'in_progress'].includes(app.join?.status)
      const joinExpired = !app.join?.date || app.join.date < today || !joinActive
      const effectiveStatus = (app.status === 'pending' && joinExpired) ? 'expired' : app.status
      return {
        id: app.id,
        joinId: app.join?.id,
        joinTitle: app.join?.title,
        joinDate: app.join?.date,
        joinTime: app.join?.time,
        joinRegion: app.join?.region,
        hostId: app.join?.host?.id,
        hostName: app.join?.host?.name || '알 수 없음',
        hostPhoto: app.join?.host?.photos?.[0] || 'https://via.placeholder.com/100',
        message: app.message,
        status: effectiveStatus,
        createdAt: app.created_at,
      }
    })

    return { success: true, applications }
  } catch (e) {
    console.error('보낸 조인 신청 조회 에러:', e)
    return { success: false, applications: [], error: e.message }
  }
}

/**
 * 받은 조인 신청 목록 (내가 호스트인 조인에 대한 신청)
 */
export const getReceivedJoinApplications = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, applications: [] }
  }

  try {
    // 내가 호스트인 조인 ID 목록 가져오기
    const { data: myJoins } = await supabase
      .from('joins')
      .select('id')
      .eq('host_id', userId)

    if (!myJoins || myJoins.length === 0) {
      return { success: true, applications: [] }
    }

    const joinIds = myJoins.map(j => j.id)

    const { data, error } = await supabase
      .from('join_applications')
      .select(`
        id,
        message,
        status,
        created_at,
        join:join_id (
          id,
          title,
          date,
          time,
          region,
          status
        ),
        applicant:user_id (
          id,
          name,
          photos,
          regions,
          handicap
        )
      `)
      .in('join_id', joinIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const today = new Date().toISOString().split('T')[0]
    const applications = (data || []).map(app => {
      const joinActive = ['open', 'confirmed', 'in_progress'].includes(app.join?.status)
      const joinExpired = !app.join?.date || app.join.date < today || !joinActive
      const effectiveStatus = (app.status === 'pending' && joinExpired) ? 'expired' : app.status
      return {
        id: app.id,
        joinId: app.join?.id,
        joinTitle: app.join?.title,
        joinDate: app.join?.date,
        joinTime: app.join?.time,
        joinRegion: app.join?.region,
        userId: app.applicant?.id,
        userName: app.applicant?.name || '알 수 없음',
        userPhoto: app.applicant?.photos?.[0] || 'https://via.placeholder.com/100',
        userRegion: app.applicant?.regions?.[0] || '',
        userHandicap: app.applicant?.handicap || '',
        message: app.message,
        status: effectiveStatus,
        createdAt: app.created_at,
      }
    })

    return { success: true, applications }
  } catch (e) {
    console.error('받은 조인 신청 조회 에러:', e)
    return { success: false, applications: [], error: e.message }
  }
}

/**
 * 조인 신청하기
 */
export const applyToJoin = async (userId, joinId, message = '') => {
  if (!isConnected() || !userId || !joinId) {
    return { success: false, error: 'invalid_params' }
  }

  try {
    // 조인 정보 조회 (호스트/날짜/상태 검증)
    const { data: joinInfo } = await supabase
      .from('joins')
      .select('host_id, date, status')
      .eq('id', joinId)
      .single()

    if (!joinInfo) {
      return { success: false, error: 'join_not_found' }
    }

    if (joinInfo.host_id === userId) {
      return { success: false, error: 'own_join' }
    }

    // 만료된 조인 신청 방지
    const today = new Date().toISOString().split('T')[0]
    if (joinInfo.status !== 'open') {
      return { success: false, error: 'join_closed' }
    }
    if (joinInfo.date < today) {
      return { success: false, error: 'join_expired' }
    }

    // 이미 신청했는지 확인
    const { data: existing } = await supabase
      .from('join_applications')
      .select('id, status')
      .eq('user_id', userId)
      .eq('join_id', joinId)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        return { success: false, error: 'already_applied' }
      }
      if (existing.status === 'accepted') {
        return { success: false, error: 'already_joined' }
      }
    }

    // 조인 신청 생성
    const { data, error } = await supabase
      .from('join_applications')
      .insert({
        user_id: userId,
        join_id: joinId,
        message: message.trim() || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // 알림 발송 (호스트에게 새 신청 알림)
    const { data: joinData } = await supabase
      .from('joins')
      .select('host_id, title')
      .eq('id', joinId)
      .single()

    const { data: applicantProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single()

    if (joinData?.host_id) {
      await createNotification({
        type: NOTIFICATION_TYPES.JOIN_APPLICATION,
        recipientId: joinData.host_id,
        data: {
          senderName: applicantProfile?.name || '골퍼',
          senderId: userId,
          joinTitle: joinData.title,
          joinId: joinId,
        },
        options: { push: true, kakao: true, inApp: true }
      })
    }

    return { success: true, application: data }
  } catch (e) {
    console.error('조인 신청 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 신청 수락
 * DB 트리거에서 자동으로:
 * - join_participants에 추가
 * - 조인 채팅방에 참가자 추가
 * - spots_filled 증가
 * - 알림 생성
 */
export const acceptJoinApplication = async (applicationId) => {
  if (!isConnected() || !applicationId) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('join_applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error

    // 알림 발송 (신청자에게 수락 알림)
    const { data: joinData } = await supabase
      .from('joins')
      .select('title, date, time, location')
      .eq('id', data.join_id)
      .single()

    await createNotification({
      type: NOTIFICATION_TYPES.JOIN_ACCEPTED,
      recipientId: data.user_id,
      data: {
        joinTitle: joinData?.title || '',
        joinId: data.join_id,
        roundingDate: joinData?.date ? `${joinData.date} ${joinData.time || ''}` : '',
        location: joinData?.location || '',
      },
      options: { push: true, kakao: true, inApp: true }
    })

    return { success: true, application: data }
  } catch (e) {
    console.error('조인 신청 수락 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 신청 거절
 */
export const rejectJoinApplication = async (applicationId) => {
  if (!isConnected() || !applicationId) {
    return { success: false }
  }

  try {
    // 먼저 신청 정보 가져오기
    const { data: appData } = await supabase
      .from('join_applications')
      .select('user_id, join_id')
      .eq('id', applicationId)
      .single()

    const { error } = await supabase
      .from('join_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)

    if (error) throw error

    // 알림 발송 (신청자에게 거절 알림)
    if (appData) {
      const { data: joinData } = await supabase
        .from('joins')
        .select('title')
        .eq('id', appData.join_id)
        .single()

      await createNotification({
        type: NOTIFICATION_TYPES.JOIN_REJECTED,
        recipientId: appData.user_id,
        data: {
          joinTitle: joinData?.title || '',
          joinId: appData.join_id,
        },
        options: { push: true, kakao: true, inApp: true }
      })
    }

    return { success: true }
  } catch (e) {
    console.error('조인 신청 거절 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 신청 취소
 */
export const cancelJoinApplication = async (applicationId) => {
  if (!isConnected() || !applicationId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('join_applications')
      .delete()
      .eq('id', applicationId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('조인 신청 취소 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 생성
 */
export const createJoin = async (userId, joinData) => {
  if (!isConnected() || !userId) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('joins')
      .insert({
        host_id: userId,
        title: joinData.title,
        date: joinData.date,
        time: joinData.time,
        location: joinData.location,
        region: joinData.region,
        course_name: joinData.courseName,
        spots_total: joinData.spotsTotal || 4,
        spots_filled: joinData.spotsFilled || 1,
        handicap_range: joinData.handicapRange,
        styles: joinData.styles || [],
        description: joinData.description,
        meeting_type: joinData.meetingType,
        status: 'open'
      })
      .select()
      .single()

    if (error) throw error

    // 호스트를 참가자로 추가
    await supabase
      .from('join_participants')
      .insert({
        join_id: data.id,
        user_id: userId,
        role: 'host'
      })

    return { success: true, join: data }
  } catch (e) {
    console.error('조인 생성 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 수정
 */
export const updateJoin = async (joinId, userId, updates) => {
  if (!isConnected() || !joinId || !userId) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('joins')
      .update({
        title: updates.title,
        date: updates.date,
        time: updates.time,
        location: updates.location,
        region: updates.region,
        course_name: updates.courseName,
        spots_total: updates.spotsTotal,
        handicap_range: updates.handicapRange,
        styles: updates.styles,
        description: updates.description,
        meeting_type: updates.meetingType,
      })
      .eq('id', joinId)
      .eq('host_id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, join: data }
  } catch (e) {
    console.error('조인 수정 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 삭제 (취소)
 */
export const deleteJoin = async (joinId, userId) => {
  if (!isConnected() || !joinId || !userId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('joins')
      .delete()
      .eq('id', joinId)
      .eq('host_id', userId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('조인 삭제 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 상세 정보
 */
export const getJoinDetail = async (joinId) => {
  if (!isConnected() || !joinId) {
    return { success: false }
  }

  try {
    const { data, error } = await supabase
      .from('joins')
      .select(`
        *,
        host:host_id (
          id,
          name,
          photos,
          regions,
          handicap,
          styles
        ),
        participants:join_participants (
          user:user_id (
            id,
            name,
            photos,
            handicap
          )
        )
      `)
      .eq('id', joinId)
      .single()

    if (error) throw error

    return { success: true, join: data }
  } catch (e) {
    console.error('조인 상세 조회 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 조인 확정 (open → confirmed)
 * 호스트만 가능, 2명 이상 참가자 필요
 */
export const confirmJoin = async (joinId, userId) => {
  if (!isConnected() || !joinId || !userId) {
    return { success: false, error: 'invalid_params' }
  }

  try {
    const { data, error } = await supabase.rpc('confirm_join', {
      p_join_id: joinId,
      p_user_id: userId,
    })
    if (error) throw error
    if (!data?.success) {
      return { success: false, error: data?.error || 'unknown' }
    }
    return { success: true }
  } catch (e) {
    console.error('조인 확정 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 라운딩 시작 (confirmed → in_progress)
 * 참가자만 가능, 당일만 가능
 */
export const startRounding = async (joinId, userId) => {
  if (!isConnected() || !joinId || !userId) {
    return { success: false, error: 'invalid_params' }
  }

  try {
    const { data, error } = await supabase.rpc('start_rounding', {
      p_join_id: joinId,
      p_user_id: userId,
    })
    if (error) throw error
    if (!data?.success) {
      return { success: false, error: data?.error || 'unknown' }
    }
    return { success: true }
  } catch (e) {
    console.error('라운딩 시작 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 지난 조인 자동 완료 (open/confirmed → completed, in_progress 6시간 후 → completed)
 * 앱 로드 시 1회 호출
 */
export const completePastJoins = async () => {
  if (!isConnected()) return { success: false }

  try {
    const { data, error } = await supabase.rpc('complete_past_joins')
    if (error) throw error
    return { success: true, count: data }
  } catch (e) {
    console.error('지난 조인 완료 처리 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 완료된 라운딩 목록 (내가 참가한 과거 조인)
 */
export const getCompletedRoundings = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, roundings: [] }
  }

  try {
    // 내가 참가한 조인 중 completed 상태인 것
    const { data: participations, error: pError } = await supabase
      .from('join_participants')
      .select('join_id')
      .eq('user_id', userId)

    if (pError) throw pError
    if (!participations || participations.length === 0) {
      return { success: true, roundings: [] }
    }

    const joinIds = participations.map(p => p.join_id)

    const { data, error } = await supabase
      .from('joins')
      .select(`
        id,
        title,
        date,
        time,
        location,
        region,
        course_name,
        spots_total,
        spots_filled,
        status,
        host:host_id (
          id,
          name,
          photos
        ),
        participants:join_participants (
          user:user_id (
            id,
            name,
            photos
          )
        )
      `)
      .in('id', joinIds)
      .eq('status', 'completed')
      .order('date', { ascending: false })

    if (error) throw error

    const roundings = (data || []).map(j => ({
      id: j.id,
      title: j.title,
      date: j.date,
      time: j.time,
      location: j.location,
      region: j.region,
      courseName: j.course_name,
      spotsTotal: j.spots_total,
      spotsFilled: j.spots_filled,
      status: j.status,
      hostId: j.host?.id,
      hostName: j.host?.name || '알 수 없음',
      hostPhoto: j.host?.photos?.[0] || 'https://via.placeholder.com/100',
      participants: (j.participants || []).map(p => ({
        id: p.user?.id,
        name: p.user?.name || '',
        photo: p.user?.photos?.[0] || 'https://via.placeholder.com/100',
      })).filter(p => p.id),
    }))

    return { success: true, roundings }
  } catch (e) {
    console.error('완료 라운딩 조회 에러:', e)
    return { success: false, roundings: [], error: e.message }
  }
}

/**
 * 완료된 라운딩 수
 */
export const getCompletedRoundingCount = async (userId) => {
  if (!isConnected() || !userId) return 0

  try {
    const { data: participations, error: pError } = await supabase
      .from('join_participants')
      .select('join_id')
      .eq('user_id', userId)

    if (pError || !participations?.length) return 0

    const joinIds = participations.map(p => p.join_id)

    const { count, error } = await supabase
      .from('joins')
      .select('id', { count: 'exact', head: true })
      .in('id', joinIds)
      .eq('status', 'completed')

    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

/**
 * 내가 참가한 모든 조인 목록 (상태 무관 — 마이페이지 조인 기록용)
 */
export const getMyJoinHistory = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, joins: [] }
  }

  try {
    // 참가한 조인 + 호스트로 만든 조인 모두 조회
    const [partResult, hostResult] = await Promise.allSettled([
      supabase.from('join_participants').select('join_id').eq('user_id', userId),
      supabase.from('joins').select('id').eq('host_id', userId),
    ])

    const participations = partResult.status === 'fulfilled' ? partResult.value.data || [] : []
    const hostedJoins = hostResult.status === 'fulfilled' ? hostResult.value.data || [] : []

    const joinIds = [...new Set([
      ...participations.map(p => p.join_id),
      ...hostedJoins.map(j => j.id),
    ])]

    if (joinIds.length === 0) {
      return { success: true, joins: [] }
    }

    const { data, error } = await supabase
      .from('joins')
      .select(`
        id, title, date, time, location, region, course_name,
        spots_total, spots_filled, status, created_at,
        host:host_id ( id, name, photos ),
        participants:join_participants ( user:user_id ( id, name, photos ) )
      `)
      .in('id', joinIds)
      .order('date', { ascending: false })

    if (error) throw error

    const joins = (data || []).map(j => ({
      id: j.id,
      title: j.title,
      date: j.date,
      time: j.time,
      location: j.location,
      region: j.region,
      courseName: j.course_name,
      spotsTotal: j.spots_total,
      spotsFilled: j.spots_filled,
      status: j.status,
      createdAt: j.created_at,
      hostId: j.host?.id,
      hostName: j.host?.name || '알 수 없음',
      hostPhoto: j.host?.photos?.[0] || '/default-profile.png',
      participants: (j.participants || []).map(p => ({
        id: p.user?.id,
        name: p.user?.name || '',
        photo: p.user?.photos?.[0] || '/default-profile.png',
      })).filter(p => p.id),
    }))

    return { success: true, joins }
  } catch (e) {
    console.error('조인 기록 조회 에러:', e)
    return { success: false, joins: [], error: e.message }
  }
}

export default {
  getJoins,
  getMyJoins,
  getSentJoinApplications,
  getReceivedJoinApplications,
  applyToJoin,
  acceptJoinApplication,
  rejectJoinApplication,
  cancelJoinApplication,
  createJoin,
  updateJoin,
  deleteJoin,
  getJoinDetail,
  confirmJoin,
  startRounding,
  completePastJoins,
  getCompletedRoundings,
  getCompletedRoundingCount,
  getMyJoinHistory,
}
