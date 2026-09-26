// Feedback-language coverage + copy rules (v2.5.0).
// Fails when the SDK gains a feedback string with no zh-CN entry, so new
// strings cannot silently reach Chinese users untranslated.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tagText, localizeView, catalogEntries, normalizeFeedbackLang } from "./dashboard/feedback-lang.mjs";

const files = [
  "scripts/audit-core/audit_rules.mjs",
  "src/mercury-audit/evidence-chain.mjs",
  "src/mercury-audit/anti-gaming.mjs",
  "src/mercury-audit/kernel.mjs",
  "src/mercury-audit/admission-contract.mjs"
];
const source = (await Promise.all(files.map((f) => readFile(new URL(`../${f}`, import.meta.url), "utf8")))).join("\n");

// 1. Static scan: every literal the SDK can emit as feedback.
const literals = new Set();
for (const m of source.matchAll(/(?:requiredFixes|required_fixes|requiredEvidence|required_evidence|missing)\.push\(\s*"([^"]+)"/g)) literals.add(m[1]);
for (const m of source.matchAll(/(?:gap|label|action): "([^"]+)"/g)) literals.add(m[1]);
for (const m of source.matchAll(/^\s*"((?:Remove|Re-audit)[^"]+)"/gm)) literals.add(m[1]);
for (const m of source.matchAll(/description: "([^"]+)"/g)) literals.add(m[1]);
// template literals: instantiate with a sample value
const templates = [...source.matchAll(/(?:push|missing\.push)\(\s*`([^`]+)`/g)].map((m) => m[1].replace(/\$\{[^}]+\}/g, "sample_value"));

// Vocabulary codes (control ids like profile_minimum_route:x) are not prose.
const isCode = (s) => /^[a-z_]+:[\w-]+$/.test(s);
const isZh = (s) => /[\u4e00-\u9fff]/.test(s);
for (const l of [...literals]) if (l.includes("\\")) literals.delete(l); // scanner artifact: escaped quotes
const prose = [...literals, ...templates].filter((s) => !isCode(s));
// English-source strings need zh-CN; Chinese-source strings (SDK checklist) need en.
const missing = prose.filter((s) => (isZh(s) ? !tagText(s, "en").translated : !tagText(s, "zh-CN").translated));
assert.deepEqual(missing, [], `untranslated SDK feedback:\n${missing.join("\n")}`);
assert.ok(literals.size >= 55, `scan found only ${literals.size} literals; scanner may be broken`);

// 2. Registers.
assert.equal(normalizeFeedbackLang("zh"), "zh-CN");
assert.equal(normalizeFeedbackLang("EN-us"), "en");
assert.equal(normalizeFeedbackLang("agent"), "agent");
const zh = tagText("Add evidence", "zh-CN");
assert.deepEqual([zh.text, zh.lang, zh.translated, zh.original, zh.code], ["补证据", "zh-CN", true, "Add evidence", "option.add_evidence"]);
const agent = tagText("Add evidence", "agent");
assert.deepEqual([agent.text, agent.register, agent.translated, agent.code], ["Add evidence", "canonical", false, "option.add_evidence"]);
const unknown = tagText("A brand-new SDK sentence.", "zh-CN");
assert.equal(unknown.fallback, true, "untranslated text must be marked fallback, not passed off as zh");
assert.equal(unknown.lang, "en");
assert.equal(tagText("source_floor_not_met:traceable", "zh-CN").code, "warning.source_floor_not_met");

// 3. localizeView is additive: canonical fields untouched.
const view = {
  required_fixes: ["Add evidence"], warnings: [],
  chain: { missing_evidence: [{ id: "x", description: "Decline" }], suggested_choices: [{ gap_id: "x", options: [{ id: "A", label: "Discard", action: "Assign a reviewer before promotion." }] }] }
};
const out = localizeView(view, "zh-CN");
assert.equal(out.required_fixes[0], "Add evidence");
assert.equal(out.required_fixes_l10n[0].text, "补证据");
assert.equal(out.chain.suggested_choices[0].options[0].label, "Discard");
assert.equal(out.chain.suggested_choices[0].options[0].label_l10n.text, "丢弃");
assert.equal(out.feedback_lang.fallback, 0);

// Reverse direction: Chinese SDK text reaches en/agent translated and tagged.
const rev = tagText("同意当前处理方式", "agent");
assert.deepEqual([rev.text, rev.translated, rev.code, rev.original], ["Agree with the current route", true, "checklist.route.A", "同意当前处理方式"]);
assert.equal(tagText("同意当前处理方式", "zh-CN").translated, false, "Chinese source is canonical for zh");
assert.equal(tagText("请确认处理方式是否应保持为 quarantine。", "en").text, "Confirm whether the route should stay quarantine.");

// 4. Copy rules for the zh catalog (docs/COPY-STYLE.md).
const MEMES = ["GG", "666", "yyds", "绝绝子", "破防", "芭比Q", "摆烂", "躺平", "拿捏"];
for (const { en, zh: text, source } of catalogEntries()) {
  if (source === "zh") continue; // SDK-owned Chinese is canonical; only our translations follow COPY-STYLE
  assert.ok(!MEMES.some((m) => text.includes(m)), `meme in: ${text}`);
  for (const sentence of text.split(/[。！？；]/)) {
    const cjk = (sentence.match(/[一-鿿]/g) || []).length;
    assert.ok(cjk <= 24, `zh sentence over 24 CJK chars (${cjk}): ${sentence} ← ${en}`);
  }
  assert.ok(!/[一-鿿]地[一-鿿]/.test(text), `地-adverbial in: ${text}`);
}

console.log(`OK feedback language tests passed (${literals.size} SDK literals + ${templates.length} templates covered)`);
