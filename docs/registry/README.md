# Registry

> Índice oficial del Project Knowledge System.
> No almacena conocimiento. Solo indexa y facilita encontrar los Knowledge Items.

## Cómo usar este Registry

1. Identificá el tipo de conocimiento que buscás (componente, patrón, regla, etc.)
2. Abrí el índice correspondiente
3. Localizá el Knowledge Item por ID, nombre o tag
4. Navegá a su ubicación en `knowledge/`

## Índices disponibles

| Archivo | Tipo indexado | Prefijo |
|---------|--------------|---------|
| `components.md` | Componentes reutilizables | `COMP-` |
| `patterns.md` | Patrones de diseño y arquitectura | `PAT-` |
| `business-rules.md` | Reglas de negocio | `BUS-` |
| `adr.md` | Decisiones arquitectónicas | `ADR-` |
| `design-system.md` | Design System | `DS-` |
| `layouts.md` | Layouts y shells | `LAYOUT-` |
| `flows.md` | Flujos principales | `FLOW-` |
| `services.md` | Servicios y APIs | `SERVICE-` |
| `hooks.md` | Hooks reutilizables | `HOOK-` |
| `glossary.md` | Términos del proyecto | `GLOSSARY-` |
| `relationships.md` | Grafo de relaciones entre Knowledge Items | — |

## Formato de cada entrada

Cada índice usa un formato de tabla consistente:

| ID | Name | Status | Level | Priority | Path |
|----|------|--------|-------|----------|------|

- **ID**: Identificador permanente (`COMP-`, `PAT-`, `BUS-`, etc.)
- **Name**: Nombre descriptivo
- **Status**: `Canonical`, `Stable`, `Experimental`, `Legacy`, `Draft`
- **Level**: `Core`, `Domain`, `Project`
- **Priority**: `Critical`, `High`, `Medium`, `Low`
- **Path**: Ruta relativa al Knowledge Item en `knowledge/`
