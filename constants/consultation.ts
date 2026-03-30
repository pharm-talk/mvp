import { Clock, MessageCircle, CheckCircle2 } from "lucide-react";

/** 상담 상태 맵 */
export const CONSULTATION_STATUS_MAP = {
  pending: { label: "대기 중", color: "bg-amber-50 text-amber-600", icon: Clock },
  assigned: { label: "약사 배정", color: "bg-blue-50 text-blue-600", icon: MessageCircle },
  answered: { label: "답변 완료", color: "bg-brand-light text-brand", icon: CheckCircle2 },
  closed: { label: "종료", color: "bg-gray-100 text-gray-500", icon: CheckCircle2 },
} as const;

export type ConsultationStatus = keyof typeof CONSULTATION_STATUS_MAP;
