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
