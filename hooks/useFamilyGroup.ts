"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FamilyGroup, FamilyMember, MedicationAccess } from "@/types/family";
import type { Medication } from "@/types/medication";

export function useFamilyGroup(groupId: string) {
  const router = useRouter();
  const supabase = createClient();

  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [access, setAccess] = useState<MedicationAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Member medication drawer states
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [memberMeds, setMemberMeds] = useState<Record<string, Medication[]>>({});
  const [medsLoading, setMedsLoading] = useState<string | null>(null);

  // Owner actions
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const isOwner = group?.owner_id === userId;

  const fetchGroup = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: groupData } = await supabase
        .from("family_groups")
        .select("id, owner_id, name, invite_code, created_at")
        .eq("id", groupId)
        .single();

      if (!groupData) {
        router.replace("/family");
        return;
      }
      setGroup(groupData);

      const { data: membersData } = await supabase
        .from("family_members")
        .select("id, group_id, user_id, nickname, role, joined_at")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      setMembers(membersData ?? []);

      const { data: accessData } = await supabase
        .from("family_medication_access")
        .select("id, group_id, member_id, target_user_id, can_view, can_edit")
        .eq("group_id", groupId)
        .eq("member_id", user.id);

      setAccess(accessData ?? []);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase, groupId, router]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const copyInviteCode = async () => {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback not needed for modern browsers
    }
  };

  const canViewMember = (targetUserId: string): boolean => {
    if (targetUserId === userId) return true;
    if (isOwner) return true;
    return access.some(
      (a) => a.target_user_id === targetUserId && a.can_view
    );
  };

  const fetchMemberMeds = async (targetUserId: string) => {
    if (memberMeds[targetUserId]) return;
    setMedsLoading(targetUserId);

    const { data } = await supabase
      .from("medications")
      .select(
        "id, name, type, category, dosage, frequency, notes, is_active, start_date, end_date, archived"
      )
      .eq("user_id", targetUserId)
      .eq("archived", false)
      .order("category", { ascending: true });

    setMemberMeds((prev) => ({ ...prev, [targetUserId]: data ?? [] }));
    setMedsLoading(null);
  };

  const toggleMemberExpand = (targetUserId: string) => {
    if (expandedMember === targetUserId) {
      setExpandedMember(null);
    } else {
      setExpandedMember(targetUserId);
      if (canViewMember(targetUserId)) {
        fetchMemberMeds(targetUserId);
      }
    }
  };

  const handleRenameGroup = async () => {
    if (!newName.trim() || !group) return;
    await supabase
      .from("family_groups")
      .update({ name: newName.trim() })
      .eq("id", group.id);
    setGroup({ ...group, name: newName.trim() });
    setEditingName(false);
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    setRemovingMember(memberId);

    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberUserId);

    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("target_user_id", memberUserId);

    await supabase.from("family_members").delete().eq("id", memberId);

    setRemovingMember(null);
    await fetchGroup();
  };

  const handleLeaveGroup = async () => {
    if (!userId) return;
    setLeavingGroup(true);

    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", userId);

    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("target_user_id", userId);

    await supabase
      .from("family_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    router.replace("/family");
  };

  return {
    group,
    members,
    loading,
    userId,
    copied,
    isOwner,
    expandedMember,
    memberMeds,
    medsLoading,
    editingName,
    newName,
    removingMember,
    leavingGroup,
    setNewName,
    setEditingName,
    copyInviteCode,
    canViewMember,
    toggleMemberExpand,
    handleRenameGroup,
    handleRemoveMember,
    handleLeaveGroup,
  };
}
