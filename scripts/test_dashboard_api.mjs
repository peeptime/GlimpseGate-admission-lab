// Dashboard API contract + security tests (v3 / 2.4.0).
// Boots the real server on an ephemeral port. Read-only: never calls routes
// that write to the repository.
import assert from "node:assert/strict";
import { request } from "node:http";
import { createDashboardServer } from "./dashboard_server.mjs";

const server = createDashboardServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

function call(method, path, { body, headers = {}, raw } = {}) {
  return new Promise((resolve, reject) => {
    const data = raw ?? (body === undefined ? undefined : JSON.stringify(body));
    const baseHeaders = { host: `127.0.0.1:${port}` };
    if (data !== undefined && !("content-type" in headers)) baseHeaders["content-type"] = "application/json";
    if (data !== undefined) baseHeaders["content-length"] = Buffer.byteLength(data);
    const req = request({ host: "127.0.0.1", port, method, path, headers: { ...baseHeaders, ...headers } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = JSON.parse(text); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on("error", reject);
    if (data !== undefined) req.write(data);
    req.end();
  });
}

try {
  // ── Contract: every read route answers with its documented top-level keys.
  const reads = {
    "/api/health": ["ok", "version", "packageVersion"],
    "/api/overview": ["ok", "artifacts", "statusCounts", "submissions", "deployment", "methods", "modelProviders", "capabilities", "commandAllowlist"],
    "/api/preferences": ["ok", "preferences"],
    "/api/product-context": ["ok", "packageVersion"],
    "/api/diagnostics": ["ok", "generated_at"],
    "/api/lifecycle-log": ["ok", "events"],
    "/api/v1/admission/meta": ["ok", "object_types", "routes", "contract_version"],
    "/api/routes": ["ok", "routes"]
  };
  for (const [path, keys] of Object.entries(reads)) {
    const r = await call("GET", path);
    assert.equal(r.status, 200, `${path} -> ${r.status} ${r.text.slice(0, 200)}`);
    for (const k of keys) assert.ok(k in r.json, `${path} missing ${k}`);
  }
  const routes = (await call("GET", "/api/routes")).json.routes;
  assert.ok(routes.length >= 30, `expected >= 30 routes, got ${routes.length}`);

  // ── Admission API is the SDK.
  const q = await call("POST", "/api/v1/admission/audit", { body: { text: "The user always wants every AI output remembered permanently." } });
  assert.equal(q.status, 200, q.text);
  assert.equal(q.json.decision, "quarantine");
  assert.deepEqual(q.json.checks.map((c) => c.id), ["source", "audit", "loop", "scope"]);
  assert.equal(q.json.checks.find((c) => c.id === "scope").pass, false);
  assert.ok(q.json.chain.suggested_choices.length > 0);

  const circ = await call("POST", "/api/v1/admission/audit", { body: { text: "This is fine because the AI summary says every blocker is resolved." } });
  assert.equal(circ.json.decision, "discard", "circular + no source must discard (patterns absorbed from old lite rules)");

  const withRefs = await call("POST", "/api/v1/admission/audit", {
    body: { text: "We keep Markdown as the source of truth for this repo.\nsource: conversation:2026-09-20\n复核：review-ledger:2026-09-21", risk_level: "low", evidence_strength: "strong", boundary: "this repo" }
  });
  assert.deepEqual(withRefs.json.input.source_refs, ["conversation:2026-09-20"]);
  assert.deepEqual(withRefs.json.input.audit_refs, ["review-ledger:2026-09-21"]);
  assert.equal(withRefs.json.decision, "accept", JSON.stringify(withRefs.json.reasons));

  const empty = await call("POST", "/api/v1/admission/audit", { body: { text: "  " } });
  assert.equal(empty.status, 400);

  // Contract: intent is not evidence, through the GUI path too.
  const base = { text: "The analysis is correct because the AI summary says every blocker is resolved." };
  const intent = await call("POST", "/api/v1/admission/contract", { body: { ...base, selection: { gap_id: "circular_reasoning", choice_id: "A" } } });
  assert.equal(intent.json.contract.admitted_object.object_type, "hypothesis");
  assert.ok(intent.json.contract.pending_upgrade);
  const proven = await call("POST", "/api/v1/admission/contract", { body: { ...base, selection: { gap_id: "circular_reasoning", choice_id: "A", evidence_refs: ["primary::interview:2026-09-20"] } } });
  assert.equal(proven.json.contract.admitted_object.object_type, "fact");

  // Legacy lite shape preserved (superset), now SDK-backed.
  const lite = await call("POST", "/api/lite-audit", { body: { text: "The user always wants every AI output remembered permanently." } });
  for (const k of ["routing_decision", "failure_modes", "evidence_gap", "memory_pollution_risk", "required_fixes", "provenance"]) assert.ok(k in lite.json.result, `lite missing ${k}`);
  assert.match(lite.json.result.engine, /^sdk /);

  const fb = await call("POST", "/api/intake-feedback", { body: { text: "We decided X. Source: meeting." } });
  assert.equal(fb.status, 200);
  assert.ok("scores" in fb.json);

  // ── Security guard.
  const crossOrigin = await call("POST", "/api/run", { body: { script: "doctor" }, headers: { origin: "https://evil.example" } });
  assert.equal(crossOrigin.status, 403, "cross-origin POST must be refused");
  const textPlain = await call("POST", "/api/run", { raw: '{"script":"doctor"}', headers: { "content-type": "text/plain" } });
  assert.equal(textPlain.status, 415, "text/plain POST (no preflight) must be refused");
  const rebinding = await call("GET", "/api/overview", { headers: { host: "attacker.example:4788" } });
  assert.equal(rebinding.status, 421, "non-loopback Host must be refused");
  const sameOrigin = await call("POST", "/api/v1/admission/audit", { body: { text: "x" }, headers: { origin: `http://127.0.0.1:${port}` } });
  assert.equal(sameOrigin.status, 200, "same-origin POST allowed");
  const badJson = await call("POST", "/api/v1/admission/audit", { raw: "{nope" });
  assert.equal(badJson.status, 400);

  // ── Router behavior.
  assert.equal((await call("GET", "/api/does-not-exist")).status, 404);
  assert.equal((await call("DELETE", "/api/overview", { body: {} })).status, 405);

  // ── Static serving.
  const index = await call("GET", "/");
  assert.equal(index.status, 200);
  assert.match(index.headers["content-type"], /text\/html/);
  assert.match(index.headers["content-security-policy"], /default-src 'self'/);
  assert.equal((await call("GET", "/classic/")).status, 200, "classic GUI still served");
  assert.equal((await call("GET", "/lite.html")).status, 200);
  const traversal = await call("GET", "/..%2fpackage.json");
  assert.ok([403, 404].includes(traversal.status), `traversal -> ${traversal.status}`);
  assert.equal((await call("GET", "/nope.js")).status, 404);

  console.log(`OK dashboard API tests passed (${routes.length} routes)`);
} finally {
  server.close();
}
