import { query } from '../models/db.js';

export async function logAttempt(params: {
  userId: string;
  exerciseId: string;
  blankIndex: number;
  submitted: string;
  isCorrect: boolean;
  matchScore: number;
  timeSpentMs?: number;
}): Promise<void> {
  await query(
    `INSERT INTO attempts
       (user_id, exercise_id, blank_index, submitted, is_correct, match_score, time_spent_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.userId, params.exerciseId, params.blankIndex,
      params.submitted, params.isCorrect, params.matchScore,
      params.timeSpentMs ?? null,
    ]
  );
}

export async function upsertProgress(params: {
  userId: string;
  topicId: string;
  exerciseId: string;
  isCorrect: boolean;
}): Promise<void> {
  await query(
    `INSERT INTO user_topic_progress (user_id, topic_id, last_exercise_id, exercises_seen, correct_count, streak)
     VALUES ($1, $2, $3, 1, $4, $4)
     ON CONFLICT (user_id, topic_id) DO UPDATE SET
       exercises_seen   = user_topic_progress.exercises_seen + 1,
       correct_count    = user_topic_progress.correct_count + $4,
       streak           = CASE WHEN $5 THEN user_topic_progress.streak + 1 ELSE 0 END,
       last_exercise_id = $3,
       updated_at       = NOW()`,
    [params.userId, params.topicId, params.exerciseId, params.isCorrect ? 1 : 0, params.isCorrect]
  );
}
