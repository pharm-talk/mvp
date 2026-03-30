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
