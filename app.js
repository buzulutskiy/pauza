/* «Пауза» — тренажёр промежутка между импульсом и действием.
   Данные только на устройстве (localStorage), сеть не используется. */

const KEY = "pauza.v1";
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ───────────────────────── импульсы ───────────────────────── */

const BASE_KINDS = [
  { id: "food",  e: "🍔", t: "Тянет есть" },
  { id: "phone", e: "📱", t: "Тянет залипнуть" },
  { id: "self",  e: "🌙", t: "Личное" },
  { id: "sharp", e: "😡", t: "Ответить резко" },
  { id: "buy",   e: "🛒", t: "Срочно купить" },
  { id: "subst", e: "🍷", t: "Выпить / курить" }
];

const STATES = [
  { id: "tired",  t: "Устал" },
  { id: "bored",  t: "Скучно" },
  { id: "anx",    t: "Тревожно" },
  { id: "angry",  t: "Злюсь" },
  { id: "lonely", t: "Одиноко" },
  { id: "hungry", t: "Правда голоден" },
  { id: "tense",  t: "Напряжение в теле" },
  { id: "habit",  t: "Просто привычка" },
  { id: "idle",   t: "Нечем заняться" }
];

/* занятия на 10 минут: общий пул + добавки под конкретный импульс */
const ACTS_COMMON = [
  { id: "water",  t: "Стакан воды" },
  { id: "walk",   t: "Пройтись 10 минут" },
  { id: "squat",  t: "10 приседаний" },
  { id: "cold",   t: "Холодная вода на лицо" },
  { id: "breath", t: "Дыхание 4–7–8" },
  { id: "music",  t: "Включить музыку" },
  { id: "write",  t: "Записать, что чувствую" },
  { id: "out",    t: "Выйти из комнаты" }
];
const ACTS_BY_KIND = {
  food:  [{ id: "teeth", t: "Почистить зубы" }, { id: "tea", t: "Заварить чай" }, { id: "kitch", t: "Уйти с кухни" }],
  phone: [{ id: "away", t: "Телефон в другую комнату" }, { id: "grey", t: "Сделать экран серым" }],
  self:  [{ id: "up", t: "Встать и сменить комнату" }, { id: "dress", t: "Одеться и выйти на улицу" }, { id: "load", t: "Резкая нагрузка: планка, отжимания" }],
  sharp: [{ id: "draft", t: "Написать в черновик и не отправлять" }, { id: "delay", t: "Отложить ответ до утра" }],
  buy:   [{ id: "cart", t: "Положить в корзину и закрыть" }, { id: "24", t: "Правило 24 часов" }],
  subst: [{ id: "teeth", t: "Почистить зубы" }, { id: "tea", t: "Заварить чай" }]
};

/* ───────────────────────── навыки ───────────────────────── */

const SKILLS = [
  { id: "mind",  e: "🧘", t: "Осознанность",      d: "Растёт, когда ты замечаешь импульс и жмёшь кнопку" },
  { id: "hold",  e: "⏳", t: "Терпение импульса",  d: "Растёт за минуты, которые ты переждал" },
  { id: "know",  e: "🧠", t: "Понимание себя",     d: "Растёт, когда ты называешь своё состояние" },
  { id: "env",   e: "💪", t: "Контроль среды",     d: "Растёт, когда ты выбираешь занятие вместо импульса" }
];
const LEVELS = [0, 60, 160, 320, 560, 900, 1360, 1960, 2720, 3660, 4800];

function levelOf(xp) {
  let l = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) l = i;
  const cur = LEVELS[l], next = LEVELS[l + 1];
  return { lv: l + 1, cur, next, pct: next ? clamp((xp - cur) / (next - cur), 0, 1) : 1, max: !next };
}

/* ───────────────────────── награды ───────────────────────── */

const MEDALS = [
  { id: "first",   e: "🫧", t: "Первая пауза",     h: "Нажать кнопку хотя бы раз",              f: s => s.total >= 1 },
  { id: "p5",      e: "🌊", t: "Пять волн",        h: "5 пауз",                                  f: s => s.total >= 5 },
  { id: "p20",     e: "🪸", t: "Двадцать волн",    h: "20 пауз",                                 f: s => s.total >= 20 },
  { id: "p50",     e: "🐋", t: "Полсотни",         h: "50 пауз",                                 f: s => s.total >= 50 },
  { id: "p100",    e: "🏔", t: "Сотня",            h: "100 пауз",                                f: s => s.total >= 100 },
  { id: "full1",   e: "⏱", t: "Целая волна",       h: "Досидеть до конца хотя бы раз",           f: s => s.full >= 1 },
  { id: "full10",  e: "🎯", t: "Десять целиком",   h: "10 волн до конца",                        f: s => s.full >= 10 },
  { id: "hour",    e: "🕰", t: "Час выдержки",     h: "Суммарно 60 минут переждано",             f: s => s.minutes >= 60 },
  { id: "night",   e: "🌙", t: "Ночная волна",     h: "Пауза между 23:00 и 05:00",               f: s => s.night >= 1 },
  { id: "named5",  e: "🔎", t: "Названо словами",  h: "5 раз отметить своё состояние",           f: s => s.named >= 5 },
  { id: "acts10",  e: "🔁", t: "Десять замен",     h: "10 раз выбрать занятие вместо импульса",  f: s => s.acted >= 10 },
  { id: "map",     e: "🗺", t: "Карта открыта",    h: "5 отметок — появляются закономерности",   f: s => s.total >= 5 },
  { id: "st3",     e: "🔥", t: "Серия 3 дня",      h: "3 дня подряд с паузой",                   f: s => s.best >= 3 },
  { id: "st7",     e: "⚡️", t: "Серия 7 дней",     h: "7 дней подряд",                           f: s => s.best >= 7 },
  { id: "st30",    e: "👑", t: "Серия 30 дней",    h: "30 дней подряд",                          f: s => s.best >= 30 },
  { id: "allk",    e: "🧭", t: "Знаю свои крючки", h: "Паузы по трём разным импульсам",          f: s => s.kindsUsed >= 3 },
  { id: "cont1",   e: "🌀", t: "Вторая волна",     h: "Продлить паузу, когда не отпустило",      f: s => s.conts >= 1 },
  { id: "cont5",   e: "🧱", t: "Не сдвинулся",     h: "5 продлений",                             f: s => s.conts >= 5 },
  { id: "chain3",  e: "🪨", t: "Три волны подряд", h: "Один заход из трёх волн",                 f: s => s.chain >= 3 }
];

/* ───────────────────────── хранилище ───────────────────────── */

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.v === 1) return d;
  } catch (e) {}
  return { v: 1, ep: [], kinds: [], medals: {}, live: null, s: { dur: 300, vib: true, theme: "auto" } };
}
let DB = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };

const allKinds = () => BASE_KINDS.concat(DB.kinds.filter(k => !k.del));
const kindOf = id => allKinds().find(k => k.id === id) || { id, e: "◍", t: "Импульс" };

/* ───────────────────────── синхронизация через GitHub Gist ─────────────────────────
   Секретный гист в аккаунте пользователя. Токен и данные никуда больше не уходят:
   своего сервера у приложения нет. По умолчанию синхронизация выключена. */

const SYNC_FILE = "pauza-data.json";
const SYNC_TAG = "pauza-sync";
const SYNC_DESC = "Пауза — личные записи (секретный гист) · " + SYNC_TAG;
const CFG_KEY = "pauza.sync";

let cfg = { token: "", gistId: "", last: 0 };
try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_KEY)) || {}); } catch (e) {}
const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} };
const connected = () => !!(cfg.token && cfg.gistId);

let syncState = "idle", syncing = false, dirtyT = 0;
function setSync(s) { syncState = s; if (view === "set") paintSyncStatus(); }
function markDirty() {
  if (!connected()) return;
  setSync("dirty");
  clearTimeout(dirtyT);
  dirtyT = setTimeout(() => syncNow(false), 1500);
}

function gh(path, opts = {}) {
  return fetch("https://api.github.com" + path, Object.assign({
    headers: {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  }, opts));
}

const exportData = () => ({ version: 1, ep: DB.ep, kinds: DB.kinds, medals: DB.medals });

function mergeAll(remote) {
  /* эпизоды и свои импульсы — по id, побеждает более свежая правка */
  const byId = new Map();
  for (const x of remote.ep || []) byId.set(x.id, x);
  for (const x of DB.ep) {
    const ex = byId.get(x.id);
    if (!ex || (x.upd || x.ts || 0) >= (ex.upd || ex.ts || 0)) byId.set(x.id, x);
  }
  DB.ep = [...byId.values()].sort((a, b) => a.ts - b.ts);

  const kById = new Map();
  for (const x of remote.kinds || []) kById.set(x.id, x);
  for (const x of DB.kinds) {
    const ex = kById.get(x.id);
    if (!ex || (x.upd || 0) >= (ex.upd || 0)) kById.set(x.id, x);
  }
  DB.kinds = [...kById.values()];

  /* медаль засчитывается по самой ранней дате получения */
  for (const [id, ts] of Object.entries(remote.medals || {})) {
    if (!DB.medals[id] || ts < DB.medals[id]) DB.medals[id] = ts;
  }
  save();
}

async function connectSync(token) {
  cfg.token = token.trim(); saveCfg();
  setSync("syncing");
  try {
    const r = await gh("/gists?per_page=100");
    if (r.status === 401) throw new Error("Токен не подошёл. Проверь, что скопирован целиком и с доступом gist.");
    if (!r.ok) throw new Error("GitHub ответил ошибкой " + r.status);
    const list = await r.json();
    const found = list.find(g => (g.files && g.files[SYNC_FILE]) || (g.description || "").includes(SYNC_TAG));
    if (found) {
      cfg.gistId = found.id; saveCfg();
      await syncNow(true);
      toast("Нашёл прежние записи");
    } else {
      const cr = await gh("/gists", {
        method: "POST",
        body: JSON.stringify({ description: SYNC_DESC, public: false,
          files: { [SYNC_FILE]: { content: JSON.stringify(exportData()) } } })
      });
      if (!cr.ok) throw new Error("Не удалось создать гист (" + cr.status + ")");
      cfg.gistId = (await cr.json()).id; cfg.last = Date.now(); saveCfg();
      setSync("idle"); toast("Хранилище создано");
    }
  } catch (e) {
    cfg.token = ""; cfg.gistId = ""; saveCfg();
    setSync("error");
    alert(e.message || "Не получилось подключиться");
  }
  renderSet();
}

async function syncNow(manual) {
  if (!connected() || syncing) return;
  if (!navigator.onLine) { setSync("dirty"); if (manual) toast("Нет сети — сохранено на устройстве"); return; }
  syncing = true; setSync("syncing");
  try {
    const r = await gh("/gists/" + cfg.gistId);
    if (r.status === 404) throw new Error("Гист не найден — отключи и подключи заново.");
    if (r.status === 401) throw new Error("Токен больше не действует.");
    if (!r.ok) throw new Error("GitHub " + r.status);
    const g = await r.json();
    let remote = {};
    const f = g.files && g.files[SYNC_FILE];
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try { remote = JSON.parse(txt) || {}; } catch (e) {}
    }
    const remoteStr = JSON.stringify({ version: 1, ep: remote.ep || [], kinds: remote.kinds || [], medals: remote.medals || {} });
    mergeAll(remote);
    const localStr = JSON.stringify(exportData());
    if (remoteStr !== localStr) {
      const pr = await gh("/gists/" + cfg.gistId, {
        method: "PATCH",
        body: JSON.stringify({ files: { [SYNC_FILE]: { content: localStr } } })
      });
      if (!pr.ok) throw new Error("Не удалось отправить (" + pr.status + ")");
    }
    cfg.last = Date.now(); saveCfg();
    setSync("idle");
    if (view === "home") renderHome();
    if (manual) toast("Синхронизировано");
  } catch (e) {
    setSync("error");
    if (manual) toast(e.message || "Ошибка синхронизации");
  } finally { syncing = false; }
}

/* ───────────────────────── подсчёты ───────────────────────── */

/* с ведущими нулями: ключи дней сортируются как текст */
const p2 = n => String(n).padStart(2, "0");
const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); };

function streaks() {
  const days = [...new Set(DB.ep.map(e => dayKey(e.ts)))].sort();
  if (!days.length) return { now: 0, best: 0 };
  const toN = s => { const [y, m, d] = s.split("-").map(Number); return Math.round(new Date(y, m - 1, d).getTime() / 864e5); };
  let best = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = toN(days[i]) - toN(days[i - 1]) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  const today = Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() / 864e5);
  const last = toN(days[days.length - 1]);
  let now = last === today || last === today - 1 ? 1 : 0;
  if (now) for (let i = days.length - 1; i > 0; i--) {
    if (toN(days[i]) - toN(days[i - 1]) === 1) now++; else break;
  }
  return { now, best: Math.max(best, now) };
}

/* цепочка волн одного захода: продлённая волна ссылается на предыдущую через cont */
function chainOf(ep) {
  const byId = {}; DB.ep.forEach(e => byId[e.id] = e);
  const list = [ep];
  let cur = ep;
  while (cur.cont && byId[cur.cont]) { cur = byId[cur.cont]; list.unshift(cur); }
  return list;
}
function longestChain() {
  const len = {};
  let best = DB.ep.length ? 1 : 0;
  for (const e of DB.ep) {
    len[e.id] = (e.cont && len[e.cont] ? len[e.cont] : 0) + 1;
    if (len[e.id] > best) best = len[e.id];
  }
  return best;
}

function stats() {
  const ep = DB.ep, st = streaks();
  const sec = ep.reduce((a, e) => a + (e.waited || 0), 0);
  return {
    total: ep.length,
    full: ep.filter(e => e.outcome !== "stopped" && e.waited >= e.planned - 5).length,
    minutes: Math.round(sec / 60),
    seconds: sec,
    night: ep.filter(e => { const h = new Date(e.ts).getHours(); return h >= 23 || h < 5; }).length,
    named: ep.filter(e => (e.states || []).length).length,
    acted: ep.filter(e => e.act).length,
    waited: ep.filter(e => e.outcome === "waited").length,
    kindsUsed: new Set(ep.map(e => e.kind)).size,
    conts: ep.filter(e => e.cont).length,
    chain: longestChain(),
    now: st.now, best: st.best
  };
}

function skillXP() {
  const x = { mind: 0, hold: 0, know: 0, env: 0 };
  for (const e of DB.ep) {
    x.mind += 10 + (e.waited >= e.planned - 5 ? 15 : 0);
    x.hold += Math.round((e.waited || 0) / 60) * 4;
    x.know += (e.states || []).length * 8;
    if (e.act) x.env += 12;
  }
  return x;
}

/* ───────────────────────── экраны ───────────────────────── */

let view = "home";
function go(v) {
  view = v;
  document.querySelectorAll(".view").forEach(n => n.classList.toggle("on", n.id === "v-" + v));
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.go === v));
  $("#scroll").scrollTop = 0;
  if (v === "map") renderMap();
  if (v === "rew") renderRew();
  if (v === "set") renderSet();
  if (v === "home") renderHome();
}
$("#nav").addEventListener("click", e => { const b = e.target.closest("button"); if (b) go(b.dataset.go); });
$("#setBtn").addEventListener("click", () => go(view === "set" ? "home" : "set"));

let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2200);
}
const vib = p => { if (DB.s.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

/* тема */
function applyTheme() {
  const t = DB.s.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}
$("#themeBtn").addEventListener("click", () => {
  const order = ["auto", "light", "dark"];
  DB.s.theme = order[(order.indexOf(DB.s.theme) + 1) % 3];
  applyTheme(); save();
  toast({ auto: "Тема: как в системе", light: "Тема: светлая", dark: "Тема: тёмная" }[DB.s.theme]);
});
applyTheme();

/* ───────────────────────── главный ───────────────────────── */

function renderHome() {
  const s = stats();
  $("#homeStats").innerHTML = `
    <div class="stat"><div class="n">${s.total}</div><div class="t">пауз сделано</div></div>
    <div class="stat"><div class="n">${s.minutes}</div><div class="t">минут переждано</div></div>
    <div class="stat"><div class="n">${s.now}</div><div class="t">${s.now === 1 ? "день серии" : "дней серии"}</div></div>`;
  const foot = $("#heroFoot");
  if (!s.total) foot.innerHTML = "Победа — не отсутствие желания.<br>Победа — появление выбора.";
  else {
    const last = DB.ep[DB.ep.length - 1];
    const k = kindOf(last.kind);
    const ago = Math.round((Date.now() - last.ts) / 6e4);
    const when = ago < 60 ? ago + " мин назад" : ago < 1440 ? Math.round(ago / 60) + " ч назад" : Math.round(ago / 1440) + " дн назад";
    foot.innerHTML = `Последняя пауза: ${k.e} ${esc(k.t)}, ${when}.<br>Победа — не отсутствие желания, а появление выбора.`;
  }
}

/* ───────────────────────── шторка выбора ───────────────────────── */

const sheet = $("#sheetWrap");
function openSheet() {
  renderKinds();
  $("#durHint").textContent = `Волна — ${DB.s.dur / 60} мин. Не отпустит — продлишь прямо на ходу, ничего выбирать заранее не нужно.`;
  sheet.classList.add("on"); vib(8);
}
function closeSheet() { sheet.classList.remove("on"); }
$("#hitBtn").addEventListener("click", openSheet);
sheet.addEventListener("click", e => { if (e.target.dataset.close !== undefined) closeSheet(); });

function renderKinds() {
  const box = $("#kinds"); box.innerHTML = "";
  for (const k of allKinds()) {
    const b = el("button", "kind", `<span class="e">${k.e}</span><span>${esc(k.t)}</span>` +
      (k.own ? `<span class="x" data-del="${k.id}">✕</span>` : ""));
    b.addEventListener("click", ev => {
      if (ev.target.dataset.del) {
        const k2 = DB.kinds.find(x => x.id === ev.target.dataset.del);
        if (k2) { k2.del = 1; k2.upd = Date.now(); }
        save(); markDirty(); renderKinds(); return;
      }
      closeSheet(); startWave(k.id);
    });
    box.appendChild(b);
  }
  const add = el("button", "kind add", "＋ свой импульс");
  add.addEventListener("click", () => {
    const t = prompt("Как назовёшь? (видно только на этом устройстве)");
    if (t && t.trim()) {
      DB.kinds.push({ id: uid(), e: "◍", t: t.trim().slice(0, 24), own: 1, upd: Date.now() });
      save(); markDirty(); renderKinds();
    }
  });
  box.appendChild(add);
}

/* ───────────────────────── форма волны ───────────────────────── */

function raw(t) { const p = .22, a = 1.9; if (t <= 0) return 0; const r = t / p; return Math.pow(r, a) * Math.exp(a * (1 - r)); }
let T0 = 0;
for (let t = 0; t < 1; t += .001) { if (raw(t) >= .55) { T0 = t; break; } }
/* u ∈ 0..1 — доля пройденной волны; желание стартует высоким и не падает в ноль */
const amp = u => .12 + .88 * clamp(raw(T0 + u * (1 - T0)), 0, 1);

const X0 = 18, X1 = 326, Y0 = 132, H = 112;
const px = u => X0 + u * (X1 - X0);
const py = u => Y0 - amp(u) * H;

function pathTo(u, close) {
  let d = "";
  const n = Math.max(2, Math.round(u * 120));
  for (let i = 0; i <= n; i++) {
    const t = u * i / n;
    d += (i ? "L" : "M") + px(t).toFixed(1) + " " + py(t).toFixed(1);
  }
  if (close) d += `L${px(u).toFixed(1)} ${Y0}L${X0} ${Y0}Z`;
  return d;
}
$("#wGhost").setAttribute("d", pathTo(1, false));

/* ───────────────────────── сессия волны ───────────────────────── */

let live = null, raf = 0, lock = null, stage = "", peaked = false;

function startWave(kindId, resume, opts) {
  live = resume || {
    id: uid(), kind: kindId, ts: Date.now(), states: [], act: null,
    planned: (opts && opts.dur) || DB.s.dur,
    cont: (opts && opts.cont) || null
  };
  DB.live = live; save();
  stage = ""; peaked = false;
  const k = kindOf(live.kind);
  $("#wKind").innerHTML = `<span class="e">${k.e}</span><span>${esc(k.t)}</span>`;
  $("#wEndLab").textContent = "через " + Math.round(live.planned / 60) + " мин";
  $("#wave").classList.add("on");
  renderBot();
  tick();
  raf = requestAnimationFrame(loop);
  if (navigator.wakeLock) navigator.wakeLock.request("screen").then(l => lock = l).catch(() => {});
  vib(14);
}

function elapsed() { return (Date.now() - live.ts) / 1000; }

/* Доля пройденной волны. Если волну продлили, точка не откатывается назад:
   от места продления остаток растягивается до нового конца. */
function progress() {
  const e = elapsed(), a = live.anchor;
  if (a && live.planned - a.t > 1) return clamp(a.u + (e - a.t) / (live.planned - a.t) * (1 - a.u), 0, 1);
  return clamp(e / live.planned, 0, 1);
}

function loop() {
  if (!live) return;
  tick();
  raf = requestAnimationFrame(loop);
}

const PHASES = [
  [.10, "Желание сейчас на подъёме. <b>Не борись с ним</b> — от борьбы оно только громче. Просто смотри на волну."],
  [.24, "Это пик. Здесь кажется, что не выдержишь и что это навсегда. <b>Пик — самая короткая часть.</b>"],
  [.42, "Верхушка пройдена. Мозг ещё предлагает, но <b>тело уже начало успокаиваться</b>."],
  [.62, "Волна пошла вниз. Заметил? <b>Для этого ничего не пришлось делать.</b>"],
  [.85, "Стало тише. Ты сейчас в другом состоянии, чем несколько минут назад."],
  [1.01, "Почти ровно. Дальше — <b>твой выбор</b>, а не автопилот."]
];

function tick() {
  const e = elapsed(), u = progress();
  const left = Math.max(0, Math.ceil(live.planned - e));
  $("#clock").textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
  $("#clockSub").textContent = u < .28 ? "волна на подъёме" : u < .6 ? "волна пошла вниз" : "волна затухает";

  $("#wLine").setAttribute("d", pathTo(Math.max(u, .001), false));
  $("#wFill").setAttribute("d", pathTo(Math.max(u, .001), true));
  const x = px(u), y = py(u);
  $("#wDot").setAttribute("cx", x); $("#wDot").setAttribute("cy", y);
  $("#wDot2").setAttribute("cx", x); $("#wDot2").setAttribute("cy", y);

  const ph = PHASES.find(p => u < p[0]) || PHASES[PHASES.length - 1];
  if ($("#phase").dataset.k !== ph[1]) { $("#phase").dataset.k = ph[1]; $("#phase").innerHTML = ph[1]; }

  if (!peaked && u >= .22) { peaked = true; vib([10, 60, 10]); }

  const want = u < .14 && e < 45 ? "breath" : u < .55 ? "states" : "acts";
  if (want !== stage) { stage = want; renderBot(); }

  if (u >= 1) finish("waited");
}

function renderBot() {
  const box = $("#wBot"); box.innerHTML = "";
  if (stage === "breath") {
    box.appendChild(el("div", "qcard", `<h4>Пока просто дыши</h4>
      <p style="margin:0;font-size:13.5px;line-height:1.55;color:var(--ink-soft)">
      Вдох на 4 счёта — задержка на 7 — выдох на 8. Три круга. Это сбивает тревогу быстрее, чем уговоры.</p>`));
    return;
  }
  if (stage === "states") {
    const c = el("div", "qcard", `<h4>Что сейчас происходит?</h4>`);
    const o = el("div", "opts");
    for (const s of STATES) {
      const b = el("button", "opt" + (live.states.includes(s.id) ? " on" : ""), esc(s.t));
      b.addEventListener("click", () => {
        live.states = live.states.includes(s.id) ? live.states.filter(x => x !== s.id) : live.states.concat(s.id);
        DB.live = live; save(); b.classList.toggle("on"); vib(6);
      });
      o.appendChild(b);
    }
    c.appendChild(o);
    box.appendChild(c);
    return;
  }
  const acts = ACTS_COMMON.concat(ACTS_BY_KIND[live.kind] || []);
  const c = el("div", "qcard", `<h4>Чем займёшь ближайшие 10 минут?</h4>`);
  const o = el("div", "opts");
  for (const a of acts) {
    const b = el("button", "opt" + (live.act === a.id ? " on" : ""), esc(a.t));
    b.addEventListener("click", () => {
      live.act = live.act === a.id ? null : a.id;
      DB.live = live; save(); renderBot(); vib(6);
    });
    o.appendChild(b);
  }
  c.appendChild(o);
  box.appendChild(c);
  const done = el("button", "btn", "Волна прошла — закончить");
  done.addEventListener("click", () => finish("waited"));
  box.appendChild(done);
}

/* волна не отпускает — продлить, не выходя из неё */
$("#plusBtn").addEventListener("click", () => {
  if (!live) return;
  live.anchor = { t: elapsed(), u: progress() };
  live.planned += 120;
  DB.live = live; save();
  $("#wEndLab").textContent = "через " + Math.round(live.planned / 60) + " мин";
  tick();
  toast("Волна продлена. Это тоже засчитывается");
  vib(8);
});

$("#stopBtn").addEventListener("click", () => {
  if (elapsed() < 20) { closeWave(); DB.live = null; live = null; save(); return; }
  finish("stopped");
});

function closeWave() {
  cancelAnimationFrame(raf);
  $("#wave").classList.remove("on");
  if (lock) { try { lock.release(); } catch (e) {} lock = null; }
}

function finish(outcome) {
  if (!live) return;
  cancelAnimationFrame(raf);
  const ep = {
    id: live.id, ts: live.ts, kind: live.kind, states: live.states,
    act: live.act, planned: live.planned, cont: live.cont || null,
    waited: Math.round(clamp(elapsed(), 0, live.planned)),
    outcome, upd: Date.now()
  };
  const before = skillXP();
  DB.ep.push(ep); DB.live = null; live = null; save(); markDirty();
  const after = skillXP();
  const fresh = checkMedals();
  closeWave();
  renderResult(ep, before, after, fresh, outcome);
  vib(outcome === "stopped" ? 12 : [16, 70, 16, 70, 30]);
}

function checkMedals() {
  const s = stats(), fresh = [];
  for (const m of MEDALS) if (!DB.medals[m.id] && m.f(s)) { DB.medals[m.id] = Date.now(); fresh.push(m); }
  if (fresh.length) save();
  return fresh;
}

/* ───────────────────────── итог ───────────────────────── */

function renderResult(ep, before, after, fresh, outcome) {
  const box = $("#result");
  const s = stats();
  const chain = chainOf(ep);                       // все волны этого захода
  const total = chain.reduce((a, e) => a + e.waited, 0);
  const mins = Math.max(1, Math.round(total / 60));
  const full = ep.waited >= ep.planned - 5;
  const head = outcome === "stopped"
    ? { h: "Пауза всё равно была", p: `Ты переждал ${fmtSec(ep.waited)} и заметил момент — это и есть навык. Ни один срыв не отменяет предыдущие паузы.` }
    : chain.length > 1
      ? { h: `${chain.length}-я волна, и ты всё ещё здесь`, p: `За этот заход переждано ${mins} ${plur(mins, "минута", "минуты", "минут")}. Продление — не откат, а отдельная победа: желание оказалось сильнее обычного, и ты всё равно не пошёл за ним.` }
      : full
        ? { h: "Волна прошла", p: `Ты переждал ${mins} ${plur(mins, "минуту", "минуты", "минут")}. Желание изменилось само, без борьбы.` }
        : { h: "Пауза сделана", p: `Ты переждал ${fmtSec(ep.waited)}.` };

  let h = `<div class="rhead">
      <div class="num">ПАУЗА №${s.total}${chain.length > 1 ? " · ВОЛНА " + chain.length : ""}</div>
      <h2>${head.h}</h2><p>${head.p}</p>
    </div><div class="xprow">`;
  let i = 0;
  for (const sk of SKILLS) {
    const d = after[sk.id] - before[sk.id];
    if (d > 0) h += `<span class="xpchip" style="animation-delay:${i++ * 70}ms">${sk.e} ${sk.t} +${d}</span>`;
  }
  h += `</div>`;

  if (fresh.length) {
    h += `<div class="sechead">Новая награда</div>`;
    fresh.forEach((m, j) => {
      h += `<div class="medal" style="animation-delay:${j * 110}ms"><span class="e">${m.e}</span>
        <span><b>${esc(m.t)}</b><span>${esc(m.h)}</span></span></div>`;
    });
  }

  if (ep.act) {
    const a = ACTS_COMMON.concat(ACTS_BY_KIND[ep.kind] || []).find(x => x.id === ep.act);
    if (a) h += `<div class="card"><h3>Твой план на 10 минут</h3><p>${esc(a.t)} — начни прямо сейчас, пока волна низкая.</p></div>`;
  }

  h += `<div class="sechead">Желание ещё сильное?</div>
    <div class="card"><p style="margin-bottom:13px">Так бывает: иногда волна не одна. Это не значит, что пауза не сработала —
      значит, накрыло сильнее обычного. Продли: время и награды идут дальше, счётчик не обнуляется.</p>
      <button class="btn soft" data-more="300">Ещё одна волна, 5 минут</button></div>

    <div class="sechead">Что было дальше?</div>
    <div class="card"><p style="margin-bottom:12px">Честный ответ нужен только карте — она без него не работает. Никаких «провалов» здесь нет.</p>
      <div class="opts" id="outOpts">
        <button class="opt" data-out="waited">Переждал</button>
        <button class="opt" data-out="acted">Сделал, но осознанно</button>
        <button class="opt" data-out="later">Ещё думаю</button>
      </div></div>
    <button class="btn" id="closeRes">Готово</button>`;

  box.innerHTML = h;
  box.classList.add("on");
  box.scrollTop = 0;

  box.querySelector("#outOpts").addEventListener("click", e => {
    const b = e.target.closest("[data-out]"); if (!b) return;
    box.querySelectorAll("[data-out]").forEach(x => x.classList.toggle("on", x === b));
    const rec = DB.ep.find(x => x.id === ep.id);
    if (rec) { rec.outcome = b.dataset.out; rec.upd = Date.now(); save(); markDirty(); }
    vib(6);
  });
  box.onclick = e => {   /* onclick, а не addEventListener: экран перерисовывается каждый раз */
    const b = e.target.closest("[data-more]"); if (!b) return;
    box.classList.remove("on");
    startWave(ep.kind, null, { dur: +b.dataset.more, cont: ep.id });
  };
  box.querySelector("#closeRes").addEventListener("click", () => {
    box.classList.remove("on"); renderHome(); go("home");
  });
}
const fmtSec = s => s < 60 ? s + " сек" : Math.round(s / 60) + " мин";

/* ───────────────────────── карта триггеров ───────────────────────── */

function renderMap() {
  const v = $("#v-map"), s = stats(), ep = DB.ep;
  if (ep.length < 3) {
    v.innerHTML = `<div class="sechead">Карта триггеров</div>
      <div class="empty">Пока мало данных.<br>После ${3 - ep.length} ${3 - ep.length === 1 ? "паузы" : "пауз"}
      здесь появится, <b>когда</b> и <b>из-за чего</b> тебя накрывает.<br><br>
      Карта не оценивает. Она показывает паттерн.</div>`;
    return;
  }

  /* распределение по часам */
  const hours = new Array(24).fill(0);
  ep.forEach(e => hours[new Date(e.ts).getHours()]++);
  const mx = Math.max(...hours);
  let hh = "";
  for (let i = 0; i < 24; i++) {
    const v0 = hours[i] / mx;
    hh += `<i class="${hours[i] === mx && mx ? "hot" : ""}" style="height:${Math.max(4, v0 * 78)}px" title="${i}:00 — ${hours[i]}"></i>`;
  }

  const cnt = (arr, key) => {
    const m = {};
    arr.forEach(e => (key(e) || []).forEach(k => m[k] = (m[k] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const byState = cnt(ep, e => e.states);
  const byKind = cnt(ep, e => [e.kind]);
  const barList = (rows, name) => {
    if (!rows.length) return `<p style="font-size:13px;color:var(--ink-faint);margin:6px 0 0">Пока не отмечено.</p>`;
    const m = rows[0][1];
    return `<div class="bars">` + rows.slice(0, 6).map(([k, n]) =>
      `<div class="bar"><span class="nm">${esc(name(k))}</span>
        <span class="tr"><span class="fl" style="width:${Math.round(n / m * 100)}%"></span></span>
        <span class="vl">${n}</span></div>`).join("") + `</div>`;
  };

  /* инсайты */
  const ins = [];
  const win = (a, b) => ep.filter(e => { const h = new Date(e.ts).getHours(); return a <= b ? h >= a && h < b : h >= a || h < b; }).length;
  let bw = null;
  for (let a = 0; a < 24; a++) { const n = win(a, (a + 4) % 24); if (!bw || n > bw.n) bw = { a, n }; }
  if (bw && bw.n / ep.length >= .4) {
    ins.push(["🕘", `<em>${Math.round(bw.n / ep.length * 100)}%</em> эпизодов приходится на промежуток
      с ${String(bw.a).padStart(2, "0")}:00 до ${String((bw.a + 4) % 24).padStart(2, "0")}:00. Это не характер — это время суток.`]);
  }
  if (byState.length) {
    const [k, n] = byState[0];
    ins.push(["🧠", `Чаще всего под импульсом — <em>${esc(nameState(k).toLowerCase())}</em>: ${n} из ${ep.length} раз.
      Значит бороться надо не с импульсом, а с этим состоянием.`]);
  }
  if (byKind.length > 1) {
    const [k, n] = byKind[0];
    ins.push(["🎯", `Главный крючок — <em>${esc(kindOf(k).t.toLowerCase())}</em>: ${n} из ${ep.length}.`]);
  }
  const waited = ep.filter(e => e.outcome === "waited").length;
  ins.push(["🌊", `Волну удалось переждать в <em>${waited} из ${ep.length}</em> случаев. Среднее время паузы —
    ${Math.round(s.seconds / ep.length / 60) || "<1"} мин.`]);
  const named = ep.filter(e => (e.states || []).length), unnamed = ep.filter(e => !(e.states || []).length);
  if (named.length >= 3 && unnamed.length >= 3) {
    const a = named.filter(e => e.outcome === "waited").length / named.length;
    const b = unnamed.filter(e => e.outcome === "waited").length / unnamed.length;
    if (a - b > .15) ins.push(["✍️", `Когда ты называешь состояние словами, ты пережидаешь волну в
      <em>${Math.round(a * 100)}%</em> случаев против ${Math.round(b * 100)}% без этого.`]);
  }
  const withAct = ep.filter(e => e.act);
  if (withAct.length >= 3) {
    const a = withAct.filter(e => e.outcome === "waited").length / withAct.length;
    ins.push(["🔁", `С выбранным занятием на замену волна проходит в <em>${Math.round(a * 100)}%</em> случаев.`]);
  }

  v.innerHTML = `
    <div class="sechead">Когда накрывает</div>
    <div class="card"><div class="hours">${hh}</div>
      <div class="hlabels"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>
    <div class="sechead">Что за этим стоит</div>
    <div class="card"><h3>Состояния</h3>${barList(byState, nameState)}</div>
    <div class="card"><h3>Импульсы</h3>${barList(byKind, k => kindOf(k).t)}</div>
    <div class="sechead">Что из этого следует</div>
    ${ins.map(([e, t]) => `<div class="insight"><span class="e">${e}</span><p>${t}</p></div>`).join("")}
    <div class="hint">Всего отметок: ${ep.length}. Чем честнее отвечаешь после волны, тем точнее карта.</div>`;
}
const nameState = id => (STATES.find(s => s.id === id) || { t: id }).t;

/* ───────────────────────── награды ───────────────────────── */

function renderRew() {
  const v = $("#v-rew"), s = stats(), xp = skillXP();
  let h = `<div class="sechead">Навыки</div><div class="card">`;
  for (const sk of SKILLS) {
    const L = levelOf(xp[sk.id]);
    h += `<div class="skill">
      <div class="top"><span class="e">${sk.e}</span><span class="nm">${esc(sk.t)}</span>
        <span class="lv">${L.max ? "макс." : "ур. " + L.lv}</span></div>
      <div class="tr"><span class="fl" style="width:${Math.round(L.pct * 100)}%"></span></div>
      <div class="ds">${esc(sk.d)}${L.max ? "" : ` · ${xp[sk.id]} / ${L.next}`}</div>
    </div>`;
  }
  h += `</div>`;

  h += `<div class="sechead">Серия</div>
    <div class="card"><h3>${s.now} ${plur(s.now, "день", "дня", "дней")} подряд</h3>
      <p>Серия считает дни, когда ты <b>сделал паузу</b>, а не дни без срыва. Сорвался — серия не обнуляется,
      если ты нажал кнопку. Лучший результат: ${s.best} ${plur(s.best, "день", "дня", "дней")}.</p></div>`;

  const got = MEDALS.filter(m => DB.medals[m.id]), left = MEDALS.filter(m => !DB.medals[m.id]);
  h += `<div class="sechead">Медали · ${got.length} из ${MEDALS.length}</div><div class="medals">`;
  for (const m of got.concat(left)) {
    h += `<div class="md${DB.medals[m.id] ? "" : " locked"}"><span class="e">${m.e}</span>
      <span><b>${esc(m.t)}</b><span>${esc(m.h)}</span></span></div>`;
  }
  h += `</div><div class="hint">Награды даются за паузы и наблюдения, а не за «чистые дни». Это принципиально:
    считается то, что ты можешь сделать прямо сейчас.</div>`;
  v.innerHTML = h;
}
/* карточка синхронизации внутри настроек */
const SYNC_LABEL = { idle: "всё сохранено", syncing: "обмен…", dirty: "есть несохранённое", error: "ошибка обмена" };
function paintSyncStatus() {
  const n = document.querySelector("#syncState");
  if (n) n.textContent = SYNC_LABEL[syncState] || "";
}
function renderSyncCard() {
  const c = document.querySelector("#syncCard"); if (!c) return;
  if (connected()) {
    const when = cfg.last ? new Date(cfg.last).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
    c.innerHTML = `<h3>Подключено</h3>
      <p>Записи лежат в <b>секретном</b> гисте твоего аккаунта GitHub: по ссылке доступен только тебе,
      в поиске не появляется. Последний обмен: ${esc(when)} · <span id="syncState"></span></p>
      <p style="margin-top:8px;font-size:12px;color:var(--ink-faint)">Гист: ${esc(cfg.gistId)}</p>
      <div style="height:12px"></div>
      <button class="btn soft" id="syncNowBtn">Синхронизировать сейчас</button>
      <div style="height:8px"></div>
      <button class="btn soft" id="syncOffBtn" style="color:var(--danger)">Отключить на этом устройстве</button>`;
    paintSyncStatus();
    c.querySelector("#syncNowBtn").onclick = () => syncNow(true);
    c.querySelector("#syncOffBtn").onclick = () => {
      if (!confirm("Отключить синхронизацию? Записи останутся и здесь, и в гисте.")) return;
      cfg = { token: "", gistId: "", last: 0 }; saveCfg(); renderSet(); toast("Отключено");
    };
  } else {
    c.innerHTML = `<h3>Перенести записи на другое устройство</h3>
      <p>Приложение может хранить копию в <b>секретном гисте</b> твоего GitHub — тогда история, карта и награды
      будут одни и те же на телефоне и компьютере. Нужен токен с доступом только к <b>gist</b>; он хранится
      на устройстве и никуда, кроме github.com, не отправляется.</p>
      <p style="margin-top:8px"><b>Учти:</b> без синхронизации записи не покидают телефон вовсе. Включать её —
      твой выбор, приложение работает и без неё.</p>
      <div class="fieldrow"><input id="tokIn" type="password" placeholder="ghp_…" autocomplete="off"
        autocapitalize="off" spellcheck="false"><button id="tokBtn">Подключить</button></div>
      <p class="hint">Как получить: github.com → Settings → Developer settings → Personal access tokens →
      Tokens (classic) → Generate new token (classic) → отметить только галочку <b>gist</b> → Generate.</p>
      <div style="height:10px"></div>
      <button class="btn soft" id="ghBtn">Открыть страницу создания токена</button>`;
    c.querySelector("#tokBtn").onclick = () => {
      const t = c.querySelector("#tokIn").value.trim();
      if (t) connectSync(t);
    };
    c.querySelector("#ghBtn").onclick = () =>
      window.open("https://github.com/settings/tokens/new?description=%D0%9F%D0%B0%D1%83%D0%B7%D0%B0&scopes=gist", "_blank", "noopener");
  }
}

const plur = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c; };

/* ───────────────────────── настройки ───────────────────────── */

function renderSet() {
  const v = $("#v-set");
  v.innerHTML = `
    <div class="sechead">Волна</div>
    <div class="card"><h3>Длина по умолчанию</h3>
      <div class="opts" style="margin-top:10px">
        ${[300, 600, 900].map(d => `<button class="opt${DB.s.dur === d ? " on" : ""}" data-sd="${d}">${d / 60} мин</button>`).join("")}
      </div>
      <p style="margin-top:12px">Пик желания обычно проходит за 3–7 минут. 5 минут хватает почти всегда;
      10–15 берут, когда накрывает сильно.</p></div>
    <div class="card"><h3>Вибрация</h3>
      <div class="opts" style="margin-top:10px">
        <button class="opt${DB.s.vib ? " on" : ""}" data-vib="1">Включена</button>
        <button class="opt${DB.s.vib ? "" : " on"}" data-vib="0">Выключена</button></div></div>

    <div class="sechead">Синхронизация</div>
    <div class="card" id="syncCard"></div>

    <div class="sechead">Данные</div>
    <div class="card"><h3>Хранится на устройстве</h3>
      <p>Своего сервера у приложения нет: без синхронизации записи не покидают телефон, аналитики нет,
      аккаунт не нужен. Приложение работает офлайн.</p>
      <div style="height:12px"></div>
      <button class="btn soft" id="expBtn">Сохранить копию в файл</button>
      <div style="height:8px"></div>
      <button class="btn soft" id="impBtn">Загрузить копию</button>
      <div style="height:8px"></div>
      <button class="btn soft" id="wipeBtn" style="color:var(--danger)">Стереть всё</button></div>

    <div class="sechead">Зачем это устроено так</div>
    <div class="card"><p>Приложение не считает «дни без срыва» — такой счётчик превращает один эпизод в обнуление всего
      и усиливает чувство провала. Здесь считается количество пауз: моментов, когда между импульсом и действием
      появился промежуток. Этот навык накапливается, и его нельзя потерять.</p></div>
    <div class="hint">Пауза · офлайн-приложение · версия 1.0</div>`;

  renderSyncCard();
  v.querySelectorAll("[data-sd]").forEach(b => b.onclick = () => { DB.s.dur = +b.dataset.sd; save(); renderSet(); });
  v.querySelectorAll("[data-vib]").forEach(b => b.onclick = () => { DB.s.vib = b.dataset.vib === "1"; save(); renderSet(); vib(10); });
  v.querySelector("#expBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(DB)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "pauza-backup.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  };
  v.querySelector("#impBtn").onclick = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = "application/json";
    i.onchange = () => {
      const f = i.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || d.v !== 1) throw 0;
          DB = d; save(); applyTheme(); renderSet(); renderHome(); toast("Копия загружена");
        } catch (e) { toast("Не похоже на копию «Паузы»"); }
      };
      r.readAsText(f);
    };
    i.click();
  };
  v.querySelector("#wipeBtn").onclick = () => {
    if (connected() && !confirm("Синхронизация включена: записи останутся в гисте на GitHub. Стереть их можно, удалив гист вручную. Продолжить?")) return;
    if (!confirm("Стереть все паузы, карту и награды? Отменить будет нельзя.")) return;
    DB = { v: 1, ep: [], kinds: [], medals: {}, live: null, s: DB.s };
    save(); renderSet(); renderHome(); toast("Стёрто");
  };
}

/* ───────────────────────── старт ───────────────────────── */

renderHome();
checkMedals();

/* незакрытая волна: если ушёл из приложения — продолжаем с того же места */
if (DB.live) {
  const l = DB.live;
  if ((Date.now() - l.ts) / 1000 < l.planned) startWave(l.kind, l);
  else { DB.live = null; save(); }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  if (live) tick();
  if (connected()) syncNow(false);
});
window.addEventListener("online", () => { if (connected()) syncNow(false); });
if (connected()) syncNow(false);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
