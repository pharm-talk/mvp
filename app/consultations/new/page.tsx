"use client";

import { Suspense } from "react";
import NewConsultationContent from "./content";

export default function NewConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewConsultationContent />
    </Suspense>
  );
}
