CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY NOT NULL,
  object_key TEXT UNIQUE NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  keep INTEGER NOT NULL DEFAULT 0 CHECK (keep IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_files_expiration ON files (keep, expires_at);
PRAGMA optimize;
