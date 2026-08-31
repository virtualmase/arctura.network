PRAGMA foreign_keys = ON;

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_account_id TEXT NOT NULL REFERENCES accounts(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'connection', 'evidence')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('impersonation', 'harassment', 'spam', 'false-claim', 'unsafe-content', 'other')),
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(reporter_account_id, target_type, target_id, reason)
);

CREATE INDEX reports_status_idx ON reports(status, created_at);
CREATE INDEX reports_target_idx ON reports(target_type, target_id);
