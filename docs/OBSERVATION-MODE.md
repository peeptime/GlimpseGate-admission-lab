# Observation Mode — Expectation Management After 2.5.0

```yaml
provenance:
  authors: project_owner (direction) + Claude (Hyperagent, AI-assisted)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  entered: 2026-09-26 (after 2.5.0)
```

After 2.5.0 the project goes quiet on purpose. Feature work stops. The
direction of 2.6.0+ is set by **what changes in the outside world** and by
**what the project's own evidence shows**, not by a release calendar.

There are no dates here. Each item is a trigger with an action.

## What to expect during the quiet period

Expected, and **not** a problem:

- No stars, no external users, no integrations. Nothing has been published
  to npm (stop list), and nothing has been announced.
- No benchmark numbers. The project has never claimed any.
- The core claim (human choice beats automatic typing) stays unproven until 2.6.0 runs.

A surprise worth acting on:

- Someone outside uses the SDK or the dashboard → read their usage before anything else; it outranks every blueprint.
- A platform or protocol ships something that makes a blueprint part obsolete → cancel that part (each part lists its cancel condition).

## Default action if nothing changes

Run **2.6.0 (Disagreement Ledger)** at the owner's pace. It needs no outside
world: only cases and a second reviewer. Do not start 2.7.0 without a trigger.

## Watch list

Signals, where to look, and what each would change. Checking is
owner-initiated; there is no schedule. Record a check in
`docs/observations/` (template below) only when something changed.

| # | Signal | Where to look | If it happens |
|---|---|---|---|
| W1 | A major agent platform exposes **typed memory with usage rights** (fact / hypothesis / may-act distinctions) through an API | Platform memory docs and changelogs | Reposition GlimpseGate as a policy layer over it; cancel 2.7.0 Part C; re-read RELATED-WORK novelty boundary |
| W2 | An agent protocol standardizes **memory provenance or remediation fields** | Protocol specs and their memory/resources discussions | Map the admission contract to it; this is the trigger for 2.7.0 Part B, and Part C with owner approval |
| W3 | A **memory-admission benchmark** appears (successors to LoCoMo / BEAM / PrecisionMemBench that test write-time decisions) | arXiv, benchmark repos | Evaluate the SDK on it after 2.6.0; do not chase it before the ledger exists |
| W4 | New **typed / epistemic memory** work beyond MemIR, Tenure, Kumiho | arXiv | Update RELATED-WORK.md; re-check the novelty boundary before any public claim |
| W5 | **Memory poisoning** results beyond AgentPoison / MINJA that target write-time gates | Security venues, OWASP AISVS C8 revisions | Re-scope the anti-gaming gate or state its limits more loudly |
| W6 | **Provenance obligations** in regulation (e.g. EU AI Act transparency duties) reach agent memory | Official texts, not commentary | Check whether provenance fields in the contract should become required |
| W7 | The **display vocabulary ages**: a mechanic word starts to read as a meme or confuses users | Owner's own use; any user feedback | Replace it under COPY-STYLE rules; the lint keeps identifiers safe |
| W8 | The owner's own **agent workflow changes** (new tools, new memory stores) | Owner's practice | Often the strongest signal for this project; may trigger 2.7.0 Part A or B |

Every row is a question to check, not a claim that it is happening. The
table deliberately asserts nothing about the current state of any
platform, protocol, or law.

## How plans change

| Evidence | Plan change |
|---|---|
| 2.6.0 shows the gate adds information | Keep the thesis; 2.7.0 Part A becomes likely |
| 2.6.0 shows it adds nothing | Say so in ADMISSION-TAXONOMY §6. Cancel Part A. Consider repositioning as usage-rights typing without the choice ceremony |
| W1 happens | Policy-layer repositioning takes priority over all blueprints |
| W2 happens | Part B, then Part C (with owner approval) |
| Nothing happens | Stay quiet; run 2.6.0 at the owner's pace |

## Observation note template

```markdown
# Observation — <short title>
- date: YYYY-MM-DD
- signal: W<n>
- source: <primary link>
- what changed: <one or two lines>
- effect on plan: none | reorder | cancel <part> | start <part>
- decided by: <named>
```

## What this is not

- Not a roadmap with dates.
- Not a promise that 2.6.0 or 2.7.0 will ship.
- Not a reason to stop fixing real bugs: bug fixes and security fixes stay allowed during observation mode.
