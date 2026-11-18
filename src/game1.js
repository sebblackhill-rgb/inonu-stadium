"use strict";
/* ================= CONFIG (rename teams / keywords here) ================= */
const CONFIG = {
  version: "inonu-v1",
  lang: "tr",
  matchMinutes: 90, secondsPerMinute: 2,          // 90' match = 3 real minutes
  teams: {
    home: { name: "KARTALLAR", short: "EV", seats: "EV SAHİBİ", kit: ["#111111", "#f4f4f4"], accent: "#ffffff", flare: 0xff3b2a,
            keywords: ["1", "home", "ev", "evsahibi", "ev sahibi", "kartal", "⚫", "⚪"] },
    away: { name: "MİSAFİR", short: "DEP", seats: "DEPLASMAN", kit: ["#b5121b", "#ffcc22"], accent: "#ffcc22", flare: 0xffb020,
            keywords: ["2", "away", "dep", "deplasman", "misafir", "🔴", "🟡"] }
  },
  actions: {
    drum:    ["davul", "drum", "🥁", "dum"],
    torch:   ["meşale", "mesale", "torch", "flare", "🔥", "meşal", "işaret fişeği"],
    bottle:  ["şişe", "sise", "bottle", "su", "water", "🍾", "💧"],
    lighter: ["çakmak", "cakmak", "lighter", "🔥🔥"]
  },
  gifts: { torchAt: 5, waveAt: 100, tifoAt: 1000 }   // diamonds: <5 drum, >=5 torch, >=100 wave, >=1000 tifo + penalty
};
const STR = {
  tr: { fans: "taraftar", venue: "İNÖNÜ STADI · İSTANBUL", mom: "MOMENTUM", board: "🎤 TRİBÜN LİDERLERİ", goal: "GOOOL!",
        save: "KURTARIŞ!", miss: "DİREK!", warn: "HAKEM UYARISI", warnSub: "{t} tribünü: atma yok! −20 tezahürat", ft: "MAÇ BİTTİ",
        joined: "{n} {t} tribününe katıldı", drum: "{n} davula vurdu 🥁", torch: "{n} meşale yaktı 🔥", bottle: "{n} sahaya şişe attı 🍾",
        lighter: "{n} sahaya çakmak attı 🔥", wave: "TRİBÜN DALGASI", tifo: "KOREO!", pen: "PENALTI!", scored: "{t} golü! ⚽",
        celebH: "🥁 DAVUL yaz · 🔥 MEŞALE yak", celebA: "😡 {t}: ŞİŞE / ÇAKMAK", start: "BAŞLAMA DÜDÜĞÜ", wins: "{t} KAZANDI!", draw: "BERABERE!",
        acts: [["📣", "Yorum", "TEZAHÜRAT"], ["🥁", "DAVUL", "gol sonrası"], ["🔥", "MEŞALE", "🌹 hediye"], ["🍾", "ŞİŞE / ÇAKMAK", "rakip gol atınca"]],
        lgH: "yaz → EV SAHİBİ", lgH2: "Type 1 = HOME ⚫⚪", lgA: "yaz → DEPLASMAN", lgA2: "Type 2 = AWAY 🔴🟡", chant: "tezahürat" },
  en: { fans: "fans", venue: "İNÖNÜ STADIUM · ISTANBUL", mom: "MOMENTUM", board: "🎤 TOP CHANTERS", goal: "GOOOAL!",
        save: "SAVED!", miss: "OFF THE POST!", warn: "REFEREE WARNING", warnSub: "{t} end: stop throwing! −20 chant", ft: "FULL TIME",
        joined: "{n} joined the {t} end", drum: "{n} hit the drum 🥁", torch: "{n} lit a torch 🔥", bottle: "{n} threw a bottle 🍾",
        lighter: "{n} threw a lighter 🔥", wave: "STAND WAVE", tifo: "TIFO!", pen: "PENALTY!", scored: "{t} score! ⚽",
        celebH: "🥁 type DRUM · 🔥 TORCH", celebA: "😡 {t}: BOTTLE / LIGHTER", start: "KICK OFF", wins: "{t} WIN!", draw: "DRAW!",
        acts: [["📣", "Comment", "= CHANT"], ["🥁", "DRUM", "after goals"], ["🔥", "TORCH", "🌹 gift"], ["🍾", "BOTTLE / LIGHTER", "when rivals score"]],
        lgH: "for HOME seats", lgH2: "Yaz 1 = EV SAHİBİ ⚫⚪", lgA: "for AWAY seats", lgA2: "Yaz 2 = DEPLASMAN 🔴🟡", chant: "chant" }
};
const T = (k, vars) => { let s = (STR[CONFIG.lang] || STR.tr)[k]; if (typeof s !== "string") return s; for (const v in vars || {}) s = s.replace("{" + v + "}", vars[v]); return s; };
const $ = id => document.getElementById(id);
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
  if (!audioCtx || state.muted) return;
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
}
function setMuted(m) { state.muted = m; if (!m) { initAudio(); if (audioCtx) audioCtx.resume(); } else if (audioCtx) audioCtx.suspend(); $("mute").textContent = m ? "🔇" : "🔊"; }
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
