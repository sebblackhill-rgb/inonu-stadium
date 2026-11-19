/* ================= text matching: whole words / tokens only ================= */
const FOLD = { "ş": "s", "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ü": "u", "â": "a", "î": "i", "û": "u", "i̇": "i" };
const fold = s => String(s || "").toLocaleLowerCase("tr").replace(/i̇|[şçğıöüâîû]/g, ch => FOLD[ch] || ch);
const PICTO = /\p{Extended_Pictographic}/u;
function tokenize(s) { const str = String(s || ""); return { words: fold(str).match(/[\p{L}\p{N}]+/gu) || [], emoji: Array.from(str).filter(ch => PICTO.test(ch)) }; }
const kwCache = new Map();
function kwTokens(k) { if (!kwCache.has(k)) kwCache.set(k, PICTO.test(k) ? { emoji: Array.from(k).filter(ch => PICTO.test(ch)) } : { words: tokenize(k).words }); return kwCache.get(k); }
function matchKw(tk, k) {
  const kt = kwTokens(k);
  if (kt.emoji) return kt.emoji.length > 0 && kt.emoji.every(e => tk.emoji.includes(e));
  const w = kt.words; if (!w.length) return false;
  for (let i = 0; i + w.length <= tk.words.length; i++) { let ok = true; for (let j = 0; j < w.length; j++) if (tk.words[i + j] !== w[j]) { ok = false; break; } if (ok) return true; }
  return false;
}
const hasKw = (tk, list) => list.some(k => matchKw(tk, k));
// explicit permitted-token list: every word of the comment must be covered by ONE team's keywords ("1", "11", "1!", "ev sahibi", "2 dep!");
// "1990", "1 dakika", "go home", "1 2" never join. Team-colour emoji count; other emoji/punctuation are ignored.
function coversTeam(tk, team) {
  const kws = CONFIG.teams[team].keywords.map(kwTokens), W = tk.words; let i = 0;
  while (i < W.length) { let adv = 0; for (const k of kws) if (k.words && k.words.length > adv && k.words.every((w, j) => W[i + j] === w)) adv = k.words.length; if (!adv) return false; i += adv; }
  return true;
}
const teamEmoji = t => CONFIG.teams[t].keywords.filter(k => PICTO.test(k));
function teamFromTokens(tk) {
  const hits = TEAMS.filter(t => coversTeam(tk, t) && !teamEmoji(other(t)).some(e => tk.emoji.includes(e)) && (tk.words.length > 0 || teamEmoji(t).some(e => tk.emoji.includes(e))));
  return hits.length === 1 ? hits[0] : null;
}
const joinTokSeen = new Set();
function noteJoinToken(comment, team) {   // every accepted join token is shown once, so the streamer can see the rule working
  const k = String(comment || "").trim().replace(/\s+/g, " ").slice(0, 14), key = fold(k);
  if (!k || joinTokSeen.has(key)) return; joinTokSeen.add(key); logLine(T("joinRule", { k, t: tSeats(team) }), team);
}
function actionOf(tk) { for (const a of ["lighter", "bottle", "torch", "drum"]) if (hasKw(tk, CONFIG.actions[a])) return a; return null; }
window.__match = (comment) => { const tk = tokenize(comment); return { team: teamFromTokens(tk), action: actionOf(tk) }; };

/* ================= state additions ================= */
Object.assign(state, { penQ: [], pen: null, offence: { home: 0, away: 0 }, banUntil: { home: -1, away: -1 }, series: { home: 0, away: 0, draw: 0 }, matchNo: 1, lastShot: null, coolUntil: { home: -1, away: -1 }, shots: 0, paused: false });
const nightBook = new Map();       // userId -> {name, team, pts} for the whole night (session, persisted)
const pending = new Map();         // unassigned viewers: userId -> {name, likes, gifts:[{val, unit, giftName, t}], t}
// several instances (OBS source + preview tab) may share this storage: the series is only changed by read-modify-write at full time,
// the night board is merged (max points per viewer), and other instances' writes are picked up via the storage event — nobody overwrites anybody
const readSeries = () => { try { return Object.assign({ home: 0, away: 0, draw: 0 }, JSON.parse(localStorage.getItem("inonu-series") || "null") || {}); } catch (e) { return { home: 0, away: 0, draw: 0 }; } };
Object.assign(state.series, readSeries());
// B3 (pass 3): ONE writer per browser. ?write=0 (preview tab) never writes; otherwise the first open tab holds a heartbeat lock and only it writes
// the series / night board. Other tabs just show what the writer saved. If the writer closes, the next tab takes over within ~5 s (stale lock: 75 s).
const WRITE = Q.get("write") !== "0", TAB_ID = Math.random().toString(36).slice(2) + Date.now().toString(36), LOCK_KEY = "inonu-writer", LOCK_TTL = 75000;
const readLock = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (e) { return null; } };
let wasWriter = null;
function claimWriter() {
  let mine = false;
  if (WRITE) { const l = readLock(), now = Date.now(); if (!l || l.id === TAB_ID || now - l.at > LOCK_TTL) { try { localStorage.setItem(LOCK_KEY, JSON.stringify({ id: TAB_ID, at: now })); } catch (e) {} } mine = (readLock() || {}).id === TAB_ID; }
  if (mine !== wasWriter) { wasWriter = mine; window.__writer = mine; if (!mine && typeof logLine === "function" && $("log")) logLine(T("preview")); }
  return mine;
}
setInterval(claimWriter, 5000);
window.addEventListener("pagehide", () => { const l = readLock(); if (l && l.id === TAB_ID) try { localStorage.removeItem(LOCK_KEY); } catch (e) {} });
window.__isWriter = () => WRITE && (readLock() || {}).id === TAB_ID;
function bumpSeries(k) { if (!claimWriter()) { state.series = readSeries(); return; } const s = readSeries(); s[k]++; try { localStorage.setItem("inonu-series", JSON.stringify(s)); } catch (e) {} state.series = s; }
function resetStore() { state.series = { home: 0, away: 0, draw: 0 }; nightBook.clear(); if (!claimWriter()) return; try { localStorage.setItem("inonu-series", JSON.stringify(state.series)); localStorage.setItem("inonu-night", JSON.stringify({ at: Date.now(), rows: [] })); } catch (e) {} }
window.addEventListener("storage", e => { if (e.key === "inonu-series") state.series = readSeries(); if (e.key === "inonu-night") mergeNight(); });
try { const nb = JSON.parse(localStorage.getItem("inonu-night") || "null"); if (nb && Date.now() - nb.at < 8 * 3600e3) nb.rows.forEach(r => nightBook.set(r.id, r)); } catch (e) {}
let saveT = 0;
function mergeNight() { try { const nb = JSON.parse(localStorage.getItem("inonu-night") || "null"); if (nb && nb.rows && Date.now() - nb.at < 8 * 3600e3) nb.rows.forEach(r => { const o = nightBook.get(r.id); if (!o || r.pts > o.pts) nightBook.set(r.id, { name: r.name, team: r.team, pts: r.pts }); }); } catch (e) {} }
function persist() { mergeNight(); if (!claimWriter()) return; try { localStorage.setItem("inonu-night", JSON.stringify({ at: Date.now(), rows: [...nightBook.entries()].map(([id, r]) => Object.assign({ id }, r)).sort((a, b) => b.pts - a.pts).slice(0, 300) })); } catch (e) {} }

/* ================= helpers ================= */
function addChant(team, v) { if (v > 0) { const gd = state.goals[team] - state.goals[other(team)]; v *= gd < 0 ? 1.3 : gd > 0 ? 0.85 : 1; if (state.phase === "celebrate") v *= 0.5; } state.chant[team] = clamp(state.chant[team] + v, 0, 100); }
function logLine(txt, team) { const el = document.createElement("div"); el.textContent = txt; if (team === "away") el.className = "away"; const L = $("log"); L.prepend(el); while (L.children.length > 5) L.lastChild.remove(); }
function addPts(f, v) { if (!(v > 0)) return; f.mPts += v; f.nPts += v; nightBook.set(f.id, { name: f.name, team: f.team, pts: f.nPts }); }
function goalChance(team) { const lvl = state.chant[team] / 100, mom = team === "home" ? state.momentum : -state.momentum; return clamp(0.1 + lvl * 0.6 + mom * 0.15, 0.05, 0.8); }
function inAttack(team) { return team === "home" ? state.ballZ < -PL * 0.5 : state.ballZ > PL * 0.5; }

/* join log batching + team-pick prompts */
const joinBuf = { home: [], away: [] }; let joinFlushT = 0;
function flushJoins() {
  if (state.time - joinFlushT < 1.5) return; joinFlushT = state.time; let any = false;
  TEAMS.forEach(t => { const b = joinBuf[t]; if (!b.length) return; any = true;
    if (b.length === 1) logLine(T("joined", { n: "@" + b[0], t: tSeats(t) }), t);
    else logLine(T("joinedBatch", { k: b.length, t: tSeats(t), names: b.slice(0, 2).map(n => "@" + n).join(", ") + (b.length > 2 ? " +" + (b.length - 2) : "") }), t);
    b.length = 0; });
  if (any) sfx("pop");
}
const pickBuf = new Map(); let pickFlushT = 0, promptT = -9, promptDur = 0; const pickSeen = new Map();
let promptMake = null;   // rebuilt on language switch so a visible prompt never stays in the old language
function askPick(id, name, held) {
  const last = pickSeen.get(id) ?? -99;
  if (state.time - last < 8 && !held) return;
  pickSeen.set(id, state.time);
  // Prevent multi-hour streams from accumulating an unbounded prompt cooldown map.
  if (pickSeen.size > 4000) {
    for (const [key, t] of pickSeen) if (state.time - t > 120) pickSeen.delete(key);
    while (pickSeen.size > 4000) pickSeen.delete(pickSeen.keys().next().value);
  }
  pickBuf.set(id, { name, held: held || (pickBuf.get(id) || {}).held });
}
function flushPicks() {
  if (!pickBuf.size || state.time - pickFlushT < 2.6) return; pickFlushT = state.time;
  const arr = [...pickBuf.entries()].filter(([id]) => !users.has(id)).map(e => e[1]); pickBuf.clear();   // viewers who joined meanwhile are not nagged
  if (!arr.length) return;
  const held = arr.find(a => a.held);
  promptMake = () => { let txt = held ? T("pickHeld", { n: held.name }) : T("pick", { n: arr[0].name });
    if (arr.length > 1) txt = txt.replace("@" + (held || arr[0]).name, "@" + (held || arr[0]).name + " +" + (arr.length - 1)); return txt; };
  $("prompt").textContent = promptMake(); promptT = state.time; promptDur = 2.5;
}

/* ================= live events ================= */
let chantSfxT = { home: -9, away: -9 };
function fanChant(f, v, say, noPts) {
  f.chantUntil = state.time + 1.6; f.score += v; f.hotUntil = state.time + 2.5; addChant(f.team, v);
  if (!noPts && state.time - f.lastChatPt >= CONFIG.points.chatEvery) { f.lastChatPt = state.time; addPts(f, 1); }
  if (say) { f.say = String(say).slice(0, 22); f.sayUntil = state.time + 2.2; }
  if (state.time - chantSfxT[f.team] > 2.4 && state.chant[f.team] > 25) { chantSfxT[f.team] = state.time; sfx("chant", f.team); }
}
let banLogT = { home: -9, away: -9 };
function doAction(f, kind) {
  const n = "@" + f.name; f.hotUntil = state.time + 3;
  if (kind === "drum") { hitDrum(f.team); addChant(f.team, 4); addPts(f, 0.5); logLine(T("drum", { n }), f.team); }
  else if (kind === "torch") { lightTorch(f); addChant(f.team, 6); addPts(f, 0.5); logLine(T("torch", { n }), f.team); }
  else {
    const team = f.team, R = CONFIG.throwRule;
    if (state.time < state.banUntil[team]) { if (state.time - banLogT[team] > 4) { banLogT[team] = state.time; logLine("⛔ " + T("banned", { t: tShort(team), s: Math.ceil(state.banUntil[team] - state.time) }), team); } return; }
    throwObject(f, kind);
    const cool = state.time < state.coolUntil[team];               // ref just warned this end: throws neither count nor hurt the rivals
    logLine(T(kind, { n }) + (cool ? " " + T("cool") : ""), team);
    if (cool) return;
    addChant(other(team), -4);                                   // distracts the celebrating rivals...
    const arr = state.throws[team]; arr.push(state.time); while (arr.length && state.time - arr[0] > R.window) arr.shift();
    if (arr.length >= R.limit) { arr.length = 0; state.offence[team]++; state.coolUntil[team] = state.time + 1 + R.cooldown; const lvl = state.offence[team], generation = state.warningGeneration || 0; later(1.0, () => { if (generation === (state.warningGeneration || 0)) refereeWarning(team, lvl); }); }   // ...but the ref is watching (explained ladder)
    else if (arr.length === R.limit - 1) watchCue(team);
  }
}
let cardT = -9, cardColor = "#ffd400"; window.__watchCues = [];
const nextOffence = t => { const o = state.offence[t]; return o === 0 ? T("warn1") : o === 1 ? T("warn2") : T("warn3"); };
function watchCue(team) { window.__watchCues.push({ team, t: state.time }); showPop(T("watch"), T("watchS", { t: tName(team), w: nextOffence(team) }), "warn", 1.6, "small", 1); }
function refereeWarning(team, lvl) {
  const R = CONFIG.throwRule, tn = tName(team);
  state.warnings[team]++; sfx("whistle", 3);
  if (lvl <= 1) { showPop(T("warn1"), T("warn1s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#f2f2f2"; }
  else if (lvl === 2) { addChant(team, -R.yellowCost); showPop(T("warn2"), T("warn2s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#ffd400"; }
  else { state.banUntil[team] = state.time + R.banSec; showPop(T("warn3"), T("warn3s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#e01b2f"; }
  cardT = state.time;
}
function joinFan(id, name, team) {
  const f = addFan(id, name, team);
  if (!f) {
    // A full stand must provide visible feedback instead of silently rejecting a viewer.
    logLine(CONFIG.lang === "tr" ? "Tribün dolu · diğer takımı deneyin" : "Stand full · try the other team", team);
    return null;
  }
  joinBuf[team].push(name); addChant(team, 2);
  const p = pending.get(id);
  if (p) { pending.delete(id);
    if (p.likes) { fanChant(f, Math.min(10, 0.5 * p.likes), "", true); hearts.push({ f, t: 0 }); }
    // Gift recognition does not expire with the temporary gameplay effect.
    // Older gift effects are intentionally not replayed onto the current match.
    let credited = 0, actionExpired = 0;
    p.gifts.forEach(g => {
      if (state.time - g.t < 180) {
        applyGift(f, g.val, g.unit, g.giftName, g.count || 1);
      } else {
        f.gifts += g.val;
        f.mGiftD += g.val;
        const P = CONFIG.points;
        const newPoints = Math.min(P.giftCapPerMatch, P.giftK * Math.sqrt(f.mGiftD));
        addPts(f, newPoints - f.mGiftPts);
        f.mGiftPts = newPoints;
        actionExpired++;
      }
      credited += g.val;
    });
    if (credited) {
      logLine(T("heldApplied", { n: name, t: tShort(team) }), team);
      if (actionExpired) logLine(CONFIG.lang === "tr"
        ? "@" + name + " · eski hediyeler sayıldı (efekt süresi doldu)"
        : "@" + name + " · older gifts credited (effects expired)", team);
    }
  }
  return f;
}
function holdForUnassigned(id, name, like, gift) {
  const p = pending.get(id) || { name, likes: 0, gifts: [], t: state.time };
  if (like) p.likes = Math.min(50, p.likes + like);
  if (gift) p.gifts.push(Object.assign({ t: state.time }, gift)); // never truncate recognized gift credit
  p.t = state.time; pending.set(id, p);
  // Bound unassigned free activity without evicting someone whose gift is awaiting a team.
  // Gift-bearing pending entries survive until claimed or the session ends.
  if (pending.size > 400) {
    const free = [...pending.entries()].filter(([, rec]) => rec.gifts.length === 0);
    free.sort((a, b) => a[1].t - b[1].t);
    for (const [key] of free) {
      if (pending.size <= 400) break;
      pending.delete(key);
    }
  }
  askPick(id, name, !!gift);
}
// Strict defensive counts: invalid values must not propagate NaN into chant or ball physics.
function safePositiveCount(v, max) {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 1 && v <= max ? v : null;
}
window.handleLiveEvent = function (ev) {
  try {
    if (!ev) return;
    if (Q.get("live") === "1" && ev.source === "host" && Q.get("host") !== "1") return;
    if (ev.source === "tiktok" && !ev.userId) return; // no shared anonymous paid-credit identity
    lastLiveEvt = state.time;
    const id = String(ev.userId || ev.uniqueId || ev.username || "anon"), name = String(ev.username || ev.nickname || id).replace(/^@/, "").slice(0, 18);
    let f = users.get(id);
    if (ev.type === "chat") {
      const tk = tokenize(ev.comment), jt = teamFromTokens(tk);
      if (!f) { if (jt) { if (joinFan(id, name, jt)) noteJoinToken(ev.comment, jt); } else askPick(id, name, false); return; }   // no seat until a team is chosen
      const act = actionOf(tk);
      if (act) doAction(f, act);
      else fanChant(f, 3, jt ? "" : ev.comment);   // a typed team keyword chants as much as any other comment
    } else if (ev.type === "like") {
      const n = Math.max(1, Math.min(15, Number(ev.likeCount || ev.count) || 1));
      if (!f) { holdForUnassigned(id, name, n, null); return; }
      fanChant(f, 0.5 * n, "", true); hearts.push({ f, t: 0 });
      if (state.time - f.likeWinT > 60) { f.likeWinT = state.time; f.likeWin = 0; }
      const pts = Math.min(CONFIG.points.likeCapPerMin - f.likeWin, CONFIG.points.likePts * n); if (pts > 0) { f.likeWin += pts; addPts(f, pts); }
    } else if (ev.type === "gift") {
      const unit = safePositiveCount(ev.diamondCount ?? ev.giftDiamondCount ?? ev.giftValue, 1000000);
      const repeats = safePositiveCount(ev.repeatCount ?? 1, 100000);
      if (unit === null || repeats === null) { console.warn("[LIVE] rejected malformed gift value"); return; }
      const gname = String(ev.giftName || "gift").slice(0, 128);
      // Streak settlement still requires a confirmed real provider contract.
      // streaks: repeatCount may be cumulative while a combo is running -> only count the new part
      const delta = streakDelta(id, gname, ev);
      if (delta <= 0) return;
      if (!f) { holdForUnassigned(id, name, 0, { val: unit * delta, unit, giftName: gname, count: delta }); return; }
      applyGift(f, unit * delta, unit, gname, delta, Number(ev.repeatCount) || 1);
    }
  } catch (e) { console.error(e); }
};
/* gift streaks, robust to both delivery contracts:
   - provider sends a streak/combo id (streakId/comboId/groupId): credit only growth of the highest repeatCount seen for that id,
     so duplicates and late lower counts add nothing and the total equals the provider's final count;
   - no id: same viewer+gift within 4 s is one streak with a cumulative repeatCount (same max rule); a fresh "1" more than 1 s
     after the last event starts a new combo; a feed that only ever sends repeatCount 1 counts every event. */
const streaks = new Map(); window.__streaks = streaks;
function streakDelta(id, gname, ev) {
  const sid = ev.streakId || ev.comboId || ev.groupId || "", key = id + "|" + gname + "|" + sid, rc = Math.max(1, Math.floor(Number(ev.repeatCount) || 1));
  let s = streaks.get(key);
  if (s && !sid && state.time - s.t > 4) s = null;               // id-less streaks end after 4 s of silence
  if (!s) { streaks.set(key, { max: rc, t: state.time }); if (streaks.size > 2000) streaks.delete(streaks.keys().next().value); return rc; }
  const gap = state.time - s.t; s.t = state.time;
  if (rc > s.max) { const d = rc - s.max; s.max = rc; return d; }
  if (rc === 1 && (s.max === 1 || (!sid && gap > 1))) { if (!sid) s.max = 1; return 1; }   // singles feed / new combo
  return 0;                                                        // duplicate or late lower count
}
/* gifts: diminishing ranking points + batched effects */
const giftAgg = new Map(); const waveT = { home: -9, away: -9 };
function applyGift(f, val, unit, gname, count, rc) {
  const P = CONFIG.points, G = CONFIG.gifts, key = f.id + "|" + gname;
  f.gifts += val; f.hotUntil = state.time + 5;
  f.mGiftD += val; const np = Math.min(P.giftCapPerMatch, P.giftK * Math.sqrt(f.mGiftD)); addPts(f, np - f.mGiftPts); f.mGiftPts = np;
  let agg = giftAgg.get(key);
  const fresh = !agg || state.time - agg.t > G.comboWindow;
  if (fresh) { agg = { f, gname, unit, count: 0, t: state.time, fxT: -9, lastRepeat: rc || count || 1 }; giftAgg.set(key, agg); }
  agg.count += count || 1; agg.t = state.time;
  addChant(f.team, Math.min(25, 2 + 2 * Math.sqrt(val)));
  if (unit >= G.tifoAt) { tifo(f); agg.fxT = state.time; sfx("fanfare"); return; }       // big gifts always fire
  if (state.time - agg.fxT < 1.5) return;                                                // repeated small gifts: one effect per 1.5 s, counter in the ticker
  agg.fxT = state.time; sfx("fanfare");
  if (unit >= G.waveAt) { if (state.time - waveT[f.team] > 4) { waveT[f.team] = state.time; standWave(f); } else doAction(f, "torch"); }
  else if (unit >= G.torchAt) doAction(f, "torch");
  else doAction(f, "drum");
}
function standWave(f) { startMexWave(); addChant(f.team, 25); state.momentum = clamp(state.momentum + (f.team === "home" ? 0.35 : -0.35), -1, 1); teamFans[f.team].forEach(o => o.chantUntil = state.time + 3 + Math.abs(o.seat.z + 2) * 0.05); showPop(T("wave"), "@" + f.name + " 🌊", f.team, 1.8, "small", 1); for (let i = 0; i < 3; i++) hitDrum(f.team); }
function tifo(f) {
  const tf = tifos[f.team]; tf.start = state.time; tf.until = state.time + 5; addChant(f.team, 50); state.momentum = f.team === "home" ? 0.9 : -0.9;
  sfx("roar"); state.shake = 0.6;
  const queued = state.penQ.filter(p => p.team === f.team).length + (state.pen && state.pen.team === f.team ? 1 : 0);
  // documented rule: up to 2 penalties queued per team, taken in arrival order at the next open play; extra gifts = chant only;
  // nothing is queued during the full-time ceremony, and the queue is cleared at kickoff (penalties never carry into the next match)
  if (state.phase === "ft") showPop(T("tifo"), "@" + f.name + " · " + T("penFt"), f.team, 2, "", 2);
  else if (queued < 2) { state.penQ.push({ team: f.team, by: f.name, at: state.time }); showPop(T("tifo"), T("penBy", { n: f.name }) + " → " + T("pen"), f.team, 2.4, "", 2); }
  else showPop(T("tifo"), "@" + f.name + " · " + T("penFull"), f.team, 2, "", 2);
}

/* ================= match engine ================= */
let shotCooldown = 2;
function startPenalty(p) {
  ballFly = null; state.pen = Object.assign({ kicked: false }, p); state.phase = "penalty"; state.phaseT = 0;
  const d = attackDir(p.team); state.ballX = 0; state.ballZ = d * (PL - 3.9); sfx("whistle", 1);
  showPop(T("pen"), T("penBy", { n: p.by }), p.team, 1.4, "small", 3);
}
function updateMatch(dt) {
  runTimers();
  TEAMS.forEach(t => { state.chant[t] = Math.max(0, state.chant[t] - dt * (3 + state.chant[t] * 0.07)); });
  if (state.phase === "intro") { if (!introHold && state.time - introStart > 1.2) { state.phase = "play"; sfx("whistle", 2); showPop(T("start"), "", "", 1.4, "small", 1); } return; }
  if (state.phase === "ft") { state.phaseT += dt; if (state.phaseT > CONFIG.ftSec) newMatch(); return; }
  if (state.minute < CONFIG.matchMinutes) state.minute = Math.min(CONFIG.matchMinutes, state.minute + dt / CONFIG.secondsPerMinute);
  if (state.phase === "celebrate") { state.phaseT += dt; if (state.phaseT > 2.2 && !state.replayDone) { state.replayDone = true; if (startReplay()) camera.position.set(9e9, 0, 0); } if (state.phaseT > 6.5) { state.phase = "play"; resetPositions(); sfx("whistle", 1); state.chant[state.lastScorer] *= 0.55; } return; }
  if (state.phase === "penalty") { state.phaseT += dt; if (state.phaseT > 1.5 && !state.pen.kicked) { state.pen.kicked = true; const pt = state.pen.team, conv = CONFIG.penalty.base + CONFIG.penalty.perChant * state.chant[pt] / 100; state.lastShot = { c: Math.round(state.chant[pt]), p: Math.round(conv * 100), pen: true }; shoot(pt, Math.random() < conv, true); } return; }
  if (state.phase !== "play") return;
  // queued penalties (from big gifts) are taken at the first open-play moment — never lost during celebrations/shots
  if (state.penQ.length && !ballFly) { startPenalty(state.penQ.shift()); return; }
  if (state.minute >= CONFIG.matchMinutes) { fullTime(); return; }
  const diff = (state.chant.home - state.chant.away) / 100;
  const target = clamp(diff * 2.2 + Math.sin(state.time * 0.41) * 0.5 + Math.sin(state.time * 0.13 + 1) * 0.3, -1, 1);
  state.momentum = clamp(lerp(state.momentum, target, dt * 0.8), -1, 1);
  const tz = -state.momentum * (PL - 2) + Math.sin(state.time * 1.3) * 2.5, tx = Math.sin(state.time * 0.8) * 5.5 + Math.sin(state.time * 2.1) * 1.5;
  state.ballZ = lerp(state.ballZ, tz, dt * 0.9); state.ballX = lerp(state.ballX, tx, dt * 1.2);
  if (state.chant.home + state.chant.away > 120 && Math.random() < dt * 0.04) startMexWave();
  shotCooldown -= dt;
  if (shotCooldown <= 0) TEAMS.forEach(t => {
    if (state.phase !== "play" || !inAttack(t)) return;
    const lvl = state.chant[t] / 100, SC = CONFIG.shots;
    if (state.chant[t] < SC.minChant) return;                     // a silent end never shoots: goals have to be chanted for
    if (Math.random() < dt * (SC.base + lvl * SC.perChant)) { shotCooldown = 2.2; state.shots++; const p = goalChance(t); state.lastShot = { c: Math.round(state.chant[t]), p: Math.round(p * 100) }; shoot(t, Math.random() < p); }
  });
}
function shotResult(bf) {
  state.pen = null;
  if (bf.scoreIt) goal(bf.team);
  else { showPop(Math.random() < 0.5 ? T("save") : T("miss"), state.lastShot ? T("goalWhy", state.lastShot) : "", bf.team, 1.3, "small", 1); sfx("groan"); state.phase = "play"; state.ballZ = attackDir(bf.team) * (PL - 8); state.momentum *= 0.4; }
}
function goal(team) {
  state.goals[team]++; state.lastScorer = team; state.phase = "celebrate"; state.phaseT = 0; state.shake = 1;
  showPop(T("goal"), T("scored", { t: tName(team) }) + (state.lastShot ? "  " + T("goalWhy", state.lastShot) : ""), team, 3, "", 3);
  sfx("roar"); later(0.2, () => sfx("chant", team));
  goals[attackDir(team)].net.userData.shake = 1;
  teamFans[team].forEach(f => f.jumpUntil = state.time + rnd(3, 5));
  teamFans[other(team)].forEach(f => f.sadUntil = state.time + rnd(2.5, 4));
  addChant(team, 25); state.momentum = 0; celebT = state.time; celebTeam = team; state.replayDone = false; paperRain(team);
  confetti(team);
}
function topFans(list, key, n) { return list.filter(f => f[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, n); }
function renderFullTimePanel() {
  // Pure UI redraw: language switches must never award a second series result.
  const h = state.goals.home, a = state.goals.away, w = h === a ? null : (h > a ? "home" : "away");
  const all = teamFans.home.concat(teamFans.away);
  const motm = topFans(w ? teamFans[w] : all, "mPts", 1)[0], top = topFans(all, "mPts", 3);
  const esc = s => String(s).replace(/[<>&"]/g, "");
  const P = $("ftpanel");
  P.innerHTML = "<h2>" + T("ftTitle") + "</h2><div class='fs'><canvas id='ftc-home' width='80' height='92'></canvas><span class='n'>" + h + " - " + a + "</span><canvas id='ftc-away' width='80' height='92'></canvas></div>" +
    "<div class='win'>" + (w ? "🏆 " + T("wins", { t: tName(w) }) : "🤝 " + T("draw")) + "</div>" +
    "<div class='ser'>" + T("seriesLine", { hn: tName("home"), h: state.series.home, a: state.series.away, an: tName("away") }) + (state.series.draw ? " · 🤝 " + state.series.draw : "") + "</div>" +
    (motm ? "<div class='motm'>⭐ " + T("motm") + ": @" + esc(motm.name) + " · " + Math.round(motm.mPts) + "</div>" : "") +
    (!top.length ? "<div class='top quiet'>" + T("quiet") + "</div>" : "<div class='top'><div style='color:#ffd75e;font-size:11px;letter-spacing:1px'>" + T("top3") + "</div>" + top.map((f, i) => "<div>" + ["🥇", "🥈", "🥉"][i] + " @" + esc(f.name) + " (" + tShort(f.team) + ") · " + Math.round(f.mPts) + "</div>").join("") + "</div>") +
    "<div class='nx' id='ft-next'></div>";
  TEAMS.forEach(t => { const c = $("ftc-" + t); if (c) c.getContext("2d").drawImage($("crest-" + t), 0, 0); });
  P.style.display = "block";
}
function fullTime() {
  state.phase = "ft"; state.phaseT = 0; sfx("whistle", 3); later(0.6, () => sfx("fanfare"));
  const h = state.goals.home, a = state.goals.away, w = h === a ? null : (h > a ? "home" : "away");
  bumpSeries(w || "draw"); persist();
  if (w) { teamFans[w].forEach(f => f.jumpUntil = state.time + 10); teamFans[other(w)].forEach(f => f.sadUntil = state.time + 8); confetti(w); later(2, () => confetti(w)); }
  renderFullTimePanel();
  showPop(T("ft"), "", w || "", 1.6, "small", 4);
}
function newMatch(restart) {
  state.warningGeneration = (state.warningGeneration || 0) + 1;
  state.goals.home = state.goals.away = 0; state.minute = 0; state.phaseT = 0; if (!restart) state.matchNo++;
  state.penQ.length = 0; state.pen = null; ballFly = null; state.lastShot = null;
  TEAMS.forEach(t => { state.chant[t] = 10; state.throws[t].length = 0; state.offence[t] = 0; state.warnings[t] = 0; state.banUntil[t] = -1; state.coolUntil[t] = -1; });
  state.momentum = 0; users.forEach(f => { f.mPts = 0; f.mGiftD = 0; f.mGiftPts = 0; });
  $("ftpanel").style.display = "none"; resetPositions(); state.phase = "play"; sfx("whistle", 2); showPop(T("start"), T("matchN", { n: state.matchNo }), "", 2.2, "small", 1);
}
/* ================= 2D overlay: popups, confetti, hearts, comic bursts ================= */
const fx2 = $("fx"), g2 = fx2.getContext("2d");
const confettiP = [], hearts = [], bursts = [];
let popT = -9, popDur = 0, popPrio = 0, celebT = -99, celebTeam = null; const popQ = [];
function showPop(big, sub, cls, dur, extra, prio) {
  prio = prio || 1;
  if (state.time - popT < popDur && popPrio > prio) { if (popQ.length < 3) popQ.push([big, sub, cls, dur, extra, prio]); return; }   // never hide a goal/penalty behind a smaller popup
  popPrio = prio; $("pop-big").textContent = big; $("pop-sub").textContent = sub || ""; $("pop-sub").style.display = sub ? "inline-block" : "none"; $("pop").className = (cls || "") + " " + (extra || ""); popT = state.time; popDur = dur || 2; }
function confetti(team) { const cols = team === "home" ? ["#fff", "#111", "#ddd", "#ffd75e"] : [AC.c1, AC.c2, "#fff", AC.light]; for (let i = 0; i < 140; i++) confettiP.push({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-40, 40), vy: rnd(120, 260), r: rnd(0, 6), vr: rnd(-8, 8), c: cols[i % cols.length], life: rnd(2.5, 4) }); }
function fxBurst(txt, team) { const ex = bursts.find(b => b.team === team && b.base === txt && b.t < 0.6); if (ex) { ex.n++; ex.txt = txt + " x" + ex.n; ex.t = Math.min(ex.t, 0.15); return; } const s = toScreen(drums[team].g.position.x, drums[team].g.position.y + 1.5, drums[team].g.position.z); if (s) bursts.push({ x: s.x, y: s.y, t: 0, txt, base: txt, n: 1, team }); }
const _v = new THREE.Vector3();
function toScreen(x, y, z) { _v.set(x, y, z).project(camera); if (_v.z > 1) return null; return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }
function updateFX2(dt) {
  g2.clearRect(0, 0, W, H);
  for (let i = confettiP.length - 1; i >= 0; i--) { const p = confettiP[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.life <= 0 || p.y > H) { confettiP.splice(i, 1); continue; }
    g2.save(); g2.translate(p.x, p.y); g2.rotate(p.r); g2.fillStyle = p.c; g2.fillRect(-4, -2.5, 8, 5); g2.restore(); }
  for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; if (h.t > 1.2) { hearts.splice(i, 1); continue; } const s = toScreen(h.f._hx, h.f._hy + h.t * 2, h.f._hz); if (!s) continue; g2.globalAlpha = 1 - h.t / 1.2; g2.font = "16px sans-serif"; g2.fillText("❤️", s.x - 8, s.y); g2.globalAlpha = 1; }
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += dt; if (b.t > 0.8) { bursts.splice(i, 1); continue; } const k = b.t / 0.8, sc = 0.6 + Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 0.7;
    g2.save(); g2.translate(b.x, b.y - k * 30); g2.scale(sc, sc); g2.rotate(-0.15); g2.globalAlpha = 1 - k * k; g2.font = "900 30px Trebuchet MS"; g2.textAlign = "center"; g2.lineWidth = 6; g2.strokeStyle = "#000"; g2.strokeText(b.txt, 0, 0); g2.fillStyle = b.team === "home" ? "#fff" : AC.hi; g2.fillText(b.txt, 0, 0); g2.restore(); }
  // drum shock rings (screen space)
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t > 0.6) { rings.splice(i, 1); continue; } const d = drums[r.team].g.position, s = toScreen(d.x, d.y, d.z); if (!s) continue;
    g2.beginPath(); g2.ellipse(s.x, s.y, 10 + r.t * 120, 5 + r.t * 50, 0, 0, 7); g2.lineWidth = 5 * (1 - r.t / 0.6); g2.strokeStyle = r.team === "home" ? "rgba(255,255,255,.9)" : "rgba(255,204,34,.9)"; g2.stroke(); }
  // popup animation (driven by game time so the share clip is smooth)
  const pe = $("pop"), pk = state.time - popT;
  if (pk < popDur) { const inK = Math.min(1, pk / 0.25), outK = Math.min(1, (popDur - pk) / 0.3); const sc = inK < 1 ? 0.3 + inK * 0.9 : 1.2 - Math.min(0.2, (pk - 0.25) * 0.8) + Math.sin(pk * 10) * 0.02;
    pe.style.opacity = Math.min(inK, outK); pe.style.transform = "scale(" + sc.toFixed(3) + ") rotate(-3deg)"; } else { pe.style.opacity = 0; if (popQ.length) { const q = popQ.shift(); popPrio = 0; showPop.apply(null, q); } }
  // celebration prompt after a goal
  const ce = $("celebrate"), ck = state.time - celebT;
  if (ck > 1.2 && ck < 9 && celebTeam) { if (ce.dataset.team !== celebTeam + CONFIG.lang) { ce.innerHTML = "<div>" + T("celebH") + "</div><div class='a'>" + T("celebA", { t: tShort(other(celebTeam)) }) + "</div>"; ce.dataset.team = celebTeam + CONFIG.lang; } ce.style.opacity = Math.min(1, (ck - 1.2) * 3, (9 - ck) * 2); ce.style.transform = "translateY(" + (Math.sin(ck * 4) * 3).toFixed(1) + "px)"; } else ce.style.opacity = 0;
  const cardK = state.time - cardT; $("card").style.background = cardColor; $("card").style.opacity = cardK < 2.2 ? Math.min(1, cardK * 4, (2.2 - cardK) * 3) : 0; $("card").style.transform = "rotate(" + (8 + Math.sin(cardK * 6) * 4) + "deg)";
  // team-pick prompt + attack banner (game-time driven)
  const pk2 = state.time - promptT, pr = $("prompt"), pop2 = pk2 < promptDur ? Math.min(1, pk2 * 5, (promptDur - pk2) * 4) : 0; pr.style.opacity = pop2;
  const prOn = pop2 > 0 && !!pr.textContent; pr.style.display = prOn ? "block" : "none";          // C5: no empty box between flushes
  if (prOn) { const sp = $("soundpill"); pr.style.bottom = sp.offsetParent ? (parseFloat(getComputedStyle(sp).bottom) + sp.offsetHeight + 8) + "px" : ""; }   // B2: stacked above the sound pill
  const at = $("attack"); const att = state.phase === "play" ? TEAMS.find(inAttack) : null;
  if (att) { const txt = T("attack", { t: tName(att) }) + " " + Math.round(goalChance(att) * 100) + "%"; if (at.textContent !== txt) at.textContent = txt; at.className = att; at.style.opacity = 0.95; } else at.style.opacity = 0;
}
/* ================= HUD + labels ================= */
const labelPool = [];
function updateLabels() {
  const root = $("labels"), t = state.time, all = teamFans.home.concat(teamFans.away);
  const topG = all.filter(f => f.mGiftPts > 0).sort((a, b) => b.mGiftPts - a.mGiftPts).slice(0, 2);
  const prio = f => (f.hotUntil > t ? 1e6 : 0) + (topG.includes(f) ? 5e5 : 0) + f.mPts * 100 + f.joinT;
  const cand = all.slice().sort((a, b) => prio(b) - prio(a)).slice(0, 60);
  const placed = []; let shown = 0;
  while (labelPool.length < CONFIG.labels) { const d = document.createElement("div"); d.className = "lab"; root.appendChild(d); labelPool.push(d); }
  const chosen = [];
  for (const f of cand) {
    if (shown >= CONFIG.labels) break;
    const s = toScreen(f._hx || f.seat.x, f._hy || f.seat.y + 2, f._hz || f.seat.z); if (!s) continue;
    const hot = f.hotUntil > t, say = f.sayUntil > t;
    const w = Math.min(104, f.name.length * (hot ? 7 : 6) + 14), h = (hot ? 18 : 14) + (say ? 11 : 0);
    const r = { x: s.x - w / 2, y: s.y - h, w, h };
    if (r.y < 120 || r.y > H - 110) continue;
    if (placed.some(p => r.x < p.x + p.w + 2 && r.x + r.w + 2 > p.x && r.y < p.y + p.h + 1 && r.y + r.h + 1 > p.y)) continue;   // no overlapping name tags
    placed.push(r); chosen.push({ f, s, hot, say }); shown++;
  }
  labelPool.forEach((el, i) => {
    const c = chosen[i]; if (!c) { el.style.display = "none"; return; }
    const { f, s, hot, say } = c, am = topG.includes(f);
    const cls = "lab " + f.team + (hot ? " hot" : "") + (am ? " amigo" : "");
    const txt = (am ? "🎁 " : "") + f.name, sayT = say ? f.say : "";
    if (el.className !== cls) el.className = cls;
    const key = txt + "|" + sayT; if (el._k !== key) { el._k = key; el.innerHTML = ""; el.appendChild(document.createTextNode(txt)); if (sayT) { const sp = document.createElement("span"); sp.className = "say"; sp.textContent = "“" + sayT + "”"; el.appendChild(sp); } }
    el.style.display = "block"; el.style.transform = "translate(" + (s.x - el.offsetWidth / 2).toFixed(0) + "px," + (s.y - el.offsetHeight).toFixed(0) + "px)";
  });
}
const escH = s => String(s).replace(/[<>&"]/g, "");
function refreshHUD() {
  $("goals").textContent = state.goals.home + " - " + state.goals.away;
  const stop = state.minute >= CONFIG.matchMinutes && (state.penQ.length || state.phase === "penalty");
  $("clock").textContent = state.phase === "ft" ? T("ft") : (state.minute >= CONFIG.matchMinutes ? "90+'" : Math.floor(state.minute) + "'") + (stop ? " " + T("stoppage") : "");
  $("serieschip").textContent = T("series", { m: state.matchNo, h: state.series.home, a: state.series.away }) + (state.series.draw ? " (" + state.series.draw + "🤝)" : "");
  TEAMS.forEach(t => {
    const v = Math.round(state.chant[t]); $("fill-" + t).style.width = v + "%";
    $("lbl-" + t).innerHTML = (v > 70 ? "🔥 " : "📣 ") + v + "%<b>" + T("chance", { p: Math.round(goalChance(t) * 100) }) + "</b>";
    const off = Math.min(3, state.offence[t]); $("cnt-" + t).textContent = teamFans[t].length + " " + T("fans") + (off ? " · ⚠️" + ["💬", "🟨", "⛔"].slice(0, off).join("") : "");   // visible warning chips
  });
  $("knob").style.left = (50 + state.momentum * 46) + "%";
  // rankings: this match (8 s) / whole night (4 s)
  const night = (state.time % 12) > 8;
  $("board-t").textContent = night ? T("boardN") : T("boardM");
  let rows;
  if (night) rows = [...nightBook.values()].sort((a, b) => b.pts - a.pts).slice(0, 4).map(r => ({ name: r.name, team: r.team, pts: r.pts }));
  else rows = topFans(teamFans.home.concat(teamFans.away), "mPts", 4).map(f => ({ name: f.name, team: f.team, pts: f.mPts }));
  $("board-rows").innerHTML = rows.map((f, i) => "<div class='row " + f.team + "'><span>" + ["🥇", "🥈", "🥉", "4."][i] + " " + escH(f.name) + "</span><span>" + Math.round(f.pts) + "</span></div>").join("");
  // throw risk, visible all the time
  const R = CONFIG.throwRule;
  $("risk").innerHTML = TEAMS.map(t => {
    const n = state.throws[t].filter(x => state.time - x <= R.window).length, off = state.offence[t], ban = state.banUntil[t] - state.time;
    if (ban > 0) return "<div class='ban'>⛔ " + tShort(t) + " " + T("banned", { t: "", s: Math.ceil(ban) }).trim() + "</div>";
    const cool = state.coolUntil[t] - state.time;
    if (cool > 0) return "<div>🍾 " + tShort(t) + " ⏳ " + Math.ceil(cool) + (EN() ? " s" : " sn") + "</div>";
    const next = nextOffence(t);
    return "<div class='" + (n >= R.limit - 1 ? "hot" : "") + "'>" + (n >= R.limit - 1 ? "👀 " : "🍾 ") + tShort(t) + " " + n + "/" + R.limit + " → " + next + "</div>";
  }).join("");
  $("penq").innerHTML = state.penQ.map(p => "<div>" + T("penQ", { t: tShort(p.team) }) + " · @" + escH(p.by) + "</div>").join("");
  // batched gift ticker
  const recent = [...giftAgg.values()].filter(a => state.time - a.t < 3).sort((a, b) => b.t - a.t).slice(0, 2);
  $("gifts").innerHTML = recent.map(a => "<div>🎁 @" + escH(a.f.name) + " · " + escH(a.gname) + (a.count > 1 ? " <b>x" + a.count + "</b>" : "") + "</div>").join("");
  for (const [k, a] of giftAgg) if (state.time - a.t > 10) giftAgg.delete(k);
  if (state.phase === "ft") { const nx = $("ft-next"); if (nx) nx.textContent = T("next", { s: Math.max(0, Math.ceil(CONFIG.ftSec - state.phaseT)) }); }
  if (liveState === "fail") setLive("fail", "tick");
  refreshSoundUI();
  if (state.time - saveT > 10) { saveT = state.time; persist(); }
}
function applyLang() {
  $("venue").textContent = T("venue"); $("mom-t").textContent = T("mom");
  $("lg-home").textContent = T("lgH"); $("lg-home2").textContent = T("lgH2"); $("lg-away").textContent = T("lgA"); $("lg-away2").textContent = T("lgA2");
  $("acts").innerHTML = T("acts").map(a => "<div><i>" + a[0] + "</i>" + a[1] + "<em>" + a[2] + "</em></div>").join("");
  $("rule").textContent = T("throwRule"); $("soundpill").textContent = T("soundTap");
  TEAMS.forEach(t => { $("name-" + t).firstChild.textContent = tName(t); });
  const U = T("ui"); document.documentElement.lang = CONFIG.lang;
  document.querySelectorAll("[data-i]").forEach(el => { const v = U[el.dataset.i]; if (typeof v === "string") { if (el.dataset.html) el.innerHTML = v; else el.textContent = v; } });
  $("mute").title = U.mute; $("panel-btn").title = U.panelBtn; $("btn-pause").textContent = state.paused ? U.resume : U.pause;
  $("help").innerHTML = "<h3>" + U.helpT + "</h3>" + U.help.map(h => "<div><b>" + h[0] + "</b> " + h[1] + "</div>").join("") + "<div class='c'>" + U.close + " · " + CONFIG.version + "</div>";
  const chips = $("chips"); chips.innerHTML = "";
  (EN() ? ["1", "2", "Come on!", "drum", "torch", "bottle", "lighter"] : ["1", "2", "Haydi!", "davul", "meşale", "şişe", "çakmak"]).forEach(k => { const b = document.createElement("button"); b.textContent = k; b.onclick = () => { $("fake-comment").value = k; $("btn-send").click(); }; chips.appendChild(b); });
  if (promptMake) $("prompt").textContent = promptMake();
  $("deskhint").textContent = T("deskHint");
  $("celebrate").dataset.team = ""; $("replay-t").textContent = T("replay"); if (WX.scoreCanvas) drawScoreboard(true);
  if (liveState) setLive(liveState);
  if (state.phase === "ft") renderFullTimePanel();
}
function drawCrest(t) {
  const g = $("crest-" + t).getContext("2d"), C = CONFIG.teams[t];
  g.clearRect(0, 0, 80, 92); g.beginPath(); g.moveTo(40, 3); g.lineTo(76, 14); g.lineTo(76, 46); g.quadraticCurveTo(74, 76, 40, 89); g.quadraticCurveTo(6, 76, 4, 46); g.lineTo(4, 14); g.closePath();
  g.save(); g.clip();
  if (t === "home") { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#fff" : "#111"; g.fillRect(4 + i * 12, 0, 12, 92); } }
  else { g.fillStyle = C.kit[0]; g.fillRect(0, 0, 80, 92); g.fillStyle = C.kit[1]; g.fillRect(0, 36, 80, 18); }
  g.restore(); g.lineWidth = 5; g.strokeStyle = t === "home" ? "#fff" : AC.hi; g.stroke();
  g.fillStyle = t === "home" ? "#ffd75e" : "#fff"; g.font = "900 30px Trebuchet MS"; g.textAlign = "center"; g.lineWidth = 4; g.strokeStyle = "#000"; g.strokeText("★", 40, 56); g.fillText("★", 40, 56);
}


/* ================= bots (demo crowd, capped joins) ================= */
const BOT_NAMES = ["kartal_34", "bosphorus_boy", "sarıyer.can", "ayse.k", "mert1903", "deniz_tr", "emre_ist", "zeynep.fan", "burak_10", "selin_s", "can.boga", "ozan_k", "elif_99", "kerem7", "ece.live", "hakan_dj", "baris.t", "melis_m", "arda_g", "sinan.kaleci", "tuba_x", "volkan.def", "irem_ii", "koray_k", "ahmet_usta", "nehir_n", "efe_bjk", "yusuf.y", "gizem.g", "onur_on", "derya.d", "tolga_tt", "ceren.cc", "serkan_s", "pinar.p", "ugur_u", "berk_b", "duru.d", "kaan_k", "aslı_a"];
let botN = 0;
const BOT_FIRST = ["ali", "veli", "cem", "nil", "ada", "eda", "oya", "umut", "sena", "ilker", "batu", "doga", "ege", "alp", "ipek", "lale", "gul", "tan", "tarik", "yigit", "beren", "cansu", "emir", "ozge", "rana", "sevda", "kutay", "mina", "aras", "ela"];
const BOT_TAIL = ["34", ".ist", "1903", ".besiktas", "_tribun", ".kadikoy", "06", ".live", "_bjk", ".sahil", "35", "_kartal", ".fan", "07", "_izmir"];
const botName = i => i < BOT_NAMES.length ? BOT_NAMES[i] : (() => { const j = i - BOT_NAMES.length, F = BOT_FIRST.length, k = Math.floor(j / F); return BOT_FIRST[j % F] + BOT_TAIL[k % BOT_TAIL.length] + (k >= BOT_TAIL.length ? "x".repeat(Math.floor(k / BOT_TAIL.length)) : ""); })();
function botEvent() {
  const r = Math.random(), joinedAll = teamFans.home.concat(teamFans.away).filter(f => String(f.id).startsWith("bot"));
  if (botN < CONFIG.demo.maxJoins && (joinedAll.length < 24 || r < 0.08)) {
    const i = botN++, id = "bot" + i, name = botName(i), side = Math.random() < (state.goals.home <= state.goals.away ? 0.55 : 0.45) ? "1" : "2";
    if (Math.random() < 0.2) { handleLiveEvent({ type: "like", userId: id, username: name, likeCount: 3 }); later(rnd(1.5, 3), () => handleLiveEvent({ type: "chat", userId: id, username: name, comment: side })); }   // undecided viewer → gets the pick prompt first
    else handleLiveEvent({ type: "chat", userId: id, username: name, comment: Math.random() < 0.5 ? side : (side === "1" ? "home" : "away") });
    return;
  }
  if (!joinedAll.length) return;
  const f = joinedAll[Math.floor(Math.random() * joinedAll.length)];
  const ce = state.time - celebT < 8 && celebTeam;
  if (ce && f.team === celebTeam && Math.random() < 0.3) { handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: Math.random() < 0.5 ? "davul" : "meşale" }); return; }
  const cautious = state.throws[f.team].filter(x => state.time - x <= CONFIG.throwRule.window).length >= CONFIG.throwRule.limit - 1 || state.time < state.banUntil[f.team] || state.time < state.coolUntil[f.team];
  if (ce && f.team !== celebTeam && !cautious && Math.random() < 0.1) { handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: Math.random() < 0.5 ? "şişe" : "çakmak" }); return; }
  if (r < 0.55) { const lines = f.team === "home" ? ["Haydi Kartal!", "En büyük biziz!", "Vur gol!", "Hadi çocuklar", "Şampiyon!", "Ole ole", "Bu akşam bizim"] : ["Deplasmanda biz varız!", "Vur!", "Hadi!", "Gol gol gol", "Kazanacağız", "Ole!"];
    handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: lines[Math.floor(Math.random() * lines.length)] }); }
  else if (r < 0.85) handleLiveEvent({ type: "like", userId: f.id, username: f.name, likeCount: 1 + Math.floor(Math.random() * 5) });
  else if (r < 0.97) handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Rose", diamondCount: 1, repeatCount: 1 });
  else if (r < 0.995) handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Donut", diamondCount: 30 });
  else handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Party", diamondCount: 300 });
}
let botAcc = 0, botOn = false;
function seedCrowd(n) { for (let i = 0; i < n; i++) { const t = i % 2 ? "away" : "home"; const id = "bot" + botN, name = botName(botN); botN++; const f = addFan(id, name, t); if (f) f.joinT = -5; } }
window.__seedCrowd = seedCrowd;

/* ================= Playroom TikTok LIVE bridge (?live=1) with honest status ================= */
let liveState = null, lastLiveEvt = -1, liveConnectedAt = -1;
let liveTry = 0, liveRetryAt = 0, liveTimer = null; window.__liveAttempts = [];
// The documented Playroom event listener returns an unsubscribe function.
// Generation gates also suppress stale callbacks if a transport cannot unsubscribe.
let liveGeneration = 0, liveUnsubscribe = null, disconnectUnsubscribe = null;
function clearLiveSubscriptions() {
  for (const off of [liveUnsubscribe, disconnectUnsubscribe]) {
    if (typeof off === "function") { try { off(); } catch (e) { console.warn("[LIVE] unsubscribe", e); } }
  }
  liveUnsubscribe = null;
  disconnectUnsubscribe = null;
}
const RETRY_SCALE = +(Q.get("retryScale") || 1);   // test hook: shrink the backoff delays
function setLive(st, extra) {
  const tick = extra === "tick"; liveState = st; window.__liveStatus = st;
  const el = $("livepill"); el.style.display = "block";
  let txt = { connecting: T("liveConnecting"), ok: T("liveOk"), fail: T("liveFail"), lost: T("liveLost"), quiet: T("liveQuiet", { s: tick ? 90 : extra || 90 }) }[st] || st;
  const tap = (st === "fail" && liveTry >= CONFIG.live.maxTries) || st === "lost";
  if (st === "fail" && !tap && liveRetryAt) txt += T("liveRetryIn", { s: Math.max(0, Math.ceil((liveRetryAt - performance.now()) / 1000)), i: liveTry, n: CONFIG.live.maxTries });
  if (tap) txt += st === "lost" ? T("liveReload") : T("liveTap");
  if (el.textContent !== txt) el.textContent = txt;
  el.className = (st === "fail" || st === "lost" ? "bad" : st === "quiet" ? "warn" : "") + (tap ? " tap" : "");
  window.__liveTap = tap;
  if ((st === "fail" || st === "lost") && !tick) console.warn("[LIVE]", st);
}
function liveWatchdog() {
  if (liveState === "ok" || liveState === "quiet") {
    const since = state.time - Math.max(lastLiveEvt, liveConnectedAt);
    if (since > 90 && liveState === "ok") setLive("quiet", Math.round(since));
    else if (since <= 90 && liveState === "quiet") setLive("ok");
  }
}
async function tryConnectPlayroom(manual) {
  if (Q.get("live") !== "1") return;
  if (manual) liveTry = 0;
  const generation = ++liveGeneration;
  clearTimeout(liveTimer); liveRetryAt = 0; clearLiveSubscriptions();
  liveTry++; window.__liveAttempts.push(performance.now());
  setLive("connecting");
  try {
    const src = window.__bridgeSrc || Q.get("bridgeSrc") || "https://cdn.joinplayroom.com/playroomkit/multiplayer.full.umd.js";
    document.querySelectorAll("script[data-bridge]").forEach(s => s.remove());
    await new Promise((res, rej) => { const s = document.createElement("script"); s.dataset.bridge = "1"; s.src = src; s.onload = res; s.onerror = () => rej(new Error("bridge script failed to load")); document.head.appendChild(s); setTimeout(() => rej(new Error("bridge load timeout")), 20000); });
    const mod = window.Playroom || window.PlayroomKit || window;
    const insertCoin = mod.insertCoin || window.insertCoin, onTikTokLiveEvent = mod.onTikTokLiveEvent || window.onTikTokLiveEvent, onDisconnect = mod.onDisconnect || window.onDisconnect;
    if (typeof insertCoin !== "function" || typeof onTikTokLiveEvent !== "function") throw new Error("Playroom API not found");
    await Promise.race([insertCoin({ liveMode: "tiktok" }), new Promise((_, rej) => setTimeout(() => rej(new Error("insertCoin timeout")), 60000))]);
    if (generation !== liveGeneration) return; // an older attempt finished too late
    const off = onTikTokLiveEvent((event) => {
      if (generation !== liveGeneration) return;
      const d = (event && event.data) || {}, raw = String((event && event.type) || "").toLowerCase();
      if (!["gift", "chat", "like"].includes(raw)) return; // follows/shares must not become free chants
      if (!d.userId) { console.warn("[LIVE] ignored event without stable viewer ID"); return; }
      const mapped = {
        type: raw, source: "tiktok",
        eventId: d.msgId || d.eventId || null,
        userId: String(d.userId),
        username: d.name || d.username || d.nickName || d.uniqueId || "viewer",
        comment: d.comment || d.content || "",
        giftName: d.giftName || "",
        diamondCount: d.giftDiamondCount ?? d.diamondCount ?? d.giftValue,
        repeatCount: d.repeatCount ?? 1,
        likeCount: d.likeCount ?? 1,
        streakId: d.streakId || d.comboId || d.groupId || ""
      };
      handleLiveEvent(mapped);
      if (liveState !== "ok") setLive("ok");
    });
    liveUnsubscribe = typeof off === "function" ? off : null;
    if (typeof onDisconnect === "function") {
      const offDisconnect = onDisconnect(() => {
        if (generation === liveGeneration) setLive("lost");
      });
      disconnectUnsubscribe = typeof offDisconnect === "function" ? offDisconnect : null;
    }
    liveConnectedAt = state.time; setLive("ok");
  } catch (e) {
    if (generation !== liveGeneration) return;
    clearLiveSubscriptions();
    console.warn("[Playroom] not connected (try " + liveTry + "):", e && e.message);
    if (liveTry < CONFIG.live.maxTries) { const B = CONFIG.live.backoff, d = B[Math.min(liveTry - 1, B.length - 1)] * 1000 * RETRY_SCALE; (window.__liveDelays = window.__liveDelays || []).push(d); liveRetryAt = performance.now() + d; liveTimer = setTimeout(() => tryConnectPlayroom(false), d); }
    setLive("fail");
  }
}
/* ================= camera, layout, loop, boot ================= */
function fit() {
  const sizer = $("stage-sizer"), stage = $("stage"), app = $("app"), panel = $("test-panel");
  const panelOn = !document.body.classList.contains("panel-hidden") && !IS_MOBILE;
  const tight = IS_MOBILE || CLIP; let availW = app.clientWidth - (tight ? 0 : 20), availH = app.clientHeight - (tight ? 0 : 20);
  if (panelOn) availW -= panel.offsetWidth + 16;
  let nh = 960;
  if ((IS_MOBILE || window.innerWidth < 700) && !CLIP && availW > 0) nh = Math.round(clamp(W * availH / availW, 860, 1200));
  if (nh !== H) { H = nh; stage.style.height = H + "px"; fx2.height = H; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  const s = Math.min(Math.max(160, availW) / W, availH / H);
  sizer.style.width = W * s + "px"; sizer.style.height = H * s + "px"; stage.style.transform = "scale(" + s + ")";
  const margin = (app.clientWidth - W * s - (panelOn ? panel.offsetWidth + 16 : 0)) / 2;
  document.body.classList.toggle("wide", !IS_MOBILE && !CLIP && margin > 230);   // desktop: "phone view · OBS overlay" hint in the margin
}
let CAMX = +(Q.get("cx") || -34), CAMY = +(Q.get("cy") || 60), LOOKX = +(Q.get("lx") || 4.5), CAMFOV = +(Q.get("fov") || 52);
const FOVP = +(Q.get("fp") || 0.9), LOOKK = +(Q.get("lk") || 40);
const INTRO = +(Q.get("intro") || 2.6); let introStart = 0, introHold = false;
function updateCamera(dt) {
  const t = state.time, bz = state.ballZ;
  const tall = Math.max(1, (H / W) / (960 / 540)); let fov = CAMFOV * Math.pow(tall, FOVP);   // tall phones: keep both goals in view, spend the extra height on the Bosphorus instead of empty terrace
  camPos.set(CAMX + Math.sin(t * 0.15) * 1.5, CAMY, bz * 0.25 * (2 - tall) + Math.sin(t * 0.11) * 1.5); camLook.set(LOOKX + (tall - 1) * LOOKK, 0, bz * 0.28 * (2 - tall));
  let snap = false;
  if (replay.on && replay.ball) { const b = replay.ball, d = attackDir(state.lastScorer || "home"); camPos.set(b.bx - 15, 15, b.bz - d * 6); camLook.set(b.bx + 2 + (tall - 1) * 6, 0.4, b.bz + d * 1.5); fov = CAMFOV * 0.66; snap = camera.position.x > 1e8; }
  else if (state.phase === "celebrate" && state.phaseT < 2.4 && scorer) { camPos.set(scorer.x - 24, 34, scorer.z * 0.8); camLook.set(scorer.x + 3 + (tall - 1) * LOOKK * 0.6, 0, scorer.z * 0.9); fov = CAMFOV * 0.85; }
  else if (state.phase === "celebrate" && camera.position.x > 1e8) snap = true;
  if (state.shake > 0) { camPos.x += (Math.random() - 0.5) * state.shake * 1.4; camPos.y += (Math.random() - 0.5) * state.shake; state.shake = Math.max(0, state.shake - dt * 1.5); }
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const ik = introHold ? 0 : (state.time - introStart) / INTRO;
  if (ik < 1) { const k = ik * ik * (3 - 2 * ik); camera.position.set(lerp(-6, camPos.x, k), lerp(15, camPos.y, k), lerp(-4, camPos.z, k)); camTarget.set(lerp(70, camLook.x, k), lerp(9, 0, k), lerp(6, camLook.z, k));
    camera.up.set(k, 1 - k, 0).normalize(); camera.lookAt(camTarget); return; }
  camera.up.set(1, 0, 0);
  if (snap) { camera.position.copy(camPos); camTarget.copy(camLook); }
  const ck = Math.min(1, dt * (replay.on ? 6 : 1.6)); camera.position.lerp(camPos, ck); camTarget.lerp(camLook, ck); camera.lookAt(camTarget);
}
/* quality: measured fps -> auto downgrade (high -> med -> low), never flaps back up after a downgrade */
const QUAL = { acc: 0, frames: 0, lowWin: 0, highWin: 0, downs: 0, locked: false, fps: 0 };
function applyQuality(l, why) {
  CONFIG.quality.level = l; window.__quality = CONFIG.quality.names[l];
  renderer.setPixelRatio(l === 2 ? Math.min(2, window.devicePixelRatio || 1) : l === 1 ? Math.min(1.25, window.devicePixelRatio || 1) : 0.75); renderer.setSize(W, H, false);
  setWorldQuality(l); if (why) logLine(T("qual", { q: T("qn")[l], f: Math.round(QUAL.fps) }));
}
function qualityMonitor(raw) {
  if (QUAL.locked || raw > 0.2) return;            // ignore hidden-tab gaps
  QUAL.acc += raw; QUAL.frames++;
  if (QUAL.acc < 2) return;
  QUAL.fps = QUAL.frames / QUAL.acc; window.__fps = Math.round(QUAL.fps * 10) / 10; QUAL.acc = 0; QUAL.frames = 0;
  const l = CONFIG.quality.level;
  if (QUAL.fps < CONFIG.quality.minFps) { QUAL.lowWin++; QUAL.highWin = 0; if (QUAL.lowWin >= 2 && l > 0) { QUAL.lowWin = 0; QUAL.downs++; applyQuality(l - 1, true); } }
  else { QUAL.lowWin = 0; if (QUAL.fps > 57 && QUAL.downs === 0 && l < 2) { if (++QUAL.highWin >= 5) { QUAL.highWin = 0; applyQuality(l + 1, true); } } }
}
window.__qualityMonitor = qualityMonitor;
let hudAcc = 0, fx2Acc = 0;
const RSKIP = Math.max(0, Number(Q.get("rskip")) || 0); let rFrame = 0;   // test-only: GPU-render every Nth frame (logic, labels and HUD still run every frame)
function step(dt, noDraw) {
  state.time += dt;
  if (botOn) { botAcc += dt * (Number($("bot-rate").value) || 8); while (botAcc >= 1) { botAcc--; botEvent(); } }
  drumTick(); flushJoins(); flushPicks(); liveWatchdog();
  updateMatch(dt); updatePlayers(dt, state.time, noDraw); updateWorld2(dt, state.time, noDraw); updateFans(state.time); updateFX(dt, state.time); updateCity(state.time);
  [-1, 1].forEach(s => { const n = goals[s].net; if (n.userData.shake > 0) { n.userData.shake -= dt; n.scale.z = 1 + Math.sin(state.time * 40) * 0.15 * n.userData.shake; } else n.scale.z = 1; });
  if (crowdGain && !state.muted) crowdGain.gain.value = 0.04 + (state.chant.home + state.chant.away) / 200 * 0.22 + (state.phase === "celebrate" ? 0.15 : 0);
  if (noDraw) { fx2Acc += dt; return; }
  updateReplay(); updateCamera(dt + fx2Acc);
  if (!RSKIP || ++rFrame % RSKIP === 0) { renderer.render(scene, camera); window.__calls = renderer.info.render.calls; }
  updateLabels(); updateFX2(dt + fx2Acc); fx2Acc = 0;
  hudAcc += dt; if (hudAcc > 0.2) { hudAcc = 0; refreshHUD(); }
}
window.__step = function (n, dt) { for (let i = 0; i < n; i++) step(dt || 1 / 30, n > 1 && i < n - 1 && i % 4 !== 3); };   // multi-frame steps draw every 4th frame + the last (logic runs every step); __step(1) = one drawn frame (clip)
window.__soak = function (sec, dt) { dt = dt || 0.05; const n = Math.round(sec / dt); for (let i = 0; i < n; i++) step(dt, i < n - 1); };   // logic-only fast-forward for soak tests
window.__state = state; window.__users = users; window.__pending = pending; window.__nightBook = nightBook;
let lastT = 0;
// slow devices: up to 0.25 s per frame is simulated in ≤50 ms logic substeps and drawn once, so a 3-minute match stays 3 minutes (no slow motion);
// longer gaps (hidden tab) are not fast-forwarded
/* B4 (pass 3): the match runs on the wall clock. Time owed since the last frame is simulated in <=50 ms substeps, so a game-minute stays 2 s of real time
   even when rAF is throttled (occluded/slow tab: up to SIM.frameCap s caught up per drawn frame) or stopped (hidden tab: a timer catches up logic-only,
   nothing is rendered while hidden). Debt beyond SIM.maxDebt (e.g. a sleeping laptop) is dropped instead of fast-forwarding a whole match. */
const SIM = { sub: 0.05, frameCap: 2, maxDebt: 120, debt: 0, lastWall: 0 };
function advance(nowMs, draw) {
  const wall = nowMs / 1000, el = SIM.lastWall ? Math.max(0, wall - SIM.lastWall) : 1 / 60; SIM.lastWall = wall;
  if (state.paused) { SIM.debt = 0; return; }
  SIM.debt = Math.min(SIM.maxDebt, SIM.debt + el);
  const run = Math.min(SIM.debt, draw ? SIM.frameCap : SIM.maxDebt); if (run <= 0) return; SIM.debt -= run;
  try { const n = Math.ceil(run / SIM.sub - 1e-9), d = run / n; for (let i = 0; i < n; i++) step(d, !draw || i < n - 1); } catch (e) { console.error(e); }
}
window.__sim = SIM;
function tick(now) { const rawFull = (lastT ? now - lastT : 16) / 1000; lastT = now; qualityMonitor(rawFull);
  if (!document.hidden) advance(now, true);
  requestAnimationFrame(tick); }
setInterval(() => { if (document.hidden && !CLIP) advance(performance.now(), false); }, 500);   // hidden tab: rAF stops, the match keeps real time without rendering
document.addEventListener("visibilitychange", () => { if (!document.hidden) lastT = 0; });
function setPaused(p) { state.paused = p; $("btn-pause").textContent = p ? T("ui").resume : T("ui").pause; if (p) $("clock").textContent = "⏸ " + $("clock").textContent; }
function toggleHelp(on) { $("help").classList.toggle("on", on === undefined ? !$("help").classList.contains("on") : on); }
function setBot(on) {
  // A real broadcast must never be quietly mixed with synthetic gifts/likes.
  const allowed = Q.get("live") !== "1" || Q.get("host") === "1";
  botOn = Boolean(on && allowed);
  $("bot-toggle").checked = botOn;
  if (on && !allowed) console.warn("[LIVE] demo bots disabled in LIVE mode");
}
function boot() {
  buildSky(); buildPitch(); buildStands(); buildCity(); buildFans(); buildPlayers(); buildFX(); buildWorld2();
  { const qp = CONFIG.quality.names.indexOf(Q.get("q")); QUAL.locked = qp >= 0 || CLIP; applyQuality(qp >= 0 ? qp : CLIP ? 2 : IS_MOBILE ? 1 : 2); }
  TEAMS.forEach(drawCrest); if (Q.get("lang") === "en") CONFIG.lang = "en"; applyLang(); fit();
  claimWriter(); logLine(T("rivalTonight", { t: tName("away") }));
  camera.up.set(1, 0, 0); camera.position.set(CAMX, CAMY, 0); camTarget.set(LOOKX, 0, 0); camera.lookAt(camTarget);
  const who = () => { const n = $("fake-user").value.trim() || "pablo"; return { userId: "local:" + n.toLowerCase(), username: n }; };
  $("btn-send").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "chat", comment: $("fake-comment").value }, who()));
  $("fake-comment").addEventListener("keydown", e => { if (e.key === "Enter") $("btn-send").click(); });
  $("btn-like").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "like", likeCount: 5 }, who()));
  $("btn-rose").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "gift", giftName: "Rose", diamondCount: 1 }, who()));
  $("btn-med").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "gift", giftName: "Donut", diamondCount: 30 }, who()));
  $("btn-big").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "gift", giftName: "Party", diamondCount: 300 }, who()));
  $("btn-lion").onclick = () => handleLiveEvent(Object.assign({ source: "host", type: "gift", giftName: "Lion", diamondCount: 1500 }, who()));
  $("bot-rate").oninput = () => { $("bot-rate-val").textContent = $("bot-rate").value + "/s"; };
  $("bot-toggle").onchange = () => setBot($("bot-toggle").checked);
  $("mute").onclick = (e) => { e.stopPropagation(); if (!state.muted && audioState() !== "running") setMuted(false); else setMuted(!state.muted); };
  $("soundpill").onclick = (e) => { e.stopPropagation(); setMuted(false); };
  // honest sound: if sound was requested before any gesture (?sound=1), the FIRST pointer or key gesture anywhere resumes it
  const gesture = () => { if (!state.muted && audioState() !== "running") setMuted(false); };
  window.addEventListener("pointerdown", gesture, true); window.addEventListener("keydown", gesture, true);
  $("livepill").onclick = (e) => { e.stopPropagation(); if (liveState === "lost") location.reload(); else if (liveState === "fail") tryConnectPlayroom(true); };
  $("btn-pause").onclick = () => setPaused(!state.paused);
  $("btn-restart").onclick = () => { newMatch(true); };
  $("help").onclick = () => toggleHelp(false);
  if (Q.get("help") === "1") toggleHelp(true);
  $("btn-reset").onclick = () => { if (!window.confirm(CONFIG.lang === "tr" ? "Seri ve gece puanları silinsin mi?" : "Clear the series and tonight’s supporter scores?")) return; resetStore(); users.forEach(f => f.nPts = 0); refreshHUD(); };
  $("btn-newuser").onclick = () => { $("fake-user").value = "izleyici_" + Math.floor(Math.random() * 9000 + 1000); };
  $("panel-btn").onclick = (e) => { e.stopPropagation(); document.body.classList.toggle("panel-hidden"); fit(); };
  window.addEventListener("keydown", e => { if (/input|textarea/i.test(e.target.tagName)) return; const k = e.key.toLowerCase();
    if (k === "h") { document.body.classList.toggle("panel-hidden"); fit(); } else if (k === "m") { if (!state.muted && audioState() !== "running") setMuted(false); else setMuted(!state.muted); }
    else if (k === "l") { CONFIG.lang = CONFIG.lang === "tr" ? "en" : "tr"; applyLang(); refreshHUD(); } else if (k === "p") setPaused(!state.paused); else if (e.key === "?" || k === "/") toggleHelp(); });
  window.addEventListener("resize", fit);
  if (IS_MOBILE || window.innerWidth < 860 || Q.get("live") === "1") { document.body.classList.add("panel-hidden"); fit(); }
  if (Q.get("panel") === "0") { document.body.classList.add("panel-hidden"); fit(); }
  $("mute").style.display = "flex";
  if (!CLIP && Q.get("live") !== "1" && Q.get("bot") !== "1" && Q.get("demo") !== "0") {
    $("start").classList.add("on"); seedCrowd(CONFIG.demo.seed); introHold = true;
    $("start").addEventListener("click", () => { $("start").classList.remove("on"); setMuted(false); setBot(true); introHold = false; introStart = state.time; }, { once: true });
    setTimeout(() => $("playbtn").focus(), 0);   // real <button>: Enter/Space start the game
  }
  if (Q.get("seed")) seedCrowd(Number(Q.get("seed")));
  if (Q.get("bot") === "1") setBot(true);
  if (Q.get("sound") === "1") setMuted(false);
  tryConnectPlayroom();
  if (!CLIP) requestAnimationFrame(tick); else step(1 / 30);
}
boot();
