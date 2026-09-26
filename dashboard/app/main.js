// GlimpseGate dashboard v3 — entry. Hash routing between three views,
// one shared background field, a command palette, and language switching.
import { $, $$, h, clear, toast } from "./dom.js";
import { api } from "./api.js";
import { t, getLang, setLang, applyStatic, langIsDefault } from "./i18n.js";
import { motionLevel } from "./motion.js";
import { RAIL } from "./glyphs.js";
import { createField } from "./fx/field.js";
import { mountGate } from "./views/gate.js";
import { mountLibrary } from "./views/library.js";
import { mountSystem } from "./views/system.js";

const VIEWS = { gate: mountGate, library: mountLibrary, system: mountSystem };
const app = { overview: null, current: null, name: null };

document.documentElement.dataset.motion = motionLevel();
const field = createField($("#field"));

for (const el of $$("[data-glyph]")) el.innerHTML = RAIL[el.dataset.glyph];
setLang(getLang());
applyStatic();
syncLangButton();

async function loadOverview() {
  app.overview = await api.overview();
  $("#stripMeta").textContent = `v${app.overview.packageVersion} · ${app.overview.artifacts.length} artifacts`;
  return app.overview;
}

async function route() {
  const name = (location.hash.replace(/^#\/?/, "") || "gate").split("?")[0];
  const mount = VIEWS[name] || VIEWS.gate;
  const key = VIEWS[name] ? name : "gate";
  if (app.current?.destroy) app.current.destroy();
  app.name = key;
  for (const a of $$(".rail-nav a")) {
    if (a.dataset.view === key) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  $("#stripView").textContent = t(`nav.${key}`);
  const view = $("#view");
  clear(view);
  if (key !== "gate" && !app.overview) {
    view.append(h("p.empty", { style: { padding: "32px var(--gutter)" } }, "…"));
    try { await loadOverview(); } catch (err) { clear(view, h("div.error-box", { style: { margin: "32px" } }, err.message)); return; }
    clear(view);
  }
  if (key !== "gate") field.set({ route: null, attract: null });
  app.current = mount(view, { field, overview: app.overview, reload: loadOverview });
  $("#stage").focus({ preventScroll: true });
}

function syncLangButton() {
  $("#langToggle").textContent = getLang() === "zh" ? "EN" : "中";
  $("#langToggle").setAttribute("aria-label", getLang() === "zh" ? "Switch to English" : "切换到中文");
}
$("#langToggle").addEventListener("click", () => {
  setLang(getLang() === "zh" ? "en" : "zh");
  applyStatic();
  syncLangButton();
  route();
});

// ── command palette (⌘K / Ctrl+K)
const palette = $("#palette");
const pInput = $("#paletteInput");
const pList = $("#paletteList");
let pItems = [], pIndex = 0;

function commands() {
  const base = [
    { label: t("nav.gate"), hint: "view", run: () => (location.hash = "#/gate") },
    { label: t("nav.library"), hint: "view", run: () => (location.hash = "#/library") },
    { label: t("nav.system"), hint: "view", run: () => (location.hash = "#/system") },
    { label: "Lite", hint: "/lite.html", run: () => window.open("/lite.html", "_blank", "noopener") },
    { label: t("sys.classic"), hint: "/classic/", run: () => (location.href = "/classic/") }
  ];
  const scripts = (app.overview?.commandAllowlist || []).map((s) => ({
    label: `npm run ${s}`, hint: t("cmd.run"),
    run: async () => {
      toast(`npm run ${s} …`);
      try { const r = await api.run(s); toast(`${s} → exit ${r.exitCode}`, r.ok ? "ok" : "bad", 5000); }
      catch (err) { toast(err.message, "bad"); }
    }
  }));
  return [...base, ...scripts];
}
function renderPalette() {
  const q = pInput.value.trim().toLowerCase();
  pItems = commands().filter((c) => !q || c.label.toLowerCase().includes(q));
  pIndex = Math.min(pIndex, Math.max(0, pItems.length - 1));
  clear(pList, pItems.map((c, i) => h("li", { role: "option", "aria-selected": String(i === pIndex), on: { click: () => choose(i), mousemove: () => { pIndex = i; renderPalette(); } } }, c.label, h("small", c.hint))));
}
function choose(i) { const c = pItems[i]; palette.close(); c?.run(); }
async function openPalette() {
  if (!app.overview) loadOverview().then(renderPalette).catch(() => {});
  pInput.value = ""; pIndex = 0; pInput.placeholder = t("palette.ph");
  renderPalette();
  palette.showModal();
  pInput.focus();
}
pInput.addEventListener("input", () => { pIndex = 0; renderPalette(); });
pInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { pIndex = Math.min(pItems.length - 1, pIndex + 1); renderPalette(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { pIndex = Math.max(0, pIndex - 1); renderPalette(); e.preventDefault(); }
  else if (e.key === "Enter") { choose(pIndex); e.preventDefault(); }
});
palette.addEventListener("click", (e) => { if (e.target === palette) palette.close(); });
$("#paletteHint").addEventListener("click", openPalette);
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.open ? palette.close() : openPalette(); }
  if (e.altKey && ["1", "2", "3"].includes(e.key)) location.hash = ["#/gate", "#/library", "#/system"][Number(e.key) - 1];
});

// ── health + server language preference
async function health() {
  const dot = $("#health");
  try {
    const r = await api.health();
    dot.className = "health ok";
    dot.title = `server ${r.version} · package ${r.packageVersion}`;
  } catch {
    dot.className = "health bad";
    dot.title = "server unreachable";
  }
}
health();
setInterval(() => { if (!document.hidden) health(); }, 30000);
if (langIsDefault()) {
  api.overview().then((o) => {
    app.overview = o;
    $("#stripMeta").textContent = `v${o.packageVersion} · ${o.artifacts.length} artifacts`;
    const pref = String(o.preferences?.general?.language || "");
    if (pref && (pref.startsWith("zh") ? "zh" : "en") !== getLang()) {
      setLang(pref.startsWith("zh") ? "zh" : "en");
      applyStatic(); syncLangButton();
      if (app.name !== "gate") route(); else app.current?.relabel?.();
    }
  }).catch(() => {});
} else {
  loadOverview().catch(() => {});
}

window.addEventListener("hashchange", route);
route();
