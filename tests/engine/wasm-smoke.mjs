import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const bytes = await readFile(new URL('../../engine/perfect_pour_engine.wasm', import.meta.url));
const contract = JSON.parse(await readFile(new URL('../../engine/contract.json', import.meta.url), 'utf8'));
const module = await WebAssembly.compile(bytes);
assert.deepEqual(WebAssembly.Module.imports(module), [], 'The engine must be fully self-contained');
const {exports: game} = await WebAssembly.instantiate(module, {});
const I = contract.snapshot.fields;
const checks = [];
for (const name of Object.keys(contract.exports)) {
  assert.equal(typeof game[name], 'function', `Missing ${name}`);
}
assert.equal(game.state_len(), 65);
assert.equal(game.save_len(), 80);
const state = () => Array.from(new Float32Array(game.memory.buffer, game.state_ptr(), game.state_len()));
const read = name => state()[I[name]];
const checkpoint = () => Array.from(new Float64Array(game.memory.buffer, game.save_ptr(), game.save_len()));
const restore = values => {
  assert.equal(values.length, game.save_len());
  const pointer = game.save_ptr();
  new Float64Array(game.memory.buffer, pointer, game.save_len()).set(values);
  return game.restore_save();
};
const advance = (seconds, legacyFlag = 0) => {
  let left = seconds;
  while (left > 1e-8) {
    const dt = Math.min(1 / 120, left);
    game.step(dt, legacyFlag);
    left -= dt;
  }
};
// Economy checks use Easy's real stop/settle/top-up path. The full request
// range deliberately includes Hardcore orders that cannot avoid foam spills.
const perfectEasy = () => {
  const s = state();
  assert.equal(s[I.phase], 0);
  assert.equal(s[I.hardcore], 0, 'Controlled economy pours explicitly use Easy');
  let left = s[I.target] * s[I.capacity] / s[I.flowRate];
  while (left > 1e-8) {
    const held = Math.min(0.2, left);
    assert.equal(game.begin_pour(), 1);
    advance(held);
    game.end_pour();
    left -= held;
    if (left > 1e-8) advance(2.5);
  }
  assert.equal(game.serve(), 1);
  assert.equal(read('stars'), 5, 'Settling between Easy top-ups can reach the requested beverage volume');
  assert.equal(read('spill'), 0);
};
const finishDay = () => {
  while (read('phase') !== 2) {
    if (read('phase') === 0) {
      if (read('hardcore')) assert.equal(game.set_mode(0), 1);
      perfectEasy();
    }
    game.next_order();
  }
};

// Actual Wasm owns input state: the legacy frame argument cannot start a pour.
game.reset(456);
assert.equal(read('hardcore'), 1);
assert.equal(read('day'), 1);
assert.equal(read('cash'), 0);
advance(0.5, 1);
assert.equal(read('liquid'), 0);
assert.equal(read('attempted'), 0);
assert.equal(game.set_mode(2), 0);
assert.equal(game.next_day(9), 0);
checks.push('default Hardcore; legacy frame flag ignored; invalid actions rejected');

assert.equal(game.begin_pour(), 1);
assert.equal(game.begin_pour(), 0, 'Repeated keydown must not create another attempt');
assert.equal(game.set_mode(0), 0, 'Mode locks from the first press');
assert.equal(game.serve(), 0, 'Manual Serve cannot bypass Hardcore');
advance(1.75);
const beforeRelease = state();
game.end_pour();
assert.equal(read('phase'), 1);
assert.equal(read('stars'), 5);
assert.equal(read('payout'), 399);
const paid = state();
assert.equal(paid[I.foam], beforeRelease[I.foam], 'Release must not erase the visible foam');
assert.equal(paid[I.liquid], beforeRelease[I.liquid], 'Release must not instantly convert foam into liquid');
assert.ok(paid[I.foam] > 0);
assert.ok(paid[I.beverageMl] > paid[I.liquid], 'The receipt includes soda still trapped in the foam');
assert.equal(game.begin_pour(), 0);
assert.equal(game.serve(), 0);
game.end_pour(); game.step(0.2, 1);
const settling = state();
assert.ok(settling[I.foam] < paid[I.foam]);
assert.ok(settling[I.liquid] > paid[I.liquid]);
assert.ok(Math.abs(settling[I.beverageMl] - paid[I.beverageMl]) < 0.001);
for (let index = 0; index < paid.length; index++) {
  if (![I.liquid, I.foam, I.beverageMl].includes(index)) {
    assert.equal(settling[index], paid[index], `Paid field ${index} cannot change during settling`);
  }
}
checks.push('one release serves once; visible foam keeps settling; no top-up or repeated payout');

const savedPaid = checkpoint();
game.reset(999);
assert.equal(restore(savedPaid), 1);
assert.equal(read('cash'), paid[I.cash]);
assert.equal(read('foam'), 0, 'Saved paid reviews use the compatible settled representation');
assert.ok(Math.abs(read('liquid') - paid[I.beverageMl]) < 0.001);
assert.equal(game.begin_pour(), 0);
assert.equal(game.serve(), 0);
game.end_pour();
assert.equal(read('cash'), paid[I.cash]);
game.next_order();
assert.equal(read('order'), 2);
assert.equal(read('cash'), paid[I.cash]);
checks.push('paid review save roundtrip cannot replay cash');

const beforeInvalid = state();
for (const [index, value] of [[0, 100], [1, 99], [10, NaN], [21, -1], [34, 4], [79, 1]]) {
  const bad = checkpoint(); bad[index] = value;
  assert.equal(restore(bad), 0);
  assert.deepEqual(state(), beforeInvalid, 'Rejected restore must leave the career untouched');
}
checks.push('malformed save rejection is atomic');

// A mid-attempt checkpoint is the untouched current order, not a partial free replay.
assert.equal(game.begin_pour(), 1);
advance(0.6);
const savedActive = checkpoint();
const beforeActive = state();
assert.equal(restore(savedActive), 1);
assert.equal(read('phase'), 0);
assert.equal(read('liquid'), 0);
assert.equal(read('holding'), 0);
assert.equal(read('attempted'), 0);
assert.equal(read('cash'), beforeActive[I.cash]);
assert.equal(read('completed'), beforeActive[I.completed]);
checks.push('unfinished cup checkpoint preserves business without adding a reward');

game.reset(77);
assert.equal(game.set_mode(0), 1);
assert.equal(game.serve(), 0);
game.begin_pour(); advance(0.8); game.end_pour();
assert.equal(read('phase'), 0);
const foam = read('foam');
assert.ok(foam > 0);
advance(3);
assert.ok(read('foam') < foam * 0.01);
assert.equal(game.set_mode(1), 0);
game.begin_pour(); advance(0.95); game.end_pour();
assert.equal(read('phase'), 0);
assert.equal(game.serve(), 1);
assert.equal(read('stars'), 5);
assert.equal(read('payout'), 350);
assert.equal(read('streak'), 1);
assert.equal(restore(checkpoint()), 1);
assert.equal(read('hardcore'), 1);
assert.equal(read('streak'), 0);
assert.equal(read('bestStreak'), 1);
checks.push('Easy top-ups/manual Serve; conserved foam settlement; Hardcore restore default');

game.reset(881);
assert.equal(game.set_mode(0), 1);
for (let n = 1; n <= 8; n++) {
  perfectEasy();
  assert.equal(read('streak'), n);
  assert.equal(read('milestoneBonus'), ({3: 100, 5: 200, 8: 400})[n] || 0);
  assert.equal(read('payout'), read('basePayout') + read('comboBonus') + read('milestoneBonus') + read('perfectTip') + read('serviceTip'));
  game.next_order();
}
assert.ok(read('comboMultiplier') > 1.39);
game.begin_pour(); game.end_pour();
assert.equal(game.serve(), 1);
assert.equal(read('stars'), 1);
assert.equal(read('streak'), 0);
assert.equal(read('comboBonus'), 0);
assert.equal(read('bestStreak'), 8);
checks.push('variable streak bonuses and milestone rewards; poor service breaks combo');

// Matching holds have exactly the same foam physics in both modes. Hardcore
// commits on release; Easy can use the same settling time before a top-up.
game.reset(9);
game.begin_pour(); advance(1.5);
const hardHeld = state();
game.end_pour(); advance(0.6);
const hardSettled = state();
game.reset(9); game.set_mode(0);
game.begin_pour(); advance(1.5);
const easyHeld = state();
for (const name of ['soda', 'cup', 'target', 'capacity', 'liquid', 'foam', 'spill', 'elapsed', 'beverageMl']) {
  assert.equal(easyHeld[I[name]], hardHeld[I[name]], `Same hold must have the same ${name}`);
}
game.end_pour(); advance(0.6);
for (const name of ['liquid', 'foam', 'spill', 'beverageMl']) {
  assert.equal(read(name), hardSettled[I[name]], `Same post-release settling must have the same ${name}`);
}
game.serve();
assert.equal(read('accuracy'), hardSettled[I.accuracy]);
checks.push('Easy and Hardcore share pouring/settling physics and beverage accuracy');

let generatedOrders = 0, spillingOrders = 0, hardFoamy80 = null;
const combinations = new Set();
const targetsBySoda = Array.from({length: 4}, () => new Set());
for (let seed = 1; seed <= 32; seed++) {
  game.reset(seed);
  while (read('phase') !== 2) {
    const requested = state();
    combinations.add(`${read('soda')}:${read('cup')}`);
    targetsBySoda[read('soda')].add(Math.round(read('target') * 100));
    if (read('soda') === 3 && read('cup') === 0 && Math.round(read('target') * 100) === 80) {
      hardFoamy80 = checkpoint();
    }
    game.begin_pour();
    advance(requested[I.target] * requested[I.capacity] / requested[I.flowRate]);
    game.end_pour();
    if (read('spill') > 0) spillingOrders++;
    assert.ok(read('liquid') + read('foam') <= read('capacity') + 0.001);
    assert.ok(state().every(Number.isFinite));
    generatedOrders++;
    game.next_order();
  }
}
assert.equal(combinations.size, 16);
for (const targets of targetsBySoda) assert.deepEqual([...targets].sort((a, b) => a - b), [45, 55, 60, 65, 70, 75, 80]);
assert.ok(spillingOrders > 0, 'Full request generation must retain difficult single-pour foam overflows');
assert.ok(hardFoamy80, 'An unupgraded Classic Cola 80% request must remain in the order pool');
checks.push(`${generatedOrders} generated orders cover every soda/cup pair and the full target range, including foam-overflow challenges`);

const hardResultAt = seconds => {
  assert.equal(restore(hardFoamy80), 1);
  game.begin_pour(); advance(seconds); game.end_pour();
  return state();
};
const early = hardResultAt(1.8);
const nominal = hardResultAt(0.8 * 280 / 98);
const late = hardResultAt(2.5);
assert.equal(early[I.spill], 0);
assert.ok(early[I.beverageMl] < 0.8 * 280);
assert.ok(nominal[I.spill] > 50 && nominal[I.accuracy] < 60);
assert.ok(late[I.spill] > nominal[I.spill]);
assert.ok(late[I.accuracy] < nominal[I.accuracy]);
assert.notEqual(early[I.accuracy], nominal[I.accuracy], 'Stopping time must change the scored outcome');
assert.equal(restore(hardFoamy80), 1);
assert.equal(game.set_mode(0), 1);
perfectEasy();
assert.ok(read('accuracy') > nominal[I.accuracy] + 35, 'Easy settling and top-ups avoid this one-hold foam penalty');
checks.push('High-fizz stop timing changes underfill, overflow, and score; Easy top-ups can avoid the spill');

// This business grows entirely from earned income through the public API.
game.reset(314159);
assert.equal(game.buy(0), 0);
assert.equal(game.buy(99), 0);
finishDay();
assert.equal(game.next_day(271828), 1);
finishDay();
assert.ok(read('cash') >= 9000);
const earned = read('cash');
assert.equal(game.buy(4), 1);
assert.equal(game.buy(5), 1);
assert.equal(read('cash'), earned - 9000);
assert.equal(game.buy(4), 0);
assert.equal(game.buy(5), 0);
assert.equal(read('helperActive'), 0);
assert.equal(read('specialistActive'), 0);
const purchased = checkpoint();
assert.equal(restore(purchased), 1);
assert.equal(read('helperOwned'), 1);
assert.equal(read('specialistOwned'), 1);
assert.equal(game.next_day(161803), 1);
assert.equal(read('helperActive'), 1);
assert.equal(read('specialistActive'), 1);
assert.equal(read('wageReserve'), 400);
assert.equal(read('spendableCash'), read('cash') - 400);
const cashAtDayStart = read('cash');
const goal = read('orderGoal');
const price = read('seatingCost');
assert.equal(game.buy(1), 1);
assert.equal(read('orderGoal'), goal, 'Purchased seats add next-day customers');
assert.equal(read('cash'), cashAtDayStart - price);
assert.equal(game.set_mode(0), 1);
perfectEasy();
assert.equal(read('serviceTip'), 35);
game.next_order();
game.begin_pour();
assert.equal(game.buy(0), 0, 'Buying is locked during a cup attempt');
advance(0.2); game.end_pour(); game.serve();
finishDay();
assert.equal(read('wagesPaid'), 400);
assert.ok(read('staffSales') >= 320);
assert.equal(read('cash'), cashAtDayStart - price + read('shiftGross') - 400);
assert.equal(read('shiftNet'), read('shiftGross') - 400);
const closed = state();
game.next_order(); game.end_pour(); game.serve();
assert.deepEqual(state(), closed);
assert.equal(restore(checkpoint()), 1);
game.next_order();
assert.equal(read('cash'), closed[I.cash], 'Reloading closed day cannot repeat staff sales/wages');
assert.equal(game.next_day(141421), 1);
assert.equal(read('orderGoal'), 14);
assert.equal(read('day'), 4);
assert.equal(read('shiftGross'), 0);
assert.equal(read('cash'), closed[I.cash]);
checks.push('earned-cash purchases; staff join next day; real passive sales and payroll exactly once');
checks.push('seating grows tomorrow; cash/rating/upgrades carry across days');

console.log(JSON.stringify({result: 'PASS', wasmBytes: bytes.length, imports: 0, snapshotFields: game.state_len(), saveFields: game.save_len(), checks}, null, 2));
