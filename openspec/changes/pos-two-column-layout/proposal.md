# Proposal: Two-Column POS Layout

## Intent
Redesign VentasPage from a single-column search-based layout to a two-column layout with visual product browsing and an always-visible cart panel. This reduces clicks, eliminates scrolling, and makes selling faster for cashiers.

## Scope

**In scope:**
- Split layout: left panel (product browser) + right panel (cart + payment)
- Product grid: cards showing name, price, stock badge — click to add +1
- Search filters the product grid in real-time
- Cart always visible on the right with items, quantities, total, payment
- Responsive: on small screens, stack vertically
- Quick quantity: +/- buttons in cart, or type number directly

**Out of scope:**
- Categories/grouping (defer to next iteration)
- Multi-pago (keep single payment — defer)
- Barcode scanner mode (defer)
- Image thumbnails (defer — no image data yet)
- Product favorite/frequent section (defer)

## Approach
Rewrite `VentasPage.tsx` with a two-column flex layout. The left panel has search + scrollable product grid. The right panel is the cart with payment. Data comes from existing `GET /api/productos` and `GET /api/medios-pago` endpoints.
