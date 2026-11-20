// v2.0.1 desktop host-panel acceptance at 1280px.
import {chromium} from "playwright-core";
import {mkdir} from "node:fs/promises";
await mkdir("browser-evidence",{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",
 headless:true,args:["--no-sandbox","--disable-dev-shm-usage",
 "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 try{
  await page.goto("http://127.0.0.1:8768/index.html?demo=0&bot=0&panel=1&lang=en",
   {waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForFunction(()=>!!window.__v201Preflight&&
    !!document.getElementById("v201-preflight")&&!!window.V20Ops,{timeout:55000});
  await page.waitForTimeout(1000);
  const report=await page.evaluate(()=>{
    const a=window.__v201Preflight(),root=document.getElementById("v201-preflight");
    const parent=root?.closest("#test-panel");
    return {tool:a.tool,approved:a.approvedForProduction,
      realPaid:a.controlledPaidGiftReceiptsReconciled,
      obs:a.liveHardwareOBSValidated,count:a.checks.length,
      gift:a.checks.find(c=>c.id==="gifts").state,
      buttons:[...root.querySelectorAll("button")].map(b=>b.textContent),
      host:!!parent,hasCanvas:!!document.querySelector("canvas"),
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await page.screenshot({path:"browser-evidence/inonu-v201-desktop-preflight.png",fullPage:true});
  if(report.tool!=="v2.0.1"||report.approved||report.realPaid||report.obs||
    report.count!==9||report.gift!=="OPEN"||!report.host||
    !report.hasCanvas||report.buttons.length!==2||
    report.overflow>4||errors.length)
    throw Error("inonu preflight failed "+JSON.stringify({report,errors}));
  console.log("inonu v2.0.1 desktop host preflight passed",JSON.stringify(report));
 }finally{await page.close()}
}finally{await browser.close()}
