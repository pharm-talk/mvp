"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ArrowUp, X, Loader2 } from "lucide-react";
import { Robot } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MedicationInfo {
  name: string;
  type: string;
  dosage: string | null;
}

const HIDDEN_ON = ["/chat", "/login", "/onboarding"];

const QUICK_QUESTIONS = [
  "술 마셔도 돼?",
  "커피 괜찮아?",
  "자몽 먹어도 돼?",
  "우유랑 같이?",
];

export default function ChatFab() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);

  const loadMedications = useCallback(async () => {
    setMedsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMedsLoading(false);
      return;
    }
    const { data } = await supabase
      .from("medications")
      .select("name, type, dosage")
      .eq("user_id", user.id)
      .eq("archived", false);
    if (data) setMedications(data);
    setMedsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (open && medications.length === 0) {
      loadMedications();
    }
  }, [open, medications.length, loadMedications]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: msg },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/food-drug-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          medications,
          profile: null,
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "죄송해요, 오류가 발생했어요. 다시 시도해주세요.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const hasInput = input.trim().length > 0;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-[5.5rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_14px_rgba(22,179,100,0.4)] active:shadow-[0_2px_8px_rgba(22,179,100,0.3)]"
            aria-label="AI 약 비서 열기"
          >
            <Robot size={28} weight="fill" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            />

            {/* Chat panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }}
              className="fixed bottom-4 right-4 left-4 z-50 ml-auto flex h-[72dvh] max-h-[540px] max-w-[400px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100/80">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10">
                    <Robot
                      size={20}
                      weight="duotone"
                      className="text-brand"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      AI 약 비서
                    </p>
                    <p className="text-[0.625rem] text-gray-400 leading-tight mt-0.5">
                      온라인 &middot; 약과 음식 궁합 상담
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/chat");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors duration-150 active:bg-gray-100 hover:text-gray-600"
                    aria-label="전체화면으로 열기"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors duration-150 active:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && !loading && (
                  <>
                    {/* Welcome */}
                    <div className="flex gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 mt-0.5">
                        <Robot
                          size={14}
                          weight="duotone"
                          className="text-brand"
                        />
                      </div>
                      <div className="rounded-2xl rounded-tl-md bg-gray-50 px-3.5 py-3 max-w-[85%]">
                        {medsLoading ? (
                          <div className="space-y-2">
                            <div className="h-3 w-36 rounded-full bg-gray-200/60 animate-pulse" />
                            <div className="h-3 w-48 rounded-full bg-gray-200/60 animate-pulse" />
                          </div>
                        ) : (
                          <p
                            className="text-[0.8125rem] text-gray-700 leading-relaxed"
                            style={{ wordBreak: "keep-all" }}
                          >
                            반가워요!{" "}
                            {medications.length > 0 ? (
                              <>
                                지금 복용 중인 약{" "}
                                <span className="font-bold text-brand">
                                  {medications.length}개
                                </span>
                                를 확인했어요. 어떤 음식이 궁금하세요?
                              </>
                            ) : (
                              <>
                                약을 등록하면 음식과의 궁합을 정확하게
                                알려드릴게요. 우선 궁금한 걸 물어보세요!
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-1.5 pl-[2.375rem]">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="rounded-full border border-brand/15 bg-brand/[0.04] px-3 py-1.5 text-[0.75rem] font-medium text-brand transition-all duration-150 active:bg-brand/10 active:scale-[0.97]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Chat messages */}
                {messages.map((msg, idx) =>
                  msg.role === "user" ? (
                    <div key={idx} className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-md bg-brand px-3.5 py-2.5 max-w-[80%]">
                        <p
                          className="text-[0.8125rem] text-white leading-relaxed whitespace-pre-wrap"
                          style={{ wordBreak: "keep-all" }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 mt-0.5">
                        <Robot
                          size={14}
                          weight="duotone"
                          className="text-brand"
                        />
                      </div>
                      <div className="rounded-2xl rounded-tl-md bg-gray-50 px-3.5 py-2.5 max-w-[85%]">
                        <p
                          className="text-[0.8125rem] text-gray-700 leading-relaxed whitespace-pre-wrap"
                          style={{ wordBreak: "keep-all" }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 mt-0.5">
                      <Robot
                        size={14}
                        weight="duotone"
                        className="text-brand"
                      />
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-gray-50 px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100/80 px-3 py-3">
                <div
                  className={`flex items-center gap-2 rounded-2xl bg-gray-50 px-3.5 py-2 transition-all duration-200 ${
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
                    onKeyDown={handleKeyDown}
                    placeholder="음식이나 음료에 대해 물어보세요"
                    disabled={loading}
                    className="flex-1 bg-transparent text-[0.8125rem] text-gray-900 outline-none placeholder:text-gray-300 disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!hasInput || loading}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                      hasInput && !loading
                        ? "bg-brand text-white shadow-sm active:scale-95"
                        : "bg-gray-200/60 text-gray-300"
                    }`}
                    aria-label="전송"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
