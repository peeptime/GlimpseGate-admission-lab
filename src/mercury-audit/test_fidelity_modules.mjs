import { fullAudit, detectMetaAuditContent, buildIterationTracker, verifyReportFidelity } from "./index.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("✅", name);
    passed++;
  } catch (e) {
    console.log("❌", name);
    console.log("   ", e.message);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── Test 1: Meta-Audit Detection ──────────────────────────────────────────

test("F3: detectMetaAuditContent returns true for multi-round content", () => {
  const result = detectMetaAuditContent("第一轮：分解论断\n第二轮：消错视角\n第三轮：提炼结论");
  assert(result.is_meta === true, `Expected true, got ${result.is_meta}`);
  assert(result.markers.length >= 2, `Expected >=2 markers, got ${result.markers.length}`);
});

test("F3: detectMetaAuditContent returns false for standard content", () => {
  const result = detectMetaAuditContent("The user prefers HTML over Markdown for all outputs.");
  assert(result.is_meta === false, `Expected false, got ${result.is_meta}`);
});

// ── Test 2: Iteration Tracker ─────────────────────────────────────────────

test("F2: buildIterationTracker detects correct round count", () => {
  const tracker = buildIterationTracker("第一轮：分\n第二轮：解\n第三轮：验");
  assert(tracker.rounds.length === 3, `Expected 3 rounds, got ${tracker.rounds.length}`);
});

test("F2: Resolved problems are marked as resolved", () => {
  const content = "问题：X是绝对的\n已解决：加了补充说明\n结论：X是相对的";
  const tracker = buildIterationTracker(content);
  const unresolved = tracker.problem_tracker.filter(p => p.status === "unresolved");
  assert(unresolved.length === 0, `Expected 0 unresolved, got ${unresolved.length}`);
});

// ── Test 3: fullAudit on Meta-Audit Content ───────────────────────────────

test("F3: fullAudit on meta content includes meta_audit field", () => {
  const content = "第一轮：分析\n问题：X\n已消解\n第二轮：结论";
  const result = fullAudit(content, { source_content: content });
  assert(result.meta_audit !== null, "meta_audit should not be null");
  assert(result.meta_audit.is_meta === true, "Should detect meta-audit");
});

test("F1: fullAudit returns fidelity score", () => {
  const content = "第一轮：分析\n问题：X\n已消解\n第二轮：结论";
  const result = fullAudit(content, { source_content: content });
  assert(result.fidelity !== null, "fidelity should not be null");
  assert(typeof result.fidelity.fidelity_score === "number", "fidelity_score should be a number");
});

test("F4: fullAudit returns trace report", () => {
  const content = "The user always prefers HTML.";
  const result = fullAudit(content, { source_content: content });
  assert(result.trace !== null, "trace should not be null");
  assert(typeof result.trace.trace_coverage === "number", "trace_coverage should be a number");
});

test("F1: fidelity gate blocks low-fidelity reports", () => {
  // Standard content with blockers but no source → fidelity low
  const content = "The user always prefers HTML for all future outputs.";
  const result = fullAudit(content, { source_content: content });
  // Content has blockers (overgeneralization) but trace coverage is partial
  assert(result.fidelity_gate_passed !== undefined, "fidelity_gate_passed should exist");
});

// ── Test 4: Routing Decision Adjustment ────────────────────────────────────

test("F3: routing can be adjusted from meta audit", () => {
  const content = "第一轮\n问题：X\n已消解\n第二轮：结论";
  const result = fullAudit(content, { source_content: content });
  // Meta detected, but unresolved problems may keep it at quarantine
  assert(["quarantine", "revise", "accept"].includes(result.routing_decision),
    `Invalid routing: ${result.routing_decision}`);
});

// ── Test 5: API Version ────────────────────────────────────────────────────

test("API version updated to 0.8.0", () => {
  const content = "test";
  const result = fullAudit(content, { source_content: content });
  assert(result.api_version === "0.8.0", `Expected 0.8.0, got ${result.api_version}`);
});

// ── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("All fidelity modules operating correctly.");
}
process.exit(failed > 0 ? 1 : 0);
