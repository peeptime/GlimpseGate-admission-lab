// Tiny DOM helpers. No framework: views are functions that return nodes.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** h("div.cls#id", { attrs, on: { click } }, ...children) */
export function h(tag, props = {}, ...children) {
  const [, name = "div", rest = ""] = /^([a-z0-9-]+)?(.*)$/i.exec(tag);
  const node = document.createElement(name);
  for (const part of rest.match(/[.#][^.#]+/g) || []) {
    if (part[0] === ".") node.classList.add(part.slice(1));
    else node.id = part.slice(1);
  }
  if (props === null || typeof props !== "object" || props instanceof Node || Array.isArray(props)) {
    children.unshift(props);
    props = {};
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "on") for (const [ev, fn] of Object.entries(value)) node.addEventListener(ev, fn);
    else if (key === "class") node.className = [node.className, value].filter(Boolean).join(" ");
    else if (key === "html") node.innerHTML = value; // only for trusted, locally built SVG
    else if (key === "style" && typeof value === "object") {
      // Custom properties (--x) need setProperty; Object.assign ignores them.
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith("--")) node.style.setProperty(prop, v);
        else node.style[prop] = v;
      }
    }
    else if (key in node && typeof value !== "string") node[key] = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(node, ...children) {
  node.replaceChildren();
  append(node, children);
  return node;
}

export function toast(message, kind = "info", ms = 3600) {
  const box = document.getElementById("toasts");
  const el = h(`div.toast.${kind}`, message);
  box.append(el);
  setTimeout(() => el.remove(), ms);
}

export async function busy(button, fn) {
  button.classList.add("busy");
  button.disabled = true;
  try {
    return await fn();
  } finally {
    button.classList.remove("busy");
    button.disabled = false;
  }
}

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
