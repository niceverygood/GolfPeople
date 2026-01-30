/**
 * 마커 사용 확인 모달
 * Join.jsx, JoinDetail.jsx 등에서 반복되던 모달 통합
 */

import React from 'react'
import MarkerIcon from './icons/MarkerIcon'

// 액션별 설정
const ACTION_CONFIG = {
  profile_view: {
    title: '프로필 확인',
    description: '이 회원의 프로필을 확인하시겠습니까?',
    icon: '👤',
    iconBg: 'bg-blue-500',
  },
  friend_request: {
    title: '친구 요청',
    description: '이 회원에게 친구 요청을 보내시겠습니까?',
    icon: '🤝',
    iconBg: 'bg-green-500',
  },
  join_application: {
    title: '조인 참가',
    description: '이 조인에 참가 신청하시겠습니까?',
    icon: '⛳',
    iconBg: 'bg-amber-500',
  },
}

/**
 * 마커 사용 확인 모달
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onConfirm - 확인 핸들러
 * @param {string} props.actionType - 액션 타입 (profile_view, friend_request, join_application)
 * @param {number} props.cost - 마커 비용
 * @param {number} props.balance - 현재 잔액
 * @param {boolean} props.isProcessing - 처리 중 여부
 * @param {string} props.customTitle - 커스텀 제목 (옵션)
 * @param {string} props.customDescription - 커스텀 설명 (옵션)
 */
const MarkerConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  cost,
  balance,
  isProcessing = false,
  customTitle = null,
  customDescription = null,
}) => {
  if (!isOpen) return null

  const config = ACTION_CONFIG[actionType] || {
    title: '마커 사용',
    description: '마커를 사용하시겠습니까?',
    icon: '🎯',
    iconBg: 'bg-gray-500',
  }

  const title = customTitle || config.title
  const description = customDescription || config.description
  const remainingBalance = balance - cost

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl animate-scale-in">
        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center text-3xl shadow-lg`}>
            {config.icon}
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
          {title}
        </h3>

        {/* 설명 */}
        <p className="text-gray-600 text-center mb-4">
          {description}
        </p>

        {/* 마커 정보 박스 */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-6 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">사용 마커</span>
            <div className="flex items-center gap-1">
              <MarkerIcon className="w-4 h-4" />
              <span className="font-bold text-amber-600">{cost}개</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">사용 후 잔액</span>
            <div className="flex items-center gap-1">
              <MarkerIcon className="w-4 h-4" />
              <span className={`font-bold ${remainingBalance < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                {remainingBalance}개
              </span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </>
            ) : (
              '확인'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MarkerConfirmModal
