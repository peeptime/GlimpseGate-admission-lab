// SDK-backed admission endpoints for the dashboard (v3).
//
// Before v3 the GUI had its own regex auditor (liteAudit in the server and a
// copy in lite.html), so GUI routes could disagree with the SDK and the 2.3.0
// admission-contract evidence rule never reached GUI users. Every GUI audit
// now goes through the same SDK functions an integrator calls.
import {
  audit,
  buildEvidenceChain,
  buildAdmissionContract,
  MEMORY_OBJECT_TYPES,
  MERCURY_AUDIT_API_VERSION,
  ADMISSION_CONTRACT_VERSION
} from "../../src/mercury-audit/index.mjs";
import { HttpError } from "./http.mjs";
import { localizeView, tagText, normalizeFeedbackLang, FEEDBACK_LANGS } from "./feedback-lang.mjs";

const MAX_TEXT = 20000;
const REF_LINE = /^\s*(?:[-*]\s*)?(source_refs?|sources?|来源|证据|引用|audit_refs?|audit|review(?:ed)?(?:\s+by)?|审计|复核)\s*[:：]\s*(.+)$/i;

/**
 * Pull explicit reference lines out of pasted text:
 *   "source: conversation:2026-09-20"   -> source_refs
 *   "复核：review-ledger:2026-09-21"      -> audit_refs
 * Only explicit lines count. Merely mentioning the word "source" is not a
 * reference (the old lite regex accepted that).
 */
export function extractRefs(text) {
  const source_refs = [];
  const audit_refs = [];
  const claimLines = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const m = REF_LINE.exec(line);
    if (!m) {
      claimLines.push(line);
      continue;
    }
    const target = /^(audit|review|审计|复核)/i.test(m[1]) ? audit_refs : source_refs;
    for (const ref of m[2].split(/[,，;；]\s*/)) if (ref.trim()) target.push(ref.trim());
  }
  return { source_refs, audit_refs, claim: claimLines.join("\n").trim() };
}

function normalizeInput(body = {}) {
  const text = String(body.text ?? "").slice(0, MAX_TEXT);
  const extracted = extractRefs(text);
  const list = (v) => (Array.isArray(v) ? v : v ? String(v).split(/\n|,\s*/) : []).map((x) => String(x).trim()).filter(Boolean);
  const source_refs = [...new Set([...list(body.source_refs), ...extracted.source_refs])];
  const audit_refs = [...new Set([...list(body.audit_refs), ...extracted.audit_refs])];
  const claim = extracted.claim || text.trim();
  if (!claim) throw new HttpError(400, "text is required");
  const risk = ["low", "medium", "high"].includes(body.risk_level) ? body.risk_level : "medium";
  return {
    claim,
    context: {
      source_refs,
      audit_refs,
      risk_level: risk,
      boundary: String(body.boundary || "").slice(0, 500),
      evidence_strength: body.evidence_strength || "",
      capture_source: "dashboard",
      host_system: "glimpsegate-dashboard"
    }
  };
}

function runGate(body) {
  const { claim, context } = normalizeInput(body);
  const result = audit(claim, context);
  const chain = buildEvidenceChain(result);
  return { claim, context, result, chain };
}

/** Compact, UI-shaped view of an SDK result. Raw result stays available. */
function view({ claim, context, result, chain }) {
  return {
    api_version: MERCURY_AUDIT_API_VERSION,
    input: { claim, ...context },
    decision: result.routing_decision,
    reasons: result.reasons,
    failure_modes: result.failure_modes,
    warnings: result.warnings,
    required_fixes: result.required_fixes,
    human_review_required: result.human_review_required,
    checks: gateChecks(result),
    summary: result.content_summary,
    chain: {
      core_claim: chain.core_claim,
      confidence: chain.confidence,
      confidence_basis: chain.confidence_basis,
      evidence_nodes: chain.evidence_nodes,
      missing_evidence: chain.missing_evidence,
      suggested_choices: chain.suggested_choices
    },
    provenance: result.provenance
  };
}

/**
 * The four questions the gate asks, in the order ROUTING-THEORY.md's
 * decision tree asks them. Drives the node network in the GUI.
 */
function gateChecks(result) {
  const fm = new Set(result.failure_modes);
  const controls = new Set((result.reasons || []).filter((r) => r.startsWith("control:")).map((r) => r.slice(8)));
  return [
    { id: "source", label: "Source", pass: !fm.has("missing_source_refs") && !controls.has("source_credibility_floor"), detail: fm.has("missing_source_refs") ? "missing_source_refs" : controls.has("source_credibility_floor") ? "below source floor" : "traceable" },
    { id: "audit", label: "Review", pass: !fm.has("missing_audit_refs"), detail: fm.has("missing_audit_refs") ? "missing_audit_refs" : "review path present" },
    { id: "loop", label: "Independence", pass: !fm.has("circular_reasoning"), detail: fm.has("circular_reasoning") ? "circular_reasoning" : "no self-proof" },
    { id: "scope", label: "Scope", pass: !fm.has("overgeneralization") && !fm.has("unsafe_memory_write"), detail: fm.has("overgeneralization") ? "overgeneralization" : fm.has("unsafe_memory_write") ? "unsafe_memory_write" : "bounded" }
  ];
}

export function registerAdmissionRoutes(router) {
  router.add("GET", "/api/v1/admission/meta", () => ({
    ok: true,
    api_version: MERCURY_AUDIT_API_VERSION,
    contract_version: ADMISSION_CONTRACT_VERSION,
    object_types: MEMORY_OBJECT_TYPES,
    feedback_langs: FEEDBACK_LANGS,
    routes: ["accept", "revise", "quarantine", "discard"]
  }));

  // `lang`: "zh-CN" | "en" | "agent" (default en). Canonical fields never change;
  // localized siblings and a feedback_lang summary are added (feedback-lang.mjs).
  router.add("POST", "/api/v1/admission/audit", ({ body }) => ({ ok: true, ...localizeView(view(runGate(body)), body.lang) }), { body: true });

  // Stateless and tamper-resistant: the server recomputes the chain from the
  // same input instead of trusting a chain echoed back by the client.
  router.add("POST", "/api/v1/admission/contract", ({ body }) => {
    const gate = runGate(body);
    const s = body.selection || {};
    const contract = buildAdmissionContract(gate.chain, {
      gap_id: s.gap_id,
      choice_id: s.choice_id,
      object_type: s.object_type,
      evidence_refs: s.evidence_refs,
      reviewer: s.reviewer,
      human_reviewed: s.human_reviewed,
      note: s.note
    });
    const lang = normalizeFeedbackLang(body.lang);
    const l10n = {
      feedback_lang: { ...FEEDBACK_LANGS[lang], requested: lang },
      selected_label: tagText(contract.selected_choice.label, lang),
      pending_requires: (contract.pending_upgrade?.requires || []).map((r) => tagText(r, lang))
    };
    return { ok: true, decision: gate.result.routing_decision, contract, l10n };
  }, { body: true });

  // Legacy shape for lite.html and existing bookmarklets, now SDK-backed.
  router.add("POST", "/api/lite-audit", ({ body }) => ({ ok: true, result: liteView(runGate({ text: body.text || "" })) }), { body: true });
}

function liteView({ result, chain }) {
  const fm = result.failure_modes;
  return {
    routing_decision: result.routing_decision,
    failure_modes: fm,
    evidence_gap: fm.length ? fm.join(", ") : "No structural evidence gap detected.",
    memory_pollution_risk: pollutionRisk(result.routing_decision, fm),
    required_fixes: result.required_fixes,
    content_summary: result.content_summary,
    human_review_checklist: result.human_review_checklist,
    evidence_chain: { core_claim: chain.core_claim, missing_evidence: chain.missing_evidence, suggested_choices: chain.suggested_choices },
    engine: `sdk ${MERCURY_AUDIT_API_VERSION}`,
    provenance: { ai_assisted: true, human_reviewed: "declined", audit_ref: "src/mercury-audit/index.mjs" }
  };
}

function pollutionRisk(decision, fm) {
  if (decision === "accept") return "Low, assuming references are real and inspectable.";
  if (fm.includes("circular_reasoning")) return "A future agent may treat the AI output as proof of itself.";
  if (fm.includes("missing_source_refs")) return "A plausible claim could become durable memory without inspectable source evidence.";
  return "The claim may be useful, but needs revision before long-term storage.";
}
