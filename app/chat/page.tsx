"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  Pill,
  Plus,
  Trash2,
  ArrowUp,
  Loader2,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Robot } from "@phosphor-icons/react";

/* ─── Types ─── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MedicationInfo {
  name: string;
  type: string;
  dosage: string | null;
}

interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
}

interface AiChat {
  id: string;
  title: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

const QUICK_SUGGESTIONS = [
  "술 마셔도 돼?",
  "커피 괜찮아?",
  "자몽 먹어도 돼?",
  "우유랑 같이 먹어도 돼?",
  "매운 음식은?",
  "녹차 괜찮아?",
];

/* ─── Sub-components ─── */

function BotAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? 14 : 18;
  return (
    <div
      className={`${dim} rounded-full bg-brand/10 flex items-center justify-center shrink-0`}
    >
      <Robot size={iconSize} weight="duotone" className="text-brand" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <BotAvatar />
      <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full bg-brand/40 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-brand/40 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-brand/40 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AiChat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasMedications, setHasMedications] = useState(true);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  /* ─ Initial data ─ */
  const loadInitialData = useCallback(async () => {
    const [medsResult, profileResult, chatsResult] = await Promise.all([
      supabase
        .from("medications")
        .select("name, type, dosage")
        .eq("archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("gender, birth_date, conditions, allergies")
        .single(),
      supabase
        .from("ai_chats")
        .select("*")
        .eq("type", "food_drug")
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

    if (medsResult.data) {
      setMedications(medsResult.data as MedicationInfo[]);
      setHasMedications(medsResult.data.length > 0);
    } else {
      setHasMedications(false);
    }

    if (profileResult.data) {
      setProfile(profileResult.data as ProfileInfo);
    }

    if (chatsResult.data) {
      setChatHistory(chatsResult.data as AiChat[]);
    }

    setPageLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /* ─ Save chat ─ */
  const saveChat = useCallback(
    async (chatMessages: ChatMessage[], chatId: string | null) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const firstUserMsg = chatMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 50)
        : "새 대화";

      if (chatId) {
        await supabase
          .from("ai_chats")
          .update({
            messages: chatMessages,
            title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chatId);
        return chatId;
      } else {
        const { data } = await supabase
          .from("ai_chats")
          .insert({
            user_id: user.id,
            type: "food_drug",
            title,
            messages: chatMessages,
          })
          .select("id")
          .single();
        return data?.id ?? null;
      }
    },
    [supabase]
  );

  /* ─ Send message ─ */
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/food-drug-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          medications: medications.map((m) => ({
            name: m.name,
            type: m.type,
            dosage: m.dosage,
          })),
          profile: profile
            ? {
                gender: profile.gender,
                birth_date: profile.birth_date,
                conditions: profile.conditions,
                allergies: profile.allergies,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (data.message) {
        const updatedMessages: ChatMessage[] = [
          ...newMessages,
          { role: "assistant", content: data.message },
        ];
        setMessages(updatedMessages);

        const savedId = await saveChat(updatedMessages, currentChatId);
        if (savedId && !currentChatId) {
          setCurrentChatId(savedId);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "연결에 문제가 생겼어요. 다시 시도해주세요.",
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* ─ History helpers ─ */
  const loadChat = (chat: AiChat) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setShowHistory(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowHistory(false);
  };

  const deleteChat = async (chatId: string) => {
    await supabase.from("ai_chats").delete().eq("id", chatId);
    setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "방금";
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const hasInput = input.trim().length > 0;

  /* ════════════════ Loading ════════════════ */
  if (pageLoading) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-5 pt-8 space-y-5">
          {/* Bot welcome skeleton */}
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-14 bg-white rounded-2xl rounded-tl-md animate-pulse" />
            </div>
          </div>
          {/* Chip skeletons */}
          <div className="flex gap-2 ml-[2.625rem]">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-20 bg-white rounded-full animate-pulse"
              />
            ))}
          </div>
          {/* More message skeletons */}
          <div className="flex justify-end">
            <div className="h-10 w-32 bg-brand/10 rounded-2xl rounded-tr-md animate-pulse" />
          </div>
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="h-20 flex-1 bg-white rounded-2xl rounded-tl-md animate-pulse" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ No medications ════════════════ */
  if (!hasMedications) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-[0.9375rem] font-bold text-gray-900">
              약-음식 상호작용
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-6">
            <Pill className="w-9 h-9 text-gray-200" />
          </div>
          <p
            className="text-lg font-bold text-gray-900 mb-2"
            style={{ wordBreak: "keep-all" }}
          >
            먼저 약을 등록해주세요
          </p>
          <p
            className="text-sm text-gray-400 text-center mb-8 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            복용 중인 약을 등록하면
            <br />
            음식과의 상호작용을 정확하게 알려드려요
          </p>
          <button
            type="button"
            onClick={() => router.push("/medications")}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150"
          >
            <Plus className="w-5 h-5" />
            약 등록하러 가기
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ History ════════════════ */
  if (showHistory) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-[0.9375rem] font-bold text-gray-900">
              대화 기록
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-5 pt-5 pb-24">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full h-12 rounded-2xl border-2 border-dashed border-brand/25 bg-brand/[0.03] flex items-center justify-center gap-2 text-brand font-semibold text-sm mb-5 active:bg-brand/[0.06] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            새 대화 시작
          </button>

          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-gray-300" />
              </div>
              <p
                className="text-sm text-gray-400"
                style={{ wordBreak: "keep-all" }}
              >
                아직 대화 기록이 없어요
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-white rounded-2xl shadow-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => loadChat(chat)}
                    className="w-full text-left px-4 py-4 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className="text-[0.9375rem] font-semibold text-gray-900 truncate flex-1"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {chat.title ?? "대화"}
                      </p>
                      <span className="text-[0.6875rem] text-gray-300 shrink-0">
                        {formatDate(chat.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MessageSquare className="w-3 h-3 text-gray-300" />
                      <span className="text-xs text-gray-400">
                        {chat.messages.length}개 메시지
                      </span>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteChat(chat.id)}
                      className="h-7 px-2.5 rounded-lg text-red-400 text-[0.6875rem] font-medium flex items-center gap-1 active:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ Main Chat ════════════════ */
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60 shrink-0">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="text-[0.9375rem] font-bold text-gray-900 leading-tight">
              약-음식 상호작용
            </h1>
            <p className="text-[0.625rem] text-gray-400 leading-tight mt-0.5">
              {medications.length}개의 약 기반
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadInitialData();
              setShowHistory(true);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="대화 기록"
          >
            <Clock className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="px-5 pt-5 pb-4">
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="pt-6">
              {/* Welcome bubble */}
              <div className="flex items-start gap-2.5 mb-5">
                <BotAvatar />
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3.5 shadow-card max-w-[85%]">
                  <p
                    className="text-[0.9375rem] text-gray-700 leading-relaxed"
                    style={{ wordBreak: "keep-all" }}
                  >
                    반가워요! 현재 복용 중인 약{" "}
                    <span className="font-bold text-brand">
                      {medications.length}개
                    </span>
                    를 확인했어요.
                  </p>
                  <p
                    className="text-[0.875rem] text-gray-400 mt-1.5 leading-relaxed"
                    style={{ wordBreak: "keep-all" }}
                  >
                    어떤 음식이나 음료가 궁금하신가요?
                  </p>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="ml-[2.625rem]">
                <p className="text-[0.6875rem] text-gray-300 font-medium mb-2.5 uppercase tracking-wider">
                  자주 묻는 질문
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="h-9 px-4 rounded-full border border-gray-200/80 bg-white text-[0.8125rem] font-medium text-gray-600 shadow-sm active:bg-gray-50 active:scale-[0.97] transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div>
              {messages.map((msg, idx) =>
                msg.role === "assistant" ? (
                  <div key={idx} className="flex items-start gap-2.5 mb-4">
                    <BotAvatar />
                    <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3.5 shadow-card max-w-[85%]">
                      <p
                        className="text-[0.9375rem] text-gray-700 leading-relaxed whitespace-pre-wrap"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex justify-end mb-4">
                    <div className="bg-brand text-white rounded-2xl rounded-tr-md px-4 py-3.5 max-w-[85%] shadow-sm">
                      <p
                        className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )
              )}

              {loading && <TypingDots />}

              {/* Contextual suggestions after a few exchanges */}
              {!loading && messages.length > 0 && messages.length < 8 && (
                <div className="flex flex-wrap gap-2 ml-[2.625rem] mt-1 mb-4">
                  {QUICK_SUGGESTIONS.filter(
                    (q) => !messages.some((m) => m.content === q)
                  )
                    .slice(0, 2)
                    .map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="h-8 px-3.5 rounded-full border border-gray-200/80 bg-white text-xs font-medium text-gray-500 shadow-sm active:bg-gray-50 active:scale-[0.97] transition-all duration-150"
                      >
                        {q}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-100/60 shrink-0 safe-bottom">
        <form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto flex items-center gap-2.5 px-4 py-3"
        >
          <div
            className={`flex-1 flex items-center h-11 rounded-full bg-surface px-4 transition-all duration-200 ${
              hasInput
                ? "ring-2 ring-brand/20 bg-white"
                : "ring-1 ring-transparent"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="음식이나 음료에 대해 물어보세요"
              disabled={loading}
              className="flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-300 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!hasInput || loading}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
              hasInput && !loading
                ? "bg-brand text-white shadow-[0_2px_8px_rgba(22,179,100,0.3)] active:scale-95"
                : "bg-gray-100 text-gray-300"
            }`}
            aria-label="전송"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
