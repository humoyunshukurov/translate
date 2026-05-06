#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting FillBlank Platform..."

# Backend
cd "$ROOT/backend"
DATABASE_URL="postgres://postgres:postgres@localhost:5433/fillblank" \
CORS_ORIGIN="http://localhost:3000" \
PORT=4000 \
npx tsx src/app.ts &
BACKEND_PID=$!
echo "  ✓ Backend PID=$BACKEND_PID  → http://localhost:4000"

# Frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "  ✓ Frontend PID=$FRONTEND_PID → http://localhost:3000"

echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
