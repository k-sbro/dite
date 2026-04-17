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
