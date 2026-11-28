#!/usr/bin/env node
/** Actual compiled-Wasm recipe rules and migration, not browser automation. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {instance}=await WebAssembly.instantiate(await readFile(new URL('../../engine/perfect_pour_engine.wasm',import.meta.url)),{}),e=instance.exports;
const contract=JSON.parse(await readFile(new URL('../../engine/contract.json',import.meta.url),'utf8')),I=contract.snapshot.fields;
const s=()=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const v=name=>s()[I[name]];
const save=()=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restore=a=>{const p=e.save_ptr(),b=new Float64Array(e.memory.buffer,p,e.save_len());b.fill(0);b.set(a);return e.restore_save();};
const step=t=>{while(t>1e-8){const d=Math.min(t,1/120);e.step(d,0);t-=d;}};
const recipe=()=>{const a=s();assert.equal(e.set_recipe(a[2],a[98],a[99],a[100],a[101]),1);};
const perfect=()=>{
 recipe();e.set_pressure(0);const parts=v('isMix')?2:1;
 for(let part=0;part<parts;part++){
  const a=s();assert.equal(e.begin_pour(),1);step(Math.max(0,a[I.activeTarget]*a[5]-a[64])/a[19]);
  e.end_pour();if(!a[21])assert.equal(e.serve(),1);
  assert.equal(v('phase'),part===parts-1?1:0);
 }
 assert.equal(v('stars'),5);
};
const next=()=>{e.next_order();if(v('phase')===2)assert.equal(e.next_day(v('day')+7109),1);};
const checks=[];
assert.equal(e.state_len(),136);assert.equal(e.save_len(),120);e.reset(1);
assert.equal(v('selectedSoda'),4);assert.equal(v('orderedCherries'),1);assert.equal(e.begin_pour(),0);assert.equal(v('attempted'),0);
const fresh=save();for(const args of [[5,0,0,0,1],[0,6,0,0,1],[0,0,1,0,1],[0,0,0,1,1],[0,0,0,0,0]]){assert.equal(e.set_recipe(...args),0);assert.deepEqual(save(),fresh);}
e.set_recipe(4,0,0,0,1);step(3);assert.equal(v('elapsed'),0);
e.set_recipe(4,1,0,0,1);step(2);assert(v('elapsed')>1.99);assert.equal(v('selectedSoda'),4);assert.equal(v('attempted'),0);assert.equal(v('cash'),0);
const prep=save();assert.equal(restore(prep),1);assert.deepEqual(save(),prep);assert.equal(e.begin_pour(),0);recipe();
assert.equal(e.begin_pour(),1);const held=save();assert.equal(e.set_recipe(3,0,0,0,1),0);assert.deepEqual(save(),held);
step(.4);e.end_pour();assert.equal(v('recipeLocked'),1);assert.equal(v('mayEditRecipe'),0);assert.equal(e.begin_pour(),0);
checks.push('Unchosen base cannot consume a pour; atomic recipe validation, prep clock, prep reload and first-hold recipe lock');

e.reset(19);e.set_pressure(0);e.set_recipe(3,1,0,0,1);assert.equal(v('flowRate'),Math.fround(98*.55));const wrong=s();e.begin_pour();step(wrong[4]*wrong[5]/wrong[19]);e.end_pour();
assert(v('accuracy')>99.99);assert.equal(v('fillStars'),5);assert.equal(v('recipeAccuracy'),40);assert.equal(v('stars'),2);assert.equal(v('recipeMistakes'),1);assert.equal(v('streak'),0);
checks.push('Chosen base controls physical flow; perfect fill still receives a two-star cap for the wrong base');

e.reset(311);while(v('cash')<10000){perfect();if(v('cash')<10000)next();}
for(const [item,cost]of [[9,1000],[10,1800],[11,2600]]){const cash=v('cash'),request=s().slice(98,102);assert.equal(e.buy(item),1);assert.equal(v('cash'),cash-cost);assert.deepEqual(s().slice(98,102),request);assert.equal(e.buy(item),0);}
next();assert.deepEqual(s().slice(110,113),[1,1,1]);const available=save();
let baselineNet=0,baselineIngredients=0,baselineQuote=0;
for(const extras of [0,2]){
 assert.equal(restore(available),1);const a=s();e.set_pressure(0);e.set_recipe(a[2],extras,a[99],a[100],a[101]);
 const quote=v('menuPrice');assert.equal(v('selectedAddinCost'),extras*8+a[99]*10+a[100]*12);
 const parts=v('isMix')?2:1;
 for(let part=0;part<parts;part++){const before=s();e.begin_pour();step(Math.max(0,before[I.activeTarget]*before[5]-before[64])/before[19]);e.end_pour();}
 if(extras===0){baselineIngredients=v('ingredientCost');baselineQuote=quote;baselineNet=v('lastNet');}
 else{assert.equal(quote,baselineQuote);assert.equal(v('ingredientCost'),baselineIngredients+16);}
}
checks.push('Station purchases use earned money, preserve the current request, and added garnish costs do not raise the quoted order price');

assert.equal(restore(available),1);const seen={plain:false,doubleCherry:false,lime:false,syrup:false,light:false,bold:false};
for(let n=0;n<240;n++){
 const a=s();assert(a[99]===0||a[110]===1);assert(a[100]===0||a[111]===1);assert(a[101]===1||a[112]===1);
 assert([a[98],a[99],a[100]].filter(x=>x>0).length<=2);
 seen.plain||=a[123]===0;seen.doubleCherry||=a[98]===2;seen.lime||=a[99]===1;seen.syrup||=a[100]>0;seen.light||=a[101]===0;seen.bold||=a[101]===2;
 perfect();next();
}
assert(Object.values(seen).every(Boolean));checks.push('240 generated advanced orders cover plain rests, double cherries, lime, syrup and both custom blends, with at most two add-in types');

for(const name of ['untouched','paid','partial-hardcore','partial-easy']){
 const old=JSON.parse(await readFile(new URL(`../../engine/fixtures/v102-${name}.json`,import.meta.url),'utf8'));
 assert.equal(restore(old.engine),1,name);assert.deepEqual(s().slice(0,98),old.expectedRestoreSnapshot,`${name}: original102 simulation result`);
 assert.deepEqual(s().slice(98,102),[0,0,0,1]);assert.equal(v('selectedSoda'),old.engine[3]);assert.equal(v('selectedAddinCost'),0);
 const migrated=save();assert.equal(migrated[0],106);const cash=v('cash'),completed=v('completed');assert.equal(restore(migrated),1);assert.equal(v('cash'),cash);assert.equal(v('completed'),completed);
 if(name==='paid'||name==='partial-hardcore'){e.end_pour();e.serve();assert.equal(v('cash'),cash);assert.equal(e.begin_pour(),0);}
 if(name==='partial-easy'){assert.equal(v('hardcore'),0);assert.equal(v('holding'),0);assert.equal(e.set_recipe(0,1,0,0,1),0);assert.equal(e.begin_pour(),1);step(.2);e.end_pour();assert.equal(e.serve(),1);}
}
checks.push('Four genuine102 fixtures match every original98 snapshot field on restore; migration adds no retroactive recipe costs or duplicate payments');

e.reset(99);perfect();const committed=save();for(const [index,badValue]of [[83,3],[84,1],[85,1],[87,5],[92,2],[96,12],[106,1],[88,0]]){const bad=[...committed];bad[index]=badValue;const before=s();assert.equal(restore(bad),0,`invalid recipe field${index}`);assert.deepEqual(s(),before);}
checks.push('Malformed recipe/import data rejects atomically, including inconsistent paid recipe grades');
console.log(JSON.stringify({result:'PASS',version:contract.version,snapshotFields:136,saveFields:120,checks},null,2));
