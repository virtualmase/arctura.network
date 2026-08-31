PRAGMA foreign_keys = ON;

CREATE TABLE request_limits (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (key_hash, window_start)
);

CREATE INDEX request_limits_expiry_idx ON request_limits(expires_at);
