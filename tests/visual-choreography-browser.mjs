// Deterministic goal-score animation proof from the actual stadium.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8768/index.html?clip=1&demo=0&panel=0&lang=en',{waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__state&&typeof window.handleLiveEvent==='function',{timeout:35000});
  // Clip mode freezes rAF: advance the actual 3D stadium intro to the pitch
  // before judging a goal camera/scoreboard screenshot.
  await page.evaluate(()=>window.__step(210,1/30));
  const result=await page.evaluate(()=>{
   const s=window.__state,score=document.getElementById('score');
   const before={...s.goals};
   // Script is a non-module assembled build; this is a test-only match event.
   goal('home');
   const afterGoal={...s.goals};
   const goalClass=score.classList.contains('goal-home');
   pulseGoalScore('home'); // re-trigger only the visual animation
   refreshHUD(); // commit the visible score in this frozen clip-mode test
   const visualOnly=s.goals.home===afterGoal.home&&s.goals.away===afterGoal.away;
   const animation=getComputedStyle(score).animationName;
   const visibleScore=document.getElementById('goals').textContent;
   return {goalClass,visualOnly,visibleScore,goalCount:afterGoal.home-before.home,
     animation,phase:s.phase,canvasCount:document.querySelectorAll('canvas').length,
     overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.waitForTimeout(220);
  await page.screenshot({path:'browser-evidence/inonu-v16-goal-beat.png',fullPage:true});
  console.log('Inonu goal visual beat',JSON.stringify({result,errors}));
  if(!result.goalClass||!result.visualOnly||result.goalCount!==1||result.visibleScore!=='1 - 0'||
      !result.animation.includes('goal-score-beat')||result.canvasCount<1||result.overflow>4||errors.length)
    throw Error('Inonu goal presentation regression');
 }finally{await page.close()}
}finally{await browser.close()}
console.log('Inonu v1.6 goal spotlight passed');
