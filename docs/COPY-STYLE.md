# Copy Style — Display Layer

```yaml
provenance:
  authors: project_owner (rule) + Claude (audit, mapping, lint; AI-assisted, v2.4.1)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  scope: human-facing UI copy (dashboard/app/i18n.js). Not API, data, SDK, or docs vocabulary.
```

## The rule

1. **Mechanic words, not memes.** Game vocabulary may be used where a game
   *mechanic* maps onto a project mechanic: save file, unlock, prerequisite,
   storage, level, quest. Memes (GG, 破防, yyds…) may not.
2. **Display layer only.** Identifiers never change: `quarantine`,
   `missing_source_refs`, `can_use_as_fact`, and the rest are API/data vocabulary
   (CONTEXT.md). The friendly word explains; the canonical word stays visible
   (the verdict shows `quarantine` large, the explanation line uses 仓库).
3. **Fewer adverbials.** Lead with the verb or the outcome. At most one
   modifier before the point. Split rather than nest: "可以存档。出了生效范围就失效。"
   instead of "可在声明范围内进入长期记忆。"
4. **Short sentences.** At most 24 CJK characters per Chinese sentence in UI copy.

Rules 1, 3 (partly) and 4 are checked by `npm run dashboard:check`.

## Why mechanic words work here

Game terms that stick describe **states and conditions**, and this project is a
state machine: four routes, a fact status that unlocks only after evidence,
downgrades when a prerequisite is missing. When the word maps onto the actual
mechanism, the reader gets it at once and the word does not age.

The owner's observation that game terms "last longer" than internet slang is
plausible but unmeasured. The survivors are the ones that name a universal
mechanic; the meme-shaped ones faded. That is why rule 1 selects on
*mechanic*, not on *game*.

## Mapping (zh)

| Canonical (unchanged) | Display (zh) | Mechanic it borrows |
|---|---|---|
| accept | 可以存档 | save file |
| revise | 要返修 | repair before use |
| quarantine | 只进仓库，不进存档 | storage ≠ save file |
| discard | 丢弃 | — (kept literal: a joke word would trivialize the one route that must be taken seriously) |
| four checks | 四道关卡：来源关 / 复核关 / 独立关 / 范围关 | levels |
| Run the gate | 闯关 | attempt a level (not 过关: pressing the button is not passing) |
| required_fixes | 怎样翻盘 | comeback |
| choosing an evidence-seeking option | 接任务 | accepting a quest ≠ completing it |
| evidence condition | 解锁条件 | unlock condition |
| pending_upgrade | 降级入库 · 待解锁 | locked content |
| future_usage_policy | 权限 | permissions |
| capture | 丢进收件箱 | — (plain: capture is not memory) |
| deployment readiness | 开局检查 | pre-game check |

Deliberate collision avoided: 仓库 means only quarantine storage. The artifact
view is 资料库.

## English

Game jargon is less mainstream in English. English copy is only simplified
(shorter sentences, outcome first) and borrows two words where they are
ordinary English: *locked* / *unlock*, *quest* in one hint.

## Lowering the threshold beyond words

- **Consequence before choice.** Each A/B/C option previews the permissions it
  grants; *cite as fact* is drawn locked because the contract grants it only
  with evidence or a named review. Users see the 2.3.0 rule before they hit it.
- **Rejected: a recommended option.** It would lower the threshold most, but it
  means the system choosing for the human — against the project's premise (the
  human choice is the gate) and SPEC stop list ("no AI-suggested routing").

## Checklist for new copy

- Does the word name a mechanic that exists here? If not, use the plain word.
- Is the canonical term still visible next to it?
- Does the sentence start with the verb or the outcome?
- Under 24 CJK characters per sentence?
- Would it read as mocking in the discard or quarantine case? Then keep it literal.
