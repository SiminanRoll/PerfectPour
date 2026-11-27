import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// This checks scheduling and resource ownership, not the audible mix.
const source = await readFile(new URL('../../web/music.js',import.meta.url),'utf8');
let clock = 0, timerId = 0;
const timers = new Map(), contexts = [];
const addTimer = (fn,delay,repeat) => {
  const id = ++timerId; timers.set(id,{fn,at:clock+delay,delay,repeat}); return id;
};
function events(target = {}) {
  const handlers = new Map();
  target.addEventListener = (name,fn) => {
    if(!handlers.has(name)) handlers.set(name,new Set());
    handlers.get(name).add(fn);
  };
  target.removeEventListener = (name,fn) => handlers.get(name)?.delete(fn);
  target.dispatch = name => { for(const fn of [...(handlers.get(name)||[])]) fn(); };
  return target;
}
class Parameter {
  constructor(value = 0) { this.value = value; this.calls = []; }
  setValueAtTime(value,time) { this.value = value; this.calls.push({type:'set',value,time}); }
  linearRampToValueAtTime(value,time) { this.value = value; this.calls.push({type:'linear',value,time}); }
  exponentialRampToValueAtTime(value,time) { this.value = value; this.calls.push({type:'exponential',value,time}); }
  cancelScheduledValues(time) { this.calls.push({type:'cancel',time}); }
}
class Node {
  constructor(context,kind) {
    this.context=context; this.kind=kind; this.connections=new Set(); this.disconnected=false;
    this.gain=new Parameter(1); this.frequency=new Parameter(); this.Q=new Parameter();
    this.delayTime=new Parameter(); this.pan=new Parameter(); this.stops=[];
    context.nodes.push(this);
  }
  connect(target) { this.connections.add(target); this.disconnected=false; return target; }
  disconnect() { this.connections.clear(); this.disconnected=true; }
  start(at = this.context.currentTime) {
    assert.equal(this.started,undefined,'An oscillator cannot start twice'); this.started=at;
  }
  stop(at = this.context.currentTime) { this.stops.push(at); this.stopped=at; }
}
function makeContext(state = 'running') {
  const context=events({state,currentTime:0,nodes:[],resumeCalls:0,destination:{kind:'destination'}});
  for(const [method,kind] of [['createGain','gain'],['createBiquadFilter','filter'],['createDelay','delay'],['createOscillator','oscillator'],['createStereoPanner','pan']]) {
    context[method]=() => new Node(context,kind);
  }
  context.resume=() => { context.resumeCalls++; return Promise.resolve(); };
  contexts.push(context); return context;
}
function advanceClock(ms) {
  const destination=clock+ms;
  for(;;) {
    let next;
    for(const [id,timer] of timers) if(timer.at<=destination&&(!next||timer.at<next.timer.at)) next={id,timer};
    const nextTime=next ? next.timer.at : destination;
    const elapsed=(nextTime-clock)/1000;
    for(const context of contexts) {
      if(context.state==='running') context.currentTime+=elapsed;
      for(const node of context.nodes) {
        if(node.kind==='oscillator'&&!node.ended&&node.stopped!==undefined&&node.stopped<=context.currentTime) {
          node.ended=true; node.onended?.();
        }
      }
    }
    clock=nextTime;
    if(!next) break;
    if(next.timer.repeat) next.timer.at+=next.timer.delay; else timers.delete(next.id);
    next.timer.fn();
  }
}
const window=events(),document=events({hidden:false});
vm.runInNewContext(source,{
  window,document,
  setInterval:(fn,ms)=>addTimer(fn,ms,true),clearInterval:id=>timers.delete(id),
  setTimeout:(fn,ms)=>addTimer(fn,ms,false),clearTimeout:id=>timers.delete(id)
},{filename:'web/music.js'});
const music=window.PourMusic;
const intervals=()=>[...timers.values()].filter(timer=>timer.repeat).length;
const sources=context=>context.nodes.filter(node=>node.kind==='oscillator');
const check=[];

assert.equal(music.isPlaying(),false);
assert.equal(timers.size,0);
assert.equal(music.start(),false);
assert.equal(contexts.length,0,'The module does not create an AudioContext');
check.push('no autoplay, context creation, or timers before an explicit start');

const context=makeContext();
assert.equal(music.start(context),true);
assert.equal(music.start(context),true);
assert.equal(music.start(),true);
assert.equal(intervals(),1,'Repeated starts share one scheduler');
advanceClock(1200);
assert.ok(sources(context).length>2,'Music schedules multiple instrument notes');
assert.ok(sources(context).every(node=>Number.isFinite(node.frequency.value)&&node.frequency.value>0));
const firstRunGain=context.nodes.find(node=>node.kind==='gain'&&[...node.connections].some(target=>target.kind==='filter'));
assert.ok(firstRunGain);
assert.ok(firstRunGain.gain.calls.some(call=>call.type==='linear'&&call.value>0&&call.value<=.2),'Music uses a conservative master level');
check.push('idempotent starts; one loop; finite musical pitches and quiet master gain');

// Stop while a future note is queued: it must be cancelled, not play on later.
for(let n=0;n<40&&!sources(context).some(node=>node.started>context.currentTime&&!node.ended);n++) advanceClock(30);
const queued=sources(context).filter(node=>node.started>context.currentTime&&!node.ended);
assert.ok(queued.length>0,'Test reached a queued future note');
const stoppedAt=context.currentTime;
music.stop(); music.stop();
assert.equal(music.isPlaying(),false);
assert.equal(intervals(),0);
assert.ok(queued.every(node=>node.stopped<=stoppedAt),'Future notes cannot sound after stop');
assert.ok(firstRunGain.gain.calls.some(call=>call.type==='linear'&&call.value===0),'Active audio fades to zero');
const priorCount=sources(context).length;
advanceClock(50);
assert.equal(music.start(context),true,'Rapidly enabling music again starts a new owned loop');
assert.equal(intervals(),1);
advanceClock(200);
assert.equal(firstRunGain.disconnected,true,'Retiring graph is disconnected even after a restart');
assert.ok(sources(context).length>priorCount);
check.push('stop fades active notes, cancels future notes, and cleans old graph across rapid toggles');

context.state='suspended'; context.dispatch('statechange');
assert.equal(music.isPlaying(),false);
assert.equal(intervals(),0);
const beforeSuspended=sources(context).length;
assert.equal(music.start(context),false);
advanceClock(500);
assert.equal(sources(context).length,beforeSuspended);
assert.equal(timers.size,0,'Suspended audio still completes wall-clock graph cleanup');
assert.equal(context.resumeCalls,0,'Only the game may resume audio from a user gesture');
context.state='running'; context.dispatch('statechange');
assert.equal(music.isPlaying(),false,'A running context does not automatically restart music');
check.push('suspension stops scheduling without attempting an unsolicited resume');

music.start(context); document.hidden=true; document.dispatch('visibilitychange');
assert.equal(music.isPlaying(),false); assert.equal(intervals(),0);
assert.equal(music.start(context),false);
document.hidden=false; document.dispatch('visibilitychange');
assert.equal(music.isPlaying(),false,'Visibility restoration alone does not restart audio');
music.start(context); window.dispatch('blur');
assert.equal(music.isPlaying(),false); assert.equal(intervals(),0);
check.push('hidden documents and blur stop music; focus and visibility do not auto-resume');

const replacement=makeContext();
music.start(context); music.attach(replacement);
assert.equal(music.isPlaying(),false);
assert.equal(intervals(),0);
assert.ok(context.nodes.every(node=>node.disconnected),'Replacing a context releases all previous audio nodes');
assert.equal(music.start(replacement),true);
advanceClock(101000); // More than two complete 16-bar loops.
assert.equal(intervals(),1);
assert.ok(sources(replacement).length>350,'The composition loops beyond its initial phrase');
assert.ok(sources(replacement).filter(node=>!node.ended).length<35,'Finished voices do not accumulate in active playback');
music.stop(); advanceClock(500);
assert.equal(timers.size,0);
assert.equal(replacement.resumeCalls,0);
check.push('context replacement releases prior graph; full loops keep bounded active voices and clean shutdown');

console.log(JSON.stringify({result:'PASS',checks:check,verification:'Mock Web Audio lifecycle; audible mix requires browser playback.'},null,2));
