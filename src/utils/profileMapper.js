/**
 * Supabase profiles 테이블 → 앱 유저 구조 매핑
 * Home.jsx, ProfileDetail.jsx 등이 기대하는 필드 구조로 변환
 */

const calculateAge = (birthYear) => {
  if (!birthYear) return null
  return new Date().getFullYear() - birthYear
}

/**
 * Supabase profile → 앱 유저 객체
 */
export const mapProfileToUser = (profile) => {
  if (!profile) return null

  return {
    id: profile.id,
    name: profile.name || '',
    age: calculateAge(profile.birth_year),
    gender: profile.gender || null,
    region: profile.regions?.[0] || '',
    regions: profile.regions || [],
    handicap: profile.handicap || '',
    style: profile.styles || [],
    styles: profile.styles || [],
    availableTime: profile.times?.join(', ') || '',
    times: profile.times || [],
    photos: profile.photos || [],
    intro: profile.intro || '',
    verified: profile.is_verified || profile.phone_verified || false,
    isOnline: profile.is_online || false,
    lastSeenAt: profile.last_seen_at,
    scoreStats: null,
    roundCount: 0,
    email: profile.email,
    phone: profile.phone,
  }
}

/**
 * Supabase 알림 → 앱 알림 객체
 */
export const mapNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message || n.body || '',
  userPhoto: n.data?.userPhoto || null,
  isRead: n.is_read || false,
  createdAt: n.created_at,
  data: n.data || {},
})

export default { mapProfileToUser, mapNotification }
