/* ================= renderer / scene ================= */
const W = 540; let H = 960;
const renderer = new THREE.WebGLRenderer({ canvas: $("c"), antialias: true, preserveDrawingBuffer: CLIP });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, W / H, 0.5, 900);
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camTarget = new THREE.Vector3(0, 0, -6);
const PW = 10, PL = 18;           // half pitch width / length
const sideX = t => t === "home" ? -1 : 1;

function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
const lam = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
function box(w, h, d, mat, x, y, z, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m; }
function glowTex(inner, outer) { return canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, inner); r.addColorStop(0.35, outer); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }); }
const TEX = {};

function buildSky() {
  scene.background = canvasTex(4, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#0b1030"); gr.addColorStop(0.45, "#2b2457"); gr.addColorStop(0.7, "#8a3d63"); gr.addColorStop(0.86, "#f08a4b"); gr.addColorStop(1, "#ffd08a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog(0x2a2050, 120, 300);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2a30, 0.75));
  const sun = new THREE.DirectionalLight(0xfff1dd, 0.85); sun.position.set(-30, 80, 40); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x404050, 0.35));
}

function buildPitch() {
  // real proportions scaled to this 20 x 36 pitch: penalty box 11.9 x 5.7, goal area 8.4 x 1.9, spot 3.9, circle/arc r 3.14, corner arcs
  const hiq = !IS_MOBILE || CLIP, PXU = hiq ? 25.6 : 16;
  const tex = canvasTex(40 * PXU, 60 * PXU, (g, w, h) => {
    const X = x => (x + 20) * PXU, Z = z => (z + 30) * PXU, U = v => v * PXU;
    g.fillStyle = "#3d8f38"; g.fillRect(0, 0, w, h);
    const bands = 18, bz = 2 * PL / bands;
    for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? "#47a443" : "#3e9639"; g.fillRect(0, Z(-30 + i * bz * (60 / (2 * PL)) * (2 * PL / 60)), w, U(bz) + 1); }
    for (let i = -6; i < 6; i++) { g.fillStyle = i % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.035)"; g.fillRect(X(i * PW / 3), 0, U(PW / 3), h); }   // cross-cut
    for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.04)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = Math.max(2, U(0.12)); g.fillStyle = "#fff";
    g.strokeRect(X(-PW), Z(-PL), U(2 * PW), U(2 * PL));
    g.beginPath(); g.moveTo(X(-PW), Z(0)); g.lineTo(X(PW), Z(0)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), U(3.14), 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), U(0.18), 0, 7); g.fill();
    [-1, 1].forEach(s => {
      const gl = s * PL, inn = -s;
      g.strokeRect(X(-5.93), s < 0 ? Z(gl) : Z(gl - 5.66), U(11.86), U(5.66));
      g.strokeRect(X(-4.2), s < 0 ? Z(gl) : Z(gl - 1.9), U(8.4), U(1.9));
      const spot = gl + inn * 3.9; g.beginPath(); g.arc(X(0), Z(spot), U(0.16), 0, 7); g.fill();
      const th = Math.acos((5.66 - 3.9) / 3.14); g.beginPath();
      if (s < 0) g.arc(X(0), Z(spot), U(3.14), Math.PI / 2 - th, Math.PI / 2 + th); else g.arc(X(0), Z(spot), U(3.14), -Math.PI / 2 - th, -Math.PI / 2 + th);
      g.stroke();
      [-1, 1].forEach(sx => { g.beginPath(); g.arc(X(sx * PW), Z(gl), U(0.5), 0, Math.PI * 2); g.stroke(); });
    });
    g.globalCompositeOperation = "destination-over";
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), lam(0xffffff, { map: tex })); p.rotation.x = -Math.PI / 2; scene.add(p);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), lam(0x7a3326)); track.rotation.x = -Math.PI / 2; track.position.y = -0.02; scene.add(track);
  // goals
  const white = lam(0xffffff), netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.45 });
  window.goals = {};
  [-1, 1].forEach(s => {
    const gr = new THREE.Group(); gr.position.set(0, 0, s * PL); scene.add(gr);
    const post = new THREE.CylinderGeometry(0.12, 0.12, 1.9, 6);
    [-2.6, 2.6].forEach(x => { const m = new THREE.Mesh(post, white); m.position.set(x, 0.95, 0); gr.add(m); });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.3, 6), white); bar.rotation.z = Math.PI / 2; bar.position.y = 1.9; gr.add(bar);
    const net = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.9, 1.4, 8, 4, 3), netMat); net.position.set(0, 0.95, s * 0.72); gr.add(net);
    goals[s] = { gr, net };
  });
  // ad boards around the pitch
  const adTex = canvasTex(512, 32, (g, w, h) => { const ads = ["İSTANBUL", "BOĞAZ", "SİMİT", "ÇAY", "LIVE", "DOLMABAHÇE", "1903"]; g.fillStyle = "#101522"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "#e8e8e8" : "#ffcc22"; g.font = "900 20px Trebuchet MS"; g.fillText(ads[i], 8 + i * 74, 23); } });
  adTex.wrapS = THREE.RepeatWrapping; adTex.repeat.set(3, 1);
  const adMat = new THREE.MeshBasicMaterial({ map: adTex });
  [-1, 1].forEach(s => { box(0.2, 0.8, 2 * PL + 2, adMat, s * (PW + 1.2), 0.4, -0.5); });
  box(24, 0.8, 0.2, adMat, 0, 0.4, -PL - 2.4); box(24, 0.8, 0.2, adMat, 0, 0.4, PL + 2.4);
}

/* stands: stepped terraces, home (left) black/white, away (right) red/yellow */
const SEATS = { home: [], away: [] };
const ROWS = 8, ZMIN = -16.5, ZMAX = 15.5, ZSTEP = 1.15, RD = 1.5, RH = 0.95, SX0 = PW + 1.9;
function standRow(t, r) { const s = sideX(t); return { x: s * (SX0 + r * RD), y: 0.55 + r * RH }; }
function buildStands() {
  const concrete = lam(0x3a3d48), dark = lam(0x2b2e38);
  TEAMS.forEach(t => {
    const s = sideX(t);
    const seatA = lam(t === "home" ? 0x111111 : AC.n1), seatB = lam(t === "home" ? 0xa8a8a8 : AC.n2);
    for (let r = 0; r < ROWS; r++) {
      const { x, y } = standRow(t, r);
      box(RD, y + 0.1, 2 * PL + 4, concrete, x, (y - 0.1) / 2, -1);
      // seat strip (alternating colours -> striped stand when empty)
      const strip = box(0.5, 0.25, 2 * PL + 4, r % 2 ? seatA : seatB, x + s * 0.35, y + 0.12, -1);
      for (let z = ZMIN; z <= ZMAX + 0.01; z += ZSTEP) SEATS[t].push({ x: x - s * 0.1, y: y + 0.25, z, r, taken: null });
    }
    // back wall + roof cantilever
    const bx = s * (SX0 + ROWS * RD + 0.4);
    box(1.2, ROWS * RH + 2.4, 2 * PL + 6, dark, bx, (ROWS * RH + 2.4) / 2, -1);
    // stand name banner on the wall
    const bt = canvasTex(1024, 64, (g, w, h) => { g.fillStyle = t === "home" ? "#0b0b0b" : "#a50f1c"; g.fillRect(0, 0, w, h);
      g.font = "900 44px Trebuchet MS"; g.textAlign = "center"; g.fillStyle = t === "home" ? "#fff" : AC.hi;
      g.fillText((t === "home" ? "★ " + CONFIG.teams.home.name + " ★  EV SAHİBİ TRİBÜNÜ  ★" : "★ " + CONFIG.teams.away.name + " ★  DEPLASMAN TRİBÜNÜ  ★"), w / 2, 48); });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2 * PL + 4, 2.2), new THREE.MeshBasicMaterial({ map: bt }));
    banner.position.set(bx, ROWS * RH + 2.45, -1); banner.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); scene.add(banner);
    // sort seats: front rows first, centred around z = -2
    SEATS[t].sort((a, b) => (a.r * 5 + Math.abs(a.z - 3)) - (b.r * 5 + Math.abs(b.z - 3)));
  });
  // near end stand (Kapalı) and far end low terraces (Eski Açık), open to the Bosphorus
  for (let r = 0; r < 5; r++) box(2 * SX0 + 2 * ROWS * RD, 0.6 + r * 0.8, 1.4, r % 2 ? lam(0x2a2a2a) : lam(0xdedede), 0, (0.6 + r * 0.8) / 2, PL + 3.6 + r * 1.4);
  for (let r = 0; r < 5; r++) box(2 * SX0 + 2 * ROWS * RD, 0.6 + r * 0.8, 1.4, r % 2 ? lam(0x2a2a2a) : lam(0xdedede), 0, (0.6 + r * 0.8) / 2, -PL - 3.6 - r * 1.4);
  // corner floodlight towers
  const glow = new THREE.SpriteMaterial({ map: glowTex("rgba(255,255,240,1)", "rgba(255,240,200,.5)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  [[-27, -26], [27, -26], [-27, 25], [27, 25]].forEach(([x, z]) => {
    box(0.8, 26, 0.8, lam(0x9aa0aa), x, 13, z);
    const head = box(4, 0.6, 2.4, lam(0xffffff, { emissive: 0xfff6d0, emissiveIntensity: 1 }), x, 26.5, z); 
    const sp = new THREE.Sprite(glow); sp.scale.set(16, 16, 1); sp.position.set(x, 26.5, z); scene.add(sp);
  });
}

/* Bosphorus (beyond the away end, top of screen), Dolmabahçe palace, Asian shore, bridge, mosque */
const water = {};
const XB = SX0 + ROWS * RD + 1;          // back of the away stand
function buildCity() {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 600), new THREE.MeshBasicMaterial({ color: 0x163a6e }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(XB + 210, -0.3, 0); scene.add(sea);
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(400, 600), new THREE.MeshBasicMaterial({ color: 0x0c2148, transparent: true, opacity: 0.6 }));
  deep.rotation.x = -Math.PI / 2; deep.position.set(XB + 290, -0.25, 0); scene.add(deep);
  box(12, 0.6, 140, lam(0x5d564c), XB + 6, -0.1, 0);
  for (let z = -60; z <= 60; z += 6) { const tr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), lam(0x2f6b3a)); tr.position.set(XB + 1.5, 1.6, z + rnd(-1, 1)); scene.add(tr); }
  for (let z = -60; z <= 60; z += 8) box(0.3, 3, 0.3, lam(0x333333), XB + 9, 1.5, z);
  const white = lam(0xf6efe0, { emissive: 0x5a4a2a, emissiveIntensity: 0.5 }), trim = lam(0xe2c77e, { emissive: 0x4a3a10, emissiveIntensity: 0.5 });
  const pal = new THREE.Group(); pal.position.set(XB + 6, 0, -34); scene.add(pal);
  box(7, 4.2, 40, white, 0, 2.1, 0, pal); box(7.6, 0.5, 40.6, trim, 0, 4.4, 0, pal); box(8, 6.5, 10, white, 0, 3.25, 0, pal); box(8.6, 0.5, 10.6, trim, 0, 6.6, 0, pal);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), trim); dome.position.y = 6.8; pal.add(dome);
  for (let i = 0; i < 16; i++) box(0.5, 3.6, 0.5, trim, 3.6, 1.8, -19 + i * 2.55, pal);
  const tower = new THREE.Group(); tower.position.set(XB + 5, 0, -10); scene.add(tower);
  box(1.8, 10, 1.8, white, 0, 5, 0, tower); box(2.3, 2.3, 2.3, trim, 0, 10.6, 0, tower);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), new THREE.MeshBasicMaterial({ color: 0xfff4c0 })); clock.position.set(-1.17, 10.6, 0); clock.rotation.y = -Math.PI / 2; tower.add(clock);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 8), trim); cap.position.y = 13; tower.add(cap);
  const hillMat = new THREE.MeshBasicMaterial({ color: 0x241d38 }), hillMat2 = new THREE.MeshBasicMaterial({ color: 0x2e2546 });
  for (let i = 0; i < 12; i++) { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), i % 2 ? hillMat : hillMat2); h.scale.set(30, rnd(8, 16), rnd(40, 60)); h.position.set(XB + 130 + rnd(-8, 8), -2, -200 + i * 36); scene.add(h); }
  const pts = [], cols = [];
  for (let i = 0; i < 1100; i++) { pts.push(XB + rnd(108, 170), rnd(1, 12), rnd(-200, 200)); const c = new THREE.Color().setHSL(rnd(0.08, 0.14), 0.9, rnd(0.6, 0.85)); cols.push(c.r, c.g, c.b); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); pg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 1.4, vertexColors: true, fog: false })));
  const mq = new THREE.Group(); mq.position.set(XB + 112, 3, 14); scene.add(mq); const mqm = lam(0xcbbfe0, { emissive: 0x6a5a8a, emissiveIntensity: 0.6 });
  box(12, 5, 14, mqm, 0, 2.5, 0, mq); const md = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mqm); md.position.y = 5; mq.add(md);
  [-9, 9].forEach(z => { box(1, 16, 1, mqm, 0, 8, z, mq); const c = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 8), mqm); c.position.set(0, 17.5, z); mq.add(c); });
  const bz = -46, bm = lam(0x8890a8);
  [XB + 30, XB + 100].forEach(x => box(2.4, 34, 2.4, bm, x, 17, bz));
  box(130, 1.2, 3, bm, XB + 65, 14, bz);
  const cable = []; for (let x = XB; x <= XB + 130; x += 2) { const u = (x - (XB + 65)) / 35; const y = Math.abs(u) <= 1 ? 34 - 18 * (1 - u * u) : 34 - (Math.abs(u) - 1) * 35 * 0.55; cable.push(new THREE.Vector3(x, Math.max(14, y), bz)); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cable), new THREE.LineBasicMaterial({ color: 0xc09cff })));
  const lp = []; for (let x = XB; x <= XB + 130; x += 3) lp.push(x, 14.8, bz + 1.6);
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  water.bridgeLights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 2.2, color: 0xa98bff, fog: false })); scene.add(water.bridgeLights);
  const ferry = new THREE.Group(); box(4, 2, 12, lam(0xf2f2f2), 0, 1, 0, ferry); box(3.4, 1.5, 7, lam(0xffffff, { emissive: 0xffd77a, emissiveIntensity: 0.6 }), 0, 2.8, 0, ferry); box(1, 2, 1, lam(0xd03030), 0, 4.4, 0, ferry);
  ferry.position.set(XB + 40, 0, 0); scene.add(ferry); water.ferry = ferry;
  const refl = new THREE.SpriteMaterial({ map: glowTex("rgba(255,210,140,.9)", "rgba(255,170,90,.3)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  water.sparks = [];
  for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(refl); s.position.set(XB + rnd(14, 110), 0.2, rnd(-60, 60)); s.scale.set(rnd(1, 3), rnd(1, 3), 1); scene.add(s); water.sparks.push(s); }
  water.gulls = [];
  const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const gg = new THREE.Group(); const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), gm), w2 = w1.clone(); w1.position.x = -0.45; w2.position.x = 0.45; gg.add(w1, w2);
    gg.userData = { w1, w2, r: rnd(10, 22), y: rnd(16, 24), sp: rnd(0.15, 0.3), ph: rnd(0, 6) }; scene.add(gg); water.gulls.push(gg); }
}
function updateCity(t) {
  if (water.ferry) water.ferry.position.z = -70 + ((t * 3) % 140);
  water.sparks && water.sparks.forEach((s, i) => { s.material.opacity = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); });
  water.gulls && water.gulls.forEach(g => { const u = g.userData; const a = t * u.sp + u.ph; g.position.set(XB + 10 + Math.cos(a) * u.r, u.y + Math.sin(t + u.ph) * 1.5, Math.sin(a) * u.r * 1.4); g.rotation.y = -a; const f = Math.sin(t * 9 + u.ph) * 0.5; u.w1.rotation.z = f; u.w2.rotation.z = -f; });
}
