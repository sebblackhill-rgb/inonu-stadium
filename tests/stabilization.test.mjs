import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const section=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start+a.length);assert(start>=0&&end>start,'missing section '+a);return source.slice(start,end);};
function context(script,values){const ctx=vm.createContext(values);vm.runInContext(script,ctx);return ctx;}
test('provider mapping retains gift units and stable user ID',()=>{
 const c=context(section('function mapLiveEvent(event) {','async function tryConnectPlayroom('),{});
 assert.equal(c.mapLiveEvent({type:'follow',data:{userId:'U'}}),null);
 assert.equal(c.mapLiveEvent({type:'share',data:{userId:'U'}}),null);
 assert.equal(c.mapLiveEvent({type:'gift',data:{name:'A'}}),null);
 const e=c.mapLiveEvent({type:'gift',data:{userId:'U1',name:'A',msgId:'m1',giftName:'Rose',giftDiamondCount:5,repeatCount:2}});
 assert.equal(e.type,'gift');assert.equal(e.userId,'U1');assert.equal(e.username,'A');
 assert.equal(e.diamondCount,5);assert.equal(e.repeatCount,2);assert.equal(e.eventId,'m1');
});
test('invalid gifts and likes rejected before credit and event ID dedupe',()=>{
 const state={mode:'live',conn:{lastEvent:0,st:'down'},users:new Map()};
 const receipts=[],seen=new Map();
 const c=context(section('function handleLiveEvent(evt) {','window.handleLiveEvent = handleLiveEvent;'),{
   state,location:{search:'?live=1'},URLSearchParams,performance:{now:()=>100},
   diag:o=>{receipts.push(o);return o},LEDGER:{bySrc:{live:0,test:0,demo:0},seen},CONFIG:{eventIdMemory:20000}
 });
 const bad=[{source:'live',userId:'A',type:'gift',diamondCount:NaN},
 {source:'live',userId:'A',type:'gift',diamondCount:-1},
 {source:'live',userId:'A',type:'gift',diamondCount:5,repeatCount:Infinity},
 {source:'live',userId:'A',type:'gift',diamondCount:5,repeatCount:0},
 {source:'live',userId:'A',type:'like',likeCount:-5},
 {source:'live',userId:'A',type:'like',likeCount:'abc'},
 {source:'test',userId:'host',type:'gift',diamondCount:1500}];
 for(const e of bad) assert.equal(c.handleLiveEvent(e).outcome,'rejected',JSON.stringify(e));
 assert.equal(seen.size,0);assert.equal(state.users.size,0);assert.equal(c.LEDGER.bySrc.live,0);
});
test('phase clock tracks wall time at five frames per second',()=>{
 const c=context(section('function wallElapsed(now, previous) {','function tick(now) {'),{state:{time:0,paused:false},lastT:1000});
 let prev=1000;
 for(let i=0;i<25;i++){prev+=200;c.advanceClock(prev)}
 assert(Math.abs(c.state.time-5)<0.25,'state time '+c.state.time);
 const before=c.state.time;c.state.paused=true;c.advanceClock(prev+200);assert.equal(c.state.time,before);
});
test('same-frame race finish does not book second crew delivery',()=>{
 const calls=[],state={phase:'build',teams:{sun:{delivering:0.01,lurch:0},nile:{delivering:0.01,lurch:0}}};
 const c=context(section('function updateTeams(dt) {','function blocksPlaced(id, n) {'),{
   state,TEAM_IDS:['sun','nile'],performance:{now:()=>0},blocksPlaced:id=>{calls.push(id);state.phase='race'}
 });
 c.updateTeams(0.05);assert.deepEqual(calls,['sun']);
});
test('boss killing blow does not display competing Wrath popup',()=>{
 const pops=[],state={phase:'boss'};
 const c=context(section('function wrathOfRa(u, repeats, dmg) {','function endVictory(reason) {'),{
   state,CONFIG:{bossDamage:{lion:1000}},S:()=>'',showPop:(...x)=>pops.push(x),
   bossHit:(u,d)=>{state.phase='victory';return d},flash(){},shake(){},sfx(){}
 });
 assert.equal(c.wrathOfRa({name:'QA'},1,500),500);assert.equal(pops.length,0);
});
test('bundle, phase and hidden-tab fixes remain in source',()=>{
 assert(source.includes('https://cdn.joinplayroom.com/playroomkit/multiplayer.full.umd.js'));
 assert(source.includes('if (state.phase !== "build") return; // never double-book'));
 assert(source.includes('if (!document.hidden) return;'));
});

test('gifted viewer #20,001 is retained without allocating a render avatar',()=>{
 const viewers=new Map();
 for(let i=0;i<20000;i++) viewers.set('assigned'+i,{id:'assigned'+i,team:'sun',diamonds:0,pending:[]});
 const c=context(section('function getOrMakeUser(userId, username, photoUrl, src, preserveGiftCredit = false) {','function assignTeam(u, team) {'),{
   state:{users:viewers},CONFIG:{maxParticipants:20000,giftOverflowReserve:2000},
   performance:{now:()=>100000},
   makeUser:(id,name)=>({id,name,team:null,diamonds:0,pending:[],inst:-1})
 });
 assert.equal(c.getOrMakeUser('free','Free',null,'test'),null);
 const gift=c.getOrMakeUser('giver20001','Giver',null,'live',true);
 assert.equal(gift?.id,'giver20001');assert.equal(gift?.inst,-1);
 assert.equal(viewers.size,20001);
});
test('closed build phase ignores duplicate late delivery',()=>{
 const state={phase:'race',teams:{sun:{blocks:1,delivered:10}}};
 const c=context(section('function blocksPlaced(id, n) {','function layerPlaced(id, n) {'),{state});
 c.blocksPlaced('sun',10);
 assert.equal(state.teams.sun.blocks,1);assert.equal(state.teams.sun.delivered,10);
});

test('build delivery simulation keeps pace at 5 FPS and 60 FPS without rendering',()=>{
 const code=section('function advanceBuildLogic(elapsed) {','function tick(now) {');
 function run(step,frames){
   let total=0,calls=0;
   const state={phase:'build',paused:false};
   const c=context(code,{state,updateTeams:dt=>{total+=dt;calls++}});
   for(let i=0;i<frames;i++) c.advanceBuildLogic(step);
   return {total,calls,c};
 }
 const slow=run(0.2,25);
 const fast=run(1/60,300);
 assert(Math.abs(slow.total-5)<0.0001,'slow sum '+slow.total);
 assert(Math.abs(fast.total-5)<0.0001,'fast sum '+fast.total);
 assert(slow.calls>25,'5fps must substep deliveries instead of one 50ms tick');
 let ran=0;
 const c=context(code,{state:{phase:'build',paused:true},updateTeams:dt=>ran+=dt});
 assert.equal(c.advanceBuildLogic(0.5),0);
 assert.equal(ran,0,'paused game must not haul blocks');
});
test('LIVE speed URL cannot inflate paid audience actions',()=>{
 const speedCode=section('const SPEED = (() => {','if (new URLSearchParams(location.search).get("calm") === "1")');
 const cfg={demoSpeed:3};
 function speed(search){
   return vm.runInContext(speedCode+'\n SPEED;',vm.createContext({
     CONFIG:cfg,location:{search},URLSearchParams,Number
   }));
 }
 assert.equal(speed('?live=1&speed=100'),1);
 assert.equal(speed('?live=1&speed=0.1'),1);
 assert.equal(speed('?speed=4'),4);
 assert.equal(speed('?speed=Infinity'),3);
 assert.equal(speed('?speed=-1'),3);
});

test('Pyramid reconnect retires old callback and accepts a single event from the new one',async()=>{
 const registered=[],accepted=[];
 const mod={
   async insertCoin(){return null},
   onTikTokLiveEvent(fn){
     const row={fn,retired:false};registered.push(row);
     return ()=>{row.retired=true};
   }
 };
 const c=context(section('let pr = { subscribed:', '/* ---------- camera'),{
   state:{mode:'live',conn:{tries:0,lastEvent:0,st:'off',retryAt:0}},
   window:{Playroom:mod},LEDGER:{reconnects:0},
   performance:{now:()=>50},console:{warn(){}},
   diag:rec=>rec,
   document:{
     createElement:()=>({onload:null,onerror:null,remove(){}}),
     head:{appendChild:s=>s.onload?.()}
   },
   clearTimeout(){},setTimeout:()=>1,
   handleLiveEvent:e=>accepted.push(e)
 });
 await c.tryConnectPlayroom(false);
 assert.equal(registered.length,1);
 registered[0].fn({type:'gift',data:{userId:'QA',name:'QA',msgId:'one',giftName:'Rose',giftDiamondCount:1}});
 assert.equal(accepted.length,1);
 await c.tryConnectPlayroom(true);
 assert.equal(registered.length,2);
 assert(registered[0].retired);
 registered[0].fn({type:'gift',data:{userId:'QA',name:'QA',msgId:'ghost',giftName:'Rose',giftDiamondCount:1}});
 registered[1].fn({type:'gift',data:{userId:'QA',name:'QA',msgId:'two',giftName:'Rose',giftDiamondCount:1}});
 registered[1].fn({type:'follow',data:{userId:'QA'}});
 assert.equal(accepted.length,2);
 assert.deepEqual(accepted.map(e=>e.eventId),['one','two']);
 assert.equal(c.LEDGER.reconnects,1);
});

test('shared portfolio objective shows the right phase, milestone and countdown in both languages',()=>{
 const c=context(section('function missionModel(s, cfg) {','function renderMission() {'),{});
 const cfg={lang:'en',layers:36,milestoneEvery:5};
 const s={time:20,phase:'build',teams:{sun:{layers:4},nile:{layers:3}},
   bossHP:7000,bossEnds:250,phaseAt:50,raceWinner:'sun',round:1};
 const a=c.missionModel(s,cfg);
 assert.equal(a.phase,'build');assert.match(a.main,/LAYER 5/);assert.match(a.detail,/SUN 4\/36/);
 s.teams.sun.layers=5;assert.match(c.missionModel(s,cfg).main,/LAYER 10/);
 s.phase='boss';const b=c.missionModel(s,cfg);
 assert.equal(b.phase,'boss');assert.match(b.detail,/230s/);assert.match(b.main,/7000/);
 s.phase='race';assert.match(c.missionModel(s,cfg).detail,/30s/);
 s.phase='victory';assert.match(c.missionModel(s,cfg).detail,/NEXT ROUND · 30s/);
 cfg.lang='tr';assert.match(c.missionModel(s,cfg).main,/PİRAMİT TAMAMLANDI/);
 s.phase='build';assert.match(c.missionModel(s,cfg).main,/KAT 10/);
});
