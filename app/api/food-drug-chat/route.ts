import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MedicationInfo {
  name: string;
  type: string;
  dosage: string | null;
}

interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
}

interface RequestBody {
  messages: Message[];
  medications: MedicationInfo[];
  profile: ProfileInfo | null;
  targetUserName?: string;
}

function buildSystemPrompt(body: RequestBody): string {
  const { medications, profile, targetUserName } = body;

  const medsText =
    medications.length > 0
      ? medications
          .map(
            (m) =>
              `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.type === "supplement" ? " [영양제]" : ""}`
          )
          .join("\n")
      : "등록된 약 없음";

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
      ]
        .filter(Boolean)
        .join(", ")
    : "건강정보 미등록";

  const targetContext = targetUserName
    ? `당신이 관리하고 있는 ${targetUserName}님의 약 정보를 기반으로 답변합니다.`
    : "사용자 본인의 약 정보를 기반으로 답변합니다.";

  return `당신은 팜톡 앱의 약-음식 상호작용 전문 AI 약사 도우미입니다.
${targetContext}

## 역할
- 현재 복용 중인 약과 음식/음료의 상호작용에 대해 알려주는 도우미
- 위험한 상호작용은 명확하게 경고하되, 불필요한 공포 조장은 하지 않기
- 친근하고 쉬운 말투, 반말 금지
- 확실하지 않은 경우 "약사님께 직접 확인해보시는 게 가장 정확합니다" 같은 표현 사용
- 의학적 진단이나 처방은 절대 하지 않기

## 사용자 정보
- 건강정보: ${profileText}
- 현재 복용 중인 약:
${medsText}

## 응답 규칙
- 2~4문장으로 짧고 명확하게 답변
- 이모지 사용하지 않기
- 마크다운 문법(**, ##, \` 등) 사용하지 않기
- 위험도를 알려줄 때: "주의가 필요해요", "괜찮아요", "피하시는 게 좋아요" 등 자연스러운 표현 사용
- 관련 약이 복용 목록에 있으면 해당 약을 구체적으로 언급
- 복용 목록에 없는 약에 대한 질문은 일반적인 정보로 답변
- 최대한 자연스러운 한국어로

또한 사용자가 영양제 추천을 요청하면, 현재 복용 중인 약과의 상호작용을 고려하여 적절한 영양제를 추천해주세요.
과잉 복용 위험이 있는 성분이 있다면 반드시 경고해주세요.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages } = body;

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
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 512,
          temperature: 0.7,
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

    return NextResponse.json({ message: cleaned });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
