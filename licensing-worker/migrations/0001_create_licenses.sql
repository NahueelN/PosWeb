DROP TABLE IF EXISTS licenses;
CREATE TABLE IF NOT EXISTS licenses (
  license_key    TEXT PRIMARY KEY,
  preapproval_id TEXT,
  email          TEXT NOT NULL,
  plan           TEXT NOT NULL DEFAULT 'basica',
  status         TEXT NOT NULL DEFAULT 'pending',
  machine_id     TEXT,
  next_billing   TEXT,
  grace_until    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at   TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_preapproval ON licenses(preapproval_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
