import { INGREDIENT_BRAND_MAP } from "@/constants/brands";
import type { ProductCard } from "@/types/supplement";

const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

/**
 * AI 응답에서 추천 섹션을 파싱하여 ProductCard[] 생성
 *
 * AI 출력 형식 예시:
 * ① 마그네슘 -- 수면 질 개선에 도움
 *    → 국내: 종근당건강 | 수입: 솔가
 */
export function parseRecommendation(aiResponse: string): ProductCard[] {
  const cards: ProductCard[] = [];

  // ① ② ③ ... 패턴으로 각 항목 분리
  const itemPattern = new RegExp(
    `(${CIRCLED_NUMBERS.join("|")})\\s*(.+?)(?=(?:${CIRCLED_NUMBERS.join("|")})|$)`,
    "gs"
  );

  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(aiResponse)) !== null) {
    const index = CIRCLED_NUMBERS.indexOf(match[1]);
    const block = match[2].trim();

    // 성분명 -- 이유 파싱 (구분자: --, —, -)
    const headerMatch = block.match(
      /^([^\n—\-]+?)[\s]*(?:--|—|-)\s*(.+?)(?:\n|$)/
    );

    if (!headerMatch) continue;

    const ingredient = headerMatch[1].trim();
    const reason = headerMatch[2].trim();

    // 브랜드 매칭
    const brands = matchBrands(ingredient);

    // AI 응답 내 브랜드 라인 파싱 (→ 국내: ... | 수입: ...)
    const brandLineMatch = block.match(
      /→\s*국내\s*[:：]\s*(.+?)\s*[|│]\s*수입\s*[:：]\s*(.+?)(?:\n|$)/
    );

    if (brandLineMatch) {
      const domesticFromAi = brandLineMatch[1]
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const importedFromAi = brandLineMatch[2]
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (domesticFromAi.length > 0) brands.domestic = domesticFromAi;
      if (importedFromAi.length > 0) brands.imported = importedFromAi;
    }

    // 복용 TIP 파싱
    const tipMatch = block.match(/(?:TIP|팁|복용)\s*[:：]\s*(.+?)(?:\n|$)/i);
    const dosageTip = tipMatch ? tipMatch[1].trim() : undefined;

    // 주의사항 파싱
    const cautionMatch = block.match(
      /(?:주의|⚠|경고)\s*[:：]?\s*(.+?)(?:\n|$)/
    );
    const caution = cautionMatch ? cautionMatch[1].trim() : undefined;

    cards.push({
      ingredient,
      reason,
      domesticBrands: brands.domestic,
      importedBrands: brands.imported,
      dosageTip,
      caution,
    });

    // index 기반 순서 검증 (로깅 불필요, 순서 보장용)
    if (index >= 0 && index !== cards.length - 1) {
      // 순서 불일치 시에도 파싱은 계속 진행
    }
  }

  return cards;
}

/**
 * 성분명으로 브랜드 매핑 (부분 일치)
 */
export function matchBrands(ingredient: string): {
  domestic: string[];
  imported: string[];
} {
  const normalized = ingredient.toLowerCase().replace(/\s/g, "");

  for (const mapping of INGREDIENT_BRAND_MAP) {
    const mappingNormalized = mapping.ingredient
      .toLowerCase()
      .replace(/\s/g, "");

    if (
      normalized.includes(mappingNormalized) ||
      mappingNormalized.includes(normalized)
    ) {
      return {
        domestic: [...mapping.domesticBrands],
        imported: [...mapping.importedBrands],
      };
    }
  }

  return { domestic: [], imported: [] };
}
