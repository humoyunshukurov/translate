'use client';

import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useExerciseStore, selectBlankByKey } from '../../store/exerciseStore';
import { useValidate } from '../../hooks/useValidate';

interface Props {
  exerciseId: string;
  blankIndex: number;
}

const STATUS_CLASS: Record<string, string> = {
  idle:      'border-gray-300 focus:border-blue-500 bg-white',
  checking:  'border-yellow-400 bg-yellow-50',
  correct:   'border-green-500 bg-green-50 text-green-800',
  close:     'border-orange-400 bg-orange-50 text-orange-800',
  incorrect: 'border-red-500 bg-red-50 text-red-800',
};

export function BlankInput({ exerciseId, blankIndex }: Props) {
  const key           = `${exerciseId}-${blankIndex}`;
  const blank         = useExerciseStore(selectBlankByKey(key));
  const setBlankValue = useExerciseStore((s) => s.setBlankValue);
  const { validate }  = useValidate(exerciseId, blankIndex);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !blank.value.trim() || loading || blank.status === 'correct') return;
    setLoading(true);
    try {
      await validate(blank.value);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-0.5 mx-1 align-baseline">
      <input
        ref={inputRef}
        type="text"
        value={blank.value}
        onChange={(e) => setBlankValue(exerciseId, blankIndex, e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={blank.status === 'correct' || loading}
        placeholder="..."
        aria-label={`Blank ${blankIndex + 1}`}
        className={[
          'px-2 py-0.5 rounded border-2 text-sm font-medium w-28 text-center outline-none transition-colors',
          STATUS_CLASS[blank.status] ?? STATUS_CLASS.idle,
        ].join(' ')}
      />
      {blank.feedback && (
        <span className="text-xs text-center leading-tight max-w-[7rem]" role="status">
          {blank.feedback}
        </span>
      )}
      {blank.correctAnswer && (
        <span className="text-xs text-green-700 font-semibold">
          {`→ ${blank.correctAnswer}`}
        </span>
      )}
    </span>
  );
}
