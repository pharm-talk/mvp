/** 공개 상담 카드용 (민감정보 제외) */
export interface PublicConsultation {
  id: string;
  content: string;
  ai_report: string | null;
  ai_report_at: string | null;
  answer: string | null;
  answered_at: string | null;
  verified_at: string;
  created_at: string;
  tags: string[];
}

/** 홈 미리보기용 축약 */
export interface PublicConsultationPreview {
  id: string;
  content: string;
  verified_at: string;
  created_at: string;
  tags: string[];
}
