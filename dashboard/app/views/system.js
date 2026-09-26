// System: readiness, operation mode, maintenance commands, capabilities,
// lifecycle log, interface preferences.
import { h, clear, toast, busy, fmtDate, download } from "../dom.js";
import { api } from "../api.js";
import { t, getLang } from "../i18n.js";
import { motionLevel, setMotion } from "../motion.js";

export function mountSystem(root, { overview, reload }) {
  let data = overview;
  const wrap = h("div.sys");
  root.append(wrap);
  render();
  loadLog();

  function section(title, ...children) {
    return h("section.section", h("div.section-head", h("span.label", title), h("hr.rule")), ...children);
  }

  function render() {
    const d = data;
    const lang = getLang();
    const loc = (v) => (v && typeof v === "object" ? v[lang] || v.en || v.zh || "" : v || "");

    // readiness
    const ready = h("div.ready", (d.deployment?.items || []).map((it) =>
      h("div", h("span.dot", { class: it.level === "ok" ? "ok" : it.level === "warn" || it.level === "optional" ? "warn" : "error" }),
        h("div", h("strong", it.label), h("p", it.detail)))));

    // operation
    const modes = Object.keys(d.methods?.execution_mode_description || {});
    const modeSeg = h("div.seg", modes.map((m) => h("button", {
      type: "button", "aria-pressed": String(m === d.methods.execution_mode),
      on: { click: () => apply(() => api.setMode(m)) }
    }, m)));
    const persona = h("select.select", { on: { change: (e) => apply(() => api.setPersona(e.target.value)) } },
      (d.methods?.personas ? Object.keys(d.methods.personas) : []).map((p) => h("option", { value: p, selected: p === d.methods.analysis_persona }, p)));
    const provider = h("select.select", { on: { change: (e) => apply(() => api.setProvider(e.target.value)) } },
      Object.keys(d.modelProviders?.providers || {}).map((p) => h("option", { value: p, selected: p === d.modelProviders.active_provider }, p)));

    // commands
    const consoleEl = h("pre.console", "—");
    const commands = h("div.commands", (d.commandAllowlist || []).map((script) => {
      const b = h("button.btn.small.mono", { type: "button" }, script);
      b.addEventListener("click", () => busy(b, async () => {
        clear(consoleEl, `$ npm run ${script}\n…`);
        try {
          const r = await api.run(script);
          clear(consoleEl,
            h("span", { class: r.ok ? "ok" : "bad" }, `$ npm run ${script}  → exit ${r.exitCode}\n\n`),
            [r.stdout, r.stderr].filter(Boolean).join("\n").trim() || "(no output)");
        } catch (err) { clear(consoleEl, h("span.bad", err.message)); }
      }));
      return b;
    }));

    // capabilities
    const caps = h("div.caps", Object.entries(d.capabilities?.capabilities || {}).map(([key, cap]) => {
      const b = h("button.btn.small", { type: "button", "data-status": cap.status }, cap.status);
      b.addEventListener("click", () => {
        const next = cap.status === "active" ? "reserved" : cap.status === "reserved" ? "disabled" : "active";
        apply(() => api.setCapability(key, next));
      });
      return h("div.cap", h("div", h("strong", loc(cap.label) || key), h("p", loc(cap.current_use) || loc(cap.original_purpose))), b);
    }));

    // interface
    const motion = h("div.seg", ["full", "calm", "off"].map((m) => {
      const b = h("button", { type: "button", "aria-pressed": String(motionLevel() === m) }, t(`motion.${m}`));
      b.addEventListener("click", () => { setMotion(m); render(); });
      return b;
    }));

    const diag = h("button.btn.small", { type: "button" }, t("sys.diag"));
    diag.addEventListener("click", () => busy(diag, async () => {
      const r = await api.diagnostics();
      download(`glimpsegate-diagnostics-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(r, null, 2));
    }));
    const upd = h("button.btn.small", { type: "button" }, t("sys.update"));
    upd.addEventListener("click", () => busy(upd, async () => {
      try {
        const r = await api.updateCheck();
        toast(r.update_available ? `${t("sys.newer")}: ${r.latest_version}` : `${t("sys.upToDate")} · ${r.current_version}`, r.update_available ? "info" : "ok", 5000);
      } catch (err) { toast(err.message, "bad"); }
    }));
    const clean = h("button.btn.small", { type: "button" }, t("sys.clean"));
    clean.addEventListener("click", () => {
      if (!confirm(t("sys.cleanConfirm"))) return;
      busy(clean, async () => { await api.cleanDist(); toast("dist/ cleaned", "ok"); });
    });

    clear(wrap,
      h("div", h("span.label", "system"), h("h1.h-view", t("sys.title"))),
      h("div.sys-grid",
        section(`${t("sys.ready")} · ${d.deployment?.ready ? "ready" : "not ready"}`, ready),
        section(t("sys.modes"),
          h("div.kv", h("span", t("sys.execMode")), modeSeg, h("p", loc(d.methods?.execution_mode_description?.[d.methods.execution_mode]))),
          h("label.kv", h("span", t("sys.persona")), persona),
          h("label.kv", h("span", t("sys.provider")), provider),
          h("div.kv", h("span", t("sys.motion")), motion),
          h("div.kv", h("span", "GUI"), h("a.mono", { href: "/classic/" }, t("sys.classic"))))),
      section(t("sys.commands"), commands, consoleEl),
      h("div.sys-grid",
        section(t("sys.caps"), caps),
        section(t("sys.log"), h("div.timeline#log", h("p.empty", "…")))),
      section(t("sys.maint"), h("div.actions", diag, upd, clean),
        h("p.hint", `v${d.packageVersion} · node ${d.nodeVersion} · ${d.git?.branch || ""} ${String(d.git?.commit || "").slice(0, 7)}`)));
    loadLog();
  }

  async function apply(fn) {
    try {
      await fn();
      data = await reload();
      render();
      toast(t("lib.saved"), "ok", 1600);
    } catch (err) { toast(err.message, "bad"); }
  }

  async function loadLog() {
    const box = wrap.querySelector("#log");
    if (!box) return;
    try {
      const { events } = await api.lifecycle();
      const list = (events || []).slice(-40).reverse();
      clear(box, list.length ? list.map((ev) => h("div", h("time", fmtDate(ev.at)), h("b", ev.action || "—"), h("span", [ev.path, ev.from && `${ev.from} → ${ev.to}`].filter(Boolean).join(" · ")))) : h("p.empty", t("sys.noEvents")));
    } catch (err) { clear(box, h("p.empty", err.message)); }
  }

  return { destroy() {} };
}
