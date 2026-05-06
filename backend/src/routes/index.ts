import { Router } from 'express';
import * as ctrl from '../controllers/exerciseController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Topics
router.get('/topics',            asyncHandler(ctrl.listTopics));
router.get('/topics/:slug',      asyncHandler(ctrl.getTopic));
router.get('/topics/:slug/exercises', asyncHandler(ctrl.listExercises));

// Exercises
router.get('/exercises/:id',     asyncHandler(ctrl.getExercise));
router.post('/exercises/:id/validate', asyncHandler(ctrl.validateExercise));

export default router;
