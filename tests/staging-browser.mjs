// Real Chromium smoke checks for staging, not a TikTok LIVE connection test.
// CI launches Chrome, loads the assembled index.html and saves actual screenshots.
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const ROOT = "http://127.0.0.1:8768/index.html";
const OUT = "browser-evidence";
await mkdir(OUT,{recursive:true});
const executablePath=process.env.CHROME_PATH || "/usr/bin/google-chrome";
const browser=await chromium.launch({
  executablePath,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
});
const records=[];
try{
 for(const [name,viewport] of [["portrait",{width:390,height:844}],["broadcast",{width:1080,height:1920}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",msg=>{if(msg.type()==="error") errors.push(msg.text())});
  try {
    await page.goto(ROOT+"?clip=1&demo=0&panel=0&lang=en",{waitUntil:"load",timeout:35000});
    await page.waitForFunction(()=>typeof window.handleLiveEvent==="function" && !!window.__state && !!window.__users,{timeout:30000});
    const result=await page.evaluate(()=>{
      const id="e2e-"+Math.random().toString(16).slice(2);
      const state=window.__state,users=window.__users;
      window.handleLiveEvent({type:"chat",userId:id,username:"QA Viewer",comment:"1"});
      const fan=users.get(id);
      if(!fan)return{joined:false,scoreFinite:false};
      const pre=fan.gifts||0;
      window.handleLiveEvent({type:"gift",userId:id,username:"QA Viewer",giftName:"Rose",diamondCount:-5,repeatCount:1});
      const rejected=(fan.gifts||0)===pre;
      window.handleLiveEvent({type:"gift",userId:id,username:"QA Viewer",giftName:"Rose",diamondCount:1,repeatCount:1});
      const accepted=(fan.gifts||0)>pre;
      const numeric=[state.momentum,state.ballZ,state.chant.home,state.chant.away,state.goals.home,state.goals.away];
      const overflow=document.documentElement.scrollWidth-window.innerWidth;
      return {joined:fan.team==="home",rejected,accepted,finite:numeric.every(Number.isFinite),overflow,
        canvas:document.querySelectorAll("canvas").length,
        liveUrl:location.search.includes("live=1"),version:document.title};
    });
    await page.screenshot({path:`${OUT}/inonu-${name}.png`,fullPage:true});
    records.push({name,result,errors});
    console.log(name,JSON.stringify({result,errors}));
    if(!result.joined || !result.rejected || !result.accepted || !result.finite || result.overflow>4 || result.canvas<1 || result.liveUrl || errors.length)
       throw Error("Failed real-browser staging acceptance for "+name);
  }finally{await page.close()}
 }
}finally{await browser.close()}
console.log("Chromium smoke checks passed for two layouts");
