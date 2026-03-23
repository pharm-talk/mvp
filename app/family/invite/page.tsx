"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, KeyRound, Users, Check } from "lucide-react";

type JoinStep = "input" | "joining" | "success" | "error";

interface JoinedGroupInfo {
  groupId: string;
  groupName: string;
  memberCount: number;
}

export default function InvitePage() {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [step, setStep] = useState<JoinStep>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [joinedGroup, setJoinedGroup] = useState<JoinedGroupInfo | null>(null);
  const [nickname, setNickname] = useState("");

  const handleJoin = async () => {
    const trimmed = code.trim().toLowerCase();
    if (trimmed.length !== 12) {
      setErrorMessage("초대 코드는 12자리입니다");
      setStep("error");
      return;
    }

    setStep("joining");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErrorMessage("로그인이 필요합니다");
      setStep("error");
      return;
    }

    // Find group by invite code
    const { data: group } = await supabase
      .from("family_groups")
      .select("id, name, owner_id")
      .eq("invite_code", trimmed)
      .single();

    if (!group) {
      setErrorMessage("유효하지 않은 초대 코드입니다");
      setStep("error");
      return;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      setErrorMessage("이미 이 그룹의 멤버입니다");
      setStep("error");
      return;
    }

    // Add as member
    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        nickname: nickname.trim() || null,
        role: "member",
      });

    if (memberError) {
      setErrorMessage("그룹 참여 중 오류가 발생했습니다");
      setStep("error");
      return;
    }

    // Get existing members (excluding the new member)
    const { data: existingMembers } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("group_id", group.id)
      .neq("user_id", user.id);

    const otherMembers = existingMembers ?? [];

    // Create access records:
    // 1. New member can view all existing members
    // 2. All existing members can view the new member
    const accessRecords: {
      group_id: string;
      member_id: string;
      target_user_id: string;
      can_view: boolean;
      can_edit: boolean;
    }[] = [];

    for (const existing of otherMembers) {
      // New member → can view existing member
      accessRecords.push({
        group_id: group.id,
        member_id: user.id,
        target_user_id: existing.user_id,
        can_view: true,
        can_edit: false,
      });

      // Existing member → can view new member
      accessRecords.push({
        group_id: group.id,
        member_id: existing.user_id,
        target_user_id: user.id,
        can_view: true,
        can_edit: false,
      });
    }

    if (accessRecords.length > 0) {
      await supabase.from("family_medication_access").insert(accessRecords);
    }

    // Get final member count
    const { count } = await supabase
      .from("family_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    setJoinedGroup({
      groupId: group.id,
      groupName: group.name,
      memberCount: count ?? 0,
    });
    setStep("success");
  };

  // Success state
  if (step === "success" && joinedGroup) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <div className="w-10" />
            <h1 className="text-base font-bold text-gray-900">그룹 참여 완료</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mb-5">
            <Check className="w-10 h-10 text-brand" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            환영합니다!
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-2">
            <span className="font-semibold text-gray-700">
              {joinedGroup.groupName}
            </span>{" "}
            그룹에 참여했습니다
          </p>
          <p className="text-sm text-gray-400 mb-8">
            현재 멤버 {joinedGroup.memberCount}명
          </p>

          <button
            type="button"
            onClick={() => router.replace(`/family/${joinedGroup.groupId}`)}
            className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-200"
          >
            그룹으로 이동
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">초대 코드 입력</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pt-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-light mx-auto flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            가족 그룹에 참여하기
          </h2>
          <p className="text-sm text-gray-400">
            그룹 관리자에게 받은 12자리 초대 코드를 입력하세요
          </p>
        </div>

        {/* Code input */}
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          초대 코드
        </label>
        <input
          type="text"
          placeholder="예: a1b2c3d4e5f6"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.slice(0, 12));
            if (step === "error") setStep("input");
          }}
          className={`w-full h-12 rounded-xl border px-4 text-base text-gray-900 font-mono tracking-wider placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 transition-all duration-150 ${
            step === "error"
              ? "border-red-300 focus:ring-red-200 focus:border-red-400"
              : "border-gray-200 focus:ring-brand/30 focus:border-brand"
          }`}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {step === "error" && (
          <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
        )}

        {/* Nickname input */}
        <label className="block text-sm font-semibold text-gray-700 mb-2 mt-5">
          내 별명 (선택)
        </label>
        <input
          type="text"
          placeholder="예: 아들, 딸, 남편"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
        />

        {/* Code length indicator */}
        <div className="flex items-center justify-between mt-3 mb-6">
          <p className="text-xs text-gray-300">{code.length}/12자</p>
          {code.length === 12 && (
            <div className="flex items-center gap-1 text-xs text-brand font-medium">
              <Check className="w-3.5 h-3.5" />
              12자리 입력 완료
            </div>
          )}
        </div>

        {/* Join button */}
        <button
          type="button"
          onClick={handleJoin}
          disabled={code.trim().length !== 12 || step === "joining"}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-200 disabled:opacity-50"
        >
          {step === "joining" ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              참여 중...
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              그룹 참여하기
            </>
          )}
        </button>
      </main>
    </div>
  );
}
