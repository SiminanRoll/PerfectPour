#!/usr/bin/env node
/** Immediate-hold policy and actual production input boundaries; not a browser playtest. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../web/control-flow.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, {window}, {filename: 'web/control-flow.js'});
const {resolve} = window.PourFlow;
const clean = {mode:'preparing', hardcore:true, attempted:false, holding:false,
  selectedSoda:4, recipeLocked:false, lastCustomer:false,
  isMix:false, pourPart:0, partAttempted:false, activeName:'Orange', nextName:'Cola'};
const checks = [];

let state = {...clean};
assert.equal(resolve(state).action, 'choose');
assert.equal(resolve(state).disabled, true);
assert.equal(resolve(state).showRecipe, true);
assert.equal(resolve(state).showPressure, true);
for (const base of [-1,4,5,NaN,undefined,1.5])
  assert.equal(resolve({...state,selectedSoda:base}).disabled, true, 'An unchosen/invalid base cannot suggest a pour');
state.selectedSoda = 0;
assert.equal(resolve(state).action, 'pour');
assert.equal(resolve(state).disabled, false);
assert.equal(resolve(state).stage, 'prep');
assert.equal(resolve(state).showRecipe, true,'A selected base can pour immediately while ingredients remain editable');
state.mode = 'playing';
assert.equal(resolve(state).action, 'pour');
assert.equal(resolve(state).stage, 'ready');
assert.equal(resolve(state).showRecipe, false);
assert.equal(resolve(state).showPressure, false);
assert.equal(resolve(state).showMode, false);
const before = {...state}; resolve(state); assert.deepEqual(state, before, 'Presentation never mutates game/input state');
checks.push('a selected base unlocks Hold to pour directly; preparation stays editable until the first actual hold');

state = {...state,attempted:true,holding:true,recipeLocked:true};
assert.equal(resolve(state).label, 'POURING…');
assert.equal(resolve(state).hint, 'Release to serve');
assert.equal(resolve(state).showRecipe, false);
assert.equal(resolve(state).showPressure, false);
assert.equal(resolve(state).showMode, false);
state.holding = false;
assert.equal(resolve(state).action, 'wait');
assert.equal(resolve(state).disabled, true, 'A released Hardcore attempt cannot briefly show another pour before handoff');
state.mode = 'settling';
for (let frame=0;frame<240;frame++) {
  const action=resolve(state);
  assert.equal(action.action, 'wait');
  assert.equal(action.disabled, true);
}
state.mode = 'finished';
assert.equal(resolve(state).action, 'next');
assert.equal(resolve(state).disabled, false);
assert.equal(resolve(state).showRecipe, false);
assert.equal(resolve(state).label, 'NEXT CUSTOMER');
assert.equal(resolve({...state,lastCustomer:true}).label, 'CLOSE THE DAY');
state.mode = 'result';
assert.equal(resolve(state).action, 'none');
assert.equal(resolve(state).disabled, true,'Optional receipt has no hidden Next action');
state.lastCustomer = true;
assert.equal(resolve(state).action, 'none');
state.mode = 'summary';
assert.equal(resolve(state).action, 'nextDay');
assert.equal(resolve(state).showPressure, false);
checks.push('Hardcore retains visible disabled settling; the completed cup offers Next customer or Close day directly, without a required review action');

state = {...clean,mode:'playing',hardcore:false,selectedSoda:3};
assert.equal(resolve(state).action, 'pour');
assert.equal(resolve(state).easyDisabled, true);
state = {...state,attempted:true,holding:true,recipeLocked:true};
assert.equal(resolve(state).hint, 'Release to pause');
assert.equal(resolve(state).easyDisabled, true,'An active hold cannot be served by the separate action');
state.holding = false;
assert.equal(resolve(state).action, 'pour');
assert.equal(resolve(state).hint, 'Release to pause');
assert.equal(resolve(state).showEasyAction, true);
assert.equal(resolve(state).easyDisabled, false);
assert.equal(resolve(state).easyLabel, 'SERVE');
assert.equal(resolve(state).showRecipe, false, 'Easy top-ups do not unlock recipe edits');
state.holding = true;
assert.equal(resolve(state).action, 'pour');
state = {...state,holding:false,mode:'settling'};
assert.equal(resolve(state).disabled, true);
state.mode = 'finished'; assert.equal(resolve(state).action, 'next');
assert.equal(resolve(state).showEasyAction, false);
checks.push('Easy always uses its main button to pour and a separate enabled-after-release Serve action; the recipe remains locked during top-ups');

const mixReady={...clean,mode:'playing',selectedSoda:0,isMix:true};
assert.equal(resolve(mixReady).action,'pour');
assert.match(resolve(mixReady).label,/1\/2/);
const mixHeld={...mixReady,attempted:true,partAttempted:true,holding:true,recipeLocked:true};
assert.equal(resolve(mixHeld).hint,'Release to switch');
const mixSecond={...mixHeld,holding:false,pourPart:1,partAttempted:false,activeName:'Cola'};
assert.equal(resolve(mixSecond).action,'pour','A global attempt does not consume the untouched second component');
assert.equal(resolve(mixSecond).disabled,false);assert.match(resolve(mixSecond).label,/COLA.*2\/2/);
assert.equal(resolve(mixSecond).showRecipe,false);assert.equal(resolve(mixSecond).showPressure,false);
assert.equal(resolve({...mixSecond,holding:true,partAttempted:true}).hint,'Release to serve');
const easyMix={...mixHeld,hardcore:false,holding:false};
assert.equal(resolve(easyMix).action,'pour');assert.equal(resolve(easyMix).easyLabel,'NEXT SODA');
assert.equal(resolve(easyMix).easyDisabled,false);
assert.equal(resolve({...easyMix,pourPart:1}).easyLabel,'SERVE');
assert.equal(resolve({...easyMix,pourPart:1,partAttempted:false}).easyDisabled,true,'The unattempted second component cannot be served');
assert.equal(resolve(mixHeld).showEasyAction,false);
checks.push('Hardcore switches after the first hold; Easy uses a distinct Next soda action; the fresh second component is pourable but cannot be served before an attempt');

for (const mode of ['intro','welcome','store','pause','help','restart','unknown']) {
  const action=resolve({...clean,mode});
  assert.equal(action.action, 'none');
  assert.equal(action.disabled, true);
  assert.equal(action.showRecipe, false);
  assert.equal(action.showPressure, false);
}
for(const mode of ['intro','welcome'])assert.equal(resolve({...clean,mode}).showMode,false,'Starting screens never expose difficulty selection');
assert.equal(resolve({...clean,mode:'store'}).showMode, true);
assert.equal(resolve({...clean,recipeLocked:true,selectedSoda:2}).showRecipe, false);
assert.equal(resolve({...clean,recipeLocked:true,selectedSoda:2}).disabled, true);
assert.equal(resolve().action, 'none');
checks.push('menus and inactive modes cannot expose a live action; phase policy is deterministic and side-effect free');

// Exercise the actual production input functions with a clocked event boundary
// and the shipped Wasm. The DOM shim models only the controls these functions
// address; browser capture, event synthesis, layout and focus still require QA.
const gameSource=await readFile(new URL('../../web/game.js',import.meta.url),'utf8');
const wasm=await readFile(new URL('../../engine/perfect_pour_engine.wasm',import.meta.url));
const module=new WebAssembly.Module(wasm);
const F=vm.runInNewContext(`(${gameSource.match(/const F=(\{[^;]+\});/)[1]})`);
function extractFunction(name){
  const start=gameSource.indexOf(`  function ${name}(`);
  assert.ok(start>=0,`Production function ${name} exists`);
  let depth=0,quote='',line=false,block=false;
  for(let i=gameSource.indexOf('{',start);i<gameSource.length;i++){
    const ch=gameSource[i],next=gameSource[i+1];
    if(line){if(ch==='\n')line=false;continue;}
    if(block){if(ch==='*'&&next==='/'){block=false;i++;}continue;}
    if(quote){if(ch==='\\'){i++;continue;}if(ch===quote)quote='';continue;}
    if(ch==='/'&&next==='/'){line=true;i++;continue;}
    if(ch==='/'&&next==='*'){block=true;i++;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return gameSource.slice(start,i+1);
  }
  throw new Error(`Unclosed production function ${name}`);
}
const captureLossCallback=gameSource.match(/\$\('pour-button'\)\.addEventListener\('lostpointercapture',(\w+)\);/)?.[1];
assert.ok(captureLossCallback,'Exercise the handler actually bound to primary-button capture loss');
const functionNames=[...new Set(['primaryAction','primaryPointerDown','releasePointer','cancelPrimaryPointer','primaryClick',captureLossCallback,
  'easyPointerDown','easyAction','nativeActivation','keyDown','keyUp','clearInput','beginInput','releaseInput',
  'interruptPour','serveDrink','announceNextPart','focusPourAfterPointer','nextOrder','openNextDay','viewReview',
  'showCommittedPour','showFinishedCup','advanceSimulation','frame'])];
const sodas=vm.runInNewContext(gameSource.match(/const sodas = (\[[\s\S]*?\n  \]);/)[1]);
const cups=vm.runInNewContext(gameSource.match(/const cups = (\[[\s\S]*?\n  \]);/)[1]);
const visualWindow={};
vm.runInNewContext(await readFile(new URL('../../web/pour-visuals.js',import.meta.url),'utf8'),{window:visualWindow});
functionNames.push('cupGeometry');
const targetText=vm.runInNewContext(gameSource.match(/const targetText=[^;]+;/)[0]+'\ntargetText;');
const scoreText=vm.runInNewContext(gameSource.split('\n').find(line=>line.trimStart().startsWith('const scoreText='))+'\nscoreText;');
const activePlayMode=gameSource.split('\n').find(line=>line.trimStart().startsWith('const activePlayMode='));
assert.ok(activePlayMode);
const closeResult=gameSource.match(/\$\('close-result'\)\.addEventListener\('click',(\(\)=>\{[^\n]*?\})\);/)?.[1];
const leaveWindow=gameSource.match(/const leaveWindow=\(\)=>\{[^\n]+?\};/)?.[0];
assert.ok(closeResult,'Exercise the actual optional-receipt close callback');
assert.ok(leaveWindow,'Exercise the actual blur/pagehide input boundary');
class Element {
  constructor(id,tag='button'){this.id=id;this.tag=tag;this.dataset={};this.disabled=false;this.hidden=false;this.open=false;this.captures=[];this.focusCount=0;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};}
  closest(selector){return selector.split(',').some(part=>part.trim()===this.tag)?this:null;}
  setPointerCapture(id){this.captures.push(id);}
  focus(){this.focusCount++;}
}
function inputFixture({hardcore=true,mode='preparing',primed=false,selected=true,mixed=false,part=0}={}){
  const native=new WebAssembly.Instance(module,{}).exports;native.reset(907);
  const snap=()=>new Float32Array(native.memory.buffer,native.state_ptr(),native.state_len());
  if(mixed){
    for(let order=0;order<5;order++){
      const s=snap();assert.equal(s[F.isMix],0);native.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]);native.set_pressure(0);
      native.begin_pour();let time=s[4]*s[5]/s[19];while(time>1e-8){const dt=Math.min(time,.25);native.step(dt,0);time-=dt;}native.end_pour();native.next_order();
    }
    assert.equal(snap()[F.isMix],1,'The sixth generated customer introduces mixtures');
  }
  native.set_mode(hardcore?1:0);
  if(selected){const s=snap();native.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]);}
  if(part===1){assert.equal(mixed,true);native.begin_pour();native.step(.2,0);native.end_pour();if(!hardcore)native.serve();assert.equal(snap()[F.pourPart],1);}
  if(primed){assert.equal(hardcore,false,'Primed fixture is an Easy top-up state');native.begin_pour();native.step(.2,0);native.end_pour();}
  if((part===1||primed)&&mode==='preparing')mode='playing';
  let now=100;
  const events=[],checkpoints=[],labels=new Map(),cues=[];
  const counts={begin:0,release:0,serve:0,review:0,next:0,nextDay:0,save:0,inline:0,confetti:0};
  const button=new Element('pour-button'),easy=new Element('easy-action'),tap=new Element('tap-machine','div'),pressure=new Element('pressure-controls','details'),area=new Element('pour-area','div');
  const engine={...native,
    begin_pour(){counts.begin++;return native.begin_pour();},
    end_pour(){counts.release++;return native.end_pour();},
    serve(){counts.serve++;return native.serve();},
    next_order(){counts.next++;return native.next_order();},
    next_day(seed){counts.nextDay++;return native.next_day(seed);}
  };
  const scope={engine,F,sodas,cups,targetText,scoreText,state:snap(),ready:true,externalSave:false,mode,returnMode:'playing',
    cachedCup:-1,geometry:null,garnishFlight:null,pourVisuals:visualWindow.PourVisuals.create({reducedMotion:true}),startHandoff(){},
    easyPress:null,primaryPress:null,suppressPrimaryClick:false,inputOwner:null,activePointer:null,keyHeld:false,settlingSpaceHeld:false,menuActivationKey:'',pouring:false,
    overlays:['intro','welcome','result','summary','pause','help','restart'],Element,
    simulationClock:100,lastFrame:100,lastUi:100,lastAutosave:100,lastSpill:snap()[8],spillFlash:0,settlingElapsed:0,finishElapsed:0,visualTime:0,sceneDirty:false,
    VISIBLE_FOAM:.001,reducedMotion:true,performance:{now:()=>now},randomSeed:()=>907,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    percent:fraction=>Math.round(fraction*100),signedMoney:cents=>(cents<0?'-':'')+'$'+(Math.abs(cents)/100).toFixed(2),
    setTimeout(){throw new Error('Pour input must not defer a tap/hold decision');},
    $(id){if(id==='pour-button')return button;if(id==='easy-action')return easy;if(id==='pressure-controls')return pressure;throw new Error('Unexpected input DOM target '+id);},
    document:{hidden:false,hasFocus:()=>true,querySelector(selector){if(selector==='.tap-machine')return tap;if(selector==='.pour-area')return area;if(selector==='.overlay:not([hidden])')return null;throw new Error('Unexpected input DOM query '+selector);},querySelectorAll(){return[];}},
    window:{PerfectPourSounds:{updateFoam(){},suspend(){}}},requestAnimationFrame(){},draw(){},updateMeter(){},updateLiveFeedback(){},
    refreshState(){scope.state=snap();},
    saveCareer(){counts.save++;checkpoints.push(Array.from(new Float64Array(native.memory.buffer,native.save_ptr(),native.save_len())));},
    setCustomerMood(){},openAudio(){},startPourSound(){},stopPourSound(){},
    announce(message){events.push(message);},text(id,value){labels.set(id,String(value));},
    playCue(name){cues.push(name);},confetti(){counts.confetti++;},
    updateHud(){sync();},renderOrder(){sync();},renderReview(){counts.inline++;},
    recipeDescription(){return 'Current soda order.';},
    setMode(next){if(next!==scope.mode){scope.easyPress=null;scope.primaryPress=null;}scope.mode=next;scope.simulationClock=now;scope.sceneDirty=true;if(next!=='settling')scope.settlingElapsed=0;sync();},
    presentResult(){counts.review++;scope.mode='result';sync();},
    showSummary(){scope.mode='summary';sync();},
    pause(){api.interruptPour();scope.mode='pause';sync();},
    resume(){scope.mode='playing';sync();},closeHelp(){scope.mode='playing';sync();},
    cancelRestart(){scope.mode='store';sync();},leaveStore(){scope.mode='playing';sync();}
  };
  function sync(){
    const s=scope.state,policy=resolve({mode:scope.mode,hardcore:s[F.hardcore],attempted:s[F.attempted],holding:s[F.holding],selectedSoda:s[F.selectedSoda],recipeLocked:s[F.recipeLocked],lastCustomer:s[1]===s[F.goal],isMix:s[F.isMix],pourPart:s[F.pourPart],partAttempted:s[F.partAttempted],activeName:sodas[s[F.activeSoda]]?.name,nextName:sodas[s[F.orderedSecondSoda]]?.name});
    button.dataset.action=policy.action;button.disabled=policy.disabled;easy.hidden=!policy.showEasyAction;easy.disabled=policy.easyDisabled;easy.dataset.label=policy.easyLabel;
  }
  const context=vm.createContext(scope);
  const api=vm.runInContext(activePlayMode+'\n'+functionNames.map(extractFunction).join('\n')+'\n'+leaveWindow+'\n({'+functionNames.join(',')+',captureLost:'+captureLossCallback+',leaveWindow,closeResult:'+closeResult+'});',context);
  sync();
  function event(extra={}){return{button:0,isPrimary:true,pointerId:1,pointerType:'mouse',currentTarget:button,target:button,detail:1,repeat:false,prevented:false,preventDefault(){this.prevented=true;},...extra};}
  const secondary=extra=>event({currentTarget:easy,target:easy,...extra});
  return{api,scope,button,easy,counts,events,checkpoints,labels,cues,event,secondary,sync,native,
    advance(ms){now+=ms;},tick(ms){now+=ms;api.frame(now);},
    mode(next){scope.mode=next;sync();},finish(){api.showFinishedCup(false);},
    clickEasy(){api.easyPointerDown(secondary());api.releasePointer(secondary());api.easyAction(secondary());},
    clickPrimary(){api.primaryPointerDown(event());api.releasePointer(event());api.primaryClick(event());},
    tapPrimary(pointerType='touch'){
      api.primaryPointerDown(event({pointerType,type:'pointerdown'}));
      api.releasePointer(event({pointerType,type:'pointerup'}));
      api.captureLost(event({pointerType,type:'lostpointercapture'}));
      api.primaryClick(event({pointerType,type:'click'}));
    }
  };
}
function paidFixture(options={}){
  const f=inputFixture(options),parts=options.mixed?2:1;
  for(let part=0;part<parts;part++){
    f.api.primaryPointerDown(f.event());f.advance(200);f.api.releasePointer(f.event());f.api.primaryClick(f.event());
    if(options.hardcore===false)f.clickEasy();
  }
  assert.equal(f.scope.mode,'settling');assert.equal(f.scope.state[0],1);return f;
}
const ledger=f=>[9,10,13,16,F.cash,F.streak,F.comboBonus,F.milestone,F.lifetime,F.ingredientTotal,F.customers].map(index=>f.scope.state[index]);
const savedEngine=f=>new Float64Array(f.native.memory.buffer,f.native.save_ptr(),f.native.save_len()).slice();
function restoredPaidFixture(saved){
  const f=inputFixture();
  new Float64Array(f.native.memory.buffer,f.native.save_ptr(),f.native.save_len()).set(saved);
  assert.equal(f.native.restore_save(),1,'The shipped engine accepts its existing paid-cup save');
  f.scope.refreshState();assert.equal(f.scope.state[0],1);f.finish();return f;
}

// Direct-manipulation pointers release implicit capture after pointerup, before
// click. Replaying only down/up/click omits the boundary that blocked mobile Next.
// This is production-handler/Wasm coverage, not a native-device browser test.
const savedCup=paidFixture();
for(let n=0;n<600&&savedCup.scope.mode==='settling';n++)savedCup.tick(1000/60);
assert.equal(savedCup.scope.mode,'finished');
const paidSave=savedEngine(savedCup);
for(const pointerType of ['touch','pen']){
  const resumed=restoredPaidFixture(paidSave),customer=resumed.scope.state[1],cash=resumed.scope.state[F.cash],completed=resumed.scope.state[16];
  assert.equal(resumed.scope.state[F.cash],savedCup.scope.state[F.cash],'Restoring a paid cup does not repay it');
  resumed.tapPrimary(pointerType);
  assert.equal(resumed.counts.next,1,pointerType+' Next survives normal implicit capture loss between pointerup and click');
  assert.equal(resumed.scope.mode,'preparing');assert.equal(resumed.scope.state[1],customer+1);
  assert.equal(resumed.scope.state[F.cash],cash);assert.equal(resumed.scope.state[16],completed);
  assert.equal(resumed.counts.begin,0);assert.equal(resumed.counts.serve,0);
  resumed.api.primaryClick(resumed.event({pointerType,type:'click'}));
  assert.equal(resumed.counts.next,1,'A duplicate '+pointerType+' click cannot skip another customer');
  assert.equal(resumed.scope.state[F.cash],cash);
  for(const boundary of ['captureLost','cancelPrimaryPointer']){
    const interrupted=restoredPaidFixture(paidSave);
    interrupted.api.primaryPointerDown(interrupted.event({pointerType}));
    interrupted.api[boundary](interrupted.event({pointerType}));
    interrupted.api.releasePointer(interrupted.event({pointerType}));
    interrupted.api.captureLost(interrupted.event({pointerType}));
    interrupted.api.primaryClick(interrupted.event({pointerType}));
    assert.equal(interrupted.counts.next,0,boundary+' before release cancels a '+pointerType+' Next gesture');
    interrupted.tapPrimary(pointerType);assert.equal(interrupted.counts.next,1,'A fresh tap works after '+boundary);
  }
  const cancelled=restoredPaidFixture(paidSave);
  cancelled.api.primaryPointerDown(cancelled.event({pointerType}));cancelled.api.releasePointer(cancelled.event({pointerType}));
  cancelled.api.cancelPrimaryPointer(cancelled.event({pointerType}));cancelled.api.captureLost(cancelled.event({pointerType}));
  cancelled.api.primaryClick(cancelled.event({pointerType}));
  assert.equal(cancelled.counts.next,0,'A real cancellation still invalidates a released '+pointerType+' gesture');
  const otherPointer=restoredPaidFixture(paidSave);
  otherPointer.api.primaryPointerDown(otherPointer.event({pointerType,pointerId:7}));
  otherPointer.api.releasePointer(otherPointer.event({pointerType,pointerId:8}));
  otherPointer.api.captureLost(otherPointer.event({pointerType,pointerId:8}));
  otherPointer.api.releasePointer(otherPointer.event({pointerType,pointerId:7}));
  otherPointer.api.captureLost(otherPointer.event({pointerType,pointerId:7}));
  otherPointer.api.primaryClick(otherPointer.event({pointerType,pointerId:7}));
  assert.equal(otherPointer.counts.next,1,'Another pointer cannot release or cancel the intended '+pointerType+' Next tap');
}
checks.push('restored paid cups advance once for touch and pen down/up/lost-capture/click without repayment; early capture loss and real cancellation invalidate gestures, unrelated pointers do not, and fresh taps recover');

for(const source of ['pointer','key']){
  const direct=inputFixture();
  if(source==='pointer')direct.api.primaryPointerDown(direct.event());else direct.api.keyDown(direct.event({code:'Space'}));
  assert.equal(direct.counts.begin,1);assert.equal(direct.scope.mode,'playing');assert.equal(direct.scope.inputOwner,source);
  assert.equal(direct.scope.state[F.holding],1,'The first preparation gesture starts liquid immediately');
  direct.advance(200);
  if(source==='pointer'){direct.api.releasePointer(direct.event());direct.api.primaryClick(direct.event());}else direct.api.keyUp(direct.event({code:'Space'}));
  assert.equal(direct.counts.release,1);assert.equal(direct.scope.mode,'settling');assert.equal(direct.scope.state[16],1);
  assert(direct.scope.state[F.beverageMl]>0);assert.equal(direct.counts.next,0);
}
const noBase=inputFixture({selected:false});
noBase.api.keyDown(noBase.event({code:'Space'}));assert.equal(noBase.counts.begin,0);
const request=noBase.scope.state;noBase.native.set_recipe(request[2],request[F.orderedCherries],request[F.orderedLime],request[F.orderedSyrup],request[F.orderedBlend]);noBase.scope.refreshState();noBase.sync();
noBase.api.keyDown(noBase.event({code:'Space',repeat:true}));noBase.api.keyUp(noBase.event({code:'Space'}));
assert.equal(noBase.counts.begin,0,'Space started before a base selection stays consumed until release');
noBase.api.keyDown(noBase.event({code:'Space'}));assert.equal(noBase.counts.begin,1);noBase.api.keyUp(noBase.event({code:'Space'}));
checks.push('actual preparation pointer-down and fresh Space begin the first Wasm hold immediately; an invalid-base Space cannot become a pour while still held');

const emptyHard=inputFixture();emptyHard.clickPrimary();
assert.equal(emptyHard.counts.begin,1);assert.equal(emptyHard.counts.release,1);assert.equal(emptyHard.scope.state[16],1);
assert.equal(emptyHard.scope.state[F.beverageMl],0);assert.equal(emptyHard.scope.mode,'settling');
const emptyEasy=inputFixture({hardcore:false});emptyEasy.clickPrimary();emptyEasy.clickPrimary();
assert.equal(emptyEasy.counts.begin,2);assert.equal(emptyEasy.counts.serve,0);assert.equal(emptyEasy.scope.state[16],0);
assert.equal(emptyEasy.scope.state[F.beverageMl],0);assert.equal(emptyEasy.button.dataset.action,'pour');assert.equal(emptyEasy.easy.disabled,false);
emptyEasy.clickEasy();assert.equal(emptyEasy.counts.serve,1);assert.equal(emptyEasy.scope.state[16],1);
for(const duration of [20,159,160,240]){
  const topup=inputFixture({hardcore:false,primed:true}),before=topup.scope.state[F.beverageMl];
  topup.api.primaryPointerDown(topup.event());assert.equal(topup.counts.begin,1,'Every primary press begins immediately at '+duration+'ms');
  topup.advance(duration);topup.api.releasePointer(topup.event());topup.api.primaryClick(topup.event());
  assert.equal(topup.counts.serve,0);assert.equal(topup.scope.state[16],0);assert.equal(topup.scope.mode,'playing');
  assert(topup.scope.state[F.beverageMl]>before);assert.equal(topup.button.dataset.action,'pour');
}
checks.push('even an immediate primary click consumes a Hardcore attempt; Easy quick taps only pour and pause, including empty cups; no duration selects an alternate Serve behavior');

const whileHeld=inputFixture({hardcore:false,primed:true});
whileHeld.api.keyDown(whileHeld.event({code:'Space'}));assert.equal(whileHeld.easy.disabled,true);
whileHeld.api.serveDrink();whileHeld.api.easyPointerDown(whileHeld.secondary({pointerId:2}));
whileHeld.api.keyDown(whileHeld.event({code:'Enter'}));
assert.equal(whileHeld.counts.serve,0);assert.equal(whileHeld.scope.inputOwner,'key');assert.equal(whileHeld.scope.state[F.holding],1);
whileHeld.advance(200);whileHeld.api.keyUp(whileHeld.event({code:'Space'}));
whileHeld.api.easyAction(whileHeld.secondary({pointerId:2}));assert.equal(whileHeld.counts.serve,0,'A service press begun during a hold cannot become valid on release');
whileHeld.api.keyUp(whileHeld.event({code:'Enter'}));
whileHeld.clickEasy();assert.equal(whileHeld.counts.serve,1);
for(const boundary of ['cancelPrimaryPointer','clearInput','interruptPour']){
  const cancelled=inputFixture({hardcore:false,primed:true});
  cancelled.api.easyPointerDown(cancelled.secondary());cancelled.api[boundary](cancelled.secondary());cancelled.api.easyAction(cancelled.secondary());
  assert.equal(cancelled.counts.serve,0,boundary+' discards a stale secondary press');
}
const multi=inputFixture({hardcore:false,primed:true});
multi.api.primaryPointerDown(multi.event());multi.api.primaryPointerDown(multi.event({pointerId:2}));
multi.api.releasePointer(multi.event({pointerId:2}));assert.equal(multi.scope.inputOwner,'pointer');assert.equal(multi.counts.release,0);
multi.api.captureLost(multi.event({pointerId:2}));assert.equal(multi.scope.inputOwner,'pointer');assert.equal(multi.counts.release,0);
multi.api.cancelPrimaryPointer(multi.event());multi.api.cancelPrimaryPointer(multi.event());multi.api.releasePointer(multi.event());
assert.equal(multi.counts.release,1);assert.equal(multi.counts.serve,0);
for(const pointerType of ['touch','pen']){
  const interruptedPour=inputFixture();
  interruptedPour.api.primaryPointerDown(interruptedPour.event({pointerType}));interruptedPour.advance(200);
  interruptedPour.api.captureLost(interruptedPour.event({pointerType}));
  assert.equal(interruptedPour.counts.release,1);assert.equal(interruptedPour.scope.mode,'settling');
  interruptedPour.api.releasePointer(interruptedPour.event({pointerType}));interruptedPour.finish();
  interruptedPour.api.captureLost(interruptedPour.event({pointerType}));interruptedPour.api.primaryClick(interruptedPour.event({pointerType}));
  assert.equal(interruptedPour.counts.release,1);assert.equal(interruptedPour.counts.next,0,'An interrupted '+pointerType+' pour cannot become Next');
  const easyPour=inputFixture({hardcore:false});
  easyPour.api.primaryPointerDown(easyPour.event({pointerType}));easyPour.advance(100);easyPour.api.releasePointer(easyPour.event({pointerType}));
  easyPour.api.captureLost(easyPour.event({pointerType}));easyPour.api.primaryClick(easyPour.event({pointerType}));
  assert.equal(easyPour.counts.release,1);assert.equal(easyPour.counts.serve,0);assert.equal(easyPour.scope.mode,'playing');
}
checks.push('Easy service rejects active holds and presses that began while unavailable; cancellation clears pending secondary activation; extra pointers cannot steal a pour');

const hardMix=inputFixture({mixed:true}),mixOpening=ledger(hardMix);
hardMix.api.primaryPointerDown(hardMix.event());hardMix.advance(240);hardMix.api.releasePointer(hardMix.event());hardMix.api.primaryClick(hardMix.event());
assert.equal(hardMix.counts.begin,1);assert.equal(hardMix.scope.mode,'playing');assert.equal(hardMix.scope.state[F.pourPart],1);
assert.equal(hardMix.scope.state[F.attempted],1);assert.equal(hardMix.scope.state[F.partAttempted],0);assert.deepEqual(ledger(hardMix),mixOpening);
assert.equal(hardMix.checkpoints.at(-1)[99],1);assert.equal(hardMix.checkpoints.at(-1)[100],0);
hardMix.api.cancelPrimaryPointer(hardMix.event());hardMix.api.releasePointer(hardMix.event());assert.equal(hardMix.counts.release,1);
hardMix.api.primaryPointerDown(hardMix.event({pointerId:2}));hardMix.advance(240);hardMix.api.releasePointer(hardMix.event({pointerId:2}));hardMix.api.primaryClick(hardMix.event());
assert.equal(hardMix.counts.begin,2);assert.equal(hardMix.counts.release,2);assert.equal(hardMix.scope.mode,'settling');assert.equal(hardMix.scope.state[16],6);
const keyMix=inputFixture({mixed:true});
keyMix.api.keyDown(keyMix.event({code:'Space'}));keyMix.advance(200);keyMix.api.interruptPour();
keyMix.api.keyDown(keyMix.event({code:'Space',repeat:true}));keyMix.api.keyUp(keyMix.event({code:'Space'}));
assert.equal(keyMix.counts.begin,1);assert.equal(keyMix.scope.state[F.pourPart],1);assert.equal(keyMix.scope.state[F.partAttempted],0);
keyMix.api.keyDown(keyMix.event({code:'Space'}));keyMix.advance(200);keyMix.api.keyUp(keyMix.event({code:'Space'}));
assert.equal(keyMix.counts.begin,2);assert.equal(keyMix.scope.mode,'settling');
checks.push('mixed Hardcore still requires two fresh holds, checkpoints the unpaid component switch, and cannot carry an interrupted held Space into soda two');

const easyMixInput=inputFixture({mixed:true,hardcore:false,primed:true}),easyOpening=ledger(easyMixInput);
assert.equal(easyMixInput.button.dataset.action,'pour');assert.equal(easyMixInput.easy.dataset.label,'NEXT SODA');
easyMixInput.clickEasy();assert.equal(easyMixInput.counts.serve,1);assert.equal(easyMixInput.scope.state[F.pourPart],1);
assert.equal(easyMixInput.scope.state[F.partAttempted],0);assert.equal(easyMixInput.easy.disabled,true);assert.deepEqual(ledger(easyMixInput),easyOpening);
assert.equal(easyMixInput.checkpoints.at(-1)[99],1);assert.equal(easyMixInput.checkpoints.at(-1)[100],0);
easyMixInput.clickEasy();assert.equal(easyMixInput.counts.serve,1,'A second click cannot serve the untouched second component');
for(let hold=0;hold<2;hold++){
  easyMixInput.api.primaryPointerDown(easyMixInput.event());easyMixInput.advance(100);easyMixInput.api.releasePointer(easyMixInput.event());easyMixInput.api.primaryClick(easyMixInput.event());
  assert.equal(easyMixInput.scope.state[F.pourPart],1);assert.equal(easyMixInput.counts.serve,1);assert.deepEqual(ledger(easyMixInput),easyOpening);
}
assert.equal(easyMixInput.easy.dataset.label,'SERVE');easyMixInput.clickEasy();
assert.equal(easyMixInput.counts.serve,2);assert.equal(easyMixInput.scope.state[16],6);assert.equal(easyMixInput.scope.mode,'settling');
for(const part of [0,1]){
  const easyEnter=inputFixture({mixed:true,hardcore:false,part,primed:true});
  easyEnter.api.keyDown(easyEnter.event({code:'Enter'}));easyEnter.api.keyDown(easyEnter.event({code:'Enter',repeat:true}));
  assert.equal(easyEnter.counts.serve,1);assert.equal(easyEnter.counts.begin,0);
  assert.equal(easyEnter.scope.state[F.pourPart],1);
  assert.equal(easyEnter.scope.mode,part===0?'playing':'settling');
}
checks.push('Easy uses explicit Next soda and Serve controls, saves the unpaid stage transition, allows immediate top-ups at either stage, and gives one secondary action per Enter');

const emptyReveal=inputFixture();emptyReveal.clickPrimary();
for(let n=0;n<3;n++)emptyReveal.tick(250);
assert.equal(emptyReveal.scope.state[7],0);assert.equal(emptyReveal.scope.mode,'settling');assert.equal(emptyReveal.counts.inline,0,'Even a foam-free empty tap retains the minimum visible settling beat');
emptyReveal.tick(100);assert.equal(emptyReveal.scope.mode,'finished');assert.equal(emptyReveal.counts.inline,1);
const auto=paidFixture(),autoLedger=ledger(auto);
for(let n=0;n<7;n++)auto.tick(100);
assert.equal(auto.scope.mode,'settling','The cup remains visible for the minimum settling interval');
for(let n=0;n<600&&auto.scope.mode==='settling';n++)auto.tick(1000/60);
assert.equal(auto.scope.mode,'finished');assert.equal(auto.counts.inline,1,'The actual frame path renders the inline result automatically');
assert.equal(auto.button.dataset.action,'next');assert.equal(auto.counts.next,0);assert.equal(auto.counts.serve,0);
assert.deepEqual(ledger(auto),autoLedger);assert.equal(auto.cues.filter(name=>['perfect','good','bad'].includes(name)).length,1);
for(let n=0;n<60;n++)auto.tick(1000/60);
assert.equal(auto.counts.inline,1);assert.equal(auto.counts.next,0);assert.deepEqual(ledger(auto),autoLedger);
auto.api.viewReview();assert.equal(auto.counts.review,1);assert.equal(auto.scope.mode,'result');assert.deepEqual(ledger(auto),autoLedger);
auto.api.closeResult();assert.equal(auto.scope.mode,'finished');assert.equal(auto.cues.filter(name=>['perfect','good','bad'].includes(name)).length,1);
auto.clickPrimary();assert.equal(auto.counts.next,1);assert.equal(auto.scope.mode,'preparing');assert.equal(auto.scope.state[F.attempted],0);
auto.api.nextOrder();assert.equal(auto.counts.next,1,'A duplicate Next callback cannot skip the new customer');
const resultNext=paidFixture();resultNext.finish();resultNext.api.viewReview();const receiptLedger=ledger(resultNext);
for(const code of ['Space','Enter']){resultNext.api.keyDown(resultNext.event({code}));resultNext.api.keyUp(resultNext.event({code}));}
resultNext.api.nextOrder();assert.equal(resultNext.counts.next,0);assert.equal(resultNext.scope.mode,'result');assert.deepEqual(ledger(resultNext),receiptLedger);
resultNext.api.closeResult();resultNext.clickPrimary();assert.equal(resultNext.counts.next,1);assert.equal(resultNext.scope.mode,'preparing');
const closing=inputFixture(),goal=closing.scope.state[F.goal];
for(let order=1;order<=goal;order++){
  const request=closing.scope.state;
  closing.native.set_recipe(request[2],request[F.orderedCherries],request[F.orderedLime],request[F.orderedSyrup],request[F.orderedBlend]);closing.scope.refreshState();closing.sync();
  const parts=closing.scope.state[F.isMix]?2:1;
  for(let part=0;part<parts;part++){closing.api.primaryPointerDown(closing.event());closing.advance(80);closing.api.releasePointer(closing.event());closing.api.primaryClick(closing.event());}
  assert.equal(closing.scope.mode,'settling');closing.finish();
  if(order<goal)closing.clickPrimary();
}
assert.equal(closing.scope.state[0],1);assert.equal(closing.scope.state[16],goal);assert.equal(closing.counts.next,goal-1);
const lastPaidSave=savedEngine(closing);
closing.clickPrimary();assert.equal(closing.scope.state[0],2);assert.equal(closing.scope.mode,'summary');assert.equal(closing.counts.next,goal);
const closedLedger=ledger(closing);closing.api.nextOrder();assert.deepEqual(ledger(closing),closedLedger);assert.equal(closing.counts.next,goal);assert.equal(closing.counts.nextDay,0);
for(const pointerType of ['touch','pen']){
  const dayEnd=restoredPaidFixture(lastPaidSave),day=dayEnd.scope.state[F.day];
  assert.equal(dayEnd.scope.state[1],dayEnd.scope.state[F.goal]);
  dayEnd.tapPrimary(pointerType);
  assert.equal(dayEnd.counts.next,1,pointerType+' Close day survives normal implicit capture loss');
  assert.equal(dayEnd.scope.state[0],2);assert.equal(dayEnd.scope.mode,'summary');
  const closeCash=dayEnd.scope.state[F.cash];dayEnd.api.primaryClick(dayEnd.event({pointerType}));
  assert.equal(dayEnd.counts.next,1);assert.equal(dayEnd.counts.nextDay,0);assert.equal(dayEnd.scope.state[F.cash],closeCash);
  dayEnd.tapPrimary(pointerType);
  assert.equal(dayEnd.counts.nextDay,1,pointerType+' Open next day survives normal implicit capture loss');
  assert.equal(dayEnd.scope.state[F.day],day+1);assert.equal(dayEnd.scope.state[0],0);assert.equal(dayEnd.scope.mode,'preparing');
  const openCash=dayEnd.scope.state[F.cash];dayEnd.api.primaryClick(dayEnd.event({pointerType}));
  assert.equal(dayEnd.counts.nextDay,1);assert.equal(dayEnd.counts.begin,0);assert.equal(dayEnd.scope.state[F.cash],openCash);
}
checks.push('the actual frame path waits for visible settling, renders one inline result and cue, and keeps the cup until explicit Next; optional receipt keys cannot advance; its real close callback returns to the cup without repayment or another cue');
checks.push('one explicit Next per customer reaches the last inline result; Close day executes the actual day-close branch once and leaves opening tomorrow explicit');
checks.push('touch and pen Close day and Open next day each survive implicit capture release and execute the production action once, with duplicate clicks unable to open another day or pour');

const settleSpace=paidFixture();
settleSpace.api.keyDown(settleSpace.event({code:'Space'}));settleSpace.finish();
settleSpace.api.keyDown(settleSpace.event({code:'Space',repeat:true}));settleSpace.api.keyUp(settleSpace.event({code:'Space'}));
assert.equal(settleSpace.counts.next,0,'Space begun during settling cannot activate newly available Next');
settleSpace.api.keyDown(settleSpace.event({code:'Space'}));assert.equal(settleSpace.counts.next,1);
settleSpace.api.keyDown(settleSpace.event({code:'Space',repeat:true}));settleSpace.api.keyUp(settleSpace.event({code:'Space'}));
assert.equal(settleSpace.counts.begin,1,'Held Next Space cannot start pouring for the next customer');
const settleEnter=paidFixture();
settleEnter.api.keyDown(settleEnter.event({code:'Enter'}));settleEnter.finish();
settleEnter.api.keyDown(settleEnter.event({code:'Enter',repeat:true}));assert.equal(settleEnter.counts.next,0);
settleEnter.api.keyUp(settleEnter.event({code:'Enter'}));settleEnter.api.keyDown(settleEnter.event({code:'Enter'}));
assert.equal(settleEnter.counts.next,1);
const nativeServe=inputFixture({hardcore:false,primed:true});
const firstEnter=nativeServe.secondary({code:'Enter',detail:0});nativeServe.api.keyDown(firstEnter);
assert.equal(firstEnter.prevented,false,'The separate native button retains its first Enter activation');
nativeServe.api.easyAction(firstEnter);assert.equal(nativeServe.scope.mode,'settling');nativeServe.finish();
const repeatAfterFocus=nativeServe.event({code:'Enter',repeat:true});
nativeServe.api.keyDown(repeatAfterFocus);assert.equal(repeatAfterFocus.prevented,true);assert.equal(nativeServe.counts.next,0);
nativeServe.api.keyUp(nativeServe.event({code:'Enter'}));nativeServe.api.keyDown(nativeServe.event({code:'Enter'}));
assert.equal(nativeServe.counts.next,1,'A fresh Enter may advance after the native Serve Enter is released');
const lostEnter=inputFixture({hardcore:false,primed:true});
lostEnter.api.keyDown(lostEnter.event({code:'Enter'}));assert.equal(lostEnter.scope.menuActivationKey,'Enter');
lostEnter.api.leaveWindow();assert.equal(lostEnter.scope.menuActivationKey,'');lostEnter.finish();
lostEnter.api.keyDown(lostEnter.event({code:'Enter'}));assert.equal(lostEnter.counts.next,1,'Blur clears a missing Enter keyup so the next fresh key is not swallowed');
const settlePointer=paidFixture();settlePointer.api.primaryPointerDown(settlePointer.event());settlePointer.finish();
settlePointer.api.releasePointer(settlePointer.event());settlePointer.api.captureLost(settlePointer.event());settlePointer.api.primaryClick(settlePointer.event());
assert.equal(settlePointer.counts.next,0,'A press begun on disabled settling cannot become Next');
const missingDown=paidFixture();assert.equal(missingDown.scope.suppressPrimaryClick,false);missingDown.finish();
missingDown.api.primaryClick(missingDown.event());assert.equal(missingDown.counts.next,0,'A synthesized click after missing disabled pointerdown has no fresh action owner');
missingDown.api.primaryPointerDown(missingDown.event());missingDown.api.cancelPrimaryPointer(missingDown.event());missingDown.api.primaryClick(missingDown.event());
assert.equal(missingDown.counts.next,0,'Cancelling a Next press invalidates its later click');
missingDown.clickPrimary();assert.equal(missingDown.counts.next,1,'A new complete pointer gesture still advances normally');
const lateRelease=inputFixture();lateRelease.api.primaryPointerDown(lateRelease.event());lateRelease.advance(200);lateRelease.api.releasePointer(lateRelease.event());lateRelease.finish();lateRelease.api.captureLost(lateRelease.event());lateRelease.api.primaryClick(lateRelease.event());
assert.equal(lateRelease.counts.next,0,'The original hold release click cannot skip a result that appears before click delivery');
const pointerDuringKey=inputFixture();pointerDuringKey.api.keyDown(pointerDuringKey.event({code:'Space'}));
pointerDuringKey.api.primaryPointerDown(pointerDuringKey.event({pointerId:2}));pointerDuringKey.advance(200);pointerDuringKey.api.keyUp(pointerDuringKey.event({code:'Space'}));pointerDuringKey.finish();
pointerDuringKey.api.releasePointer(pointerDuringKey.event({pointerId:2}));pointerDuringKey.api.captureLost(pointerDuringKey.event({pointerId:2}));pointerDuringKey.api.primaryClick(pointerDuringKey.event({pointerId:2}));
assert.equal(pointerDuringKey.counts.next,0,'A pointer press begun while Space owns the pour cannot become Next when released later');
const assistive=paidFixture();assistive.finish();assistive.api.primaryClick(assistive.event({detail:0}));assert.equal(assistive.counts.next,1,'An intentional assistive click remains available after a missing pointer click');
checks.push('Space, Enter, native Easy activation, disabled settling presses and pointers begun during another hold cannot skip the completed cup; blur clears lost keyup state; fresh discrete input and assistive clicks still work');

for(const code of ['Enter','Space']){
  const launch=inputFixture({mode:'intro'}),intro=new Element('intro-start'),nextButton=new Element('new-game-button');
  const initial=launch.event({code,target:intro});launch.api.keyDown(initial);assert.equal(initial.prevented,false);
  launch.mode('welcome');const menuRepeat=launch.event({code,target:nextButton,repeat:true});launch.api.keyDown(menuRepeat);assert.equal(menuRepeat.prevented,true);
  launch.mode('preparing');const gameRepeat=launch.event({code,repeat:true});launch.api.keyDown(gameRepeat);assert.equal(gameRepeat.prevented,true);assert.equal(launch.counts.begin,0);
  const released=launch.event({code,target:intro});launch.api.keyUp(released);assert.equal(released.prevented,false);
  launch.api.keyDown(launch.event({code:'Space'}));assert.equal(launch.counts.begin,1,'A new Space starts immediately after the menu gesture ends');launch.api.keyUp(launch.event({code:'Space'}));
}
for(const tag of ['button','a','input','textarea','select','summary']){
  const native=inputFixture(),control=new Element('native-control',tag),key=native.event({code:'Space',target:control});
  native.api.keyDown(key);assert.equal(key.prevented,false,'Native '+tag+' retains Space ownership');assert.equal(native.counts.begin,0);
}
const focus=inputFixture();
focus.api.focusPourAfterPointer(focus.event({detail:0}));assert.equal(focus.button.focusCount,0,'Keyboard ingredient editing retains its focus');
focus.api.focusPourAfterPointer(focus.event());assert.equal(focus.button.focusCount,1,'Pointer recipe selection returns Space to Pour');
const unchosenFocus=inputFixture({selected:false});unchosenFocus.api.focusPourAfterPointer(unchosenFocus.event());assert.equal(unchosenFocus.button.focusCount,0);
focus.mode('playing');focus.api.focusPourAfterPointer(focus.event());assert.equal(focus.button.focusCount,1);
checks.push('held launch keys remain owned by the menu; native controls retain keyboard editing; pointer-origin recipe selections focus Pour only when its base is valid');

// The final effect frame must clear the last droplet even on a non-perfect
// finished cup, where neither settling nor the perfect glint requests redraws.
const finalDrop=paidFixture();finalDrop.finish();
finalDrop.scope.sceneDirty=false;finalDrop.scope.finishElapsed=8;
let trailing=true,cleanFrames=0;
finalDrop.scope.pourVisuals={isAnimating:()=>trailing,update(){trailing=false;}};
finalDrop.scope.draw=()=>cleanFrames++;
finalDrop.tick(16);
assert.equal(cleanFrames,1,'An expiring effect requests one final clean frame');
finalDrop.tick(16);
assert.equal(cleanFrames,1,'A settled non-perfect cup stops drawing after cleanup');
checks.push('the actual frame loop clears the last transient droplet, then returns to idle without a continuous redraw');

console.log(JSON.stringify({result:'PASS',checks,
  verification:'Pure action policy and exact production input, frame and next-order functions with shipped Wasm. Browser geometry, native pointer capture/click synthesis and actual focus remain separate browser checks.'},null,2));
