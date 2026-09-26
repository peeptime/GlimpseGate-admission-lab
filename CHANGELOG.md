# Changelog

## Provenance Policy

Every release entry must carry an explicit provenance declaration. Legacy entries that cannot be reconstructed are marked as unverified instead of being silently treated as human-only.

## 2.4.0 - Gate GUI v3 (2026-09-26)
> Provenance: `[AI_GENERATED]` drafted_by: Claude (Hyperagent) at project_owner's request; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/DASHBOARD.md

### Fixed

- **GUI bypassed the SDK.** `/api/lite-audit` was a separate regex auditor, and `lite.html` had a third copy, so GUI routes could disagree with SDK routes and the 2.3.0 contract rule never reached GUI users. All GUI audits now go through SDK functions; `/api/lite-audit` keeps its response shape (superset) and is SDK-backed.
- **No request guard (CSRF / DNS rebinding).** Any page in the same browser could POST `text/plain` to `/api/run` or `/api/artifact`. Loopback Host, same-origin state changes, and JSON content type are now required. HTML is served with a CSP.
- **Static containment check** was not separator-aware (`dashboard-x` passed for `dashboard`).
- **`goal-validator.mjs` ran its CLI on import**, printing help inside the dashboard and able to `process.exit(1)` the server.
- Classic GUI inline `onclick` (blocked by the new CSP) replaced with a delegated listener.

### Added

- **Dashboard v3** (`dashboard/app/`): Gate / Library / System views; node-network visualization of the SDK decision tree; route glyphs; noise-driven quadtree and curl-noise background; admission-contract UI with explicit downgrade reasons; ⌘K palette; zh/en; motion levels with reduced-motion default. No build step, no dependencies, no network beyond the local server.
- `POST /api/v1/admission/audit`, `POST /api/v1/admission/contract`, `GET /api/v1/admission/meta`, `GET /api/routes`.
- `scripts/dashboard/{http,router,admission-api}.mjs`; `createDashboardServer()` export.
- `scripts/test_dashboard_api.mjs` (in `npm test`): contract, admission, guard, router, and static tests.
- `docs/DASHBOARD.md`.

### Changed

- Server dispatch: a 27-branch if-chain became a route table (identical route set plus 4 new routes, verified by diff).
- SDK circular-reasoning detector absorbs the three phrases only the old lite rules had, so the SDK stays the single source of routing truth. `MERCURY_RULESET_VERSION` 2026.05.10.1 → 2026.09.26.1 (records audited under the old ruleset report `needsReaudit`).
- The v2 GUI moved to `/classic/` (kept for one release).
- `scripts/check_dashboard_product.mjs` rewritten for the v3 architecture (21 checks).
- `lite.html` calls the same-origin API when served by the dashboard; from `file://` it uses its offline rules, as before.

### Known Issues (v2.4.0)

- Visual QA was manual (recorded API responses, all views, zh/en, one desktop size). No automated visual regression tests; the narrow-screen layout is CSS-only and was not screenshot-tested.
- The offline rules in `lite.html` remain a separate implementation by necessity (no server). They can disagree with the SDK; the page labels which engine answered.
- Classic-only features (onboarding wizard, notifications, full settings editor) are not in v3.

## 2.3.0 - Restart: Admission Hardening (2026-09-26)
> Provenance: `[AI_GENERATED]` drafted_by: Claude (Hyperagent) at project_owner's request; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-2.3.0.md

First iteration after the freeze since 2026-05-21. Focus: close gaps between what the method claims and what the code enforces.

### Fixed

- **Admission contract laundering path.** Choosing an evidence-seeking option (e.g. `circular_reasoning` → A "Find independent evidence") granted `object_type: fact` and `can_use_as_fact: true` with no evidence supplied. The declared `evidence_condition` is now enforced; unmet conditions admit as `hypothesis` with a `pending_upgrade` record. Circular reasoning additionally requires *independent* evidence; review alone cannot close it. `object_type` overrides cannot bypass the check.
- **Source-ref classifier.** Substring matching classified `email:…`, `meeting-detail:…`, `domain-expert-note` as `ai_generated` (they contain "ai"). Now whole-token matching.
- **Contradictory reasons.** A kernel control could escalate the route to `revise` while `reasons` still said "No refusal point triggered". `reasons` now includes `control:<name>` for each escalating control.
- **Invalid package name.** `@GlimpseGate/admission-lab` → `@glimpsegate/admission-lab` (npm names must be lowercase).
- **Archive was a copy.** Seven legacy iteration guides existed in both `docs/` and `docs/ARCHIVED/`; duplicates removed, references repointed.
- **Route matrix gap.** FM-23…FM-28 were defined in FAILURE-MODES.md but had no route or family; proposed routes added (aligned with existing kernel behavior), families updated.

### Added

- `src/mercury-audit/index.d.ts` — TypeScript declarations for the stable SDK surface.
- `package.json#files` / `types` / `main` / `exports` conditions — tarball shrinks from 441 files to 29.
- Declared source levels: `primary::`, `traceable::`, `secondary::`, `ai::` prefixes (`declared: true` in the result).
- `scripts/test_admission_hardening.mjs` (in `npm test`), `scripts/test_sdk_consumer.mjs` (pack → install → import, in CI).
- `npm test` now also runs the evidence-chain, admission-hardening, fidelity and consumer-install suites, so CI (which calls `npm run test`) covers them without a workflow change. `npm run test:fast` skips the fidelity and consumer steps.
- `docs/SDK-QUICKSTART.md` — integration guide.
- `docs/ADMISSION-TAXONOMY.md` — axis analysis of memory object types, FM implementation coverage, FM → ISO/IEC 25012 mapping, Admiralty-code comparison for source levels, and the key open question.
- CONTEXT.md terms: evidence condition, pending upgrade, declared source level, naming (GlimpseGate vs. Mercury).

### Changed

- SDK API `0.7.0` → `0.8.0` (admission-contract behavior change; new fields `evidence_condition_check`, `pending_upgrade`). `ADMISSION_CONTRACT_VERSION` → `2026.09.26.1`.
- `docs/RELATED-WORK.md` — citations re-verified; two titles corrected; MemSAD reframed as a defense; new section on closest competitors (MemIR, Tenure, Kumiho) with an explicit novelty boundary; agent memory systems, memory poisoning, and taxonomy foundations added.
- README / README.en / ROUTING-THEORY: system name in prose is GlimpseGate; legacy identifiers intentionally kept.

### Known Issues (v2.3.0)

- `index.d.ts` was not compiled with `tsc` (compiler unavailable in the authoring sandbox).
- Routes for FM-23…FM-28 and the FM → ISO 25012 mapping are AI-drafted proposals pending owner review.
- The SDK engine detects only a few of the 28 documented failure modes; the rest are review vocabulary (now stated in ADMISSION-TAXONOMY.md §2).
- `benchmark:v2` baseline is not re-captured on the new code path.

## 2.2.0 - SPEC-First + Shared Language (2026-05-20)
> Provenance: `[RECONSTRUCTED]` from commit b52f81b message during 2.3.0; humanReviewed: declined

- Added `SPEC.md` and `CONTEXT.md`; upgraded three `08_skills/mercury-*` skills to reference them; archived legacy iteration guides (copy — see 2.3.0 fix); README public name → GlimpseGate-admission-lab.

## 2.1.7 - Fidelity-Stability Optimizations (2026-05-21)
> Provenance: `[RECONSTRUCTED]` from commit f120f03 message during 2.3.0; humanReviewed: declined

- `quickStabilityCheck()`; async `auditWithStabilityCheck()` with skip-second-audit fast path; lazily cached routing config; O(n) blocker comparison; `FIDELITY_STABILITY_VERSION` 1.1.0.

## 2.1.6 - Performance Baseline + Config-Driven Routing (2026-05-20)
> Provenance: `[RECONSTRUCTED]` from commits a3f09ef, 09db563 during 2.3.0; humanReviewed: declined

- Architecture map (`architecture.html` / `.json`); benchmark of all SDK functions with `data/benchmark-baseline.json`; stability threshold and downgrade chain loaded from `config/rule-routing.json` v0.2.

## 2.1.5 - Quick Intake Feedback (2026-05-13)
> Provenance: `[AI_GENERATED]` drafted_by: QClaw; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: ITERATION-GUIDE-2.1.5.md

### Added

- `src/mercury-audit/intake-feedback.mjs` — **Quick Audit Feedback Engine**。新增 `scoreContentQuick()`、`extractClaims()`、`selfAuditReport()`、`analyzeContentBatch()` 四个无 LLM 依赖的结构化内容分析函数。提供：主张提取（四类：事实型/推测型/观点型/程序型）、5维度内容质量评分（结构/结论/证据/具体性/总评分）、快速路由建议（accept/revise/quarantine）、内容旗帜标注（过度修饰/范围未定义/无证据/无结论）。
- Dashboard `/api/intake-feedback` — 接收文本，返回质量评分 + 主张列表 + 路由建议 + 旗帜标注。
- Dashboard `/api/extract-claims` — 接收文本，返回主张列表（claim + indicator + position）。
- Dashboard GUI 新增 **Intake Feedback 面板**：提交后自动触发质量评估环形图、维度指标、旗帜列表、主张样本预览。支持文本输入防抖触发（800ms）、手动重新分析按钮。
- Dashboard 样式升级：`styles.css` 新增 13 个反馈面板相关类（`feedback-panel`、`feedback-score-ring`、`quality-badge`、`feedback-dim`、`feedback-flag`、`feedback-claim` 等）。

### Changed

- `package.json` 版本从 `2.0.2` 升至 `2.1.5`，codename 更新为 `Quick Intake Feedback`，新增 `releaseDate` 字段。
- `src/mercury-audit/index.mjs` SDK API 版本从 `0.6.0` 升至 `0.7.0`。
- Dashboard 资源版本从 `20260510a` 升至 `20260513a`，`index.html` 构建标签同步更新。

### Known Issues (v2.1.5)

- 反馈评分算法为规则型，不依赖 LLM，适合作为快速参考而非权威判断。
- 自评模块（`selfAuditReport`）建议用于 Mercury 自身产出的审计，不用于外部材料。
- 主张提取使用正则模式，大段代码或表格内容可能产生误判。

## 2.0.2 - Admission Contract (2026-05-12)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-2.0.2.md

### Added

- `src/mercury-audit/admission-contract.mjs` adds `buildAdmissionContract()`, `annotateChoicesWithAdmissionPolicy()`, `ADMISSION_CONTRACT_VERSION`, and `MEMORY_OBJECT_TYPES`.
- Evidence-chain choices now include admission policy metadata for future memory identity and usage rights.
- `scripts/test_evidence_chain.mjs` now verifies Admission Contract behavior and usage constraints.

### Changed

- Public positioning moves from memory admission lab toward a choice-gated knowledge admission protocol.
- README and README.en now state that Mercury produces structured admission choices, not truth verdicts.
- `benchmark:v2` now measures the audit + evidence-chain + admission-contract path and reports the current package version.
- SDK API version moves to `0.6.0`.

## 2.0.1 - Admission Reframe (2026-05-12)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-2.0.1.md

### Changed

- Renames the public project posture from **Mercury Method Lab** to **Mercury Admission Lab** while preserving the repository/package name for compatibility.
- Reframes README and README.en around memory admission, evidence gates, and the distinction between credibility scoring and durable-memory admission.
- Makes the current limitations explicit: no external adoption proof, no third-party human review, no labeled precision/recall benchmark, no cross-model certification, and no solved multi-agent contamination model.
- Moves the next roadmap toward ground-truth benchmarks, cross-model audit, programmable checks, adversarial injection tests, multi-agent contamination coverage, and a human trust anchor.

## 2.1.0 - Report Fidelity & Meta-Audit Engine (2026-05-12)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/V2-AUDIT-FIDELITY-CAPABILITIES.md

### Added

- `src/mercury-audit/meta-audit.mjs` — **F3: Meta-Audit Detection**。新增 `detectMetaAuditContent()`、`extractProblemResolutionPairs()`，识别多轮迭代审计材料，避免将已完成审计的内容当原材料重审。
- `src/mercury-audit/fidelity.mjs` — **F1: Report-Source Fidelity Verification**。新增 `verifyReportFidelity()`、`applyFidelityGate()`，验证审计报告的每个结论是否在原材料中有对应引用，防止生成"已解决却仍列为未解决"的虚假问题清单。
- `src/mercury-audit/iteration-track.mjs` — **F2: Round-Aware Problem Resolution Tracker**。新增 `buildIterationTracker()`、`getUnresolvedProblems()`，追踪"第一轮提出的问题是否在后续轮次中被消解"，生成问题-解决对照表。
- `src/mercury-audit/trace.mjs` — **F4: Audit Traceability Annotations**。新增 `generateTraceReport()`、`renderTraceMarkdown()`、`generateFidelityChecklist()`，为每个审计结论生成原文引用和溯源标注，提升报告可验证性。
- `src/mercury-audit/test_fidelity_modules.mjs` — 四个新模块的完整测试套件（10 个测试，全部通过）。
- `docs/V2-AUDIT-FIDELITY-CAPABILITIES.md` — 系统性梳理报告忠实度与逻辑能力体系，定义 F1/F2/F3/F4 四类能力缺口及实现路径。
- `docs/V2-MDX-SUPPORT-CHANGES.md` — v2.x MDX 支持需求文档，记录需修改的文件清单及具体改动位置。

### Changed

- SDK API 版本从 `0.4.0` 升级至 `0.5.0`。
- `src/mercury-audit/index.mjs` 新增 `fullAudit()` 函数，作为 F1-F4 的统一编排入口。
- 标准 `audit()` 函数行为不变（向后兼容），`fullAudit()` 提供完整忠实度验证路径。
- 报告忠实度低的审计结果自动触发 `human_review_required: true` 并添加 `report_fidelity_low` blocker。

### Added

- ## 2.0.0 - Portable Evidence Chain (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-2.0.0.md

### Added

- `scripts/benchmark_v2_paths.mjs` benchmarks the local audit-plus-evidence-chain path without external LLM, browser, network, or storage adapter calls.
- `docs/PERFORMANCE-2.0.md` records the performance boundary and token-economy posture for Mercury 2.0.
- `08_skills/mercury-evidence-chain/`, `08_skills/mercury-memory-gate/`, and `08_skills/mercury-case-capture/` package the core Mercury behavior as lightweight portable skills.
- `scripts/check_mercury_skills.mjs` validates that the new skills have usable frontmatter and preserve `human_reviewed: declined`.
- `docs/ITERATION-GUIDE-2.0.0.md` records the final 2.0 performance and skill pass.

### Changed

- README and README.en now present 2.0 as a portable evidence-chain audit framework rather than a local method notebook.
- Release gate now runs `benchmark:v2` and `skills:check`.
- Doctor and cycle checks now recognize the final 2.0 artifact set.

## 2.0.0-alpha.3 - Evidence Chain Interface (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/A2A-AGENT-CARD-BLUEPRINT.md

### Added

- `src/mercury-audit/evidence-chain.mjs` adds `buildEvidenceChain()` and `buildMissingEvidence()` for source-linked claims, gaps, and A/B/C next choices.
- `scripts/test_evidence_chain.mjs` fixes the evidence-chain SDK contract.
- Lite Mode now supports drag attach for `.md`, `.txt`, and `.json`, and renders a compact evidence-chain panel.
- `examples/a2a/agent-card.json`, `examples/a2a/message-task-demo.mjs`, and `docs/A2A-AGENT-CARD-BLUEPRINT.md` provide an A2A-compatible discovery and payload fixture without claiming a full A2A server.

### Changed

- SDK API version moves to `0.4.0`.
- Release gate now runs evidence-chain tests and the A2A demo.

## 2.0.0-alpha.2 - Real Case Foundation (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/REAL-CASES-SUMMARY.md

### Added

- `scripts/build_real_cases.mjs` builds reproducible structured cases under `cases/2026-05/`.
- `scripts/check_real_cases.mjs` validates that each case has input, audit result, review status, and at least one case for each routing decision.
- `docs/REAL-CASES-SUMMARY.md` summarizes 10 local repository cases without pretending they are external human records.
- `examples/integration-demo/openclaw-hook.mjs` simulates an OpenClaw-compatible memory write hook that blocks one unsafe candidate and accepts one scoped candidate.
- `examples/starter-kit/` demonstrates the smallest SDK path for new users.

### Changed

- Release gate now runs case build/check plus the OpenClaw and Starter Kit demos.
- Doctor and cycle checks now recognize the case foundation and integration-demo artifacts.

## 2.0.0-alpha.1 - Evidence Chain Preflight (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/V2-PREFLIGHT-REQUIREMENTS.md

### Added

- `docs/V2-PREFLIGHT-REQUIREMENTS.md` records the controlling 2.0 requirement set: evidence-chain assistance, missing-evidence choices, A2A posture, drag attach, Karpathy-style coding discipline, and lightweight skill packaging.
- `docs/V2-WORK-TRAIN.md` maps the 2.0 work into tested alpha releases and a final performance/skill pass.
- `docs/ITERATION-STRATEGY-V2.md` is added as lower-weight historical strategy input so later agents keep its useful diagnosis without adopting unsupported hard-freeze restrictions.

### Changed

- README and public version surfaces now describe the 2.0 alpha direction before the earlier v1.x proof-governance history.
- Cycle status/check and latest-guide generation now recognize the documented 2.0 alpha line.

## 1.9.0 - Proof Governance Expansion (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-1.9.0.md

### Added

- `docs/PROOF-PACK-002.md` adds six harder governance cases covering multi-agent contamination, stale memory, code, charts, reviewer disagreement, and audit gaming.
- `docs/RULE-VERSION-GOVERNANCE.md`, `docs/MEMORY-LIFECYCLE-GOVERNANCE.md`, `docs/HUMAN-REVIEW-DISAGREEMENT.md`, and `docs/ANTI-GAMING-TESTS.md` make rule drift, memory expiry, reviewer conflict, and route manipulation explicit.
- `src/mercury-audit/anti-gaming.mjs` detects route-forcing, forged human review, hidden evidence gaps, and metric-over-truth phrasing.
- `src/mercury-audit/rule-versioning.mjs` exposes `MERCURY_RULESET_VERSION`, rule-version records, and re-audit checks.
- `scripts/test_governance.mjs` fixes the governance contract in automated tests.

### Changed

- SDK API version moves to `0.3.0`; audit results now include `anti_gaming` and `ruleset_version`.
- Failure Mode Dictionary expands from 22 to 28 modes with Proof Pack 002 support.
- Coverage matrix now records code, chart, time-sensitive memory, multi-agent chain, disagreement, and anti-gaming cases.

## 1.8.0 - Open Scenario Packs (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-1.8.0.md

### Added

- `src/mercury-audit/scenarios.mjs` adds five reusable scenario packs: AI coding, personal knowledge, investment research, enterprise delivery, and legal/medical risk.
- `src/mercury-audit/review-ux.mjs` adds scenario-aware review guidance with plain-language consequence and next action.
- `schemas/audit-scenario.schema.json` documents the scenario-pack contract.
- `examples/audit-scenarios/` provides reusable scenario configs.
- `docs/SCENARIO-PACKS.md`, `docs/ADAPTER-CONTRACT.md`, and `docs/REVIEW-UX-GUIDE.md` document how teams should migrate Mercury into their own workflows.

### Changed

- `audit()` accepts `scenario` and automatically applies scenario default profile/standard when explicit overrides are absent.
- SDK results now include `scenario` and `review_guidance`.
- README / README.en now surface scenario packs before deeper kernel and SDK docs.

## 1.7.0 - Audit Kernel Independence (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-1.7.0.md

### Added

- `src/mercury-audit/kernel.mjs` introduces a portable audit kernel that combines structural audit, source credibility, lifecycle checks, reviewer disagreement, profiles, standards, and policy enforcement.
- `profiles.mjs`, `standards.mjs`, `source-credibility.mjs`, `lifecycle.mjs`, and `disagreement.mjs` make previously implicit judgment surfaces configurable.
- `schemas/audit-profile.schema.json`, `schemas/audit-standard.schema.json`, and `schemas/source-credibility.schema.json` document portable configuration contracts.
- `examples/audit-profiles/` and `examples/audit-standards/` provide initial reusable profile/standard examples.
- `docs/AUDIT-KERNEL.md`, `docs/ECOSYSTEM-POSITION.md`, and `docs/MERCURY-AGENT-RELATIONSHIP.md` address SDK thickness, ecosystem position, and brand relationship explicitly.

### Changed

- SDK API version moves to `0.2.0` and `audit()` now returns kernel metadata, source credibility, lifecycle state, and reviewer disagreement state.
- README / README.en now disclose that Mercury Method Lab is not a Mercury Agent fork, plugin, or official extension.
- SDK tests now assert profile, standard, source-level, and disagreement behavior.

## 1.6.0 - Pre-Storage Audit SDK (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-GUIDE-1.6.0.md

### Added

- `src/mercury-audit/index.mjs` exposes a local SDK API: `audit`, `auditMemoryWrite`, `createAuditPacket`, and `shouldWriteMemory`.
- `src/mercury-audit/policy.mjs` adds `standard`, `strict`, and `advisory` policy layers for host systems.
- `examples/integration-demo/memory-write-hook.mjs` demonstrates pre-storage admission: one candidate is accepted and one is blocked before memory write.
- `scripts/test_sdk_api.mjs` fixes the SDK contract in automated tests.
- `scripts/benchmark_audit_sdk.mjs` reports local structural audit overhead without external LLM calls.
- `docs/SDK-API.md`, `docs/INTEGRATION-DEMO.md`, `docs/BENCHMARKS.md`, and `docs/OWASP-AISVS-C8-MAPPING.md` document the integration and standard-mapping layer.

### Changed

- `package.json` now exports the local SDK entry and adds `test:sdk`, `demo:memory-hook`, and `benchmark:audit`.
- Release gate now runs the SDK test, memory-hook demo, and local SDK benchmark.
- README / README.en now lead with the v1.6.0 pre-storage SDK path before the older dashboard and Lite flows.
- Cycle status/check, doctor, and latest guide generation now recognize the documented v1.6.x SDK integration line.

## 1.5.0 - Human Review Checklist UX (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/ITERATION-REQUEST-UI-AUDIT-2026-05-10.md

### Added

- Audit results now include `content_summary` so users can see the core claim, attribution, and confidence basis before reading technical blockers.
- Audit results now include `human_review_checklist` with A/B/C options for source support, confidence, attribution, and route confirmation.
- HTML reports render the checklist as selectable review choices and include a copyable human-review record.
- `docs/START-HERE.md` adds a role-based entry point for humans, agents, audit runners, and method readers.
- `docs/SCOPE.md`, `docs/EXPORT-GUIDE.md`, and `docs/I18N-UX-POLICY.md` define project boundaries, export paths, and user-visible language rules.

### Changed

- Lite Mode now defaults to a Chinese user-facing layer: routing decision, content summary, Human Review Checklist, and folded technical details.
- README / README.en now foreground the v1.5.0 review workflow and start path.
- Cycle status/check, doctor, and latest guide generation now recognize the documented v1.5.x Human Review UX line.
- `package.json` description is normalized to clean UTF-8 English instead of a mojibake-prone Chinese description.

## 1.4.0 - Method Taxonomy and Routing Blueprint (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/CYCLE-04-BLUEPRINT.md

### Added

- `docs/CYCLE-04-BLUEPRINT.md` records the method-depth release boundary: taxonomy, routing theory, coverage, related work, and implementer blueprint rather than more product surface.
- `docs/ROUTING-THEORY.md` explains the four routing decisions through evidence strength, audit closure, pollution risk, and boundary clarity.
- `docs/PROOF-PACK-COVERAGE-MATRIX.md` maps Proof Pack 001 across routing decisions, failure-mode families, output types, and next target cases.
- `docs/RELATED-WORK.md` positions Mercury against hallucination detection, fact verification, AI risk management, data quality, and provenance/lineage work.
- `docs/AGENT-AUDIT-BLUEPRINT.md` gives agent and memory-system builders a practical adoption guide without requiring Mercury's repository structure.
- `docs/ITERATION-GUIDE-1.4.0.md` captures the release-specific handoff for future agents.

### Changed

- `docs/FAILURE-MODES.md` now includes five top-level failure-mode families, boundary rules, and explicit coverage gaps.
- README now leads with the method blueprint and implementer-facing audit control point before product-surface details.
- Cycle status/check and doctor now recognize the documented v1.4.x method-depth line.

## 1.3.1 - Lite Intake and Trust Ledger Patch (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/REVIEW-LEDGER.md

### Added

- `scripts/capture_ai_conversation.mjs` adds a file/stdin/dropzone capture path for preserving AI conversation source evidence as temporary Audit Packets.
- `npm run capture`, `capture:demo`, `capture:dropzone`, `capture:watch`, and `capture:check` expose the capture loop without requiring users to understand the internal packet schema.
- `00_inbox/ai-conversations/` adds a local `.md` / `.txt` dropzone for low-friction AI conversation intake.
- `docs/THREE-MINUTE-START.md` documents paste, file, and dropzone entry paths.
- Lite Mode now supports URL prefill and optional `Save Capture` through `/api/capture`.
- `examples/ai-conversation-capture.md` provides a runnable bad-memory capture fixture.

### Changed

- README provenance is corrected back to `human_reviewed: declined` until referenced docs receive named human review.
- `docs/REVIEW-LEDGER.md` now records the v1.3.0/Cycle 02 version-line violation instead of hiding it.
- `docs/CYCLE-02-COMMITMENT.md` keeps its original constraint and adds a status note acknowledging the later product-surface exception.
- Cycle status/check wording, doctor, CI, dashboard product checks, latest guide generation, and release gate now include the capture check.

## 1.3.0 - Product Surface Pressure Test (2026-05-10)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/PRODUCT-SURFACE-PRESSURE-TEST.md

### Added

- `dashboard/product-layer.js` adds a no-framework product layer: 7-category Settings, command palette, first-run onboarding, icon system, toast notifications, system-notification permission flow, and recoverable error banner.
- `dashboard/lite.html` adds a single-file Lite Mode that can run offline from `file://` for paste -> audit -> result -> copy-as-Markdown.
- `config/preferences.json` plus `/api/preferences` persist theme, UI, storage, output, control, update, onboarding, and notification preferences.
- Dashboard API now includes `/api/lite-audit`, `/api/update-check`, `/api/diagnostics`, and `/api/maintenance/clean-dist`.
- GUI command allowlist now exposes `audit`, `report`, `audit:flow`, `cycle:status`, and `cycle:check`.
- `npm run dashboard:check` verifies the product layer, Lite Mode file size, icon registry, preferences, and dashboard endpoints.
- `LICENSE` adds MIT licensing.
- `docs/PRODUCT-SURFACE-PRESSURE-TEST.md` records the engineering-axis unfreeze separately from Cycle 02 method commitments.

### Changed

- Dashboard assets are cache-busted to `20260510a`.
- Release gate, doctor, and CI now include `dashboard:check`.
- Latest iteration guidance allows `v1.3.x` only for product-surface work while keeping the method layer case-first.

## 1.2.1 - Cycle 02 Commitment Patch (2026-05-09)
> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: declined; reviewer: project_owner_pending; audit_ref: docs/CYCLE-02-COMMITMENT.md

### Added

- `docs/CYCLE-02-COMMITMENT.md` locks the next work loop to `v1.2.x` patch releases, proof cases, review honesty, and external user records.
- `docs/PROOF-PACK-001.md` now has 10 complete cases instead of one case plus open slots.
- `docs/FAILURE-MODES.md` adds 22 named failure modes tied to Proof Pack references and near-miss boundaries.
- `docs/REVIEW-LEDGER.md` records AI-only outputs as `declined` rather than pretending human review happened.
- `docs/CHARTER-USER-RECORDS.md` adds a non-fabrication ledger for the three real charter-user records required by Cycle 02.
- `docs/AGENT-TOKEN-ECONOMY.md` and `08_skills/cycle-02-curator/SKILL.md` give fresh agents a low-context Cycle 02 workflow.
- `npm run cycle:status` and `npm run cycle:check` provide lightweight status and structural checks before full validation.

### Changed

- Release gate, doctor, and CI now include Cycle 02 status/check commands.
- README now surfaces the Cycle 02 low-token entrypoint.
- Latest iteration guidance points agents to Cycle 02 constraints before long document reads.

## 1.2.0 — Layered Audit Delivery（2026-05-09）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: pending; reviewer: project_owner; audit_ref: user request 2026-05-09 layered update

### Added

- `scripts/audit-core/audit_schema.mjs` — schema/shape validation layer for Audit Packets.
- Reference validation for local `source_refs`, backed by fast Git path discovery with filesystem fallback.
- Rich audit results with severity summaries, required evidence, suggested revisions, decision reasons, review paths, and routing targets.
- `npm run audit:flow` — generates simulated accept/revise/quarantine/discard memory-flow folders under `dist/memory-flow/`.
- `npm run audit:profile` — local timing profile for repeated audit runs.
- `docs/ITERATION-GUIDE-1.2.0.md` and a simulated FDE field-interview source note.

### Changed

- HTML reports now include routing targets, review paths, required evidence, and suggested revisions.
- Packet parsing now reads packet files concurrently and avoids repeated full-text scans during YAML parsing.
- Known-path lookup now prefers `git ls-files --cached --others --exclude-standard -z`, avoiding broad filesystem scans during normal audit runs.
- Release gate and doctor now know about the expanded audit-flow/profile commands.

## 1.1.0 — Evidence-First Audit Layer（2026-05-09）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: pending; reviewer: project_owner; audit_ref: user iteration brief 2026-05-09

### Added

- `examples/audit-packets/` — four runnable Audit Packet examples covering `accept`, `revise`, `quarantine`, and `discard`.
- `scripts/audit-core/` — local structural audit rules for source refs, audit refs, unsafe memory writes, circular reasoning, overgeneralization, stale context, and unclear boundaries.
- `npm run audit` — audits packets and writes `dist/audit-results.json`.
- `npm run report` — generates clean HTML reports under `dist/reports/`.
- `npm run test` — verifies routing decisions, refusal points, FDE human-review behavior, and HTML report generation.
- `docs/EVIDENCE-FIRST-AUDIT-LAYER.md` and `schemas/audit-packet.schema.json`.

### Changed

- README now frames Mercury as an evidence-first audit layer for AI-generated memory, Agent outputs, and FDE delivery artifacts.
- `npm run doctor`, `npm run release:gate`, and GitHub CI now include the audit/report/test loop.
- Latest iteration guide now points fresh agents to Audit Packets as the runnable review unit.

## 1.0.2 — Proof Pack Reactivation Patch（2026-05-09）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: pending; reviewer: project_owner; audit_ref: docs/NEXT-PHASE-MEMORY.md

### Added

- `docs/PROOF-PACK-001.md` — first proof-pack seed for real AI memory-audit interception cases.
- Meshy BlackBox artifacts covering raw source summary, V8.1 analysis, audit report, and frozen PSP iteration memo.

### Fixed

- `npm run validate:incr` now reads Git paths with `core.quotePath=false`, so Chinese filenames and untracked artifacts are not silently skipped.
- `npm run validate:incr` now applies required audit-report and decision-log heading checks to changed files.
- Meshy audit report now includes the required `被审计结论` and `最可能错误点` sections.

### Changed

- README positioning now emphasizes the narrower memory-audit-layer claim.
- `docs/ITERATION-GUIDE-LATEST.md` now points future reactivation work toward Proof Pack accumulation instead of feature expansion.

## 1.0.1 — Incremental Reactivation Fix（2026-05-05）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: pending; reviewer: project_owner; audit_ref: docs/ITERATION-HANDOFF-1.0.0.md

### Added

- `npm run validate:incr` — validates changed text files and core release surfaces for low-context exploration.
- `npm run index:incr` — skips indexing when no source artifacts changed and falls back to canonical indexing when needed.
- `npm run guide:latest` — regenerates `docs/ITERATION-GUIDE-LATEST.md` from version surfaces.

### Changed

- `npm run release:gate` now runs `guide:latest`, `validate:incr`, and `index:incr` before the full release checks.
- `npm run doctor` now verifies the incremental/reactivation scripts exist.
- Reactivation docs now start with incremental commands before full scans.

## 1.0.0 — Feature Freeze（2026-05-05）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: pending; reviewer: project_owner; audit_ref: docs/ITERATION-HANDOFF-1.0.0.md

### Added

- `AGENTS.md` — fresh-agent entrypoint for low-context work.
- `MEMORY.md` — short cross-session handoff for freeze/reactivation work.
- `docs/ITERATION-GUIDE-LATEST.md` — current iteration anchor for future agents.
- `docs/CHECKLIST-REACTIVATION.md` — six-month reactivation checklist.
- `docs/AGENT-CONTEXT-BUDGET.md` — context-cost and session-splitting policy.
- `scripts/release_gate.ps1` + `npm run release:gate` — one-command release gate with generated bundle cleanup.
- `install/` — macOS/Linux, Windows, and Termux install scripts plus install guide.
- `.github/workflows/ci.yml` — cross-platform GitHub Actions gate for install, doctor, validate, and index.
- `npm run validate:incr`, `npm run index:incr`, and `npm run guide:latest` — low-context reactivation commands for future agents.

### Changed

- Version surfaces now declare `1.0.0` and `1.0.0 Feature Freeze`.
- Mercury iteration skill reads low-context handoff files before long guides.
- Sample indexing excludes generated exports/manifests from reusable memory samples and fills stable sample-type inference.

### Next Candidates

- `1.0.x`: critical bug fixes only.
- `1.1.0`: Codex 5.5 adaptation and MCP server activation if the platform support is real.
- `1.2.0`: plugin system and internationalization if external demand appears.

## 0.9.0 — 从概念声明走向可运行证明（2026-05-04）

> Provenance: `[AI_GENERATED]` drafted_by: Codex; humanReviewed: true; reviewer: project_owner; audit_ref: docs/METHODOLOGY-INTEGRITY.md

### Added

- `docs/v0.9-proof-of-audit.md` — 第一个端到端坏记忆拦截案例，展示审计层如何拦截虚假AI结论，满足IC Memo重开条件"1个真实迁移案例"
- `schemas/audit-export-contract.json` + `schemas/examples/` — Audit Export Contract JSON Schema，3合规+2反例，可被ajv验证
- `04_memory_candidates/`、`05_decision_logs/`、`07_audit_reports/` — 完整拦截链路artifacts
- `docs/METHODOLOGY-INTEGRITY.md` — 解释并修复"AI协作悖论"：问题不在AI写了，在于写了没声明
- `docs/MINIMAL-WORKFLOW.md` — 4层最小可用集，2分钟理解完整路径
- `docs/ITERATION-0.9-EXECUTION.md` — 逐行执行清单
- `10_exports/demo-preaudit-bundle.json` — 端到端demo导出包
- `docs/ITERATION-GUIDE-0.9.md` — 综合5份审计报告（含IC Memo Opus 4.7）的前瞻性迭代指导，含Opus 4.7元认知记录

### Changed

- Release hardening pass (2026-05-05): package/version surfaces now declare `0.9.0`, README/DEMO include a release gate, and sample indexing excludes generated exports/manifests from reusable memory samples.
- Agent context budget pass (2026-05-05): added `MEMORY.md`, `docs/ITERATION-GUIDE-LATEST.md`, and `docs/AGENT-CONTEXT-BUDGET.md`; updated Mercury iteration skills to read low-context handoff files before long guides.
- Project-level agent portability pass (2026-05-05): added `AGENTS.md` and `npm run release:gate` so fresh coding agents can follow the low-context release workflow without local memory or private skills.
- `README.md` — 新增30秒锚点（英文一句话 + terminal输出 + 这不是什么列表）
- `DEMO.md` — 重写为可运行的15分钟端到端指南
- CHANGELOG所有条目加 provenance 声明
- 6个SKILL.md（mercury-lab/fact-cleaner/equilibrium-explainer/constraint-checker/redteam-auditor/action-translator）全修：补 allowed_tools + trigger_eval 测试集
- `config/state-machine.json` — 删除 indexed→superseded 不合理跳转
- `docs/AUDIT-CONTRACT.md` — 增加元规则：本项目自身产出必须通过本项目审计标准
- `docs/GOVERNANCE.md` — 记录碎片循环问题

## 0.8.0 — Memory Pre-Audit Contract

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Added

- `docs/AUDIT-CONTRACT.md`：明确 Mercury Lab 是长期 Agent Brain 前的 pre-ingestion audit gate，不是 second brain、检索引擎或通用 Skill 框架。
- `config/memory-targets.json`：声明 `markdown`、`mercury_agent`、`gbrain` 三类目标后端，默认只做 export-only handoff，不直接写运行时数据库。
- `scripts/export_memory_bundle.mjs`：新增 `npm run export:memory`、`npm run export:gbrain`、`npm run export:agent`，从 `11_indexes/sample-index.json` 生成 pre-audit bundle。
- `schemas/memory-preaudit-bundle.schema.json`：定义外部 brain 接收前的 bundle 结构。

### Changed

- `README.md` / `README.en.md`：定位更新为“长期 Agent Brain 前置审计闸门”，并补充 gbrain / Mercury Agent / OpenClaw 的接入边界。
- `docs/GOVERNANCE.md`：升级到 v0.4.0，明确 Mercury Lab 不负责 memory graph / retrieval，只负责入脑前判级与迁移许可。
- `scripts/rebuild_index.mjs`：sample index 新增 `intent`、`reminder_intensity`、`feedback_expected_from`、`target_backend`、`stop_condition`、`falsify_condition` 等迁移审计字段。
- `config/integrations.json` 与 `config/memory-architecture.json` 补充 gbrain / Mercury Agent Second Brain 的 export-only 接入说明。

### Performance

- `export_memory_bundle.mjs` 只读 `sample-index.json`，不扫描 artifact 正文，不触发索引重建，不写外部运行时数据库。
- `validate_artifacts.mjs` 改为显式扫描项目关键目录和根文件，避免未来无关大目录拖慢验证。

---

## 0.7.6 — Agent 模式性能护栏

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Changed

- `scripts/run_v8_analysis.mjs`：Agent 模式默认不再重建索引，避免 OpenClaw / Agent 在封闭任务包后又触发全量索引扫描；如确实需要，可传 `--index` 或设置 `agent_auto_rebuild_index=true`。
- Agent 任务包中的执行说明改为：只有 `requested_outputs.index` 非空时才运行 `npm run index`，避免默认消耗额外上下文和文件系统预算。
- `config/methods.json` 新增 `auto_rebuild_index` 与 `agent_auto_rebuild_index`，把 API 模式和 Agent 模式的索引策略拆开。

### Performance

- `scripts/validate_artifacts.mjs` 跳过 `.git`、`node_modules`、构建缓存目录，并跳过 2MB 以上的文本类文件，降低仓库增长后的验证成本。
- `scripts/rebuild_index.mjs` 对缺失目录和 2MB 以上文本类文件做安全跳过，减少全量索引在大文件/临时导出上的卡顿风险。

---

## 0.7.5 — `/goal` 输出收口修正

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Fixed

- 修复 `goal-validator.mjs` 在验证状态行中间硬插入四关检验与 Judgment Closure，导致 Markdown 渲染错位的问题。
- 生成 action_plan 时会先移除模板中已有的 `四关检验`、`Judgment Closure`、`Next Review` section，再统一追加受控尾部，避免重复注入。
- intent 推断改为“明确时间表达 → immediate，否则 archived”，不再把“尽快”这类弱时间词自动判成 strict reminder。
- 时间维度对 `archived` 改为冷存储通过，避免“无明确时间 → archived”却无法生成 artifact 的逻辑矛盾。

### Changed

- `09_templates/action_plan_template.md` 升级到 schema v0.2，补齐 `intent`、`reminder_intensity`、`feedback_expected_from` 与 Judgment Closure 骨架。
- `feedback_expected_from` 随 action_plan 生成写入 metadata 与 Next Review，保留反馈入口但不转成热提醒。

---

## 0.7.4 — 冷存储原则 + intent 字段落地

> Provenance: `[AI_ASSISTED]` source: "2026-05-04 用户与 AI 协作完成"; humanReviewed: true-by-claim; reviewer: project_owner; audit_ref: docs/METHODOLOGY-INTEGRITY.md

### Added

- `09_templates/action_plan_template.md`（v0.2）：
  - 新增 `intent` 字段（archived / immediate / watchful）
  - 新增 Judgment Closure section（结论摘要 / 弱推荐 / 继续入口）
- `scripts/goal-validator.mjs`：
  - 生成 action_plan 时自动推断 intent：有时间词 → immediate，否则 archived
  - 自动注入 Judgment Closure 骨架
  - intent=archived 时在 Next Review 标注"无需执行跟进"
- `docs/STRATEGIC-RETHINK.md`（v0.3.0）：完整记录本次讨论过程
- `docs/GOVERNANCE.md`（v0.3.0）：新增交互原则、存储原则、intent 分类说明

### Design Notes

- **冷存储，不是热提醒**：用户不推进是正常结束，不需要提醒
- **结论优先，开口次之，推荐要弱**：洞察在那里，给一个清晰结论是最健康的；开口存在但不主动推
- **intent 分类**：archived（洞察存档，无提醒）/ immediate（立即执行，严格提醒）/ watchful（观望，轻提醒）
- **Judgment Closure 优化**：结论摘要直接给出；弱推荐很弱不转移焦点；继续入口存在但不突出

---

## 0.7.3 — 定位语收紧

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Changed

- `README.md` 首屏增加主打语：「不让聪明变成垃圾」。
- `README.md` 核心定位补充：Mercury Lab 不是帮你思考，而是判断哪些思考值得留下、推进、复用。
- `README.md` 用「前额叶里的一个质检闸门」替代「第二前额叶」式表达。
- `README.en.md` 和 `DEMO.md` 同步补充 quality gate 定位。

## 0.7.2 — 外部可见样本路径

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Added

- `DEMO.md`：3 分钟演示一段混乱想法如何变成可复盘项目材料。
- `examples/`：新增 `ai-consulting-replacement` 完整样本链。
- `sample_index.md`：解释 `sample-index.json` 与普通文件索引的区别。
- `npm run index` 现在会扫描 `examples/`，让 demo 样本进入样本级视图。

### Changed

- `README.md` / `README.en.md` 增加首屏 demo 入口，先给外部读者可点击样本，再解释方法论。
- README 文档索引移除不存在的 0.7.1 迭代指引链接，改指向治理目标和示例样本。

## 0.7.1 — 样本索引初版

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Added

- `npm run index` 现在同时生成 `11_indexes/sample-index.json`，作为样本库的机器可读视图。
- `sample-index.json` 暴露 `sample_type`、`project_id`、`reuse_count`、`reuse_refs`、`feedback_status`、`feedback_refs`、`memory_level`、`confidence` 和 `risk`。
- 样本索引会汇总缺口：未判级、未绑定项目、无复用追踪、决策/行动无反馈。
- SQLite artifact 表同步增加样本判级、项目、复用、反馈和风险字段。

### Changed

- `README.md` / `README.en.md` 增加 source index 与 sample index 的区别。
- `docs/GOVERNANCE.md` 升级到 v0.2.1：样本库索引从“未做”调整为“初版已做”，后续重点转向检索、复用追踪和反馈回填。

## 0.7.0 — 核心定位声明 + 碎片循环问题确认

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

### Changed

- `README.md`：核心定位升级为「面向高频 AI 对话者的洞察样本沉淀系统」，替换旧版「意图识别的保险」定位
- 明确 Mercury Lab 的本质边界：**不是**普通知识库，**不是**通用 AI 审计平台
- 明确核心问题：高价值碎片若不经过目标验证、类型判级、案例绑定、审计记录和复用出口，会变成干净但无用的知识碎片

### Added

- `docs/GOVERNANCE.md`（v0.2.0）：核心目标定义、判级类型表、核心数据流、架构优先级、下一步方向
- `08_skills/SKILL-DESIGN-GUIDE.md`：Skill 最佳实践存档（按需加载 / 渐进式披露 / allowed_tools / trigger_eval / 验证闭环）
- `08_skills/SKILL-AUDIT.md`：项目 Skill 审计报告 + 碎片循环问题发现

### Known Issues（v0.7.0 已知缺失）

- **样本库无索引**：artifact 存在于各目录，但没有检索和相似案例发现机制
- **复用无追踪**：没有引用计数、复用记录和淘汰机制
- **判级无回填**：artifact metadata 中缺少判级类型标签（废料/素材/案例/模板/决策/action/Skill）
- **反馈无入口**：decision_log 和 action_plan 的执行结果没有强制回填机制

---

## 0.6.0 — `/goal` 照妖镜 + Agent 内嵌验证

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

将目标质量门内化为 Agent 内嵌逻辑，实现零进程开销验证。与 v0.5.2 的 agent_context_policy 一脉相承：Agent 模式不能只是"不调 API"，还必须把任务边界收窄成可直接执行的闭合上下文包。

### Added

- `scripts/goal-validator.mjs`：可内嵌的纯函数，5 维度目标质量验证（可交付物、可验证性、时间边界、范围边界、责任归属）+ PIES-min 四关检验（案例关、模板关、决策关、反馈关）。
- `/api/goal/validate` 和 `/api/goal/create` 接入 dashboard_server（用于人工调试，不建议 Agent 循环中调用）。
- `npm run goal:validate` 入口（仅 CLI 调试用）。
- Action plan artifact 生成时自动注入四关检验结果、验收条件提取、 Judgment Closure 骨架。

### Changed

- `goal-validator.mjs` 重写为纯函数（`validate(text)`），设计为直接内嵌 Agent 上下文，不新建进程，不扫描文件系统。CLI 模式仅用于人工调试。
- `docs/JUDGMENT-CLOSURE-RULE.md` 升级到 0.6.0：新增 5 维度验证 + 四关检验 + Agent 模式内嵌执行约束（禁止新建进程、禁止全项目扫描）。
- `docs/AGENT_ENTRY.md` 新增 `/goal` 照妖镜入口质量门章节，说明 5 维度 + 四关 + Agent 执行约束。

### Design Notes

- 5 维度验证解决"用户说不清楚自己要什么"问题（照妖镜）；四关检验解决"概念无法落地"问题（PIES-min）。两者层次不同，先过 5 维度，再跑四关。
- 四关有任意一关失败 → 目标仍可继续分析，但 artifact 元数据需标注"四关未全过，素材待验证"，不进 approved 状态。

## 0.5.2 — Agent Context Budget

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Reduce OpenClaw / Agent mode intelligence spend by making V8 agent tasks self-contained and explicitly bounded.

### Added

- `agent_context_policy` in `config/methods.json` to define closed task packs, allowed reads, forbidden project areas, and read budget.
- Agent queue envelopes now embed `source_text`, persona stance, required sections, audit headings, and output targets.
- Agent queue envelopes now include `context_policy.allowed_reads`, `write_targets`, `forbidden_globs`, and a stop rule for missing context.
- Documentation for OpenClaw context budgeting in `docs/AGENT_ENTRY.md`, `docs/openclaw-integration.md`, and `submissions/agent-queue/README.md`.

## 0.5.1 — Execution Mode Guard

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Fix V8 analysis startup and mode switching so persona configuration remains parseable and agent mode does not spend API tokens.

### Fixed

- Restored `config/methods.json` to valid JSON with one stable persona schema and no duplicated top-level persona fields.
- Escaped the V8.2.1 persona wording so JSON parsing no longer fails before analysis starts.
- Made `scripts/run_v8_analysis.mjs` read `execution_mode` and skip API calls in `agent` mode.
- Added `--mode` / `--execution-mode` overrides for one-off API or Agent runs.
- Hardened CLI parsing for `--persona v8.2-dimension-radar`, `--persona=v8.2-dimension-radar`, and `-p v8.2-dimension-radar`.

## 0.3.6 — Judgment Closure

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Tighten PSP outputs so analysis closes with stop conditions, falsification signals, review timing, and memory-level advice. Expand model provider support for hosted OpenAI-compatible APIs and local open-source runtimes.

### Added

- Required PSP closing sections: `停止条件`, `推翻条件`, `复盘时间`, and `记忆建议`.
- Red-team audit checks for external evidence, stop-condition quality, and memory-level risk.
- Memory candidate `memory_level` support with `M0`-`M4` values.
- `docs/JUDGMENT-CLOSURE-RULE.md` describing closure, external audit, and memory grading rules.
- OpenAI-compatible provider expansion: `openai`, `ollama-local`, `vllm-local`, and `lm-studio-local`.
- API key aliases for hosted providers, including `MERCURY_API_KEY`, `OPENAI_API_KEY`, and `MERCURY_OPENAI_API_KEY`.

## 0.3.5 — Deployment Gate

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Release candidate cleanup: clarify upstream boundary, reduce onboarding friction, and make deployment readiness visible in Dashboard.

### Added

- `docs/ARCHITECTURE-SHIFT-REPORT.md` explaining what shifted from upstream Mercury Agent, what was added, what was intentionally not copied, and when future docs/skills require architecture review.
- `docs/DEPLOYMENT-ONBOARDING.md` for token setup, OpenClaw-like endpoint, silent batch submission paths, OS support, and optional document conversion.
- Dashboard deployment readiness card showing Node/OS/provider/API key/persona/execution mode/batch path/OpenClaw/MarkItDown status.

## 0.3.4 — Persona Axis

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Architecture pollution fix: split PSP analysis persona from execution mode.

### Added

- `analysis_persona` 配置字段：把 V8.0 / V8.1 / V8.5 从执行模式中拆出，默认 `v8.1-reality-sync`
- `docs/methods/` 收纳 PSP-V8.0、PSP-V8.1、v8.5 纠偏提示词，减少工作区外依赖
- `docs/ANALYSIS-PERSONA-DESIGN.md` 记录人格轴与执行通道轴的架构边界
- Dashboard Analysis persona 预览与切换控件，并写回 `config/methods.json`
- `PATCH /api/analysis-persona` Dashboard API
- Dashboard Execution mode 切换控件，并写回 `config/methods.json`
- `PATCH /api/execution-mode` Dashboard API
- `AGENT_ENTRY.md` 和 `mercury-lab` skill 的 API / Agent 模式分流说明
- Dashboard 版本嗅探提示：显示后端版本、前端资源版本、package 版本和 Node 版本，前后端错位时提示刷新或重启
- `execution_mode` 配置字段：支持 API 模式和 Agent 模式切换
- `scripts/run_v8_analysis.mjs` V8.0 自动化执行脚本
- AGENT_ENTRY.md AI 和人类的入口文档
- UX 优化报告：8 项 UI 改进
- 系统成熟度评估文档
- 创新工程实践指导 V8 分析 artifact
- EXECUTION-MODE-DESIGN.md 执行模式设计文档

## 0.3.3 — Execution Mode

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Execution mode feature release.

### Added

- `execution_mode` 配置字段：支持 API 模式和 Agent 模式切换
  - `api`：使用 V8 执行脚本 + API token（确定性高，成本高）
  - `agent`：使用 AI Agent 智能做 V8 分析（成本低，质量依赖 Agent）
- 存储始终激活约束：无论哪种模式，Mercury Lab 的存储管理必须始终激活
- `docs/EXECUTION-MODE-DESIGN.md` 执行模式设计文档

## 0.2.0 — Open Orbit

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Architecture hardening release.

### Added

- Project identity: **Mercury Method Lab**.
- Upstream Mercury Agent compatibility policy for `cosmicstack-labs/mercury-agent`.
- Runtime compatibility check: `npm run check:upstream`.
- Memory architecture migration policy with reversible migration envelopes.
- Rule routing policy for factual cleaning, structural judgment, content diagnosis, action translation, audit, migration, and publication.
- Agile roadmap, publication plan, and source/license policy.
- Public `.gitignore` guardrails for secrets, logs, generated indexes, and local state.
- English reader entrypoint in `README.en.md`.
- Agent-first submission layer for markdown viewpoints and OpenClaw/Hermes-like agent queue envelopes.
- GitHub Issue and PR templates for public intake.
- `npm run import:viewpoint` to promote user viewpoint markdown into raw artifacts without approving it as truth.
- V8.0 自动化执行脚本 `run_v8_analysis.mjs`
- Dashboard UX 8 项优化
- 系统成熟度评估（当前 70%，缺少 fact-cleaner 和 Dashboard 集成）

### Changed

- Package name changed from `v8-mercury-backend` to `mercury-method-lab`.
- Package version changed from `0.1.0` to `0.2.0`.
- README now describes this repository as a companion method lab, not the Mercury runtime.

### Compatibility

- Observed upstream package: `@cosmicstack/mercury-agent@1.1.4`.
- Target range: `>=1.1.0 <2.0.0`.
- Integration mode: companion workspace, not fork and not vendor copy.

## 0.1.0

> Provenance: `[LEGACY_PROVENANCE_UNKNOWN]` humanReviewed: unknown; reviewer: pending; risk: historical release note predates explicit provenance policy

Initial local V8 Mercury backend workspace.
