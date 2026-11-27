#!/usr/bin/env node
/** Public-API acceptance of the actual compiled V1.01 Rust engine. No browser automation. */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const file=resolve(process.argv[2]||'engine/perfect_pour_engine.wasm');
const bytes=await readFile(file);
const module=await WebAssembly.compile(bytes);
assert.equal(WebAssembly.Module.imports(module).length,0,'Engine must remain self-contained');
const fresh=async()=>{
  const e=(await WebAssembly.instantiate(module,{})).exports;
  for(const name of ['reset','begin_pour','end_pour','step','serve','set_mode','next_order','next_day','buy','state_ptr','state_len','save_ptr','save_len','restore_save']){
    assert.equal(typeof e[name],'function',`Missing export ${name}`);
  }
  e.reset(12345);return e;
};
const state=e=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const advance=(e,seconds)=>{
  let left=seconds;
  while(left>0.0000001){const dt=Math.min(left,1/120);e.step(dt,0);left-=dt;}
};
const pourTarget=e=>{
  const s=state(e);
  assert.equal(s[0],0,'Expected active customer');
  assert.equal(e.begin_pour(),1,'A fresh cup must accept its first pour');
  advance(e,s[4]*s[5]/s[19]);
  e.end_pour();
  const result=state(e);
  assert.equal(result[0],1,'Hardcore release must create the review');
  return result;
};
const finishDay=e=>{
  let guard=0;
  while(state(e)[0]!==2){
    assert(++guard<60,'Day progression must terminate');
    if(state(e)[0]===0)pourTarget(e);
    if(state(e)[0]===1)e.next_order();
  }
  return state(e);
};
const e=await fresh();
const checks=[];
assert.equal(state(e).length,64);
assert.equal(state(e)[21],1,'Hardcore is the default');
e.begin_pour();advance(e,.22);
assert.equal(e.set_mode(0),0,'Mode cannot change after an attempt starts');
e.end_pour();
let s=state(e),cash=s[20],served=s[16];
assert.equal(s[0],1);
assert.equal(e.begin_pour(),0,'Hardcore result cannot be topped up');
e.end_pour();e.serve();
assert.equal(state(e)[20],cash,'Repeated release/Serve cannot duplicate cash');
assert.equal(state(e)[16],served,'Repeated release/Serve cannot duplicate customers');
checks.push('Hardcore default, mode lock, release-to-review, one payout');

e.next_order();assert.equal(e.set_mode(0),1);
assert.equal(e.begin_pour(),1);advance(e,.15);e.end_pour();
const firstFill=state(e)[6];
assert.equal(state(e)[0],0,'Easy release must keep the cup active');
assert.equal(e.begin_pour(),1);advance(e,.15);e.end_pour();
assert(state(e)[6]>firstFill,'Easy permits a second pour');
e.serve();assert.equal(state(e)[0],1);
checks.push('Easy supports top-ups and explicit Serve');

const saved=Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restored=await fresh();
new Float64Array(restored.memory.buffer,restored.save_ptr(),restored.save_len()).set(saved);
assert.equal(restored.restore_save(),1);
assert.equal(state(restored)[20],state(e)[20],'Saved earned cash must survive');
assert.equal(state(restored)[16],state(e)[16],'Saved served count must survive');
assert.equal(state(restored)[21],1,'Restore defaults to Hardcore');
const savedCash=state(restored)[20];restored.end_pour();restored.serve();
assert.equal(state(restored)[20],savedCash,'Restored result must not pay twice');
const malformed=saved.slice();malformed[0]=Number.NaN;
new Float64Array(restored.memory.buffer,restored.save_ptr(),restored.save_len()).set(malformed);
assert.equal(restored.restore_save(),0,'Malformed save must be rejected');
assert.equal(state(restored)[20],savedCash,'Rejected save must not corrupt live career');
checks.push('Career save/restore, no replay payout, malformed-save rejection');

const misses=[],baseCombos=new Set();
for(let seed=1;seed<=32;seed++){
  const run=await fresh();run.reset(seed);
  for(let customer=1;customer<=12;customer++){
    const before=state(run),after=pourTarget(run);
    baseCombos.add(before[2]+':'+before[3]);
    if(after[11]<95.9)misses.push({seed,customer,soda:before[2],cup:before[3],target:before[4],accuracy:after[11],spill:after[8]});
    run.next_order();
  }
  assert.equal(state(run)[0],2);
}
assert.equal(misses.length,0,`Generated Hardcore orders must be reachable without mandatory spills: ${JSON.stringify(misses.slice(0,5))}`);
assert.equal(baseCombos.size,16,'Base-equipment acceptance should cover every soda/cup pair');
checks.push('384 generated base-equipment Hardcore orders reachable in one hold');

const tuned=await fresh();finishDay(tuned);
for(let level=1;level<=2;level++){
  assert.equal(tuned.buy(3),1,`Earned cash buys tap level ${level}`);
  assert.equal(state(tuned)[37],level);
  const combinations=new Set();
  for(let seed=1;seed<=16;seed++){
    tuned.next_day(seed);
    while(state(tuned)[0]!==2){
      if(state(tuned)[0]===0){
        const before=state(tuned),after=pourTarget(tuned);
        combinations.add(before[2]+':'+before[3]);
        assert(after[11]>=95.9,`Tap level ${level}: ${JSON.stringify({soda:before[2],cup:before[3],target:before[4],accuracy:after[11],spill:after[8]})}`);
      }
      if(state(tuned)[0]===1)tuned.next_order();
    }
  }
  assert.equal(combinations.size,16,`Tap level ${level} acceptance should cover every soda/cup pair`);
}
checks.push('Both tap-upgrade levels preserve one-hold reachability across all 16 soda/cup pairs');

const business=await fresh();
assert.equal(business.buy(0),0,'Unaffordable purchase must fail');
assert.equal(state(business)[34],0);
let day=finishDay(business);
assert(day[26]>=7 && day[27]>=7,'Good pours build a streak');
assert(day[20]>0 && day[33]>=day[20]);
const signCost=day[40],beforeSignCash=day[20];
assert.equal(business.buy(0),1);
assert.equal(state(business)[34],1);
assert.equal(state(business)[20],beforeSignCash-signCost,'Upgrade deducts its displayed cost');
const priorDay=state(business)[24],priorCash=state(business)[20];
business.next_day(77);
assert.equal(state(business)[24],priorDay+1);
assert.equal(state(business)[34],1,'Upgrades persist into the next day');
assert.equal(state(business)[20],priorCash,'Starting a day does not reset cash');
assert.equal(state(business)[16],0,'Daily customer count resets');
finishDay(business);
assert.equal(business.buy(4),1,'Recruit counter helper after earning cash');
assert.equal(state(business)[38],1);
assert.equal(state(business)[51],0,'New helper starts next day');
assert.equal(business.buy(4),0,'Unique employee cannot be recruited twice');
business.next_day(88);
assert.equal(state(business)[51],1,'Helper becomes active on the next day');
assert.equal(state(business)[48],150,'Active helper wage reserve is visible');
const staffedDay=finishDay(business);
assert.equal(staffedDay[50],150,'Helper wage charged once at day close');
assert(staffedDay[20]>=0);
const settledCash=staffedDay[20];business.next_order();business.end_pour();business.serve();
assert.equal(state(business)[20],settledCash,'Closed-day wages and revenue cannot repeat');
checks.push('Purchases, quoted costs, persistent days, staff activation and one wage charge');

console.log(JSON.stringify({result:'PASS',wasmBytes:bytes.length,checks},null,2));
