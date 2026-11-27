import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const bytes=await readFile(new URL('../../engine/perfect_pour_engine.wasm',import.meta.url));
const contract=JSON.parse(await readFile(new URL('../../engine/contract.json',import.meta.url),'utf8'));
const module=await WebAssembly.compile(bytes);
assert.deepEqual(WebAssembly.Module.imports(module),[],'Engine remains dependency-free');
const {exports:e}=await WebAssembly.instantiate(module,{}),I=contract.snapshot.fields;
for(const name of Object.keys(contract.exports))assert.equal(typeof e[name],'function',name);
assert.equal(e.state_len(),124);assert.equal(e.save_len(),120);
const s=()=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const value=n=>s()[I[n]];
const save=()=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restore=a=>{const p=e.save_ptr(),buffer=new Float64Array(e.memory.buffer,p,e.save_len());buffer.fill(0);buffer.set(a);return e.restore_save();};
const advance=t=>{while(t>1e-8){const dt=Math.min(t,1/120);e.step(dt,1);t-=dt;}};
const perfect=()=>{assert.equal(e.set_pressure(0),1);const before=s();begin();advance(before[4]*before[5]/before[19]);e.end_pour();if(!before[21])e.serve();assert.equal(value('stars'),5);};
const prepare=()=>{const a=s();if(a[109]===1)assert.equal(e.set_recipe(a[2],a[98],a[99],a[100],a[101]),1);};
const begin=()=>{if(value('selectedSoda')===4)prepare();return e.begin_pour();};
const checks=[];
e.reset(31);assert.equal(value('hardcore'),1);advance(4);assert.equal(value('elapsed'),0);assert.equal(value('liquid'),0);
assert.equal(e.begin_pour(),0,'Must choose a base before the first hold');assert.equal(value('attempted'),0);
assert.equal(e.set_pressure(3),0);assert.equal(e.set_mode(2),0);assert.equal(e.serve(),0);
begin();assert.equal(e.set_pressure(0),0);assert.equal(e.set_mode(0),0);assert.equal(begin(),0);
advance(1.75);const held=s();e.end_pour();const paid=s();assert.equal(value('stars'),5);assert.equal(value('phase'),1);
assert.equal(value('foam'),held[7]);assert.equal(begin(),0);assert.equal(e.serve(),0);
e.end_pour();advance(2);const settled=s();assert(settled[7]<paid[7]);assert(settled[6]>paid[6]);
for(let i=0;i<124;i++)if(![6,7,64].includes(i))assert.equal(settled[i],paid[i],`paid field${i} frozen`);
checks.push('One-hold default Hardcore; pressure/mode/input guards; paid settling freezes service and economics');
const committed=save();assert.equal(restore(committed),1);const cash=value('cash');e.end_pour();e.serve();assert.equal(value('cash'),cash);
assert.equal(value('foam'),0);assert.equal(value('phase'),1);
checks.push('Paid save restores without replaying sale');
for(const [index,badValue]of [[0,100],[10,NaN],[21,-1],[34,4],[53,3],[66,99],[119,1]]){
 const bad=save();bad[index]=badValue;const before=s();assert.equal(restore(bad),0);assert.deepEqual(s(),before);
}
checks.push('Malformed restore fails atomically');
e.reset(8);begin();advance(.9);const partial=save();assert(partial[6]>0&&partial[7]>0&&partial[8]>0);
assert.equal(restore(partial),1);assert.equal(value('phase'),1);assert.equal(value('completed'),1);assert.equal(begin(),0);
const restoredCommitted=save();assert.equal(restore(restoredCommitted),1);assert.equal(value('completed'),1);
checks.push('Interrupted Hardcore cup commits once on restore; no reload top-up');
e.reset(9);e.set_mode(0);begin();advance(.8);e.end_pour();const easySave=save();
assert.equal(restore(easySave),1);assert.equal(value('hardcore'),0);assert.equal(value('holding'),0);
begin();advance(.95);e.end_pour();assert.equal(e.serve(),1);assert.equal(value('stars'),5);
e.next_order();assert.equal(value('hardcore'),1);assert.equal(value('streak'),0);assert.equal(value('easyBestStreak'),1);
checks.push('Interrupted Easy cup resumes stopped; next cup returns to default Hardcore');
for(const name of ['untouched','paid','staffed-closed']){
 const old=JSON.parse(await readFile(new URL(`../../engine/fixtures/v101-${name}.json`,import.meta.url),'utf8'));
 assert.equal(old.engine.length,80);e.reset(7);assert.equal(restore(old.engine),1,name);
 assert.equal(value('cash'),old.engine[21]);assert.equal(value('completed'),old.engine[17]);
 assert.equal(value('lastNet'),old.engine[14]);assert(value('patienceLimit')>=8);
 assert.equal(value('phase'),old.engine[1]);assert.equal(value('day'),old.engine[25]);
 for(let i=0;i<6;i++)assert.equal(s()[34+i],old.engine[34+i]);
 const migrated=save();assert.equal(migrated[0],103);assert.equal(restore(migrated),1);assert.equal(value('cash'),old.engine[21]);
 if(name==='staffed-closed'){assert.equal(value('staffOrders'),2);assert.equal(value('wagesPaid'),400);e.next_order();assert.equal(value('cash'),old.engine[21]);assert.equal(e.next_day(8),1);assert.equal(value('orderGoal'),12);}
}
checks.push('Three genuine V101 fixtures migrate: untouched, paid and staffed closed day; cash/ownership/payroll preserved');
e.reset(1);begin();e.end_pour();assert.equal(value('payout'),0);assert.equal(value('cash'),0);assert(value('refund')>0);e.next_order();perfect();assert(value('cash')>0);
checks.push('Empty drink receives full refund/no sale; a broke shop can recover on its next good cup');
let coverage=0,classicSpills=0;const seen=new Set();
for(let seed=1;seed<=64;seed++){
 e.reset(seed);
 for(let day=1;day<=2;day++){
  while(value('phase')!==2){
   const request=s();seen.add(`${request[2]}:${request[3]}:${Math.round(request[4]*100)}`);
   e.set_pressure(1);begin();advance(request[4]*request[5]/request[19]);e.end_pour();
   if(value('spill')>0)classicSpills++;coverage++;e.next_order();
  }
  if(day===1)e.next_day(seed+7919);
 }
}
assert.equal(seen.size,112);assert(classicSpills>0);
checks.push(`${coverage} generated requests preserve all112 soda/cup/target combinations and high-fizz overflow`);
console.log(JSON.stringify({result:'PASS',version:contract.version,wasmBytes:bytes.length,snapshotFields:e.state_len(),saveFields:e.save_len(),checks},null,2));
