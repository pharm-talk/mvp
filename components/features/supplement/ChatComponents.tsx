"use client";

import { Check } from "lucide-react";
import { Robot } from "@phosphor-icons/react";

/* ── BotAvatar ── */

export function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-brand/8 flex items-center justify-center flex-shrink-0">
      <Robot size={16} weight="duotone" className="text-brand" />
    </div>
  );
}

/* ── TypingIndicator ── */

export function TypingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="bg-gray-50/80 rounded-2xl rounded-tl-md px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span className="text-xs text-gray-400 ml-1">{text}</span>
        </div>
      </div>
    </div>
  );
}

/* ── AiMessage ── */

export function AiMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="bg-gray-50/80 rounded-2xl rounded-tl-md px-3.5 pt-[0.6rem] pb-[0.65rem] max-w-[82%]">
        <p
          className="text-[0.875rem] text-gray-700 leading-[1.5] whitespace-pre-wrap"
          style={{ wordBreak: "keep-all" }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}

/* ── UserMessage ── */

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-brand/90 text-white rounded-2xl rounded-tr-md px-3.5 pt-[0.6rem] pb-[0.65rem] max-w-[82%]">
        <p className="text-[0.875rem] leading-[1.5]" style={{ wordBreak: "keep-all" }}>{content}</p>
      </div>
    </div>
  );
}

/* ── ReportLoadingSkeleton ── */

export function ReportLoadingSkeleton() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <BotAvatar />
      <div className="flex-1 max-w-[90%]">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl p-3.5 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ChipSelector (IntakeChips) ── */

interface ChipSelectorProps {
  chips: string[];
  selected: string[];
  multiSelect: boolean;
  onToggle: (chip: string) => void;
  disabled?: boolean;
}

export function ChipSelector({
  chips,
  selected,
  multiSelect,
  onToggle,
  disabled,
}: ChipSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 ml-9 mb-2">
      {chips.map((chip) => {
        const isSelected = selected.includes(chip);
        return (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(chip)}
            className={`inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-full text-[0.8125rem] leading-none font-medium transition-all duration-200 active:scale-[0.97] ${
              isSelected
                ? "bg-brand/10 text-brand border border-brand/30"
                : "bg-white text-gray-600 border border-gray-150 active:border-gray-300"
            } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
            style={{ wordBreak: "keep-all" }}
          >
            {multiSelect && isSelected && (
              <Check className="w-3 h-3 flex-shrink-0" />
            )}
            {chip}
          </button>
        );
      })}
    </div>
  );
}
