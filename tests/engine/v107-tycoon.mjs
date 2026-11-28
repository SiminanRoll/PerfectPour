import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const bytes=await readFile(new URL('engine/perfect_pour_engine.wasm',root));
const contract=JSON.parse(await readFile(new URL('engine/contract.json',root),'utf8'));
const {instance}=await WebAssembly.instantiate(bytes,{});
const e=instance.exports;
const state=()=>Array.from(new Float32Array(e.memory.buffer,e.state_ptr(),e.state_len()));
const save=()=>Array.from(new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len()));
function restore(data){
  const a=new Float64Array(e.memory.buffer,e.save_ptr(),e.save_len());
  a.fill(0);a.set(data);return e.restore_save();
}
function advance(seconds){
  for(let remaining=seconds;remaining>1e-8;){
    const dt=Math.min(remaining,1/120);e.step(dt,0);remaining-=dt;
  }
}
function perfectCup(){
  let s=state();
  assert.equal(e.set_pressure(0),1);
  assert.equal(e.set_recipe(s[2],s[98],s[99],s[100],s[101]),1);
  for(let part=0;part<(s[133]?2:1);part++){
    s=state();
    const time=Math.max(0,s[129]*s[5]-s[64])/s[19];
    assert.equal(e.begin_pour(),1);
    advance(time);
    e.end_pour();
    if(s[21]===0)assert.equal(e.serve(),1);
  }
  assert.equal(state()[0],1);
  assert.equal(state()[12],5,'Requested drink must be a 5-star pour');
}
assert.equal(e.state_len(),148);
assert.equal(e.save_len(),120);
assert.equal(contract.saveVersion,107);
assert.equal(contract.snapshot.fields.regularId,136);
assert.equal(contract.snapshot.fields.shiftSpecialTips,143);
e.reset(2027);
let s=state();
assert.equal(s[138],0);
assert.equal(s[139],0);
assert.equal(s[136],4,'No regulars during the opening shift');
let specialsServed=0,bonusEarned=0;
for(let i=0;i<12;i++){
  const ordered=state()[2], featured=state()[138];
  perfectCup();
  s=state();
  if(ordered===featured){
    specialsServed++;
    const payment=specialsServed===3?150:25;
    assert.equal(s[141],payment,'Daily special pays each qualifying cup once');
    bonusEarned+=payment;
  }else assert.equal(s[141],0);
  assert.equal(s[139],specialsServed);
  const paid=save(),cash=s[20],hits=s[139];
  assert.equal(restore(paid),1);
  assert.equal(restore(paid),1);
  assert.equal(state()[20],cash);
  assert.equal(state()[139],hits);
  if(i<11)e.next_order();
}
assert.equal(specialsServed,3);
assert.equal(bonusEarned,200);
assert.equal(state()[143],200);
e.next_order();assert.equal(state()[0],2);
assert.equal(e.next_day(2028),1);
assert.equal(state()[24],2);
assert.equal(state()[139],0);
assert.equal(state()[143],0);
assert.equal(state()[138],1,'Featured drink rotates');
for(let i=0;i<2;i++){perfectCup();e.next_order();}
const regular=state()[136];
assert(regular>=0&&regular<4,'Third guest is a returning regular');
const beforeLoyalty=state()[144+regular];
assert.equal(beforeLoyalty,0);
perfectCup();
const served=state();
assert.equal(served[136],regular,'Regular identity is fixed through payment');
assert.equal(served[137],1);
assert.equal(served[140],20,'First regular thank-you');
const paidRegular=save(),paidCash=state()[20],shiftRegular=state()[142];
assert.equal(paidRegular[106+regular],1,'Loyalty is saved per regular');
assert.equal(restore(paidRegular),1);assert.equal(restore(paidRegular),1);
assert.equal(state()[20],paidCash);
assert.equal(state()[142],shiftRegular);
const bad=[...paidRegular];bad[106+regular]=6;
assert.equal(restore(bad),0,'Forged loyalty over the cap rejects');
assert.equal(state()[20],paidCash);
e.reset(107);
const old=save();
old[0]=106;
assert(old.slice(106).every(v=>v===0));
assert.equal(restore(old),1,'V106 business imports in place');
assert.equal(state()[139],0);
assert.equal(state()[144],0);
assert.equal(save()[0],107,'Current game writes new save version');
old[106]=1;
assert.equal(restore(old),0,'V106 reserved slots must remain zero');
console.log(JSON.stringify({result:'PASS',feature:'Daily challenge, regular loyalty, one-time payout and safe V106 migration',specialsServed,bonusEarned,regular,loyalty:1,saveVersion:107},null,2));
