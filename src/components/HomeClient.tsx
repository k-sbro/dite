'use client';

import { useState } from 'react';
import { AddMealModal } from './AddMealModal';

export function HomeClient() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowAdd(true)}
        aria-label="식사 추가"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#111111] text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-[#707072] transition-colors z-40 leading-none"
      >
        +
      </button>

      {showAdd && <AddMealModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
