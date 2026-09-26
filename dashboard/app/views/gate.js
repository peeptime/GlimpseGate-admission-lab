// Gate view: paste → decision → choose how to admit → contract.
// Everything shown comes from the SDK via /api/v1/admission/*.
import { h, clear, toast, busy } from "../dom.js";
import { api } from "../api.js";
import { t, getLang } from "../i18n.js";
import { glyphSvg } from "../glyphs.js";
import { createNetwork } from "../fx/network.js";
import { clamp } from "../motion.js";

const STORE = "glimpsegate.gate";
const EXAMPLES = {
  overgen: { text: "The user always wants every AI output remembered permanently." },
  circular: { text: "The migration plan is safe because the AI summary says every blocker is resolved." },
  bounded: {
    text: "We decided to keep Markdown as the source of truth for project notes.\nsource: conversation:2026-09-20-standup\nreview: review-ledger:2026-09-21",
    risk_level: "low", evidence_strength: "strong", boundary: "This repository, until the next architecture review."
  }
};
const MIN_SCAN_MS = 620; // long enough to read the scan, short enough not to stall

export function mountGate(root, { field }) {
  const saved = JSON.parse(sessionStorage.getItem(STORE) || "{}");
  const form = {
    autorun: Boolean(saved.autorun),
    text: saved.text || "",
    source_refs: saved.source_refs || "",
    audit_refs: saved.audit_refs || "",
    risk_level: saved.risk_level || "medium",
    evidence_strength: saved.evidence_strength || "",
    boundary: saved.boundary || ""
  };
  let lastInput = null, lastResult = null, selection = null, extras = { evidence_refs: "", reviewer: "", human_reviewed: false };
  const persist = () => sessionStorage.setItem(STORE, JSON.stringify(form));

  // ── input column
  const material = h("textarea.material", {
    placeholder: t("gate.placeholder"), spellcheck: false, value: form.text, "aria-label": t("gate.title"),
    on: {
      input: () => { form.text = material.value; form.autorun = false; persist(); energize(); },
      keydown: (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }
    }
  });
  const srcRefs = h("textarea.textarea.mono", { rows: 2, value: form.source_refs, on: { input: (e) => { form.source_refs = e.target.value; persist(); } } });
  const audRefs = h("textarea.textarea.mono", { rows: 2, value: form.audit_refs, on: { input: (e) => { form.audit_refs = e.target.value; persist(); } } });
  const boundary = h("input.input", { value: form.boundary, placeholder: t("gate.boundaryPh"), on: { input: (e) => { form.boundary = e.target.value; persist(); } } });
  const riskSeg = seg(["low", "medium", "high"], () => form.risk_level, (v) => { form.risk_level = v; persist(); });
  const strengthSeg = seg(["weak", "moderate", "strong"], () => form.evidence_strength, (v) => { form.evidence_strength = form.evidence_strength === v ? "" : v; persist(); });
  const evidenceOpen = Boolean(form.source_refs || form.audit_refs || form.boundary);

  const runBtn = h("button.btn.primary", { type: "button", on: { click: () => run() } }, t("gate.run"), " ", h("kbd", "⌘"), h("kbd", "↵"));
  const captureBtn = h("button.btn.ghost", { type: "button", on: { click: () => capture() } }, t("gate.capture"));

  const input = h("section.gate-input",
    h("div.gate-intro", h("span.label", "admission"), h("h1.h-view", t("gate.title")), h("p", t("gate.intro"))),
    material,
    h("div.examples", h("span.label", t("gate.examples")),
      Object.keys(EXAMPLES).map((k) => h("button.chip", { type: "button", on: { click: () => loadExample(k) } }, t(`ex.${k}`)))),
    h("details.evidence", { open: evidenceOpen },
      h("summary", h("span.label", t("gate.evidence")), h("span.hint", t("gate.evidenceHint"))),
      h("div.evidence-body",
        h("label.field-row", h("span.label", t("gate.sourceRefs")), srcRefs),
        h("label.field-row", h("span.label", t("gate.auditRefs")), audRefs),
        h("div.field-row", h("span.label", t("gate.risk")), riskSeg.el),
        h("div.field-row", h("span.label", "evidence"), strengthSeg.el),
        h("label.field-row.span-2", h("span.label", t("gate.boundary")), boundary),
        h("p.hint.span-2", t("gate.refsHint")))),
    h("div.actions", runBtn, captureBtn)
  );

  // ── output column
  const canvas = h("canvas.network", { "aria-hidden": "true" });
  const netWrap = h("div.network-wrap", canvas, h("span.network-caption", "sdk decision tree"));
  const verdict = h("div.verdict.idle", { "aria-live": "polite" });
  const body = h("div.section-stack");
  const result = h("section.result", verdict, body);
  const out = h("section.gate-out", netWrap, result);

  const gate = h("div.gate", input, out);
  root.append(gate);

  const network = createNetwork(canvas, { labels: netLabels() });
  renderIdle();
  energize();
  api.meta().then((m) => { netWrap.querySelector(".network-caption").textContent = `sdk decision tree · api ${m.api_version}`; }).catch(() => {});

  // ── behavior
  function netLabels() {
    return { in: "input", route: "route", source: t("check.source"), audit: t("check.audit"), loop: t("check.loop"), scope: t("check.scope") };
  }

  function energize() {
    field.set({ energy: clamp(0.12 + form.text.length / 1400, 0.12, 1) });
  }

  function loadExample(key) {
    const ex = EXAMPLES[key];
    Object.assign(form, { source_refs: "", audit_refs: "", boundary: "", risk_level: "medium", evidence_strength: "" }, ex);
    material.value = form.text; srcRefs.value = form.source_refs; audRefs.value = form.audit_refs; boundary.value = form.boundary;
    riskSeg.sync(); strengthSeg.sync();
    persist(); energize();
    run();
  }

  function payload() {
    const lines = (s) => s.split(/\n/).map((x) => x.trim()).filter(Boolean);
    return {
      lang: getLang() === "zh" ? "zh-CN" : "en",
      text: form.text,
      source_refs: lines(form.source_refs),
      audit_refs: lines(form.audit_refs),
      risk_level: form.risk_level,
      evidence_strength: form.evidence_strength || undefined,
      boundary: form.boundary
    };
  }

  async function run() {
    if (!form.text.trim()) { material.focus(); return; }
    const input = payload();
    network.scan();
    field.set({ attract: network.anchor(), route: null });
    renderRunning();
    const started = performance.now();
    await busy(runBtn, async () => {
      try {
        const res = await api.audit(input);
        await wait(Math.max(0, MIN_SCAN_MS - (performance.now() - started)));
        lastInput = input; lastResult = res; selection = null;
        form.autorun = true; persist(); // restore (and re-localize) the result on remount / language switch
        network.resolve(res.checks, res.decision);
        field.set({ attract: null, route: res.decision });
        renderResult(res);
      } catch (err) {
        network.idle();
        field.set({ attract: null });
        form.autorun = false; persist();
        renderError(err.message);
      }
    });
  }

  async function capture() {
    if (!form.text.trim()) { material.focus(); return; }
    await busy(captureBtn, async () => {
      try {
        const res = await api.capture(form.text, form.text.split("\n")[0].slice(0, 60));
        toast(`${t("captured")} · ${res.audit?.routing_decision || ""} · ${res.packet || ""}`, "ok", 5200);
      } catch (err) { toast(err.message, "bad"); }
    });
  }

  function setVerdict(route, word, meaning) {
    verdict.className = `verdict${route ? "" : " idle"}`;
    gate.dataset.route = route || "";
    clear(verdict,
      h("div.verdict-glyph", { html: glyphSvg(route || "idle") }),
      h("p.verdict-word", word),
      h("p.verdict-meaning", meaning));
  }

  function renderIdle() {
    setVerdict(null, t("gate.idle"), t("gate.idleMeaning"));
    clear(body);
  }
  function renderRunning() {
    setVerdict(null, t("gate.running"), "…");
    clear(body);
  }
  function renderError(msg) {
    setVerdict(null, "error", "");
    clear(body, h("div.error-box", msg));
  }

  function renderResult(res) {
    setVerdict(res.decision, res.decision, t(`route.${res.decision}`));
    clear(body,
      section(t("gate.checks"),
        h("div.checks", res.checks.map((c) => h(`div.check.${c.pass ? "pass" : "fail"}`,
          h("strong", t(`check.${c.id}`)), h("span", c.detail))))),
      langBar(res.feedback_lang),
      res.required_fixes.length ? section(t("gate.fixes"), h("ul.fixes", (res.required_fixes_l10n || res.required_fixes).map((f) => h("li", lt(f))))) : null,
      res.reasons.length ? h("div.chips", res.reasons.map((r) => h("span.chip", r))) : null,
      admitSection(res),
      h("div#contractSlot")
    );
  }

  function admitSection(res) {
    let choices = res.chain.suggested_choices || [];
    const gapText = Object.fromEntries((res.chain.missing_evidence || []).map((g) => [g.id, (g.description_l10n || [g.description]).map(lt)]));
    if (!choices.length) {
      choices = [{ gap_id: "human_review", options: ["A", "B", "C"].map((id) => ({ id, label: t(`hr.${id}.label`), action: t(`hr.${id}.action`) })) }];
    }
    const buildBtn = h("button.btn.primary", { type: "button", disabled: true, on: { click: () => build(buildBtn) } }, t("gate.build"));
    const optionButtons = [];
    // Named failure-mode gaps first; derived "required_evidence:*" / warning
    // gaps repeat them in longer form, so they sit behind a disclosure.
    const isDerived = (g) => /^(required_evidence|warning):/.test(g.gap_id);
    const gapRow = (g) => h("div.gap",
      h("div.gap-id", isDerived(g) ? (gapText[g.gap_id] || g.gap_id) : g.gap_id, !isDerived(g) && gapText[g.gap_id] ? h("small", gapText[g.gap_id]) : null),
      h("div.options", g.options.map((o) => {
        const mode = o.admission_policy?.admission_mode;
        const btn = h("button.option", {
          type: "button", "aria-pressed": "false",
          on: { click: () => {
            selection = { gap_id: g.gap_id, choice_id: o.id };
            optionButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
            buildBtn.disabled = false;
          } }
        }, h("b", o.id), h("span", lt(o.label_l10n || o.label), mode ? ` → ${mode}` : "", h("em", lt(o.action_l10n || o.action || "")), rightsPreview(o.admission_policy?.future_usage_policy)));
        optionButtons.push(btn);
        return btn;
      })));
    const primary = choices.filter((g) => !isDerived(g));
    const derived = choices.filter(isDerived);
    const gaps = h("div.gaps",
      (primary.length ? primary : derived).map(gapRow),
      primary.length && derived.length ? h("details.more-gaps",
        h("summary.label", `${t("gate.moreGaps")} · ${derived.length}`),
        derived.map(gapRow)) : null);
    const ev = h("input.input.mono", { placeholder: "primary::interview:2026-09-20", value: extras.evidence_refs, on: { input: (e) => (extras.evidence_refs = e.target.value) } });
    const rv = h("input.input", { placeholder: "name", value: extras.reviewer, on: { input: (e) => (extras.reviewer = e.target.value) } });
    const rd = h("input", { type: "checkbox", checked: extras.human_reviewed, on: { change: (e) => (extras.human_reviewed = e.target.checked) } });
    return section(t("gate.admit"),
      h("p.hint", t("gate.admitHint")),
      gaps,
      h("div.option-extra",
        h("label.field-row", h("span.label", t("gate.evidenceRefs")), ev),
        h("div.field-row", h("span.label", t("gate.reviewer")), rv, h("label.hint", { style: { display: "flex", gap: "8px", alignItems: "center" } }, rd, t("gate.reviewed")))),
      h("div.actions", buildBtn));
  }

  async function build(btn) {
    if (!selection || !lastInput) return;
    const sel = {
      ...selection,
      evidence_refs: extras.evidence_refs.split(/[\n,]/).map((x) => x.trim()).filter(Boolean),
      reviewer: extras.reviewer.trim() || undefined,
      human_reviewed: extras.human_reviewed ? "true" : undefined
    };
    await busy(btn, async () => {
      try {
        const res = await api.contract(lastInput, sel);
        renderContract(res.contract, res.l10n);
      } catch (err) { toast(err.message, "bad"); }
    });
  }

  function renderContract(c, l10n = {}) {
    const slot = body.querySelector("#contractSlot");
    const u = c.future_usage_policy;
    const right = (on, key) => h(`div.right.${on ? "on" : "off"}`, h("i"), t(key));
    const card = h("div.contract",
      h("div.contract-main",
        h("span.label", t("gate.objectType")),
        h(`div.contract-type.${c.admitted_object.object_type}`, c.admitted_object.object_type),
        h("span.dim.mono", `source: ${c.admitted_object.object_source} · choice ${c.selected_choice.gap_id}/${c.selected_choice.choice_id}`),
        c.forbidden_uses.length ? h("div.chips", c.forbidden_uses.map((f) => h("span.chip", `✕ ${f}`))) : null),
      h("div.contract-rights",
        h("span.label", t("gate.rights")),
        right(u.can_use_as_fact, "right.fact"),
        right(u.can_participate_in_reasoning, "right.reason"),
        right(u.can_trigger_action, "right.action"),
        h("span.dim.mono", `recheck: ${c.recheck?.required ? "required" : "no"} · ${c.contract_version}`)),
      c.pending_upgrade ? h("div.pending",
        h("strong", t("gate.pending")),
        h("span.muted", t("gate.pendingWhy", { req: c.pending_upgrade.requested_object_type })),
        h("ul", (l10n.pending_requires || c.pending_upgrade.requires).map((r) => h("li", lt(r))))) : null,
      h("div.contract-foot",
        h("button.btn.small", { type: "button", on: { click: () => copy(JSON.stringify(c, null, 2)) } }, t("gate.copyJson")),
        h("button.btn.small", { type: "button", on: { click: () => copy(markdown(c)) } }, t("gate.copyMd"))));
    clear(slot, section(t("gate.contract"), card));
    card.scrollIntoView({ behavior: document.documentElement.dataset.motion === "full" ? "smooth" : "auto", block: "nearest" });
  }

  function markdown(c) {
    const u = c.future_usage_policy;
    return [
      "---", "provenance:", "  ai_assisted: true", `  human_reviewed: ${c.user_judgment?.human_reviewed || "declined"}`,
      `  reviewer: ${c.user_judgment?.reviewer || "project_owner_pending"}`, `  contract_version: ${c.contract_version}`, "---", "",
      `# Admission: ${c.admitted_object.object_type}`, "",
      `> ${c.admitted_object.claim.replace(/\n/g, "\n> ")}`, "",
      `- route at admission: ${c.admitted_object.routing_decision_at_admission}`,
      `- choice: ${c.selected_choice.gap_id} / ${c.selected_choice.choice_id} — ${c.selected_choice.label}`,
      `- cite as fact: ${u.can_use_as_fact}`, `- feed reasoning: ${u.can_participate_in_reasoning}`, `- trigger action: ${u.can_trigger_action}`,
      `- forbidden: ${c.forbidden_uses.join(", ") || "none"}`,
      c.pending_upgrade ? `- pending upgrade to ${c.pending_upgrade.requested_object_type}: ${c.pending_upgrade.requires.join("; ")}` : null,
      ""
    ].filter((x) => x !== null).join("\n");
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(t("copied"), "ok", 1800); }
    catch { toast("Clipboard unavailable", "bad"); }
  }

  if (saved.text && saved.autorun) run();

  return {
    destroy() { network.destroy(); field.set({ attract: null }); },
    relabel() { network.setLabels(netLabels()); }
  };
}

// Language-tagged feedback. A translation is framing, not source: translated
// text carries a 译 mark and its canonical English; untranslated text in a zh
// view is marked EN. The result's 原文 toggle swaps every tagged line at once.
function lt(item) {
  if (item === null || item === undefined) return "";
  if (typeof item !== "object") return String(item);
  const mark = item.translated ? h("sup.lt-mark", { title: "translated · canonical English kept" }, t("lt.translated"))
    : item.fallback ? h("sup.lt-mark.fb", { title: "no translation yet · canonical text" }, "EN") : null;
  if (!item.translated) return h("span.lt", item.text, mark);
  return h("span.lt", { title: item.original, "data-code": item.code || "" },
    h("span.l10n", item.text), h("span.orig", item.original), mark);
}

function langBar(fl) {
  if (!fl || fl.requested !== "zh-CN") return null;
  const btn = h("button.btn.ghost.small", { type: "button" }, t("lt.showOriginal"));
  btn.addEventListener("click", () => {
    const root = btn.closest(".result");
    const on = root.classList.toggle("show-original");
    btn.textContent = on ? t("lt.showTranslated") : t("lt.showOriginal");
  });
  return h("div.lang-bar",
    h("span.label", `${fl.lang} · ${fl.register}`),
    h("span.hint", t("lt.note", { n: fl.translated, f: fl.fallback })),
    btn);
}

// What an option grants, shown before choosing. The fact permission is always
// drawn locked: the contract only grants it once evidence or a named review
// arrives (2.3.0 evidence condition). Preview only — the server decides.
function rightsPreview(u) {
  if (!u) return null;
  const mark = (state, key) => h(`i.rp.${state}`, state === "locked" ? `${t(key)} · ${t("right.locked")}` : t(key));
  return h("span.rights-preview",
    mark(u.can_use_as_fact ? "locked" : "off", "right.fact"),
    mark(u.can_participate_in_reasoning ? "on" : "off", "right.reason"),
    mark(u.can_trigger_action ? "on" : "off", "right.action"));
}

function section(title, ...children) {
  return h("div.section", h("div.section-head", h("span.label", title), h("hr.rule")), ...children);
}

function seg(values, get, set) {
  const el = h("div.seg");
  const buttons = values.map((v) => h("button", { type: "button", on: { click: () => { set(v); sync(); } } }, v));
  el.append(...buttons);
  function sync() { buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(values[i] === get()))); }
  sync();
  return { el, sync };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
