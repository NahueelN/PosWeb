CREATE TABLE IF NOT EXISTS productos (
  codigo_barras  TEXT PRIMARY KEY,
  descripcion    TEXT NOT NULL,
  marca          TEXT,
  contenido      REAL,
  unidad         TEXT,
  contador_usos  INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_productos_buscar ON productos(descripcion, marca);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca);
