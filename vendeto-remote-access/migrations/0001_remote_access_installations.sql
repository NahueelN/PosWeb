CREATE TABLE IF NOT EXISTS remote_access_installations (
  id TEXT PRIMARY KEY,
  license_hash TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  tunnel_id TEXT NULL,
  dns_record_id TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('provisioning', 'provisioned', 'failed', 'disabled')),
  last_error TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (license_hash, machine_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS remote_access_installations_active_slug
  ON remote_access_installations (slug)
  WHERE status <> 'disabled';
