#!/usr/bin/env node
/** Authored UI / real Wasm adapter checks. This is NOT a browser playtest. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url);
const [source,html,contract,wasm]=await Promise.all([
  readFile(new URL('web/game.js',root),'utf8'),
  readFile(new URL('web/index.html',root),'utf8'),
  readFile(new URL('engine/contract.json',root),'utf8').then(JSON.parse),
  readFile(new URL('engine/perfect_pour_engine.wasm',root))
]);
const {instance}=await WebAssembly.instantiate(wasm,{}),engine=instance.exports;
const fieldsMatch=source.match(/const F=(\{[^;]+\});/);
assert.ok(fieldsMatch,'The renderer must declare its snapshot adapter');
const F=vm.runInNewContext(`(${fieldsMatch[1]})`);
const aliases={
  goal:'orderGoal',combo:'comboMultiplier',milestone:'milestoneBonus',lifetime:'lifetimeGross',
  owned:'signLevel',cost:'signCost',canBuy:'mayBuyNow',spendable:'spendableCash',reserve:'wageReserve',
  wages:'wagesPaid',customers:'lifetimeCustomers',basePay:'basePayout',modePay:'modeMultiplier',
  signPay:'signMultiplier',foamScale:'foamMultiplier',good:'lastWasGood',net:'shiftNet',bestShift:'bestShiftGross',
  waste:'beverageWasteMl',patience:'patienceFraction',ingredientTotal:'shiftIngredientCosts',
  cleanupTotal:'shiftCleanupCosts',refundTotal:'shiftRefunds',signTotal:'shiftSignRevenue',serviceTotal:'shiftServiceTips',
  demand:'queuedDemand',missed:'missedCustomers',interior:'interiorLevel',catering:'cateringLevel',
  nextStreak:'nextStreakGoal',nextReward:'nextStreakReward',hardcoreBest:'hardcoreBestStreak',easyBest:'easyBestStreak',
  cleanupSaved:'cleanupSavedSeconds',training:'trainingLevel',tier:'businessTier',canPressure:'mayChangePressure',speedTip:'serviceTipPotential',
  canRecipe:'mayEditRecipe',recipeFizz:'recipeFizzMultiplier'
};
for(const [name,index] of Object.entries(F))assert.equal(index,contract.snapshot.fields[aliases[name]||name],`UI field ${name} matches the engine contract`);
assert.equal(engine.state_len(),contract.snapshot.length);
assert.equal(engine.save_len(),contract.save.length);
for(const name of new Set([...source.matchAll(/(?<![\w.])engine\.(\w+)\s*\(/g)].map(match=>match[1])))assert.equal(typeof engine[name],'function',`Engine export ${name} is available to the UI`);

// Inspect authored HTML structure; this does not model CSS, browser focus,
// accessibility-tree behavior, events, or user input.
const stack=[],elements=new Map();
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const markup=html.replace(/<!--[\s\S]*?-->/g,'');
for(const match of markup.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)>/g)){
  const tag=match[2].toLowerCase();
  if(match[1]){const last=stack.map(element=>element.tag).lastIndexOf(tag);if(last>=0)stack.length=last;continue;}
  const attrs=Object.fromEntries([...match[3].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]]));
  const element={tag,attrs,ancestors:[...stack]};
  if(attrs.id){assert.equal(elements.has(attrs.id),false,`Unique authored id ${attrs.id}`);elements.set(attrs.id,element);}
  if(!voids.has(tag)&&!match[3].trimEnd().endsWith('/'))stack.push(element);
}
const literalIds=new Set([
  ...[...source.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]),
  ...[...source.matchAll(/\btext\('([^']+)'/g)].map(m=>m[1]),
  'pressure-gentle','pressure-classic','pressure-rush','hardcore-mode','easy-mode','music-volume','sound-volume',
  'intro-overlay','intro-start','new-game-button','start-button','menu-settings'
]);
for(const id of literalIds)assert.ok(elements.has(id),`Renderer target #${id} exists in authored HTML`);
for(const id of ['announcer','sound-button','music-button','help-button']){
  const element=elements.get(id);assert.ok(element);
  assert.equal(element.ancestors.some(parent=>(parent.attrs.class||'').split(/\s+/).includes('game-shell')),false,`${id} stays outside the inert game background`);
}
assert.equal(elements.get('announcer').attrs['aria-live'],'polite');
for(const id of ['pressure-gentle','pressure-classic','pressure-rush','hardcore-mode','easy-mode'])assert.equal(elements.get(id).tag,'button');
for(const id of ['intro-start','new-game-button','start-button','menu-settings']){
  const element=elements.get(id);assert.equal(element.tag,'button');
  assert.equal(element.ancestors.some(parent=>(parent.attrs.class||'').split(/\s+/).includes('game-shell')),false,`${id} remains usable while the game background is inert`);
}
for(const id of ['welcome-hardcore','welcome-easy'])assert.equal(elements.has(id),false,'Starting screens do not offer difficulty selection');
for(const id of ['hardcore-mode','easy-mode'])assert.equal(elements.get(id).ancestors.some(parent=>['intro-overlay','welcome-overlay'].includes(parent.attrs.id)),false,'Difficulty controls remain in the game');
assert.equal(elements.get('pour-button').tag,'button');
for(const id of ['review-button','serve-button','next-button','again-button'])assert.equal(elements.has(id),false,`${id} is replaced by the single phase-aware primary button`);
for(const id of ['primary-label','primary-hint','counter-action-slot','result-action-slot','summary-action-slot'])assert.ok(elements.has(id),`The shared primary action has its ${id} target`);
assert.equal(elements.get('pour-button').ancestors.some(parent=>parent.attrs.id==='counter-action-slot'),true,'The one authored primary button starts in the counter action slot');

// Exercise the actual save adapter functions against the compiled Rust engine.
// No DOM or browser APIs are supplied or imitated here.
const adapterStart=source.indexOf('  function captureSave(){'),adapterEnd=source.indexOf('  function saveCareer(){');
assert.ok(adapterStart>=0&&adapterEnd>adapterStart);
const readState=()=>new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());
const adapter=vm.runInNewContext(source.slice(adapterStart,adapterEnd)+'\n({captureSave,applySave});',{engine,Float64Array,refreshState:readState});
engine.reset(412);
assert.equal(readState()[F.hardcore],1,'A fresh career starts in Hardcore');
const current=adapter.captureSave();
assert.equal(current.version,103);assert.equal(current.engine.length,120);assert.equal(current.engine[0],103);
for(const name of ['v101-untouched','v101-paid','v101-staffed-closed','v102-untouched','v102-paid','v102-partial-hardcore','v102-partial-easy']){
  const fixture=JSON.parse(await readFile(new URL(`engine/fixtures/${name}.json`,root),'utf8'));
  adapter.applySave(fixture);
  assert.equal(adapter.captureSave().version,103,`${name} is migrated into103`);
  assert.equal(readState()[F.selectedSoda],readState()[2],`${name} retains its existing base`);
  assert.equal(readState()[F.recipeAccuracy],100,`${name} does not acquire a retroactive recipe mistake`);
  assert.equal(readState()[F.orderedCherries]+readState()[F.orderedLime]+readState()[F.orderedSyrup],0,`${name} retains its plain current order`);
  if(fixture.expectedRestoreSnapshot)assert.deepEqual(Array.from(readState().slice(0,98)),fixture.expectedRestoreSnapshot,`${name} preserves the observed V1.02 restore behavior`);
}
assert.throws(()=>adapter.applySave({...current,version:101}),/business save/,'Version and array length must agree');
assert.throws(()=>adapter.applySave({...current,version:104}),/business save/,'Unknown formats cannot reach Rust restore');
assert.throws(()=>adapter.applySave({...current,engine:current.engine.map((value,index)=>index===21?NaN:value)}),/business save/,'Invalid numbers cannot reach Rust restore');
const prepareOrder=()=>{const s=readState();assert.equal(engine.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]),1);};

engine.reset(415);prepareOrder();engine.step(.25,0);engine.step(.25,0);
const preparing=adapter.captureSave(),prepElapsed=readState()[15];
adapter.applySave(preparing);
assert.equal(readState()[0],0);assert.equal(readState()[F.attempted],0,'A saved recipe is not a pour attempt');
assert.equal(readState()[F.recipeLocked],0);assert.equal(readState()[F.recipeAccuracy],100);
assert.equal(readState()[15],prepElapsed,'Preparation time survives reload');
assert.equal(readState()[F.prepStarted],1);assert.equal(readState()[F.cash],0);

engine.reset(413);prepareOrder();engine.set_pressure(0);assert.equal(engine.begin_pour(),1);
for(let i=0;i<6;i++)engine.step(.25,0);
const interrupted=adapter.captureSave();adapter.applySave(interrupted);
assert.equal(readState()[0],1,'Restored Hardcore hold is committed, not returned as a free retry');
assert.equal(readState()[16],1);const committed=adapter.captureSave(),cash=readState()[F.cash];
adapter.applySave(committed);adapter.applySave(committed);
assert.equal(readState()[16],1);assert.equal(readState()[F.cash],cash,'Repeated paid-save imports cannot pay the cup again');

engine.reset(414);prepareOrder();engine.set_mode(0);engine.begin_pour();engine.step(.25,0);engine.end_pour();
adapter.applySave(adapter.captureSave());assert.equal(readState()[0],0);assert.equal(readState()[F.hardcore],0,'An unfinished Easy cup remains an Easy cup on restore');
engine.serve();engine.next_order();assert.equal(readState()[F.hardcore],1,'After finishing that cup, the default returns to Hardcore');

// A rounded display must never claim the next grade's threshold while showing
// a lower fill grade, including values rounded up by the f32 snapshot. Recipe
// penalties can separately lower the final customer stars.
const scoreLine=source.split('\n').find(line=>line.trimStart().startsWith('const scoreText='));
assert.ok(scoreLine);
const scoreText=vm.runInNewContext(scoreLine+'\nscoreText;');
for(const [value,stars,expected] of [[88,3,'87.9'],[87.99999237060547,3,'87.9'],[96,4,'95.9'],[100,5,'100.0'],[88,4,'88.0'],[49.99999,1,'49.9']])assert.equal(scoreText(value,stars),expected,`Score ${value} with ${stars} stars has a truthful boundary label`);

// Unit-check the actual persistence functions at their storage/callback
// boundaries. These fakes do not model tabs, DOM focus, or storage-event timing.
const keyDeclaration=source.match(/const SAVE_KEY=[^;]+;/)?.[0];
assert.ok(keyDeclaration);
const keys=vm.runInNewContext(keyDeclaration+'\n({SAVE_KEY,LEGACY_SAVE_KEYS});');
assert.equal(keys.SAVE_KEY,'perfect-pour-business-v103');
assert.deepEqual(Array.from(keys.LEGACY_SAVE_KEYS),['perfect-pour-business-v102','perfect-pour-business-v101']);
for(const key of keys.LEGACY_SAVE_KEYS)assert.notEqual(keys.SAVE_KEY,key,'New expansion data must never share an old release write key');
const saveStart=source.indexOf('  function saveCareer(){'),saveEnd=source.indexOf('  function exportSave(){');
assert.ok(saveStart>=0&&saveEnd>saveStart);
const resumeStart=source.indexOf('  function resume(){'),resumeEnd=source.indexOf('  function showHelp(){');
assert.ok(resumeStart>=0&&resumeEnd>resumeStart);
const storageListenerLine=source.split('\n').find(line=>line.includes("window.addEventListener('storage',"));
assert.ok(storageListenerLine);
function persistenceFixture({readFails=false,writeFails=false}={}){
  const stored=new Map(keys.LEGACY_SAVE_KEYS.map(key=>[key,'legacy business stays intact']));
  const effects=[],labels=new Map(),restartButton={disabled:false};let writes=0,reloads=0,storageCallback;
  const scope={...keys,ready:true,careerActive:true,externalSave:false,lastSavedRaw:null,storageAvailable:true,
    keyHeld:true,settlingSpaceHeld:true,mode:'playing',captureSave:adapter.captureSave,
    localStorage:{
      getItem(key){if(readFails)throw new Error('Storage unavailable');return stored.get(key)??null;},
      setItem(key,value){if(writeFails)throw new Error('Quota denied');writes++;stored.set(key,value);}
    },
    clearInput(){effects.push('clear input');},
    setMode(next,focus){scope.mode=next;effects.push({mode:next,focus});},
    text(id,value){labels.set(id,value);},
    announce(message){effects.push({announcement:message});},
    $(id){assert.equal(id,'pause-restart');return restartButton;},
    openAudio(){effects.push('audio gesture');},
    window:{location:{reload(){reloads++;}},addEventListener(name,callback){assert.equal(name,'storage');storageCallback=callback;}}
  };
  const context=vm.createContext(scope);
  const api=vm.runInContext(source.slice(saveStart,saveEnd)+source.slice(resumeStart,resumeEnd)+'\n({saveCareer,handleExternalSave,resume});',context);
  vm.runInContext(storageListenerLine,context);
  return {api,scope,stored,effects,labels,restartButton,writes:()=>writes,reloads:()=>reloads,storageCallback};
}
const ordinary=persistenceFixture();ordinary.api.saveCareer();
assert.equal(ordinary.writes(),1);
const firstRaw=ordinary.stored.get(keys.SAVE_KEY);
assert.equal(JSON.parse(firstRaw).version,103);assert.equal(ordinary.scope.lastSavedRaw,firstRaw);
for(const key of keys.LEGACY_SAVE_KEYS)assert.equal(ordinary.stored.get(key),'legacy business stays intact');
assert.equal(ordinary.scope.storageAvailable,true);assert.equal(ordinary.scope.externalSave,false);
engine.reset(900);ordinary.api.saveCareer();assert.equal(ordinary.writes(),2,'An unchanged backing save allows the next ordinary checkpoint');
engine.reset(901);const newerRaw=JSON.stringify(adapter.captureSave());ordinary.stored.set(keys.SAVE_KEY,newerRaw);
engine.reset(902);ordinary.api.saveCareer();
assert.equal(ordinary.writes(),2,'A changed backing save is never overwritten by the stale career');
assert.equal(ordinary.stored.get(keys.SAVE_KEY),newerRaw);assert.equal(ordinary.scope.externalSave,true);
assert.equal(ordinary.scope.mode,'pause');assert.equal(ordinary.scope.keyHeld,false);assert.equal(ordinary.scope.settlingSpaceHeld,false);
assert.equal(ordinary.restartButton.disabled,true);assert.equal(ordinary.labels.get('resume-button'),'LOAD LATEST SAVE');
assert.equal(ordinary.effects.filter(effect=>effect==='clear input').length,1);
ordinary.api.saveCareer();ordinary.api.handleExternalSave();
assert.equal(ordinary.writes(),2);assert.equal(ordinary.effects.filter(effect=>effect==='clear input').length,1,'A pending conflict is handled once');
ordinary.api.resume();assert.equal(ordinary.reloads(),1,'The explicit resume action reloads the authoritative save');
assert.equal(ordinary.stored.get(keys.SAVE_KEY),newerRaw,'Resume does not write the stale in-memory career');

const eventsFixture=persistenceFixture();eventsFixture.api.saveCareer();
eventsFixture.storageCallback({key:keys.SAVE_KEY,newValue:'a delayed older event'});
assert.equal(eventsFixture.scope.externalSave,false,'A delayed event cannot override the current storage comparison');
eventsFixture.stored.set(keys.SAVE_KEY,newerRaw);
for(const key of keys.LEGACY_SAVE_KEYS)eventsFixture.storageCallback({key,newValue:'old release activity'});
assert.equal(eventsFixture.scope.externalSave,false,'An old released tab cannot lock the independent103 career');
eventsFixture.storageCallback({key:keys.SAVE_KEY,newValue:newerRaw});
assert.equal(eventsFixture.scope.externalSave,true,'A relevant callback pauses only when backing storage actually differs');
assert.equal(eventsFixture.writes(),1);assert.equal(eventsFixture.stored.get(keys.SAVE_KEY),newerRaw);

for(const failure of [{readFails:true},{writeFails:true}]){
  const unavailable=persistenceFixture(failure);
  assert.doesNotThrow(()=>unavailable.api.saveCareer());
  assert.equal(unavailable.scope.storageAvailable,false);assert.equal(unavailable.scope.externalSave,false);
  assert.equal(unavailable.scope.mode,'playing','Storage denial does not turn a playable offline game into a conflict lock');
  assert.equal(unavailable.writes(),0);assert.match(unavailable.labels.get('save-status'),/Saving unavailable/);
}
const bootFallback=source.match(/const saved=([^;]+);/);
assert.ok(bootFallback,'Boot selects its newest available saved career');
for(const [current,old102,old101,expected] of [[null,'102 career','101 career','102 career'],[null,null,'101 career','101 career'],['103 career','102 career','101 career','103 career'],[null,null,null,undefined]]){
  const stored=new Map([[keys.LEGACY_SAVE_KEYS[0],old102],[keys.LEGACY_SAVE_KEYS[1],old101]]);
  const value=vm.runInNewContext(bootFallback[1],{lastSavedRaw:current,LEGACY_SAVE_KEYS:keys.LEGACY_SAVE_KEYS,localStorage:{getItem:key=>{assert.ok(stored.has(key));return stored.get(key);}}});
  assert.equal(value,expected);
}

console.log(JSON.stringify({result:'PASS',checks:[
  `${Object.keys(F).length} snapshot aliases and every called engine export match the shipped Wasm contract`,
  'Renderer targets exist; IDs are unique; one primary button has counter/review/day slots; announcer, Help, and audio controls sit outside the inert game shell',
  'The actual UI save adapter migrates genuine101/102 fixtures into103, rejects malformed data, preserves prep, commits interrupted Hardcore once, and preserves an unfinished Easy cup',
  'Displayed fill-score boundaries agree with the fill grade, including f32 rounding cases',
  'V103 saves use a distinct write key with102/101 read fallback; actual saveCareer protects a newer backing save, ignores stale event payloads, pauses once, and reloads only on explicit resume',
  'Unavailable or full storage reports the problem while leaving the game playable without a false conflict lock'
],verification:'Static authored UI structure and real Wasm adapter checks. Not browser interaction, visual QA, focus simulation, or an accessibility audit.'},null,2));
