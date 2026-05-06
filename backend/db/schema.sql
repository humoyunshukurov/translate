-- =============================================
-- Fill-in-the-Blanks Platform :: PostgreSQL Schema
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- trigram similarity for typo detection

-- ── Topics ──────────────────────────────────────────────────────────────────
CREATE TABLE topics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        VARCHAR(100) UNIQUE NOT NULL,        -- 'present-simple', 'past-tense'
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  level       VARCHAR(20) NOT NULL                 -- 'A1','A2','B1','B2','C1','C2'
                CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  order_index INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_level   ON topics(level);
CREATE INDEX idx_topics_active  ON topics(is_active, order_index);

-- ── Exercises ────────────────────────────────────────────────────────────────
CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sentence        TEXT NOT NULL,   -- "She ___ to school every day."
  -- blank positions encoded as JSON array [{start,end,answerIndex}]
  blanks          JSONB NOT NULL DEFAULT '[]',
  hint            TEXT,
  explanation     TEXT,            -- shown after answer
  difficulty      SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  order_index     INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_topic    ON exercises(topic_id, order_index);
CREATE INDEX idx_exercises_active   ON exercises(is_active);
CREATE INDEX idx_exercises_blanks   ON exercises USING GIN(blanks);

-- ── Accepted Answers ─────────────────────────────────────────────────────────
-- One exercise blank can have multiple correct answers ("goes", "walks")
CREATE TABLE answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id   UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  blank_index   SMALLINT NOT NULL DEFAULT 0,    -- which blank (0-based)
  value         VARCHAR(500) NOT NULL,          -- exact accepted answer
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE  -- shown as hint/correct answer
);

CREATE INDEX idx_answers_exercise ON answers(exercise_id, blank_index);
-- GIN index on trigrams for fast fuzzy matching
CREATE INDEX idx_answers_trgm ON answers USING GIN(value gin_trgm_ops);

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(320) UNIQUE NOT NULL,
  display_name  VARCHAR(100),
  level         VARCHAR(20) NOT NULL DEFAULT 'A1'
                  CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User Progress (per topic) ─────────────────────────────────────────────────
CREATE TABLE user_topic_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  exercises_seen  INT NOT NULL DEFAULT 0,
  correct_count   INT NOT NULL DEFAULT 0,
  streak          INT NOT NULL DEFAULT 0,
  last_exercise_id UUID REFERENCES exercises(id),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_progress_user ON user_topic_progress(user_id);

-- ── Attempt Log ───────────────────────────────────────────────────────────────
CREATE TABLE attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  blank_index   SMALLINT NOT NULL DEFAULT 0,
  submitted     VARCHAR(500) NOT NULL,     -- what user typed
  is_correct    BOOLEAN NOT NULL,
  match_score   NUMERIC(4,3),             -- 0.0 – 1.0 (fuzzy score)
  time_spent_ms INT,                      -- milliseconds user took
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_user     ON attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_exercise ON attempts(exercise_id);

-- ── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_topics_updated     BEFORE UPDATE ON topics     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_exercises_updated  BEFORE UPDATE ON exercises  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_progress_updated   BEFORE UPDATE ON user_topic_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed: sample data ────────────────────────────────────────────────────────
INSERT INTO topics (slug, title, description, level, order_index) VALUES
  ('present-simple',  'Present Simple',        'Daily habits and facts',         'A1', 1),
  ('past-simple',     'Past Simple',            'Completed past actions',         'A2', 2),
  ('present-perfect', 'Present Perfect',        'Past actions with present relevance','B1', 3),
  ('conditionals',    'Conditionals (0,1,2,3)', 'If-clauses and result clauses',  'B2', 4);
