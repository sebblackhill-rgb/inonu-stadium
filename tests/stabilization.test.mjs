// Stabilisation regression tests — source-anchored tests for staging branch.
// Run from repository root: node --test tests/stabilization.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../src/game4.js',import.meta.url),'utf8');
function method(name,nextName){
  const a=src.indexOf('function '+name+'(');
  const b=src.indexOf(nextName,a);
  assert(a>=0&&b>a,`missing ${name} anchors`);
  return src.slice(a,b);
}
const countFn=method('safePositiveCount','window.handleLiveEvent =');
const holdFn=method('holdForUnassigned','// Strict defensive counts');
const joinFn=method('joinFan','function holdForUnassigned');
test('safe gift values reject malformed inputs rather than adding one',()=>{
  const ctx={};vm.createContext(ctx);vm.runInContext(countFn,ctx);
  for(const x of [-5,0,NaN,Infinity,-Infinity,'30',1e308,1.2,1000001])
    assert.equal(ctx.safePositiveCount(x,1000000),null,String(x));
  assert.equal(ctx.safePositiveCount(300,1000000),300);
  assert.equal(ctx.safePositiveCount(1000,1000000),1000);
});
test('held gift is not evicted by 10,000 unassigned likers; six gifts remain',()=>{
  const ctx={pending:new Map(),state:{time:0},askPick(){}};
  vm.createContext(ctx);vm.runInContext(holdFn,ctx);
  for(let i=0;i<6;i++)ctx.holdForUnassigned('gifted','viewer',0,{val:10*(i+1),unit:10,giftName:'Rose'});
  for(let i=0;i<10000;i++)ctx.holdForUnassigned('free-'+i,'free',1,null);
  assert.equal(ctx.pending.get('gifted').gifts.length,6);
  assert.equal(ctx.pending.get('gifted').gifts.reduce((n,g)=>n+g.val,0),210);
  assert(ctx.pending.size<=401);
});
test('expired effect retains recognition; six gifts all credited on team join',()=>{
  const ctx={
    pending:new Map(),state:{time:250},CONFIG:{points:{giftCapPerMatch:60,giftK:4},lang:'en'},
    joinBuf:{home:[],away:[]},hearts:[],addChant(){},logLine(){},tShort:()=> 'H',T:()=> 'credited',
    addFan(id,name,team){return {id,name,team,gifts:0,mGiftD:0,mGiftPts:0}},addPts(){},
    fanChant(){},applyGift(f,v){f.gifts+=v},Math
  };
  ctx.pending.set('gifted',{likes:0,gifts:Array.from({length:6},(_,i)=>({val:10*(i+1),unit:10,giftName:'Rose',t:0}))});
  vm.createContext(ctx);vm.runInContext(joinFn,ctx);
  const f=ctx.joinFan('gifted','viewer','home');
  assert.equal(f.gifts,210);assert.equal(ctx.pending.has('gifted'),false);
});
test('connector ignores unknown events and uses documented giftDiamondCount',()=>{
  assert(src.includes('if (!["gift", "chat", "like"].includes(raw)) return;'));
  assert(src.includes('d.giftDiamondCount ?? d.diamondCount ?? d.giftValue'));
  assert(src.includes('https://cdn.joinplayroom.com/playroomkit/multiplayer.full.umd.js'));
});
test('host test buttons are tagged and LIVE guard is active',()=>{
  assert(src.includes('ev.source === "host" && Q.get("host") !== "1"'));
  assert.equal((src.match(/source: "host", type: /g)||[]).length,6);
});
test('full stands give viewer-visible feedback',()=>{
  assert(src.includes('Tribün dolu · diğer takımı deneyin'));
});
