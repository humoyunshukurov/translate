'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import type { Exercise, Topic, ValidationResponse, TopicProgress } from '../types';

export type BlankState = {
  value: string;
  status: 'idle' | 'checking' | 'correct' | 'close' | 'incorrect';
  feedback: string | null;
  correctAnswer: string | null;
  attempts: number;
};

type SessionState = {
  topic: Topic | null;
  exercises: Exercise[];
  currentIndex: number;
  blanks: Record<string, BlankState>;
  startedAt: number | null;
  progress: TopicProgress | null;
};

type SessionActions = {
  initSession:     (topic: Topic, exercises: Exercise[]) => void;
  setBlankValue:   (exerciseId: string, blankIndex: number, value: string) => void;
  applyValidation: (exerciseId: string, blankIndex: number, res: ValidationResponse) => void;
  nextExercise:    () => void;
  resetSession:    () => void;
  setProgress:     (p: TopicProgress) => void;
};

function makeBlankKey(exerciseId: string, blankIndex: number) {
  return `${exerciseId}-${blankIndex}`;
}

const defaultBlank = (): BlankState => ({
  value: '', status: 'idle', feedback: null, correctAnswer: null, attempts: 0,
});

type Store = SessionState & SessionActions;

export const useExerciseStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        topic: null, exercises: [], currentIndex: 0, blanks: {}, startedAt: null, progress: null,

        initSession(topic, exercises) {
          set((s) => { s.topic = topic; s.exercises = exercises; s.currentIndex = 0; s.startedAt = Date.now(); s.blanks = {}; });
        },

        setBlankValue(exerciseId, blankIndex, value) {
          const key = makeBlankKey(exerciseId, blankIndex);
          set((s) => {
            if (!s.blanks[key]) s.blanks[key] = defaultBlank();
            s.blanks[key].value = value;
            s.blanks[key].status = 'idle';
            s.blanks[key].feedback = null;
          });
        },

        applyValidation(exerciseId, blankIndex, res) {
          const key = makeBlankKey(exerciseId, blankIndex);
          set((s) => {
            const blank = s.blanks[key] ?? defaultBlank();
            blank.status = res.status;
            blank.feedback = res.feedback;
            blank.correctAnswer = res.correctAnswer ?? null;
            blank.attempts += 1;
            s.blanks[key] = blank;
          });
        },

        nextExercise() {
          set((s) => { if (s.currentIndex < s.exercises.length - 1) s.currentIndex += 1; });
        },

        resetSession() {
          set((s) => { s.topic = null; s.exercises = []; s.currentIndex = 0; s.blanks = {}; s.startedAt = null; });
        },

        setProgress(p) { set((s) => { s.progress = p; }); },
      })),
      {
        name: 'fillblank-session',
        partialize: (s) => ({ topic: s.topic, exercises: s.exercises, currentIndex: s.currentIndex, blanks: s.blanks, startedAt: s.startedAt }),
      }
    ),
    { name: 'ExerciseStore' }
  )
);

// Object selectors — use useShallow() at the call site to prevent infinite loops

// Use separate primitive selectors to avoid infinite loop (new object = always "changed")
export const selectCorrectCount = (s: Store) =>
  Object.values(s.blanks).filter((b) => b.status === 'correct').length;

export const selectTotalBlanks = (s: Store) => Object.values(s.blanks).length;
