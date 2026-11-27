#!/usr/bin/env node
/** Deterministic compiled-Wasm balance evidence. Synthetic timing profiles are not measured people. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const bytes=await readFile(new URL('../../engine/perfect_pour_engine.wasm',import.meta.url));
const {instance}=await WebAssembly.instantiate(bytes,{}),e=instance.exports;
const s=()=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const save=()=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
const restore=data=>{const p=e.save_ptr();new Float64Array(e.memory.buffer,p,e.save_len()).set(data);assert.equal(e.restore_save(),1);};
const advance=t=>{while(t>1e-8){let dt=Math.min(t,1/120);e.step(dt,0);t-=dt;}};
const pour=t=>{const a=s();if(a[109]===1)assert.equal(e.set_recipe(a[2],a[98],a[99],a[100],a[101]),1);assert.equal(e.begin_pour(),1);advance(t);e.end_pour();if(!s()[21])assert.equal(e.serve(),1);return s();};
const targets=[.45,.55,.60,.65,.70,.75,.8];
const stats=Array.from({length:3},()=>({cases:0,fiveStars:0,fourOrBetter:0,spillCases:0,minAccuracy:100,minFoamMl:Infinity,maxFoamMl:0,maxBeverageWasteMl:0}));
let parityCases=0;
for(let blend=0;blend<3;blend++)for(let tap=0;tap<3;tap++)for(let soda=0;soda<4;soda++)for(let cup=0;cup<4;cup++)for(const target of targets)for(let pressure=0;pressure<3;pressure++){
 e.reset(31415);const fixture=save();fixture[3]=soda;fixture[4]=cup;fixture[5]=target;fixture[37]=tap;fixture[53]=pressure;fixture[86]=blend;fixture[95]=1;
 restore(fixture);let before=s(),hard=pour(before[4]*before[5]/before[19]);
 const row=stats[pressure];row.cases++;row.fiveStars+=hard[12]===5;row.fourOrBetter+=hard[12]>=4;row.spillCases+=hard[8]>.001;
 row.minAccuracy=Math.min(row.minAccuracy,hard[11]);row.minFoamMl=Math.min(row.minFoamMl,hard[7]);row.maxFoamMl=Math.max(row.maxFoamMl,hard[7]);row.maxBeverageWasteMl=Math.max(row.maxBeverageWasteMl,hard[66]);
 if(pressure===0){assert.equal(hard[12],5,`Gentle target ${soda}/${cup}/${target}/${tap}`);assert(hard[11]>99.99);assert.equal(hard[66],0);assert(hard[7]>1);}
 restore(fixture);e.set_mode(0);const easy=pour(before[4]*before[5]/before[19]);
 for(const index of [4,5,6,7,8,11,12,15,19,64,65,66])assert.equal(easy[index],hard[index],`mode parity field ${index}`);
 parityCases+=2;
}
assert.equal(parityCases,6048);assert.equal(stats[0].fiveStars,1008);assert(stats[1].spillCases>0&&stats[2].spillCases>stats[1].spillCases);
const random=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return((seed>>>0)+1)/4294967297;};
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const round=x=>Math.round(x*100)/100;
const costFields=[40,41,42,43,44,45,86,87,94,113,114,115];
const ownedFields=[34,35,36,37,38,39,84,85,93,110,111,112];
const maxima=[3,2,2,2,1,1,3,3,3,1,1,1];
const full=()=>ownedFields.every((field,i)=>s()[field]===maxima[i]);
const buyAffordable=()=>{
 let guard=0;
 while(++guard<30){
  const snapshot=s(),available=costFields.map((field,item)=>({item,price:snapshot[field]})).filter(x=>x.price>0&&x.price<=snapshot[47]&&(x.item!==7||snapshot[84]>0&&snapshot[39]>0)&&(x.item!==8||snapshot[39]>0)).sort((a,b)=>a.price-b.price||a.item-b.item);
  if(!available.length)return;assert.equal(e.buy(available[0].item),1);
 }
 throw new Error('purchase loop did not terminate');
};
const progression=[];
for(const timingSd of [0,.07,.15]){
 const runs=[];
 for(let seed=1;seed<=16;seed++){
  e.reset(seed*7919);const rand=random(seed*104729);let pours=0,accuracies=[],firstPurchase=0,previousOwned=0;
  while(!full()&&s()[24]<=60){
   const before=s();e.set_pressure(0);const request=s();
   const noise=timingSd*Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
   const result=pour(Math.max(0,request[4]*request[5]/request[19]+noise));
   pours++;accuracies.push(result[11]);buyAffordable();
   const owned=ownedFields.reduce((sum,i)=>sum+s()[i],0);
   if(owned>previousOwned&&!firstPurchase)firstPurchase=pours;previousOwned=owned;
   if(full())break;e.next_order();if(s()[0]===2)e.next_day(seed*65537+s()[24]);
   assert(s()[20]>=0);
  }
  assert(full(),'Modeled career must reach all upgrades within60shifts');
  runs.push({seed,pours,days:s()[24],firstPurchase,meanFillScore:round(mean(accuracies)),cash:s()[20]});
 }
 progression.push({timingSdMilliseconds:timingSd*1000,pressure:'Gentle',purchasePolicy:'Cheapest affordable available upgrade after each cup',runs,poursRange:[Math.min(...runs.map(x=>x.pours)),Math.max(...runs.map(x=>x.pours))],daysRange:[Math.min(...runs.map(x=>x.days)),Math.max(...runs.map(x=>x.days))],firstPurchaseRange:[Math.min(...runs.map(x=>x.firstPurchase)),Math.max(...runs.map(x=>x.firstPurchase))]});
}
e.reset(31);
for(let day=1;day<=10;day++){
 while(s()[0]!==2){pour(0);e.next_order();}
 assert.equal(s()[20],0);assert.equal(s()[33],0);if(day<10)e.next_day(day+31);
}
const evidence={version:'1.03',engineSha256:createHash('sha256').update(bytes).digest('hex'),method:'Actual compiled Rust/Wasm.6048 nominal-hold fixtures=4bases×4cups×7targets×3tap levels×3pressures×3blends×2modes. Correct requested recipes are selected before each hold; add-ins do not displace drink volume. Gentle catalog tested at exact nominal hold; Classic/Rush results are nominal-hold diagnostics, not searched optimal ceilings. Career profiles use seeded Gaussian timing errors around Gentle nominal hold; they are sensitivity scenarios, not measured players. Recipes are selected without simulated prep delay. Menu/review time excluded. All12 upgrade types total195300cents.',catalog:stats.map((row,pressure)=>({pressure:['Gentle','Classic','Rush'][pressure],...Object.fromEntries(Object.entries(row).map(([k,v])=>[k,Number.isInteger(v)?v:round(v)]))})),modeParityCases:parityCases,emptyCareer:{days:10,pours:120,gross:0,cash:0},progression};
if(process.argv.includes('--write'))await writeFile(new URL('../../engine/balance-report.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({result:'PASS',engineSha256:evidence.engineSha256,catalog:evidence.catalog,modeParityCases:parityCases,emptyCareer:evidence.emptyCareer,progression:progression.map(({runs,...row})=>row)},null,2));
