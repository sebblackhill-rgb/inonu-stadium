// v2.0 offline OBS/browser geometry and performance telemetry. Software Chrome,
// not hardware FPS evidence, and never a TikTok LIVE gift contract verification.
import {chromium} from "playwright-core";
import {mkdir,writeFile} from "node:fs/promises";
await mkdir("browser-evidence",{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",
  headless:true,args:["--no-sandbox","--disable-dev-shm-usage",
  "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const results=[];
 try {
   await page.goto("http://127.0.0.1:8768/index.html?demo=0&bot=0&panel=0&lang=en",
     {waitUntil:"domcontentloaded",timeout:30000});
   await page.waitForFunction(()=>window.__v20Health&&document.getElementById("v20-ops"),{timeout:60000});
   for(const vp of [{width:390,height:844},{width:1080,height:1920}]){
     await page.setViewportSize(vp);await page.waitForTimeout(2200);
     const r=await page.evaluate(()=>{
       const h=window.__v20Health();
       return {width:innerWidth,height:innerHeight,
         overflow:document.documentElement.scrollWidth-innerWidth,
         report:h,hostOps:!!document.getElementById("v20-ops"),
         canvas:document.querySelectorAll("canvas").length};
     });
     results.push(r);
     await page.screenshot({path:"browser-evidence/inonu-v20-obs-"+vp.width+".png",fullPage:true});
   }
   await writeFile("browser-evidence/inonu-v20-obs-health.json",
     JSON.stringify({environment:"GitHub Actions software-rendered Chrome, not device benchmark",
       liveProviderVerified:false,results},null,2));
   if(results.some(r=>r.overflow>4||!r.hostOps||r.canvas<1||
        r.report.providerContractVerified||r.report.verifiedPaidGiftSettlement||
        r.report.frame.totalRenderFrames<1)||errors.length)
     throw Error("inonu v2.0 responsive/performance QA failed "+
       JSON.stringify({results,errors}));
   console.log("inonu v2.0 OBS checks passed",JSON.stringify(results.map(r=>({
      viewport:r.width+"x"+r.height,frameP95Ms:r.report.frame.p95Ms,
      warning:r.report.warning,receivedEvents:r.report.receivedEvents}))));
 }finally{await page.close()}
}finally{await browser.close()}
