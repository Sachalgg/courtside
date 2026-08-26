/* Courtside v2. Réservation de terrains, matchs entre inconnus, niveau calculé. */

/* ==================== CATALOGUE ==================== */

const SURFACES = [
  { id: "clay", name: "Terre battue", tag: "Terre", note: "Rebond haut, échanges longs" },
  { id: "hard", name: "Dur", tag: "Dur", note: "Rebond régulier, jeu rapide" },
  { id: "grass", name: "Gazon", tag: "Gazon", note: "Rebond bas, points courts" },
  { id: "indoor", name: "Indoor", tag: "Indoor", note: "Synthétique couvert, aucun vent" },
];

const SURF_PATH = {
  clay: '<path d="M3 8c3-1.6 6-1.6 9 0s6 1.6 9 0M3 13c3-1.6 6-1.6 9 0s6 1.6 9 0M3 18c3-1.6 6-1.6 9 0s6 1.6 9 0"/>',
  hard: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 12h17M12 3.5v17"/>',
  grass: '<path d="M4 20c0-4 1.6-7 3-9M9 20c0-5 .8-8.5 2-11M14 20c-.4-5 .3-8.5 1.6-11M19.6 20c-.3-4-1-6.6-2-8.6"/><path d="M3 20h18"/>',
  indoor: '<path d="M3 10.5L12 4l9 6.5"/><rect x="6" y="11.5" width="12" height="8.5" rx="2.5"/><path d="M6 16h12M12 11.5V20"/>',
};

const CLUBS = [
  { id: "leopold", name: "Club des Étangs", area: "Uccle", dist: 2.1,
    courts: { clay: { n: 8, price: 26 }, hard: { n: 2, price: 22 } } },
  { id: "woluwe", name: "Tennis du Parc", area: "Woluwe-Saint-Pierre", dist: 4.6,
    courts: { indoor: { n: 4, price: 28 }, hard: { n: 3, price: 21 } } },
  { id: "soignes", name: "TC des Hêtres", area: "Auderghem", dist: 5.3,
    courts: { clay: { n: 10, price: 24 }, grass: { n: 2, price: 34 } } },
  { id: "primerose", name: "Tennis du Vivier", area: "Uccle", dist: 3.4,
    courts: { hard: { n: 5, price: 20 }, clay: { n: 3, price: 25 } } },
  { id: "atlantis", name: "Smash Indoor Ixelles", area: "Ixelles", dist: 1.6,
    courts: { indoor: { n: 4, price: 29 }, hard: { n: 2, price: 23 } } },
  { id: "brabant", name: "Tennis des Prés", area: "Rhode-Saint-Genèse", dist: 8.2,
    courts: { grass: { n: 4, price: 38 }, clay: { n: 6, price: 25 } } },
];

const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Compétition"];
const DECLARED = { "Débutant": 1.75, "Intermédiaire": 3.0, "Confirmé": 4.5, "Compétition": 6.0 };

const PLAYERS = [
  { name: "Camille Dubois", level: 3.10 }, { name: "Yanis Berger", level: 4.60 },
  { name: "Léa Moreau", level: 1.80 }, { name: "Tom Vandeput", level: 6.10 },
  { name: "Sofia Renard", level: 3.40 }, { name: "Noah Lambert", level: 4.90 },
  { name: "Inès Delvaux", level: 2.60 }, { name: "Hugo Peeters", level: 3.75 },
  { name: "Manon Claes", level: 2.20 }, { name: "Arthur Wauters", level: 5.30 },
  { name: "Nina Jacobs", level: 3.05 }, { name: "Ilias Benali", level: 4.20 },
  { name: "Clara Verlinden", level: 2.95 }, { name: "Matteo Rossi", level: 5.80 },
  { name: "Julie Haesaert", level: 3.55 }, { name: "Simon Dewit", level: 4.05 },
  { name: "Amina Cherif", level: 2.40 }, { name: "Louis Maes", level: 3.90 },
  { name: "Elena Petit", level: 4.45 }, { name: "Rafael Costa", level: 6.50 },
];

/* ==================== ÉTAT ==================== */

const KEY = "courtside.v2";

const blankState = () => ({
  profile: { name: "Sacha Legrelle", level: "Intermédiaire", city: "Bruxelles", hand: "Droitier", elo: 1400, favSurface: "clay" },
  eloBySurface: { clay: 1400, hard: 1400, grass: 1400, indoor: 1400 },
  friends: [
    { id: uid(), name: "Camille Dubois", level: "Intermédiaire" },
    { id: uid(), name: "Yanis Berger", level: "Confirmé" },
  ],
  bookings: [],
  results: [],
  joinedMatches: [],
});

let state = load();
let tab = "home";
let nav = null;
let draft = null;
let homeSurface = "all";
let playLevelOnly = true;
let playSurface = "all";
let lastLevelShown = null;

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...blankState(), ...JSON.parse(raw) }; } catch { /* indisponible */ }
  return blankState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* indisponible */ } }
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ==================== UTILITAIRES ==================== */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " EUR";
const durLabel = (d) => Math.floor(d) + "h" + String(Math.round((d % 1) * 60)).padStart(2, "0");

function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function avatar(name, size = "md") {
  const red = hash(name) % 3 === 0;
  return `<span class="av av-${size} ${red ? "av-red" : ""}">${esc(initials(name))}</span>`;
}

function nextDays(n) {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayShort = (d) => d.toLocaleDateString("fr-BE", { weekday: "short" }).replace(".", "");
const dateLong = (d) => d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function splitEqually(total, count) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rest = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 2400);
}

/* ==================== SURFACES ==================== */

const surf = (id) => SURFACES.find((s) => s.id === id);
const surfIcon = (id, cls = "surf-ico") => `<svg class="${cls}" viewBox="0 0 24 24">${SURF_PATH[id]}</svg>`;
const clubSurfaces = (club) => SURFACES.filter((s) => club.courts[s.id]).map((s) => s.id);
const priceOf = (club, sid) => club.courts[sid].price;

function courtsFree(clubId, sid, date, hour) {
  const club = CLUBS.find((c) => c.id === clubId);
  const total = club.courts[sid].n;
  const mine = state.bookings.filter((b) => b.clubId === clubId && b.surface === sid && b.date === date && covers(b, hour)).length;
  const busy = hash(clubId + sid + date + hour) % (total + 2);
  return Math.max(0, total - busy - mine);
}
function covers(b, hour) {
  const start = HOURS.indexOf(b.hour), idx = HOURS.indexOf(hour);
  return idx >= start && idx < start + b.duration;
}
const isPast = (date, hour) => new Date(`${date}T${hour}:00`) <= new Date();

/* ==================== NIVEAU ==================== */

const eloFromNum = (n) => Math.round(1000 + (n - 1) * 200);
const numFromElo = (e) => Math.min(7, Math.max(1, 1 + (e - 1000) / 200));
const fmtLevel = (n) => n.toFixed(2);
const myElo = () => state.profile.elo;
const myLevel = () => numFromElo(myElo());
const results = () => state.results;
const joined = () => state.joinedMatches;
const isProvisional = () => results().length < 5;
const surfaceLevel = (sid) => numFromElo(state.eloBySurface[sid] ?? myElo());

function levelName(n) {
  if (n < 2) return "Débutant";
  if (n < 3.5) return "Intermédiaire";
  if (n < 5) return "Confirmé";
  return "Compétition";
}

/* Elo adapté au tennis: le résultat pèse 70 pour cent, l'écart de jeux 30 pour cent. */
function computeElo(elo, oppElo, sets, provisional) {
  const gf = sets.reduce((n, s) => n + s[0], 0);
  const ga = sets.reduce((n, s) => n + s[1], 0);
  const setsWon = sets.filter((s) => s[0] > s[1]).length;
  const won = setsWon > sets.length - setsWon;
  const expected = 1 / (1 + Math.pow(10, (oppElo - elo) / 400));
  const ratio = gf + ga ? gf / (gf + ga) : 0.5;
  const perf = 0.7 * (won ? 1 : 0) + 0.3 * ratio;
  const k = provisional ? 60 : 24;
  const next = Math.round(Math.min(2200, Math.max(1000, elo + k * (perf - expected))));
  return { won, next, delta: next - elo };
}

function saveResult({ opponentName, opponentLevel, sets, surface, clubId, date, matchId }) {
  const prov = isProvisional();
  const oppElo = eloFromNum(opponentLevel);
  const global = computeElo(myElo(), oppElo, sets, prov);
  const bySurf = computeElo(state.eloBySurface[surface] ?? myElo(), oppElo, sets, prov);

  results().unshift({
    id: uid(), date: date || iso(new Date()), opponentName, opponentLevel, sets,
    surface, clubId: clubId || null, won: global.won, eloBefore: myElo(), eloAfter: global.next,
  });
  state.profile.elo = global.next;
  state.eloBySurface[surface] = bySurf.next;
  if (matchId) state.joinedMatches = joined().filter((m) => m.id !== matchId);
  save();
  return global;
}

/* ==================== MATCHS OUVERTS ==================== */

function matchesForDay(dateStr) {
  const count = 3 + (hash("n" + dateStr) % 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    const seed = dateStr + ":" + i;
    const club = CLUBS[hash("c" + seed) % CLUBS.length];
    const surfs = clubSurfaces(club);
    const surface = surfs[hash("s" + seed) % surfs.length];
    const hour = HOURS[8 + (hash("h" + seed) % 6)];
    const format = hash("f" + seed) % 3 === 0 ? "double" : "simple";
    const capacity = format === "double" ? 4 : 2;
    const players = [PLAYERS[hash("p" + seed) % PLAYERS.length]];
    for (let j = 0; j < hash("e" + seed) % capacity; j++) {
      const p = PLAYERS[hash("q" + seed + j) % PLAYERS.length];
      if (!players.some((x) => x.name === p.name)) players.push(p);
    }
    if (players.length >= capacity) players.length = capacity - 1;
    const level = Math.round((players.reduce((a, p) => a + p.level, 0) / players.length) * 4) / 4;
    out.push({
      id: "om-" + dateStr + "-" + i, clubId: club.id, surface, date: dateStr, hour,
      duration: 1.5, format, capacity, players, level, price: priceOf(club, surface) * 1.5,
    });
  }
  return out;
}

function openMatches() {
  const mine = new Set(joined().map((m) => m.id));
  return nextDays(7)
    .flatMap((d) => matchesForDay(iso(d)))
    .filter((m) => !isPast(m.date, m.hour) && !mine.has(m.id))
    .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));
}
const fitsLevel = (m) => Math.abs(m.level - myLevel()) <= 0.75;

function joinMatch(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  const names = [state.profile.name, ...m.players.map((p) => p.name)];
  const total = priceOf(club, m.surface) * m.duration;
  const parts = splitEqually(total, names.length);
  state.bookings.push({
    id: uid(), clubId: m.clubId, surface: m.surface, date: m.date, hour: m.hour, duration: m.duration,
    court: "Terrain " + (1 + (hash(m.id) % club.courts[m.surface].n)),
    total, createdAt: Date.now(), openMatchId: m.id,
    shares: names.map((n, i) => ({ id: i === 0 ? "me" : "g" + i, name: n, amount: parts[i], paid: i === 0 })),
  });
  joined().push({ ...m, players: [...m.players] });
  save(); render();
  toast("Match rejoint, la note est déjà partagée");
}

/* ==================== FEUILLE ==================== */

function openSheet(html, wire) {
  $("#sheetBody").innerHTML = html;
  $("#sheet").hidden = false;
  polish($("#sheetBody"));
  if (wire) wire($("#sheetBody"));
}
function closeSheet() { $("#sheet").hidden = true; $("#sheetBody").innerHTML = ""; }
$("#sheet").addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeSheet(); });

/* ==================== ROUTAGE ==================== */

function go(t) { tab = t; nav = null; render(); }
function push(screen) { nav = screen; render(); }

$$(".tab").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
$("#backBtn").addEventListener("click", () => { nav = null; render(); });
$("#avatarBtn").addEventListener("click", () => go("profile"));
window.addEventListener("scroll", () => $("#topbar").classList.toggle("lifted", window.scrollY > 6));

function render() {
  $$(".tab").forEach((b) => b.classList.toggle("is-on", b.dataset.tab === tab));
  $("#avatarBtn").className = "av av-sm " + (hash(state.profile.name) % 3 === 0 ? "av-red" : "");
  $("#avatarBtn").textContent = initials(state.profile.name);
  $("#backBtn").hidden = !nav;

  let title = "Courtside", body = "";
  if (nav?.screen === "club") { title = CLUBS.find((c) => c.id === nav.clubId).name; body = viewClub(nav); }
  else if (nav?.screen === "booking") { title = "Réservation"; body = viewBooking(nav.id); }
  else if (tab === "home") { title = "Terrains"; body = viewHome(); }
  else if (tab === "play") { title = "Matchs"; body = viewPlay(); }
  else if (tab === "bookings") { title = "Agenda"; body = viewBookings(); }
  else if (tab === "friends") { title = "Amis"; body = viewFriends(); }
  else if (tab === "profile") { title = "Profil"; body = viewProfile(); }

  $("#title").textContent = title;
  $("#view").innerHTML = body;
  polish($("#view"));
  window.scrollTo({ top: 0 });
  requestAnimationFrame(moveTabInk);
}

/* mise en mouvement après chaque rendu */
function polish(root) {
  $$(":scope > *", root).forEach((n, i) => n.style.setProperty("--i", i));
  $$(".slot", root).forEach((n, i) => n.style.setProperty("--k", i));
  $$(".seg", root).forEach(moveSegInk);
  $$("[data-count]", root).forEach(countUp);
}

function moveSegInk(seg) {
  const ink = $(".seg-ink", seg), on = $("button.on", seg);
  if (!ink || !on) return;
  const set = () => {
    ink.style.width = on.offsetWidth + "px";
    ink.style.transform = `translateX(${on.offsetLeft - seg.clientLeft - 5}px)`;
    /* garde le choix actif visible quand le segment déborde */
    const left = on.offsetLeft - seg.scrollLeft;
    if (left < 0 || left + on.offsetWidth > seg.clientWidth) {
      seg.scrollTo({ left: Math.max(0, on.offsetLeft - 40), behavior: "smooth" });
    }
  };
  set(); requestAnimationFrame(set);
}

function moveTabInk() {
  const ink = $("#tabInk"), on = $(".tab.is-on");
  if (!ink || !on) return;
  ink.style.width = on.offsetWidth + "px";
  ink.style.transform = `translateX(${on.offsetLeft}px)`;
}

function countUp(node) {
  const to = parseFloat(node.dataset.count);
  const from = lastLevelShown === null ? to : lastLevelShown;
  lastLevelShown = to;
  if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { node.textContent = to.toFixed(2); return; }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 700);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = (from + (to - from) * eased).toFixed(2);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ==================== ÉCRAN: TERRAINS ==================== */

function segment(name, items, current) {
  return `<div class="seg" data-seg="${name}">
    <span class="seg-ink"></span>
    ${items.map((it) => `<button class="${it.id === current ? "on" : ""}" data-seg-val="${it.id}">${esc(it.label)}</button>`).join("")}
  </div>`;
}

function viewHome() {
  const next = upcoming()[0];
  const list = CLUBS.filter((c) => homeSurface === "all" || c.courts[homeSurface]);
  const fav = state.profile.favSurface;

  return `
    <div class="hero">
      <div class="orb"></div>
      <h2>Bonjour ${esc(state.profile.name.split(" ")[0])}</h2>
      <p>${next
        ? `Prochain match ${esc(dateLong(new Date(next.date)))} à ${esc(next.hour)} sur ${esc(surf(next.surface).name.toLowerCase())}`
        : "Aucun terrain réservé. Choisis ta surface et ton créneau."}</p>
    </div>

    <div class="eyebrow">Surface</div>
    ${segment("home-surface", [{ id: "all", label: "Toutes" }, ...SURFACES.map((s) => ({ id: s.id, label: s.tag }))], homeSurface)}

    <div class="eyebrow">${list.length} club${list.length > 1 ? "s" : ""} près de ${esc(state.profile.city)}</div>
    ${list.map((c) => {
      const surfs = clubSurfaces(c);
      const shown = homeSurface === "all" ? surfs : [homeSurface];
      const cheapest = Math.min(...shown.map((s) => priceOf(c, s)));
      return `
      <button class="card tap" data-club="${c.id}">
        <div class="row">
          <span class="thumb ${surfs.includes(fav) ? "red" : ""}">${surfIcon(shown[0], "")}</span>
          <span class="grow">
            <span class="bold cut" style="display:block;font-size:17px">${esc(c.name)}</span>
            <span class="small mute cut" style="display:block">${esc(c.area)} · ${c.dist} km</span>
          </span>
        </div>
        <div class="row" style="margin-top:14px;flex-wrap:wrap;gap:7px">
          <span class="tag ink">dès ${eur(cheapest)}</span>
          ${surfs.map((s) => `<span class="tag ${s === fav ? "red" : ""}">${surfIcon(s, "surf-ico")}${esc(surf(s).tag)} ${c.courts[s].n}</span>`).join("")}
        </div>
      </button>`;
    }).join("")}
  `;
}

/* ==================== ÉCRAN: CLUB ==================== */

function viewClub(ctx) {
  const club = CLUBS.find((c) => c.id === ctx.clubId);
  const surfs = clubSurfaces(club);
  ctx.surface = surfs.includes(ctx.surface) ? ctx.surface : (surfs.includes(state.profile.favSurface) ? state.profile.favSurface : surfs[0]);
  const days = nextDays(10);
  ctx.date = ctx.date || iso(days[0]);
  const s = surf(ctx.surface);

  return `
    <div class="hero">
      <div class="orb"></div>
      <h2>${esc(club.area)}</h2>
      <p>${club.courts[ctx.surface].n} terrains en ${esc(s.name.toLowerCase())} · ${eur(priceOf(club, ctx.surface))} l'heure</p>
    </div>

    <div class="eyebrow">Surface de jeu</div>
    ${segment("club-surface", surfs.map((id) => ({ id, label: surf(id).tag })), ctx.surface)}
    <div class="card" style="display:flex;gap:14px;align-items:center">
      <span class="thumb red">${surfIcon(ctx.surface, "")}</span>
      <span class="grow">
        <span class="bold" style="display:block">${esc(s.name)}</span>
        <span class="small mute">${esc(s.note)}</span>
      </span>
    </div>

    <div class="eyebrow">Jour</div>
    <div class="days">
      ${days.map((d) => `<button class="day ${iso(d) === ctx.date ? "on" : ""}" data-date="${iso(d)}">
        <small>${esc(dayShort(d))}</small><b>${d.getDate()}</b>
      </button>`).join("")}
    </div>

    <div class="eyebrow">Créneaux · ${esc(dateLong(new Date(ctx.date)))}</div>
    <div class="slots">
      ${HOURS.map((h) => {
        const off = courtsFree(club.id, ctx.surface, ctx.date, h) === 0 || isPast(ctx.date, h);
        return `<button class="slot" data-hour="${h}" ${off ? "disabled" : ""}>${h}</button>`;
      }).join("")}
    </div>
    <p class="small mute" style="margin-top:14px">Les créneaux barrés sont complets ou déjà passés.</p>
  `;
}

/* ==================== FEUILLE: RÉSERVATION ==================== */

function openBookingSheet(clubId, surface, date, hour) {
  draft = { clubId, surface, date, hour, duration: 1, players: [] };
  drawBookingSheet();
}

function drawBookingSheet() {
  const club = CLUBS.find((c) => c.id === draft.clubId);
  const total = priceOf(club, draft.surface) * draft.duration;
  const people = 1 + draft.players.length;
  const parts = splitEqually(total, people);
  const maxDur = Math.min(3, HOURS.length - HOURS.indexOf(draft.hour));
  const free = state.friends.filter((f) => !draft.players.some((p) => p.id === f.id));

  openSheet(`
    <h2 style="font-size:24px">${esc(club.name)}</h2>
    <p class="small mute" style="margin:6px 0 18px">${esc(dateLong(new Date(draft.date)))} · ${esc(draft.hour)} · ${esc(surf(draft.surface).name.toLowerCase())}</p>

    <div class="eyebrow" style="margin-top:0">Durée</div>
    <div class="slots" style="grid-template-columns:repeat(3,1fr)">
      ${[1, 1.5, 2].filter((d) => d <= maxDur).map((d) => `
        <button class="slot ${draft.duration === d ? "on" : ""}" data-dur="${d}">${durLabel(d)}</button>`).join("")}
    </div>

    <div class="eyebrow">Joueurs</div>
    <div class="list">
      <div class="li">
        ${avatar(state.profile.name)}
        <div class="grow"><div class="bold">${esc(state.profile.name)}</div><div class="small mute">Organisateur</div></div>
        <span class="tag red">${eur(parts[0])}</span>
      </div>
      ${draft.players.map((p, i) => `
        <div class="li">
          ${avatar(p.name)}
          <div class="grow"><div class="bold">${esc(p.name)}</div><div class="small mute">${esc(p.level)}</div></div>
          <span class="tag red">${eur(parts[i + 1])}</span>
          <button class="round-btn" data-drop="${p.id}" aria-label="Retirer">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`).join("")}
    </div>
    ${free.length ? `<div class="list">${free.map((f) => `
      <div class="li">
        ${avatar(f.name)}
        <div class="grow"><div class="bold">${esc(f.name)}</div><div class="small mute">${esc(f.level)}</div></div>
        <button class="btn wash mini" data-invite="${f.id}">Inviter</button>
      </div>`).join("")}</div>`
    : `<p class="small mute">Ajoute des amis dans l'onglet Amis pour partager la note.</p>`}

    <div class="card">
      <div class="row"><span class="grow mute">Total du terrain</span><span class="bold">${eur(total)}</span></div>
      <div class="row" style="margin-top:8px"><span class="grow mute">Part par joueur (${people})</span><span class="bold">${eur(parts[parts.length - 1])}</span></div>
    </div>

    <button class="btn" id="confirm">Confirmer la réservation</button>
  `, (root) => {
    $$("[data-dur]", root).forEach((b) => b.addEventListener("click", () => { draft.duration = parseFloat(b.dataset.dur); drawBookingSheet(); }));
    $$("[data-invite]", root).forEach((b) => b.addEventListener("click", () => {
      const f = state.friends.find((x) => x.id === b.dataset.invite);
      draft.players.push({ id: f.id, name: f.name, level: f.level });
      drawBookingSheet();
    }));
    $$("[data-drop]", root).forEach((b) => b.addEventListener("click", () => {
      draft.players = draft.players.filter((p) => p.id !== b.dataset.drop);
      drawBookingSheet();
    }));
    $("#confirm", root).addEventListener("click", () => {
      const names = [state.profile.name, ...draft.players.map((p) => p.name)];
      const p = splitEqually(total, names.length);
      const booking = {
        id: uid(), clubId: club.id, surface: draft.surface, date: draft.date, hour: draft.hour,
        duration: draft.duration, court: "Terrain " + (1 + (hash(club.id + draft.date + draft.hour) % club.courts[draft.surface].n)),
        total, createdAt: Date.now(),
        shares: names.map((n, i) => ({ id: i === 0 ? "me" : draft.players[i - 1].id, name: n, amount: p[i], paid: i === 0 })),
      };
      state.bookings.push(booking); save(); closeSheet(); draft = null;
      push({ screen: "booking", id: booking.id });
      toast("Terrain réservé");
    });
  });
}

/* ==================== ÉCRAN: AGENDA ==================== */

const upcoming = () => state.bookings
  .filter((b) => new Date(`${b.date}T${b.hour}:00`) >= new Date(Date.now() - 36e5))
  .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));
const past = () => state.bookings
  .filter((b) => new Date(`${b.date}T${b.hour}:00`) < new Date(Date.now() - 36e5))
  .sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));

function bookingCard(b) {
  const club = CLUBS.find((c) => c.id === b.clubId);
  const due = b.shares.filter((s) => !s.paid).length;
  const pct = (b.shares.filter((s) => s.paid).length / b.shares.length) * 100;
  return `
    <button class="card tap" data-booking="${b.id}">
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <span class="tag red">${esc(dayShort(new Date(b.date)))} ${new Date(b.date).getDate()}/${new Date(b.date).getMonth() + 1}</span>
        <span class="tag">${esc(b.hour)} · ${durLabel(b.duration)}</span>
        <span class="tag">${surfIcon(b.surface)}${esc(surf(b.surface).tag)}</span>
      </div>
      <div class="bold cut" style="margin-top:12px;font-size:16.5px">${esc(club.name)}</div>
      <div class="small mute">${esc(b.court)}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="small mute">${due ? `${due} joueur${due > 1 ? "s" : ""} n'${due > 1 ? "ont" : "a"} pas encore payé` : "Note entièrement réglée"}</div>
    </button>`;
}

function viewBookings() {
  const up = upcoming(), old = past();
  if (!up.length && !old.length) return `<div class="blank">
    <svg viewBox="0 0 24 24"><rect x="3.2" y="5.2" width="17.6" height="15.6" rx="5"/><path d="M8 3.2v4M16 3.2v4M3.2 11h17.6"/></svg>
    <div class="bold">Agenda vide</div><div class="small">Réserve un terrain dans l'onglet Terrains.</div>
  </div>`;
  return `
    ${up.length ? `<div class="eyebrow" style="margin-top:10px">À venir</div>${up.map(bookingCard).join("")}` : ""}
    ${old.length ? `<div class="eyebrow">Passé</div>${old.map(bookingCard).join("")}` : ""}`;
}

function viewBooking(id) {
  const b = state.bookings.find((x) => x.id === id);
  if (!b) return `<div class="blank">Réservation introuvable.</div>`;
  const club = CLUBS.find((c) => c.id === b.clubId);
  const paid = b.shares.filter((s) => s.paid).reduce((n, s) => n + s.amount, 0);
  const done = paid >= b.total - 0.001;

  return `
    <div class="hero ${done ? "" : "red"}">
      <div class="orb"></div>
      <h2>${esc(club.name)}</h2>
      <p>${esc(dateLong(new Date(b.date)))} · ${esc(b.hour)} · ${durLabel(b.duration)} · ${esc(b.court)}</p>
      <div class="row" style="margin-top:16px;gap:8px">
        <span class="tag" style="background:rgba(255,255,255,.16);color:inherit">${surfIcon(b.surface)}${esc(surf(b.surface).name)}</span>
      </div>
    </div>

    <div class="eyebrow">La note</div>
    <div class="card">
      <div class="row">
        <div class="grow">
          <div class="small mute">Encaissé</div>
          <div class="bold" style="font-size:26px;letter-spacing:-.03em;white-space:nowrap">${eur(paid)}</div>
          <div class="small mute">sur ${eur(b.total)}</div>
        </div>
        <span class="tag ${done ? "ink" : "red"}"><span class="dot"></span>${done ? "Réglée" : "En attente"}</span>
      </div>
      <div class="bar"><i style="width:${(paid / b.total) * 100}%"></i></div>
    </div>

    <div class="list">
      ${b.shares.map((s) => `
        <div class="li">
          ${avatar(s.name)}
          <div class="grow"><div class="bold">${esc(s.name)}</div><div class="small mute">${s.paid ? "A payé" : "Doit " + eur(s.amount)}</div></div>
          <div class="bold small">${eur(s.amount)}</div>
          <button class="check ${s.paid ? "on" : ""}" data-pay="${s.id}" aria-label="Marquer payé">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
          </button>
        </div>`).join("")}
    </div>

    <button class="btn" id="share">Partager la note</button>
    <div class="gap"></div>
    <button class="btn plain" id="addPlayer">Ajouter un joueur</button>
    <div class="gap"></div>
    ${isPast(b.date, b.hour) ? `<button class="btn dark" data-scoreb="${b.id}">Enregistrer le score</button><div class="gap"></div>` : ""}
    <button class="btn quiet" id="cancel">Annuler la réservation</button>
  `;
}

function billText(b) {
  const club = CLUBS.find((c) => c.id === b.clubId);
  return [
    `${club.name} · ${b.court} · ${surf(b.surface).name}`,
    `${dateLong(new Date(b.date))} à ${b.hour} (${durLabel(b.duration)})`,
    `Total : ${eur(b.total)} pour ${b.shares.length} joueurs`, "",
    ...b.shares.map((s) => `- ${s.name} : ${eur(s.amount)}${s.paid ? " (payé)" : ""}`), "",
    "Partagé depuis Courtside",
  ].join("\n");
}

async function shareBill(b) {
  const text = billText(b);
  if (navigator.share) { try { await navigator.share({ title: "Note du terrain", text }); return; } catch { /* annulé */ } }
  try { await navigator.clipboard.writeText(text); toast("Note copiée"); }
  catch { openSheet(`<h2>Note du terrain</h2><pre class="small" style="white-space:pre-wrap">${esc(text)}</pre><button class="btn plain" data-close>Fermer</button>`); }
}

/* ==================== ÉCRAN: MATCHS ==================== */

function levelBlock() {
  const lvl = myLevel();
  const wins = results().filter((r) => r.won).length;
  return `
    <div class="level">
      <div class="orb"></div>
      <div class="row" style="align-items:flex-end">
        <div class="grow">
          <div class="level-lab">Niveau ${esc(levelName(lvl))}</div>
          <div class="level-num" data-count="${lvl}">${fmtLevel(lvl)}</div>
        </div>
        <div style="text-align:right">
          <div class="level-lab">${results().length} match${results().length > 1 ? "s" : ""}</div>
          <div class="level-lab">${wins} v · ${results().length - wins} d</div>
        </div>
      </div>
      <div class="bar on-ink"><i style="width:${(lvl - Math.floor(lvl)) * 100}%"></i></div>
      <div class="level-lab">${isProvisional()
        ? `Niveau provisoire, encore ${5 - results().length} match${5 - results().length > 1 ? "s" : ""} pour le fiabiliser.`
        : `Prochain palier à ${fmtLevel(Math.floor(lvl) + 1)}.`}</div>
    </div>`;
}

function matchCard(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  const free = m.capacity - m.players.length;
  return `
    <div class="card">
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <span class="tag red">${esc(dayShort(new Date(m.date)))} ${new Date(m.date).getDate()}/${new Date(m.date).getMonth() + 1}</span>
        <span class="tag">${esc(m.hour)}</span>
        <span class="tag">${surfIcon(m.surface)}${esc(surf(m.surface).tag)}</span>
        <span class="tag ${fitsLevel(m) ? "ink" : ""}">Niveau ${fmtLevel(m.level)}</span>
      </div>
      <div class="bold cut" style="margin-top:12px;font-size:16.5px">${esc(club.name)}</div>
      <div class="small mute">${esc(club.area)} · ${m.format === "double" ? "Double" : "Simple"} · ${eur(m.price / m.capacity)} par joueur</div>
      <div class="row" style="margin-top:16px">
        <span class="stack">
          ${m.players.map((p) => avatar(p.name)).join("")}
          ${Array.from({ length: free }, () => `<span class="free-slot">+</span>`).join("")}
        </span>
        <span class="grow small mute">${free} place${free > 1 ? "s" : ""}</span>
        <button class="btn mini" data-join="${m.id}">Rejoindre</button>
      </div>
    </div>`;
}

function joinedCard(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  return `
    <div class="card">
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <span class="tag red">${esc(dayShort(new Date(m.date)))} ${new Date(m.date).getDate()}/${new Date(m.date).getMonth() + 1}</span>
        <span class="tag">${esc(m.hour)}</span>
        <span class="tag">${surfIcon(m.surface)}${esc(surf(m.surface).tag)}</span>
      </div>
      <div class="bold cut" style="margin-top:12px;font-size:16.5px">${esc(club.name)}</div>
      <div class="small mute">Avec ${m.players.map((p) => esc(p.name)).join(", ")}</div>
      <div class="gap"></div>
      ${isPast(m.date, m.hour)
        ? `<button class="btn mini" data-score="${m.id}">Enregistrer le score</button>`
        : `<button class="btn quiet mini" data-leave="${m.id}">Se désinscrire</button>`}
    </div>`;
}

function resultRow(r) {
  const d = (r.eloAfter - r.eloBefore) / 200;
  const flat = Math.abs(d) < 0.005;
  return `
    <div class="li">
      ${avatar(r.opponentName)}
      <div class="grow">
        <div class="bold cut">${esc(r.opponentName)}</div>
        <div class="small mute">${esc(surf(r.surface).tag)} · niveau ${fmtLevel(r.opponentLevel)}</div>
      </div>
      <div style="text-align:right">
        <div class="score">${r.sets.map((s) => s[0] + "-" + s[1]).join(" ")}</div>
        <div class="delta ${flat ? "" : d > 0 ? "up" : "down"}">${flat ? "0.00" : (d > 0 ? "+" : "") + d.toFixed(2)}</div>
      </div>
    </div>`;
}

function viewPlay() {
  const all = openMatches();
  const list = all
    .filter((m) => !playLevelOnly || fitsLevel(m))
    .filter((m) => playSurface === "all" || m.surface === playSurface);
  const mine = joined().sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));

  return `
    ${levelBlock()}

    ${mine.length ? `<div class="eyebrow">Mes matchs</div>${mine.map(joinedCard).join("")}` : ""}

    <div class="eyebrow">Matchs ouverts</div>
    ${segment("play-level", [{ id: "fit", label: "À mon niveau" }, { id: "all", label: "Tous les niveaux" }], playLevelOnly ? "fit" : "all")}
    ${segment("play-surface", [{ id: "all", label: "Toutes surfaces" }, ...SURFACES.map((s) => ({ id: s.id, label: s.tag }))], playSurface)}
    ${list.length ? list.map(matchCard).join("") : `<div class="blank">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M4.6 6.4c4 3.1 4 11.2 0 11.2M19.4 6.4c-4 3.1-4 11.2 0 11.2"/></svg>
      <div class="bold">Aucun match ne correspond</div><div class="small">Élargis le niveau ou la surface.</div>
    </div>`}

    <div class="eyebrow">Mes résultats</div>
    <button class="btn plain" id="addResult">Ajouter un résultat</button>
    <div class="gap"></div>
    ${results().length
      ? `<div class="list">${results().slice(0, 12).map(resultRow).join("")}</div>`
      : `<p class="small mute">Aucun match enregistré. Ton niveau reste une estimation tant que tu n'as pas joué.</p>`}
  `;
}

/* ==================== FEUILLE: SCORE ==================== */

function openResultSheet(pre = {}) {
  const nums = (sel) => Array.from({ length: 8 }, (_, i) => `<option ${i === sel ? "selected" : ""}>${i}</option>`).join("");
  let levelOpts = "";
  for (let v = 1; v <= 7.001; v += 0.5) {
    const chosen = Math.abs(v - (pre.opponentLevel || Math.round(myLevel() * 2) / 2)) < 0.26;
    levelOpts += `<option value="${v.toFixed(2)}" ${chosen ? "selected" : ""}>${v.toFixed(2)} · ${levelName(v)}</option>`;
  }
  const known = [...new Set([...(pre.candidates || []), ...state.friends.map((f) => f.name)])];
  const surface = pre.surface || state.profile.favSurface;

  openSheet(`
    <h2 style="font-size:24px">Score du match</h2>
    <p class="small mute" style="margin:6px 0 18px">Le niveau de l'adversaire pèse sur le calcul. Battre plus fort que soi rapporte davantage.</p>

    <label class="f"><span>Adversaire</span>
      <input id="rOpp" list="rList" value="${esc(pre.opponentName || "")}" placeholder="Nom du joueur" autocomplete="off">
    </label>
    <datalist id="rList">${known.map((n) => `<option value="${esc(n)}"></option>`).join("")}</datalist>

    <label class="f"><span>Niveau de l'adversaire</span><select id="rLevel">${levelOpts}</select></label>

    <div class="eyebrow" style="margin-top:0">Surface</div>
    ${segment("result-surface", SURFACES.map((s) => ({ id: s.id, label: s.tag })), surface)}
    <input type="hidden" id="rSurface" value="${surface}">

    <div class="eyebrow">Sets</div>
    ${[0, 1, 2].map((i) => `
      <div class="setline">
        <select data-set="${i}" data-side="0">${nums(i < 2 ? 6 : 0)}</select>
        <span>/</span>
        <select data-set="${i}" data-side="1">${nums(i < 2 ? 4 : 0)}</select>
      </div>`).join("")}
    <p class="small mute">Laisse le troisième set à 0 / 0 si le match s'est joué en deux sets.</p>

    <div class="gap"></div>
    <button class="btn" id="saveScore">Enregistrer le résultat</button>
  `, (root) => {
    $$("[data-seg='result-surface'] button", root).forEach((b) => b.addEventListener("click", () => {
      $$("[data-seg='result-surface'] button", root).forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      $("#rSurface", root).value = b.dataset.segVal;
      moveSegInk($("[data-seg='result-surface']", root));
    }));

    $("#saveScore", root).addEventListener("click", () => {
      const name = $("#rOpp", root).value.trim();
      if (!name) return toast("Indique l'adversaire");
      const sets = [0, 1, 2].map((i) => [
        parseInt($(`[data-set="${i}"][data-side="0"]`, root).value, 10),
        parseInt($(`[data-set="${i}"][data-side="1"]`, root).value, 10),
      ]).filter((s) => s[0] + s[1] > 0);
      if (!sets.length) return toast("Entre au moins un set");
      if (sets.some((s) => s[0] === s[1])) return toast("Un set ne peut pas être à égalité");
      const won = sets.filter((s) => s[0] > s[1]).length;
      if (won === sets.length - won) return toast("Le vainqueur doit être départagé");

      const r = saveResult({
        opponentName: name,
        opponentLevel: parseFloat($("#rLevel", root).value),
        sets,
        surface: $("#rSurface", root).value,
        clubId: pre.clubId, date: pre.date, matchId: pre.matchId,
      });
      closeSheet(); render();
      toast(`${r.won ? "Victoire" : "Défaite"} enregistrée, niveau ${r.delta >= 0 ? "+" : ""}${(r.delta / 200).toFixed(2)}`);
    });
  });
}

/* ==================== ÉCRAN: AMIS ==================== */

const SUGGESTED = PLAYERS.slice(2, 10);

function viewFriends() {
  const known = new Set(state.friends.map((f) => f.name));
  const sugg = SUGGESTED.filter((s) => !known.has(s.name));
  return `
    <label class="f" style="margin-top:14px"><span>Ajouter un ami</span>
      <input id="friendName" placeholder="Nom du joueur" autocomplete="off">
    </label>
    <button class="btn plain" id="addFriend">Ajouter</button>

    <div class="eyebrow">Mes amis (${state.friends.length})</div>
    ${state.friends.length ? `<div class="list">${state.friends.map((f) => `
      <div class="li">
        ${avatar(f.name)}
        <div class="grow"><div class="bold">${esc(f.name)}</div><div class="small mute">${esc(f.level)}</div></div>
        <button class="round-btn" data-unfriend="${f.id}" aria-label="Retirer">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>`).join("")}</div>` : `<p class="small mute">Aucun ami pour l'instant.</p>`}

    ${sugg.length ? `<div class="eyebrow">Suggestions</div><div class="list">${sugg.map((s) => `
      <div class="li">
        ${avatar(s.name)}
        <div class="grow"><div class="bold">${esc(s.name)}</div><div class="small mute">Niveau ${fmtLevel(s.level)}</div></div>
        <button class="btn wash mini" data-suggest="${esc(s.name)}">Ajouter</button>
      </div>`).join("")}</div>` : ""}
  `;
}

function addFriend(name, level) {
  name = (name || "").trim();
  if (!name) return toast("Entre un nom");
  if (state.friends.some((f) => f.name.toLowerCase() === name.toLowerCase())) return toast("Déjà dans tes amis");
  state.friends.push({ id: uid(), name, level: level || "Intermédiaire" });
  save(); render(); toast(name + " ajouté");
}

/* ==================== ÉCRAN: PROFIL ==================== */

function percentile() {
  const lvl = myLevel();
  return Math.round((PLAYERS.filter((p) => p.level < lvl).length / PLAYERS.length) * 100);
}

function viewProfile() {
  const wins = results().filter((r) => r.won).length;
  const hours = state.bookings.reduce((n, b) => n + b.duration, 0);
  const owed = state.bookings.flatMap((b) => b.shares).filter((s) => !s.paid).reduce((n, s) => n + s.amount, 0);
  const best = [...SURFACES].sort((a, b) => surfaceLevel(b.id) - surfaceLevel(a.id))[0];

  return `
    <div style="text-align:center;padding:16px 0 22px">
      ${avatar(state.profile.name, "lg")}
      <h2 style="margin-top:16px;font-size:27px">${esc(state.profile.name)}</h2>
      <div class="small mute">${esc(levelName(myLevel()))} · ${esc(state.profile.hand)} · ${esc(state.profile.city)}</div>
    </div>

    ${levelBlock()}
    <p class="small mute" style="margin:12px 4px 0">Plus fort que ${percentile()} pour cent des joueurs de ${esc(state.profile.city)}.${results().length ? ` Ta meilleure surface est ${esc(best.name.toLowerCase())}.` : ""}</p>

    <div class="eyebrow">Niveau par surface</div>
    <div class="list">
      ${SURFACES.map((s) => {
        const lv = surfaceLevel(s.id);
        const played = results().filter((r) => r.surface === s.id).length;
        return `<div class="li">
          <span class="thumb ${s.id === state.profile.favSurface ? "red" : ""}" style="width:44px;height:44px;border-radius:15px">${surfIcon(s.id, "")}</span>
          <div class="grow">
            <div class="bold">${esc(s.name)}</div>
            <div class="small mute">${played ? `${played} match${played > 1 ? "s" : ""}` : "Aucun match"}</div>
          </div>
          <div class="bold score">${fmtLevel(lv)}</div>
        </div>`;
      }).join("")}
    </div>

    <div class="eyebrow">Statistiques</div>
    <div class="stats">
      <div class="stat"><b>${wins}</b><small>victoires</small></div>
      <div class="stat"><b>${durLabel(hours)}</b><small>de jeu</small></div>
      <div class="stat"><b>${state.bookings.length}</b><small>réservations</small></div>
    </div>

    ${owed > 0 ? `<div class="card" style="margin-top:14px">
      <div class="bold">${eur(owed)} en attente</div>
      <div class="small mute">Certains joueurs n'ont pas encore réglé leur part.</div>
    </div>` : ""}

    <div class="eyebrow">Surface préférée</div>
    ${segment("fav-surface", SURFACES.map((s) => ({ id: s.id, label: s.tag })), state.profile.favSurface)}

    <div class="eyebrow">Mes informations</div>
    <div class="card">
      <label class="f"><span>Nom</span><input id="pName" value="${esc(state.profile.name)}"></label>
      <label class="f"><span>Niveau de départ${results().length ? " (verrouillé)" : ""}</span>
        <select id="pLevel" ${results().length ? "disabled" : ""}>${LEVELS.map((l) => `<option ${l === state.profile.level ? "selected" : ""}>${l}</option>`).join("")}</select>
      </label>
      <label class="f"><span>Ville</span><input id="pCity" value="${esc(state.profile.city)}"></label>
      <label class="f" style="margin-bottom:0"><span>Main</span>
        <select id="pHand">${["Droitier", "Gaucher"].map((h) => `<option ${h === state.profile.hand ? "selected" : ""}>${h}</option>`).join("")}</select>
      </label>
    </div>
    <button class="btn" id="saveProfile">Enregistrer</button>
    <div class="gap"></div>
    <button class="btn quiet" id="reset">Réinitialiser les données</button>
  `;
}

/* ==================== INTERACTIONS ==================== */

document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const ink = document.createElement("span");
  ink.className = "ripple";
  ink.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  btn.appendChild(ink);
  setTimeout(() => ink.remove(), 620);
});

$("#view").addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);

  /* segments */
  const seg = t("[data-seg] button");
  if (seg) {
    const name = seg.closest("[data-seg]").dataset.seg;
    const val = seg.dataset.segVal;
    if (name === "home-surface") homeSurface = val;
    else if (name === "club-surface") nav.surface = val;
    else if (name === "play-level") playLevelOnly = val === "fit";
    else if (name === "play-surface") playSurface = val;
    else if (name === "fav-surface") { state.profile.favSurface = val; save(); }
    return render();
  }

  const club = t("[data-club]");
  if (club) return push({ screen: "club", clubId: club.dataset.club });

  const day = t("[data-date]");
  if (day && nav) { nav.date = day.dataset.date; return render(); }

  const slot = t("[data-hour]");
  if (slot && !slot.disabled && nav) return openBookingSheet(nav.clubId, nav.surface, nav.date, slot.dataset.hour);

  const bk = t("[data-booking]");
  if (bk) return push({ screen: "booking", id: bk.dataset.booking });

  const pay = t("[data-pay]");
  if (pay && nav?.screen === "booking") {
    const b = state.bookings.find((x) => x.id === nav.id);
    const s = b.shares.find((x) => x.id === pay.dataset.pay);
    s.paid = !s.paid; save(); render();
    return toast(s.paid ? s.name + " a payé" : "Paiement annulé");
  }

  if (t("#share")) return shareBill(state.bookings.find((x) => x.id === nav.id));
  if (t("#addPlayer")) return openAddPlayerSheet(state.bookings.find((x) => x.id === nav.id));
  if (t("#cancel")) {
    const b = state.bookings.find((x) => x.id === nav.id);
    state.bookings = state.bookings.filter((x) => x.id !== nav.id);
    if (b?.openMatchId) state.joinedMatches = joined().filter((m) => m.id !== b.openMatchId);
    save(); go("bookings"); return toast("Réservation annulée");
  }

  const scoreb = t("[data-scoreb]");
  if (scoreb) {
    const b = state.bookings.find((x) => x.id === scoreb.dataset.scoreb);
    const others = b.shares.filter((s) => s.id !== "me");
    return openResultSheet({
      opponentName: others[0]?.name || "", candidates: others.map((s) => s.name),
      surface: b.surface, clubId: b.clubId, date: b.date, matchId: b.openMatchId,
    });
  }

  /* matchs */
  const join = t("[data-join]");
  if (join) { const m = openMatches().find((x) => x.id === join.dataset.join); if (m) joinMatch(m); return; }

  const leave = t("[data-leave]");
  if (leave) {
    state.joinedMatches = joined().filter((m) => m.id !== leave.dataset.leave);
    state.bookings = state.bookings.filter((b) => b.openMatchId !== leave.dataset.leave);
    save(); render(); return toast("Désinscrit du match");
  }

  const score = t("[data-score]");
  if (score) {
    const m = joined().find((x) => x.id === score.dataset.score);
    return openResultSheet({
      opponentName: m.players[0].name, opponentLevel: m.players[0].level,
      candidates: m.players.map((p) => p.name), surface: m.surface,
      clubId: m.clubId, date: m.date, matchId: m.id,
    });
  }
  if (t("#addResult")) return openResultSheet({});

  /* amis */
  if (t("#addFriend")) return addFriend($("#friendName").value);
  const sug = t("[data-suggest]");
  if (sug) return addFriend(sug.dataset.suggest, levelName(PLAYERS.find((p) => p.name === sug.dataset.suggest).level));
  const unf = t("[data-unfriend]");
  if (unf) { state.friends = state.friends.filter((f) => f.id !== unf.dataset.unfriend); save(); render(); return toast("Ami retiré"); }

  /* profil */
  if (t("#saveProfile")) {
    const declared = $("#pLevel").value;
    state.profile = {
      ...state.profile,
      name: $("#pName").value.trim() || state.profile.name,
      level: declared,
      city: $("#pCity").value.trim() || state.profile.city,
      hand: $("#pHand").value,
    };
    if (!results().length) {
      state.profile.elo = eloFromNum(DECLARED[declared] || 3);
      SURFACES.forEach((s) => { state.eloBySurface[s.id] = state.profile.elo; });
    }
    save(); render(); return toast("Profil enregistré");
  }
  if (t("#reset")) { state = blankState(); lastLevelShown = null; save(); go("home"); return toast("Données réinitialisées"); }
});

$("#view").addEventListener("keydown", (e) => {
  if (e.target.id === "friendName" && e.key === "Enter") addFriend(e.target.value);
});

function openAddPlayerSheet(b) {
  const inBill = new Set(b.shares.map((s) => s.name));
  const free = state.friends.filter((f) => !inBill.has(f.name));
  openSheet(`
    <h2 style="font-size:24px">Ajouter un joueur</h2>
    <p class="small mute" style="margin:6px 0 18px">La note sera recalculée à parts égales.</p>
    ${free.length ? `<div class="list">${free.map((f) => `
      <div class="li">
        ${avatar(f.name)}
        <div class="grow"><div class="bold">${esc(f.name)}</div><div class="small mute">${esc(f.level)}</div></div>
        <button class="btn wash mini" data-pick="${f.id}">Ajouter</button>
      </div>`).join("")}</div>` : `<p class="small mute">Tous tes amis sont déjà sur cette note.</p>`}
    <button class="btn plain" data-close>Fermer</button>
  `, (root) => {
    $$("[data-pick]", root).forEach((btn) => btn.addEventListener("click", () => {
      const f = state.friends.find((x) => x.id === btn.dataset.pick);
      b.shares.push({ id: f.id, name: f.name, amount: 0, paid: false });
      const parts = splitEqually(b.total, b.shares.length);
      b.shares.forEach((s, i) => { s.amount = parts[i]; });
      save(); closeSheet(); render(); toast(f.name + " ajouté à la note");
    }));
  });
}

render();
window.addEventListener("resize", () => { moveTabInk(); $$(".seg").forEach(moveSegInk); });
