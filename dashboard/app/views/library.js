// Library: everything the pipeline has stored. Status strata (proportional
// bar), intake queue, artifact rows, and a detail pane for lifecycle edits.
import { h, clear, toast, busy, fmtDate } from "../dom.js";
import { api } from "../api.js";
import { t } from "../i18n.js";

const STATUS_COLOR = {
  staged: "#6a7079", deferred: "#4d5259", indexed: "#8a9098", draft: "#c9ced4",
  review_ready: "#f0c36b", audited: "#a99bff", approved: "#8fe3b8",
  superseded: "#3a3f45", rejected: "#ff7a6b", unclassified: "#2c3035"
};

export function mountLibrary(root, { overview, reload }) {
  let data = overview;
  let filter = "all", query = "", selected = null;

  const search = h("input.input", { type: "search", placeholder: t("lib.search"), on: { input: (e) => { query = e.target.value.toLowerCase(); renderRows(); } } });
  const strata = h("div.strata");
  const queue = h("div");
  const rows = h("div.rows");
  const detail = h("aside.detail", { "aria-label": "detail" });
  const main = h("div.lib-main",
    h("div.lib-head",
      h("div.grow", h("span.label", "library"), h("h1.h-view", t("lib.title"))),
      search,
      h("button.btn", { type: "button", on: { click: openMaterial } }, t("lib.material")),
      h("button.btn", { type: "button", on: { click: openCreate } }, t("lib.new"))),
    strata, queue, rows);
  const lib = h("div.lib", main, detail);
  root.append(lib);
  render();

  function render() { renderStrata(); renderQueue(); renderRows(); }

  function renderStrata() {
    const counts = data.statusCounts || {};
    const entries = Object.entries(counts).filter(([, n]) => n > 0);
    const total = entries.reduce((a, [, n]) => a + n, 0) || 1;
    const pick = (s) => { filter = filter === s ? "all" : s; renderStrata(); renderRows(); };
    clear(strata,
      h("div.strata-bar", entries.map(([s, n]) => h("button", {
        type: "button", title: `${s} · ${n}`, "aria-pressed": String(filter === s),
        style: { flexGrow: String(n / total), "--c": STATUS_COLOR[s] || "#6a7079" }, on: { click: () => pick(s) }
      }))),
      h("div.strata-legend",
        h("button", { type: "button", "aria-pressed": String(filter === "all"), on: { click: () => pick("all") } }, `${t("lib.all")} ${data.artifacts.length}`),
        entries.map(([s, n]) => h("button", { type: "button", "aria-pressed": String(filter === s), on: { click: () => pick(s) } },
          h("i", { style: { "--c": STATUS_COLOR[s] } }), `${s} ${n}`))));
  }

  function renderQueue() {
    // Intake items are promoted to 00_raw on arrival (open them); legacy
    // viewpoint submissions still need an explicit promote.
    const intake = (data.submissions?.intake_items || []).map((it) => ({
      title: it.title || it.id, path: it.raw_artifact || it.path, meta: it.route || it.kind, at: it.updated_at || it.created_at, kind: "intake"
    }));
    const views = (data.submissions?.viewpoints || []).map((v) => ({
      title: v.title || v.path, path: v.path, meta: v.routing_hint || "viewpoint", at: v.updated_at || v.created_at, kind: "viewpoint", promoted: v.promoted
    }));
    const items = [...intake, ...views].sort((a, b) => String(b.at || "").localeCompare(String(a.at || ""))).slice(0, 6);
    if (!items.length) return clear(queue);
    clear(queue, h("div.section",
      h("div.section-head", h("span.label", `${t("lib.queue")} · ${data.submissions?.queue_count ?? 0}`), h("hr.rule")),
      h("div.queue", items.map((it) => {
        let action;
        if (it.kind === "intake") action = h("button.btn.small", { type: "button", on: { click: () => open(it.path) } }, "raw →");
        else if (it.promoted) action = h("span.chip", "promoted");
        else {
          action = h("button.btn.small", { type: "button" }, t("lib.promote"));
          action.addEventListener("click", () => promote(action, it.path));
        }
        return h("div.queue-item", h("div", h("strong", it.title), h("span", `${it.meta || ""} · ${fmtDate(it.at)}`)), action);
      }))));
  }

  async function promote(btn, path) {
    await busy(btn, async () => {
      try { await api.promote(path); toast("promoted", "ok"); await refresh(); }
      catch (err) { toast(err.message, "bad"); }
    });
  }

  function filtered() {
    return data.artifacts.filter((a) =>
      (filter === "all" || a.status === filter || (filter === "unclassified" && !a.status)) &&
      (!query || [a.path, a.type, a.owner_role, a.status].join(" ").toLowerCase().includes(query)));
  }

  function renderRows() {
    const list = filtered();
    clear(rows,
      h("div.row.row-head", h("span"), h("span", t("lib.file")), h("span.cell.opt", t("lib.type")), h("span.cell.opt", t("lib.owner")), h("span", t("lib.updated"))),
      list.length ? list.map((a) => h("button.row", {
        type: "button", "aria-current": String(selected === a.path), on: { click: () => open(a.path) }
      },
        h("span.dot", { style: { background: STATUS_COLOR[a.status] || STATUS_COLOR.unclassified } }),
        h("span.name", { title: a.path }, a.path),
        h("span.cell.opt", a.type || "—"),
        h("span.cell.opt", a.owner_role || "—"),
        h("span.cell", fmtDate(a.updated_at || a.created_at).slice(0, 10)))) : h("p.empty", t("lib.noMatch")));
  }

  async function open(path) {
    selected = path;
    renderRows();
    lib.classList.add("detail-open");
    clear(detail, h("div.detail-inner", h("p.dim", "…")));
    try { renderDetail(await api.artifact(path)); }
    catch (err) { clear(detail, h("div.detail-inner", h("div.error-box", err.message))); }
  }

  function close() { selected = null; lib.classList.remove("detail-open"); renderRows(); }

  function renderDetail(res) {
    const a = res.artifact;
    const statuses = [a.status, ...(res.allowed_next_statuses || [])].filter((v, i, arr) => v && arr.indexOf(v) === i);
    const roles = Object.keys(data.permissions?.roles || {});
    const status = h("select.select", statuses.map((s) => h("option", { value: s, selected: s === a.status }, s)));
    const owner = h("select.select", ["", ...roles].map((r) => h("option", { value: r, selected: r === a.owner_role }, r || "—")));
    const review = h("input.input", { type: "date", value: a.review_at || "" });
    const note = h("textarea.textarea", { rows: 2 });
    const save = h("button.btn.primary", { type: "button", on: { click: () => busy(save, async () => {
      try {
        await api.saveArtifact(a.path, { status: status.value, owner_role: owner.value, review_at: review.value, note: note.value });
        toast(t("lib.saved"), "ok");
        await refresh();
        open(a.path);
      } catch (err) { toast(err.message, "bad"); }
    }) } }, t("lib.save"));
    clear(detail, h("div.detail-inner",
      h("div.detail-top", h("h2", a.path), h("button.btn.ghost.small", { type: "button", on: { click: close }, "aria-label": t("lib.close") }, "✕")),
      h("div.chips", h("span.chip", a.type || "—"), h("span.chip", a.status || "unclassified"), a.source_refs ? h("span.chip", String(a.source_refs)) : null),
      h("div.detail-grid",
        h("label.field-row", h("span.label", t("lib.status")), status),
        h("label.field-row", h("span.label", t("lib.owner")), owner),
        h("label.field-row", h("span.label", t("lib.review")), review),
        h("div.field-row", h("span.label", " "), save),
        h("label.field-row.span-2", h("span.label", t("lib.note")), note)),
      h("div.section", h("div.section-head", h("span.label", t("lib.content")), h("hr.rule")),
        h("pre.preview", String(res.content || "").slice(0, 12000))),
      (res.events || []).length ? h("div.section", h("div.section-head", h("span.label", t("lib.events")), h("hr.rule")),
        h("div.events", res.events.slice(-12).reverse().map((ev) => h("div", h("time", fmtDate(ev.at || ev.timestamp).slice(0, 16)), h("span", [ev.action, ev.from && `${ev.from} → ${ev.to}`, ev.note].filter(Boolean).join(" · ")))))) : null));
  }

  function sheet(title, fields, onSubmit, submitLabel) {
    const dlg = h("dialog.sheet");
    const submit = h("button.btn.primary", { type: "submit" }, submitLabel);
    const formEl = h("form", { method: "dialog", on: { submit: async (e) => {
      e.preventDefault();
      await busy(submit, async () => {
        try { await onSubmit(formEl); dlg.close(); }
        catch (err) { toast(err.message, "bad"); }
      });
    } } }, h("h2", title), fields, h("div.actions", h("button.btn.ghost", { type: "button", on: { click: () => dlg.close() } }, t("cancel")), submit));
    dlg.append(formEl);
    dlg.addEventListener("close", () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    formEl.querySelector("textarea, input")?.focus();
  }

  function openMaterial() {
    sheet(t("lib.material"), [
      h("label.field-row", h("span.label", t("lib.materialText")), h("textarea.textarea", { name: "text", rows: 7 })),
      h("label.field-row", h("span.label", t("lib.files")), h("input.input", { name: "files", type: "file", multiple: true }))
    ], async (f) => {
      const files = await Promise.all([...f.elements.files.files].map((file) => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res({ name: file.name, type: file.type, size: file.size, dataUrl: r.result });
        r.onerror = () => rej(new Error(`Cannot read ${file.name}`));
        r.readAsDataURL(file);
      })));
      const res = await api.intake(f.elements.text.value.trim(), files);
      toast(`stored · ${res.intake?.route || res.route || "queued"}`, "ok", 4800);
      await refresh();
    }, t("lib.store"));
  }

  function openCreate() {
    const roles = Object.keys(data.permissions?.roles || {});
    sheet(t("lib.new"), [
      h("label.field-row", h("span.label", t("lib.title2")), h("input.input", { name: "title", required: true })),
      h("div.grid-2",
        h("label.field-row", h("span.label", t("lib.type")), h("select.select", { name: "type" }, ["decision_log", "action_plan", "audit_report", "memory_candidate", "raw"].map((v) => h("option", { value: v }, v)))),
        h("label.field-row", h("span.label", t("lib.owner")), h("select.select", { name: "owner_role" }, roles.map((r) => h("option", { value: r }, r))))),
      h("div.grid-2",
        h("label.field-row", h("span.label", t("lib.review")), h("input.input", { name: "review_at", type: "date" })),
        h("label.field-row", h("span.label", t("lib.sourceRef")), h("input.input.mono", { name: "source_ref" }))),
      h("label.field-row", h("span.label", t("lib.note")), h("textarea.textarea", { name: "note", rows: 2 }))
    ], async (f) => {
      const fields = Object.fromEntries(new FormData(f).entries());
      const res = await api.createArtifact(fields);
      toast(`created · ${res.path || res.artifact?.path || ""}`, "ok");
      await refresh();
    }, t("lib.create"));
  }

  async function refresh() {
    data = await reload();
    render();
  }

  return { destroy() {} };
}
