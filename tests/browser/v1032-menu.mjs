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

function capture(engine){const values=Array.from(new Float64Array(engine.memory.buffer,engine.save_ptr(),engine.save_len()));return{format:'perfect-pour-business',version:values[0],engine:values};}
function snapshot(engine){return new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());}
function savedCareer(kind,seed=910){
  const engine=new WebAssembly.Instance(module,{}).exports;engine.reset(seed);
  const prepare=()=>{const s=snapshot(engine);assert.equal(engine.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]),1);};
  const complete=()=>{
    prepare();const parts=snapshot(engine)[F.isMix]?2:1;
    for(let part=0;part<parts;part++){assert.equal(engine.begin_pour(),1);engine.step(.25,0);engine.end_pour();if(!snapshot(engine)[F.hardcore])assert.equal(engine.serve(),1);}
    assert.equal(snapshot(engine)[0],1);
  };
  if(kind.startsWith('mix-')){
    for(let order=0;order<5;order++){complete();engine.next_order();}
    assert.equal(snapshot(engine)[F.isMix],1);
    const easy=kind.startsWith('mix-easy');if(easy)engine.set_mode(0);
    if(kind!=='mix-untouched'){
      prepare();assert.equal(engine.begin_pour(),1);engine.step(.25,0);
      if(kind!=='mix-first-held')engine.end_pour();
      if(easy&&!['mix-easy-first'].includes(kind))assert.equal(engine.serve(),1);
      if(['mix-second-held','mix-paid','mix-easy-second'].includes(kind)){
        assert.equal(snapshot(engine)[F.pourPart],1);assert.equal(engine.begin_pour(),1);engine.step(.25,0);
        if(kind!=='mix-second-held')engine.end_pour();
      }
    }
    return JSON.stringify(capture(engine));
  }
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
    for(let i=0;i<goal;i++){complete();engine.next_order();}
    assert.equal(snapshot(engine)[0],2);
  }
  return JSON.stringify(capture(engine));
}

// Only storage, presentation callbacks, and queried control properties are
// replaced. Boot, save migration, menu guards, and reset/restore run unchanged.
async function fixture({raw=null,key=keys.SAVE_KEY,entries=[],readFails=false}={}){
  const stored=new Map(entries),elements=new Map(),reads=[],effects=[],listeners=new Map();let writes=0;
  if(raw!==null)stored.set(key,raw);
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,disabled:false,hidden:false,dataset:{},textContent:'',innerHTML:'',focus(options){effects.push({focus:id,options});}});
    return elements.get(id);
  };
  const scope={...keys,F,ready:false,careerActive:false,loadedCareer:false,externalSave:false,
    lastSavedRaw:null,storageAvailable:true,mode:'intro',returnMode:'playing',
    keyHeld:false,settlingSpaceHeld:false,menuActivationKey:'',VISIBLE_FOAM:.001,
    WASM_BASE64:wasm.toString('base64'),WebAssembly,Uint8Array,Float32Array,Float64Array,atob,
    randomSeed:()=>907,
    localStorage:{getItem(key){reads.push(key);if(readFails)throw new Error('Storage denied');return stored.get(key)??null;},setItem(key,value){writes++;stored.set(key,value);}},
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
  return{api,scope,stored,reads,effects,element,listeners,context,writes:()=>writes,save:()=>JSON.stringify(api.captureSave())};
}

const fresh=await fixture();
assert.equal(fresh.scope.mode,'intro');assert.equal(fresh.scope.careerActive,false);
assert.equal(fresh.element('start-button').disabled,true);assert.equal(fresh.writes(),0);
const pristine=fresh.save();
fresh.api.openShop();fresh.api.newGame();fresh.api.resetBusiness();
assert.equal(fresh.scope.mode,'intro');assert.equal(fresh.save(),pristine,'Startup actions cannot bypass the intro');
fresh.api.saveCareer();fresh.scope.menuActivationKey='Enter';fresh.api.leaveWindow();
assert.equal(fresh.scope.menuActivationKey,'','Leaving the window clears a launch key whose keyup may never arrive');
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
for(const [kind,expected] of [['untouched','preparing'],['preparing','preparing'],['easy','playing'],['interrupted','settling'],['settling','finished'],['finished','finished'],['closed','summary'],['mix-untouched','preparing'],['mix-first-held','playing'],['mix-between','playing'],['mix-second-held','settling'],['mix-paid','finished'],['mix-easy-first','playing'],['mix-easy-between','playing'],['mix-easy-second','playing']]){
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
  if(kind==='easy'||kind.startsWith('mix-easy'))assert.equal(loaded.scope.state[F.hardcore],0,'Continue retains an unfinished Easy cup');
  if(kind==='interrupted')assert.equal(completed,1,'The restored interrupted Hardcore hold has already committed exactly once');
  if(['mix-first-held','mix-between','mix-easy-first','mix-easy-between','mix-easy-second'].includes(kind))assert.equal(completed,5,'An unfinished mixture does not pay its customer on Continue');
  if(['mix-first-held','mix-between','mix-easy-between'].includes(kind)){
    assert.equal(loaded.scope.state[F.pourPart],1);assert.equal(loaded.scope.state[F.partAttempted],0,'Continue retains the unspent second hold');
  }
  if(kind==='mix-second-held')assert.equal(completed,6,'Interrupted final component commits exactly once');
  if(['settling','finished','closed','mix-paid'].includes(kind))assert.equal(loaded.effects.find(effect=>effect.route)?.celebrate,false,'Returning to a finished result does not replay its award');
  const writes=loaded.writes();loaded.api.openShop();
  assert.equal(loaded.writes(),writes);assert.equal(loaded.save(),restored,'Duplicate Continue callbacks cannot advance or repay an order');
}
checks.push('Continue restores ordinary and mixed cups at preparation, either interrupted component, between components, paid, and closed-day boundaries without paying twice');

// Genuine saves and expected snapshots generated by the released V1.04.2
// Wasm at the recorded source commit. These include earned progress and each
// important mixed-pour boundary; their payloads are never relabeled V106 data.
const released104={"sourceCommit":"beb201e64524137dfa1ad318e756fa69e2e04e37","fixtures":[{"kind":"preparing","save":{"format":"perfect-pour-business","version":104,"engine":[104,0,1,3,3,0.75,0,0,0,0,4.999998599083934,0,0,0,0,1.599999719816787,0,0,0,0,1462341823,33667,1,0,0,4,12,36,36,0,0,0,0,46227,1,1,0,0,1,1,1,1,0,0,0,41,0,36,21123,4.9999979398293135,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,7,0,0,0,0,36,0,0,0,1,0,0,0,1,0,2,0,0,1,3,2,0,0,1,1,0,0,0,5,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[0,1,3,3,0.75,330,0,0,0,4.999998569488525,0,0,0,0,1.5999996662139893,0,0,0,0,53.900001525878906,33667,1,0,0,4,12,36,36,1.899999976158142,0,0,0,0,46227,1,1,0,0,1,1,2200,3000,1400,1800,0,0,1,33267,400,0,0,1,1,41,0,1.149999976158142,1.0800000429153442,1,0,0,36,21123,5,4.999998092651367,0,0,0,0,1,15.5,413,0,0,0,0,0,0,0,0,0,0,5,7,0,0,0,10000,14000,40,500,36,0,0,0,5000,1,1,65,2,0,0,1,3,2,0,0,1,100,0,1,0,0,0,1000,1800,2600,80,16,1,1,1,0,5,1,4,1,0,0,3,0.75,0,100,5,0]},{"kind":"easy","save":{"format":"perfect-pour-business","version":104,"engine":[104,0,1,3,3,0.75,11.359931186877393,13.959454166609026,2.1150688131225834,0,4.999998599083934,0,0,0,0,1.599999719816787,0.25,0,0,0,1462341823,33667,0,1,0,4,12,0,36,0,0,0,0,46227,1,1,0,0,1,1,1,1,0,0,0,41,0,36,21123,4.9999979398293135,0,1,0,0,0,13.474999999999982,0,0,0,0,0,0,0,0,0,0,0,5,7,0,0,0,0,36,0,0,0,1,0,0,0,1,0,2,0,0,1,3,2,0,0,1,1,0,0,0,5,4,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[0,1,3,3,0.75,330,11.359930992126465,13.959454536437988,0,4.999998569488525,0,0,0,0,1.5999996662139893,0.25,0,0,0,53.900001525878906,33667,0,1,0,4,12,0,36,1,0,0,0,0,46227,1,1,0,0,1,1,2200,3000,1400,1800,0,0,0,33267,400,0,0,1,1,41,0,1,1.0800000429153442,1,0,0,36,21123,5,4.999998092651367,13.475000381469727,0,0,0,0.9838709831237793,15.5,413,0,0,0,0,0,0,0,0,0,0,5,7,0,0,0,10000,14000,3,75,36,0,0,0,5000,1,0,65,2,0,0,1,3,2,0,0,1,100,1,0,0,0,0,1000,1800,2600,80,16,1,1,1,0,5,1,4,1,0,1,3,0.75,13.475000381469727,100,5,0]},{"kind":"paid","save":{"format":"perfect-pour-business","version":104,"engine":[104,1,1,3,3,0.75,13.474999999999977,0,0,0,3.719999047377075,0,0,1,0,1.599999719816787,0.25,1,0,0,1462341823,33633,1,1,0,4,12,0,36,0,0,0,0,46227,1,1,0,0,1,1,1,1,0,0,0,42,0,36,21123,4.999998599083934,0,1,0,0,0,13.474999999999982,0,34,0,821,-34,34,0,821,0,0,0,5,7,0,0,0,0,36,0,0,0.25,1,0,0,0,1,0,2,0,0,1,3,2,0,0,1,1,0,0,0,5,4,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[1,1,3,3,0.75,330,13.475000381469727,0,0,3.719999074935913,0,0,1,0,1.5999996662139893,0.25,1,0,0,53.900001525878906,33633,1,1,0,4,12,0,36,1,0,0,0,0,46227,1,1,0,0,1,1,2200,3000,1400,1800,0,0,1,33233,400,0,0,1,1,42,0,1.149999976158142,1.0800000429153442,1,0,-34,36,21123,5,4.999998569488525,13.475000381469727,0,0,0,0.9838709831237793,15.5,413,34,0,821,-34,34,0,821,0,0,0,5,7,0,0,0,10000,14000,3,75,36,0,0,0,5000,1,0,65,2,0,0,1,3,2,0,0,1,100,1,0,0,0,0,1000,1800,2600,80,16,1,1,1,0,5,1,4,1,0,1,3,0.75,13.475000381469727,100,5,0]},{"kind":"mix-first-held","save":{"format":"perfect-pour-business","version":104,"engine":[104,0,6,1,0,0.65,11.804205295887872,5.603973520560578,1.1207947041121158,0,1.3634833920000002,0,0,1,0,0.8726966784000001,0.25,5,0,0,4007242341,0,1,1,0,1,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,1.5345344000000003,0,0,0,0,0,12.924999999999976,0,0,0,340,0,0,0,1887,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,1,1,0,0,1,1,0,0,0,5.5,3,0.5,0,1,11.804205295887872,5.603973520560578,1.1207947041121158,12.924999999999976,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[0,6,1,0,0.6499999761581421,280,11.804204940795898,5.603973388671875,0,1.3634834289550781,0,0,1,0,0.8726966977119446,0.25,5,0,0,53.900001525878906,0,1,1,0,1,12,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1200,1800,1400,1800,2800,4200,0,0,0,0,0,0,0,5,0,1.149999976158142,1,1,0,0,0,0,1,1.5345344543457031,12.925000190734863,0,0,0,0.9814814925193787,13.5,360,0,0,340,0,0,0,1887,0,0,0,0,2,0,0,0,10000,14000,3,75,0,0,0,0,5000,1,0,65,1,0,0,1,1,1,0,0,1,100,1,0,0,0,0,1000,1800,2600,100,8,1,1,1,0,5.5,1,3,0.5,1,0,3,0.6499999761581421,12.925000190734863,0,1,1]},{"kind":"mix-second-held","save":{"format":"perfect-pour-business","version":104,"engine":[104,0,6,1,0,0.65,23.52514538490214,17.758383176485243,2.8748546150978282,0,1.3634833920000002,0,0,1,0,0.8726966784000001,0.4999999999999988,5,0,0,4007242341,0,1,1,0,1,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,1.5345344000000003,0,0,0,0,0,26.400000000000034,0,0,0,340,0,0,0,1887,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,1,1,0,0,1,1,0,0,0,5.5,3,0.5,1,1,12.165214198024742,3.7989290098762156,0.7597858019752438,12.924999999999976,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[1,6,1,0,0.6499999761581421,280,23.525144577026367,17.75838279724121,0,1.2471686601638794,0,0,1,0,0.8726966977119446,0.5,6,0,0,53.900001525878906,0,1,1,0,1,12,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1200,1800,1400,1800,2800,4200,1,0,0,0,0,0,0,6,0,1.149999976158142,1,1,0,0,0,0,1,1.3634834289550781,26.399999618530273,0,0,0,0.9629629850387573,13.5,360,0,0,361,0,0,0,2248,0,0,0,0,2,0,0,0,10000,14000,3,75,0,0,0,0,5000,1,0,65,1,0,0,1,1,1,0,0,1,100,1,0,0,0,0,1000,1800,2600,100,8,1,1,1,0,5.5,1,3,0.5,1,1,3,0.6499999761581421,12.925000190734863,97.91666412353516,5,1]},{"kind":"mix-paid","save":{"format":"perfect-pour-business","version":104,"engine":[104,1,6,1,0,0.65,26.399999999999967,0,0,0,1.2471687065600003,0,0,1,0,0.8726966784000001,0.4999999999999988,6,0,0,4007242341,0,1,1,0,1,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,1.3634833920000002,0,0,0,0,0,26.400000000000034,0,0,0,361,0,0,0,2248,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,1,1,0,0,1,1,0,0,0,5.5,3,0.5,1,1,12.924999999999986,0,0,12.924999999999976,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"expectedRestoreSnapshot":[1,6,1,0,0.6499999761581421,280,26.399999618530273,0,0,1.2471686601638794,0,0,1,0,0.8726966977119446,0.5,6,0,0,53.900001525878906,0,1,1,0,1,12,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1200,1800,1400,1800,2800,4200,1,0,0,0,0,0,0,6,0,1.149999976158142,1,1,0,0,0,0,1,1.3634834289550781,26.399999618530273,0,0,0,0.9629629850387573,13.5,360,0,0,361,0,0,0,2248,0,0,0,0,2,0,0,0,10000,14000,3,75,0,0,0,0,5000,1,0,65,1,0,0,1,1,1,0,0,1,100,1,0,0,0,0,1000,1800,2600,100,8,1,1,1,0,5.5,1,3,0.5,1,1,3,0.6499999761581421,12.925000190734863,97.91666412353516,5,1]}]};

assert.equal(keys.SAVE_KEY,'perfect-pour-business-v107');
assert.deepEqual(Array.from(keys.LEGACY_SAVE_KEYS),[106,104,103,102,101].map(version=>'perfect-pour-business-v'+version));
const legacyCases=[];
for(const version of [101,102,103]){
  const name='v'+version+'-'+(version===101?'untouched':'partial-easy');
  const raw=await readFile(new URL('engine/fixtures/'+name+'.json',root),'utf8');
  legacyCases.push({name,version,raw,expectedRestoreSnapshot:JSON.parse(raw).expectedRestoreSnapshot});
}
for(const released of released104.fixtures){
  assert.equal(released.save.version,104);assert.equal(released.save.engine[0],104);
  assert.ok(released.save.engine.slice(105).every(value=>value===0),'The released104 reserved slots remain zero');
  legacyCases.push({name:'v104-'+released.kind,version:104,raw:JSON.stringify(released.save),expectedRestoreSnapshot:released.expectedRestoreSnapshot,kind:released.kind});
}
const migratedRoutes={preparing:'preparing',easy:'playing',paid:'finished','mix-first-held':'playing','mix-second-held':'settling','mix-paid':'finished'};
for(const item of legacyCases){
  const key='perfect-pour-business-v'+item.version,legacy=await fixture({raw:item.raw,key});
  assert.equal(legacy.scope.loadedCareer,true,item.name+' is automatically available to Continue');
  assert.equal(legacy.scope.careerActive,false);assert.equal(legacy.element('start-button').disabled,false);
  assert.equal(legacy.writes(),0);assert.equal(legacy.stored.has(keys.SAVE_KEY),false);
  assert.equal(legacy.scope.state[F.selectedIce],0,'Earlier businesses start with zero ice');
  if(item.expectedRestoreSnapshot)assert.deepEqual(Array.from(legacy.scope.state.slice(0,item.expectedRestoreSnapshot.length)),item.expectedRestoreSnapshot,item.name+' preserves every original released snapshot field');
  const restored=legacy.save(),cash=legacy.scope.state[F.cash],completed=legacy.scope.state[16];
  legacy.api.showMainMenu();legacy.api.showHelp();legacy.api.saveCareer();legacy.api.closeHelp();legacy.api.leaveWindow();
  assert.equal(legacy.scope.mode,'welcome');assert.equal(legacy.writes(),0,'Menu, settings and blur do not checkpoint the migrated business');
  assert.equal(legacy.stored.get(key),item.raw);assert.equal(legacy.stored.has(keys.SAVE_KEY),false);
  legacy.api.newGame();assert.equal(legacy.scope.mode,'restart','New Game protects automatically restored progress behind confirmation');
  assert.equal(legacy.writes(),0);legacy.api.cancelRestart();
  assert.equal(legacy.scope.mode,'welcome');assert.equal(legacy.save(),restored);
  legacy.api.openShop();
  assert.equal(legacy.scope.careerActive,true);assert.ok(legacy.writes()>0);
  assert.equal(legacy.save(),restored,item.name+' Continue does not alter the restored state or repay its cup');
  assert.equal(legacy.scope.state[F.cash],cash);assert.equal(legacy.scope.state[16],completed);
  if(item.kind)assert.equal(legacy.scope.mode,migratedRoutes[item.kind],item.name+' resumes the correct presentation phase');
  const migrated=JSON.parse(legacy.stored.get(keys.SAVE_KEY));
  assert.equal(migrated.version,107);assert.equal(migrated.engine[0],107);
  assert.ok(migrated.engine.slice(106).every(value=>value===0),'V106 reserved slots remain zero');
  assert.equal(legacy.stored.get(key),item.raw,'Migration writes the new key and never modifies its released source');
  const writes=legacy.writes();legacy.api.openShop();
  assert.equal(legacy.writes(),writes);assert.equal(legacy.save(),restored,'Duplicate Continue cannot advance or repay a migrated order');
}
checks.push('Genuine101–104 careers automatically enable Continue, preserve original snapshot fields, migrate only on play, retain untouched legacy entries and zero reserved slots, and cannot pay twice');

// Read-only migration from the previous public V106 browser key. Its reserved
// progression slots must stay untouched until the V107 career is first saved.
const prior106=JSON.parse(savedCareer('untouched',1060));
prior106.version=106;prior106.engine[0]=106;
assert.ok(prior106.engine.slice(106).every(value=>value===0));
const priorRaw=JSON.stringify(prior106),prevKey='perfect-pour-business-v106';
const upgraded=await fixture({raw:priorRaw,key:prevKey});
assert.equal(upgraded.scope.loadedCareer,true);
assert.equal(upgraded.scope.state[136],4);
assert.equal(upgraded.scope.state[139],0);
assert.equal(upgraded.scope.state[144],0);
assert.equal(upgraded.stored.get(prevKey),priorRaw,'V106 save is never overwritten');
upgraded.api.showMainMenu();upgraded.api.openShop();
assert.equal(JSON.parse(upgraded.stored.get(keys.SAVE_KEY)).version,107);
assert.equal(upgraded.stored.get(prevKey),priorRaw,'V106 source remains unchanged after migrating');
checks.push('V106 production careers migrate safely into the new V107 key with original 120-value payload and no retroactive rewards');

const productionRaw=savedCareer('closed',911);
const precedence=await fixture({raw:productionRaw,entries:legacyCases.map(item=>['perfect-pour-business-v'+item.version,item.raw])});
assert.equal(precedence.scope.state[0],2,'An existing V107 business wins over every legacy entry');
assert.equal(precedence.stored.get(keys.SAVE_KEY),productionRaw);assert.equal(precedence.writes(),0);
assert.equal(precedence.reads.some(key=>keys.LEGACY_SAVE_KEYS.includes(key)),false,'Current production progress does not consult older releases');
const funded104=legacyCases.find(item=>item.name==='v104-preparing');
const newestLegacy=await fixture({entries:legacyCases.filter(item=>item.version<104).map(item=>['perfect-pour-business-v'+item.version,item.raw]).concat([['perfect-pour-business-v104',funded104.raw]])});
assert.deepEqual(Array.from(newestLegacy.scope.state.slice(0,134)),funded104.expectedRestoreSnapshot,'V104 takes priority over all older legacy keys');
assert.equal(newestLegacy.writes(),0);
const privateOnly=await fixture({raw:savedCareer('easy'),key:'perfect-pour-preview-v106'});
assert.equal(privateOnly.scope.loadedCareer,false,'The separate preview is not an automatic production migration source');
assert.equal(privateOnly.element('start-button').disabled,true);assert.equal(privateOnly.writes(),0);
checks.push('V107 takes precedence, then V104/V103/V102/V101 in order; independent preview storage is not selected');

const legacyReset=await fixture({raw:funded104.raw,key:'perfect-pour-business-v104'});
legacyReset.api.showMainMenu();legacyReset.api.newGame();legacyReset.api.resetBusiness();
assert.equal(legacyReset.scope.mode,'preparing');assert.equal(legacyReset.scope.state[F.cash],0);
assert.equal(legacyReset.scope.state[F.hardcore],1);assert.equal(legacyReset.writes(),1);
assert.equal(JSON.parse(legacyReset.stored.get(keys.SAVE_KEY)).version,107);
assert.equal(legacyReset.stored.get('perfect-pour-business-v104'),funded104.raw,'Confirmed replacement still preserves the old release entry');
const legacyRace=await fixture({raw:funded104.raw,key:'perfect-pour-business-v104'});
legacyRace.api.showMainMenu();const legacyMemory=legacyRace.save();
legacyRace.stored.set(keys.SAVE_KEY,productionRaw);legacyRace.api.openShop();
assert.equal(legacyRace.scope.externalSave,true);assert.equal(legacyRace.scope.mode,'pause');
assert.equal(legacyRace.writes(),0);assert.equal(legacyRace.save(),legacyMemory);
assert.equal(legacyRace.stored.get(keys.SAVE_KEY),productionRaw,'A production save created by another tab wins over pending legacy migration');
assert.equal(legacyRace.stored.get('perfect-pour-business-v104'),funded104.raw);
checks.push('Confirmed legacy replacement preserves its source; a V106 save created during the migration menu is protected from stale Continue');

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
