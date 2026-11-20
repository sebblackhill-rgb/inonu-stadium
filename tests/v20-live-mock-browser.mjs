// v2.0 simulated provider fixture — explicitly NOT a real TikTok LIVE test.
import {chromium} from "playwright-core";
import {readFile,mkdir} from "node:fs/promises";
const mock=await readFile(new URL("./v20-mock-bridge.js",import.meta.url),"utf8");
await mkdir("browser-evidence",{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",
  headless:true,args:["--no-sandbox","--disable-dev-shm-usage",
  "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 try{
   await page.route("**/playroomkit/multiplayer.full.umd.js",route=>
     route.fulfill({status:200,contentType:"application/javascript",body:mock}));
   await page.goto("http://127.0.0.1:8769/index.html?live=1&demo=0&panel=0&bot=0&lang=en",
      {waitUntil:"domcontentloaded",timeout:30000});
   await page.waitForFunction(()=>
     !!window.__mockTikTok && window.__mockTikTok.active()===1 &&
     !!window.__v20Health && !!(window.__game && window.__ledger),
     {timeout:60000});
   const outcome=await page.evaluate(()=>{
      const transport=window.__mockTikTok;
      const base={userId:"fixture-v20",name:"FixtureViewer",username:"FixtureViewer"};
      const read=()=>(window.__game?.users?.get('fixture-v20')?.diamonds || 0);
      transport.emit("chat",{...base,msgId:"ch-fixture-1",comment:"SUN"});
      const joined=read();
      transport.emit("gift",{...base,msgId:"gift-fixture-1",giftName:"Rose",
        giftDiamondCount:1,diamondCount:1,repeatCount:1,repeatEnd:true,groupId:"streak-fixture"});
      const one=read();
      transport.emit("gift",{...base,msgId:"gift-fixture-1",giftName:"Rose",
        giftDiamondCount:1,diamondCount:1,repeatCount:1,repeatEnd:true,groupId:"streak-fixture"});
      const two=read();
      const health=window.__v20Health();
      return {transportMock:transport.mock,active:transport.active(),joined,
        firstCredit:one,duplicateCredit:two,health,overflow:document.documentElement.scrollWidth-innerWidth,
        canvas:document.querySelectorAll("canvas").length};
   });
   await page.screenshot({path:"browser-evidence/pyramid-v20-live-mock.png",fullPage:true});
   if(!outcome.transportMock||outcome.active!==1||outcome.firstCredit<=0||
     outcome.duplicateCredit!==outcome.firstCredit||
     outcome.health.providerContractVerified!==false||
     outcome.health.verifiedPaidGiftSettlement!==false||
     outcome.health.receivedEvents<3||outcome.canvas<1||
     outcome.overflow>4||errors.length)
     throw Error("pyramid mock LIVE duplicate test failed "+JSON.stringify({outcome,errors}));
   console.log("pyramid v2.0 mocked provider validation passed",
     JSON.stringify({firstCredit:outcome.firstCredit,duplicateCredit:outcome.duplicateCredit,
       healthEvents:outcome.health.receivedEvents}));
 }finally{await page.close()}
}finally{await browser.close()}
