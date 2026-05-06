import type { Request, Response } from 'express';
import * as exerciseService from '../services/exerciseService.js';
import * as attemptService from '../services/attemptService.js';
import { validateAnswer } from '../utils/validator.js';
import type { ValidationRequest } from '../../../shared/types/index.js';

// GET /api/topics
export async function listTopics(req: Request, res: Response) {
  const topics = await exerciseService.getAllTopics();
  res.json({ ok: true, data: topics });
}

// GET /api/topics/:slug
export async function getTopic(req: Request, res: Response) {
  const topic = await exerciseService.getTopicBySlug(req.params.slug);
  if (!topic) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Topic not found' });
  res.json({ ok: true, data: topic });
}

// GET /api/topics/:slug/exercises?limit=20&offset=0
export async function listExercises(req: Request, res: Response) {
  const topic = await exerciseService.getTopicBySlug(req.params.slug);
  if (!topic) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Topic not found' });

  const limit  = Math.min(Number(req.query.limit  ?? 20), 50);
  const offset = Number(req.query.offset ?? 0);
  const exercises = await exerciseService.getExercisesByTopic(topic.id, limit, offset);
  res.json({ ok: true, data: exercises });
}

// GET /api/exercises/:id
export async function getExercise(req: Request, res: Response) {
  const exercise = await exerciseService.getExerciseById(req.params.id);
  if (!exercise) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Exercise not found' });
  // Strip answers from public response — only expose in validation endpoint
  const { answers, explanation, ...publicExercise } = exercise;
  res.json({ ok: true, data: publicExercise });
}

// POST /api/exercises/:id/validate
export async function validateExercise(req: Request, res: Response) {
  const body = req.body as ValidationRequest;
  const { exerciseId, blankIndex, submitted, timeSpentMs } = body;

  if (!submitted || submitted.trim().length === 0) {
    return res.status(400).json({ ok: false, code: 'EMPTY', message: 'Answer cannot be empty' });
  }

  const [acceptedAnswers, exercise] = await Promise.all([
    exerciseService.getAcceptedAnswers(exerciseId, blankIndex),
    exerciseService.getExerciseById(exerciseId),
  ]);

  if (!acceptedAnswers.length || !exercise) {
    return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Exercise not found' });
  }

  const result = validateAnswer(submitted, acceptedAnswers);
  const isCorrect = result.status === 'correct';

  // Async side-effects — don't await so response is instant
  const userId: string = (req as any).userId ?? 'anonymous';
  if (userId !== 'anonymous') {
    Promise.all([
      attemptService.logAttempt({ userId, exerciseId, blankIndex, submitted, isCorrect, matchScore: result.matchScore, timeSpentMs }),
      attemptService.upsertProgress({ userId, topicId: exercise.topicId, exerciseId, isCorrect }),
    ]).catch(console.error);
  }

  const primaryAnswer = await exerciseService.getPrimaryAnswer(exerciseId, blankIndex);

  res.json({
    ok: true,
    data: {
      status: result.status,
      matchScore: result.matchScore,
      correctAnswer: isCorrect ? undefined : primaryAnswer,
      explanation: result.status === 'incorrect' ? exercise.explanation : undefined,
      feedback: feedbackMessage(result.status, result.matchScore),
    },
  });
}

function feedbackMessage(status: string, score: number): string {
  if (status === 'correct') return score === 1 ? "Perfect!" : "Correct! (minor typo forgiven)";
  if (status === 'close')   return "Very close! Check your spelling.";
  return "Not quite. Try again!";
}
