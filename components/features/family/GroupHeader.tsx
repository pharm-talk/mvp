"use client";

import { Copy, Check, Users, Pencil, X } from "lucide-react";
import type { FamilyGroup } from "@/types/family";

interface GroupHeaderProps {
  group: FamilyGroup;
  isOwner: boolean;
  copied: boolean;
  editingName: boolean;
  newName: string;
  onCopyInviteCode: () => void;
  onSetNewName: (name: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onRename: () => void;
}

export default function GroupHeader({
  group,
  isOwner,
  copied,
  editingName,
  newName,
  onCopyInviteCode,
  onSetNewName,
  onStartEditing,
  onCancelEditing,
  onRename,
}: GroupHeaderProps) {
  return (
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
                  onChange={(e) => onSetNewName(e.target.value)}
                  className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={onRename}
                  className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center"
                  aria-label="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onCancelEditing}
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
                    onClick={onStartEditing}
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
              onClick={onCopyInviteCode}
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
  );
}
