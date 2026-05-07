'use client';

import { useExerciseStore, selectCorrectCount } from '../../store/exerciseStore';

export function ProgressBar() {
  const correct     = useExerciseStore(selectCorrectCount);
  const current     = useExerciseStore((s) => s.currentIndex);
  const total       = useExerciseStore((s) => s.exercises.length);
  const pct         = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{current}/{total} exercises</span>
        <span>{correct} correct</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
