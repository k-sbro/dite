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
