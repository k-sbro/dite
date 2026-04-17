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
