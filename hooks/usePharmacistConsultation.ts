"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PharmacistConsultation } from "@/types/consultation";

const CONSULTATION_COLUMNS =
  "id, user_id, content, type, status, pharmacist_id, health_snapshot, medications_snapshot, answer, answered_at, ai_report, ai_report_at, verified_by, verified_at, followup_question, followup_answer, created_at";

export function usePharmacistConsultation(id: string) {
  const supabase = createClient();
  const [consultation, setConsultation] =
    useState<PharmacistConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedAnswer, setEditedAnswer] = useState("");
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fetchConsultation = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("consultations")
        .select(CONSULTATION_COLUMNS)
        .eq("id", id)
        .single();
      if (data) {
        setConsultation(data);
        if (data.ai_report && !data.verified_at) {
          setEditedAnswer(data.ai_report);
        }
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleAssign = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !consultation) return;
    setSubmitting(true);
    await supabase
      .from("consultations")
      .update({
        pharmacist_id: user.id,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);
    setConsultation((prev) =>
      prev ? { ...prev, pharmacist_id: user.id, status: "assigned" } : null
    );
    setSubmitting(false);
  };

  const handleApproveAsIs = async () => {
    if (!consultation) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const now = new Date().toISOString();
    await supabase
      .from("consultations")
      .update({
        answer: consultation.ai_report,
        status: "answered",
        answered_at: now,
        verified_by: user.id,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", consultation.id);

    setConsultation((prev) =>
      prev
        ? {
            ...prev,
            answer: prev.ai_report,
            status: "answered",
            answered_at: now,
            verified_by: user.id,
            verified_at: now,
          }
        : null
    );
    setSubmitting(false);
  };

  const handleSubmitEdited = async () => {
    if (!editedAnswer.trim() || !consultation) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const now = new Date().toISOString();
    await supabase
      .from("consultations")
      .update({
        answer: editedAnswer.trim(),
        status: "answered",
        answered_at: now,
        verified_by: user.id,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", consultation.id);

    setConsultation((prev) =>
      prev
        ? {
            ...prev,
            answer: editedAnswer.trim(),
            status: "answered",
            answered_at: now,
            verified_by: user.id,
            verified_at: now,
          }
        : null
    );
    setEditMode(false);
    setSubmitting(false);
  };

  const handleFollowupAnswer = async () => {
    if (!followupAnswer.trim() || !consultation) return;
    setSubmitting(true);
    await supabase
      .from("consultations")
      .update({
        followup_answer: followupAnswer.trim(),
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);
    setConsultation((prev) =>
      prev
        ? { ...prev, followup_answer: followupAnswer.trim(), status: "closed" }
        : null
    );
    setFollowupAnswer("");
    setSubmitting(false);
  };

  return {
    consultation,
    loading,
    editedAnswer,
    setEditedAnswer,
    followupAnswer,
    setFollowupAnswer,
    submitting,
    editMode,
    setEditMode,
    handleAssign,
    handleApproveAsIs,
    handleSubmitEdited,
    handleFollowupAnswer,
  };
}
