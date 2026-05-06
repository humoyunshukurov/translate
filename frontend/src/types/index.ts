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
  index: number;
  placeholder: string;
}

export interface Exercise {
  id: string;
  topicId: string;
  sentence: string;
  blanks: Blank[];
  hint?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  orderIndex: number;
}

export interface ExerciseWithAnswers extends Exercise {
  explanation?: string;
  answers: { blankIndex: number; value: string; isPrimary: boolean }[];
}

export interface ValidationRequest {
  exerciseId: string;
  blankIndex: number;
  submitted: string;
  timeSpentMs?: number;
}

export type ValidationStatus = 'correct' | 'close' | 'incorrect';

export interface ValidationResponse {
  status: ValidationStatus;
  matchScore: number;
  correctAnswer?: string;
  explanation?: string;
  feedback: string;
}

export interface TopicProgress {
  topicId: string;
  exercisesSeen: number;
  correctCount: number;
  streak: number;
  completedAt: string | null;
}

export interface ApiSuccess<T> { ok: true; data: T; }
export interface ApiError { ok: false; code: string; message: string; }
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
