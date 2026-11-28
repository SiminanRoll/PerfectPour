import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const bytes=await readFile(new URL('engine/perfect_pour_engine.wasm',root));
const contract=JSON.parse(await readFile(new URL('engine/contract.json',root),'utf8'));
const {instance}=await WebAssembly.instantiate(bytes,{}),e=instance.exports;
const state=x=>Array.from(new Float32Array(x.memory.buffer,x.state_ptr(),x.state_len()));
const save=x=>Array.from(new Float64Array(x.memory.buffer,x.save_ptr(),x.save_len()));
const restore=(x,a)=>{const ptr=x.save_ptr();const buffer=new Float64Array(x.memory.buffer,ptr,x.save_len());buffer.fill(0);buffer.set(a);return x.restore_save();};
const advance=(x,seconds)=>{while(seconds>1e-8){const dt=Math.min(seconds,1/120);x.step(dt,0);seconds-=dt;}};
const prepare=x=>{const s=state(x);assert.equal(x.set_recipe(s[2],s[98],s[99],s[100],s[101]),1);};
const checks=[];
assert.equal(e.state_len(),136);assert.equal(e.save_len(),120);
assert.equal(contract.saveVersion,106);assert.equal(contract.snapshot.fields.selectedIce,134);assert.equal(contract.snapshot.fields.iceFizzMultiplier,135);
e.reset(106);assert.equal(state(e)[134],0);assert.equal(state(e)[135],1);
assert.equal(e.set_ice(0),1);assert.equal(state(e)[118],0,'No-op ice selection does not start patience');
assert.equal(e.set_ice(3),0);assert.equal(e.set_ice(2),1);assert.equal(state(e)[134],2);assert.equal(state(e)[135],Math.fround(1.4));
const preparing=save(e);assert.equal(preparing[0],106);assert.equal(preparing[105],2);assert.equal(restore(e,preparing),1);
assert.equal(state(e)[134],2);assert.equal(state(e)[22],0);
for(const [i,v] of [[105,-1],[105,.5],[105,3],[106,1],[119,1],[92,0]]){
 const bad=[...preparing];bad[i]=v;const before=state(e);assert.equal(restore(e,bad),0);assert.deepEqual(state(e),before);
}
checks.push('Ice is optional, bounded, free, saved and validated atomically');

const physical=[];
for(const scoops of [0,1,2]){
 e.reset(106);e.set_ice(scoops);prepare(e);
 const before=state(e);assert.equal(e.begin_pour(),1);assert.equal(e.set_ice(0),0);
 advance(e,.6);const during=state(e);
 assert.equal(during[19],before[19]);assert.equal(during[5],before[5]);assert.equal(during[4],before[4]);
 assert.equal(during[117],before[117]);assert.equal(during[107],100);
 if(scoops)assert(during[135]<before[135]&&during[135]>1);
 physical.push(during);
}
assert.equal(physical[0][6],physical[2][6]);assert.equal(physical[0][64],physical[2][64]);
assert(physical[0][7]<physical[1][7]&&physical[1][7]<physical[2][7]);
checks.push('Ice increases real foam gas, most strongly on first contact, without changing beverage, flow, targets, price or recipe grade');

for(const hard of [0,1]){
 e.reset(106);e.set_mode(hard);e.set_ice(2);prepare(e);e.begin_pour();advance(e,.6);
 const partial=save(e),poured=partial[55];assert.equal(restore(e,partial),1);assert.equal(state(e)[134],2);assert.equal(save(e)[55],poured);
 if(!hard){assert.equal(state(e)[0],0);assert.equal(state(e)[23],0);assert.equal(e.set_ice(0),0);e.begin_pour();advance(e,.4);e.end_pour();assert.equal(e.serve(),1);}
 assert.equal(state(e)[0],1);const cash=state(e)[20],completed=state(e)[16],paid=save(e);
 assert.equal(restore(e,paid),1);e.end_pour();assert.equal(e.serve(),0);advance(e,3);
 assert.equal(state(e)[20],cash);assert.equal(state(e)[16],completed);assert.equal(state(e)[134],2);
 e.next_order();assert.equal(state(e)[134],0);
}
checks.push('Both modes preserve ice across interruptions, keep paid cups paid and reset ice on the next customer');

e.reset(106);const old104=save(e);old104[0]=104;assert.equal(restore(e,old104),1);assert.equal(state(e)[134],0);
old104[105]=1;assert.equal(restore(e,old104),0,'A104 save must retain its original zero reserved slots');
for(const version of [101,102,103]){
 const names=version===101?['untouched','paid','staffed-closed']:version===102?['untouched','partial-easy','partial-hardcore','paid']:['preparing','partial-easy','partial-hardcore','paid','staffed-closed'];
 for(const name of names){const fixture=JSON.parse(await readFile(new URL(`engine/fixtures/v${version}-${name}.json`,root),'utf8'));assert.equal(restore(e,fixture.engine),1);assert.equal(state(e)[134],0);assert.equal(save(e)[0],106);}
}
checks.push('All released101–103 fixtures and a104 save import with zero ice and preserved validation');

let baselineSnapshots=0;
if(process.env.PERFECT_POUR_BASELINE_WASM){
 const baselineBytes=await readFile(process.env.PERFECT_POUR_BASELINE_WASM);
 const {instance:base}=await WebAssembly.instantiate(baselineBytes,{}),b=base.exports;
 assert.equal(b.state_len(),134,'Comparison artifact must be the released V1.04 engine');
 const compare=label=>{assert.deepEqual(state(e).slice(0,134),state(b),label);baselineSnapshots++;};
 for(let seed=1;seed<=12;seed++){
  for(const x of [e,b]){x.reset(seed*106);x.set_mode(seed%2);}
  compare('reset');
  for(let customer=0;customer<24;customer++){
   const current=state(e);if(current[0]===2){for(const x of [e,b])x.next_day(seed+customer);compare('next day');}
   for(const x of [e,b]){prepare(x);x.set_pressure(customer%3);}
   compare('prepare');
   const parts=state(e)[133]?2:1;
   for(let part=0;part<parts;part++){
    const s=state(e),seconds=Math.max(0,s[129]*s[5]-s[64])/s[19];
    for(const x of [e,b]){assert.equal(x.begin_pour(),1);advance(x,seconds);}
    compare('held physics');
    for(const x of [e,b]){x.end_pour();if(!state(x)[21])x.serve();}
    compare('release');
   }
   for(const x of [e,b])advance(x,1.8);compare('settle');
   assert.deepEqual(save(e).slice(1,105),save(b).slice(1,105),'Original save fields preserve exact no-ice values');
   for(const x of [e,b])x.next_order();compare('next customer');
  }
 }
 checks.push(`Exact no-ice parity with released V1.04 Wasm across${baselineSnapshots} snapshots,288 orders, three pressures, modes, mixtures, overflow and saves`);
}
console.log(JSON.stringify({result:'PASS',version:contract.version,snapshotFields:e.state_len(),saveVersion:106,saveFields:e.save_len(),baselineSnapshots,checks},null,2));
