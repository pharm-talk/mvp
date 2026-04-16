export interface BrandInfo {
  name: string;
  nameEn?: string;
  origin: "domestic" | "imported";
  description: string;
}

export interface IngredientBrandMapping {
  ingredient: string;
  domesticBrands: string[];
  importedBrands: string[];
}

// PART 3-1: 국내 7개 브랜드
export const DOMESTIC_BRANDS: BrandInfo[] = [
  {
    name: "종근당건강",
    origin: "domestic",
    description: "비타민·미네랄·오메가3 등 전 품목",
  },
  {
    name: "일동제약 / 일동후디스",
    origin: "domestic",
    description: "프리바이오틱스, 종합비타민",
  },
  {
    name: "유한양행",
    origin: "domestic",
    description: "비타민D, 마그네슘 등",
  },
  {
    name: "GNM 자연의품격",
    origin: "domestic",
    description: "콜라겐, 루테인 등 기능성 특화",
  },
  {
    name: "뉴트리원",
    origin: "domestic",
    description: "오메가3, 밀크씨슬 등",
  },
  {
    name: "대웅제약",
    origin: "domestic",
    description: "우루사(밀크씨슬), 이뮨샷 등",
  },
  {
    name: "동국제약",
    origin: "domestic",
    description: "마데카솔 계열, 비타민 라인",
  },
];

// PART 3-1: 수입 7개 브랜드
export const IMPORTED_BRANDS: BrandInfo[] = [
  {
    name: "솔가",
    nameEn: "Solgar",
    origin: "imported",
    description: "고순도 단일 성분 특화, 아이허브 인기",
  },
  {
    name: "나우푸드",
    nameEn: "Now Foods",
    origin: "imported",
    description: "가성비 + 다양한 라인업",
  },
  {
    name: "네이처메이드",
    nameEn: "Nature Made",
    origin: "imported",
    description: "USP 인증, 기본 비타민·미네랄",
  },
  {
    name: "얼라이브",
    nameEn: "Alive!",
    origin: "imported",
    description: "종합비타민, 식물성 원료",
  },
  {
    name: "네이처스바운티",
    nameEn: "Nature's Bounty",
    origin: "imported",
    description: "비타민C·B군 등 기본기",
  },
  {
    name: "닥터스베스트",
    nameEn: "Doctor's Best",
    origin: "imported",
    description: "고흡수 마그네슘 등 전문성",
  },
  {
    name: "캘리포니아골드뉴트리션",
    nameEn: "CGN",
    origin: "imported",
    description: "아이허브 자체 브랜드, 가성비",
  },
];

// PART 3-3: 성분별 추천 브랜드 매핑
export const INGREDIENT_BRAND_MAP: IngredientBrandMapping[] = [
  {
    ingredient: "오메가3",
    domesticBrands: ["종근당건강 오메가3", "뉴트리원"],
    importedBrands: ["솔가 오메가3", "나우푸드"],
  },
  {
    ingredient: "비타민D",
    domesticBrands: ["유한양행 비타민D", "종근당건강"],
    importedBrands: ["네이처메이드", "나우푸드"],
  },
  {
    ingredient: "마그네슘",
    domesticBrands: ["종근당건강 마그네슘"],
    importedBrands: ["솔가 시트레이트", "닥터스베스트"],
  },
  {
    ingredient: "비타민B군",
    domesticBrands: ["일동후디스", "GNM"],
    importedBrands: ["나우푸드 B-50", "솔가"],
  },
  {
    ingredient: "콜라겐",
    domesticBrands: ["GNM 저분자콜라겐", "뉴트리원"],
    importedBrands: ["나우푸드 콜라겐"],
  },
  {
    ingredient: "루테인",
    domesticBrands: ["GNM", "종근당건강"],
    importedBrands: ["솔가 루테인"],
  },
  {
    ingredient: "프로바이오틱스",
    domesticBrands: ["일동후디스 비피더스", "뉴트리원"],
    importedBrands: ["나우푸드 프로바이오틱스"],
  },
  {
    ingredient: "밀크씨슬",
    domesticBrands: ["대웅제약 우루사", "뉴트리원"],
    importedBrands: ["솔가 밀크씨슬"],
  },
  {
    ingredient: "아연",
    domesticBrands: ["종근당건강"],
    importedBrands: ["나우푸드", "솔가"],
  },
  {
    ingredient: "철분",
    domesticBrands: ["일동제약"],
    importedBrands: ["솔가 젠틀아이언"],
  },
];

// PART 3-2: 금지/대체 표현
export const BRAND_EXPRESSION_RULES = {
  forbidden: [
    "이 제품 강력 추천드려요!",
    "최고의 제품입니다",
    "특정 브랜드만 반복 노출",
    "가격 언급 없이 고가 추천",
    "지금 구매하세요",
  ],
  replacement: [
    "이 성분에서 많이 선택하는 제품이에요",
    "흡수율이 좋은 형태로 나온 제품이에요",
    "국내·수입 각 1개씩 병기",
    "가성비 옵션 함께 제시",
    "참고해보세요, 약국에서도 구매 가능해요",
  ],
} as const;
