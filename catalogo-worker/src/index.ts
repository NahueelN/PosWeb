import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  CATALOGO_DB: D1Database;
}

interface ProductoRow {
  codigo_barras: string;
  descripcion: string;
  marca: string | null;
  contenido: number | null;
  unidad: string | null;
  contador_usos: number;
  created_at: string;
  updated_at: string;
}

interface ProductoInput {
  codigo_barras: string;
  descripcion?: string;
  marca?: string | null;
  contenido?: number | null;
  unidad?: string | null;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

function validarCodigoBarras(codigo: string): boolean {
  return /^[A-Za-z0-9]{1,48}$/.test(codigo);
}

function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

// GET /productos/:barcode - lookup by barcode, increments usage counter
app.get('/productos/:barcode', async (c) => {
  const env = c.env;
  const barcode = normalizarCodigo(c.req.param('barcode'));

  if (!validarCodigoBarras(barcode)) {
    return c.json({ encontrado: false, error: 'Formato de código de barras inválido' }, 400);
  }

  const row = await env.CATALOGO_DB
    .prepare('SELECT * FROM productos WHERE codigo_barras = ?')
    .bind(barcode)
    .first<ProductoRow>();

  if (!row) {
    return c.json({ encontrado: false });
  }

  await env.CATALOGO_DB
    .prepare('UPDATE productos SET contador_usos = contador_usos + 1 WHERE codigo_barras = ?')
    .bind(barcode)
    .run();

  return c.json({
    encontrado: true,
    datos: {
      codigoBarras: row.codigo_barras,
      descripcion: row.descripcion,
      marca: row.marca,
      contenido: row.contenido,
      unidad: row.unidad,
    },
  });
});

// POST /productos - upsert a product into the catalog
app.post('/productos', async (c) => {
  const env = c.env;
  let body: ProductoInput;
  try {
    body = await c.req.json<ProductoInput>();
  } catch {
    return c.json({ error: 'JSON inválido' }, 400);
  }

  const { codigo_barras, descripcion, marca, contenido, unidad } = body;

  if (!codigo_barras) {
    return c.json({ error: 'codigo_barras es requerido' }, 400);
  }

  const barcode = normalizarCodigo(codigo_barras);
  if (!validarCodigoBarras(barcode)) {
    return c.json({ error: 'Formato de código de barras inválido' }, 400);
  }

  if (!descripcion || descripcion.trim().length === 0) {
    return c.json({ error: 'descripcion es requerida' }, 400);
  }

  const existing = await env.CATALOGO_DB
    .prepare('SELECT * FROM productos WHERE codigo_barras = ?')
    .bind(barcode)
    .first<ProductoRow>();

  if (existing) {
    await env.CATALOGO_DB
      .prepare(
        `UPDATE productos 
         SET descripcion = ?, marca = ?, contenido = ?, unidad = ?, updated_at = datetime('now')
         WHERE codigo_barras = ?`
      )
      .bind(
        descripcion.trim(),
        marca?.trim() || null,
        contenido ?? null,
        unidad?.trim() || null,
        barcode
      )
      .run();

    return c.json({ creado: false, codigo_barras: barcode });
  }

  await env.CATALOGO_DB
    .prepare(
      `INSERT INTO productos (codigo_barras, descripcion, marca, contenido, unidad, contador_usos, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
    )
    .bind(
      barcode,
      descripcion.trim(),
      marca?.trim() || null,
      contenido ?? null,
      unidad?.trim() || null
    )
    .run();

  return c.json({ creado: true, codigo_barras: barcode }, 201);
});

// GET /productos?q= - search by text (name or brand)
app.get('/productos', async (c) => {
  const env = c.env;
  const q = c.req.query('q');

  if (!q || q.trim().length < 2) {
    return c.json({ resultados: [] });
  }

  const pattern = `%${q.trim()}%`;
  const { results } = await env.CATALOGO_DB
    .prepare(
      `SELECT codigo_barras, descripcion, marca, contenido, unidad, contador_usos
       FROM productos
       WHERE descripcion LIKE ? OR marca LIKE ?
       ORDER BY contador_usos DESC
       LIMIT 20`
    )
    .bind(pattern, pattern)
    .all<ProductoRow>();

  return c.json({
    resultados: results.map(r => ({
      codigoBarras: r.codigo_barras,
      descripcion: r.descripcion,
      marca: r.marca,
      contenido: r.contenido,
      unidad: r.unidad,
    })),
  });
});

// GET /stats - catalog statistics
app.get('/stats', async (c) => {
  const env = c.env;

  const total = await env.CATALOGO_DB
    .prepare('SELECT COUNT(*) as count FROM productos')
    .first<{ count: number }>();

  const top = await env.CATALOGO_DB
    .prepare(
      `SELECT codigo_barras, descripcion, marca, contador_usos
       FROM productos
       ORDER BY contador_usos DESC
       LIMIT 10`
    )
    .all<ProductoRow>();

  return c.json({
    total: total?.count ?? 0,
    top: top.results.map(r => ({
      codigoBarras: r.codigo_barras,
      descripcion: r.descripcion,
      marca: r.marca,
      usos: r.contador_usos,
    })),
  });
});

// GET /health - health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
