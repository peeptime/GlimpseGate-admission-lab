// Feedback language tagging (v2.5.0).
//
// The same SDK feedback reaches three ecosystems with different needs:
//
//   zh-CN  Chinese users      — short, outcome-first, mechanic words (docs/COPY-STYLE.md)
//   en     English developers — precise imperatives that keep identifiers (the SDK's own text)
//   agent  agents / tooling   — stable codes + canonical text, never localized prose
//
// Every tagged item says which language and register it is in and whether it is
// a translation. A translation is framing, not source (the same distinction the
// admission contract draws between source_material and model_framing), so the
// canonical English is always carried alongside and untranslated strings are
// marked as fallback instead of silently passing as localized.
//
// The SDK is not changed: this is a display layer over its output.

export const FEEDBACK_LANGS = {
  "zh-CN": { audience: "human", register: "mechanic", ecosystem: "zh-internet", lang: "zh-CN" },
  en: { audience: "human", register: "plain-imperative", ecosystem: "developer", lang: "en" },
  agent: { audience: "machine", register: "canonical", ecosystem: "agent-tooling", lang: "en" }
};
export const FEEDBACK_LANG_VERSION = "2026.09.26.1";

// Exact strings: canonical English → [code, zh-CN].
const EXACT = {
  // required fixes
  "Add concrete source_refs before this claim can enter any durable system.": ["fix.add_source_refs", "补上具体的 source_refs，才能进存档。"],
  "Add audit_refs or run a human/structural audit before durable use.": ["fix.add_audit_refs", "补 audit_refs，或先过一次人工/结构复核。"],
  "Narrow absolute wording or add stronger evidence for the universal claim.": ["fix.narrow_absolute", "收窄绝对化措辞，或补更硬的证据。"],
  "Require human review before any long-term memory write.": ["fix.require_human_review", "写进长期记忆前，必须人工复核。"],
  "Replace self-referential justification with independent evidence.": ["fix.replace_self_proof", "别用它自己证明自己。换成独立证据。"],
  "Remove route-forcing or review-forging instructions from the candidate.": ["fix.remove_forcing", "删掉强推路由、伪造复核的指令。"],
  "Re-audit the original claim without success-metric or acceptance-rate pressure.": ["fix.reaudit_without_pressure", "去掉指标压力，重审一遍原主张。"],
  "Rewrite the claim as a hypothesis or add external evidence.": ["fix.rewrite_as_hypothesis", "改写成假设，或补外部证据。"],
  "Refresh time-sensitive context before using this claim.": ["fix.refresh_context", "有时效的上下文，先刷新再用。"],
  "Resolve or explicitly preserve conflicting evidence before routing.": ["fix.resolve_conflict", "证据有冲突：先解决，或明确保留分歧。"],
  "Resolve reviewer disagreement before promotion.": ["fix.resolve_disagreement", "复核人意见不一。先定结论，再升级。"],
  "Review lifecycle state before durable memory use.": ["fix.review_lifecycle", "进长期记忆前，先查生命周期状态。"],
  "State the boundary: where this claim applies, and where it does not.": ["fix.state_boundary", "写清生效范围：哪里适用，哪里不适用。"],
  // required evidence
  "At least one source reference tied to the original claim.": ["evidence.source_ref", "至少一条对得上原主张的来源。"],
  "At least one audit reference that checks the claim before durable use.": ["evidence.audit_ref", "至少一条入库前的复核记录。"],
  "Independent evidence from outside the agent output being audited.": ["evidence.independent", "来自被审输出之外的独立证据。"],
  "External evidence for the unsupported claim, or a narrower hypothesis statement.": ["evidence.external_or_narrower", "给无支撑的主张补外部证据，或收窄成假设。"],
  "A conflict note explaining which evidence wins and why.": ["evidence.conflict_note", "一条冲突说明：哪条证据胜出，为什么。"],
  "Fresh source context or a time-bound expiry note.": ["evidence.fresh_context", "新鲜来源，或一条带期限的过期说明。"],
  // gap descriptions
  "The claim has no inspectable source reference.": ["gap.missing_source_refs", "没有可查的来源。"],
  "The claim has no audit or review reference.": ["gap.missing_audit_refs", "没有复核记录。"],
  "The claim uses broad language beyond the observed evidence.": ["gap.overgeneralization", "话说得比证据大。"],
  "The claim affects durable memory and needs a stricter admission path.": ["gap.unsafe_memory_write", "会写进长期记忆，要走更严的准入。"],
  "The evidence appears to rely on the AI output itself.": ["gap.circular_reasoning", "证据像是来自 AI 输出本身。"],
  "No structural gap detected; named human review may still be needed before durable use.": ["gap.human_review", "结构上没缺口。入库前可能仍需具名复核。"],
  // option labels
  "Add direct source": ["option.add_direct_source", "补直接来源"],
  "Downgrade to inference": ["option.downgrade_to_inference", "降级为推断"],
  "Quarantine": ["option.quarantine", "进仓库"],
  "Add review note": ["option.add_review_note", "补复核记录"],
  "Request reviewer": ["option.request_reviewer", "找人复核"],
  "Keep declined": ["option.keep_declined", "维持未复核"],
  "Narrow scope": ["option.narrow_scope", "收窄范围"],
  "Add stronger evidence": ["option.add_stronger_evidence", "补更硬的证据"],
  "Reject broad memory": ["option.reject_broad_memory", "不收宽泛记忆"],
  "Add evidence": ["option.add_evidence", "补证据"],
  "Keep as draft": ["option.keep_as_draft", "留作草稿"],
  "Decline": ["option.decline", "拒收"],
  "Require human gate": ["option.require_human_gate", "加一道人工关卡"],
  "Store as temporary note": ["option.store_temporary", "存成临时便签"],
  "Discard memory write": ["option.discard_memory_write", "取消写入"],
  "Find independent evidence": ["option.find_independent_evidence", "找独立证据"],
  "Split hypothesis": ["option.split_hypothesis", "拆成假设"],
  "Discard": ["option.discard", "丢弃"],
  // option actions
  "Attach a direct user statement, transcript, field note, commit, or official source.": ["action.attach_direct_source", "附上原话、记录、现场笔记、commit 或官方来源。"],
  "Mark the claim as AI-assisted inference and keep it out of durable memory.": ["action.mark_inference", "标成 AI 辅助推断，不进长期记忆。"],
  "Keep the material as source evidence only until a source is added.": ["action.keep_as_source_evidence", "只当来源证据保管，等补上来源。"],
  "Attach a named review note, checklist result, or audit report.": ["action.attach_review", "附上具名复核、检查清单结果或审计报告。"],
  "Assign a reviewer before promotion.": ["action.assign_reviewer", "升级前，先指派复核人。"],
  "Leave human_reviewed as declined and do not promote.": ["action.leave_declined", "human_reviewed 保持 declined，不升级。"],
  "Rewrite the claim to the exact observed context.": ["action.rewrite_to_context", "改写到实际观察到的场景。"],
  "Provide repeated direct evidence before retaining the broader claim.": ["action.repeat_evidence", "多次直接证据到位，才留宽泛说法。"],
  "Discard the durable-memory candidate and keep only the raw source.": ["action.discard_candidate_keep_raw", "丢掉长期记忆候选，只留原始来源。"],
  "Attach the missing evidence and rerun the audit.": ["action.attach_and_rerun", "附上缺的证据，再闯一次关。"],
  "Do not promote; keep as source material only.": ["action.keep_as_material", "不升级，只当来源材料。"],
  "Record the claim as declined for durable memory.": ["action.record_declined", "记为：不进长期记忆。"],
  "Keep human_review_required true and record a named review.": ["action.keep_human_gate", "human_review_required 保持 true，记下具名复核。"],
  "Use short-lived context instead of long-term memory.": ["action.use_short_context", "用短期上下文，不进长期记忆。"],
  "Do not write this claim to a memory store.": ["action.do_not_write", "这条主张不写进任何记忆库。"],
  "Use an external source that is not derived from the same AI output.": ["action.use_external_source", "用不来自同一 AI 输出的外部来源。"],
  "Keep the statement as a hypothesis, not as a fact.": ["action.keep_as_hypothesis", "保留为假设，不当事实。"],
  "Reject the claim when no independent support exists.": ["action.reject_without_support", "没有独立支撑，就拒收。"],
  // admission-contract unlock requirements (src/mercury-audit/admission-contract.mjs)
  "evidence_refs: at least one primary or traceable source not already in the evidence chain and not AI-generated": ["unlock.independent_evidence", "evidence_refs：至少一条新来源。要 primary 或 traceable 级，不在现有证据链里，也不是 AI 生成的。"],
  "evidence_refs: at least one primary or traceable, non-AI-generated source": ["unlock.evidence", "evidence_refs：至少一条 primary 或 traceable 级、非 AI 生成的来源。"],
  'or human_reviewed: "true" with a named (non-pending) reviewer': ["unlock.named_review", '或 human_reviewed: "true"，且复核人已具名（非 pending）。'],
  // evidence chain meta
  "Choose A/B/C for each gap, attach evidence if available, then rerun Mercury before promotion.": ["chain.next_action", "每个缺口选 A/B/C。有证据就附上，升级前再闯一次关。"],
  // warning codes (the SDK emits codes; zh gets a sentence, en/agent keep the code)
  "source_credibility_missing": ["warning.source_credibility_missing", "没给来源。"],
  "source_is_only_ai_generated": ["warning.source_is_only_ai_generated", "来源全是 AI 生成的。"]
};

// Templated strings.
const PATTERNS = [
  [/^Add a source at or above credibility floor: ([\w-]+)\.$/, "fix.source_floor", (m) => `补一个 ${m[1]} 级以上的来源。`],
  [/^Add required field: (.+)\.$/, "fix.required_field", (m) => `补上必填字段：${m[1]}。`],
  [/^Resolve missing source_ref target: (.+)\.$/, "fix.missing_ref_target", (m) => `来源引用指向的文件不存在：${m[1]}。`],
  [/^Readable source artifact: (.+)$/, "evidence.readable_artifact", (m) => `可读取的来源文件：${m[1]}`],
  [/^source_floor_not_met:([\w-]+)$/, "warning.source_floor_not_met", (m) => `来源等级不够：要 ${m[1]} 以上。`],
  [/^anti_gaming:([\w-]+)$/, "warning.anti_gaming", (m) => `检测到操纵指令：${m[1]}。`],
  [/^Unknown expected_decision in packet: (.+)$/, "packet.unknown_expected_decision", (m) => `包里的 expected_decision 无法识别：${m[1]}`]
];

// The SDK is itself mixed-language: the human-review checklist in
// audit_rules.mjs is written in Chinese. For the en / agent ecosystems these
// are the untranslated ones. Canonical Chinese → [code, en].
const ZH_EXACT = {
  "请确认核心主张是否真的被原始来源支持。": ["checklist.source.prompt", "Confirm the core claim is really supported by the original source."],
  "原文或可追溯来源支持": ["checklist.source.A", "Supported by the original or a traceable source"],
  "只是 AI 转述或推测": ["checklist.source.B", "Only an AI paraphrase or guess"],
  "不确定 / 需要人工补充说明": ["checklist.source.C", "Unsure / needs a human note"],
  "请确认当前置信度是否匹配证据强度。": ["checklist.confidence.prompt", "Confirm the confidence matches the strength of the evidence."],
  "证据足够，维持当前置信度": ["checklist.confidence.A", "Evidence suffices; keep the confidence"],
  "需要补充证据或降低置信度": ["checklist.confidence.B", "Add evidence or lower the confidence"],
  "不确定 / 需要第二人复核": ["checklist.confidence.C", "Unsure / needs a second reviewer"],
  "请确认这条结论的归属是否正确：用户原话、现场观察、顾问框架，还是 AI 推断。": ["checklist.attribution.prompt", "Confirm the attribution: user's words, field observation, advisor framing, or AI inference."],
  "归属正确，可以保留": ["checklist.attribution.A", "Attribution is correct; keep it"],
  "归属需要改写": ["checklist.attribution.B", "Attribution needs rewriting"],
  "不确定 / 自定义归属": ["checklist.attribution.C", "Unsure / custom attribution"],
  "同意当前处理方式": ["checklist.route.A", "Agree with the current route"],
  "需要修改后再决定": ["checklist.route.B", "Revise first, then decide"],
  "不同意 / 另写处理方式": ["checklist.route.C", "Disagree / write a different route"]
};
const ZH_PATTERNS = [
  [/^请确认处理方式是否应保持为 ([\w-]+)。$/, "checklist.route.prompt", (m) => `Confirm whether the route should stay ${m[1]}.`]
];
const CJK = /[\u4e00-\u9fff]/;

function lookupZh(text) {
  const exact = ZH_EXACT[text];
  if (exact) return { code: exact[0], en: exact[1] };
  for (const [re, code, fn] of ZH_PATTERNS) {
    const m = re.exec(text);
    if (m) return { code, en: fn(m) };
  }
  return null;
}

function lookup(text) {
  const exact = EXACT[text];
  if (exact) return { code: exact[0], zh: exact[1] };
  for (const [re, code, fn] of PATTERNS) {
    const m = re.exec(text);
    if (m) return { code, zh: fn(m) };
  }
  return null;
}

export function normalizeFeedbackLang(value) {
  const v = String(value || "").toLowerCase();
  if (v === "agent" || v === "machine") return "agent";
  if (v.startsWith("zh")) return "zh-CN";
  return "en";
}

/** Tag one canonical SDK string for a target ecosystem. */
export function tagText(text, target = "en") {
  const lang = normalizeFeedbackLang(target);
  const spec = FEEDBACK_LANGS[lang];
  const raw = String(text ?? "");
  // Chinese-source text (SDK checklist): canonical for zh, translated for en/agent.
  if (CJK.test(raw)) {
    const zhHit = lookupZh(raw);
    const zcode = zhHit?.code || null;
    if (lang === "zh-CN") return { text, lang: "zh-CN", register: spec.register, translated: false, fallback: false, code: zcode, original: text };
    if (zhHit) return { text: zhHit.en, lang: "en", register: spec.register, translated: true, fallback: false, code: zcode, original: text };
    return { text, lang: "zh-CN", register: "canonical", translated: false, fallback: true, code: zcode, original: text };
  }
  const hit = lookup(raw);
  const code = hit?.code || null;
  if (lang === "zh-CN") {
    if (hit) return { text: hit.zh, lang: "zh-CN", register: spec.register, translated: true, fallback: false, code, original: text };
    return { text, lang: "en", register: "canonical", translated: false, fallback: true, code, original: text };
  }
  return { text, lang: "en", register: spec.register, translated: false, fallback: false, code, original: text };
}

/**
 * Localize an admission view (from admission-api.mjs) additively: canonical
 * fields stay as they are; *_l10n siblings and a coverage summary are added.
 * For `agent`, prose is not localized; each item gains a stable `code`.
 */
export function localizeView(view, target) {
  const lang = normalizeFeedbackLang(target);
  const spec = FEEDBACK_LANGS[lang];
  let translated = 0, fallback = 0;
  const tag = (s) => {
    const r = tagText(s, lang);
    if (r.translated) translated++;
    if (r.fallback) fallback++;
    return r;
  };
  const splitTag = (s) => String(s).split(/;\s+/).map(tag);

  const out = {
    ...view,
    required_fixes_l10n: view.required_fixes.map(tag),
    warnings_l10n: view.warnings.map(tag),
    chain: {
      ...view.chain,
      missing_evidence: view.chain.missing_evidence.map((g) => ({
        ...g,
        description_l10n: g.id.startsWith("required_fixes") ? splitTag(g.description) : [tag(g.description)]
      })),
      suggested_choices: view.chain.suggested_choices.map((c) => ({
        ...c,
        options: c.options.map((o) => ({ ...o, label_l10n: tag(o.label), action_l10n: tag(o.action) }))
      }))
    }
  };
  out.feedback_lang = {
    ...spec,
    requested: lang,
    version: FEEDBACK_LANG_VERSION,
    translated,
    fallback,
    note: lang === "zh-CN"
      ? "Translations are framing, not source. Canonical English is in `original`; untranslated items are marked fallback."
      : lang === "agent"
        ? "Canonical text only. Key on `code`, not on prose."
        : "Canonical SDK text."
  };
  return out;
}

/** Every catalogued canonical string (used by coverage and copy-lint tests). */
export function catalogEntries() {
  return [
    ...Object.entries(EXACT).map(([en, [code, zh]]) => ({ en, code, zh, source: "en" })),
    ...Object.entries(ZH_EXACT).map(([zh, [code, en]]) => ({ en, code, zh, source: "zh" }))
  ];
}
