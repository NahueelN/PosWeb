CREATE TABLE IF NOT EXISTS leads (
  email TEXT PRIMARY KEY,
  nombre TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS email_log (
  email TEXT NOT NULL,
  kind TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (email, kind)
);
CREATE TABLE IF NOT EXISTS unsubscribes (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
