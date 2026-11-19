/* ================= stadium + crowd details: roofs & tiers, LED boards, scoreboard, dugouts, corner flags, light cones,
   end-stand crowd, waving flags, capo, phone lights, paper rain, Mexican wave, quality levels ================= */
const WX = { flags: [], cones: [], corner: [], filler: null, fillerSeats: [], phones: {}, rain: null, led: null, ledGoal: null, scoreTex: null };
const FILL_COLORS = [0x111111, 0xf2f2f2, 0x161616, 0xe8e8e8, 0x2a2a2a, 0xffffff, 0x0d0d0d];
function buildWorld2() {
  const dark = lam(0x2b2e38), steel = lam(0x8d939e), glassMat = new THREE.MeshLambertMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const endW = 2 * SX0 + 2 * ROWS * RD;
  // --- end stands: upper tier + roof (lower tier exists) ---
  [-1, 1].forEach(s => {
    for (let r = 5; r < 9; r++) box(endW, 0.6 + r * 0.8 + 1.6, 1.4, r % 2 ? lam(0x2a2a2a) : lam(0xd8d8d8), 0, (0.6 + r * 0.8 + 1.6) / 2, s * (PL + 3.6 + r * 1.4 + 1.2));
    const zr = s * (PL + 3.6 + 9 * 1.4 + 1.4);
    box(endW, 12.5, 1.0, dark, 0, 6.25, zr);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(endW + 2, 9), glassMat); roof.rotation.x = -Math.PI / 2 - s * 0.12; roof.position.set(0, 13.2, zr - s * 4.3); scene.add(roof);
    box(endW + 2, 0.5, 0.35, steel, 0, 12.7, zr - s * 8.7);                                         // fascia
    for (let x = -endW / 2; x <= endW / 2 + 0.1; x += endW / 6) box(0.35, 13, 0.35, steel, x, 6.5, zr);
    // end-stand seats for the ambient crowd (home colours in both ends, like the Kapalı and Eski Açık)
    for (let r = 0; r < 9; r++) { const up = r >= 5 ? 1.6 : 0, y = 0.6 + r * 0.8 + up + 0.1, z = s * (PL + 3.6 + r * 1.4 + (r >= 5 ? 1.2 : 0));
      for (let x = -endW / 2 + 0.8; x < endW / 2 - 0.5; x += 1.05) WX.fillerSeats.push({ x: x + rnd(-0.12, 0.12), y, z, ph: Math.random() * 6.28, end: s }); }
  });
  // --- side-stand roofs: cantilever from the back wall over the back rows (translucent so the fans stay visible) ---
  TEAMS.forEach(t => { const s = sideX(t), bx = s * (SX0 + ROWS * RD + 0.4), top = ROWS * RH + 2.4;
    for (let z = -PL - 2; z <= PL + 1; z += (2 * PL + 3) / 6) { box(0.4, 4.5, 0.4, steel, bx, top + 2.2, z); }
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2 * PL + 6), glassMat); roof.rotation.set(-Math.PI / 2, s * 0.18, 0); roof.position.set(bx - s * 2.6, top + 4.2, -1); scene.add(roof);
    const fas = box(0.3, 0.45, 2 * PL + 6, lam(0x111622, { emissive: t === "home" ? 0x333333 : 0x551018 }), bx - s * 5.3, top + 3.7, -1); fas.userData.led = true;
    for (let z = -PL; z <= PL; z += 6) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,255,240,1)", "rgba(255,240,200,.4)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(2.2, 2.2, 1); sp.position.set(bx - s * 5.2, top + 3.4, z); scene.add(sp); }
  });
  // --- floodlight cones (high quality only) ---
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [[-27, -26], [27, -26], [-27, 25], [27, 25]].forEach(([x, z]) => {
    const tgt = new THREE.Vector3(x * 0.25, 0, z * 0.25), from = new THREE.Vector3(x, 26.5, z), len = from.distanceTo(tgt);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 9, len, 14, 1, true), coneMat); c.position.copy(from).add(tgt).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(tgt).normalize()); scene.add(c); WX.cones.push(c);
    for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,255,255,1)", "rgba(255,250,220,.5)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(3, 3, 1); sp.position.set(x + (i % 3 - 1) * 1.2, 26.9 + Math.floor(i / 3) * 0.7, z); scene.add(sp); }
  });
  // --- LED boards (animated, generic messages) ---
  WX.led = canvasTex(1024, 48, (g, w, h) => { g.fillStyle = "#05070d"; g.fillRect(0, 0, w, h); const msgs = ["TRİBÜN TV", "★ BOĞAZ FERİBOT", "SİMİTÇİ", "ÇAY OCAĞI", "KARTAL RADYO", "★ İSTANBUL", "LIVE CHANT"];
    g.font = "900 28px Trebuchet MS"; let x = 10; msgs.forEach((m, i) => { g.fillStyle = ["#ffffff", "#ffcc22", "#5fd0ff", "#ff5a5a"][i % 4]; g.fillText(m, x, 34); x += g.measureText(m).width + 40; });
    g.fillStyle = "rgba(0,0,0,.35)"; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); });
  WX.led.wrapS = THREE.RepeatWrapping; WX.led.repeat.set(2, 1);
  WX.ledGoal = canvasTex(1024, 48, (g, w, h) => { g.fillStyle = "#05070d"; g.fillRect(0, 0, w, h); g.font = "900 34px Trebuchet MS"; for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#ffcc22" : "#ffffff"; g.fillText("GOOOL!", 20 + i * 170, 36); } g.fillStyle = "rgba(0,0,0,.35)"; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); });
  WX.ledGoal.wrapS = THREE.RepeatWrapping; WX.ledGoal.repeat.set(2, 1);
  WX.ledMat = new THREE.MeshBasicMaterial({ map: WX.led });
  scene.children.filter(m => m.isMesh && m.material && m.material.map && m.material.map.image && m.material.map.image.width === 512 && m.material.map.image.height === 32).forEach(m => { m.material = WX.ledMat; });
  // --- big screen / scoreboard on the away-stand roof, facing the main camera ---
  WX.scoreCanvas = document.createElement("canvas"); WX.scoreCanvas.width = 512; WX.scoreCanvas.height = 160;
  WX.scoreTex = new THREE.CanvasTexture(WX.scoreCanvas); WX.scoreTex.encoding = THREE.sRGBEncoding;
  const scr = new THREE.Group(); const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), new THREE.MeshBasicMaterial({ map: WX.scoreTex })); scr.add(panel);
  box(9.4, 3.2, 0.3, dark, 0, 0, -0.2, scr); box(0.3, 6, 0.3, steel, -3, -3.8, -0.3, scr); box(0.3, 6, 0.3, steel, 3, -3.8, -0.3, scr);
  // B1 (pass 3): mounted over the middle of the far stand, clear of the HUD cluster at the kickoff sweep, in play and at full time (desktop, ?mobile=1, phones; see test B1)
  scr.position.set(21, 9.3, 4.5); scr.lookAt(-34, 60, 4.5); scene.add(scr); WX.screen = scr; WX.screenPanel = panel; drawScoreboard(true);
  // --- dugouts on the home touchline + substitutes ---
  const subsB = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.7, 0.4), lam(0xffffff), 16), subsH = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 0), lam(0xffffff), 16); let si = 0;
  const M = new THREE.Matrix4();
  [-6.5, 6.5].forEach((z, k) => { const g = new THREE.Group(); g.position.set(-(PW + 0.75), 0, z); scene.add(g);
    box(0.9, 0.12, 4.2, steel, 0, 1.15, 0, g); box(0.1, 1.15, 4.2, dark, -0.45, 0.58, 0, g); box(0.9, 1.15, 0.08, glassMat, 0, 0.58, 2.1, g); box(0.9, 1.15, 0.08, glassMat, 0, 0.58, -2.1, g);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 4.3), glassMat); roof.position.set(0, 1.22, 0); g.add(roof);
    for (let i = 0; i < 7; i++) { const zz = z - 1.7 + i * 0.56; M.makeTranslation(-(PW + 0.95), 0.55, zz); subsB.setMatrixAt(si, M); subsB.setColorAt(si, new THREE.Color(k ? (i % 2 ? AC.n1 : AC.n2) : (i % 2 ? 0x111111 : 0xeeeeee)));
      M.makeTranslation(-(PW + 0.95), 1.02, zz); subsH.setMatrixAt(si, M); subsH.setColorAt(si, new THREE.Color(SKIN[i % SKIN.length])); si++; }
    M.makeTranslation(-(PW + 0.25), 0.95, z + 2.5); subsB.setMatrixAt(si, M.multiply(new THREE.Matrix4().makeScale(1, 1.4, 1))); subsB.setColorAt(si, new THREE.Color(0x22252e)); M.makeTranslation(-(PW + 0.25), 1.6, z + 2.5); subsH.setMatrixAt(si, M); subsH.setColorAt(si, new THREE.Color(SKIN[2])); si++;   // coach
  });
  subsB.count = subsH.count = si; scene.add(subsB, subsH);
  // --- corner flags ---
  const pole = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), flagG = new THREE.PlaneGeometry(0.6, 0.4); flagG.translate(0.3, 0, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => { const p = new THREE.Mesh(pole, lam(0xffffff)); p.position.set(sx * PW, 0.8, sz * PL); scene.add(p);
    const f = new THREE.Mesh(flagG, new THREE.MeshLambertMaterial({ color: i % 2 ? 0xffcc22 : 0xe01b2f, side: THREE.DoubleSide })); f.position.set(sx * PW, 1.4, sz * PL); scene.add(f); WX.corner.push(f); });
  // --- ambient crowd in the end stands (instanced) ---
  const nF = WX.fillerSeats.length;
  WX.filler = { body: new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.85, 0.4), lam(0xffffff), nF), head: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 0), lam(0xffffff), nF),
                arm: new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), lam(0xffffff), nF), n: nF, every: 1 };
  WX.fillerSeats.forEach((s, i) => { const c = new THREE.Color(FILL_COLORS[i % FILL_COLORS.length]); WX.filler.body.setColorAt(i, c); WX.filler.arm.setColorAt(i, c); WX.filler.head.setColorAt(i, new THREE.Color(SKIN[i % SKIN.length])); });
  ["body", "head", "arm"].forEach(k => { const m = WX.filler[k]; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); });
  // --- big waving flags ---
  const flagTex = (kind) => canvasTex(128, 80, (g, w, h) => {
    if (kind === "home") { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff" : "#111"; g.fillRect(i * 16, 0, 16, h); } g.fillStyle = "#ffd75e"; g.font = "900 44px serif"; g.textAlign = "center"; g.fillText("★", 64, 56); }
    else if (kind === "away") { g.fillStyle = AC.c1; g.fillRect(0, 0, w, h); g.fillStyle = AC.c2; g.fillRect(0, 28, w, 24); }
    else { g.fillStyle = "#111"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 22px Trebuchet MS"; g.textAlign = "center"; g.fillText("İSTANBUL", 64, 48); } });
  const spots = [["home", -(SX0 + 6.8 * RD), 7.6, -12], ["home", -(SX0 + 6.8 * RD), 7.6, 0], ["home", -(SX0 + 6.8 * RD), 7.6, 12], ["away", SX0 + 6.8 * RD, 7.6, -10], ["away", SX0 + 6.8 * RD, 7.6, 8],
                 ["city", 0, 9.5, -(PL + 15)], ["home", -12, 9.5, PL + 15], ["home", 12, 9.5, -(PL + 15)]];
  spots.forEach(([k, x, y, z], i) => { const geo = new THREE.PlaneGeometry(3.2, 2, 10, 4); geo.translate(1.6, 0, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: flagTex(k), side: THREE.DoubleSide })); m.position.set(x, y + 1.2, z); m.rotation.y = Math.abs(z) > PL + 5 ? 0 : Math.PI / 2; scene.add(m);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 5), steel); pl.position.set(x, y + 0.6, z); scene.add(pl);
    WX.flags.push({ m, base: geo.attributes.position.array.slice(), ph: i * 1.3 }); });
  // --- capo with megaphone on the home end, next to the drum ---
  const capo = new THREE.Group(), cx = -(SX0 - 0.55), cz = -12.2; capo.position.set(cx, 0, cz); scene.add(capo);
  box(1.4, 1.0, 1.4, lam(0x333744), 0, 0.5, 0, capo);
  const body = box(0.62, 0.78, 0.4, lam(0x111111), 0, 1.6, 0, capo); const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), lam(SKIN[1])); hd.position.y = 2.25; capo.add(hd);
  box(0.5, 0.12, 0.5, lam(0xffffff), 0, 2.47, 0, capo);
  const armG = new THREE.BoxGeometry(0.15, 0.6, 0.15); armG.translate(0, -0.28, 0);
  const aR = new THREE.Mesh(armG, lam(0x111111)); aR.position.set(0, 1.95, 0.4); capo.add(aR); const aL = new THREE.Mesh(armG, lam(0x111111)); aL.position.set(0, 1.95, -0.4); capo.add(aL);
  const meg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.08, 0.6, 10, 1, true), lam(0xf2f2f2, { side: THREE.DoubleSide })); meg.position.set(0, -0.6, 0); meg.rotation.x = Math.PI; aR.add(meg);
  box(0.5, 0.5, 0.36, lam(0x111111), 0, 0.95, 0, capo);
  capo.rotation.y = -Math.PI / 2;          // facing the home stand
  WX.capo = { g: capo, aR, aL, hd };
  // --- phone lights (one per joined fan) + end-stand lights ---
  const ptex = glowTex("rgba(255,255,255,1)", "rgba(190,215,255,.6)");
  TEAMS.forEach(t => { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAXF * 3), 3)); geo.setDrawRange(0, 0);
    const pm = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.9, map: ptex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); pm.frustumCulled = false; scene.add(pm); WX.phones[t] = { pm, n: -1 }; });
  // --- paper rain on goals ---
  const RN = 500, rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RN * 3), 3)); rg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(RN * 3), 3));
  WX.rain = { pts: new THREE.Points(rg, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false })), v: new Float32Array(RN * 3), n: RN, until: -1 };
  WX.rain.pts.visible = false; WX.rain.pts.frustumCulled = false; scene.add(WX.rain.pts);
}
let scoreKey = "";
function drawScoreboard(force) {
  const key = state.goals.home + "-" + state.goals.away + "|" + Math.floor(state.minute) + "|" + state.phase + CONFIG.lang;
  if (!force && key === scoreKey) return; scoreKey = key;
  const g = WX.scoreCanvas.getContext("2d"), w = 512, h = 160;
  g.fillStyle = "#03050a"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#111"; g.fillRect(0, 0, w / 2, 44); g.fillStyle = "#a50f1c"; g.fillRect(w / 2, 0, w / 2, 44);
  g.font = "900 30px Trebuchet MS"; g.textAlign = "center"; g.fillStyle = "#fff"; g.fillText(tName("home"), w / 4, 33); g.fillStyle = AC.hi; g.fillText(tName("away"), 3 * w / 4, 33);
  g.font = "900 86px Trebuchet MS"; g.fillStyle = state.phase === "celebrate" ? "#ffd75e" : "#fff"; g.fillText(state.goals.home + " - " + state.goals.away, w / 2, 128);
  g.font = "900 26px Trebuchet MS"; g.fillStyle = "#7fe08a"; g.textAlign = "left"; g.fillText(state.phase === "ft" ? T("ft") : Math.floor(state.minute) + "'", 14, 150);
  g.fillStyle = "rgba(0,0,0,.3)"; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  WX.scoreTex.needsUpdate = true;
}
function startMexWave() { if (state.time - (state.mex ? state.mex.t0 : -99) < 12) return; state.mex = { t0: state.time }; window.__mexWaves = (window.__mexWaves || 0) + 1; }
function mexFront() { if (!state.mex) return null; const k = (state.time - state.mex.t0) / 4; return k > 1 ? null : lerp(-PL - 14, PL + 14, k); }
function paperRain(team) {
  const R = WX.rain, P = R.pts.geometry.attributes.position.array, C = R.pts.geometry.attributes.color.array, s = sideX(team);
  const cols = team === "home" ? [[1, 1, 1], [0.08, 0.08, 0.08], [1, 1, 1]] : [[0.75, 0.07, 0.11], [1, 0.8, 0.13], [1, 1, 1]];
  for (let i = 0; i < R.n; i++) { const fromEnd = i % 3 === 0; P[i * 3] = fromEnd ? rnd(-12, 12) : s * rnd(SX0, SX0 + ROWS * RD); P[i * 3 + 1] = rnd(9, 16); P[i * 3 + 2] = fromEnd ? (Math.random() < 0.5 ? -1 : 1) * rnd(PL + 3, PL + 12) : rnd(-PL, PL);
    R.v[i * 3] = rnd(-0.6, 0.6) - s * (fromEnd ? 0 : 1.2); R.v[i * 3 + 1] = -rnd(1.2, 2.4); R.v[i * 3 + 2] = rnd(-0.6, 0.6); const c = cols[i % 3]; C[i * 3] = c[0]; C[i * 3 + 1] = c[1]; C[i * 3 + 2] = c[2]; }
  R.pts.geometry.attributes.color.needsUpdate = true; R.until = state.time + 6; R.pts.visible = true; window.__paperRains = (window.__paperRains || 0) + 1;
}
let wxFrame = 0;
function updateWorld2(dt, t, noDraw) {
  if (noDraw) return;
  wxFrame++; const Q = CONFIG.quality.level;
  WX.led.offset.x = (t * 0.04) % 1; WX.ledGoal.offset.x = (t * 0.12) % 1;
  WX.ledMat.map = state.phase === "celebrate" && state.phaseT < 5 ? WX.ledGoal : WX.led;
  drawScoreboard(); WX.screenPanel.material.color.setScalar(state.phase === "ft" ? 0.28 : 1);   // dimmed under the full-time ceremony
  WX.corner.forEach((f, i) => { f.rotation.y = Math.sin(t * 3 + i) * 0.5 + 0.4; });
  if (Q >= 1 || wxFrame % 4 === 0) WX.flags.forEach(F => { if (Q === 0 && wxFrame > 4) return; const a = F.m.geometry.attributes.position, b = F.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3]; a.array[i * 3 + 2] = Math.sin(t * 5 + x * 1.6 + F.ph) * 0.18 * x; a.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 4 + x * 2 + F.ph) * 0.05 * x; } a.needsUpdate = true; });
  // ambient crowd
  const Fl = WX.filler, every = Q === 2 ? 1 : Q === 1 ? 2 : 0;
  if (every && (wxFrame % every === 0) || Fl.drawn !== true) {
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), lvl = state.chant.home / 100, cel = state.phase === "celebrate" && state.lastScorer === "home", front = mexFront();
    const show = Q === 0 ? Math.floor(Fl.n * 0.5) : Fl.n;
    for (let i = 0; i < show; i++) { const s = WX.fillerSeats[i]; let y = s.y + 0.45, arm = 0.2;
      const k = Math.sin(t * 6 + s.ph);
      if (every) { if (cel) { y += Math.abs(k) * 0.5; arm = 2.9; } else if (lvl > 0.5 && k > 0.3) { y += 0.12; arm = 2.6; } else y += k * 0.03;
        if (front !== null && Math.abs(s.x * 0.6 + s.end * 4 - front) < 2.5) { y += 0.6; arm = 3.0; } }
      P.set(s.x, y, s.z); M.compose(P, q, S); Fl.body.setMatrixAt(i, M); P.y = y + 0.62; M.compose(P, q, S); Fl.head.setMatrixAt(i, M);
      M.makeRotationX(s.end > 0 ? -arm : arm); M.setPosition(s.x + 0.32, y + 0.3, s.z); Fl.arm.setMatrixAt(i, M); }
    Fl.body.count = Fl.head.count = Fl.arm.count = show;
    ["body", "head", "arm"].forEach(k => Fl[k].instanceMatrix.needsUpdate = true); Fl.drawn = true;
  }
  // capo: pumps the megaphone with the home chant
  const C = WX.capo, hk = state.chant.home > 25 ? Math.abs(Math.sin(t * 6)) : 0.1; C.aR.rotation.x = -2.2 - hk * 0.3; C.aL.rotation.x = 1.0 + hk * 1.8; C.hd.rotation.z = Math.sin(t * 6) * 0.1 * hk; C.g.position.y = hk * 0.08;
  // phone lights when an end is loud, during a tifo, or after full time
  TEAMS.forEach(tm => { const P = WX.phones[tm]; if (P.n !== teamFans[tm].length) { const a = P.pm.geometry.attributes.position.array; teamFans[tm].forEach((f, i) => { a[i * 3] = f.seat.x; a[i * 3 + 1] = f.seat.y + 2.6 * FS; a[i * 3 + 2] = f.seat.z; }); P.n = teamFans[tm].length; P.pm.geometry.setDrawRange(0, P.n); P.pm.geometry.attributes.position.needsUpdate = true; }
    const on = state.chant[tm] > 70 || t < tifos[tm].until || state.phase === "ft"; P.pm.material.opacity = lerp(P.pm.material.opacity, on ? 0.55 + Math.sin(t * 9) * 0.25 : 0, 0.1); P.pm.visible = P.pm.material.opacity > 0.02 && Q > 0; });
  // paper rain
  const R = WX.rain; if (R.pts.visible) { const P = R.pts.geometry.attributes.position.array; for (let i = 0; i < R.n; i++) { P[i * 3] += (R.v[i * 3] + Math.sin(t * 3 + i) * 0.5) * dt; P[i * 3 + 1] = Math.max(0.05, P[i * 3 + 1] + R.v[i * 3 + 1] * dt); P[i * 3 + 2] += R.v[i * 3 + 2] * dt; }
    R.pts.geometry.attributes.position.needsUpdate = true; R.pts.material.opacity = clamp((R.until - t) / 1.5, 0, 0.95); if (t > R.until) R.pts.visible = false; }
}
function setWorldQuality(l) { WX.cones.forEach(c => c.visible = l === 2); if (WX.filler) WX.filler.drawn = false; }
