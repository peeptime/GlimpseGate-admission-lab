// Background field: a quadtree whose subdivision follows a slow noise field
// (fractal), and points advected through a curl-noise flow (POP-style).
//
// It is not decoration-only; three inputs change it:
//   energy  0..1  — how much material is on the gate (deeper subdivision)
//   route         — the last decision tints the field
//   attract {x,y} — while auditing, points drift toward the gate
import { curl, noise3, clamp, lerp, hexToRgb, fitCanvas, motionLevel, onMotion } from "../motion.js";
import { ROUTE_COLOR } from "../glyphs.js";

const INK = [233, 235, 238];

export function createField(canvas) {
  let w = 0, hgt = 0, ctx = null;
  let n = 0, xs, ys, pxs, pys, life;
  let raf = 0, last = 0, t = Math.random() * 100;
  let level = motionLevel();
  const state = { energy: 0.15, energyShown: 0.15, route: null, color: INK.slice(), attract: null, attractK: 0 };

  function resize() {
    [w, hgt, ctx] = fitCanvas(canvas);
    n = Math.round(clamp((w * hgt) / 2200, 260, 950));
    xs = new Float32Array(n); ys = new Float32Array(n);
    pxs = new Float32Array(n); pys = new Float32Array(n);
    life = new Float32Array(n);
    for (let i = 0; i < n; i++) spawn(i, true);
    if (level !== "full") drawStatic();
  }

  function spawn(i, anywhere) {
    xs[i] = pxs[i] = Math.random() * w;
    ys[i] = pys[i] = Math.random() * hgt;
    life[i] = anywhere ? Math.random() * 400 : 200 + Math.random() * 300;
  }

  function drawTree(alpha) {
    const e = state.energyShown;
    const maxD = 2 + Math.round(e * 4);
    const cell = 240;
    const [r, g, b] = state.color;
    ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tz = t * 0.035;
    const sub = (x, y, s, d) => {
      const v = noise3((x + s / 2) * 0.004, (y + s / 2) * 0.004, tz + d * 1.73);
      if (d < maxD && v > 0.46 + d * 0.055 - e * 0.14) {
        const hs = s / 2;
        sub(x, y, hs, d + 1); sub(x + hs, y, hs, d + 1);
        sub(x, y + hs, hs, d + 1); sub(x + hs, y + hs, hs, d + 1);
      } else {
        ctx.rect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(s), Math.round(s));
      }
    };
    for (let y = 0; y < hgt; y += cell) for (let x = 0; x < w; x += cell) sub(x, y, cell, 0);
    ctx.stroke();
  }

  function drawStatic() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, hgt);
    if (level === "off") return;
    state.energyShown = state.energy;
    drawTree(0.04);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(48, now - (last || now)) / 16.67;
    last = now;
    t += 0.004 * dt;

    // ease visual state toward targets
    state.energyShown = lerp(state.energyShown, state.energy, 0.02 * dt);
    const target = state.route ? hexToRgb(ROUTE_COLOR[state.route]) : INK;
    for (let k = 0; k < 3; k++) state.color[k] = lerp(state.color[k], target[k], 0.03 * dt);
    state.attractK = lerp(state.attractK, state.attract ? 1 : 0, 0.05 * dt);

    ctx.clearRect(0, 0, w, hgt);
    drawTree(0.035);

    const [r, g, b] = state.color;
    ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.22 + state.attractK * 0.18})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const speed = 1.1 + state.energyShown * 0.9;
    const ax = state.attract?.x ?? 0, ay = state.attract?.y ?? 0;
    for (let i = 0; i < n; i++) {
      pxs[i] = xs[i]; pys[i] = ys[i];
      const [vx, vy] = curl(xs[i], ys[i], t);
      let fx = vx * 900 * speed, fy = vy * 900 * speed;
      if (state.attractK > 0.01) {
        const dx = ax - xs[i], dy = ay - ys[i];
        const d = Math.hypot(dx, dy) + 40;
        fx += (dx / d) * 2.4 * state.attractK;
        fy += (dy / d) * 2.4 * state.attractK;
      }
      xs[i] += clamp(fx, -3, 3) * dt;
      ys[i] += clamp(fy, -3, 3) * dt;
      life[i] -= dt;
      if (life[i] <= 0 || xs[i] < -5 || ys[i] < -5 || xs[i] > w + 5 || ys[i] > hgt + 5) {
        spawn(i, false);
        continue;
      }
      ctx.moveTo(pxs[i], pys[i]);
      ctx.lineTo(xs[i] + 0.01, ys[i] + 0.01);
    }
    ctx.stroke();
  }

  function start() {
    cancelAnimationFrame(raf);
    last = 0;
    if (level === "full" && !document.hidden) raf = requestAnimationFrame(frame);
    else drawStatic();
  }

  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(document.documentElement);
  document.addEventListener("visibilitychange", start);
  onMotion((lv) => { level = lv; start(); });
  resize();
  start();

  return {
    set(patch) {
      Object.assign(state, patch);
      if (level !== "full") drawStatic();
    }
  };
}
