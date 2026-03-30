/** 가족 그룹 관련 타입 */

export interface FamilyGroup {
  id: string;
  owner_id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  group_id: string;
  user_id: string;
  nickname: string | null;
  role: "owner" | "member";
  joined_at: string;
}

export interface MedicationAccess {
  id: string;
  group_id: string;
  member_id: string;
  target_user_id: string;
  can_view: boolean;
  can_edit: boolean;
}
