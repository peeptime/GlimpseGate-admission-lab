// Packs the SDK and installs it into a throwaway project, the way an external
// integrator would. Catches missing files in package.json#files and broken
// exports. Runs as the last step of `npm test` (and therefore in CI, which
// calls `npm run test`). Use `npm run test:fast` to skip it locally.
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const work = mkdtempSync(join(tmpdir(), "glimpsegate-consumer-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, cwd) => {
  const r = spawnSync(npm, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`npm ${args.join(" ")} failed:\n${r.stdout}\n${r.stderr}`);
  return r.stdout.trim();
};

try {
  const tarball = run(["pack", "--silent", "--pack-destination", work], root).split("\n").pop();
  writeFileSync(join(work, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
  run(["install", "--silent", "--no-audit", "--no-fund", join(work, tarball)], work);
  writeFileSync(join(work, "smoke.mjs"), `
    import { audit, shouldWriteMemory, buildEvidenceChain, buildAdmissionContract, fullAudit } from "@glimpsegate/admission-lab";
    const r = audit("Team decided to keep Markdown as source of truth.", {
      source_refs: ["conversation:2026-09-26-standup"], audit_refs: ["review-ledger:2026-09-26"],
      risk_level: "low", evidence_strength: "strong", boundary: "This repo only, until next architecture review."
    });
    if (!["accept","revise","quarantine","discard"].includes(r.routing_decision)) throw new Error("bad route");
    const chain = buildEvidenceChain(audit("Users always want everything remembered.", {}));
    const c = buildAdmissionContract(chain, { choice_id: "A" });
    if (c.future_usage_policy.can_use_as_fact) throw new Error("fact admitted without evidence");
    fullAudit("claim", { source_content: "claim", check_stability: true });
    console.log("consumer smoke ok:", r.routing_decision, shouldWriteMemory(r));
  `);
  const out = spawnSync(process.execPath, ["smoke.mjs"], { cwd: work, encoding: "utf8" });
  if (out.status !== 0) throw new Error(out.stderr || out.stdout);
  console.log(`OK ${out.stdout.trim()} (tarball ${tarball})`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
