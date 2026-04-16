import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_ROLE,
  CORE_PRINCIPLES,
  ABSOLUTE_PROHIBITIONS,
  OUTPUT_FORMAT_RULES,
  KNOWLEDGE_INTERACTIONS,
  KNOWLEDGE_TIMING,
  EMERGENCY_CRITERIA,
  buildProfileContext,
} from "@/constants/ai-prompts";

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

  const supplementContext = `영양제 상담입니다.
- 영양제 간 성분 중복·과잉 여부 확인
- 현재 복용 약과의 상호작용 점검
- 복용 타이밍·조합 최적화 제안
- 건강 목표에 맞는 추가/변경/중단 권고`;

  const medicationContext = `복약 상담입니다.
- 약물 간 상호작용·금기 확인
- 부작용 가능성 및 모니터링 포인트
- 복용법·용량 적절성 검토
- 약에 의한 영양소 고갈 여부 안내`;

  const typeContext =
    consultType === "supplement" ? supplementContext : medicationContext;

  return `${SYSTEM_ROLE}
${CORE_PRINCIPLES}
${ABSOLUTE_PROHIBITIONS}

## 현재 상담 모드: 약사 상담 분석 리포트

## 상담 유형
${typeContext}

## 환자 정보
${buildProfileContext(profile, medications)}

${KNOWLEDGE_INTERACTIONS}
${KNOWLEDGE_TIMING}
${EMERGENCY_CRITERIA}

## 리포트 형식 (반드시 이 형식으로 작성)

[요약]
(1~2문장 핵심 요약)

[분석]
(상세 분석 — 상호작용, 복용 가이드, 용량 검토 등)

[주의사항]
(경고, 금기사항, 주의해야 할 부작용)

[권장사항]
(사용자에게 권장하는 행동)

${OUTPUT_FORMAT_RULES}

## 추가 출력 주의
- 각 섹션은 반드시 [섹션명] 형식으로 시작
- 마크다운 기호(**, ##, \` 등) 사용하지 마세요
- 이모지 사용하지 마세요
- 항목 나열 시 "- " 형식 사용
- 불확실한 정보는 "약사 확인 필요"로 표기`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
      return NextResponse.json(
        { error: "상담 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!body.consultType || !["medication", "supplement"].includes(body.consultType)) {
      return NextResponse.json(
        { error: "유효한 상담 유형을 선택해주세요." },
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
