// The gate as a node network (Houdini SOP-style): input → four checks →
// route → one of four outputs. Points flow along the wires. Node states come
// from the SDK result's `checks`; the lit output is the SDK's decision.
import { fitCanvas, motionLevel, onMotion, clamp, lerp } from "../motion.js";
import { ROUTES, ROUTE_COLOR, drawGlyph } from "../glyphs.js";

const INK = "#e9ebee", INK2 = "#a3a9b1", INK3 = "#6a7079", INK4 = "#3a3f45";
const CHECK_IDS = ["source", "audit", "loop", "scope"];

export function createNetwork(canvas, { labels = {} } = {}) {
  let w = 0, hgt = 0, ctx = null;
  let raf = 0, last = 0, clock = 0;
  let level = motionLevel();
  let nodes = [], paths = [];
  const points = [];
  const st = {
    mode: "idle",           // idle | scan | resolved
    scanStart: 0,
    checks: CHECK_IDS.map((id) => ({ id, pass: null, detail: "" })),
    route: null,
    resolvedAt: 0,
    labels
  };

  function layout() {
    [w, hgt, ctx] = fitCanvas(canvas);
    const L = Math.max(40, w * 0.06), R = Math.max(110, w * 0.15);
    const usable = w - L - R;
    const cy = hgt * 0.48;
    const xAt = (f) => L + usable * f;
    nodes = [
      { id: "in", kind: "in", x: xAt(0), y: cy },
      ...CHECK_IDS.map((id, i) => ({ id, kind: "check", x: xAt(0.17 + i * 0.17), y: cy })),
      { id: "route", kind: "route", x: xAt(0.86), y: cy }
    ];
    const spread = Math.min(hgt * 0.36, 110);
    const outs = ROUTES.map((r, i) => ({ id: r, kind: "out", x: xAt(1), y: cy - spread + (i * 2 * spread) / 3 }));
    nodes.push(...outs);

    // Sampled paths: main line then a curve into each output.
    const main = nodes.filter((nd) => nd.kind !== "out");
    paths = outs.map((o) => {
      const pts = [];
      for (let i = 0; i < main.length - 1; i++) {
        const a = main[i], b = main[i + 1];
        for (let k = 0; k < 24; k++) pts.push([lerp(a.x, b.x, k / 24), lerp(a.y, b.y, k / 24)]);
      }
      const r = main[main.length - 1];
      const c1 = [r.x + (o.x - r.x) * 0.55, r.y], c2 = [r.x + (o.x - r.x) * 0.45, o.y];
      for (let k = 0; k <= 40; k++) {
        const s = k / 40, u = 1 - s;
        pts.push([
          u * u * u * r.x + 3 * u * u * s * c1[0] + 3 * u * s * s * c2[0] + s * s * s * o.x,
          u * u * u * r.y + 3 * u * u * s * c1[1] + 3 * u * s * s * c2[1] + s * s * s * o.y
        ]);
      }
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { route: o.id, pts, cum, len: cum[cum.length - 1], c1, c2, from: r, to: o };
    });
  }

  function at(path, dist) {
    const { pts, cum } = path;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < dist) lo = mid + 1; else hi = mid; }
    const i = Math.max(1, lo);
    const f = clamp((dist - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), 0, 1);
    return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
  }

  const nodeById = (id) => nodes.find((nd) => nd.id === id);

  function spawnPoint() {
    let routeIdx;
    if (st.mode === "resolved" && st.route) routeIdx = ROUTES.indexOf(st.route);
    else routeIdx = Math.floor(Math.random() * 4);
    points.push({
      p: routeIdx,
      d: 0,
      v: (st.mode === "scan" ? 3.2 : st.mode === "resolved" ? 1.9 : 0.9) * (0.7 + Math.random() * 0.6),
      j: (Math.random() - 0.5) * 3,
      tint: 0
    });
  }

  function failX() {
    // x of the first failing check: points pick up the route tint there
    const first = st.checks.findIndex((c) => c.pass === false);
    return first >= 0 ? nodeById(CHECK_IDS[first]).x : Infinity;
  }

  function draw(now, animate) {
    ctx.clearRect(0, 0, w, hgt);
    const routeColor = st.route ? ROUTE_COLOR[st.route] : INK;
    const since = (now - st.resolvedAt) / 1000;
    const scanIdx = st.mode === "scan" ? Math.floor(((now - st.scanStart) / 150) % (CHECK_IDS.length + 2)) - 1 : -9;

    // wires
    ctx.lineWidth = 1;
    const main = nodes.filter((nd) => nd.kind !== "out");
    ctx.strokeStyle = INK4;
    ctx.beginPath();
    ctx.moveTo(main[0].x, main[0].y);
    for (const nd of main.slice(1)) ctx.lineTo(nd.x, nd.y);
    ctx.stroke();
    for (const path of paths) {
      const lit = st.mode === "resolved" && path.route === st.route;
      ctx.strokeStyle = lit ? routeColor : INK4;
      ctx.globalAlpha = st.mode === "resolved" && !lit ? 0.45 : 1;
      ctx.beginPath();
      ctx.moveTo(path.from.x, path.from.y);
      ctx.bezierCurveTo(path.c1[0], path.c1[1], path.c2[0], path.c2[1], path.to.x, path.to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // points
    if (animate) {
      const fx = failX();
      ctx.fillStyle = INK;
      for (let i = points.length - 1; i >= 0; i--) {
        const pt = points[i];
        const path = paths[pt.p];
        pt.d += pt.v;
        if (pt.d >= path.len) { points.splice(i, 1); continue; }
        const [x, y] = at(path, pt.d);
        if (st.mode === "resolved" && x > fx) pt.tint = Math.min(1, pt.tint + 0.08);
        const onBranch = x > nodeById("route").x;
        const jy = onBranch ? 0 : pt.j * Math.sin(pt.d * 0.05 + i);
        ctx.globalAlpha = st.mode === "idle" ? 0.35 : 0.9;
        ctx.fillStyle = pt.tint > 0.5 ? routeColor : INK;
        ctx.fillRect(x - 1, y + jy - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    // nodes
    ctx.font = "500 10px " + getComputedStyle(document.body).getPropertyValue("--mono");
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const nd of nodes) {
      if (nd.kind === "in") {
        ctx.strokeStyle = INK2;
        ctx.strokeRect(nd.x - 4.5, nd.y - 4.5, 9, 9);
        label(nd.x, nd.y - 16, st.labels.in || "INPUT", INK3);
      } else if (nd.kind === "check") {
        const i = CHECK_IDS.indexOf(nd.id);
        const c = st.checks[i];
        const scanning = i === scanIdx;
        if (st.mode === "resolved" && c.pass === false) {
          const pulse = animate ? (since * 0.9) % 1 : 0.4;
          ctx.strokeStyle = routeColor;
          ctx.globalAlpha = 1 - pulse;
          circle(nd.x, nd.y, 6 + pulse * 12, false);
          ctx.globalAlpha = 1;
          circle(nd.x, nd.y, 6, false);
        } else if (st.mode === "resolved" && c.pass) {
          ctx.fillStyle = INK;
          circle(nd.x, nd.y, 4, true);
        } else {
          ctx.strokeStyle = scanning ? INK : INK3;
          ctx.fillStyle = "#0b0c0e";
          circle(nd.x, nd.y, 5, true);
          circle(nd.x, nd.y, 5, false);
        }
        label(nd.x, nd.y - 16, (st.labels[nd.id] || nd.id).toUpperCase(), c.pass === false && st.mode === "resolved" ? routeColor : INK3);
      } else if (nd.kind === "route") {
        ctx.save();
        ctx.translate(nd.x, nd.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = st.mode === "resolved" ? routeColor : INK2;
        ctx.fillStyle = "#0b0c0e";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeRect(-5, -5, 10, 10);
        ctx.restore();
        label(nd.x, nd.y - 16, st.labels.route || "ROUTE", INK3);
      } else if (nd.kind === "out") {
        const lit = st.mode === "resolved" && nd.id === st.route;
        const color = lit ? ROUTE_COLOR[nd.id] : st.mode === "resolved" ? INK4 : INK3;
        const grow = lit ? 1 + 0.25 * Math.max(0, 1 - since * 2) : 1;
        drawGlyph(ctx, nd.id, nd.x + 8, nd.y, 14 * grow, color);
        ctx.textAlign = "left";
        ctx.fillStyle = lit ? ROUTE_COLOR[nd.id] : INK3;
        ctx.fillText(nd.id, nd.x + 22, nd.y + 3.5);
        ctx.textAlign = "center";
      }
    }
  }

  function circle(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    fill ? ctx.fill() : ctx.stroke();
  }
  function label(x, y, text, color, small) {
    ctx.fillStyle = color;
    ctx.font = `${small ? 400 : 500} ${small ? 10 : 9.5}px ${getComputedStyle(document.body).getPropertyValue("--mono")}`;
    ctx.fillText(text, x, y);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = now - (last || now);
    last = now;
    clock += dt;
    const rate = st.mode === "scan" ? 40 : st.mode === "resolved" ? 70 : 260;
    while (clock > rate) { clock -= rate; if (points.length < 160) spawnPoint(); }
    draw(now, true);
  }

  function start() {
    cancelAnimationFrame(raf);
    last = 0;
    if (level === "full" && !document.hidden && canvas.isConnected) raf = requestAnimationFrame(frame);
    else if (ctx) draw(performance.now() + 600, false);
  }

  const ro = new ResizeObserver(() => { layout(); if (level !== "full") draw(performance.now(), false); });
  ro.observe(canvas);
  const offMotion = onMotion((lv) => { level = lv; start(); });
  const onVis = () => start();
  document.addEventListener("visibilitychange", onVis);
  layout();
  start();

  return {
    idle() { st.mode = "idle"; st.route = null; st.checks.forEach((c) => (c.pass = null)); points.length = 0; start(); },
    scan() { st.mode = "scan"; st.scanStart = performance.now(); points.length = 0; start(); },
    resolve(checks, route) {
      st.checks = CHECK_IDS.map((id) => checks.find((c) => c.id === id) || { id, pass: null, detail: "" });
      st.route = route;
      st.mode = "resolved";
      st.resolvedAt = performance.now();
      points.length = 0;
      start();
    },
    setLabels(next) { st.labels = next; if (level !== "full") draw(performance.now(), false); },
    /** Viewport position of the route node (the field is attracted there). */
    anchor() {
      const r = canvas.getBoundingClientRect();
      const nd = nodeById("route");
      return nd ? { x: r.left + nd.x, y: r.top + nd.y } : null;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      offMotion();
      document.removeEventListener("visibilitychange", onVis);
    }
  };
}
