import { NextRequest, NextResponse } from "next/server";
import {
  KNOWLEDGE_INTERACTIONS,
  KNOWLEDGE_TIMING,
  buildProfileContext,
} from "@/constants/ai-prompts";

interface MedicationInfo {
  name: string;
  type: string;
  category: string;
  dosage: string | null;
  frequency: string | null;
}

interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
  pregnancy_status?: string | null;
}

interface RequestBody {
  medications: MedicationInfo[];
  profile: ProfileInfo | null;
  health_goals?: string[];
  goal_answers?: Record<string, string>;
  dosage_preference?: string;
  medication_drawer_confirmed?: boolean;
  medication_drawer_changes?: string;
}

function buildSystemPrompt(body: RequestBody): string {
  const { medications, profile, health_goals, goal_answers, dosage_preference } = body;

  const intakeLines: string[] = [];
  if (health_goals && health_goals.length > 0) {
    intakeLines.push(`건강 목표: ${health_goals.join(", ")}`);
  }
  if (goal_answers && Object.keys(goal_answers).length > 0) {
    for (const [question, answer] of Object.entries(goal_answers)) {
      intakeLines.push(`${question}: ${answer}`);
    }
  }
  if (dosage_preference) {
    intakeLines.push(`하루 복용 가능 알 수: ${dosage_preference}`);
  }
  const intakeText = intakeLines.length > 0
    ? `## 문진 정보\n${intakeLines.join("\n")}`
    : "";

  return `당신은 팜톡의 AI 약사 상담 어시스턴트입니다. 면허 인증 약사가 검수하는 플랫폼에서 활동합니다.

## 핵심 원칙
- 안전 최우선: 상호작용·금기 발견 시 추천 보류
- 최소 개입: 영양제 최대 3종만 추천
- 근거 기반: 허가된 기능성 원료만 추천
- 효과 과장 금지, 솔직하게 안내
- 말투: "~에요/해요" 체, 짧고 명확하게

## 절대 금지
- 처방전 없이 전문의약품 추천
- 의학적 진단 (예: '당신은 빈혈입니다')
- 효능 과장

## 사용자 정보
${buildProfileContext(profile, medications)}

${intakeText}

## 추천 출력 형식 (반드시 이 형식으로)

[현재 복용 현황]
처방약 N개, 영양제 N개 복용 중. 현재 상태 간단 요약.

[과잉 성분 주의]
- 중복 성분이 있으면 나열, 없으면 "현재 과잉 섭취 위험 성분은 없어요"

[부족한 영양소]
- 건강 목표, 나이, 성별, 기저질환, 현재 약에 의한 영양소 고갈 등 고려

[약-영양제 상호작용]
- 주의할 상호작용 나열, 없으면 "현재 주의할 상호작용은 없어요"

[추천]
① 성분명 — 추천 이유 한 줄
② 성분명 — 추천 이유 한 줄
③ 성분명 — 추천 이유 한 줄 (필요한 경우만)

⚠️ 주의사항 (있을 경우만)
복용 TIP: 타이밍·조합 한 줄

## 주의
- 마크다운 문법(**, ##, \` 등) 사용하지 않기
- 이모지 사용하지 않기
- 각 섹션은 반드시 [섹션명] 형식으로 시작
- 자연스러운 한국어로 작성
- 추천 성분은 최대 3개
- "치료가 돼요" 대신 "증상 완화에 도움이 될 수 있어요"
- "반드시 드세요" 대신 "고려해볼 수 있어요"

## 약-영양제 주요 상호작용 참고
${KNOWLEDGE_INTERACTIONS}

## 복용 타이밍 참고
${KNOWLEDGE_TIMING}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.medications || !Array.isArray(body.medications) || body.medications.length === 0) {
      return NextResponse.json(
        { error: "분석할 약/영양제 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(body);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: "현재 복용 중인 약과 영양제를 종합적으로 분석해서 맞춤 추천해주세요.",
            },
          ],
          max_tokens: 1536,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI 응답에 실패했습니다." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";

    const cleaned = raw
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,4}\s+/gm, "")
      .replace(/`(.+?)`/g, "$1")
      .trim();

    return NextResponse.json({ report: cleaned });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
