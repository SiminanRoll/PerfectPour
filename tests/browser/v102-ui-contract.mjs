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
  canRecipe:'mayEditRecipe',recipeFizz:'recipeFizzMultiplier',
  loyalty0:'loyaltyRuth',loyalty1:'loyaltyCleo',loyalty2:'loyaltyMaya',loyalty3:'loyaltySasha'
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
const pressureDial=elements.get('pressure-dial');
assert.equal(pressureDial?.tag,'input');assert.equal(pressureDial.attrs.type,'range');
assert.equal(pressureDial.attrs.min,'0');assert.equal(pressureDial.attrs.max,'2');assert.equal(pressureDial.attrs.step,'1');
assert.equal(pressureDial.attrs['aria-label'],'Tap pressure');assert.ok(elements.has('pressure-readout'));
assert.equal(F.selectedIce,134);assert.equal(F.iceFizzMultiplier,135);
for(const id of ['pressure-gentle','pressure-classic','pressure-rush','hardcore-mode','easy-mode'])assert.equal(elements.get(id).tag,'button');
for(const id of ['intro-start','new-game-button','start-button','menu-settings']){
  const element=elements.get(id);assert.equal(element.tag,'button');
  assert.equal(element.ancestors.some(parent=>(parent.attrs.class||'').split(/\s+/).includes('game-shell')),false,`${id} remains usable while the game background is inert`);
}
for(const id of ['welcome-hardcore','welcome-easy'])assert.equal(elements.has(id),false,'Starting screens do not offer difficulty selection');
for(const id of ['hardcore-mode','easy-mode'])assert.equal(elements.get(id).ancestors.some(parent=>['intro-overlay','welcome-overlay'].includes(parent.attrs.id)),false,'Difficulty controls remain in the game');
assert.equal(elements.get('pour-button').tag,'button');
for(const id of ['review-button','serve-button','next-button','again-button'])assert.equal(elements.has(id),false,`${id} is replaced by the single phase-aware primary button`);
for(const id of ['primary-label','primary-hint','counter-action-slot','summary-action-slot'])assert.ok(elements.has(id),`The shared primary action has its ${id} target`);
assert.equal(elements.get('pour-button').ancestors.some(parent=>parent.attrs.id==='counter-action-slot'),true,'The one authored primary button starts in the counter action slot');
for(const id of ['easy-action','finish-details','close-result'])assert.equal(elements.get(id)?.tag,'button',`${id} is an explicit native button`);
assert.equal(elements.get('easy-action').ancestors.some(parent=>parent.attrs.id==='pour-button'),false,'Easy service is a separate control, not an alternate meaning of the pour button');
for(const id of ['finish-review','finish-stars','finish-earned','finish-fill','finish-recipe'])assert.ok(elements.has(id),`The automatic inline result has its ${id} target`);
assert.equal(elements.get('finish-review').ancestors.some(parent=>(parent.attrs.class||'').split(/\s+/).includes('overlay')),false,'The completed-cup result is visible without a full-screen review overlay');

// Exercise the actual save adapter functions against the compiled Rust engine.
// No DOM or browser APIs are supplied or imitated here.
const adapterStart=source.indexOf('  function captureSave(){'),adapterEnd=source.indexOf('  function saveCareer(){');
assert.ok(adapterStart>=0&&adapterEnd>adapterStart);
const readState=()=>new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());
const adapter=vm.runInNewContext(source.slice(adapterStart,adapterEnd)+'\n({captureSave,applySave});',{engine,Float64Array,refreshState:readState});
engine.reset(412);
assert.equal(readState()[F.hardcore],1,'A fresh career starts in Hardcore');
const current=adapter.captureSave();
assert.equal(current.version,107);assert.equal(current.engine.length,120);assert.equal(current.engine[0],107);
assert.equal(readState()[F.selectedIce],0);assert.equal(readState()[F.iceFizzMultiplier],1);
for(const name of ['v101-untouched','v101-paid','v101-staffed-closed','v102-untouched','v102-paid','v102-partial-hardcore','v102-partial-easy','v103-preparing','v103-partial-hardcore','v103-partial-easy','v103-paid','v103-staffed-closed']){
  const fixture=JSON.parse(await readFile(new URL(`engine/fixtures/${name}.json`,root),'utf8'));
  adapter.applySave(fixture);
  assert.equal(adapter.captureSave().version,107,`${name} is imported into106`);
  assert.equal(fixture.engine[0],fixture.version,`${name} retains its genuine released version`);
  assert.equal(readState()[F.selectedIce],0,`${name} imports without adding ice`);
  assert.equal(readState()[F.selectedSoda],readState()[2],`${name} retains its existing base`);
  assert.equal(readState()[F.recipeAccuracy],100,`${name} does not acquire a retroactive recipe mistake`);
  if(fixture.version<103)assert.equal(readState()[F.orderedCherries]+readState()[F.orderedLime]+readState()[F.orderedSyrup],0,`${name} retains its plain current order`);
  assert.equal(readState()[F.isMix],0,`${name} does not acquire a second soda retroactively`);
  assert.equal(readState()[F.orderedSecondSoda],4);assert.equal(readState()[F.firstShare],1);
  if(fixture.expectedRestoreSnapshot)assert.deepEqual(Array.from(readState().slice(0,fixture.expectedRestoreSnapshot.length)),fixture.expectedRestoreSnapshot,`${name} preserves every field observed in its released engine`);
}
// A zero-ice save has the unchanged V1.04 120-field payload; its old reserved
// slots are still zero. Exercise explicit V1.04 import independently of boot.
const old104={...current,version:104,engine:[104,...current.engine.slice(1)]};
assert.ok(old104.engine.slice(105).every(value=>value===0));
adapter.applySave(old104);
assert.equal(adapter.captureSave().version,107);assert.equal(readState()[F.selectedIce],0);
assert.deepEqual(adapter.captureSave().engine.slice(1),current.engine.slice(1),'Explicit104 import preserves its complete original payload');
assert.throws(()=>adapter.applySave({...old104,engine:old104.engine.map((value,index)=>index===105?1:value)}),/damaged|invalid/,'A104 save must keep its original reserved slots zero');
assert.throws(()=>adapter.applySave({...current,version:101}),/business save/,'Version and array length must agree');
assert.throws(()=>adapter.applySave({...current,version:105}),/business save/,'Unknown formats cannot reach Rust restore');
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
assert.equal(keys.SAVE_KEY,'perfect-pour-business-v107');
assert.deepEqual(Array.from(keys.LEGACY_SAVE_KEYS),[106,104,103,102,101].map(version=>`perfect-pour-business-v${version}`),'Released businesses migrate from newest to oldest');
const originalKeys=[101,102,103,104,106].map(version=>`perfect-pour-business-v${version}`);
for(const key of originalKeys)assert.notEqual(keys.SAVE_KEY,key,'V107 saves must not overwrite an old release write key');
const saveStart=source.indexOf('  function saveCareer(){'),saveEnd=source.indexOf('  function exportSave(){');
assert.ok(saveStart>=0&&saveEnd>saveStart);
const resumeStart=source.indexOf('  function resume(){'),resumeEnd=source.indexOf('  function showHelp(){');
assert.ok(resumeStart>=0&&resumeEnd>resumeStart);
const storageListenerLine=source.split('\n').find(line=>line.includes("window.addEventListener('storage',"));
assert.ok(storageListenerLine);
function persistenceFixture({readFails=false,writeFails=false}={}){
  const stored=new Map(originalKeys.map(key=>[key,'legacy business stays intact']));
  const reads=[],effects=[],labels=new Map(),restartButton={disabled:false};let writes=0,reloads=0,storageCallback;
  const scope={...keys,ready:true,careerActive:true,externalSave:false,lastSavedRaw:null,storageAvailable:true,
    keyHeld:true,settlingSpaceHeld:true,mode:'playing',captureSave:adapter.captureSave,
    localStorage:{
      getItem(key){reads.push(key);if(readFails)throw new Error('Storage unavailable');return stored.get(key)??null;},
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
  return {api,scope,stored,reads,effects,labels,restartButton,writes:()=>writes,reloads:()=>reloads,storageCallback};
}
const ordinary=persistenceFixture();ordinary.api.saveCareer();
assert.equal(ordinary.writes(),1);
const firstRaw=ordinary.stored.get(keys.SAVE_KEY);
assert.equal(JSON.parse(firstRaw).version,107);assert.equal(ordinary.scope.lastSavedRaw,firstRaw);
for(const key of originalKeys){assert.equal(ordinary.stored.get(key),'legacy business stays intact');assert.equal(ordinary.reads.includes(key),false,'Active V107 checkpoints use only the current production key');}
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
for(const key of originalKeys){
  eventsFixture.storageCallback({key,newValue:'old release activity'});
  assert.equal(eventsFixture.stored.get(key),'legacy business stays intact');
  assert.equal(eventsFixture.reads.includes(key),false,'Original business events do not read their storage keys');
}
assert.equal(eventsFixture.scope.externalSave,false,'Old-release activity cannot replace or lock an established V107 business');
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
assert.ok(bootFallback,'Boot selects current progress or a released legacy business');
for(const available of [[106,104,103,102,101],[104,103,102,101],[103,102,101],[102,101],[101],[]]){
  for(const current of [null,'current107 business']){
    const stored=new Map(available.map(version=>[`perfect-pour-business-v${version}`,`released${version}`]));
    stored.set('perfect-pour-preview-v106','independent preview business');
    const before=Array.from(stored),reads=[];
    const value=vm.runInNewContext(bootFallback[1],{lastSavedRaw:current,LEGACY_SAVE_KEYS:keys.LEGACY_SAVE_KEYS,localStorage:{getItem:key=>{reads.push(key);return stored.get(key)??null;}}});
    assert.equal(value,current||(available.length?`released${available[0]}`:undefined),'Current107 wins; otherwise the newest released business is selected');
    if(current)assert.deepEqual(reads,[],'Current progress never falls back to an older business');
    assert.ok(reads.every(key=>keys.LEGACY_SAVE_KEYS.includes(key)),'Migration only reads the released business keys');
    assert.deepEqual(Array.from(stored),before,'Boot leaves legacy and preview storage unchanged');
  }
}

// Preserve the sound/music choices already made on the public game. Exercise
// the production settings loader and writer without an audio context.
const settingsInitial=source.split('\n').find(line=>line.trimStart().startsWith('let settings='));
const settingsLoad=source.split('\n').find(line=>line.includes("try{const raw=JSON.parse(localStorage.getItem('perfect-pour-v1-settings')"));
const settingsSave=source.match(/  function saveSettings\(\)\{[^\n]+\}/)?.[0];
assert.ok(settingsInitial&&settingsLoad&&settingsSave,'Production audio settings use the established key');
const oldSettings={sound:false,music:true,musicVolume:.36,soundVolume:.74};
const storedSettings=new Map([['perfect-pour-v1-settings',JSON.stringify(oldSettings)],['perfect-pour-preview-v106-settings','preview settings stay intact']]);
const settingsReads=[],settingsWrites=[];
const settingsContext=vm.createContext({clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),localStorage:{
  getItem(key){settingsReads.push(key);return storedSettings.get(key)??null;},
  setItem(key,value){settingsWrites.push(key);storedSettings.set(key,value);}
}});
const settingsApi=vm.runInContext(settingsInitial+'\n'+settingsLoad+'\n'+settingsSave+'\n({settings,saveSettings});',settingsContext);
assert.deepEqual(JSON.parse(JSON.stringify(settingsApi.settings)),oldSettings,'Released audio preferences survive the promotion');
assert.deepEqual(settingsReads,['perfect-pour-v1-settings']);assert.deepEqual(settingsWrites,[],'Loading preferences does not write them');
settingsApi.settings.sound=true;settingsApi.saveSettings();
assert.deepEqual(settingsWrites,['perfect-pour-v1-settings']);
assert.equal(JSON.parse(storedSettings.get('perfect-pour-v1-settings')).sound,true);
assert.equal(storedSettings.get('perfect-pour-preview-v106-settings'),'preview settings stay intact');

console.log(JSON.stringify({result:'PASS',checks:[
  `${Object.keys(F).length} snapshot aliases and every called engine export match the shipped Wasm contract`,
  'Renderer targets exist; IDs are unique; Easy service is explicit and the completed-cup result is inline with optional receipt details; announcer, Help, and audio controls stay outside the inert game shell',
  'Explicit UI imports accept genuine101/102/103 fixtures and the unchanged104 schema into106 with zero ice, preserve historical snapshot fields, reject malformed data, and retain interrupted-cup rules',
  'Displayed fill-score boundaries agree with the fill grade, including f32 rounding cases',
  'V106 writes its production key, automatically selects released101–104 progress without modifying legacy entries, preserves audio preferences, protects newer saves, and reloads only on explicit resume',
  'Unavailable or full storage reports the problem while leaving the game playable without a false conflict lock'
],verification:'Static authored UI structure and real Wasm adapter checks. Not browser interaction, visual QA, focus simulation, or an accessibility audit.'},null,2));
