#!/usr/bin/env node
/** Pure presentation transitions, not DOM events or a browser playtest. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../web/control-flow.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, {window}, {filename: 'web/control-flow.js'});
const {resolve} = window.PourFlow;
const clean = {mode:'preparing', hardcore:true, attempted:false, holding:false,
  selectedSoda:4, recipeLocked:false, lastCustomer:false};
const checks = [];

let state = {...clean};
assert.equal(resolve(state).action, 'choose');
assert.equal(resolve(state).disabled, true);
assert.equal(resolve(state).showRecipe, true);
assert.equal(resolve(state).showPressure, true);
for (const base of [-1,4,5,NaN,undefined,1.5])
  assert.equal(resolve({...state,selectedSoda:base}).disabled, true, 'An unchosen/invalid base cannot suggest a pour');
state.selectedSoda = 0;
assert.equal(resolve(state).action, 'ready');
assert.equal(resolve(state).disabled, false);
assert.equal(resolve(state).stage, 'prep');
state.mode = 'playing';
assert.equal(resolve(state).action, 'pour');
assert.equal(resolve(state).stage, 'ready');
assert.equal(resolve(state).showRecipe, false);
assert.equal(resolve(state).showPressure, false);
assert.equal(resolve(state).showMode, false);
const before = {...state}; resolve(state); assert.deepEqual(state, before, 'Presentation never mutates game/input state');
checks.push('a prepared base unlocks Ready; the stable pour view hides recipe/pressure controls before the first hold');

state = {...state,attempted:true,holding:true,recipeLocked:true};
assert.equal(resolve(state).label, 'RELEASE TO SERVE');
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
assert.equal(resolve(state).action, 'review');
assert.equal(resolve(state).disabled, false);
assert.equal(resolve(state).showRecipe, false);
state.mode = 'result';
assert.equal(resolve(state).action, 'next');
assert.equal(resolve(state).label, 'NEXT CUSTOMER');
state.lastCustomer = true;
assert.equal(resolve(state).label, 'CLOSE THE DAY');
state.mode = 'summary';
assert.equal(resolve(state).action, 'nextDay');
assert.equal(resolve(state).showPressure, false);
checks.push('Hardcore advances from one hold to a disabled settling action, then explicit review and next-customer/day actions');

state = {...clean,mode:'playing',hardcore:false,selectedSoda:3};
assert.equal(resolve(state).action, 'pour');
state = {...state,attempted:true,holding:true,recipeLocked:true};
assert.equal(resolve(state).label, 'RELEASE TO PAUSE');
state.holding = false;
assert.equal(resolve(state).action, 'easyServe');
assert.equal(resolve(state).hint, 'Tap to serve · hold to top up');
assert.equal(resolve(state).showRecipe, false, 'Easy top-ups do not unlock recipe edits');
state.holding = true;
assert.equal(resolve(state).action, 'pour');
state = {...state,holding:false,mode:'settling'};
assert.equal(resolve(state).disabled, true);
state.mode = 'finished'; assert.equal(resolve(state).action, 'review');
checks.push('Easy uses the same action for tap-to-serve or hold-to-top-up while the recipe remains locked');

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
checks.push('menus and inactive modes cannot expose a live pour/review action; phase policy is deterministic and side-effect free');

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
const functionNames=['cancelPendingPointer','primaryAction','primaryPointerDown','releasePointer',
  'cancelPrimaryPointer','primaryClick','nativeActivation','keyDown','keyUp',
  'clearInput','beginInput','releaseInput','interruptPour','serveDrink','readyToPour'];
class Element {
  constructor(id,tag='button'){this.id=id;this.tag=tag;this.dataset={};this.disabled=false;this.hidden=false;this.open=false;this.captures=[];this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};}
  closest(selector){return selector.split(',').some(part=>part.trim()===this.tag)?this:null;}
  setPointerCapture(id){this.captures.push(id);}
  focus(){}
}
function inputFixture({hardcore=true,mode='playing',primed=false,selected=true}={}){
  const native=new WebAssembly.Instance(module,{}).exports;
  native.reset(907);native.set_mode(hardcore?1:0);
  const snap=()=>new Float32Array(native.memory.buffer,native.state_ptr(),native.state_len());
  if(selected){const s=snap();native.set_recipe(s[2],s[F.orderedCherries],s[F.orderedLime],s[F.orderedSyrup],s[F.orderedBlend]);}
  if(primed){native.begin_pour();native.step(.2,0);native.end_pour();}
  let now=0,simulatedAt=0,nextTimer=0;const timers=new Map(),events=[];
  const counts={begin:0,release:0,serve:0,review:0,next:0,nextDay:0};
  const button=new Element('pour-button'),tap=new Element('tap-machine','div'),pressure=new Element('pressure-controls','details');
  const engine={...native,
    begin_pour(){counts.begin++;return native.begin_pour();},
    end_pour(){counts.release++;return native.end_pour();},
    serve(){counts.serve++;return native.serve();}
  };
  const scope={engine,F,state:snap(),ready:true,externalSave:false,mode,returnMode:'playing',
    pendingPointer:null,suppressPrimaryClick:false,inputOwner:null,activePointer:null,
    keyHeld:false,settlingSpaceHeld:false,menuActivationKey:'',pouring:false,
    overlays:['intro','welcome','result','summary','pause','help','restart'],Element,
    performance:{now:()=>now},
    setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},
    clearTimeout(id){timers.delete(id);},
    $(id){if(id==='pour-button')return button;if(id==='pressure-controls')return pressure;throw new Error(`Unexpected input DOM target ${id}`);},
    document:{querySelector(selector){if(selector==='.tap-machine')return tap;if(selector==='.overlay:not([hidden])')return null;throw new Error(`Unexpected input DOM query ${selector}`);},querySelectorAll(){return[];}},
    refreshState(){scope.state=snap();},
    advanceSimulation(at){let remaining=(at-simulatedAt)/1000;simulatedAt=at;if(!['playing','preparing'].includes(scope.mode))return;while(remaining>1e-9){const h=Math.min(.25,remaining);native.step(h,0);remaining-=h;}scope.refreshState();},
    saveCareer(){},setCustomerMood(){},openAudio(){},startPourSound(){},stopPourSound(){},
    announce(message){events.push(message);},
    updateHud(){sync();},
    setMode(next){scope.mode=next;sync();},
    showCommittedPour(){scope.mode='settling';sync();},
    viewReview(){counts.review++;scope.mode='result';sync();},
    nextOrder(){counts.next++;native.next_order();scope.refreshState();scope.mode='preparing';sync();},
    openNextDay(){counts.nextDay++;scope.mode='preparing';sync();},
    pause(){api.interruptPour();scope.mode='pause';sync();},
    resume(){scope.mode='playing';sync();},closeHelp(){scope.mode='playing';sync();},
    cancelRestart(){scope.mode='store';sync();},leaveStore(){scope.mode='playing';sync();}
  };
  function sync(){
    const s=scope.state,policy=resolve({mode:scope.mode,hardcore:s[F.hardcore],attempted:s[F.attempted],holding:s[F.holding],selectedSoda:s[F.selectedSoda],recipeLocked:s[F.recipeLocked],lastCustomer:s[1]===s[F.goal]});
    button.dataset.action=policy.action;button.disabled=policy.disabled;
  }
  const context=vm.createContext(scope);
  const api=vm.runInContext(functionNames.map(extractFunction).join('\n')+`\n({${functionNames.join(',')}});`,context);
  sync();
  function advance(ms){
    const end=now+ms;
    for(;;){let next;for(const [id,timer] of timers)if(timer.at<=end&&(!next||timer.at<next.timer.at))next={id,timer};if(!next)break;now=next.timer.at;timers.delete(next.id);next.timer.fn();}
    now=end;
  }
  function event(extra={}){return{button:0,isPrimary:true,pointerId:1,currentTarget:button,target:button,detail:1,repeat:false,prevented:false,preventDefault(){this.prevented=true;},...extra};}
  return{api,scope,button,counts,events,timers,advance,event,sync,native,
    mode(next){scope.mode=next;sync();},
    finish(){scope.mode='finished';sync();}
  };
}

const hc=inputFixture();
hc.api.primaryPointerDown(hc.event());hc.advance(200);
hc.api.releasePointer(hc.event());hc.api.primaryClick(hc.event());
assert.equal(hc.counts.begin,1);assert.equal(hc.counts.release,1);
assert.equal(hc.scope.mode,'settling');assert.equal(hc.scope.state[16],1);
hc.api.primaryPointerDown(hc.event());hc.api.releasePointer(hc.event());
assert.equal(hc.counts.begin,1,'A committed Hardcore cup cannot begin a second hold');
checks.push('actual Hardcore pointer handlers commit one Wasm attempt and suppress the release click');

const tapServe=inputFixture({hardcore:false,primed:true});
tapServe.api.primaryPointerDown(tapServe.event());tapServe.advance(159);
assert.equal(tapServe.counts.begin,0);tapServe.api.releasePointer(tapServe.event());tapServe.api.primaryClick(tapServe.event());
assert.equal(tapServe.counts.serve,1);assert.equal(tapServe.counts.begin,0);assert.equal(tapServe.scope.state[16],1);assert.equal(tapServe.timers.size,0);
const holdTopup=inputFixture({hardcore:false,primed:true});
holdTopup.api.primaryPointerDown(holdTopup.event());holdTopup.advance(160);
assert.equal(holdTopup.counts.begin,1);assert.equal(holdTopup.scope.inputOwner,'pointer');holdTopup.advance(200);
holdTopup.api.releasePointer(holdTopup.event());holdTopup.api.primaryClick(holdTopup.event());
assert.equal(holdTopup.counts.release,1);assert.equal(holdTopup.counts.serve,0);assert.equal(holdTopup.scope.state[16],0);assert.equal(holdTopup.scope.mode,'playing');assert.equal(holdTopup.timers.size,0);
checks.push('actual Easy tap below160ms serves once; a160ms hold tops up without its release click accidentally serving');

const emptyEasy=inputFixture({hardcore:false});
emptyEasy.api.primaryPointerDown(emptyEasy.event());emptyEasy.api.releasePointer(emptyEasy.event());emptyEasy.api.primaryClick(emptyEasy.event());
assert.equal(emptyEasy.scope.state[F.attempted],1);assert.equal(emptyEasy.scope.state[6]+emptyEasy.scope.state[7],0);
emptyEasy.api.primaryPointerDown(emptyEasy.event());emptyEasy.advance(80);emptyEasy.api.releasePointer(emptyEasy.event());emptyEasy.api.primaryClick(emptyEasy.event());
assert.equal(emptyEasy.counts.serve,1);assert.equal(emptyEasy.scope.state[16],1,'An empty Easy attempt can be submitted instead of trapping the player');
assert.equal(emptyEasy.scope.mode,'settling');
checks.push('an immediate Easy release still has a usable serve action, including an empty cup');

for(const boundary of ['cancelPrimaryPointer','clearInput','interruptPour']){
  const cancelled=inputFixture({hardcore:false,primed:true});
  cancelled.api.primaryPointerDown(cancelled.event());cancelled.advance(80);
  cancelled.api[boundary](cancelled.event());cancelled.advance(500);cancelled.api.releasePointer(cancelled.event());
  assert.equal(cancelled.counts.begin,0,`${boundary} cancels the deferred hold`);
  assert.equal(cancelled.counts.serve,0,`${boundary} cannot submit a deferred tap`);
  assert.equal(cancelled.timers.size,0);
}
const multiple=inputFixture({hardcore:false,primed:true});
multiple.api.primaryPointerDown(multiple.event());multiple.api.primaryPointerDown(multiple.event({pointerId:2}));
multiple.api.releasePointer(multiple.event({pointerId:2}));assert.equal(multiple.scope.pendingPointer.id,1);
assert.equal(multiple.counts.serve,0);multiple.api.cancelPrimaryPointer(multiple.event());
const keyOwnership=inputFixture({hardcore:false,primed:true});
keyOwnership.api.primaryPointerDown(keyOwnership.event());keyOwnership.advance(80);keyOwnership.api.keyDown(keyOwnership.event({code:'Space'}));
keyOwnership.advance(200);keyOwnership.api.releasePointer(keyOwnership.event());
assert.equal(keyOwnership.counts.serve,0);assert.equal(keyOwnership.counts.begin,1);assert.equal(keyOwnership.scope.inputOwner,'key');
keyOwnership.api.keyUp(keyOwnership.event({code:'Space'}));assert.equal(keyOwnership.counts.release,1);assert.equal(keyOwnership.timers.size,0);
checks.push('actual cancel, clear, and interrupt boundaries release pending timers; extra pointers cannot steal ownership; Space cancels a pending pointer decision');

const prepSpace=inputFixture({mode:'preparing'});
prepSpace.api.keyDown(prepSpace.event({code:'Space'}));assert.equal(prepSpace.counts.begin,0);
prepSpace.mode('playing');prepSpace.api.keyDown(prepSpace.event({code:'Space',repeat:true}));prepSpace.api.keyUp(prepSpace.event({code:'Space'}));
assert.equal(prepSpace.counts.begin,0,'Space begun during preparation remains consumed even if readiness changes');
prepSpace.api.keyDown(prepSpace.event({code:'Space'}));prepSpace.api.keyDown(prepSpace.event({code:'Space',repeat:true}));prepSpace.advance(200);prepSpace.api.keyUp(prepSpace.event({code:'Space'}));
assert.equal(prepSpace.counts.begin,1);assert.equal(prepSpace.counts.release,1);
const settleSpace=inputFixture();settleSpace.mode('settling');
settleSpace.api.keyDown(settleSpace.event({code:'Space'}));settleSpace.finish();
settleSpace.api.keyDown(settleSpace.event({code:'Space',repeat:true}));settleSpace.api.keyUp(settleSpace.event({code:'Space'}));
assert.equal(settleSpace.counts.review,0,'Space begun during settling cannot open the finished cup review');
settleSpace.api.keyDown(settleSpace.event({code:'Space'}));assert.equal(settleSpace.counts.review,1);
settleSpace.api.keyDown(settleSpace.event({code:'Space',repeat:true}));settleSpace.api.keyUp(settleSpace.event({code:'Space'}));
assert.equal(settleSpace.counts.next,0,'A fresh review Space cannot repeat into Next customer');
const enter=inputFixture({mode:'preparing'});
enter.api.keyDown(enter.event({code:'Enter'}));assert.equal(enter.scope.mode,'playing');assert.equal(enter.counts.begin,0);
enter.finish();enter.api.keyDown(enter.event({code:'Enter'}));enter.api.keyDown(enter.event({code:'Enter',repeat:true}));
assert.equal(enter.counts.review,1);assert.equal(enter.counts.next,0);
checks.push('actual Space and Enter handlers preserve preparation/settling handoffs and cannot repeat through review into the next customer');

// The test invokes key callbacks at the native activation boundary. It does
// not synthesize the browser's click: the intervening mode change represents
// that control's separate click handler, which the menu suite tests directly.
for(const code of ['Enter','Space']){
  const launch=inputFixture({mode:'intro'}),intro=new Element('intro-start'),next=new Element('new-game-button');
  const initial=launch.event({code,target:intro});launch.api.keyDown(initial);
  assert.equal(initial.prevented,false,`${code} keeps the initial native Start activation`);
  assert.equal(launch.scope.menuActivationKey,code);
  launch.mode('welcome');
  const repeatOnMenu=launch.event({code,target:next,repeat:true});launch.api.keyDown(repeatOnMenu);
  assert.equal(repeatOnMenu.prevented,true,`Held ${code} cannot activate the newly focused menu control`);
  launch.mode('preparing');
  const repeatOnGame=launch.event({code,repeat:true});launch.api.keyDown(repeatOnGame);
  assert.equal(repeatOnGame.prevented,true,`Held ${code} cannot cross the menu into gameplay`);
  assert.equal(launch.counts.begin,0);assert.equal(launch.scope.mode,'preparing');
  const released=launch.event({code,target:intro});launch.api.keyUp(released);
  assert.equal(released.prevented,false,'Releasing the first native Space must retain its default click');
  assert.equal(launch.scope.menuActivationKey,'');
  launch.api.keyDown(launch.event({code:'Enter'}));
  assert.equal(launch.scope.mode,'playing','A fresh key remains usable after the launch key is released');
  assert.equal(launch.counts.begin,0);
}
checks.push('native menu Enter/Space keep their first activation but held repeats cannot trigger newly focused menu or game controls');

const noClickAfterHold=inputFixture();
noClickAfterHold.api.primaryPointerDown(noClickAfterHold.event());noClickAfterHold.advance(200);noClickAfterHold.api.releasePointer(noClickAfterHold.event());
noClickAfterHold.finish();noClickAfterHold.api.primaryClick(noClickAfterHold.event({detail:0}));
assert.equal(noClickAfterHold.counts.review,1,'A missing pointer-generated click does not suppress a later assistive activation');
for(const tag of ['button','a','input','textarea','select','summary']){
  const native=inputFixture({mode:'preparing'}),control=new Element('native-control',tag);
  const key=native.event({code:'Space',target:control});native.api.keyDown(key);
  assert.equal(key.prevented,false,`Native ${tag} Space remains owned by the native control`);
  assert.equal(native.scope.settlingSpaceHeld,false);
}
checks.push('assistive clicks remain usable after an outside release; native controls retain Space ownership');

const settlePointer=inputFixture();settlePointer.mode('settling');
settlePointer.api.primaryPointerDown(settlePointer.event());settlePointer.finish();
settlePointer.api.releasePointer(settlePointer.event());settlePointer.api.primaryClick(settlePointer.event());
assert.equal(settlePointer.counts.review,0,'A pointer press begun on the disabled settling action cannot become a review click when the role changes');
checks.push('a pointer gesture begun during settling cannot activate the newly ready review');

console.log(JSON.stringify({result:'PASS',checks,
  verification:'Pure control policy plus exact production input functions at clocked event boundaries with shipped Wasm. Browser layout, pointer capture/event synthesis, and focus remain separate browser checks.'},null,2));
