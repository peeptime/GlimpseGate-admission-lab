// HTTP primitives for the local dashboard server (v3, GlimpseGate 2.4.0).
// Zero dependencies. Everything here is transport; no project logic.
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_BODY_BYTES = 64 * 1024 * 1024; // intake accepts files as data URLs

export async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body is not valid JSON");
  }
}

export function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload, null, 2));
}

/**
 * Local-only request guard.
 *
 * The server binds 127.0.0.1, but a browser will still send requests to it from
 * any page the user visits. Before v3 there was no check, so a hostile page
 * could POST text/plain (no CORS preflight) to /api/run or /api/artifact.
 *
 * - Host must be a loopback name (blocks DNS rebinding).
 * - State-changing methods must come from the same origin (or no Origin, e.g.
 *   curl / node scripts) and carry Content-Type: application/json, which forces
 *   a preflight the server never approves for foreign origins.
 */
export function guardRequest(req, port) {
  const host = String(req.headers.host || "");
  const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  if (!["127.0.0.1", "localhost", "::1"].includes(hostname)) {
    throw new HttpError(421, "Dashboard only answers loopback hosts");
  }
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;

  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try {
      const o = new URL(origin);
      ok = ["127.0.0.1", "localhost", "[::1]"].includes(o.hostname) && Number(o.port || 80) === Number(port);
    } catch {
      ok = false;
    }
    if (!ok) throw new HttpError(403, "Cross-origin state change refused");
  }
  const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") {
    throw new HttpError(415, "State-changing requests must be application/json");
  }
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

export async function serveStatic(req, res, staticRoot, pathname) {
  let requested;
  try {
    requested = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    return plain(res, 400, "Bad path");
  }
  if (requested.endsWith("/")) requested += "index.html";
  const rootWithSep = staticRoot.endsWith(sep) ? staticRoot : staticRoot + sep;
  const filePath = normalize(join(staticRoot, requested));
  // Separator-aware containment: "dashboard-x" must not pass for "dashboard".
  if (filePath !== staticRoot && !filePath.startsWith(rootWithSep)) {
    return plain(res, 403, "Forbidden");
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return plain(res, 404, "Not found");
  }
  if (!fileStat.isFile()) return plain(res, 404, "Not found");

  const ext = extname(filePath);
  const headers = {
    "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
    "Content-Length": fileStat.size,
    "X-Content-Type-Options": "nosniff",
    // Local dev tool: never serve stale UI after an update.
    "Cache-Control": "no-cache"
  };
  if (ext === ".html") {
    // Inline <script> blocks (lite.html is deliberately single-file) are
    // allowed by hash, so injected scripts still cannot run.
    const html = await readFile(filePath, "utf8");
    const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
    headers["Content-Security-Policy"] = [
      "default-src 'self'",
      `script-src 'self' ${hashes.join(" ")}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'self'"
    ].join("; ");
    headers["Referrer-Policy"] = "no-referrer";
    headers["Content-Length"] = Buffer.byteLength(html);
    res.writeHead(200, headers);
    return res.end(req.method === "HEAD" ? undefined : html);
  }
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(filePath);
  stream.on("error", () => res.end());
  stream.pipe(res);
}

function plain(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
