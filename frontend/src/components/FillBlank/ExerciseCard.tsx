'use client';

import type { ReactNode } from 'react';
import { BlankInput } from './BlankInput';
import type { Exercise } from '../../types';

interface Props { exercise: Exercise; }

function renderSentence(exercise: Exercise): ReactNode[] {
  const parts = exercise.sentence.split(/_{2,}/g);
  return parts.flatMap((part, i) => {
    const nodes: ReactNode[] = [<span key={`t${i}`}>{part}</span>];
    if (i < exercise.blanks.length) {
      nodes.push(<BlankInput key={`b${i}`} exerciseId={exercise.id} blankIndex={i} />);
    }
    return nodes;
  });
}

const LABELS = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
const COLORS  = [
  '', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700',
];

export function ExerciseCard({ exercise }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLORS[exercise.difficulty]}`}>
          {LABELS[exercise.difficulty]}
        </span>
        {exercise.hint && (
          <span className="text-xs text-gray-400 italic">Hint: {exercise.hint}</span>
        )}
      </div>
      <p className="text-lg leading-relaxed text-gray-800 font-serif">
        {renderSentence(exercise)}
      </p>
      <p className="text-xs text-gray-400">Press Enter to check</p>
    </div>
  );
}
