# Exploration: Keyboard-Only POS Operation

## Problem

The sales screen already has keyboard navigation for product search suggestions (ArrowUp/Down/Enter), but everything else requires a mouse:

- Selecting payment methods from the grid → mouse click
- Adding a payment → mouse click on "Agregar" button
- Confirming the sale → mouse click on sticky bar button
- Adjusting item quantities → mouse click on +/- buttons or manual input focus
- Removing items → mouse click on X button
- Navigating "Nueva venta" after result → mouse click

## Reality of POS environments

Cashiers don't use mice. They type barcodes, hit Enter, and expect the flow to chain automatically. Every mouse interaction breaks rhythm.

## Current state (what's already keyboard-ready)

| Area | Keyboard? | Notes |
|------|-----------|-------|
| Product search input | ✅ | Auto-focused on mount |
| Suggestions list | ✅ | ArrowUp/Down/Enter with highlight |
| Item quantity input | ⚠️ Partial | Editable but no keyboard-focused flow |
| Payment method grid | ❌ | Mouse click only |
| Payment monto input | ❌ | No autofocus when medio selected |
| "Agregar pago" button | ❌ | Mouse click only |
| "Confirmar venta" button | ❌ | Mouse click only (but part of `<form>` with onSubmit) |
| "Nueva venta" button | ❌ | Mouse click only |
| Close suggestions | ❌ | Click outside only (Escape not handled) |

## What's needed

A comprehensive keyboard flow that chains naturally: search → add items → pay → confirm → next sale, all without touching the mouse. Tab order, focus management, Escape handling, and visual focus indicators.
