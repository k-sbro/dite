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
