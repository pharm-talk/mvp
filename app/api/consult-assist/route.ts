import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_ROLE,
  CORE_PRINCIPLES,
  ABSOLUTE_PROHIBITIONS,
  EMERGENCY_CRITERIA,
  buildProfileContext,
} from "@/constants/ai-prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  consultType: "medication" | "supplement";
  medications: { name: string; type: string; dosage: string | null }[];
  profile: {
    gender: string | null;
    birth_date: string | null;
    conditions: string[];
    allergies: string[];
  } | null;
}

function buildSystemPrompt(body: RequestBody): string {
  const { consultType, medications, profile } = body;

  const typeContext =
    consultType === "supplement"
      ? `영양제 상담을 준비하고 있습니다. 어떤 영양제가 좋을지, 현재 먹는 영양제 조합이 괜찮은지, 특정 건강 고민에 맞는 영양제 등에 대해 도와주세요.`
      : `복약 상담을 준비하고 있습니다. 약 궁합, 부작용, 복용법, 대체약 등에 대한 질문을 정리하도록 도와주세요.`;

  return `${SYSTEM_ROLE}
${CORE_PRINCIPLES}
${ABSOLUTE_PROHIBITIONS}

## 현재 상담 모드: 질문 정리 도우미
사용자의 막연한 고민을 구체적인 약사 상담 질문으로 만들어주는 도우미입니다.

## 사용자 정보
${buildProfileContext(profile, medications)}

## 상담 유형
${typeContext}

## 대화 흐름
1. 첫 메시지: 사용자 고민을 듣고 공감 + 1~2개 구체적 질문
2. 2~3회 대화 후: 충분히 파악되면 정리된 상담 질문을 제안
3. 정리된 질문은 아래 형식으로:

---제안---
[여기에 정리된 상담 내용을 작성]
---끝---

이 형식은 사용자가 "이 내용으로 상담하기" 버튼을 눌렀을 때 자동으로 채워집니다.
사용자가 원하면 수정할 수 있다고 안내해주세요.

${EMERGENCY_CRITERIA}

## 주의
- 절대 2~3문장 이상 길게 말하지 마세요
- 한 번에 1~2개 질문만
- 이모지 사용하지 마세요
- '~에요', '~해요' 체 — 딱딱한 '~습니다' 지양
- 최대한 자연스러운 한국어로`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(body);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI 응답에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // 마크다운 기호 정리
    const cleaned = raw
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,4}\s+/gm, "")
      .replace(/`(.+?)`/g, "$1")
      .trim();

    // ---제안--- ... ---끝--- 사이의 내용 추출
    let suggestedContent = "";
    const match = cleaned.match(/---제안---([\s\S]*?)---끝---/);
    if (match) {
      suggestedContent = match[1].trim();
    }

    return NextResponse.json({
      message: cleaned.replace(/---제안---[\s\S]*?---끝---/, "").trim(),
      suggestedContent,
    });
  } catch (error) {
    console.error("Consult assist error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
