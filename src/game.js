
/* ============================================================
   BUILD THE GREAT PYRAMID — TikTok LIVE crowd game
   CONFIG: change team names, keywords, colours, gift thresholds
   and every on-screen text here. Press L to toggle EN / TR.
   ============================================================ */
const CONFIG = {
  lang: "en",
  teams: {
    sun: {
      id: "sun", name: "Team SUN", nameTR: "GÜNEŞ Takımı", short: "SUN", shortTR: "GÜNEŞ",
      keywords: ["SUN", "GUNES", "GÜNEŞ", "RA", "☀️", "☀", "🌞", "🔆"],
      colors: { primary: 0xf2a81d, secondary: 0xc0392b, dark: 0x8a5208, cloth: 0xf6b52a, banner: 0xe8961a, css: "#f2a81d", css2: "#ffd36a" }
    },
    nile: {
      id: "nile", name: "Team NILE", nameTR: "NİL Takımı", short: "NILE", shortTR: "NİL",
      keywords: ["NILE", "NIL", "NİL", "🌊", "💧", "🐊", "💙"],
      colors: { primary: 0x1e7ae0, secondary: 0x16b8a8, dark: 0x0c3a7a, cloth: 0x2a8af0, banner: 0x1b6ad0, css: "#2f8cf0", css2: "#8ccaff" }
    }
  },
  // ---- build pacing ----
  // One team half needs (layers - prebuiltLayers) * blocksPerLayer * pullsPerBlock heave points:
  // 34 * 6 * 35 = 7140 points per team. With the bot mix (mostly comments, some likes/roses/gifts,
  // about 1.4 heave points per event per team) that is roughly:
  //   3 events/s -> ~29 min   5 events/s -> ~17 min   7 events/s -> ~12 min
  // Lower pullsPerBlock (or layers) for a smaller stream, raise it for a huge one.
  layers: 36,            // pyramid layers to finish (including the prebuilt base)
  prebuiltLayers: 2,     // layers already standing when a round starts
  blocksPerLayer: 6,     // blocks each team hauls to complete one layer of its half
  pullsPerBlock: 35,     // heave points needed to haul one block
  demoSpeed: 3,          // heave multiplier for the bot demo / shared link (~4 min build at 7 bot events/s). ?live=1 always uses 1x. Override: ?speed=N
  milestoneEvery: 5,     // MILESTONE popup + celebration every N layers
  gust: { at: [0.4, 0.75], seconds: 20, bonus: 2 }, // sandstorm gusts when the leading team passes these fractions of the build; heaves count x bonus while they blow
  points: { chat: 1, like: 0.25, rose: 3, medium: 12, lion: 70 }, // build points per action (gifts are per repeat; 🦁 Lion = 2 blocks at 35 pts/block)
  overseerThreshold: 250, // gift total (diamonds) to join the OVERSEERS board
  pharaohGift: 1000,      // single gift (diamonds) that crowns a team's PHARAOH
  bossHP: 20000,          // Apep health for a full crowd (bossFullCrowd active viewers); scaled 30%-150% by the active crowd
  bossFullCrowd: 40,      // active viewers (last 2 min) that face the full bossHP
  bossTimeLimit: 240,     // seconds; if Apep is still alive, "Ra intervenes" and the round ends (no stalls in quiet streams)
  streakTimeoutMs: 6000,  // a gift streak without its final event is settled at its last count after this long
  streakMemoryMs: 300000, // settled streaks are remembered this long; a later final for the same streak only credits its increase (see ledger.js)
  streakMemoryMax: 5000,  // bound on remembered streaks
  eventIdMemory: 20000,   // LRU of processed event ids (kept across connector reconnects) to drop replays
  maxParticipants: 20000, // normal participant cap; extra gifted viewers remain recognisable
  giftOverflowReserve: 2000, // protected credit-only users above the normal 20k limit
  calmEffects: false,     // fewer flashes / no shake (also ?calm=1 or the host panel)
  bossDamage: { chat: 6, like: 2, diamond: 8, lion: 4000 },
  maxWorkers: 360,        // visible avatars; extra viewers still count and are shown as "+N cheering"
  ropeRows: 14,          // rows of 4 hauling on the ropes per team; extra viewers cheer by the track
  maxLabels: 60,
  strings: {
    en: {
      title: "BUILD THE GREAT PYRAMID", titleBoss: "APEP'S SANDSTORM",
      r1k: "Grab a rope", r1h: "Type {k1} or {k2}",
      r2k: "Power heave", r2h: "🌹 Rose / ❤️ Heart",
      r1kBoss: "Fight the storm", r1hBoss: "Comment = sling a stone",
      r2kBoss: "Sun beams", r2hBoss: "🌹 Rose / 🎁 gifts",
      hint: "{o} 💎 = OVERSEER · {p} gift = PHARAOH · 🦁 Lion = WRATH OF RA",
      layer: "Layer {n}/{t}",
      workers: "{n} workers",
      layersShort: "🧱 {a} vs {b}",
      pharaoh: "PHARAOHS", pharaohNeed: "Send a {p} gift to rule",
      overseers: "OVERSEERS", heaves: "MOST HEAVES", power: "MOST POWER",
      newPharaoh: "NEW PHARAOH!", newPharaohSub: "{name} rules {team}!",
      blessing: "RA'S BLESSING!", blessingSub: "{name} hauled a whole block!",
      layerDone: "LAYER {n}!", layerDoneSub: "{team} laid a new layer",
      milestone: "MILESTONE · LAYER {n}", milestoneSub: "{team} has built {pct}% of the Great Pyramid!",
      gust: "SANDSTORM GUST!", gustSub: "Hold the ropes! Every heave counts x{b} for {s}s",
      logGust: "A sandstorm gust! Heaves count x{b}!", logGustEnd: "The gust passes.",
      logMilestone: "{team} reached the layer {n} milestone!",
      raceWin: "{team} FINISHED FIRST!", raceWinSub: "But the god of chaos wakes...",
      bossIntro: "APEP RISES!", bossIntroSub: "Gifts fire sun beams · 🦁 = WRATH OF RA",
      ra: "WRATH OF RA!", raSub: "{name} called down the sun!",
      hp: "APEP {hp} / {max}",
      win: "THE PYRAMID STANDS!", winSub: "GLORY TO {team}!",
      logJoin: "{name} grabbed the {team} rope!",
      logHeave: "{name} heaved!",
      logRose: "{name} sent {x}🌹 · overseer {have}/{need}",
      logHeart: "{name} sent {x}❤️ · overseer {have}/{need}",
      logGift: "{name} sent a gift ({d}💎) · {have}/{need}",
      logLion: "{name} sent a 🦁 Lion!",
      logPharaoh: "{name} became PHARAOH of {team}!",
      logLayer: "{team} finished layer {n}!",
      logBoss: "Apep attacks the pyramids!",
      logWin: "Golden capstone raised for {team}!",
      logOverseer: "{name} is now an OVERSEER!",
      startT: "▶ TAP TO START", startS: "Demo: a bot crowd joins and plays. Tap 🧪 to open the test panel and join yourself, send roses or a Lion.",
      apepDown: "APEP IS DEFEATED!",
      // ---- viewer strip (rotating rules + receipts) ----
      rcJoin: "👋 {name} joined {team} · +{pts} build pts",
      rcChat: "💬 {name} · {team} · +{pts} build pts",
      rcLike: "👍 {name} · {team} · +{pts} build pts",
      rcGift: "{icon} {name} · {team} · +{pts} build pts",
      rcBoss: "{icon} {name} · {team} · −{dmg} Apep",
      rcHeld: "⏳ {name} · {team} · {what} saved for {when}",
      heldBoss: "the Apep fight", heldRound: "the next round", heldPause: "after the pause",
      rcPick: "✋ {name}: type {k1} or {k2} to pick a crew — your {what} is saved",
      rcStay: "🔒 {name} stays on {team} (crews are locked for the session)",
      rcQueue: "👥 {name} joined {team} · cheering off-screen, every point counts",
      rcFlush: "✅ {name} · {team} · saved {what} now applied",
      rcStreak: "{icon} {name} · streak ×{n}…",
      rcCrown: "👑 {name} · {team} · crowned PHARAOH",
      rcMore: "+{n} more contributions credited",
      whatGift: "gift", whatLike: "likes", whatAll: "contributions",
      cheering: "+{n} cheering", choosing: "{n} choosing",
      // ---- connection / host ----
      connDemo: "DEMO · bots", connTest: "TEST", connConnecting: "LIVE · connecting…", connListening: "LIVE · waiting for first event",
      connLive: "LIVE ● {s}s ago", connQuiet: "LIVE · quiet {s}s", connDown: "NOT CONNECTED · retry {s}s", connDownManual: "NOT CONNECTED · host must retry",
      paused: "⏸ PAUSED",
      // ---- boards / ceremony ----
      boardPharaohs: "PHARAOHS · session", boardSupporters: "SUPPORTERS · session", boardTest: "test",
      boardHaulers: "TOP HAULERS · this round", boardDamage: "APEP DAMAGE · this round",
      raIntervenes: "RA INTERVENES!", raIntervenesSub: "The sun banishes Apep — the crews held the line",
      winSub2: "Build crown: {b} · Slayer crew: {s}",
      hero: "Hero of the round: {name}",
      medal: "🏅 {n} builders earned the round {r} medal",
      lionX: "×{n}",
      blockMeter: "🧱 {b}/{t}",
      gustChip: "🌪️ ×{b} · {s}s",
      ruleWin: "🏁 First crew to layer {L} wins · then all fight Apep",
      ruleUnits: "💬+1 · 👍+0.25 · 🌹❤️+3 · 🎁+12 · 🦁+70{mult}",
      ruleLock: "🔒 Your crew is locked for the whole session",
      ruleCrown: "👑 {p}-coin gift = PHARAOH · {o}💎 = OVERSEER",
      multDemo: " (demo ×{x})",
      ruleBoss1: "💬 −{c} · 👍 −{l} · gifts −{d} per 💎",
      ruleBoss2: "🦁 Lion = WRATH OF RA −{x}",
      ruleBoss3: "⏳ {t}s left · most damage = SLAYER crew",
      ruleRace: "🏁 {team} wins the build! Gifts now hit Apep",
      ruleVictory: "🏆 New round soon · gifts count for it",
      waitTitle: "The crew is gathering…", waitSub: "Type {k1} or {k2} to join when LIVE starts",
      waitSoon: "⏳ Waiting for the LIVE to start", waitReady: "🟢 LIVE is on: be the first to grab a rope!",
      chants: ["HEAVE!", "HEY-YA!", "PULL!", "UP!", "RA!"]
    },
    tr: {
      title: "BÜYÜK PİRAMİDİ İNŞA ET", titleBoss: "APEP'İN KUM FIRTINASI",
      r1k: "Halata sarıl", r1h: "{k1} veya {k2} yaz",
      r2k: "Güçlü çekiş", r2h: "🌹 Gül / ❤️ Kalp",
      r1kBoss: "Fırtınayla savaş", r1hBoss: "Yorum = taş fırlat",
      r2kBoss: "Güneş ışını", r2hBoss: "🌹 Gül / 🎁 hediye",
      hint: "{o} 💎 atan NAZIR · {p} tek hediye = FİRAVUN · 🦁 Aslan = RA'NIN GAZABI",
      layer: "Kat {n}/{t}",
      workers: "{n} işçi",
      layersShort: "🧱 {a} - {b}",
      pharaoh: "FİRAVUNLAR", pharaohNeed: "{p}'lik hediye ile hükmet",
      overseers: "NAZIRLAR", heaves: "EN ÇOK ÇEKEN", power: "EN GÜÇLÜ",
      newPharaoh: "YENİ FİRAVUN!", newPharaohSub: "{name} {team} hükümdarı!",
      blessing: "RA'NIN LÜTFU!", blessingSub: "{name} koca bir blok taşıdı!",
      layerDone: "{n}. KAT!", layerDoneSub: "{team} yeni kat ördü",
      milestone: "KİLOMETRE TAŞI · {n}. KAT", milestoneSub: "{team} Büyük Piramidin %{pct}'ini inşa etti!",
      gust: "KUM FIRTINASI!", gustSub: "Halatları bırakmayın! {s} sn boyunca her çekiş x{b}",
      logGust: "Kum fırtınası! Çekişler x{b} sayılıyor!", logGustEnd: "Fırtına dindi.",
      logMilestone: "{team} {n}. kat kilometre taşına ulaştı!",
      raceWin: "{team} İLK BİTİRDİ!", raceWinSub: "Ama kaos tanrısı uyanıyor...",
      bossIntro: "APEP YÜKSELİYOR!", bossIntroSub: "Hediyeler güneş ışını atar · 🦁 = RA'NIN GAZABI",
      ra: "RA'NIN GAZABI!", raSub: "{name} güneşi indirdi!",
      hp: "APEP {hp} / {max}",
      win: "PİRAMİT AYAKTA!", winSub: "ŞAN OLSUN {team}!",
      logJoin: "{name} {team} halatına sarıldı!",
      logHeave: "{name} çekti!",
      logRose: "{name} {x}🌹 attı · nazırlık {have}/{need}",
      logHeart: "{name} {x}❤️ attı · nazırlık {have}/{need}",
      logGift: "{name} hediye attı ({d}💎) · {have}/{need}",
      logLion: "{name} 🦁 Aslan attı!",
      logPharaoh: "{name} {team} FİRAVUNU oldu!",
      logLayer: "{team} {n}. katı bitirdi!",
      logBoss: "Apep piramitlere saldırıyor!",
      logWin: "Altın tepe taşı {team} için yükseldi!",
      logOverseer: "{name} artık NAZIR!",
      startT: "▶ BAŞLAMAK İÇİN DOKUN", startS: "Demo: bot kalabalık katılır ve oynar. Kendin katılmak, gül ya da Aslan atmak için 🧪 test paneline dokun.",
      apepDown: "APEP YENİLDİ!",
      rcJoin: "👋 {name} {team} takımına katıldı · +{pts} inşa puanı",
      rcChat: "💬 {name} · {team} · +{pts} inşa puanı",
      rcLike: "👍 {name} · {team} · +{pts} inşa puanı",
      rcGift: "{icon} {name} · {team} · +{pts} inşa puanı",
      rcBoss: "{icon} {name} · {team} · Apep −{dmg}",
      rcHeld: "⏳ {name} · {team} · {what} {when} için saklandı",
      heldBoss: "Apep savaşı", heldRound: "yeni tur", heldPause: "mola sonrası",
      rcPick: "✋ {name}: takım seçmek için {k1} veya {k2} yaz — {what} saklandı",
      rcStay: "🔒 {name} {team} takımında kalır (takımlar oturum boyunca kilitli)",
      rcQueue: "👥 {name} {team} takımına katıldı · ekran dışında tezahürat, her puan sayılır",
      rcFlush: "✅ {name} · {team} · saklanan {what} uygulandı",
      rcStreak: "{icon} {name} · seri ×{n}…",
      rcCrown: "👑 {name} · {team} · FİRAVUN oldu",
      rcMore: "+{n} katkı daha sayıldı",
      whatGift: "hediyen", whatLike: "beğenilerin", whatAll: "katkıların",
      cheering: "+{n} tezahürat", choosing: "{n} seçiyor",
      connDemo: "DEMO · botlar", connTest: "TEST", connConnecting: "CANLI · bağlanıyor…", connListening: "CANLI · ilk olay bekleniyor",
      connLive: "CANLI ● {s} sn önce", connQuiet: "CANLI · {s} sn sessiz", connDown: "BAĞLI DEĞİL · {s} sn sonra tekrar", connDownManual: "BAĞLI DEĞİL · yayıncı yeniden denemeli",
      paused: "⏸ DURAKLATILDI",
      boardPharaohs: "FİRAVUNLAR · oturum", boardSupporters: "DESTEKÇİLER · oturum", boardTest: "test",
      boardHaulers: "EN ÇOK ÇEKENLER · bu tur", boardDamage: "APEP HASARI · bu tur",
      raIntervenes: "RA MÜDAHALE ETTİ!", raIntervenesSub: "Güneş Apep'i kovdu — takımlar dayandı",
      winSub2: "İnşa tacı: {b} · Avcı takım: {s}",
      hero: "Turun kahramanı: {name}",
      medal: "🏅 {n} inşaatçı {r}. tur madalyası kazandı",
      lionX: "×{n}",
      blockMeter: "🧱 {b}/{t}",
      gustChip: "🌪️ ×{b} · {s} sn",
      ruleWin: "🏁 {L}. kata ilk varan kazanır · sonra hep birlikte Apep",
      ruleUnits: "💬+1 · 👍+0,25 · 🌹❤️+3 · 🎁+12 · 🦁+70{mult}",
      ruleLock: "🔒 Takımın oturum boyunca kilitli",
      ruleCrown: "👑 {p} jeton = FİRAVUN · {o}💎 = NAZIR",
      multDemo: " (demo ×{x})",
      ruleBoss1: "💬 −{c} · 👍 −{l} · hediye 💎 başına −{d}",
      ruleBoss2: "🦁 Aslan = RA'NIN GAZABI −{x}",
      ruleBoss3: "⏳ {t} sn kaldı · en çok hasar = AVCI takım",
      ruleRace: "🏁 {team} inşayı kazandı! Hediyeler artık Apep'e",
      ruleVictory: "🏆 Yeni tur birazdan · hediyeler ona sayılır",
      waitTitle: "Ekip toplanıyor…", waitSub: "CANLI başlayınca katılmak için {k1} veya {k2} yaz",
      waitSoon: "⏳ CANLI yayının başlaması bekleniyor", waitReady: "🟢 CANLI başladı: halata ilk sen sarıl!",
      chants: ["ÇEK!", "HEY-YA!", "YA ALLAH!", "HOP!", "RA!"]
    }
  }
};

const TEAM_IDS = ["sun", "nile"];
// phones / tablets get a lighter profile (fewer workers + labels, smaller shadow map)
const IS_MOBILE = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || Math.min(screen.width, screen.height) < 600;
if (IS_MOBILE) { CONFIG.maxWorkers = 240; CONFIG.maxLabels = 30; }
const SKINS = [0xc98a5a, 0xb87a4a, 0xa86a3c, 0x8e5630, 0xd59a68, 0x7a4426, 0xe0aa78, 0x6a3a20];
const HAIR = [0x141010, 0x1e1410, 0x2a1a10, 0x0c0c0c];
const W = 540; let H = 960; // logical stage size; H grows on tall phone screens so the game fills them

const state = {
  phase: "build", // build | boss | victory
  users: new Map(),
  teams: {},
  raceWinner: null,
  winner: null,
  phaseAt: 0,
  bossHP: CONFIG.bossHP, bossMax: CONFIG.bossHP, bossEnds: 0,
  muted: true,
  time: 0,
  shake: 0,
  round: 1
};
function resetTeams() {
  TEAM_IDS.forEach((id) => {
    state.teams[id] = Object.assign(state.teams[id] || {}, {
      layers: CONFIG.prebuiltLayers, blocks: CONFIG.prebuiltLayers * CONFIG.blocksPerLayer, carry: 0, pts: 0, sledS: 0, delivering: 0, resetting: 0,
      heaves: 0, power: 0, lastHeave: 0, lurch: 0,
      earned: 0, delivered: 0, adjusted: 0, transit: 0 // conservation ledger (build pts): earned = delivered + pts + adjusted
    });
  });
}
resetTeams();
state.gustUntil = 0; state.gustsDone = 0;
window.__game = state;
// heave multiplier: ?speed=N wins; live TikTok mode is 1x; the bot demo / shared link uses CONFIG.demoSpeed
// ?speed is validated: finite and 0.1..100, otherwise the default is used (bad links can't break pacing)
const SPEED = (() => { const q = new URLSearchParams(location.search); if (q.get("live") === "1") return 1; // paid audience pacing is never URL-adjustable
  const raw = q.get("speed"); const v = Number(raw); if (raw != null && raw !== "" && Number.isFinite(v) && v >= 0.1 && v <= 100) return v; return CONFIG.demoSpeed; })();
if (new URLSearchParams(location.search).get("calm") === "1") CONFIG.calmEffects = true;
window.__speed = SPEED;
window.CONFIG = CONFIG;

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c])); }
function hash(str) {
  let h = 2166136261; const t = String(str);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function teamName(id) { const t = CONFIG.teams[id]; return CONFIG.lang === "tr" ? t.nameTR : t.name; }
function teamShort(id) { const t = CONFIG.teams[id]; return CONFIG.lang === "tr" ? t.shortTR : t.short; }
function S(key, vars) {
  const pack = CONFIG.strings[CONFIG.lang] || CONFIG.strings.en;
  let s = pack[key] != null ? pack[key] : (CONFIG.strings.en[key] != null ? CONFIG.strings.en[key] : key);
  if (vars && typeof s === "string") Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
  return s;
}
function parseTeam(comment) {
  const t = String(comment || "").toUpperCase();
  let best = null, bestIdx = 1e9;
  for (const id of TEAM_IDS) {
    for (const kw of CONFIG.teams[id].keywords) {
      const k = String(kw).toUpperCase();
      // whole-word match for letters so "SUNDAY" / "UNIL" don't count; emojis match anywhere
      let i = -1;
      if (/^[A-ZÇĞİÖŞÜ]+$/.test(k)) {
        const m = new RegExp("(^|[^A-ZÇĞİÖŞÜ])" + k + "(?![A-ZÇĞİÖŞÜ])").exec(t);
        if (m) i = m.index + m[1].length;
      } else i = t.indexOf(k);
      if (i !== -1 && i < bestIdx) { bestIdx = i; best = id; }
    }
  }
  return best;
}
function teamCount(id) { let n = 0; for (const u of state.users.values()) if (u.team === id) n++; return n; }

/* ---------- audio: frame drums, ney-like flute, crowd heave chant ---------- */
let audioCtx = null, master = null, noiseBuf = null, musicTimer = null, nextBeat = 0, beatN = 0;
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain(); master.gain.value = 0.55; master.connect(audioCtx.destination);
    noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.5, audioCtx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function noise(t, dur, f, q, gain, type) {
  const s = audioCtx.createBufferSource(); s.buffer = noiseBuf;
  const fl = audioCtx.createBiquadFilter(); fl.type = type || "bandpass"; fl.frequency.value = f; fl.Q.value = q || 1;
  const g = audioCtx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  return fl;
}
function tone(t, { freq = 440, dur = 0.2, type = "sine", gain = 0.05, slide, attack = 0.005, vib = 0 }) {
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
  if (vib) { const l = audioCtx.createOscillator(); const lg = audioCtx.createGain(); l.frequency.value = 5.2; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function doum(t, v) { tone(t, { freq: 110, slide: 48, dur: 0.38, gain: 0.32 * v, type: "sine" }); noise(t, 0.06, 300, 1, 0.08 * v); }
function tek(t, v) { noise(t, 0.07, 3200, 1.6, 0.13 * v); tone(t, { freq: 640, slide: 420, dur: 0.05, gain: 0.04 * v, type: "triangle" }); }
// Hijaz-flavoured scale (D Eb F# G A Bb C D)
const NEY = [293.7, 311.1, 370.0, 392.0, 440.0, 466.2, 523.3, 587.3, 622.3, 740.0];
let neyIdx = 4;
function ney(t, dur) {
  neyIdx = Math.max(0, Math.min(NEY.length - 1, neyIdx + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0]));
  const f = NEY[neyIdx];
  tone(t, { freq: f, dur, type: "sine", gain: 0.06, attack: 0.08, vib: 4 });
  tone(t, { freq: f * 2, dur, type: "sine", gain: 0.012, attack: 0.1, vib: 8 });
  noise(t, dur * 0.8, f * 2, 8, 0.02);
}
// maqsum: D T . T D . T .
const MAQSUM = ["D", "T", "", "T", "D", "", "T", ""];
function scheduleMusic() {
  if (state.muted || !audioCtx) return;
  const spb = 60 / (state.phase === "boss" ? 132 : 104) / 2; // eighth notes
  while (nextBeat < audioCtx.currentTime + 0.25) {
    const step = beatN % 8, v = state.phase === "boss" ? 1.15 : 1;
    if (MAQSUM[step] === "D") doum(nextBeat, v);
    else if (MAQSUM[step] === "T") tek(nextBeat, v);
    else if (Math.random() < 0.35) tek(nextBeat, 0.35);
    if (step === 0 && (beatN >> 3) % 2 === 0 && Math.random() < 0.85) ney(nextBeat, spb * 3.6);
    else if (step === 4 && Math.random() < 0.5) ney(nextBeat, spb * 1.8);
    if (step === 0 && state.users.size > 6 && Math.random() < 0.5) chant(nextBeat, 0.5);
    nextBeat += spb; beatN++;
  }
}
function chant(t, v) {
  // a crowd "HEY!" — several detuned voiced saws through a vowel formant + breath
  for (let i = 0; i < 5; i++) {
    const f = 120 + Math.random() * 90;
    const o = audioCtx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * 1.15, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.25);
    const fl = audioCtx.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 760; fl.Q.value = 2.5;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(fl); fl.connect(g); g.connect(master); o.start(t + i * 0.008); o.stop(t + 0.4);
  }
  noise(t, 0.25, 1400, 0.8, 0.05 * v);
}
function sfx(name) {
  if (state.muted) return;
  try {
    ensureAudio(); const t = audioCtx.currentTime;
    if (name === "heave") { if (t - (sfx._h || 0) > 0.28) { sfx._h = t; chant(t, 0.8); } }
    else if (name === "thud") { tone(t, { freq: 90, slide: 40, dur: 0.5, gain: 0.4 }); noise(t, 0.4, 500, 0.7, 0.2, "lowpass"); }
    else if (name === "gift") { [880, 1320, 1760].forEach((f, i) => tone(t + i * 0.05, { freq: f, dur: 0.5, gain: 0.05 })); }
    else if (name === "fanfare") {
      [[392, 0], [523, .15], [659, .3], [784, .45], [784, .75]].forEach(([f, d]) => {
        tone(t + d, { freq: f, dur: 0.4, type: "sawtooth", gain: 0.05, attack: 0.02 }); tone(t + d, { freq: f / 2, dur: 0.4, type: "square", gain: 0.03 }); });
    }
    else if (name === "beam") { noise(t, 0.6, 2000, 0.5, 0.12, "highpass"); tone(t, { freq: 1200, slide: 300, dur: 0.5, type: "triangle", gain: 0.05 }); }
    else if (name === "ra") { noise(t, 1.6, 800, 0.4, 0.3, "lowpass"); tone(t, { freq: 60, slide: 30, dur: 1.5, gain: 0.5 }); [523, 659, 784].forEach(f => tone(t + .1, { freq: f, dur: 1.4, type: "sawtooth", gain: 0.04, attack: .1 })); }
    else if (name === "win") { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(t + i * 0.14, { freq: f, dur: 0.3, type: "square", gain: 0.06 })); }
    else if (name === "roar") { noise(t, 1.4, 260, 0.6, 0.35, "lowpass"); tone(t, { freq: 70, slide: 40, dur: 1.3, type: "sawtooth", gain: 0.12 }); }
  } catch (_) {}
}
function setMuted(v) {
  state.muted = v;
  $("mute").textContent = v ? "🔇" : "🔊";
  if (!v) {
    ensureAudio(); nextBeat = audioCtx.currentTime + 0.05;
    if (!musicTimer) musicTimer = setInterval(scheduleMusic, 90);
  }
}

/* users, events, ledger, receipts and popups live in ledger.js */

/* team progression */
function updateTeams(dt) {
  if (state.phase !== "build") return;
  const now = performance.now();
  for (const id of TEAM_IDS) {
    if (state.phase !== "build") break; // the first winning delivery ends this build frame
    const T = state.teams[id];
    T.lurch = Math.max(0, T.lurch - dt * 2.2);
    if (T.delivering > 0) {
      T.delivering -= dt;
      if (T.delivering <= 0) blocksPlaced(id, T.carry);
      continue;
    }
    if (T.resetting > 0) { T.resetting -= dt; T.sledS += (0 - T.sledS) * Math.min(1, dt * 3.6); if (T.resetting <= 0) T.sledS = 0; continue; }
    const target = Math.min(1, T.pts / CONFIG.pullsPerBlock);
    // the block lurches forward on heaves, eases otherwise
    T.sledS += (target - T.sledS) * Math.min(1, dt * (3.5 + T.lurch * 6));
    if (T.pts >= CONFIG.pullsPerBlock && T.sledS > 0.985) {
      // one sledge trip carries every block the crew has earned (up to two layers' worth)
      const left = CONFIG.layers * CONFIG.blocksPerLayer - T.blocks;
      const carry = Math.max(1, Math.min(left, CONFIG.blocksPerLayer * 2, Math.floor(T.pts / CONFIG.pullsPerBlock)));
      T.sledS = 1; T.delivering = 1.4; T.carry = carry; T.pts -= carry * CONFIG.pullsPerBlock; T.transit = carry * CONFIG.pullsPerBlock;
      startDelivery(id);
    }
  }
}
// v1.9: finite, per-team choreography using the existing instanced worker rigs.
 // This changes pose timestamps only, never build points, timer, team or gifts.
const V19_CHEER = { last: { sun: -1e9, nile: -1e9 }, events: 0, team: null, kind: "" };
function v19CrewCheer(id, kind = "stone", force = false) {
  if (!TEAM_IDS.includes(id) || state.paused) return 0;
  if (!force && state.time - V19_CHEER.last[id] < 5) return 0;
  V19_CHEER.last[id] = state.time; V19_CHEER.events++;
  V19_CHEER.team = id; V19_CHEER.kind = kind;
  const now = performance.now();
  let count = 0;
  for (const u of state.users.values()) {
    if (u.team !== id || u.inst < 0 || u.pharaoh) continue;
    u._v19CelebrateUntil = now + (kind === "victory" ? 3200 : 1400);
    if (++count >= 48) break; // fixed visual budget
  }
  return count;
}
function blocksPlaced(id, n) {
  if (state.phase !== "build") return; // never double-book a completed layer
  const T = state.teams[id], bpl = CONFIG.blocksPerLayer;
  const before = T.layers;
  const add = Math.max(1, n || 1);
  T.blocks = Math.min(CONFIG.layers * bpl, T.blocks + add);
  T.delivered += T.transit || add * CONFIG.pullsPerBlock; T.transit = 0; // conservation: earned = delivered + pending (+ adjusted at round end)
  T.layers = Math.floor(T.blocks / bpl);
  if (window.onBlocksPlaced) window.onBlocksPlaced(id, T.layers > before);
  v19CrewCheer(id, T.layers > before ? "layer" : "stone", T.layers > before);
  sfx("thud"); shake(T.layers > before ? 0.25 : 0.1);
  T.resetting = 0.9;
  for (let L = before + 1; L <= T.layers; L++) { layerPlaced(id, L); if (state.phase !== "build") return; }
  // no cap on T.pts any more: queued points carry over to the next trips (nothing earned is discarded)
}
function layerPlaced(id, n) {
  log(id, ["logLayer", { team: id, n }]);
  if (n >= CONFIG.layers) { raceWon(id); return; }
  if (n % CONFIG.milestoneEvery === 0) milestone(id, n);
  checkGust();
}
function milestone(id, n) {
  const pct = Math.round((n / CONFIG.layers) * 100);
  log(id, ["logMilestone", { team: id, n }]);
  showPop("", ["milestone", { n }], ["milestoneSub", { team: teamName(id), pct }], 2600, null, 1);
  sfx("win"); flash(0.35, "#fff2c0");
  if (window.onMilestone) window.onMilestone(id, n);
  cueV17Camera("layer", id, 2.1);
}
function checkGust() {
  const lead = Math.max(state.teams.sun.layers, state.teams.nile.layers) / CONFIG.layers;
  const at = CONFIG.gust.at || [];
  if (state.gustsDone < at.length && lead >= at[state.gustsDone]) {
    state.gustsDone++;
    state.gustUntil = state.time + CONFIG.gust.seconds;
    showPop("ra", ["gust"], ["gustSub", { b: CONFIG.gust.bonus, s: CONFIG.gust.seconds }], 3000, null, 2);
    log("gift", ["logGust", { b: CONFIG.gust.bonus }]); sfx("roar"); shake(0.7);
    state.gustLogged = false;
  }
}
function closeBuildLedger() {
  // round accounting: points earned but not hauled when the build ends are disclosed, never silently dropped
  for (const id of TEAM_IDS) {
    const T = state.teams[id];
    const left = T.pts + (T.transit || 0);
    if (left > 0.0001) { T.adjusted += left; diag({ outcome: "info", src: "game", type: "round", team: id, reason: "build closed: " + left.toFixed(2) + " unhauled build pts recorded as round adjustment" }); }
    T.pts = 0; T.transit = 0;
  }
}
function raceWon(id) {
  state.raceWinner = id;
  state.phase = "race";
  closeBuildLedger();
  showPop("win", ["raceWin", { team: teamName(id) }], ["raceWinSub"], 3600, null, 4);
  sfx("win"); flash(0.5, "#fff2c0");
  state.phaseAt = state.time + 4.2;
  cueV17Camera("race", id, 3.3);
  applyPhaseUI();
}
function activeCrowd() {
  const now = performance.now(); let n = 0;
  for (const u of state.users.values()) if (u.team && now - u.lastActive < 120000) n++;
  return n;
}
function startBoss() {
  state.phase = "boss";
  // Apep scales with the active crowd so a small stream can still finish; a time limit prevents stalls
  const f = Math.max(0.3, Math.min(1.5, activeCrowd() / CONFIG.bossFullCrowd));
  state.bossMax = Math.max(1000, Math.round(CONFIG.bossHP * f / 500) * 500);
  state.bossHP = state.bossMax; state.bossEnds = state.time + CONFIG.bossTimeLimit;
  for (const u of state.users.values()) u.power = 0;
  for (const id of TEAM_IDS) state.teams[id].power = 0;
  showPop("ra", ["bossIntro"], ["bossIntroSub"], 3200, null, 4);
  log("gift", ["logBoss"]); sfx("roar"); shake(0.9);
  if (window.onBossStart) window.onBossStart();
  cueV17Camera("boss", null, 3.2);
  applyPhaseUI();
  flushHeld(); // gifts sent during the race transition now hit Apep
}
function bossHit(u, dmg, kind) {
  if (state.phase !== "boss") return 0;
  dmg = Math.min(dmg, state.bossHP); // damage dealt is what Apep actually loses
  u.power += dmg; u.lastActive = performance.now(); u.heaveT = performance.now() + 500;
  state.teams[u.team].power += dmg;
  state.bossHP = Math.max(0, state.bossHP - dmg);
  if (window.fireAtBoss) window.fireAtBoss(u, kind, dmg);
  if (kind !== "stone") sfx("beam");
  if (state.bossHP <= 0) endVictory();
  return dmg;
}
function wrathOfRa(u, repeats, dmg) {
  repeats = repeats || 1;
  const actual = bossHit(u, dmg != null ? dmg : CONFIG.bossDamage.lion * repeats, "ra");
  // A killing blow must display the victory announcement, not a competing wrath popup.
  if (state.phase === "boss")
    showPop("ra", ["ra"], ["raSub", { name: u.name + (repeats > 1 ? " " + S("lionX", { n: repeats }) : "") }], 2600, null, 3);
  flash(0.8, "#fff6c8"); shake(1.2); sfx("ra");
  return actual;
}
function endVictory(reason) {
  if (state.phase === "victory") return;
  const tp = state.teams;
  const build = state.raceWinner || (tp.sun.power >= tp.nile.power ? "sun" : "nile");
  const slayer = tp.sun.power === tp.nile.power ? build : (tp.sun.power > tp.nile.power ? "sun" : "nile");
  state.phase = "victory"; state.winner = build; state.slayer = slayer;
  state.phaseAt = state.time + 12;
  const hero = topBy("power", 1)[0];
  if (reason === "timeout") showPop("ra", ["raIntervenes"], ["raIntervenesSub"], 2600, null, 4);
  showPop("win", ["win"], ["winSub2", { b: teamShort(build), s: teamShort(slayer) }], 7500, hero ? { url: hero.photoUrl, name: hero.name } : null, 5);
  const best = topBy("power", 3); if (best.length) log("win", "☀️ " + best.map((u, i) => (i + 1) + ". " + u.name).join("  "));
  if (hero) log("win", ["hero", { name: hero.name }]);
  // participation medal for everyone who contributed this round
  let medals = 0;
  for (const u of state.users.values()) if (u.team && (u.free + u.giftPts + u.power) > 0) { u.medals++; medals++; }
  if (medals) log("capo", ["medal", { n: medals, r: state.round }]);
  log("win", ["logWin", { team: build }]);
  sfx("win"); flash(0.7, "#fff4c0"); shake(0.8);
  if (window.onVictory) window.onVictory(build);
  // Both sides made the monument possible; give the finale a group cheer.
  v19CrewCheer("sun", "victory", true);
  v19CrewCheer("nile", "victory", true);
  cueV17Camera("victory", build, 7.2);
  applyPhaseUI();
}
function newRound() {
  V17_CINEMA.until = 0; // never carry a ceremony shot into the next round
  state.phase = "build"; state.raceWinner = null; state.winner = null; state.slayer = null; state.round++;
  resetTeams(); state.gustUntil = 0; state.gustsDone = 0;
  for (const u of state.users.values()) { u.heaves = 0; u.power = 0; u.free = 0; u.giftPts = 0; }
  if (window.onNewRound) window.onNewRound();
  applyPhaseUI();
  flushHeld(); // gifts sent during the victory ceremony start the new round
}
function safeResetRound() {
  // host action: ends the current round cleanly; session supporters, pharaohs and crews are kept
  if (state.phase === "build") closeBuildLedger();
  diag({ outcome: "info", src: "host", type: "reset", reason: "host reset round " + state.round });
  POPQ.length = 0;
  newRound();
}
function updatePhase() {
  const now = state.time;
  if (state.gustUntil > 0 && now >= state.gustUntil && !state.gustLogged) { state.gustLogged = true; log("gift", ["logGustEnd"]); }
  if (state.phase === "race" && now >= state.phaseAt) startBoss();
  else if (state.phase === "boss" && state.bossEnds && now >= state.bossEnds) { state.bossHP = 0; endVictory("timeout"); }
  else if (state.phase === "victory" && now >= state.phaseAt) newRound();
}

/* ---------- UI ---------- */
const crestURL = {};
function makeCrest(team) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const col = CONFIG.teams[team].colors;
  const grd = g.createRadialGradient(28, 24, 4, 32, 32, 32); grd.addColorStop(0, "#fff6d0"); grd.addColorStop(1, "#c9952a");
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
  g.fillStyle = col.css; g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.stroke();
  if (team === "sun") {
    // sun disk with rays + uraeus dot
    g.fillStyle = "#fff1b0";
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.translate(32, 32); g.rotate(a); g.beginPath(); g.moveTo(-3, -13); g.lineTo(0, -23); g.lineTo(3, -13); g.fill(); g.restore(); }
    g.fillStyle = "#ffdf5a"; g.beginPath(); g.arc(32, 32, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(32, 32, 5, 0, Math.PI * 2); g.fill();
  } else {
    // eye of horus over waves
    g.strokeStyle = "#eaf6ff"; g.lineWidth = 3.2; g.lineCap = "round";
    g.beginPath(); g.moveTo(16, 26); g.quadraticCurveTo(32, 14, 48, 26); g.quadraticCurveTo(32, 34, 16, 26); g.stroke();
    g.fillStyle = "#0b2a5a"; g.beginPath(); g.arc(32, 25, 4.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(30, 31); g.lineTo(27, 40); g.stroke();
    g.beginPath(); g.moveTo(36, 30); g.quadraticCurveTo(42, 40, 36, 42); g.stroke();
    g.strokeStyle = "#8ee8ff"; g.lineWidth = 2.6;
    for (let k = 0; k < 2; k++) { g.beginPath(); for (let x = 14; x <= 50; x += 2) g.lineTo(x, 47 + k * 5 + Math.sin(x / 3) * 2); g.stroke(); }
  }
  return c.toDataURL();
}
/* applyPhaseUI / renderMeters / renderCounts / renderBoard live in ledger.js */

/* ============================================================
   EVENT INTAKE · CONTRIBUTION LEDGER · RECEIPTS · POPUP QUEUE
   Every incoming event gets a receipt (window.__ledger.receipts):
     applied   credited now
     held      kept safely (no team yet, phase change, pause, open gift streak)
     settled   a held contribution / gift streak that has now been credited
     duplicate same eventId (or an already-settled streak final) - not credited twice
     rejected  malformed / no user / not a team keyword
   Credit never depends on an avatar, a popup or an animation.
   ============================================================ */
const QP = new URLSearchParams(location.search);
const LEDGER = { seen: new Map(), streaks: new Map(), receipts: [], stats: {}, bySrc: { live: 0, test: 0, demo: 0 }, reconnects: 0 };
window.__ledger = LEDGER;
state.held = [];          // game effects waiting for a phase (race -> boss, victory -> next round, pause)
state.paused = false;
state.mode = QP.get("live") === "1" ? "live" : "test"; // "demo" while the bot crowd runs
state.conn = { st: state.mode === "live" ? "connecting" : "off", lastEvent: 0, retryAt: 0, tries: 0 };

function diag(rec) {
  rec.t = Math.round(state.time * 10) / 10; rec.round = state.round; rec.phase = state.phase;
  LEDGER.receipts.push(rec); if (LEDGER.receipts.length > 500) LEDGER.receipts.splice(0, 100);
  LEDGER.stats[rec.outcome] = (LEDGER.stats[rec.outcome] || 0) + 1;
  if (window.onDiag) window.onDiag(rec);
  return rec;
}
function shake(v) { if (!CONFIG.calmEffects) state.shake = Math.max(state.shake, v); }
function fmtPts(p) { return p >= 10 ? String(Math.round(p)) : String(Math.round(p * 100) / 100); }

/* ---------- participants ---------- */
let joinSeq = 0;
function makeUser(id, name, team, photoUrl) {
  const h = hash(id);
  return {
    id, name: String(name || "worker").slice(0, 18), team, photoUrl: photoUrl || null, src: "test",
    diamonds: 0, heaves: 0, power: 0, free: 0, giftPts: 0, medals: 0, pharaoh: false, overseer: false, joinSeq: joinSeq++,
    pending: [], lastActive: performance.now(), inst: -1, slot: -1, spotUntil: 0, spotText: "", nagAt: -1e9,
    variant: h % 5, skin: SKINS[h % SKINS.length], hair: HAIR[(h >> 3) % HAIR.length], clothAlt: ((h >> 5) & 3) === 0,
    x: 0, y: 0, z: 0, facing: Math.PI, anim: "walk", phase: (h % 100) / 100, heaveT: 0, cheerT: 0,
    spawned: false, bubble: "", bubbleUntil: 0, scale: 0.92 + ((h >> 7) % 17) / 100
  };
}
function getOrMakeUser(userId, username, photoUrl, src, preserveGiftCredit = false) {
  let u = state.users.get(userId);
  if (!u) {
    if (state.users.size >= CONFIG.maxParticipants) {
      // Free, empty, unassigned records may be discarded to welcome new people.
      // Never evict someone who chose a team or has pending likes/gift credit.
      let removed = 0;
      for (const [key, rec] of state.users) {
        if (state.users.size < CONFIG.maxParticipants || removed >= 64) break;
        if (!rec.team && !rec.diamonds && (!rec.pending || rec.pending.length === 0)
          && performance.now() - (rec.lastActive || 0) > 60000) {
          state.users.delete(key); removed++;
        }
      }
    }
    if (state.users.size >= CONFIG.maxParticipants) {
      // A new giver must not lose recognition because 20,000 people already joined.
      // The 2,000 reserve supports credit without adding another on-screen avatar.
      if (!preserveGiftCredit || state.users.size >= CONFIG.maxParticipants + CONFIG.giftOverflowReserve)
        return null;
    }
    u = makeUser(userId, username, null, photoUrl); u.src = src;
    state.users.set(userId, u);
  }
  return u;
}
function assignTeam(u, team) {
  u.team = team; u.lastActive = performance.now();
  if (state.users.size <= CONFIG.maxParticipants && countAvatars() < CONFIG.maxWorkers) { allocInstance(u); if (u.inst >= 0) spawnUser(u); }
  spot(u, "👋 " + u.name);
  log(team, ["logJoin", { name: u.name, team }]);
  announce(S("logJoin", { name: u.name, team: teamShort(team) }));
  if (u.inst < 0) receipt(u, ["rcQueue", { name: u.name, team }], 1);
  // contributions sent before picking a crew are applied now (never lost)
  const held = u.pending; u.pending = [];
  for (const act of held) { act.flushed = true; applyAction(u, act); }
  if (held.length) receipt(u, ["rcFlush", { name: u.name, team, what: "whatAll" }], 2);
}
function countAvatars() { let n = 0; for (const u of state.users.values()) if (u.inst >= 0) n++; return n; }
function smallerTeam() { return teamCount("sun") <= teamCount("nile") ? "sun" : "nile"; }
function spot(u, text) { u.spotUntil = performance.now() + 4200; u.spotText = text; }

/* ---------- logs, flash, a11y ---------- */
// the visible log keeps message keys (not rendered text) so it can be re-rendered in the new language on a switch
const LOGBUF = [];
function logText(msg) {
  if (!Array.isArray(msg)) return String(msg);
  const vars = Object.assign({}, msg[1] || {});
  for (const k of ["team", "k1", "k2"]) if (vars[k] && CONFIG.teams[vars[k]]) vars[k] = teamShort(vars[k]);
  for (const k of ["what", "when"]) if (typeof vars[k] === "string" && /^(what|held)[A-Z]/.test(vars[k])) vars[k] = S(vars[k]);
  return S(msg[0], vars);
}
function log(kind, msg) {
  LOGBUF.unshift({ kind, msg }); if (LOGBUF.length > 6) LOGBUF.length = 6;
  const box = $("log"); const el = document.createElement("div");
  el.className = "log-item " + kind; el.textContent = logText(msg); box.prepend(el);
  while (box.children.length > 6) box.removeChild(box.lastChild);
}
function renderLog() {
  const box = $("log"); box.innerHTML = "";
  for (const e of LOGBUF) { const el = document.createElement("div"); el.className = "log-item " + e.kind; el.style.animation = "none"; el.textContent = logText(e.msg); box.appendChild(el); }
}
function flash(a, color) {
  if (CONFIG.calmEffects) a = (a == null ? 0.5 : a) * 0.25;
  const f = $("flash"); f.style.background = color || "#fff"; f.style.opacity = String(Math.min(0.32, (a == null ? 0.5 : a) * 0.5)); f.style.transition = "none";
  requestAnimationFrame(() => { f.style.transition = "opacity .5s ease"; f.style.opacity = "0"; });
}
let a11yAt = 0;
function announce(text) { const el = $("a11y"); if (!el) return; const now = performance.now(); if (now - a11yAt < 1500) return; a11yAt = now; el.textContent = text; }

/* ---------- popup priority queue: 1 milestone · 2 pharaoh/blessing/gust · 3 wrath · 4 race/boss intro · 5 victory ---------- */
const POPQ = []; let popCur = null;
function T_(x) { return Array.isArray(x) ? logText(x) : (x || ""); } // team ids in vars are translated at render time
function showPop(kind, big, sub, ms, photo, prio) {
  const item = { kind, big, sub, ms: ms || 2800, photo, prio: prio || 1, at: performance.now() };
  const now = performance.now();
  if (state.phase === "victory" && item.prio < 4) return; // the victory ceremony owns the screen (credit + receipts unaffected)
  if (!popCur || now >= popCur.until || (item.prio >= 3 && item.prio > popCur.prio)) { renderPop(item); return; }
  POPQ.push(item); POPQ.sort((a, b) => b.prio - a.prio || a.at - b.at);
  if (POPQ.length > 5) POPQ.length = 5; // bounded: the least important celebration is skipped
}
function renderPop(item) {
  popCur = item; item.until = performance.now() + item.ms * 0.85;
  const pop = $("pop"); pop.className = item.kind || "";
  $("pop-big").textContent = T_(item.big); $("pop-sub").textContent = T_(item.sub);
  const ph = $("pop-photo"); const photo = item.photo;
  if (photo) {
    pop.classList.add("withphoto");
    if (photo.url) { ph.style.backgroundImage = "url(" + JSON.stringify(photo.url) + ")"; ph.textContent = ""; }
    else { ph.style.backgroundImage = ""; ph.textContent = (photo.name || "?").slice(0, 1).toUpperCase(); }
  }
  pop.style.animationDuration = (item.ms / 1000) + "s";
  pop.classList.remove("show"); void pop.offsetWidth; pop.classList.add("show");
  announce(T_(item.big) + " " + T_(item.sub));
  const lb = $("labels"); if (lb) { lb.classList.add("dim"); clearTimeout(renderPop._t); renderPop._t = setTimeout(() => lb.classList.remove("dim"), item.ms * 0.75); }
}
function pumpPop() {
  const now = performance.now();
  if (popCur && now < popCur.until) return;
  while (POPQ.length && now - POPQ[0].at > 9000 && POPQ[0].prio < 4) POPQ.shift(); // stale celebrations expire
  if (POPQ.length) renderPop(POPQ.shift());
}
function rerenderPop() { if (popCur && performance.now() < popCur.until) { $("pop-big").textContent = T_(popCur.big); $("pop-sub").textContent = T_(popCur.sub); } }

/* ---------- viewer receipts strip ---------- */
const RQ = []; let rqCur = null, rqUntil = 0, rqMore = 0;
function receipt(u, msg, level) { // level 0 routine · 1 contribution · 2 important
  const now = performance.now();
  if (level === 0 && (RQ.length > 1 || now < rqUntil)) { rqMore++; return; }
  RQ.push({ msg, level, team: u && u.team, at: now });
  if (RQ.length > 10) { let i = RQ.findIndex(r => r.level < 2); if (i < 0) i = 0; RQ.splice(i, 1); rqMore++; } // credit is already in the ledger
}
function pumpReceipts() {
  const now = performance.now();
  if (now < rqUntil) return;
  let next = null;
  if (RQ.length) { let bi = 0; for (let i = 1; i < Math.min(4, RQ.length); i++) if (RQ[i].level > RQ[bi].level) bi = i; next = RQ.splice(bi, 1)[0]; }
  else if (rqMore) { next = { msg: ["rcMore", { n: rqMore }], level: 0 }; rqMore = 0; }
  if (!next) { if (rqCur && now > rqUntil + 2500) { rqCur = null; renderStrip(); } return; }
  rqCur = next; rqUntil = now + (next.level >= 1 ? 2000 : 1300);
  renderStrip();
}
let ruleIdx = 0, ruleAt = 0;
function rulesNow() {
  const k1 = teamShort("sun"), k2 = teamShort("nile");
  if (state.phase === "race") return [S("ruleRace", { team: teamShort(state.raceWinner || "sun") })];
  if (state.phase === "victory") return [S("ruleVictory")];
  if (state.phase === "boss") return [S("ruleBoss1", { c: CONFIG.bossDamage.chat, l: CONFIG.bossDamage.like, d: CONFIG.bossDamage.diamond }), S("ruleBoss2", { x: CONFIG.bossDamage.lion.toLocaleString() }),
    S("ruleBoss3", { t: Math.max(0, Math.ceil(state.bossEnds - state.time)) })];
  return [S("ruleWin", { L: CONFIG.layers }), S("ruleUnits", { mult: SPEED !== 1 ? S("multDemo", { x: SPEED }) : "" }), S("ruleLock"), S("ruleCrown", { p: CONFIG.pharaohGift, o: CONFIG.overseerThreshold })];
}
// one line always: shrink the font step by step, then ellipsis as a last resort
function fitLine(el, text, maxPx, minPx) {
  if (el._t === text && el._w === el.clientWidth) return;
  el._t = text; el._w = el.clientWidth; el.textContent = text;
  let px = maxPx; el.style.fontSize = px + "px";
  while (px > minPx && el.scrollWidth > el.clientWidth + 1) { px -= 0.5; el.style.fontSize = px + "px"; }
}
function renderStrip() {
  const rules = rulesNow(); const now = performance.now();
  if (now - ruleAt > 5200) { ruleIdx++; ruleAt = now; }
  const r = $("strip-rule"); if (r) fitLine(r, (state.paused ? S("paused") + " · " : "") + rules[ruleIdx % rules.length], 16, 11.5);
  const c = $("strip-rc");
  if (c) { c.className = rqCur && rqCur.team ? rqCur.team : ""; fitLine(c, rqCur ? T_(rqCur.msg) : "", 16.5, 12); }
}

/* ---------- gifts ---------- */
const GIFT_ICON = { rose: "🌹", heart: "❤️", small: "🎁", medium: "🎁", lion: "🦁" };
function resolveGift(evt) {
  const name = String(evt.giftName || evt.gift || "").toLowerCase();
  const dRaw = Number(evt.diamondCount != null ? evt.diamondCount : (evt.giftValue != null ? evt.giftValue : 0)) || 0;
  const repeats = Math.max(1, Math.min(9999, Math.floor(Number(evt.repeatCount) || 1)));
  let kind = "small";
  if (/lion|aslan|universe|evren|planet/.test(name) || dRaw >= CONFIG.pharaohGift) kind = "lion";
  else if (/rose|g[uü]l|rosa/.test(name)) kind = "rose";
  else if (/heart|kalp/.test(name)) kind = "heart";
  else if (dRaw >= 20 || /donut|medium|perfume|parf/.test(name)) kind = "medium";
  const def = { small: 1, rose: 1, heart: 1, medium: 50, lion: CONFIG.pharaohGift }[kind];
  const single = dRaw > 0 ? dRaw : def;
  return { kind, single, repeats, diamonds: single * repeats, name };
}
function creditSupporter(u, g) {
  // session supporter ledger: applies in every phase as soon as the crew is known
  u.diamonds += g.diamonds; u.lastActive = performance.now();
  const need = CONFIG.overseerThreshold, have = Math.min(need, u.diamonds);
  if (g.kind === "lion") log("gift", ["logLion", { name: u.name + (g.repeats > 1 ? " ×" + g.repeats : "") }]);
  else if (g.kind === "rose") log("gift", ["logRose", { name: u.name, x: g.repeats > 1 ? g.repeats + "x " : "", have, need }]);
  else if (g.kind === "heart") log("gift", ["logHeart", { name: u.name, x: g.repeats > 1 ? g.repeats + "x " : "", have, need }]);
  else log("gift", ["logGift", { name: u.name, d: g.diamonds, have, need }]);
  if (!u.overseer && u.diamonds >= need) { u.overseer = true; log("capo", ["logOverseer", { name: u.name }]); }
  let crowned = false;
  if (g.single >= CONFIG.pharaohGift && !u.pharaoh) { crownPharaoh(u); crowned = true; } // once per event, never per repeat
  sfx("gift");
  return crowned;
}
function crownPharaoh(user) {
  for (const u of state.users.values()) if (u.team === user.team && u.pharaoh) u.pharaoh = false;
  user.pharaoh = true;
  showPop("", ["newPharaoh"], ["newPharaohSub", { name: user.name, team: user.team }], 3200, { url: user.photoUrl, name: user.name }, 2);
  log("capo", ["logPharaoh", { name: user.name, team: user.team }]);
  receipt(user, ["rcCrown", { name: user.name, team: user.team }], 2);
  sfx("fanfare"); flash(0.45, "#ffe9a0");
  if (window.onPharaoh) window.onPharaoh(user);
}

/* ---------- applying contributions ---------- */
function basePts(act) {
  if (act.type === "chat") return CONFIG.points.chat * act.n;
  if (act.type === "like") return CONFIG.points.like * act.n;
  const g = act.g, per = g.kind === "lion" ? CONFIG.points.lion : g.kind === "medium" ? CONFIG.points.medium : CONFIG.points.rose;
  return per * g.repeats;
}
function bossDmgOf(act) {
  if (act.type === "chat") return CONFIG.bossDamage.chat * act.n;
  if (act.type === "like") return CONFIG.bossDamage.like * act.n;
  if (act.g.kind === "lion") return CONFIG.bossDamage.lion * act.g.repeats;
  return act.g.diamonds * CONFIG.bossDamage.diamond;
}
function addPull(team, pts, user, kind) {
  const T = state.teams[team];
  if (state.phase !== "build") return 0;
  T.pts += pts; T.earned += pts; T.heaves += 1; T.lastHeave = performance.now();
  T.lurch = Math.min(1, T.lurch + 0.25 + Math.min(pts, 20) * 0.05);
  if (user) {
    user.heaves += pts; user.heaveT = performance.now() + 520; user.lastActive = performance.now();
    if (kind === "gift") user.giftPts += pts; else user.free += pts;
  }
  return pts;
}
function holdAct(u, act, why) {
  // merge with an existing held entry of the same user/kind so the queue stays bounded
  const key = u.id + "|" + act.type + "|" + (act.g ? act.g.kind + act.g.single : "");
  const ex = state.held.find(h => h.key === key);
  if (ex) mergeAct(ex.act, act); else state.held.push({ key, u, act, why });
  return why;
}
function mergeAct(a, b) {
  if (a.type === "gift") { a.g.repeats += b.g.repeats; a.g.diamonds += b.g.diamonds; } else a.n += b.n;
  a.merged = (a.merged || 1) + (b.merged || 1);
}
function holdPending(u, act) {
  const key = act.type + "|" + (act.g ? act.g.kind + act.g.single : "");
  const ex = u.pending.find(p => p.key === key);
  if (ex) mergeAct(ex, act); else { act.key = key; u.pending.push(act); }
}
function applyAction(u, act) {
  // 1) supporter ledger (diamonds / overseer / pharaoh) - immediate in every phase
  let crowned = false;
  if (act.type === "gift" && !act.supporterDone) { crowned = creditSupporter(u, act.g); act.supporterDone = true; }
  // 2) game effect - only in build or boss; otherwise held for the right phase
  const why = state.paused ? "heldPause" : state.phase === "race" ? "heldBoss" : state.phase === "victory" ? "heldRound" : null;
  const icon = act.type === "gift" ? GIFT_ICON[act.g.kind] : act.type === "like" ? "👍" : "💬";
  const base = { src: act.src, user: u.name, uid: u.id, type: act.type, team: u.team, eid: act.eid };
  if (why) {
    holdAct(u, act, why);
    if (act.type !== "chat") receipt(u, ["rcHeld", { name: u.name, team: u.team, what: act.type === "gift" ? "whatGift" : "whatLike", when: why }], 1);
    return diag(Object.assign(base, { outcome: "held", reason: "phase " + state.phase + (state.paused ? " (paused)" : "") + ": effect waits for " + why.replace("held", "").toLowerCase() }));
  }
  if (state.phase === "build") {
    const mult = SPEED * (state.time < state.gustUntil ? CONFIG.gust.bonus : 1);
    const pts = addPull(u.team, basePts(act) * mult, u, act.type === "gift" ? "gift" : "free");
    const shown = fmtPts(pts);
    if (act.type === "chat") { sfx("heave"); if (act.joined) receipt(u, ["rcJoin", { name: u.name, team: u.team, pts: shown }], 1); else receipt(u, ["rcChat", { name: u.name, team: u.team, pts: shown }], 0); }
    else if (act.type === "like") receipt(u, ["rcLike", { name: u.name, team: u.team, pts: shown }], 0);
    else {
      const g = act.g;
      receipt(u, ["rcGift", { icon: icon + (g.repeats > 1 ? "×" + g.repeats : ""), name: u.name, team: u.team, pts: shown }], 1);
      spot(u, icon + " " + u.name + " +" + shown);
      if (g.kind === "lion") {
        if (!crowned) showPop("ra", ["blessing"], ["blessingSub", { name: u.name + (g.repeats > 1 ? " " + S("lionX", { n: g.repeats }) : "") }], 2600, null, 2);
        flash(0.6, "#fff3c0"); shake(0.6); fxSunBurst(u.team);
      } else if (u.inst >= 0) fxGiftSpark(u, g.kind === "medium" ? 1.4 : 1);
    }
    return diag(Object.assign(base, { outcome: act.flushed ? "settled" : "applied", pts: Math.round(pts * 100) / 100, reason: act.merged > 1 ? act.merged + " merged" : undefined }));
  }
  if (state.phase === "boss") {
    const dmg = bossDmgOf(act);
    const dealt = act.type === "gift" && act.g.kind === "lion" ? wrathOfRa(u, act.g.repeats, dmg) : bossHit(u, dmg, act.type === "gift" ? (act.g.kind === "medium" ? "bigbeam" : "beam") : "stone");
    if (act.type !== "chat") { receipt(u, ["rcBoss", { icon, name: u.name, team: u.team, dmg: Math.round(dealt).toLocaleString() }], act.type === "gift" ? 1 : 0); if (act.type === "gift") spot(u, icon + " " + u.name + " −" + Math.round(dealt)); }
    return diag(Object.assign(base, { outcome: act.flushed ? "settled" : "applied", dmg: dealt }));
  }
  return diag(Object.assign(base, { outcome: "rejected", reason: "unknown phase" }));
}
function flushHeld() {
  if (state.paused) return;
  const list = state.held; state.held = [];
  for (const h of list) { h.act.flushed = true; applyAction(h.u, h.act); }
}

/* ---------- gift streaks: interim events are held, the final credits the delta ----------
   Assumed provider contract (to confirm on a controlled test stream):
   - streakable gifts send interim events (repeatEnd false) with a cumulative repeatCount, then one final (repeatEnd true);
   - groupId, when present, identifies one combo; a new combo gets a new groupId (or starts again with interim events);
   - a final can arrive late, be repeated, or be replayed after a reconnect with a fresh eventId.
   Policy: a settled streak is remembered for CONFIG.streakMemoryMs (5 min). A later final for the same streak
   (same source + user + gift + groupId) credits only repeatCount above what was already credited, else it is a duplicate.
   Without a groupId we cannot tell a replay from a new combo, so the memory only applies to finals with repeatCount >= 2;
   a single (×1) gift without groupId is always a new gift, and any new interim event always starts a new combo. */
function streakKey(src, userId, g, evt) { return src + "|" + userId + "|" + g.name + "|" + g.single + "|" + (evt.groupId != null && evt.groupId !== "" ? evt.groupId : ""); }
function streakGate(evt, src, userId, g, base) {
  const key = streakKey(src, userId, g, evt);
  const hasGroup = evt.groupId != null && evt.groupId !== "";
  const now = performance.now();
  const interim = evt.repeatEnd === false || evt.repeatEnd === 0 || evt.streaking === true;
  let rec = LEDGER.streaks.get(key);
  if (LEDGER.streaks.size > CONFIG.streakMemoryMax) for (const [k, r] of LEDGER.streaks) { if (r.settled && now - r.settledAt > CONFIG.streakMemoryMs) LEDGER.streaks.delete(k); if (LEDGER.streaks.size <= CONFIG.streakMemoryMax * 0.8) break; }
  if (interim) {
    if (rec && rec.settled && hasGroup && now - rec.settledAt < CONFIG.streakMemoryMs && g.repeats <= rec.credited) {
      diag(Object.assign({}, base, { outcome: "duplicate", reason: "late interim ×" + g.repeats + " for a streak already settled at ×" + rec.credited }));
      return 0;
    }
    if (!rec || (rec.settled && !(hasGroup && now - rec.settledAt < CONFIG.streakMemoryMs))) { rec = { key, credited: 0, last: 0, settled: false, src, userId }; LEDGER.streaks.set(key, rec); }
    else if (rec.settled) rec.settled = false; // same groupId continues above the credited count
    rec.last = Math.max(rec.last, g.repeats); rec.evt = evt; rec.base = base;
    clearTimeout(rec.timer); rec.timer = setTimeout(() => settleStreak(rec), CONFIG.streakTimeoutMs);
    const u = state.users.get(userId);
    if (u && (!rec.shownAt || now - rec.shownAt > 1500)) { rec.shownAt = now; receipt(u, ["rcStreak", { icon: GIFT_ICON[g.kind], name: u.name, n: rec.last }], 0); }
    diag(Object.assign({}, base, { outcome: "held", reason: "gift streak ×" + rec.last + " in progress (credited on final)" }));
    return 0;
  }
  if (rec && !rec.settled) {
    clearTimeout(rec.timer); rec.settled = true; rec.settledAt = now;
    const delta = g.repeats - rec.credited; rec.credited = Math.max(rec.credited, g.repeats);
    if (delta <= 0) { diag(Object.assign({}, base, { outcome: "duplicate", reason: "streak final ×" + g.repeats + " already credited" })); return 0; }
    return delta;
  }
  const remembered = rec && rec.settled && now - rec.settledAt < CONFIG.streakMemoryMs && (hasGroup || g.repeats >= 2) && evt.repeatEnd !== undefined;
  if (remembered) {
    const delta = g.repeats - rec.credited;
    if (delta <= 0) { diag(Object.assign({}, base, { outcome: "duplicate", reason: "late final ×" + g.repeats + " for a streak settled at ×" + rec.credited + " " + Math.round((now - rec.settledAt) / 1000) + "s ago" })); return 0; }
    rec.credited = g.repeats; rec.settledAt = now; return delta; // a larger late final credits only the difference
  }
  if (evt.repeatEnd === true && g.repeats >= 1) {
    // a final-only gift: remember it too, so a replay of the same final is caught
    LEDGER.streaks.set(key, { key, credited: g.repeats, last: g.repeats, settled: true, settledAt: now, src, userId });
  }
  return g.repeats;
}
function settleStreak(rec) {
  if (rec.settled) return;
  rec.settled = true; rec.settledAt = performance.now();
  const delta = rec.last - rec.credited; rec.credited = rec.last;
  if (delta > 0) processGift(rec.userId, rec.evt, delta, Object.assign({}, rec.base, { timeout: true }));
}
function processGift(userId, evt, repeats, base) {
  const g = resolveGift(Object.assign({}, evt, { repeatCount: repeats }));
  const u = getOrMakeUser(userId, base.user, evt.photoUrl, base.src, true);
  if (!u) {
    log("gift", "Gift could not be credited: supporter reserve full; please alert the host.");
    return diag(Object.assign(base, { outcome: "rejected", reason: "gift recognition reserve full" }));
  }
  const act = { type: "gift", g, src: base.src, eid: base.eid };
  if (!u.team) {
    holdPending(u, act);
    nag(u, "whatGift");
    return diag(Object.assign(base, { outcome: "held", reason: "no crew yet: gift saved until " + u.name + " types a team keyword" }));
  }
  const r = applyAction(u, act);
  if (base.timeout) r.reason = (r.reason ? r.reason + "; " : "") + "streak settled by timeout ×" + repeats;
  return r;
}
function nag(u, what) {
  const now = performance.now(); if (now - u.nagAt < 12000) return; u.nagAt = now;
  receipt(u, ["rcPick", { name: u.name, k1: "sun", k2: "nile", what }], 2);
}

/* ---------- the single entry point ---------- */
function handleLiveEvent(evt) {
  if (!evt || typeof evt !== "object") return diag({ outcome: "rejected", reason: "bad event" });
  const src = ["live", "test", "demo"].includes(evt.source) ? evt.source : (state.mode === "live" ? "live" : "test");
  const hostAllowed = new URLSearchParams(location.search).get("host") === "1";
  if (state.mode === "live" && src !== "live" && !hostAllowed)
    return diag({ outcome: "rejected", src, type: evt.type, reason: "host tests disabled in LIVE; use explicit host mode on a private preview" });
  const userId = String(evt.userId || evt.uniqueId || evt.username || "").trim().slice(0, 80);
  const username = (String(evt.username || evt.nickname || evt.userId || "worker").trim() || "worker").slice(0, 40);
  const type = String(evt.type || "chat").toLowerCase();
  const eid = evt.eventId != null ? evt.eventId : evt.msgId != null ? evt.msgId : evt.id;
  const base = { src, user: username, uid: userId, type, eid };
  if (src === "live") { state.conn.lastEvent = performance.now(); if (state.conn.st !== "live") state.conn.st = "live"; }
  if (!userId) return diag(Object.assign(base, { outcome: "rejected", reason: "no user id" }));
  if (type !== "chat" && type !== "like" && type !== "gift") return diag(Object.assign(base, { outcome: "rejected", reason: "unknown type " + type }));
  // Validate source payload BEFORE ledger deduplication or gameplay changes.
  const validPositive = (v,max) => {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
    return Number.isSafeInteger(n) && n >= 1 && n <= max ? n : null;
  };
  if (type === "like") {
    const x = evt.likeCount ?? evt.repeatCount ?? 1, n = validPositive(x,100000);
    if (n === null) return diag(Object.assign(base,{outcome:"rejected",reason:"invalid like count"}));
    evt = Object.assign({},evt,{likeCount:n});
  }
  if (type === "gift") {
    const units = validPositive(evt.diamondCount ?? evt.giftValue,1000000);
    const repeats = validPositive(evt.repeatCount ?? 1,100000);
    if (units === null || repeats === null)
      return diag(Object.assign(base,{outcome:"rejected",reason:"invalid gift units or repeats"}));
    evt = Object.assign({},evt,{diamondCount:units,giftValue:units,repeatCount:repeats});
  }
  LEDGER.bySrc[src]++;
  if (eid != null && eid !== "") {
    // bounded LRU of event ids; it lives for the whole page session, so it survives connector reconnects / replays
    const k = src + ":" + eid;
    if (LEDGER.seen.has(k)) { LEDGER.seen.delete(k); LEDGER.seen.set(k, 1); return diag(Object.assign(base, { outcome: "duplicate", reason: "event id " + eid + " already processed" + (LEDGER.reconnects ? " (replay after reconnect?)" : "") })); }
    LEDGER.seen.set(k, 1);
    while (LEDGER.seen.size > CONFIG.eventIdMemory) LEDGER.seen.delete(LEDGER.seen.keys().next().value);
  }
  let u = state.users.get(userId);
  if (u && evt.photoUrl && !u.photoUrl) u.photoUrl = evt.photoUrl;
  if (u) base.team = u.team;

  if (type === "chat") {
    const comment = String(evt.comment || "");
    const team = parseTeam(comment);
    let joined = false;
    if (!u || !u.team) {
      if (!team) {
        if (u) { nag(u, "whatAll"); return diag(Object.assign(base, { outcome: "rejected", reason: "comment has no team keyword (contributions stay saved)" })); }
        return diag(Object.assign(base, { outcome: "rejected", reason: "not joined: comment has no team keyword" }));
      }
      u = getOrMakeUser(userId, username, evt.photoUrl, src);
      if (!u) return diag(Object.assign(base, { outcome: "rejected", reason: "participant ledger full" }));
      assignTeam(u, team); joined = true; base.team = team;
    } else if (team && team !== u.team) {
      // crews are locked for the session; the comment still heaves for the viewer's own crew
      if (performance.now() - (u.stayAt || -1e9) > 20000) { u.stayAt = performance.now(); receipt(u, ["rcStay", { name: u.name, team: u.team }], 2); }
      base.note = "switch to " + team + " ignored (team locked)";
    }
    u.bubble = comment.slice(0, 28); u.bubbleUntil = performance.now() + 2200;
    const r = applyAction(u, { type: "chat", n: 1, src, eid, joined });
    if (base.note) r.note = base.note;
    return r;
  }
  if (type === "like") {
    const n = Math.min(15, evt.likeCount);
    if (!u || !u.team) {
      u = getOrMakeUser(userId, username, evt.photoUrl, src);
      if (!u) return diag(Object.assign(base, { outcome: "rejected", reason: "participant ledger full" }));
      holdPending(u, { type: "like", n, src, eid }); nag(u, "whatLike");
      return diag(Object.assign(base, { outcome: "held", reason: "no crew yet: likes saved until a team keyword" }));
    }
    return applyAction(u, { type: "like", n, src, eid });
  }
  // gift
  const g = resolveGift(evt);
  const reps = streakGate(evt, src, userId, g, base);
  if (!reps) return LEDGER.receipts[LEDGER.receipts.length - 1];
  return processGift(userId, evt, reps, base);
}
window.handleLiveEvent = handleLiveEvent;

/* ---------- host controls ---------- */
function setPaused(v) {
  state.paused = !!v;
  diag({ outcome: "info", src: "host", type: "pause", reason: v ? "paused" : "resumed" });
  if (!v) flushHeld();
  renderStrip();
}
function setCalm(v) { CONFIG.calmEffects = !!v; document.body.classList.toggle("calm", !!v); }
window.__conservation = function () {
  const out = {};
  for (const id of TEAM_IDS) { const T = state.teams[id]; out[id] = { earned: T.earned, delivered: T.delivered, pending: T.pts, transit: T.transit || 0, adjusted: T.adjusted, gap: T.earned - (T.delivered + T.pts + (T.transit || 0) + T.adjusted) }; }
  return out;
};

/* ---------- top UI ---------- */
function applyPhaseUI() {
  const k1 = teamShort("sun"), k2 = teamShort("nile");
  $("banner-title").textContent = state.phase === "boss" ? S("titleBoss") : (state.phase === "victory" ? "🏆 " + S("win") : S("title"));
  $("banner").classList.toggle("boss", state.phase === "boss");
  $("ui").classList.toggle("boss", state.phase === "boss");
  $("r1k").textContent = state.phase === "boss" ? S("r1kBoss") : S("r1k");
  $("r1h").textContent = state.phase === "boss" ? S("r1hBoss") : S("r1h", { k1, k2 });
  $("r2k").textContent = state.phase === "boss" ? S("r2kBoss") : S("r2k");
  $("r2h").textContent = state.phase === "boss" ? S("r2hBoss") : S("r2h");
  $("start-b").textContent = S("startT"); $("start-s").textContent = S("startS");
  ruleAt = 0; renderStrip(); rerenderPop();
  refreshUI();
}
function missionModel(s, cfg) {
  const tr = cfg.lang === "tr", layers = cfg.layers;
  const sun = Math.min(layers, s.teams.sun.layers), nile = Math.min(layers, s.teams.nile.layers);
  const remain = (v) => Math.max(0, Math.ceil(v - s.time));
  if (s.phase === "boss") {
    return { phase: "boss",
      main: tr ? "🐍 APEP'İ YEN · " + Math.ceil(s.bossHP).toLocaleString() + " CAN"
               : "🐍 DEFEAT APEP · " + Math.ceil(s.bossHP).toLocaleString() + " HP",
      detail: "⏳ " + remain(s.bossEnds) + "s · " + (tr ? "HEP BİRLİKTE" : "FIGHT TOGETHER") };
  }
  if (s.phase === "victory") return { phase: "victory",
    main: tr ? "🏆 PİRAMİT TAMAMLANDI" : "🏆 PYRAMID COMPLETE",
    detail: (tr ? "YENİ TUR" : "NEXT ROUND") + " · " + remain(s.phaseAt) + "s" };
  if (s.phase === "race") return { phase: "race",
    main: tr ? "🏁 " + String(s.raceWinner || "").toUpperCase() + " ÖNDE BİTİRDİ"
             : "🏁 " + String(s.raceWinner || "").toUpperCase() + " FINISHED FIRST",
    detail: (tr ? "APEP GELİYOR" : "APEP APPROACHES") + " · " + remain(s.phaseAt) + "s" };
  const next = Math.min(layers, (Math.floor(Math.max(sun,nile) / cfg.milestoneEvery) + 1) * cfg.milestoneEvery);
  return {phase:"build",
    main: "🧱 " + (tr ? "SONRAKİ HEDEF · KAT " : "NEXT MILESTONE · LAYER ") + next,
    detail: "SUN " + sun + "/" + layers + " · NILE " + nile + "/" + layers };
}
function renderMission() {
  const el = $("mission"); if (!el) return;
  const m = missionModel(state, CONFIG);
  el.className = "mission " + m.phase;
  if ($("mission-main").textContent !== m.main) $("mission-main").textContent = m.main;
  if ($("mission-detail").textContent !== m.detail) $("mission-detail").textContent = m.detail;
}
function renderMeters() {
  let html = "";
  if (state.phase === "boss") {
    const pct = (state.bossHP / state.bossMax) * 100;
    html += '<div class="mrow"><div class="bar hp"><div class="fill" style="width:' + pct.toFixed(1) + '%"></div><div class="hpTxt">🐍 ' +
      S("hp", { hp: Math.ceil(state.bossHP).toLocaleString(), max: state.bossMax.toLocaleString() }) + " · ⏳" + Math.max(0, Math.ceil(state.bossEnds - state.time)) + "s</div></div></div>";
  }
  const bpl = CONFIG.blocksPerLayer;
  for (const id of TEAM_IDS) {
    const T = state.teams[id], c = CONFIG.teams[id].colors;
    const frac = Math.min(1, (T.blocks + (state.phase === "build" ? Math.min(1, T.pts / CONFIG.pullsPerBlock) * 0.999 : 0)) / (CONFIG.layers * bpl));
    const inLayer = T.layers >= CONFIG.layers ? bpl : T.blocks % bpl;
    html += '<div class="mrow"><img class="crest" src="' + crestURL[id] + '" alt=""/><div class="tn" style="color:' + c.css2 + '">' + esc(teamShort(id)) +
      '</div><div class="bar"><div class="fill" style="width:' + (frac * 100).toFixed(1) + '%;background:linear-gradient(90deg,' + c.css + "," + c.css2 + ')"></div><div class="ticks"></div></div><div class="lv">' +
      S("layer", { n: Math.min(T.layers, CONFIG.layers), t: CONFIG.layers }) + ' <span class="bm">' + S("blockMeter", { b: inLayer, t: bpl }) + "</span></div></div>";
  }
  $("meters").innerHTML = html;
}
function connText() {
  const c = state.conn, now = performance.now();
  if (state.mode === "demo") return ["demo", S("connDemo")];
  if (state.mode !== "live") return ["test", S("connTest")];
  if (c.st === "connecting") return ["warn", S("connConnecting")];
  if (c.st === "listening") return ["warn", S("connListening")];
  if (c.st === "down") return ["bad", c.retryAt ? S("connDown", { s: Math.max(0, Math.ceil((c.retryAt - now) / 1000)) }) : S("connDownManual")];
  const ago = Math.round((now - c.lastEvent) / 1000);
  return ago > 90 ? ["warn", S("connQuiet", { s: ago })] : ["ok", S("connLive", { s: ago })];
}
function renderCounts() {
  let onscreen = 0, off = 0, choosing = 0;
  for (const u of state.users.values()) { if (!u.team) choosing++; else if (u.inst >= 0) onscreen++; else off++; }
  const ct = connText();
  const g = (t) => '<span class="grp">' + esc(t) + "</span>";
  let txt = '<span class="conn ' + ct[0] + '">' + esc(ct[1]) + "</span>" + g("🔺 " + S("layersShort", { a: state.teams.sun.layers, b: state.teams.nile.layers })) + g("👥 " + S("workers", { n: onscreen }) + (off ? " " + S("cheering", { n: off }) : ""));
  if (choosing) txt += g(S("choosing", { n: choosing }));
  if (state.phase === "build" && state.time < state.gustUntil) txt += ' <span class="chip">' + esc(S("gustChip", { b: CONFIG.gust.bonus, s: Math.ceil(state.gustUntil - state.time) })) + "</span>";
  if (state.paused) txt += ' <span class="chip">' + esc(S("paused")) + "</span>";
  $("counts").innerHTML = txt;
}
function topBy(key, n, filter) {
  return [...state.users.values()].filter(u => u.team && u[key] > 0
    && (state.mode !== "live" || u.src === "live")
    && (!filter || filter(u))).sort((a, b) => b[key] - a[key]).slice(0, n);
}
function renderBoard() {
  let html = "<h2>👑 " + S("boardPharaohs") + "</h2>";
  for (const id of TEAM_IDS) {
    const p = [...state.users.values()].find(u => u.team === id && u.pharaoh
      && (state.mode !== "live" || u.src === "live"));
    const c = CONFIG.teams[id].colors;
    if (!p) html += '<div class="cap-row"><div class="av" style="border-color:' + c.css + '"><img src="' + crestURL[id] + '"/></div><div class="nm" style="color:#b8a888;font-size:10px">' + esc(S("pharaohNeed", { p: CONFIG.pharaohGift })) + "</div></div>";
    else {
      const av = p.photoUrl ? '<img src="' + esc(p.photoUrl) + '" alt=""/>' : esc(p.name.slice(0, 1).toUpperCase());
      html += '<div class="cap-row"><div class="av" style="border-color:' + c.css + '">' + av + '</div><div class="nm" style="color:' + c.css2 + '">' + esc(p.name) + '</div><div class="dm">' + p.diamonds.toLocaleString() + "💎</div></div>";
    }
  }
  const testTag = state.mode === "live" ? "" : ' <span class="tag">' + esc(S("boardTest")) + "</span>";
  html += "<h2>🎁 " + S("boardSupporters") + testTag + "</h2><ol>";
  const sup = topBy("diamonds", 3);
  if (!sup.length) html += '<div class="empty">' + esc(S("ruleCrown", { p: CONFIG.pharaohGift, o: CONFIG.overseerThreshold }).replace(/^👑 /, "")) + "</div>";
  sup.forEach((u, i) => { html += '<li class="' + u.team + '"><span class="nm">' + (i + 1) + ". " + (u.overseer ? "⭐" : "") + esc(u.name) + '</span><span class="sc">' + u.diamonds.toLocaleString() + "💎</span></li>"; });
  const boss = state.phase === "boss" || state.phase === "victory";
  html += "</ol><h2>" + (boss ? "☀️ " + S("boardDamage") : "💪 " + S("boardHaulers")) + "</h2><ol>";
  const tops = topBy(boss ? "power" : "free", 3);
  if (!tops.length) html += '<div class="empty">—</div>';
  tops.forEach((u, i) => { html += '<li class="' + u.team + '"><span class="nm">' + (i + 1) + ". " + esc(u.name) + '</span><span class="sc">' + Math.round(boss ? u.power : u.free).toLocaleString() + "</span></li>"; });
  html += "</ol>";
  $("board").innerHTML = html;
}
// live mode before the crowd arrives: a viewer-facing "crew is gathering" card instead of an empty yard
function renderWaiting() {
  const el = $("waiting"); if (!el) return;
  let crew = false; if (state.mode === "live") for (const u of state.users.values()) if (u.team) { crew = true; break; }
  const on = state.mode === "live" && !crew && state.phase === "build";
  el.classList.toggle("on", on);
  if (on) {
    const disconnected = state.conn.st === "down";
    $("wait-t").textContent = disconnected
      ? (CONFIG.lang === "tr" ? "CANLI BAĞLANTI KESİLDİ" : "LIVE CONNECTION UNAVAILABLE")
      : S("waitTitle");
    $("wait-s").innerHTML = disconnected
      ? (CONFIG.lang === "tr" ? "Yayıncı tekrar bağlanmalı. Şu an katkılar alınamıyor." : "Host must reconnect. Contributions are not being received right now.")
      : esc(S("waitSub")).replace("{k1}", '<b class="k sun">' + esc(teamShort("sun")) + "</b>").replace("{k2}", '<b class="k nile">' + esc(teamShort("nile")) + "</b>");
    $("wait-c").textContent = disconnected
      ? (CONFIG.lang === "tr" ? "BAĞLANTI YOK" : "NOT CONNECTED")
      : (state.conn.st === "live" || state.conn.st === "listening" ? S("waitReady") : S("waitSoon"));
  }
}
// v1.8: stage-readable participatory cue. This reads ledger totals but does
// not write credits, spawn workers, change the build clock or boss physics.
function renderV18Heave() {
  const el = $("v18-heave");
  if (!el) return;
  const tr = CONFIG.lang === "tr";
  const title = $("v18-heave-title"), detail = $("v18-heave-detail"), fill = $("v18-heave-fill");
  const phase = state.phase;
  const joined = [...state.users.values()].some(u => u.team);
  let team = Math.floor(state.time / 5) % 2 ? "nile" : "sun";
  let headline = "", instruction = "", progress = 0, delivering = false;
  if (state.paused) {
    headline = tr ? "⏸ OYUN DURAKLATILDI" : "⏸ GAME PAUSED";
    instruction = tr ? "Katkılar sırada bekliyor" : "Contributions are being held";
  } else if (phase === "build") {
    const busy = TEAM_IDS.find(id => state.teams[id].delivering > 0);
    if (busy) team = busy;
    const T = state.teams[team];
    progress = Math.max(0, Math.min(100, T.pts / CONFIG.pullsPerBlock * 100));
    delivering = T.delivering > 0;
    if (!joined) {
      headline = tr ? "🪢 BİR TAKIMA KATIL" : "🪢 JOIN A CREW";
      instruction = tr ? "GÜNEŞ veya NİL yaz" : "Type SUN or NILE";
    } else if (delivering) {
      headline = "🧱 " + teamShort(team) + (tr ? " · TAŞ YOLDA!" : " · STONE EN ROUTE!");
      instruction = tr ? "Yeni taşı yerleştiriyoruz" : "Placing the next stone";
      progress = 100;
    } else {
      headline = "🪢 " + teamShort(team) + " · %" + Math.round(progress);
      instruction = tr ? "Yorum yap → taşı çek" : "Comment to pull the next stone";
    }
  } else if (phase === "boss") {
    const remaining = state.bossMax > 0 ? state.bossHP / state.bossMax : 0;
    progress = Math.max(0, Math.min(100, (1 - remaining) * 100));
    const critical = remaining > 0 && remaining <= 0.2;
    headline = critical
      ? (tr ? "🔥 SON HAMLE · APEP " : "🔥 FINAL PUSH · APEP ") + Math.ceil(remaining * 100) + "%"
      : (tr ? "🐍 APEP'İ DURDUR" : "🐍 DEFEAT APEP");
    instruction = critical
      ? (tr ? "Herkes yorum yapsın veya beğensin!" : "Everyone comment or like now!")
      : (tr ? "Yorum yap veya beğen → saldır" : "Comment or like to attack");
  } else if (phase === "race") {
    headline = tr ? "🏁 PİRAMİT TAMAMLANDI!" : "🏁 PYRAMID COMPLETED!";
    instruction = tr ? "APEP GELİYOR" : "APEP APPROACHES";
  } else {
    headline = tr ? "🏆 YENİ TUR GELİYOR" : "🏆 NEXT ROUND SOON";
    instruction = tr ? "Takımlar yeniden hazırlanıyor" : "Crews are regrouping";
  }
  const criticalBoss = phase === "boss" && state.bossMax > 0 &&
    state.bossHP > 0 && state.bossHP / state.bossMax <= 0.2;
  el.className = (phase === "boss" ? "boss" : (phase === "race" ? "race" :
    phase === "victory" ? "victory" : team)) +
    (delivering ? " delivering" : "") + (criticalBoss ? " final-push" : "");
  if (title.textContent !== headline) title.textContent = headline;
  if (detail.textContent !== instruction) detail.textContent = instruction;
  fill.style.width = progress.toFixed(1) + "%";
}
window.__v18Heave = renderV18Heave;
if (QP.get("visualQA") === "1") {
  window.__v19CrewPreview = (id = "sun") => v19CrewCheer(id, "layer", true);
  window.__v19CrewState = () => ({ events: V19_CHEER.events, team: V19_CHEER.team,
    kind: V19_CHEER.kind });
}
function refreshUI() { renderWaiting(); renderMeters(); renderMission(); renderCounts(); renderBoard(); renderStrip(); renderV18Heave(); if (window.renderHostPanel) window.renderHostPanel(); }
function toggleLang() {
  // all viewer-facing text re-renders, including the visible log (rebuilt from its stored message keys)
  CONFIG.lang = CONFIG.lang === "en" ? "tr" : "en";
  document.documentElement.lang = CONFIG.lang;
  renderLog();
  applyPhaseUI();
}

/* ============================================================
   3D renderer, lighting, Egyptian world
   ============================================================ */
const renderer = new THREE.WebGLRenderer({ canvas: $("c"), antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2));
renderer.setSize(W, H, false);
renderer.setClearColor(0xf2c48a, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const FOG_COL = 0xe9c9a2;
scene.fog = new THREE.Fog(FOG_COL, 150, 460);

const camera = new THREE.PerspectiveCamera(52, W / H, 0.3, 600);
const camPos = new THREE.Vector3(0, 22, 32);
const camLook = new THREE.Vector3(0, 2.2, -11);
const camTarget = camLook.clone();
camera.position.copy(camPos); camera.lookAt(camLook);

const dummy = new THREE.Object3D();
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const world = new THREE.Group(); scene.add(world);

function mat(color, extra) {
  return new THREE.MeshPhongMaterial(Object.assign({ color, flatShading: true, shininess: 10, specular: 0x221a10 }, extra || {}));
}
const VCMAT = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 8, specular: 0x1a140c });
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function rnd(a, b) { return a + Math.random() * (b - a); }
function srand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* merge many coloured primitives into one vertex-coloured mesh (one draw call) */
function Merge() { this.parts = []; }
Merge.prototype.add = function (geo, color, pos, rot, scl) {
  dummy.position.set(pos ? pos[0] : 0, pos ? pos[1] : 0, pos ? pos[2] : 0);
  dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
  if (scl == null) dummy.scale.set(1, 1, 1); else if (typeof scl === "number") dummy.scale.set(scl, scl, scl); else dummy.scale.set(scl[0], scl[1], scl[2]);
  dummy.updateMatrix();
  this.parts.push({ geo, color, m: dummy.matrix.clone() });
  return this;
};
Merge.prototype.addM = function (geo, color, m4) { this.parts.push({ geo, color, m: m4.clone() }); return this; };
Merge.prototype.geometry = function () {
  const pos = [], nor = [], col = [];
  const c = new THREE.Color();
  for (const p of this.parts) {
    const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()); g.applyMatrix4(p.m); g.computeVertexNormals();
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    const jitter = p.color && p.color.jit;
    for (let i = 0; i < P.length; i += 9) {
      c.set(p.color && p.color.c != null ? p.color.c : p.color);
      if (jitter) c.offsetHSL(0, 0, (Math.random() - 0.5) * jitter);
      for (let k = 0; k < 9; k++) { pos.push(P[i + k]); nor.push(N[i + k]); }
      for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
};
Merge.prototype.mesh = function (opts) {
  const m = new THREE.Mesh(this.geometry(), opts && opts.material || VCMAT);
  m.castShadow = !(opts && opts.noCast); m.receiveShadow = !(opts && opts.noReceive);
  return m;
};
const J = (c, jit) => ({ c, jit: jit == null ? 0.06 : jit });

/* ---------- sky ---------- */
const SUN_DIR = new THREE.Vector3(-0.55, 0.16, -1).normalize();
(function buildSky() {
  const geo = new THREE.SphereGeometry(400, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sunDir: { value: SUN_DIR }, storm: { value: 0 } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: [
      "uniform vec3 sunDir; uniform float storm; varying vec3 vP;",
      "void main(){",
      " float h = clamp(vP.y, -0.2, 1.0);",
      " vec3 top = vec3(0.10,0.30,0.70); vec3 mid = vec3(0.45,0.68,0.95); vec3 hor = vec3(1.0,0.80,0.58);",
      " vec3 col = mix(hor, mid, smoothstep(0.0, 0.035, h)); col = mix(col, top, smoothstep(0.035, 0.30, h));",
      " float s = max(dot(normalize(vP), normalize(sunDir)), 0.0);",
      " col += vec3(1.0,0.62,0.25)*pow(s, 10.0)*0.35 + vec3(1.0,0.9,0.6)*pow(s, 200.0)*1.2;",
      " if (h < 0.0) col = hor;",
      " col = mix(col, vec3(0.66,0.44,0.30)*(0.75+0.35*h), storm*0.75);",
      " gl_FragColor = vec4(col,1.0);",
      "}"].join("\n")
  });
  const sky = new THREE.Mesh(geo, m); sky.renderOrder = -10; scene.add(sky); window.__skyMat = m;
  // big sun disk + glow sprites
  const glowTex = canvasTex(256, 256, (g, w, h) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, "rgba(255,250,220,1)"); r.addColorStop(0.12, "rgba(255,236,170,1)"); r.addColorStop(0.2, "rgba(255,200,110,.55)");
    r.addColorStop(0.5, "rgba(255,160,70,.16)"); r.addColorStop(1, "rgba(255,140,60,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  sun.position.copy(SUN_DIR).multiplyScalar(330); sun.scale.set(150, 150, 1); scene.add(sun);
  // clouds: soft streaks
  const cloudTex = canvasTex(256, 64, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      const x = 30 + Math.random() * 196, y = 24 + Math.random() * 16, r = 18 + Math.random() * 26;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,236,210,.75)"); gr.addColorStop(1, "rgba(255,220,190,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.75 }));
    s.position.set(-200 + i * 70 + rnd(-20, 20), 70 + rnd(0, 60), -320 + rnd(-20, 20)); s.scale.set(rnd(110, 180), rnd(20, 34), 1);
    scene.add(s);
  }
})();

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x6a4a3a, 0.46); scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffd6a6, 1.22);
sunLight.position.set(-38, 50, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(IS_MOBILE ? 1024 : 2048, IS_MOBILE ? 1024 : 2048);
Object.assign(sunLight.shadow.camera, { near: 5, far: 170, left: -50, right: 50, top: 58, bottom: -46 });
sunLight.shadow.bias = -0.0006; sunLight.shadow.normalBias = 0.02;
sunLight.target.position.set(0, 0, -10); scene.add(sunLight); scene.add(sunLight.target);
const rim = new THREE.DirectionalLight(0xff9a50, 0.35); rim.position.set(30, 14, -60); scene.add(rim);
const ambient = new THREE.AmbientLight(0xfff0dd, 0.06); scene.add(ambient);

/* ---------- layout constants ---------- */
// The Great Pyramid: 34 m base, ~52° faces like Khufu's, height split into CONFIG.layers courses
const B = 34, PYR_H = B / 2 * 1.27, LH = PYR_H / CONFIG.layers;
const PC = new THREE.Vector3(0, 0, -29);           // the Great Pyramid (left half = SUN, right half = NILE)
const SIDE = { sun: -1, nile: 1 };
const PYR = { sun: new THREE.Vector3(-B / 4, 0, PC.z), nile: new THREE.Vector3(B / 4, 0, PC.z) };
const TRACK_A = { sun: new THREE.Vector3(-3.8, 0, 9), nile: new THREE.Vector3(3.8, 0, 9) };
const RIVER_Z = -76;
function layerSide(i) { return B * (1 - i / (CONFIG.layers + 0.25)); }

/* ---------- terrain ---------- */
function riverCenter(x) { return RIVER_Z + Math.sin(x / 28) * 5 + Math.sin(x / 9) * 1.2; }
function terrainH(x, z) {
  // flat work site, dunes beyond, the Nile behind
  const dx = Math.max(0, Math.abs(x) - 26), dz = Math.max(0, z - 20, -52 - z);
  const away = Math.min(1, Math.hypot(dx, dz) / 14);
  let h = (Math.sin(x * 0.11 + z * 0.05) * 1.6 + Math.sin(x * 0.05 - z * 0.13 + 1.3) * 2.4 + Math.sin(x * 0.23 + z * 0.19) * 0.5) * away;
  h += away * 1.6;
  h += (Math.sin(x * 0.7) * Math.cos(z * 0.6)) * 0.12; // ripples
  const rd = Math.abs(z - riverCenter(x));
  if (rd < 22) {
    const bank = 1 - Math.min(1, rd / 22);
    h = h * (1 - bank) + (rd < 8 ? -1.4 : 0.15) * bank;
    if (rd < 8) h = -1.4 + Math.max(0, rd - 6) * 0.6;
  }
  if (z < RIVER_Z - 14) h += Math.min(10, (RIVER_Z - 14 - z) * 0.12) * (0.6 + 0.4 * Math.sin(x * 0.04));
  return h;
}
(function buildTerrain() {
  const seg = 120, size = 360;
  let g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -90);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    const jx = (hash(i) % 100 / 100 - 0.5) * 0.9, jz = (hash(i * 7) % 100 / 100 - 0.5) * 0.9;
    const X = x + (Math.abs(x) > 1 ? jx : 0), Z = z + jz;
    P.setXYZ(i, X, terrainH(X, Z), Z);
  }
  g = g.toNonIndexed(); g.computeVertexNormals();
  const pos = g.attributes.position, col = [];
  const sand = new THREE.Color(0xd8ab78), sand2 = new THREE.Color(0xb9804e), sand3 = new THREE.Color(0xeacb9c), wet = new THREE.Color(0x8a7a48), green = new THREE.Color(0x7aa23a),
    green2 = new THREE.Color(0x5b8a2c), path = new THREE.Color(0x9a6a40), c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const n = (hash(i) % 1000) / 1000;
    const patch = 0.5 + 0.5 * Math.sin(x * 0.17 + Math.sin(z * 0.11) * 2) * Math.cos(z * 0.13 - x * 0.05);
    c.copy(sand).lerp(sand2, 0.15 + n * 0.35 + patch * 0.3); if (patch < 0.25) c.lerp(sand3, 0.5 - patch);
    if (y > 2) c.lerp(sand3, Math.min(0.5, (y - 2) * 0.1));
    const rd = Math.abs(z - riverCenter(x));
    if (rd < 18 && y > -0.6) c.copy(n > 0.4 ? green : green2).lerp(sand, Math.max(0, (rd - 9) / 9) * 0.9);
    if (y < -0.6) c.copy(wet);
    // trampled work site paths
    if (Math.abs(x) < 17 && z > -14 && z < 18) c.lerp(path, 0.35);
    c.offsetHSL(0, 0, (n - 0.5) * 0.05);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  m.receiveShadow = true; world.add(m);
})();

/* ---------- the Nile ---------- */
let water;
(function buildWater() {
  const g = new THREE.PlaneGeometry(420, 34, 90, 10); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) + RIVER_Z);
  water = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: 0x2f8fb0, emissive: 0x0a2a3a, specular: 0xffd8a0, shininess: 70, flatShading: true, transparent: true, opacity: 0.92 }));
  water.position.y = -0.55; water.receiveShadow = true; world.add(water);
  water.userData.base = Float32Array.from(P.array);
})();
function updateWater(t) {
  const P = water.geometry.attributes.position, b = water.userData.base;
  for (let i = 0; i < P.count; i++) {
    const x = b[i * 3], z = b[i * 3 + 2];
    P.array[i * 3 + 1] = Math.sin(x * 0.35 + t * 1.3) * 0.08 + Math.cos(z * 0.6 + t * 1.7 + x * 0.1) * 0.07;
  }
  P.needsUpdate = true; water.geometry.computeVertexNormals();
}

/* ---------- palms, reeds, rocks ---------- */
function palmGeometry(seed) {
  const r = srand(seed), M = new Merge();
  const segs = 6, lean = (r() - 0.5) * 0.5; let x = 0, y = 0;
  for (let i = 0; i < segs; i++) {
    const h = 0.9, rad = 0.2 - i * 0.018;
    M.add(new THREE.CylinderGeometry(rad * 0.9, rad, h, 6), J(i % 2 ? 0x8a6038 : 0x76502e, 0.04), [x, y + h / 2, 0], [0, 0, -lean * 0.4]);
    y += h * 0.98; x += lean * 0.18 * (i + 1) * 0.3;
  }
  const fr = 9;
  for (let i = 0; i < fr; i++) {
    const a = i / fr * Math.PI * 2 + r() * 0.3;
    const len = 2.6 + r() * 0.8;
    const geo = new THREE.ConeGeometry(0.42, len, 4, 1); geo.translate(0, len / 2, 0); geo.scale(1, 1, 0.18);
    const droop = 1.1 + r() * 0.6;
    M.add(geo, J(i % 2 ? 0x3f8a2a : 0x4f9e30, 0.08), [x, y, 0], [0, -a, droop]);
  }
  M.add(new THREE.DodecahedronGeometry(0.26, 0), J(0x6a3a18), [x, y - 0.15, 0]);
  return M.geometry();
}
const decorNoCast = [];
function scatterInstanced(geo, list, material, cast) {
  const m = new THREE.InstancedMesh(geo, material || VCMAT, list.length);
  list.forEach((p, i) => {
    dummy.position.set(p[0], p[1] == null ? terrainH(p[0], p[2]) : p[1], p[2]);
    dummy.rotation.set(0, p[3] || 0, 0); const s = p[4] || 1; dummy.scale.set(s, s, s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  });
  m.castShadow = cast !== false; m.receiveShadow = true; world.add(m); return m;
}
(function buildVegetation() {
  const r = srand(77);
  const palms = [[], []];
  // riverbank groves
  for (let i = 0; i < 46; i++) {
    const x = -120 + r() * 240, side = r() < 0.65 ? 1 : -1;
    const z = riverCenter(x) + side * (9 + r() * 8);
    palms[i % 2].push([x, null, z, r() * 6.28, 0.9 + r() * 0.6]);
  }
  // work-site palms (frame the scene)
  [[-15, 8], [-17.5, 3], [-14, -4], [16, 9], [18, 2.5], [14.5, -6], [-19, 13], [20, 14], [-22, -13], [23, -17], [-12.5, 16], [12.5, 17], [-26, -30], [27, -36]].forEach(([x, z], i) => palms[i % 2].push([x, null, z, r() * 6.28, 0.95 + r() * 0.35]));
  scatterInstanced(palmGeometry(3), palms[0]);
  scatterInstanced(palmGeometry(9), palms[1]);
  // reeds
  const reedM = new Merge();
  for (let k = 0; k < 7; k++) reedM.add(new THREE.ConeGeometry(0.05, 1.3 + k * 0.08, 3), J(k % 2 ? 0x6d9a34 : 0x86ad3c), [(k % 3 - 1) * 0.15, 0.6, (k % 2 - 0.5) * 0.2], [0, 0, (k - 3) * 0.12]);
  const reeds = [];
  for (let i = 0; i < 160; i++) { const x = -110 + r() * 220, side = r() < 0.5 ? 1 : -1; reeds.push([x, -0.5, riverCenter(x) + side * (6.2 + r() * 1.6), r() * 6.28, 0.8 + r() * 0.6]); }
  scatterInstanced(reedM.geometry(), reeds, null, false);
  // desert rocks + shrubs
  const rockM = new Merge(); rockM.add(new THREE.DodecahedronGeometry(0.7, 0), J(0xc79a62, 0.1), [0, 0.2, 0], [0.3, 0.5, 0], [1.3, 0.7, 1]);
  const rocks = [];
  for (let i = 0; i < 70; i++) { const x = -60 + r() * 120, z = -50 + r() * 75; if (Math.abs(x) < 16 && z > -40) continue; rocks.push([x, null, z, r() * 6, 0.5 + r() * 1.4]); }
  scatterInstanced(rockM.geometry(), rocks);
  const shrubM = new Merge(); shrubM.add(new THREE.IcosahedronGeometry(0.45, 0), J(0x7a8a3a, 0.12), [0, 0.25, 0], null, [1, 0.6, 1]);
  const shrubs = [];
  for (let i = 0; i < 50; i++) { const x = -40 + r() * 80, z = -40 + r() * 60; if (Math.abs(x) < 15 && z > -30) continue; shrubs.push([x, null, z, r() * 6, 0.6 + r()]); }
  scatterInstanced(shrubM.geometry(), shrubs);
})();

/* ---------- felucca ---------- */
let felucca;
(function buildFelucca() {
  const M = new Merge();
  M.add(new THREE.BoxGeometry(5.2, 0.6, 1.5), J(0x7a4a26), [0, 0.2, 0]);
  M.add(new THREE.ConeGeometry(0.75, 1.4, 4), J(0x7a4a26), [3.2, 0.2, 0], [0, Math.PI / 4, -Math.PI / 2], [1, 1, 1]);
  M.add(new THREE.ConeGeometry(0.75, 1.0, 4), J(0x6a3e20), [-3.0, 0.25, 0], [0, Math.PI / 4, Math.PI / 2]);
  M.add(new THREE.CylinderGeometry(0.07, 0.09, 6.5, 5), J(0x5a3a1c), [0.4, 3.4, 0]);
  const sail = new THREE.BufferGeometry();
  sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 3.6, 5.6, 0, -3.4, 0.6, 0, 0, 0, 0, -3.4, 0.6, 0, 3.6, 5.6, 0], 3));
  M.add(sail, J(0xfff4e0, 0.02), [0.4, 1.2, 0.05]);
  M.add(new THREE.CylinderGeometry(0.04, 0.04, 7.6, 4), J(0x5a3a1c), [0.2, 4.3, 0.06], [0, 0, -0.95]);
  felucca = M.mesh(); felucca.position.set(-30, -0.6, RIVER_Z + 1); felucca.rotation.y = 0.1; world.add(felucca);
})();

/* ---------- monuments: sphinx, obelisks, far pyramids ---------- */
(function buildMonuments() {
  const stone = 0xdcb67a, stone2 = 0xc9a066;
  // Sphinx (lying lion with nemes)
  const S1 = new Merge();
  S1.add(new THREE.BoxGeometry(3.2, 2.0, 8.0), J(stone), [0, 1.0, 0]);
  S1.add(new THREE.BoxGeometry(3.4, 0.9, 8.4), J(stone2), [0, 0.45, 0]);
  S1.add(new THREE.BoxGeometry(0.9, 0.7, 3.2), J(stone), [-1.0, 0.35, 5.0]);
  S1.add(new THREE.BoxGeometry(0.9, 0.7, 3.2), J(stone), [1.0, 0.35, 5.0]);
  S1.add(new THREE.BoxGeometry(2.6, 2.4, 2.4), J(stone), [0, 2.8, 3.4]); // chest / neck
  S1.add(new THREE.BoxGeometry(1.7, 1.9, 1.7), J(0xe2bf86), [0, 4.4, 3.8]); // head
  S1.add(new THREE.CylinderGeometry(0.95, 1.6, 2.4, 4), J(0xd2a868), [0, 4.3, 3.45], [0, Math.PI / 4, 0], [1, 1, 0.75]); // nemes
  S1.add(new THREE.BoxGeometry(0.5, 0.5, 0.4), J(0xe2bf86), [0, 4.2, 4.75]); // nose
  S1.add(new THREE.BoxGeometry(1.2, 0.8, 3.0), J(stone2), [0, 1.2, -4.5], [0.3, 0, 0]);
  const sph = S1.mesh(); sph.position.set(-31, 0, -46); sph.rotation.y = 0.45; world.add(sph);
  // obelisks
  function obelisk(x, z, h, s) {
    const M = new Merge();
    M.add(new THREE.BoxGeometry(1.6, 0.5, 1.6), J(0xb89058), [0, 0.25, 0]);
    M.add(new THREE.CylinderGeometry(0.42 / Math.SQRT2 * 2, 0.62 / Math.SQRT2 * 2, h, 4), J(0xd9b072, 0.03), [0, 0.5 + h / 2, 0], [0, Math.PI / 4, 0]);
    M.add(new THREE.ConeGeometry(0.42 * 1.414, 0.9, 4), J(0xffcf3a, 0.02), [0, 0.5 + h + 0.45, 0], [0, Math.PI / 4, 0]);
    // hieroglyph bands
    for (let i = 0; i < 5; i++) M.add(new THREE.BoxGeometry(0.3, 0.18, 0.04), J(0x7a5a30), [0, 1.6 + i * 0.95, 0.5 - i * 0.012]);
    const m = M.mesh(); m.position.set(x, terrainH(x, z), z); m.scale.setScalar(s || 1); world.add(m); return m;
  }
  obelisk(-19.5, -7, 8.5, 1); obelisk(19.5, -7, 8.5, 1);
  obelisk(-24, -24, 7, 0.9); obelisk(24, -24, 7, 0.9);
  // distant finished pyramids in the haze
  function farPyr(x, z, s, c) {
    const g = new THREE.ConeGeometry(s * 0.72, s * 0.95, 4, 1); g.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(g, mat(c || 0xe6c48a, { shininess: 4 })); m.position.set(x, terrainH(x, z) + s * 0.47, z); m.receiveShadow = true; world.add(m);
  }
  farPyr(-62, -118, 34); farPyr(-30, -132, 22, 0xe0bc82); farPyr(48, -125, 28, 0xe2c088); farPyr(84, -150, 16);
})();

/* ---------- quarry, huts, props ---------- */
(function buildSiteProps() {
  const r = srand(5);
  // quarry cliff on the left
  const Q = new Merge();
  for (let i = 0; i < 16; i++) {
    const x = -24 - r() * 8, z = -10 + i * 1.8 + r(), h = 3 + r() * 4;
    Q.add(new THREE.BoxGeometry(3 + r() * 2, h, 2.2 + r()), J(i % 3 ? 0xd8b47c : 0xc9a06a, 0.07), [x, h / 2 - 0.3, z], [0, r() * 0.4, 0]);
  }
  for (let i = 0; i < 10; i++) Q.add(new THREE.BoxGeometry(3.5, 1.2, 3), J(0xe4c48c, 0.05), [-21.5 + r(), 0.3, -8 + i * 2.9], [0, r() * 0.3, 0]);
  // cut blocks waiting near the quarry
  for (let i = 0; i < 14; i++) {
    const x = -14.5 - (i % 3) * 1.7, z = 2 + Math.floor(i / 3) * 1.9, y = (i % 5 === 0) ? 1.5 : 0.55;
    Q.add(new THREE.BoxGeometry(1.5, 1.1, 1.5), J(0xeed6a2, 0.05), [x, y, z], [0, r() * 0.2, 0]);
  }
  world.add(Q.mesh());
  // workers' village on the right: mudbrick huts with palm-leaf awnings + jars
  const V = new Merge();
  [[17, 8, 0.2], [19.5, 3, -0.1], [16.5, -2.5, 0.15], [25, -13, 0], [-25.5, -17, 0.3], [18, 13.5, -0.2]].forEach(([x, z, ry]) => {
    const w = 3 + r() * 1.5, d = 2.6 + r(), h = 2 + r() * 0.6;
    V.add(new THREE.BoxGeometry(w, h, d), J(0xc08a56, 0.06), [x, h / 2, z], [0, ry, 0]);
    V.add(new THREE.BoxGeometry(w + 0.3, 0.25, d + 0.3), J(0xa8784a), [x, h + 0.1, z], [0, ry, 0]);
    V.add(new THREE.BoxGeometry(0.8, 1.3, 0.1), J(0x3a2412), [x - Math.sin(ry) * 0, 0.65, z + d / 2 + 0.03], [0, ry, 0]);
    V.add(new THREE.BoxGeometry(w * 0.9, 0.08, 1.6), J(0x8aa040, 0.1), [x, h * 0.75, z + d / 2 + 0.75], [0.25, ry, 0]);
    for (let k = 0; k < 3; k++) {
      const jx = x - w / 2 + 0.4 + k * 0.5, jz = z + d / 2 + 0.4;
      V.add(new THREE.SphereGeometry(0.28, 6, 5), J(0xb0603a), [jx, 0.3, jz], null, [1, 1.3, 1]);
      V.add(new THREE.CylinderGeometry(0.1, 0.14, 0.2, 6), J(0xa05030), [jx, 0.72, jz]);
    }
  });
  world.add(V.mesh());
  // spectator stands of linen awnings either side of the front of the site
  const A = new Merge();
  [[-11.5, 6], [11.5, 6], [-11.5, -4], [11.5, -4]].forEach(([x, z]) => {
    for (const dz of [-1.8, 1.8]) for (const dx of [-1.4, 1.4]) A.add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 5), J(0x6a4424), [x + dx, 1.3, z + dz]);
    A.add(new THREE.BoxGeometry(3.4, 0.08, 4.2), J(x < 0 ? 0xf2c060 : 0x7ab8f0, 0.04), [x, 2.6, z], [0, 0, x < 0 ? 0.12 : -0.12]);
  });
  world.add(A.mesh());
})();

/* ---------- mid-ground life: block stockpiles, drum stage, tools ---------- */
const drummers = [];
(function buildMidProps() {
  const r = srand(11), M = new Merge();
  // stockpiles of cut limestone by the pyramid foot
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = sx * (11.6 + (i % 3) * 1.6), z = -10.6 + Math.floor(i / 3) * 1.6, y = 0.5 + (i === 4 ? 1.0 : 0);
    M.add(new THREE.BoxGeometry(1.45, 1.0, 1.45), J(0xf0dcaa, 0.06), [x, y, z], [0, r() * 0.25, 0]);
  }
  // rubble + chips around the base
  for (let i = 0; i < 70; i++) {
    const a = r() * 6.28, d = B / 2 + 1 + r() * 5;
    const x = Math.cos(a) * d, z = PC.z + Math.sin(a) * d * 0.8;
    if (z > PC.z + B / 2 && Math.abs(x) < 7) continue;
    M.add(new THREE.DodecahedronGeometry(0.18 + r() * 0.25, 0), J(0xe8d2a0, 0.1), [x, 0.1, z], [r(), r(), r()]);
  }
  // spare sledges, rollers and water jars
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) M.add(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 6), J(0x7a4e28), [sx * 9.6, 0.14 + (k > 2 ? 0.26 : 0), 4 + k * 0.32], [0, 0.1, Math.PI / 2]);
    for (let k = 0; k < 5; k++) {
      const x = sx * (8.8 + (k % 2) * 0.5), z = -4 + k * 0.6;
      M.add(new THREE.SphereGeometry(0.3, 7, 5), J(0xb4643a), [x, 0.32, z], null, [1, 1.25, 1]);
      M.add(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 6), J(0xa05030), [x, 0.78, z]);
    }
  }
  // drum stage between the two crews (keeps the hauling rhythm)
  M.add(new THREE.BoxGeometry(3.2, 0.5, 2.2), J(0x9a6a3a), [0, 0.25, 5.5 - 6]);
  M.add(new THREE.BoxGeometry(3.4, 0.12, 2.4), J(0xd8a830, 0.02), [0, 0.52, 5.5 - 6]);
  for (const x of [-1.5, 1.5]) for (const z of [4.5, 6.5]) M.add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 5), J(0x6a4422), [x, 1.6, z - 6]);
  for (const x of [-1.5, 1.5]) M.add(new THREE.BoxGeometry(0.06, 0.9, 0.6), J(x < 0 ? CONFIG.teams.sun.colors.primary : CONFIG.teams.nile.colors.primary, 0), [x, 2.3, 4.2 - 6]);
  M.add(new THREE.BoxGeometry(3.1, 0.1, 0.1), J(0x6a4422), [0, 2.8, 4.5 - 6]); M.add(new THREE.BoxGeometry(3.1, 0.1, 0.1), J(0x6a4422), [0, 2.8, 6.5 - 6]);
  for (const x of [-0.7, 0.7]) {
    M.add(new THREE.CylinderGeometry(0.42, 0.36, 0.7, 10), J(0x8a4a22), [x, 0.9, 5.2 - 6]);
    M.add(new THREE.CylinderGeometry(0.43, 0.43, 0.05, 10), J(0xf6e6c0), [x, 1.26, 5.2 - 6]);
  }
  world.add(M.mesh());
})();

/* ---------- team banners on tall poles ---------- */
const flags = [];
function makeBannerTex(team) {
  const col = CONFIG.teams[team].colors;
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = col.css; g.fillRect(0, 0, w, h);
    g.fillStyle = "#f6dc8a"; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 14, w, 6);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f6dc8a" : "#1b2f6b"; g.fillRect(i * 8, h - 8, 8, 8); }
    const img = new Image(); img.onload = () => { g.drawImage(img, 8, 30, 48, 48); g.canvas.__tex && (g.canvas.__tex.needsUpdate = true); }; img.src = crestURL[team] || "";
  });
}
function addFlagPole(x, z, team, h) {
  h = h || 6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 5), mat(0x6a4424)); pole.position.set(x, terrainH(x, z) + h / 2, z); pole.castShadow = true; world.add(pole);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4), mat(0xffcf3a, { shininess: 60, specular: 0xffffff })); tip.position.set(x, pole.position.y + h / 2 + 0.2, z); world.add(tip);
  const tex = makeBannerTex(team); tex.image.__tex = tex;
  const g = new THREE.PlaneGeometry(1.1, 2.2, 6, 1); g.translate(0.58, 0, 0);
  const f = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  f.position.set(x, pole.position.y + h / 2 - 1.3, z); f.castShadow = true; world.add(f);
  f.userData.base = Float32Array.from(g.attributes.position.array); f.userData.ph = Math.random() * 6;
  flags.push(f);
}
function updateFlags(t) {
  for (const f of flags) {
    const P = f.geometry.attributes.position, b = f.userData.base;
    for (let i = 0; i < P.count; i++) { const x = b[i * 3]; P.array[i * 3 + 2] = Math.sin(t * 4 + x * 3 + f.userData.ph) * 0.18 * x; }
    P.needsUpdate = true;
  }
}

/* ---------- pyramids, ramps, scaffolding, track ---------- */
const stoneTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = "#e8dcc4"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    const x = i * 64;
    g.fillStyle = ["#f3ead8", "#e9dcc2", "#f7f0e2", "#e4d5b8"][i]; g.fillRect(x + 2, 2, 60, h - 4);
    for (let k = 0; k < 30; k++) { g.fillStyle = "rgba(120,90,40," + (Math.random() * 0.08) + ")"; g.fillRect(x + Math.random() * 60, Math.random() * h, 3, 2); }
  }
  g.strokeStyle = "rgba(110,80,40,.55)"; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); }
  g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.moveTo(0, h - 1); g.lineTo(w, h - 1); g.stroke();
});
const topTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#f2e8d4"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(120,90,40,.4)"; g.lineWidth = 2;
  for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  for (let r = 0; r < 2; r++) for (let i = 0; i <= 2; i++) { const x = i * 64 + (r ? 32 : 0); g.beginPath(); g.moveTo(x, r * 64); g.lineTo(x, r * 64 + 64); g.stroke(); }
});
const pyr = {};
const layerMats = {};
function makeLayerMesh(i, team) {
  const s = layerSide(i), w = s / 2, d = s;
  if (!layerMats[team]) layerMats[team] = mat(team === "sun" ? 0xfffaf0 : 0xf6f8fa, { map: stoneTex });
  const g = new THREE.BoxGeometry(w, LH, d);
  // bake texture tiling into the UVs: one course per layer, blocks ~2 courses long
  const uv = g.attributes.uv, tile = LH * 8, rows = [[d / tile, 1], [d / tile, 1], [w / tile, d / (LH * 2)], [w / tile, d / (LH * 2)], [w / tile, 1], [w / tile, 1]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const j = f * 4 + k; uv.setXY(j, uv.getX(j) * Math.max(0.25, rows[f][0]), uv.getY(j) * rows[f][1]); }
  g.clearGroups();
  const m = new THREE.Mesh(g, layerMats[team]);
  m.castShadow = true; m.receiveShadow = true; m.userData.side = s;
  return m;
}
function rampGeometry() {
  // unit wedge: top edge at z=0,y=1; foot at z=1,y=0; x in [-0.5,0.5]
  const v = [
    -0.5, 1, 0, 0.5, 1, 0, 0.5, 0, 1, -0.5, 1, 0, 0.5, 0, 1, -0.5, 0, 1,   // slope
    -0.5, 0, 0, -0.5, 1, 0, -0.5, 0, 1,                                     // left side
    0.5, 0, 0, 0.5, 0, 1, 0.5, 1, 0,                                        // right side
    -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0     // back
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  return g;
}
const rampTex = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = "#b98a56"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = y % 32 ? "#a87a48" : "#c4955e"; g.fillRect(0, y, w, 12); g.fillStyle = "rgba(60,40,20,.35)"; g.fillRect(0, y + 12, w, 4); }
});
const great = { grp: new THREE.Group(), ghost: null, cap: null, casing: null };
function buildGreat() {
  const grp = great.grp; grp.position.copy(PC); world.add(grp);
  const hTot = CONFIG.layers * LH + 1.4;
  const gg = new THREE.ConeGeometry(B / Math.SQRT2, hTot, 4, 1, true); gg.rotateY(Math.PI / 4); gg.translate(0, hTot / 2, 0);
  great.ghost = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  great.ghostLines = new THREE.LineSegments(new THREE.EdgesGeometry(gg), new THREE.LineBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.8 }));
  great.ghost.add(great.ghostLines);
  // stepped blueprint rings for every unbuilt layer
  const ringM = [];
  for (let i = 0; i < CONFIG.layers; i++) { const s2 = layerSide(i); const rg = new THREE.EdgesGeometry(new THREE.BoxGeometry(s2, LH, s2)); const l = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.32 })); l.position.y = i * LH + LH / 2; grp.add(l); ringM.push(l); }
  great.rings = ringM;
  grp.add(great.ghost);
  const cg = new THREE.ConeGeometry(1.3, 1.4, 4); cg.rotateY(Math.PI / 4);
  great.cap = new THREE.Mesh(cg, mat(0xffd04a, { emissive: 0x6a4000, shininess: 90, specular: 0xffffff })); great.cap.visible = false; great.cap.castShadow = true; grp.add(great.cap);
  const csg = new THREE.ConeGeometry(B / Math.SQRT2 + 0.06, hTot, 4, 1); csg.rotateY(Math.PI / 4); csg.translate(0, hTot / 2, 0);
  great.casing = new THREE.Mesh(csg, mat(0xfff0cc, { emissive: 0x7a5a18, shininess: 60, specular: 0xffe8a0, transparent: true, opacity: 0 })); great.casing.visible = false; grp.add(great.casing);
  // flags on the front corners
  addFlagPole(-B / 2 - 1, PC.z + B / 2 + 1, "sun", 7);
  addFlagPole(B / 2 + 1, PC.z + B / 2 + 1, "nile", 7);
}
function buildPyramid(team) {
  const o = { grp: great.grp, layers: [], ramp: null, scaffold: null, built: 0, anim: [] };
  for (let i = 0; i < CONFIG.layers; i++) {
    const m = makeLayerMesh(i, team); m.position.set(SIDE[team] * layerSide(i) / 4, i * LH + LH / 2, 0); m.visible = false; great.grp.add(m); o.layers.push(m);
  }
  o.ramp = new THREE.Mesh(rampGeometry(), mat(0xffffff, { map: rampTex })); o.ramp.castShadow = true; o.ramp.receiveShadow = true; world.add(o.ramp);
  pyr[team] = o;
  setPyramidLayers(team, CONFIG.prebuiltLayers, true);
}
function topZ(team, n) { return PC.z + (n > 0 ? layerSide(n - 1) / 2 : B / 2); }
function rampInfo(team, n) {
  const Hh = n * LH, zt = topZ(team, n), sTop = n > 0 ? layerSide(n - 1) : B;
  const front = PC.z + B / 2, zFoot = Math.min(front + 2.5 + Hh * 0.5, front + 9.5); // steeper upper ramp keeps the yard clear
  const len = Math.max(4.5, zFoot - zt);
  const x = SIDE[team] * Math.max(1.0, Math.min(5, sTop / 4)), w = Math.max(1.4, Math.min(3.4, sTop / 2 - 0.4));
  return { H: Hh, zTop: zt, zFoot: zt + len, len, x, w };
}
function setPyramidLayers(team, n, instant) {
  const o = pyr[team]; o.built = n;
  o.layers.forEach((m, i) => { m.visible = i < n; if (instant) { m.scale.set(1, 1, 1); m.position.z = 0; } });
  if (instant) o.partial = 0;
  if (great.rings) { const lo = Math.min(pyr.sun ? pyr.sun.built : n, pyr.nile ? pyr.nile.built : n); great.rings.forEach((r, i) => { r.visible = i >= lo; }); }
  const R = rampInfo(team, n);
  o.ramp.scale.set(R.w, Math.max(0.01, R.H), R.len);
  o.ramp.position.set(R.x, 0, R.zTop);
  buildScaffold(team, n);
  updateTrack(team);
}
function buildScaffold(team, n) {
  const o = pyr[team];
  if (o.scaffold) { o.grp.remove(o.scaffold); o.scaffold.geometry.dispose(); }
  if (n >= CONFIG.layers) { o.scaffold = null; return; }
  const s = layerSide(Math.max(0, n - 1)) + 0.3, y0 = n * LH, M = new Merge(), hgt = 2.2, wood = 0x7a5230, sd = SIDE[team];
  const x0 = sd > 0 ? 0.15 : -s / 2, x1 = sd > 0 ? s / 2 : -0.15, R = rampInfo(team, n);
  const per = Math.max(2, Math.round(s / 2.8));
  const poles = [];
  for (let k = 0; k <= per; k++) { const t = -s / 2 + (k / per) * s; poles.push([sd > 0 ? x1 : x0, t]); }
  for (let k = 0; k <= Math.max(1, per / 2); k++) { const t = x0 + (k / Math.max(1, per / 2)) * (x1 - x0); poles.push([t, -s / 2], [t, s / 2]); }
  for (const [px, pz] of poles) {
    if (pz === s / 2 && Math.abs(px - R.x) < R.w / 2 + 0.5) continue; // leave the ramp mouth open
    M.add(new THREE.CylinderGeometry(0.06, 0.06, hgt, 4), J(wood), [px, y0 + hgt / 2 - LH, pz]);
  }
  for (const yy of [y0 + 0.35, y0 + 1.25]) {
    M.add(new THREE.BoxGeometry(x1 - x0, 0.08, 0.08), J(0x8a6036), [(x0 + x1) / 2, yy, -s / 2]);
    M.add(new THREE.BoxGeometry(0.08, 0.08, s), J(0x8a6036), [sd > 0 ? x1 : x0, yy, 0]);
  }
  // wooden lifting frame (shaduf-style) on the working platform
  const fx = (x0 + x1) / 2 + sd * (s / 8);
  M.add(new THREE.BoxGeometry(0.14, 2.6, 0.14), J(wood), [fx, y0 + 1.3 - LH * 0.2, -s / 2 + 0.8]);
  M.add(new THREE.BoxGeometry(3.4, 0.12, 0.12), J(wood), [fx, y0 + 2.4, -s / 2 + 1.0], [0, 0.9 * sd, -0.35 * sd]);
  o.scaffold = M.mesh(); o.grp.add(o.scaffold);
}
/* track sleepers (log rollers) from the quarry to the ramp foot */
const trackLogs = {};
function updateTrack(team) {
  if (trackLogs[team]) { world.remove(trackLogs[team]); trackLogs[team].geometry.dispose(); }
  const A = TRACK_A[team], R = rampInfo(team, pyr[team].built);
  const Bp = new THREE.Vector3(R.x, 0, R.zFoot);
  const len = A.distanceTo(Bp), n = Math.floor(len / 0.95), ang = Math.atan2(Bp.x - A.x, Bp.z - A.z);
  const M = new Merge();
  for (let i = 0; i <= n; i++) {
    const p = A.clone().lerp(Bp, i / n);
    M.add(new THREE.CylinderGeometry(0.13, 0.13, 3.2, 6), J(i % 2 ? 0x8a5a30 : 0x7a4e28, 0.08), [p.x, 0.12, p.z], [0, ang, Math.PI / 2]);
  }
  // packed-earth strip under the logs
  const strip = new THREE.PlaneGeometry(3.8, len); strip.rotateX(-Math.PI / 2);
  M.add(strip, J(0xa8784a, 0.05), [(A.x + Bp.x) / 2, 0.03, (A.z + Bp.z) / 2], [0, ang, 0]);
  const m = M.mesh(); m.castShadow = false; trackLogs[team] = m; world.add(m);
}
/* path a crew follows: quarry -> ramp foot -> ramp top -> top platform */
function teamPath(team) {
  const R = rampInfo(team, pyr[team].built), x = R.x;
  const pts = [TRACK_A[team].clone(), new THREE.Vector3(x, 0, R.zFoot), new THREE.Vector3(x, R.H, R.zTop), new THREE.Vector3(x * 0.8, R.H, R.zTop - 1.4)];
  const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, lens, total: lens[lens.length - 1], ground: lens[1], w: R.w };
}
function pathAt(path, d, out, dir) {
  d = Math.max(0, Math.min(path.total, d));
  let i = 1; while (i < path.lens.length - 1 && path.lens[i] < d) i++;
  const a = path.pts[i - 1], b = path.pts[i], t = (d - path.lens[i - 1]) / Math.max(1e-6, path.lens[i] - path.lens[i - 1]);
  out.copy(a).lerp(b, t);
  if (dir) dir.copy(b).sub(a).normalize();
  return out;
}
const paths = {};
function refreshPaths() { TEAM_IDS.forEach(t => { paths[t] = teamPath(t); }); }

/* ---------- sledges with limestone blocks ---------- */
const sledges = {};
function buildSledge(team) {
  const g = new THREE.Group();
  const M = new Merge(), col = CONFIG.teams[team].colors;
  for (const x of [-0.85, 0.85]) {
    M.add(new THREE.BoxGeometry(0.22, 0.26, 3.4), J(0x6a4422), [x, 0.18, 0]);
    M.add(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 6), J(0x6a4422), [x, 0.3, -1.7], [0, 0, Math.PI / 2]);
  }
  for (let i = 0; i < 6; i++) M.add(new THREE.BoxGeometry(2.1, 0.1, 0.38), J(0x8a5a30), [0, 0.36, -1.3 + i * 0.52]);
  M.add(new THREE.BoxGeometry(2.3, 0.08, 2.9), J(col.cloth, 0.03), [0, 0.42, 0]); // team cloth
  const base = M.mesh(); g.add(base);
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 2.4), [mat(0xf0dcaa, { map: stoneTex }), mat(0xf0dcaa, { map: stoneTex }), mat(0xf6e4b8), mat(0xe8d09a), mat(0xf0dcaa, { map: stoneTex }), mat(0xf0dcaa, { map: stoneTex })]);
  block.position.y = 1.22; block.castShadow = true; block.receiveShadow = true; g.add(block);
  // binding ropes over the block
  const RM = new Merge();
  for (const z of [-0.7, 0.7]) RM.add(new THREE.BoxGeometry(2.0, 1.56, 0.08), J(0xb08850, 0.02), [0, 1.22, z]);
  const ropes = RM.mesh(); g.add(ropes);
  world.add(g);
  sledges[team] = { g, block, ropes, dir: new THREE.Vector3() };
}

function buildWorld() {
  buildGreat();
  TEAM_IDS.forEach(buildPyramid);
  TEAM_IDS.forEach(buildSledge);
  refreshPaths();
  // flags lining the track
  for (const t of TEAM_IDS) {
    const A = TRACK_A[t], side = t === "sun" ? -1 : 1;
    for (let i = 0; i < 3; i++) addFlagPole(A.x + side * (5.2 + i * 0.4), A.z - 4 - i * 8, t, 5);
  }
}

/* ============================================================
   Workers: instanced multi-part low-poly rigs
   ============================================================ */
const PARTS = ["torso", "collar", "kilt", "belt", "head", "cloth", "cap", "hair", "uaL", "laL", "uaR", "laR", "thL", "shL", "thR", "shR", "shadow"];
const inst = {};
const instMax = CONFIG.maxWorkers;
const instFree = []; for (let i = instMax - 1; i >= 0; i--) instFree.push(i);
const rig = {};
(function buildRig() {
  const R = (name, parent) => { const o = new THREE.Object3D(); if (parent) parent.add(o); rig[name] = o; return o; };
  R("root"); R("hips", rig.root); R("torso", rig.hips); R("collar", rig.torso); R("head", rig.torso);
  R("cloth", rig.head); R("cap", rig.head); R("hair", rig.head);
  R("uaL", rig.torso); R("laL", rig.uaL); R("uaR", rig.torso); R("laR", rig.uaR);
  R("kilt", rig.hips); R("belt", rig.hips); R("thL", rig.hips); R("shL", rig.thL); R("thR", rig.hips); R("shR", rig.thR);
  R("shadow", rig.root);
})();
function bindPose() {
  for (const k in rig) { rig[k].rotation.set(0, 0, 0); rig[k].position.set(0, 0, 0); rig[k].scale.set(1, 1, 1); }
  rig.hips.position.set(0, 0.66, 0);
  rig.collar.position.set(0, 0.47, 0);
  rig.head.position.set(0, 0.64, 0);
  rig.uaL.position.set(-0.23, 0.42, 0); rig.uaR.position.set(0.23, 0.42, 0);
  rig.laL.position.set(0, -0.26, 0); rig.laR.position.set(0, -0.26, 0);
  rig.kilt.position.set(0, -0.12, 0); rig.belt.position.set(0, 0.02, 0);
  rig.thL.position.set(-0.09, -0.02, 0); rig.thR.position.set(0.09, -0.02, 0);
  rig.shL.position.set(0, -0.32, 0); rig.shR.position.set(0, -0.32, 0);
  rig.shadow.position.set(0, 0.03, 0);
}
function partGeos() {
  const g = {};
  g.torso = new THREE.CylinderGeometry(0.2, 0.14, 0.5, 6); g.torso.translate(0, 0.25, 0); g.torso.scale(1, 1, 0.68);
  g.collar = new THREE.CylinderGeometry(0.215, 0.2, 0.08, 8); g.collar.scale(1, 1, 0.78);
  g.kilt = new THREE.CylinderGeometry(0.155, 0.25, 0.32, 7); g.kilt.scale(1, 1, 0.8);
  g.belt = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 7); g.belt.scale(1, 1, 0.8);
  g.head = new THREE.IcosahedronGeometry(0.15, 1); g.head.scale(0.95, 1.05, 1);
  // nemes-style headcloth: dome + side lappets + back tail
  const cm = new Merge();
  cm.add(new THREE.SphereGeometry(0.168, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), 0xffffff, [0, 0.01, -0.005]);
  cm.add(new THREE.BoxGeometry(0.07, 0.22, 0.08), 0xffffff, [-0.15, -0.12, 0.04], [0, 0, 0.12]);
  cm.add(new THREE.BoxGeometry(0.07, 0.22, 0.08), 0xffffff, [0.15, -0.12, 0.04], [0, 0, -0.12]);
  cm.add(new THREE.BoxGeometry(0.22, 0.24, 0.06), 0xffffff, [0, -0.1, -0.13], [0.15, 0, 0]);
  g.cloth = cm.geometry(); g.cloth.deleteAttribute("color");
  g.cap = new THREE.SphereGeometry(0.162, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.42); g.cap.translate(0, 0.02, 0);
  const hm = new Merge(); hm.add(new THREE.SphereGeometry(0.165, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.62), 0xffffff, [0, 0.0, -0.02]);
  hm.add(new THREE.BoxGeometry(0.3, 0.16, 0.12), 0xffffff, [0, -0.1, -0.08]);
  g.hair = hm.geometry(); g.hair.deleteAttribute("color");
  g.uaL = new THREE.BoxGeometry(0.1, 0.27, 0.1); g.uaL.translate(0, -0.13, 0); g.uaR = g.uaL.clone();
  g.laL = new THREE.BoxGeometry(0.085, 0.26, 0.085); g.laL.translate(0, -0.12, 0); g.laR = g.laL.clone();
  g.thL = new THREE.BoxGeometry(0.13, 0.34, 0.13); g.thL.translate(0, -0.16, 0); g.thR = g.thL.clone();
  g.shL = new THREE.BoxGeometry(0.1, 0.34, 0.11); g.shL.translate(0, -0.16, 0.01); g.shR = g.shL.clone();
  g.shadow = new THREE.CircleGeometry(0.3, 10); g.shadow.rotateX(-Math.PI / 2);
  return g;
}
function buildPeople() {
  const geos = partGeos();
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3a1a00, transparent: true, opacity: 0.28, depthWrite: false });
  const skinMat = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, shininess: 22, specular: 0x3a2a1a });
  PARTS.forEach((name) => {
    const m = new THREE.InstancedMesh(geos[name], name === "shadow" ? shadowMat : (["torso", "head", "uaL", "uaR", "laL", "laR", "thL", "thR", "shL", "shR"].includes(name) ? skinMat : mat(0xffffff, { shininess: 14 })), instMax);
    m.frustumCulled = false; m.castShadow = name !== "shadow" && ["torso", "kilt", "head", "cloth"].includes(name);
    inst[name] = m; scene.add(m);
  });
  dummy.position.set(0, -50, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix();
  const black = new THREE.Color(0);
  PARTS.forEach((name) => {
    for (let i = 0; i < instMax; i++) { inst[name].setMatrixAt(i, dummy.matrix); inst[name].setColorAt(i, black); }
    inst[name].instanceMatrix.needsUpdate = true; inst[name].instanceColor.needsUpdate = true;
  });
}
function allocInstance(u) {
  if (u.inst >= 0) return u.inst;
  if (!instFree.length) return -1;
  u.inst = instFree.pop(); tintUser(u); return u.inst;
}
const LINEN = 0xfaf3e2, LINEN2 = 0xeee2c8;
function tintUser(u) {
  if (u.inst < 0) return;
  const C = CONFIG.teams[u.team].colors, i = u.inst;
  const set = (n, c) => { _c.set(c); inst[n].setColorAt(i, _c); inst[n].instanceColor.needsUpdate = true; };
  ["torso", "head", "uaL", "uaR", "laL", "laR", "thL", "thR", "shL", "shR"].forEach(n => set(n, u.skin));
  set("collar", u.overseer ? 0xffd04a : C.primary);
  set("kilt", u.clothAlt ? LINEN2 : LINEN);
  set("belt", u.overseer ? 0xffd04a : C.secondary);
  set("cloth", u.variant === 1 ? LINEN : C.cloth);
  set("cap", u.variant === 3 ? C.cloth : LINEN);
  set("hair", u.hair);
  set("shadow", 0);
  u._tintOverseer = u.overseer;
}
function hidePart(name, i) {
  dummy.position.set(0, -50, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.updateMatrix();
  inst[name].setMatrixAt(i, dummy.matrix);
}
function spawnUser(u) {
  const A = TRACK_A[u.team], side = u.team === "sun" ? -1 : 1;
  u.x = A.x + side * (1 + Math.random() * 3); u.z = A.z + 3 + Math.random() * 3; u.y = 0; u.spawned = true;
  u.facing = Math.PI;
  dustPuff(u.x, 0.2, u.z, 6, 0xe8c890);
}

/* crew formation */
const teamOrder = { sun: [], nile: [] };
let lastOrder = 0;
function sortTeams() {
  for (const id of TEAM_IDS) teamOrder[id] = [];
  for (const u of state.users.values()) if (u.inst >= 0 && !u.pharaoh) teamOrder[u.team].push(u);
  for (const id of TEAM_IDS) {
    teamOrder[id].sort((a, b) => (b.diamonds - a.diamonds) || (a.joinSeq - b.joinSeq));
    teamOrder[id].forEach((u, k) => { u.slot = k; });
  }
}
const COLS = [-1.2, -0.58, 0.58, 1.2];
const spectatorSpots = { sun: [], nile: [] };
(function makeSpectatorSpots() {
  for (const id of TEAM_IDS) {
    const A = TRACK_A[id], E = new THREE.Vector3(SIDE[id] * 4.5, 0, -12), side = SIDE[id];
    const dir = E.clone().sub(A).normalize();
    let out = new THREE.Vector3(-dir.z, 0, dir.x); if (Math.sign(out.x) !== side) out.negate();
    const list = [];
    for (let row = 0; row < 6; row++) for (let k = 0; k < 24; k++) for (const s of [1, -1]) {
      if (s === -1) continue; // keep the middle free for the drum stage
      const p = A.clone().addScaledVector(dir, 1.5 + k * 0.95 + (row % 2) * 0.45).addScaledVector(out, s * (2.7 + row * 0.75));
      list.push({ x: p.x, z: p.z, face: Math.atan2(-out.x * s, -out.z * s), pri: row * 100 + k + (s < 0 ? 50 : 0) });
    }
    list.sort((a, b) => a.pri - b.pri);
    spectatorSpots[id] = list;
  }
})();
const _p = new THREE.Vector3(), _d = new THREE.Vector3();
function workerTarget(u, out) {
  const id = u.team, T = state.teams[id], path = paths[id];
  const cap = CONFIG.ropeRows * 4;
  if (u.slot < cap) {
    const n = Math.min(teamOrder[id].length, cap), nRows = Math.ceil(n / 4);
    const row = Math.floor(u.slot / 4), col = u.slot % 4;
    const sledD = T.sledS * path.ground;
    let d = sledD + 2.3 + (nRows - 1 - row) * 0.92;
    pathAt(path, d, _p, _d);
    const over = d - path.total; // bunch up on the top platform
    const onRamp = d > path.ground ? Math.min(1, path.w / 3.4) : 1;
    const lat = COLS[col] * onRamp + (over > 0 ? (col < 2 ? -1 : 1) * Math.min(2.5, over * 0.5) : 0);
    // perpendicular offset in XZ
    const nx = -_d.z, nz = _d.x, nl = Math.hypot(nx, nz) || 1;
    out.set(_p.x + (nx / nl) * lat, _p.y, _p.z + (nz / nl) * lat - (over > 0 ? (row % 3) * 0.3 : 0));
    u.onRope = true; u.pathDir = Math.atan2(_d.x, _d.z);
    return out;
  }
  const spots = spectatorSpots[id], s = spots[(u.slot - cap) % spots.length];
  u.onRope = false; u.pathDir = s.face;
  out.set(s.x, terrainH(s.x, s.z) * 0, s.z);
  return out;
}

// v1.6 action-layer integration: workers on the same rope row share a
// lightweight pull beat after a team heave. These are pose offsets on existing
// instanced worker rigs, not new avatars or additional draw calls.
function ropePullBeat(time, slot, lurch) {
  if (!Number.isFinite(time) || !Number.isFinite(lurch)) return 0;
  const energy = Math.max(0, Math.min(1, lurch));
  const wave = Math.max(0, Math.sin(time * 9 - Math.floor(slot / 4) * 0.55));
  return energy * (0.35 + wave * 0.65);
}
function poseWorker(u, t, moving, speed) {
  bindPose();
  rig.root.position.set(u.x, u.y, u.z);
  rig.root.rotation.y = u.facing;
  const sc = u.scale; rig.root.scale.set(sc, sc, sc);
  const now = performance.now();
  const ph = u.phase * 6.283;
  if (moving) {
    const f = Math.min(1.6, speed / 2.4), w = Math.sin(t * (7 + f * 4) + ph);
    rig.thL.rotation.x = w * 0.75 * f; rig.thR.rotation.x = -w * 0.75 * f;
    rig.shL.rotation.x = Math.max(0, -w) * 0.9 * f; rig.shR.rotation.x = Math.max(0, w) * 0.9 * f;
    rig.uaL.rotation.x = -w * 0.7 * f; rig.uaR.rotation.x = w * 0.7 * f;
    rig.laL.rotation.x = -0.4; rig.laR.rotation.x = -0.4;
    rig.hips.position.y = 0.66 + Math.abs(Math.cos(t * (7 + f * 4) + ph)) * 0.05;
    rig.torso.rotation.x = 0.12 * f;
  } else if (u.onRope) {
    // hauling: lean into the rope over the shoulder, legs dug in
    const heave = Math.max(0, (u.heaveT - now) / 520);
    const solo = Math.sin(heave * Math.PI);
    const group = ropePullBeat(t, u.slot, state.teams[u.team].lurch);
    const hk = Math.max(solo, group * 0.72);
    // v1.8: each rope row visibly braces as one during a real heave;
    // existing instanced rigs only, no additional meshes/draw calls.
    rig.root.position.x -= Math.sin(u.facing) * hk * 0.11;
    rig.root.position.z -= Math.cos(u.facing) * hk * 0.11;
    const strain = 0.5 + 0.5 * Math.sin(t * 3.1 + ph);
    const lean = 0.42 + hk * 0.3 + strain * 0.05;
    rig.hips.rotation.x = lean * 0.45; rig.torso.rotation.x = lean * 0.55;
    rig.hips.position.y = 0.6 - hk * 0.05;
    rig.thL.rotation.x = -0.75 - hk * 0.25; rig.shL.rotation.x = 0.85 + hk * 0.2;   // front leg bent
    rig.thR.rotation.x = 0.25 + hk * 0.15; rig.shR.rotation.x = 0.15;                // back leg pushing
    if ((u.slot % 4) < 2) { rig.uaL.rotation.x = -0.2; rig.laL.rotation.x = -0.6; rig.uaR.rotation.set(-2.5, 0, 0.35); rig.laR.rotation.x = -1.2; }
    else { rig.uaR.rotation.x = -0.2; rig.laR.rotation.x = -0.6; rig.uaL.rotation.set(-2.5, 0, -0.35); rig.laL.rotation.x = -1.2; }
    rig.head.rotation.x = -0.35 - hk * 0.1;
  } else {
    // spectator: cheer, wave, jump on events
    const ch = now < u.cheerT || now < u.heaveT, b = Math.sin(t * 9 + ph);
    if (ch) {
      rig.uaL.rotation.set(-2.7 + b * 0.25, 0, -0.25); rig.uaR.rotation.set(-2.7 - b * 0.25, 0, 0.25);
      rig.root.position.y = u.y + Math.max(0, b) * 0.18;
    } else {
      const s2 = Math.sin(t * 2 + ph);
      rig.uaL.rotation.z = -0.15; rig.uaR.rotation.set(s2 > 0.6 ? -2.6 + Math.sin(t * 8) * 0.3 : -0.1, 0, 0.2);
      rig.torso.rotation.y = Math.sin(t * 0.7 + ph) * 0.2;
    }
  }
  // A short celebratory hop/ripple on existing rigs. Reset from bindPose()
  // each frame; physics positions, deliveries and tally remain unchanged.
  if (!CONFIG.calmEffects && !(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) &&
      now < (u._v19CelebrateUntil || 0)) {
    const beat = Math.max(0, Math.sin(t * 11 + ph));
    rig.root.position.y += beat * 0.19;
    rig.uaL.rotation.x = -2.65 + beat * 0.2;
    rig.uaR.rotation.x = -2.65 - beat * 0.2;
    rig.torso.rotation.z = Math.sin(t * 6 + ph) * 0.055;
  }
  rig.root.updateMatrixWorld(true);
}
function updatePeople(t, dt) {
  const now = performance.now();
  if (now - lastOrder > 450) { sortTeams(); lastOrder = now; }
  for (const u of state.users.values()) {
    if (u.inst < 0) continue;
    const i = u.inst;
    if (u.overseer !== u._tintOverseer) tintUser(u);
    if (u.pharaoh) { PARTS.forEach(n => hidePart(n, i)); continue; }
    workerTarget(u, _v2);
    const dx = _v2.x - u.x, dz = _v2.z - u.z, dist = Math.hypot(dx, dz);
    let moving = false, speed = 0;
    if (dist > 0.12) {
      const resetting = state.teams[u.team].resetting > 0;
      speed = Math.min(dist * 3, resetting ? 9 : 4.2 + Math.min(4, dist * 0.6));
      const st = Math.min(dist, speed * dt);
      u.x += dx / dist * st; u.z += dz / dist * st;
      moving = dist > 0.35;
      const want = moving ? Math.atan2(dx, dz) : u.pathDir;
      u.facing += angDiff(want, u.facing) * Math.min(1, dt * 9);
    } else u.facing += angDiff(u.pathDir, u.facing) * Math.min(1, dt * 6);
    const gy = u.onRope ? _v2.y : 0;
    u.y += (gy - u.y) * Math.min(1, dt * 8);
    poseWorker(u, t, moving, speed);
    PARTS.forEach((name) => {
      if (name === "cloth" && !(u.variant === 0 || u.variant === 1)) { hidePart(name, i); return; }
      if (name === "cap" && !(u.variant === 3 || u.variant === 4)) { hidePart(name, i); return; }
      if (name === "hair" && u.variant !== 2) { hidePart(name, i); return; }
      inst[name].setMatrixAt(i, rig[name].matrixWorld);
    });
  }
  PARTS.forEach((name) => { inst[name].instanceMatrix.needsUpdate = true; });
}
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

/* ---------- ropes ---------- */
let ropeMesh;
const ROPE_SEGS = 44;
function buildRopes() {
  const g = new THREE.CylinderGeometry(0.075, 0.075, 1, 5); g.rotateX(Math.PI / 2);
  ropeMesh = new THREE.InstancedMesh(g, mat(0xe0b878, { shininess: 4 }), ROPE_SEGS * 4);
  ropeMesh.castShadow = true; ropeMesh.frustumCulled = false; scene.add(ropeMesh);
}
const _r0 = new THREE.Vector3(), _r1 = new THREE.Vector3(), _rd = new THREE.Vector3();
function updateRopes() {
  let k = 0;
  for (const id of TEAM_IDS) {
    const T = state.teams[id], path = paths[id], n = Math.min(teamOrder[id].length, CONFIG.ropeRows * 4);
    const sledD = T.sledS * path.ground;
    const startD = sledD + 1.3, endD = n > 0 ? sledD + 2.3 + (Math.ceil(n / 4) - 1) * 0.92 + 0.5 : sledD + 3.2;
    for (const side of [-0.88, 0.88]) {
      const segs = ROPE_SEGS;
      const step = (endD - startD) / segs;
      for (let s = 0; s < segs; s++) {
        const d0 = startD + s * step, d1 = d0 + step;
        pathAt(path, d0, _r0, _rd); const nx = -_rd.z, nz = _rd.x;
        _r0.x += nx * side; _r0.z += nz * side; _r0.y += ropeH(d0 - startD);
        pathAt(path, d1, _r1, _rd); _r1.x += -_rd.z * side; _r1.z += _rd.x * side; _r1.y += ropeH(d1 - startD);
        const len = _r0.distanceTo(_r1);
        dummy.position.copy(_r0).add(_r1).multiplyScalar(0.5); dummy.scale.set(1, 1, len + 0.02); dummy.rotation.set(0, 0, 0);
        dummy.lookAt(_r1.x, _r1.y, _r1.z); dummy.position.copy(_r0).add(_r1).multiplyScalar(0.5); dummy.updateMatrix();
        ropeMesh.setMatrixAt(k++, dummy.matrix);
      }
    }
  }
  ropeMesh.instanceMatrix.needsUpdate = true;
}
function ropeH(dd) { return 0.55 + Math.min(1, dd / 1.6) * 0.75; }

/* ---------- sledge + delivery animation ---------- */
const deliveries = {};
function startDelivery(id) { deliveries[id] = { t: 0 }; }
// blocks landed: the course under construction grows from the back of the layer toward the ramp;
// when it is complete the ramp, scaffold and crew path step up one layer
window.onBlocksPlaced = (id, newLayer) => {
  const o = pyr[id], T = state.teams[id], bpl = CONFIG.blocksPerLayer;
  if (newLayer) {
    setPyramidLayers(id, Math.min(T.layers, CONFIG.layers), false);
    for (let i = Math.max(0, T.layers - 3); i < T.layers; i++) { const m = o.layers[i]; if (m && m.scale.z < 1) { m.visible = true; o.anim.push({ m, t: 0, z0: m.scale.z }); } }
    refreshPaths();
  }
  o.partial = (T.blocks % bpl) / bpl;
  const li = T.layers, m = o.layers[li];
  if (m && li < CONFIG.layers && o.partial > 0) {
    if (!m.visible) { m.visible = true; m.scale.z = 0.001; o.pcur = 0; }
  }
  // dust where the stones landed
  const y = Math.min(T.layers, CONFIG.layers) * LH + 0.3, s = layerSide(Math.min(li, CONFIG.layers - 1)) / 2;
  const zEdge = PC.z - s + 2 * s * (newLayer ? 1 : o.partial);
  for (let i = 0; i < 14; i++) dustPuff(SIDE[id] * rnd(0.3, s), y, zEdge + rnd(-0.6, 0.6), 1, 0xf2dcae, 2);
  // Small placement confirmation for each delivered stone. Milestones retain
  // their larger existing celebration, while routine deliveries stay subtle.
  sparkle(SIDE[id] * Math.max(0.3, s * 0.45), y + 0.55, zEdge, 12, 0xffe09b, 2);
  sledges[id].block.scale.set(0.01, 0.01, 0.01); sledges[id].regrow = 0;
  delete deliveries[id];
};
window.onMilestone = (id, n) => {
  const y = n * LH, s = layerSide(n - 1) / 2;
  sparkle(SIDE[id] * s * 0.5, y + 1, PC.z + s, 90, 0xffe08a, 8);
  state.confetti = Math.max(state.confetti || 0, 1.6); state.confettiY = y + 6;
  for (const u of state.users.values()) if (u.team === id) u.cheerT = performance.now() + 2500;
};
function updateSledges(dt, t) {
  for (const id of TEAM_IDS) {
    const T = state.teams[id], S1 = sledges[id], path = paths[id];
    if (state.phase !== "build" && !deliveries[id]) T.sledS += (-0.05 - T.sledS) * Math.min(1, dt * 1.5); // crews fall back to the yard to face Apep
    const d = Math.max(0, T.sledS) * path.ground;
    pathAt(path, d, _p, S1.dir);
    S1.g.position.copy(_p);
    S1.g.rotation.y = Math.atan2(S1.dir.x, S1.dir.z);
    // lurch wobble on heaves
    S1.g.rotation.x = -T.lurch * 0.03;
    const blk = S1.block;
    if (deliveries[id]) {
      const D = deliveries[id]; D.t += dt;
      const k = Math.min(1, D.t / 1.25), e = k * k * (3 - 2 * k);
      const rampLen = path.lens[2] - path.lens[1];
      pathAt(path, path.ground + e * (rampLen + 0.6), _v, null);
      S1.g.worldToLocal(_v);
      blk.position.set(_v.x, _v.y + 1.22, _v.z);
      blk.rotation.x = -Math.atan2(paths[id].pts[2].y, rampLen) * (k < 1 ? 1 : 0);
      if (D.t > 1.3) { const f = Math.max(0.01, 1 - (D.t - 1.3) / 0.35); blk.scale.set(1, f, 1); }
      if (Math.random() < 0.5) { S1.g.localToWorld(_v.set(blk.position.x, 0.3, blk.position.z)); dustPuff(_v.x, _v.y, _v.z, 1, 0xe8cc98, 1.2); }
    } else {
      blk.position.set(0, 1.22, 0); blk.rotation.x = 0;
      if (S1.regrow != null) {
        S1.regrow += dt; const k = Math.min(1, S1.regrow / 0.5), s = k < 1 ? k * 1.15 : 1;
        blk.scale.set(s, s, s); if (k >= 1) S1.regrow = null;
      }
      if (T.lurch > 0.3 && Math.random() < 0.35) { _v.set((Math.random() - 0.5) * 1.8, 0.1, -1.6); S1.g.localToWorld(_v); dustPuff(_v.x, 0.15, _v.z, 1, 0xd8b480, 1); }
    }
  }
  // course growth: finished layers settle to full depth; the course under construction eases to its block count
  for (const id of TEAM_IDS) {
    const o = pyr[id];
    o.anim = o.anim.filter(a => {
      a.t += dt; const k = Math.min(1, a.t / 0.5), e = 1 - Math.pow(1 - k, 3);
      const z = a.z0 + (1 - a.z0) * e; a.m.scale.set(1, 1, z); a.m.position.z = -a.m.userData.side / 2 * (1 - z);
      return k < 1;
    });
    const li = state.teams[id].layers, m = o.layers[li];
    if (m && li < CONFIG.layers && state.phase === "build" && o.partial > 0) {
      o.pcur = (o.pcur || 0) + (o.partial - (o.pcur || 0)) * Math.min(1, dt * 4);
      m.visible = true; m.scale.set(1, 1, Math.max(0.001, o.pcur)); m.position.z = -m.userData.side / 2 * (1 - o.pcur);
    } else if (m && o.partial === 0 && li < CONFIG.layers) { o.pcur = 0; if (!o.anim.some(a => a.m === m)) m.visible = false; }
  }
}

/* ---------- Pharaoh on a carried litter ---------- */
function makeFigure(o) {
  const g = new THREE.Group(), M = new Merge();
  const skin = o.skin || 0xb87a4a;
  M.add(new THREE.CylinderGeometry(0.2, 0.14, 0.5, 6), J(skin, 0), [0, 0.91, 0], null, [1, 1, 0.68]);
  M.add(new THREE.CylinderGeometry(0.155, 0.25, 0.32, 7), J(o.kilt || LINEN, 0.02), [0, 0.54, 0], null, [1, 1, 0.8]);
  M.add(new THREE.CylinderGeometry(0.22, 0.2, 0.08, 8), J(o.collar || 0xffd04a, 0), [0, 1.13, 0], null, [1, 1, 0.78]);
  M.add(new THREE.IcosahedronGeometry(0.15, 1), J(skin, 0), [0, 1.3, 0]);
  for (const s of [-1, 1]) {
    M.add(new THREE.BoxGeometry(0.13, 0.62, 0.13), J(skin, 0), [s * 0.09, 0.32, 0]);
    if (!o.armsUp) M.add(new THREE.BoxGeometry(0.1, 0.5, 0.1), J(skin, 0), [s * 0.25, 0.85, 0.02], [0, 0, s * 0.12]);
  }
  if (o.nemes) {
    M.add(new THREE.SphereGeometry(0.17, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), J(0xffd04a, 0), [0, 1.31, 0]);
    for (let i = 0; i < 3; i++) M.add(new THREE.SphereGeometry(0.172 + i * 0.001, 8, 1, 0, Math.PI * 2, 0.25 + i * 0.32, 0.12), J(0x1f3a8a, 0), [0, 1.31, 0]);
    M.add(new THREE.BoxGeometry(0.09, 0.3, 0.09), J(0xffd04a, 0), [-0.16, 1.15, 0.05], [0, 0, 0.1]);
    M.add(new THREE.BoxGeometry(0.09, 0.3, 0.09), J(0xffd04a, 0), [0.16, 1.15, 0.05], [0, 0, -0.1]);
    M.add(new THREE.BoxGeometry(0.06, 0.18, 0.06), J(0x1f3a8a, 0), [0, 1.13, 0.15]); // beard
    M.add(new THREE.ConeGeometry(0.03, 0.12, 4), J(0xffd04a, 0), [0, 1.48, 0.15]); // uraeus
    // crook
    M.add(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 4), J(0x1f3a8a, 0), [0.32, 1.1, 0.12], [0.3, 0, 0]);
    M.add(new THREE.TorusGeometry(0.07, 0.025, 4, 8, Math.PI), J(0xffd04a, 0), [0.32, 1.46, 0.22], [0, Math.PI / 2, 0]);
  } else if (o.cloth != null) {
    M.add(new THREE.SphereGeometry(0.168, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), J(o.cloth, 0), [0, 1.31, 0]);
  }
  const m = M.mesh(); g.add(m);
  if (o.armsUp) {
    const arms = new Merge();
    for (const s of [-1, 1]) arms.add(new THREE.BoxGeometry(0.1, 0.5, 0.1), J(skin, 0), [s * 0.26, 1.35, 0], [0, 0, -s * 0.2]);
    g.add(arms.mesh());
  }
  return g;
}
const litters = {};
function buildDrummers() {
  for (const x of [-0.7, 0.7]) {
    const f = makeFigure({ skin: 0x9a5a30, collar: 0xffd04a, cloth: x < 0 ? CONFIG.teams.sun.colors.cloth : CONFIG.teams.nile.colors.cloth, armsUp: true });
    f.position.set(x, 0.55, -0.1); f.rotation.y = Math.PI; f.traverse(o => { if (o.isMesh) o.castShadow = true; }); world.add(f); drummers.push(f);
  }
}
function updateDrummers(t) {
  const bpm = state.phase === "boss" ? 132 : 104, b = (t * bpm / 60) % 1;
  drummers.forEach((f, i) => { const k = Math.pow(1 - ((b + i * 0.5) % 1), 4); f.children[1].position.y = -k * 0.35; f.children[1].rotation.x = k * 0.5; f.position.y = 0.55 + k * 0.04; });
}
function buildLitter(team) {
  const C = CONFIG.teams[team].colors, g = new THREE.Group();
  const M = new Merge();
  M.add(new THREE.BoxGeometry(1.9, 0.18, 2.3), J(0xd8a830, 0.03), [0, 1.35, 0]);
  for (const x of [-0.75, 0.75]) M.add(new THREE.CylinderGeometry(0.06, 0.06, 4.6, 5), J(0x6a4422), [x, 1.3, 0], [Math.PI / 2, 0, 0]);
  // ostrich-feather fans on tall gold poles behind the throne
  for (const x of [-0.85, 0.85]) {
    M.add(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5), J(0xffcf3a, 0), [x, 2.6, -0.95]);
    M.add(new THREE.CylinderGeometry(0.75, 0.1, 0.12, 9, 1, false, -1.2, 2.4), J(C.cloth, 0.04), [x, 3.9, -0.95], [Math.PI / 2, 0, 0]);
    M.add(new THREE.SphereGeometry(0.1, 6, 4), J(0xffd04a, 0), [x, 3.9, -0.95]);
  }
  M.add(new THREE.BoxGeometry(2.0, 0.22, 0.12), J(C.primary, 0), [0, 1.52, 1.18]);
  M.add(new THREE.BoxGeometry(0.9, 0.5, 0.8), J(0xffc63a, 0), [0, 1.7, -0.1]); // throne seat
  M.add(new THREE.BoxGeometry(0.9, 1.0, 0.14), J(0xffc63a, 0), [0, 2.2, -0.55]);
  M.add(new THREE.BoxGeometry(0.5, 0.5, 0.05), J(C.primary, 0), [0, 2.3, -0.47]);
  g.add(M.mesh());
  const ph = makeFigure({ nemes: true, skin: 0xb07040, collar: 0xffd04a, kilt: 0xfff6e0 }); ph.scale.setScalar(2.0); ph.position.set(0, 1.45, 0); g.add(ph);
  const bearers = [];
  for (const x of [-0.75, 0.75]) for (const z of [-1.9, 1.9]) {
    const b = makeFigure({ skin: SKINS[(bearers.length * 3) % SKINS.length], collar: C.primary, cloth: C.cloth, armsUp: true }); b.position.set(x, 0, z); g.add(b); bearers.push(b);
  }
  g.scale.setScalar(1.3); g.visible = false; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  world.add(g);
  litters[team] = { g, ph, bearers, user: null };
}
window.onPharaoh = (u) => { const L = litters[u.team]; if (L) { L.user = u; if (!L.g.visible) { L.g.visible = true; L.g.position.copy(sledges[u.team].g.position); } } };
function updateLitters(t, dt) {
  for (const id of TEAM_IDS) {
    const L = litters[id];
    const p = [...state.users.values()].find(u => u.team === id && u.pharaoh
      && (state.mode !== "live" || u.src === "live"));
    L.user = p || null; L.g.visible = !!p;
    if (!p) continue;
    const T = state.teams[id], path = paths[id];
    const d = Math.min(path.ground - 1, T.sledS * path.ground + 3.5);
    pathAt(path, d, _p, _d);
    const side = id === "sun" ? -1 : 1, nx = -_d.z, nz = _d.x;
    const gx = _p.x + side * 3.4, gz = _p.z;
    const moving = Math.hypot(gx - L.g.position.x, gz - L.g.position.z) > 0.2;
    L.g.position.x += (gx - L.g.position.x) * Math.min(1, dt * 2.5);
    L.g.position.z += (gz - L.g.position.z) * Math.min(1, dt * 2.5);
    L.g.position.y = Math.abs(Math.sin(t * 6)) * 0.05;
    L.g.rotation.y = Math.atan2(_d.x, _d.z);
    L.ph.rotation.y = Math.sin(t * 0.8) * 0.35;
    L.bearers.forEach((b, k) => { b.position.y = Math.max(0, Math.sin(t * (moving ? 9 : 3) + k * 1.6)) * 0.06; });
    p.x = L.g.position.x; p.z = L.g.position.z; p.y = 5.6; p.scale = 1.4;
  }
}

/* ---------- labels (pooled DOM) ---------- */
const labelEls = [];
(function makeLabels() {
  const box = $("labels");
  for (let i = 0; i < CONFIG.maxLabels; i++) {
    const d = document.createElement("div"); d.className = "lab"; d.style.display = "none";
    d.innerHTML = '<span class="nm"></span><span class="bubble"></span>'; box.appendChild(d);
    labelEls.push({ el: d, nm: d.firstChild, bub: d.lastChild, uid: null, cls: "" });
  }
})();
function updateLabels() {
  const now = performance.now();
  const ranked = [], spots = [];
  for (const u of state.users.values()) if (u.inst >= 0 && now < u.spotUntil) spots.push(u);
  spots.sort((a, b) => b.spotUntil - a.spotUntil);
  const spotSet = new Set(spots.slice(0, 3)); // at most 3 spotlights at once, newest first
  for (const u of state.users.values()) {
    if (u.inst < 0) continue;
    u._spot = spotSet.has(u);
    u._ls = (u._spot ? 2e6 : 0) + (u.pharaoh ? 1e6 : 0) + Math.min(5000, u.diamonds * 4) + (now < u.bubbleUntil ? 900 : 0) + Math.max(0, 4000 - (now - u.lastActive)) / 10 + (u.onRope && u.slot < 4 ? 120 : 0) + (u.joinSeq % 7) * 3;
    ranked.push(u);
  }
  ranked.sort((a, b) => b._ls - a._ls);
  const placed = [];
  let li = 0;
  for (let r = 0; r < ranked.length && li < CONFIG.maxLabels; r++) {
    const u = ranked[r];
    _v.set(u.x, u.y + (u.pharaoh ? 2.2 : 1.78 * u.scale + (u.onRope ? (u.slot % 3) * 0.32 : (u.slot % 2) * 0.25)), u.z); _v.project(camera);
    if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
    const x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
    const txt = u._spot ? u.spotText : (u.pharaoh ? "👑 " : "") + u.name;
    const w = u._spot ? Math.min(220, txt.length * 8 + 20) : Math.min(104, u.name.length * 5.4 + 12) + (u.pharaoh ? 26 : 0);
    let clash = false;
    if (!u.pharaoh && !u._spot) for (const q of placed) { if (Math.abs(q.x - x) < (q.w + w) * 0.5 && Math.abs(q.y - y) < 13) { clash = true; break; } }
    if (clash) continue;
    placed.push({ x, y, w });
    const L = labelEls[li++];
    L.el.style.display = "block";
    L.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-100%)";
    const cls = "lab " + u.team + (u._spot ? " spot" : "") + (u.pharaoh ? " cap" : (u.overseer ? " vip" : ""));
    if (L.cls !== cls) { L.el.className = cls; L.cls = cls; }
    if (L.uid !== u.id || L.txt !== txt) { L.nm.textContent = txt; L.uid = u.id; L.txt = txt; }
    if (now < u.bubbleUntil && u.bubble) { if (L.bub.textContent !== u.bubble) L.bub.textContent = u.bubble; L.bub.classList.add("on"); }
    else L.bub.classList.remove("on");
  }
  for (; li < CONFIG.maxLabels; li++) { const L = labelEls[li]; if (L.uid !== null) { L.el.style.display = "none"; L.uid = null; } }
}

/* ---------- 3D particles: dust puffs + golden motes ---------- */
const PMAX = 900;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pSize = new Float32Array(PMAX), pAlpha = new Float32Array(PMAX);
const pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX), pMax = new Float32Array(PMAX);
pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute("aCol", new THREE.BufferAttribute(pCol, 3));
pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
pGeo.setAttribute("aAlpha", new THREE.BufferAttribute(pAlpha, 1));
const puffTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.5, "rgba(255,255,255,.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { map: { value: puffTex }, scale: { value: H * 0.5 } },
  vertexShader: "attribute vec3 aCol; attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA;" +
    "uniform float scale; void main(){ vC=aCol; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize = aSize*scale/(-mv.z); gl_Position=projectionMatrix*mv; }",
  fragmentShader: "uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(map, gl_PointCoord); gl_FragColor=vec4(vC, t.a*vA); }"
});
const points = new THREE.Points(pGeo, pMat); points.frustumCulled = false; scene.add(points);
let pNext = 0;
function dustPuff(x, y, z, n, color, size) {
  _c.set(color || 0xe8c890);
  for (let k = 0; k < n; k++) {
    const i = pNext; pNext = (pNext + 1) % PMAX;
    pPos[i * 3] = x + (Math.random() - 0.5) * 0.6; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
    pVel[i * 3] = (Math.random() - 0.5) * 1.6; pVel[i * 3 + 1] = 0.4 + Math.random() * 1.0; pVel[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    pCol[i * 3] = _c.r; pCol[i * 3 + 1] = _c.g; pCol[i * 3 + 2] = _c.b;
    pSize[i] = (size || 1.4) * (0.7 + Math.random() * 0.6); pLife[i] = 0; pMax[i] = 0.9 + Math.random() * 0.8;
  }
}
function sparkle(x, y, z, n, color, spd) {
  _c.set(color || 0xffe08a);
  for (let k = 0; k < n; k++) {
    const i = pNext; pNext = (pNext + 1) % PMAX;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    const a = Math.random() * 6.283, e = Math.random() * 1.2, s = (spd || 4) * (0.5 + Math.random());
    pVel[i * 3] = Math.cos(a) * Math.cos(e) * s; pVel[i * 3 + 1] = Math.sin(e) * s + 1; pVel[i * 3 + 2] = Math.sin(a) * Math.cos(e) * s;
    pCol[i * 3] = _c.r; pCol[i * 3 + 1] = _c.g; pCol[i * 3 + 2] = _c.b;
    pSize[i] = 0.45 + Math.random() * 0.35; pLife[i] = 0; pMax[i] = 0.8 + Math.random() * 0.6;
  }
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    if (pMax[i] <= 0) { pAlpha[i] = 0; continue; }
    pLife[i] += dt; const k = pLife[i] / pMax[i];
    if (k >= 1) { pMax[i] = 0; pAlpha[i] = 0; continue; }
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    pVel[i * 3] *= 0.96; pVel[i * 3 + 2] *= 0.96; pVel[i * 3 + 1] = pVel[i * 3 + 1] * 0.96 - (pSize[i] < 0.9 ? 4 : 0.2) * dt;
    pAlpha[i] = (pSize[i] < 0.9 ? 1 : 0.55) * Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k);
    pSize[i] += dt * (pSize[i] < 0.9 ? 0 : 1.2);
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.aAlpha.needsUpdate = true; pGeo.attributes.aSize.needsUpdate = true; pGeo.attributes.aCol.needsUpdate = true;
}
// ambient floating sand/gold motes (shader-animated, no CPU cost)
(function buildMotes() {
  const n = 260, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-26, 26); pos[i * 3 + 1] = rnd(0.5, 14); pos[i * 3 + 2] = rnd(-40, 22); seed[i] = Math.random() * 100; }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, map: { value: puffTex } },
    vertexShader: "attribute float seed; uniform float time; varying float vA; void main(){ vec3 p=position; p.x += sin(time*0.3+seed)*2.0 + time*0.6; p.x = mod(p.x+30.0, 60.0)-30.0; p.y += sin(time*0.7+seed*1.7)*0.6; vec4 mv=modelViewMatrix*vec4(p,1.0); vA = 0.35+0.35*sin(time*2.0+seed*3.0); gl_PointSize = 110.0/(-mv.z); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "uniform sampler2D map; varying float vA; void main(){ vec4 t=texture2D(map, gl_PointCoord); gl_FragColor=vec4(1.0,0.86,0.55, t.a*vA*0.6); }"
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); window.__motes = m;
})();

/* birds circling */
const birds = [];
(function buildBirds() {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.2, -0.9, 0.2, -0.1, 0, 0, -0.2, 0, 0, 0.2, 0, 0, -0.2, 0.9, 0.2, -0.1], 3));
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x3a2a20, side: THREE.DoubleSide, fog: true }));
    b.userData = { r: 10 + Math.random() * 14, s: 0.15 + Math.random() * 0.1, h: 16 + Math.random() * 8, ph: Math.random() * 6.28, cx: rnd(-12, 12), cz: rnd(-40, -20) };
    scene.add(b); birds.push(b);
  }
})();
function updateBirds(t) {
  for (const b of birds) {
    const u = b.userData, a = t * u.s + u.ph;
    b.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(t * 0.7 + u.ph) * 0.8, u.cz + Math.sin(a) * u.r);
    b.rotation.set(0, -a, 0); b.scale.set(1, 1 + Math.sin(t * 9 + u.ph) * 0.9, 1);
  }
}

/* ---------- 2D overlay FX (heave pops, gift sparks, beams) ---------- */
const fx2 = $("fx2"), fxctx = fx2.getContext("2d");
const fx2Items = [];
function toScreen(x, y, z) { _v.set(x, y, z).project(camera); return { x: (_v.x * 0.5 + 0.5) * W, y: (-_v.y * 0.5 + 0.5) * H }; }
function popText(x, y, z, text, color, size) { const s = toScreen(x, y, z); fx2Items.push({ k: "txt", x: s.x, y: s.y, text, color: color || "#fff", size: size || 18, t: 0, life: 1.1 }); }
function fxGiftSpark(u, s) {
  sparkle(u.x, u.y + 1.6, u.z, Math.round(14 * s), 0xff7aa0, 3.5);
  sparkle(u.x, u.y + 1.6, u.z, Math.round(8 * s), 0xffe08a, 3);
  const now = performance.now();
  if (s > 1 && now - (fxGiftSpark._t || 0) > 1500) { fxGiftSpark._t = now; popText(u.x, u.y + 2.4, u.z, "💪 +" + CONFIG.points.medium, "#ffe08a", 15); }
}
function fxSunBurst(team) {
  const S1 = sledges[team].g.position;
  const s = toScreen(S1.x, S1.y + 1.5, S1.z);
  fx2Items.push({ k: "rays", x: s.x, y: s.y, t: 0, life: 1.4 });
  sparkle(S1.x, S1.y + 1.5, S1.z, 60, 0xffe08a, 7);
}
let lastHeavePop = { sun: 0, nile: 0 };
function updateFX2(dt) {
  const now = performance.now();
  for (const id of TEAM_IDS) {
    const T = state.teams[id];
    if (now - lastHeavePop[id] > 2600 && now - T.lastHeave < 300 && state.phase === "build") {
      lastHeavePop[id] = now;
      const S1 = sledges[id].g.position, ch = S(  "chants");
      popText(S1.x + (Math.random() - 0.5), S1.y + 3.2, S1.z, ch[(Math.random() * ch.length) | 0], CONFIG.teams[id].colors.css2, 17);
    }
  }
  fxctx.clearRect(0, 0, W, H);
  for (let i = fx2Items.length - 1; i >= 0; i--) {
    const f = fx2Items[i]; f.t += dt; const k = f.t / f.life;
    if (k >= 1) { fx2Items.splice(i, 1); continue; }
    if (f.k === "txt") {
      const sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
      fxctx.save(); fxctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; fxctx.translate(f.x, f.y - k * 30); fxctx.scale(sc, sc);
      fxctx.font = "900 " + f.size + "px Georgia, serif"; fxctx.textAlign = "center"; fxctx.lineWidth = 4; fxctx.strokeStyle = "rgba(40,20,0,.85)";
      fxctx.strokeText(f.text, 0, 0); fxctx.fillStyle = f.color; fxctx.fillText(f.text, 0, 0); fxctx.restore();
    } else if (f.k === "rays") {
      fxctx.save(); fxctx.globalCompositeOperation = "lighter"; fxctx.translate(f.x, f.y); fxctx.rotate(k * 0.8);
      const a = (1 - k) * 0.7, R = 120 + k * 260;
      for (let r = 0; r < 14; r++) {
        fxctx.rotate(Math.PI * 2 / 14);
        const gr = fxctx.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, "rgba(255,240,170," + a + ")"); gr.addColorStop(1, "rgba(255,200,80,0)");
        fxctx.fillStyle = gr; fxctx.beginPath(); fxctx.moveTo(0, 0); fxctx.lineTo(R, -14); fxctx.lineTo(R, 14); fxctx.fill();
      }
      fxctx.restore();
    } else if (f.k === "beam") {
      fxctx.save(); fxctx.globalCompositeOperation = "lighter"; fxctx.globalAlpha = 1 - k;
      fxctx.strokeStyle = f.color; fxctx.lineWidth = f.w * (1 - k * 0.5); fxctx.lineCap = "round";
      fxctx.shadowColor = f.color; fxctx.shadowBlur = 18;
      fxctx.beginPath(); fxctx.moveTo(f.x0, f.y0); fxctx.lineTo(f.x1, f.y1); fxctx.stroke(); fxctx.restore();
    }
  }
}

/* ============================================================
   APEP, serpent of chaos (boss) + sandstorm + projectiles
   ============================================================ */
const APEP_N = 32;
const apep = { rise: 0, target: 0, hitT: 0, roarT: 0, headPos: new THREE.Vector3(0, 20, -40) };
const apepMat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 40, specular: 0x8a6aaa });
function buildApep() {
  apep.body = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshPhongMaterial({ flatShading: true, shininess: 40, specular: 0x8a6aaa }), APEP_N);
  apep.body.castShadow = true; apep.body.frustumCulled = false;
  for (let i = 0; i < APEP_N; i++) { _c.set(i % 4 === 0 ? 0xe0a820 : (i % 2 ? 0x45206a : 0x2e1248)); apep.body.setColorAt(i, _c); }
  scene.add(apep.body);
  const head = new THREE.Group(), M = new Merge();
  M.add(new THREE.BoxGeometry(2.6, 1.4, 3.2), J(0x45206a, 0.04), [0, 0.1, 0.4]);
  M.add(new THREE.ConeGeometry(1.25, 2.4, 4), J(0x3a1858, 0.04), [0, 0.0, 2.9], [Math.PI / 2, Math.PI / 4, 0], [1, 1, 0.55]);
  M.add(new THREE.BoxGeometry(0.35, 0.12, 3.6), J(0xffc63a, 0), [0, 0.86, 0.8]);
  for (const sx of [-1, 1]) {
    M.add(new THREE.ConeGeometry(0.28, 1.6, 4), J(0xffc63a, 0), [sx * 0.9, 1.3, -0.4], [-0.6, 0, sx * 0.35]);
    M.add(new THREE.BoxGeometry(0.2, 0.5, 0.25), J(0xffc63a, 0), [sx * 1.3, 0.2, 1.6]);
  }
  // cobra hood behind the head
  M.add(new THREE.CylinderGeometry(3.2, 0.8, 0.3, 10, 1, false, -1.35, 2.7), J(0x5a2a80, 0.05), [0, 0.6, -1.0], [Math.PI / 2 - 0.25, 0, 0]);
  for (let k = 0; k < 3; k++) M.add(new THREE.BoxGeometry(0.4, 0.06, 1.2 + k * 0.5), J(0xffc63a, 0), [0, 0.65 + k * 0.03, -1.0 - k * 0.05], [Math.PI / 2 - 0.25, 0, (k - 1) * 0.7]);
  const skull = new THREE.Mesh(M.geometry(), apepMat); skull.castShadow = true; head.add(skull);
  const jawG = new THREE.Group(), JM = new Merge();
  JM.add(new THREE.BoxGeometry(2.1, 0.45, 3.0), J(0x2e1248, 0.04), [0, 0, 1.5]);
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) JM.add(new THREE.ConeGeometry(0.12, 0.5, 4), J(0xfff6e0, 0), [sx * 0.8, 0.4, 0.5 + k * 0.55]);
  jawG.add(new THREE.Mesh(JM.geometry(), apepMat)); jawG.position.set(0, -0.6, -0.4); head.add(jawG);
  // upper fangs
  const FM = new Merge(); for (const sx of [-1, 1]) FM.add(new THREE.ConeGeometry(0.16, 0.9, 4), J(0xfff6e0, 0), [sx * 0.75, -0.75, 3.1], [Math.PI, 0, 0]);
  head.add(new THREE.Mesh(FM.geometry(), apepMat));
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4020 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), eyeMat); e.position.set(sx * 0.95, 0.55, 1.9); head.add(e);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xff5a20, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    gl.scale.set(2.2, 2.2, 1); gl.position.copy(e.position); head.add(gl);
  }
  apep.head = head; apep.jaw = jawG; head.scale.setScalar(3.1); head.visible = false; scene.add(head);
  // sandstorm vortex
  const n = IS_MOBILE ? 380 : 650, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), sd = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = Math.random() * 6.283; pos[i * 3 + 1] = Math.random() * 34 - 2; pos[i * 3 + 2] = 6 + Math.random() * 30; sd[i * 3] = Math.random(); sd[i * 3 + 1] = 0.6 + Math.random(); sd[i * 3 + 2] = Math.random(); }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("sd", new THREE.BufferAttribute(sd, 3));
  apep.stormMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { time: { value: 0 }, strength: { value: 0 }, map: { value: puffTex } },
    vertexShader: "attribute vec3 sd; uniform float time; uniform float strength; varying float vA; varying float vS; void main(){ float a = position.x + time*(5.0/position.z)*sd.y; float r = position.z*(0.8+0.2*sin(time*0.5+sd.x*6.0)); vec3 p = vec3(cos(a)*r, mod(position.y + time*sd.y*1.5, 34.0) - 2.0, -40.0 + sin(a)*r*0.7); vec4 mv = modelViewMatrix*vec4(p,1.0); vA = strength*(0.38+0.4*sd.z); vS = sd.z; gl_PointSize = (500.0+900.0*sd.z)/(-mv.z); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform sampler2D map; varying float vA; varying float vS; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(mix(vec3(0.72,0.50,0.30), vec3(0.85,0.66,0.44), vS), t.a*vA); }"
  });
  apep.storm = new THREE.Points(g, apep.stormMat); apep.storm.frustumCulled = false; scene.add(apep.storm);
  hideApepBody();
}
function hideApepBody() { dummy.position.set(0, -60, 0); dummy.scale.set(0.001, 0.001, 0.001); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); for (let i = 0; i < APEP_N; i++) apep.body.setMatrixAt(i, dummy.matrix); apep.body.instanceMatrix.needsUpdate = true; }
function apepSpine(s, t, out) {
  const r = apep.rise;
  out.set(Math.sin(s * 5.2 + t * 0.9) * 19 * (1 - s * 0.88), (-8 + 50 * Math.pow(s, 0.8)) * r - (1 - r) * 16 + Math.sin(s * 9 - t * 2.2) * 1.2 * s, -60 + s * 12 + Math.cos(s * 4 + t * 0.7) * 3.5 * (1 - s));
  return out;
}
const stormState = { k: 0 };
function updateApep(dt, t) {
  const gust = state.phase === "build" && state.time < state.gustUntil;
  const want = state.phase === "boss" ? 1 : (gust ? 0.55 : 0);
  if (gust && Math.random() < dt * 14) { const gx = rnd(-24, 24), gz = rnd(-20, 14); dustPuff(gx, 0.4, gz, 2, 0xd0a070, 3.2); }
  if (state.phase === "boss" || state.phase === "victory") apep.rise += ((state.phase === "boss" ? 1 : 0) - apep.rise) * Math.min(1, dt * (state.phase === "boss" ? 0.8 : 0.6));
  else apep.rise = Math.max(0, apep.rise - dt);
  stormState.k += (want - stormState.k) * Math.min(1, dt * 0.8);
  const k = stormState.k;
  apep.stormMat.uniforms.time.value = t; apep.stormMat.uniforms.strength.value = k;
  if (window.__skyMat) window.__skyMat.uniforms.storm.value = k;
  scene.fog.color.setHex(FOG_COL).lerp(_c.setHex(0xb88a62), k); scene.fog.near = 150 - 90 * k; scene.fog.far = 460 - 230 * k;
  hemi.intensity = 0.46 - 0.1 * k; sunLight.intensity = 1.22 - 0.35 * k;
  if (apep.rise < 0.01) { if (apep.head.visible) { apep.head.visible = false; hideApepBody(); } return; }
  apep.head.visible = true;
  const now = performance.now(), hit = Math.max(0, (apep.hitT - now) / 300);
  for (let i = 0; i < APEP_N; i++) {
    const s = i / (APEP_N - 1);
    apepSpine(s, t, _v);
    const rad = (1.55 + 2.75 * Math.min(1, s * 1.6)) * (1 + Math.sin(t * 3 - s * 10) * 0.05);
    dummy.position.copy(_v); dummy.rotation.set(s * 3, s * 5, 0); dummy.scale.set(rad, rad * 1.1, rad); dummy.updateMatrix();
    apep.body.setMatrixAt(i, dummy.matrix);
  }
  apep.body.instanceMatrix.needsUpdate = true;
  apepSpine(1, t, _v); apepSpine(0.97, t, _v2);
  apep.headPos.copy(_v).add(_v2.sub(_v).multiplyScalar(-1.6)); apep.headPos.y += 2.0;
  apep.head.position.copy(apep.headPos); apep.head.position.z -= hit * 2.5; apep.head.position.y += hit * 1.2;
  apep.head.lookAt(camera.position.x, camera.position.y - 6, camera.position.z);
  apep.head.rotateX(-hit * 0.5 + Math.sin(t * 1.3) * 0.08);
  const roar = now < apep.roarT ? 1 : 0;
  apep.jaw.rotation.x = 0.25 + Math.max(0, Math.sin(t * 2.2)) * 0.25 + roar * 0.5 + hit * 0.4;
  apepMat.emissive.setRGB(hit * 0.9, hit * 0.5, hit * 0.2);
  if (state.phase === "boss" && Math.random() < dt * 2) dustPuff(rnd(-12, 12), 0.3, -50 + rnd(-6, 6), 2, 0xc89a6a, 3);
}
// projectile pools
const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); beamGeo.rotateX(Math.PI / 2); beamGeo.translate(0, 0, 0.5);
const beams = [], stones = [];
function getBeam() {
  let b = beams.find(x => !x.visible);
  if (!b) { if (beams.length > 40) return null; b = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffd860, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); b.frustumCulled = false; scene.add(b); beams.push(b); }
  return b;
}
const stoneGeo = new THREE.DodecahedronGeometry(0.28, 0);
function getStone() {
  let s = stones.find(x => !x.visible);
  if (!s) { if (stones.length > 60) return null; s = new THREE.Mesh(stoneGeo, mat(0xd8c098)); s.castShadow = false; scene.add(s); stones.push(s); }
  return s;
}
let lastDmgPop = 0;
function fireBeam(from, to, width, color, life) {
  const b = getBeam(); if (!b) return;
  b.visible = true; b.position.copy(from); b.lookAt(to); b.userData = { t: 0, life, w: width, len: from.distanceTo(to) };
  b.material.color.setHex(color); b.scale.set(width, width, b.userData.len);
}
window.fireAtBoss = (u, kind, dmg) => {
  u.cheerT = performance.now() + 700;
  // viewers without an avatar fire from their crew's side of the field
  const from = u.inst >= 0 ? _p.set(u.x, u.y + 1.5, u.z).clone() : new THREE.Vector3((u.team === "sun" ? -1 : 1) * rnd(6, 14), 2.5, rnd(4, 14));
  const to = apep.headPos.clone().add(new THREE.Vector3(rnd(-1.5, 1.5), rnd(-1, 1.5), 0));
  if (kind === "stone") {
    const s = getStone(); if (!s) return;
    s.visible = true; s.position.copy(from); s.userData = { t: 0, from, to, life: 0.8 };
    return;
  }
  if (kind === "ra") {
    const top = to.clone().add(new THREE.Vector3(-25, 70, -30));
    fireBeam(top, to, 4.2, 0xfff2b0, 1.6); fireBeam(top, to, 1.6, 0xffffff, 1.6);
    sparkle(to.x, to.y, to.z, 180, 0xffe08a, 12); sparkle(to.x, to.y, to.z, 60, 0xffffff, 8);
    apep.hitT = performance.now() + 900; apep.roarT = performance.now() + 1500; sfx("roar");
    const sc = toScreen(to.x, to.y, to.z); fx2Items.push({ k: "rays", x: sc.x, y: sc.y, t: 0, life: 1.6 });
    return;
  }
  fireBeam(from, to, kind === "bigbeam" ? 0.35 : 0.16, kind === "bigbeam" ? 0xffb030 : 0xffe070, 0.4);
  sparkle(to.x, to.y, to.z, kind === "bigbeam" ? 26 : 8, 0xffd060, 6);
  apep.hitT = performance.now() + 260;
  const now = performance.now();
  if (dmg >= 300 && now - lastDmgPop > 450) { lastDmgPop = now; popText(to.x, to.y + 2, to.z, "-" + Math.round(dmg).toLocaleString(), "#ffb0a0", 20); }
};
function updateProjectiles(dt) {
  for (const b of beams) {
    if (!b.visible) continue;
    const d = b.userData; d.t += dt; const k = d.t / d.life;
    if (k >= 1) { b.visible = false; continue; }
    const w = d.w * (k < 0.15 ? k / 0.15 : 1) * (1 - k * 0.6);
    b.scale.set(w, w, d.len); b.material.opacity = 1 - k * k;
  }
  for (const s of stones) {
    if (!s.visible) continue;
    const d = s.userData; d.t += dt; const k = d.t / d.life;
    if (k >= 1) { s.visible = false; sparkle(d.to.x, d.to.y, d.to.z, 4, 0xe8c890, 3); apep.hitT = Math.max(apep.hitT, performance.now() + 120); continue; }
    s.position.copy(d.from).lerp(d.to, k); s.position.y += Math.sin(k * Math.PI) * 9; s.rotation.x += dt * 9; s.rotation.y += dt * 7;
  }
}
window.onBossStart = () => { apep.rise = 0; apep.roarT = performance.now() + 2500; for (let i = 0; i < 30; i++) dustPuff(rnd(-16, 16), 0.5, -50 + rnd(-6, 6), 3, 0xc89a6a, 3.5); };

/* ---------- victory: Apep sinks, golden capstone, glowing casing, confetti ---------- */
let pillar;
(function buildPillar() {
  const g = new THREE.CylinderGeometry(0.6, 2.6, 60, 12, 1, true); g.translate(0, 30, 0);
  pillar = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  pillar.visible = false; scene.add(pillar);
})();
window.onVictory = (team) => {
  for (const id of TEAM_IDS) { state.teams[id].layers = CONFIG.layers; state.teams[id].blocks = CONFIG.layers * CONFIG.blocksPerLayer; pyr[id].anim = []; setPyramidLayers(id, CONFIG.layers, true); }
  refreshPaths();
  great.cap.visible = true; great.cap.position.y = CONFIG.layers * LH + 20; great.capDrop = 0; great.landed = false;
  great.casing.visible = true; great.casing.material.opacity = 0; great.casing.material.color.setHex(0xffe4a0);
  apep.roarT = performance.now() + 2000; sfx("roar");
  for (let i = 0; i < 40; i++) dustPuff(rnd(-16, 16), 1, -50 + rnd(-8, 8), 3, 0xc89a6a, 4);
  popText(0, 32, -46, S("apepDown"), "#ffe08a", 26);
  for (const u of state.users.values()) u.cheerT = performance.now() + 9000;
  state.confetti = 4.5;
};
window.onNewRound = () => {
  great.cap.visible = false; great.casing.visible = false; great.capDrop = null; pillar.visible = false;
  for (const id of TEAM_IDS) { pyr[id].anim = []; pyr[id].pcur = 0; setPyramidLayers(id, CONFIG.prebuiltLayers, true); }
  refreshPaths();
};
function updateVictory(dt, t) {
  if (state.confetti > 0) {
    state.confetti -= dt;
    const cols = [0xffd04a, CONFIG.teams[state.winner || "sun"].colors.primary, 0xffffff, 0xff6a8a];
    for (let i = 0; i < 6; i++) {
      const x = rnd(-20, 20), z = rnd(-38, 8);
      _c.set(cols[(Math.random() * cols.length) | 0]);
      const j = pNext; pNext = (pNext + 1) % PMAX;
      pPos[j * 3] = x; pPos[j * 3 + 1] = (state.phase === "victory" ? 24 : (state.confettiY || 14)) + rnd(0, 6); pPos[j * 3 + 2] = z;
      pVel[j * 3] = rnd(-1, 1); pVel[j * 3 + 1] = rnd(-2, 0); pVel[j * 3 + 2] = rnd(-1, 1);
      pCol[j * 3] = _c.r; pCol[j * 3 + 1] = _c.g; pCol[j * 3 + 2] = _c.b; pSize[j] = 0.55; pLife[j] = 0; pMax[j] = 2.2;
    }
  }
  if (great.capDrop == null) return;
  great.capDrop += dt;
  const top = CONFIG.layers * LH + 0.7;
  great.cap.position.y = Math.max(top, top + 20 - Math.max(0, great.capDrop - 1.2) ** 2 * 10);
  great.cap.rotation.y += dt * 1.5;
  if (great.cap.position.y <= top && !great.landed) {
    great.landed = true; sparkle(0, top + 1, PC.z, 160, 0xffe08a, 10); sfx("thud"); shake(0.6); flash(0.5, "#fff2b0");
    pillar.visible = true; pillar.position.set(0, top + 0.6, PC.z);
  }
  if (great.landed) {
    great.casing.material.opacity = Math.min(0.88, great.casing.material.opacity + dt * 0.5);
    great.casing.material.emissive.setRGB(0.5 + Math.sin(t * 3) * 0.12, 0.34 + Math.sin(t * 3) * 0.08, 0.04);
    pillar.material.opacity = 0.35 + Math.sin(t * 4) * 0.1;
  }
}

/* ---------- bot crowd ---------- */
const BOT_FIRST = ["ahmet", "zeynep", "burak", "elif", "ali", "merve", "kaan", "efe", "osman", "aysel", "yusuf", "fatma", "hakan", "irem", "can", "mehmet", "ayse", "deniz", "selin", "onur", "nefertiti", "ramses", "cleo", "omar", "layla", "karim", "nour", "tarik", "pablo_fan", "sara"];
const BOT_LAST = ["_07", "_34", "61", "1453", "_tr", "_eg", "_cairo", "99", "_x", "35", "01", "_gold"];
const botPool = [];
function botName() { return BOT_FIRST[(Math.random() * BOT_FIRST.length) | 0] + BOT_LAST[(Math.random() * BOT_LAST.length) | 0]; }
function botEvent() {
  if (state.paused) return;
  if (botPool.length < Math.min(150, CONFIG.maxWorkers - 20) || (botPool.length < CONFIG.maxWorkers - 10 && Math.random() < 0.12)) {
    const team = Math.random() < 0.5 ? "sun" : "nile", name = botName(), id = "bot:" + name + ((Math.random() * 999) | 0);
    botPool.push({ id, name, team });
    const kws = team === "sun" ? ["SUN", "sun!", "☀️", "GÜNEŞ"] : ["NILE", "nile", "🌊", "NİL"];
    handleLiveEvent({ source: "demo", type: "chat", userId: id, username: name, comment: kws[(Math.random() * kws.length) | 0] });
    return;
  }
  const u = botPool[(Math.random() * botPool.length) | 0], roll = Math.random();
  if (roll < 0.62) handleLiveEvent({ source: "demo", type: "chat", userId: u.id, username: u.name, comment: ["HEAVE!", "pull!!", "go go", "🔥🔥", u.team === "sun" ? "SUN!" : "NILE!", "yalla!"][(Math.random() * 6) | 0] });
  else if (roll < 0.78) handleLiveEvent({ source: "demo", type: "like", userId: u.id, username: u.name });
  else if (roll < 0.93) handleLiveEvent({ source: "demo", type: "gift", userId: u.id, username: u.name, giftName: Math.random() < 0.6 ? "Rose" : "Heart", diamondCount: 1, repeatCount: Math.random() < 0.25 ? 5 : 1 });
  else if (roll < 0.988) handleLiveEvent({ source: "demo", type: "gift", userId: u.id, username: u.name, giftName: "Doughnut", diamondCount: 30 + ((Math.random() * 3) | 0) * 20 });
  else handleLiveEvent({ source: "demo", type: "gift", userId: u.id, username: u.name, giftName: "Lion", diamondCount: 29999 > 0 ? 1500 : 0 });
}
let botTimer = null;
function startBot() {
  if (state.mode === "live") { $("bot-toggle").checked = false; return; } // bots never stand in for a live audience
  state.mode = "demo"; stopBot(); const loop = () => { botEvent(); botTimer = setTimeout(loop, 1000 / Math.max(1, Number($("bot-rate").value) || 7)); }; botTimer = setTimeout(loop, 40); }
function stopBot() { if (botTimer) { clearTimeout(botTimer); botTimer = null; } }
function seedCrowd(n) {
  if (state.mode === "live") return;
  n = Math.max(0, Math.min(CONFIG.maxWorkers, Math.floor(Number(n)) || 0)); // ?seed is validated (abc / -5 / 1e9 / Infinity are safe)
  if (n > 0) state.mode = "demo";
  let added = 0;
  for (let tries = 0; added < n && tries < n * 4 + 50; tries++) { const save = botPool.length; botEvent(); if (botPool.length > save) added++; }
  return added;
}

/* ---------- Playroom TikTok connector (opt-in ?live=1) ----------
   Connection states (shown on stage + host panel): connecting -> listening (waiting for the first event)
   -> live (green, last event Ns ago; amber when quiet > 90 s) or down (bounded retries 10 s / 30 s / 60 s, then host Retry).
   Bots are never substituted in live mode. */
const RETRY_S = [10, 30, 60];
let pr = { subscribed: false, loading: null, retryTimer: null, generation: 0,
  unsubscribe: null, disconnectOff: null, inFlight: false };
function v20Timeout(promise,ms,label) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(label+" timed out after "+ms+"ms")),ms);
    Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},
      err=>{clearTimeout(timer);reject(err)});
  });
}
function clearPlayroomListener() {
  if (typeof pr.unsubscribe === "function") {
    try { pr.unsubscribe(); } catch (e) { console.warn("[live] unsubscribe failed", e); }
  }
  if (typeof pr.disconnectOff === "function") {
    try { pr.disconnectOff(); } catch (_) {}
  }
  pr.disconnectOff = null;
  pr.unsubscribe = null;
  pr.subscribed = false;
}
function setConn(st, why) {
  state.conn.st = st;
  window.V20Ops?.link(st);
  if (why) diag({ outcome: "info", src: "live", type: "connection", reason: st + ": " + why });
}
function scheduleRetry() {
  const c = state.conn; clearTimeout(pr.retryTimer);
  if (c.tries >= RETRY_S.length) { c.retryAt = 0; return; }
  const s = RETRY_S[c.tries++]; c.retryAt = performance.now() + s * 1000;
  pr.retryTimer = setTimeout(() => tryConnectPlayroom(true), s * 1000);
}
function loadPlayroom() {
  if (pr.loading) return pr.loading;
  pr.loading = new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.joinplayroom.com/playroomkit/multiplayer.full.umd.js";
    let settled=false;
    const timeout=setTimeout(()=>fail(new Error("Playroom script load timeout")),20000);
    function fail(err) { if(settled)return; settled=true;clearTimeout(timeout);
      pr.loading=null;s.remove();reject(err); }
    s.onload=()=>{if(settled)return;settled=true;clearTimeout(timeout);resolve();};
    s.onerror=()=>fail(new Error("could not load the Playroom Kit script"));
    document.head.appendChild(s);
  });
  return pr.loading;
}
function mapLiveEvent(event) {
  const d = (event && event.data) || event || {};
  const raw = String((event && event.type) || d.type || "").toLowerCase();
  if (!["chat","like","gift"].includes(raw)) return null; // a follow/share is NOT a free heave
  if (!d.userId) return null; // never combine paid credit under anonymous name-only identity
  const value = d.giftDiamondCount ?? d.diamondCount ?? d.diamond_count ?? d.giftValue;
  return {
    source: "live", type: raw, eventId: d.msgId ?? d.eventId ?? d.id ?? (event && (event.msgId ?? event.id)),
    userId: String(d.userId), username: d.name || d.username || d.nickName || d.nickname || d.uniqueId || "viewer",
    comment: d.comment || d.content || "", giftName: d.giftName || d.gift_name || d.gift || "",
    giftValue: value, diamondCount: value,
    repeatCount: d.repeatCount ?? d.repeat_count ?? 1,
    repeatEnd: d.repeatEnd ?? d.repeat_end, groupId: d.streakId || d.comboId || d.groupId || d.group_id,
    likeCount: d.likeCount ?? d.like_count ?? 1,
    photoUrl: d.userPhotoUrl || d.profilePictureUrl || d.photoUrl
  };
}
async function tryConnectPlayroom(isRetry) {
  if (state.mode !== "live") return;
  // A forced retry retires old handlers; ordinary automatic calls do not
  // register duplicates while a connection is already listening.
  if (!isRetry && (pr.subscribed || pr.inFlight)) return;
  const generation = ++pr.generation;
  clearTimeout(pr.retryTimer);
  clearPlayroomListener();
  pr.inFlight = true;
  setConn("connecting", isRetry ? "retry " + state.conn.tries : "start");
  try {
    await loadPlayroom();
    if (generation !== pr.generation) return;
    const mod = window.Playroom || window.PlayroomKit || window;
    const insertCoin = mod.insertCoin || window.insertCoin;
    const onTikTokLiveEvent = mod.onTikTokLiveEvent || window.onTikTokLiveEvent;
    if (typeof insertCoin !== "function" || typeof onTikTokLiveEvent !== "function")
      throw new Error("insertCoin / onTikTokLiveEvent not found");
    await v20Timeout(insertCoin({ liveMode:"tiktok" }), 30000, "Playroom handshake");
    if (generation !== pr.generation) return;
    const off = onTikTokLiveEvent((event) => {
      if (generation !== pr.generation || state.mode !== "live") return;
      try {
        const mapped = mapLiveEvent(event);
        if (!mapped) return;
        const result = handleLiveEvent(mapped);
        const outcome = result?.outcome === "duplicate" ? "duplicate" :
          result?.outcome === "rejected" ? "rejected" :
          result?.outcome === "held" ? "held" :
          result?.outcome === "applied" || result?.outcome === "settled" ? "applied" : "forwarded";
        window.V20Ops?.event(mapped.type,outcome);
      } catch(e) { console.warn("[live] bad event", e); }
    });
    pr.unsubscribe = typeof off === "function" ? off : null;
    const onDisconnect=mod.onDisconnect||window.onDisconnect;
    if(typeof onDisconnect==="function") {
      const offConnection=onDisconnect(()=>{
        if(generation!==pr.generation||state.mode!=="live")return;
        ++pr.generation;clearPlayroomListener();pr.inFlight=false;
        setConn("down","provider disconnected");scheduleRetry();
      });
      pr.disconnectOff=typeof offConnection==="function"?offConnection:null;
    }
    if (isRetry) LEDGER.reconnects++;
    pr.subscribed = true; state.conn.tries = 0; state.conn.retryAt = 0;
    setConn(state.conn.lastEvent ? "live" : "listening", "subscribed to TikTok LIVE events");
  } catch (err) {
    if (generation !== pr.generation) return; // ignore superseded connection errors
    clearPlayroomListener();
    setConn("down", err && err.message ? err.message : String(err));
    scheduleRetry();
  } finally {
    if (generation === pr.generation) pr.inFlight = false;
  }
}
function retryLive() {
  if (state.mode !== "live") return;
  state.conn.tries = 0;
  tryConnectPlayroom(true);
}

/* ---------- camera, layout, loop, boot ---------- */
function fit() {
  const sizer = $("stage-sizer"), stage = $("stage"), app = $("app"), panel = $("test-panel");
  const panelOn = !document.body.classList.contains("panel-hidden") && getComputedStyle(panel).position !== "fixed";
  const narrow = IS_MOBILE || window.innerWidth < 860;
  let availW = app.clientWidth - 20, availH = app.clientHeight - 20;
  if (panelOn) availW -= (panel.offsetWidth + 16);
  let nh = 960;
  if (narrow && !panelOn && app.clientWidth > 0 && app.clientHeight > 0) {
    availW = app.clientWidth; availH = app.clientHeight;
    nh = Math.round(Math.min(1400, Math.max(960, W * availH / availW)));
  }
  if (nh !== H) {
    H = nh; stage.style.height = H + "px"; fx2.height = H;
    renderer.setSize(W, H, false); camera.aspect = W / H;
    camera.fov = 2 * Math.atan(Math.tan(26 * Math.PI / 180) * H / 960) * 180 / Math.PI; // keep the horizontal framing
    camera.updateProjectionMatrix();
  }
  const s = Math.min(Math.max(160, availW) / W, availH / H);
  sizer.style.width = W * s + "px"; sizer.style.height = H * s + "px"; stage.style.transform = "scale(" + s + ")";
}
// build camera rises and pulls back as the pyramid grows (buildEarly -> buildLate)
const CAM = {
  buildEarly: { pos: [0, 24, 44], look: [0, 9, -18] },
  buildLate: { pos: [0, 28, 50], look: [0, 10, -20] },
  boss: { pos: [0, 28, 66], look: [0, 19, -24] },
  victory: { pos: [0, 26, 50], look: [0, 12, -24] }
};
let camGrow = 0;
// v1.7: camera-only cinematic beats. No change to deliveries, boss HP,
// winner selection, gift receipts, round clocks or saved replay events.
const V17_CINEMA = { kind: "", team: null, start: 0, until: 0, cooldown: 0,
  enabled: QP.get("cinema") !== "0" &&
    !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) };
function cueV17Camera(kind, team, seconds) {
  if (!V17_CINEMA.enabled || CONFIG.calmEffects) return false;
  if (kind === "layer" && state.time < V17_CINEMA.cooldown) return false;
  V17_CINEMA.kind = kind; V17_CINEMA.team = team;
  V17_CINEMA.start = state.time; V17_CINEMA.until = state.time + Math.min(8, Math.max(0.6, seconds));
  if (kind === "layer") V17_CINEMA.cooldown = state.time + 6;
  return true;
}
window.__v17CameraState = () => ({ kind: V17_CINEMA.kind,
  active: V17_CINEMA.enabled && !CONFIG.calmEffects && state.time < V17_CINEMA.until,
  zoom: camera.zoom });
if (QP.get("visualQA") === "1")
  window.__v17Preview = (kind = "layer", team = "sun") => cueV17Camera(kind, team, 3);
function updateCamera(dt) {
  const key = state.phase === "boss" || state.phase === "race" ? "boss" : (state.phase === "victory" ? "victory" : "build");
  let c = CAM[key];
  if (key === "build") {
    const tot = CONFIG.layers * CONFIG.blocksPerLayer, pre = CONFIG.prebuiltLayers * CONFIG.blocksPerLayer;
    const g = Math.max(0, Math.min(1, (Math.max(state.teams.sun.blocks, state.teams.nile.blocks) - pre) / Math.max(1, tot - pre)));
    camGrow += (g - camGrow) * Math.min(1, dt * 0.6);
    const e = Math.pow(camGrow, 0.8), A = CAM.buildEarly, Z = CAM.buildLate, L = (i, k) => A[k][i] + (Z[k][i] - A[k][i]) * e;
    c = { pos: [L(0, "pos"), L(1, "pos"), L(2, "pos")], look: [L(0, "look"), L(1, "look"), L(2, "look")] };
  }
  camPos.set(c.pos[0] + Math.sin(state.time * 0.21) * 1.0, c.pos[1] + Math.sin(state.time * 0.17) * 0.3, c.pos[2]);
  camLook.set(c.look[0], c.look[1], c.look[2]);
  const shot = V17_CINEMA.enabled && !CONFIG.calmEffects && state.time < V17_CINEMA.until ? V17_CINEMA : null;
  const blend = shot ? Math.max(0, Math.min(1, (state.time - shot.start) / 0.5,
    (shot.until - state.time) / 0.7)) : 0;
  let targetZoom = 1;
  if (blend) {
    const side = shot.team === "nile" ? 1 : -1;
    let p, l;
    if (shot.kind === "layer") {
      p = [side * 17, 23, 47]; l = [side * 7, 9, -25]; targetZoom = 1.035;
    } else if (shot.kind === "race") {
      p = [0, 36, 63]; l = [0, 16, -26];
    } else if (shot.kind === "boss") {
      p = [0, 30, 70]; l = [0, 22, -45];
    } else if (shot.kind === "victory") {
      // First celebrate the finished monument, then reveal the whole valley.
      const wide = state.time - shot.start > 3.8;
      p = wide ? [0, 38, 78] : [side * 10, 30, 56];
      l = wide ? [0, 15, -27] : [0, 17, -29];
    }
    if (p && l) {
      camPos.lerp(new THREE.Vector3(...p), blend);
      camLook.lerp(new THREE.Vector3(...l), blend);
    }
  }
  const desiredZoom = 1 + (targetZoom - 1) * blend;
  const zoom = camera.zoom + (desiredZoom - camera.zoom) * Math.min(1, dt * 4);
  if (Math.abs(zoom - camera.zoom) > 0.0001) {
    camera.zoom = zoom; camera.updateProjectionMatrix();
  }
  if (CONFIG.calmEffects) state.shake = 0;
  if (state.shake > 0) {
    camPos.x += (Math.random() - 0.5) * state.shake * 0.6; camPos.y += (Math.random() - 0.5) * state.shake * 0.4;
    state.shake = Math.max(0, state.shake - dt * 2);
  }
  camera.position.lerp(camPos, Math.min(1, dt * 2.2)); camTarget.lerp(camLook, Math.min(1, dt * 2.5)); camera.lookAt(camTarget);
}
function snapCamera() { camGrow = 0; updateCamera(0.016); camera.position.copy(camPos); camTarget.copy(camLook); camera.lookAt(camTarget); }
window.__snapCamera = snapCamera;

let lastUI = 0, lastT = 0;
function wallElapsed(now, previous) {
  // Rendering may run at 5 FPS: game timers must use wall time, not 50 ms/frame.
  // Bound sleep/reconnect gaps so a laptop waking up does not skip hours of play.
  return previous ? Math.max(0, Math.min(120, (now - previous) / 1000)) : 1 / 60;
}
function advanceClock(now) {
  const elapsed = wallElapsed(now, lastT);
  lastT = now;
  const gameSeconds = state.paused ? 0 : elapsed;
  state.time += gameSeconds;
  return gameSeconds;
}
// Low FPS must not make a 1.4-second delivery take 5.6 wall seconds.
function advanceBuildLogic(elapsed) {
  if (!Number.isFinite(elapsed) || elapsed <= 0 || state.paused || state.phase !== "build") return 0;
  // Substep team gameplay without rendering; bound work after a sleeping-PC gap.
  const simulated = Math.min(elapsed, 10);
  const count = Math.ceil(simulated / 0.05);
  const slice = simulated / count;
  for (let i = 0; i < count && state.phase === "build"; i++) updateTeams(slice);
  return simulated;
}
function tick(now) {
  const elapsed = advanceClock(now);
  const dt = Math.min(0.05, elapsed); // visual animation remains bounded for stability
  try {
    updatePhase();
    advanceBuildLogic(elapsed);
    updateSledges(dt, state.time);
    updateLitters(state.time, dt);
    updatePeople(state.time, dt);
    updateRopes();
    updateVictory(dt, state.time); updateApep(dt, state.time); updateProjectiles(dt);
    updateWater(state.time); updateFlags(state.time); updateBirds(state.time); updateDrummers(state.time);
    if (window.__motes) window.__motes.uniforms.time.value = state.time;
    felucca.position.x = -30 + Math.sin(state.time * 0.05) * 22; felucca.position.y = -0.6 + Math.sin(state.time * 1.3) * 0.06; felucca.rotation.z = Math.sin(state.time * 1.1) * 0.03;
    updateParticles(dt);
    updateCamera(dt);
    renderer.render(scene, camera);
    window.V20Ops?.frame(now);
    updateLabels();
    updateFX2(dt);
    pumpPop(); pumpReceipts();
    if (now - lastUI > 250) { refreshUI(); lastUI = now; }
  } catch (e) { console.error(e); }
  requestAnimationFrame(tick);
}
// A backgrounded OBS/browser source may stop receiving rAF callbacks.
// Advance phase timers without rendering while hidden; never invent GPU frames.
setInterval(() => {
  if (!document.hidden) return;
  const elapsed = advanceClock(performance.now());
  if (elapsed) { updatePhase(); advanceBuildLogic(elapsed); }
}, 500);

function boot() {
  window.V20Ops?.init("pyramid");
  TEAM_IDS.forEach(id => { crestURL[id] = makeCrest(id); });
  $("wait-c1").src = crestURL.sun; $("wait-c2").src = crestURL.nile;
  buildWorld(); buildPeople(); buildRopes(); TEAM_IDS.forEach(buildLitter); buildDrummers(); buildApep();
  applyPhaseUI(); fit(); snapCamera();
  const chips = $("chips");
  TEAM_IDS.forEach(id => CONFIG.teams[id].keywords.slice(0, 3).forEach(k => { const b = document.createElement("button"); b.type = "button"; b.textContent = k; b.dataset.fill = k; chips.appendChild(b); }));
  const who = () => { const name = $("fake-user").value.trim() || "Pablo"; return { source: "test", userId: "local:" + name.toLowerCase(), username: name }; };
  $("mute").addEventListener("click", () => setMuted(!state.muted));
  $("btn-send").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "chat", comment: $("fake-comment").value }, who())));
  $("fake-comment").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("btn-send").click(); } });
  $("btn-like").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "like" }, who())));
  $("btn-rose").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Rose", diamondCount: 1 }, who())));
  $("btn-heart").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Heart", diamondCount: 1 }, who())));
  $("btn-med").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Doughnut", diamondCount: 50 }, who())));
  $("btn-lion").addEventListener("click", () => handleLiveEvent(Object.assign({ type: "gift", giftName: "Lion", diamondCount: 1500 }, who())));
  chips.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => { $("fake-comment").value = btn.dataset.fill; $("btn-send").click(); }));
  $("bot-rate").addEventListener("input", () => { $("bot-rate-val").textContent = $("bot-rate").value + "/s"; });
  $("bot-toggle").addEventListener("change", () => {
    if (state.mode === "live") {
      $("bot-toggle").checked = false; stopBot();
      console.warn("[LIVE] Demo bots cannot run during a LIVE session");
      return;
    }
    if ($("bot-toggle").checked) startBot(); else stopBot();
  });
  window.addEventListener("keydown", (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "h" || e.key === "H") { document.body.classList.toggle("panel-hidden"); fit(); }
    else if (e.key === "m" || e.key === "M") setMuted(!state.muted);
    else if (e.key === "l" || e.key === "L") toggleLang();
  });
  // host controls
  $("lang-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleLang(); });
  $("h-lang").addEventListener("click", toggleLang);
  $("h-retry").addEventListener("click", retryLive);
  $("h-pause").addEventListener("click", () => setPaused(!state.paused));
  $("h-reset").addEventListener("click", () => { if (confirm("Reset this round? Crews, pharaohs and supporters are kept.")) safeResetRound(); });
  $("h-calm").addEventListener("click", () => setCalm(!CONFIG.calmEffects));
  window.addEventListener("resize", fit);
  document.addEventListener("visibilitychange", () => { if (audioCtx) { if (document.hidden) audioCtx.suspend(); else if (!state.muted) audioCtx.resume(); } });
  const q = new URLSearchParams(location.search);
  $("panel-btn").addEventListener("click", (e) => { e.stopPropagation(); document.body.classList.toggle("panel-hidden"); fit(); });
  if (IS_MOBILE || window.innerWidth < 860) { document.body.classList.add("panel-hidden"); fit(); }
  // shared demo link: tap-to-start overlay unlocks sound and starts the bot crowd (skip with ?live=1, ?bot=1 or ?demo=0)
  if (q.get("live") !== "1" && q.get("bot") !== "1" && q.get("demo") !== "0") {
    $("start").classList.add("on");
    let started = false;
    const go = () => {
      if (started) return; started = true;
      $("start").classList.remove("on"); setMuted(false);
      if (!botPool.length) seedCrowd(36);
      $("bot-toggle").checked = true; startBot();
    };
    $("start").addEventListener("click", go);
    $("start-b").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    setTimeout(() => { try { $("start-b").focus(); } catch (_) {} }, 50);
  }
  if (q.get("seed") != null) seedCrowd(q.get("seed"));
  // live capture: hide the host/test buttons on the stage unless ?host=1 (H still opens the host panel)
  if (state.mode === "live") { document.body.classList.add("panel-hidden"); if (q.get("host") !== "1") document.body.classList.add("viewer-capture"); $("bot-toggle").disabled = true; fit(); }
  if (q.get("calm") === "1") setCalm(true);
  const safe = Number(q.get("safe")); if (isFinite(safe) && safe > 0) $("stage").style.setProperty("--safe-b", Math.min(400, safe) + "px"); // reserve space for platform overlays
  if (q.get("bot") === "1" && state.mode !== "live") { $("bot-toggle").checked = true; startBot(); }
  if (q.get("sound") === "1") setMuted(false);
  if (q.get("lang") === "tr") { CONFIG.lang = "tr"; applyPhaseUI(); }
  if (q.get("panel") === "0") { document.body.classList.add("panel-hidden"); fit(); }
  tryConnectPlayroom();
  requestAnimationFrame(tick);
}
/* host panel (refreshed with the UI, 4x a second) */
window.renderHostPanel = function () {
  if (document.body.classList.contains("panel-hidden")) return;
  const ct = connText();
  $("host-status").innerHTML = "Mode: <b>" + state.mode.toUpperCase() + "</b> · " + '<span class="conn ' + ct[0] + '">' + esc(ct[1]) + "</span> · speed ×" + SPEED + " · round " + state.round + " · " + state.phase + " · PYRAMID STAGING 2026-11-19" + (state.paused ? " · PAUSED" : "");
  $("h-retry").disabled = state.mode !== "live";
  $("h-pause").textContent = state.paused ? "▶ Resume" : "⏸ Pause";
  $("h-calm").textContent = "✨ Calm effects: " + (CONFIG.calmEffects ? "on" : "off");
  const st = LEDGER.stats, b = LEDGER.bySrc;
  $("host-stats").textContent = "events live " + b.live + " · test " + b.test + " · demo " + b.demo + " | applied " + (st.applied || 0) + " · held " + (st.held || 0) + " · settled " + (st.settled || 0) + " · dup " + (st.duplicate || 0) + " · rejected " + (st.rejected || 0) + " | waiting " + state.held.length;
  const rows = LEDGER.receipts.slice(-30).reverse().filter(r => r.src !== "demo" || r.outcome !== "applied").slice(0, 14);
  $("host-rc").innerHTML = rows.map(r => '<li class="' + r.outcome + '"><span class="src ' + (r.src || "") + '">' + esc(String(r.src || "").toUpperCase()) + "</span> " + esc(r.outcome) + " · " + esc(r.type || "") + " · " + esc(r.user || "") + (r.team ? " (" + esc(r.team) + ")" : "") + (r.pts != null ? " +" + r.pts : "") + (r.dmg != null ? " −" + Math.round(r.dmg) : "") + (r.reason ? " — " + esc(r.reason) : "") + (r.note ? " — " + esc(r.note) : "") + "</li>").join("");
};
boot();
  
