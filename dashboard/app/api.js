// All server calls go through here. Same-origin JSON only (the server's
// request guard refuses anything else for state changes).
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function call(method, path, body) {
  const init = { method, headers: { Accept: "application/json" } };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Server unreachable. Is `npm run dashboard` running?", 0);
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok || (json && json.ok === false && !json.result)) {
    throw new ApiError(json?.error || `${method} ${path} → ${res.status}`, res.status, json);
  }
  return json;
}

export const api = {
  health: () => call("GET", "/api/health"),
  overview: () => call("GET", "/api/overview"),
  meta: () => call("GET", "/api/v1/admission/meta"),
  audit: (input) => call("POST", "/api/v1/admission/audit", input),
  contract: (input, selection) => call("POST", "/api/v1/admission/contract", { ...input, selection }),
  capture: (text, title) => call("POST", "/api/capture", { text, source: "dashboard-gate", title }),
  artifact: (path) => call("GET", `/api/artifact?path=${encodeURIComponent(path)}`),
  saveArtifact: (path, updates) => call("PATCH", "/api/artifact", { path, ...updates }),
  createArtifact: (fields) => call("POST", "/api/artifact", fields),
  intake: (text, files) => call("POST", "/api/intake", { text, files }),
  promote: (path) => call("POST", "/api/submission/promote", { path }),
  run: (script) => call("POST", "/api/run", { script }),
  setMode: (mode) => call("PATCH", "/api/execution-mode", { mode }),
  setPersona: (persona) => call("PATCH", "/api/analysis-persona", { persona }),
  setProvider: (provider) => call("PATCH", "/api/model-provider", { provider }),
  setCapability: (key, status) => call("PATCH", "/api/capability", { key, status }),
  lifecycle: () => call("GET", "/api/lifecycle-log"),
  diagnostics: () => call("GET", "/api/diagnostics"),
  updateCheck: () => call("GET", "/api/update-check"),
  cleanDist: () => call("POST", "/api/maintenance/clean-dist", {})
};
