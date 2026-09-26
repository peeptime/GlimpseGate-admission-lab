# SPEC.md — GlimpseGate-admission-lab v2.2.0

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  based_on: mattpocock/skills (shared language) + modu-ai/moai-adk (SPEC-first paradigm)
  audit_ref: docs/ITERATION-GUIDE-LATEST.md
```

> "The purpose of vibe coding is not rapid productivity but code quality."
> — MoAI-ADK motto, adapted: The purpose of GlimpseGate is not rapid memory but auditable memory.

This SPEC defines what v2.2.0 must achieve, what it must not break, and how progress is measured.

---

## 1. Problem Statement

AI agents produce claims at scale. These claims mix:
- Direct facts (from user input)
- Inferences (from AI reasoning)
- Assumptions (unstated premises)
- Preferences (dressed as facts)
- Gaming attempts (inputs designed to manipulate the system)

Without an evidence gate, all of these enter memory with equal authority.

**GlimpseGate-admission-lab solves this** by providing a local, structural audit gate
that runs before durable memory write. It does not judge truth — it judges traceability.

---

## 2. Design Principles

### P1: Evidence over authority
A claim backed by a user-provided source is treated differently from an AI inference.
The system tracks which is which, regardless of how confident the text sounds.

### P2: Routing, not scoring
The system produces routing decisions (`accept`, `revise`, `quarantine`, `discard`).
It does NOT produce numerical scores that can be optimized against.
Blockers are binary signals, not gradients.

### P3: Small, composable, adaptable
Inspired by [mattpocock/skills](https://github.com/mattpocock/skills).
Every skill, function, and configuration can be adapted without touching the core.
Skills are SKILL.md files agents can use directly.

### P4: SPEC-first before implementation
Inspired by [modu-ai/moai-adk](https://github.com/modu-ai/moai-adk).
Every feature starts as a SPEC. Every PR must update the SPEC or justify the deviation.

### P5: Zero external dependencies for the SDK core
The audit SDK (`src/mercury-audit/`) requires only Node.js ≥ 20.
No external LLM calls, no network access, no database.

---

## 3. Scope

### In Scope (v2.2.0)
- [x] README.md with public name "GlimpseGate-admission-lab"
- [x] CONTEXT.md — shared language document
- [x] SPEC.md — this document
- [x] SKILL.md upgrade for evidence-chain skill
- [x] Archive legacy ITERATION-GUIDE-0.x, 1.0.x, 1.1.x, 1.2.x docs
- [x] v2.1.7 tag and release notes
- [ ] GitHub Releases page updated for v2.1.7 and v2.2.0
- [x] Basic CI: test on push (already present in `.github/workflows/ci.yml`; confirmed in 2.3.0)
- [x] Performance regression baseline (data/benchmark-baseline.json exists; not yet enforced in CI)

### Out of Scope (Not v2.2.0)
- Backend adapters or database integrations
- npm package publication
- AI self-audit or RAG features
- OWASP compliance certification
- UI dashboard (outreach-only, not a product)

---

## 4. Functional Specification

### 4.1 Audit SDK Core

```js
import {
  audit,                    // Text → audit result
  auditMemoryWrite,          // Audit packet → audit result + memory-ready packet
  buildEvidenceChain,        // Packet + result → evidence chain
  buildAdmissionContract,    // Evidence chain + choice → admission contract
  verifyAuditStability,     // Audit result × 2 → fidelity score
  quickStabilityCheck,      // Single audit result → internal consistency
  auditWithStabilityCheck,  // Full fidelity audit with routing downgrade
  applyStabilityGate,       // Stability score → routing decision adjustment
} from '@GlimpseGate/admission-lab'
```

**Constraints:**
- All functions are pure Node.js (no external network calls)
- `audit()` and `auditMemoryWrite()` must return within 50ms for typical inputs
- Fidelity functions must be deterministic (same input → same output)
- Routing decisions must match one of: `accept`, `revise`, `quarantine`, `discard`

### 4.2 Routing Decision Logic

```
Input type           Evidence present?   Confidence high?  → Decision
─────────────────────────────────────────────────────────────────────
factual claim        yes                  yes               accept
factual claim        no                   —                 quarantine
inference            —                    yes               revise (or accept*)
inference            no                   no                quarantine
assumption           —                    —                 revise
preference-adjacent  —                    —                 revise
gaming attempt       —                    —                 discard
* Only when inference is directly supported by a user-provided source ref
```

### 4.3 Memory Gate Integration

```js
// Pre-write hook (memory-write gate)
const packet = auditMemoryWrite({
  content: aiOutput,
  type: "agent_summary",
  risk_level: "medium",
  source_refs: ["conversation:session-42"],
  audit_refs: ["docs/SCENARIO-PACKS.md"]
});

if (packet.routing_decision === "discard") {
  throw new Error("Memory write blocked: gaming attempt detected");
}
if (packet.routing_decision === "quarantine") {
  await requestHumanReview(packet);
}
writeToMemory(packet);
```

### 4.4 Skill Interface

Every skill is a SKILL.md file that:
1. Describes when to use the skill (trigger conditions)
2. Provides step-by-step instructions
3. Shows concrete before/after examples
4. Links to relevant SPEC.md sections

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| SDK bundle size | < 100KB (no node_modules) |
| Audit latency (p50) | < 10ms |
| Audit latency (p99) | < 50ms |
| Test coverage (SDK) | > 80% |
| Integration tests | 21 tests, all passing |
| Node.js compatibility | ≥ 20 |
| Platform | macOS, Linux, Windows (WSL/PowerShell 7+) |

---

## 6. Architecture

```
src/mercury-audit/
├── index.mjs              # Public SDK entry point
├── kernel.mjs              # Audit kernel (core structural evaluation)
├── evidence-chain.mjs     # Evidence chain builder
├── fidelity-stability.mjs  # F5 fidelity + F5 stability engine
├── meta-audit.mjs          # Meta-audit (audit about audit results)
├── profiles.mjs            # Audit profiles (strict/standard/lenient)
├── standards.mjs           # Audit standards (domain-specific rules)
├── source-credibility.mjs  # Source credibility assessment
├── lifecycle.mjs          # Memory lifecycle state assessment
├── disagreement.mjs       # Reviewer disagreement detection
├── anti-gaming.mjs         # Gaming attempt detection
├── policy.mjs             # Policy enforcement layer
├── scenarios.mjs          # Scenario defaults
└── review-ux.mjs          # Human review UX helpers

scripts/                   # Dev tooling, benchmarks, demos
examples/                  # Integration examples, starter kit
config/                    # Profiles, standards, routing rules (JSON)
docs/                     # Architecture docs, iteration guides
08_skills/                # Agent-usable SKILL.md files
```

---

## 7. Acceptance Criteria

### v2.4.0 Release Gate

- [x] Every GUI audit path uses the SDK (`/api/v1/admission/*`, `/api/lite-audit`)
- [x] Dashboard refuses cross-origin and non-JSON state changes; loopback Host only
- [x] `npm test` includes the dashboard API contract test
- [x] Route set unchanged apart from additions (diffed against 2.3.0)
- [x] `check_dashboard_product.mjs` passes for the v3 architecture
- [ ] Owner review of the v3 GUI on a real screen (manual QA used recorded responses)
- [ ] Decide when to remove `/classic/`

### v2.3.0 Release Gate

- [x] `npm run test` — includes evidence-chain and admission-hardening suites
- [x] `npm run test:fidelity` and `npm run test:consumer` in CI (via `npm test`; `ci.yml` unchanged)
- [x] Admission contract enforces its declared `evidence_condition`
- [x] Package name is npm-valid (`@glimpsegate/admission-lab`); `files` limits the tarball to the SDK
- [x] Type declarations for the stable SDK surface
- [x] Legacy guides exist only under `docs/ARCHIVED/`
- [x] New terms (evidence condition, pending upgrade, declared source level) in CONTEXT.md
- [ ] `index.d.ts` compiled against `tsc --strict` (not run in 2.3.0: compiler unavailable in the authoring sandbox)
- [ ] Owner review of proposed routes FM-23…FM-28 and the FM → ISO 25012 mapping

### v2.2.0 Release Gate

- [ ] `npm run test` — all tests pass
- [ ] `npm run doctor` — all checks pass
- [ ] `npm run benchmark:v2` — no regression > 20% vs baseline
- [ ] `npm run validate:incr` — no errors
- [ ] `CONTEXT.md` exists and is referenced by all new skills
- [ ] `SPEC.md` exists and is updated before any feature PR
- [ ] GitHub Releases: v2.1.7 and v2.2.0 both have release notes
- [ ] `CONTEXT.md` and `SPEC.md` are in `.github/CODEOWNERS` or equivalent
- [ ] README.md shows "GlimpseGate-admission-lab" prominently
- [ ] Legacy docs (ITERATION-GUIDE-0.x through 1.2.x) archived

### Performance Regression Prevention

Every commit to `main` triggers:
```
npm run benchmark:v2
→ compare to data/benchmark-baseline.json
→ fail CI if any function regresses > 20%
```

Baseline (v2.1.7, Node.js v22, Apple Silicon):

| Function | Baseline ops/s |
|----------|---------------|
| audit | ~14,000 |
| auditMemoryWrite | ~13,500 |
| buildEvidenceChain | ~12,700 |
| buildAdmissionContract | ~17,700 |
| verifyAuditStability | ~22,800 |
| quickStabilityCheck | ~24,000 |
| full_pipeline | ~17,000 |

---

## 8. Stop List (enforced)

These are non-negotiable boundaries. Violations require a major version bump.

- ❌ Do NOT add numerical scoring or optimization targets
- ❌ Do NOT add external LLM calls to the audit core
- ❌ Do NOT add database or backend adapters
- ❌ Do NOT publish to npm without a formal integration review
- ❌ Do NOT auto-promote captured conversations to admitted memory
- ❌ Do NOT fabricate source_refs or audit_refs
- ❌ Do NOT present this as OWASP compliance certification
- ❌ Do NOT add AI self-audit or AI-suggested routing features

---

## 9. Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-09-26 | 2.4.0 | Dashboard v3: SDK-backed admission API and contract UI, request guard + CSP, route table, node-network / fractal motion design, classic GUI at /classic/ |
| 2026-09-26 | 2.3.0 | Restart after freeze: admission-contract evidence enforcement, source-ref classifier fix, reason explainability, SDK packaging + types, taxonomy audit, related-work re-verification |
| 2026-05-20 | 2.2.0 | Added SPEC.md, CONTEXT.md, skill upgrades, legacy doc archive |
| 2026-05-20 | 2.1.7 | Fidelity-stability optimizations, quickStabilityCheck, async auditWithStabilityCheck |
| 2026-05-20 | 2.1.6 | Config-driven routing, performance baseline |
| 2026-05-16 | 2.1.0 | F1-F5 fidelity engine, type-aware admission, evidence chain SDK |
