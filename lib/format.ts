/** 날짜 포맷 유틸리티 */

/** "3월 30일" 형식 */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "2026.03.30 14:30" 형식 */
export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** "2026.03.30" 형식 (시간 없이) */
export function formatDateKR(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}
