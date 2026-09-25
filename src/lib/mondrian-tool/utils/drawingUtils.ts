// src/utils/drawUtils.ts
import type p5 from 'p5'
import { get } from 'svelte/store'
import { drawingConfig, getSplitPositionForMode, type RotationAngle } from '../stores/drawingConfig'
import { drawingState } from '../stores/drawingState'

type Rect = { x: number; y: number; w: number; h: number }

/**
 * Get the displayed dimensions accounting for rotation.
 * At 90° and 270°, width and height are swapped.
 */
export function getRotatedDimensions(
  imgW: number,
  imgH: number,
  rotation: RotationAngle
): { displayW: number; displayH: number } {
  if (rotation === 90 || rotation === 270) {
    return { displayW: imgH, displayH: imgW }
  }
  return { displayW: imgW, displayH: imgH }
}

/**
 * Compute the exact rect where the image is drawn on the right panel
 * (aspect-fit / "contain", centered).
 * When rotation is 90° or 270°, the displayed dimensions are swapped.
 */
export function getFittedImageDisplayRect(
  p5: p5,
  splitPosPct: number,
  imgW: number,
  imgH: number,
  rotation: RotationAngle = 0
): Rect {
  const splitX = (p5.width * splitPosPct) / 100
  const panelW = p5.width - splitX
  const panelH = p5.height

  // Get the displayed dimensions (swapped for 90°/270°)
  const { displayW, displayH } = getRotatedDimensions(imgW, imgH, rotation)

  const imgAspect = displayW / displayH
  const panelAspect = panelW / panelH

  if (imgAspect > panelAspect) {
    // width-limited
    const w = panelW
    const h = w / imgAspect
    return { x: splitX, y: (panelH - h) / 2, w, h }
  } else {
    // height-limited
    const h = panelH
    const w = h * imgAspect
    return { x: splitX + (panelW - w) / 2, y: 0, w, h }
  }
}

export function isInDrawableArea(p5: p5, x: number, y: number): boolean {
  const splitX = (p5.width * getSplitPositionForMode()) / 100
  return x > splitX && x < p5.width && y > 0 && y < p5.height
}

/**
 * Apply inverse rotation to convert from rotated display coords to original image coords.
 * Input: normalized coords (0-1) in the rotated display space
 * Output: pixel coords in the original (unrotated) image space
 */
function applyInverseRotation(
  nx: number,
  ny: number,
  imgW: number,
  imgH: number,
  rotation: RotationAngle
): { x: number; y: number } {
  // nx, ny are normalized [0,1] in rotated display space
  switch (rotation) {
    case 0:
      return { x: nx * imgW, y: ny * imgH }
    case 90:
      // 90° CW: displayed as imgH × imgW
      // Top-left of rotated display = bottom-left of original
      // (nx, ny) in rotated → (ny, 1-nx) in original
      return { x: ny * imgW, y: (1 - nx) * imgH }
    case 180:
      // 180°: flip both axes
      return { x: (1 - nx) * imgW, y: (1 - ny) * imgH }
    case 270:
      // 270° CW (= 90° CCW): displayed as imgH × imgW
      // Top-left of rotated display = top-right of original
      // (nx, ny) in rotated → (1-ny, nx) in original
      return { x: (1 - ny) * imgW, y: nx * imgH }
  }
}

/**
 * Apply forward rotation to convert from original image coords to rotated display coords.
 * Input: pixel coords in the original (unrotated) image space
 * Output: normalized coords (0-1) in the rotated display space
 * This is the inverse of applyInverseRotation.
 */
export function applyForwardRotation(
  x: number,
  y: number,
  imgW: number,
  imgH: number,
  rotation: RotationAngle
): { nx: number; ny: number } {
  // Normalize to [0,1] in original image space
  const origNx = x / imgW
  const origNy = y / imgH

  switch (rotation) {
    case 0:
      return { nx: origNx, ny: origNy }
    case 90:
      // 90° CW: (origNx, origNy) → (1-origNy, origNx)
      return { nx: 1 - origNy, ny: origNx }
    case 180:
      // 180°: flip both axes
      return { nx: 1 - origNx, ny: 1 - origNy }
    case 270:
      // 270° CW: (origNx, origNy) → (origNy, 1-origNx)
      return { nx: origNy, ny: 1 - origNx }
  }
}

/**
 * Convert screen coords -> image pixel coords using the same rect as draw().
 * Returns values clamped to image bounds, with rotation accounted for.
 * Coordinates are always in the original (unrotated) image space.
 */
export function convertToImageCoordinates(p5: p5, x: number, y: number) {
  const config = get(drawingConfig)
  const state = get(drawingState)

  const imgW = state.imageWidth
  const imgH = state.imageHeight
  if (!imgW || !imgH) return { x: 0, y: 0 }

  const rotation = config.floorPlanRotation
  const r = getFittedImageDisplayRect(p5, getSplitPositionForMode(), imgW, imgH, rotation)

  const nx = (x - r.x) / r.w
  const ny = (y - r.y) / r.h

  // Clamp normalized to [0,1] so clicks in letterbox map to edges
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const clampedNx = clamp(nx)
  const clampedNy = clamp(ny)

  // Apply inverse rotation to get original image coordinates
  return applyInverseRotation(clampedNx, clampedNy, imgW, imgH, rotation)
}
