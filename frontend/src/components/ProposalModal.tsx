import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, MessageCircle, Send, Check } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { regions } from '../data/mockData';

const dateOptions = [
  { label: '이번 주말', value: 'this_weekend' },
  { label: '다음 주말', value: 'next_weekend' },
  { label: '평일 언제든', value: 'weekday' },
  { label: '협의 가능', value: 'flexible' },
];

export default function ProposalModal() {
  const { 
    isProposalModalOpen, 
    proposalTargetUser, 
    closeProposalModal,
    addProposal,
    removeUser,
  } = useAppStore();
  
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleDate = (value: string) => {
    setSelectedDates((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : prev.length < 2
        ? [...prev, value]
        : prev
    );
  };

  const handleSubmit = () => {
    if (!proposalTargetUser || selectedDates.length === 0 || !selectedRegion) return;

    addProposal({
      id: Date.now().toString(),
      fromUserId: 'current-user',
      toUserId: proposalTargetUser.id,
      dateOption1: selectedDates[0],
      dateOption2: selectedDates[1],
      region: selectedRegion,
      message: message || undefined,
      status: 'pending',
      createdAt: new Date(),
    });

    setIsSubmitted(true);
    
    setTimeout(() => {
      removeUser(proposalTargetUser.id);
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setSelectedDates([]);
    setSelectedRegion('');
    setMessage('');
    setIsSubmitted(false);
    closeProposalModal();
  };

  const isValid = selectedDates.length > 0 && selectedRegion;

  return (
    <AnimatePresence>
      {isProposalModalOpen && proposalTargetUser && (
        <>
          {/* 백드롭 */}
          <motion.div
            className="fixed inset-0 modal-backdrop z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-gp-dark rounded-t-3xl overflow-hidden safe-area-inset-bottom"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 핸들 바 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gp-border rounded-full" />
            </div>

            {isSubmitted ? (
              // 제안 완료 상태
              <motion.div
                className="flex flex-col items-center justify-center py-16 px-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gp-green flex items-center justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Check className="w-10 h-10 text-black" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  제안을 보냈어요!
                </h3>
                <p className="text-gp-text-secondary text-center">
                  {proposalTargetUser.nickname}님이 수락하면<br />
                  채팅방이 열려요
                </p>
              </motion.div>
            ) : (
              // 제안 폼
              <div className="px-6 pb-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={proposalTargetUser.photos[0]}
                      alt={proposalTargetUser.nickname}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {proposalTargetUser.nickname}
                      </h3>
                      <p className="text-sm text-gp-text-secondary">
                        에게 라운딩 제안하기
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-gp-card flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gp-text-secondary" />
                  </button>
                </div>

                {/* 날짜 선택 */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-gp-green" />
                    <span className="text-white font-medium">언제 치고 싶으세요?</span>
                    <span className="text-gp-text-muted text-sm">(최대 2개)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleDate(option.value)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                          selectedDates.includes(option.value)
                            ? 'bg-gp-green text-black'
                            : 'bg-gp-card text-white border border-gp-border hover:border-gp-green/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 지역 선택 */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-gp-green" />
                    <span className="text-white font-medium">어디서 치고 싶으세요?</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['서울', '경기', '인천', '부산', '대구', '기타'].map((region) => (
                      <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`py-2 px-4 rounded-full text-sm font-medium transition-all ${
                          selectedRegion === region
                            ? 'bg-gp-green text-black'
                            : 'bg-gp-card text-white border border-gp-border hover:border-gp-green/50'
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 메시지 (선택) */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-gp-text-muted" />
                    <span className="text-gp-text-secondary font-medium">
                      한 마디 (선택)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ex) 편하게 즐겁게 치고 싶어요!"
                    maxLength={50}
                    className="w-full py-3 px-4 bg-gp-card border border-gp-border rounded-xl text-white placeholder:text-gp-text-muted focus:outline-none focus:border-gp-green/50"
                  />
                </div>

                {/* 제안 버튼 */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className={`w-full mt-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isValid
                      ? 'bg-gp-green text-black'
                      : 'bg-gp-card text-gp-text-muted cursor-not-allowed'
                  }`}
                  whileTap={isValid ? { scale: 0.98 } : {}}
                >
                  <Send className="w-5 h-5" />
                  라운딩 제안 보내기
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

