import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(compression());
app.use(express.json({ limit: '16kb' }));

// Rate limit: 100 requests / minute per IP
app.use('/api', rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

app.use('/api', routes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`[Server] Listening on http://localhost:${PORT}`));

export default app;
