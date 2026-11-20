// v1.9: reusable stadium wave / genuine late-match instructions remain presentation-only.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
'--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto('http://127.0.0.1:8768/index.html?clip=1&demo=0&panel=0&lang=en&visualQA=1',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&window.__v19WavePreview,{timeout:35000});
  const report=await page.evaluate(()=>{
    window.__step(210,1/30);
    const s=window.__state, before=JSON.stringify(s.goals), start=window.__mexWaves||0;
    s.phase='play';
    const result=window.__v19WavePreview('home');
    renderV18Pressure();
    const rally={result,waves:(window.__mexWaves||0)-start,
      text:document.getElementById('v18-pressure-head').textContent};
    s.minute=84;s.ballZ=-PL*0.75;s.chant.home=95;V19_WAVE.until=0;
    renderV18Pressure(); const close=document.getElementById('v18-pressure-head').textContent;
    const unchanged=before===JSON.stringify(s.goals);
    updateCamera(0.5);renderer.render(scene,camera);
    return {rally,close,unchanged,canvas:document.querySelectorAll('canvas').length,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:'browser-evidence/inonu-v19-final-attack.png',fullPage:true});
  if(!report.rally.result||report.rally.waves!==1||
    !report.rally.text.includes('WAVING')||!report.close.includes('FINAL ATTACK')||
    !report.unchanged||report.canvas<1||report.overflow>4||errors.length)
   throw Error('Inonu v1.9 QA failed '+JSON.stringify({report,errors}));
  console.log('Inonu v1.9 stadium-wave QA passed',JSON.stringify(report));
 } finally {await page.close()}
} finally {await browser.close()}
