import {
  EMERGENCY_KEYWORDS,
  URGENT_KEYWORDS,
  EMERGENCY_RESPONSES,
} from "@/constants/emergency";

type EmergencyLevel = "emergency" | "urgent" | "none";

interface EmergencyResult {
  level: EmergencyLevel;
  message: string | null;
}

export function useEmergencyDetector() {
  function checkEmergency(text: string): EmergencyResult {
    const normalized = text.toLowerCase();

    if (EMERGENCY_KEYWORDS.some((kw) => normalized.includes(kw))) {
      return { level: "emergency", message: EMERGENCY_RESPONSES.emergency };
    }

    if (URGENT_KEYWORDS.some((kw) => normalized.includes(kw))) {
      return { level: "urgent", message: EMERGENCY_RESPONSES.urgent };
    }

    return { level: "none", message: null };
  }

  return { checkEmergency };
}
