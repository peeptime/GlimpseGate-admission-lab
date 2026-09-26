# Blueprint 2.6.0 — Disagreement Ledger

```yaml
provenance:
  authors: project_owner (direction) + Claude (Hyperagent, AI-assisted spec)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  status: blueprint — not started; see docs/OBSERVATION-MODE.md for when it starts
  depends_on: 2.5.0
```

## Question

> Does the human choice add information that automatic typing does not?
> (docs/ADMISSION-TAXONOMY.md §6)

This is the project's core empirical claim and it is untested. MemIR (2026)
already restricts factual authorization to evidence-supported claims
automatically. If automatic typing gets the same result on the same
candidates, the choice gate is ceremony. 2.6.0 builds the instrument that
answers this, and nothing else.

It needs no outside world: only cases and reviewer time. That makes it the
default next step during observation mode.

## Design

### 1. Baseline typer (SDK, additive)

`autoType(chain) → { object_type, rule }`: a deterministic, evidence-only rule.

| Condition | Auto type |
|---|---|
| qualifying evidence present (same test as the 2.3.0 evidence condition) | fact |
| route is `revise` | hypothesis |
| route is `quarantine` | open_question |
| route is `discard` | (not admitted) |

It is a **comparison baseline, not a suggestion.** SPEC stop list: no
AI-suggested routing. Therefore:

- **Blind by construction.** The GUI reveals the auto type only *after* the
  human has built the contract. The API returns it only when
  `reveal_baseline: true` is sent with a contract that already exists.
- It never changes a route or a contract.

### 2. Ledger

Append-only `data/disagreement-ledger.jsonl`, one line per decision:

```yaml
case_id:          sha256 of normalized input (text + refs + risk + boundary)
reviewer:         named; "pending" is not allowed in the ledger
human_choice:     gap_id / choice_id / object_type (from the contract)
auto_type:        from autoType
agree:            human object_type == auto_type
rationale:        required when agree == false (one line)
ruleset_version, contract_version, feedback_lang
at:               ISO timestamp
```

Second-reviewer mode: a second named reviewer decides the same `case_id`
without seeing the first reviewer's line (the GUI hides earlier entries for
that case).

### 3. Report

`npm run ledger:report` → `dist/ledger/README.md`:

1. **The disagreement table** (primary): each disagreement with both choices and the rationale.
2. Counts: cases, agreements, disagreements per route and per gap.
3. Inter-rater agreement between two humans (Cohen's κ), **descriptive only**.

Tension to state openly: the SPEC stop list forbids "numerical scoring or
optimization targets". κ is a diagnostic of the *method*, not a score for
content. It must never gate a release or appear as a goal. The report prints
the disagreement table first for that reason.

### 4. GUI

After "生成准入契约" / "Build admission contract": a quiet reveal row
("自动判定：hypothesis · 一致" / "不一致 → 写一句理由"). The rationale field is
required when they differ, and the ledger line is written on submit.

## Acceptance criteria

- [ ] `autoType` in SDK with tests; never alters routes or contracts
- [ ] Baseline is unreachable before a contract exists (API test)
- [ ] Ledger schema validated by `npm run validate`
- [ ] ≥ 20 cases ledgered by the owner, from `cases/` and Proof Packs
- [ ] ≥ 8 of those decided blind by a second named person
- [ ] Report generated; ADMISSION-TAXONOMY.md §6 updated with a conclusion,
      **including the possible conclusion that the gate adds nothing**

## Non-goals

- No LLM in the loop; no automatic case generation.
- No public claim from fewer than the acceptance counts.
- No UI polish beyond the reveal row.

## Risks

| Risk | Mitigation |
|---|---|
| The owner is the only reviewer | 2.6.0 is not "done" without the second reviewer; say so rather than ship half |
| Anchoring on the baseline | Blind reveal; the order is enforced by the API |
| Cases too easy (all agree) | Include Proof Pack edge cases; report per gap, not only overall |
