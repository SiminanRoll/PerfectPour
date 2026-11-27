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
const checkpoint=e=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restore=(e,values)=>{
  const ptr=e.save_ptr();
  new Float64Array(e.memory.buffer,ptr,e.save_len()).set(values);
  return e.restore_save();
};
const advance=(e,seconds)=>{
  let left=seconds;
  while(left>0.0000001){const dt=Math.min(left,1/120);e.step(dt,0);left-=dt;}
};
const pourOneHold=e=>{
  const s=state(e);
  assert.equal(s[0],0,'Expected active customer');
  assert.equal(e.begin_pour(),1,'A fresh cup must accept its first pour');
  advance(e,s[4]*s[5]/s[19]);
  e.end_pour();
  const result=state(e);
  assert.equal(result[0],1,'Hardcore release must create the review');
  return result;
};
// Business tests earn money through Easy's legitimate stop/settle/top-up path.
// Hardcore is no longer guaranteed a perfect no-spill result for every order.
const pourEasy=e=>{
  const s=state(e);
  assert.equal(s[0],0);
  assert.equal(s[21],0);
  let left=s[4]*s[5]/s[19];
  while(left>1e-8){
    const held=Math.min(.2,left);
    assert.equal(e.begin_pour(),1);
    advance(e,held);e.end_pour();left-=held;
    if(left>1e-8)advance(e,2.5);
  }
  assert.equal(e.serve(),1);
  const result=state(e);
  assert.equal(result[12],5,'Controlled Easy pours earn the economy fixture cash');
  assert.equal(result[8],0,'Settling between top-ups avoids overflow');
  return result;
};
const finishEasyDay=e=>{
  let guard=0;
  while(state(e)[0]!==2){
    assert(++guard<60,'Day progression must terminate');
    if(state(e)[0]===0){
      if(state(e)[21])assert.equal(e.set_mode(0),1);
      pourEasy(e);
    }
    if(state(e)[0]===1)e.next_order();
  }
  return state(e);
};
const e=await fresh();
const checks=[];
assert.equal(state(e).length,65);
assert.equal(state(e)[21],1,'Hardcore is the default');
e.begin_pour();advance(e,.22);
assert.equal(e.set_mode(0),0,'Mode cannot change after an attempt starts');
e.end_pour();
let s=state(e),cash=s[20],served=s[16];
assert.equal(s[0],1);
assert(s[7]>0,'Hardcore release leaves visible foam in the served cup');
assert(s[64]>s[6],'Settled beverage includes soda still trapped in the foam');
assert.equal(e.begin_pour(),0,'Hardcore result cannot be topped up');
e.end_pour();e.serve();
advance(e,.5);
assert(state(e)[7]<s[7],'Paid cup foam settles naturally');
assert(state(e)[6]>s[6],'Soda in the foam returns to the liquid');
assert.equal(state(e)[15],s[15],'Serving freezes the recorded pour time');
assert(Math.abs(state(e)[64]-s[64])<.001,'Settling cannot add beverage');
assert.equal(state(e)[20],cash,'Repeated release/Serve cannot duplicate cash');
assert.equal(state(e)[16],served,'Repeated release/Serve cannot duplicate customers');
checks.push('Hardcore default, mode lock, release-to-review, visible settling, one payout');

e.next_order();assert.equal(e.set_mode(0),1);
assert.equal(e.begin_pour(),1);advance(e,.15);e.end_pour();
const firstFill=state(e)[6];
assert.equal(state(e)[0],0,'Easy release must keep the cup active');
assert.equal(e.begin_pour(),1);advance(e,.15);e.end_pour();
assert(state(e)[6]>firstFill,'Easy permits a second pour');
e.serve();assert.equal(state(e)[0],1);
checks.push('Easy supports top-ups and explicit Serve');

const saved=checkpoint(e);
const restored=await fresh();
assert.equal(restore(restored,saved),1);
assert.equal(state(restored)[20],state(e)[20],'Saved earned cash must survive');
assert.equal(state(restored)[16],state(e)[16],'Saved served count must survive');
assert.equal(state(restored)[21],1,'Restore defaults to Hardcore');
assert.equal(state(restored)[7],0,'Paid save compatibility uses a fully settled cup');
assert(Math.abs(state(restored)[6]-state(e)[64])<.001,'Restore preserves the scored beverage volume');
const savedCash=state(restored)[20];restored.end_pour();restored.serve();
assert.equal(state(restored)[20],savedCash,'Restored result must not pay twice');
const malformed=saved.slice();malformed[0]=Number.NaN;
assert.equal(restore(restored,malformed),0,'Malformed save must be rejected');
assert.equal(state(restored)[20],savedCash,'Rejected save must not corrupt live career');
checks.push('Career save/restore, no replay payout, malformed-save rejection');

// Clone a publicly earned career, then buy equipment through its public API.
// Identical order seeds must retain the same requests at all tap levels.
const funded=await fresh();finishEasyDay(funded);
assert.equal(funded.next_day(77),1);finishEasyDay(funded);
const fundedSave=checkpoint(funded),combinations=new Set(),targetsBySoda=Array.from({length:4},()=>new Set());
let foamyChallenges=0,equipmentImprovements=0,conservedPours=0;
for(let seed=1;seed<=16;seed++){
  const runs=[];
  for(let level=0;level<=2;level++){
    const run=await fresh();assert.equal(restore(run,fundedSave),1);
    for(let purchase=0;purchase<level;purchase++){
      const before=state(run),quoted=before[43];
      assert.equal(run.buy(3),1,`Earned cash buys tap level ${purchase+1}`);
      assert.equal(state(run)[20],before[20]-quoted);
    }
    assert.equal(state(run)[37],level);
    assert.equal(run.next_day(seed),1);runs.push(run);
  }
  while(state(runs[0])[0]!==2){
    const before=runs.map(state),results=[];
    const request=s=>[s[1],s[2],s[3],s[4],s[5]];
    assert.deepEqual(request(before[1]),request(before[0]),'First tap upgrade must not filter hard targets');
    assert.deepEqual(request(before[2]),request(before[0]),'Second tap upgrade must not change requests');
    combinations.add(before[0][2]+':'+before[0][3]);
    targetsBySoda[before[0][2]].add(Math.round(before[0][4]*100));
    for(const run of runs)results.push(pourOneHold(run));
    const [base,tap1,tap2]=results;
    for(const result of results){
      assert(result.every(Number.isFinite));
      assert(result[6]+result[7]<=result[5]+.001,'Foam occupies real cup capacity');
    }
    if(base[8]>0){
      foamyChallenges++;
      assert(tap1[8]<=base[8]+.001 && tap2[8]<=tap1[8]+.001,'Better taps reduce foam overflow');
      assert(tap1[11]>=base[11]-.001 && tap2[11]>=tap1[11]-.001,'Less overflow improves this matched hold');
      if(tap2[11]>base[11]+1)equipmentImprovements++;
    }else{
      conservedPours++;
      assert(tap2[7]<tap1[7] && tap1[7]<base[7],'Tap upgrades reduce gas volume');
      assert(Math.abs(tap1[64]-base[64])<.001 && Math.abs(tap2[64]-base[64])<.001,'Reduced gas preserves actual beverage');
    }
    for(const run of runs)run.next_order();
  }
  for(const run of runs)assert.equal(state(run)[0],2);
}
assert.equal(combinations.size,16);
for(const targets of targetsBySoda)assert.deepEqual([...targets].sort((a,b)=>a-b),[45,55,60,65,70,75,80]);
assert(foamyChallenges>0 && equipmentImprovements>0 && conservedPours>0);
checks.push('All 16 soda/cup pairs and full targets stay identical at all three tap levels');
checks.push('Unfiltered high-fizz orders spill; earned tap upgrades reduce overflow while conserving beverage');

const business=await fresh();
assert.equal(business.buy(0),0,'Unaffordable purchase must fail');
assert.equal(state(business)[34],0);
let day=finishEasyDay(business);
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
finishEasyDay(business);
assert.equal(business.buy(4),1,'Recruit counter helper after earning cash');
assert.equal(state(business)[38],1);
assert.equal(state(business)[51],0,'New helper starts next day');
assert.equal(business.buy(4),0,'Unique employee cannot be recruited twice');
business.next_day(88);
assert.equal(state(business)[51],1,'Helper becomes active on the next day');
assert.equal(state(business)[48],150,'Active helper wage reserve is visible');
const staffedDay=finishEasyDay(business);
assert.equal(staffedDay[50],150,'Helper wage charged once at day close');
assert(staffedDay[20]>=0);
const settledCash=staffedDay[20];business.next_order();business.end_pour();business.serve();
assert.equal(state(business)[20],settledCash,'Closed-day wages and revenue cannot repeat');
checks.push('Purchases, quoted costs, persistent days, staff activation and one wage charge');

console.log(JSON.stringify({result:'PASS',wasmBytes:bytes.length,checks},null,2));
