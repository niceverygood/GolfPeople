import { useNavigate } from 'react-router-dom'

export default function Support() {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center px-4 py-3 flex-shrink-0">
        <button onClick={() => navigate('/profile?settings=open')} className="p-1 mr-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">고객 지원</h1>
      </div>
      <div className="p-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <p className="text-sm text-gray-500 mb-8">골프피플 앱 사용에 관한 문의 및 지원</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">문의하기</h2>
        <p className="text-sm leading-relaxed text-gray-700 mb-4">
          앱 사용 중 문제가 발생하거나 궁금한 점이 있으시면 아래 이메일로 문의해 주세요.
          영업일 기준 1~2일 이내에 답변 드리겠습니다.
        </p>
        <a
          href="mailto:niceverygood@naver.com"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          niceverygood@naver.com
        </a>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">자주 묻는 질문</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium mb-1">마커는 무엇인가요?</h3>
            <p className="text-sm text-gray-600">
              마커는 골프피플에서 사용하는 인앱 화폐입니다. 친구 요청, 조인 신청 등에 마커가 사용됩니다.
              마커 스토어에서 인앱 결제를 통해 충전할 수 있습니다.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium mb-1">다른 사용자를 신고하고 싶어요.</h3>
            <p className="text-sm text-gray-600">
              채팅방에서 우측 상단 메뉴(⋮)를 탭하면 "신고하기" 또는 "차단하기" 옵션을 선택할 수 있습니다.
              신고 접수 후 관리자가 검토하여 조치합니다.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium mb-1">계정을 삭제하고 싶어요.</h3>
            <p className="text-sm text-gray-600">
              마이페이지 → 설정(⚙️) → 하단의 "계정 탈퇴" 버튼을 통해 계정을 삭제할 수 있습니다.
              탈퇴 시 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium mb-1">결제 환불은 어떻게 하나요?</h3>
            <p className="text-sm text-gray-600">
              인앱 결제 환불은 Apple App Store 또는 Google Play Store의 환불 정책에 따릅니다.
              각 스토어의 구매 내역에서 환불을 요청해 주세요.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">앱 정보</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p><span className="font-medium">앱 이름:</span> 골프피플 (GolfPeople)</p>
          <p><span className="font-medium">개발사:</span> Bottle Corp</p>
          <p><span className="font-medium">이메일:</span> niceverygood@naver.com</p>
        </div>
      </section>

      <section className="mb-8 pb-8 border-t border-gray-200 pt-6">
        <div className="flex gap-4 text-sm text-gray-500">
          <a href="/privacy" className="underline hover:text-gray-700">개인정보처리방침</a>
          <a href="/terms" className="underline hover:text-gray-700">이용약관</a>
        </div>
      </section>
    </div>
    </div>
  )
}
