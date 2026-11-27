#!/usr/bin/env node
/** Actual startup/menu functions and shipped Wasm; not a browser playtest. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url);
const [source,wasm]=await Promise.all([
  readFile(new URL('web/game.js',root),'utf8'),
  readFile(new URL('engine/perfect_pour_engine.wasm',root))
]);
const module=new WebAssembly.Module(wasm);
const F=vm.runInNewContext(`(${source.match(/const F=(\{[^;]+\});/)[1]})`);
const keys=vm.runInNewContext(source.match(/const SAVE_KEY=[^;]+;/)[0]+'\n({SAVE_KEY,LEGACY_SAVE_KEYS});');
const checks=[];

function extractFunction(name){
  const start=source.indexOf(`  function ${name}(`);
  assert.ok(start>=0,`Production function ${name} exists`);
  let depth=0,quote='',line=false,block=false;
  for(let i=source.indexOf('{',start);i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==='\n')line=false;continue;}
    if(block){if(ch==='*'&&next==='/'){block=false;i++;}continue;}
    if(quote){if(ch==='\\'){i++;continue;}if(ch===quote)quote='';continue;}
    if(ch==='/'&&next==='/'){line=true;i++;continue;}
    if(ch==='/'&&next==='*'){block=true;i++;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Unclosed production function ${name}`);
}
const functionNames=['refreshState','captureSave','applySave','saveCareer','handleExternalSave',
  'startupSaveCurrent','updateMainMenu','showMainMenu','newGame','openShop','resetBusiness',
  'requestRestart','cancelRestart','showHelp','closeHelp'];
const bootStart=source.lastIndexOf('  (async()=>{');
const bootEnd=source.indexOf('  })();',bootStart);
assert.ok(bootStart>=0&&bootEnd>bootStart,'The shipped engine startup is available to execute');
const bootSource=source.slice(bootStart,bootEnd+'  })();'.length);
const leaveWindow=source.match(/const leaveWindow=\(\)=>\{[^\n]+?\};/)?.[0];
assert.ok(leaveWindow,'Exercise the actual blur/pagehide checkpoint boundary');

function capture(engine){return{format:'perfect-pour-business',version:103,engine:Array.from(new Float64Array(engine.memory.buffer,engine.save_ptr(),engine.save_len()))};}
function snapshot(engine){return new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());}
function savedCareer(kind,seed=910){
  const engine=new WebAssembly.Instance(module,{}).exports;engine.reset(seed);
  const prepare=()=>{const s=snapshot(engine);assert.equal(engine.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]),1);};
  if(kind!=='untouched')prepare();
  if(kind==='preparing')engine.step(.25,0);
  if(kind==='easy')engine.set_mode(0);
  if(['easy','interrupted','settling','finished'].includes(kind)){
    assert.equal(engine.begin_pour(),1);engine.step(.25,0);
    if(kind!=='interrupted')engine.end_pour();
  }
  if(kind==='finished'){
    for(let i=0;i<2000&&snapshot(engine)[7]/snapshot(engine)[5]>.001;i++)engine.step(.25,0);
    assert.ok(snapshot(engine)[7]/snapshot(engine)[5]<=.001);
  }
  if(kind==='closed'){
    const goal=snapshot(engine)[F.goal];
    for(let i=0;i<goal;i++){prepare();engine.begin_pour();engine.step(.25,0);engine.end_pour();engine.next_order();}
    assert.equal(snapshot(engine)[0],2);
  }
  return JSON.stringify(capture(engine));
}

// Only storage, presentation callbacks, and queried control properties are
// replaced. Boot, save migration, menu guards, and reset/restore run unchanged.
async function fixture({raw=null,key=keys.SAVE_KEY,readFails=false}={}){
  const stored=new Map(raw===null?[]:[[key,raw]]),elements=new Map(),effects=[],listeners=new Map();let writes=0;
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,disabled:false,hidden:false,dataset:{},textContent:'',innerHTML:'',focus(options){effects.push({focus:id,options});}});
    return elements.get(id);
  };
  const scope={...keys,F,ready:false,careerActive:false,loadedCareer:false,externalSave:false,
    lastSavedRaw:null,storageAvailable:true,mode:'intro',returnMode:'playing',
    keyHeld:false,settlingSpaceHeld:false,VISIBLE_FOAM:.001,
    WASM_BASE64:wasm.toString('base64'),WebAssembly,Uint8Array,Float32Array,Float64Array,atob,
    randomSeed:()=>907,
    localStorage:{getItem(key){if(readFails)throw new Error('Storage denied');return stored.get(key)??null;},setItem(key,value){writes++;stored.set(key,value);}},
    $:element,text(id,value){element(id).textContent=String(value);},
    setMode(next,focus){scope.mode=next;effects.push({mode:next,focus});},
    openAudio(){effects.push('audio gesture');},playCue(name){effects.push({cue:name});},
    announce(message){effects.push({announcement:message});},toast(message){effects.push({toast:message});},
    clearInput(){effects.push('clear input');},interruptPour(){effects.push('interrupt input');},pause(){scope.mode='pause';},
    renderOrder(){effects.push('render order');},updateHud(){},shopState(){return{day:scope.state[F.day],sign:scope.state[F.owned]};},
    showCommittedPour(){scope.mode='settling';effects.push({route:'settling'});},
    showFinishedCup(celebrate){scope.mode='finished';effects.push({route:'finished',celebrate});},
    showSummary(celebrate){scope.mode='summary';effects.push({route:'summary',celebrate});},
    window:{PourStoreArt:{render(shop){effects.push({shop});return '<svg></svg>';}},PourMusic:{stop(){}},PerfectPourSounds:{suspend(){}}},
    console:{error(...args){throw new Error(`Unexpected boot failure: ${args.join(' ')}`);}},
    document:{addEventListener(name,callback,options){assert.equal(listeners.has(name),false);listeners.set(name,{callback,options});}}
  };
  const context=vm.createContext(scope);
  const helpers=['const activePlayMode=','const dollars ='].map(prefix=>source.split('\n').find(line=>line.trimStart().startsWith(prefix)));
  assert.ok(helpers.every(Boolean));
  const api=vm.runInContext(helpers.join('\n')+'\n'+functionNames.map(extractFunction).join('\n')+'\n'+leaveWindow+`\n({${functionNames.join(',')},leaveWindow});`,context);
  await vm.runInContext(bootSource,context);
  assert.equal(scope.ready,true);assert.equal(element('intro-start').disabled,false);
  return{api,scope,stored,effects,element,listeners,context,writes:()=>writes,save:()=>JSON.stringify(api.captureSave())};
}

const fresh=await fixture();
assert.equal(fresh.scope.mode,'intro');assert.equal(fresh.scope.careerActive,false);
assert.equal(fresh.element('start-button').disabled,true);assert.equal(fresh.writes(),0);
const pristine=fresh.save();
fresh.api.openShop();fresh.api.newGame();fresh.api.resetBusiness();
assert.equal(fresh.scope.mode,'intro');assert.equal(fresh.save(),pristine,'Startup actions cannot bypass the intro');
fresh.api.saveCareer();fresh.api.leaveWindow();
assert.equal(fresh.writes(),0,'Blur/pagehide before starting must not create a blank saved business');
fresh.api.showHelp();assert.equal(fresh.scope.mode,'help');fresh.api.closeHelp();
assert.deepEqual(fresh.effects.at(-1),{mode:'intro',focus:'intro-start'});
fresh.api.showMainMenu();assert.equal(fresh.scope.mode,'welcome');
assert.deepEqual(fresh.effects.at(-1),{mode:'welcome',focus:'new-game-button'});
fresh.api.openShop();assert.equal(fresh.scope.mode,'welcome','Continue without a saved career does nothing');
fresh.api.showHelp();fresh.api.saveCareer();fresh.api.leaveWindow();fresh.api.closeHelp();
assert.deepEqual(fresh.effects.at(-1),{mode:'welcome',focus:'menu-settings'});
assert.equal(fresh.writes(),0);assert.equal(fresh.save(),pristine);
fresh.api.newGame();
assert.equal(fresh.scope.careerActive,true);assert.equal(fresh.scope.loadedCareer,true);
assert.equal(fresh.scope.mode,'preparing');assert.equal(fresh.writes(),1);
assert.equal(fresh.scope.state[F.hardcore],1);assert.equal(fresh.scope.state[F.day],1);
assert.equal(fresh.scope.state[F.cash],0);assert.equal(fresh.scope.state[F.selectedSoda],4);
assert.equal(fresh.scope.state[F.attempted],0);
const started=fresh.save(),startedWrites=fresh.writes();
fresh.api.newGame();fresh.api.openShop();fresh.api.resetBusiness();fresh.api.showMainMenu();
assert.equal(fresh.save(),started);assert.equal(fresh.writes(),startedWrites,'Startup handlers cannot reset an active game');
checks.push('actual boot, settings, and blur/pagehide never create a save; New Game alone starts a fresh Hardcore career and cannot be replayed from gameplay');

// The engine serializes an already-paid cup as settled. A hold interrupted
// before payment restores through score() and still has visible foam.
for(const [kind,expected] of [['untouched','preparing'],['preparing','preparing'],['easy','playing'],['interrupted','settling'],['settling','finished'],['finished','finished'],['closed','summary']]){
  const raw=savedCareer(kind),loaded=await fixture({raw});
  assert.equal(loaded.scope.loadedCareer,true);assert.equal(loaded.scope.careerActive,false);
  assert.equal(loaded.element('start-button').disabled,false);assert.equal(loaded.writes(),0);
  assert.equal(loaded.stored.get(keys.SAVE_KEY),raw,'Boot must not rewrite even an interrupted saved pour');
  loaded.api.showMainMenu();assert.deepEqual(loaded.effects.at(-1),{mode:'welcome',focus:'start-button'});
  loaded.api.showHelp();loaded.api.closeHelp();loaded.api.leaveWindow();
  assert.equal(loaded.scope.mode,'welcome');assert.equal(loaded.writes(),0);
  const restored=loaded.save(),cash=loaded.scope.state[F.cash],completed=loaded.scope.state[16];
  loaded.api.openShop();
  assert.equal(loaded.scope.mode,expected,`${kind} resumes its correct presentation phase`);
  assert.equal(loaded.scope.careerActive,true);assert.ok(loaded.writes()>0);
  assert.equal(loaded.save(),restored,`${kind} Continue does not change the restored engine state`);
  assert.equal(loaded.scope.state[F.cash],cash);assert.equal(loaded.scope.state[16],completed);
  if(kind==='easy')assert.equal(loaded.scope.state[F.hardcore],0,'Continue retains an unfinished Easy cup');
  if(kind==='interrupted')assert.equal(completed,1,'The restored interrupted Hardcore hold has already committed exactly once');
  if(['settling','finished','closed'].includes(kind))assert.equal(loaded.effects.find(effect=>effect.route)?.celebrate,false,'Returning to a finished result does not replay its award');
  const writes=loaded.writes();loaded.api.openShop();
  assert.equal(loaded.writes(),writes);assert.equal(loaded.save(),restored,'Duplicate Continue callbacks cannot advance or repay an order');
}
const legacyRaw=await readFile(new URL('engine/fixtures/v102-partial-easy.json',root),'utf8');
const migrated=await fixture({raw:legacyRaw,key:keys.LEGACY_SAVE_KEYS[0]});
migrated.api.showMainMenu();migrated.api.leaveWindow();assert.equal(migrated.writes(),0);
assert.equal(migrated.stored.has(keys.SAVE_KEY),false,'A legacy career is not migrated into storage just by visiting the menu');
migrated.api.openShop();assert.equal(migrated.scope.mode,'playing');
assert.equal(migrated.scope.state[F.hardcore],0);assert.equal(JSON.parse(migrated.stored.get(keys.SAVE_KEY)).version,103);
assert.equal(migrated.stored.get(keys.LEGACY_SAVE_KEYS[0]),legacyRaw);
checks.push('Continue restores preparing, unfinished Easy, interrupted/settling Hardcore, finished, and closed-day saves without paying twice; legacy migration writes only on explicit Continue');

const replacing=await fixture({raw:savedCareer('easy')});replacing.api.showMainMenu();
const existing=replacing.save(),existingRaw=replacing.stored.get(keys.SAVE_KEY);
replacing.api.newGame();assert.deepEqual(replacing.effects.at(-1),{mode:'restart',focus:'cancel-restart'});
assert.equal(replacing.writes(),0);assert.equal(replacing.save(),existing);
replacing.api.cancelRestart();assert.deepEqual(replacing.effects.at(-1),{mode:'welcome',focus:'new-game-button'});
assert.equal(replacing.stored.get(keys.SAVE_KEY),existingRaw);assert.equal(replacing.save(),existing);
replacing.api.newGame();replacing.api.resetBusiness();
assert.equal(replacing.scope.mode,'preparing');assert.equal(replacing.scope.state[F.hardcore],1);
assert.equal(replacing.scope.state[F.cash],0);assert.equal(replacing.scope.state[F.day],1);
assert.equal(replacing.scope.state[F.attempted],0);assert.equal(replacing.writes(),1);
assert.notEqual(replacing.stored.get(keys.SAVE_KEY),existingRaw);
replacing.scope.mode='store';replacing.api.requestRestart();replacing.api.cancelRestart();
assert.deepEqual(replacing.effects.at(-1),{mode:'store',focus:'store-back'},'Existing store reset cancellation still returns to the store');
checks.push('New Game protects a saved career behind confirmation, cancellation preserves it, confirmed reset returns to Hardcore, and store cancellation retains its original return target');

for(const action of ['newGame','openShop','resetBusiness']){
  const stale=await fixture({raw:savedCareer('easy')});stale.api.showMainMenu();
  if(action==='resetBusiness')stale.api.newGame();
  const memory=stale.save(),newer=savedCareer('closed',911);stale.stored.set(keys.SAVE_KEY,newer);
  stale.api[action]();
  assert.equal(stale.scope.externalSave,true);assert.equal(stale.scope.mode,'pause');
  assert.equal(stale.element('pause-restart').disabled,true);
  assert.equal(stale.element('resume-button').textContent,'LOAD LATEST SAVE');
  assert.equal(stale.writes(),0,`${action} cannot overwrite a newer business from another tab`);
  assert.equal(stale.stored.get(keys.SAVE_KEY),newer);assert.equal(stale.save(),memory,`${action} rejects stale state before engine reset`);
}
const appeared=await fixture();appeared.api.showMainMenu();appeared.stored.set(keys.SAVE_KEY,savedCareer('preparing'));
appeared.api.newGame();assert.equal(appeared.scope.externalSave,true);assert.equal(appeared.writes(),0,'A save created elsewhere while the fresh menu was open is also protected');
const unavailable=await fixture({readFails:true});unavailable.api.showMainMenu();unavailable.api.newGame();
assert.equal(unavailable.scope.mode,'preparing');assert.equal(unavailable.scope.externalSave,false);
assert.equal(unavailable.scope.storageAvailable,false);assert.equal(unavailable.writes(),0);
checks.push('New Game, Continue, and confirmed reset reject an externally changed save before mutating the engine; unavailable storage still permits a fresh offline game');

// Execute the shipped gesture registration as well as the handlers. This
// verifies event ownership, not physical iOS/Android browser zoom behavior.
const gestureStart=source.indexOf("  for(const name of ['gesturestart','gesturechange'])");
const gestureEnd=source.indexOf('  function downloadAppIcon(',gestureStart);
assert.ok(gestureStart>=0&&gestureEnd>gestureStart);
vm.runInContext(['cancelZoomGesture','cancelMultiTouchZoom'].map(extractFunction).join('\n')+source.slice(gestureStart,gestureEnd),fresh.context);
function gesture(extra={}){return{cancelable:true,prevented:false,preventDefault(){this.prevented=true;},...extra};}
for(const name of ['gesturestart','gesturechange','touchstart','touchmove','wheel'])assert.equal(fresh.listeners.get(name).options.passive,false,`${name} is registered as cancelable`);
for(const name of ['touchstart','touchmove']){
  const single=gesture({touches:[{}]});fresh.listeners.get(name).callback(single);assert.equal(single.prevented,false,'One-finger interaction and internal panel scrolling retain their native behavior');
  const pinch=gesture({touches:[{},{}]});fresh.listeners.get(name).callback(pinch);assert.equal(pinch.prevented,true);
}
for(const name of ['gesturestart','gesturechange']){
  const cancelable=gesture();fresh.listeners.get(name).callback(cancelable);assert.equal(cancelable.prevented,true);
  const fixed=gesture({cancelable:false});fresh.listeners.get(name).callback(fixed);assert.equal(fixed.prevented,false);
}
const wheel=gesture({ctrlKey:false});fresh.listeners.get('wheel').callback(wheel);assert.equal(wheel.prevented,false);
const pinchWheel=gesture({ctrlKey:true});fresh.listeners.get('wheel').callback(pinchWheel);assert.equal(pinchWheel.prevented,true);
checks.push('actual zoom listeners cancel multi-touch/native zoom gestures and Ctrl-wheel while preserving ordinary wheel and single-touch events');

console.log(JSON.stringify({result:'PASS',checks,verification:'Actual production startup/menu/storage/gesture functions with shipped Wasm and boundary shims. Browser focus, native click synthesis, rendering, and physical mobile zoom require browser/device QA.'},null,2));
