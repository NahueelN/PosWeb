# PASS-002 — Sync: Merge Rediseño_Productos_Cliente_Proveedor ↔ rolesusuario

---

## Resumen

- **ID:** PASS-002
- **Trigger:** Sync
- **Status:** Completed
- **Especificación:** [PASS-V1](PASS-V1.md)
- **Objetivo:** Sincronizar la rama `rolesusuario` contra `Rediseño_Productos_Cliente_Proveedor`, preservando cambios de ambas ramas, resolviendo conflictos, y verificando que el código resultante compile y genere bundle correctamente.
- **Rama origen:** `rolesusuario` (~75 commits, ~75 archivos modificados)
- **Rama destino:** `Rediseño_Productos_Cliente_Proveedor` (~42 archivos modificados)
- **Merge-base:** `b45ad3a`
- **Estrategia:** merge (no rebase) — `rolesusuario` contenía merges internos
- **Archivos modificados directamente:**
  - `frontend/src/pages/proveedores/ProveedoresPage.tsx` — conflicto resuelto (HEAD con hooks)
  - `frontend/src/pages/venta/VentasPage.tsx` — conflicto resuelto (3 regiones: formCliente con mail, crearClienteYRevertir + Ctrl+Enter, VentaDialogs). Import de tipos agregado
  - `frontend/src/pages/venta/VentaDialogs.tsx` — StockConflictItem exportado. Mail agregado al type y al form. Unused imports limpiados
  - `frontend/src/types/index.ts` — mail agregado a ClienteDto
- **Archivos indirectamente afectados (build):**
  - `frontend/src/pages/VentasPage.tsx` — corregido tipo del state `stockConflictItems` (Item → StockConflictItem) y mapeo de datos para compatibilidad
- **Verificación:**
  - Backend: `dotnet build` — 0 errores, 0 warnings ✅
  - Frontend: `vite build` — bundle exitoso (6.06s) ✅
  - TypeScript: errores pre-existentes de `rolesusuario` (CartItemBase, CartHost, CajaPage, DeudaPage, CompraPage, tests sin vitest). No forman parte de esta sincronización
- **Resultado:** Merge completado con 3 regiones de conflicto resueltas. Código compila y genera bundle. La rama `backup-rediseno-sync-pre` preserva el estado pre-sync como respaldo

---

## Detalle

### Contexto

El merge sincronizó dos líneas de trabajo divergentes:

- **Rediseño_Productos_Cliente_Proveedor** (rama actual): refactor profundo de páginas CRUD usando hooks reutilizables (`useEntityList`, `useEntitySearch`, `useEntityForm`), implementación de Entity Page architecture, PageShell con estados loading/error.
- **rolesusuario** (rama a sincronizar): agregado de roles de usuario, registro con验证 de email, suscripciones, ofertas, combos, compras, refactor de ventas en 5 componentes (SucursalSelector, TicketResultado, VentaProductGrid, VentaPaymentSlot, VentaDialogs), campo `mail` en clientes, Tauri GitHub Actions workflows.

### Sync Learning (Retrospectiva)

#### Qué funcionó bien

1. **Evaluación de Relevancia (Principio 3)**: fue correcta y eficiente. El Assessment detectó que el conocimiento nuevo en rolesusuario (ADR, Standards, Narrativas) no afectaba archivos modificados en la rama actual, y omitió el análisis profundo. Esto ahorró tiempo significativo sin perder información crítica.

2. **Assessment estructurado (6 preguntas)**: el flujo completo (qué cambió → qué nos afecta → riesgos → acciones requeridas → relevancia → recomendación) dio visibilidad completa antes de ejecutar el merge. Permitió tomar la decisión informada de continuar.

3. **Estrategia merge (no rebase)**: fue la decisión correcta. rolesusuario contenía merges internos (incluyendo `refactorventas` y `azure/rolesusuario`). Rebase habría reescrito historia compleja y multiplicado conflictos.

4. **Backup branch pre-sync**: crear `backup-rediseno-sync-pre` antes del merge dio seguridad para operar sin miedo a pérdida irreversible.

5. **Resolución conflicto por conflicto**: detenerse en cada conflicto, explicar causa raíz y proponer resolución fue efectivo. Las 3 regiones de VentasPage se resolvieron correctamente combinando el refactor de rolesusuario con el campo `mail` de HEAD.

6. **Distinción backend/frontend en build**: el backend compiló limpio inmediatamente. El frontend requirió correcciones post-merge pero las correcciones fueron quirúrgicas (tipo de state, mapeo), no estructurales.

#### Qué partes del Assessment fueron realmente útiles

1. **Relevant Changes con impacto Alto/Medio/Bajo**: el filtrado por impacto evitó leer los ~75 archivos de rolesusuario. Permitió enfocarse en los que realmente intersectaban con la rama actual.

2. **Risk Assessment**: identificar que la probabilidad de conflictos era media-alta, y particularmente en `ProveedoresPage.tsx` y `VentasPage.tsx`, preparó para lo que venía. Sin este análisis, el primer conflicto habría sido sorpresivo.

3. **Evaluación de Relevancia**: fue la mejora metodológica más valiosa de esta ejecución. Poder decir "hay nuevos ADRs y Standards pero no afectan este sync" ahorró horas de lectura innecesaria.

4. **Merge-base detection**: tener el merge-base claro (`b45ad3a`) desde el primer paso del Assessment despejó cualquier ambigüedad sobre qué commits comparar.

#### Qué análisis resultaron innecesarios

1. **Análisis detallado del diff total (~75 archivos)**: el Assessment listó el diff estructural completo, pero la mayoría de esos archivos (Oferta, Combo, Suscripción, Usuario, workflows Tauri) no intersectaban con los cambios de Rediseño_Productos_Cliente_Proveedor. El Relevant Changes filter hizo su trabajo, pero el diff total crudo fue ruido.

2. **Required Actions detalladas**: en este sync las acciones requeridas fueron mínimas (ejecutar merge, build). Listarlas formalmente fue correcto pero agregó poco valor porque no había migraciones, breaking changes, ni artefactos por regenerar.

#### Mejoras surgidas durante esta primera ejecución real

1. **Pre-sync health check**: antes del merge no sabíamos si la rama actual ya tenía errores de compilación. Tener un `dotnet build` y `vite build` pre-merge habría permitido distinguir inmediatamente errores introducidos por el merge vs errores pre-existentes. En este sync los errores TS pre-existentes de rolesusuario generaron confusión hasta que se verificó que no eran del merge.

2. **Type-check vs bundle en frontend**: el frontend usa Vite (esbuild) para bundling y `tsc` para type-checking. Son dos herramientas distintas con resultados distintos. El build de PASS debe aclarar cuál se evalúa: bundle (✅ exitoso) o type-check (❌ errores pre-existentes). El criterio de salida debe ser explícito.

3. **Tests como fase independiente**: la fase "Tests" del flujo asume que el proyecto tiene tests ejecutables. En este proyecto `vitest` no está instalado y los test files importan librerías que no existen como dependencias. El flujo debería detectar esta condición antes de llegar a la fase y ajustar el criterio de salida (pasar a "no aplica" en lugar de fallar).

4. **Naming de backup branch**: `backup-rediseno-sync-pre` es descriptivo pero largo. Para próximos syncs convendría un formato estándar como `backup/<rama>-<fecha>` o similar.

5. **Notificación de merge-base antiguo**: el merge-base `b45ad3a` tenía commits viejos. El Assessment lo detectó pero no alertó explícitamente sobre su antigüedad, que es un factor de riesgo incremental.

#### Recomendaciones para CMD-project-sync V2

Basado en la experiencia de esta primera ejecución real:

| # | Recomendación | Prioridad | Justificación |
|---|--------------|-----------|---------------|
| 1 | **Dos modos de ejecución: Quick (`project sync`) y Full (`project sync --full`)**: el modo Quick debe ser el default, ejecutando solo Assessment mínimo (merge-base, estrategia, conflictos esperados, Required Actions, Recomendación), merge/rebase, build/tests y registro de PASS. Sin cargar ADR, Standards, Narrativas ni PKS en profundidad salvo que el Assessment detecte evidencia objetiva de relevancia. El modo `--full` conserva el comportamiento actual con análisis completo de conocimiento, reutilización, narrativas y PKS. | Crítica | El flujo actual es demasiado costoso para uso cotidiano: consumió una porción muy importante del presupuesto de tokens antes de completar la sincronización. Quick mode permite sincronización diaria rápida y eficiente; Full mode se reserva para sincronizaciones complejas o cuando el usuario lo solicite explícitamente. |
| 2 | **Pre-sync health check automático**: ejecutar `build` en la rama actual antes del merge y preservar el resultado como baseline | Alta | Distinguir errores pre-existentes vs introducidos por el merge evita falsos positivos y pérdida de tiempo |
| 2 | **Criterio de salida explícito para Build**: separar "compila" (hard requirement) de "type-check pasa" (soft requirement, configurable) | Alta | Frontend moderno con Vite/esbuild puede generar bundle incluso con errores TS; el usuario debe decidir si eso es aceptable |
| 3 | **Test capability detection automática**: antes de la fase Tests, detectar si el proyecto tiene test runner y dependencias instaladas; si no, informar y pasar la fase | Media | Evita falsos negativos y fricción en el flujo |
| 4 | **Alerta de merge-base antiguo**: si la antigüedad del merge-base supera un umbral (ej: 2 semanas o 50 commits), agregar advertencia explícita en el Risk Assessment | Media | Cuanto más viejo el merge-base, mayor la probabilidad de conflictos complejos |
| 5 | **Backup branch automática**: si se elige merge, crear backup automático con nombre estándar (`backup/<rama-actual>-<timestamp>`) | Baja | Evita depender de que el usuario lo recuerde; estandariza el nombre |
| 6 | **Diff estructural resumido por defecto**: el Assessment debería mostrar solo los archivos con cambios relevantes (impacto Alto/Medio), y ofrecer el diff completo bajo demanda | Alta | El diff completo de ~75 archivos fue ruido; el filtro de impacto es la vista que realmente importa |
| 7 | **Reporte post-sync de archivos mergeados**: al completar el merge, listar archivos con conflictos resueltos, archivos auto-mergeados sin conflictos, y archivos con cambios solo de una rama | Media | Da visibilidad inmediata de qué pasó sin tener que inspeccionar el diff manualmente |

### Preguntas abiertas

- **¿Deberíamos instalar vitest y @testing-library/* como dependencias reales del proyecto?** Actualmente están referenciados en imports pero no declarados en `package.json`.
- **¿Los errores TS pre-existentes de rolesusuario se corrigen dentro del ciclo PASS normal o requieren un enfoque distinto?** Quedan para PASS independiente.
- **¿La estrategia de merge debe ser siempre merge, o debe ser configurable por el usuario?** Para ramas con merges internos, merge es seguro. Para ramas lineales, rebase puede ser preferible.

### Próximo paso

PASS independiente para corregir los errores TypeScript pre-existentes heredados de rolesusuario. Esos errores no pertenecen a esta sincronización y deben tratarse como su propia unidad de trabajo, con su propio Assessment y resolución.

### Referencias

- Merge commit: `00a2436`
- Backup branch: `backup-rediseno-sync-pre`
- Files edited directamente: `frontend/src/pages/proveedores/ProveedoresPage.tsx`, `frontend/src/pages/venta/VentasPage.tsx`, `frontend/src/pages/venta/VentaDialogs.tsx`, `frontend/src/types/index.ts`
- Files editados indirectamente: `frontend/src/pages/VentasPage.tsx`
- Especificación CMD-project-sync: `docs/PKS_PROPOSALS.md` (Propuesta Activa)
- Especificación PASS: `docs/passes/PASS-V1.md`
- ADR comandos familia CMD-*: `docs/knowledge/projects/posweb/ADR-project-commands-family.md`
- Sync Learning documentado como Retrospectiva de PASS-002 (este documento)
- PR narrativa: no aplica (sync, no feature PR)
