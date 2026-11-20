// v2.0 ops contract: no personally identifiable data, no false LIVE certification.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
const source=fs.readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/v20-ops.js"),"utf8");
function instance(q="?live=1"){
 let now=1000;
 const callbacks={};
 const panel=null;
 const window={addEventListener:(name,fn)=>callbacks[name]=fn};
 const document={addEventListener:(name,fn)=>callbacks[name]=fn,getElementById:()=>panel};
 const ctx={window,document,location:{search:q},performance:{now:()=>now},
  URLSearchParams,innerWidth:390,innerHeight:844,devicePixelRatio:2,
  setTimeout:(fn)=>1,clearTimeout:()=>{},Blob,URL};
 vm.createContext(ctx);
 vm.runInContext(source,ctx);
 return {ops:window.V20Ops,callbacks,clock:v=>now=v,window};
}
test("ops exports a privacy-safe, unverified report",()=>{
 const {ops,window}=instance();
 const r=ops.report();
 assert.equal(r.release,"v2.0-rc");
 assert.equal(r.providerContractVerified,false);
 assert.equal(r.verifiedPaidGiftSettlement,false);
 assert.equal(r.mode,"live");
 assert.equal(typeof window.__v20Health,"function");
 assert.equal(JSON.parse(ops.json()).receivedEvents,0);
 assert(!/username|userId|giftName|photoUrl|rawPayload/.test(ops.json()));
});
test("event accounting remains bounded and metadata-free",()=>{
 const {ops}=instance();
 ops.init("pyramid");
 ops.event("gift","duplicate");
 ops.event("gift","held");
 ops.event("chat","forwarded");
 ops.event("follow","rejected");
 const r=ops.report();
 assert.equal(r.receivedEvents,4);
 assert.equal(r.kinds.gift,2);
 assert.equal(r.kinds.other,1);
 assert.equal(r.processing.duplicate,1);
 assert.equal(r.processing.held,1);
 assert.equal(r.processing.rejected,1);
 assert.equal(r.game,"pyramid");
 assert.equal(r.verifiedPaidGiftSettlement,false);
});
test("90-frame p95 and WebGL loss flag never certify deployment",()=>{
 const {ops,clock,callbacks}=instance();
 for(let n=0;n<120;n++){clock(1000+n*16.7);ops.frame(1000+n*16.7);}
 let r=ops.report();
 assert.equal(r.frame.samples,119);
 assert(r.frame.p95Ms>=16&&r.frame.p95Ms<=18);
 clock(5000);ops.frame(5000); // skipped suspended tab
 assert.equal(ops.report().frame.longPauses,1);
 callbacks.webglcontextlost?.();
 assert.equal(ops.report().warning,"WEBGL_CONTEXT_LOST");
 callbacks.webglcontextrestored?.();
 assert.equal(ops.report().webgl.restored,1);
 ops.link("down");
 assert.equal(ops.report().warning,"LIVE_BRIDGE_DOWN");
 assert.equal(ops.report().providerContractVerified,false);
});
test("offline or demo is labelled sandbox, not a proven stream",()=>{
 const {ops}=instance("?demo=1");
 const r=ops.report();
 assert.equal(r.mode,"demo");
 assert.equal(r.bridgeConnection,"sandbox");
 assert.equal(r.providerContractVerified,false);
});
