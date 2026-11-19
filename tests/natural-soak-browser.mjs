// Natural 20-second staging Chrome soak for Inonu's wall-clock update engine.
// No TikTok live feed, real-device GPU benchmark or physical OBS included.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8768/index.html?demo=0&panel=0&q=low',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&typeof window.__sim==='object',{timeout:35000});
  const before=await page.evaluate(()=>({t:performance.now(),game:window.__state.time,minute:window.__state.minute}));
  await page.waitForTimeout(20000);
  const after=await page.evaluate(()=>{
   const s=window.__state;
   return {t:performance.now(),game:s.time,minute:s.minute,phase:s.phase,
     renderCalls:window.__calls??null,reportedFps:window.__fps??null,
     goalHome:s.goals.home,goalAway:s.goals.away,canvas:document.querySelectorAll('canvas').length,
     overflow:document.documentElement.scrollWidth-innerWidth,
     pendingDebt:window.__sim.debt};
  });
  await page.screenshot({path:'browser-evidence/inonu-20s-natural-soak.png',fullPage:true});
  const wall=(after.t-before.t)/1000,logic=after.game-before.game;
  console.log('Inonu natural soak:',JSON.stringify({before,after,wall,logic,ratio:logic/wall,errors}));
  if(wall<19||logic<wall*0.75||logic>wall*1.2||!Number.isFinite(after.minute)||
     !Number.isFinite(after.pendingDebt)||after.canvas<1||after.overflow>4||errors.length)
    throw Error('Inonu natural wall-clock 20-second soak failed');
 }finally{await page.close()}
}finally{await browser.close()}
console.log('Inonu natural-time 20s browser soak passed');
