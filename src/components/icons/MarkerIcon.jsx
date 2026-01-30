/**
 * 마커 아이콘 공통 컴포넌트
 * 골드 그래디언트 마커 SVG
 */

// 고유 ID 생성 (SSR 호환)
let iconId = 0
const getUniqueId = () => `markerGradient_${++iconId}`

export default function MarkerIcon({ className = "w-5 h-5", id }) {
  const gradientId = id || getUniqueId()

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={`url(#${gradientId})`} />
      <path d="M12 6L14.5 11H17L12 18L7 11H9.5L12 6Z" fill="#0D0D0D" />
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="1" stopColor="#B8962E" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// 작은 마커 아이콘 (인라인 텍스트용)
export function MarkerIconSmall({ className = "w-4 h-4" }) {
  return <MarkerIcon className={className} />
}

// 큰 마커 아이콘 (카드/모달용)
export function MarkerIconLarge({ className = "w-8 h-8" }) {
  return <MarkerIcon className={className} />
}
