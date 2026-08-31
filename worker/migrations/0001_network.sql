PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL UNIQUE,
  github_login TEXT NOT NULL,
  email TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX sessions_account_idx ON sessions(account_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE COLLATE NOCASE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('person', 'agent', 'organization')),
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  introduction TEXT NOT NULL DEFAULT '',
  location_mode TEXT NOT NULL DEFAULT 'not-stated' CHECK (location_mode IN ('remote', 'hybrid', 'on-site', 'not-stated')),
  availability TEXT NOT NULL DEFAULT 'not-stated' CHECK (availability IN ('open', 'selective', 'not-available', 'not-stated')),
  visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft', 'public', 'unlisted')),
  accountable_owner TEXT,
  authority_limits TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (profile_type != 'agent' OR (accountable_owner IS NOT NULL AND authority_limits IS NOT NULL))
);

CREATE TABLE profile_owners (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'administrator', 'editor')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, account_id)
);
CREATE INDEX profile_owners_account_idx ON profile_owners(account_id);

CREATE TABLE capabilities (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'offers' CHECK (kind IN ('offers', 'seeks')),
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, label, kind)
);
CREATE INDEX capabilities_profile_idx ON capabilities(profile_id);

CREATE TABLE evidence_links (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  claim TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'member-submitted' CHECK (review_status IN ('member-submitted', 'source-checked', 'disputed', 'removed')),
  created_by TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX evidence_profile_idx ON evidence_links(profile_id);

CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  requester_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (requester_profile_id != recipient_profile_id),
  UNIQUE(requester_profile_id, recipient_profile_id)
);
CREATE INDEX connections_recipient_idx ON connections(recipient_profile_id, status);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX audit_account_idx ON audit_events(account_id, created_at);
