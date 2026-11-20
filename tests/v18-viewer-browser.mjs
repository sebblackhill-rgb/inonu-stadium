// v1.8: real stone-hauling progress and free participation remain account-neutral.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
 '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8769/index.html?demo=0&panel=0&calm=1&speed=1',
   {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__game&&window.__v18Heave,{timeout:35000});
  const report=await page.evaluate(()=>{
   const s=window.__game,before={phase:s.phase,bossHP:s.bossHP,round:s.round};
   const el=document.getElementById('v18-heave');
   window.__v18Heave();const join=document.getElementById('v18-heave-title').textContent;
   handleLiveEvent({type:'chat',userId:'viewer18',username:'Viewer',comment:'SUN',source:'test'});
   const T=s.teams.sun;T.pts=CONFIG.pullsPerBlock/2;T.delivering=0;s.time=0;
   window.__v18Heave();
   const halfway={title:document.getElementById('v18-heave-title').textContent,
      width:parseFloat(document.getElementById('v18-heave-fill').style.width)};
   T.delivering=1;window.__v18Heave();
   const transit=el.classList.contains('delivering')&&/STONE EN ROUTE/.test(document.getElementById('v18-heave-title').textContent);
   T.delivering=0;s.phase='boss';s.bossMax=1000;s.bossHP=750;window.__v18Heave();
   const boss=el.classList.contains('boss')&&/DEFEAT APEP/.test(document.getElementById('v18-heave-title').textContent);
   return {join,halfway,transit,boss,bossHP:s.bossHP,roundUnchanged:s.round===before.round,
      overflow:document.documentElement.scrollWidth-innerWidth,
      canvas:document.querySelectorAll('canvas').length};
  });
  await page.screenshot({path:'browser-evidence/pyramid-v18-crew-instruction.png',fullPage:true});
  if(!report.join.includes('JOIN A CREW')||!report.halfway.title.includes('SUN')||
    Math.abs(report.halfway.width-50)>0.1||!report.transit||!report.boss||
    !report.roundUnchanged||report.canvas<1||report.overflow>4||errors.length)
    throw Error('Pyramid v1.8 viewer QA failed '+JSON.stringify({report,errors}));
  console.log('Pyramid v1.8 free-action and cargo QA passed',JSON.stringify(report));
 }finally{await page.close()}
}finally{await browser.close()}
