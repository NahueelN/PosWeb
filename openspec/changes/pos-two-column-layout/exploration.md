# Exploration: POS Two-Column Layout

See separate exploration report from sdd-explore agent.

## Summary

The current VentasPage is a single-column layout with search → items → payment. This wastes screen space on desktop and forces the cashier to scroll between the item list, total, and payment selector. Real POS systems use a two-column layout with products on one side and the cart always visible on the other.

## Key Problems
1. Search-only — no visual product browsing
2. Vertical layout wastes desktop screen real estate
3. Cart/total not always visible
4. Adding products requires typing, not clicking

## Solution
Split layout: left panel (product browser with search + grid) + right panel (cart + payment, always visible).
