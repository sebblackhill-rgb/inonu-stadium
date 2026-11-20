// Accelerated complete Pyramid build -> Apep -> victory -> next round.
// This is a functional browser rehearsal, not real elapsed LIVE or a hardware FPS benchmark.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8769/index.html?demo=0&panel=0&speed=1&calm=1',{waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__game&&window.__game.teams?.sun&&typeof window.advanceBuildLogic==='function',{timeout:35000});
  const summary=await page.evaluate(()=>{
   const s=window.__game,C=window.CONFIG;
   // Accelerate point requirements only, without skipping any block/layer placement.
   C.pullsPerBlock=1;
   const joined=handleLiveEvent({source:'test',type:'chat',userId:'qa-construction',username:'Builder',comment:'SUN'});
   const contributor=s.users.get('qa-construction');
   const gift=handleLiveEvent({source:'test',type:'gift',userId:'qa-construction',username:'Builder',
      giftName:'Lion',diamondCount:1500,repeatCount:3});
   const initial={phase:s.phase,blocks:s.teams.sun.blocks,points:s.teams.sun.pts,gifts:contributor?.diamonds};
   const phases=[s.phase]; let iter=0;
   for(;iter<180 && s.phase==='build';iter++){
      s.time+=1; updatePhase();advanceBuildLogic(1);
      if(phases.at(-1)!==s.phase)phases.push(s.phase);
   }
   const race={phase:s.phase,layers:s.teams.sun.layers,blocks:s.teams.sun.blocks,
      winner:s.raceWinner,iterations:iter,round:s.round};
   // Allow the ceremony to complete and start the full boss fight.
   if(s.phase==='race'){s.time+=5;updatePhase();phases.push(s.phase);}
   const boss={phase:s.phase,hp:s.bossHP,remaining:s.bossEnds-s.time};
   if(s.phase==='boss'){
      handleLiveEvent({source:'test',type:'gift',userId:'qa-construction',username:'Builder',
        giftName:'Lion',diamondCount:1500,repeatCount:1});
      handleLiveEvent({source:'test',type:'gift',userId:'qa-construction',username:'Builder',
        giftName:'Lion',diamondCount:1500,repeatCount:1});
      phases.push(s.phase);
   }
   const victory={phase:s.phase,winner:s.winner,slayer:s.slayer,
      bossHP:s.bossHP,contributorMedals:contributor?.medals};
   const conservation=window.__conservation();
   if(s.phase==='victory'){s.time+=13;updatePhase();phases.push(s.phase);}
   return {joined:joined?.outcome,initial,race,boss,victory,phases,
      next:{phase:s.phase,round:s.round,sunLayers:s.teams.sun.layers,nileLayers:s.teams.nile.layers},
      conservation,finite:[s.time,s.bossHP,s.teams.sun.blocks,s.teams.nile.blocks].every(Number.isFinite),
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:'browser-evidence/pyramid-complete-cycle.png',fullPage:true});
  console.log('Pyramid full cycle:',JSON.stringify({summary,errors}));
  const gaps=Object.values(summary.conservation).map(x=>x.gap);
  if(summary.initial.gifts!==4500 || summary.race.phase!=='race'||summary.race.layers!==36||
    summary.race.winner!=='sun'||summary.boss.phase!=='boss'||
    summary.victory.phase!=='victory'||summary.victory.winner!=='sun'||summary.victory.bossHP!==0||
    summary.next.phase!=='build'||summary.next.round!==summary.race.round+1||
    summary.next.sunLayers!==2||!summary.finite||summary.overflow>4||
    gaps.some(g=>Math.abs(g)>0.001)||errors.length)
    throw Error('Pyramid full build / boss / victory / reset acceptance failed');
 }finally{await page.close()}
}finally{await browser.close()}
console.log('Pyramid full build and Apep match cycle passed');
