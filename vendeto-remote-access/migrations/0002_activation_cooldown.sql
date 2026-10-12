ALTER TABLE remote_access_installations ADD COLUMN activation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE remote_access_installations ADD COLUMN activation_window_start TEXT NULL;
