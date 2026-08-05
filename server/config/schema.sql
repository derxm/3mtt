-- ============================================================
-- SaveTrack Database Schema
-- Run this once against your PostgreSQL database:
--   psql -U postgres -d savings_tracker -f config/schema.sql
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(100)  NOT NULL,
  target_amount  NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  category       VARCHAR(50)   NOT NULL DEFAULT 'Other',
  deadline       DATE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID          NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  amount     NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type       VARCHAR(10)   NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  note       VARCHAR(200),
  date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_goals_user_id        ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Auto-update updated_at on savings_goals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON savings_goals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
