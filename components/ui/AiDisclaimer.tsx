import { Info, ShieldCheck } from "lucide-react";
import { Robot } from "@phosphor-icons/react";

/** AI 리포트 바로 아래: 신뢰 문구 */
export function AiTrustLine() {
  return (
    <div className="rounded-xl bg-blue-50/70 border border-blue-100/80 px-4 py-3 mt-2.5 mb-1">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[0.75rem] text-blue-700 leading-relaxed" style={{ wordBreak: "keep-all" }}>
          면허 인증 약사가 직접 참여해 만든 AI가 분석한 결과예요. 약사 검증을 받으면 더 정확한 상담을 받을 수 있어요.
        </p>
      </div>
    </div>
  );
}

/** 페이지 하단: 면책 고지 */
export function AiDisclaimerFooter() {
  return (
    <div className="px-1 py-2 mt-4">
      <p
        className="text-[0.6875rem] text-gray-300 leading-relaxed text-center"
        style={{ wordBreak: "keep-all" }}
      >
        본 분석은 AI가 제공하는 참고용 정보이며, 의학적 진단이나 처방을 대체하지 않습니다. 정확한 복약 지도는 담당 의사 또는 약사와 상담하세요.
      </p>
    </div>
  );
}

/** 상담 요청 페이지: 프로세스 안내 배너 */
export function ConsultProcessBanner() {
  return (
    <div className="rounded-2xl bg-brand-light/50 px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
        <div>
          <p
            className="text-[0.8125rem] font-semibold text-brand leading-snug mb-1"
            style={{ wordBreak: "keep-all" }}
          >
            AI가 즉시 분석하고, 면허 약사가 검증해요
          </p>
          <p
            className="text-[0.6875rem] text-brand/60 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            입력하신 건강 정보는 상담 분석 목적으로만 사용되며 외부에 공유되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

/** 공개 상담 하단: 면책 고지 */
export function PublicConsultDisclaimer() {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3.5 space-y-2 mt-4">
      <p className="text-[0.6875rem] font-semibold text-gray-500 flex items-center gap-1.5">
        <Info className="w-3 h-3" />
        꼭 확인해주세요
      </p>
      <ul className="space-y-1.5 text-[0.6875rem] text-gray-400 leading-relaxed pl-1">
        <li className="flex gap-2" style={{ wordBreak: "keep-all" }}>
          <span className="text-gray-300 flex-shrink-0">·</span>
          본 답변은 AI 분석과 약사 검증을 거친 참고용 정보이며, 의학적 진단이나 처방을 대체하지 않습니다.
        </li>
        <li className="flex gap-2" style={{ wordBreak: "keep-all" }}>
          <span className="text-gray-300 flex-shrink-0">·</span>
          정확한 복약 상담은 가까운 약국 또는 담당 의사에게 문의하세요.
        </li>
        <li className="flex gap-2" style={{ wordBreak: "keep-all" }}>
          <span className="text-gray-300 flex-shrink-0">·</span>
          개인정보 보호를 위해 상담 내용은 익명으로 공개됩니다.
        </li>
      </ul>
    </div>
  );
}
