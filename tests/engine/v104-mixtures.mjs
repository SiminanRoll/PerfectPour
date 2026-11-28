#!/usr/bin/env node
/** Two-soda rules through the public compiled-Wasm ABI, not browser automation. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [bytes,contract]=await Promise.all([
  readFile(new URL('../../engine/perfect_pour_engine.wasm',import.meta.url)),
  readFile(new URL('../../engine/contract.json',import.meta.url),'utf8').then(JSON.parse)
]);
const {instance}=await WebAssembly.instantiate(bytes,{}),e=instance.exports,I=contract.snapshot.fields;
const state=()=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const value=name=>state()[I[name]];
const capture=()=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restore=save=>{const ptr=e.save_ptr(),buffer=new Float64Array(e.memory.buffer,ptr,e.save_len());buffer.fill(0);buffer.set(save);return e.restore_save();};
const advance=seconds=>{while(seconds>1e-8){const dt=Math.min(seconds,1/120);e.step(dt,0);seconds-=dt;}};
const close=(actual,expected,message,tolerance=.001)=>assert(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} versus ${expected}`);
const prepare=()=>{const s=state();assert.equal(e.set_recipe(s[2],s[98],s[99],s[100],s[101]),1);};
const next=()=>{e.next_order();if(value('phase')===2)assert.equal(e.next_day(4603+value('day')),1);};
const pourComponentTo=beverage=>{
  const s=state();assert.equal(e.begin_pour(),1);
  advance(Math.max(0,beverage-s[64])/s[19]);e.end_pour();
  if(!s[21])assert.equal(e.serve(),1);
};
const perfect=()=>{
  prepare();assert.equal(e.set_pressure(0),1);const parts=value('isMix')?2:1;
  for(let part=0;part<parts;part++){
    const s=state();pourComponentTo(s[I.activeTarget]*s[5]);
    assert.equal(value('phase'),part===parts-1?1:0);
  }
  assert.equal(value('stars'),5,'Correct total, proportions and recipe produce a perfect drink');
};
const firstMix=()=>{
  e.reset(10407);
  for(let n=0;n<5;n++){assert.equal(value('isMix'),0);perfect();next();}
  assert.equal(value('isMix'),1);assert.equal(value('lifetimeCustomers'),5);
  return capture();
};
const ledgerNames=['cash','shiftGross','completed','lifetimeCustomers','rating','streak','perfectPours',
  'lifetimePerfect','payout','comboBonus','milestoneBonus','shiftNet','lastNet','shiftIngredientCosts',
  'shiftCleanupCosts','shiftRefunds','staffSales','staffOrders','wagesPaid'];
const ledger=()=>Object.fromEntries(ledgerNames.map(name=>[name,value(name)]));
const checks=[];

assert.equal(e.state_len(),136);assert.equal(e.save_len(),120);assert.equal(contract.saveVersion,106);
for(const [name,index] of Object.entries({orderedSecondSoda:124,firstShare:125,pourPart:126,partAttempted:127,
  activeSoda:128,activeTarget:129,firstBeverageMl:130,mixAccuracy:131,mixStars:132,isMix:133}))
  assert.equal(I[name],index,`Stable appended snapshot field ${name}`);
const introductory=firstMix(),intro=state();
assert.equal(intro[I.firstShare],.5);assert.notEqual(intro[I.orderedSecondSoda],intro[2]);
assert.equal(intro[102],intro[2],'The first soda is selected without another preparation step');
assert.equal(intro[118],0);advance(3);assert.equal(value('elapsed'),0,'Reading an untouched mixed order is free');
assert.equal(value('recipePremium'),60+intro[98]*40+intro[99]*35+intro[100]*50);
close(value('activeTarget'),intro[4]*.5,'First line is half the requested amount, not half the cup');
checks.push('customer six introduces an even mixture with a distinct second soda, automatic first-base selection, a free reading clock and a 60-cent order premium');

prepare();assert.equal(e.set_pressure(0),1);const unpaidLedger=ledger(),opening=state();
assert.equal(e.begin_pour(),1);assert.equal(e.begin_pour(),0);advance(.5);
assert(value('foam')>0);e.end_pour();
assert.equal(value('phase'),0);assert.equal(value('pourPart'),1);assert.equal(value('partAttempted'),0);
assert.equal(value('attempted'),1);assert.equal(value('holding'),0);assert.deepEqual(ledger(),unpaidLedger);
assert.equal(value('activeSoda'),opening[I.orderedSecondSoda]);close(value('activeTarget'),opening[4],'Second line is the final order target');
assert.equal(value('recipeLocked'),1);assert.equal(value('mayEditRecipe'),0);assert.equal(value('mayChangePressure'),0);
assert.equal(e.set_mode(0),0);assert.equal(e.set_pressure(2),0);assert.equal(e.set_recipe(opening[2],0,0,0,1),0);assert.equal(e.buy(0),0);
const between=capture();e.end_pour();assert.equal(e.serve(),0);assert.deepEqual(capture(),between,'Duplicate first release cannot consume the next hold');
assert.equal(e.begin_pour(),1);assert.equal(e.begin_pour(),0);advance(.4);e.end_pour();
assert.equal(value('phase'),1);assert.equal(value('completed'),opening[16]+1);
const paidLedger=ledger(),paid=state();
assert.equal(e.begin_pour(),0);assert.equal(e.serve(),0);e.end_pour();assert.deepEqual(ledger(),paidLedger);
advance(5);const settled=state();assert(settled[7]<paid[7]);
for(let index=0;index<settled.length;index++)if(![6,7].includes(index))assert.equal(settled[index],paid[index],`Paid mixture field${index} stays final while gas settles`);
for(let n=0;n<3;n++){assert.equal(restore(capture()),1);assert.deepEqual(ledger(),paidLedger);assert.equal(e.serve(),0);e.end_pour();}
checks.push('Hardcore permits one hold per soda, keeps all order locks and ledgers across the unpaid switch, and commits one immutable receipt after the final release');

// A requested ratio and the total beverage fill are independent goals.
const ratioFixture=[...introductory];ratioFixture[3]=0;ratioFixture[87]=0;ratioFixture[97]=3;ratioFixture[98]=.5;ratioFixture[53]=0;
assert.equal(restore(ratioFixture),1);prepare();
const nominal=value('target')*value('capacity');
pourComponentTo(nominal*.8);pourComponentTo(nominal);
close(value('accuracy'),100,'Compensating second pour reaches the final fill');assert.equal(value('fillStars'),5);
close(value('firstBeverageMl')/value('beverageMl'),.8,'The retained beverage records the real first proportion');
close(value('mixAccuracy'),40,'An 80/20 drink requested 50/50 loses 60 mixture points');
assert(value('mixStars')<5);assert.equal(value('recipeAccuracy'),100);assert.equal(value('stars'),value('mixStars'));
const wrongRatioPaid=capture();
assert.equal(restore(ratioFixture),1);prepare();
pourComponentTo(nominal*.7*.5);pourComponentTo(nominal*.7);
close(value('mixAccuracy'),100,'An underfilled equal mix still has the correct ratio');assert.equal(value('mixStars'),5);
assert(value('fillStars')<5);assert.equal(value('stars'),value('fillStars'));
checks.push('perfect total fill cannot hide a wrong soda ratio; perfect proportions cannot hide underfill, and the public scores preserve that distinction');

// Both difficulties must use the same bubbles, including high-pressure spills.
let parityCases=0,overflowCases=0;
const physicalFields=[6,7,8,11,12,15,19,64,65,66,128,129,130,131,132];
for(let first=0;first<4;first++)for(let second=0;second<4;second++)if(first!==second)
for(const share of [.25,.5,.75])for(const pressure of [0,1,2]){
  const fixture=[...introductory];fixture[3]=first;fixture[87]=first;fixture[97]=second;fixture[98]=share;fixture[53]=pressure;fixture[5]=.8;
  let hard;
  for(const hardcore of [true,false]){
    assert.equal(restore(fixture),1);assert.equal(e.set_mode(hardcore?1:0),1);prepare();
    const a=state();close(a[I.activeTarget],a[4]*share,'The first colored line scales the final request');
    assert.equal(a[19],Math.fround([104,94,110,98][first]*[.55,1,1.35][pressure]),'First component uses its own soda flow');
    pourComponentTo(a[4]*a[5]*share);
    const firstVolume=value('firstBeverageMl'),firstFoam=value('foam');assert(firstFoam>0);
    advance(.35);assert(value('foam')<firstFoam);
    close(value('firstBeverageMl'),firstVolume,'Settling first-component gas does not create or erase its beverage');
    const b=state();assert.equal(b[19],Math.fround([104,94,110,98][second]*[.55,1,1.35][pressure]),'The second component switches to its own soda flow');
    pourComponentTo(b[4]*b[5]);const result=state();
    const selected=physicalFields.map(index=>result[index]);
    if(hardcore){hard=selected;overflowCases+=result[8]>.001;}else assert.deepEqual(selected,hard,`${first}/${second}/${share}/${pressure}: both modes retain the same fizz and scoring`);
    assert(result[130]<=result[64]+.001);assert(result[130]>=0);parityCases++;
  }
}
assert.equal(parityCases,216);assert(overflowCases>0);
checks.push('216 mode-parity pours cover every ordered soda pair, all three ratios and pressures: first-soda settling conserves beverage, and fizz/overflow remain identical in Hardcore and Easy');

assert.equal(restore(introductory),1);prepare();assert.equal(e.set_pressure(0),1);
const beforeReload=ledger();assert.equal(e.begin_pour(),1);advance(.4);const firstHeld=capture();
assert.equal(restore(firstHeld),1);assert.equal(value('phase'),0);assert.equal(value('pourPart'),1);
assert.equal(value('partAttempted'),0);assert.equal(value('holding'),0);assert.deepEqual(ledger(),beforeReload);
const restoredBoundary=capture();
for(let n=0;n<3;n++)for(const checkpoint of [firstHeld,restoredBoundary]){
  assert.equal(restore(checkpoint),1);assert.deepEqual(capture(),restoredBoundary);assert.deepEqual(ledger(),beforeReload);
}
assert.equal(e.begin_pour(),1);advance(.4);const secondHeld=capture();
assert.equal(restore(secondHeld),1);assert.equal(value('phase'),1);assert.equal(value('completed'),beforeReload.completed+1);
const restoredPayment=ledger(),receipt=capture();
for(let n=0;n<3;n++)for(const checkpoint of [secondHeld,receipt]){
  assert.equal(restore(checkpoint),1);e.end_pour();assert.equal(e.serve(),0);assert.equal(e.begin_pour(),0);assert.deepEqual(ledger(),restoredPayment);
}
checks.push('reloading first-stage Hardcore consumes only that hold; repeated between-stage reloads preserve the second budget; interrupted final-stage restore pays exactly once');

assert.equal(restore(introductory),1);assert.equal(e.set_mode(0),1);prepare();assert.equal(e.set_pressure(0),1);
const easyLedger=ledger();assert.equal(e.begin_pour(),1);advance(.2);e.end_pour();
assert.equal(value('pourPart'),0);assert.deepEqual(ledger(),easyLedger);
assert.equal(restore(capture()),1);assert.equal(value('hardcore'),0);assert.equal(value('pourPart'),0);
assert.equal(e.begin_pour(),1);advance(.2);e.end_pour();assert.equal(value('pourPart'),0);
assert.equal(e.serve(),1);assert.equal(value('pourPart'),1);assert.equal(value('partAttempted'),0);assert.deepEqual(ledger(),easyLedger);
assert.equal(e.serve(),0,'An Easy advance cannot immediately serve an untouched second part');
assert.equal(restore(capture()),1);assert.equal(value('hardcore'),0);assert.equal(value('pourPart'),1);assert.equal(value('partAttempted'),0);
assert.equal(e.begin_pour(),1);advance(.2);e.end_pour();assert.equal(restore(capture()),1);
assert.equal(value('hardcore'),0);assert.equal(value('holding'),0);assert.equal(value('pourPart'),1);
assert.equal(e.begin_pour(),1);advance(.2);e.end_pour();assert.equal(value('phase'),0);
assert.equal(e.serve(),1);assert.equal(value('completed'),easyLedger.completed+1);
const easyPaid=ledger();assert.equal(e.serve(),0);e.end_pour();assert.deepEqual(ledger(),easyPaid);
e.next_order();assert.equal(value('hardcore'),1,'A resumed Easy drink returns to default Hardcore only after the whole customer');
checks.push('Easy can top up and reload either component, advances explicitly without payment, requires a second attempt, and restores Hardcore only after serving the complete cup');

for(const name of ['preparing','partial-hardcore','partial-easy','paid','staffed-closed']){
  const legacy=JSON.parse(await readFile(new URL(`../../engine/fixtures/v103-${name}.json`,import.meta.url),'utf8'));
  assert.equal(legacy.version,103);assert.equal(legacy.engine[0],103);assert.equal(legacy.engine.length,120);
  assert.match(legacy.sourceEngineSha256,/^[a-f0-9]{64}$/);assert.equal(legacy.expectedRestoreSnapshot.length,124);
  assert.equal(restore(legacy.engine),1,name);
  assert.deepEqual(state().slice(0,124),legacy.expectedRestoreSnapshot,`${name}: all 124 released snapshot fields are preserved`);
  assert.equal(value('isMix'),0);assert.equal(value('orderedSecondSoda'),4);assert.equal(value('firstShare'),1);
  const migrated=capture(),migratedLedger=ledger();assert.equal(migrated[0],106);
  assert.equal(restore(migrated),1);assert.deepEqual(ledger(),migratedLedger);
}
checks.push('five genuine released 103 fixtures preserve all 124 historical snapshot fields, current recipes and ledger state while migrating to 106 without retroactive mixtures');

for(const [index,badValue] of [[97,5],[97,introductory[3]],[98,0],[98,.4],[98,1],[99,2],[99,1],[100,1],[101,1],[102,1],[103,1],[104,1],[106,1],[119,1]]){
  const corrupt=[...introductory];corrupt[index]=badValue;const before=state();
  assert.equal(restore(corrupt),0,`Malformed mixture field${index}=${badValue} rejects`);assert.deepEqual(state(),before);
}
const forgedReceipt=[...wrongRatioPaid];forgedReceipt[13]=5;
const beforeForged=state();assert.equal(restore(forgedReceipt),0,'A paid wrong-ratio cup cannot claim five stars on import');assert.deepEqual(state(),beforeForged);
checks.push('invalid second sodas, ratios, component budgets, impossible fluid ownership, reserved slots and forged paid grades reject atomically');

e.reset(4104);let mixes=0,singles=0;const shares=new Set();
for(let customer=0;customer<240;customer++){
  const s=state(),serial=s[53];
  if(serial<5)assert.equal(s[133],0);
  if(serial===5){assert.equal(s[133],1);assert.equal(s[125],.5);}
  if(s[133]){
    mixes++;shares.add(s[125]);assert.notEqual(s[2],s[124]);assert.equal(s[101],1);
    assert(s[98]+s[99]+s[100]<=1,'A mixture requests at most one garnish action');
    if(serial<12)assert.equal(s[125],.5,'Quarter ratios are introduced after the first twelve completed customers');
    assert.equal(s[102],s[2]);assert.equal(s[118],0);
  }else singles++;
  perfect();
  for(const [item,owned,cost] of [[9,110,113],[10,111,114],[11,112,115]]){const current=state();if(!current[owned]&&current[cost]<=current[47])assert.equal(e.buy(item),1);}
  next();
}
assert(mixes>30&&mixes<140,'Mixed orders remain occasional across a deterministic 240-customer career');
assert(singles>0);assert.deepEqual([...shares].sort(),[.25,.5,.75]);
checks.push(`240 generated customers include ${mixes} mixtures and ${singles} singles, introduce every ratio gradually, retain simple requests, and remain five-star reachable`);

console.log(JSON.stringify({result:'PASS',version:contract.version,snapshotFields:e.state_len(),saveFields:e.save_len(),parityCases,checks},null,2));
