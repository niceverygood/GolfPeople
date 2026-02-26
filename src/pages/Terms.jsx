import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center px-4 py-3 flex-shrink-0 safe-top">
        <button onClick={() => navigate('/profile?settings=open')} className="p-1 mr-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">이용약관</h1>
      </div>
      <div className="p-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <p className="text-sm text-gray-500 mb-6">시행일: 2026년 2월 5일</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제1조 (목적)</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          이 약관은 골프피플(이하 "회사")이 제공하는 골프 매칭 서비스(이하 "서비스")의 이용과 관련하여
          회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제2조 (서비스의 내용)</h2>
        <p className="text-sm leading-relaxed text-gray-700">회사는 다음과 같은 서비스를 제공합니다.</p>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>골프 라운딩 조인 매칭 서비스</li>
          <li>골퍼 프로필 및 친구 추천 서비스</li>
          <li>1:1 채팅 및 조인 채팅 서비스</li>
          <li>골프 스코어 기록 및 통계 서비스</li>
          <li>라운딩 리뷰 및 평가 서비스</li>
          <li>마커(앱 내 포인트) 충전 및 사용</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제3조 (회원 가입)</h2>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>이용자는 소셜 로그인(카카오, 구글, Apple)을 통해 회원 가입할 수 있습니다.</li>
          <li>회원은 정확한 정보를 제공해야 하며, 허위 정보 기재 시 서비스 이용이 제한될 수 있습니다.</li>
          <li>만 18세 미만의 미성년자는 서비스를 이용할 수 없습니다.</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제4조 (마커 및 결제)</h2>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>마커는 서비스 내에서 친구 요청, 조인 신청 등에 사용되는 포인트입니다.</li>
          <li>마커는 앱 내 결제(Apple App Store, Google Play Store)를 통해 충전할 수 있습니다.</li>
          <li>신규 가입 시 보너스 마커가 지급됩니다.</li>
          <li>충전된 마커는 환불이 불가합니다. 단, 관련 법령에 따라 예외가 적용될 수 있습니다.</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제5조 (이용자의 의무)</h2>
        <p className="text-sm leading-relaxed text-gray-700">이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>타인의 개인정보를 도용하거나 허위 정보를 등록하는 행위</li>
          <li>서비스를 이용하여 영업, 광고, 스팸 메시지를 발송하는 행위</li>
          <li>타 이용자에게 욕설, 비방, 성희롱 등을 하는 행위</li>
          <li>서비스의 안정적 운영을 방해하는 행위</li>
          <li>서비스를 이용하여 법령에 위반되는 행위</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제6조 (서비스 이용 제한)</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          회사는 이용자가 제5조를 위반하거나, 다른 이용자로부터 신고를 받은 경우
          서비스 이용을 일시적 또는 영구적으로 제한할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제7조 (회원 탈퇴)</h2>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>회원은 언제든지 서비스 내 설정에서 회원 탈퇴를 요청할 수 있습니다.</li>
          <li>탈퇴 시 모든 개인정보, 프로필, 채팅 기록, 마커 등이 영구 삭제되며 복구할 수 없습니다.</li>
          <li>미사용 마커는 탈퇴 시 소멸됩니다.</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제8조 (면책 조항)</h2>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>회사는 이용자 간의 만남에서 발생하는 분쟁에 대해 책임을 지지 않습니다.</li>
          <li>천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          <li>이용자가 제공한 정보의 정확성에 대해 회사는 보증하지 않습니다.</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">제9조 (준거법 및 분쟁 해결)</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          이 약관의 해석 및 적용에 관하여는 대한민국 법률을 적용하며,
          분쟁 발생 시 회사 소재지 관할 법원을 전속 관할 법원으로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">부칙</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          이 약관은 2026년 2월 5일부터 시행됩니다.
        </p>
      </section>
    </div>
    </div>
  )
}
