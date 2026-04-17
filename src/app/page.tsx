import { createClient } from '@/lib/supabase/server';
import { CalorieSummary } from '@/components/CalorieSummary';
import { WeeklyChart, WeeklyDataPoint } from '@/components/WeeklyChart';
import { MealList } from '@/components/MealList';
import { HomeClient } from '@/components/HomeClient';
import { Meal } from '@/types/meal';

export default async function HomePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0] ?? '';

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
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] ?? '';

  const { data: weeklyRaw } = await supabase
    .from('meals')
    .select('date, total_cal')
    .gte('date', sevenDaysAgoStr)
    .lte('date', today);

  const weeklyData: WeeklyDataPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0] ?? '';
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
