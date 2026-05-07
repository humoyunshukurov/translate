'use client';

import { useEffect, useRef, useState } from 'react';
import { useExerciseStore, selectCurrentExercise } from '../../../store/exerciseStore';
import { ExerciseCard } from '../../../components/FillBlank/ExerciseCard';
import { ProgressBar } from '../../../components/Progress/ProgressBar';
import type { Exercise, Topic } from '../../../types';

interface Props { topic: Topic; exercises: Exercise[]; }

export function ExerciseSession({ topic, exercises }: Props) {
  const initSession  = useExerciseStore((s) => s.initSession);
  const nextExercise = useExerciseStore((s) => s.nextExercise);
  const currentIndex = useExerciseStore((s) => s.currentIndex);
  const current      = useExerciseStore(selectCurrentExercise);
  const blanks       = useExerciseStore((s) => s.blanks);
  const [ready, setReady] = useState(false);

  const topicId   = topic.id;
  const initRef   = useRef(initSession);
  initRef.current = initSession;

  useEffect(() => {
    initRef.current(topic, exercises);
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  if (ready && exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
          <p className="text-sm text-gray-500">{topic.level} · {topic.description}</p>
        </header>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-2">
          <p className="text-4xl">📝</p>
          <p className="text-gray-700 font-medium">No exercises yet for this topic.</p>
          <p className="text-sm text-gray-400">Check back soon!</p>
        </div>
      </div>
    );
  }

  if (!ready || !current) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-2 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const allCorrect = current.blanks.length > 0 &&
    current.blanks.every((_, i) => blanks[`${current.id}-${i}`]?.status === 'correct');
  const isLast = currentIndex === exercises.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-sm text-gray-500">{topic.level} · {topic.description}</p>
      </header>

      <ProgressBar />
      <ExerciseCard exercise={current} />

      {allCorrect && (
        <div className="text-center space-y-3 py-2">
          <p className="text-green-600 font-semibold text-lg">Great job!</p>
          {!isLast ? (
            <button
              onClick={nextExercise}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Next Exercise →
            </button>
          ) : (
            <p className="text-gray-700 font-medium">You completed all exercises!</p>
          )}
        </div>
      )}
    </div>
  );
}
