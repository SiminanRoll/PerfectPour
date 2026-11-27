import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Test the game's audible-state contract with a clocked Web Audio fake.
// This verifies ownership/decay, not the subjective mix or speaker quality.
const source=await readFile(new URL('../../web/game-sounds.js',import.meta.url),'utf8');
let clock=0,timerId=0;
const timers=new Map(),contexts=[];
function events(target={}) {
  const handlers=new Map();
  target.addEventListener=(name,fn)=>{if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(fn);};
  target.removeEventListener=(name,fn)=>handlers.get(name)?.delete(fn);
  target.dispatch=name=>{for(const fn of [...(handlers.get(name)||[])])fn();};
  return target;
}
class Parameter {
  constructor(value=0){this.value=value;this.calls=[];}
  setValueAtTime(value,time){this.value=value;this.calls.push({type:'set',value,time});}
  linearRampToValueAtTime(value,time){this.value=value;this.calls.push({type:'linear',value,time});}
  exponentialRampToValueAtTime(value,time){this.value=value;this.calls.push({type:'exponential',value,time});}
  cancelScheduledValues(time){this.calls.push({type:'cancel',time});}
}
class Node {
  constructor(context,kind){
    this.context=context;this.kind=kind;this.connections=new Set();this.disconnected=false;
    this.gain=new Parameter(1);this.frequency=new Parameter();this.Q=new Parameter();
    context.nodes.push(this);
  }
  connect(target){this.connections.add(target);return target;}
  disconnect(){this.connections.clear();this.disconnected=true;}
  start(at=this.context.currentTime){assert.equal(this.started,undefined,'Source can start only once');this.started=at;}
  stop(at=this.context.currentTime){this.stopped=at;}
}
function makeContext(state='running'){
  const context=events({state,currentTime:0,nodes:[],resumeCalls:0,sampleRate:8000,destination:{kind:'destination'}});
  for(const [method,kind] of [['createGain','gain'],['createBiquadFilter','filter'],['createOscillator','oscillator'],['createBufferSource','noise']])context[method]=()=>new Node(context,kind);
  context.createBuffer=(channels,length,sampleRate)=>({channels,length,sampleRate,data:new Float32Array(length),getChannelData(){return this.data;}});
  context.resume=()=>{context.resumeCalls++;return Promise.resolve();};
  contexts.push(context);return context;
}
function advance(ms){
  const end=clock+ms;
  for(;;){
    let next;
    for(const [id,timer] of timers)if(timer.at<=end&&(!next||timer.at<next.timer.at))next={id,timer};
    const time=next?next.timer.at:end,elapsed=(time-clock)/1000;
    for(const context of contexts){
      if(context.state==='running')context.currentTime+=elapsed;
      for(const node of context.nodes)if(!node.ended&&node.stopped!==undefined&&node.stopped<=context.currentTime){node.ended=true;node.onended?.();}
    }
    clock=time;if(!next)break;timers.delete(next.id);next.timer.fn();
  }
}
const document=events({hidden:false}),window=events();
vm.runInNewContext(source,{window,document,
  setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,at:clock+delay});return id;},
  clearTimeout:id=>timers.delete(id)
},{filename:'web/game-sounds.js'});
const sounds=window.PerfectPourSounds;
const check=[];
assert.equal(sounds.startPour(),false);assert.equal(sounds.cue('perfect'),false);
assert.equal(contexts.length,0);assert.equal(timers.size,0);
check.push('no audio context, playback, or timers before the game supplies an unlocked context');

const context=makeContext();sounds.attach(context);
assert.equal(context.nodes.length,1,'Attaching creates only a silent master bus');
assert.equal(sounds.startPour(0),true);assert.equal(sounds.startPour(0),true);
assert.equal(context.nodes.filter(node=>node.kind==='noise').length,1,'Repeated hold starts do not stack tap loops');
const firstPour=context.nodes.find(node=>node.kind==='noise');
const firstFilter=[...firstPour.connections][0],firstGain=[...firstFilter.connections][0];
assert.equal(firstFilter.frequency.value,950);
assert.ok(firstPour.buffer.data.every(Number.isFinite));
const oscillatorsBeforeRelease=context.nodes.filter(node=>node.kind==='oscillator').length;
sounds.stopPour();assert.ok(firstPour.stopped>context.currentTime,'Release uses a short fade instead of a hard cutoff');
assert.ok(firstGain.gain.calls.some(call=>call.type==='linear'&&call.value===0));
assert.equal(firstGain.gain.calls.filter(call=>call.type==='set').at(-1).value,0,'Releasing before the attack advances must not jump to its future peak');
assert.equal(context.nodes.filter(node=>node.kind==='oscillator').length,oscillatorsBeforeRelease,'Pour release has no discrete result tone');
sounds.startPour(3);
const colaFilter=context.nodes.filter(node=>node.kind==='filter').at(-1);
assert.ok(colaFilter.frequency.value>firstFilter.frequency.value,'Cola has a brighter tap texture than Orange');
advance(150);assert.equal(firstPour.disconnected,true);
sounds.stopPour();advance(150);
check.push('a hold owns one pour bed; recipe changes fizz texture; release fades and releases its graph');

sounds.startPour(1);advance(30);
const midAttack=context.nodes.filter(node=>node.kind==='noise').at(-1),midFilter=[...midAttack.connections][0],midGain=[...midFilter.connections][0];
sounds.stopPour();
assert.ok(Math.abs(midGain.gain.calls.filter(call=>call.type==='set').at(-1).value-.06)<1e-8,'A mid-attack release begins at the interpolated current level, not the queued target');
advance(200);
check.push('quick and mid-attack release preserve amplitude continuity and do not emit a result cue');

sounds.updateFoam(.30,3,true);
const tail=context.nodes.filter(node=>node.kind==='noise').at(-1),tailFilter=[...tail.connections][0],tailGain=[...tailFilter.connections][0];
const highTailLevel=tailGain.gain.calls.at(-1).value;
assert.equal(tailFilter.type,'bandpass');
assert.equal(tailGain.gain.calls.filter(call=>call.type==='set').at(-1).value,0,'Foam starts silently and fades in');
advance(20);
sounds.updateFoam(.03,3,true);
assert.ok(tailGain.gain.calls.at(-1).value<highTailLevel,'The settling sound follows physical foam decay');
assert.ok(Math.abs(tailGain.gain.calls.filter(call=>call.type==='set').at(-1).value-highTailLevel*.125)<1e-8,'The first foam-frame retarget does not bypass its attack fade');
assert.equal(context.nodes.filter(node=>node.kind==='noise'&&!node.disconnected).length,1,'Frame updates reuse one settling voice');
sounds.updateFoam(.001,3,true);advance(180);
assert.equal(tail.disconnected,true,'No inaudible tail extends the settled state');
sounds.updateFoam(.3,3,false);
assert.equal(context.nodes.filter(node=>node.kind==='noise'&&!node.disconnected).length,0);
check.push('foam amplitude decays with the cup, shares one voice, and ends at the physical readiness threshold');

function pitchesFor(cue,options){
  const before=context.nodes.length;sounds.cue(cue,options);
  return context.nodes.slice(before).filter(node=>node.kind==='oscillator').map(node=>node.frequency.value);
}
const good=pitchesFor('good'),perfect=pitchesFor('perfect'),bad=pitchesFor('bad'),purchase=pitchesFor('purchase');
assert.equal(good.length,2);assert.equal(perfect.length,4);assert.equal(bad.length,2);assert.equal(purchase.length,3);
assert.equal(pitchesFor('ingredient',{kind:'cherry'}).length,1);
assert.notDeepEqual(pitchesFor('ingredient',{kind:'lime'}),pitchesFor('ingredient',{kind:'syrup'}),'Preparation feedback distinguishes fruit and syrup');
assert.notDeepEqual(good,bad);assert.ok(Math.max(...perfect)>Math.max(...good));
const shortStreak=pitchesFor('streak',{streak:3}),longStreak=pitchesFor('streak',{streak:8});
assert.ok(longStreak[0]>shortStreak[0]);
assert.equal(pitchesFor('day').length,4);assert.equal(pitchesFor('spill').length,1);
advance(1400);
assert.ok(context.nodes.filter(node=>node.kind==='oscillator').every(node=>node.disconnected));
assert.equal(timers.size,0);
check.push('good, perfect, poor, purchase, streak, and day cues differ and all scheduled voices are released');

sounds.startPour(1);sounds.updateFoam(.4,1,true);sounds.cue('perfect');
sounds.setEnabled(false);advance(250);
assert.ok(context.nodes.filter(node=>['noise','oscillator'].includes(node.kind)).every(node=>node.disconnected));
assert.equal(sounds.startPour(),false);assert.equal(sounds.cue('day'),false);
sounds.updateFoam(.3,1,true);assert.equal(timers.size,0);
sounds.setEnabled(true);assert.equal(context.nodes.filter(node=>node.kind==='noise'&&!node.disconnected).length,0);
sounds.setVolume(.25);const master=context.nodes[0];
assert.equal(master.gain.calls.at(-1).value,.075);
check.push('effects mute independently cancels every voice; unmute does not autoplay; volume fades on its own bus');

sounds.startPour(2);context.state='suspended';context.dispatch('statechange');advance(250);
assert.equal(sounds.startPour(),false);assert.equal(context.resumeCalls,0);
assert.equal(timers.size,0);
context.state='running';context.dispatch('statechange');
assert.equal(context.nodes.filter(node=>node.kind==='noise'&&!node.disconnected).length,0);
sounds.startPour(1);document.hidden=true;document.dispatch('visibilitychange');advance(250);
assert.equal(sounds.startPour(),false);
document.hidden=false;sounds.startPour(1);window.dispatch('blur');advance(250);
assert.equal(context.nodes.filter(node=>node.kind==='noise'&&!node.disconnected).length,0);
const replacement=makeContext();sounds.attach(replacement);
assert.ok(context.nodes.every(node=>node.disconnected),'Changing contexts releases the old bus and all sound sources');
sounds.startPour(0);sounds.destroy();assert.ok(replacement.nodes.every(node=>node.disconnected));
assert.equal(timers.size,0);assert.equal(sounds.startPour(),false);
check.push('suspend, hidden page, blur, context replacement, and destruction leave no active sources or timers');

console.log(JSON.stringify({result:'PASS',checks:check,verification:'Clocked Web Audio lifecycle and cue structure; audible mix requires browser listening.'},null,2));
