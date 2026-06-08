# Proposal: Compras Scanner UX

## Intent

Redesign the Compras tab frontend for **scanner-first operation** with a barcode reader, adding an explicit confirmation step styled as an invoice/boleta, and a final receipt-style comprobante after successful purchase. This is a pure frontend overhaul — the backend API (`POST /api/compras/crear`) stays unchanged.

## Scope

### In Scope
- Scanner-optimised input: auto-focus on mount, keep focus after add, add product on Enter via exact barcode match
- Inline quantity field next to search input for fast multi-unit entry
- Three-step navigation: `[SCAN]` → `[CONFIRM]` → `[COMPROBANTE]`
- Step 1: "Scan / Search" — unified input box, filtering product grid, live cart panel
- Step 2: "Confirmar" — full invoice-style table with checkboxes to verify against physical invoice
- Step 3: "Comprobante" — receipt/ticket print view with success state
- `useReducer` for step management instead of multiple `useState` flags
- `window.print()` CSS for ticket printing
- Keyboard-driven flow (Tab, Enter, Esc) without requiring mouse clicks

### Out of Scope
- Backend changes (ComproController, CompraService, Gasto entity — already implemented)
- Purchase history or reports
- Purchase returns/refunds
- Auto-updating Producto.COSTO from purchase cost
- Barcode scanner hardware setup (assumes keyboard-wedge mode)

## Capabilities

### New Capabilities
None — the change is a frontend UX overhaul of the existing `compra` capability.

### Modified Capabilities
- `compra`: the frontend experience of creating a purchase is replaced end-to-end

## Approach

Rewrite `CompraPage.tsx` to use a state machine with three steps (`scan`, `confirm`, `done`). The backend API is already in place — we only touch frontend files.

The three steps:
1. **scan** — unified search/scan input that auto-focuses and stays focused. On Enter, if the input matches an exact barcode, the product is added to cart with the specified quantity. Cart panel shows live side-by-side.
2. **confirm** — a full-screen table styled as a printable invoice/boleta. User checks a box confirming quantities and costs match the physical invoice, then confirms.
3. **done** — success receipt with print button, new purchase button, close button.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/pages/CompraPage.tsx` | **Rewrite** | Full state machine + scanner UX + confirmation + receipt |
| `frontend/src/types/index.ts` | Unchanged | DTOs already exist from compras-tab |
| `frontend/src/api/client.ts` | Unchanged | `api.compras.crear` already exists |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scanner adds product multiple times per scan (barcode sends Enter twice) | Low | Debounce or ignore rapid successive identical scans within 500ms |
| User loses cart data on accidental refresh | Low | Warn before unload if cart has items (`beforeunload` event) |
| Receipt print has wrong dimensions | Med | Provide print-specific CSS with @media print rules tested on 80mm thermal |
| Step state not persisted across re-renders | Low | `useReducer` is stable; no external persistence needed |

## Rollback Plan

1. Restore original `frontend/src/pages/CompraPage.tsx` from git
2. No database or backend changes to revert

## Dependencies

- Existing `POST /api/compras/crear` endpoint (deployed and tested)
- Existing `CompraResponseDto` shape (`gastoId`, `totalGasto`, `fecha`, `items`)

## Success Criteria

- [ ] Scan flow: focus on input → scan barcode → product added to cart with quantity 1 → input cleared and refocused
- [ ] Scan with quantity: scan barcode → type "24" → Enter → 24 units added to cart
- [ ] Confirm step: shows all cart items in invoice/boleta format, checkbox required before confirm button enabled
- [ ] Done step: shows receipt with all line items, totals, gastoId; print button opens print dialog
- [ ] Navigation: back/forth between steps preserves cart data; escape on confirm returns to scan
- [ ] `npm run lint && npx tsc -b` passes
