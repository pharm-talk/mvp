"use client";

import { useRouter } from "next/navigation";
import {
  Crown,
  Pill,
  Heart,
  MessageCircle,
  Share2,
  LogOut,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FamilyMember } from "@/types/family";
import type { Medication, MedCategory } from "@/types/medication";

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

const CATEGORY_MAP: Record<
  MedCategory,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  chronic: {
    label: "꾸준히 먹는 약",
    Icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  prescription: {
    label: "처방약",
    Icon: Pill,
    iconBg: "bg-brand-light",
    iconColor: "text-brand",
  },
  supplement: {
    label: "영양제",
    Icon: SupplementBottle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
};

function getDaysRemaining(endDate: string | null): string | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "복용 완료";
  if (diff === 0) return "오늘 마지막";
  return `${diff}일 남음`;
}

function getMemberDisplayName(member: FamilyMember): string {
  return member.nickname || "이름 없음";
}

function buildShareText(nickname: string, meds: Medication[]): string {
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

  if (
    chronic.length === 0 &&
    prescription.length === 0 &&
    supplement.length === 0
  ) {
    text += "등록된 약이 없습니다.\n\n";
  }

  text += "※ 팜톡에서 더 자세히 확인하세요";
  return text;
}

interface MemberCardProps {
  member: FamilyMember;
  userId: string | null;
  isOwner: boolean;
  isExpanded: boolean;
  canView: boolean;
  meds: Medication[] | undefined;
  isLoadingMeds: boolean;
  removingMember: string | null;
  leavingGroup: boolean;
  onToggleExpand: (targetUserId: string) => void;
  onRemoveMember: (memberId: string, memberUserId: string) => void;
  onLeaveGroup: () => void;
}

export default function MemberCard({
  member,
  userId,
  isOwner,
  isExpanded,
  canView,
  meds,
  isLoadingMeds,
  removingMember,
  leavingGroup,
  onToggleExpand,
  onRemoveMember,
  onLeaveGroup,
}: MemberCardProps) {
  const router = useRouter();
  const isMe = member.user_id === userId;
  const isMemberOwner = member.role === "owner";
  const displayName = getMemberDisplayName(member);

  const handleShare = async () => {
    const medsList = meds ?? [];
    const text = buildShareText(displayName, medsList);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("약 서랍 요약이 클립보드에 복사되었습니다");
    } catch {
      // Last resort fallback
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Member row */}
      <button
        type="button"
        onClick={() => onToggleExpand(member.user_id)}
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
            {displayName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.9375rem] font-semibold text-gray-900 truncate">
              {displayName}
            </span>
            {isMe && (
              <span className="text-xs text-gray-400 flex-shrink-0">나</span>
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
                  const catMeds = meds.filter((m) => m.category === cat);
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
                          const days = getDaysRemaining(med.end_date);
                          return (
                            <div
                              key={med.id}
                              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-800">
                                {med.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {days ?? med.frequency ?? med.dosage ?? ""}
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
                      displayName
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
                onClick={handleShare}
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
              onClick={() => onRemoveMember(member.id, member.user_id)}
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
              onClick={onLeaveGroup}
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
}
