// Route glyphs: each route is the same square at a different level of
// subdivision. accept = whole; revise = split, one part missing (needs
// repair); quarantine = an isolated core inside a boundary; discard =
// dissolved into points. Used in SVG (DOM) and canvas (network) alike.
export const ROUTES = ["accept", "revise", "quarantine", "discard"];
export const ROUTE_COLOR = { accept: "#8fe3b8", revise: "#f0c36b", quarantine: "#a99bff", discard: "#ff7a6b", idle: "#454a51" };

const DISCARD_DOTS = [[0,0],[2,0],[1,1],[3,1],[0,2],[3,2],[1,3],[2,3]];

export function glyphSvg(route) {
  const s = 'stroke="currentColor" stroke-width="1.5" fill="none"';
  const f = 'fill="currentColor"';
  const body = {
    accept: `<rect x="4" y="4" width="40" height="40" ${f}/>`,
    revise: `<rect x="4" y="4" width="19" height="19" ${f}/><rect x="25" y="4" width="19" height="19" ${f}/><rect x="4" y="25" width="19" height="19" ${f}/><rect x="25.75" y="25.75" width="17.5" height="17.5" ${s} stroke-dasharray="3 3"/>`,
    quarantine: `<rect x="4.75" y="4.75" width="38.5" height="38.5" ${s}/><rect x="17" y="17" width="14" height="14" ${f}/>`,
    discard: DISCARD_DOTS.map(([x, y]) => `<rect x="${6 + x * 10}" y="${6 + y * 10}" width="6" height="6" ${f}/>`).join(""),
    idle: `<rect x="4.75" y="4.75" width="38.5" height="38.5" ${s} opacity=".5"/><path d="M24 5v38M5 24h38" stroke="currentColor" stroke-width="1" opacity=".3"/>`
  }[route] || "";
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
}

export function drawGlyph(ctx, route, cx, cy, size, color, alpha = 1) {
  const x = cx - size / 2, y = cy - size / 2, u = size / 48;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const r = (a, b, w, hh) => ctx.fillRect(x + a * u, y + b * u, w * u, hh * u);
  if (route === "accept") r(4, 4, 40, 40);
  else if (route === "revise") {
    r(4, 4, 19, 19); r(25, 4, 19, 19); r(4, 25, 19, 19);
    ctx.setLineDash([2, 2]); ctx.strokeRect(x + 25.5 * u, y + 25.5 * u, 18 * u, 18 * u); ctx.setLineDash([]);
  } else if (route === "quarantine") {
    ctx.strokeRect(x + 4.5 * u, y + 4.5 * u, 39 * u, 39 * u); r(17, 17, 14, 14);
  } else if (route === "discard") {
    for (const [a, b] of DISCARD_DOTS) r(6 + a * 10, 6 + b * 10, 6, 6);
  }
  ctx.restore();
}

// Rail icons, same visual language.
export const RAIL = {
  gate: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="3" cy="9" r="1.6"/><path d="M4.6 9H8"/><rect x="8" y="6.5" width="5" height="5"/><path d="M13 9l3-4M13 9h3M13 9l3 4"/></svg>`,
  library: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="14" height="14"/><path d="M9 2v14M2 9h7M9 12.5h7M12.5 9v7"/></svg>`,
  system: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="9" cy="9" r="2.4"/><circle cx="9" cy="9" r="6.5" stroke-dasharray="2 2.2"/></svg>`
};
