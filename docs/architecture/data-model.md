# Koin — Data Model

**Status:** Approved
**Date:** 2026-04-05
**Author:** Software Architect

---

## Design Principles

- PostgreSQL 16. All timestamps are `TIMESTAMPTZ` (UTC stored, display conversion in application layer).
- Monetary amounts are stored as `INTEGER` cents (EUR). No floating point for money.
- Soft deletes on `groups` only (via `deleted_at`). All other deletions are hard deletes — referential integrity is enforced by foreign keys.
- UUIDs for all primary keys (`gen_random_uuid()`). Avoids enumeration attacks and simplifies future federation.
- Attribution on transactions is a denormalized name snapshot (`created_by_name TEXT`) in addition to the FK. This preserves readable history after a member is removed.
- Categories are seeded per group at group creation time from a static predefined list. The `categories` table is group-scoped.

---

## Schema

> **Migration order note:** `recurring_rules` must be created before `transactions` because `transactions.recurring_rule_id` references it. See migration order below.

### `users`

```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub       TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL UNIQUE,
  display_name     TEXT NOT NULL,
  avatar_url       TEXT,
  default_group_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `google_sub` is the stable Google account identifier. Email can change; sub cannot.
- `default_group_id` is a forward reference — the FK constraint is added after `groups` is created (see deferred constraint below).

---

### `groups`

```sql
CREATE TABLE groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE VIEW active_groups AS
  SELECT * FROM groups WHERE deleted_at IS NULL;
```

- Application code always queries `active_groups`, never the raw `groups` table.
- `owner_id` is denormalized here for fast permission checks without a join to `group_members`.

---

### `group_members`

```sql
CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  role       TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  removed_at TIMESTAMPTZ,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id  ON group_members(user_id);
```

- Active membership: `WHERE removed_at IS NULL`.
- Owner is always present as a member row with `role = 'owner'` in addition to `groups.owner_id`.
- When a member is removed: `removed_at` is set to `now()`. Their past transactions stay untouched. Their recurring rules are set to `is_active = false`.

---

### `group_invitations`

```sql
CREATE TABLE group_invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id),
  token      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_by UUID NOT NULL REFERENCES users(id),
  used_by    UUID REFERENCES users(id),
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_invitations_token ON group_invitations(token);
```

- Single-use: once `used_by` is set the token is rejected.
- Expired tokens (`expires_at < now()`) are rejected at the application layer.
- Inviting owner selects the role the invitee will receive (`editor` or `viewer`; `owner` is not grantable via invitation).
- Token is a cryptographically random URL-safe string (32 bytes, base64url encoded = 43 chars). Generated with `crypto.randomBytes(32)`.

---

### `categories`

```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  is_default BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (group_id, name, type)
);

CREATE INDEX idx_categories_group_id ON categories(group_id);
```

- Seeded at group creation by a single batch insert inside the group-creation transaction.
- The predefined list lives as a TypeScript constant in the backend — not in SQL migrations.
- `is_default = true` marks all v1 predefined categories. Post-MVP custom categories will be `is_default = false`.
- No category create/update/delete endpoints are exposed in the v1 API.

**Predefined seed set:**

| type    | name             | sort_order |
|---------|------------------|------------|
| expense | Housing          | 1          |
| expense | Food & Groceries | 2          |
| expense | Transport        | 3          |
| expense | Car              | 4          |
| expense | Health           | 5          |
| expense | Pet              | 6          |
| expense | Entertainment    | 7          |
| expense | Shopping         | 8          |
| expense | Utilities        | 9          |
| expense | Education        | 10         |
| expense | Travel           | 11         |
| expense | Other            | 12         |
| income  | Salary           | 1          |
| income  | Freelance        | 2          |
| income  | Investment       | 3          |
| income  | Bonus            | 4          |
| income  | Other            | 5          |

---

### `recurring_rules`

```sql
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
```

- `day_of_month` constrained 1–28 at the DB level.
- `last_fired_at` is the scheduler's idempotency anchor — see `system-design.md`.
- When a member is removed, their rules are set to `is_active = false`. Rules are not transferred or deleted.

---

### `transactions`

> Must be created after `recurring_rules` due to the FK reference.

```sql
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
```

- `amount_cents` is always positive. The `type` column carries sign semantics.
- `date` is `DATE`, not a timestamp — the user selects when the event happened, not when it was entered.
- `created_by_name` is a snapshot of `users.display_name` at insert time. Renders correctly after the member leaves.
- `recurring_rule_id ON DELETE SET NULL` — deleting a rule preserves the historical transactions but severs the link.

---

### `users.default_group_id` — deferred FK

```sql
ALTER TABLE users
  ADD CONSTRAINT fk_users_default_group_id
  FOREIGN KEY (default_group_id) REFERENCES groups(id) ON DELETE SET NULL;
```

Applied after `groups` is created. `ON DELETE SET NULL` means a future hard-delete of a group degrades gracefully.

---

## Migration Order

1. `users` (no FKs to other app tables)
2. `groups` (FK to `users`)
3. `group_members` (FKs to `groups`, `users`)
4. `group_invitations` (FKs to `groups`, `users`)
5. `categories` (FK to `groups`)
6. `recurring_rules` (FKs to `groups`, `categories`, `users`)
7. `transactions` (FKs to `groups`, `categories`, `users`, `recurring_rules`)
8. `ALTER TABLE users ADD CONSTRAINT fk_users_default_group_id` (deferred FK to `groups`)
9. `CREATE VIEW active_groups`

---

## Entity Relationship Diagram

```
users
  ├── id (PK)
  ├── default_group_id → groups.id
  └── ...

groups (queried via active_groups view)
  ├── id (PK)
  ├── owner_id → users.id
  └── deleted_at

group_members
  ├── group_id → groups.id
  ├── user_id  → users.id
  ├── role
  └── removed_at

group_invitations
  ├── group_id   → groups.id
  ├── created_by → users.id
  └── used_by    → users.id (nullable)

categories
  └── group_id → groups.id

recurring_rules
  ├── group_id    → groups.id
  ├── category_id → categories.id
  └── created_by  → users.id

transactions
  ├── group_id          → groups.id
  ├── category_id       → categories.id
  ├── created_by        → users.id
  └── recurring_rule_id → recurring_rules.id (nullable, SET NULL on delete)
```

---

## Notes on Amount Precision

All monetary values are stored as `INTEGER` (EUR cents). EUR has 2 decimal places, so €12.50 = `1250`. The application layer is responsible for formatting. This avoids all floating-point rounding issues at zero cost.
