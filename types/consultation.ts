/** 상담 유형 */
export type ConsultType = "medication" | "supplement";

/** AI 채팅 메시지 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** AI 이미지 분석에서 추출된 약 */
export interface ExtractedMed {
  name: string;
  dosage: string;
}

/** 상담 유형별 가이드 상수 */
export const MEDICATION_TOPICS = [
  { value: "interaction", label: "약 궁합 확인" },
  { value: "side_effect", label: "부작용 상담" },
  { value: "dosage", label: "복용법 문의" },
  { value: "alternative", label: "대체약 상담" },
  { value: "other", label: "기타" },
] as const;

export const SUPPLEMENT_GOALS = [
  { value: "recommend", label: "영양제 추천" },
  { value: "combination", label: "조합 검토" },
  { value: "fatigue", label: "피로 회복" },
  { value: "immunity", label: "면역력" },
  { value: "skin", label: "피부/모발" },
  { value: "bone", label: "뼈/관절" },
  { value: "digestion", label: "소화/장건강" },
  { value: "sleep", label: "수면" },
  { value: "other", label: "기타" },
] as const;

export const MEDICATION_SYMPTOMS = [
  "두통", "어지러움", "소화불량", "메스꺼움", "피부발진",
  "졸림", "불면", "근육통", "식욕변화", "기타",
];

/** 환자 건강 스냅샷 */
export interface HealthSnapshot {
  gender?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  conditions?: string[];
  allergies?: string[];
  pregnancy_status?: string;
}

/** 복용약 스냅샷 */
export interface MedSnapshot {
  name: string;
  type: string;
  dosage: string | null;
  frequency: string | null;
}

/** 약사 상담 상세 */
export interface PharmacistConsultation {
  id: string;
  user_id: string;
  content: string;
  type: string;
  status: string;
  pharmacist_id: string | null;
  health_snapshot: HealthSnapshot | null;
  medications_snapshot: MedSnapshot[] | null;
  answer: string | null;
  answered_at: string | null;
  ai_report: string | null;
  ai_report_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  followup_question: string | null;
  followup_answer: string | null;
  created_at: string;
}

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
