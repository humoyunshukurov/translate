'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, Topic, ValidationResponse, TopicProgress } from '../types';

export type BlankStatus = 'idle' | 'checking' | 'correct' | 'close' | 'incorrect';

export interface BlankState {
  value: string;
  status: BlankStatus;
  feedback: string | null;
  correctAnswer: string | null;
  attempts: number;
}

interface SessionState {
  topic: Topic | null;
  exercises: Exercise[];
  currentIndex: number;
  blanks: Record<string, BlankState>;
  startedAt: number | null;
  progress: TopicProgress | null;
}

interface SessionActions {
  initSession:     (topic: Topic, exercises: Exercise[]) => void;
  setBlankValue:   (exerciseId: string, blankIndex: number, value: string) => void;
  applyValidation: (exerciseId: string, blankIndex: number, res: ValidationResponse) => void;
  nextExercise:    () => void;
  resetSession:    () => void;
  setProgress:     (p: TopicProgress) => void;
}

type Store = SessionState & SessionActions;

const blankKey = (exerciseId: string, blankIndex: number) => `${exerciseId}-${blankIndex}`;

const emptyBlank = (): BlankState => ({
  value: '', status: 'idle', feedback: null, correctAnswer: null, attempts: 0,
});

const initialState: SessionState = {
  topic: null, exercises: [], currentIndex: 0,
  blanks: {}, startedAt: null, progress: null,
};

export const useExerciseStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      initSession: (topic, exercises) =>
        set({ topic, exercises, currentIndex: 0, blanks: {}, startedAt: Date.now() }),

      setBlankValue: (exerciseId, blankIndex, value) =>
        set((s) => {
          const key = blankKey(exerciseId, blankIndex);
          return {
            blanks: {
              ...s.blanks,
              [key]: { ...(s.blanks[key] ?? emptyBlank()), value, status: 'idle', feedback: null },
            },
          };
        }),

      applyValidation: (exerciseId, blankIndex, res) =>
        set((s) => {
          const key = blankKey(exerciseId, blankIndex);
          const prev = s.blanks[key] ?? emptyBlank();
          return {
            blanks: {
              ...s.blanks,
              [key]: {
                ...prev,
                status: res.status,
                feedback: res.feedback,
                correctAnswer: res.correctAnswer ?? null,
                attempts: prev.attempts + 1,
              },
            },
          };
        }),

      nextExercise: () =>
        set((s) => ({
          currentIndex: Math.min(s.currentIndex + 1, s.exercises.length - 1),
        })),

      resetSession: () => set(initialState),

      setProgress: (progress) => set({ progress }),
    }),
    {
      name: 'fillblank-session',
      partialize: (s) => ({
        topic: s.topic,
        exercises: s.exercises,
        currentIndex: s.currentIndex,
        blanks: s.blanks,
        startedAt: s.startedAt,
      }),
    }
  )
);

// ── Selectors (primitive — no infinite loop risk) ─────────────────────────────
export const selectCurrentExercise = (s: Store): Exercise | null =>
  s.exercises[s.currentIndex] ?? null;

export const selectCorrectCount = (s: Store): number =>
  Object.values(s.blanks).filter((b) => b.status === 'correct').length;

export const selectBlankByKey = (key: string) => (s: Store): BlankState =>
  s.blanks[key] ?? emptyBlank();
