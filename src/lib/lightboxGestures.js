/** Gestes de la visionneuse d'images : calculs purs, testables sans DOM. */

export const LIGHTBOX_MIN_SCALE = 1
export const LIGHTBOX_MAX_SCALE = 4
export const LIGHTBOX_DOUBLE_TAP_SCALE = 2.5

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function distanceBetween(a, b) {
  const dx = (a?.clientX ?? 0) - (b?.clientX ?? 0)
  const dy = (a?.clientY ?? 0) - (b?.clientY ?? 0)
  return Math.hypot(dx, dy)
}

export function midpoint(a, b) {
  return {
    clientX: ((a?.clientX ?? 0) + (b?.clientX ?? 0)) / 2,
    clientY: ((a?.clientY ?? 0) + (b?.clientY ?? 0)) / 2,
  }
}

/**
 * Applique un facteur de zoom et un déplacement en bornant l'échelle.
 * Le déplacement n'est conservé que lorsque l'image est agrandie ; à
 * l'échelle 1, l'image est recentrée pour éviter tout décalage résiduel.
 */
export function applyGesture({ scale, tx, ty }, { scaleFactor = 1, dx = 0, dy = 0 }, limits = {}) {
  const minScale = limits.minScale ?? LIGHTBOX_MIN_SCALE
  const maxScale = limits.maxScale ?? LIGHTBOX_MAX_SCALE
  const nextScale = clamp(scale * scaleFactor, minScale, maxScale)
  if (nextScale <= minScale) {
    return { scale: minScale, tx: 0, ty: 0 }
  }
  return {
    scale: nextScale,
    tx: tx + dx,
    ty: ty + dy,
  }
}

/** Double-toucher : zoome si l'image est à l'échelle 1, sinon réinitialise. */
export function toggleDoubleTap(state) {
  if (state.scale > LIGHTBOX_MIN_SCALE + 0.05) {
    return { scale: LIGHTBOX_MIN_SCALE, tx: 0, ty: 0 }
  }
  return { scale: LIGHTBOX_DOUBLE_TAP_SCALE, tx: state.tx, ty: state.ty }
}

/** Le déplacement n'a de sens qu'au-delà de l'échelle 1. */
export function canPan(scale) {
  return scale > LIGHTBOX_MIN_SCALE + 0.01
}
