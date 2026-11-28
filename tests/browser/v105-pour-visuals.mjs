#!/usr/bin/env node
/* The graphics layer must remain bounded, finite, and faithful to engine volume.
 * Canvas commands are checked here; photographic quality is verified in-browser.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const window = {};
vm.runInNewContext(await readFile(new URL('../../web/pour-visuals.js', import.meta.url), 'utf8'), {window});
const {create} = window.PourVisuals;
const game = await readFile(new URL('../../web/game.js', import.meta.url), 'utf8');
const cups = game.match(/const cups = (\[[\s\S]*?\n  \]);/)[1];
const geometryStart = game.indexOf('  function cupGeometry(');
const geometryEnd = game.indexOf('\n  function cupPath(', geometryStart);
assert.ok(geometryStart > 0 && geometryEnd > geometryStart, 'Use the shipped game’s actual volume-to-height implementation');
const geometry = vm.runInNewContext(`const cups=${cups};let cachedCup=-1,geometry=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));${game.slice(geometryStart, geometryEnd)};cupGeometry;`);

function mockCanvas() {
  const trace = [];
  let depth = 0;
  const finite = args => args.filter(v => typeof v === 'number').every(Number.isFinite);
  const context = {
    get depth() { return depth; },trace,
    save() { depth++;trace.push(['save']); },
    restore() { assert.ok(depth > 0, 'Canvas state restore is balanced');depth--;trace.push(['restore']); },
    createLinearGradient(...args) { assert.ok(finite(args));return gradient(); },
    createRadialGradient(...args) { assert.ok(finite(args));return gradient(); }
  };
  function gradient() { return {addColorStop(position, color) {
    assert.ok(position >= 0 && position <= 1 && typeof color === 'string');
    assert.ok(!/NaN|undefined|Infinity/.test(color), 'Gradient colors remain finite');
  }}; }
  for (const name of ['beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo',
    'rect','clip','fillRect','fill','stroke','arc','ellipse','translate','scale']) {
    context[name] = (...args) => {
      assert.ok(finite(args), `${name} only receives finite geometry`);
      if (name === 'arc') assert.ok(args[2] >= 0);
      if (name === 'ellipse') assert.ok(args[2] > 0 && args[3] > 0);
      trace.push([name, ...args]);
    };
  }
  return context;
}

const renderer = create();
const g = geometry(0);
renderer.reset({spillMl: 72});
renderer.update(1 / 60, Object.freeze({geometry:g,fill:.64,foam:.1,spillMl:72,pouring:false}));
assert.equal(renderer.debugSummary().particles, 0, 'Restoring a spilled cup does not replay historical droplets');
assert.equal(renderer.debugSummary().spillTime, 0);

let totalSpill = 72;
for (let i = 0; i < 1200; i++) {
  totalSpill += 4;
  const frozen = Object.freeze({geometry:g,fill:.89,foam:.16,spillMl:totalSpill,pouring:true});
  renderer.update(1 / 60, frozen);
  assert.equal(frozen.spillMl, totalSpill, 'Visual simulation cannot modify engine-derived input');
  const info = renderer.debugSummary();
  assert.ok(info.particles <= info.limit && info.limit <= 80, 'Continuous overflow cannot grow the particle pool');
  assert.ok(info.particles >= 0);
}
renderer.update(1 / 60, {geometry:g,fill:.89,foam:.16,spillMl:totalSpill,pouring:false});
assert.ok(renderer.debugSummary().dripTime > 0, 'Release gets a short visible residual stream');
for (let i = 0; i < 240; i++) renderer.update(1 / 60, {geometry:g,fill:.89,foam:0,spillMl:totalSpill,pouring:false});
assert.equal(renderer.isAnimating(), false, 'An unattended finished cup eventually stops requesting animation');
assert.equal(renderer.debugSummary().particles, 0);
assert.equal(renderer.debugSummary().spillTime, 0);
renderer.update(3, {geometry:g,fill:.1,foam:0,spillMl:0,pouring:false});
assert.equal(renderer.debugSummary().particles, 0, 'A new order with lower spilled volume clears the old effects');
assert.ok(renderer.debugSummary().time <= .25, 'A long hidden-frame gap cannot leap the visual simulation');

const colors = [
  {color:'#f49132',light:'#ffd483'},
  {color:'#d95d75',light:'#ffa6b2'},
  {color:'#83b559',light:'#ceeb96'},
  {color:'#8f573a',light:'#d0a16a'}
];
let renders = 0;
for (let cup = 0; cup < 4; cup++) for (const fill of [0,.01,.15,.65,.99,1]) for (const foam of [0,.0001,.015,.12,.5]) {
  const actual = geometry(cup), levels = [];
  const tracked = Object.freeze({...actual,level(fraction) { levels.push(fraction);return actual.level(fraction); }});
  const ctx = mockCanvas(), callbacks = [];
  assert.equal(renderer.draw(ctx, {
    geometry:tracked,fill,foam,spillMl:17,pouring:true,time:3.6,drink:colors[cup],soda:colors[(cup + 1) % 4],
    drawInside() { callbacks.push('inside');assert.ok(ctx.depth >= 2); },
    drawMark() { callbacks.push('mark');assert.ok(ctx.depth >= 2); },
    drawRim() { callbacks.push('rim');assert.equal(ctx.depth, 1); }
  }), true);
  assert.deepEqual(callbacks, ['inside','mark','rim']);
  assert.equal(ctx.depth, 0, 'Rendering leaves caller state intact');
  assert.ok(levels.includes(fill), 'Liquid surface uses the actual game volume mapping');
  assert.ok(levels.includes(Math.min(1, fill + foam)), 'Foam uses liquid + actual engine foam, clamped at capacity');
  const stream = ctx.trace.some(command => command[0] === 'moveTo' && command[1] === 255 && command[2] === 25);
  assert.ok(stream, 'The visible stream starts at the production nozzle origin');
  renders++;
}

const reduced = create({reducedMotion:true});
reduced.reset();
for (let i = 0; i < 100; i++) reduced.update(.1, {geometry:g,fill:.85,foam:.2,spillMl:i*5,pouring:i<90});
assert.equal(reduced.isAnimating(), false, 'Reduced motion never asks for a decorative animation loop');
assert.equal(reduced.debugSummary().particles, 0, 'Reduced motion does not allocate transient droplets');
const staticCanvas = mockCanvas();
assert.equal(reduced.draw(staticCanvas, {geometry:g,fill:.85,foam:.2,spillMl:30,drink:colors[0],pouring:true}), true);
assert.ok(staticCanvas.trace.some(command => command[0] === 'bezierCurveTo'), 'Reduced motion retains the visible overflow puddle');
assert.equal(staticCanvas.depth, 0);
assert.equal(reduced.draw(staticCanvas, {geometry:null}), false);
assert.equal(reduced.draw(null, {geometry:g}), false);

console.log(JSON.stringify({ok:true,renderScenarios:renders,particleLimit:renderer.debugSummary().limit,
  checks:['actual nonlinear cup geometry','real liquid + foam volume boundaries','spill restore does not replay',
    'bounded continuous overflow','finite release and spill tails','stable canvas state','reduced-motion static feedback']}));
