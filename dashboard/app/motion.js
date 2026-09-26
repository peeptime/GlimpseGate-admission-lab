// Motion preference + shared procedural primitives (value noise, easing).
const KEY = "glimpsegate.motion";
const listeners = new Set();

export function motionLevel() {
  const stored = localStorage.getItem(KEY);
  if (stored === "full" || stored === "calm" || stored === "off") return stored;
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "calm" : "full";
}
export function setMotion(level) {
  localStorage.setItem(KEY, level);
  document.documentElement.dataset.motion = level;
  listeners.forEach((fn) => fn(level));
}
export function onMotion(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Hash-based 3D value noise with smooth interpolation. Cheap, deterministic,
// good enough for flow fields and subdivision thresholds.
function hash(x, y, z) {
  let n = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf
  );
}
/** Curl of a scalar noise field: divergence-free flow (the POP-advection look). */
export function curl(x, y, t, s = 0.0018) {
  const e = 0.5;
  const n = (a, b) => noise3(a * s, b * s, t);
  const dx = (n(x, y + e) - n(x, y - e)) / (2 * e);
  const dy = (n(x + e, y) - n(x - e, y)) / (2 * e);
  return [dx, -dy];
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export { lerp };

export function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

/** DPR-aware canvas sizing. Returns [cssWidth, cssHeight, ctx]. */
export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, hgt = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hgt * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, hgt, ctx];
}
