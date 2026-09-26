# Releases

版本记录以本文件为准。GitHub Releases 页面目前停在 v2.2.0：2.3.0 之后的版本没有在那里发布，内容全部在下表和 `docs/releases/` 里。
This file is the release record. The GitHub Releases page stops at v2.2.0; versions after it are recorded here and in `docs/releases/`.

| Version | Codename | Merged to main | Commit | Notes |
|---|---|---|---|---|
| **2.5.0** (latest) | Feedback Language | 2026-09-26 · #4 | `f1e4b09` | [docs/releases/v2.5.0.md](docs/releases/v2.5.0.md) |
| 2.4.1 | Mechanic Words | 2026-09-26 · #3 | `d3c94e5` | [docs/releases/v2.4.1.md](docs/releases/v2.4.1.md) |
| 2.4.0 | Gate GUI v3 | 2026-09-26 · #2 | `2a9a5fd` | [docs/releases/v2.4.0.md](docs/releases/v2.4.0.md) |
| 2.3.0 | Restart: Admission Hardening | 2026-09-26 · #1 | `f9e654e` | [docs/releases/v2.3.0.md](docs/releases/v2.3.0.md) |
| 2.2.0 | SPEC-First + Shared Language | 2026-05-21 | `b52f81b` | [GitHub Release](https://github.com/peeptime/GlimpseGate-admission-lab/releases/tag/v2.2.0) |

Earlier versions: `CHANGELOG.md`.

## Publishing to GitHub Releases later (optional)

Anyone with write access can publish the four entries above without editing
anything: GitHub → Releases → Draft a new release → tag `v2.x.y`, target the
commit above, paste the matching `docs/releases/v2.x.y.md`. Or run the
`GitHub Release Publisher` skill with a repository token.
