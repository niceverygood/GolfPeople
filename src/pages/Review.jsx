import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, X, Check, ChevronRight, Clock, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../utils/errorHandler'
import {
  REVIEW_TAGS,
  createReview,
  getReceivedReviews,
  getSentReviews,
  getPendingReviews,
} from '../lib/reviewService'

// 탭 옵션
const TABS = [
  { id: 'pending', label: '작성 대기' },
  { id: 'received', label: '받은 리뷰' },
  { id: 'sent', label: '작성한 리뷰' },
]

export default function Review() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [pendingReviews, setPendingReviews] = useState([])
  const [receivedReviews, setReceivedReviews] = useState([])
  const [sentReviews, setSentReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadReviews()
    }
  }, [user?.id])

  const loadReviews = async () => {
    setLoading(true)
    const [pendingResult, receivedResult, sentResult] = await Promise.all([
      getPendingReviews(user.id),
      getReceivedReviews(user.id),
      getSentReviews(user.id),
    ])
    setPendingReviews(pendingResult.pendingReviews || [])
    setReceivedReviews(receivedResult.reviews || [])
    setSentReviews(sentResult.reviews || [])
    setLoading(false)
  }

  const handleWriteReview = (target) => {
    setSelectedTarget(target)
    setShowReviewModal(true)
  }

  const handleReviewComplete = () => {
    setShowReviewModal(false)
    setSelectedTarget(null)
    loadReviews()
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gp-black overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">라운딩 리뷰</h1>
          <p className="text-gp-text-secondary text-sm">동반자 평가 및 후기</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex px-4 py-3 gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? 'bg-gp-gold text-gp-black'
                : 'bg-gp-card text-gp-text-secondary'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingReviews.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gp-red rounded-full text-white text-xs flex items-center justify-center">
                {pendingReviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-2 border-gp-gold border-t-transparent rounded-full" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {pendingReviews.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="w-12 h-12 text-gp-text-secondary" />}
                    title="작성할 리뷰가 없습니다"
                    subtitle="라운딩이 완료되면 동반자를 평가할 수 있어요"
                  />
                ) : (
                  pendingReviews.map((item) => (
                    <PendingReviewCard
                      key={`${item.joinId}-${item.userId}`}
                      item={item}
                      onWrite={() => handleWriteReview(item)}
                    />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'received' && (
              <motion.div
                key="received"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {receivedReviews.length === 0 ? (
                  <EmptyState
                    icon={<Star className="w-12 h-12 text-gp-text-secondary" />}
                    title="받은 리뷰가 없습니다"
                    subtitle="다른 골퍼들이 리뷰를 남기면 여기에 표시돼요"
                  />
                ) : (
                  receivedReviews.map((review) => (
                    <ReceivedReviewCard key={review.id} review={review} />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {sentReviews.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle className="w-12 h-12 text-gp-text-secondary" />}
                    title="작성한 리뷰가 없습니다"
                    subtitle="라운딩 후 동반자에게 리뷰를 남겨보세요"
                  />
                ) : (
                  sentReviews.map((review) => (
                    <SentReviewCard key={review.id} review={review} />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* 리뷰 작성 모달 */}
      <AnimatePresence>
        {showReviewModal && selectedTarget && (
          <WriteReviewModal
            target={selectedTarget}
            userId={user?.id}
            onClose={() => {
              setShowReviewModal(false)
              setSelectedTarget(null)
            }}
            onComplete={handleReviewComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// 빈 상태 컴포넌트
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-gp-text font-medium mt-4">{title}</p>
      <p className="text-gp-text-secondary text-sm mt-1">{subtitle}</p>
    </div>
  )
}

// 대기 중인 리뷰 카드
function PendingReviewCard({ item, onWrite }) {
  return (
    <div className="bg-gp-card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <img
          src={item.userPhoto}
          alt={item.userName}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold">{item.userName}</p>
          <p className="text-gp-text-secondary text-sm">{item.joinTitle}</p>
          <p className="text-gp-text-secondary text-xs mt-0.5">
            {item.joinDate} · {item.courseName}
          </p>
        </div>
        <button
          onClick={onWrite}
          className="px-4 py-2 bg-gp-gold text-gp-black rounded-xl text-sm font-semibold flex items-center gap-1"
        >
          평가하기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// 받은 리뷰 카드
function ReceivedReviewCard({ review }) {
  const tagInfo = REVIEW_TAGS.filter(t => review.tags.includes(t.id))

  return (
    <div className="bg-gp-card rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={review.reviewerPhoto}
          alt={review.reviewerName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold">{review.reviewerName}</p>
          <p className="text-gp-text-secondary text-xs">
            {review.joinDate} · {review.courseName}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 text-gp-gold fill-gp-gold" />
          <span className="font-bold text-lg">{review.rating}</span>
        </div>
      </div>

      {/* 태그 */}
      {tagInfo.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tagInfo.map((tag) => (
            <span
              key={tag.id}
              className="px-2.5 py-1 bg-gp-gold/10 text-gp-gold rounded-lg text-xs"
            >
              {tag.emoji} {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-gp-text-secondary text-sm bg-gp-black/30 rounded-xl p-3">
          "{review.comment}"
        </p>
      )}
    </div>
  )
}

// 작성한 리뷰 카드
function SentReviewCard({ review }) {
  const tagInfo = REVIEW_TAGS.filter(t => review.tags.includes(t.id))

  return (
    <div className="bg-gp-card rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={review.reviewedPhoto}
          alt={review.reviewedName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold">{review.reviewedName}</p>
          <p className="text-gp-text-secondary text-xs">
            {review.joinDate} · {review.courseName}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 text-gp-gold fill-gp-gold" />
          <span className="font-bold text-lg">{review.rating}</span>
        </div>
      </div>

      {/* 태그 */}
      {tagInfo.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tagInfo.map((tag) => (
            <span
              key={tag.id}
              className="px-2.5 py-1 bg-gp-border rounded-lg text-xs text-gp-text-secondary"
            >
              {tag.emoji} {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-gp-text-secondary text-sm bg-gp-black/30 rounded-xl p-3">
          "{review.comment}"
        </p>
      )}

      {!review.isPublic && (
        <p className="text-gp-text-secondary text-xs mt-2">비공개 리뷰</p>
      )}
    </div>
  )
}

// 리뷰 작성 모달
function WriteReviewModal({ target, userId, onClose, onComplete }) {
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [comment, setComment] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast.warning('별점을 선택해주세요')
      return
    }

    setSubmitting(true)
    const result = await createReview(userId, target.userId, target.joinId, {
      rating,
      tags: selectedTags,
      comment,
      isPublic,
    })
    setSubmitting(false)

    if (result.success) {
      showToast.success('리뷰가 등록되었습니다')
      onComplete()
    } else if (result.error === 'already_reviewed') {
      showToast.error('이미 리뷰를 작성했습니다')
    } else {
      showToast.error('리뷰 등록에 실패했습니다')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full bg-gp-card rounded-t-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gp-border">
          <h2 className="text-lg font-bold">동반자 평가</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gp-border flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* 평가 대상 */}
          <div className="flex items-center gap-3 bg-gp-black/30 rounded-xl p-3">
            <img
              src={target.userPhoto}
              alt={target.userName}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{target.userName}</p>
              <p className="text-gp-text-secondary text-sm">{target.joinTitle}</p>
              <p className="text-gp-text-secondary text-xs">{target.joinDate}</p>
            </div>
          </div>

          {/* 별점 */}
          <div>
            <p className="font-medium mb-3">별점</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= rating
                        ? 'text-gp-gold fill-gp-gold'
                        : 'text-gp-border'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gp-text-secondary text-sm mt-2">
              {rating === 0 && '별점을 선택해주세요'}
              {rating === 1 && '아쉬워요'}
              {rating === 2 && '조금 아쉬워요'}
              {rating === 3 && '보통이에요'}
              {rating === 4 && '좋았어요'}
              {rating === 5 && '최고예요!'}
            </p>
          </div>

          {/* 태그 */}
          <div>
            <p className="font-medium mb-3">
              어떤 점이 좋았나요?
              <span className="text-gp-text-secondary text-sm ml-2">(최대 5개)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1 ${
                    selectedTags.includes(tag.id)
                      ? 'bg-gp-gold text-gp-black'
                      : 'bg-gp-border text-gp-text-secondary'
                  }`}
                >
                  {selectedTags.includes(tag.id) && <Check className="w-4 h-4" />}
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 코멘트 */}
          <div>
            <p className="font-medium mb-3">
              한줄 코멘트
              <span className="text-gp-text-secondary text-sm ml-2">(선택)</span>
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="함께 라운딩한 소감을 남겨주세요"
              maxLength={100}
              className="w-full h-20 bg-gp-black/30 rounded-xl p-3 text-gp-text placeholder:text-gp-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-gp-gold"
            />
            <p className="text-right text-gp-text-secondary text-xs mt-1">
              {comment.length}/100
            </p>
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center justify-between bg-gp-black/30 rounded-xl p-3">
            <div>
              <p className="font-medium">리뷰 공개</p>
              <p className="text-gp-text-secondary text-xs">상대방과 다른 사용자에게 공개됩니다</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-7 rounded-full transition-all relative ${
                isPublic ? 'bg-gp-gold' : 'bg-gp-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                  isPublic ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="p-4 border-t border-gp-border safe-bottom">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              rating === 0 || submitting
                ? 'bg-gp-border text-gp-text-secondary'
                : 'btn-gold'
            }`}
          >
            {submitting ? '등록 중...' : '리뷰 등록하기'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
