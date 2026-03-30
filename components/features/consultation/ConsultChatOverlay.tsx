"use client";

import type { RefObject } from "react";
import {
  ArrowLeft,
  Wand2,
  Send,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import type { ChatMessage } from "@/types/consultation";

interface ConsultChatOverlayProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  chatLoading: boolean;
  suggestedContent: string;
  summarizing: boolean;
  onClose: () => void;
  onSend: () => void;
  onApplySuggestion: () => void;
  onApplyConversationSummary: () => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatInputRef: RefObject<HTMLInputElement | null>;
}

export default function ConsultChatOverlay({
  chatMessages,
  chatInput,
  onChatInputChange,
  chatLoading,
  suggestedContent,
  summarizing,
  onClose,
  onSend,
  onApplySuggestion,
  onApplyConversationSummary,
  chatEndRef,
  chatInputRef,
}: ConsultChatOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* 오버레이 헤더 */}
      <header className="flex-shrink-0 border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="닫기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-brand" />
            <h2 className="text-base font-bold text-gray-900">질문 정리 도우미</h2>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-3">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                }`}
                style={{ wordBreak: "keep-all" }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 제안된 상담 내용 */}
        {suggestedContent && (
          <div className="mt-4 bg-brand-light border border-brand/10 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-brand" />
              <p className="text-sm font-semibold text-brand">정리된 상담 내용</p>
            </div>
            <p
              className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3"
              style={{ wordBreak: "keep-all" }}
            >
              {suggestedContent}
            </p>
            <button
              type="button"
              onClick={onApplySuggestion}
              className="w-full h-10 rounded-xl bg-brand text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:brightness-95 transition-all duration-150"
            >
              <Check className="w-4 h-4" />
              이 내용으로 상담하기
            </button>
            <p className="text-xs text-brand/50 text-center mt-2">
              적용 후 직접 수정할 수도 있어요
            </p>
          </div>
        )}
      </div>

      {/* 대화 내용 적용 버튼 */}
      {chatMessages.length >= 2 && !suggestedContent && (
        <div className="flex-shrink-0 px-4 pt-2 pb-0 max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={onApplyConversationSummary}
            disabled={summarizing || chatLoading}
            className="w-full h-9 rounded-xl border border-brand/20 text-brand text-sm font-medium flex items-center justify-center gap-1.5 active:bg-brand-light transition-colors duration-150 disabled:opacity-40"
          >
            {summarizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                질문을 정리하고 있어요...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                지금까지 내용으로 질문 정리하기
              </>
            )}
          </button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white safe-bottom">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <input
            ref={chatInputRef}
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="고민을 말해주세요..."
            className="flex-1 h-11 rounded-full bg-gray-100 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!chatInput.trim() || chatLoading}
            className="w-10 h-10 rounded-full bg-brand flex items-center justify-center flex-shrink-0 active:brightness-90 transition-all duration-150 disabled:opacity-40"
            aria-label="보내기"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
