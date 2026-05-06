import type { ApiResponse, Exercise, Topic, ValidationRequest, ValidationResponse } from '../types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.message);
  return json.data;
}

export const api = {
  topics: {
    list: () => request<Topic[]>('/topics'),
    get:  (slug: string) => request<Topic>(`/topics/${slug}`),
    exercises: (slug: string, params?: { limit?: number; offset?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<Exercise[]>(`/topics/${slug}/exercises${qs ? `?${qs}` : ''}`);
    },
  },
  exercises: {
    get: (id: string) => request<Exercise>(`/exercises/${id}`),
    validate: (id: string, body: Omit<ValidationRequest, 'exerciseId'>) =>
      request<ValidationResponse>(`/exercises/${id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId: id, ...body }),
      }),
  },
};
