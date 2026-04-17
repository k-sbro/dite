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
