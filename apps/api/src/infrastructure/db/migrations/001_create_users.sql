-- Migration 001: Create users table
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
