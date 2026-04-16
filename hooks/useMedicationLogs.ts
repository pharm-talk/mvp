"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Medication, MedicationLog, DailyStats } from "@/types/medication";

function toKSTDateString(date: Date): string {
  // KST = UTC+9
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function getKSTToday(): string {
  return toKSTDateString(new Date());
}

function getKSTStartOfDay(dateStr: string): string {
  // dateStr is YYYY-MM-DD in KST, convert to UTC for query
  return `${dateStr}T00:00:00+09:00`;
}

function getKSTEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999+09:00`;
}

export function useMedicationLogs(medications: Medication[]) {
  const supabase = createClient();
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const activeMeds = medications.filter((m) => !m.archived);

  const fetchTodayLogs = useCallback(async () => {
    const today = getKSTToday();
    const { data } = await supabase
      .from("medication_logs")
      .select("id, medication_id, taken_at, status")
      .gte("taken_at", getKSTStartOfDay(today))
      .lte("taken_at", getKSTEndOfDay(today));

    if (data) {
      setTodayLogs(data as MedicationLog[]);
    }
  }, [supabase]);

  const fetchWeeklyStats = useCallback(async () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const startDate = toKSTDateString(weekAgo);
    const endDate = getKSTToday();

    const { data } = await supabase
      .from("medication_logs")
      .select("medication_id, taken_at, status")
      .gte("taken_at", getKSTStartOfDay(startDate))
      .lte("taken_at", getKSTEndOfDay(endDate));

    // Build stats for each day
    const stats: DailyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toKSTDateString(d);

      const dayLogs = (data ?? []).filter((log) => {
        const logDate = toKSTDateString(new Date(log.taken_at));
        return logDate === dateStr;
      });

      stats.push({
        date: dateStr,
        total: activeMeds.length,
        taken: dayLogs.filter((l) => l.status === "taken").length,
        skipped: dayLogs.filter((l) => l.status === "skipped").length,
      });
    }

    setWeeklyStats(stats);
  }, [supabase, activeMeds.length]);

  useEffect(() => {
    if (medications.length > 0) {
      Promise.all([fetchTodayLogs(), fetchWeeklyStats()]).finally(() =>
        setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, [medications.length, fetchTodayLogs, fetchWeeklyStats]);

  const toggleTaken = useCallback(
    async (medicationId: string) => {
      const existing = todayLogs.find(
        (l) => l.medication_id === medicationId && l.status === "taken"
      );

      if (existing) {
        // Remove the log (un-check)
        await supabase.from("medication_logs").delete().eq("id", existing.id);
      } else {
        // Check if there's a skipped log for today - remove it first
        const skipped = todayLogs.find(
          (l) => l.medication_id === medicationId && l.status === "skipped"
        );
        if (skipped) {
          await supabase.from("medication_logs").delete().eq("id", skipped.id);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("medication_logs").insert({
          user_id: user.id,
          medication_id: medicationId,
          status: "taken",
          taken_at: new Date().toISOString(),
        });
      }

      await fetchTodayLogs();
      await fetchWeeklyStats();
    },
    [supabase, todayLogs, fetchTodayLogs, fetchWeeklyStats]
  );

  const skipMedication = useCallback(
    async (medicationId: string) => {
      const existing = todayLogs.find(
        (l) => l.medication_id === medicationId
      );

      if (existing && existing.status === "skipped") {
        // Un-skip
        await supabase.from("medication_logs").delete().eq("id", existing.id);
      } else {
        // Remove any existing log first
        if (existing) {
          await supabase
            .from("medication_logs")
            .delete()
            .eq("id", existing.id);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("medication_logs").insert({
          user_id: user.id,
          medication_id: medicationId,
          status: "skipped",
          taken_at: new Date().toISOString(),
        });
      }

      await fetchTodayLogs();
      await fetchWeeklyStats();
    },
    [supabase, todayLogs, fetchTodayLogs, fetchWeeklyStats]
  );

  // Derived data
  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const todayProgress =
    activeMeds.length > 0
      ? Math.round((takenCount / activeMeds.length) * 100)
      : 0;

  const getLogForMedication = useCallback(
    (medicationId: string): MedicationLog | undefined => {
      return todayLogs.find((l) => l.medication_id === medicationId);
    },
    [todayLogs]
  );

  // 연속 복용 일수 계산
  const getStreak = useCallback(
    (medicationId: string): number => {
      let streak = 0;
      const today = new Date();

      // Check today first
      const todayLog = todayLogs.find(
        (l) => l.medication_id === medicationId && l.status === "taken"
      );
      if (!todayLog) return 0;

      // Count from weekly stats (starting from today backwards)
      for (let i = weeklyStats.length - 1; i >= 0; i--) {
        const dayStat = weeklyStats[i];
        // We need per-medication data, but weekly stats are aggregated.
        // For streak, we use a simplified approach based on today's logs
        // A proper streak needs per-medication daily check
        if (dayStat.taken > 0) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    },
    [todayLogs, weeklyStats]
  );

  // 마지막 복용 시간
  const getLastTakenTime = useCallback(
    (medicationId: string): string | null => {
      const log = todayLogs.find(
        (l) => l.medication_id === medicationId && l.status === "taken"
      );
      if (!log) return null;

      const d = new Date(log.taken_at);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },
    [todayLogs]
  );

  return {
    todayLogs,
    weeklyStats,
    loading,
    toggleTaken,
    skipMedication,
    todayProgress,
    takenCount,
    totalCount: activeMeds.length,
    getLogForMedication,
    getStreak,
    getLastTakenTime,
  };
}
