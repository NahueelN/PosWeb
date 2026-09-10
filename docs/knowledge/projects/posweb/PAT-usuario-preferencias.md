# PAT-usuario-preferencias

Preferencias de usuario genéricas (clave-valor JSON por sección), persistidas en el backend.
Su propósito es acumular configuraciones por usuario (ancho de ticket, letra, impresora por defecto,
auto-impresión, medio de pago por defecto, etc.) **sin modificar la entidad `Usuario` ni agregar
columnas ni tablas nuevas por cada preferencia**.

## Regla de oro

> NO cambiar clases, entidades ni migraciones para agregar una preferencia nueva.
> Solo se escribe una **sección JSON nueva** y se usa desde el frontend.

La infraestructura (tabla + servicio + endpoints) es **genérica** y no se toca nunca más.

---

## Modelo de datos

Tabla `USUARIO_PREFERENCIA`:

| Columna                     | Tipo         | Notas                                     |
| --------------------------- | ------------ | ----------------------------------------- |
| `ID_USUARIO_PREFERENCIA`    | int PK auto  |                                           |
| `ID_USUARIO`                | int FK       | -> `USUARIO` (Restrict)                   |
| `CLAVE`                     | string(100)  | nombre de la sección, ej. `ticket`        |
| `VALOR`                     | string(4000) | JSON estructurado de la sección           |

- Único compuesto `(ID_USUARIO, CLAVE)` -> cada usuario tiene una fila por sección.
- `VALOR` guarda el **JSON estructurado** de una sección.
  Ej. clave `ticket` -> `{"ancho":"58","letra":"grande"}`.

## API

- `GET /api/preferencias` -> `{ "preferencias": { "ticket": { "ancho": "58", "letra": "grande" } } }`
- `PUT /api/preferencias` -> body `{ "ticket": { "ancho": "80", "letra": "chica" } }` (upsert por sección)

- Sin `id` en la URL: el `userId` sale del claim JWT (`ClaimTypes.NameIdentifier`).
  Cada usuario solo lee/escribe sus propias preferencias.
- `[Authorize]` (cualquier rol).

## Archivos involucrados

| Capa        | Archivo                                          |
| ----------- | ------------------------------------------------ |
| Entidad     | `PosWeb.Domain/UsuarioPreferencia.cs`            |
| Mapping     | `PosWeb/Data/PosDbContextModel.cs`               |
| Migration   | `PosWeb/Migrations/Local/20260830000000_AddUsuarioPreferencia.cs` |
| Service     | `PosWeb/Application/Preferencias/PreferenciaService.cs` |
| Controller  | `PosWeb/Controllers/PreferenciasController.cs`   |
| Frontend    | `frontend/src/api/client.ts` (`api.preferencias`) |
| Frontend    | `frontend/src/types/index.ts` (`PreferenciasResponse`) |

---

## Cómo agregar una preferencia NUEVA (ej: `impresora`)

Solo 2 lugares, y **no se toca Backend de infraestructura**:

### 1. Frontend: tipo tipado de la sección (opcional, recomendado)

En `frontend/src/types/index.ts`:

```ts
export interface PreferenciasResponse {
  preferencias: Record<string, Record<string, string>>
}
// tipado de la sección nueva:
export type PreferenciaImpresora = { impresora: string; autoImpresion?: boolean }
```

### 2. Frontend: leer y guardar la sección

```ts
// Guardar
api.preferencias.guardar({ impresora: { impresora: 'EPSON-TM', autoImpresion: true } })
// Leer
const res = await api.preferencias.obtener()
const impr = res.preferencias?.impresora
```

No hay que crear endpoints, ni migraciones, ni tocar `UsuarioPreferencia`, ni `PreferenciaService`,
ni `PreferenciasController`.

---

## Convenciones de secciones existentes

| Sección | Campos                                   | Usado por                          |
| ------- | ---------------------------------------- | ---------------------------------- |
| `ticket`| `ancho` (`'58'\|'80'`), `letra` (`'chica'\|'mediana'\|'grande'`) | `frontend/src/pages/venta/TicketResultado.tsx` |

- Los valores dentro de una sección se guardan como **strings** en JSON
  (el frontend tipa/convierte al usarlos, ej. `Number('58')` para el ancho).
- Naming de secciones en **singular snake_case** (una palabra o `_`).

## Comportamiento base `ticket` en `TicketResultado`

- Al montar, `useEffect` hace `api.preferencias.obtener()` y precarga `ticket.ancho`/`ticket.letra`.
- Al cambiar ancho/letra, guarda en backend y en localStorage (fallback offline) via `persistirTicket()`.
- Defaults si nunca configuró: `ancho=80`, `letra='chica'`.
