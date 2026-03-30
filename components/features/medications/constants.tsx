import { Calendar, Pill } from "lucide-react";
import type { MedCategory } from "@/types/medication";

/* -- 영양제 통 아이콘 -- */
export const SupplementBottle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="7" width="10" height="14" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M7 12h10" />
  </svg>
);

export const DAILY_COUNT_OPTIONS = ["1회", "2회", "3회", "필요시"];
export const TIME_OPTIONS = ["아침", "점심", "저녁", "취침 전", "식전", "식후"];

export const CATEGORY_CONFIG: {
  value: MedCategory;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: "chronic",
    label: "장기 복용",
    Icon: Calendar,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
  },
  {
    value: "prescription",
    label: "처방약",
    Icon: Pill,
    iconBg: "bg-brand-light",
    iconColor: "text-brand",
  },
  {
    value: "supplement",
    label: "영양제",
    Icon: SupplementBottle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
];

export function getCategoryConfig(category: MedCategory) {
  return (
    CATEGORY_CONFIG.find((c) => c.value === category) ?? CATEGORY_CONFIG[1]
  );
}
