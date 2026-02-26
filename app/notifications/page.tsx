"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Clock,
  Inbox,
} from "lucide-react";

interface Notification {
  id: string;
  type: "answered" | "assigned" | "followup_answered" | "pending";
  consultationId: string;
  consultationType: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 유저의 상담 상태 변경을 알림으로 표시
    const { data: consultations } = await supabase
      .from("consultations")
      .select(
        "id, type, status, content, answer, followup_answer, answered_at, updated_at, created_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (!consultations) {
      setLoading(false);
      return;
    }

    const notifs: Notification[] = [];

    for (const c of consultations) {
      const typeLabel = c.type === "supplement" ? "영양제" : "복약";
      const preview =
        c.content.length > 30 ? c.content.slice(0, 30) + "..." : c.content;

      // 추가 답변이 있으면
      if (c.followup_answer) {
        notifs.push({
          id: `${c.id}-followup`,
          type: "followup_answered",
          consultationId: c.id,
          consultationType: c.type,
          message: `${typeLabel} 상담의 추가 질문에 약사가 답변했어요`,
          timestamp: c.updated_at,
          isRead: false,
        });
      }

      // 답변이 있으면
      if (c.answer && c.answered_at) {
        notifs.push({
          id: `${c.id}-answer`,
          type: "answered",
          consultationId: c.id,
          consultationType: c.type,
          message: `"${preview}" 상담에 약사가 답변했어요`,
          timestamp: c.answered_at,
          isRead: false,
        });
      }

      // 배정됨
      if (
        c.status === "assigned" ||
        c.status === "answered" ||
        c.status === "closed"
      ) {
        notifs.push({
          id: `${c.id}-assigned`,
          type: "assigned",
          consultationId: c.id,
          consultationType: c.type,
          message: `"${preview}" 상담을 약사가 접수했어요`,
          timestamp: c.updated_at,
          isRead: false,
        });
      }
    }

    // 시간순 정렬
    notifs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(notifs);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "answered":
      case "followup_answered":
        return <CheckCircle2 className="w-5 h-5 text-brand" />;
      case "assigned":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "answered":
      case "followup_answered":
        return "bg-brand-light";
      case "assigned":
        return "bg-blue-50";
      default:
        return "bg-amber-50";
    }
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
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
          <h1 className="text-base font-bold text-gray-900">알림</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-8">
        {/* 로딩 */}
        {loading && (
          <div className="px-5 pt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 px-5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400 mb-1">아직 알림이 없어요</p>
            <p className="text-xs text-gray-300">
              상담을 요청하면 진행 상황을 알려드려요
            </p>
          </div>
        )}

        {/* 알림 목록 */}
        {!loading && notifications.length > 0 && (
          <div className="px-5 pt-4 space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() =>
                  router.push(`/consultations/${notif.consultationId}`)
                }
                className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
              >
                <div className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${getIconBg(notif.type)} flex items-center justify-center flex-shrink-0`}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.875rem] font-medium text-gray-900 leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notif.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
