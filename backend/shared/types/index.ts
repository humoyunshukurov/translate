// ── Shared types used by both frontend & backend ──────────────────────────

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: CEFRLevel;
  orderIndex: number;
  exerciseCount?: number;
}

export interface Blank {
  index: number;      // 0-based position of blank in sentence
  placeholder: string; // e.g. "___" in the raw sentence
}

export interface Exercise {
  id: string;
  topicId: string;
  sentence: string;   // "She ___ to school every day."
  blanks: Blank[];
  hint?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  orderIndex: number;
}

export interface ExerciseWithAnswers extends Exercise {
  explanation?: string;
  answers: { blankIndex: number; value: string; isPrimary: boolean }[];
}

// ── Validation ──────────────────────────────────────────────────────────────

export interface ValidationRequest {
  exerciseId: string;
  blankIndex: number;
  submitted: string;
  timeSpentMs?: number;
}

export type ValidationStatus = 'correct' | 'close' | 'incorrect';

export interface ValidationResponse {
  status: ValidationStatus;
  matchScore: number;        // 0.0 – 1.0
  correctAnswer?: string;    // revealed only when status !== 'correct'
  explanation?: string;      // shown after final attempt
  feedback: string;          // human-readable message
}

// ── Progress ────────────────────────────────────────────────────────────────

export interface TopicProgress {
  topicId: string;
  exercisesSeen: number;
  correctCount: number;
  streak: number;
  completedAt: string | null;
}

export interface UserStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;           // 0–100
  currentStreak: number;
  topicsCompleted: number;
}

// ── API response wrapper ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
