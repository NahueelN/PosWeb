import type { LayoutInstance } from './types'
import { GRID_COLS, GRID_ROWS } from './types'

function overlaps(a: LayoutInstance, b: LayoutInstance): boolean {
  return a.x! < b.x! + b.w && a.x! + a.w > b.x! && a.y! < b.y! + b.h && a.y! + a.h > b.y!
}

function isOutOfBounds(
  item: LayoutInstance,
  cols: number,
  rows: number,
): boolean {
  return item.x! < 1 || item.y! < 1 || item.x! + item.w > cols + 1 || item.y! + item.h > rows + 1
}

function findNearestFreePosition(
  layout: LayoutInstance[],
  item: LayoutInstance,
  cols: number,
  rows: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null
  let bestDist = Infinity

  for (let y = 1; y <= rows - item.h + 1; y++) {
    for (let x = 1; x <= cols - item.w + 1; x++) {
      if (x === item.x! && y === item.y!) {
        if (bestDist === Infinity) {
          best = { x, y }
          bestDist = 0
        }
        continue
      }
      const dist = Math.abs(x - item.x!) + Math.abs(y - item.y!)
      if (dist > bestDist) continue
      if (dist === bestDist && best) {
        if (y > best.y || (y === best.y && x > best.x)) continue
      }
      let blocked = false
      for (const a of layout) {
        if (a.id === item.id) continue
        if (overlaps(a, { ...item, x, y } as LayoutInstance)) {
          blocked = true
          break
        }
      }
      if (!blocked) {
        best = { x, y }
        bestDist = dist
      }
    }
  }
  return best
}

export function resolveLayout(
  layout: LayoutInstance[],
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
): LayoutInstance[] | null {
  const result = layout.map((i) => ({ ...i }))
  const visited = new Set<string>()
  const queue: string[] = []

  for (const item of result) {
    if (isOutOfBounds(item, cols, rows)) {
      if (!visited.has(item.id)) {
        visited.add(item.id)
        queue.push(item.id)
      }
    }
  }
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (overlaps(result[i], result[j])) {
        if (!visited.has(result[i].id)) {
          visited.add(result[i].id)
          queue.push(result[i].id)
        }
        if (!visited.has(result[j].id)) {
          visited.add(result[j].id)
          queue.push(result[j].id)
        }
      }
    }
  }

  if (queue.length === 0) return result

  let iterations = 0
  while (queue.length > 0 && iterations < 50) {
    iterations++
    const id = queue.shift()!
    const item = result.find((i) => i.id === id)
    if (!item) continue

    const withoutItem = result.filter((i) => i.id !== id)
    const pos = findNearestFreePosition(withoutItem, item, cols, rows)
    if (!pos) return null

    item.x = pos.x
    item.y = pos.y

    for (const other of result) {
      if (other.id === id) continue
      if (overlaps(item, other)) {
        if (!visited.has(other.id)) {
          visited.add(other.id)
          queue.push(other.id)
        }
      }
    }
  }

  for (const item of result) {
    if (isOutOfBounds(item, cols, rows)) return null
  }
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (overlaps(result[i], result[j])) return null
    }
  }

  return result
}
