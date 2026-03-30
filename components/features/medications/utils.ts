import type { MedCategory, AiResult } from "@/types/medication";

/** 남은 일수 계산 */
export function getDaysInfo(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const elapsedDays = Math.ceil(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const progress = Math.min(1, Math.max(0, elapsedDays / totalDays));
  const isExpired = now > end;
  return { totalDays, remainingDays, progress, isExpired };
}

/** 한국어 날짜 포맷 */
export function formatDateKR(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 복용 횟수 문자열 조합 */
export function buildFrequencyString(count: string, times: string[]) {
  if (!count) return null;
  if (count === "필요시") return "필요시";
  const timePart = times.length > 0 ? ` (${times.join(", ")})` : "";
  return `1일 ${count}${timePart}`;
}

/** 복용 횟수 문자열 파싱 */
export function parseFrequencyString(freq: string | null): { count: string; times: string[] } {
  if (!freq) return { count: "", times: [] };
  if (freq === "필요시") return { count: "필요시", times: [] };
  const countMatch = freq.match(/1일\s*(\d회)/);
  const timesMatch = freq.match(/\(([^)]+)\)/);
  return {
    count: countMatch ? countMatch[1] : freq.replace(/^매일\s*/, ""),
    times: timesMatch ? timesMatch[1].split(",").map((t) => t.trim()) : [],
  };
}

/** AI 결과에서 카테고리 추론 */
export function classifyAiResult(item: AiResult): MedCategory {
  if (item.type === "supplement") return "supplement";
  const chronicKeywords = [
    "혈압", "당뇨", "콜레스테롤", "고혈압", "고지혈", "갑상선",
    "탈모", "피나스테리드", "미녹시딜", "아스피린", "메트포르민",
    "암로디핀", "로사르탄", "아토르바스타틴", "심바스타틴", "레보티록신",
  ];
  const name = item.name.toLowerCase();
  if (chronicKeywords.some((kw) => name.includes(kw))) return "chronic";
  return "prescription";
}

/** 기존 type을 category로 매핑 (마이그레이션 호환) */
export function mapTypeToCategory(type: string): MedCategory {
  if (type === "supplement") return "supplement";
  return "prescription";
}
