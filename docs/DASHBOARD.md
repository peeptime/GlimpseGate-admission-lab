# Dashboard v3 — Architecture And Design

```yaml
provenance:
  authors: project_owner + Claude (Hyperagent, AI-assisted, v2.4.0)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
```

```bash
npm run dashboard        # http://127.0.0.1:4788
                         # classic GUI: /classic/   offline single file: /lite.html
```

## Why v3

The v2 dashboard had three problems, in order of importance:

1. **It did not use the SDK.** `/api/lite-audit` was a separate regex auditor
   (`liteAudit()` in the server), and `lite.html` carried a third copy. GUI
   routes could disagree with SDK routes, and the 2.3.0 admission-contract
   evidence rule never reached GUI users. The admission contract (the
   project's central idea) had no GUI at all.
2. **It had no request guard.** Any website open in the same browser could
   POST `text/plain` (no CORS preflight) to `127.0.0.1:4788/api/run` or
   `/api/artifact`. The static-file containment check was also not
   separator-aware.
3. **It was hard to use.** One page stacked ten panels (mode toggles,
   readiness, intake, feedback score, queue, metrics, artifact table,
   detail, create form, commands, log) with no primary task, mixed-language
   labels, and developer controls first.

## Architecture

```text
dashboard/
  index.html            v3 shell (no inline script; CSP script-src 'self')
  app/
    main.js             hash router (#/gate #/library #/system), palette, language
    api.js              every server call; same-origin JSON only
    dom.js  i18n.js  motion.js  glyphs.js
    fx/field.js         background: noise-driven quadtree + curl-noise points
    fx/network.js       the gate as a node network (canvas)
    views/gate.js       paste → decision → admit-as choice → contract
    views/library.js    artifacts, status strata, intake queue, lifecycle edits
    views/system.js     readiness, modes, commands, capabilities, log
    styles.css  mark.svg
  classic/              v2 GUI, unchanged except asset paths (kept one release)
  lite.html             offline single file; uses the same-origin API when served

scripts/
  dashboard_server.mjs  project handlers + route table; export createDashboardServer()
  dashboard/
    http.mjs            readJson (size limit), sendJson, serveStatic, guardRequest, CSP
    router.mjs          method+path table; 404 / 405 for unknown API routes
    admission-api.mjs   SDK-backed /api/v1/admission/* and legacy /api/lite-audit
```

No build step and no runtime dependencies, consistent with the SDK.

### Admission API

| Route | Purpose |
|---|---|
| `GET /api/v1/admission/meta` | API and contract versions, object types, routes |
| `POST /api/v1/admission/audit` | `{ text, source_refs?, audit_refs?, risk_level?, evidence_strength?, boundary? }` → decision, reasons, the four gate checks, fixes, evidence chain |
| `POST /api/v1/admission/contract` | same input + `selection` → admission contract. The server recomputes the chain instead of trusting one echoed by the client. |
| `POST /api/lite-audit` | legacy shape (superset), now SDK-backed |

`source:` / `review:` / `来源：` / `复核：` lines in pasted text become
`source_refs` / `audit_refs`. Only explicit lines count; mentioning the word
"source" does not (the old regex accepted that).

### Request guard

- Host must be loopback (blocks DNS rebinding) → otherwise 421.
- State-changing methods: Origin, if present, must be the dashboard's own
  origin → otherwise 403; Content-Type must be `application/json` → otherwise 415.
  `curl` and node scripts (no Origin) still work.
- HTML responses carry a CSP; inline scripts are allowed only by hash (lite.html).

`scripts/test_dashboard_api.mjs` boots the real server on an ephemeral port
and tests every read route, the admission API, the guard, the router, and
static serving. It is part of `npm test`.

## Design

**Direction:** simple, fractal, procedural (Houdini-like). The motion is there
to carry meaning, not to decorate:

| Element | What it encodes |
|---|---|
| **Node network** | The SDK's decision tree (`ROUTING-THEORY.md`): input → source → review → independence → scope → route → four outputs. Node state comes from the result's `checks`; the lit output is the decision. Points travel the wires and take on the route colour after the first failed check. |
| **Route glyphs** | One square at four levels of subdivision: accept = whole; revise = split, one part missing (needs repair); quarantine = a core isolated inside a boundary; discard = dissolved into points. The same glyphs appear in the network, the verdict, and the rail. |
| **Field** | A quadtree whose subdivision follows a slow noise field. More material means deeper subdivision (material decomposes into claims). Points advect through curl noise; while auditing they drift toward the gate, and afterwards the field takes the route colour. |

**Visual system:** one near-black canvas, hairlines instead of cards, one hue
per route (accept `#8fe3b8`, revise `#f0c36b`, quarantine `#a99bff`,
discard `#ff7a6b`), grotesk for prose, monospace for vocabulary and data. No
web fonts: the dashboard must work offline.

**Humane defaults:**
- One primary task per view. The Gate view has a single primary button (⌘↵).
- Three examples on the Gate view, one per interesting route.
- The input column stays in place while a long result scrolls.
- Derived gaps (`required_evidence:*`) are folded behind the named failure modes they restate.
- The contract states in plain words what was downgraded and what is missing.
- Input survives view switches (sessionStorage).
- Motion levels `full` / `calm` / `off`; defaults to `calm` under
  `prefers-reduced-motion`; animation pauses in background tabs.
- ⌘K palette for views and allowlisted commands; Alt+1/2/3 switches views.
- zh / en; the server's `general.language` preference is used until the user picks.

## Not in v3

- The classic GUI's onboarding wizard, desktop notifications, and full
  seven-category settings editor. They remain at `/classic/`. The classic GUI
  should be removed in a later release once v3 covers what is still used there.
- A light theme.
- Automated visual regression tests. v3 was checked by hand against recorded
  API responses (all three views, both languages).
