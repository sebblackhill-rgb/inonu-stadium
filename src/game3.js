/* ================= fans (instanced low-poly supporters) ================= */
const MAXF = 300, FS = 1.85;
const FAN = { home: null, away: null };
const SKIN = [0xf1c9a5, 0xe0ac7e, 0xc68a5e, 0x9a6440, 0xf6d6b8];
const HAIR = [0x1a1210, 0x2d1d12, 0x4a3020, 0x111111, 0x8a6a3a, 0x666666];
function kitTex(t) {
  return canvasTex(64, 64, (g, w, h) => {
    if (t === "home") { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f4f4" : "#111"; g.fillRect(i * 8, 0, 8, h); } }
    else { g.fillStyle = "#b5121b"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffcc22"; g.fillRect(0, 22, w, 14); }
  });
}
function buildFans() {
  TEAMS.forEach(t => {
    const kit = new THREE.MeshLambertMaterial({ map: kitTex(t) });
    const sleeve = lam(t === "home" ? 0x161616 : 0xb5121b), skin = lam(0xffffff), hair = lam(0xffffff), legs = lam(0x2a2f44);
    const scarf = lam(t === "home" ? 0xffffff : 0xffcc22);
    const armG = new THREE.BoxGeometry(0.17, 0.6, 0.17); armG.translate(0, -0.27, 0);
    const parts = {
      torso: new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.72, 0.42), kit, MAXF),
      head: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.27, 1), skin, MAXF),
      hair: new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), hair, MAXF),
      armL: new THREE.InstancedMesh(armG, sleeve, MAXF), armR: new THREE.InstancedMesh(armG, sleeve, MAXF),
      legs: new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.34), legs, MAXF),
      scarf: new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 1.3), scarf, MAXF)
    };
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const k in parts) { const m = parts[k]; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; for (let i = 0; i < MAXF; i++) m.setMatrixAt(i, zero); scene.add(m); }
    for (let i = 0; i < MAXF; i++) { parts.head.setColorAt(i, new THREE.Color(SKIN[i % SKIN.length])); const hc = (i % 5 === 0) ? (t === "home" ? 0xffffff : 0xffcc22) : HAIR[(i * 7) % HAIR.length]; parts.hair.setColorAt(i, new THREE.Color(hc)); }
    parts.head.instanceColor.needsUpdate = true; parts.hair.instanceColor.needsUpdate = true;
    // rig used to compose instance matrices
    const root = new THREE.Object3D(), o = {};
    ["torso", "head", "hair", "legs", "scarf"].forEach(k => { o[k] = new THREE.Object3D(); root.add(o[k]); });
    o.armL = new THREE.Object3D(); o.armR = new THREE.Object3D(); root.add(o.armL, o.armR);
    o.legs.position.y = 0.25; o.torso.position.y = 0.86; o.head.position.y = 1.47; o.hair.position.y = 1.68;
    o.armL.position.set(0, 1.16, 0.4); o.armR.position.set(0, 1.16, -0.4);
    FAN[t] = { parts, root, o };
  });
}
function addFan(id, name, team) {
  const seat = SEATS[team].find(s => !s.taken);
  const f = { id, name, team, idx: teamFans[team].length, seat, joinT: state.time, chantUntil: 0, jumpUntil: 0, sadUntil: 0, hotUntil: state.time + 3,
              say: "", sayUntil: 0, throwUntil: 0, ph: Math.random() * 6.28, score: 0, gifts: 0, flareUntil: 0,
              mPts: 0, mGiftD: 0, mGiftPts: 0, nPts: (nightBook.get(id) || {}).pts || 0, lastChatPt: -9, likeWin: 0, likeWinT: 0 };
  if (f.idx >= MAXF) return null;
  if (seat) seat.taken = f; else f.seat = { x: sideX(team) * (SX0 + ROWS * RD), y: ROWS * RH + 0.5, z: rnd(ZMIN, ZMAX), r: ROWS };
  teamFans[team].push(f); users.set(id, f); return f;
}
function updateFans(t) {
  TEAMS.forEach(team => {
    const F = FAN[team], { root, o, parts } = F, s = sideX(team);
    const level = state.chant[team] / 100, waveOn = level > 0.55;
    teamFans[team].forEach((f, i) => {
      const age = t - f.joinT, pop = age < 0.5 ? Math.sin(Math.min(1, age / 0.5) * Math.PI * 0.5) * (1 + 0.25 * Math.sin(age / 0.5 * Math.PI)) : 1;
      let bob = Math.sin(t * 2 + f.ph) * 0.04, armL = 0.15, armR = -0.15, scarfOn = 0, lean = 0, jump = 0, sy = 1;
      const chanting = t < f.chantUntil || (waveOn && Math.sin(t * 4 - f.seat.z * 0.35) > 0.2);
      if (chanting) { const k = Math.abs(Math.sin(t * 7 + f.ph)); armL = 2.7 + k * 0.3; armR = -2.7 - k * 0.3; bob = k * 0.18; scarfOn = 1; }
      if (t < f.jumpUntil) { jump = Math.abs(Math.sin(t * 9 + f.ph)) * 0.7; armL = 2.9; armR = -2.9; scarfOn = 1; }
      if (t < f.sadUntil) { sy = 0.86; lean = 0.35; armL = 0.05; armR = -0.05; bob = 0; }
      const mf = mexFront(); if (mf !== null && Math.abs(f.seat.z - mf) < 1.8) { jump = 0.65; armL = 2.95; armR = -2.95; scarfOn = 1; }   // Mexican wave
      if (t < f.throwUntil) { const k = clamp((f.throwUntil - t) / 0.5, 0, 1); armR = -(1 - k) * 3.2; }
      root.position.set(f.seat.x, f.seat.y + bob + jump, f.seat.z);
      root.rotation.set(0, s < 0 ? 0 : Math.PI, s * -lean * 0.5);
      root.rotation.z = lean * (s < 0 ? 1 : 1) * 0.5;
      root.scale.set(pop * FS, pop * sy * FS, pop * FS);
      o.armL.rotation.set(armL, 0, 0); o.armR.rotation.set(armR, 0, 0);
      o.scarf.position.set(0, chanting || t < f.jumpUntil ? 1.95 : 1.2, 0); o.scarf.scale.setScalar(scarfOn ? 1 : 0.001);
      o.hair.scale.setScalar(i % 4 === 3 ? 0.001 : 1);
      root.updateMatrixWorld(true);
      for (const k in o) parts[k].setMatrixAt(i, o[k].matrixWorld);
      f._hx = f.seat.x; f._hy = f.seat.y + 2.1 * FS + jump; f._hz = f.seat.z;
    });
    for (const k in parts) parts[k].instanceMatrix.needsUpdate = true;
  });
}

/* ================= effects: flares, smoke, projectiles, drums, tifo ================= */
const smoke = [], flares = [], projs = [], rings = [];
let smokeTex, flareMat = {};
function buildFX() {
  smokeTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(0.6, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  for (let i = 0; i < 120; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); smoke.push({ s, life: 0 }); }
  TEAMS.forEach(t => { flareMat[t] = new THREE.SpriteMaterial({ map: glowTex("rgba(255,255,220,1)", t === "home" ? "rgba(255,60,40,.85)" : "rgba(255,170,30,.85)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }); });
  // stand glow lights (intensity follows active flares)
  TEAMS.forEach(t => { const l = new THREE.PointLight(CONFIG.teams[t].flare, 0, 30, 2); l.position.set(sideX(t) * (SX0 + 4), 6, -2); scene.add(l); flareMat[t + "L"] = l; });
  // drums at the front of each stand
  window.drums = {};
  TEAMS.forEach(t => {
    const g = new THREE.Group(); const s = sideX(t), { x, y } = standRow(t, 0);
    g.position.set(x + s * -0.2, y + 0.9, -9); scene.add(g);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 16), lam(t === "home" ? 0x111111 : 0xb5121b)); shell.rotation.z = Math.PI / 2; g.add(shell);
    [-0.41, 0.41].forEach(dx => { const sk = new THREE.Mesh(new THREE.CircleGeometry(0.86, 16), lam(0xf4f0e6)); sk.position.x = dx; sk.rotation.y = dx < 0 ? -Math.PI / 2 : Math.PI / 2; g.add(sk); });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 16), lam(t === "home" ? 0xffffff : 0xffcc22)); rim.rotation.y = Math.PI / 2; rim.position.x = 0.41; g.add(rim);
    drums[t] = { g, hit: 0 };
  });
  // tifo banners (rise over the stand)
  window.tifos = {};
  TEAMS.forEach(t => {
    const s = sideX(t), C = CONFIG.teams[t];
    const tex = canvasTex(1024, 256, (g, w, h) => {
      if (t === "home") { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#fff" : "#0d0d0d"; g.fillRect(i * w / 16, 0, w / 16 + 1, h); } }
      else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#c4141f"); gr.addColorStop(0.5, "#ffcc22"); gr.addColorStop(1, "#c4141f"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      g.font = "900 120px Trebuchet MS"; g.textAlign = "center"; g.lineWidth = 14; g.strokeStyle = t === "home" ? "#000" : "#6b0010"; g.fillStyle = t === "home" ? "#fff" : "#fff6c8";
      g.strokeText("★ " + C.name + " ★", w / 2, 170); g.fillText("★ " + C.name + " ★", w / 2, 170);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * PL, 13), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, transparent: true }));
    const ang = Math.atan2(RH, RD); m.position.set(s * (SX0 + ROWS * RD * 0.5), ROWS * RH * 0.5 + 2.2, -1); m.rotation.set(0, -s * Math.PI / 2, 0); m.rotateX(-(Math.PI / 2 - ang) * 0.9);
    m.scale.set(1, 0.001, 1); m.visible = false; scene.add(m); tifos[t] = { m, until: 0, start: 0 };
  });
}
function puff(x, y, z, color, size, vy) { const p = smoke.find(q => q.life <= 0) || smoke[Math.floor(Math.random() * smoke.length)]; p.s.visible = true; p.s.position.set(x, y, z); p.s.material.color.set(color); p.life = 1; p.max = rnd(1.6, 2.6); p.size = size || 1.5; p.vy = vy || rnd(1.2, 2.2); p.vx = rnd(-0.4, 0.4); }
function lightTorch(f) {
  if (flares.length > 14) { const old = flares.shift(); scene.remove(old.sp); }
  const sp = new THREE.Sprite(flareMat[f.team]); sp.scale.set(5, 5, 1); sp.position.set(f.seat.x, f.seat.y + 2.3, f.seat.z); scene.add(sp);
  flares.push({ sp, f, until: state.time + 6.5, team: f.team }); f.flareUntil = state.time + 6.5; f.chantUntil = state.time + 6.5; sfx("hiss");
}
const drumQ = { home: 0, away: 0 }, drumLast = { home: -9, away: -9 };
function hitDrum(team) { drumQ[team] = Math.min(4, drumQ[team] + 1); }      // queued + rate-limited so spam = steady rhythm, not noise
function drumTick() {
  TEAMS.forEach(team => {
    if (drumQ[team] <= 0 || state.time - drumLast[team] < 0.32) return;
    drumQ[team]--; drumLast[team] = state.time;
    const d = drums[team]; d.hit = 1; sfx("drum"); rings.push({ team, t: 0 });
    teamFans[team].forEach(f => { if (Math.abs(f.seat.z + 9) < 9 && Math.random() < 0.7) f.jumpUntil = Math.max(f.jumpUntil, state.time + 0.5); });
    fxBurst("BOOM!", team);
  });
}
function throwObject(f, kind) {
  const s = sideX(f.team);
  const m = kind === "bottle"
    ? new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.75, 8), new THREE.MeshLambertMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.85, emissive: 0x113355 }))
    : new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.12), lam(Math.random() < 0.5 ? 0xff3355 : 0x33ccff, { emissive: 0x331111 }));
  if (kind === "bottle") { const capM = box(0.12, 0.12, 0.12, lam(0x1e5bd8), 0, 0.42, 0, m); }
  const fx = f.seat.x, fz = f.seat.z, tx = s * rnd(PW - 7, PW - 1.2), tz = clamp(fz + rnd(-5, 5), -PL + 3, PL - 3);
  m.position.set(fx, f.seat.y + 2, fz); m.scale.setScalar(2.6); scene.add(m);
  projs.push({ m, kind, fx, fy: f.seat.y + 2, fz, tx, tz, t: 0, dur: 1.0, landed: false, rest: 0, spin: rnd(6, 12) });
  f.throwUntil = state.time + 0.5; sfx("whistle", 1);
}
function updateFX(dt, t) {
  smoke.forEach(p => { if (p.life <= 0) return; p.life -= dt / p.max; const k = 1 - p.life; p.s.position.y += p.vy * dt; p.s.position.x += p.vx * dt; const sc = p.size * (0.6 + k * 2.2); p.s.scale.set(sc, sc, 1); p.s.material.opacity = Math.max(0, p.life) * 0.85; if (p.life <= 0) p.s.visible = false; });
  const lit = { home: 0, away: 0 };
  for (let i = flares.length - 1; i >= 0; i--) { const fl = flares[i]; const left = fl.until - t;
    if (left <= 0) { scene.remove(fl.sp); flares.splice(i, 1); continue; }
    lit[fl.team]++; const fk = 4.6 + Math.sin(t * 30 + i) * 0.8 + Math.random() * 0.6; fl.sp.scale.set(fk, fk, 1);
    if (Math.random() < dt * 12) puff(fl.sp.position.x + rnd(-0.3, 0.3), fl.sp.position.y + 0.5, fl.sp.position.z, fl.team === "home" ? 0xff4a3a : 0xffbf3a, 2.4, rnd(2, 3.5)); }
  TEAMS.forEach(tm => { const L = flareMat[tm + "L"]; L.intensity = lerp(L.intensity, Math.min(3, lit[tm] * 0.6) + (lit[tm] ? Math.random() * 0.4 : 0), 0.2); });
  for (let i = projs.length - 1; i >= 0; i--) { const p = projs[i];
    if (!p.landed) { p.t += dt; const k = Math.min(1, p.t / p.dur); if (Math.random() < dt * 25) puff(p.m.position.x, p.m.position.y, p.m.position.z, 0xffffff, 0.5, 0.2); p.m.position.set(lerp(p.fx, p.tx, k), lerp(p.fy, 0.25, k) + Math.sin(k * Math.PI) * 6, lerp(p.fz, p.tz, k)); p.m.rotation.x += p.spin * dt; p.m.rotation.z += p.spin * 0.6 * dt;
      if (k >= 1) { p.landed = true; p.rest = 0; sfx("clank"); const sc = toScreen(p.tx, 1, p.tz); if (sc) bursts.push({ x: sc.x, y: sc.y, t: 0, txt: p.kind === "bottle" ? "🍾 TAK!" : "🔥 ÇAT!", team: "away" }); p.m.rotation.set(Math.PI / 2, rnd(0, 6), 0); puff(p.tx, 0.4, p.tz, 0xcfd6e0, 0.8, 0.6); } }
    else { p.rest += dt; p.m.position.y = 0.2 + Math.max(0, Math.sin(p.rest * 10) * 0.35 * Math.exp(-p.rest * 4)); if (p.rest > 6) { scene.remove(p.m); projs.splice(i, 1); } } }
  TEAMS.forEach(tm => { const d = drums[tm]; d.hit = Math.max(0, d.hit - dt * 4); const k = 1 + d.hit * 0.25; d.g.scale.set(k, k, k); });
  TEAMS.forEach(tm => { const tf = tifos[tm]; if (t < tf.until) { tf.m.visible = true; const k = clamp((t - tf.start) / 0.8, 0, 1), out = clamp((tf.until - t) / 0.6, 0, 1); tf.m.scale.y = Math.max(0.001, Math.min(k, out)); tf.m.position.y = ROWS * RH * 0.5 + 2.2 + Math.sin(t * 2) * 0.15; } else tf.m.visible = false; });
}
