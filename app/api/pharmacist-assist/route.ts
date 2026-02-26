import { NextRequest, NextResponse } from "next/server";

interface MedSnapshot {
  name: string;
  type: string;
  dosage: string | null;
}

interface HealthSnapshot {
  gender?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  conditions?: string[];
  allergies?: string[];
  pregnancy_status?: string;
}

interface RequestBody {
  mode: "draft" | "polish" | "followup";
  consultType: "medication" | "supplement";
  question: string;
  medications: MedSnapshot[];
  health: HealthSnapshot | null;
  draft?: string;
  followupQuestion?: string;
  previousAnswer?: string;
}

function buildPatientContext(body: RequestBody): string {
  const { health, medications } = body;

  const meds =
    medications.length > 0
      ? medications
          .map((m) => `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""} [${m.type === "supplement" ? "영양제" : "의약품"}]`)
          .join("\n")
      : "등록된 약 없음";

  const parts: string[] = [];
  if (health) {
    if (health.gender) parts.push(health.gender === "male" ? "남성" : "여성");
    if (health.birth_date) {
      const age = new Date().getFullYear() - new Date(health.birth_date).getFullYear();
      parts.push(`${age}세`);
    }
    if (health.height_cm) parts.push(`${health.height_cm}cm`);
    if (health.weight_kg) parts.push(`${health.weight_kg}kg`);
    if (health.conditions?.length) parts.push(`기저질환: ${health.conditions.join(", ")}`);
    if (health.allergies?.length) parts.push(`알레르기: ${health.allergies.join(", ")}`);
    if (health.pregnancy_status === "pregnant") parts.push("임신 중");
    if (health.pregnancy_status === "nursing") parts.push("수유 중");
  }

  return `## 환자 정보
${parts.length > 0 ? parts.join(" / ") : "건강정보 미등록"}

## 복용 중인 약
${meds}`;
}

function buildSystemPrompt(body: RequestBody): string {
  const patientContext = buildPatientContext(body);
  const typeLabel = body.consultType === "supplement" ? "영양제" : "복약";

  if (body.mode === "draft") {
    return `당신은 경험 많은 약사입니다. 환자의 질문에 직접 답변하는 것처럼 작성하세요.

## 역할
환자가 올린 상담 질문에 대해, 실제 약사가 직접 상담하듯 답변을 작성하세요.

## 말투
- 환자에게 직접 말하는 존댓말 ("~하세요", "~됩니다", "~드릴게요")
- 딱딱한 교과서체가 아니라, 동네 약국에서 친절하게 설명하는 느낌
- "안녕하세요" 같은 인사 포함하되 과하지 않게
- 이모지 사용하지 마

## 구조
아래 대괄호 섹션 형식으로 작성:
[요약] 핵심 답변 1~2문장
[상세 설명] 약사로서 구체적으로 설명
[주의사항] 반드시 알아야 할 점 (해당 시)
[권장사항] 약사가 권하는 행동 (해당 시)

## 주의
- 확실하지 않은 내용은 "담당 의사 선생님과 한번 상의해보세요" 등 안전한 표현 사용
- 진단이나 처방 변경은 하지 않기
- 환자의 복용약과 건강정보를 꼭 고려해서 답변

## 포맷 규칙 (매우 중요)
- **절대 마크다운 문법 사용 금지**: **, ##, *, -, 번호 목록(1. 2. 3.) 등 사용하지 마
- 섹션 구분은 반드시 [대괄호 제목] 형식만 사용
- 그냥 일반 문장으로 자연스럽게 써. 꾸미지 마

${patientContext}

## 상담 유형
${typeLabel} 상담`;
  }

  if (body.mode === "polish") {
    return `당신은 약사가 작성한 답변을 다듬어주는 역할입니다.

## 핵심 원칙
약사가 쓴 내용의 의미와 판단은 절대 바꾸지 마세요. 약사가 직접 쓴 것처럼 자연스러워야 합니다.

## 하는 것
- 문장을 매끄럽게 다듬기
- 존댓말로 통일
- 아래 섹션 구조로 정리 (내용이 해당될 때만):
  [요약] 핵심 답변 1~2문장
  [상세 설명] 약사 원문 기반 구체적 설명
  [주의사항] 약사가 언급한 주의할 점
  [권장사항] 약사가 권한 행동
- 동네 약국에서 친절하게 설명하는 느낌의 말투

## 하지 않는 것
- 약사가 말하지 않은 의학적 내용 추가하지 마
- AI가 쓴 티 나는 딱딱한 표현 쓰지 마
- 이모지 쓰지 마
- 내용을 과도하게 늘리지 마
- **절대 마크다운 문법 사용 금지**: **, ##, *, 번호 목록(1. 2. 3.) 등 쓰지 마
- 섹션 구분은 [대괄호 제목] 형식만 사용
- 그냥 일반 문장으로 자연스럽게 정리해

${patientContext}

## 상담 유형
${typeLabel} 상담`;
  }

  // followup
  return `당신은 경험 많은 약사입니다. 이전에 답변한 상담에 대해 환자가 추가 질문을 했습니다.

## 역할
이전 답변의 맥락을 이어서, 추가 질문에 약사로서 직접 답변하세요.

## 말투
- 이전 답변과 같은 톤 유지
- 친절하고 전문적인 존댓말
- 짧고 핵심적으로 (3~5문장)
- 이모지 쓰지 마
- 마크다운 문법(**, ##, *, 번호 목록) 절대 사용 금지. 일반 문장으로만 써

${patientContext}

## 상담 유형
${typeLabel} 상담`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(body);

    let userContent = "";
    if (body.mode === "draft") {
      userContent = `환자 질문:\n${body.question}\n\n이 환자에게 약사로서 답변해주세요.`;
    } else if (body.mode === "polish") {
      userContent = `환자 질문:\n${body.question}\n\n내가 작성한 답변:\n${body.draft}\n\n이 내용 그대로 살려서, 표현만 깔끔하게 다듬어줘. 내가 쓴 내용을 바꾸지 마.`;
    } else {
      userContent = `이전에 내가 한 답변:\n${body.previousAnswer}\n\n환자 추가 질문:\n${body.followupQuestion}\n\n이 추가 질문에 대해 답변해주세요.`;
    }

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
          { role: "user", content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI 응답에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // 마크다운 기호 정리
    const content = raw
      .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold** → bold
      .replace(/\*(.+?)\*/g, "$1")       // *italic* → italic
      .replace(/^#{1,4}\s+/gm, "")       // ## heading → heading
      .replace(/^[-*]\s+/gm, "")         // - list item → list item
      .replace(/^\d+\.\s+/gm, "")        // 1. numbered → numbered
      .replace(/`(.+?)`/g, "$1")         // `code` → code
      .trim();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Pharmacist assist error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
