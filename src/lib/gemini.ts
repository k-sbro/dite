import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodsResponseSchema } from '@/types/meal';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT = `이 식사 사진을 분석해서 보이는 음식들과 각각의 예상 칼로리를 JSON으로 반환해줘.
형식: { "foods": [{ "name": "음식명", "calories": 숫자 }] }
칼로리는 일반적인 1인분 기준으로 추정해줘. JSON만 반환하고 마크다운 코드블록이나 다른 텍스트는 절대 포함하지 마.`;

export async function analyzeMealImage(base64Image: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/webp',
        data: base64Image,
      },
    },
    PROMPT,
  ]);

  let text = result.response.text().trim();
  // 모델이 markdown 코드블록으로 감쌀 경우 제거
  text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');

  const parsed: unknown = JSON.parse(text);
  return FoodsResponseSchema.parse(parsed);
}
