// Two complete 3-minute simulated İnönü matches in Chromium.
// Logic time is advanced by the built-in source hook; this is NOT 6 minutes
// of natural wall-time play, a physical-phone benchmark or actual TikTok LIVE.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8768/index.html?clip=1&demo=0&panel=0&q=low',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&typeof window.__soak==='function',{timeout:35000});
  const init=await page.evaluate(()=>{
    const s=window.__state;
    window.__seedCrowd(36);
    s.phase='play';s.minute=0;s.phaseT=0;
    s.chant.home=0;s.chant.away=0;
    return {matchNo:s.matchNo,series:{...s.series}};
  });
  const ft=await page.evaluate(()=>{
    window.__soak(184,0.05);
    const s=window.__state;
    const series={...s.series};
    const before=document.getElementById('ftpanel').innerText;
    CONFIG.lang='en';applyLang();
    const after=document.getElementById('ftpanel').innerText;
    return {phase:s.phase,minute:s.minute,series,matchNo:s.matchNo,
      ftVisible:document.getElementById('ftpanel').style.display==='block',
      languageChanged:before!==after,finite:[s.momentum,s.ballZ,s.time,s.goals.home,s.goals.away].every(Number.isFinite)};
  });
  await page.screenshot({path:'browser-evidence/inonu-full-time.png',fullPage:true});
  const restart=await page.evaluate(()=>{
    window.__soak(18,0.05);
    const s=window.__state;
    return {phase:s.phase,minute:s.minute,series:{...s.series},matchNo:s.matchNo,
      warnings:{...s.warnings},bans:{...s.banUntil},
      ftHidden:document.getElementById('ftpanel').style.display==='none'};
  });
  await page.screenshot({path:'browser-evidence/inonu-next-match.png',fullPage:true});
  const ft2=await page.evaluate(()=>{
    window.__soak(183,0.05);
    const s=window.__state;
    return {phase:s.phase,series:{...s.series},matchNo:s.matchNo,
      finite:[s.momentum,s.ballZ,s.time].every(Number.isFinite)};
  });
  const sum=x=>x.home+x.away+x.draw;
  console.log(JSON.stringify({init,ft,restart,ft2,errors}));
  if(ft.phase!=='ft'||!ft.ftVisible||!ft.finite||
    sum(ft.series)!==sum(init.series)+1||
    !restart.ftHidden||restart.phase!=='play'||restart.matchNo<=init.matchNo||
    Object.values(restart.warnings).some(x=>x!==0)||
    !ft2.finite||sum(ft2.series)!==sum(init.series)+2||errors.length)
    throw Error('Inonu two full simulated match cycles failed');
 }finally{await page.close()}
}finally{await browser.close()}
console.log('Inonu two complete logic-timed match cycles passed');
