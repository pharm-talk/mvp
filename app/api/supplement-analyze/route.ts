import { NextRequest, NextResponse } from "next/server";

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
  lifestyle?: string;
  symptoms?: string[];
}

function buildSystemPrompt(body: RequestBody): string {
  const { medications, profile, health_goals, lifestyle, symptoms } = body;

  const chronicMeds = medications.filter((m) => m.category === "chronic");
  const prescriptionMeds = medications.filter((m) => m.category === "prescription");
  const supplements = medications.filter((m) => m.category === "supplement");

  const formatMed = (m: MedicationInfo) =>
    `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.frequency ? ` ${m.frequency}` : ""}`;

  const medsText = [
    chronicMeds.length > 0
      ? `장기 복용약:\n${chronicMeds.map(formatMed).join("\n")}`
      : null,
    prescriptionMeds.length > 0
      ? `처방약:\n${prescriptionMeds.map(formatMed).join("\n")}`
      : null,
    supplements.length > 0
      ? `영양제:\n${supplements.map(formatMed).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const profileText = profile
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
        profile.pregnancy_status
          ? `임신 상태: ${profile.pregnancy_status}`
          : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "건강정보 미등록";

  /* Intake answers section */
  const intakeLines: string[] = [];
  if (health_goals && health_goals.length > 0) {
    intakeLines.push(`사용자의 건강 목표: ${health_goals.join(", ")}`);
  }
  if (lifestyle) {
    intakeLines.push(`식습관: ${lifestyle}`);
  }
  if (symptoms && symptoms.length > 0) {
    intakeLines.push(`현재 불편 증상: ${symptoms.join(", ")}`);
  }
  const intakeText =
    intakeLines.length > 0
      ? `\n## 문진 정보\n${intakeLines.join("\n")}`
      : "";

  return `당신은 약사 자격을 가진 영양제 전문 분석 AI입니다. 사용자의 현재 복용 중인 모든 약(장기 복용약, 처방약, 영양제)을 종합적으로 분석하여 개인 맞춤 리포트를 작성하세요.

## 사용자 정보
- 건강정보: ${profileText}
${intakeText}

## 현재 복용 중인 약/영양제
${medsText || "등록된 약 없음"}

## 분석 지침
1. 처방약 ${chronicMeds.length + prescriptionMeds.length}개, 영양제 ${supplements.length}개를 모두 고려하여 분석
2. 영양제 간 성분 중복 여부, 처방약과 영양제 간 상호작용을 꼼꼼히 확인
3. 사용자의 나이, 성별, 기저질환에 따른 부족 영양소 파악
4. 처방약이 체내 영양소를 고갈시키는 경우 반드시 언급
5. 구체적이고 실용적인 추천 제공
6. 사용자의 건강 목표, 식습관, 불편 증상을 반영하여 맞춤형 분석 제공

## 출력 형식 (반드시 아래 형식 그대로 출력)

[현재 복용 현황]
처방약 N개, 영양제 N개 복용 중

[과잉 성분 주의]
- (영양제 간 또는 영양제-처방약 간 성분 중복이 있으면 나열, 없으면 "현재 과잉 섭취 위험 성분은 없습니다"라고 작성)

[부족한 영양소]
- (기저질환, 나이, 성별, 건강 목표, 식습관, 현재 약에 의한 영양소 고갈 등을 고려해 부족한 영양소 나열)

[약-영양제 상호작용]
- (처방약과 영양제 간 주의해야 할 상호작용 나열, 없으면 "현재 주의할 상호작용은 없습니다"라고 작성)

[추천]
- (건강 목표와 불편 증상을 고려한 구체적인 영양제 추가/변경/중단 추천)

## 주의
- 마크다운 문법(**, ##, \` 등) 사용하지 않기
- 이모지 사용하지 않기
- 자연스러운 한국어로 작성
- 각 섹션은 반드시 [섹션명] 형식으로 시작
- 의학적 진단은 하지 않고, 중요한 사항은 "약사님께 상담을 권장합니다" 같은 표현 사용`;
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
            {
              role: "user",
              content: "현재 복용 중인 약과 영양제를 종합적으로 분석해주세요.",
            },
          ],
          max_tokens: 1024,
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

    // 마크다운 기호 정리
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
