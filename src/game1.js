"use strict";
/* ================= CONFIG (rename teams / keywords / rules here) ================= */
const CONFIG = {
  version: "inonu-v3",
  lang: "tr",
  matchMinutes: 90, secondsPerMinute: 2,          // 90' match = 3 real minutes
  teams: {
    home: { name: "KARTALLAR", nameEn: "KARTALLAR", short: "EV", shortEn: "HOME", seats: "EV SAHİBİ", seatsEn: "HOME", kit: ["#111111", "#f4f4f4"], accent: "#ffffff", flare: 0xff3b2a,
            keywords: ["1", "11", "111", "home", "ev", "ev sahibi", "evsahibi", "kartal", "kartallar", "⚫", "⚪"] },
    away: { name: "MİSAFİR", nameEn: "VISITORS", short: "DEP", shortEn: "AWAY", seats: "DEPLASMAN", seatsEn: "AWAY", kit: ["#b5121b", "#ffcc22"], accent: "#ffcc22", flare: 0xffb020,
            keywords: ["2", "22", "222", "away", "dep", "deplasman", "misafir", "visitors", "🔴", "🟡"] }
  },
  // joins: EVERY word of the comment must be one team's keyword (explicit list, no prefixes): "1", "11", "1!", "ev sahibi", "2 dep!" join; "1990", "1 dakika", "go home" never do
  // actions: whole-word / whole-token matching only (Turkish letters are folded: ş→s, ç→c, ı→i …)
  actions: {
    drum:    ["davul", "davula", "drum", "🥁"],
    torch:   ["meşale", "torch", "flare", "🔥"],
    bottle:  ["şişe", "bottle", "🍾"],
    lighter: ["çakmak", "lighter"]
  },
  gifts: { torchAt: 5, waveAt: 100, tifoAt: 1000, comboWindow: 1.6 },   // diamonds: <5 drum, >=5 torch, >=100 wave, >=1000 tifo + penalty
  penalty: { conversion: 0.75 },
  // "su"/"water" were removed from bottle on purpose: "su" is an everyday Turkish word (report C4); "dum" removed (matched "dumb", A2)
  // explained, escalating throw rule: N throws within W seconds = one offence; after an offence that end's throws do not count (and do not hurt the rivals) for cooldown seconds. Offences: 1 verbal warning, 2 yellow card (−15 chant), 3+ throwing banned for banSec
  throwRule: { limit: 3, window: 20, yellowCost: 15, banSec: 30, cooldown: 20 },
  points: { chatEvery: 2, likePts: 0.2, likeCapPerMin: 3, giftK: 4, giftCapPerMatch: 60 },   // ranking points: gifts give 4·√diamonds, capped per match
  demo: { maxJoins: 70, seed: 40 },               // hard cap: bots never exceed maxJoins fans in total (seed included)
  labels: 10,
  ftSec: 16,                                        // full-time ceremony length
  shots: { minChant: 8, base: 0.15, perChant: 1.8 },  // no chant (<8%) = no shots; more chant = more shots
  live: { backoff: [5, 10, 30, 60], maxTries: 5 }   // bridge retries (s), then a manual "tap to retry"
};
const STR = {
  tr: { fans: "taraftar", venue: "İNÖNÜ STADI · İSTANBUL", mom: "MOMENTUM", goal: "GOOOL!",
        save: "KURTARIŞ!", miss: "DİREK!", ft: "MAÇ SONU", start: "BAŞLAMA DÜDÜĞÜ", wins: "{t} KAZANDI!", draw: "BERABERE!",
        joined: "{n} {t} tribününe katıldı", joinRule: "✅ “{k}” = {t} tribünü", joinedBatch: "+{k} {t}: {names}", drum: "{n} davula vurdu 🥁", torch: "{n} meşale yaktı 🔥",
        bottle: "{n} sahaya şişe attı 🍾", lighter: "{n} sahaya çakmak attı", wave: "TRİBÜN DALGASI", tifo: "KOREO!", pen: "PENALTI!",
        penQ: "⏳ PENALTI SIRADA: {t}", penBy: "🦁 @{n} hediyesi", scored: "{t} golü! ⚽",
        goalWhy: "📣 Tezahürat %{c} → gol şansı %{p}", celebH: "🥁 DAVUL yaz · 🔥 MEŞALE yak", celebA: "{t}: ŞİŞE/ÇAKMAK = risk ⚠️", watch: "👀 HAKEM İZLİYOR", watchS: "{t}: bir atış daha = {w}", cool: "(hakem uyardı — sayılmadı)", penFull: "+tezahürat (en fazla 2 penaltı sırada)", penFt: "maç bitti — penaltı yok, +tezahürat", matchN: "MAÇ {n}",
        acts: [["📣", "Yorum", "TEZAHÜRAT"], ["🥁", "DAVUL", "/ 🔥 MEŞALE"], ["🍾", "ŞİŞE / ÇAKMAK", "⚠️ hakem izliyor"], ["🎁", "Hediye", "efekt · 🦁 penaltı"]],
        lgH: "yaz → EV SAHİBİ", lgH2: "⚫⚪ siyah-beyaz", lgA: "yaz → DEPLASMAN", lgA2: "🔴🟡 kırmızı-sarı",
        throwRule: "⚠️ 20 sn'de 3 atış: 1. sözlü uyarı · 2. sarı kart −15 · 3. atış yasağı 30 sn · uyarıdan sonra 20 sn atış sayılmaz",
        warn1: "SÖZLÜ UYARI", warn1s: "{t}: bir daha olursa SARI KART (−15)", warn2: "SARI KART", warn2s: "{t}: −15 tezahürat · sonraki: ATIŞ YASAĞI",
        warn3: "ATIŞ YASAĞI", warn3s: "{t}: 30 sn atış yok", banned: "{t} atış yasaklı ({s} sn)",
        pick: "@{n}: önce takımını seç → 1 = EV · 2 = DEP", pickHeld: "@{n}: hediyen bekliyor → 1 ya da 2 yaz!", heldApplied: "@{n} hediyesi {t} için sayıldı ✅",
        chance: "⚽ %{p}", attack: "⚡ {t} ATAKTA · tezahürat = gol şansı", boardM: "🎤 BU MAÇ", boardN: "⭐ GECENİN TARAFTARLARI",
        series: "MAÇ {m} · SERİ {h}-{a}", ftTitle: "MAÇ SONU", motm: "MAÇIN TARAFTARI", next: "SONRAKİ MAÇ {s}", seriesLine: "Seri: {hn} {h} – {a} {an}",
        top3: "BU MAÇIN EN İYİLERİ", soundTap: "🔈 Ses kapalı — açmak için dokun", stoppage: "+ uzatma: penaltı",
        liveConnecting: "🔌 TikTok LIVE bağlanıyor…", liveOk: "🟢 TikTok LIVE bağlı", liveFail: "⚠️ TikTok LIVE bağlanamadı — yorumlar gelmiyor", liveLost: "⚠️ TikTok LIVE bağlantısı koptu", liveQuiet: "⚠️ {s} sn'dir LIVE olayı yok", liveRetryIn: " · {s} sn sonra tekrar ({i}/{n})", liveTap: " · tekrar denemek için dokun", liveReload: " · yeniden bağlanmak için dokun",
        ui: { title: "İNÖNÜ<br>TRİBÜN SAVAŞI", panelTitle: "TEST PANELİ", panelHide: "(H gizle)", user: "Kullanıcı", comment: "Yorum", send: "Gönder 💬", like: "Beğeni ❤️", gifts: "Hediyeler", demo: "Bot kalabalık", reset: "Seriyi sıfırla", newUser: "Yeni izleyici", on: "açık", pause: "⏸ Durdur", resume: "▶ Devam", restart: "⟳ Maçı yeniden başlat", play: "▶ OYNA", startSub: "Tribün tezahürat savaşı · TikTok LIVE", soundOn: "sesi aç 🔊", hint: "M ses · L dil TR/EN · H panel · ? yardım", mute: "Ses (M)", panelBtn: "Test paneli (H)",
              helpT: "KISAYOLLAR VE URL AYARLARI", help: [["M", "ses aç/kapa"], ["L", "dil TR/EN"], ["H", "test paneli"], ["P", "durdur/devam"], ["?", "bu yardım"], ["?bot=1", "demo kalabalık hemen başlar"], ["?live=1", "TikTok LIVE (Playroom) bağlantısı"], ["?lang=en", "İngilizce"], ["?sound=1", "ses açık başlar (ilk dokunuşta)"], ["?demo=0", "başlangıç ekranı ve bot yok"], ["?panel=0", "test paneli gizli"], ["?seed=N", "N taraftarla başla"], ["?clip=1", "video/kapak modu (elle zaman)"], ["?help=1", "bu yardım açık başlar"], ["?cx ?cy ?lx ?fov ?fp ?lk", "kamera ayarları"]], close: "kapatmak için dokun" } },
  en: { fans: "fans", venue: "İNÖNÜ STADIUM · ISTANBUL", mom: "MOMENTUM", goal: "GOOOAL!",
        save: "SAVED!", miss: "OFF THE POST!", ft: "FULL TIME", start: "KICK OFF", wins: "{t} WIN!", draw: "DRAW!",
        joined: "{n} joined the {t} end", joinRule: "✅ “{k}” = {t} end", joinedBatch: "+{k} {t}: {names}", drum: "{n} hit the drum 🥁", torch: "{n} lit a torch 🔥",
        bottle: "{n} threw a bottle 🍾", lighter: "{n} threw a lighter", wave: "STAND WAVE", tifo: "TIFO!", pen: "PENALTY!",
        penQ: "⏳ PENALTY QUEUED: {t}", penBy: "🦁 @{n}'s gift", scored: "{t} score! ⚽",
        goalWhy: "📣 Chant {c}% → goal chance {p}%", celebH: "🥁 type DRUM · 🔥 TORCH", celebA: "{t}: BOTTLE/LIGHTER = risk ⚠️", watch: "👀 THE REF IS WATCHING", watchS: "{t}: one more throw = {w}", cool: "(ref already warned — not counted)", penFull: "+chant (max 2 penalties queued)", penFt: "match over — no penalty, +chant", matchN: "MATCH {n}",
        acts: [["📣", "Comment", "= CHANT"], ["🥁", "DRUM", "/ 🔥 TORCH"], ["🍾", "BOTTLE / LIGHTER", "⚠️ ref is watching"], ["🎁", "Gifts", "effects · 🦁 penalty"]],
        lgH: "for HOME seats", lgH2: "⚫⚪ black & white", lgA: "for AWAY seats", lgA2: "🔴🟡 red & yellow",
        throwRule: "⚠️ 3 throws in 20 s: 1st verbal warning · 2nd yellow −15 · 3rd throw ban 30 s · throws don't count for 20 s after a warning",
        warn1: "VERBAL WARNING", warn1s: "{t}: next time YELLOW CARD (−15)", warn2: "YELLOW CARD", warn2s: "{t}: −15 chant · next: THROW BAN",
        warn3: "THROW BAN", warn3s: "{t}: no throwing for 30 s", banned: "{t} banned from throwing ({s} s)",
        pick: "@{n}: pick a team first → 1 = HOME · 2 = AWAY", pickHeld: "@{n}: your gift is waiting → type 1 or 2!", heldApplied: "@{n}'s gift counted for {t} ✅",
        chance: "⚽ {p}%", attack: "⚡ {t} ATTACKING · chant = goal chance", boardM: "🎤 THIS MATCH", boardN: "⭐ TONIGHT'S SUPPORTERS",
        series: "MATCH {m} · SERIES {h}-{a}", ftTitle: "FULL TIME", motm: "FAN OF THE MATCH", next: "NEXT MATCH {s}", seriesLine: "Series: {hn} {h} – {a} {an}",
        top3: "TOP FANS THIS MATCH", soundTap: "🔈 Sound is off — tap to enable", stoppage: "+ stoppage: penalty",
        liveConnecting: "🔌 Connecting to TikTok LIVE…", liveOk: "🟢 TikTok LIVE connected", liveFail: "⚠️ TikTok LIVE failed — no comments arriving", liveLost: "⚠️ TikTok LIVE disconnected", liveQuiet: "⚠️ No LIVE events for {s} s", liveRetryIn: " · retrying in {s} s ({i}/{n})", liveTap: " · tap to retry", liveReload: " · tap to reconnect",
        ui: { title: "İNÖNÜ<br>CHANT BATTLE", panelTitle: "TEST PANEL", panelHide: "(H hide)", user: "Username", comment: "Comment", send: "Send 💬", like: "Like ❤️", gifts: "Gifts", demo: "Demo crowd", reset: "Reset series", newUser: "New viewer", on: "on", pause: "⏸ Pause", resume: "▶ Resume", restart: "⟳ Restart match", play: "▶ PLAY", startSub: "Stadium chant battle · TikTok LIVE", soundOn: "turn sound on 🔊", hint: "M sound · L language TR/EN · H panel · ? help", mute: "Sound (M)", panelBtn: "Test panel (H)",
              helpT: "KEYS AND URL OPTIONS", help: [["M", "sound on/off"], ["L", "language TR/EN"], ["H", "test panel"], ["P", "pause/resume"], ["?", "this help"], ["?bot=1", "demo crowd starts at once"], ["?live=1", "connect TikTok LIVE (Playroom)"], ["?lang=en", "English"], ["?sound=1", "start with sound (on first tap)"], ["?demo=0", "no start screen, no bots"], ["?panel=0", "hide the test panel"], ["?seed=N", "start with N fans"], ["?clip=1", "video/cover mode (manual time)"], ["?help=1", "open this help"], ["?cx ?cy ?lx ?fov ?fp ?lk", "camera overrides"]], close: "tap to close" } }
};
const T = (k, vars) => { let s = (STR[CONFIG.lang] || STR.tr)[k]; if (typeof s !== "string") return s; for (const v in vars || {}) s = s.replace("{" + v + "}", vars[v]); return s; };
const $ = id => document.getElementById(id);
const EN = () => CONFIG.lang === "en";
const tName = t => EN() ? CONFIG.teams[t].nameEn : CONFIG.teams[t].name;
const tShort = t => EN() ? CONFIG.teams[t].shortEn : CONFIG.teams[t].short;
const tSeats = t => EN() ? CONFIG.teams[t].seatsEn : CONFIG.teams[t].seats;
const Q = new URLSearchParams(location.search);
const CLIP = Q.get("clip") === "1";
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Q.get("mobile") === "1";
if (IS_MOBILE) document.body.classList.add("mobile");
if (CLIP) document.body.classList.add("clip", "panel-hidden");
const TEAMS = ["home", "away"];
const other = t => t === "home" ? "away" : "home";
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ================= game state ================= */
const state = {
  time: 0, phase: "intro", phaseT: 0, minute: 0, goals: { home: 0, away: 0 },
  chant: { home: 0, away: 0 }, momentum: 0, ballZ: 0, ballX: 0, lastScorer: null, celebrate: 0,
  throws: { home: [], away: [] }, warnings: { home: 0, away: 0 }, shake: 0, muted: true, timers: []
};
const users = new Map();           // userId -> fan
const teamFans = { home: [], away: [] };
function later(sec, fn) { state.timers.push({ t: state.time + sec, fn }); }
function runTimers() { for (let i = state.timers.length - 1; i >= 0; i--) { if (state.timers[i].t <= state.time) { const f = state.timers[i].fn; state.timers.splice(i, 1); try { f(); } catch (e) { console.error(e); } } } }

/* ================= audio (WebAudio, also renderable offline for the share video) ================= */
let audioCtx = null, master = null, crowdGain = null, noiseBuf = null;
const sfxLog = []; window.__sfxLog = sfxLog;
function makeNoise(ctx) { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function envGain(ctx, out, t, a, peak, dcy) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); g.connect(out); return g; }
function noiseSrc(ctx, nb, t, dur) { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t, Math.random()); s.stop(t + dur + 0.05); return s; }
const SYN = {
  drum(ctx, out, nb, t) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    o.connect(envGain(ctx, out, t, 0.004, 0.95, 0.45)); o.start(t); o.stop(t + 0.5);
    const n = noiseSrc(ctx, nb, t, 0.12), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; n.connect(f); f.connect(envGain(ctx, out, t, 0.002, 0.35, 0.1));
  },
  clap(ctx, out, nb, t, v = 0.25) {
    const n = noiseSrc(ctx, nb, t, 0.1), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 0.8; n.connect(f); f.connect(envGain(ctx, out, t, 0.003, v, 0.09));
  },
  voice(ctx, out, nb, t, f0, dur, v = 0.12) {   // crowd "ooo-eee" voice: detuned saws through formants
    const g = envGain(ctx, out, t, 0.06, v, dur);
    [0.97, 1, 1.03, 1.5].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f0 * m, t); o.frequency.linearRampToValueAtTime(f0 * m * 1.06, t + dur * 0.6);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(650, t); bp.frequency.linearRampToValueAtTime(1100, t + dur); bp.Q.value = 3;
      o.connect(bp); bp.connect(g); o.start(t); o.stop(t + dur + 0.15);
    });
  },
  chant(ctx, out, nb, t, team) {   // "clap clap clap — OOO-LEY" pattern
    const f0 = team === "home" ? 196 : 233;
    for (let i = 0; i < 3; i++) SYN.clap(ctx, out, nb, t + i * 0.22, 0.3);
    SYN.voice(ctx, out, nb, t + 0.7, f0, 0.35); SYN.voice(ctx, out, nb, t + 1.1, f0 * 1.19, 0.5);
    SYN.drum(ctx, out, nb, t); SYN.drum(ctx, out, nb, t + 0.66);
  },
  roar(ctx, out, nb, t) {
    const n = noiseSrc(ctx, nb, t, 3.6), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    n.connect(f); f.connect(g); g.connect(out);
    [233, 277, 349].forEach(fr => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; o.connect(lp); lp.connect(envGain(ctx, out, t + 0.1, 0.03, 0.07, 1.1)); o.start(t + 0.1); o.stop(t + 1.4); });
    SYN.voice(ctx, out, nb, t + 0.15, 300, 1.6, 0.16);
  },
  whistle(ctx, out, nb, t, n = 2) {
    for (let k = 0; k < n; k++) { const s = t + k * 0.32; const o = ctx.createOscillator(); o.frequency.value = 2900; const l = ctx.createOscillator(); l.frequency.value = 32; const lg = ctx.createGain(); lg.gain.value = 140; l.connect(lg); lg.connect(o.frequency);
      o.connect(envGain(ctx, out, s, 0.01, 0.12, 0.24)); o.start(s); l.start(s); o.stop(s + 0.3); l.stop(s + 0.3); }
  },
  clank(ctx, out, nb, t) { const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.15); o.connect(envGain(ctx, out, t, 0.002, 0.25, 0.2)); o.start(t); o.stop(t + 0.3); SYN.clap(ctx, out, nb, t, 0.15); },
  hiss(ctx, out, nb, t) { const n = noiseSrc(ctx, nb, t, 1.6), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500; n.connect(f); f.connect(envGain(ctx, out, t, 0.05, 0.12, 1.4)); },
  pop(ctx, out, nb, t) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.08); o.connect(envGain(ctx, out, t, 0.004, 0.08, 0.1)); o.start(t); o.stop(t + 0.15); },
  kick(ctx, out, nb, t) { SYN.clap(ctx, out, nb, t, 0.2); const o = ctx.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1); o.connect(envGain(ctx, out, t, 0.002, 0.4, 0.12)); o.start(t); o.stop(t + 0.2); },
  groan(ctx, out, nb, t) { SYN.voice(ctx, out, nb, t, 160, 0.9, 0.1); },
  fanfare(ctx, out, nb, t) { [523, 659, 784, 1046].forEach((f, i) => { const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200; o.connect(lp); lp.connect(envGain(ctx, out, t + i * 0.12, 0.01, 0.06, 0.35)); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.5); }); }
};
function sfx(name, arg) {
  if (CLIP) { sfxLog.push({ t: state.time, name, arg }); return; }
  if (!audioCtx || state.muted || audioCtx.state !== "running") return;
  try { SYN[name](audioCtx, master, noiseBuf, audioCtx.currentTime + 0.01, arg); } catch (e) {}
}
function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx = new AC(); noiseBuf = makeNoise(audioCtx);
  master = audioCtx.createGain(); master.gain.value = 0.8;
  const comp = audioCtx.createDynamicsCompressor(); master.connect(comp); comp.connect(audioCtx.destination);
  const n = audioCtx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  const f = audioCtx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 550; f.Q.value = 0.4;
  crowdGain = audioCtx.createGain(); crowdGain.gain.value = 0.05; n.connect(f); f.connect(crowdGain); crowdGain.connect(master); n.start();
  audioCtx.onstatechange = () => refreshSoundUI();
}
function audioState() { return state.muted ? "muted" : (audioCtx ? audioCtx.state : "none"); }
// honest sound UI: the speaker only shows "on" when the AudioContext is actually running
function refreshSoundUI() {
  const st = audioState(), on = st === "running";
  $("mute").textContent = on ? "🔊" : "🔇"; $("mute").classList.toggle("warn", !state.muted && !on);
  $("soundpill").style.display = (!state.muted && !on && !CLIP) ? "block" : "none";
  window.__audioState = st;
}
function setMuted(m) {
  state.muted = m;
  if (!m) { initAudio(); if (audioCtx) { const p = audioCtx.resume(); if (p && p.then) p.then(refreshSoundUI, refreshSoundUI); } }
  else if (audioCtx) audioCtx.suspend();
  refreshSoundUI();
}
// offline render for the share clip: replays the logged sfx + a crowd bed following the chant levels
window.__renderAudio = async function (dur, bed) {
  const sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * dur), sr), nb = makeNoise(ctx);
  const out = ctx.createGain(); out.gain.value = 0.8; const comp = ctx.createDynamicsCompressor(); out.connect(comp); comp.connect(ctx.destination);
  const n = ctx.createBufferSource(); n.buffer = nb; n.loop = true; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 550; f.Q.value = 0.4;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.05, 0); (bed || []).forEach(p => g.gain.linearRampToValueAtTime(p.v, Math.max(0, p.t))); n.connect(f); f.connect(g); g.connect(out); n.start(0);
  sfxLog.forEach(e => { if (e.t >= 0 && e.t < dur) try { SYN[e.name](ctx, out, nb, e.t, e.arg); } catch (er) {} });
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1), len = L.length, ab = new ArrayBuffer(44 + len * 4), dv = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); dv.setUint32(4, 36 + len * 4, true); ws(8, "WAVE"); ws(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, "data"); dv.setUint32(40, len * 4, true);
  for (let i = 0; i < len; i++) { dv.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true); dv.setInt16(46 + i * 4, clamp(R[i], -1, 1) * 32767, true); }
  let bin = ""; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(bin);
};
