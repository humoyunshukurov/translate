import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { useExerciseStore } from '../store/exerciseStore';

export function useValidate(exerciseId: string, blankIndex: number) {
  const applyValidation = useExerciseStore((s) => s.applyValidation);
  const startedRef = useRef<number>(Date.now());

  const validate = useCallback(async (value: string) => {
    const timeSpentMs = Date.now() - startedRef.current;
    startedRef.current = Date.now();
    const result = await api.exercises.validate(exerciseId, { blankIndex, submitted: value, timeSpentMs });
    applyValidation(exerciseId, blankIndex, result);
    return result;
  }, [exerciseId, blankIndex, applyValidation]);

  return { validate };
}
