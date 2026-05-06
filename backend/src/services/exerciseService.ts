import { query } from '../models/db.js';
import type { Exercise, ExerciseWithAnswers, Topic } from '../../../shared/types/index.js';

// ── Topics ───────────────────────────────────────────────────────────────────

export async function getAllTopics(): Promise<Topic[]> {
  const { rows } = await query<Topic>(`
    SELECT
      t.id, t.slug, t.title, t.description, t.level,
      t.order_index AS "orderIndex",
      COUNT(e.id)::INT AS "exerciseCount"
    FROM topics t
    LEFT JOIN exercises e ON e.topic_id = t.id AND e.is_active
    WHERE t.is_active
    GROUP BY t.id
    ORDER BY t.order_index
  `);
  return rows;
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const { rows } = await query<Topic>(
    `SELECT id, slug, title, description, level, order_index AS "orderIndex"
     FROM topics WHERE slug = $1 AND is_active`,
    [slug]
  );
  return rows[0] ?? null;
}

// ── Exercises ─────────────────────────────────────────────────────────────────

export async function getExercisesByTopic(
  topicId: string,
  limit = 20,
  offset = 0
): Promise<Exercise[]> {
  const { rows } = await query<Exercise>(`
    SELECT
      id, topic_id AS "topicId", sentence,
      blanks, hint, difficulty, order_index AS "orderIndex"
    FROM exercises
    WHERE topic_id = $1 AND is_active
    ORDER BY order_index
    LIMIT $2 OFFSET $3
  `, [topicId, limit, offset]);
  return rows;
}

export async function getExerciseById(id: string): Promise<ExerciseWithAnswers | null> {
  const [exRow, ansRows] = await Promise.all([
    query<ExerciseWithAnswers>(`
      SELECT id, topic_id AS "topicId", sentence, blanks,
             hint, explanation, difficulty, order_index AS "orderIndex"
      FROM exercises WHERE id = $1 AND is_active
    `, [id]),
    query<{ blankIndex: number; value: string; isPrimary: boolean }>(`
      SELECT blank_index AS "blankIndex", value, is_primary AS "isPrimary"
      FROM answers WHERE exercise_id = $1
    `, [id]),
  ]);

  if (!exRow.rows[0]) return null;
  return { ...exRow.rows[0], answers: ansRows.rows };
}

export async function getAcceptedAnswers(
  exerciseId: string,
  blankIndex: number
): Promise<string[]> {
  const { rows } = await query<{ value: string }>(
    `SELECT value FROM answers WHERE exercise_id = $1 AND blank_index = $2`,
    [exerciseId, blankIndex]
  );
  return rows.map((r) => r.value);
}

export async function getPrimaryAnswer(
  exerciseId: string,
  blankIndex: number
): Promise<string | null> {
  const { rows } = await query<{ value: string }>(
    `SELECT value FROM answers WHERE exercise_id = $1 AND blank_index = $2 AND is_primary LIMIT 1`,
    [exerciseId, blankIndex]
  );
  return rows[0]?.value ?? null;
}
