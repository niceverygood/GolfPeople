/**
 * 리뷰 서비스 - 라운딩 후 동반자 평가
 */

import { supabase, isConnected } from './supabase'
import { createNotification, NOTIFICATION_TYPES } from './notificationService'

// 리뷰 태그 옵션
export const REVIEW_TAGS = [
  { id: 'manner', label: '매너가 좋아요', emoji: '😊' },
  { id: 'punctual', label: '시간 약속을 잘 지켜요', emoji: '⏰' },
  { id: 'good_skill', label: '실력이 좋아요', emoji: '🏌️' },
  { id: 'fun', label: '함께하면 즐거워요', emoji: '🎉' },
  { id: 'respectful', label: '배려심이 있어요', emoji: '🤝' },
  { id: 'fast_pace', label: '빠른 진행이에요', emoji: '⚡' },
  { id: 'good_teaching', label: '가르쳐주기를 잘해요', emoji: '👨‍🏫' },
  { id: 'again', label: '또 만나고 싶어요', emoji: '💚' },
]

/**
 * 리뷰 작성
 */
export const createReview = async (reviewerId, reviewedId, joinId, reviewData) => {
  if (!isConnected() || !reviewerId || !reviewedId) {
    return { success: false, error: 'invalid_params' }
  }

  try {
    // 중복 리뷰 체크
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewerId)
      .eq('reviewed_id', reviewedId)
      .eq('join_id', joinId)
      .single()

    if (existing) {
      return { success: false, error: 'already_reviewed' }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        join_id: joinId,
        rating: reviewData.rating,
        tags: reviewData.tags || [],
        comment: reviewData.comment?.trim() || null,
        is_public: reviewData.isPublic !== false,
      })
      .select()
      .single()

    if (error) throw error

    // 알림 발송 (평가 받은 사람에게)
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', reviewerId)
      .single()

    if (reviewData.isPublic !== false) {
      await createNotification({
        type: NOTIFICATION_TYPES.REVIEW_RECEIVED,
        recipientId: reviewedId,
        data: {
          reviewerName: reviewerProfile?.name || '골퍼',
          reviewerId: reviewerId,
          rating: reviewData.rating,
        },
        options: { push: true, kakao: false, inApp: true }
      })
    }

    return { success: true, review: data }
  } catch (e) {
    console.error('리뷰 작성 에러:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 내가 받은 리뷰 조회
 */
export const getReceivedReviews = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, reviews: [] }
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        tags,
        comment,
        is_public,
        created_at,
        reviewer:reviewer_id (
          id,
          name,
          photos
        ),
        join:join_id (
          id,
          title,
          date,
          course_name
        )
      `)
      .eq('reviewed_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const reviews = (data || []).map(r => ({
      id: r.id,
      rating: r.rating,
      tags: r.tags || [],
      comment: r.comment,
      isPublic: r.is_public,
      createdAt: r.created_at,
      reviewerId: r.reviewer?.id,
      reviewerName: r.reviewer?.name || '익명',
      reviewerPhoto: r.reviewer?.photos?.[0] || 'https://via.placeholder.com/100',
      joinId: r.join?.id,
      joinTitle: r.join?.title,
      joinDate: r.join?.date,
      courseName: r.join?.course_name,
    }))

    return { success: true, reviews }
  } catch (e) {
    console.error('받은 리뷰 조회 에러:', e)
    return { success: false, reviews: [], error: e.message }
  }
}

/**
 * 내가 작성한 리뷰 조회
 */
export const getSentReviews = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, reviews: [] }
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        tags,
        comment,
        is_public,
        created_at,
        reviewed:reviewed_id (
          id,
          name,
          photos
        ),
        join:join_id (
          id,
          title,
          date,
          course_name
        )
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const reviews = (data || []).map(r => ({
      id: r.id,
      rating: r.rating,
      tags: r.tags || [],
      comment: r.comment,
      isPublic: r.is_public,
      createdAt: r.created_at,
      reviewedId: r.reviewed?.id,
      reviewedName: r.reviewed?.name || '알 수 없음',
      reviewedPhoto: r.reviewed?.photos?.[0] || 'https://via.placeholder.com/100',
      joinId: r.join?.id,
      joinTitle: r.join?.title,
      joinDate: r.join?.date,
      courseName: r.join?.course_name,
    }))

    return { success: true, reviews }
  } catch (e) {
    console.error('작성한 리뷰 조회 에러:', e)
    return { success: false, reviews: [], error: e.message }
  }
}

/**
 * 사용자 평점 조회
 */
export const getUserRating = async (userId) => {
  if (!isConnected() || !userId) {
    return { avgRating: 0, reviewCount: 0, commonTags: [] }
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating, tags')
      .eq('reviewed_id', userId)
      .eq('is_public', true)

    if (error) throw error

    if (!data || data.length === 0) {
      return { avgRating: 0, reviewCount: 0, commonTags: [] }
    }

    // 평균 평점 계산
    const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length

    // 태그 빈도 계산
    const tagCount = {}
    data.forEach(r => {
      (r.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })

    // 상위 3개 태그
    const commonTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag)

    return {
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: data.length,
      commonTags,
    }
  } catch (e) {
    console.error('사용자 평점 조회 에러:', e)
    return { avgRating: 0, reviewCount: 0, commonTags: [] }
  }
}

/**
 * 리뷰 가능한 참가자 조회 (완료된 조인에서 아직 리뷰하지 않은 참가자)
 */
export const getPendingReviews = async (userId) => {
  if (!isConnected() || !userId) {
    return { success: false, pendingReviews: [] }
  }

  try {
    // 내가 참여한 지난 조인 조회
    const today = new Date().toISOString().split('T')[0]

    const { data: myParticipations } = await supabase
      .from('join_participants')
      .select(`
        join:join_id (
          id,
          title,
          date,
          time,
          course_name,
          participants:join_participants (
            user:user_id (
              id,
              name,
              photos
            )
          )
        )
      `)
      .eq('user_id', userId)

    if (!myParticipations || myParticipations.length === 0) {
      return { success: true, pendingReviews: [] }
    }

    // 지난 조인만 필터링
    const pastJoins = myParticipations
      .filter(p => p.join && p.join.date < today)
      .map(p => p.join)

    // 이미 작성한 리뷰 조회
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('reviewed_id, join_id')
      .eq('reviewer_id', userId)

    const reviewedSet = new Set(
      (existingReviews || []).map(r => `${r.reviewed_id}_${r.join_id}`)
    )

    // 리뷰하지 않은 참가자 목록 생성
    const pendingReviews = []
    pastJoins.forEach(join => {
      (join.participants || []).forEach(p => {
        const participantId = p.user?.id
        if (participantId && participantId !== userId) {
          const key = `${participantId}_${join.id}`
          if (!reviewedSet.has(key)) {
            pendingReviews.push({
              joinId: join.id,
              joinTitle: join.title,
              joinDate: join.date,
              joinTime: join.time,
              courseName: join.course_name,
              userId: participantId,
              userName: p.user?.name || '알 수 없음',
              userPhoto: p.user?.photos?.[0] || 'https://via.placeholder.com/100',
            })
          }
        }
      })
    })

    // 날짜 기준 정렬 (최근 조인 먼저)
    pendingReviews.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))

    return { success: true, pendingReviews }
  } catch (e) {
    console.error('리뷰 대기 조회 에러:', e)
    return { success: false, pendingReviews: [], error: e.message }
  }
}

/**
 * 리뷰 삭제
 */
export const deleteReview = async (reviewId, userId) => {
  if (!isConnected() || !reviewId || !userId) {
    return { success: false }
  }

  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', userId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    console.error('리뷰 삭제 에러:', e)
    return { success: false, error: e.message }
  }
}

export default {
  REVIEW_TAGS,
  createReview,
  getReceivedReviews,
  getSentReviews,
  getUserRating,
  getPendingReviews,
  deleteReview,
}
