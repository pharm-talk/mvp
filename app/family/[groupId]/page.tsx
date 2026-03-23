"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Users,
  Pill,
  Heart,
  MessageCircle,
  Share2,
  LogOut,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* -- Supplement bottle icon -- */
const SupplementBottle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="7" width="10" height="14" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M7 12h10" />
  </svg>
);

type MedCategory = "chronic" | "prescription" | "supplement";

interface FamilyGroup {
  id: string;
  owner_id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

interface FamilyMember {
  id: string;
  group_id: string;
  user_id: string;
  nickname: string | null;
  role: "owner" | "member";
  joined_at: string;
}

interface Medication {
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

interface MedicationAccess {
  id: string;
  group_id: string;
  member_id: string;
  target_user_id: string;
  can_view: boolean;
  can_edit: boolean;
}

const CATEGORY_MAP: Record<
  MedCategory,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    pillBg: string;
    pillText: string;
  }
> = {
  chronic: {
    label: "꾸준히 먹는 약",
    Icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    pillBg: "bg-rose-50",
    pillText: "text-rose-600",
  },
  prescription: {
    label: "처방약",
    Icon: Pill,
    iconBg: "bg-brand-light",
    iconColor: "text-brand",
    pillBg: "bg-brand-light",
    pillText: "text-brand",
  },
  supplement: {
    label: "영양제",
    Icon: SupplementBottle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    pillBg: "bg-orange-50",
    pillText: "text-orange-600",
  },
};

function getDaysRemaining(endDate: string | null): string | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "복용 완료";
  if (diff === 0) return "오늘 마지막";
  return `${diff}일 남음`;
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: groupData } = await supabase
      .from("family_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (!groupData) {
      router.replace("/family");
      return;
    }
    setGroup(groupData);

    const { data: membersData } = await supabase
      .from("family_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    setMembers(membersData ?? []);

    const { data: accessData } = await supabase
      .from("family_medication_access")
      .select("*")
      .eq("group_id", groupId)
      .eq("member_id", user.id);

    setAccess(accessData ?? []);
    setLoading(false);
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
      // Fallback: select text approach not needed for modern browsers
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

    // Remove access records for this member
    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberUserId);

    // Remove access records where this member is the target
    await supabase
      .from("family_medication_access")
      .delete()
      .eq("group_id", groupId)
      .eq("target_user_id", memberUserId);

    // Remove member
    await supabase.from("family_members").delete().eq("id", memberId);

    setRemovingMember(null);
    await fetchGroup();
  };

  const handleLeaveGroup = async () => {
    if (!userId) return;
    setLeavingGroup(true);

    // Remove own access records
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

    // Remove self from group
    await supabase
      .from("family_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    router.replace("/family");
  };

  const buildShareText = (
    nickname: string,
    meds: Medication[]
  ): string => {
    const chronic = meds.filter((m) => m.category === "chronic");
    const prescription = meds.filter((m) => m.category === "prescription");
    const supplement = meds.filter((m) => m.category === "supplement");

    let text = `[${nickname}의 약 서랍 요약]\n\n`;

    if (chronic.length > 0) {
      text += "꾸준히 먹는 약:\n";
      chronic.forEach((m) => {
        text += `- ${m.name}${m.frequency ? ` (${m.frequency})` : ""}\n`;
      });
      text += "\n";
    }

    if (prescription.length > 0) {
      text += "처방약:\n";
      prescription.forEach((m) => {
        const days = getDaysRemaining(m.end_date);
        text += `- ${m.name}${days ? ` (${days})` : ""}\n`;
      });
      text += "\n";
    }

    if (supplement.length > 0) {
      text += "영양제:\n";
      supplement.forEach((m) => {
        text += `- ${m.name}${m.frequency ? ` (${m.frequency})` : ""}\n`;
      });
      text += "\n";
    }

    if (chronic.length === 0 && prescription.length === 0 && supplement.length === 0) {
      text += "등록된 약이 없습니다.\n\n";
    }

    text += "※ 팜톡에서 더 자세히 확인하세요";
    return text;
  };

  const handleShare = async (member: FamilyMember) => {
    const meds = memberMeds[member.user_id] ?? [];
    const nickname = member.nickname ?? "가족";
    const text = buildShareText(nickname, meds);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("약 서랍 요약이 클립보드에 복사되었습니다");
    } catch {
      // Last resort fallback
    }
  };

  const getMemberDisplayName = (member: FamilyMember): string => {
    return member.nickname || "이름 없음";
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <div className="w-10 h-10" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="w-10" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 animate-pulse shadow-card">
            <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 animate-pulse shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/family")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 truncate max-w-48">
            {group.name}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-10">
        {/* Group info card */}
        <div className="px-5 pt-5">
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              {/* Group name (editable for owner) */}
              <div className="flex items-center justify-between mb-3">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleRenameGroup}
                      className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center"
                      aria-label="저장"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center"
                      aria-label="취소"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-brand" />
                      <h2 className="text-lg font-bold text-gray-900">
                        {group.name}
                      </h2>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(group.name);
                          setEditingName(true);
                        }}
                        className="flex items-center gap-1 text-sm font-semibold text-brand active:opacity-70 transition-opacity"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Invite code */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-400 flex-shrink-0">
                  초대 코드
                </span>
                <code className="flex-1 text-sm font-mono font-semibold text-gray-700 tracking-wider">
                  {group.invite_code}
                </code>
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="w-8 h-8 rounded-lg flex items-center justify-center active:bg-gray-200 transition-colors"
                  aria-label="초대 코드 복사"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-brand" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">
            멤버 ({members.length}명)
          </h3>

          <div className="space-y-3">
            {members.map((member) => {
              const isMe = member.user_id === userId;
              const isMemberOwner = member.role === "owner";
              const isExpanded = expandedMember === member.user_id;
              const canView = canViewMember(member.user_id);
              const meds = memberMeds[member.user_id];
              const isLoadingMeds = medsLoading === member.user_id;

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-card overflow-hidden"
                >
                  {/* Member row */}
                  <button
                    type="button"
                    onClick={() => toggleMemberExpand(member.user_id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isMe ? "bg-brand-light" : "bg-gray-100"
                      }`}
                    >
                      <span
                        className={`text-[0.9375rem] font-bold ${
                          isMe ? "text-brand" : "text-gray-400"
                        }`}
                      >
                        {getMemberDisplayName(member).charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                          {getMemberDisplayName(member)}
                        </span>
                        {isMe && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            나
                          </span>
                        )}
                        {isMemberOwner && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded member content */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-4 pb-4">
                      {!canView ? (
                        <p className="text-sm text-gray-400 py-4 text-center">
                          약 서랍 접근 권한이 없습니다
                        </p>
                      ) : isLoadingMeds ? (
                        <div className="py-6 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                      ) : meds && meds.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">
                          등록된 약이 없습니다
                        </p>
                      ) : meds ? (
                        <div className="pt-3 space-y-3">
                          {(["chronic", "prescription", "supplement"] as MedCategory[]).map(
                            (cat) => {
                              const catMeds = meds.filter(
                                (m) => m.category === cat
                              );
                              if (catMeds.length === 0) return null;
                              const config = CATEGORY_MAP[cat];
                              const CatIcon = config.Icon;

                              return (
                                <div key={cat}>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div
                                      className={`w-5 h-5 rounded flex items-center justify-center ${config.iconBg}`}
                                    >
                                      <CatIcon
                                        className={`w-3 h-3 ${config.iconColor}`}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">
                                      {config.label}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {catMeds.map((med) => {
                                      const days = getDaysRemaining(
                                        med.end_date
                                      );
                                      return (
                                        <div
                                          key={med.id}
                                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                                        >
                                          <span className="text-sm font-medium text-gray-800">
                                            {med.name}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {days ??
                                              med.frequency ??
                                              med.dosage ??
                                              ""}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : null}

                      {/* Action buttons */}
                      {canView && !isMe && (
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/chat?target=${member.user_id}&name=${encodeURIComponent(
                                  getMemberDisplayName(member)
                                )}`
                              )
                            }
                            className="flex-1 h-10 rounded-xl bg-brand text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:brightness-95 transition-all duration-200"
                          >
                            <MessageCircle className="w-4 h-4" />
                            대리 질문하기
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare(member)}
                            disabled={!meds}
                            className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold flex items-center gap-1.5 active:bg-gray-200 transition-all duration-200 disabled:opacity-40"
                          >
                            <Share2 className="w-4 h-4" />
                            공유
                          </button>
                        </div>
                      )}

                      {/* Owner: remove member button */}
                      {isOwner && !isMe && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_id)
                          }
                          disabled={removingMember === member.id}
                          className="w-full mt-2 h-9 rounded-lg text-xs font-medium text-red-400 flex items-center justify-center gap-1 active:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {removingMember === member.id
                            ? "내보내는 중..."
                            : "그룹에서 내보내기"}
                        </button>
                      )}

                      {/* Non-owner: leave group button (for self) */}
                      {!isOwner && isMe && (
                        <button
                          type="button"
                          onClick={handleLeaveGroup}
                          disabled={leavingGroup}
                          className="w-full mt-3 h-10 rounded-xl text-sm font-medium text-red-400 flex items-center justify-center gap-1.5 active:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4" />
                          {leavingGroup ? "나가는 중..." : "그룹 나가기"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave group (for non-owners, shown at bottom too) */}
        {!isOwner && (
          <div className="px-5 mt-6">
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={leavingGroup}
              className="w-full h-12 rounded-xl bg-white border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-50 transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {leavingGroup ? "나가는 중..." : "이 그룹 나가기"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
