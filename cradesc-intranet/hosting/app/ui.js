/* ============================================================
   CRADESC — Helpers d'interface partagés (icônes, échappement, toasts)
   ============================================================ */
export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = s => String(s == null ? "" : s)
  .replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const ini = n => String(n || "").split(" ").filter(Boolean).slice(0, 2)
  .map(x => x[0]).join("").toUpperCase();

export const IC = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  chart: "M3 3v18h18M7 14l3-4 3 3 4-6",
  cart: "M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2m8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  wallet: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M16 14h2",
  plane: "M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.5 3.3-2.4 2.4-2.3-.5a1 1 0 0 0-.9 1.6L7 19l1.7 2.7a1 1 0 0 0 1.6-.9l-.5-2.3 2.4-2.4 3.3 5.5a1 1 0 0 0 1.7-.9z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13l2 2 4-4",
  tasks: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4-4",
  ext: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
  check: "M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  shield: "M12 2 4 5v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z",
};

export const svg = (p, sz) =>
  `<svg width="${sz || 18}" height="${sz || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;

export const googleG = `<svg viewBox="0 0 24 24" width="21" height="21"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>`;

export function gappIcon(id) {
  const m = {
    gmail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#EA4335" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    agenda: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4285F4" stroke-width="1.9"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    drive: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1FA463" stroke-width="1.9"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  };
  return m[id] || "";
}

let toastWrap = null;
export function toast(msg) {
  if (!toastWrap) {
    toastWrap = document.getElementById("toastWrap") || document.body;
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = "<span>✦</span>" + esc(msg);
  toastWrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".3s"; setTimeout(() => t.remove(), 300); }, 2600);
}
