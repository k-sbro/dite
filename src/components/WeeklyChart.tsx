'use client';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export type WeeklyDataPoint = {
  date: string;     // 'YYYY-MM-DD'
  total: number;    // 해당 날 총 칼로리
  isToday: boolean;
};

export function WeeklyChart({ data }: { data: WeeklyDataPoint[] }) {
  const maxCal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="px-4 pb-8">
      <p className="text-xs font-medium text-[#707072] uppercase tracking-widest mb-4">
        주간 기록
      </p>
      <div className="flex items-end gap-1" style={{ height: '112px' }}>
        {data.map(({ date, total, isToday }) => {
          const heightPct = Math.round((total / maxCal) * 100);
          const dayLabel = DAY_LABELS[new Date(date + 'T12:00:00').getDay()] ?? '';

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-[#707072] h-4 flex items-end">
                {total > 0 ? total.toLocaleString() : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    isToday ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
                  }`}
                  style={{
                    height: total > 0 ? `${heightPct}%` : '2px',
                  }}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isToday ? 'font-bold text-[#111111]' : 'text-[#707072]'
                }`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
