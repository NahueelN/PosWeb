// useGridAnimation — FLIP technique for smooth grid transitions.
// Animates position/size changes (~200ms) and entrance (fade+scale).
// Skips animation when `enabled=false` (e.g. during drag reorder).

import { useRef, useLayoutEffect } from 'react'

interface WidgetRect {
  x: number
  y: number
  w: number
  h: number
}

const ANIMATION_MS = 200
const EASE = 'cubic-bezier(0.2, 0, 0, 1)'

function capturePositions(): Map<string, WidgetRect> {
  const map = new Map<string, WidgetRect>()
  document.querySelectorAll<HTMLElement>('[data-widget-id]').forEach((el) => {
    const id = el.dataset.widgetId!
    // Clear any residual inline transforms so we read the TRUE layout position
    const savedTransform = el.style.transform
    const savedTransition = el.style.transition
    const savedOpacity = el.style.opacity
    if (savedTransform) el.style.transform = 'none'
    if (savedTransition) el.style.transition = 'none'
    const rect = el.getBoundingClientRect()
    // Restore if mid-animation (shouldn't happen when enabled=false, but safe)
    if (savedTransform) el.style.transform = savedTransform
    if (savedTransition) el.style.transition = savedTransition
    if (savedOpacity) el.style.opacity = savedOpacity
    map.set(id, { x: rect.left, y: rect.top, w: rect.width, h: rect.height })
  })
  return map
}

/**
 * Call once per component that renders grid cells with `data-widget-id`.
 * Automatically detects position/size changes and animates them.
 * New widgets get a fade+scale entrance animation.
 *
 * @param enabled - Set false to pause FLIP (e.g. during live drag reorder).
 *   When re-enabled, it snapshots positions without animating so the next
 *   transition starts from a clean baseline.
 */
export function useGridAnimation(enabled = true) {
  const prevPositions = useRef<Map<string, WidgetRect>>(new Map())
  const wasEnabled = useRef(true)

  useLayoutEffect(() => {
    if (!enabled) {
      // Just paused (drag started) or staying paused — snapshot clean positions
      // so when we re-enable, we don't animate from stale/transformed positions
      prevPositions.current = capturePositions()
      wasEnabled.current = false
      return
    }

    // Re-enabled after being paused — snapshot only, no animation
    if (!wasEnabled.current) {
      wasEnabled.current = true
      prevPositions.current = capturePositions()
      return
    }

    // Normal FLIP animation
    const current = capturePositions()
    const prev = prevPositions.current
    const moved: { el: HTMLElement; dx: number; dy: number }[] = []
    const entered: HTMLElement[] = []

    current.forEach((pos, id) => {
      const el = document.querySelector<HTMLElement>(`[data-widget-id="${id}"]`)
      if (!el) return

      const oldPos = prev.get(id)
      if (!oldPos) {
        // New widget → entrance animation
        entered.push(el)
        return
      }

      const dx = oldPos.x - pos.x
      const dy = oldPos.y - pos.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        moved.push({ el, dx, dy })
      }
    })

    if (entered.length === 0 && moved.length === 0) {
      prevPositions.current = current
      return
    }

    // ── Entrance animation (fade + scale) ──
    for (const el of entered) {
      el.style.opacity = '0'
      el.style.transform = 'scale(0.85)'
      el.style.transition = 'none'
    }

    // ── FLIP: position animation ──
    for (const { el, dx, dy } of moved) {
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      el.style.transform = `translate(${dx}px, ${dy}px)`
    }

    // Force reflow so browsers register the initial state
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    document.body.offsetHeight

    requestAnimationFrame(() => {
      // Animate entrance
      for (const el of entered) {
        el.style.transition = `opacity ${ANIMATION_MS}ms ${EASE}, transform ${ANIMATION_MS}ms ${EASE}`
        el.style.opacity = ''
        el.style.transform = ''
      }

      // Animate position
      for (const el of moved) {
        el.style.transition = `transform ${ANIMATION_MS}ms ${EASE}`
        el.style.transform = ''
      }

      // Cleanup inline styles after animation completes
      setTimeout(() => {
        for (const el of entered) {
          el.style.opacity = ''
          el.style.transform = ''
          el.style.transition = ''
        }
        for (const el of moved) {
          el.style.transform = ''
          el.style.transition = ''
          el.style.willChange = ''
        }
      }, ANIMATION_MS + 30)
    })

    prevPositions.current = current
  }, [enabled])
}
