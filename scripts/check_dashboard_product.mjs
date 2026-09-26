// Dashboard product checks (v3 / 2.4.0). Structural guarantees that tests
// alone do not express: architecture boundaries, offline-ness, accessibility
// affordances, and the classic GUI staying reachable.
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [];
const read = (p) => readFile(join(root, p), "utf8");

const index = await read("dashboard/index.html");
const server = await read("scripts/dashboard_server.mjs");
const admission = await read("scripts/dashboard/admission-api.mjs");
const http = await read("scripts/dashboard/http.mjs");
const lite = await read("dashboard/lite.html");
const classic = await read("dashboard/classic/index.html");
const css = await read("dashboard/app/styles.css");
const preferences = JSON.parse(await read("config/preferences.json"));
const liteStat = await stat(join(root, "dashboard/lite.html"));
const appFiles = await walk(join(root, "dashboard/app"));
const appText = (await Promise.all(appFiles.map((f) => readFile(f, "utf8")))).join("\n");

// v3 GUI
check("v3 GUI loads one ES module entry", /<script type="module" src="\/app\/main\.js"><\/script>/.test(index));
check("v3 GUI has no inline scripts (CSP script-src 'self')", !/<script(?![^>]*\bsrc=)[^>]*>/i.test(index));
check("v3 GUI has no inline event handlers", !/\son[a-z]+="/i.test(index) && !/\son[a-z]+=\\?"/.test(appText));
check("v3 GUI needs no network beyond the local server", !/https?:\/\/(?!127\.0\.0\.1|localhost|www\.w3\.org\/2000\/svg)/.test(appText + index));
check("v3 GUI has three views: gate, library, system", ["mountGate", "mountLibrary", "mountSystem"].every((t) => appText.includes(`export function ${t}`)));
check("v3 GUI respects reduced motion", css.includes("prefers-reduced-motion") && appText.includes("prefers-reduced-motion"));
check("v3 GUI pauses animation in background tabs", appText.includes("visibilitychange"));
check("v3 GUI supports zh and en", /zh:\s*\{/.test(appText) && /en:\s*\{/.test(appText));
check("v3 GUI audits only through the SDK-backed admission API", appText.includes("/api/v1/admission/audit") && !appText.includes("/api/lite-audit"));

// Copy rules (docs/COPY-STYLE.md)
const i18nText = await read("dashboard/app/i18n.js");
const zhBlock = /  zh: \{\n([\s\S]*?)\n  \},\n  en: \{/.exec(i18nText);
const zh = zhBlock ? JSON.parse(`{${zhBlock[1]}}`) : {};
const zhValues = Object.values(zh);
const MEMES = ["GG", "gg", "666", "yyds", "YYDS", "绝绝子", "破防", "芭比Q", "泰裤辣", "摆烂", "躺平", "栓Q", "拿捏", "针不戳"];
const longSentences = zhValues.flatMap((v) => v.split(/[。！？；\n]/)).filter((x) => (x.match(/[\u4e00-\u9fff]/g) || []).length > 24);
const adverbialDe = zhValues.filter((v) => /[\u4e00-\u9fff]地[\u4e00-\u9fff]/.test(v.replace(/本地|地址|地图|地方|场地|土地/g, "")));
check("zh copy parsed", zhValues.length > 50);
check("copy uses mechanic words, not memes", !zhValues.some((v) => MEMES.some((m) => v.includes(m))));
check(`zh sentences <= 24 CJK chars${longSentences.length ? ` (over: ${longSentences.slice(0, 2).join(" | ")})` : ""}`, longSentences.length === 0);
check(`zh copy avoids 地-adverbials${adverbialDe.length ? ` (${adverbialDe[0]})` : ""}`, adverbialDe.length === 0);
check("仓库 reserved for quarantine storage", zh["lib.title"] !== "仓库" && zh["nav.library"] !== "仓库");
check("canonical route word stays visible in the verdict", appText.includes('h("p.verdict-word", word)') && appText.includes("setVerdict(res.decision, res.decision"));

// Server architecture
check("server uses a route table, not an if-chain", server.includes("createRouter()") && !/url\.pathname === "\/api\//.test(server));
check("server guards state-changing requests", server.includes("guardRequest(") && http.includes("Cross-origin state change refused"));
check("server sends a CSP for HTML", http.includes("Content-Security-Policy"));
check("admission API is backed by the SDK", admission.includes('from "../../src/mercury-audit/index.mjs"') && admission.includes("buildAdmissionContract"));
check("legacy /api/lite-audit is SDK-backed", admission.includes('"/api/lite-audit"') && !server.includes("function liteAudit("));
check("command allowlist includes audit/report/cycle", ["audit", "report", "cycle:status", "cycle:check"].every((s) => server.includes(`["${s}"`)));
check("preferences file has 7 settings categories", ["general", "interface", "storage", "output", "control", "update", "notifications"].every((k) => preferences[k]));

// Classic + Lite stay reachable
check("classic GUI kept at /classic/ with its own assets", classic.includes("/classic/product-layer.js") && classic.indexOf("product-layer.js") < classic.indexOf("app.js"));
check("Lite Mode is single file and <= 30KB", liteStat.size <= 30 * 1024);
check("Lite Mode supports paste/audit/copy/offline", ["source", "auditBtn", "copyMarkdown", "stubAudit"].every((t) => lite.includes(t)));
check("Lite Mode uses same-origin API when served", lite.includes("function apiBase()"));
check("Lite Mode supports drag attach and evidence chain", ["handleFiles", "attachments", "Evidence Chain", "evidence_chain"].every((t) => lite.includes(t)));

for (const r of checks) console.log(`${r.ok ? "OK" : "FAIL"} ${r.name}`);
if (checks.some((r) => !r.ok)) process.exitCode = 1;

function check(name, ok) { checks.push({ name, ok: Boolean(ok) }); }
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}
