-- Migration 007: Create transactions table
-- Must be created after recurring_rules due to FK reference
CREATE TABLE transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           UUID NOT NULL REFERENCES groups(id),
  category_id        UUID NOT NULL REFERENCES categories(id),
  created_by         UUID NOT NULL REFERENCES users(id),
  created_by_name    TEXT NOT NULL,
  amount_cents       INTEGER NOT NULL CHECK (amount_cents > 0),
  type               TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  date               DATE NOT NULL,
  note               TEXT,
  is_recurring_fired BOOLEAN NOT NULL DEFAULT false,
  recurring_rule_id  UUID REFERENCES recurring_rules(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_group_id      ON transactions(group_id);
CREATE INDEX idx_transactions_date          ON transactions(date);
CREATE INDEX idx_transactions_group_id_date ON transactions(group_id, date);
CREATE INDEX idx_transactions_created_by    ON transactions(created_by);
