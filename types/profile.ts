/** 프로필 관련 공통 타입 */

export interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
}

export interface ProfileFull extends ProfileInfo {
  height_cm: number | null;
  weight_kg: number | null;
  pregnancy_status: string;
  onboarding_completed: boolean;
  role: string;
}
