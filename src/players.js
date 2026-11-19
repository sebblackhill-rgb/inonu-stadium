/* ================= 11 v 11: instanced players + officials, formations, passing, dives, celebrations, replay ================= */
const FORMS = {   // [lateral -1..1, depth 0 (own goal) .. 1 (rival goal)]; index 0 = goalkeeper
  home: [[0, 0.03], [-0.75, 0.22], [-0.27, 0.17], [0.27, 0.17], [0.75, 0.22], [-0.7, 0.45], [-0.22, 0.4], [0.22, 0.4], [0.7, 0.45], [-0.22, 0.68], [0.22, 0.7]],   // 4-4-2
  away: [[0, 0.03], [-0.75, 0.22], [-0.27, 0.17], [0.27, 0.17], [0.75, 0.22], [-0.45, 0.42], [0, 0.37], [0.45, 0.42], [-0.65, 0.68], [0, 0.72], [0.65, 0.68]]    // 4-3-3
};
CONFIG.formations = { home: "4-4-2", away: "4-3-3" };
const KITS = {
  home: { shirt: null, sleeve: 0x141414, shorts: 0x111111, socks: 0xf2f2f2 },
  away: { shirt: null, sleeve: 0xb5121b, shorts: 0xf4f4f4, socks: 0xb5121b },
  gkhome: { shirt: 0x1fd16b, sleeve: 0x1fd16b, shorts: 0x0c4a24, socks: 0x1fd16b },
  gkaway: { shirt: 0x7b3cff, sleeve: 0x7b3cff, shorts: 0x2a1260, socks: 0x7b3cff },
  ref: { shirt: 0xffe14a, sleeve: 0x111111, shorts: 0x111111, socks: 0x111111 }
};
const players = { home: [], away: [] }, officials = [], PEOPLE = [];
let ball, ballShadow, carrier = null, passT = 1.5, scorer = null, shotFrom = null;
const vb = { x: 0, z: 0, y: 0.38, pass: null };          // the ball you see (passes between players); state.ballX/Z is the match engine's "play zone"
const PS = 1.0, NP = 25;
const HUM = {};
function buildPlayers() {
  const unit = new THREE.Matrix4().makeScale(0, 0, 0), white = () => lam(0xffffff);
  const legG = new THREE.BoxGeometry(0.19, 0.62, 0.2); legG.translate(0, -0.31, 0);
  const armG = new THREE.BoxGeometry(0.15, 0.58, 0.15); armG.translate(0, -0.27, 0);
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setMatrixAt(i, unit); scene.add(m); return m; };
  const torsoG = new THREE.BoxGeometry(0.62, 0.72, 0.4);
  HUM.torsoH = mk(torsoG, new THREE.MeshLambertMaterial({ map: kitTex("home") }), 10);
  HUM.torsoA = mk(torsoG, new THREE.MeshLambertMaterial({ map: kitTex("away") }), 10);
  HUM.torsoP = mk(torsoG, white(), 5);
  HUM.shorts = mk(new THREE.BoxGeometry(0.6, 0.26, 0.4), white(), NP);
  HUM.legL = mk(legG, white(), NP); HUM.legR = mk(legG, white(), NP);
  HUM.armL = mk(armG, white(), NP); HUM.armR = mk(armG, white(), NP);
  HUM.head = mk(new THREE.IcosahedronGeometry(0.24, 1), white(), NP);
  HUM.hair = mk(new THREE.BoxGeometry(0.44, 0.14, 0.44), white(), NP);
  HUM.flag = mk(new THREE.BoxGeometry(0.05, 0.36, 0.3), lam(0xffd400), 2);
  HUM.shadow = mk(new THREE.CircleGeometry(0.5, 10), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.32, depthWrite: false }), NP + 1);
  HUM.parts = ["shorts", "legL", "legR", "armL", "armR", "head", "hair"];
  // rig
  const root = new THREE.Object3D(), o = {};
  ["torso", "shorts", "legL", "legR", "armL", "armR", "head", "hair", "flag"].forEach(k => { o[k] = new THREE.Object3D(); root.add(o[k]); });
  o.torso.position.y = 1.07; o.shorts.position.y = 0.7; o.legL.position.set(-0.15, 0.64, 0); o.legR.position.set(0.15, 0.64, 0);
  o.armL.position.set(-0.4, 1.38, 0); o.armR.position.set(0.4, 1.38, 0); o.head.position.y = 1.67; o.hair.position.y = 1.86;
  o.flag.position.set(0.4, 0.86, 0.25);
  HUM.root = root; HUM.o = o;
  let iH = 0, iA = 0, iP = 0;
  const add = (role, team, idx) => {
    const kit = role === "gk" ? KITS["gk" + team] : role === "p" ? KITS[team] : KITS.ref;
    const P = { role, team, idx, n: PEOPLE.length, x: 0, z: 0, tx: 0, tz: 0, ry: 0, run: 0, ph: Math.random() * 6.28, kick: 0, dive: 0, diveDir: 1, slide: 0, sad: 0, joy: 0, sp: 0 };
    if (role === "p" && team === "home") { P.tm = HUM.torsoH; P.ti = iH++; } else if (role === "p") { P.tm = HUM.torsoA; P.ti = iA++; } else { P.tm = HUM.torsoP; P.ti = iP; HUM.torsoP.setColorAt(iP++, new THREE.Color(kit.shirt)); }
    const c = (k, v) => HUM[k].setColorAt(P.n, new THREE.Color(v));
    c("shorts", kit.shorts); c("legL", kit.socks); c("legR", kit.socks); c("armL", kit.sleeve); c("armR", kit.sleeve);
    c("head", SKIN[(P.n * 3) % SKIN.length]); c("hair", HAIR[(P.n * 5) % 4]);
    PEOPLE.push(P); return P;
  };
  TEAMS.forEach(t => { for (let i = 0; i < 11; i++) players[t].push(add(i === 0 ? "gk" : "p", t, i)); });
  officials.push(add("ref", null, 0), add("lin", null, 1), add("lin", null, 2));
  HUM.parts.concat(["torsoP"]).forEach(k => { if (HUM[k].instanceColor) HUM[k].instanceColor.needsUpdate = true; });
  ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshLambertMaterial({ color: 0xffffff })); scene.add(ball);
  const pent = new THREE.Mesh(new THREE.IcosahedronGeometry(0.305, 0), new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true })); ball.add(pent);
  ballShadow = HUM.shadow;
  window.__people = () => ({ home: players.home.length, away: players.away.length, gk: PEOPLE.filter(p => p.role === "gk").length, refs: officials.filter(p => p.role === "ref").length, linesmen: officials.filter(p => p.role === "lin").length,
    formations: CONFIG.formations, kits: { home: KITS.home, away: KITS.away, gkhome: KITS.gkhome.shirt, gkaway: KITS.gkaway.shirt, ref: KITS.ref.shirt },
    onPitch: PEOPLE.filter(p => Math.abs(p.x) <= PW + 1.2 && Math.abs(p.z) <= PL + 1.5).length, carrier: carrier ? carrier.team + carrier.idx : null, passes: passCount });
  resetPositions();
}
function attackDir(t) { return t === "home" ? -1 : 1; }    // home attacks toward z = -PL (far goal)
const depthZ = (t, v) => attackDir(t) * PL * (2 * v - 1);
function resetPositions() {
  TEAMS.forEach(t => players[t].forEach((p, i) => { const [u, v] = FORMS[t][i]; p.x = p.tx = u * PW * 0.8; p.z = p.tz = depthZ(t, Math.min(v, 0.46) * 0.98); p.slide = p.dive = p.kick = 0; p.sad = p.joy = 0; }));
  officials[0].x = 4; officials[0].z = 2; officials[1].x = -(PW + 0.45); officials[1].z = 6; officials[2].x = PW + 0.45; officials[2].z = -6;
  state.ballX = 0; state.ballZ = 0; ballFly = null; vb.x = 0; vb.z = 0; vb.pass = null; scorer = null;
  const kt = state.lastScorer ? other(state.lastScorer) : "home"; carrier = players[kt][9]; carrier.x = 0.4; carrier.z = -attackDir(kt) * 0.6; passT = 1.2;
}
let ballFly = null;
let passCount = 0;
function shoot(team, scoreIt, pen) {
  // the shot starts from the ball you see when it's near the play zone (keeps the engine's result, just looks right)
  if (!pen && state.phase === "play" && Math.hypot(vb.x - state.ballX, vb.z - state.ballZ) < 10 && attackDir(team) * vb.z > 0) { state.ballX = vb.x; state.ballZ = vb.z; }
  const d = attackDir(team), gz = d * (PL + (scoreIt ? 0.9 : 0.2));
  const tx = scoreIt ? rnd(-2.0, 2.0) : (Math.random() < 0.5 ? rnd(-4.5, -2.8) : rnd(2.8, 4.5));
  ballFly = { fx: state.ballX, fz: state.ballZ, tx, tz: gz, t: 0, dur: pen ? 0.7 : 0.85, h: scoreIt ? 1.2 : 1.6, team, scoreIt, t0: state.time };
  const sh = nearest(players[team].slice(1), state.ballX, state.ballZ); if (sh) { sh.kick = 1; sh.ry = Math.atan2(tx - sh.x, gz - sh.z); scorer = sh; }
  const gk = players[other(team)][0]; gk.dive = 1; gk.diveDir = (tx > gk.x ? 1 : -1) * (scoreIt && Math.random() < 0.6 ? -1 : 1);   // a beaten keeper often dives the wrong way
  carrier = null; vb.pass = null; shotFrom = state.time;
  sfx("kick"); state.phase = "shot";
}
function nearest(list, x, z, skip) { let b = null, bd = 1e9; list.forEach(p => { if (p === skip) return; const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } }); return b; }
function moveTo(p, dt, speed) {
  const dx = p.tx - p.x, dz = p.tz - p.z, dist = Math.hypot(dx, dz), sp = Math.min(dist, speed * dt);
  if (dist > 0.04) { p.x += dx / dist * sp; p.z += dz / dist * sp; }
  p.sp = dt > 0 ? sp / dt : 0; p.run = lerp(p.run, clamp(p.sp / 6, 0, 1), 0.15);
  return dist;
}
function face(p, ang, k) { let d = ang - p.ry; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; p.ry += d * Math.min(1, k); }
function updatePlayers(dt, t, noDraw) {
  if (replay.on) return;            // live logic keeps running in updateMatch; humans are drawn from the replay buffer
  const ph = state.phase, bx = vb.x, bz = vb.z;
  const possTeam = carrier ? carrier.team : (state.momentum >= 0 ? "home" : "away");
  // --- visual ball ---
  if (ballFly) { vb.x = state.ballX; vb.z = state.ballZ; vb.pass = null; }
  else if (vb.pass) { const P = vb.pass; P.t += dt; const k = Math.min(1, P.t / P.dur); vb.x = lerp(P.fx, P.to.x, k); vb.z = lerp(P.fz, P.to.z, k); vb.y = 0.3 + Math.sin(k * Math.PI) * P.h;
    if (k >= 1) { carrier = P.to; vb.pass = null; passT = rnd(0.9, 2.2); passCount++; } }
  else if (carrier && (ph === "play")) { const fx = carrier.x + Math.sin(carrier.ry) * 0.55, fz = carrier.z + Math.cos(carrier.ry) * 0.55; vb.x = lerp(vb.x, fx, Math.min(1, dt * 10)); vb.z = lerp(vb.z, fz, Math.min(1, dt * 10)); vb.y = 0.3; }
  else { vb.x = lerp(vb.x, state.ballX, Math.min(1, dt * 6)); vb.z = lerp(vb.z, state.ballZ, Math.min(1, dt * 6)); vb.y = 0.3; }
  // --- possession, passes, tackles (open play only) ---
  if (ph === "play" && !ballFly) {
    const engineTeam = state.momentum >= 0 ? "home" : "away";
    if (!carrier && !vb.pass) { const c = nearest(players[engineTeam].slice(1), vb.x, vb.z); if (c && Math.hypot(c.x - vb.x, c.z - vb.z) < 1.2) carrier = c; }
    if (carrier && !vb.pass) {
      const pr = nearest(players[other(carrier.team)].slice(1), vb.x, vb.z);
      if (engineTeam !== carrier.team && pr && Math.hypot(pr.x - vb.x, pr.z - vb.z) < 1.6 && Math.random() < dt * 3) { carrier = pr; passT = rnd(0.6, 1.4); }   // tackle when the momentum swings
      passT -= dt;
      if (passT <= 0 && carrier) {
        const d = attackDir(carrier.team), tzT = clamp(state.ballZ + d * 3, -PL + 2, PL - 2);
        let best = null, bs = -1e9;
        players[carrier.team].slice(1).forEach(r => { if (r === carrier) return; const dist = Math.hypot(r.x - carrier.x, r.z - carrier.z); if (dist < 3 || dist > 15) return;
          const s = -Math.abs(r.z - tzT) - Math.abs(r.x - state.ballX) * 0.35 + d * (r.z - carrier.z) * 0.15 + Math.random() * 2; if (s > bs) { bs = s; best = r; } });
        if (best) { const dist = Math.hypot(best.x - carrier.x, best.z - carrier.z); carrier.kick = 1; vb.pass = { fx: vb.x, fz: vb.z, to: best, t: 0, dur: clamp(dist / 17, 0.3, 0.9), h: dist > 9 ? 1.2 : 0.15 }; carrier = null; }
        else passT = 0.6;
      }
    }
  }
  // --- targets ---
  const cel = ph === "celebrate", pen = ph === "penalty" && state.pen;
  TEAMS.forEach(team => {
    const d = attackDir(team), ballV = clamp((d * bz / PL + 1) / 2, 0, 1), att = team === possTeam ? 0.05 : -0.05;
    const presser = carrier && carrier.team !== team ? nearest(players[team].slice(1), bx, bz) : null;
    players[team].forEach((p, i) => {
      const [u, v] = FORMS[team][i]; let speed = 6.2, look = null;
      if (i === 0) {                                                      // keeper: on the line, follows the ball laterally
        p.tx = clamp(bx * 0.3, -2.2, 2.2); p.tz = -d * (PL - 0.9 - (ballV < 0.3 ? 1.2 : 0)); speed = 5; look = [bx, bz];
      } else if (cel && state.lastScorer === team) {                    // scorer runs to the corner and slides; mates chase him
        const sc = scorer && scorer.team === team ? scorer : players[team][10];
        if (p === sc) { const cx = (sc.cx = sc.cx || (sc.x >= 0 ? 1 : -1) * (PW - 0.6)), cz = d * (PL - 0.6); p.tx = cx; p.tz = cz; speed = 8.5;
          if (Math.hypot(cx - p.x, cz - p.z) < 3.2) p.slide = Math.min(1, p.slide + dt * 1.6); p.joy = 1; }
        else { const a = i * 0.9; p.tx = sc.x + Math.cos(a) * 1.3; p.tz = sc.z + Math.sin(a) * 1.3 - d * 0.6; speed = 7.5; p.joy = Math.hypot(p.x - sc.x, p.z - sc.z) < 3 ? 1 : 0; }
      } else if (cel) { p.tx = u * PW * 0.6; p.tz = depthZ(team, Math.min(v, 0.45)); speed = 1.6; p.sad = 1; }
      else if (pen) {                                                     // penalty: taker on the spot, everyone else outside the box
        const pt = state.pen.team, dd = attackDir(pt);
        if (team === pt && i === 10) { p.tx = 0; p.tz = dd * (PL - 3.9) - dd * 1.0; look = [0, dd * PL]; speed = 4; }
        else { const slot = (i + (team === pt ? 0 : 11)) / 21; p.tx = (slot * 2 - 1) * (PW - 1.5); p.tz = dd * (PL - 7.6 - (i % 3) * 0.8); speed = 4; look = [0, dd * PL]; }
        if (team !== pt && i === 0) { p.tx = 0; p.tz = dd * (PL - 0.3); }
      } else if (ph === "ft" || ph === "intro") { p.tx = u * PW * 0.7; p.tz = depthZ(team, Math.min(v, 0.46)); speed = ph === "ft" ? 1.5 : 6; }
      else if (p === carrier) { p.tx = state.ballX - Math.sin(p.ry) * 0.5; p.tz = state.ballZ - Math.cos(p.ry) * 0.5; speed = 5.2;
        if (Math.hypot(p.tx - p.x, p.tz - p.z) < 0.6) { p.tx = p.x + Math.sin(p.ry) * 1.5; p.tz = p.z + d * 0.6; } }
      else if (p === presser) { p.tx = bx; p.tz = bz - d * 0.9; speed = 6.8; }
      else if (vb.pass && vb.pass.to === p) { const P = vb.pass; p.tx = lerp(p.x, P.to.x, 0.2); p.tz = p.z; speed = 3; look = [vb.x, vb.z]; }
      else { const v2 = clamp(v + (ballV - 0.45) * 0.62 + att, 0.06, 0.94); p.tx = clamp(u * PW * 0.82 + bx * 0.35 * (1 - Math.abs(u) * 0.3) + Math.sin(t * 0.6 + p.ph) * 0.35, -PW + 0.6, PW - 0.6); p.tz = depthZ(team, v2) + Math.cos(t * 0.5 + p.ph) * 0.3; }
      const dist = moveTo(p, dt, speed);
      if (look) face(p, Math.atan2(look[0] - p.x, look[1] - p.z), dt * 8);
      else if (dist > 0.25 && p.slide <= 0) face(p, Math.atan2(p.tx - p.x, p.tz - p.z), dt * 8);
      else if (p.slide <= 0) face(p, Math.atan2(bx - p.x, bz - p.z), dt * 3);
      if (!cel) { p.slide = 0; p.joy = 0; p.sad = 0; p.cx = 0; }
      p.kick = Math.max(0, p.kick - dt * 3.5);
      if (p.dive > 0) p.dive = Math.max(0, p.dive - dt * 0.9);
    });
  });
  // --- officials ---
  const ref = officials[0]; ref.tx = clamp(bx + (bx > 0 ? -5 : 5), -PW + 1, PW - 1); ref.tz = clamp(bz - 4 * Math.sign(state.momentum || 1), -PL + 3, PL - 3);
  if (cel || ph === "ft") { ref.tx = 1.5; ref.tz = 0; }
  moveTo(ref, dt, 5.5); face(ref, Math.atan2(bx - ref.x, bz - ref.z), dt * 4);
  [1, 2].forEach(k => { const L = officials[k]; L.tx = (k === 1 ? -1 : 1) * (PW + 0.45); L.tz = k === 1 ? clamp(bz, 0, PL - 1) : clamp(bz, -PL + 1, 0); if (cel) L.tz = 0; moveTo(L, dt, 5.5); face(L, k === 1 ? Math.PI / 2 : -Math.PI / 2, 1); });
  if (!noDraw) drawHumans(t);
  // ball mesh
  let by = vb.y;
  if (ballFly) { ballFly.t += dt; const k = Math.min(1, ballFly.t / ballFly.dur); state.ballX = lerp(ballFly.fx, ballFly.tx, k); state.ballZ = lerp(ballFly.fz, ballFly.tz, k); by = 0.3 + Math.sin(k * Math.PI * 0.85) * ballFly.h * 1.4; vb.x = state.ballX; vb.z = state.ballZ;
    if (k >= 1) { const bf = ballFly; ballFly = null; shotResult(bf); } }
  ball.position.set(vb.x, by, vb.z); const spd = vb.pass || ballFly ? 14 : (carrier ? carrier.run * 8 : 1); ball.rotation.x += dt * spd; ball.rotation.z += dt * spd * 0.3;
  if (!noDraw) { HUM.root.position.set(vb.x, 0.03, vb.z); HUM.root.rotation.set(-Math.PI / 2, 0, 0); HUM.root.scale.setScalar(0.65); HUM.root.updateMatrixWorld(true); HUM.shadow.setMatrixAt(NP, HUM.root.matrixWorld); HUM.shadow.instanceMatrix.needsUpdate = true; }
  replayRecord(noDraw);
}
function drawHumans(t) {
  const { root, o } = HUM, cel = state.phase === "celebrate";
  PEOPLE.forEach(p => {
    let y = 0, rx = 0, rz = 0, sw = Math.sin(t * 13 + p.ph) * 0.85 * p.run;
    let lL = sw, lR = -sw, aL = -sw * 0.8, aR = sw * 0.8, aLz = 0, aRz = 0;
    if (p.kick > 0) { const k = Math.sin((1 - p.kick) * Math.PI); lR = -1.7 * k; lL = 0.3 * k; aL = 0.6 * k; aR = -0.4 * k; }
    if (p.role === "gk") { aLz = -0.35; aRz = 0.35; if (p.dive > 0) { const k = Math.sin((1 - p.dive) * Math.PI); rz = -p.diveDir * k * 1.35; y = 0.35 * k; aL = aR = -Math.PI * 0.9 * k; } }
    if (p.joy) { y = p.slide > 0 ? 0 : Math.abs(Math.sin(t * 8 + p.ph)) * 0.45; aL = aR = Math.PI * 0.92; aLz = -0.3; aRz = 0.3; }
    if (p.slide > 0) { const k = p.slide; rx = -0.55 * k; y = -0.32 * k; lL = lR = -1.3 * k; aLz = -1.9 * k; aRz = 1.9 * k; aL = aR = -0.3; }
    if (p.sad) { rx = 0.3; aL = aR = 0.05; lL *= 0.5; lR *= 0.5; }
    if (p.role === "lin") { aR = -0.2; }
    root.position.set(p.role === "gk" && p.dive > 0 ? p.x - p.diveDir * Math.sin((1 - p.dive) * Math.PI) * 2.1 : p.x, y, p.z);
    root.rotation.set(0, p.ry, 0); root.rotateX(rx); root.rotateZ(rz); root.scale.setScalar(PS);
    o.legL.rotation.x = lL; o.legR.rotation.x = lR; o.armL.rotation.set(aL, 0, aLz); o.armR.rotation.set(aR, 0, aRz);
    root.updateMatrixWorld(true);
    p.tm.setMatrixAt(p.ti, o.torso.matrixWorld);
    HUM.parts.forEach(k => HUM[k].setMatrixAt(p.n, o[k].matrixWorld));
    if (p.role === "lin") HUM.flag.setMatrixAt(p.idx - 1, o.flag.matrixWorld);
    root.position.set(p.x, 0.03, p.z); root.rotation.set(-Math.PI / 2, 0, 0); root.scale.setScalar(1); root.updateMatrixWorld(true); HUM.shadow.setMatrixAt(p.n, root.matrixWorld);
    p._hx = p.x; p._hz = p.z;
  });
  ["torsoH", "torsoA", "torsoP", "flag", "shadow"].concat(HUM.parts).forEach(k => HUM[k].instanceMatrix.needsUpdate = true);
}
/* ---- replay: ring buffer of the last ~4 s of instance matrices; after a goal it is replayed in slow motion with a close camera ---- */
const RP_N = 140;
const replay = { on: false, frames: [], head: 0, t0: 0, t1: 0, cursor: 0, startAt: 0, dur: 0 };
function rpMeshes() { return ["torsoH", "torsoA", "torsoP", "flag", "shadow"].concat(HUM.parts).map(k => HUM[k]); }
function replayRecord(noDraw) {
  if (noDraw || replay.on || CONFIG.quality.level === 0 && !CLIP) return;
  if (!["play", "shot", "penalty"].includes(state.phase) && !(state.phase === "celebrate" && state.phaseT < 0.5)) return;
  let f = replay.frames[replay.head];
  if (!f) { f = replay.frames[replay.head] = { mats: rpMeshes().map(m => new Float32Array(m.instanceMatrix.array.length)) }; }
  rpMeshes().forEach((m, i) => f.mats[i].set(m.instanceMatrix.array));
  f.t = state.time; f.bx = ball.position.x; f.by = ball.position.y; f.bz = ball.position.z;
  replay.head = (replay.head + 1) % RP_N;
}
function startReplay() {
  if (!shotFrom) return false;
  const fr = replay.frames.filter(f => f && f.t >= shotFrom - 1.2 && f.t <= state.time + 0.01).sort((a, b) => a.t - b.t);
  if (fr.length < 8) return false;
  replay.list = fr; replay.on = true; replay.startAt = state.time; replay.dur = 3.4; window.__replays = (window.__replays || 0) + 1;
  $("replay").classList.add("on"); document.body.classList.add("rp"); return true;
}
function updateReplay() {
  if (!replay.on) return;
  const L = replay.list, k = clamp((state.time - replay.startAt) / replay.dur, 0, 1), tt = L[0].t + (L[L.length - 1].t - L[0].t) * k;
  let i = 0; while (i < L.length - 2 && L[i + 1].t < tt) i++;
  const f = L[i]; rpMeshes().forEach((m, j) => { m.instanceMatrix.array.set(f.mats[j]); m.instanceMatrix.needsUpdate = true; });
  ball.position.set(f.bx, f.by, f.bz); replay.ball = f;
  if (k >= 1 || state.phase !== "celebrate") stopReplay();
}
function stopReplay() { if (!replay.on) return; replay.on = false; $("replay").classList.remove("on"); document.body.classList.remove("rp"); }
