// v1.7 portrait director QA: attacking and penalty framing must not mutate scores.
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
 try {
  await page.goto('http://127.0.0.1:8768/index.html?clip=1&demo=0&panel=0&lang=en',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&window.__v17CameraState,{timeout:35000});
  const report=await page.evaluate(()=>{
   window.__step(210,1/30);
   const s=window.__state,before=JSON.stringify(s.goals);
   s.phase='penalty';s.pen={team:'home',kicked:false};updateCamera(0.2);
   const penalty=window.__v17CameraState();
   s.phase='play';s.chant.home=100;s.ballZ=-1e3;updateCamera(0.2);
   const attack=window.__v17CameraState();
   s.chant.home=0;s.ballZ=0;updateCamera(0.2);
   const wide=window.__v17CameraState();
   const scoreUnchanged=before===JSON.stringify(s.goals);
   return {penalty,attack,wide,scoreUnchanged,
     canvas:document.querySelectorAll('canvas').length,
     overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:'browser-evidence/inonu-v17-penalty-framing.png',fullPage:true});
  if(!report.penalty.enabled||report.penalty.mode!=='penalty'||
     report.attack.mode!=='attack'||report.wide.mode!=='wide'||
     !report.scoreUnchanged||report.canvas<1||report.overflow>4||errors.length)
    throw Error('Inonu v1.7 camera QA failed: '+JSON.stringify({report,errors}));
  console.log('Inonu v1.7 cinematic QA passed',JSON.stringify(report));
 }finally{await page.close()}
}finally{await browser.close()}
