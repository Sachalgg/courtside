/* Courtside. Reservation de terrains de tennis entre amis. */

/* ---------- données statiques ---------- */

const CLUBS = [
  { id: "leopold", name: "Club des Étangs", area: "Uccle", surface: "Terre battue", indoor: false, courts: 8, price: 26, dist: 2.1 },
  { id: "woluwe", name: "Tennis du Parc", area: "Woluwe-Saint-Pierre", surface: "Dur couvert", indoor: true, courts: 6, price: 22, dist: 4.6 },
  { id: "soignes", name: "TC des Hêtres", area: "Auderghem", surface: "Terre battue", indoor: false, courts: 10, price: 24, dist: 5.3 },
  { id: "primerose", name: "Tennis du Vivier", area: "Uccle", surface: "Dur", indoor: false, courts: 5, price: 20, dist: 3.4 },
  { id: "atlantis", name: "Smash Indoor Ixelles", area: "Ixelles", surface: "Dur couvert", indoor: true, courts: 4, price: 28, dist: 1.6 },
];

const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Compétition"];
const SUGGESTED = [
  { name: "Camille Dubois", level: "Intermédiaire" },
  { name: "Yanis Berger", level: "Confirmé" },
  { name: "Léa Moreau", level: "Débutant" },
  { name: "Tom Vandeput", level: "Compétition" },
  { name: "Sofia Renard", level: "Intermédiaire" },
  { name: "Noah Lambert", level: "Confirmé" },
];

/* ---------- état ---------- */

const KEY = "courtside.v1";

const defaultState = () => ({
  profile: { name: "Sacha Legrelle", level: "Intermédiaire", city: "Bruxelles", hand: "Droitier", elo: 1400 },
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
let nav = null;      // écran empilé { screen, ... }
let draft = null;    // réservation en cours

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* stockage indisponible */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---------- utilitaires ---------- */

const $ = (sel) => document.querySelector(sel);
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const durLabel = (d) => Math.floor(d) + "h" + String(Math.round((d % 1) * 60)).padStart(2, "0");
const eur = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " EUR";

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function colorOf(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 5;
  return "c" + (h + 1);
}
function avatar(name, size = "md") {
  return `<span class="avatar ${size} ${colorOf(name)}">${esc(initials(name))}</span>`;
}

function nextDays(n) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayShort = (d) => d.toLocaleDateString("fr-BE", { weekday: "short" }).replace(".", "");
const dateLong = (d) => d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

/* disponibilité déterministe: même club + même jour = mêmes créneaux */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
function courtsFree(clubId, date, hour) {
  const club = CLUBS.find((c) => c.id === clubId);
  const taken = state.bookings.filter((b) => b.clubId === clubId && b.date === date && overlaps(b, hour)).length;
  const busy = hash(clubId + date + hour) % (club.courts + 2);
  return Math.max(0, club.courts - busy - taken);
}
function overlaps(booking, hour) {
  const start = HOURS.indexOf(booking.hour);
  const idx = HOURS.indexOf(hour);
  return idx >= start && idx < start + booking.duration;
}
function isPast(date, hour) {
  const now = new Date();
  return new Date(`${date}T${hour}:00`) <= now;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 2200);
}

/* ---------- feuille modale ---------- */

function openSheet(html, wire) {
  $("#sheetBody").innerHTML = html;
  $("#sheet").hidden = false;
  if (wire) wire($("#sheetBody"));
}
function closeSheet() { $("#sheet").hidden = true; $("#sheetBody").innerHTML = ""; }
$("#sheet").addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeSheet(); });

/* ---------- routage ---------- */

function go(tabName) { tab = tabName; nav = null; render(); }
function push(screen) { nav = screen; render(); }
function back() { nav = nav && nav.parent ? nav.parent : null; render(); }

document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
$("#backBtn").addEventListener("click", back);
$("#avatarBtn").addEventListener("click", () => go("profile"));
$("#view").addEventListener("scroll", () => {});
window.addEventListener("scroll", () => {
  $("#topbar").classList.toggle("scrolled", window.scrollY > 4);
});

/* ---------- rendu ---------- */

function render() {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#avatarBtn").className = "avatar sm " + colorOf(state.profile.name);
  $("#avatarBtn").textContent = initials(state.profile.name);
  $("#backBtn").hidden = !nav;

  let title = "Courtside", body = "";
  if (nav && nav.screen === "club") { title = CLUBS.find((c) => c.id === nav.clubId).name; body = viewClub(nav); }
  else if (nav && nav.screen === "booking") { title = "Réservation"; body = viewBooking(nav.id); }
  else if (tab === "home") { title = "Terrains"; body = viewHome(); }
  else if (tab === "play") { title = "Matchs"; body = viewPlay(); }
  else if (tab === "bookings") { title = "Mes réservations"; body = viewBookings(); }
  else if (tab === "friends") { title = "Amis"; body = viewFriends(); }
  else if (tab === "profile") { title = "Profil"; body = viewProfile(); }

  $("#title").textContent = title;
  $("#view").innerHTML = body;
  window.scrollTo(0, 0);
}

/* ---------- écran: accueil / clubs ---------- */

function viewHome() {
  const upcoming = upcomingBookings()[0];
  return `
    <div class="hero">
      <div class="ball"></div>
      <h2>Bonjour ${esc(state.profile.name.split(" ")[0])}</h2>
      <p>${upcoming
        ? `Prochain match ${esc(dateLong(new Date(upcoming.date)))} à ${esc(upcoming.hour)}`
        : "Aucun terrain réservé. Trouvez un créneau ci-dessous."}</p>
    </div>

    <div class="section-title">Clubs près de ${esc(state.profile.city)}</div>
    ${CLUBS.map((c) => `
      <div class="card">
        <button class="club" data-club="${c.id}">
          <span class="club-thumb ${c.surface.startsWith("Terre") ? "clay" : ""}">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>
          </span>
          <span class="grow">
            <span class="strong truncate" style="display:block">${esc(c.name)}</span>
            <span class="tiny muted">${esc(c.area)} · ${c.dist} km · ${c.courts} terrains</span>
            <span style="display:block;margin-top:6px">
              <span class="pill ${c.surface.startsWith("Terre") ? "clay" : "blue"}">${esc(c.surface)}</span>
              <span class="pill grey">${eur(c.price)}/h</span>
            </span>
          </span>
        </button>
      </div>`).join("")}
  `;
}

/* ---------- écran: club + créneaux ---------- */

function viewClub(ctx) {
  const club = CLUBS.find((c) => c.id === ctx.clubId);
  const days = nextDays(10);
  const date = ctx.date || iso(days[0]);
  ctx.date = date;

  return `
    <div class="card">
      <div class="row">
        <span class="club-thumb ${club.surface.startsWith("Terre") ? "clay" : ""}">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>
        </span>
        <div class="grow">
          <div class="strong">${esc(club.area)}</div>
          <div class="tiny muted">${esc(club.surface)}${club.indoor ? " · couvert" : " · extérieur"} · ${club.courts} terrains</div>
        </div>
        <span class="pill">${eur(club.price)}/h</span>
      </div>
    </div>

    <div class="section-title">Choisir un jour</div>
    <div class="date-strip">
      ${days.map((d) => `
        <button class="date-chip ${iso(d) === date ? "on" : ""}" data-date="${iso(d)}">
          <small>${esc(dayShort(d))}</small><b>${d.getDate()}</b>
        </button>`).join("")}
    </div>

    <div class="section-title">Créneaux · ${esc(dateLong(new Date(date)))}</div>
    <div class="slots">
      ${HOURS.map((h) => {
        const free = courtsFree(club.id, date, h);
        const past = isPast(date, h);
        const off = free === 0 || past;
        return `<button class="slot" data-hour="${h}" ${off ? "disabled" : ""}>${h}</button>`;
      }).join("")}
    </div>
    <p class="tiny muted" style="margin-top:12px">Les créneaux barrés sont complets ou déjà passés.</p>
  `;
}

/* ---------- feuille: nouvelle réservation ---------- */

function openBookingSheet(clubId, date, hour) {
  const club = CLUBS.find((c) => c.id === clubId);
  draft = { clubId, date, hour, duration: 1, players: [] };
  renderBookingSheet(club);
}

function renderBookingSheet(club) {
  const total = club.price * draft.duration;
  const people = 1 + draft.players.length;
  const parts = splitEqually(total, people);
  const share = parts[0];
  const maxDur = Math.min(3, HOURS.length - HOURS.indexOf(draft.hour));

  openSheet(`
    <h2 style="margin-bottom:2px">${esc(club.name)}</h2>
    <p class="tiny muted" style="margin:0 0 14px">${esc(dateLong(new Date(draft.date)))} · ${esc(draft.hour)}</p>

    <div class="section-title" style="margin-top:0">Durée</div>
    <div class="slots" style="grid-template-columns:repeat(3,1fr)">
      ${[1, 1.5, 2].filter((d) => d <= maxDur).map((d) => `
        <button class="slot ${draft.duration === d ? "on" : ""}" data-dur="${d}">${durLabel(d)}</button>`).join("")}
    </div>

    <div class="section-title">Joueurs</div>
    <div class="list">
      <div class="list-row">
        ${avatar(state.profile.name)}
        <div class="grow"><div class="strong">${esc(state.profile.name)}</div><div class="tiny muted">Organisateur</div></div>
        <span class="pill">${eur(share)}</span>
      </div>
      ${draft.players.map((p, i) => `
        <div class="list-row">
          ${avatar(p.name)}
          <div class="grow"><div class="strong">${esc(p.name)}</div><div class="tiny muted">${esc(p.level)}</div></div>
          <span class="pill">${eur(parts[i + 1])}</span>
          <button class="icon-btn" data-remove="${p.id}" aria-label="Retirer">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`).join("")}
    </div>
    ${state.friends.filter((f) => !draft.players.some((p) => p.id === f.id)).length ? `
      <div class="list">
        ${state.friends.filter((f) => !draft.players.some((p) => p.id === f.id)).map((f) => `
          <div class="list-row">
            ${avatar(f.name)}
            <div class="grow"><div class="strong">${esc(f.name)}</div><div class="tiny muted">${esc(f.level)}</div></div>
            <button class="btn soft sm" data-add="${f.id}">Inviter</button>
          </div>`).join("")}
      </div>` : `<p class="tiny muted">Ajoutez des amis depuis l'onglet Amis pour partager la note.</p>`}

    <div class="card">
      <div class="row"><div class="grow muted">Total du terrain</div><div class="strong">${eur(total)}</div></div>
      <div class="row" style="margin-top:6px"><div class="grow muted">Part par joueur (${people})</div><div class="strong">${eur(parts[parts.length - 1])}</div></div>
    </div>

    <button class="btn" id="confirmBtn">Confirmer la réservation</button>
  `, (root) => {
    root.querySelectorAll("[data-dur]").forEach((b) => b.addEventListener("click", () => {
      draft.duration = parseFloat(b.dataset.dur);
      renderBookingSheet(club);
    }));
    root.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const f = state.friends.find((x) => x.id === b.dataset.add);
      draft.players.push({ id: f.id, name: f.name, level: f.level });
      renderBookingSheet(club);
    }));
    root.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
      draft.players = draft.players.filter((p) => p.id !== b.dataset.remove);
      renderBookingSheet(club);
    }));
    root.querySelector("#confirmBtn").addEventListener("click", () => confirmBooking(club));
  });
}

/* repartition a parts egales, le reliquat en centimes va a l'organisateur */
function splitEqually(total, count) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rest = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

function confirmBooking(club) {
  const total = club.price * draft.duration;
  const people = 1 + draft.players.length;
  const parts = splitEqually(total, people);

  const booking = {
    id: uid(),
    clubId: club.id,
    date: draft.date,
    hour: draft.hour,
    duration: draft.duration,
    court: "Terrain " + (1 + (hash(club.id + draft.date + draft.hour) % club.courts)),
    total,
    createdAt: Date.now(),
    shares: [
      { id: "me", name: state.profile.name, amount: parts[0], paid: true },
      ...draft.players.map((p, i) => ({ id: p.id, name: p.name, amount: parts[i + 1], paid: false })),
    ],
  };
  state.bookings.push(booking);
  save();
  closeSheet();
  draft = null;
  push({ screen: "booking", id: booking.id });
  toast("Terrain réservé");
}

/* ---------- écran: liste des réservations ---------- */

function upcomingBookings() {
  return state.bookings
    .filter((b) => new Date(`${b.date}T${b.hour}:00`) >= new Date(Date.now() - 3600e3))
    .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));
}
function pastBookings() {
  return state.bookings
    .filter((b) => new Date(`${b.date}T${b.hour}:00`) < new Date(Date.now() - 3600e3))
    .sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));
}

function bookingCard(b) {
  const club = CLUBS.find((c) => c.id === b.clubId);
  const due = b.shares.filter((s) => !s.paid);
  return `
    <div class="card">
      <button class="club" data-booking="${b.id}">
        <span class="grow">
          <span class="row" style="gap:8px">
            <span class="pill">${esc(dayShort(new Date(b.date)))} ${new Date(b.date).getDate()}/${new Date(b.date).getMonth() + 1}</span>
            <span class="pill grey">${esc(b.hour)} · ${durLabel(b.duration)}</span>
          </span>
          <span class="strong truncate" style="display:block;margin-top:8px">${esc(club.name)}</span>
          <span class="tiny muted">${esc(b.court)} · ${esc(club.surface)}</span>
          <span class="split-bar"><i style="width:${(b.shares.filter((s) => s.paid).length / b.shares.length) * 100}%"></i></span>
          <span class="tiny ${due.length ? "muted" : ""}">${due.length
            ? `${due.length} joueur${due.length > 1 ? "s" : ""} n'${due.length > 1 ? "ont" : "a"} pas encore payé`
            : "Note entièrement réglée"}</span>
        </span>
      </button>
    </div>`;
}

function viewBookings() {
  const up = upcomingBookings(), past = pastBookings();
  if (!up.length && !past.length) {
    return `<div class="empty">
      <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
      <div class="strong">Aucune réservation</div>
      <div class="tiny">Choisissez un club dans l'onglet Terrains.</div>
    </div>`;
  }
  return `
    ${up.length ? `<div class="section-title" style="margin-top:8px">À venir</div>${up.map(bookingCard).join("")}` : ""}
    ${past.length ? `<div class="section-title">Historique</div>${past.map(bookingCard).join("")}` : ""}
  `;
}

/* ---------- écran: détail réservation + partage de la note ---------- */

function viewBooking(id) {
  const b = state.bookings.find((x) => x.id === id);
  if (!b) return `<div class="empty">Réservation introuvable.</div>`;
  const club = CLUBS.find((c) => c.id === b.clubId);
  const paid = b.shares.filter((s) => s.paid).reduce((n, s) => n + s.amount, 0);

  return `
    <div class="hero">
      <div class="ball"></div>
      <h2>${esc(club.name)}</h2>
      <p>${esc(dateLong(new Date(b.date)))} · ${esc(b.hour)} · ${durLabel(b.duration)} · ${esc(b.court)}</p>
    </div>

    <div class="section-title">La note</div>
    <div class="card">
      <div class="row">
        <div class="grow">
          <div class="tiny muted">Encaissé</div>
          <div class="strong" style="font-size:20px">${eur(paid)} <span class="muted" style="font-size:14px">/ ${eur(b.total)}</span></div>
        </div>
        <span class="pill ${paid >= b.total ? "" : "clay"}">${paid >= b.total ? "Réglée" : "En attente"}</span>
      </div>
      <div class="split-bar"><i style="width:${(paid / b.total) * 100}%"></i></div>
    </div>

    <div class="list">
      ${b.shares.map((s) => `
        <div class="list-row">
          ${avatar(s.name)}
          <div class="grow"><div class="strong">${esc(s.name)}</div><div class="tiny muted">${s.paid ? "A payé" : "Doit " + eur(s.amount)}</div></div>
          <div class="strong tiny">${eur(s.amount)}</div>
          <button class="chk ${s.paid ? "on" : ""}" data-pay="${s.id}" aria-label="Marquer payé">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
          </button>
        </div>`).join("")}
    </div>

    <button class="btn" id="shareBtn">Partager la note</button>
    <div style="height:10px"></div>
    <button class="btn ghost" id="addPlayerBtn">Ajouter un joueur</button>
    <div style="height:10px"></div>
    <button class="btn danger" id="cancelBtn">Annuler la réservation</button>
  `;
}

function billText(b) {
  const club = CLUBS.find((c) => c.id === b.clubId);
  const lines = b.shares.map((s) => `- ${s.name} : ${eur(s.amount)}${s.paid ? " (payé)" : ""}`);
  return [
    `${club.name} · ${b.court}`,
    `${dateLong(new Date(b.date))} à ${b.hour} (${b.duration}h)`,
    `Total : ${eur(b.total)} pour ${b.shares.length} joueurs`,
    "",
    ...lines,
    "",
    "Partagé depuis Courtside",
  ].join("\n");
}

async function shareBill(b) {
  const text = billText(b);
  if (navigator.share) {
    try { await navigator.share({ title: "Note du terrain", text }); return; }
    catch { /* annulé par l'utilisateur */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Note copiée");
  } catch {
    openSheet(`<h2>Note du terrain</h2><pre class="tiny" style="white-space:pre-wrap">${esc(text)}</pre>
      <button class="btn ghost" data-close>Fermer</button>`);
  }
}

/* ---------- écran: amis ---------- */

function viewFriends() {
  const known = new Set(state.friends.map((f) => f.name));
  const suggestions = SUGGESTED.filter((s) => !known.has(s.name));
  return `
    <label class="field" style="margin-top:12px">
      <span>Ajouter un ami</span>
      <input id="friendInput" placeholder="Nom du joueur" autocomplete="off">
    </label>
    <button class="btn soft" id="addFriendBtn">Ajouter</button>

    <div class="section-title">Mes amis (${state.friends.length})</div>
    ${state.friends.length ? `<div class="list">${state.friends.map((f) => `
      <div class="list-row">
        ${avatar(f.name)}
        <div class="grow"><div class="strong">${esc(f.name)}</div><div class="tiny muted">${esc(f.level)}</div></div>
        <button class="icon-btn" data-unfriend="${f.id}" aria-label="Retirer">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>`).join("")}</div>`
    : `<p class="tiny muted">Aucun ami pour l'instant.</p>`}

    ${suggestions.length ? `
      <div class="section-title">Suggestions</div>
      <div class="list">${suggestions.map((s) => `
        <div class="list-row">
          ${avatar(s.name)}
          <div class="grow"><div class="strong">${esc(s.name)}</div><div class="tiny muted">${esc(s.level)}</div></div>
          <button class="btn soft sm" data-suggest="${esc(s.name)}">Ajouter</button>
        </div>`).join("")}</div>` : ""}
  `;
}

function addFriend(name, level) {
  name = name.trim();
  if (!name) return toast("Entrez un nom");
  if (state.friends.some((f) => f.name.toLowerCase() === name.toLowerCase())) return toast("Déjà dans vos amis");
  state.friends.push({ id: uid(), name, level: level || "Intermédiaire" });
  save();
  render();
  toast(name + " ajouté");
}

/* ---------- écran: profil ---------- */

function percentileRank() {
  const lvl = myLevel();
  const below = PLAYERS.filter((p) => p.level < lvl).length;
  return Math.round((below / PLAYERS.length) * 100);
}

function viewProfile() {
  const played = state.bookings.length;
  const wins = (state.results || []).filter((r) => r.won).length;
  const hours = state.bookings.reduce((n, b) => n + b.duration, 0);
  const owed = state.bookings.flatMap((b) => b.shares).filter((s) => !s.paid).reduce((n, s) => n + s.amount, 0);

  return `
    <div style="text-align:center;padding:14px 0 18px">
      ${avatar(state.profile.name, "lg")}
      <h2 style="margin-top:12px">${esc(state.profile.name)}</h2>
      <div class="tiny muted">${esc(levelName(myLevel()))} · ${esc(state.profile.hand)} · ${esc(state.profile.city)}</div>
    </div>

    ${levelCard()}
    <p class="tiny muted" style="margin:8px 2px 0">Plus fort que ${percentileRank()} pour cent des joueurs de ${esc(state.profile.city)}.</p>

    <div class="section-title">Statistiques</div>
    <div class="stats">
      <div class="stat"><b>${wins}</b><small>victoires</small></div>
      <div class="stat"><b>${durLabel(hours)}</b><small>de jeu</small></div>
      <div class="stat"><b>${played}</b><small>réservations</small></div>
    </div>

    ${owed > 0 ? `<div class="card" style="margin-top:12px">
      <div class="row"><div class="grow"><div class="strong">${eur(owed)} en attente</div>
      <div class="tiny muted">Vos amis n'ont pas encore réglé leur part.</div></div></div>
    </div>` : ""}

    <div class="section-title">Mes informations</div>
    <div class="card">
      <label class="field"><span>Nom</span><input id="pName" value="${esc(state.profile.name)}"></label>
      <label class="field"><span>Niveau de départ${(state.results || []).length ? " (verrouillé)" : ""}</span>
        <select id="pLevel" ${(state.results || []).length ? "disabled" : ""}>${LEVELS.map((l) => `<option ${l === state.profile.level ? "selected" : ""}>${l}</option>`).join("")}</select>
      </label>
      <label class="field"><span>Ville</span><input id="pCity" value="${esc(state.profile.city)}"></label>
      <label class="field" style="margin-bottom:0"><span>Main</span>
        <select id="pHand">${["Droitier", "Gaucher"].map((h) => `<option ${h === state.profile.hand ? "selected" : ""}>${h}</option>`).join("")}</select>
      </label>
    </div>
    <button class="btn" id="saveProfile">Enregistrer</button>
    <div style="height:10px"></div>
    <button class="btn danger" id="resetBtn">Réinitialiser les données</button>
  `;
}

/* ---------- délégation d'événements ---------- */

$("#view").addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);

  const club = t("[data-club]");
  if (club) return push({ screen: "club", clubId: club.dataset.club });

  const dateChip = t("[data-date]");
  if (dateChip && nav) { nav.date = dateChip.dataset.date; return render(); }

  const slot = t("[data-hour]");
  if (slot && !slot.disabled && nav) return openBookingSheet(nav.clubId, nav.date, slot.dataset.hour);

  const bk = t("[data-booking]");
  if (bk) return push({ screen: "booking", id: bk.dataset.booking, parent: null });

  const pay = t("[data-pay]");
  if (pay && nav && nav.screen === "booking") {
    const b = state.bookings.find((x) => x.id === nav.id);
    const s = b.shares.find((x) => x.id === pay.dataset.pay);
    s.paid = !s.paid;
    save(); render();
    return toast(s.paid ? s.name + " a payé" : "Paiement annulé");
  }

  if (t("#shareBtn")) return shareBill(state.bookings.find((x) => x.id === nav.id));
  if (t("#addPlayerBtn")) return openAddPlayerSheet(state.bookings.find((x) => x.id === nav.id));
  if (t("#cancelBtn")) {
    state.bookings = state.bookings.filter((x) => x.id !== nav.id);
    save(); go("bookings");
    return toast("Réservation annulée");
  }

  if (t("#addFriendBtn")) return addFriend($("#friendInput").value);
  const sug = t("[data-suggest]");
  if (sug) return addFriend(sug.dataset.suggest, SUGGESTED.find((s) => s.name === sug.dataset.suggest).level);
  const unf = t("[data-unfriend]");
  if (unf) {
    state.friends = state.friends.filter((f) => f.id !== unf.dataset.unfriend);
    save(); render();
    return toast("Ami retiré");
  }

  if (t("#saveProfile")) {
    const declared = $("#pLevel").value;
    state.profile = {
      ...state.profile,
      name: $("#pName").value.trim() || state.profile.name,
      level: declared,
      city: $("#pCity").value.trim() || state.profile.city,
      hand: $("#pHand").value,
    };
    if (!(state.results || []).length) state.profile.elo = eloFromNum(DECLARED_TO_LEVEL[declared] || 3);
    save(); render();
    return toast("Profil enregistré");
  }
  if (t("#resetBtn")) {
    state = defaultState();
    save(); go("home");
    return toast("Données réinitialisées");
  }
});

$("#view").addEventListener("keydown", (e) => {
  if (e.target.id === "friendInput" && e.key === "Enter") addFriend(e.target.value);
});

function openAddPlayerSheet(b) {
  const inBill = new Set(b.shares.map((s) => s.name));
  const available = state.friends.filter((f) => !inBill.has(f.name));
  openSheet(`
    <h2>Ajouter un joueur</h2>
    <p class="tiny muted">La note sera recalculée à parts égales.</p>
    ${available.length ? `<div class="list">${available.map((f) => `
      <div class="list-row">
        ${avatar(f.name)}
        <div class="grow"><div class="strong">${esc(f.name)}</div><div class="tiny muted">${esc(f.level)}</div></div>
        <button class="btn soft sm" data-pick="${f.id}">Ajouter</button>
      </div>`).join("")}</div>` : `<p class="tiny muted">Tous vos amis sont déjà sur cette note.</p>`}
    <button class="btn ghost" data-close>Fermer</button>
  `, (root) => {
    root.querySelectorAll("[data-pick]").forEach((btn) => btn.addEventListener("click", () => {
      const f = state.friends.find((x) => x.id === btn.dataset.pick);
      b.shares.push({ id: f.id, name: f.name, amount: 0, paid: false });
      const parts = splitEqually(b.total, b.shares.length);
      b.shares.forEach((s, i) => { s.amount = parts[i]; });
      save(); closeSheet(); render();
      toast(f.name + " ajouté à la note");
    }));
  });
}

render();

/* ==================== NIVEAU, RESULTATS, MATCHS OUVERTS ==================== */

/* Communaute de joueurs. Le niveau va de 1.00 (grand debutant) a 7.00 (competition). */
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

const DECLARED_TO_LEVEL = { "Débutant": 1.75, "Intermédiaire": 3.00, "Confirmé": 4.50, "Compétition": 6.00 };

const eloFromNum = (n) => Math.round(1000 + (n - 1) * 200);
const numFromElo = (e) => Math.min(7, Math.max(1, 1 + (e - 1000) / 200));
const fmtLevel = (n) => n.toFixed(2);
const myElo = () => (typeof state.profile.elo === "number" ? state.profile.elo : eloFromNum(DECLARED_TO_LEVEL[state.profile.level] || 3));
const myLevel = () => numFromElo(myElo());
const results = () => state.results || (state.results = []);
const joined = () => state.joinedMatches || (state.joinedMatches = []);
const isProvisional = () => results().length < 5;

function levelName(n) {
  if (n < 2) return "Débutant";
  if (n < 3.5) return "Intermédiaire";
  if (n < 5) return "Confirmé";
  return "Compétition";
}

/* Elo adapte au tennis: le resultat compte pour 70 pourcent, l'ecart de jeux pour 30 pourcent. */
function computeElo(elo, opponentElo, sets) {
  const gamesFor = sets.reduce((n, s) => n + s[0], 0);
  const gamesAgainst = sets.reduce((n, s) => n + s[1], 0);
  const setsWon = sets.filter((s) => s[0] > s[1]).length;
  const won = setsWon > sets.length - setsWon;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - elo) / 400));
  const ratio = gamesFor + gamesAgainst ? gamesFor / (gamesFor + gamesAgainst) : 0.5;
  const perf = 0.7 * (won ? 1 : 0) + 0.3 * ratio;
  const k = isProvisional() ? 60 : 24;
  const next = Math.min(2200, Math.max(1000, elo + k * (perf - expected)));
  return { won, next: Math.round(next), delta: Math.round(next) - elo, gamesFor, gamesAgainst };
}

function saveResult({ opponentName, opponentLevel, sets, clubId, date, matchId }) {
  const before = myElo();
  const r = computeElo(before, eloFromNum(opponentLevel), sets);
  results().unshift({
    id: uid(), date: date || iso(new Date()), opponentName, opponentLevel,
    sets, won: r.won, eloBefore: before, eloAfter: r.next, clubId: clubId || null,
  });
  state.profile.elo = r.next;
  if (matchId) state.joinedMatches = joined().filter((m) => m.id !== matchId);
  save();
  return r;
}

/* ---------- matchs ouverts (generes de facon deterministe) ---------- */

function openMatchesForDay(dateStr) {
  const count = 2 + (hash("n" + dateStr) % 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    const seed = dateStr + ":" + i;
    const club = CLUBS[hash("c" + seed) % CLUBS.length];
    const hour = HOURS[8 + (hash("h" + seed) % 6)];
    const format = hash("f" + seed) % 3 === 0 ? "double" : "simple";
    const capacity = format === "double" ? 4 : 2;
    const players = [PLAYERS[hash("p" + seed) % PLAYERS.length]];
    const extra = hash("e" + seed) % capacity;
    for (let j = 0; j < extra; j++) {
      const p = PLAYERS[hash("q" + seed + j) % PLAYERS.length];
      if (!players.some((x) => x.name === p.name)) players.push(p);
    }
    if (players.length >= capacity) players.length = capacity - 1;
    const level = Math.round((players.reduce((a, p) => a + p.level, 0) / players.length) * 4) / 4;
    out.push({
      id: "om-" + dateStr + "-" + i, clubId: club.id, date: dateStr, hour,
      duration: 1.5, format, capacity, players, level, price: club.price * 1.5,
    });
  }
  return out;
}

function openMatches() {
  const mine = new Set(joined().map((m) => m.id));
  return nextDays(7)
    .flatMap((d) => openMatchesForDay(iso(d)))
    .filter((m) => !isPast(m.date, m.hour) && !mine.has(m.id))
    .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));
}

const matchesMyLevel = (m) => Math.abs(m.level - myLevel()) <= 0.75;

function joinMatch(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  const names = [state.profile.name, ...m.players.map((p) => p.name)];
  const total = club.price * m.duration;
  const parts = splitEqually(total, names.length);
  state.bookings.push({
    id: uid(), clubId: m.clubId, date: m.date, hour: m.hour, duration: m.duration,
    court: "Terrain " + (1 + (hash(m.id) % club.courts)),
    total, createdAt: Date.now(), openMatchId: m.id,
    shares: names.map((n, i) => ({ id: i === 0 ? "me" : "om" + i, name: n, amount: parts[i], paid: i === 0 })),
  });
  joined().push({ ...m, players: [...m.players] });
  save();
  render();
  toast("Match rejoint, la note est partagée");
}

/* ---------- ecran: matchs ---------- */

let playFilter = "level";

function levelCard() {
  const lvl = myLevel();
  const within = (lvl - Math.floor(lvl)) * 100;
  const wins = results().filter((r) => r.won).length;
  return `
    <div class="level-card">
      <div class="ball"></div>
      <div class="row" style="align-items:flex-end">
        <div class="grow">
          <div class="level-meta">Niveau ${esc(levelName(lvl))}</div>
          <div class="level-num">${fmtLevel(lvl)}</div>
        </div>
        <div style="text-align:right">
          <div class="level-meta">${results().length} match${results().length > 1 ? "s" : ""}</div>
          <div class="level-meta">${wins} v · ${results().length - wins} d</div>
        </div>
      </div>
      <div class="level-bar"><i style="width:${within}%"></i></div>
      <div class="level-meta" style="margin-top:6px">${isProvisional()
        ? `Niveau provisoire, encore ${5 - results().length} match${5 - results().length > 1 ? "s" : ""} pour le fiabiliser.`
        : `Prochain palier à ${fmtLevel(Math.floor(lvl) + 1)}.`}</div>
    </div>`;
}

function matchCard(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  const free = m.capacity - m.players.length;
  const fit = matchesMyLevel(m);
  return `
    <div class="card">
      <div class="match-head">
        <span class="pill">${esc(dayShort(new Date(m.date)))} ${new Date(m.date).getDate()}/${new Date(m.date).getMonth() + 1}</span>
        <span class="pill grey">${esc(m.hour)} · ${durLabel(m.duration)}</span>
        <span class="pill ${fit ? "" : "clay"}">Niveau ${fmtLevel(m.level)}</span>
      </div>
      <div class="strong truncate">${esc(club.name)}</div>
      <div class="tiny muted">${esc(club.area)} · ${m.format === "double" ? "Double" : "Simple"} · ${eur(m.price / m.capacity)} par joueur</div>
      <div class="row" style="margin-top:12px">
        <span class="stack">
          ${m.players.map((p) => avatar(p.name)).join("")}
          ${Array.from({ length: free }, () => `<span class="slot-open">+</span>`).join("")}
        </span>
        <span class="grow tiny muted">${free} place${free > 1 ? "s" : ""} libre${free > 1 ? "s" : ""}</span>
        <button class="btn soft sm" data-join="${m.id}">Rejoindre</button>
      </div>
    </div>`;
}

function joinedCard(m) {
  const club = CLUBS.find((c) => c.id === m.clubId);
  const played = isPast(m.date, m.hour);
  return `
    <div class="card">
      <div class="match-head">
        <span class="pill">${esc(dayShort(new Date(m.date)))} ${new Date(m.date).getDate()}/${new Date(m.date).getMonth() + 1}</span>
        <span class="pill grey">${esc(m.hour)}</span>
        <span class="pill blue">Niveau ${fmtLevel(m.level)}</span>
      </div>
      <div class="strong truncate">${esc(club.name)}</div>
      <div class="tiny muted">Avec ${m.players.map((p) => esc(p.name)).join(", ")}</div>
      <div style="height:10px"></div>
      ${played
        ? `<button class="btn soft sm" data-score="${m.id}">Enregistrer le score</button>`
        : `<button class="btn ghost sm" data-leave="${m.id}">Se désinscrire</button>`}
    </div>`;
}

function resultRow(r) {
  const d = (r.eloAfter - r.eloBefore) / 200;
  const tone = Math.abs(d) < 0.005 ? "" : d > 0 ? "up" : "down";
  const sign = Math.abs(d) < 0.005 ? "" : d > 0 ? "+" : "";
  return `
    <div class="result-row">
      ${avatar(r.opponentName)}
      <div class="grow">
        <div class="strong truncate">${esc(r.opponentName)}</div>
        <div class="tiny muted">${esc(new Date(r.date).toLocaleDateString("fr-BE", { day: "numeric", month: "short" }))} · niveau ${fmtLevel(r.opponentLevel)}</div>
      </div>
      <div style="text-align:right">
        <div class="score">${r.sets.map((s) => s[0] + "-" + s[1]).join(" ")}</div>
        <div class="delta ${tone}">${sign}${Math.abs(d) < 0.005 ? "0.00" : d.toFixed(2)}</div>
      </div>
    </div>`;
}

function viewPlay() {
  const all = openMatches();
  const list = playFilter === "level" ? all.filter(matchesMyLevel) : all;
  const mine = joined().sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));

  return `
    ${levelCard()}

    ${mine.length ? `<div class="section-title">Mes matchs</div>${mine.map(joinedCard).join("")}` : ""}

    <div class="section-title">Matchs ouverts</div>
    <div class="chips">
      <button class="chip ${playFilter === "level" ? "on" : ""}" data-filter="level">À mon niveau</button>
      <button class="chip ${playFilter === "all" ? "on" : ""}" data-filter="all">Tous les niveaux</button>
    </div>
    ${list.length ? list.map(matchCard).join("") : `<div class="empty">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M4.5 6.5c4 3 4 11 0 11M19.5 6.5c-4 3-4 11 0 11"/></svg>
      <div class="strong">Aucun match à ton niveau</div>
      <div class="tiny">Essaie "Tous les niveaux" ou reviens demain.</div>
    </div>`}

    <div class="section-title">Mes résultats</div>
    <button class="btn ghost" id="addResultBtn">Ajouter un résultat</button>
    <div style="height:12px"></div>
    ${results().length
      ? `<div class="list">${results().slice(0, 12).map(resultRow).join("")}</div>`
      : `<p class="tiny muted">Aucun match enregistré. Ton niveau reste une estimation tant que tu n'as pas joué.</p>`}
  `;
}

/* ---------- feuille: saisie du score ---------- */

function openResultSheet(prefill = {}) {
  const opts = (sel) => Array.from({ length: 8 }, (_, i) => `<option ${i === sel ? "selected" : ""}>${i}</option>`).join("");
  const levelOpts = (sel) => {
    let out = "";
    for (let v = 1; v <= 7.0001; v += 0.5) {
      out += `<option value="${v.toFixed(2)}" ${Math.abs(v - sel) < 0.26 ? "selected" : ""}>${v.toFixed(2)} · ${levelName(v)}</option>`;
    }
    return out;
  };
  const known = [...new Set([...(prefill.candidates || []), ...state.friends.map((f) => f.name)])];

  openSheet(`
    <h2>Score du match</h2>
    <p class="tiny muted" style="margin:2px 0 14px">Le niveau de ton adversaire pèse sur le calcul. Battre plus fort que soi rapporte plus.</p>

    <label class="field"><span>Adversaire</span>
      <input id="rOpp" list="rOppList" value="${esc(prefill.opponentName || "")}" placeholder="Nom du joueur" autocomplete="off">
    </label>
    <datalist id="rOppList">${known.map((n) => `<option value="${esc(n)}"></option>`).join("")}</datalist>

    <label class="field"><span>Niveau de l'adversaire</span>
      <select id="rLevel">${levelOpts(prefill.opponentLevel || Math.round(myLevel() * 2) / 2)}</select>
    </label>

    <div class="section-title" style="margin-top:6px">Sets</div>
    ${[0, 1, 2].map((i) => `
      <div class="set-row">
        <select data-set="${i}" data-side="0">${opts(i < 2 ? 6 : 0)}</select>
        <span class="set-sep">/</span>
        <select data-set="${i}" data-side="1">${opts(i < 2 ? 4 : 0)}</select>
      </div>`).join("")}
    <p class="tiny muted">Laisse le troisième set à 0 / 0 si le match s'est joué en deux sets.</p>

    <div style="height:14px"></div>
    <button class="btn" id="saveResultBtn">Enregistrer le résultat</button>
  `, (root) => {
    root.querySelector("#saveResultBtn").addEventListener("click", () => {
      const name = root.querySelector("#rOpp").value.trim();
      if (!name) return toast("Indiquez l'adversaire");
      const sets = [0, 1, 2].map((i) => [
        parseInt(root.querySelector(`[data-set="${i}"][data-side="0"]`).value, 10),
        parseInt(root.querySelector(`[data-set="${i}"][data-side="1"]`).value, 10),
      ]).filter((s) => s[0] + s[1] > 0);
      if (!sets.length) return toast("Entrez au moins un set");
      if (sets.some((s) => s[0] === s[1])) return toast("Un set ne peut pas être à égalité");
      const won = sets.filter((s) => s[0] > s[1]).length;
      if (won === sets.length - won) return toast("Le vainqueur doit être départagé");

      const r = saveResult({
        opponentName: name,
        opponentLevel: parseFloat(root.querySelector("#rLevel").value),
        sets,
        clubId: prefill.clubId,
        date: prefill.date,
        matchId: prefill.matchId,
      });
      closeSheet();
      render();
      const d = (r.delta / 200).toFixed(2);
      toast(`${r.won ? "Victoire" : "Défaite"} enregistrée, niveau ${r.delta >= 0 ? "+" : ""}${d}`);
    });
  });
}

/* ---------- interactions de l'onglet Matchs ---------- */

$("#view").addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);

  const filter = t("[data-filter]");
  if (filter) { playFilter = filter.dataset.filter; return render(); }

  const join = t("[data-join]");
  if (join) {
    const m = openMatches().find((x) => x.id === join.dataset.join);
    if (m) joinMatch(m);
    return;
  }

  const leave = t("[data-leave]");
  if (leave) {
    state.joinedMatches = joined().filter((m) => m.id !== leave.dataset.leave);
    state.bookings = state.bookings.filter((b) => b.openMatchId !== leave.dataset.leave);
    save(); render();
    return toast("Désinscrit du match");
  }

  const score = t("[data-score]");
  if (score) {
    const m = joined().find((x) => x.id === score.dataset.score);
    return openResultSheet({
      opponentName: m.players[0].name,
      opponentLevel: m.players[0].level,
      candidates: m.players.map((p) => p.name),
      clubId: m.clubId, date: m.date, matchId: m.id,
    });
  }

  if (t("#addResultBtn")) return openResultSheet({});
});
