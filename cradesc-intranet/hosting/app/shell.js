/* ============================================================
   CRADESC — Portail (shell)
   Login → accueil (KPI, applications, aperçus Google) → plateformes.
   Auth, RBAC, données et bus inter-apps sont fournis par les modules
   dédiés. L'interface reprend la maquette de référence (« l'écran fait foi »).
   ============================================================ */
import { LOGO } from "../assets/logo.js";
import { $, $$, esc, ini, svg, IC, googleG, gappIcon, toast } from "./ui.js";
import { DEMO, DOMAINE_AUTORISE } from "./config.js";
import { APPS, GOOGLE_APPS, EMBEDDED, ROLE_LABEL, canAccess } from "./rbac.js";
import { startAuth, currentSession, signInWithGoogle, loginDemo, signOut, DEMO_USERS } from "./auth.js";
import { loadWorkspace } from "./google.js";
import { initBus, setPendingFocus, sendContext } from "./bus.js";

let ME = null;
let state = { view: "login", q: "", appView: "grid", favs: ["pilotage", "tdr"], navCollapsed: false };

/* ---------- démarrage ---------- */
boot();
async function boot() {
  loadPrefs();
  wireFrameChrome();
  initBus({ getIframe: currentIframe, onOpenApp: (app, ref) => { if (EMBEDDED[app]) openEmbedded(app, ref); else openApp(app); } });
  await startAuth(onSessionChange);
  if (DEMO) renderLogin();
}

function onSessionChange(s) {
  ME = s;
  if (!ME) { renderLogin(); return; }
  if (state.view === "login" || state.view === undefined) state.view = "home";
  renderHome();
}

function loadPrefs() {
  try { state.navCollapsed = localStorage.getItem("cradesc_intra_nav") === "1"; } catch {}
  try { state.appView = localStorage.getItem("cradesc_intra_appview") || "grid"; } catch {}
  try { state.favs = JSON.parse(localStorage.getItem("cradesc_intra_favs")) || ["pilotage", "tdr"]; } catch {}
}

/* ============================================================
   ÉCRAN DE CONNEXION
   ============================================================ */
function renderLogin() {
  state.view = "login";
  $("#appFrame").classList.remove("open");
  $("#app").innerHTML = `<div class="login-clean">
    <div class="lc-card">
      <div class="lc-logo"><img src="${LOGO}" alt="CRADESC"></div>
      <div class="lc-brand">CRADESC</div>
      <div class="lc-tag">INTRANET</div>
      <div class="lc-welcome"><h1>Connexion</h1><p>Authentifiez-vous avec votre compte Google professionnel.</p></div>
      <button class="g-btn" id="googleBtn">${googleG}<span>Se connecter avec Google</span></button>
      <div class="lc-secure">${svg(IC.shield, 15)}<span>Connexion sécurisée — aucun mot de passe n'est conservé côté CRADESC.</span></div>
      ${DEMO ? `<div class="lc-demo">Mode démonstration — données simulées. Renseignez <code>app/config.js</code> pour activer Google&nbsp;Sign-In et Firestore.</div>` : ""}
    </div>
    <div class="lc-foot">© 2026 CRADESC · Confidentiel · Réf. CC-CRADESC-2026-003</div>
  </div>`;
  $("#googleBtn").onclick = DEMO ? openGoogleModal : doGoogleSignIn;
}

async function doGoogleSignIn() {
  try { await signInWithGoogle(); }
  catch (e) { toast(e.message === "DEMO" ? "Mode démo actif" : (e.message || "Connexion impossible")); }
}

/* Démo : sélecteur de compte simulé (reproduit la modale Google). */
function openGoogleModal() {
  $("#gmodal").innerHTML = `<div class="gmodal">
    <div class="gm-h">
      <div class="gm-logo"><span class="b">G</span><span class="r">o</span><span class="y">o</span><span class="b">g</span><span class="g">l</span><span class="r">e</span></div>
      <h2>Choisir un compte</h2><p>pour continuer vers <b>CRADESC Intranet</b></p>
    </div>
    <div class="gm-accounts">${DEMO_USERS.map(u => `<button class="gm-acc" data-login="${u.uid}"><span class="gm-av" style="background:${u.color}">${ini(u.name)}</span><div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div></button>`).join("")}</div>
    <div class="gm-foot">Pour continuer, Google partagera votre nom, votre adresse e-mail et votre photo de profil avec CRADESC Intranet.</div>
  </div>`;
  $("#gmodal").classList.add("open");
  $$("#gmodal [data-login]").forEach(b => b.onclick = () => { $("#gmodal").classList.remove("open"); loginDemo(b.dataset.login); toast("Connecté·e via Google (démo)"); });
  $("#gmodal").onclick = e => { if (e.target === $("#gmodal")) $("#gmodal").classList.remove("open"); };
}

/* ============================================================
   ACCUEIL (portail)
   ============================================================ */
function firstName() { return ME ? ME.name.split(" ")[0] : ""; }
function todayStr() {
  return new Date(2026, 5, 11).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(/^./, c => c.toUpperCase());
}

function kpisFor() {
  if (!ME) return [];
  const r = ME.role, full = r === "admin" || r === "directrice";
  return [
    { l: "À valider", n: full ? 7 : r === "dir_prog" ? 3 : 0, ic: IC.check, col: "var(--ocre)", bg: "var(--ocre-bg)", go: "pilotage" },
    { l: "Mes tâches actives", n: full ? 12 : r === "collaborateur" ? 4 : 6, ic: IC.tasks, col: "var(--oxblood)", bg: "var(--oxblood-bg)", go: "pilotage" },
    { l: "Prochains rendez-vous", n: 4, ic: IC.plane, col: "var(--blue)", bg: "var(--blue-bg)", go: "agenda" },
    { l: "Engagement budgétaire", n: full ? "52%" : r === "collaborateur" ? "—" : "48%", ic: IC.wallet, col: "var(--green)", bg: "var(--green-bg)", go: "pilotage" },
  ];
}

function navItems() {
  const items = [
    { sec: "Espace de travail" },
    { id: "home", label: "Mon intranet", ic: IC.grid, on: true },
    { id: "direction", label: "Tableau de bord direction", ic: IC.chart, roles: ["admin", "directrice"] },
    { sec: "Applications" },
    { id: "pilotage", label: "Pilotage", ic: IC.chart, roles: null },
    { id: "tdr", label: "Validation des TdR", ic: IC.doc, roles: null },
    { id: "achats", label: "Achats", ic: IC.cart, roles: null },
    { id: "paiements", label: "Demandes de paiement", ic: IC.wallet, roles: ["admin", "directrice", "dir_prog", "chef_projet"] },
    { id: "missions", label: "Ordres de mission", ic: IC.plane, roles: null },
    { sec: "Ressources" },
    { id: "site", label: "Site CRADESC", ic: IC.link, roles: null },
    { sec: "Google Workspace" },
    { id: "gmail", label: "Gmail", ic: IC.doc, url: "https://mail.google.com" },
    { id: "agenda", label: "Agenda", ic: IC.tasks, url: "https://calendar.google.com" },
    { id: "drive", label: "Drive", ic: IC.folder, url: "https://drive.google.com" },
  ];
  return items.filter(it => it.sec || !it.roles || it.roles.includes(ME.role));
}

function renderHome() {
  state.view = "home";
  $("#appFrame").classList.remove("open");
  $("#app").innerHTML = `<div class="shell ${state.navCollapsed ? "collapsed" : ""}" id="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sb-brand"><div class="sb-logo"><img src="${LOGO}" alt="CRADESC"></div><div class="sb-brand-t"><b>CRADESC</b><span>INTRANET</span></div></div>
      <nav class="sb-nav">${navItems().map(it => it.sec ? `<div class="nav-sec">${it.sec}</div>` : `<button class="navit ${it.on ? "on" : ""}" data-nav="${it.id}" ${it.url ? `data-url="${it.url}"` : ""} title="${esc(it.label)}">${svg(it.ic)}<span>${it.label}</span>${it.url ? `<span class="ext">${svg(IC.ext, 14)}</span>` : ""}</button>`).join("")}</nav>
      <button class="sb-collapse" id="sbCollapse" title="Réduire le menu"><svg id="sbColIc" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg><span>Réduire le menu</span></button>
      <div class="sb-foot"><div class="gws"><div class="gws-ic">${googleG}</div><div class="gws-t"><b>Google Workspace</b><span><span class="dot"></span>${DEMO ? "Démo · 7 permissions" : "Connecté · 7 permissions"}</span></div></div></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="hamb" id="hamb">${svg("M3 6h18M3 12h18M3 18h18", 20)}</button>
        <div class="tb-search">${svg(IC.search, 16)}<input id="gsearch" placeholder="Rechercher une application…"><span class="kbd">⌘K</span></div>
        <div class="tb-spacer"></div>
        <button class="tb-bell" id="bell">${svg(IC.bell)}<span class="bdot"></span></button>
        <button class="tb-prof" id="prof"><span class="tb-av" style="background:${ME.color}">${ini(ME.name)}</span><div><div class="pn">${esc(ME.name)}</div><div class="pr">${esc(ME.roleLabel)}</div></div>${svg("m6 9 6 6 6-6", 16)}<div class="prof-menu" id="profMenu"></div></button>
      </header>
      <div class="view" id="view"></div>
    </div>
  </div>`;
  renderView();
  wireShell();
}

function renderView() {
  const k = kpisFor();
  $("#view").innerHTML = `
    <div class="hello-lite">
      <h1>Bonjour ${esc(firstName())} 👋</h1>
      <p class="sub">${todayStr()} — l'essentiel de votre journée, rassemblé ici.</p>
    </div>
    <div class="attn-strip">
      ${k.map(x => `<button class="attn" data-go="${x.go}" title="Ouvrir"><span class="attn-ic" style="background:${x.bg};color:${x.col}">${svg(x.ic, 17)}</span><div><div class="attn-n">${x.n}</div><div class="attn-l">${x.l}</div></div><span class="attn-go">${svg("M9 6l6 6-6 6", 14)}</span></button>`).join("")}
    </div>
    <div class="sec-lite">
      <div class="sec-head-lite"><h2>Vos applications</h2>
        <div class="av-toggle">
          <button class="${state.appView === "grid" ? "on" : ""}" data-av="grid" title="Grille">${svg("M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", 15)}</button>
          <button class="${state.appView === "list" ? "on" : ""}" data-av="list" title="Liste">${svg("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", 15)}</button>
        </div>
      </div>
      <div id="appsBox"></div>
    </div>
    <div class="sec-lite">
      <div class="sec-head-lite"><h2>Google Workspace</h2><span class="api-badge"><span class="dot"></span>${DEMO ? "Démo" : "Connecté"}</span></div>
      <div class="gw-grid-lite" id="gwBox"><div class="apps-empty">Chargement des aperçus…</div></div>
    </div>`;
  paintApps();
  wireView();
  loadWorkspace().then(paintWorkspace);
}

/* ----- applications (tuiles / liste) ----- */
function isFav(id) { return (state.favs || []).includes(id); }
function toggleFav(id) {
  state.favs = state.favs || [];
  const i = state.favs.indexOf(id);
  if (i < 0) { state.favs.push(id); toast("Épinglé aux favoris"); } else state.favs.splice(i, 1);
  try { localStorage.setItem("cradesc_intra_favs", JSON.stringify(state.favs)); } catch {}
  paintApps();
}
function favBtn(id) {
  const f = isFav(id);
  return `<span class="fav-btn ${f ? "on" : ""}" data-fav="${id}" title="${f ? "Retirer des favoris" : "Épingler en tête"}"><svg width="15" height="15" viewBox="0 0 24 24" fill="${f ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7"><path d="${IC.star}"/></svg></span>`;
}
function paintApps() {
  const q = (state.q || "").toLowerCase().trim();
  let apps = APPS.filter(a => a.id !== "site").filter(a => !q || a.name.toLowerCase().includes(q) || (a.meta || "").toLowerCase().includes(q) || (a.desc || "").toLowerCase().includes(q));
  const favs = state.favs || [];
  apps = apps.slice().sort((a, b) => { const ra = favs.indexOf(a.id), rb = favs.indexOf(b.id); return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb); });
  const box = $("#appsBox"); if (!box) return;
  if (!apps.length) { box.className = ""; box.innerHTML = `<div class="apps-empty">Aucune application ne correspond à « ${esc(state.q)} ».</div>`; return; }
  box.className = state.appView === "list" ? "apps-list" : "apps-grid-lite";
  box.innerHTML = apps.map(state.appView === "list" ? rowLite : tileLite).join("");
  $$("#appsBox [data-fav]").forEach(b => b.onclick = e => { e.stopPropagation(); toggleFav(b.dataset.fav); });
  $$("#appsBox [data-app]").forEach(b => b.onclick = () => openApp(b.dataset.app));
}
function rowLite(a) { const ok = canAccess(a, ME.role);
  return `<button class="approw ${ok ? "" : "locked"} ${isFav(a.id) ? "fav" : ""}" data-app="${a.id}" ${ok ? "" : "disabled"}>
    <span class="approw-ic" style="background:${a.col}">${svg(a.ic, 19)}</span>
    <b>${esc(a.name)}</b><span class="approw-m">${esc(a.meta)}</span>
    ${favBtn(a.id)}
    ${ok ? `<span class="approw-go">${svg("M9 6l6 6-6 6", 17)}</span>` : `<span class="approw-lock">${svg(IC.lock, 14)}</span>`}
  </button>`;
}
function tileLite(a) { const ok = canAccess(a, ME.role);
  return `<button class="tile ${ok ? "" : "locked"} ${isFav(a.id) ? "fav" : ""}" data-app="${a.id}" ${ok ? "" : "disabled"}>
    ${favBtn(a.id)}
    <span class="tile-ic" style="background:${a.col}">${svg(a.ic, 22)}</span>
    <div class="tile-m"><b>${esc(a.name)}</b><span>${esc(a.meta)}</span></div>
    ${ok ? `<span class="tile-go">${svg("M9 6l6 6-6 6", 18)}</span>` : `<span class="tl-lock">${svg(IC.lock, 15)}</span>`}
  </button>`;
}

/* ----- aperçus Google Workspace ----- */
function paintWorkspace(ws) {
  const box = $("#gwBox"); if (!box) return;
  box.innerHTML = gwMail(ws.mails) + gwAgenda(ws.events) + gwDrive(ws.files);
  $$("#gwBox [data-google]").forEach(b => b.onclick = () => window.open(b.dataset.google, "_blank"));
}
function gwMail(mails) { return `<div class="gw">
  <div class="gw-h"><span class="gw-ic" style="background:#FDECEA">${gappIcon("gmail")}</span><b>Gmail</b><span class="gw-badge">${mails.filter(m => m.unread).length} non lus</span></div>
  <div class="gw-body">${mails.slice(0, 3).map(m => `<button class="gw-item" data-google="https://mail.google.com"><span class="gw-dot" style="background:${m.unread ? m.col : "transparent"};border:1px solid ${m.col}"></span><div class="gw-m"><div class="gw-t ${m.unread ? "unread" : ""}">${esc(m.from)}</div><div class="gw-s">${esc(m.subj)}</div></div><span class="gw-time">${esc(m.time)}</span></button>`).join("")}</div>
  <div class="gw-foot"><button class="gw-open" data-google="https://mail.google.com">Ouvrir Gmail ${svg(IC.ext, 14)}</button></div></div>`; }
function gwAgenda(events) { return `<div class="gw">
  <div class="gw-h"><span class="gw-ic" style="background:#E8EFFD">${gappIcon("agenda")}</span><b>Agenda</b><span class="gw-badge">Cette semaine</span></div>
  <div class="gw-body">${events.slice(0, 3).map(e => `<button class="gw-item gw-ev" data-google="https://calendar.google.com"><div class="gw-ev-d"><div class="d" style="color:${e.col}">${e.d}</div><div class="m">${e.m}</div></div><div class="gw-ev-m"><div class="gw-ev-t">${esc(e.t)}</div><div class="gw-ev-s">${esc(e.s)}</div></div></button>`).join("")}</div>
  <div class="gw-foot"><button class="gw-open" data-google="https://calendar.google.com">Ouvrir Google Agenda ${svg(IC.ext, 14)}</button></div></div>`; }
function gwDrive(files) { return `<div class="gw">
  <div class="gw-h"><span class="gw-ic" style="background:#E7F5EC">${gappIcon("drive")}</span><b>Drive</b><span class="gw-badge">Récents</span></div>
  <div class="gw-body">${files.slice(0, 4).map(f => `<button class="gw-file" data-google="https://drive.google.com"><span class="gw-file-ic" style="background:${f.col}">${f.ext}</span><div class="gw-file-m"><div class="gw-file-t">${esc(f.n)}</div><div class="gw-file-s">${esc(f.s)}</div></div></button>`).join("")}</div>
  <div class="gw-foot"><button class="gw-open" data-google="https://drive.google.com">Ouvrir Google Drive ${svg(IC.ext, 14)}</button></div></div>`; }

/* ============================================================
   OUVERTURE DES APPLICATIONS
   ============================================================ */
function openApp(id) {
  if (id === "site") { openSite(); return; }
  const ga = GOOGLE_APPS.find(g => g.id === id); if (ga) { window.open(ga.url, "_blank"); return; }
  const a = APPS.find(x => x.id === id);
  if (a && !canAccess(a, ME.role)) { toast("Accès non autorisé pour votre rôle (" + ME.roleLabel + ")"); return; }
  if (EMBEDDED[id]) { openEmbedded(id); return; }
  toast("« " + (a ? a.name : id) + " » — bientôt disponible");
}

function currentIframe() { const ifr = $("#afIframe"); return { win: ifr?.contentWindow, app: ifr?.dataset.cur || "" }; }

function setSuiteChrome() {
  $("#afLogo").src = LOGO;
  $("#afProf").textContent = ME ? ini(ME.name) : ""; if (ME) $("#afProf").style.background = ME.color;
  $("#afQuick").innerHTML = GOOGLE_APPS.map(g => `<button class="afq" title="Ouvrir ${esc(g.name)}" data-gurl="${g.url}">${gappIcon(g.id)}</button>`).join("");
  $$("#afQuick [data-gurl]").forEach(b => b.onclick = () => window.open(b.dataset.gurl, "_blank"));
}

function openEmbedded(id, ref) {
  const e = EMBEDDED[id]; if (!e) return;
  setPendingFocus(id, ref);
  setSuiteChrome();
  $("#afTitle").innerHTML = `<span class="af-dot" style="background:${e.col}"></span>${esc(e.label)}`;
  const ifr = $("#afIframe");
  ifr.dataset.cur = id;
  // La plateforme émettra 'cradesc-ready' au chargement → le bus répond avec le contexte.
  if (ifr.getAttribute("src") !== e.src) ifr.src = e.src; else sendContext(ifr.contentWindow, id);
  $("#appFrame").classList.add("open");
  renderLauncher();
}
function closeEmbedded() {
  $("#appFrame").classList.remove("open"); $("#afLauncher").classList.remove("open");
  const ifr = $("#afIframe"); ifr.src = "about:blank"; ifr.dataset.cur = "";
}
function openSite() {
  setSuiteChrome();
  $("#afTitle").innerHTML = `<span class="af-dot" style="background:#4A2E25"></span>Site CRADESC<a class="af-ext" href="https://cradesc.org/" target="_blank" rel="noopener" title="Ouvrir dans un nouvel onglet">Ouvrir ↗</a>`;
  const ifr = $("#afIframe"); ifr.dataset.cur = "site"; ifr.src = "https://cradesc.org/";
  $("#appFrame").classList.add("open");
}

/* ----- lanceur (waffle) ----- */
function renderLauncher() {
  const cur = $("#afIframe").dataset.cur || "";
  const items = [{ id: "__home", name: "Mon intranet", col: "#4A2E25", home: true }].concat(APPS).concat(GOOGLE_APPS.map(g => ({ id: g.id, name: g.name, col: g.col, google: true })));
  $("#afLauncher").innerHTML = `<div class="afl-h">Vos applications</div><div class="afl-grid">${items.map(a => {
    const locked = !(a.home || a.google) && !canAccess(a, ME.role);
    const icBg = a.google ? "#fff" : a.col; const ic = a.google ? gappIcon(a.id) : (a.home ? svg(IC.grid, 22) : svg(a.ic || IC.grid, 22));
    return `<button class="afl-item ${locked ? "locked" : ""} ${cur === a.id ? "on" : ""}" data-launch="${a.id}" ${locked ? "disabled" : ""}><span class="afl-ic" style="background:${icBg};${a.google ? "border:1px solid var(--line)" : ""}">${ic}</span><span class="afl-n">${esc(a.name)}</span>${locked ? `<span class="afl-lock">${svg(IC.lock, 11)}</span>` : ""}</button>`;
  }).join("")}</div>`;
  $$("#afLauncher [data-launch]").forEach(b => b.onclick = () => {
    const id = b.dataset.launch; $("#afLauncher").classList.remove("open");
    if (id === "__home") { closeEmbedded(); return; }
    const g = GOOGLE_APPS.find(x => x.id === id); if (g) { window.open(g.url, "_blank"); return; }
    if (EMBEDDED[id]) { openEmbedded(id); return; }
    openApp(id);
  });
}

/* ============================================================
   CÂBLAGE DES INTERACTIONS
   ============================================================ */
function wireShell() {
  $$("[data-nav]").forEach(b => b.onclick = () => { const u = b.dataset.url; if (u) { window.open(u, "_blank"); toast("Ouverture de Google…"); return; } openApp(b.dataset.nav); closeSidebar(); });
  $("#hamb").onclick = () => { $("#sidebar").classList.toggle("open"); $("#navScrim").classList.toggle("open"); };
  $("#navScrim").onclick = closeSidebar;
  $("#bell").onclick = () => toast("3 notifications · centre d'alertes à venir");
  const gs = $("#gsearch"); if (gs) gs.oninput = () => { state.q = gs.value; paintApps(); };
  $("#sbCollapse").onclick = () => {
    state.navCollapsed = !state.navCollapsed;
    try { localStorage.setItem("cradesc_intra_nav", state.navCollapsed ? "1" : "0"); } catch {}
    $("#shell").classList.toggle("collapsed", state.navCollapsed);
    $("#sbColIc").innerHTML = state.navCollapsed ? '<path d="M9 18l6-6-6-6"/>' : '<path d="M15 18l-6-6 6-6"/>';
    $("#sbCollapse").title = state.navCollapsed ? "Agrandir le menu" : "Réduire le menu";
  };
  const prof = $("#prof"); prof.onclick = e => { e.stopPropagation(); renderProfMenu(); $("#profMenu").classList.toggle("open"); };
  document.addEventListener("click", e => { const pm = $("#profMenu"); if (pm && pm.classList.contains("open") && !e.target.closest("#prof")) pm.classList.remove("open"); });
}
function closeSidebar() { $("#sidebar").classList.remove("open"); $("#navScrim").classList.remove("open"); }

function renderProfMenu() {
  const accounts = DEMO
    ? `<div class="pm-sec">Changer de compte (démo des droits)</div>${DEMO_USERS.map(u => `<button class="pm-acc ${u.uid === ME.uid ? "on" : ""}" data-su="${u.uid}"><span class="tb-av" style="background:${u.color};width:30px;height:30px;font-size:12px">${ini(u.name)}</span><div><b style="font-size:13px">${esc(u.name)}</b></div><span class="pm-tag">${esc(ROLE_LABEL[u.role])}</span></button>`).join("")}`
    : "";
  $("#profMenu").innerHTML = `<div class="pm-h"><span class="tb-av" style="background:${ME.color}">${ini(ME.name)}</span><div><b>${esc(ME.name)}</b><span>${esc(ME.email)}</span></div></div>
    ${accounts}
    <button class="pm-out" data-logout>${svg("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9", 16)}Se déconnecter</button>`;
  $$("#profMenu [data-su]").forEach(b => b.onclick = () => { loginDemo(b.dataset.su); });
  $("#profMenu [data-logout]").onclick = () => signOut();
}

function wireView() {
  $$("#view [data-go]").forEach(b => b.onclick = () => openApp(b.dataset.go));
  $$("#view [data-av]").forEach(b => b.onclick = () => {
    state.appView = b.dataset.av; try { localStorage.setItem("cradesc_intra_appview", state.appView); } catch {}
    $$("#view [data-av]").forEach(x => x.classList.toggle("on", x.dataset.av === state.appView)); paintApps();
  });
}

/* ----- chrome du cadre plateforme (barre du haut) ----- */
function wireFrameChrome() {
  $("#afBack").onclick = closeEmbedded;
  $("#afHome").onclick = closeEmbedded;
  $("#afWaffle").onclick = e => { e.stopPropagation(); const l = $("#afLauncher"); if (l.classList.contains("open")) { l.classList.remove("open"); return; } renderLauncher(); l.classList.add("open"); };
  document.addEventListener("click", e => { const l = $("#afLauncher"); if (l && l.classList.contains("open") && !e.target.closest("#afLauncher") && !e.target.closest("#afWaffle")) l.classList.remove("open"); });
  document.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { const g = $("#gsearch"); if (g) { e.preventDefault(); g.focus(); } } });
}
