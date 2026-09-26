// Minimal method + path router. Replaces the 27-branch if-chain in
// dashboard_server.mjs so routes are listable, testable, and uniform.
import { readJson, sendJson, HttpError } from "./http.mjs";

export function createRouter() {
  const table = new Map();

  function add(method, path, handler, { body = false } = {}) {
    const key = `${method} ${path}`;
    if (table.has(key)) throw new Error(`Duplicate route ${key}`);
    table.set(key, { method, path, handler, body });
  }

  async function handle(req, res, url) {
    const route = table.get(`${req.method} ${url.pathname}`);
    if (!route) {
      if (url.pathname.startsWith("/api/")) {
        const allowed = [...table.values()].filter((r) => r.path === url.pathname).map((r) => r.method);
        if (allowed.length) throw new HttpError(405, `Method not allowed; use ${allowed.join(", ")}`);
        throw new HttpError(404, `Unknown API route ${url.pathname}`);
      }
      return false;
    }
    const body = route.body ? await readJson(req) : undefined;
    const result = await route.handler({ req, res, url, body, query: url.searchParams });
    if (result === undefined || res.headersSent) return true;
    if (result && result.__status) sendJson(res, result.payload, result.__status);
    else sendJson(res, result);
    return true;
  }

  function list() {
    return [...table.values()].map(({ method, path }) => ({ method, path }));
  }

  return { add, handle, list };
}

/** Return a non-200 JSON response from a handler. */
export function withStatus(status, payload) {
  return { __status: status, payload };
}
