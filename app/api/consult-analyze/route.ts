import { NextRequest, NextResponse } from "next/server";

interface MedicationInfo {
  name: string;
  type: string;
  dosage: string | null;
  category?: string;
}

interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
  pregnancy_status?: string;
}

interface RequestBody {
  consultType: "medication" | "supplement";
  question: string;
  medications: MedicationInfo[];
  profile: ProfileInfo | null;
}

function buildSystemPrompt(body: RequestBody): string {
  const { consultType, medications, profile } = body;

  const meds =
    medications.length > 0
      ? medications
          .map(
            (m) =>
              `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.category ? ` [${m.category}]` : ""}`
          )
          .join("\n")
      : "등록된 약 없음";

  const profileInfo = profile
    ? [
        profile.gender === "male"
          ? "남성"
          : profile.gender === "female"
            ? "여성"
            : null,
        profile.birth_date
          ? `${new Date().getFullYear() - new Date(profile.birth_date).getFullYear()}세`
          : null,
        profile.conditions?.length > 0
          ? `기저질환: ${profile.conditions.join(", ")}`
          : null,
        profile.allergies?.length > 0
          ? `알레르기: ${profile.allergies.join(", ")}`
          : null,
        profile.pregnancy_status === "pregnant"
          ? "임신 중"
          : profile.pregnancy_status === "nursing"
            ? "수유 중"
            : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "건강정보 미등록";

  const typeContext =
    consultType === "supplement"
      ? "영양제 상담입니다. 영양제 간 상호작용, 복용 시 주의사항, 권장 복용법 등을 분석해주세요."
      : "복약 상담입니다. 약물 간 상호작용, 부작용, 복용법, 용량 적절성 등을 분석해주세요.";

  return `당신은 전문 약학 분석 AI입니다. 사용자의 상담 요청을 바탕으로 전문적인 분석 리포트를 작성해주세요.

## 역할
- 약물 정보와 환자 상태를 종합 분석하여 구조화된 리포트 생성
- 의학적 근거에 기반한 정확한 정보 제공
- 약사가 검증하기 쉬운 형태로 작성

## 환자 정보
- 건강정보: ${profileInfo}
- 현재 복용 중:
${meds}

## 상담 유형
${typeContext}

## 리포트 형식 (반드시 이 형식으로 작성)

[요약]
(1~2문장 핵심 요약)

[분석]
(상세 분석 - 약물 상호작용, 복용 가이드, 용량 검토 등)

[주의사항]
(경고, 금기사항, 주의해야 할 부작용)

[권장사항]
(사용자에게 권장하는 행동)

## 주의
- 마크다운 기호(**, ##, \` 등) 사용하지 마세요
- 이모지 사용하지 마세요
- 항목 나열 시 "- " 형식 사용
- 자연스러운 한국어로 작성
- 약사가 아닌 일반인이 읽어도 이해할 수 있는 수준으로 설명
- 불확실한 정보는 "약사 확인 필요"로 표기`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

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
            { role: "user", content: body.question },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI 분석에 실패했습니다." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown formatting
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
