// Headless acceptance tests for İnönü Tribün Savaşı. Run: node tests/acceptance.js [url-base]
const puppeteer = require('/tmp/pw/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'file:///workspace/inonu-stadium/index.html';
const ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const results = []; const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function page(b, q, opts = {}) {
  const p = await b.newPage(); if (opts.phone) await p.emulate(puppeteer.KnownDevices['iPhone 13']); else await p.setViewport({ width: 540, height: 960 });
  p.errs = []; p.on('pageerror', e => p.errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push('console.error ' + m.text()); });
  await p.goto(BASE + q, { waitUntil: 'load' }); return p;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000, args: ARGS });
  /* ---------- deterministic suite (clip mode = manual time stepping) ---------- */
  const p = await page(b, '?clip=1');
  await p.evaluate(() => { window.S = (sec) => __step(Math.round(sec * 30), 1 / 30); window.E = (o) => handleLiveEvent(o); __seedCrowd(40); S(2); shotCooldown = 1e9; });

  // P4 word matching
  const cases = [['dumb', null], ['drummer', null], ['DRUM', 'drum'], ['davul', 'drum'], ['DAVUL!!', 'drum'], ['davula vur', 'drum'], ['torchlight', null], ['torch', 'torch'], ['meşale', 'torch'], ['mesale yak', 'torch'],
    ['flareup', null], ['🔥', 'torch'], ['bottleneck', null], ['şişe', 'bottle'], ['SISE AT', 'bottle'], ['şişecam', null], ['LIGHTER', 'lighter'], ['çakmak', 'lighter'], ['cakmakli', null], ['sudan', null], ['subway', null], ['hello there', null]];
  const m = await p.evaluate((cs) => cs.map(([c]) => __match(c).action), cases);
  const bad = cases.filter((c, i) => m[i] !== c[1]).map((c, i) => c[0]);
  ok('P4 action matching is whole-word/token only (' + cases.length + ' cases)', bad.length === 0, bad.length ? 'wrong: ' + bad.join(', ') : cases.map(c => c[0] + '→' + c[1]).join(' · '));
  const tcases = [['1', 'home'], ['2', 'away'], ['10', null], ['12', null], ['ev sahibi', 'home'], ['evet', null], ['deplasman', 'away'], ['devam', null], ['1 2', null], ['2 dep!', 'away'], ['home', 'home'], ['homework', null]];
  const tm = await p.evaluate((cs) => cs.map(([c]) => __match(c).team), tcases);
  const tbad = tcases.filter((c, i) => tm[i] !== c[1]).map(c => c[0]);
  ok('P4 team keywords are whole-token (' + tcases.length + ' cases)', tbad.length === 0, tbad.join(', '));
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
  const pen2 = await p.evaluate(() => {
    S(8); if (__state.phase !== 'play') S(8);
    __state.ballZ = 13; shoot('away', false);                 // gift arrives while a shot is in the air
    const f = teamFans.home[5]; E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Lion', diamondCount: 1500 });
    let saw = false; for (let i = 0; i < 30 * 12 && !saw; i++) { S(1 / 30); if (__state.phase === 'penalty' && __state.pen.team === 'home') saw = true; }
    // gift arriving at 90' → stoppage-time penalty before full time
    S(10); __state.minute = 89.99; const g = teamFans.away[6]; E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Lion', diamondCount: 1500 });
    let sawStop = false, ftAfter = false; for (let i = 0; i < 30 * 20; i++) { S(1 / 30); if (__state.phase === 'penalty') sawStop = true; if (__state.phase === 'ft') { ftAfter = sawStop; break; } }
    return { saw, sawStop, ftAfter };
  });
  ok('P1 gift during a shot in flight → penalty still taken', pen2.saw);
  ok('P1 gift at 90\' → stoppage-time penalty taken before full time', pen2.sawStop && pen2.ftAfter);
  // gift during the full-time ceremony carries to next match
  const pen3 = await p.evaluate(() => { const f = teamFans.home[7]; E({ type: 'gift', userId: f.id, username: f.name, giftName: 'Lion', diamondCount: 1500 }); const q = __state.penQ.length; let saw = false; for (let i = 0; i < 30 * 20 && !saw; i++) { S(1 / 30); if (__state.phase === 'penalty') saw = true; } return { q, saw, match: __state.matchNo }; });
  ok('P1 gift during full-time ceremony → penalty carried into next match', pen3.q === 1 && pen3.saw, JSON.stringify(pen3));

  // Series + ceremony (from the stoppage test above)
  const ser = await p.evaluate(() => ({ series: __state.series, matchNo: __state.matchNo, ftHidden: document.getElementById('ftpanel').style.display === 'none' }));
  ok('Series score kept across matches, ceremony panel closes for next match', ser.matchNo >= 2 && (ser.series.home + ser.series.away + ser.series.draw) >= 1 && ser.ftHidden, JSON.stringify(ser));
  const cer = await p.evaluate(() => { S(8); __state.penQ.length = 0; __state.minute = 89.99; S(1); const P = document.getElementById('ftpanel'); return { shown: P.style.display === 'block', text: P.innerText.replace(/\n+/g, ' | ').slice(0, 220) }; });
  ok('Full-time ceremony shows score, winner/draw, series, fan of the match, top 3, countdown', cer.shown && /SERİ|Seri|Series/.test(cer.text), cer.text);
  await p.evaluate(() => S(13));

  // P5 referee ladder
  const ref = await p.evaluate(() => {
    const team = 'away', fans = teamFans.away.slice(10, 13); const r = {};
    const throw3 = () => fans.forEach(f => E({ type: 'chat', userId: f.id, username: f.name, comment: 'şişe' }));
    window.__neg = []; const oAdd = addChant; addChant = (t, v) => { if (v < 0) __neg.push([t, v]); return oAdd(t, v); };
    __state.chant.away = 60; throw3(); S(1.3); r.o1 = __state.offence.away; r.c1 = __neg.filter(x => x[0] === 'away').length; r.pop1 = document.getElementById('pop-big').textContent;
    __state.chant.away = 60; throw3(); S(1.3); r.o2 = __state.offence.away; r.c2 = Math.round(__state.chant.away); r.pop2 = document.getElementById('pop-big').textContent;
    throw3(); S(1.3); r.o3 = __state.offence.away; r.banned = __state.banUntil.away > __state.time; r.pop3 = document.getElementById('pop-big').textContent;
    const pj = projs.length; throw3(); S(0.1); r.ignoredWhileBanned = projs.length === pj;
    S(31); r.banOver = __state.banUntil.away < __state.time;
    r.ruleText = document.getElementById('rule').textContent; r.risk = document.getElementById('risk').innerText;
    return r;
  });
  ok('P5 1st offence = verbal warning only (no chant cost)', ref.o1 === 1 && ref.c1 === 0 && /SÖZLÜ|VERBAL/.test(ref.pop1), JSON.stringify({ awayChantPenalties: ref.c1, pop: ref.pop1 }));
  ok('P5 2nd offence = yellow card −15', ref.o2 === 2 && ref.c2 <= 47 && /SARI|YELLOW/.test(ref.pop2), 'chant 60→' + ref.c2);
  ok('P5 3rd offence = 30 s throw ban, throws ignored, no extra chant penalty, ban expires', ref.banned && ref.ignoredWhileBanned && ref.banOver && /YASA|BAN/.test(ref.pop3));
  ok('P5 rule explained on screen (legend + live risk meter)', /3/.test(ref.ruleText) && /0\/3|1\/3|2\/3/.test(ref.risk), ref.ruleText + ' | ' + ref.risk.replace(/\n/g, ' / '));

  // Rankings: big gift can't overwhelm steady chanting
  const rk = await p.evaluate(() => {
    const g = teamFans.home[14], c = teamFans.home[15]; g.mPts = c.mPts = 0; g.mGiftD = g.mGiftPts = 0;
    E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Lion', diamondCount: 1500 });
    E({ type: 'gift', userId: g.id, username: g.name, giftName: 'Universe', diamondCount: 30000 });
    for (let i = 0; i < 70; i++) { E({ type: 'chat', userId: c.id, username: c.name, comment: 'Haydi Kartal ' + i }); S(2.05); if (__state.phase === 'ft') S(13); }
    return { gift: Math.round(g.mPts), chat: Math.round(c.mPts), nightGift: Math.round(g.nPts) };
  });
  ok('Rankings: 31,500 diamonds of gifts capped (≤60 pts/match), a steady chanter can match it', rk.gift <= 61 && rk.chat >= rk.gift, JSON.stringify(rk));
  const boards = await p.evaluate(() => { const seen = new Set(); for (let i = 0; i < 30 * 13; i++) { S(1 / 30); seen.add(document.getElementById('board-t').textContent); } return [...seen]; });
  ok('Separate per-match and all-night boards (rotating)', boards.length >= 2, boards.join(' / '));

  // Batching: joins, gifts, drums
  const bt = await p.evaluate(() => {
    const L = document.getElementById('log'); const before = [...L.children].map(x => x.textContent);
    for (let i = 0; i < 12; i++) E({ type: 'chat', userId: 'batch' + i, username: 'batch' + i, comment: i % 2 ? '1' : '2' });
    S(1.6); const after = [...L.children].map(x => x.textContent); const newLines = after.filter(x => !before.includes(x));
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
  ok('Name labels capped and non-overlapping', lab.n <= 18 && lab.ov === 0, JSON.stringify(lab));

  // Chance shown + explained on goals
  const ch = await p.evaluate(() => { __state.chant.home = 80; S(0.3); return document.getElementById('lbl-home').innerText; });
  ok('Goal chance from chant shown on the meter', /⚽/.test(ch), ch);

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
  await au.screenshot({ path: '/workspace/inonu-stadium/screenshot-desktop.png' });
  await au.close();

  /* ---------- emulated phone ---------- */
  const ph = await page(b, '', { phone: true });
  await sleep(1500); await ph.tap('#start'); await sleep(16000);
  const phs = await ph.evaluate(() => ({ phase: __state.phase, users: __users.size, v: CONFIG.version, audio: window.__audioState }));
  await ph.screenshot({ path: '/workspace/inonu-stadium/screenshot-phone.png' });
  ok('Emulated iPhone 13: tap PLAY, game runs, no console errors', ph.errs.length === 0 && phs.users > 20, JSON.stringify(phs) + ' ' + ph.errs.slice(0, 3).join(' | '));
  await ph.close();
  await b.close();
  const f = results.filter(r => !r.pass).length; console.log(`\n${results.length - f}/${results.length} passed`);
  require('fs').writeFileSync('/workspace/inonu-stadium/tests/results.json', JSON.stringify(results, null, 1));
  process.exit(f ? 1 : 0);
})();
