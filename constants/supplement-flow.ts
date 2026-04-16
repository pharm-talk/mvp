export type HealthGoal =
  | "fatigue"
  | "skin"
  | "immunity"
  | "bone"
  | "sleep"
  | "digestion"
  | "eye"
  | "other";

export const HEALTH_GOAL_LABELS: Record<HealthGoal, string> = {
  fatigue: "피로 개선",
  skin: "피부 관리",
  immunity: "면역 강화",
  bone: "뼈·관절",
  sleep: "수면 개선",
  digestion: "소화 개선",
  eye: "눈 건강",
  other: "기타",
};

// TURN 1: 건강 목표 칩
export const TURN1_CHIPS = [
  "피로 개선",
  "피부 관리",
  "면역 강화",
  "뼈·관절",
  "수면 개선",
  "소화 개선",
  "눈 건강",
  "기타",
] as const;

// TURN 2: 약 서랍 확인 칩
export const TURN2_CHIPS = ["없어요, 그대로예요", "추가할 게 있어요"] as const;

// TURN 3~5: 건강 목표별 꼬리질문 (기획문서 PART 2 테이블 그대로)
export interface GoalQuestion {
  question: string;
  chips: string[];
}

export const GOAL_FOLLOW_UP_QUESTIONS: Record<string, GoalQuestion[]> = {
  "피로 개선": [
    {
      question: "피로가 주로 언제 심하게 느껴지세요?",
      chips: ["아침 기상 시", "오후에 급격히", "운동 후", "항상"],
    },
    {
      question: "식사는 규칙적으로 하시는 편이에요?",
      chips: ["규칙적이에요", "끼니 자주 거름", "불규칙해요"],
    },
  ],
  "수면 개선": [
    {
      question: "어떤 수면 문제가 있으세요?",
      chips: ["잠들기 어려워요", "자주 깨요", "일찍 깨요", "자도 피곤해요"],
    },
    {
      question: "카페인을 오후에 드시는 편이에요?",
      chips: ["거의 안 마셔요", "오후 1~2시까지", "저녁에도 마셔요"],
    },
  ],
  "피부 관리": [
    {
      question: "피부 고민이 뭐예요?",
      chips: ["건조함", "트러블", "탄력 저하", "칙칙함"],
    },
  ],
  "면역 강화": [
    {
      question: "면역이 떨어지는 계기가 있나요?",
      chips: ["환절기", "스트레스", "수면 부족", "잦은 감기"],
    },
  ],
  "뼈·관절": [
    {
      question: "불편한 부위가 어디예요?",
      chips: ["무릎", "허리", "손가락·손목", "전반적으로"],
    },
  ],
  "소화 개선": [
    {
      question: "주요 증상이 뭐예요?",
      chips: ["더부룩함", "변비", "설사", "속쓰림"],
    },
  ],
  "눈 건강": [
    {
      question: "주요 불편이 뭐예요?",
      chips: ["눈 피로", "건조함", "침침함", "야간 시력"],
    },
  ],
};

// TURN 6: 복용 편의 칩
export const TURN6_CHIPS = [
  "1~2알",
  "3~4알",
  "5알 이상도 OK",
] as const;

// 약 서랍 기반 추가 질문 규칙
export const MEDICATION_BASED_QUESTIONS: {
  keyword: string;
  question: string;
  chips: string[];
}[] = [
  {
    keyword: "와파린",
    question:
      "혈액 관련 약을 드시고 계시네요. 출혈 경향이 있으신가요?",
    chips: ["네", "아니요", "잘 모르겠어요"],
  },
  {
    keyword: "레보티록신",
    question:
      "갑상선 약을 드시고 계시네요. 요오드가 든 제품(다시마, 켈프 등) 드시나요?",
    chips: ["네", "아니요"],
  },
  {
    keyword: "메트포르민",
    question:
      "당뇨약을 드시고 계시네요. 저혈당 증상(식은땀, 떨림)을 경험하신 적 있으세요?",
    chips: ["네", "아니요"],
  },
  {
    keyword: "스타틴",
    question:
      "콜레스테롤 약을 드시고 계시네요. 근육통이 있으신가요?",
    chips: ["네", "아니요", "가끔"],
  },
  {
    keyword: "항생제",
    question:
      "항생제를 드시고 계시네요. 유산균도 같이 드시나요?",
    chips: ["네", "아니요"],
  },
];
