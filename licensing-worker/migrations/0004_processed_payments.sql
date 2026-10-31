CREATE TABLE IF NOT EXISTS processed_payments (
  payment_id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
