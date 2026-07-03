# LAYOUT-page-shell — PageShell Layout Component

## Metadata

```yaml
ID: LAYOUT-page-shell
Type: Layout
Name: PageShell Layout Component
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/components/shared/PageShell.tsx
  - frontend/src/pages/CajaPage.tsx
  - frontend/src/pages/DeudaPage.tsx
  - frontend/src/components/hosts/CartHost.tsx
Template: layout-v1
Created: 2026-06-30
Updated: 2026-06-30
Tags:
  - UX
  - Caja
```

---

## Overview

PageShell is the canonical page wrapper for PosWeb. It provides a consistent shell that every page can use to render a header, content area, and system-level states (loading, error, cash register status) without each page reimplementing them.

It exists because pages were independently building their own headers, loading spinners, and error banners, leading to visual inconsistency and duplicated state management.

---

## Structure

```
┌─────────────────────────────────────────────┐
│ Header                                       │
│  title / subtitle              actions slot  │
├─────────────────────────────────────────────┤
│ tabs slot (optional)                         │
├─────────────────────────────────────────────┤
│ Cash register status banner (conditional)    │
├─────────────────────────────────────────────┤
│ Content                                      │
│  children                                    │
│  (or loading spinner / error banner)         │
└─────────────────────────────────────────────┘
```

## Responsibilities

- **Render a consistent page header** with title, optional subtitle, and an actions slot.
- **Manage three content states**: normal (children), loading (centered spinner with message), error (red banner with icon).
- **Display cash register status** when the `caja` prop is provided: closed (amber warning), checking (blue info), or open (no banner).
- **Provide a tabs slot** for pages with tab navigation.

## Non-Responsibilities

- It does not own or fetch cash register state. The `caja` prop is injected by the page.
- It does not enforce its own usage. It is a component offered to pages, not a mandatory contract.
- It does not provide navigation, sidebar, or app-level chrome. Those belong to `Layout`.

## States Managed

| State | Trigger | Behavior |
|---|---|---|
| Normal | Default | Renders children |
| Loading | `loading={true}` | Replaces children with spinner + `loadingMessage` |
| Error | `error` is non-null | Shows red banner above children |
| Caja closed | `caja.activa === false` | Amber banner: "La caja está cerrada" |
| Caja loading | `caja.loading === true` | Blue banner: checking status |

## Slots

| Slot | Type | Purpose |
|---|---|---|
| `children` | ReactNode | Main page content |
| `actions` | ReactNode | Right-aligned header actions |
| `tabs` | ReactNode | Tab navigation below header |

## Limits

- Designed for a single-column content layout. Pages needing multi-column shells should compose PageShell with other layout primitives.
- The cash register banner is hardcoded in Spanish. It is tightly coupled to PosWeb's cash register domain.
- No built-in sidebar or navigation — those are provided by the app-level `Layout` component.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: DS-design-tokens
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-06-30 | Creado |
