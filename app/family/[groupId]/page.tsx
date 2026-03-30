"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFamilyGroup } from "@/hooks/useFamilyGroup";
import GroupDetailSkeleton from "@/components/features/family/GroupDetailSkeleton";
import GroupHeader from "@/components/features/family/GroupHeader";
import MemberCard from "@/components/features/family/MemberCard";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const {
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
  } = useFamilyGroup(groupId);

  if (loading) return <GroupDetailSkeleton />;
  if (!group) return null;

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
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
        <GroupHeader
          group={group}
          isOwner={isOwner}
          copied={copied}
          editingName={editingName}
          newName={newName}
          onCopyInviteCode={copyInviteCode}
          onSetNewName={setNewName}
          onStartEditing={() => {
            setNewName(group.name);
            setEditingName(true);
          }}
          onCancelEditing={() => setEditingName(false)}
          onRename={handleRenameGroup}
        />

        {/* Members list */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">
            멤버 ({members.length}명)
          </h3>

          <div className="space-y-3">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                userId={userId}
                isOwner={isOwner}
                isExpanded={expandedMember === member.user_id}
                canView={canViewMember(member.user_id)}
                meds={memberMeds[member.user_id]}
                isLoadingMeds={medsLoading === member.user_id}
                removingMember={removingMember}
                leavingGroup={leavingGroup}
                onToggleExpand={toggleMemberExpand}
                onRemoveMember={handleRemoveMember}
                onLeaveGroup={handleLeaveGroup}
              />
            ))}
          </div>
        </div>

        {/* Leave group (for non-owners) */}
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
