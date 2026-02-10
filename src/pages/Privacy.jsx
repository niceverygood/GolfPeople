import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-900 max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1 mr-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">개인정보 처리방침</h1>
      </div>
      <div className="p-6">
      <p className="text-sm text-gray-500 mb-6">시행일: 2026년 2월 5일</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">1. 수집하는 개인정보</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          골프피플(이하 "서비스")은 다음과 같은 개인정보를 수집합니다.
        </p>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>소셜 로그인 정보 (이름, 이메일, 프로필 사진)</li>
          <li>전화번호 (선택, 본인인증 시)</li>
          <li>프로필 정보 (닉네임, 성별, 나이, 지역, 핸디캡 등)</li>
          <li>골프 스코어 기록</li>
          <li>채팅 메시지</li>
          <li>결제 정보 (App Store 결제를 통해 처리)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">2. 개인정보의 이용 목적</h2>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
          <li>회원 가입 및 본인 확인</li>
          <li>골프 매칭 및 조인 서비스 제공</li>
          <li>채팅 및 커뮤니케이션 기능 제공</li>
          <li>서비스 개선 및 통계 분석</li>
          <li>인앱 결제 처리</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">3. 개인정보의 보관 및 파기</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          회원 탈퇴 시 개인정보는 즉시 파기됩니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>전자상거래 관련 기록: 5년</li>
          <li>로그인 기록: 3개월</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">4. 개인정보의 제3자 제공</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
          단, 법령에 의한 요청이 있는 경우는 예외로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">5. 개인정보의 위탁</h2>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
          <li>Supabase: 데이터 저장 및 인증</li>
          <li>Apple / Google / Kakao: 소셜 로그인</li>
          <li>알리고: SMS 발송 (전화번호 인증 시)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">6. 이용자의 권리</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며,
          회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">7. 문의</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          개인정보 관련 문의는 아래로 연락해주세요.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          이메일: dev@bottlecorp.kr
        </p>
      </section>
    </div>
    </div>
  )
}
