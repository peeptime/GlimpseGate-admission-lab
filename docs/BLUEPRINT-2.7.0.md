# Blueprint 2.7.0 — Revision State + Agent Surface

```yaml
provenance:
  authors: project_owner (direction) + Claude (Hyperagent, AI-assisted spec)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  status: blueprint — conditional; each part starts only on its trigger (docs/OBSERVATION-MODE.md)
  depends_on: 2.6.0 conclusion
```

2.7.0 is three parts that can ship separately. **None is committed.** Each
part names the trigger that would start it and the finding that would cancel it.

## Part A — Revision state for admitted objects

**Why:** an admitted object cannot currently be marked superseded or
retracted (ADMISSION-TAXONOMY.md §1). Tenure and Kumiho treat revision as
first-class; OWASP AISVS C8 includes expiry and revocation.

**Spec (minimal, additive):**

```yaml
admitted_object.revision:
  state: current | superseded | retracted
  superseded_by: <contract id>        # when superseded
  reason: <one line>                  # required for superseded / retracted
  at: <ISO>
  by: <named reviewer>
```

- `supersede(oldContract, newContract, {reason, by})` and `retract(contract, {reason, by})` in the SDK. Both return new contracts; originals are immutable (append, never edit, as in Kumiho's rejection of AGM Recovery).
- A superseded or retracted object loses every usage right: `forbidden_uses` gets all three.
- CONTEXT.md terms before code (SPEC P4).

**Trigger:** the owner has a real case where an admitted fact became wrong,
or 2.6.0 shows owners revising earlier choices.
**Cancel if:** 2.6.0 concludes the choice gate adds nothing. Revision of
choices would then be decoration on ceremony.

## Part B — Agent surface: stable feedback codes in the SDK

**Why:** 2.5.0 gives every feedback string a stable `code`, but only through
the dashboard API. SDK integrators (agents) still parse English prose.

**Spec (additive, non-breaking):**

- Move the code catalog (not the translations) into the SDK. Results gain
  `required_fixes_detail: [{ code, text }]` and the same for gaps and options.
- Prose fields unchanged. Translations stay in the display layer.
- `index.d.ts` gains the code union type; codes are versioned with the ruleset.

**Trigger:** any external integrator (or the owner's own agent) keys on
feedback text, or an agent protocol standardizes machine-readable
remediation hints.
**Cancel if:** no integrator appears and the owner does not build an agent on
the SDK. The display-layer codes are enough.

## Part C — Protocol exposure (MCP tool manifest)

**Why:** agents increasingly consume capabilities as tools. An MCP manifest
exposing `audit` and `buildAdmissionContract` would make the gate reachable
without custom integration.

**Scope decision needed first:** the SPEC stop list forbids *backend
adapters* (storage) and publishing without an integration review. A tool
manifest is exposure, not storage, but it is still a new public surface.
The owner decides whether it fits; this blueprint does not assume yes.

**Trigger:** the relevant protocol's memory or provenance conventions
stabilize, **and** the owner approves the scope change.
**Cancel if:** major agent platforms ship native typed memory with usage
rights. GlimpseGate then repositions as a policy layer over those, and a
separate tool surface would duplicate them.

## Also in 2.7.0 if still pending

- Remove `/classic/` once the owner confirms nothing there is still used (2.4.0 decision).
- Re-capture `benchmark:v2` baseline (open since 2.3.0).

## Acceptance (per part)

| Part | Done when |
|---|---|
| A | revision ops + tests; contract schema updated; GUI shows revision state; CONTEXT.md terms |
| B | `*_detail` fields with codes; d.ts union; consumer test keys on codes |
| C | owner scope approval recorded in SPEC.md; manifest validates against the protocol's schema; integration review done |
