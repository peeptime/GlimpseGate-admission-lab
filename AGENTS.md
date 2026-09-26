# Agent Instructions

This repository is optimized for short, verifiable agent sessions. Do not rediscover the whole project for small release or text updates.

## Start Here

1. Read `MEMORY.md`.
2. Read `docs/ITERATION-GUIDE-LATEST.md`.
3. Read only the file directly touched by the user request.
4. Use search before opening long documents.

Read `docs/ARCHIVED/ITERATION-GUIDE-0.9.md`, `CHANGELOG.md`, `docs/AUDIT-CONTRACT.md`, or `docs/GOVERNANCE.md` only when their detailed wording is needed.

## Context Budget

Use `docs/AGENT-CONTEXT-BUDGET.md` for token/session policy.

Default rules:

- Split long work into analysis, edit, verification, and publish sessions.
- End long work by updating `MEMORY.md` with the current state and next command.
- Do not paste raw reports into `MEMORY.md`.
- Do not treat total tokens alone as a cost diagnosis; separate input, cached input, output, and reasoning tokens when available.

Fast exploration commands:

```powershell
npm run validate:incr
npm run index:incr
npm run guide:latest
```

## Release Gate

Use the project gate instead of manually rediscovering checks:

```powershell
npm run release:gate
```

Use dry-run first when exploring:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release_gate.ps1 -DryRun
```

The bad-memory intercept must continue to export `routing_decision: discard`.

## Hard Boundaries

- Preserve `00_raw`; never rewrite raw evidence to make later conclusions cleaner.
- Do not invent `source_refs`, `audit_refs`, provenance, or review evidence.
- Do not add new artifact types, backend adapters, AI scoring, RAG, or fine-tuning audit features unless explicitly requested.
- Clean generated verification outputs unless they are intentionally tracked.
