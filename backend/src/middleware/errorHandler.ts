import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err);
  const status = (err as any)?.status ?? 500;
  const message = (err as any)?.message ?? 'Internal server error';
  res.status(status).json({ ok: false, code: 'SERVER_ERROR', message });
}
