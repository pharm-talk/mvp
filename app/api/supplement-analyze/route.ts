import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_ROLE,
  CORE_PRINCIPLES,
  ABSOLUTE_PROHIBITIONS,
  OUTPUT_FORMAT_RULES,
  KNOWLEDGE_INTERACTIONS,
  KNOWLEDGE_TIMING,
  EMERGENCY_CRITERIA,
  FEW_SHOT_SUPPLEMENT,
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
  lifestyle?: string;
  symptoms?: string[];
}

function buildSystemPrompt(body: RequestBody): string {
  const { medications, profile, health_goals, lifestyle, symptoms } = body;

  /* Intake answers section */
  const intakeLines: string[] = [];
  if (health_goals && health_goals.length > 0) {
    intakeLines.push(`건강 목표: ${health_goals.join(", ")}`);
  }
  if (lifestyle) {
    intakeLines.push(`식습관: ${lifestyle}`);
  }
  if (symptoms && symptoms.length > 0) {
    intakeLines.push(`현재 불편 증상: ${symptoms.join(", ")}`);
  }
  const intakeText =
    intakeLines.length > 0
      ? `## 문진 정보\n${intakeLines.join("\n")}`
      : "";

  return `${SYSTEM_ROLE}
${CORE_PRINCIPLES}
${ABSOLUTE_PROHIBITIONS}

## 현재 상담 모드: 영양제 코디네이터

## 사용자 정보
${buildProfileContext(profile, medications)}

${intakeText}

${OUTPUT_FORMAT_RULES}
${KNOWLEDGE_INTERACTIONS}
${KNOWLEDGE_TIMING}
${EMERGENCY_CRITERIA}

## 대화 예시
${FEW_SHOT_SUPPLEMENT}`;
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
              content: "현재 복용 중인 약과 영양제를 종합적으로 분석해주세요.",
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
