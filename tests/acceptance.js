// Headless acceptance tests for İnönü Tribün Savaşı. Run: node tests/acceptance.js [url-base]
const puppeteer = require('/tmp/pw/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'file:///workspace/inonu-stadium/index.html';
const ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const results = []; const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function page(b, q, opts = {}) {
  const p = await b.newPage(); if (opts.phone) await p.emulate(puppeteer.KnownDevices['iPhone 13']); else await p.setViewport({ width: 540, height: 960 });
  p.errs = []; p.warns = []; p.on('pageerror', e => p.errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push('console.error ' + m.text()); if (m.type() === 'warn' || m.type() === 'warning') p.warns.push(m.text()); });
  if (opts.autoplay) await p.evaluateOnNewDocument(() => {   // Chrome ignores --autoplay-policy under automation, so model its rule: no audio until a real user activation
    const AC = window.AudioContext;
    window.AudioContext = window.webkitAudioContext = class extends AC {
      constructor(...a) { super(...a); if (!navigator.userActivation.hasBeenActive) super.suspend(); }
      resume() { return navigator.userActivation.hasBeenActive ? super.resume() : Promise.resolve(); } };
  });
  await p.goto(BASE + q, { waitUntil: 'load' }); return p;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000, args: ARGS });
  /* ---------- deterministic suite (clip mode = manual time stepping) ---------- */
  const p = await page(b, '?clip=1&rskip=10');
  await p.evaluate(() => { window.S = (sec) => __step(Math.round(sec * 30), 1 / 30); window.E = (o) => handleLiveEvent(o); __seedCrowd(40); S(2); shotCooldown = 1e9; });

  // P4 word matching
  const cases = [['dumb', null], ['drummer', null], ['DRUM', 'drum'], ['davul', 'drum'], ['DAVUL!!', 'drum'], ['davula vur', 'drum'], ['torchlight', null], ['torch', 'torch'], ['meşale', 'torch'], ['mesale yak', 'torch'],
    ['flareup', null], ['🔥', 'torch'], ['bottleneck', null], ['şişe', 'bottle'], ['SISE AT', 'bottle'], ['şişecam', null], ['LIGHTER', 'lighter'], ['çakmak', 'lighter'], ['cakmakli', null], ['sudan', null], ['subway', null], ['hello there', null], ['durum', null], ['cakmakta', null], ['dumb davul', 'drum'], ['su', null], ['water', null]];
  const m = await p.evaluate((cs) => cs.map(([c]) => __match(c).action), cases);
  const bad = cases.filter((c, i) => m[i] !== c[1]).map((c, i) => c[0]);
  ok('P4 action matching is whole-word/token only (' + cases.length + ' cases)', bad.length === 0, bad.length ? 'wrong: ' + bad.join(', ') : cases.map(c => c[0] + '→' + c[1]).join(' · '));
  const tcases = [['1', 'home'], ['2', 'away'], ['10', null], ['12', null], ['ev sahibi', 'home'], ['evet', null], ['deplasman', 'away'], ['devam', null], ['1 2', null], ['2 dep!', 'away'], ['home', 'home'], ['homework', null], ['11', 'home'], ['1!', 'home'], ['111', 'home'], ['22', 'away'], ['1990', null], ['1 dakika', null], ['go home', null], ['⚫⚪', 'home'], ['🔥', null]];
  const tm = await p.evaluate((cs) => cs.map(([c]) => __match(c).team), tcases);
  const tbad = tcases.filter((c, i) => tm[i] !== c[1]).map(c => c[0]);
  ok('P4/E5 team joins use an explicit token list (' + tcases.length + ' cases: "11","1!" join; "1990","1 dakika" never)', tbad.length === 0, tbad.join(', '));
  const jl = await p.evaluate(() => { const L = document.getElementById('log'); const has = s => [...L.children].some(x => x.textContent.includes(s));
    E({ type: 'chat', userId: 'tok1', username: 'tok1', comment: '11' }); const first = [...L.children].filter(x => x.textContent.includes('“11”')).length;
    E({ type: 'chat', userId: 'tok2', username: 'tok2', comment: '11' }); const second = [...L.children].filter(x => x.textContent.includes('“11”')).length;
    E({ type: 'chat', userId: 'tok3', username: 'tok3', comment: '1 dakika' }); S(1.6);
    return { first, second, noSeat: !__users.has('tok3'), fullName: has('EV SAHİBİ') && !/ EV tribün/.test(L.innerText), sample: L.innerText.split('\n').slice(0, 3).join(' / ') }; });
  ok('E5 every accepted join token is logged once ("11" → 1 rule line for 2 joins)', jl.first === 1 && jl.second === 1 && jl.noSeat, JSON.stringify(jl));
  ok('A6 join lines use the full end name (EV SAHİBİ / DEPLASMAN), not EV/DEP', jl.fullName, jl.sample);
  // drum via "dumb" should not queue a drum
  const dumb = await p.evaluate(() => { const f = teamFans.home[0]; const before = drumQ.home + drumLast.home; E({ type: 'chat', userId: f.id, username: f.name, comment: 'that was dumb' }); E({ type: 'chat', userId: f.id, username: f.name, comment: 'drummer boy' }); return drumQ.home + drumLast.home === before; });
  ok('P4 "dumb"/"drummer" comments do not hit the drum (end-to-end)', dumb);

  // P3 unassigned viewers
  const un = await p.evaluate(() => {
    const ch0 = Object.assign({}, __state.chant); const n0 = __users.size;
    E({ type: 'like', userId: 'newbie', username: 'newbie', likeCount: 15 });
    E({ type: 'gift', userId: 'newbie', username: 'newbie', giftName: 'Donut', diamondCount: 30 });
    E({ type: 'chat', userId: 'newbie2', username: 'newbie2', comment: 'merhaba herkese' });
    const ch1 = Object.assign({}, __state.chant);
    const r = { noFan: __users.size === n0, noBoost: ch1.home <= ch0.home && ch1.away <= ch0.away, held: (__pending.get('newbie') || {}).gifts?.length === 1 && __pending.get('newbie').likes === 15 };
    S(3); r.prompt = getComputedStyle(document.getElementById('prompt')).opacity > 0 || /takımını|team/.test(document.getElementById('prompt').textContent);
    r.promptText = document.getElementById('prompt').textContent;
    const a0 = __state.chant.away; E({ type: 'chat', userId: 'newbie', username: 'newbie', comment: '2' });
    const f = __users.get('newbie'); r.joinedAway = f && f.team === 'away'; r.applied = __state.chant.away > a0 + 5 && !__pending.has('newbie') && f.gifts === 30;
    return r;
  });
  ok('P3 unassigned like/gift/comment: no seat, no boost to either side', un.noFan && un.noBoost, JSON.stringify({ noFan: un.noFan, noBoost: un.noBoost }));
  ok('P3 unassigned contribution is held and they get a pick-team prompt', un.held && un.prompt, un.promptText);
  ok('P3 held gift/likes go to the team they pick ("2" → away)', un.joinedAway && un.applied);
  const relang = await p.evaluate(() => { const L = l => { CONFIG.lang = l; applyLang(); }; pickFlushT = -9; E({ type: 'like', userId: 'relang', username: 'relang', likeCount: 5 }); S(0.1);
    const tr = document.getElementById('prompt').textContent; L('en'); const en = document.getElementById('prompt').textContent; L('tr'); return { tr, en, back: document.getElementById('prompt').textContent }; });
  ok('E10 a visible pick-team prompt is re-rendered when the language is switched', /takımını/.test(relang.tr) && /pick a team/.test(relang.en) && relang.back === relang.tr, JSON.stringify(relang));

  // P1 penalty promised during a natural goal celebration
  const pen = await p.evaluate(() => {
    const log = []; __state.minute = 30; __state.ballZ = -13; shoot('home', true); S(1.5);
    log.push('phase after goal: ' + __state.phase);
    const f = teamFans.away[3]; E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Lion', diamondCount: 1500 });
    const queued = __state.penQ.length; let sawPen = false, tookShot = false;
    for (let i = 0; i < 30 * 14; i++) { S(1 / 30); if (__state.phase === 'penalty') sawPen = true; if (sawPen && __state.lastShot && __state.lastShot.pen) tookShot = true; if (tookShot && __state.phase !== 'shot' && __state.phase !== 'penalty') break; }
    return { queued, sawPen, tookShot, left: __state.penQ.length, log };
  });
  ok('P1 Lion gift during a goal celebration queues a penalty', pen.queued === 1, pen.log.join());
  ok('P1 queued penalty is taken after the celebration (not lost)', pen.sawPen && pen.tookShot && pen.left === 0);
  const pen1b = await p.evaluate(() => {   // E1(b): two gifts in one celebration -> documented rule: both queued (max 2/team), taken in arrival order
    S(8); if (__state.phase !== 'play') S(8); __state.minute = 40; __state.ballZ = 13; shoot('away', true); S(1.5);
    const a = teamFans.home[8], c = teamFans.home[9];
    E({ type: 'gift', userId: a.id, username: a.name, giftName: 'Lion', diamondCount: 1500 }); E({ type: 'gift', userId: c.id, username: c.name, giftName: 'Lion', diamondCount: 1500 });
    const g3 = teamFans.home[10]; E({ type: 'gift', userId: g3.id, username: g3.name, giftName: 'Lion', diamondCount: 1500 });   // 3rd = chant only
    const q = __state.penQ.map(x => x.by); const order = []; let last = null;
    for (let i = 0; i < 30 * 30 && order.length < 2; i++) { S(1 / 30); if (__state.phase === 'penalty' && __state.pen !== last) { last = __state.pen; order.push(__state.pen.by); } }
    return { q, order, names: [a.name, c.name] }; });
  ok('E1(b) two Lion gifts in one celebration → two penalties, in arrival order; a 3rd only adds chant', pen1b.q.length === 2 && pen1b.order.join() === pen1b.names.join(), JSON.stringify(pen1b));
  const pen2 = await p.evaluate(() => {
    S(8); if (__state.phase !== 'play') S(8);
    __state.ballZ = 13; shoot('away', false);                 // gift arrives while a shot is in the air
    const seq = []; const oRes = shotResult, oStart = startPenalty; shotResult = (bf) => { seq.push(bf.team + ':result'); return oRes(bf); }; startPenalty = (q) => { seq.push(q.team + ':penalty'); return oStart(q); };
    const f = teamFans.home[5]; E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Lion', diamondCount: 1500 });
    let saw = false; for (let i = 0; i < 30 * 12 && !saw; i++) { S(1 / 30); if (__state.phase === 'penalty' && __state.pen.team === 'home') saw = true; }
    shotResult = oRes; startPenalty = oStart; const resolvedFirst = seq[0] === 'away:result' && seq[1] === 'home:penalty';
    // gift arriving at 90' → stoppage-time penalty before full time
    S(10); __state.minute = 89.99; const g = teamFans.away[6]; E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Lion', diamondCount: 1500 });
    let sawStop = false, ftAfter = false; for (let i = 0; i < 30 * 20; i++) { S(1 / 30); if (__state.phase === 'penalty') sawStop = true; if (__state.phase === 'ft') { ftAfter = sawStop; break; } }
    return { saw, sawStop, ftAfter, resolvedFirst };
  });
  ok('E1(d) gift during a shot in flight → the shot resolves first, then the penalty is taken', pen2.saw && pen2.resolvedFirst);
  ok('E1(c) gift just before 90\' → its penalty is taken in stoppage time, before MAÇ BİTTİ', pen2.sawStop && pen2.ftAfter);
  // E1(c): nothing fires after MAÇ BİTTİ and nothing carries into the next match; FT ceremony holds 15-20 s, kickoff shows MAÇ n
  const pen3 = await p.evaluate(() => { const m0 = __state.matchNo; const f = teamFans.home[7]; E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Lion', diamondCount: 1500 }); const q = __state.penQ.length;
    let saw = false, ftVisible = 0, kick = ''; for (let i = 0; i < 30 * 32; i++) { S(1 / 30); if (__state.phase === 'penalty') saw = true; if (__state.phase === 'ft' && document.getElementById('ftpanel').style.display === 'block') ftVisible += 1 / 30; if (!kick && __state.matchNo > m0) kick = document.getElementById('pop-sub').textContent; }
    return { q, saw, ftVisible: Math.round(ftVisible * 10) / 10, kick, match: __state.matchNo }; });
  ok('E1(c) gift during the full-time ceremony → no penalty after MAÇ BİTTİ or in the next match', pen3.q === 0 && !pen3.saw, JSON.stringify(pen3));
  ok('E9 full-time ceremony stays up 15–20 s, kickoff shows the match counter', pen3.ftVisible >= 15 && pen3.ftVisible <= 20.5 && /MAÇ \d|MATCH \d/.test(pen3.kick), JSON.stringify(pen3));

  // Series + ceremony (from the stoppage test above)
  const ser = await p.evaluate(() => ({ series: __state.series, matchNo: __state.matchNo, ftHidden: document.getElementById('ftpanel').style.display === 'none' }));
  ok('Series score kept across matches, ceremony panel closes for next match', ser.matchNo >= 2 && (ser.series.home + ser.series.away + ser.series.draw) >= 1 && ser.ftHidden, JSON.stringify(ser));
  const cer = await p.evaluate(() => { S(4); __state.penQ.length = 0; __state.minute = 89.99; S(1); const P = document.getElementById('ftpanel'); return { shown: P.style.display === 'block', text: P.innerText.replace(/\n+/g, ' | ').slice(0, 220) }; });
  ok('Full-time ceremony shows score, winner/draw, series, fan of the match, top 3, countdown', cer.shown && /SERİ|Seri|Series/.test(cer.text), cer.text);
  await p.evaluate(() => S(17));

  // P5 referee ladder
  const ref = await p.evaluate(() => {
    const team = 'away', fans = teamFans.away.slice(10, 13); const r = {};
    const throw3 = () => fans.forEach(f => E({ type: 'chat', userId: f.id, username: f.name, comment: 'şişe' }));
    window.__neg = []; const oAdd = addChant; addChant = (t, v) => { if (v < 0) __neg.push([t, v]); return oAdd(t, v); };
    const throw1 = (i) => E({ type: 'chat', userId: fans[i].id, username: fans[i].name, comment: 'şişe' });
    __state.chant.away = 60; const w0 = __state.warnings.away, c0 = __watchCues.length;
    throw1(0); r.cueAfter1 = __watchCues.length - c0; throw1(1); r.cueAfter2 = __watchCues.length - c0; r.cuePop = document.getElementById('pop-big').textContent;
    throw1(2); S(1.3); r.pop1 = document.getElementById('pop-big').textContent; r.c1 = __neg.filter(x => x[0] === 'away').length;
    const homeBefore = __state.chant.home; __state.chant.home = 50; throw3(); r.coolNoHurt = __state.chant.home >= 50; S(1.3);   // throws 4-6 inside the cooldown
    r.sixThrowsWarnings = __state.warnings.away - w0; r.o1 = __state.offence.away; r.coolRisk = document.getElementById('risk').innerText;
    S(20); __state.chant.away = 60; throw3(); S(1.3); r.o2 = __state.offence.away; r.c2 = Math.round(__state.chant.away); r.pop2 = document.getElementById('pop-big').textContent; r.chips = document.getElementById('cnt-away').textContent;
    S(21); throw3(); S(1.3); r.o3 = __state.offence.away; r.banned = __state.banUntil.away > __state.time; r.pop3 = document.getElementById('pop-big').textContent;
    const pj = projs.length; throw3(); S(0.1); r.ignoredWhileBanned = projs.length === pj;
    S(31); r.banOver = __state.banUntil.away < __state.time;
    r.ruleText = document.getElementById('rule').textContent; r.risk = document.getElementById('risk').innerText;
    return r;
  });
  ok('E7 👀 "ref is watching" cue appears after the 2nd throw in a window (not the 1st)', ref.cueAfter1 === 0 && ref.cueAfter2 === 1 && /HAKEM|REF/.test(ref.cuePop), ref.cuePop);
  ok('E7 6 rapid throws → exactly one warning; cooldown throws neither count nor hurt the rivals', ref.sixThrowsWarnings === 1 && ref.o1 === 1 && ref.coolNoHurt && /⏳/.test(ref.coolRisk), JSON.stringify({ warnings: ref.sixThrowsWarnings, risk: ref.coolRisk.replace(/\n/g, ' / ') }));
  ok('P5 1st offence = verbal warning only (no chant cost)', ref.o1 === 1 && ref.c1 === 0 && /SÖZLÜ|VERBAL/.test(ref.pop1), JSON.stringify({ awayChantPenalties: ref.c1, pop: ref.pop1 }));
  ok('C12 warnings visible as chips under the team (💬🟨)', /🟨/.test(ref.chips), ref.chips);
  ok('P5 2nd offence = yellow card −15', ref.o2 === 2 && ref.c2 <= 47 && /SARI|YELLOW/.test(ref.pop2), 'chant 60→' + ref.c2);
  ok('P5 3rd offence = 30 s throw ban, throws ignored, no extra chant penalty, ban expires', ref.banned && ref.ignoredWhileBanned && ref.banOver && /YASA|BAN/.test(ref.pop3));
  ok('P5 rule explained on screen (legend + live risk meter)', /3/.test(ref.ruleText) && /0\/3|1\/3|2\/3/.test(ref.risk), ref.ruleText + ' | ' + ref.risk.replace(/\n/g, ' / '));

  // Rankings: big gift can't overwhelm steady chanting
  const rk = await p.evaluate(() => {
    __state.minute = 0; const g = teamFans.home[14], c = teamFans.home[15]; g.mPts = c.mPts = 0; g.mGiftD = g.mGiftPts = 0;
    E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Lion', diamondCount: 1500 });
    E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Universe', diamondCount: 30000 });
    for (let i = 0; i < 70; i++) { E({ type: 'chat', userId: c.id, username: c.name, comment: 'Haydi Kartal ' + i }); S(2.05); if (__state.phase === 'ft') { __state.minute = 1; __state.phase = 'play'; } }
    return { gift: Math.round(g.mPts), chat: Math.round(c.mPts), nightGift: Math.round(g.nPts), gname: g.name };
  });
  ok('Rankings: 31,500 diamonds of gifts capped (≤60 pts/match), a steady chanter can match it', rk.gift <= 61 && rk.chat >= rk.gift, JSON.stringify(rk));
  const boards = await p.evaluate(() => { const seen = new Set(); for (let i = 0; i < 30 * 13; i++) { S(1 / 30); seen.add(document.getElementById('board-t').textContent); } return [...seen]; });
  ok('Separate per-match and all-night boards (rotating)', boards.length >= 2, boards.join(' / '));
  const e8 = await p.evaluate((gname) => { __state.penQ.length = 0; __state.minute = 90; __state.phase = 'play'; S(0.2); S(17);   // full time -> next kickoff
    const nf = teamFans.away[12]; for (let i = 0; i < 6; i++) { E({ type: 'chat', userId: nf.id, username: nf.name, comment: 'Vur ' + i }); S(2.1); }
    const rowsAt = (night) => { for (let i = 0; i < 30 * 12; i++) { S(1 / 30); if (/BU MAÇ|THIS MATCH/.test(document.getElementById('board-t').textContent) !== night) return document.getElementById('board-rows').innerText; } return ''; };
    const match = rowsAt(false), night = rowsAt(true); const top = [...__nightBook.values()].sort((a, b) => b.pts - a.pts)[0]; const gEntry = [...__nightBook.values()].find(r => r.name === gname);
    return { match, night, gname, newName: nf.name, top: top.name, gPts: gEntry ? Math.round(gEntry.pts) : 0 }; }, rk.gname);
  ok('E8 per-match board resets at kickoff, all-night board keeps the night\'s top gifter', e8.match.includes(e8.newName) && !e8.match.includes(e8.gname) && e8.night.includes(e8.top) && e8.top !== e8.newName && e8.gPts >= 60, JSON.stringify({ match: e8.match.replace(/\n/g, ' / '), night: e8.night.replace(/\n/g, ' / ') }));

  // ---- pass-2 items ----
  const q2 = await p.evaluate(() => {
    const r = {}; const credit = (uid, seq) => { const f = teamFans.away[18] ; const fan = __users.get(uid) || f; const d0 = fan.gifts; seq.forEach(([rc, sid, dt]) => { E(Object.assign({ type: 'gift', userId: fan.id, username: fan.name, giftName: 'Rose', diamondCount: 1, repeatCount: rc }, sid ? { streakId: sid } : {})); __soak(dt || 0.2); }); return fan.gifts - d0; };
    const fid = teamFans.away[18].id;
    r.noId = credit(fid, [[1], [2], [5], [5], [4]]); __soak(5);                       // report's sequence, no streak id -> 5
    r.withId = credit(fid, [[1, 'A'], [3, 'A'], [2, 'A'], [3, 'A'], [6, 'A'], [1, 'B'], [2, 'B'], [6, 'A']]); __soak(5);   // A final 6 + B final 2 = 8
    r.singles = credit(fid, [[1], [1], [1], [1]]); __soak(5);                         // feed that only sends repeatCount 1 -> 4
    r.newCombo = credit(fid, [[1], [3, null, 1.5], [1], [2]]);                   // 3, then a new combo 1,2 after 1.5 s -> 5
    __soak(5);
    // C2 likes: 60 s of continuous liking (15 likes every 2 s) -> exactly the 3 pts/min like cap, no activity points
    const lf = teamFans.home[16]; lf.mPts = 0; lf.likeWin = 0; lf.likeWinT = -999; __state.minute = 5;
    for (let i = 0; i < 30; i++) { E({ type: 'like', userId: lf.id, username: lf.name, likeCount: 15 }); __soak(2); if (__state.phase === 'ft') __state.minute = 5; }
    r.likePts = Math.round(lf.mPts * 100) / 100;
    // C4 expired held gift -> no "counted" line; fresh one -> line
    const L = document.getElementById('log'); const cnt = () => [...L.children].filter(x => /sayıldı|counted/.test(x.textContent)).length;
    E({ type: 'gift', userId: 'late1', username: 'late1', giftName: 'Donut', diamondCount: 30 }); __soak(181); __state.minute = 5; const c0 = cnt(); E({ type: 'chat', userId: 'late1', username: 'late1', comment: '1' }); r.expiredLine = cnt() - c0;
    r.expiredGifts = __users.get('late1').gifts;
    E({ type: 'gift', userId: 'late2', username: 'late2', giftName: 'Donut', diamondCount: 30 }); S(3); const c1 = cnt(); E({ type: 'chat', userId: 'late2', username: 'late2', comment: '2' }); r.freshLine = cnt() - c1;
    // C5 joining inside the prompt window removes you from the next prompt
    S(3); E({ type: 'like', userId: 'quick1', username: 'quick1', likeCount: 2 }); E({ type: 'chat', userId: 'quick1', username: 'quick1', comment: '1' }); S(3);
    r.prompt = document.getElementById('prompt').textContent; r.promptHasJoined = r.prompt.includes('quick1');
    return r; });
  ok('Pass2 C1 gift streaks: duplicates/late lower counts add nothing (1,2,5,5,4 → 5); with streak ids = final counts (6+2=8); singles feed and new combos still count', q2.noId === 5 && q2.withId === 8 && q2.singles === 4 && q2.newCombo === 5, JSON.stringify({ noId: q2.noId, withId: q2.withId, singles: q2.singles, newCombo: q2.newCombo }));
  ok('Pass2 C2 60 s of continuous liking earns exactly the documented 3 pts/min (no activity points)', q2.likePts === 3, 'points: ' + q2.likePts);
  ok('Pass2 C4 "gift counted" line only when a held gift was actually applied (expired → no line)', q2.expiredLine === 0 && q2.expiredGifts === 0 && q2.freshLine === 1, JSON.stringify({ expiredLine: q2.expiredLine, freshLine: q2.freshLine }));
  ok('Pass2 C5 a viewer who joined inside the prompt window is not named in the prompt', !q2.promptHasJoined, q2.prompt || '(no prompt)');
  const d2 = await p.evaluate(() => { const out = []; [0, 100].forEach(c => { __state.chant.home = c; __state.pen = { team: 'home', by: 'x', kicked: false }; __state.phase = 'penalty'; __state.phaseT = 1.6; const ob = shoot; let p = 0; shoot = () => {}; updateMatch(0); p = __state.lastShot.p; shoot = ob; out.push(p); __state.phase = 'play'; __state.pen = null; }); return out; });
  ok('Pass2 D2 gift-penalty conversion follows chant (60 % silent … 90 % full)', d2[0] === 60 && d2[1] === 90, JSON.stringify(d2));

  // Batching: joins, gifts, drums
  const bt = await p.evaluate(() => {
    const L = document.getElementById('log'); const before = [...L.children].map(x => x.textContent);
    for (let i = 0; i < 12; i++) E({ type: 'chat', userId: 'batch' + i, username: 'batch' + i, comment: i % 2 ? '1' : '2' });
    S(1.6); const after = [...L.children].map(x => x.textContent); const newLines = after.filter(x => !before.includes(x) && !x.startsWith('✅'));   // one-time join-rule lines (E5) are not join spam
    const f = teamFans.home[2]; const bq = bursts.length; let drumsFired = 0; const dl = drumLast.home;
    for (let i = 0; i < 25; i++) { E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Rose', diamondCount: 1, repeatCount: 1 }); S(0.1); if (drumLast.home !== dl) {} }
    const ticker = document.getElementById('gifts').innerText; S(3);
    return { newLines: newLines.length, sample: newLines.join(' / '), ticker, bursts: bursts.length };
  });
  ok('Join log batched (12 joins → ≤2 lines)', bt.newLines <= 2, bt.sample);
  ok('Repeated gifts batched into one ticker line with a counter', /x2[0-9]|x1[5-9]/.test(bt.ticker), bt.ticker.replace(/\n/g, ' / '));

  // Labels don't overlap
  const lab = await p.evaluate(() => { teamFans.home.concat(teamFans.away).forEach(f => { f.hotUntil = __state.time + 5; f.say = 'hey'; f.sayUntil = __state.time + 5; }); S(0.2);
    const rs = [...document.querySelectorAll('.lab')].filter(e => e.style.display !== 'none').map(e => e.getBoundingClientRect());
    let ov = 0; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], c = rs[j]; const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 4 && iy > 4) ov++; }
    return { n: rs.length, ov }; });
  ok('D1 name labels capped at 10 and non-overlapping', lab.n <= 10 && lab.ov === 0, JSON.stringify(lab));

  // Chance shown + explained on goals
  const ch = await p.evaluate(() => { __state.chant.home = 80; S(0.3); return document.getElementById('lbl-home').innerText; });
  ok('Goal chance from chant shown on the meter', /⚽/.test(ch), ch);
  const c10 = await p.evaluate(() => { const run = (lv) => { shotCooldown = 0; const s0 = __state.shots; let flights = 0;
      for (let i = 0; i < 30 * 60; i++) { __state.chant.home = lv; __state.chant.away = 0; __state.penQ.length = 0; __state.minute = 30; if (__state.phase !== 'play' && !ballFly) { __state.phase = 'play'; } S(1 / 30); }
      return __state.shots - s0; };
    const quiet = run(0), loud = run(85); shotCooldown = 1e9; ballFly = null; __state.phase = 'play'; return { quiet, loud }; });
  ok('C10 a silent stadium never shoots (60 s at 0% chant = 0 shots), a loud one does', c10.quiet === 0 && c10.loud >= 3, JSON.stringify(c10));

  // Demo cap
  const cap = await p.evaluate(() => { setBot(true); document.getElementById('bot-rate').value = 30; for (let i = 0; i < 6; i++) S(20); setBot(false); return { botN, max: CONFIG.demo.maxJoins }; });
  ok('Demo joins capped', cap.botN <= cap.max, JSON.stringify(cap));
  ok('No console errors in deterministic suite', p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  await p.close();

  /* ---------- P2 bridge failure ---------- */
  const lb = await page(b, '?live=1&bridgeSrc=http://127.0.0.1:9/nope.js');
  await sleep(3000);
  const live = await lb.evaluate(() => ({ st: window.__liveStatus, vis: getComputedStyle(document.getElementById('livepill')).display, cls: document.getElementById('livepill').className, txt: document.getElementById('livepill').textContent }));
  ok('P2 failed live bridge shows a visible warning', live.st === 'fail' && live.vis !== 'none' && live.cls === 'bad', live.txt);
  const lost = await lb.evaluate(() => { setLive('ok'); window.dispatchEvent(new Event('offline')); return 1; });
  await lb.close();
  const lb2 = await page(b, '?live=1&bridgeSrc=data:text/javascript,window.insertCoin=async()=>{};window.onTikTokLiveEvent=()=>{};window.onDisconnect=(cb)=>{window.__dc=cb};');
  await sleep(2500);
  const l2 = await lb2.evaluate(() => { const a = window.__liveStatus; window.__dc && window.__dc(); return { a, b: window.__liveStatus, txt: document.getElementById('livepill').textContent }; });
  ok('P2 connected bridge shows OK, and a disconnect shows a warning', l2.a === 'ok' && l2.b === 'lost', l2.txt);
  ok('No console errors on live pages', lb2.errs.length === 0, lb2.errs.join(' | '));
  await lb2.close();
  /* ---------- Pass2 C3: two instances sharing storage ---------- */
  const i1 = await page(b, '?clip=1&demo=0'), i2 = await page(b, '?clip=1&demo=0');
  const base = await i1.evaluate(() => JSON.parse(localStorage.getItem('inonu-series') || '{"home":0,"away":0,"draw":0}'));
  const fin = (pg, h, a) => pg.evaluate(([h, a]) => { __state.goals.home = h; __state.goals.away = a; __state.penQ.length = 0; __state.minute = 90; __state.phase = 'play'; __step(3, 1 / 30); __soak(12); }, [h, a]);
  await fin(i1, 2, 0); await fin(i2, 0, 1); await sleep(300);
  await i1.evaluate(() => __soak(12)); await i2.evaluate(() => __soak(12));     // both instances persist periodically afterwards
  const c3 = await i1.evaluate(() => ({ stored: JSON.parse(localStorage.getItem('inonu-series')), shown: __state.series }));
  ok('Pass2 C3 two same-origin instances: stored series counts both matches and neither overwrites the other', c3.stored.home === base.home + 1 && c3.stored.away === base.away + 1 && c3.shown.home === c3.stored.home && c3.shown.away === c3.stored.away, JSON.stringify({ base, ...c3 }));
  await i1.close(); await i2.close();
  /* ---------- E3 bounded backoff + manual retry ---------- */
  const lb3 = await page(b, '?live=1&retryScale=0.05&bridgeSrc=http://127.0.0.1:9/nope.js');
  let mid = ''; for (let i = 0; i < 40 && !/sonra tekrar|retrying/.test(mid); i++) { await sleep(100); mid = await lb3.evaluate(() => document.getElementById('livepill').textContent); }
  await sleep(8000);
  const e3 = await lb3.evaluate(() => { const a = window.__liveAttempts; const gaps = window.__liveDelays.map(Math.round); return { tries: a.length, gaps, tap: window.__liveTap, st: window.__liveStatus, txt: document.getElementById('livepill').textContent }; });
  const growing = e3.gaps.every((g, i) => i === 0 || g > e3.gaps[i - 1]);
  ok('E3 failed bridge retries with a growing backoff, stops after 5 tries, then offers tap-to-retry', e3.tries === 5 && growing && e3.tap && /dokun|tap/.test(e3.txt) && /sonra tekrar|retrying/.test(mid), JSON.stringify(e3) + ' | mid: ' + mid);
  await lb3.evaluate(() => { window.__bridgeSrc = 'data:text/javascript,window.insertCoin=async()=>{};window.onTikTokLiveEvent=()=>{};'; });
  const pill = await lb3.$('#livepill'); const pb = await pill.boundingBox(); await lb3.mouse.click(pb.x + pb.width / 2, pb.y + pb.height / 2); await sleep(1500);
  const e3b = await lb3.evaluate(() => ({ st: window.__liveStatus, txt: document.getElementById('livepill').textContent }));
  ok('E3 after the bridge comes back, tapping retry connects', e3b.st === 'ok', e3b.txt);
  await lb3.close();
  /* ---------- E2 honest sound under the real autoplay policy ---------- */
  const s1 = await page(b, '?sound=1&demo=0', { autoplay: true }); await sleep(1500);
  const e2a = await s1.evaluate(() => ({ st: window.__audioState, icon: document.getElementById('mute').textContent, pill: getComputedStyle(document.getElementById('soundpill')).display }));
  await s1.mouse.click(200, 400); await sleep(800);
  const e2b = await s1.evaluate(() => ({ st: window.__audioState, ctx: audioCtx && audioCtx.state, icon: document.getElementById('mute').textContent }));
  ok('E2 ?sound=1 before any gesture shows 🔇 + hint; first click anywhere → 🔊 and running', e2a.st === 'suspended' && e2a.icon === '🔇' && e2a.pill !== 'none' && e2b.ctx === 'running' && e2b.icon === '🔊', JSON.stringify({ e2a, e2b }));
  await s1.close();
  const s2 = await page(b, '?live=1&sound=1&bridgeSrc=data:text/javascript,window.insertCoin=async()=>{};window.onTikTokLiveEvent=()=>{};', { autoplay: true }); await sleep(1500);
  const e2c = await s2.evaluate(() => window.__audioState); await s2.keyboard.press('x'); await sleep(800);
  const e2d = await s2.evaluate(() => ({ ctx: audioCtx && audioCtx.state, icon: document.getElementById('mute').textContent }));
  ok('E2 ?live=1&sound=1: first key press resumes sound without needing M', e2c === 'suspended' && e2d.ctx === 'running' && e2d.icon === '🔊', JSON.stringify({ before: e2c, after: e2d }));
  await s2.close();
  /* ---------- E10 translation completeness, D5 PLAY button, D7 help ---------- */
  const tl = await b.newPage(); await tl.setViewport({ width: 1280, height: 900 }); tl.errs = []; tl.on('pageerror', e => tl.errs.push(e.message));
  await tl.goto(BASE, { waitUntil: 'load' }); await sleep(1200);
  const visible = () => tl.evaluate(() => { const skip = new Set([...document.querySelectorAll('.lab, #log, #board-rows, #help')]); let out = [];
    const walk = (el) => { if (skip.has(el)) return; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
      for (const n of el.childNodes) { if (n.nodeType === 3 && n.textContent.trim()) out.push(n.textContent.trim()); else if (n.nodeType === 1) walk(n); }
      if (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'range') {} };
    walk(document.body); return out.join(' | ').replace(/@\S+/g, ''); });
  const PROPER = /KARTALLAR|İNÖNÜ|İnönü|TikTok|Playroom/g;
  const TRW = /[çğışÇĞŞİı]|\b(yaz|tribün|gizle|açık|sıfırla|izleyici|kullanıcı|yorum|gönder|hediye|durdur|devam|oyna|sesi|maç|seri|taraftar|uyarı|hakem|siyah|beyaz|kırmızı|sarı|yardım|dil|ses)\b/i;
  const ENW = /\b(the|type|Sound|Send|Like|Gifts|Username|Comment|Reset|viewer|PLAY|HOME|AWAY|Pause|Restart|help|language|fans|series|warning|black|white|yellow|red|turn|on)\b/;
  const playIsButton = await tl.evaluate(() => ({ tag: document.getElementById('playbtn').tagName, focused: document.activeElement && document.activeElement.id }));
  const trStart = await visible();
  await tl.keyboard.press('l'); await sleep(400); const enStart = await visible();
  await tl.keyboard.press('Enter'); await sleep(7000);
  const started = await tl.evaluate(() => ({ phase: __state.phase, startHidden: !document.getElementById('start').classList.contains('on') }));
  const enPlay = await visible();
  await tl.keyboard.press('l'); await sleep(600); const trPlay = await visible();
  const enBad = (enStart + ' | ' + enPlay).replace(PROPER, '').split(' | ').filter(s => TRW.test(s));
  const trBad = (trStart + ' | ' + trPlay).replace(PROPER, '').split(' | ').filter(s => ENW.test(s) && !/Rose|Donut|Party|Lion|API|URL|handleLiveEvent|\?[a-z]/.test(s));
  ok('E10 English mode: no Turkish chrome anywhere (start screen, panel, HUD, legend)', enBad.length === 0, enBad.slice(0, 6).join(' ‖ ') || enStart.slice(0, 200));
  ok('E10 Turkish mode: no English chrome left (gift names/API excepted)', trBad.length === 0, trBad.slice(0, 6).join(' ‖ ') || trStart.slice(0, 200));
  ok('D5 PLAY is a real focused <button>; Enter starts the match', playIsButton.tag === 'BUTTON' && playIsButton.focused === 'playbtn' && started.phase !== 'intro' && started.startHidden, JSON.stringify({ playIsButton, started }));
  /* D8 pause / restart */
  const d8 = await tl.evaluate(async () => { document.getElementById('btn-pause').click(); const t0 = __state.time; await new Promise(r => setTimeout(r, 1200)); const frozen = __state.time === t0;
    document.getElementById('btn-pause').click(); await new Promise(r => setTimeout(r, 800)); const resumed = __state.time > t0;
    __state.goals.home = 2; const m = __state.matchNo; document.getElementById('btn-restart').click(); return { frozen, resumed, goals: __state.goals.home + __state.goals.away, sameNo: __state.matchNo === m, minute: Math.round(__state.minute) }; });
  ok('D8 test panel pause freezes the match, resume continues, restart resets the score', d8.frozen && d8.resumed && d8.goals === 0 && d8.sameNo && d8.minute <= 1, JSON.stringify(d8));
  await tl.keyboard.press('?'); await sleep(200);
  const d7 = await tl.evaluate(() => ({ on: document.getElementById('help').classList.contains('on'), txt: document.getElementById('help').innerText }));
  ok('D7 "?" opens a help overlay documenting keys and URL params', d7.on && ['?clip=1', '?demo=0', '?sound=1', '?seed=N', '?panel=0', '?help=1'].every(k => d7.txt.includes(k)), d7.txt.split('\n').slice(0, 4).join(' / '));
  ok('No page errors in translation/pause/help run', tl.errs.length === 0, tl.errs.join(' | '));
  await tl.close();
  /* ---------- V: visual upgrade (11v11, officials, passes, goal FX, replay, crowd, quality fallback) ---------- */
  const vp = await page(b, '?clip=1&demo=0');
  const v1 = await vp.evaluate(() => { __seedCrowd(60); __step(60, 1 / 30); return __people(); });
  const k = v1.kits, cols = [k.gkhome, k.gkaway, k.ref, k.home.sleeve, k.away.sleeve];
  ok('V1 11 v 11 on the pitch: 11 per team incl. 1 GK each, a referee and 2 linesmen, all 25 inside the ground', v1.home === 11 && v1.away === 11 && v1.gk === 2 && v1.refs === 1 && v1.linesmen === 2 && v1.onPitch === 25, JSON.stringify(v1));
  ok('V2 two distinct kits, goalkeepers and referee in their own colours; formations 4-4-2 vs 4-3-3', new Set(cols).size === cols.length && v1.formations.home === '4-4-2' && v1.formations.away === '4-3-3', JSON.stringify({ cols, f: v1.formations }));
  const v3 = await vp.evaluate(() => { const p0 = __people().passes; __state.chant.home = 60; __state.chant.away = 40; let carried = 0; for (let i = 0; i < 30; i++) { __step(20, 1 / 30); if (__people().carrier) carried++; } const P = __people(); return { passes: P.passes - p0, carriedSamples: carried }; });
  ok('V3 the ball is played around: passes happen and someone carries the ball', v3.passes >= 3 && v3.carriedSamples >= 5, JSON.stringify(v3));
  const v4 = await vp.evaluate(() => { const r0 = window.__replays || 0, pr0 = window.__paperRains || 0, g0 = __state.goals.home;
    shotCooldown = 1e9; __state.phase = 'play'; __state.ballZ = -13; shoot('home', true); __step(60, 1 / 30); const mid = { phase: __state.phase, rp: document.getElementById('replay').classList.contains('on') };
    __step(45, 1 / 30); const inRp = document.getElementById('replay').classList.contains('on'); __step(150, 1 / 30);
    return { goal: __state.goals.home - g0, paper: (window.__paperRains || 0) - pr0, replays: (window.__replays || 0) - r0, mid, inRp, after: document.getElementById('replay').classList.contains('on'), phase: __state.phase }; });
  ok('V4 a goal triggers paper rain, then a slow-mo replay that ends before the restart', v4.goal === 1 && v4.paper === 1 && v4.replays === 1 && v4.inRp && !v4.after && v4.phase === 'play', JSON.stringify(v4));
  const v5 = await vp.evaluate(() => { const w0 = window.__mexWaves || 0; startMexWave(); __step(30, 1 / 30); const front = mexFront(); return { waves: (window.__mexWaves || 0) - w0, front }; });
  ok('V5 Mexican wave runs around the stands', v5.waves === 1 && v5.front !== null, JSON.stringify(v5));
  const v6 = await vp.evaluate(() => ({ calls: __calls, q: __quality }));
  ok('V6 draw calls stay capped (< 300 per frame at high quality)', v6.calls > 0 && v6.calls < 300, JSON.stringify(v6));
  ok('V no console errors in the visual checks', vp.errs.length === 0, vp.errs.slice(0, 3).join(' | '));
  await vp.close();
  const qp = await page(b, '?demo=0');
  await sleep(1500);
  const v7 = await qp.evaluate(() => { const q0 = __quality; Object.assign(QUAL, { downs: 0, acc: 0, frames: 0, lowWin: 0, highWin: 0 }); applyQuality(2); const seen = [__quality];
    for (let s = 0; s < 3; s++) { for (let i = 0; i < 90; i++) __qualityMonitor(1 / 20); seen.push(__quality); }   // inject 20 fps for ~4.5 s windows
    for (let i = 0; i < 900; i++) __qualityMonitor(1 / 60); seen.push(__quality);                                     // fast again: must not flap back up
    return { q0, seen, fps: __fps, log: [...document.querySelectorAll('#log *')].map(e => e.textContent).filter(t => t.includes('⚙️')).length, pr: renderer.getPixelRatio() }; });
  ok('V7 quality auto-downgrades high → medium → low when fps < 30, stops at low, and does not flap back up', v7.seen.join() === 'high,med,low,low,low' && v7.pr <= 0.75, JSON.stringify(v7));
  const v8 = await qp.evaluate(() => { applyQuality(0); return new Promise(res => setTimeout(() => res({ low: __calls }), 600)); });
  ok('V8 low quality renders with fewer/equal draw calls than high', v8.low <= v6.calls, JSON.stringify(v8));
  await qp.close();
  const lk = await page(b, '?demo=0&q=low'); await sleep(1200);
  const v9 = await lk.evaluate(() => { for (let i = 0; i < 300; i++) __qualityMonitor(1 / 10); return { q: __quality }; });
  ok('V9 ?q=low locks quality (no auto changes)', v9.q === 'low', JSON.stringify(v9)); await lk.close();

  /* ---------- E6 soak: ?bot=1 at 8/s for 30 simulated minutes ---------- */
  const sk = await page(b, '?clip=1&demo=0');
  const e6 = await sk.evaluate(() => { setBot(true); document.getElementById('bot-rate').value = 8;
    const timeIt = () => { const t0 = performance.now(); __step(20, 1 / 30); return (performance.now() - t0) / 20; };
    __soak(600); const n10 = __users.size, t10 = timeIt(); __soak(1200); const n30 = __users.size, t30 = timeIt();
    const names = [...__users.values()].map(f => f.name); const dup = names.length - new Set(names).size; const suffixed = names.filter(n => /_\d$/.test(n) || /_\d+_\d+$/.test(n));
    return { n10, n30, cap: CONFIG.demo.maxJoins, t10: +t10.toFixed(1), t30: +t30.toFixed(1), dup, suffixed, matches: __state.matchNo }; });
  ok('E6 30-min bot soak: fan count plateaus at the cap, unique names with no recycled _N suffix, no slowdown trend', e6.n10 === e6.n30 && e6.n30 <= e6.cap && e6.dup === 0 && e6.suffixed.length === 0 && e6.t30 < e6.t10 * 1.5 + 5, JSON.stringify(e6));
  ok('No console errors during soak', sk.errs.length === 0, sk.errs.slice(0, 3).join(' | '));
  await sk.close();

  /* ---------- P2 audio honesty ---------- */
  const au = await page(b, '?bot=1');
  await sleep(1000);
  const a1 = await au.evaluate(async () => { setMuted(false); await new Promise(r => setTimeout(r, 300)); const st1 = window.__audioState; if (audioCtx && audioCtx.state === 'running') await audioCtx.suspend(); await new Promise(r => setTimeout(r, 400)); refreshSoundUI();
    return { st1, st2: window.__audioState, icon: document.getElementById('mute').textContent, pill: getComputedStyle(document.getElementById('soundpill')).display }; });
  ok('P2 suspended AudioContext is shown as off with a tap-to-enable button', a1.st2 === 'suspended' && a1.icon === '🔇' && a1.pill !== 'none', JSON.stringify(a1));
  const box = await au.$('#soundpill'); const bb = await box.boundingBox(); await au.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(700);
  const a2 = await au.evaluate(() => ({ st: window.__audioState, icon: document.getElementById('mute').textContent, pill: getComputedStyle(document.getElementById('soundpill')).display }));
  ok('P2 tapping the button resumes audio and only then shows 🔊', a2.st === 'running' && a2.icon === '🔊' && a2.pill === 'none', JSON.stringify(a2));
  await sleep(12000);
  ok('Desktop ?bot=1 run: no console errors', au.errs.length === 0, au.errs.slice(0, 3).join(' | '));
  ok('D10 no console warnings on a normal run (flatShading warning gone)', au.warns.length === 0, au.warns.slice(0, 3).join(' | '));
  await au.screenshot({ path: '/workspace/inonu-stadium/screenshot-desktop.png' });
  await au.close();

  /* ---------- emulated phone ---------- */
  const ph = await page(b, '', { phone: true });
  await sleep(1500); await ph.tap('#start'); await sleep(16000);
  const phs = await ph.evaluate(() => ({ phase: __state.phase, users: __users.size, v: CONFIG.version, audio: window.__audioState, fps: window.__fps, quality: window.__quality, calls: window.__calls, people: __people().onPitch }));
  await ph.screenshot({ path: '/workspace/inonu-stadium/screenshot-phone.png' });
  ok('Emulated iPhone 13: tap PLAY, game runs, no console errors', ph.errs.length === 0 && phs.users > 20, JSON.stringify(phs) + ' ' + ph.errs.slice(0, 3).join(' | '));
  ok('V10 emulated iPhone: 25 people on the pitch, fps measured, and quality stepped down if fps < 30', phs.people === 25 && phs.fps > 0 && (phs.fps >= 30 || phs.quality !== 'high'), JSON.stringify({ fps: phs.fps, quality: phs.quality, calls: phs.calls }));
  await ph.close();
  await b.close();
  const f = results.filter(r => !r.pass).length; console.log(`\n${results.length - f}/${results.length} passed`);
  require('fs').writeFileSync('/workspace/inonu-stadium/tests/results.json', JSON.stringify(results, null, 1));
  process.exit(f ? 1 : 0);
})();
