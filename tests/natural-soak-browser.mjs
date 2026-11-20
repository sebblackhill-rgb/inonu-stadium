// Natural wall-time browser soak: uses 30 seconds of elapsed time on GitHub's Chrome.
// This is neither a physical-phone FPS benchmark nor a real TikTok feed.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8769/index.html?demo=0&speed=1&calm=1&panel=0',{waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__game && window.__conservation && typeof window.advanceBuildLogic==='function',{timeout:35000});
  const before=await page.evaluate(()=>{
   const s=window.__game;
   const a=handleLiveEvent({source:'test',type:'chat',userId:'soak-builder',username:'Soak Builder',comment:'SUN'});
   const gift=handleLiveEvent({source:'test',type:'gift',userId:'soak-builder',username:'Soak Builder',
      giftName:'Lion',diamondCount:1500,repeatCount:1});
   return {wall:performance.now(),clock:s.time,blocks:s.teams.sun.blocks,diamonds:s.users.get('soak-builder')?.diamonds,
      chatOutcome:a.outcome,giftOutcome:gift.outcome,earned:s.teams.sun.earned};
  });
  await page.waitForTimeout(30000); // intentional real elapsed time, not accelerated update steps
  const after=await page.evaluate(()=>{
   const s=window.__game,u=s.users.get('soak-builder'),gaps=window.__conservation();
   return {wall:performance.now(),clock:s.time,phase:s.phase,blocks:s.teams.sun.blocks,
      delivered:s.teams.sun.delivered,diamonds:u?.diamonds,
      gapSun:gaps.sun.gap,gapNile:gaps.nile.gap,
      users:s.users.size,canvas:document.querySelectorAll('canvas').length,
      overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  await page.screenshot({path:'browser-evidence/pyramid-30s-natural-soak.png',fullPage:true});
  const wallDelta=(after.wall-before.wall)/1000,gameDelta=after.clock-before.clock;
  const summary={before,after,wallSeconds:wallDelta,gameSeconds:gameDelta,
    gameToWallRatio:gameDelta/wallDelta,errors};
  console.log('Pyramid natural soak:',JSON.stringify(summary));
  if(before.diamonds!==1500 || before.chatOutcome!=='applied' ||
     after.diamonds!==1500 || after.blocks<=before.blocks ||
     !Number.isFinite(after.delivered)||Math.abs(after.gapSun)>0.001||Math.abs(after.gapNile)>0.001||
     after.canvas<1||after.overflow>4||gameDelta<wallDelta*0.75||gameDelta>wallDelta*1.2||errors.length)
    throw Error('Natural 30-second Pyramid clock, gift or contribution soak failed');
 }finally{await page.close()}
}finally{await browser.close()}
console.log('Pyramid 30-second natural-time browser soak passed');
