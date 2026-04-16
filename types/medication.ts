/** 약 관련 공통 타입 */

export type MedCategory = "chronic" | "prescription" | "supplement";

export interface MedicationInfo {
  name: string;
  type: string;
  category: string;
  dosage: string | null;
  frequency: string | null;
}

export interface MedicationSnapshot {
  name: string;
  type: string;
  dosage: string | null;
}

export interface Medication {
  id: string;
  name: string;
  type: string;
  category: MedCategory;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  archived: boolean;
}

export interface AiResult {
  name: string;
  type: string;
  dosage: string;
  frequency: string;
}

export interface MedicationFormData {
  name: string;
  category: MedCategory;
  dosage: string;
  dailyCount: string;
  times: string[];
  notes: string;
  startDate: string;
  endDate: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
  status: "taken" | "skipped";
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  total: number;
  taken: number;
  skipped: number;
}

export interface SavedReport {
  id: string;
  title: string | null;
  messages: { role: string; content: string }[];
  created_at: string;
}
