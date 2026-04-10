-- Migration 006: Create recurring_rules table
-- Must be created before transactions due to FK reference from transactions.recurring_rule_id
CREATE TABLE recurring_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES groups(id),
  category_id     UUID NOT NULL REFERENCES categories(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),
  type            TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  day_of_month    INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  note            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_fired_at   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_rules_group_id  ON recurring_rules(group_id);
CREATE INDEX idx_recurring_rules_is_active ON recurring_rules(is_active);
