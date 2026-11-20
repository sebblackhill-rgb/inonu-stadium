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

test('full-time visual redraw is translated without a second series write',()=>{
  const start=src.indexOf('function renderFullTimePanel() {');
  const end=src.indexOf('function fullTime() {',start);
  assert(start>=0 && end>start);
  const panel={innerHTML:'',style:{}};
  const cfg={lang:'tr'};
  const state={goals:{home:2,away:1},series:{home:1,away:0,draw:0}};
  const c={
    state,CONFIG:cfg,teamFans:{home:[],away:[]},
    topFans:()=>[],T:k=>cfg.lang+'-'+k,tName:t=>t,tShort:t=>t,TEAMS:['home','away'],
    $:id=>id==='ftpanel'?panel:({getContext:()=>({drawImage(){}})}),
  };
  vm.createContext(c);vm.runInContext(src.slice(start,end),c);
  c.renderFullTimePanel();
  const before=panel.innerHTML;cfg.lang='en';c.renderFullTimePanel();
  assert.notEqual(panel.innerHTML,before);
  assert.equal(state.series.home,1);
  assert.equal(state.series.away,0);
});
test('LIVE retry removes prior event subscription and ignores stale callbacks',async()=>{
  const start=src.indexOf('let liveState = null');
  const end=src.indexOf('/* ================= camera, layout, loop, boot',start);
  assert(start>=0 && end>start);
  const listeners=[];const accepted=[];const status={};
  const bridge={
    async insertCoin(){},
    onTikTokLiveEvent(fn){
      const row={fn,closed:false};listeners.push(row);
      return ()=>{row.closed=true};
    },
    onDisconnect(){return ()=>{}}
  };
  const c={
    window:{__liveAttempts:[],Playroom:bridge},
    Q:{get:k=>k==='live'?'1':null},CONFIG:{live:{maxTries:2,backoff:[0,0]}},
    state:{time:1},$:(id)=>({style:{},textContent:'',className:''}),
    T:k=>k,performance:{now:()=>1000},console:{warn(){}},
    document:{
      querySelectorAll(){return[]},
      createElement(){return{dataset:{},onload:null,onerror:null}},
      head:{appendChild(x){x.onload?.()}}
    },
    clearTimeout(){},setTimeout(){return 1},
    handleLiveEvent:e=>accepted.push(e)
  };
  vm.createContext(c);vm.runInContext(src.slice(start,end),c);
  await c.tryConnectPlayroom(true);
  await c.tryConnectPlayroom(true);
  assert.equal(listeners.length,2);
  assert.equal(listeners[0].closed,true);
  const event={type:'gift',data:{userId:'tester',name:'Viewer',msgId:'g1',giftName:'Rose',giftDiamondCount:5}};
  listeners[0].fn(event);
  listeners[1].fn(event);
  assert.equal(accepted.length,1);
  assert.equal(accepted[0].diamondCount,5);
  listeners[1].fn({type:'follow',data:{userId:'tester'}});
  assert.equal(accepted.length,1);
});
test('LIVE presentation and restart safeguards remain enabled',()=>{
  assert(src.includes('if (state.phase === "ft") renderFullTimePanel();'));
  assert(src.includes('state.warningGeneration = (state.warningGeneration || 0) + 1'));
  assert(src.includes('if (generation === (state.warningGeneration || 0)) refereeWarning'));
  assert(src.includes('if (!window.confirm('));
  assert(src.includes('window.innerWidth < 860 || Q.get("live") === "1"'));
  assert(src.includes('demo bots disabled in LIVE mode'));
});

test('v1.6 goal scoreboard pulse is a visual-only restartable cue',()=>{
 const start=src.indexOf('function pulseGoalScore(team) {');
 const end=src.indexOf('function goal(team) {',start);
 assert(start>=0&&end>start);
 const classes=new Set(), ops=[];
 const el={offsetWidth:540,classList:{
   remove:(...names)=>{names.forEach(n=>classes.delete(n));ops.push('remove')},
   add:n=>{classes.add(n);ops.push('add:'+n)}
 }};
 const c={$:id=>id==='score'?el:null};
 vm.createContext(c);vm.runInContext(src.slice(start,end),c);
 c.pulseGoalScore('home');assert(classes.has('goal-home')&&!classes.has('goal-away'));
 c.pulseGoalScore('home');assert.equal(ops.filter(x=>x==='add:goal-home').length,2);
 c.pulseGoalScore('away');assert(classes.has('goal-away')&&!classes.has('goal-home'));
 assert(src.includes('pulseGoalScore(team);'));
});
