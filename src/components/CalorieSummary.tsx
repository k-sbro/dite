interface CalorieSummaryProps {
  totalCal: number;
  targetCal?: number;
}

export function CalorieSummary({ totalCal, targetCal = 2000 }: CalorieSummaryProps) {
  const percentage = Math.min(Math.round((totalCal / targetCal) * 100), 100);

  return (
    <div className="px-4 pt-8 pb-6">
      <p className="text-xs font-medium text-[#707072] uppercase tracking-widest mb-2">
        오늘 섭취
      </p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-6xl font-bold text-[#111111] leading-none">
          {totalCal.toLocaleString()}
        </span>
        <span className="text-xl font-medium text-[#707072]">kcal</span>
      </div>
      <div className="h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#111111] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-[#707072] mt-1">
        목표 {targetCal.toLocaleString()} kcal · {percentage}%
      </p>
    </div>
  );
}
