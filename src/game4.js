/* ================= live events ================= */
const norm = s => String(s || "").toLocaleLowerCase("tr").trim();
const hasKw = (c, list) => list.some(k => c === k || (k.length > 2 && c.includes(k)));
function teamFromComment(c) { for (const t of TEAMS) if (CONFIG.teams[t].keywords.some(k => c === k || (k.length > 2 && c.split(/\s+/).includes(k)))) return t; return null; }
function addChant(team, v) { if (v > 0) { const gd = state.goals[team] - state.goals[other(team)]; v *= gd < 0 ? 1.3 : gd > 0 ? 0.85 : 1; if (state.phase === "celebrate") v *= 0.5; } state.chant[team] = clamp(state.chant[team] + v, 0, 100); }
function logLine(txt, team) { const el = document.createElement("div"); el.textContent = txt; if (team === "away") el.className = "away"; const L = $("log"); L.prepend(el); while (L.children.length > 5) L.lastChild.remove(); }
let chantSfxT = { home: -9, away: -9 };
function fanChant(f, v, say) {
  f.chantUntil = state.time + 1.6; f.score += v; f.hotUntil = state.time + 2.5; addChant(f.team, v);
  if (say) { f.say = say.slice(0, 22); f.sayUntil = state.time + 2.2; }
  if (state.time - chantSfxT[f.team] > 2.4 && state.chant[f.team] > 25) { chantSfxT[f.team] = state.time; sfx("chant", f.team); }
}
function doAction(f, kind) {
  const C = CONFIG.teams[f.team], n = "@" + f.name;
  f.hotUntil = state.time + 3; f.score += 3;
  if (kind === "drum") { hitDrum(f.team); addChant(f.team, 5); logLine(T("drum", { n }), f.team); }
  else if (kind === "torch") { lightTorch(f); addChant(f.team, 7); logLine(T("torch", { n }), f.team); }
  else if (kind === "bottle" || kind === "lighter") {
    throwObject(f, kind); logLine(T(kind, { n }), f.team);
    addChant(other(f.team), -4);                         // distracts the celebrating rivals...
    const arr = state.throws[f.team]; arr.push(state.time); while (arr.length && state.time - arr[0] > 20) arr.shift();
    if (arr.length >= 3) { arr.length = 0; later(1.1, () => refereeWarning(f.team)); }   // ...but the ref is watching
  }
}
function refereeWarning(team) {
  state.warnings[team]++; addChant(team, -20); state.momentum += team === "home" ? -0.25 : 0.25;
  sfx("whistle", 3); showPop(T("warn"), T("warnSub", { t: CONFIG.teams[team].name }), "warn", 2.4); cardT = state.time;
}
window.handleLiveEvent = function (ev) {
  try {
    if (!ev) return;
    const id = String(ev.userId || ev.uniqueId || ev.username || "anon"), name = String(ev.username || ev.nickname || id).replace(/^@/, "").slice(0, 18);
    let f = users.get(id);
    const c = norm(ev.comment);
    if (ev.type === "chat") {
      const jt = teamFromComment(c);
      if (!f && jt) { f = addFan(id, name, jt); if (f) { logLine(T("joined", { n: "@" + name, t: CONFIG.teams[jt].short }), jt); sfx("pop"); addChant(jt, 2); } return; }
      if (!f) { // auto-assign to the smaller end so every commenter gets a seat
        const t = teamFans.home.length <= teamFans.away.length ? "home" : "away"; f = addFan(id, name, t); if (!f) return; logLine(T("joined", { n: "@" + name, t: CONFIG.teams[t].short }), t); }
      if (hasKw(c, CONFIG.actions.lighter)) doAction(f, "lighter");
      else if (hasKw(c, CONFIG.actions.bottle)) doAction(f, "bottle");
      else if (hasKw(c, CONFIG.actions.torch)) doAction(f, "torch");
      else if (hasKw(c, CONFIG.actions.drum)) doAction(f, "drum");
      else fanChant(f, jt ? 2.5 : 3, ev.comment);
    } else if (ev.type === "like") {
      if (!f) { const t = teamFans.home.length <= teamFans.away.length ? "home" : "away"; f = addFan(id, name, t); if (!f) return; }
      const n = Math.max(1, Math.min(15, Number(ev.likeCount || ev.count) || 1)); fanChant(f, 0.5 * n); hearts.push({ f, t: 0 });
    } else if (ev.type === "gift") {
      if (!f) { const t = teamFans.home.length <= teamFans.away.length ? "home" : "away"; f = addFan(id, name, t); if (!f) return; logLine(T("joined", { n: "@" + name, t: CONFIG.teams[t].short }), t); }
      const val = (Number(ev.diamondCount || ev.giftValue) || 1) * Math.max(1, Number(ev.repeatCount) || 1);
      f.gifts += val; f.score += val * 2; f.hotUntil = state.time + 5;
      const G = CONFIG.gifts;
      if (val >= G.tifoAt) tifo(f);
      else if (val >= G.waveAt) { standWave(f); }
      else if (val >= G.torchAt) doAction(f, "torch");
      else doAction(f, "drum");
      sfx("fanfare");
    }
  } catch (e) { console.error(e); }
};
function standWave(f) { addChant(f.team, 30); state.momentum += f.team === "home" ? 0.35 : -0.35; teamFans[f.team].forEach(o => o.chantUntil = state.time + 3 + Math.abs(o.seat.z + 2) * 0.05); showPop(T("wave"), "@" + f.name + " 🌊", f.team, 1.8); for (let i = 0; i < 3; i++) later(i * 0.4, () => hitDrum(f.team)); }
function tifo(f) {
  const tf = tifos[f.team]; tf.start = state.time; tf.until = state.time + 5; addChant(f.team, 60); state.momentum = f.team === "home" ? 0.9 : -0.9;
  showPop(T("tifo"), "🦁 @" + f.name + " → " + T("pen"), f.team, 2.6); sfx("roar"); state.shake = 0.6;
  later(2.8, () => { if (state.phase === "play" || state.phase === "shot") penalty(f.team); });
}
function penalty(team) {
  ballFly = null; const d = attackDir(team); state.ballX = 0; state.ballZ = d * (PL - 5.5); sfx("whistle", 1);
  showPop(T("pen"), "", team, 1.0, "small");
  later(1.2, () => shoot(team, Math.random() < 0.85, true));
}

/* ================= match engine ================= */
let shotCooldown = 2, cardT = -9;
function updateMatch(dt) {
  runTimers();
  TEAMS.forEach(t => { state.chant[t] = Math.max(0, state.chant[t] - dt * (3 + state.chant[t] * 0.07)); });
  if (state.phase === "intro") { if (!introHold && state.time - introStart > 1.2) { state.phase = "play"; sfx("whistle", 2); showPop(T("start"), "", "", 1.4, "small"); } return; }
  if (state.phase === "ft") { state.phaseT += dt; if (state.phaseT > 8) newMatch(); return; }
  if (state.phase === "play" || state.phase === "shot" || state.phase === "celebrate") {
    state.minute += dt / CONFIG.secondsPerMinute;
    if (state.minute >= CONFIG.matchMinutes && state.phase === "play") { fullTime(); return; }
  }
  if (state.phase === "celebrate") { state.phaseT += dt; if (state.phaseT > 6.5) { state.phase = "play"; resetPositions(); sfx("whistle", 1); state.chant[state.lastScorer] *= 0.55; } return; }
  if (state.phase !== "play") return;
  const diff = (state.chant.home - state.chant.away) / 100;
  const target = clamp(diff * 2.2 + Math.sin(state.time * 0.41) * 0.5 + Math.sin(state.time * 0.13 + 1) * 0.3, -1, 1);
  state.momentum = clamp(lerp(state.momentum, target, dt * 0.8), -1, 1);
  // ball drifts toward the goal of the team with momentum, plus dribble wobble
  const tz = -state.momentum * (PL - 2) + Math.sin(state.time * 1.3) * 2.5, tx = Math.sin(state.time * 0.8) * 5.5 + Math.sin(state.time * 2.1) * 1.5;
  state.ballZ = lerp(state.ballZ, tz, dt * 0.9); state.ballX = lerp(state.ballX, tx, dt * 1.2);
  shotCooldown -= dt;
  if (shotCooldown <= 0) TEAMS.forEach(t => {
    if (state.phase !== "play") return;
    const inThird = t === "home" ? state.ballZ < -PL * 0.5 : state.ballZ > PL * 0.5;
    if (!inThird) return;
    const lvl = state.chant[t] / 100, mom = t === "home" ? state.momentum : -state.momentum;
    if (Math.random() < dt * (0.5 + lvl * 1.5)) { shotCooldown = 2.2; const p = clamp(0.3 + lvl * 0.45 + mom * 0.2, 0.2, 0.85); shoot(t, Math.random() < p); }
  });
}
function shotResult(bf) {
  if (bf.scoreIt) goal(bf.team);
  else { showPop(Math.random() < 0.5 ? T("save") : T("miss"), "", bf.team, 1.1, "small"); sfx("groan"); state.phase = "play"; state.ballZ = attackDir(bf.team) * (PL - 8); state.momentum *= 0.4; }
}
function goal(team) {
  state.goals[team]++; state.lastScorer = team; state.phase = "celebrate"; state.phaseT = 0; state.shake = 1;
  const top = teamFans[team].slice().sort((a, b) => b.score - a.score)[0];
  showPop(T("goal"), T("scored", { t: CONFIG.teams[team].name }) + (top ? "  🎤 @" + top.name : ""), team, 3);
  sfx("roar"); later(0.2, () => sfx("chant", team));
  goals[attackDir(team)].net.userData.shake = 1;
  teamFans[team].forEach(f => f.jumpUntil = state.time + rnd(3, 5));
  teamFans[other(team)].forEach(f => f.sadUntil = state.time + rnd(2.5, 4));
  addChant(team, 25); state.momentum = 0; celebT = state.time; celebTeam = team;
  confetti(team);
}
function fullTime() {
  state.phase = "ft"; state.phaseT = 0; sfx("whistle", 3);
  const h = state.goals.home, a = state.goals.away;
  const w = h === a ? null : (h > a ? "home" : "away");
  showPop(T("ft"), w ? T("wins", { t: CONFIG.teams[w].name }) : T("draw"), w || "", 6);
  if (w) { teamFans[w].forEach(f => f.jumpUntil = state.time + 6); confetti(w); }
}
function newMatch() { state.goals.home = state.goals.away = 0; state.minute = 0; state.phase = "intro"; state.time = Math.max(state.time, 0); state.phaseT = 0; resetPositions(); state.phase = "play"; sfx("whistle", 2); showPop(T("start"), "", "", 1.4, "small"); }

/* ================= 2D overlay: popups, confetti, hearts, comic bursts ================= */
const fx2 = $("fx"), g2 = fx2.getContext("2d");
const confettiP = [], hearts = [], bursts = [];
let popT = -9, popDur = 0, celebT = -99, celebTeam = null;
function showPop(big, sub, cls, dur, extra) { $("pop-big").textContent = big; $("pop-sub").textContent = sub || ""; $("pop-sub").style.display = sub ? "inline-block" : "none"; $("pop").className = (cls || "") + " " + (extra || ""); popT = state.time; popDur = dur || 2; }
function confetti(team) { const cols = team === "home" ? ["#fff", "#111", "#ddd", "#ffd75e"] : ["#e01b2f", "#ffcc22", "#fff", "#ff7a00"]; for (let i = 0; i < 140; i++) confettiP.push({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-40, 40), vy: rnd(120, 260), r: rnd(0, 6), vr: rnd(-8, 8), c: cols[i % cols.length], life: rnd(2.5, 4) }); }
function fxBurst(txt, team) { const s = toScreen(drums[team].g.position.x, drums[team].g.position.y + 1.5, drums[team].g.position.z); if (s) bursts.push({ x: s.x, y: s.y, t: 0, txt, team }); }
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
    pe.style.opacity = Math.min(inK, outK); pe.style.transform = "scale(" + sc.toFixed(3) + ") rotate(-3deg)"; } else pe.style.opacity = 0;
  // celebration prompt after a goal
  const ce = $("celebrate"), ck = state.time - celebT;
  if (ck > 1.2 && ck < 9 && celebTeam) { if (ce.dataset.team !== celebTeam + CONFIG.lang) { ce.innerHTML = "<div>" + T("celebH") + "</div><div class='a'>" + T("celebA", { t: CONFIG.teams[other(celebTeam)].short }) + "</div>"; ce.dataset.team = celebTeam + CONFIG.lang; } ce.style.opacity = Math.min(1, (ck - 1.2) * 3, (9 - ck) * 2); ce.style.transform = "translateY(" + (Math.sin(ck * 4) * 3).toFixed(1) + "px)"; } else ce.style.opacity = 0;
  const cardK = state.time - cardT; $("card").style.opacity = cardK < 2.2 ? Math.min(1, cardK * 4, (2.2 - cardK) * 3) : 0; $("card").style.transform = "rotate(" + (8 + Math.sin(cardK * 6) * 4) + "deg)";
}

/* ================= HUD + labels ================= */
const labelPool = [];
function updateLabels() {
  const root = $("labels"), t = state.time, all = teamFans.home.concat(teamFans.away);
  const amigo = all.filter(f => f.gifts > 0).sort((a, b) => b.gifts - a.gifts).slice(0, 2);
  const pick = all.slice().sort((a, b) => ((b.hotUntil > t ? 1e6 : 0) + (amigo.includes(b) ? 5e5 : 0) + b.joinT) - ((a.hotUntil > t ? 1e6 : 0) + (amigo.includes(a) ? 5e5 : 0) + a.joinT)).slice(0, 26);
  while (labelPool.length < pick.length) { const d = document.createElement("div"); d.className = "lab"; root.appendChild(d); labelPool.push(d); }
  labelPool.forEach((el, i) => {
    const f = pick[i]; if (!f) { el.style.display = "none"; return; }
    const s = toScreen(f._hx || f.seat.x, f._hy || f.seat.y + 2, f._hz || f.seat.z); if (!s) { el.style.display = "none"; return; }
    const hot = f.hotUntil > t, am = amigo.includes(f);
    const cls = "lab " + f.team + (hot ? " hot" : "") + (am ? " amigo" : "");
    const txt = (am ? "📣 " : "") + f.name, say = f.sayUntil > t ? f.say : "";
    if (el.className !== cls) el.className = cls;
    const key = txt + "|" + say; if (el._k !== key) { el._k = key; el.innerHTML = ""; el.appendChild(document.createTextNode(txt)); if (say) { const sp = document.createElement("span"); sp.className = "say"; sp.textContent = "“" + say + "”"; el.appendChild(sp); } }
    el.style.display = "block"; el.style.transform = "translate(" + (s.x - el.offsetWidth / 2).toFixed(0) + "px," + (s.y - el.offsetHeight).toFixed(0) + "px)";
  });
}
function refreshHUD() {
  $("goals").textContent = state.goals.home + " - " + state.goals.away;
  $("clock").textContent = state.phase === "ft" ? T("ft") : Math.min(90, Math.floor(state.minute)) + "'";
  TEAMS.forEach(t => {
    const v = Math.round(state.chant[t]); $("fill-" + t).style.width = v + "%"; $("lbl-" + t).textContent = (v > 70 ? "🔥 " : "📣 ") + v + "%";
    $("cnt-" + t).textContent = teamFans[t].length + " " + T("fans");
  });
  $("knob").style.left = (50 + state.momentum * 46) + "%";
  const all = teamFans.home.concat(teamFans.away).sort((a, b) => b.score - a.score).slice(0, 4);
  $("board-rows").innerHTML = all.map((f, i) => "<div class='row " + f.team + "'><span>" + ["🥇", "🥈", "🥉", "4."][i] + " " + f.name.replace(/[<>&]/g, "") + "</span><span>" + Math.round(f.score) + "</span></div>").join("");
}
function applyLang() {
  $("venue").textContent = T("venue"); $("mom-t").textContent = T("mom"); $("board-t").textContent = T("board");
  $("lg-home").textContent = T("lgH"); $("lg-home2").textContent = T("lgH2"); $("lg-away").textContent = T("lgA"); $("lg-away2").textContent = T("lgA2");
  $("acts").innerHTML = T("acts").map(a => "<div><i>" + a[0] + "</i>" + a[1] + "<em>" + a[2] + "</em></div>").join("");
  TEAMS.forEach(t => { $("name-" + t).firstChild.textContent = CONFIG.teams[t].name; });
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

/* ================= bots (demo crowd) ================= */
const BOT_NAMES = ["kartal_34", "bosphorus_boy", "cimbom_değil", "ayse.k", "mert1903", "deniz_tr", "emre_ist", "zeynep.fan", "burak_10", "selin_s", "can.boga", "ozan_k", "elif_99", "kerem7", "ece.live", "hakan_dj", "baris.t", "melis_m", "arda_g", "sinan.kaleci", "tuba_x", "volkan.def", "irem_ii", "koray_k", "ahmet_usta", "nehir_n", "efe_bjk", "yusuf.y", "gizem.g", "onur_on", "derya.d", "tolga_tt", "ceren.cc", "serkan_s", "pinar.p", "ugur_u", "berk_b", "duru.d", "kaan_k", "aslı_a"];
let botN = 0;
function botEvent() {
  const r = Math.random(), joinedAll = teamFans.home.concat(teamFans.away);
  if (joinedAll.length < 30 || r < 0.12) { const i = botN++; const name = BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? "_" + Math.floor(i / BOT_NAMES.length) : "");
    handleLiveEvent({ type: "chat", userId: "bot" + i, username: name, comment: Math.random() < (state.goals.home <= state.goals.away ? 0.6 : 0.45) ? (Math.random() < 0.5 ? "1" : "home") : (Math.random() < 0.5 ? "2" : "away") }); return; }
  const f = joinedAll[Math.floor(Math.random() * joinedAll.length)];
  const ce = state.time - celebT < 8 && celebTeam;
  if (ce && f.team === celebTeam && Math.random() < 0.35) { handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: Math.random() < 0.5 ? "davul" : "meşale" }); return; }
  if (ce && f.team !== celebTeam && Math.random() < 0.18) { handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: Math.random() < 0.5 ? "şişe" : "çakmak" }); return; }
  if (r < 0.55) { const lines = f.team === "home" ? ["Haydi Kartal!", "En büyük biziz!", "Vur gol!", "Hadi çocuklar", "Şampiyon!", "Ole ole", "Bu akşam bizim"] : ["Deplasmanda biz varız!", "Vur!", "Hadi!", "Gol gol gol", "Kazanacağız", "Ole!"];
    handleLiveEvent({ type: "chat", userId: f.id, username: f.name, comment: lines[Math.floor(Math.random() * lines.length)] }); }
  else if (r < 0.85) handleLiveEvent({ type: "like", userId: f.id, username: f.name, likeCount: 1 + Math.floor(Math.random() * 5) });
  else if (r < 0.97) handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Rose", diamondCount: 1 });
  else if (r < 0.995) handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Donut", diamondCount: 30 });
  else handleLiveEvent({ type: "gift", userId: f.id, username: f.name, giftName: "Party", diamondCount: 300 });
}
let botAcc = 0, botOn = false;
function seedCrowd(n) { for (let i = 0; i < n; i++) { const id = "bot" + botN, t = i % 2 ? "away" : "home"; const name = BOT_NAMES[botN % BOT_NAMES.length] + (botN >= BOT_NAMES.length ? "_" + Math.floor(botN / BOT_NAMES.length) : ""); botN++; const f = addFan(id, name, t); if (f) f.joinT = -5; } }
window.__seedCrowd = seedCrowd;

/* ================= Playroom TikTok LIVE bridge (?live=1) ================= */
async function tryConnectPlayroom() {
  if (Q.get("live") !== "1") return;
  try {
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/playroomkit/multiplayer.js"; s.onload = res; s.onerror = () => rej(new Error("Playroom CDN failed")); document.head.appendChild(s); });
    const mod = window.Playroom || window.PlayroomKit || window;
    const insertCoin = mod.insertCoin || window.insertCoin, onTikTokLiveEvent = mod.onTikTokLiveEvent || window.onTikTokLiveEvent;
    if (typeof insertCoin !== "function" || typeof onTikTokLiveEvent !== "function") { console.warn("[Playroom] API not found"); return; }
    await insertCoin({ liveMode: "tiktok" });
    onTikTokLiveEvent((event) => { const d = (event && event.data) || event || {}; const raw = String((event && event.type) || d.type || "chat").toLowerCase();
      handleLiveEvent({ type: raw.includes("gift") ? "gift" : raw.includes("like") ? "like" : "chat", userId: d.userId || d.uniqueId || d.username, username: d.username || d.nickName || d.uniqueId || "viewer",
        comment: d.comment || d.content || "", giftName: d.giftName || "", diamondCount: d.diamondCount || d.giftValue || 1, repeatCount: d.repeatCount || 1, likeCount: d.likeCount || 1 }); });
    console.info("[Playroom] TikTok LIVE connected");
  } catch (e) { console.warn("[Playroom] not connected:", e.message); }
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
const INTRO = +(Q.get("intro") || 2.6); let introStart = 0, introHold = false;
function updateCamera(dt) {
  const t = state.time, bz = state.ballZ;
  let fov = CAMFOV * Math.max(1, (H / W) / (960 / 540)) ;
  camPos.set(CAMX + Math.sin(t * 0.15) * 1.5, CAMY, bz * 0.25 + Math.sin(t * 0.11) * 1.5); camLook.set(LOOKX, 0, bz * 0.28);
  if (state.phase === "celebrate" && state.phaseT < 3.5) { const home = state.lastScorer === "home"; camPos.set(home ? -30 : -24, 47, camPos.z * 0.5); camLook.set(home ? -1 : 8, 0, camLook.z * 0.5); }
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
  updateMatch(dt); updatePlayers(dt, state.time); updateFans(state.time); updateFX(dt, state.time); updateCity(state.time);
  [-1, 1].forEach(s => { const n = goals[s].net; if (n.userData.shake > 0) { n.userData.shake -= dt; n.scale.z = 1 + Math.sin(state.time * 40) * 0.15 * n.userData.shake; } else n.scale.z = 1; });
  if (crowdGain && !state.muted) crowdGain.gain.value = 0.04 + (state.chant.home + state.chant.away) / 200 * 0.22 + (state.phase === "celebrate" ? 0.15 : 0);
  updateCamera(dt);
  renderer.render(scene, camera);
  updateLabels(); updateFX2(dt);
  hudAcc += dt; if (hudAcc > 0.2) { hudAcc = 0; refreshHUD(); }
}
window.__step = function (n, dt) { for (let i = 0; i < n; i++) step(dt || 1 / 30); };
window.__state = state; window.__users = users;
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
  $("mute").onclick = (e) => { e.stopPropagation(); setMuted(!state.muted); };
  $("panel-btn").onclick = (e) => { e.stopPropagation(); document.body.classList.toggle("panel-hidden"); fit(); };
  window.addEventListener("keydown", e => { if (/input|textarea/i.test(e.target.tagName)) return; const k = e.key.toLowerCase();
    if (k === "h") { document.body.classList.toggle("panel-hidden"); fit(); } else if (k === "m") setMuted(!state.muted); else if (k === "l") { CONFIG.lang = CONFIG.lang === "tr" ? "en" : "tr"; applyLang(); } });
  window.addEventListener("resize", fit);
  if (IS_MOBILE || window.innerWidth < 860) { document.body.classList.add("panel-hidden"); fit(); }
  if (Q.get("panel") === "0") { document.body.classList.add("panel-hidden"); fit(); }
  $("mute").style.display = "flex";
  if (!CLIP && Q.get("live") !== "1" && Q.get("bot") !== "1" && Q.get("demo") !== "0") {
    $("start").classList.add("on"); seedCrowd(70); introHold = true;
    $("start").addEventListener("click", () => { $("start").classList.remove("on"); setMuted(false); setBot(true); introHold = false; introStart = state.time; }, { once: true });
  }
  if (Q.get("seed")) seedCrowd(Number(Q.get("seed")));
  if (Q.get("bot") === "1") setBot(true);
  if (Q.get("sound") === "1") setMuted(false);
  tryConnectPlayroom();
  if (!CLIP) requestAnimationFrame(tick); else step(1 / 30);
}
boot();
