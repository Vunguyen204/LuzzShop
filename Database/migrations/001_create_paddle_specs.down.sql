-- LuzzShop - Interactive Paddle Finder
-- Draft rollback only. This permanently removes data stored in the two new tables.
-- Take and verify a backup before execution.

DROP TRIGGER trg_paddle_spec_sources_invalidate_after_delete;
DROP TRIGGER trg_paddle_spec_sources_invalidate_after_update;
DROP TRIGGER trg_paddle_spec_sources_invalidate_after_insert;
DROP TRIGGER trg_paddle_specs_invalidate_before_update;
DROP TABLE paddle_spec_sources;
DROP TABLE paddle_specs;

