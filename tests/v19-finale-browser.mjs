// v1.9: bounded worker poses and truthful critical boss prompt, no credit mutation.
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
  await page.goto('http://127.0.0.1:8769/index.html?demo=0&panel=0&calm=0&speed=1&visualQA=1',
   {waitUntil:'load',timeout:35000});
  await page.waitForFunction(()=>window.__game&&window.__v19CrewPreview,{timeout:35000});
  const report=await page.evaluate(()=>{
    const s=window.__game;
    handleLiveEvent({type:'chat',userId:'v19-qa',username:'TestCrew',comment:'SUN',source:'test'});
    const u=s.users.get('v19-qa');
    if(!u||u.team!=='sun')throw Error('Test crew join failed');
    u.inst=0; // staged visual-only pose slot, no actual gift or 3D asset added
    const before=JSON.stringify({round:s.round,blocks:s.teams.sun.blocks,
      points:s.teams.sun.pts,diamonds:u.diamonds});
    const count=window.__v19CrewPreview('sun');
    const poseTimestamp=u._v19CelebrateUntil;
    const noCredit=before===JSON.stringify({round:s.round,blocks:s.teams.sun.blocks,
      points:s.teams.sun.pts,diamonds:u.diamonds});
    s.phase='boss';s.bossMax=1000;s.bossHP=180;
    window.__v18Heave();
    const el=document.getElementById('v18-heave');
    const finale={classOn:el.classList.contains('final-push'),
      title:document.getElementById('v18-heave-title').textContent,
      health:s.bossHP};
    renderer.render(scene,camera);
    return {count,poseTimestamp,noCredit,finale,
      canvas:document.querySelectorAll('canvas').length,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:'browser-evidence/pyramid-v19-apep-final-push.png',fullPage:true});
  if(report.count<1||report.count>48||!(report.poseTimestamp>0)||!report.noCredit||
    !report.finale.classOn||!report.finale.title.includes('FINAL PUSH')||
    !report.finale.title.includes('18%')||report.finale.health!==180||
    report.canvas<1||report.overflow>4||errors.length)
    throw Error('Pyramid v1.9 QA failed '+JSON.stringify({report,errors}));
  console.log('Pyramid v1.9 finale QA passed',JSON.stringify(report));
 }finally{await page.close()}
}finally{await browser.close()}
