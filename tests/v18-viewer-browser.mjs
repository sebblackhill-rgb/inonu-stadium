// v1.8: true attack/penalty state drives an actionable spectator cue.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
 '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8768/index.html?clip=1&demo=0&panel=0&lang=en',
    {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&window.__v18Pressure,{timeout:35000});
  const report=await page.evaluate(()=>{
   window.__step(210,1/30);
   const s=window.__state,before=JSON.stringify(s.goals),card=document.getElementById('v18-pressure');
   s.phase='penalty';s.pen={team:'home',kicked:false};window.__v18Pressure();
   const penalty={visible:card.classList.contains('on'),head:document.getElementById('v18-pressure-head').textContent};
   s.phase='play';s.pen=null;s.ballZ=-PL*0.75;s.chant.home=100;window.__v18Pressure();
   const attack={visible:card.classList.contains('on'),head:document.getElementById('v18-pressure-head').textContent,
     detail:document.getElementById('v18-pressure-detail').textContent};
   s.chant.home=0;s.ballZ=0;window.__v18Pressure();
   const hidden=!card.classList.contains('on');
   s.phase='play';s.chant.home=100;s.ballZ=-PL*0.75;window.__v18Pressure();
   updateCamera(0.5);updateCamera(0.5);updateCamera(0.5);renderer.render(scene,camera);
   return {penalty,attack,hidden,noScoreChange:before===JSON.stringify(s.goals),
     canvas:document.querySelectorAll('canvas').length,
     overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:'browser-evidence/inonu-v18-attack-instruction.png',fullPage:true});
  if(!report.penalty.visible||!report.penalty.head.includes('PENALTY')||
    !report.attack.visible||!report.attack.head.includes('ATTACKING')||
    !report.attack.detail.includes('DRUM')||!report.hidden||!report.noScoreChange||
    report.canvas<1||report.overflow>4||errors.length)
   throw Error('Inonu v1.8 viewer QA failed '+JSON.stringify({report,errors}));
  console.log('Inonu v1.8 spectator cue passed',JSON.stringify(report));
 }finally{await page.close()}
}finally{await browser.close()}
