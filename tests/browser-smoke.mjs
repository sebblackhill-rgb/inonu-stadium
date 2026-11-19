// Real Chromium Pyramid staging smoke; no TikTok account and no actual gifts.
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
try {
 for(const [name,viewport] of [['portrait',{width:390,height:844}],['broadcast',{width:1080,height:1920}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8769/index.html?demo=0&panel=0&calm=1&speed=1',
     {waitUntil:'load',timeout:35000});
   await page.waitForFunction(()=>window.__game&&typeof window.handleLiveEvent==='function'&&window.THREE,
     {timeout:30000});
   const report=await page.evaluate(()=>{
     const s=window.__game;
     const joined=handleLiveEvent({type:'chat',userId:'qa-joined',username:'QA Viewer',comment:'SUN',source:'test'});
     const fan=s.users.get('qa-joined');
     const gifted=handleLiveEvent({type:'gift',userId:'qa-gifted',username:'QA Gift',giftName:'Rose',diamondCount:1,repeatCount:1,source:'test'});
     const before=s.users.get('qa-gifted');
     const held=!!before&&before.pending.length>0;
     handleLiveEvent({type:'chat',userId:'qa-gifted',username:'QA Gift',comment:'NILE',source:'test'});
     const claimed=s.users.get('qa-gifted')?.diamonds===1;
     const bad=handleLiveEvent({type:'gift',userId:'qa-invalid',username:'Invalid',giftName:'Lion',diamondCount:-4,source:'test'});
     const invalidExcluded=!s.users.has('qa-invalid');
     const mode=s.mode;s.mode='live';
     const testLive=handleLiveEvent({type:'gift',userId:'qa-test-live',username:'QA',giftName:'Rose',diamondCount:1,source:'test'});
     s.mode=mode;
     const noHostCredit=!s.users.has('qa-test-live');
     s.mode='live';s.conn.st='down';
     // Inspect the empty-crew waiting card without discarding the test participants.
     const savedUsers=s.users;s.users=new Map();
     renderWaiting();
     const outageLabel=document.getElementById('wait-t').textContent;
     const outageCorrect=/CONNECTION UNAVAILABLE/.test(outageLabel);
     s.users=savedUsers;renderBoard();
     const publicBoardExcludesTest=!document.getElementById('board').textContent.includes('QA Gift');
     s.mode=mode;s.conn.st='off';renderWaiting();renderBoard();
     const gaps=window.__conservation();
     refreshUI();
     const mission=document.getElementById('mission');
     const rect=(id)=>document.getElementById(id).getBoundingClientRect();
     const meters=rect('meters'),objective=rect('mission'),left=rect('leftcol'),board=rect('board'),stage=rect('stage');
     const missionVisible=mission?.textContent?.includes('NEXT MILESTONE') &&
       getComputedStyle(mission).display!=='none';
     const objectiveLayout=objective.top>=meters.bottom-1 &&
       objective.bottom<=left.top+1 && objective.bottom<=board.top+1 &&
       objective.left>=stage.left && objective.right<=stage.right;
     return {joined:fan?.team==='sun',held,claimed,missionVisible,objectiveLayout,
       rejected:bad?.outcome==='rejected',invalidExcluded,
       noHostCredit,liveTestRejected:testLive?.outcome==='rejected',
       outageCorrect,publicBoardExcludesTest,
       finite:Number.isFinite(s.time)&&Number.isFinite(s.bossHP),
       gapSun:gaps.sun?.gap,gapNile:gaps.nile?.gap,
       overflow:document.documentElement.scrollWidth-innerWidth,
       canvas:document.querySelectorAll('canvas').length,
       phase:s.phase};
   });
   await page.screenshot({path:'browser-evidence/pyramid-'+name+'.png',fullPage:true});
   console.log(name,JSON.stringify({report,errors}));
   if(!report.joined||!report.held||!report.claimed||!report.missionVisible||!report.objectiveLayout||!report.rejected||
      !report.invalidExcluded||!report.noHostCredit||!report.liveTestRejected||
      !report.outageCorrect||!report.publicBoardExcludesTest||
      !report.finite||report.gapSun!==0||report.gapNile!==0||
      report.canvas<1||report.overflow>4||errors.length)
      throw Error('Pyramid Chrome staging failed: '+name);
  }finally{await page.close()}
 }
}finally{await browser.close()}
console.log('Pyramid Chrome staging passed');
