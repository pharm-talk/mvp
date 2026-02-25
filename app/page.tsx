import { ClipboardList, MessageCircle, Pill, User } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* 상단 앱바 */}
      <header className="flex items-center justify-between border-b border-slate-100 py-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-tight text-slate-900">
            Pharm Talk
          </span>
          <span className="text-[11px] text-slate-400">
            면허 인증 약사 복약상담
          </span>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700">
          로그인
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col gap-6 py-6">
        {/* 히어로 영역 */}
        <section className="space-y-3">
          <p className="text-xs font-medium text-slate-500">
            복약 · 영양제 상담
          </p>
          <h1 className="text-[22px] font-semibold leading-snug text-slate-900">
            내 약, 내 영양제
            <br />
            지금 조합이 괜찮은지
            <br />
            약사에게 확인해보세요.
          </h1>
          <p className="text-[13px] leading-relaxed text-slate-500">
            복용 중인 약/영양제를 정리하고
            <br />
            면허 인증 약사가 1:1로 검토해주는 모바일 상담 서비스입니다.
          </p>
        </section>

        {/* 주요 CTA */}
        <section className="space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white">
            <Pill className="h-4 w-4" />
            복약상담 시작하기
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-900">
            <MessageCircle className="h-4 w-4" />
            가벼운 증상, 약사에게 질문하기
          </button>
        </section>

        {/* 요약 카드 */}
        <section className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1 text-[11px] font-medium text-slate-500">
              내 약 서랍
            </p>
            <p className="text-sm font-semibold text-slate-900">0개 등록됨</p>
            <p className="mt-1 text-[11px] text-slate-500">
              먹고 있는 약과 영양제를
              <br />
              한 번에 정리해두세요.
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1 text-[11px] font-medium text-slate-500">
              진행 중인 상담
            </p>
            <p className="text-sm font-semibold text-slate-900">0건</p>
            <p className="mt-1 text-[11px] text-slate-500">
              답변이 완료되면
              <br />
              알림으로 바로 알려드려요.
            </p>
          </div>
        </section>

        {/* 서비스 설명 */}
        <section className="space-y-2 rounded-lg border border-slate-100 bg-white p-3 text-[12px]">
          <p className="text-[11px] font-medium text-slate-500">
            PHARM TALK은 이런 서비스예요
          </p>
          <ul className="space-y-1 text-[12px] text-slate-600">
            <li>· 영양제/처방약 조합이 괜찮은지 약사가 직접 검토</li>
            <li>· 겹치는 성분, 상호작용, 복용 시간까지 한 번에 정리</li>
            <li>· 동네 약국에 가기 애매한 질문도 비동기로 편하게</li>
          </ul>
        </section>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="sticky bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 py-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <button className="flex flex-1 flex-col items-center gap-1 text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
              <Pill className="h-3.5 w-3.5" />
            </span>
            <span>홈</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50">
              <ClipboardList className="h-3.5 w-3.5" />
            </span>
            <span>내 약 서랍</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span>상담 기록</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50">
              <User className="h-3.5 w-3.5" />
            </span>
            <span>마이</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
