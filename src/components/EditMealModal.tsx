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
