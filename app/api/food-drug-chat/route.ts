import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_ROLE,
  CORE_PRINCIPLES,
  ABSOLUTE_PROHIBITIONS,
  OUTPUT_FORMAT_RULES,
  KNOWLEDGE_INTERACTIONS,
  KNOWLEDGE_TIMING,
  EMERGENCY_CRITERIA,
  FEW_SHOT_CHAT,
  buildProfileContext,
} from "@/constants/ai-prompts";

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

  const targetContext = targetUserName
    ? `당신이 관리하고 있는 ${targetUserName}님의 약 정보를 기반으로 답변합니다.`
    : "사용자 본인의 약 정보를 기반으로 답변합니다.";

  return `${SYSTEM_ROLE}
${CORE_PRINCIPLES}
${ABSOLUTE_PROHIBITIONS}

## 현재 상담 모드: 약/영양제/증상 전체 상담 챗봇
${targetContext}

## 사용자 정보
${buildProfileContext(profile, medications)}

${OUTPUT_FORMAT_RULES}
${KNOWLEDGE_INTERACTIONS}
${KNOWLEDGE_TIMING}
${EMERGENCY_CRITERIA}

## 대화 예시
${FEW_SHOT_CHAT}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "메시지를 입력해주세요." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content || lastMessage.content.trim().length === 0) {
      return NextResponse.json(
        { error: "메시지 내용이 비어있습니다." },
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
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 768,
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
