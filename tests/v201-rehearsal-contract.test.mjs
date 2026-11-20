// v2.0.1 desktop readiness checks never certify real paid gifts or OBS performance.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../src/v201-rehearsal.js",import.meta.url),"utf8");
function setup({local=true,loss=0,samples=20,p95=16.7,mode="test"}={}){
 let mounted;
 const rect={width:390,height:844};
 const window={
   V20Ops:{report:()=>({game:"qa",mode,bridgeConnection:mode==="live"?"live":"sandbox",
     frame:{samples,p95Ms:p95,estimatedP95Fps:p95?Math.round(1000/p95):null},
     webgl:{lost:loss,restored:0}})}
 };
 const document={readyState:"loading",addEventListener:(name,fn)=>{mounted=fn},
   querySelector:q=>q==="canvas"?{getBoundingClientRect:()=>rect}:null,
   getElementById:()=>null};
 const context={window,document,location:{hostname:local?"localhost":"example.invalid",
   protocol:local?"http:":"file:",search:""},Date,URLSearchParams,Blob,
   setTimeout:()=>1,console};
 vm.createContext(context);vm.runInContext(src,context);
 return {inspect:window.__v201Preflight,mount:mounted,context};
}
test("Read-only checks never certify genuine gift settlement",()=>{
 const {inspect}=setup();const data=inspect();
 assert.equal(data.tool,"v2.0.1");
 assert.equal(data.approvedForProduction,false);
 assert.equal(data.actualTikTokGiftContractVerified,false);
 assert.equal(data.controlledPaidGiftReceiptsReconciled,false);
 assert.equal(data.liveHardwareOBSValidated,false);
 assert.equal(data.checks.length,9);
 assert.equal(data.checks.find(c=>c.id==="webgl").state,"OK");
 assert.equal(data.checks.find(c=>c.id==="frame").state,"OK");
 assert.equal(data.checks.find(c=>c.id==="gifts").state,"OPEN");
 assert(!/username|userId|giftName|photoUrl/.test(JSON.stringify(data)));
});
test("Slow software renderer, missing samples and context loss are warnings, not false passes",()=>{
 const a=setup({loss:1,samples:30,p95:260}).inspect();
 assert.equal(a.checks.find(c=>c.id==="webgl").state,"WARN");
 assert.equal(a.checks.find(c=>c.id==="frame").state,"WARN");
 const b=setup({samples:1,local:false}).inspect();
 assert.equal(b.checks.find(c=>c.id==="render").state,"WAIT");
 assert.equal(b.checks.find(c=>c.id==="local").state,"WARN");
});
test("Even a connected LIVE bridge requires controlled proof of paid gifts",()=>{
 const data=setup({mode:"live"}).inspect();
 assert.equal(data.checks.find(c=>c.id==="bridge").state,"CHECK");
 assert.equal(data.checks.find(c=>c.id==="gifts").state,"OPEN");
 assert.equal(data.approvedForProduction,false);
});
