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
