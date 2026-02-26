import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "이미지 데이터가 필요합니다." },
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
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `이 이미지에서 약 또는 영양제 정보를 추출해주세요.
처방전, 약 봉투, 약 상자, 영양제 병, 영양제 패키지 등에서 제품명과 복용법을 찾아주세요.

반드시 아래 JSON 형식으로만 답변해주세요. 다른 텍스트는 포함하지 마세요:
[
  {
    "name": "제품명 (용량 포함)",
    "type": "medicine 또는 supplement (처방약/일반약이면 medicine, 비타민/오메가3/유산균/영양보충제이면 supplement)",
    "dosage": "복용량 (예: 1정, 2캡슐)",
    "frequency": "복용 주기 (예: 매일 1회, 매일 2회, 매일 3회, 필요시, 주 1회, 주 2~3회)"
  }
]

약이나 영양제 정보를 찾을 수 없는 경우 빈 배열 []을 반환해주세요.`,
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "AI 분석에 실패했습니다." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";

    let medications: {
      name: string;
      type: string;
      dosage: string;
      frequency: string;
    }[] = [];
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        medications = parsed
          .filter(
            (item: Record<string, unknown>) => typeof item.name === "string"
          )
          .map(
            (item: {
              name: string;
              type?: string;
              dosage?: string;
              frequency?: string;
            }) => ({
              name: item.name,
              type:
                item.type === "supplement" || item.type === "medicine"
                  ? item.type
                  : "medicine",
              dosage: item.dosage ?? "",
              frequency: item.frequency ?? "",
            })
          );
      }
    } catch {
      medications = [];
    }

    return NextResponse.json({ medications });
  } catch (error) {
    console.error("Analyze image error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
