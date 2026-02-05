import { Shield, Trophy, Star } from 'lucide-react'

const BADGES = [
  {
    key: 'verified',
    check: (user) => user?.phone_verified || user?.verified,
    icon: Shield,
    label: '인증됨',
    bg: 'bg-gp-green/20',
    text: 'text-gp-green',
  },
  {
    key: 'experienced',
    check: (_, scoreStats) => scoreStats?.totalRounds >= 10,
    icon: Trophy,
    label: '경험자',
    bg: 'bg-gp-gold/20',
    text: 'text-gp-gold',
  },
  {
    key: 'manner',
    check: (_, __, rating) => rating?.avgRating >= 4.0 && rating?.reviewCount >= 3,
    icon: Star,
    label: '매너왕',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
  },
]

export default function VerificationBadges({ user, scoreStats, rating, compact = false }) {
  const activeBadges = BADGES.filter(b => b.check(user, scoreStats, rating))

  if (activeBadges.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeBadges.map(badge => {
        const Icon = badge.icon
        return compact ? (
          <div
            key={badge.key}
            className={`w-5 h-5 rounded-full ${badge.bg} flex items-center justify-center`}
            title={badge.label}
          >
            <Icon className={`w-3 h-3 ${badge.text}`} />
          </div>
        ) : (
          <div
            key={badge.key}
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${badge.bg} ${badge.text} text-xs`}
          >
            <Icon className="w-3 h-3" />
            {badge.label}
          </div>
        )
      })}
    </div>
  )
}
