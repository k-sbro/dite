'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeMeal, saveMeal } from '@/app/actions';
import { convertToWebP, blobToBase64 } from '@/utils/imageUtils';
import { FoodItem, MealTime, MealTimeLabels } from '@/types/meal';

type Step = 1 | 2 | 3;

const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0] ?? '';
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
