"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  Users,
  Crown,
  ChevronRight,
  KeyRound,
} from "lucide-react";

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

interface GroupWithMembers extends FamilyGroup {
  members: FamilyMember[];
  isOwner: boolean;
}

export default function FamilyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Get all groups the user belongs to
    const { data: memberships } = await supabase
      .from("family_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groupsData } = await supabase
      .from("family_groups")
      .select("id, owner_id, name, invite_code, created_at")
      .in("id", groupIds);

    if (!groupsData) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Get all members for these groups
    const { data: allMembers } = await supabase
      .from("family_members")
      .select("id, group_id, user_id, nickname, role, joined_at")
      .in("group_id", groupIds);

    const groupsWithMembers: GroupWithMembers[] = groupsData.map((g) => ({
      ...g,
      members: (allMembers ?? []).filter((m) => m.group_id === g.id),
      isOwner: g.owner_id === user.id,
    }));

    setGroups(groupsWithMembers);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !userId) return;
    setCreating(true);

    const { data: group, error: groupError } = await supabase
      .from("family_groups")
      .insert({ owner_id: userId, name: newGroupName.trim() })
      .select()
      .single();

    if (groupError || !group) {
      setCreating(false);
      return;
    }

    // Add owner as a member
    await supabase.from("family_members").insert({
      group_id: group.id,
      user_id: userId,
      nickname: newNickname.trim() || null,
      role: "owner",
    });

    setShowCreateModal(false);
    setNewGroupName("");
    setNewNickname("");
    setCreating(false);
    await fetchGroups();
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">가족 관리</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-10">
        {loading ? (
          <div className="px-5 pt-5 space-y-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 animate-pulse shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* Empty state */
          <div className="px-5 pt-16 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-light mx-auto flex items-center justify-center mb-5">
              <Users className="w-10 h-10 text-brand" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              아직 가족 그룹이 없어요
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              가족 그룹을 만들어 서로의 약 정보를
              <br />
              공유하고 건강을 함께 관리해 보세요
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-200"
              >
                <Plus className="w-4.5 h-4.5" />
                가족 그룹 만들기
              </button>
              <button
                type="button"
                onClick={() => router.push("/family/invite")}
                className="w-full h-12 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-50 transition-all duration-200"
              >
                <KeyRound className="w-4.5 h-4.5" />
                초대 코드 입력
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Action buttons */}
            <div className="px-5 pt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex-1 h-11 rounded-xl bg-brand text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:brightness-95 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                그룹 만들기
              </button>
              <button
                type="button"
                onClick={() => router.push("/family/invite")}
                className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-gray-50 transition-all duration-200"
              >
                <KeyRound className="w-4 h-4" />
                초대 코드
              </button>
            </div>

            {/* Group list */}
            <div className="px-5 mt-4 space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => router.push(`/family/${group.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-card active:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[0.9375rem] font-bold text-gray-900 truncate">
                          {group.name}
                        </span>
                        {group.isOwner && (
                          <span className="inline-flex items-center gap-0.5 h-5 px-2 rounded-full bg-amber-50 text-amber-600 text-[0.6875rem] font-semibold flex-shrink-0">
                            <Crown className="w-3 h-3" />
                            관리자
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        멤버 {group.members.length}명
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Group Modal (Bottom Sheet) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCreateModal(false)}
            role="presentation"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl safe-bottom animate-slide-up">
            <div className="max-w-lg mx-auto px-6 pt-6 pb-6">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                새 가족 그룹
              </h2>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                그룹 이름
              </label>
              <input
                type="text"
                placeholder="예: 우리 가족"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-4"
                autoFocus
              />

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                내 별명 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 엄마, 아빠, 딸"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
              />

              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={creating || !newGroupName.trim()}
                className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-200 disabled:opacity-50"
              >
                {creating ? "만드는 중..." : "그룹 만들기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
