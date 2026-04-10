-- Migration 009: Create active_groups view
-- Application code always queries this view, never the raw groups table
CREATE VIEW active_groups AS
  SELECT * FROM groups WHERE deleted_at IS NULL;
