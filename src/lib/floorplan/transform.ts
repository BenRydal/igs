/** Rotation index: 0 none, 1 = 90°, 2 = 180°, 3 = 270°. */
export type FloorplanRotation = 0 | 1 | 2 | 3

export interface Size {
  width: number
  height: number
}

export interface FloorplanGeometry {
  /** Canvas-space area the floorplan is drawn into, anchored at the canvas origin. */
  container: Size
  /** Pixel size of the drawn image; sets the aspect ratio when it is preserved. */
  image: Size
  /** Data-space extent: the image's pixel size, or the GPS normalized square. */
  source: Size
  rotation: FloorplanRotation
  preserveAspectRatio: boolean
}

export interface EffectiveRect {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

/** Where the floorplan actually lands inside its container. */
export function effectiveRect(geometry: FloorplanGeometry): EffectiveRect {
  const { container, image, rotation, preserveAspectRatio } = geometry
  if (!preserveAspectRatio) {
    return { width: container.width, height: container.height, offsetX: 0, offsetY: 0 }
  }

  const swapped = rotation === 1 || rotation === 3
  const imgAspect = swapped ? image.height / image.width : image.width / image.height
  const containerAspect = container.width / container.height

  if (imgAspect > containerAspect) {
    const height = container.width / imgAspect
    return { width: container.width, height, offsetX: 0, offsetY: (container.height - height) / 2 }
  }
  const width = container.height * imgAspect
  return { width, height: container.height, offsetX: (container.width - width) / 2, offsetY: 0 }
}

/** Data-space (x, y) to canvas-space position. */
export function toCanvas(x: number, y: number, geometry: FloorplanGeometry): [number, number] {
  const r = effectiveRect(geometry)
  const nx = x / geometry.source.width
  const ny = y / geometry.source.height

  switch (geometry.rotation) {
    case 1:
      return [r.offsetX + r.width - ny * r.width, r.offsetY + nx * r.height]
    case 2:
      return [r.offsetX + r.width - nx * r.width, r.offsetY + r.height - ny * r.height]
    case 3:
      return [r.offsetX + ny * r.width, r.offsetY + r.height - nx * r.height]
    default:
      return [r.offsetX + nx * r.width, r.offsetY + ny * r.height]
  }
}

/** Float slack so a point exactly on the floorplan edge still counts as inside. */
const EDGE_EPSILON = 1e-9

export interface DataPosition {
  x: number
  y: number
  /** False when the canvas position falls outside the drawn floorplan; x/y are then clamped to its edge. */
  inside: boolean
}

/** Canvas-space position to data-space (x, y): the inverse of `toCanvas`. */
export function toData(
  canvasX: number,
  canvasY: number,
  geometry: FloorplanGeometry
): DataPosition {
  const r = effectiveRect(geometry)
  const u = (canvasX - r.offsetX) / r.width
  const v = (canvasY - r.offsetY) / r.height

  let nx: number
  let ny: number
  switch (geometry.rotation) {
    case 1:
      nx = v
      ny = 1 - u
      break
    case 2:
      nx = 1 - u
      ny = 1 - v
      break
    case 3:
      nx = 1 - v
      ny = u
      break
    default:
      nx = u
      ny = v
  }

  const inside =
    nx >= -EDGE_EPSILON && nx <= 1 + EDGE_EPSILON && ny >= -EDGE_EPSILON && ny <= 1 + EDGE_EPSILON
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  return {
    x: clamp(nx) * geometry.source.width,
    y: clamp(ny) * geometry.source.height,
    inside,
  }
}
