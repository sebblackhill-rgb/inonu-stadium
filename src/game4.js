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
function teamFromTokens(tk) {
  // a join must be short ("1", "ev sahibi", "2 dep!") or start with the team word, so "go home" style sentences don't seat people
  const hits = TEAMS.filter(t => hasKw(tk, CONFIG.teams[t].keywords));
  if (hits.length !== 1) return null;
  const short = tk.words.length <= 3;
  const first = tk.words.length ? CONFIG.teams[hits[0]].keywords.some(k => kwTokens(k).words && kwTokens(k).words[0] === tk.words[0]) : tk.emoji.length > 0;
  return (short || first) ? hits[0] : null;
}
function actionOf(tk) { for (const a of ["lighter", "bottle", "torch", "drum"]) if (hasKw(tk, CONFIG.actions[a])) return a; return null; }
window.__match = (comment) => { const tk = tokenize(comment); return { team: teamFromTokens(tk), action: actionOf(tk) }; };

/* ================= state additions ================= */
Object.assign(state, { penQ: [], pen: null, offence: { home: 0, away: 0 }, banUntil: { home: -1, away: -1 }, series: { home: 0, away: 0, draw: 0 }, matchNo: 1, lastShot: null });
const nightBook = new Map();       // userId -> {name, team, pts} for the whole night (session, persisted)
const pending = new Map();         // unassigned viewers: userId -> {name, likes, gifts:[{val, unit, giftName, t}], t}
try { const sv = JSON.parse(localStorage.getItem("inonu-series") || "null"); if (sv) Object.assign(state.series, sv); } catch (e) {}
try { const nb = JSON.parse(localStorage.getItem("inonu-night") || "null"); if (nb && Date.now() - nb.at < 8 * 3600e3) nb.rows.forEach(r => nightBook.set(r.id, r)); } catch (e) {}
let saveT = 0;
function persist() { try { localStorage.setItem("inonu-series", JSON.stringify(state.series)); localStorage.setItem("inonu-night", JSON.stringify({ at: Date.now(), rows: [...nightBook.entries()].map(([id, r]) => Object.assign({ id }, r)).sort((a, b) => b.pts - a.pts).slice(0, 300) })); } catch (e) {} }

/* ================= helpers ================= */
function addChant(team, v) { if (v > 0) { const gd = state.goals[team] - state.goals[other(team)]; v *= gd < 0 ? 1.3 : gd > 0 ? 0.85 : 1; if (state.phase === "celebrate") v *= 0.5; } state.chant[team] = clamp(state.chant[team] + v, 0, 100); }
function logLine(txt, team) { const el = document.createElement("div"); el.textContent = txt; if (team === "away") el.className = "away"; const L = $("log"); L.prepend(el); while (L.children.length > 5) L.lastChild.remove(); }
function addPts(f, v) { if (!(v > 0)) return; f.mPts += v; f.nPts += v; nightBook.set(f.id, { name: f.name, team: f.team, pts: f.nPts }); }
function goalChance(team) { const lvl = state.chant[team] / 100, mom = team === "home" ? state.momentum : -state.momentum; return clamp(0.2 + lvl * 0.5 + mom * 0.15, 0.15, 0.8); }
function inAttack(team) { return team === "home" ? state.ballZ < -PL * 0.5 : state.ballZ > PL * 0.5; }

/* join log batching + team-pick prompts */
const joinBuf = { home: [], away: [] }; let joinFlushT = 0;
function flushJoins() {
  if (state.time - joinFlushT < 1.5) return; joinFlushT = state.time; let any = false;
  TEAMS.forEach(t => { const b = joinBuf[t]; if (!b.length) return; any = true;
    if (b.length === 1) logLine(T("joined", { n: "@" + b[0], t: CONFIG.teams[t].short }), t);
    else logLine(T("joinedBatch", { k: b.length, t: CONFIG.teams[t].short, names: b.slice(0, 2).map(n => "@" + n).join(", ") + (b.length > 2 ? " +" + (b.length - 2) : "") }), t);
    b.length = 0; });
  if (any) sfx("pop");
}
const pickBuf = new Map(); let pickFlushT = 0, promptT = -9, promptDur = 0; const pickSeen = new Map();
function askPick(id, name, held) { const last = pickSeen.get(id) || -99; if (state.time - last < 8 && !held) return; pickSeen.set(id, state.time); pickBuf.set(id, { name, held: held || (pickBuf.get(id) || {}).held }); }
function flushPicks() {
  if (!pickBuf.size || state.time - pickFlushT < 2.6) return; pickFlushT = state.time;
  const arr = [...pickBuf.values()]; pickBuf.clear();
  const held = arr.find(a => a.held);
  let txt = held ? T("pickHeld", { n: held.name }) : T("pick", { n: arr[0].name });
  if (arr.length > 1) txt = txt.replace("@" + (held || arr[0]).name, "@" + (held || arr[0]).name + " +" + (arr.length - 1));
  $("prompt").textContent = txt; promptT = state.time; promptDur = 2.5;
}

/* ================= live events ================= */
let chantSfxT = { home: -9, away: -9 };
function fanChant(f, v, say) {
  f.chantUntil = state.time + 1.6; f.score += v; f.hotUntil = state.time + 2.5; addChant(f.team, v);
  if (state.time - f.lastChatPt >= CONFIG.points.chatEvery) { f.lastChatPt = state.time; addPts(f, 1); }
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
    if (state.time < state.banUntil[team]) { if (state.time - banLogT[team] > 4) { banLogT[team] = state.time; logLine("⛔ " + T("banned", { t: CONFIG.teams[team].short, s: Math.ceil(state.banUntil[team] - state.time) }), team); } return; }
    throwObject(f, kind); logLine(T(kind, { n }), team);
    addChant(other(team), -4);                                   // distracts the celebrating rivals...
    const arr = state.throws[team]; arr.push(state.time); while (arr.length && state.time - arr[0] > R.window) arr.shift();
    if (arr.length >= R.limit) { arr.length = 0; state.offence[team]++; const lvl = state.offence[team]; later(1.0, () => refereeWarning(team, lvl)); }   // ...but the ref is watching (explained ladder)
  }
}
let cardT = -9, cardColor = "#ffd400";
function refereeWarning(team, lvl) {
  const R = CONFIG.throwRule, tn = CONFIG.teams[team].name;
  state.warnings[team]++; sfx("whistle", 3);
  if (lvl <= 1) { showPop(T("warn1"), T("warn1s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#f2f2f2"; }
  else if (lvl === 2) { addChant(team, -R.yellowCost); showPop(T("warn2"), T("warn2s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#ffd400"; }
  else { state.banUntil[team] = state.time + R.banSec; showPop(T("warn3"), T("warn3s", { t: tn }), "warn", 2.4, "", 2); cardColor = "#e01b2f"; }
  cardT = state.time;
}
function joinFan(id, name, team) {
  const f = addFan(id, name, team); if (!f) return null;
  joinBuf[team].push(name); addChant(team, 2);
  const p = pending.get(id);
  if (p) { pending.delete(id);
    if (p.likes) { fanChant(f, Math.min(10, 0.5 * p.likes)); hearts.push({ f, t: 0 }); }
    p.gifts.filter(g => state.time - g.t < 180).forEach(g => applyGift(f, g.val, g.unit, g.giftName, 1));
    if (p.gifts.length) logLine(T("heldApplied", { n: name, t: CONFIG.teams[team].short }), team);
  }
  return f;
}
function holdForUnassigned(id, name, like, gift) {
  const p = pending.get(id) || { name, likes: 0, gifts: [], t: state.time };
  if (like) p.likes = Math.min(50, p.likes + like);
  if (gift) { p.gifts.push(Object.assign({ t: state.time }, gift)); if (p.gifts.length > 5) p.gifts.shift(); }
  p.t = state.time; pending.set(id, p);
  if (pending.size > 400) { const oldest = [...pending.entries()].sort((a, b) => a[1].t - b[1].t)[0]; pending.delete(oldest[0]); }
  askPick(id, name, !!gift);
}
window.handleLiveEvent = function (ev) {
  try {
    if (!ev) return;
    lastLiveEvt = state.time;
    const id = String(ev.userId || ev.uniqueId || ev.username || "anon"), name = String(ev.username || ev.nickname || id).replace(/^@/, "").slice(0, 18);
    let f = users.get(id);
    if (ev.type === "chat") {
      const tk = tokenize(ev.comment), jt = teamFromTokens(tk);
      if (!f) { if (jt) joinFan(id, name, jt); else askPick(id, name, false); return; }   // no seat until a team is chosen
      const act = actionOf(tk);
      if (act) doAction(f, act);
      else fanChant(f, jt ? 2.5 : 3, jt ? "" : ev.comment);
    } else if (ev.type === "like") {
      const n = Math.max(1, Math.min(15, Number(ev.likeCount || ev.count) || 1));
      if (!f) { holdForUnassigned(id, name, n, null); return; }
      fanChant(f, 0.5 * n); hearts.push({ f, t: 0 });
      if (state.time - f.likeWinT > 60) { f.likeWinT = state.time; f.likeWin = 0; }
      const pts = Math.min(CONFIG.points.likeCapPerMin - f.likeWin, CONFIG.points.likePts * n); if (pts > 0) { f.likeWin += pts; addPts(f, pts); }
    } else if (ev.type === "gift") {
      const unit = Number(ev.diamondCount || ev.giftValue) || 1, gname = String(ev.giftName || "gift");
      // streaks: repeatCount may be cumulative while a combo is running -> only count the new part
      const key = id + "|" + gname, agg = giftAgg.get(key), rc = Math.max(1, Number(ev.repeatCount) || 1);
      const delta = agg && state.time - agg.t < 4 && rc > agg.lastRepeat ? rc - agg.lastRepeat : (agg && state.time - agg.t < 4 && rc === agg.lastRepeat && rc > 1 ? 0 : rc);
      if (agg) agg.lastRepeat = rc;
      if (delta <= 0) return;
      if (!f) { holdForUnassigned(id, name, 0, { val: unit * delta, unit, giftName: gname }); return; }
      applyGift(f, unit * delta, unit, gname, delta, rc);
    }
  } catch (e) { console.error(e); }
};
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
function standWave(f) { addChant(f.team, 25); state.momentum = clamp(state.momentum + (f.team === "home" ? 0.35 : -0.35), -1, 1); teamFans[f.team].forEach(o => o.chantUntil = state.time + 3 + Math.abs(o.seat.z + 2) * 0.05); showPop(T("wave"), "@" + f.name + " 🌊", f.team, 1.8, "small", 1); for (let i = 0; i < 3; i++) hitDrum(f.team); }
function tifo(f) {
  const tf = tifos[f.team]; tf.start = state.time; tf.until = state.time + 5; addChant(f.team, 50); state.momentum = f.team === "home" ? 0.9 : -0.9;
  sfx("roar"); state.shake = 0.6;
  const queued = state.penQ.filter(p => p.team === f.team).length + (state.pen && state.pen.team === f.team ? 1 : 0);
  if (queued < 2) { state.penQ.push({ team: f.team, by: f.name, at: state.time }); showPop(T("tifo"), T("penBy", { n: f.name }) + " → " + T("pen"), f.team, 2.4, "", 2); }
  else showPop(T("tifo"), "@" + f.name, f.team, 2, "", 2);
}

/* ================= match engine ================= */
let shotCooldown = 2;
function startPenalty(p) {
  ballFly = null; state.pen = Object.assign({ kicked: false }, p); state.phase = "penalty"; state.phaseT = 0;
  const d = attackDir(p.team); state.ballX = 0; state.ballZ = d * (PL - 5.5); sfx("whistle", 1);
  showPop(T("pen"), T("penBy", { n: p.by }), p.team, 1.4, "small", 3);
}
function updateMatch(dt) {
  runTimers();
  TEAMS.forEach(t => { state.chant[t] = Math.max(0, state.chant[t] - dt * (3 + state.chant[t] * 0.07)); });
  if (state.phase === "intro") { if (!introHold && state.time - introStart > 1.2) { state.phase = "play"; sfx("whistle", 2); showPop(T("start"), "", "", 1.4, "small", 1); } return; }
  if (state.phase === "ft") { state.phaseT += dt; if (state.phaseT > 12) newMatch(); return; }
  if (state.minute < CONFIG.matchMinutes) state.minute = Math.min(CONFIG.matchMinutes, state.minute + dt / CONFIG.secondsPerMinute);
  if (state.phase === "celebrate") { state.phaseT += dt; if (state.phaseT > 6.5) { state.phase = "play"; resetPositions(); sfx("whistle", 1); state.chant[state.lastScorer] *= 0.55; } return; }
  if (state.phase === "penalty") { state.phaseT += dt; if (state.phaseT > 1.5 && !state.pen.kicked) { state.pen.kicked = true; const pt = state.pen.team; state.lastShot = { c: Math.round(state.chant[pt]), p: Math.round(CONFIG.penalty.conversion * 100), pen: true }; shoot(pt, Math.random() < CONFIG.penalty.conversion, true); } return; }
  if (state.phase !== "play") return;
  // queued penalties (from big gifts) are taken at the first open-play moment — never lost during celebrations/shots
  if (state.penQ.length && !ballFly) { startPenalty(state.penQ.shift()); return; }
  if (state.minute >= CONFIG.matchMinutes) { fullTime(); return; }
  const diff = (state.chant.home - state.chant.away) / 100;
  const target = clamp(diff * 2.2 + Math.sin(state.time * 0.41) * 0.5 + Math.sin(state.time * 0.13 + 1) * 0.3, -1, 1);
  state.momentum = clamp(lerp(state.momentum, target, dt * 0.8), -1, 1);
  const tz = -state.momentum * (PL - 2) + Math.sin(state.time * 1.3) * 2.5, tx = Math.sin(state.time * 0.8) * 5.5 + Math.sin(state.time * 2.1) * 1.5;
  state.ballZ = lerp(state.ballZ, tz, dt * 0.9); state.ballX = lerp(state.ballX, tx, dt * 1.2);
  shotCooldown -= dt;
  if (shotCooldown <= 0) TEAMS.forEach(t => {
    if (state.phase !== "play" || !inAttack(t)) return;
    const lvl = state.chant[t] / 100;
    if (Math.random() < dt * (0.5 + lvl * 1.5)) { shotCooldown = 2.2; const p = goalChance(t); state.lastShot = { c: Math.round(state.chant[t]), p: Math.round(p * 100) }; shoot(t, Math.random() < p); }
  });
}
function shotResult(bf) {
  state.pen = null;
  if (bf.scoreIt) goal(bf.team);
  else { showPop(Math.random() < 0.5 ? T("save") : T("miss"), state.lastShot ? T("goalWhy", state.lastShot) : "", bf.team, 1.3, "small", 1); sfx("groan"); state.phase = "play"; state.ballZ = attackDir(bf.team) * (PL - 8); state.momentum *= 0.4; }
}
function goal(team) {
  state.goals[team]++; state.lastScorer = team; state.phase = "celebrate"; state.phaseT = 0; state.shake = 1;
  showPop(T("goal"), T("scored", { t: CONFIG.teams[team].name }) + (state.lastShot ? "  " + T("goalWhy", state.lastShot) : ""), team, 3, "", 3);
  sfx("roar"); later(0.2, () => sfx("chant", team));
  goals[attackDir(team)].net.userData.shake = 1;
  teamFans[team].forEach(f => f.jumpUntil = state.time + rnd(3, 5));
  teamFans[other(team)].forEach(f => f.sadUntil = state.time + rnd(2.5, 4));
  addChant(team, 25); state.momentum = 0; celebT = state.time; celebTeam = team;
  confetti(team);
}
function topFans(list, key, n) { return list.filter(f => f[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, n); }
function fullTime() {
  state.phase = "ft"; state.phaseT = 0; sfx("whistle", 3); later(0.6, () => sfx("fanfare"));
  const h = state.goals.home, a = state.goals.away, w = h === a ? null : (h > a ? "home" : "away");
  if (w) state.series[w]++; else state.series.draw++;
  persist();
  if (w) { teamFans[w].forEach(f => f.jumpUntil = state.time + 10); teamFans[other(w)].forEach(f => f.sadUntil = state.time + 8); confetti(w); later(2, () => confetti(w)); }
  const all = teamFans.home.concat(teamFans.away);
  const motm = topFans(w ? teamFans[w] : all, "mPts", 1)[0], top = topFans(all, "mPts", 3);
  const esc = s => String(s).replace(/[<>&"]/g, "");
  const P = $("ftpanel");
  P.innerHTML = "<h2>" + T("ftTitle") + "</h2><div class='fs'><canvas id='ftc-home' width='80' height='92'></canvas><span class='n'>" + h + " - " + a + "</span><canvas id='ftc-away' width='80' height='92'></canvas></div>" +
    "<div class='win'>" + (w ? "🏆 " + T("wins", { t: CONFIG.teams[w].name }) : "🤝 " + T("draw")) + "</div>" +
    "<div class='ser'>" + T("seriesLine", { hn: CONFIG.teams.home.name, h: state.series.home, a: state.series.away, an: CONFIG.teams.away.name }) + (state.series.draw ? " · 🤝 " + state.series.draw : "") + "</div>" +
    (motm ? "<div class='motm'>⭐ " + T("motm") + ": @" + esc(motm.name) + " · " + Math.round(motm.mPts) + "</div>" : "") +
    "<div class='top'><div style='color:#ffd75e;font-size:11px;letter-spacing:1px'>" + T("top3") + "</div>" + top.map((f, i) => "<div>" + ["🥇", "🥈", "🥉"][i] + " @" + esc(f.name) + " (" + CONFIG.teams[f.team].short + ") · " + Math.round(f.mPts) + "</div>").join("") + "</div>" +
    "<div class='nx' id='ft-next'></div>";
  TEAMS.forEach(t => { const c = $("ftc-" + t); if (c) c.getContext("2d").drawImage($("crest-" + t), 0, 0); });
  P.style.display = "block";
  showPop(T("ft"), "", w || "", 1.6, "small", 4);
}
function newMatch() {
  state.goals.home = state.goals.away = 0; state.minute = 0; state.phaseT = 0; state.matchNo++;
  TEAMS.forEach(t => { state.chant[t] = 10; state.throws[t].length = 0; state.offence[t] = 0; state.banUntil[t] = -1; });
  state.momentum = 0; users.forEach(f => { f.mPts = 0; f.mGiftD = 0; f.mGiftPts = 0; });
  $("ftpanel").style.display = "none"; resetPositions(); state.phase = "play"; sfx("whistle", 2); showPop(T("start"), "#" + state.matchNo, "", 1.4, "small", 1);
}
/* ================= 2D overlay: popups, confetti, hearts, comic bursts ================= */
const fx2 = $("fx"), g2 = fx2.getContext("2d");
const confettiP = [], hearts = [], bursts = [];
let popT = -9, popDur = 0, popPrio = 0, celebT = -99, celebTeam = null; const popQ = [];
function showPop(big, sub, cls, dur, extra, prio) {
  prio = prio || 1;
  if (state.time - popT < popDur && popPrio > prio) { if (popQ.length < 3) popQ.push([big, sub, cls, dur, extra, prio]); return; }   // never hide a goal/penalty behind a smaller popup
  popPrio = prio; $("pop-big").textContent = big; $("pop-sub").textContent = sub || ""; $("pop-sub").style.display = sub ? "inline-block" : "none"; $("pop").className = (cls || "") + " " + (extra || ""); popT = state.time; popDur = dur || 2; }
function confetti(team) { const cols = team === "home" ? ["#fff", "#111", "#ddd", "#ffd75e"] : ["#e01b2f", "#ffcc22", "#fff", "#ff7a00"]; for (let i = 0; i < 140; i++) confettiP.push({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-40, 40), vy: rnd(120, 260), r: rnd(0, 6), vr: rnd(-8, 8), c: cols[i % cols.length], life: rnd(2.5, 4) }); }
function fxBurst(txt, team) { const ex = bursts.find(b => b.team === team && b.base === txt && b.t < 0.6); if (ex) { ex.n++; ex.txt = txt + " x" + ex.n; ex.t = Math.min(ex.t, 0.15); return; } const s = toScreen(drums[team].g.position.x, drums[team].g.position.y + 1.5, drums[team].g.position.z); if (s) bursts.push({ x: s.x, y: s.y, t: 0, txt, base: txt, n: 1, team }); }
const _v = new THREE.Vector3();
function toScreen(x, y, z) { _v.set(x, y, z).project(camera); if (_v.z > 1) return null; return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }
function updateFX2(dt) {
  g2.clearRect(0, 0, W, H);
  for (let i = confettiP.length - 1; i >= 0; i--) { const p = confettiP[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.life <= 0 || p.y > H) { confettiP.splice(i, 1); continue; }
    g2.save(); g2.translate(p.x, p.y); g2.rotate(p.r); g2.fillStyle = p.c; g2.fillRect(-4, -2.5, 8, 5); g2.restore(); }
  for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; if (h.t > 1.2) { hearts.splice(i, 1); continue; } const s = toScreen(h.f._hx, h.f._hy + h.t * 2, h.f._hz); if (!s) continue; g2.globalAlpha = 1 - h.t / 1.2; g2.font = "16px sans-serif"; g2.fillText("❤️", s.x - 8, s.y); g2.globalAlpha = 1; }
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += dt; if (b.t > 0.8) { bursts.splice(i, 1); continue; } const k = b.t / 0.8, sc = 0.6 + Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 0.7;
    g2.save(); g2.translate(b.x, b.y - k * 30); g2.scale(sc, sc); g2.rotate(-0.15); g2.globalAlpha = 1 - k * k; g2.font = "900 30px Trebuchet MS"; g2.textAlign = "center"; g2.lineWidth = 6; g2.strokeStyle = "#000"; g2.strokeText(b.txt, 0, 0); g2.fillStyle = b.team === "home" ? "#fff" : "#ffcc22"; g2.fillText(b.txt, 0, 0); g2.restore(); }
  // drum shock rings (screen space)
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t > 0.6) { rings.splice(i, 1); continue; } const d = drums[r.team].g.position, s = toScreen(d.x, d.y, d.z); if (!s) continue;
    g2.beginPath(); g2.ellipse(s.x, s.y, 10 + r.t * 120, 5 + r.t * 50, 0, 0, 7); g2.lineWidth = 5 * (1 - r.t / 0.6); g2.strokeStyle = r.team === "home" ? "rgba(255,255,255,.9)" : "rgba(255,204,34,.9)"; g2.stroke(); }
  // popup animation (driven by game time so the share clip is smooth)
  const pe = $("pop"), pk = state.time - popT;
  if (pk < popDur) { const inK = Math.min(1, pk / 0.25), outK = Math.min(1, (popDur - pk) / 0.3); const sc = inK < 1 ? 0.3 + inK * 0.9 : 1.2 - Math.min(0.2, (pk - 0.25) * 0.8) + Math.sin(pk * 10) * 0.02;
    pe.style.opacity = Math.min(inK, outK); pe.style.transform = "scale(" + sc.toFixed(3) + ") rotate(-3deg)"; } else { pe.style.opacity = 0; if (popQ.length) { const q = popQ.shift(); popPrio = 0; showPop.apply(null, q); } }
  // celebration prompt after a goal
  const ce = $("celebrate"), ck = state.time - celebT;
  if (ck > 1.2 && ck < 9 && celebTeam) { if (ce.dataset.team !== celebTeam + CONFIG.lang) { ce.innerHTML = "<div>" + T("celebH") + "</div><div class='a'>" + T("celebA", { t: CONFIG.teams[other(celebTeam)].short }) + "</div>"; ce.dataset.team = celebTeam + CONFIG.lang; } ce.style.opacity = Math.min(1, (ck - 1.2) * 3, (9 - ck) * 2); ce.style.transform = "translateY(" + (Math.sin(ck * 4) * 3).toFixed(1) + "px)"; } else ce.style.opacity = 0;
  const cardK = state.time - cardT; $("card").style.background = cardColor; $("card").style.opacity = cardK < 2.2 ? Math.min(1, cardK * 4, (2.2 - cardK) * 3) : 0; $("card").style.transform = "rotate(" + (8 + Math.sin(cardK * 6) * 4) + "deg)";
  // team-pick prompt + attack banner (game-time driven)
  const pk2 = state.time - promptT; $("prompt").style.opacity = pk2 < promptDur ? Math.min(1, pk2 * 5, (promptDur - pk2) * 4) : 0;
  const at = $("attack"); const att = state.phase === "play" ? TEAMS.find(inAttack) : null;
  if (att) { const txt = T("attack", { t: CONFIG.teams[att].name }) + " " + Math.round(goalChance(att) * 100) + "%"; if (at.textContent !== txt) at.textContent = txt; at.className = att; at.style.opacity = 0.95; } else at.style.opacity = 0;
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
  $("serieschip").textContent = T("series", { h: state.series.home, a: state.series.away }) + (state.series.draw ? " (" + state.series.draw + "🤝)" : "");
  TEAMS.forEach(t => {
    const v = Math.round(state.chant[t]); $("fill-" + t).style.width = v + "%";
    $("lbl-" + t).innerHTML = (v > 70 ? "🔥 " : "📣 ") + v + "%<b>" + T("chance", { p: Math.round(goalChance(t) * 100) }) + "</b>";
    $("cnt-" + t).textContent = teamFans[t].length + " " + T("fans");
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
    if (ban > 0) return "<div class='ban'>⛔ " + CONFIG.teams[t].short + " " + T("banned", { t: "", s: Math.ceil(ban) }).trim() + "</div>";
    const next = off === 0 ? T("warn1") : off === 1 ? T("warn2") : T("warn3");
    return "<div class='" + (n >= R.limit - 1 ? "hot" : "") + "'>🍾 " + CONFIG.teams[t].short + " " + n + "/" + R.limit + " → " + next + "</div>";
  }).join("");
  $("penq").innerHTML = state.penQ.map(p => "<div>" + T("penQ", { t: CONFIG.teams[p.team].short }) + " · @" + escH(p.by) + "</div>").join("");
  // batched gift ticker
  const recent = [...giftAgg.values()].filter(a => state.time - a.t < 3).sort((a, b) => b.t - a.t).slice(0, 2);
  $("gifts").innerHTML = recent.map(a => "<div>🎁 @" + escH(a.f.name) + " · " + escH(a.gname) + (a.count > 1 ? " <b>x" + a.count + "</b>" : "") + "</div>").join("");
  for (const [k, a] of giftAgg) if (state.time - a.t > 10) giftAgg.delete(k);
  if (state.phase === "ft") { const nx = $("ft-next"); if (nx) nx.textContent = T("next", { s: Math.max(0, Math.ceil(12 - state.phaseT)) }); }
  refreshSoundUI();
  if (state.time - saveT > 10) { saveT = state.time; persist(); }
}
function applyLang() {
  $("venue").textContent = T("venue"); $("mom-t").textContent = T("mom");
  $("lg-home").textContent = T("lgH"); $("lg-home2").textContent = T("lgH2"); $("lg-away").textContent = T("lgA"); $("lg-away2").textContent = T("lgA2");
  $("acts").innerHTML = T("acts").map(a => "<div><i>" + a[0] + "</i>" + a[1] + "<em>" + a[2] + "</em></div>").join("");
  $("rule").textContent = T("throwRule"); $("soundpill").textContent = T("soundTap");
  TEAMS.forEach(t => { $("name-" + t).firstChild.textContent = CONFIG.teams[t].name; });
  if (liveState) setLive(liveState);
}
function drawCrest(t) {
  const g = $("crest-" + t).getContext("2d"), C = CONFIG.teams[t];
  g.clearRect(0, 0, 80, 92); g.beginPath(); g.moveTo(40, 3); g.lineTo(76, 14); g.lineTo(76, 46); g.quadraticCurveTo(74, 76, 40, 89); g.quadraticCurveTo(6, 76, 4, 46); g.lineTo(4, 14); g.closePath();
  g.save(); g.clip();
  if (t === "home") { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#fff" : "#111"; g.fillRect(4 + i * 12, 0, 12, 92); } }
  else { g.fillStyle = C.kit[0]; g.fillRect(0, 0, 80, 92); g.fillStyle = C.kit[1]; g.fillRect(0, 36, 80, 18); }
  g.restore(); g.lineWidth = 5; g.strokeStyle = t === "home" ? "#fff" : "#ffcc22"; g.stroke();
  g.fillStyle = t === "home" ? "#ffd75e" : "#fff"; g.font = "900 30px Trebuchet MS"; g.textAlign = "center"; g.lineWidth = 4; g.strokeStyle = "#000"; g.strokeText("★", 40, 56); g.fillText("★", 40, 56);
}


/* ================= bots (demo crowd, capped joins) ================= */
const BOT_NAMES = ["kartal_34", "bosphorus_boy", "cimbom_değil", "ayse.k", "mert1903", "deniz_tr", "emre_ist", "zeynep.fan", "burak_10", "selin_s", "can.boga", "ozan_k", "elif_99", "kerem7", "ece.live", "hakan_dj", "baris.t", "melis_m", "arda_g", "sinan.kaleci", "tuba_x", "volkan.def", "irem_ii", "koray_k", "ahmet_usta", "nehir_n", "efe_bjk", "yusuf.y", "gizem.g", "onur_on", "derya.d", "tolga_tt", "ceren.cc", "serkan_s", "pinar.p", "ugur_u", "berk_b", "duru.d", "kaan_k", "aslı_a"];
let botN = 0;
const botName = i => BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? "_" + Math.floor(i / BOT_NAMES.length) : "");
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
  const cautious = state.throws[f.team].filter(x => state.time - x <= CONFIG.throwRule.window).length >= CONFIG.throwRule.limit - 1 || state.time < state.banUntil[f.team];
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
function setLive(st, extra) {
  liveState = st; window.__liveStatus = st;
  const el = $("livepill"); el.style.display = "block";
  const txt = { connecting: T("liveConnecting"), ok: T("liveOk"), fail: T("liveFail"), lost: T("liveLost"), quiet: T("liveQuiet", { s: extra || 90 }) }[st] || st;
  el.textContent = txt; el.className = st === "fail" || st === "lost" ? "bad" : st === "quiet" ? "warn" : "";
  if (st === "fail" || st === "lost") console.warn("[LIVE]", st);
}
function liveWatchdog() {
  if (liveState === "ok" || liveState === "quiet") {
    const since = state.time - Math.max(lastLiveEvt, liveConnectedAt);
    if (since > 90 && liveState === "ok") setLive("quiet", Math.round(since));
    else if (since <= 90 && liveState === "quiet") setLive("ok");
  }
}
async function tryConnectPlayroom() {
  if (Q.get("live") !== "1") return;
  setLive("connecting");
  try {
    const src = Q.get("bridgeSrc") || "https://unpkg.com/playroomkit/multiplayer.js";
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("bridge script failed to load")); document.head.appendChild(s); setTimeout(() => rej(new Error("bridge load timeout")), 20000); });
    const mod = window.Playroom || window.PlayroomKit || window;
    const insertCoin = mod.insertCoin || window.insertCoin, onTikTokLiveEvent = mod.onTikTokLiveEvent || window.onTikTokLiveEvent, onDisconnect = mod.onDisconnect || window.onDisconnect;
    if (typeof insertCoin !== "function" || typeof onTikTokLiveEvent !== "function") throw new Error("Playroom API not found");
    await Promise.race([insertCoin({ liveMode: "tiktok" }), new Promise((_, rej) => setTimeout(() => rej(new Error("insertCoin timeout")), 60000))]);
    onTikTokLiveEvent((event) => { const d = (event && event.data) || event || {}; const raw = String((event && event.type) || d.type || "chat").toLowerCase();
      if (liveState !== "ok") setLive("ok");
      handleLiveEvent({ type: raw.includes("gift") ? "gift" : raw.includes("like") ? "like" : "chat", userId: d.userId || d.uniqueId || d.username, username: d.username || d.nickName || d.uniqueId || "viewer",
        comment: d.comment || d.content || "", giftName: d.giftName || "", diamondCount: d.diamondCount || d.giftValue || 1, repeatCount: d.repeatCount || 1, likeCount: d.likeCount || 1 }); });
    if (typeof onDisconnect === "function") onDisconnect(() => setLive("lost"));
    window.addEventListener("offline", () => setLive("lost"));
    liveConnectedAt = state.time; setLive("ok");
  } catch (e) { setLive("fail"); console.warn("[Playroom] not connected:", e && e.message); }
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
}
let CAMX = +(Q.get("cx") || -34), CAMY = +(Q.get("cy") || 60), LOOKX = +(Q.get("lx") || 4.5), CAMFOV = +(Q.get("fov") || 52);
const FOVP = +(Q.get("fp") || 0.9), LOOKK = +(Q.get("lk") || 40);
const INTRO = +(Q.get("intro") || 2.6); let introStart = 0, introHold = false;
function updateCamera(dt) {
  const t = state.time, bz = state.ballZ;
  const tall = Math.max(1, (H / W) / (960 / 540)); let fov = CAMFOV * Math.pow(tall, FOVP);   // tall phones: keep both goals in view, spend the extra height on the Bosphorus instead of empty terrace
  camPos.set(CAMX + Math.sin(t * 0.15) * 1.5, CAMY, bz * 0.25 * (2 - tall) + Math.sin(t * 0.11) * 1.5); camLook.set(LOOKX + (tall - 1) * LOOKK, 0, bz * 0.28 * (2 - tall));
  if (state.phase === "celebrate" && state.phaseT < 3.5) { const home = state.lastScorer === "home"; camPos.set(home ? -30 : -24, 47, camPos.z * 0.5); camLook.set((home ? -1 : 8) + (tall - 1) * LOOKK, 0, camLook.z * 0.5); }
  if (state.shake > 0) { camPos.x += (Math.random() - 0.5) * state.shake * 1.4; camPos.y += (Math.random() - 0.5) * state.shake; state.shake = Math.max(0, state.shake - dt * 1.5); }
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const ik = introHold ? 0 : (state.time - introStart) / INTRO;
  if (ik < 1) { const k = ik * ik * (3 - 2 * ik); camera.position.set(lerp(-6, camPos.x, k), lerp(15, camPos.y, k), lerp(-4, camPos.z, k)); camTarget.set(lerp(70, camLook.x, k), lerp(9, 0, k), lerp(6, camLook.z, k));
    camera.up.set(k, 1 - k, 0).normalize(); camera.lookAt(camTarget); return; }
  camera.up.set(1, 0, 0);
  camera.position.lerp(camPos, Math.min(1, dt * 1.6)); camTarget.lerp(camLook, Math.min(1, dt * 1.6)); camera.lookAt(camTarget);
}
let hudAcc = 0;
function step(dt) {
  state.time += dt;
  if (botOn) { botAcc += dt * (Number($("bot-rate").value) || 8); while (botAcc >= 1) { botAcc--; botEvent(); } }
  drumTick(); flushJoins(); flushPicks(); liveWatchdog();
  updateMatch(dt); updatePlayers(dt, state.time); updateFans(state.time); updateFX(dt, state.time); updateCity(state.time);
  [-1, 1].forEach(s => { const n = goals[s].net; if (n.userData.shake > 0) { n.userData.shake -= dt; n.scale.z = 1 + Math.sin(state.time * 40) * 0.15 * n.userData.shake; } else n.scale.z = 1; });
  if (crowdGain && !state.muted) crowdGain.gain.value = 0.04 + (state.chant.home + state.chant.away) / 200 * 0.22 + (state.phase === "celebrate" ? 0.15 : 0);
  updateCamera(dt);
  renderer.render(scene, camera);
  updateLabels(); updateFX2(dt);
  hudAcc += dt; if (hudAcc > 0.2) { hudAcc = 0; refreshHUD(); }
}
window.__step = function (n, dt) { for (let i = 0; i < n; i++) step(dt || 1 / 30); };
window.__state = state; window.__users = users; window.__pending = pending; window.__nightBook = nightBook;
let lastT = 0;
function tick(now) { const dt = Math.min(0.05, (lastT ? now - lastT : 16) / 1000); lastT = now; try { step(dt); } catch (e) { console.error(e); } requestAnimationFrame(tick); }
function setBot(on) { botOn = on; $("bot-toggle").checked = on; }
function boot() {
  buildSky(); buildPitch(); buildStands(); buildCity(); buildFans(); buildPlayers(); buildFX();
  TEAMS.forEach(drawCrest); if (Q.get("lang") === "en") CONFIG.lang = "en"; applyLang(); fit();
  camera.up.set(1, 0, 0); camera.position.set(CAMX, CAMY, 0); camTarget.set(LOOKX, 0, 0); camera.lookAt(camTarget);
  const chips = $("chips");
  ["1", "2", "Haydi!", "davul", "meşale", "şişe", "çakmak"].forEach(k => { const b = document.createElement("button"); b.textContent = k; b.onclick = () => { $("fake-comment").value = k; $("btn-send").click(); }; chips.appendChild(b); });
  const who = () => { const n = $("fake-user").value.trim() || "pablo"; return { userId: "local:" + n.toLowerCase(), username: n }; };
  $("btn-send").onclick = () => handleLiveEvent(Object.assign({ type: "chat", comment: $("fake-comment").value }, who()));
  $("fake-comment").addEventListener("keydown", e => { if (e.key === "Enter") $("btn-send").click(); });
  $("btn-like").onclick = () => handleLiveEvent(Object.assign({ type: "like", likeCount: 5 }, who()));
  $("btn-rose").onclick = () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Rose", diamondCount: 1 }, who()));
  $("btn-med").onclick = () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Donut", diamondCount: 30 }, who()));
  $("btn-big").onclick = () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Party", diamondCount: 300 }, who()));
  $("btn-lion").onclick = () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Lion", diamondCount: 1500 }, who()));
  $("bot-rate").oninput = () => { $("bot-rate-val").textContent = $("bot-rate").value + "/s"; };
  $("bot-toggle").onchange = () => setBot($("bot-toggle").checked);
  $("mute").onclick = (e) => { e.stopPropagation(); if (!state.muted && audioState() !== "running") setMuted(false); else setMuted(!state.muted); };
  $("soundpill").onclick = (e) => { e.stopPropagation(); setMuted(false); };
  $("stage").addEventListener("pointerdown", () => { if (!state.muted && audioState() !== "running") setMuted(false); });
  $("btn-reset").onclick = () => { state.series = { home: 0, away: 0, draw: 0 }; nightBook.clear(); users.forEach(f => f.nPts = 0); persist(); refreshHUD(); };
  $("btn-newuser").onclick = () => { $("fake-user").value = "izleyici_" + Math.floor(Math.random() * 9000 + 1000); };
  $("panel-btn").onclick = (e) => { e.stopPropagation(); document.body.classList.toggle("panel-hidden"); fit(); };
  window.addEventListener("keydown", e => { if (/input|textarea/i.test(e.target.tagName)) return; const k = e.key.toLowerCase();
    if (k === "h") { document.body.classList.toggle("panel-hidden"); fit(); } else if (k === "m") setMuted(!state.muted); else if (k === "l") { CONFIG.lang = CONFIG.lang === "tr" ? "en" : "tr"; applyLang(); } });
  window.addEventListener("resize", fit);
  if (IS_MOBILE || window.innerWidth < 860) { document.body.classList.add("panel-hidden"); fit(); }
  if (Q.get("panel") === "0") { document.body.classList.add("panel-hidden"); fit(); }
  $("mute").style.display = "flex";
  if (!CLIP && Q.get("live") !== "1" && Q.get("bot") !== "1" && Q.get("demo") !== "0") {
    $("start").classList.add("on"); seedCrowd(CONFIG.demo.seed); introHold = true;
    $("start").addEventListener("click", () => { $("start").classList.remove("on"); setMuted(false); setBot(true); introHold = false; introStart = state.time; }, { once: true });
  }
  if (Q.get("seed")) seedCrowd(Number(Q.get("seed")));
  if (Q.get("bot") === "1") setBot(true);
  if (Q.get("sound") === "1") setMuted(false);
  tryConnectPlayroom();
  if (!CLIP) requestAnimationFrame(tick); else step(1 / 30);
}
boot();
