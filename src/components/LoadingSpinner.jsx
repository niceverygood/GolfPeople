/**
 * 공통 로딩 스피너 컴포넌트
 * 일관된 로딩 UI 제공
 */

import React from 'react'

/**
 * 로딩 스피너
 * @param {string} size - 크기 ('sm' | 'md' | 'lg')
 * @param {string} color - 색상 ('gold' | 'white' | 'gray')
 * @param {string} className - 추가 클래스
 */
export const Spinner = ({ size = 'md', color = 'gold', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }

  const colorClasses = {
    gold: 'border-gp-gold border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gp-text-secondary border-t-transparent',
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
    />
  )
}

/**
 * 전체 화면 로딩
 * @param {string} message - 로딩 메시지
 */
export const FullScreenLoading = ({ message = '로딩 중...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gp-black/80 backdrop-blur-sm">
      <Spinner size="lg" color="gold" />
      {message && (
        <p className="mt-4 text-gp-text-secondary">{message}</p>
      )}
    </div>
  )
}

/**
 * 인라인 로딩 (컨텐츠 영역)
 * @param {string} message - 로딩 메시지
 */
export const InlineLoading = ({ message = '로딩 중...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="md" color="gold" />
      {message && (
        <p className="mt-3 text-sm text-gp-text-secondary">{message}</p>
      )}
    </div>
  )
}

/**
 * 버튼 내부 로딩
 * @param {string} text - 로딩 텍스트
 * @param {string} color - 스피너 색상
 */
export const ButtonLoading = ({ text = '처리 중...', color = 'white' }) => {
  return (
    <span className="flex items-center justify-center gap-2">
      <Spinner size="sm" color={color} />
      {text}
    </span>
  )
}

/**
 * 스켈레톤 로딩 (카드용)
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-gp-card rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gp-border" />
        <div className="flex-1">
          <div className="h-4 bg-gp-border rounded w-3/4 mb-2" />
          <div className="h-3 bg-gp-border rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gp-border rounded w-full" />
        <div className="h-3 bg-gp-border rounded w-5/6" />
      </div>
    </div>
  )
}

/**
 * 스켈레톤 로딩 (프로필용)
 */
export const ProfileSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="w-full h-72 bg-gp-border" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gp-border" />
          <div className="flex-1">
            <div className="h-5 bg-gp-border rounded w-1/3 mb-2" />
            <div className="h-4 bg-gp-border rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gp-border rounded-xl" />
          <div className="h-20 bg-gp-border rounded-xl" />
          <div className="h-20 bg-gp-border rounded-xl" />
          <div className="h-20 bg-gp-border rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * 스켈레톤 로딩 (리스트용)
 * @param {number} count - 아이템 개수
 */
export const ListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export default {
  Spinner,
  FullScreenLoading,
  InlineLoading,
  ButtonLoading,
  CardSkeleton,
  ProfileSkeleton,
  ListSkeleton,
}
