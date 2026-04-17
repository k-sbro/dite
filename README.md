# Dite — 식단 기록 앱

AI 식단 기록 앱. 식사 사진을 찍으면 Gemini가 음식과 칼로리를 자동 분석해 기록. 오늘 칼로리 요약과 주간 차트 제공.

## Features

- 식사 사진 → Gemini AI 자동 분석 (음식명 + 칼로리)
- 분석 결과 직접 수정 가능
- 오늘 총 칼로리 요약
- 주간 칼로리 바 차트
- 식사 수정 / 삭제
- WebP 변환 + 최대 800px Storage 저장

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Animation:** Motion (Framer Motion)
- **Validation:** Zod
- **Backend:** Supabase SSR
- **AI:** Gemini 3.1 Flash-Lite Preview
- **Testing:** Vitest

## Getting Started

```bash
npm install
cp .env.example .env.local
# .env.local 에 환경변수 값 입력
npm run dev -- --host
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `GEMINI_API_KEY` | Google Gemini API key |

## Project Structure

```
src/
├── app/          # App Router (page.tsx, actions.ts, layout.tsx, globals.css)
├── components/   # 공유 컴포넌트 (CalorieSummary, WeeklyChart, MealCard, MealList, Modals)
├── lib/
│   ├── supabase/ # Supabase 클라이언트 (server.ts, client.ts)
│   └── gemini.ts # Gemini API 호출
├── types/        # Meal 타입 + Zod 스키마
└── utils/        # imageUtils (WebP 변환, 리사이즈)
```
