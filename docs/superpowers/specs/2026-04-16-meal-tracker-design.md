# Meal Tracker — Design Spec
**Date:** 2026-04-16  
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel  
**Design System:** Nike-inspired (DESIGN.md)  
**LLM:** Gemini 3.1 Flash-Lite Preview (`gemini-3.1-flash-lite-preview`)

---

## 1. Overview

식사 사진을 찍으면 Gemini가 자동으로 음식과 칼로리를 분석해 기록하는 단일 사용자 식단 관리 웹 앱.

**핵심 흐름:**
1. 날짜(기본: 오늘) + 식사시간(아침/점심/저녁/간식) 선택
2. 식사 사진 첨부
3. Gemini가 음식명과 칼로리 산출
4. 유저가 결과 확인 및 수정 후 저장
5. 홈 화면에서 오늘 칼로리 요약 + 주간 차트 확인

---

## 2. Architecture

### Approach: 단순 CRUD + 모달 기반 단일 페이지

- 인증 없음 (단일 사용자)
- 모든 상태 변경은 Next.js Server Actions 처리
- `revalidatePath('/')` 로 UI 자동 갱신

### Page Structure

```
/   → 홈 (Server Component)
     ├─ CalorieSummary   오늘 총 칼로리
     ├─ WeeklyChart      주간 칼로리 바 차트 (7일)
     ├─ MealList         오늘 식사 카드 목록 (시간대별 그룹)
     ├─ AddMealModal     식사 추가 (Client Component, FAB 트리거)
     └─ EditMealModal    식사 수정/삭제 (Client Component, 카드 탭 트리거)
```

---

## 3. Data Model

### Supabase Table: `meals`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | 자동 생성 |
| `date` | date | 식사 날짜 |
| `meal_time` | text | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `photo_url` | text | Supabase Storage 경로 |
| `foods` | jsonb | `[{ name: string, calories: number }]` |
| `total_cal` | integer | foods 칼로리 합계 |
| `memo` | text nullable | 유저 메모 |
| `created_at` | timestamptz | 자동 생성 |

### Supabase Storage: `meal-photos` 버킷

- 업로드 전 클라이언트에서 Canvas API로 WebP 변환 + 최대 너비 800px 리사이즈
- 파일명: `{date}_{meal_time}_{timestamp}.webp`
- RLS: 단일 사용자 앱이므로 public read/write

---

## 4. Component Structure

```
src/
├── app/
│   ├── page.tsx                  # 홈 (Server Component)
│   └── actions.ts                # Server Actions
├── components/
│   ├── CalorieSummary.tsx        # 오늘 칼로리 요약 (숫자 강조)
│   ├── WeeklyChart.tsx           # 주간 바 차트 (Client - interactive)
│   ├── MealList.tsx              # 식사 목록 (시간대별 그룹)
│   ├── MealCard.tsx              # 식사 카드 (사진 + 음식명 + 칼로리)
│   ├── AddMealModal.tsx          # 식사 추가 3단계 모달 (Client)
│   └── EditMealModal.tsx         # 식사 수정/삭제 모달 (Client)
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # Server Component용 클라이언트
│   │   └── client.ts             # Client Component용 클라이언트
│   └── gemini.ts                 # Gemini API 호출 함수
├── types/
│   └── meal.ts                   # Meal 타입 + Zod 스키마
└── utils/
    └── imageUtils.ts             # WebP 변환, 800px 리사이즈 (Canvas API)
```

---

## 5. Key Flows

### 식사 추가 모달 (3단계)

```
Step 1: 날짜(date picker, 기본=오늘) + 시간대(4개 pill 버튼) 선택
   ↓
Step 2: 사진 선택 (카메라/갤러리)
        → Canvas API로 WebP 변환 + 800px 리사이즈
        → 미리보기 표시
   ↓
Step 3: [AI 분석] 버튼 → Server Action → Gemini 호출
        → 음식 목록 표시 (각 항목: 음식명 input + 칼로리 number input)
        → 항목 추가/삭제 가능
        → [저장] → Supabase Storage 업로드 + DB insert
```

### Server Actions

| Action | 역할 |
|--------|------|
| `analyzeMeal(imageBase64)` | Gemini 호출, 결과 반환 (저장 없음) |
| `saveMeal(data)` | Storage 업로드 + DB insert + revalidatePath('/') |
| `updateMeal(id, data)` | DB update + revalidatePath('/') |
| `deleteMeal(id)` | Storage 삭제 + DB delete + revalidatePath('/') |

### Gemini 프롬프트

```
이 식사 사진을 분석해서 보이는 음식들과 각각의 예상 칼로리를 JSON으로 반환해줘.
형식: { "foods": [{ "name": "음식명", "calories": 숫자 }] }
칼로리는 일반적인 1인분 기준으로 추정해줘.
```

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| Gemini 분석 실패 | 에러 토스트 + 수동 입력 fallback (빈 음식 항목 1개) |
| 이미지 변환 실패 | 에러 메시지, Step 2 유지 |
| Supabase 저장 실패 | 에러 메시지, 모달 유지 (데이터 손실 없음) |
| 이미지 800px 초과 | Canvas API가 자동 리사이즈 (에러 없음) |

---

## 7. Design System Application (DESIGN.md 기반)

- **색상**: Nike Black `#111111` 기본, White `#FFFFFF` 배경, Grey 계열 상태
- **버튼**: pill-shaped (30px radius), Primary=검정/Secondary=outlined
- **타이포**: 칼로리 숫자는 대형 bold 표시 (Nike display 스타일)
- **카드**: 그림자 없음, border radius 0px (이미지), 20px (컨테이너)
- **차트**: Tailwind로 순수 CSS 바 차트 (외부 차트 라이브러리 금지)
- **애니메이션**: Motion (Framer Motion) — 모달 진입/퇴장, 카드 탭 피드백

---

## 8. Infrastructure Plan

### Git
- GitHub 레포: `dite`
- 브랜치: `main` (직접 push)

### Supabase
- 프로젝트 자동 생성 (Claude가 수행)
- `meals` 테이블 마이그레이션
- `meal-photos` Storage 버킷 생성
- RLS: public access (단일 사용자)

### Vercel
- GitHub 레포 연동 자동 배포
- 환경변수 설정:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`

### .env.local (+ .env.example)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

---

## 9. Acceptance Criteria

- [ ] 사진 첨부 시 Gemini가 음식명 + 칼로리를 자동 분석한다
- [ ] 분석 결과를 저장 전에 수정할 수 있다
- [ ] 홈 화면에서 오늘 총 칼로리를 확인할 수 있다
- [ ] 홈 화면에서 최근 7일 칼로리 바 차트를 확인할 수 있다
- [ ] 저장된 식사를 수정 및 삭제할 수 있다
- [ ] 사진은 WebP + 최대 800px로 Storage에 저장된다
- [ ] 모바일 퍼스트 레이아웃으로 동작한다
