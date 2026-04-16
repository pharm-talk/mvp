// PART 6-3: 119 즉시 연계 키워드
export const EMERGENCY_KEYWORDS = [
  "흉통",
  "가슴통증",
  "가슴이 아파",
  "호흡곤란",
  "숨이 안",
  "숨을 못",
  "편측 마비",
  "한쪽 마비",
  "팔이 저리",
  "말이 안 나와",
  "말이 이상",
  "의식",
  "기절",
  "쓰러",
  "경련",
  "발작",
  "입이 부",
  "목이 부",
  "얼굴이 부",
  "아나필락시스",
  "대량 출혈",
  "피가 멈추지",
  "두통 평생 처음",
  "갑자기 심한 두통",
] as const;

// PART 6-3: 당일 병원 키워드
export const URGENT_KEYWORDS = [
  "39도",
  "40도",
  "고열",
  "열이 안 내려",
  "혈변",
  "검은 변",
  "피 섞인",
  "황달",
  "눈이 노래",
  "피부가 노래",
  "급격한 체중",
  "갑자기 빠져",
  "소변 감소",
  "부종",
] as const;

// PART 6-3: 빠른 병원 키워드
export const SOON_KEYWORDS = [
  "2주 이상 지속",
  "원인 불명",
  "영양제 3개월 효과 없음",
] as const;

// PART 6-3: 검사 먼저 키워드
export const CHECK_FIRST_KEYWORDS = [
  "빈혈 의심",
  "철분 전 검사",
  "탈모 급격 악화",
  "갑상선 확인",
] as const;

// 연계 수준별 응답 메시지
export const EMERGENCY_RESPONSES = {
  emergency:
    "지금 바로 119에 전화하세요! 응급 상황이 의심돼요. 골든타임이 중요합니다.",
  urgent:
    "빠른 시간 내에 병원에 가시는 게 좋겠어요. 오늘 중으로 진료를 받아보세요.",
  soon: "증상이 지속되면 가까운 병원에 방문해보세요.",
  checkFirst: "검사 먼저 받으시고 결과 보고 같이 정해요.",
} as const;

// 연계 수준 타입
export type EmergencyLevel = keyof typeof EMERGENCY_RESPONSES;
