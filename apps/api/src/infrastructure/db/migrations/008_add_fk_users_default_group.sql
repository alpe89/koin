-- Migration 008: Add deferred FK from users.default_group_id to groups
-- Applied after groups table exists; ON DELETE SET NULL degrades gracefully on group deletion
ALTER TABLE users
  ADD CONSTRAINT fk_users_default_group_id
  FOREIGN KEY (default_group_id) REFERENCES groups(id) ON DELETE SET NULL;
