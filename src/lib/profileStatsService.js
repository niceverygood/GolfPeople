import { supabase, isConnected } from './supabase'

/**
 * 나를 좋아한 사람 수 (관심받음)
 */
export const getLikedByCount = async (userId) => {
  if (!isConnected() || !userId) return 0

  try {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('liked_user_id', userId)

    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

/**
 * 내 조인에 들어온 대기중 신청 수
 */
export const getReceivedApplicationCount = async (userId) => {
  if (!isConnected() || !userId) return 0

  try {
    // 내가 호스트인 조인 ID들
    const { data: myJoins } = await supabase
      .from('joins')
      .select('id')
      .eq('host_id', userId)

    if (!myJoins || myJoins.length === 0) return 0

    const joinIds = myJoins.map(j => j.id)

    const { count, error } = await supabase
      .from('join_applications')
      .select('id', { count: 'exact', head: true })
      .in('join_id', joinIds)
      .eq('status', 'pending')

    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}
