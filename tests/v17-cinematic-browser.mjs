// v1.7 Pyramid camera-only QA: no credit, boss HP or phase transitions.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8769/index.html?demo=0&panel=0&calm=0&speed=1&visualQA=1',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__game&&window.__v17Preview,{timeout:35000});
  const report=await page.evaluate(()=>{
    const s=window.__game;
    const before=JSON.stringify({bossHP:s.bossHP,phase:s.phase,
      sun:s.teams.sun.blocks,nile:s.teams.nile.blocks});
    const started=window.__v17Preview('layer','sun');
    const shot=window.__v17CameraState();
    const unchanged=before===JSON.stringify({bossHP:s.bossHP,phase:s.phase,
      sun:s.teams.sun.blocks,nile:s.teams.nile.blocks});
    const calmWas=CONFIG.calmEffects; CONFIG.calmEffects=true;
    const calmBlocked=!window.__v17Preview('layer','nile');
    CONFIG.calmEffects=calmWas;
    return {started,shot,unchanged,calmBlocked,
      overflow:document.documentElement.scrollWidth-innerWidth,
      canvas:document.querySelectorAll('canvas').length};
  });
  await page.waitForTimeout(850);
  const view=await page.evaluate(()=>window.__v17CameraState());
  await page.screenshot({path:'browser-evidence/pyramid-v17-stone-focus.png',fullPage:true});
  if(!report.started||!report.shot.active||!report.unchanged||
     !report.calmBlocked||view.zoom<=1||report.canvas<1||report.overflow>4||errors.length)
    throw Error('Pyramid v1.7 camera QA failed: '+JSON.stringify({report,view,errors}));
  console.log('Pyramid v1.7 cinematic QA passed',JSON.stringify({report,view}));
 }finally{await page.close()}
}finally{await browser.close()}
