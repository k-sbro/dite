# Meal Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 식사 사진을 Gemini 3.1 Flash-Lite로 분석해 음식과 칼로리를 자동 기록하는 단일 사용자 식단 관리 웹앱을 구축한다.

**Architecture:** 단일 페이지(/) + 모달 기반 CRUD. Server Components 기본, 사용자 상호작용 컴포넌트만 `'use client'`. 데이터 변경은 Server Actions + `revalidatePath('/')`. 이미지는 클라이언트에서 Canvas API로 WebP 변환(최대 800px) 후 Server Action을 통해 Supabase Storage에 업로드.

**Tech Stack:** Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v4 + Motion (Framer Motion) + Zod + Supabase SSR + Gemini 3.1 Flash-Lite Preview (`gemini-3.1-flash-lite-preview`) + Vitest

**Design Reference:** `DESIGN.md` (Nike 디자인 시스템)  
**Spec Reference:** `docs/superpowers/specs/2026-04-16-meal-tracker-design.md`

---

## File Map

| 파일 | 역할 |
|------|------|
| `src/app/page.tsx` | 홈 (Server Component) — DB 조회 후 컴포넌트에 props 전달 |
| `src/app/layout.tsx` | Root layout |
| `src/app/globals.css` | Nike 디자인 토큰 (CSS variables) + Tailwind v4 |
| `src/app/actions.ts` | Server Actions: analyzeMeal, saveMeal, updateMeal, deleteMeal |
| `src/components/CalorieSummary.tsx` | 오늘 총 칼로리 표시 (Server Component) |
| `src/components/WeeklyChart.tsx` | 주간 바 차트 (Client Component — interactive) |
| `src/components/MealList.tsx` | 식사 목록, 시간대별 그룹 (Server Component) |
| `src/components/MealCard.tsx` | 식사 카드 (Client Component — 클릭 시 EditModal 열기) |
| `src/components/HomeClient.tsx` | FAB + AddMealModal 래퍼 (Client Component) |
| `src/components/AddMealModal.tsx` | 식사 추가 3단계 모달 (Client Component) |
| `src/components/EditMealModal.tsx` | 식사 수정/삭제 모달 (Client Component) |
| `src/lib/supabase/server.ts` | createServerClient (Server Components / Actions 용) |
| `src/lib/supabase/client.ts` | createBrowserClient (Client Components 용) |
| `src/lib/gemini.ts` | Gemini API 호출 + 응답 파싱 |
| `src/types/meal.ts` | Meal 타입 + Zod 스키마 |
| `src/utils/imageUtils.ts` | WebP 변환 + 800px 리사이즈 (Canvas API, 브라우저 전용) |
| `src/types/meal.test.ts` | Zod 스키마 단위 테스트 |
| `supabase/migrations/001_create_meals.sql` | meals 테이블 + Storage 버킷 + RLS |
| `vitest.config.ts` | Vitest 설정 |
| `.env.local` | 환경변수 (로컬) |
| `.env.example` | 환경변수 예시 (커밋용) |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `(Next.js 프로젝트 루트 전체)`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Next.js 앱 생성**

```bash
cd /c/dev/dite
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --yes
```

Expected: `src/`, `package.json`, `tsconfig.json`, `next.config.mjs` 생성됨

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install @supabase/ssr @supabase/supabase-js @google/generative-ai motion zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: tsconfig.json strict 설정 확인 및 강화**

`tsconfig.json`의 `compilerOptions`에 다음이 있는지 확인하고 없으면 추가:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- [ ] **Step 4: Vitest 설정 파일 생성**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 5: package.json에 test 스크립트 추가**

`package.json`의 `scripts`에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: .env.example 생성**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

- [ ] **Step 7: .env.local 생성 (실제 값은 Task 4 이후 채움)**

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

- [ ] **Step 8: .gitignore에 .env.local 포함 여부 확인**

`create-next-app`이 이미 `.env*.local`을 포함시킴. 확인:
```bash
grep ".env" .gitignore
```
Expected output: `.env*.local` 라인 존재

- [ ] **Step 9: 빌드 테스트**

```bash
npm run build
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Nike 디자인 시스템 토큰 설정

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: globals.css에 Nike 디자인 토큰 적용**

`src/app/globals.css`를 다음으로 교체:
```css
@import "tailwindcss";

@theme {
  --color-nike-black: #111111;
  --color-nike-white: #ffffff;
  --color-grey-50: #fafafa;
  --color-grey-100: #f5f5f5;
  --color-grey-200: #e5e5e5;
  --color-grey-300: #cacacb;
  --color-grey-500: #707072;
  --color-grey-700: #39393b;
  --color-grey-800: #28282a;
  --color-grey-900: #1f1f21;
  --color-nike-red: #d30005;
  --color-success: #007d48;
  --color-link-blue: #1151ff;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #111111;
  margin: 0;
}
```

- [ ] **Step 2: layout.tsx 업데이트**

`src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '식단 기록',
  description: 'AI로 식사 사진을 분석해 칼로리를 기록하는 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add Nike design system tokens to globals.css"
```

---

## Task 3: GitHub 레포지토리 생성 및 연동

**Files:** (git 설정)

- [ ] **Step 1: GitHub 레포 생성**

```bash
gh repo create dite --public --source=. --remote=origin
```
Expected: `https://github.com/<username>/dite` 레포 생성 및 origin 설정

- [ ] **Step 2: main 브랜치로 push**

```bash
git push -u origin master
```
또는 브랜치명이 `main`인 경우:
```bash
git push -u origin main
```

- [ ] **Step 3: 원격 확인**

```bash
gh repo view --web
```
Expected: 브라우저에서 GitHub 레포 열림

---

## Task 4: Supabase 프로젝트 & DB 설정

**Files:**
- Create: `supabase/migrations/001_create_meals.sql`

- [ ] **Step 1: Supabase 프로젝트 생성**

Supabase MCP 도구를 사용해 프로젝트 생성:
- 조직 목록 조회 후 organization ID 확인
- 프로젝트명: `dite`, 리전: `ap-northeast-2` (Seoul), DB 비밀번호 설정

프로젝트 생성 완료 후 Project URL과 Anon Key를 `.env.local`에 저장:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 2: SQL 마이그레이션 파일 생성**

`supabase/migrations/001_create_meals.sql`:
```sql
-- meals 테이블 생성
CREATE TABLE IF NOT EXISTS public.meals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE        NOT NULL,
  meal_time  TEXT        NOT NULL CHECK (meal_time IN ('breakfast', 'lunch', 'dinner', 'snack')),
  photo_url  TEXT        NOT NULL,
  foods      JSONB       NOT NULL DEFAULT '[]',
  total_cal  INTEGER     NOT NULL DEFAULT 0,
  memo       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- 단일 사용자 앱: 모든 작업 허용
CREATE POLICY "Allow all" ON public.meals
  FOR ALL USING (true) WITH CHECK (true);

-- meal-photos Storage 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 공개 읽기/쓰기
CREATE POLICY "Public Storage Access" ON storage.objects
  FOR ALL USING (bucket_id = 'meal-photos')
  WITH CHECK (bucket_id = 'meal-photos');
```

- [ ] **Step 3: 마이그레이션 적용**

Supabase MCP `apply_migration` 도구를 사용해 위 SQL 적용.
또는 `execute_sql` 도구로 직접 실행.

- [ ] **Step 4: 테이블 및 버킷 확인**

Supabase MCP `list_tables` 도구로 `meals` 테이블 존재 확인.

- [ ] **Step 5: Commit**

```bash
git add supabase/ .env.example
git commit -m "feat: add Supabase migration for meals table and storage bucket"
```

---

## Task 5: Types & Zod 스키마 (TDD)

**Files:**
- Create: `src/types/meal.ts`
- Create: `src/types/meal.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

`src/types/meal.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { FoodItemSchema, FoodsResponseSchema, MealTimeSchema } from './meal';

describe('FoodItemSchema', () => {
  it('accepts valid food item', () => {
    expect(FoodItemSchema.parse({ name: '라면', calories: 500 })).toEqual({
      name: '라면',
      calories: 500,
    });
  });

  it('rejects empty name', () => {
    expect(() => FoodItemSchema.parse({ name: '', calories: 500 })).toThrow();
  });

  it('rejects negative calories', () => {
    expect(() => FoodItemSchema.parse({ name: '라면', calories: -1 })).toThrow();
  });

  it('rejects float calories', () => {
    expect(() => FoodItemSchema.parse({ name: '라면', calories: 1.5 })).toThrow();
  });
});

describe('FoodsResponseSchema', () => {
  it('parses valid Gemini JSON response', () => {
    const input = { foods: [{ name: '라면', calories: 500 }, { name: '김치', calories: 30 }] };
    expect(FoodsResponseSchema.parse(input)).toEqual(input);
  });

  it('accepts empty foods array', () => {
    expect(FoodsResponseSchema.parse({ foods: [] })).toEqual({ foods: [] });
  });

  it('rejects invalid structure', () => {
    expect(() => FoodsResponseSchema.parse({ items: [] })).toThrow();
  });
});

describe('MealTimeSchema', () => {
  it('accepts all valid meal times', () => {
    expect(MealTimeSchema.parse('breakfast')).toBe('breakfast');
    expect(MealTimeSchema.parse('lunch')).toBe('lunch');
    expect(MealTimeSchema.parse('dinner')).toBe('dinner');
    expect(MealTimeSchema.parse('snack')).toBe('snack');
  });

  it('rejects invalid meal time', () => {
    expect(() => MealTimeSchema.parse('brunch')).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL — `meal.ts` 파일 없음

- [ ] **Step 3: 구현**

`src/types/meal.ts`:
```typescript
import { z } from 'zod';

export const MealTimeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealTime = z.infer<typeof MealTimeSchema>;

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  calories: z.number().int().nonnegative(),
});
export type FoodItem = z.infer<typeof FoodItemSchema>;

export const FoodsResponseSchema = z.object({
  foods: z.array(FoodItemSchema),
});

export const MealSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_time: MealTimeSchema,
  photo_url: z.string().url(),
  foods: z.array(FoodItemSchema),
  total_cal: z.number().int().nonnegative(),
  memo: z.string().nullable(),
  created_at: z.string(),
});
export type Meal = z.infer<typeof MealSchema>;

export const MealTimeLabels: Record<MealTime, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add Meal types and Zod schemas with tests"
```

---

## Task 6: 이미지 유틸리티 (WebP 변환 + 리사이즈)

**Files:**
- Create: `src/utils/imageUtils.ts`

- [ ] **Step 1: imageUtils.ts 작성**

`src/utils/imageUtils.ts`:
```typescript
/**
 * 브라우저 전용 (Canvas API 사용). Server Component에서 import 금지.
 */

/**
 * File을 WebP Blob으로 변환하고 최대 너비 maxWidth로 리사이즈한다.
 */
export async function convertToWebP(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}

/**
 * Blob을 base64 문자열(data URL prefix 제외)로 변환한다.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64 === undefined) {
        reject(new Error('Failed to extract base64 from data URL'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}
```

- [ ] **Step 2: TypeScript 타입 오류 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add src/utils/imageUtils.ts
git commit -m "feat: add WebP conversion and base64 image utilities"
```

---

## Task 7: Supabase 클라이언트

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Server 클라이언트 작성**

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 set 호출 시 무시
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Browser 클라이언트 작성**

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase server and browser clients"
```

---

## Task 8: Gemini 통합

**Files:**
- Create: `src/lib/gemini.ts`

- [ ] **Step 1: GEMINI_API_KEY 확인**

`.env.local`에 `GEMINI_API_KEY` 값이 채워져 있는지 확인. 없으면 Google AI Studio에서 발급 후 입력.

- [ ] **Step 2: gemini.ts 작성**

`src/lib/gemini.ts`:
```typescript
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
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add Gemini 3.1 Flash-Lite image analysis integration"
```

---

## Task 9: Server Actions

**Files:**
- Create: `src/app/actions.ts`

- [ ] **Step 1: actions.ts 작성**

`src/app/actions.ts`:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { analyzeMealImage } from '@/lib/gemini';
import { FoodsResponseSchema, MealTimeSchema } from '@/types/meal';

/** Gemini로 이미지 분석. DB 저장 없이 결과만 반환. */
export async function analyzeMeal(base64Image: string) {
  return analyzeMealImage(base64Image);
}

/** 식사 저장: Storage 업로드 + DB insert */
export async function saveMeal(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get('photo') as File;
  const date = formData.get('date') as string;
  const mealTime = MealTimeSchema.parse(formData.get('meal_time'));
  const foods = FoodsResponseSchema.shape.foods.parse(
    JSON.parse(formData.get('foods') as string)
  );
  const totalCal = parseInt(formData.get('total_cal') as string, 10);

  const fileName = `${date}_${mealTime}_${Date.now()}.webp`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('meal-photos')
    .upload(fileName, file, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('meal-photos')
    .getPublicUrl(uploadData.path);

  const { error: dbError } = await supabase.from('meals').insert({
    date,
    meal_time: mealTime,
    photo_url: urlData.publicUrl,
    foods,
    total_cal: totalCal,
  });

  if (dbError) {
    throw new Error(`DB 저장 실패: ${dbError.message}`);
  }

  revalidatePath('/');
}

/** 식사 수정: foods와 total_cal 업데이트 */
export async function updateMeal(
  id: string,
  data: {
    foods: { name: string; calories: number }[];
    total_cal: number;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meals')
    .update(data)
    .eq('id', id);

  if (error) {
    throw new Error(`DB 수정 실패: ${error.message}`);
  }

  revalidatePath('/');
}

/** 식사 삭제: Storage 파일 + DB 행 삭제 */
export async function deleteMeal(id: string, photoUrl: string) {
  const supabase = await createClient();

  // photoUrl에서 버킷 경로 추출
  try {
    const url = new URL(photoUrl);
    const pathAfterBucket = url.pathname.split('/meal-photos/')[1];
    if (pathAfterBucket) {
      await supabase.storage.from('meal-photos').remove([pathAfterBucket]);
    }
  } catch {
    // Storage 삭제 실패해도 DB 삭제는 진행
  }

  const { error } = await supabase.from('meals').delete().eq('id', id);

  if (error) {
    throw new Error(`DB 삭제 실패: ${error.message}`);
  }

  revalidatePath('/');
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: add Server Actions for meal CRUD and Gemini analysis"
```

---

## Task 10: CalorieSummary + WeeklyChart 컴포넌트

**Files:**
- Create: `src/components/CalorieSummary.tsx`
- Create: `src/components/WeeklyChart.tsx`

- [ ] **Step 1: CalorieSummary 작성**

`src/components/CalorieSummary.tsx`:
```typescript
interface CalorieSummaryProps {
  totalCal: number;
  targetCal?: number;
}

export function CalorieSummary({ totalCal, targetCal = 2000 }: CalorieSummaryProps) {
  const percentage = Math.min(Math.round((totalCal / targetCal) * 100), 100);

  return (
    <div className="px-4 pt-8 pb-6">
      <p className="text-xs font-medium text-[#707072] uppercase tracking-widest mb-2">
        오늘 섭취
      </p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-6xl font-bold text-[#111111] leading-none">
          {totalCal.toLocaleString()}
        </span>
        <span className="text-xl font-medium text-[#707072]">kcal</span>
      </div>
      <div className="h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#111111] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-[#707072] mt-1">
        목표 {targetCal.toLocaleString()} kcal · {percentage}%
      </p>
    </div>
  );
}
```

- [ ] **Step 2: WeeklyChart 작성**

`src/components/WeeklyChart.tsx`:
```typescript
'use client';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export type WeeklyDataPoint = {
  date: string;     // 'YYYY-MM-DD'
  total: number;    // 해당 날 총 칼로리
  isToday: boolean;
};

export function WeeklyChart({ data }: { data: WeeklyDataPoint[] }) {
  const maxCal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="px-4 pb-8">
      <p className="text-xs font-medium text-[#707072] uppercase tracking-widest mb-4">
        주간 기록
      </p>
      <div className="flex items-end gap-1" style={{ height: '112px' }}>
        {data.map(({ date, total, isToday }) => {
          const heightPct = Math.round((total / maxCal) * 100);
          const dayLabel = DAY_LABELS[new Date(date + 'T12:00:00').getDay()];

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-[#707072] h-4 flex items-end">
                {total > 0 ? total.toLocaleString() : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    isToday ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
                  }`}
                  style={{
                    height: total > 0 ? `${heightPct}%` : '2px',
                  }}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isToday ? 'font-bold text-[#111111]' : 'text-[#707072]'
                }`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/CalorieSummary.tsx src/components/WeeklyChart.tsx
git commit -m "feat: add CalorieSummary and WeeklyChart components"
```

---

## Task 11: MealCard + MealList + HomeClient 컴포넌트

**Files:**
- Create: `src/components/MealCard.tsx`
- Create: `src/components/MealList.tsx`
- Create: `src/components/HomeClient.tsx`

- [ ] **Step 1: MealCard 작성 (EditMealModal은 Task 13 이후 연결)**

`src/components/MealCard.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Meal, MealTimeLabels } from '@/types/meal';

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  const [showEdit, setShowEdit] = useState(false);

  // EditMealModal은 동적 import로 순환 참조 없이 로드
  const EditMealModal = showEdit
    ? require('./EditMealModal').EditMealModal as React.ComponentType<{
        meal: Meal;
        onClose: () => void;
      }>
    : null;

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="w-full flex gap-3 items-center py-3 px-4 text-left hover:bg-[#F5F5F5] transition-colors"
      >
        {meal.photo_url ? (
          <img
            src={meal.photo_url}
            alt="식사 사진"
            className="w-14 h-14 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 bg-[#F5F5F5] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#111111] truncate">
            {meal.foods.map((f) => f.name).join(', ')}
          </p>
          <p className="text-xs text-[#707072] mt-0.5">
            {MealTimeLabels[meal.meal_time]} · {meal.total_cal.toLocaleString()} kcal
          </p>
        </div>
        <span className="text-[#707072] text-lg">›</span>
      </button>

      {showEdit && EditMealModal && (
        <EditMealModal meal={meal} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
```

**주의:** `require('./EditMealModal')`은 순환 참조 방지를 위한 임시 방식이다. Task 13에서 EditMealModal을 완성한 뒤, MealCard를 다음과 같이 교체한다:
```typescript
import { EditMealModal } from './EditMealModal';
```

- [ ] **Step 2: MealList 작성**

`src/components/MealList.tsx`:
```typescript
import { Meal, MealTime, MealTimeLabels } from '@/types/meal';
import { MealCard } from './MealCard';

const MEAL_ORDER: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealList({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-[#707072]">오늘 기록된 식사가 없습니다.</p>
        <p className="text-xs text-[#9E9EA0] mt-1">우측 하단 + 버튼으로 추가하세요.</p>
      </div>
    );
  }

  const grouped = MEAL_ORDER.reduce<Record<MealTime, Meal[]>>(
    (acc, mt) => ({ ...acc, [mt]: meals.filter((m) => m.meal_time === mt) }),
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  );

  return (
    <div className="pb-28">
      {MEAL_ORDER.map((mt) =>
        (grouped[mt]?.length ?? 0) > 0 ? (
          <div key={mt}>
            <div className="px-4 py-2 border-t border-[#E5E5E5] bg-[#FAFAFA]">
              <span className="text-xs font-medium text-[#707072] uppercase tracking-wider">
                {MealTimeLabels[mt]}
              </span>
            </div>
            {(grouped[mt] ?? []).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
```

- [ ] **Step 3: HomeClient (FAB) 작성**

`src/components/HomeClient.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { AddMealModal } from './AddMealModal';

export function HomeClient() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowAdd(true)}
        aria-label="식사 추가"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#111111] text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-[#707072] transition-colors z-40 leading-none"
      >
        +
      </button>

      {showAdd && <AddMealModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
```

- [ ] **Step 4: Commit (tsc는 Task 14에서 전체 일괄 확인)**

**주의:** `AddMealModal`은 Task 12, `EditMealModal`은 Task 13에서 생성되므로 이 시점에서 `tsc --noEmit`은 실패한다. TypeScript 최종 확인은 Task 14에서 수행한다.

```bash
git add src/components/MealCard.tsx src/components/MealList.tsx src/components/HomeClient.tsx
git commit -m "feat: add MealCard, MealList, and HomeClient (FAB) components"
```

---

## Task 12: AddMealModal 컴포넌트 (3단계 식사 추가)

**Files:**
- Create: `src/components/AddMealModal.tsx`

- [ ] **Step 1: AddMealModal 작성**

`src/components/AddMealModal.tsx`:
```typescript
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeMeal, saveMeal } from '@/app/actions';
import { convertToWebP, blobToBase64 } from '@/utils/imageUtils';
import { FoodItem, MealTime, MealTimeLabels } from '@/types/meal';

type Step = 1 | 2 | 3;

const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

interface AddMealModalProps {
  onClose: () => void;
}

export function AddMealModal({ onClose }: AddMealModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState(getTodayStr());
  const [mealTime, setMealTime] = useState<MealTime>('breakfast');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const blob = await convertToWebP(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setWebpBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError('이미지 변환에 실패했습니다.');
    }
  }

  async function handleAnalyze() {
    if (!webpBlob) return;
    setAnalyzing(true);
    setError(null);
    try {
      const base64 = await blobToBase64(webpBlob);
      const result = await analyzeMeal(base64);
      setFoods(result.foods);
    } catch {
      setError('AI 분석에 실패했습니다. 수동으로 입력해주세요.');
      setFoods([{ name: '', calories: 0 }]);
    } finally {
      setAnalyzing(false);
      setStep(3);
    }
  }

  function updateFood(index: number, field: keyof FoodItem, value: string) {
    setFoods((prev) =>
      prev.map((f, i) =>
        i === index
          ? { ...f, [field]: field === 'calories' ? parseInt(value || '0', 10) : value }
          : f
      )
    );
  }

  function addFood() {
    setFoods((prev) => [...prev, { name: '', calories: 0 }]);
  }

  function removeFood(index: number) {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!webpBlob || foods.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const totalCal = foods.reduce((sum, f) => sum + f.calories, 0);
      const formData = new FormData();
      formData.append(
        'photo',
        new File([webpBlob], `${date}_${mealTime}_${Date.now()}.webp`, {
          type: 'image/webp',
        })
      );
      formData.append('date', date);
      formData.append('meal_time', mealTime);
      formData.append('foods', JSON.stringify(foods));
      formData.append('total_cal', String(totalCal));
      await saveMeal(formData);
      onClose();
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  const totalCal = foods.reduce((sum, f) => sum + f.calories, 0);
  const stepTitles: Record<Step, string> = {
    1: '식사 정보',
    2: '사진 추가',
    3: 'AI 분석 결과',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-[#111111]">{stepTitles[step]}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[#707072] hover:text-[#111111]"
            >
              ✕
            </button>
          </div>

          {/* Step 1: 날짜 + 식사 시간 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-2">날짜</label>
                <input
                  type="date"
                  value={date}
                  max={getTodayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-[#CACACB] rounded-lg px-4 py-3 text-[#111111] bg-[#F5F5F5] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-2">식사 시간</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TIMES.map((mt) => (
                    <button
                      key={mt}
                      onClick={() => setMealTime(mt)}
                      className={`py-3 rounded-full text-sm font-medium border transition-colors ${
                        mealTime === mt
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#CACACB] hover:border-[#707072]'
                      }`}
                    >
                      {MealTimeLabels[mt]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#111111] text-white py-4 rounded-full font-medium hover:bg-[#707072] transition-colors"
              >
                다음
              </button>
            </div>
          )}

          {/* Step 2: 사진 선택 */}
          {step === 2 && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="식사 미리보기"
                    className="w-full aspect-square object-cover"
                  />
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setWebpBlob(null);
                    }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-sm text-[#111111]"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square bg-[#F5F5F5] flex flex-col items-center justify-center gap-3 text-[#707072] border border-dashed border-[#CACACB] hover:border-[#707072] transition-colors"
                >
                  <span className="text-5xl">📷</span>
                  <span className="text-sm font-medium">사진 선택 또는 촬영</span>
                </button>
              )}
              {error && <p className="text-sm text-[#D30005]">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-[#CACACB] text-[#111111] py-4 rounded-full font-medium hover:border-[#707072] transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!webpBlob || analyzing}
                  className="flex-1 bg-[#111111] text-white py-4 rounded-full font-medium hover:bg-[#707072] transition-colors disabled:bg-[#E5E5E5] disabled:text-[#9E9EA0] disabled:cursor-not-allowed"
                >
                  {analyzing ? '분석 중...' : 'AI 분석'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI 결과 확인 및 편집 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {foods.map((food, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={food.name}
                      placeholder="음식명"
                      onChange={(e) => updateFood(index, 'name', e.target.value)}
                      className="flex-1 border border-[#CACACB] rounded-lg px-3 py-2 text-sm text-[#111111] bg-[#F5F5F5] focus:outline-none focus:border-[#111111] transition-colors"
                    />
                    <input
                      type="number"
                      value={food.calories === 0 ? '' : food.calories}
                      placeholder="kcal"
                      min="0"
                      onChange={(e) => updateFood(index, 'calories', e.target.value)}
                      className="w-20 border border-[#CACACB] rounded-lg px-3 py-2 text-sm text-[#111111] bg-[#F5F5F5] focus:outline-none focus:border-[#111111] transition-colors"
                    />
                    <button
                      onClick={() => removeFood(index)}
                      className="w-8 h-8 flex items-center justify-center text-[#707072] hover:text-[#D30005] transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addFood}
                className="w-full border border-dashed border-[#CACACB] text-[#707072] py-2 rounded-lg text-sm hover:border-[#707072] transition-colors"
              >
                + 음식 추가
              </button>

              <div className="flex justify-between items-center py-3 border-t border-[#E5E5E5]">
                <span className="text-sm font-medium text-[#707072]">총 칼로리</span>
                <span className="text-2xl font-bold text-[#111111]">
                  {totalCal.toLocaleString()} kcal
                </span>
              </div>

              {error && <p className="text-sm text-[#D30005]">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-[#CACACB] text-[#111111] py-4 rounded-full font-medium hover:border-[#707072] transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || foods.length === 0 || foods.some((f) => !f.name.trim())}
                  className="flex-1 bg-[#111111] text-white py-4 rounded-full font-medium hover:bg-[#707072] transition-colors disabled:bg-[#E5E5E5] disabled:text-[#9E9EA0] disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add src/components/AddMealModal.tsx
git commit -m "feat: add AddMealModal with 3-step flow and Gemini integration"
```

---

## Task 13: EditMealModal 컴포넌트 + MealCard import 수정

**Files:**
- Create: `src/components/EditMealModal.tsx`
- Modify: `src/components/MealCard.tsx`

- [ ] **Step 1: EditMealModal 작성**

`src/components/EditMealModal.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { updateMeal, deleteMeal } from '@/app/actions';
import { FoodItem, Meal } from '@/types/meal';

interface EditMealModalProps {
  meal: Meal;
  onClose: () => void;
}

export function EditMealModal({ meal, onClose }: EditMealModalProps) {
  const [foods, setFoods] = useState<FoodItem[]>(meal.foods);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function updateFood(index: number, field: keyof FoodItem, value: string) {
    setFoods((prev) =>
      prev.map((f, i) =>
        i === index
          ? { ...f, [field]: field === 'calories' ? parseInt(value || '0', 10) : value }
          : f
      )
    );
  }

  function addFood() {
    setFoods((prev) => [...prev, { name: '', calories: 0 }]);
  }

  function removeFood(index: number) {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const totalCal = foods.reduce((sum, f) => sum + f.calories, 0);
      await updateMeal(meal.id, { foods, total_cal: totalCal });
      onClose();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteMeal(meal.id, meal.photo_url);
      onClose();
    } catch {
      setError('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  const totalCal = foods.reduce((sum, f) => sum + f.calories, 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-[#111111]">식사 수정</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[#707072] hover:text-[#111111]"
            >
              ✕
            </button>
          </div>

          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt="식사 사진"
              className="w-full aspect-video object-cover mb-4"
            />
          )}

          <div className="space-y-2 mb-4">
            {foods.map((food, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={food.name}
                  placeholder="음식명"
                  onChange={(e) => updateFood(index, 'name', e.target.value)}
                  className="flex-1 border border-[#CACACB] rounded-lg px-3 py-2 text-sm text-[#111111] bg-[#F5F5F5] focus:outline-none focus:border-[#111111] transition-colors"
                />
                <input
                  type="number"
                  value={food.calories === 0 ? '' : food.calories}
                  placeholder="kcal"
                  min="0"
                  onChange={(e) => updateFood(index, 'calories', e.target.value)}
                  className="w-20 border border-[#CACACB] rounded-lg px-3 py-2 text-sm text-[#111111] bg-[#F5F5F5] focus:outline-none focus:border-[#111111] transition-colors"
                />
                <button
                  onClick={() => removeFood(index)}
                  className="w-8 h-8 flex items-center justify-center text-[#707072] hover:text-[#D30005] transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addFood}
            className="w-full border border-dashed border-[#CACACB] text-[#707072] py-2 rounded-lg text-sm mb-4 hover:border-[#707072] transition-colors"
          >
            + 음식 추가
          </button>

          <div className="flex justify-between items-center py-3 border-t border-[#E5E5E5] mb-4">
            <span className="text-sm font-medium text-[#707072]">총 칼로리</span>
            <span className="text-2xl font-bold text-[#111111]">
              {totalCal.toLocaleString()} kcal
            </span>
          </div>

          {error && <p className="text-sm text-[#D30005] mb-4">{error}</p>}

          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-[#707072]">정말 삭제하시겠습니까?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-[#CACACB] text-[#111111] py-4 rounded-full font-medium hover:border-[#707072] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-[#D30005] text-white py-4 rounded-full font-medium disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제 확인'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 border border-[#CACACB] text-[#D30005] py-4 rounded-full font-medium hover:border-[#D30005] transition-colors"
              >
                삭제
              </button>
              <button
                onClick={handleSave}
                disabled={saving || foods.some((f) => !f.name.trim())}
                className="flex-1 bg-[#111111] text-white py-4 rounded-full font-medium hover:bg-[#707072] transition-colors disabled:bg-[#E5E5E5] disabled:text-[#9E9EA0] disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: MealCard에서 require 대신 정식 import로 교체**

`src/components/MealCard.tsx` 전체를 다음으로 교체:
```typescript
'use client';

import { useState } from 'react';
import { Meal, MealTimeLabels } from '@/types/meal';
import { EditMealModal } from './EditMealModal';

export function MealCard({ meal }: { meal: Meal }) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="w-full flex gap-3 items-center py-3 px-4 text-left hover:bg-[#F5F5F5] transition-colors"
      >
        {meal.photo_url ? (
          <img
            src={meal.photo_url}
            alt="식사 사진"
            className="w-14 h-14 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 bg-[#F5F5F5] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#111111] truncate">
            {meal.foods.map((f) => f.name).join(', ')}
          </p>
          <p className="text-xs text-[#707072] mt-0.5">
            {MealTimeLabels[meal.meal_time]} · {meal.total_cal.toLocaleString()} kcal
          </p>
        </div>
        <span className="text-[#707072] text-lg">›</span>
      </button>

      {showEdit && <EditMealModal meal={meal} onClose={() => setShowEdit(false)} />}
    </>
  );
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/EditMealModal.tsx src/components/MealCard.tsx
git commit -m "feat: add EditMealModal and fix MealCard import"
```

---

## Task 14: 홈 페이지 조립

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx 작성**

`src/app/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { CalorieSummary } from '@/components/CalorieSummary';
import { WeeklyChart, WeeklyDataPoint } from '@/components/WeeklyChart';
import { MealList } from '@/components/MealList';
import { HomeClient } from '@/components/HomeClient';
import { Meal } from '@/types/meal';

export default async function HomePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 오늘 식사 목록
  const { data: todayMealsRaw } = await supabase
    .from('meals')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: true });

  const todayMeals: Meal[] = (todayMealsRaw ?? []) as Meal[];
  const todayTotal = todayMeals.reduce((sum, m) => sum + m.total_cal, 0);

  // 주간 데이터 (오늘 포함 7일)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: weeklyRaw } = await supabase
    .from('meals')
    .select('date, total_cal')
    .gte('date', sevenDaysAgoStr)
    .lte('date', today);

  const weeklyData: WeeklyDataPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const total = (weeklyRaw ?? [])
      .filter((m) => m.date === dateStr)
      .reduce((sum, m) => sum + (m.total_cal as number), 0);
    return { date: dateStr, total, isToday: dateStr === today };
  });

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative">
      <CalorieSummary totalCal={todayTotal} />
      <WeeklyChart data={weeklyData} />
      <div className="border-t border-[#E5E5E5]" />
      <MealList meals={todayMeals} />
      <HomeClient />
    </main>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 4: 개발 서버 실행 및 수동 테스트**

```bash
npm run dev --host
```

브라우저에서 `http://localhost:3000` 접속 후 확인:
- [ ] 홈 화면 로드됨 (칼로리 요약, 주간 차트, 빈 식사 목록)
- [ ] + FAB 버튼 클릭 → Step 1 모달 열림
- [ ] 날짜/시간대 선택 → Step 2
- [ ] 사진 선택 → WebP 미리보기 표시
- [ ] AI 분석 → 음식 목록 표시 (Gemini 호출)
- [ ] 음식명/칼로리 수정 가능
- [ ] 저장 → 홈 화면에 카드 표시 + 칼로리 합산 갱신
- [ ] 카드 클릭 → EditModal → 수정/삭제 동작

- [ ] **Step 5: 린트 확인**

```bash
npm run lint
```
Expected: 오류 없음

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble home page with Server Component data fetching"
```

---

## Task 15: Vercel 배포

**Files:** (Vercel 설정)

- [ ] **Step 1: Vercel 프로젝트 생성 및 GitHub 연동**

Vercel MCP `deploy_to_vercel` 또는 CLI 사용:
```bash
npx vercel --yes
```
프롬프트:
- Framework: Next.js
- Root directory: `.`
- GitHub 연동 선택

- [ ] **Step 2: Vercel 환경변수 설정**

Vercel MCP 도구 또는 대시보드에서 다음 환경변수 추가 (Production + Preview):
```
NEXT_PUBLIC_SUPABASE_URL=<값>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<값>
GEMINI_API_KEY=<값>
```

- [ ] **Step 3: Production 배포**

```bash
git push origin main
```
Expected: Vercel이 자동으로 빌드 및 배포 시작

- [ ] **Step 4: 배포 URL 확인**

Vercel MCP `list_deployments` 또는:
```bash
npx vercel ls
```
Expected: `https://dite-*.vercel.app` 형태의 URL

- [ ] **Step 5: 배포된 앱 수동 테스트**

Vercel URL에서 전체 흐름 확인:
- [ ] 페이지 로드
- [ ] 식사 추가 (사진 + AI 분석 + 저장)
- [ ] 칼로리 요약 갱신
- [ ] 주간 차트 갱신
- [ ] 수정/삭제

- [ ] **Step 6: Commit & Push**

```bash
git add .
git commit -m "chore: finalize deployment setup"
git push origin main
```

---

## Acceptance Criteria 체크리스트

- [ ] 사진 첨부 시 Gemini가 음식명 + 칼로리를 자동 분석한다
- [ ] 분석 결과를 저장 전에 수정(음식명, 칼로리, 항목 추가/삭제)할 수 있다
- [ ] 홈 화면에서 오늘 총 칼로리를 확인할 수 있다
- [ ] 홈 화면에서 최근 7일 칼로리 바 차트를 확인할 수 있다
- [ ] 저장된 식사를 수정 및 삭제할 수 있다
- [ ] 사진은 WebP + 최대 800px로 Storage에 저장된다
- [ ] 모바일 퍼스트 레이아웃으로 동작한다 (max-w-md 기준)
- [ ] `npm run build` + `tsc --noEmit` + `npm run lint` 모두 오류 없이 통과한다
