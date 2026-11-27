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
assert.equal(game.state_len(), 64);
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
const perfect = () => {
  const s = state();
  assert.equal(s[I.phase], 0);
  assert.equal(game.begin_pour(), 1);
  advance(s[I.target] * s[I.capacity] / s[I.flowRate]);
  game.end_pour();
  if (!s[I.hardcore]) assert.equal(game.serve(), 1);
  assert.equal(read('stars'), 5, `Unreachable order ${s[I.order]} / soda ${s[I.soda]} / cup ${s[I.cup]} / target ${s[I.target]}`);
  assert.equal(read('spill'), 0, 'Requested amount must be reachable without overflow');
};
const finishDay = () => {
  while (read('phase') !== 2) {
    if (read('phase') === 0) perfect();
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
game.end_pour();
assert.equal(read('phase'), 1);
assert.equal(read('stars'), 5);
assert.equal(read('payout'), 399);
const paid = state();
assert.equal(game.begin_pour(), 0);
assert.equal(game.serve(), 0);
game.end_pour(); game.step(0.2, 1);
assert.deepEqual(state(), paid);
checks.push('one release serves automatically; one review; one payout; no top-up');

const savedPaid = checkpoint();
game.reset(999);
assert.equal(restore(savedPaid), 1);
assert.equal(read('cash'), paid[I.cash]);
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
for (let n = 1; n <= 8; n++) {
  perfect();
  assert.equal(read('streak'), n);
  assert.equal(read('milestoneBonus'), ({3: 100, 5: 200, 8: 400})[n] || 0);
  assert.equal(read('payout'), read('basePayout') + read('comboBonus') + read('milestoneBonus') + read('perfectTip') + read('serviceTip'));
  game.next_order();
}
assert.ok(read('comboMultiplier') > 1.39);
game.begin_pour(); game.end_pour();
assert.equal(read('stars'), 1);
assert.equal(read('streak'), 0);
assert.equal(read('comboBonus'), 0);
assert.equal(read('bestStreak'), 8);
checks.push('variable streak bonuses and milestone rewards; poor service breaks combo');

let fairOrders = 0;
const combinations = new Set();
for (let seed = 1; seed <= 32; seed++) {
  game.reset(seed);
  while (read('phase') !== 2) {
    combinations.add(`${read('soda')}:${read('cup')}`);
    perfect();
    assert.ok(read('accuracy') > 99.99);
    assert.ok(state().every(Number.isFinite));
    fairOrders++;
    game.next_order();
  }
}
assert.equal(combinations.size, 16);
checks.push(`${fairOrders} no-spill one-hold orders cover all 16 soda/cup pairs`);

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
perfect();
assert.equal(read('serviceTip'), 35);
game.next_order();
game.begin_pour();
assert.equal(game.buy(0), 0, 'Buying is locked during a cup attempt');
const needed = read('target') * read('capacity') / read('flowRate');
advance(needed); game.end_pour();
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
