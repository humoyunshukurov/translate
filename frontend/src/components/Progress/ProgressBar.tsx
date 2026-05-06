'use client';

import { useExerciseStore } from '../../store/exerciseStore';

export function ProgressBar() {
  const correct      = useExerciseStore((s) => Object.values(s.blanks).filter((b) => b.status === 'correct').length);
  const total        = useExerciseStore((s) => Object.values(s.blanks).length);
  const currentIndex = useExerciseStore((s) => s.currentIndex);
  const exerciseLen  = useExerciseStore((s) => s.exercises.length);

  const pct = exerciseLen ? Math.round((currentIndex / exerciseLen) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{currentIndex}/{exerciseLen} exercises</span>
        <span>{correct} correct</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
        />
      </div>
    </div>
  );
}
