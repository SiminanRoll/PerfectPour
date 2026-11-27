#!/usr/bin/env node
/** Public-Wasm business acceptance. This is a simulation, not browser automation. */
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const bytes=await readFile(process.argv[2]||'engine/perfect_pour_engine.wasm');
const module=await WebAssembly.compile(bytes);
const fresh=async()=>{const {exports:e}=await WebAssembly.instantiate(module,{});e.reset(314159);return e;};
const state=e=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const advance=(e,t)=>{while(t>1e-8){const dt=Math.min(t,1/120);e.step(dt,0);t-=dt;}};
const perfect=e=>{
 assert.equal(e.set_pressure(0),1);let s=state(e);
 assert.equal(e.set_recipe(s[2],s[98],s[99],s[100],s[101]),1);
 const parts=s[133]?2:1;
 for(let part=0;part<parts;part++){
  s=state(e);assert.equal(e.begin_pour(),1);advance(e,Math.max(0,s[129]*s[5]-s[64])/s[19]);
  e.end_pour();if(!s[21])assert.equal(e.serve(),1);
  assert.equal(state(e)[0],part===parts-1?1:0);
 }
 s=state(e);assert.equal(s[12],5);return s;
};
const finish=e=>{while(state(e)[0]!==2){if(state(e)[0]===0)perfect(e);e.next_order();}return state(e);};
const checks=[];
const e=await fresh();assert.equal(e.buy(0),0);finish(e);e.next_day(77);finish(e);
const earned=state(e)[20];assert(earned>10000);for(const item of [0,1,4,5])assert.equal(e.buy(item),1);
let s=state(e);assert.equal(s[20],earned-1200-1800-2800-4200);assert.equal(s[51],0);assert.equal(s[52],0);
assert.equal(e.next_day(88),1);s=state(e);assert.equal(s[51],1);assert.equal(s[52],1);assert.equal(s[48],400);assert.equal(s[25],12);assert.equal(s[81],5);assert.equal(s[82],7);
const opening=s[20];finish(e);s=state(e);assert.equal(s[50],400);assert.equal(s[80],5);assert(s[49]>0);assert.equal(s[83],2);
assert.equal(s[20],opening+s[10]-s[75]-s[76]-s[50]);assert.equal(s[59],s[10]-s[75]-s[76]-s[50]);
const closed=s;e.next_order();e.end_pour();e.serve();assert.deepEqual(state(e),closed);
checks.push('All investments funded by earned sales; patio adds side-lane capacity, staff start next day and payroll/costs reconcile once');
assert.equal(e.buy(7),0,'Catering requires an interior');
while(state(e)[20]<31000){e.next_day(state(e)[24]+101);finish(e);}
for(const item of [6,7,8])assert.equal(e.buy(item),1,`purchase${item}`);
e.next_day(99);s=state(e);assert.equal(s[81],11);assert.equal(s[82],19);finish(e);s=state(e);assert(s[80]>=10);assert(s[49]>5000);
checks.push('Interior, catering and training are affordable from earned income and expand actual staffed throughput and prices');
const keep=await fresh(),reset=await fresh();
for(let n=1;n<=40;n++){
 for(const run of [keep,reset]){perfect(run);run.next_order();if(state(run)[0]===2)run.next_day(state(run)[24]+91);}
 if(n%8===0){reset.set_mode(0);reset.set_mode(1);}
}
assert(state(keep)[20]>state(reset)[20]);assert.equal(state(keep)[90],40);
checks.push('Maintaining40 good pours earns more than repeatedly resetting after8; separate Hardcore best record retained');
console.log(JSON.stringify({result:'PASS',version:'1.04',wasmBytes:bytes.length,checks},null,2));
