CREATE TABLE IF NOT EXISTS short_links (
  slug TEXT PRIMARY KEY,
  target_url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON short_links(created_at);
