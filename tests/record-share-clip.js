const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const OUT = '/tmp/inonu/clip'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 900000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); await p.setViewport({ width: 540, height: 960, deviceScaleFactor: 4 / 3 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///workspace/inonu-stadium/index.html?clip=1&intro=1.5', { waitUntil: 'load' });
  await p.evaluate(() => {
    __seedCrowd(200); __step(1); shotCooldown = 999; window.__t0 = __state.time; window.__bed = [];
    window.E = (type, id, name, extra) => handleLiveEvent(Object.assign({ type, userId: id, username: name }, extra || {}));
    window.homeFan = (i) => teamFans.home[i % teamFans.home.length]; window.awayFan = (i) => teamFans.away[i % teamFans.away.length];
  });
  // storyboard: frame -> actions (30 fps, 300 frames = 10 s)
  const S = {
    0: () => { pickFlushT = -9; E('like', 'v1', 'pablo_34', { likeCount: 15 }); E('gift', 'v1', 'pablo_34', { giftName: 'Rose', diamondCount: 1 }); },
    4: () => { E('chat', 'v2', 'ayse.bjk', { comment: '1' }); E('chat', 'v3', 'mert_dep', { comment: '2' }); for (let i = 0; i < 8; i++) { const f = awayFan(i * 3); E('chat', f.id, f.name, { comment: 'Deplasmanda biz varız!' }); } },
    10: () => { E('chat', 'v4', 'deniz.kartal', { comment: 'ev' }); E('chat', 'v6', 'burak.away', { comment: 'dep' }); E('chat', 'v5', 'zeynep_ist', { comment: '1' }); },
    24: () => { for (let i = 0; i < 8; i++) { const f = homeFan(i * 3); E('chat', f.id, f.name, { comment: ['Vur gol!', 'Ole ole', 'Haydi Kartal!'][i % 3] }); } startMexWave(); },
    36: () => { E('chat', 'v1', 'pablo_34', { comment: 'Haydi Kartal!' }); E('like', 'v2', 'ayse.bjk', { likeCount: 10 }); __state.momentum = 0.85; __state.ballZ = -10; },
    44: () => { for (let i = 0; i < 8; i++) { const f = homeFan(i * 2 + 1); E('chat', f.id, f.name, { comment: 'Haydi!' }); } E('chat', 'v4', 'deniz.kartal', { comment: 'davul' }); },
    54: () => { for (let i = 0; i < 6; i++) { const f = homeFan(i * 5 + 2); E('chat', f.id, f.name, { comment: 'Gol gol!' }); } __state.ballZ = -12; },
    66: () => { __state.ballZ = -13; __state.lastShot = { c: Math.round(__state.chant.home), p: Math.round(goalChance('home') * 100) }; shoot('home', true); },
    100: () => { E('chat', 'v4', 'deniz.kartal', { comment: 'davul' }); E('chat', 'v1', 'pablo_34', { comment: 'meşale' }); },
    108: () => { E('chat', 'v2', 'ayse.bjk', { comment: 'meşale' }); for (let i = 0; i < 3; i++) { const f = homeFan(i * 5 + 2); E('chat', f.id, f.name, { comment: 'meşale' }); } },
    140: () => { E('chat', 'v3', 'mert_dep', { comment: 'şişe' }); E('chat', 'v5', 'zeynep_ist', { comment: 'davul' }); },
    250: () => { for (let i = 0; i < 6; i++) { const f = homeFan(i * 4); E('chat', f.id, f.name, { comment: 'Şampiyon!' }); } E('chat', 'v8', 'kerem_bjk', { comment: '1' }); E('chat', 'v7', 'selin.live', { comment: '2' }); startMexWave(); },
    264: () => { showPop('KATIL!', '1 = EV  ·  2 = DEP  👉 LIVE', 'home', 1.4, 'small', 4); },
  };
  for (let fr = 0; fr < 300; fr++) {
    if (S[fr]) await p.evaluate(S[fr].toString().replace(/^\(\) => /, '') .replace(/^/, '(() => ').concat(')()'));
    await p.evaluate(() => { __step(1, 1 / 30); __bed.push({ t: __state.time - __t0, v: 0.05 + (__state.chant.home + __state.chant.away) / 200 * 0.25 + (__state.phase === 'celebrate' ? 0.2 : 0) }); });
    await p.screenshot({ path: `${OUT}/f${String(fr).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
    if (fr % 25 === 0) console.log('frame', fr, await p.evaluate(() => JSON.stringify({ ph: __state.phase, pt: +__state.phaseT.toFixed(1), g: __state.goals, rp: replay.on, c: [__state.chant.home | 0, __state.chant.away | 0] })));
  }
  const wav = await p.evaluate(async () => { const t0 = __t0; __sfxLog.forEach(e => e.t -= t0); return await __renderAudio(10, __bed); });
  fs.writeFileSync('/tmp/inonu/clip.wav', Buffer.from(wav, 'base64'));
  console.log('errors:', errs.join('\n') || 'none'); await b.close();
})();
