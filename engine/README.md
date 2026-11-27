# Perfect Pour Rust engine · V1.01

The dependency-free Rust engine owns soda physics, input attempts, scoring,
reviews, combos, purchases, staff, cash, and day progression. The browser draws
the storefront and cup, handles input/audio, and stores the engine's checkpoint.
The compiled WebAssembly has **zero imports** and is embedded in the standalone
HTML. Playing requires no server, network, Rust installation, or JavaScript
replacement for the gameplay rules.

`contract.json` is the machine-readable export, snapshot, checkpoint, and upgrade
contract. All prices and money values below are **integer cents**.

## Build and verify

From the project root:

```sh
# One-time setup for an ordinary Rust installation:
rustup target add wasm32-unknown-unknown

python3 engine/build_engine.py
node tests/engine/wasm-smoke.mjs
```

The helper also supports the project's isolated `.toolchain` when Cargo is not
on PATH. It runs native tests, builds an optimized module for
`wasm32-unknown-unknown`, and copies it to `engine/perfect_pour_engine.wasm`.
The toolchain and Cargo target directory are development tools, not game assets.

V1.01 passes 28 native tests and the actual-Wasm Node smoke suite. The native
fairness test plays 4,608 generated one-hold orders across 64 seeds, two days,
and all three tap levels; each achieves greater than 99.99 accuracy with zero
overflow. The Node test additionally plays 384 unupgraded orders spanning all
16 soda/cup pairs. Economy checks spend earned money, activate staff on the
following day, and verify cash, passive sales, payroll, persistence, and
protection against repeated payouts.

## Browser integration

```js
const {instance} = await WebAssembly.instantiate(wasmBytes, {});
const game = instance.exports;
game.reset(12345); // New career, day one, Hardcore mode.

// On the first physical press; do not retrigger for key repeat.
const accepted = game.begin_pour();

// While the game is visible and running:
game.step(1 / 60, 0);

// On release (including pointer cancellation, lost focus, or page hiding):
game.end_pour(); // Automatically scores and serves in Hardcore.

const snapshot = () => Array.from(new Float32Array(
  game.memory.buffer, game.state_ptr(), game.state_len()
));
```

The second `step` argument is retained for ABI familiarity but **ignored**.
Only `begin_pour` and `end_pour` control pouring. A malicious or stale JavaScript
frame flag therefore cannot bypass the engine's single-attempt rule. The
engine also rejects manual Serve in Hardcore, repeated presses while holding,
second attempts after a review, and duplicate payment attempts.

Handle keyboard and pointer input as a single held action. Ignore key repeat,
release the engine when focus is lost, and avoid leaving a held pour running
behind a help dialog or hidden tab. Do not advance the simulation while paused.
A valid frame advances at most 0.25 seconds using substeps of at most 1/240
second. Invalid, negative, and non-finite time values are ignored.

| Export | Behavior |
|---|---|
| `reset(seed: u32)` | Creates a new career: cash 0, rating 3.5, day 1, Hardcore. |
| `begin_pour() -> u32` | Returns 1 if a new hold is accepted, otherwise 0. |
| `end_pour()` | Ends an active hold. In Hardcore, immediately serves and scores. |
| `step(dt: f32, ignored: u32)` | Advances physics using the engine's held state. |
| `serve() -> u32` | Easy only, after at least one press; returns 1 once. |
| `set_mode(hardcore: u32) -> u32` | Accepts 0 or 1. Allowed on an untouched cup, a review, or a closed day. Returns 0 after a cup has been attempted. A real mode change clears the current streak. |
| `next_order()` | Advances a paid review to the next order, or closes the day after its final review. Calls outside a review do nothing. |
| `next_day(seed: u32) -> u32` | Opens the next day only after day close. Preserves the business and current chosen mode. |
| `buy(item: u32) -> u32` | Purchases an available level once if eligible and affordable; otherwise returns 0. |
| `state_ptr()`, `state_len()` | Pointer to 64 `f32` snapshot fields and their count. |
| `save_ptr()`, `save_len()` | Refreshes and returns a writable checkpoint buffer of 80 `f64` values and its count. |
| `restore_save() -> u32` | Validates the written checkpoint, then replaces the game atomically. Returns 0 without changing the game on failure. |
| `memory` | Exported WebAssembly memory containing both buffers. |

### Modes

**Hardcore** is the new-career and reload default. One press starts the only
attempt. Releasing commits it, including a tap so short that no frame advanced.
The current cup cannot be resumed, topped up, manually served, or switched to
Easy after the first press. The payout includes a 15% base premium.

**Easy** allows repeated holds and time for the foam to settle. Releasing stops
the tap without serving; the player chooses Serve. Switching mode is allowed
between customers or before touching the current cup, and clears the current
combo to prevent carrying Easy-earned rewards into Hardcore. Best streaks and
cash remain intact.

## Snapshot: 64 `f32` values

The first 20 fields retain the V1 layout. Field 10 is this day's gross receipts;
field 20 is the persistent, spendable business balance before wage reservation.
Use field 25 for the day's customer goal; it can be 12, 14, or 16.

| Index | Field | Meaning |
|---:|---|---|
| 0 | phase | 0 active order, 1 paid review, 2 day complete |
| 1 | order | Current customer number, starting at 1 |
| 2 | soda | 0 Sunset Orange, 1 Cherry Pop, 2 Lime Lift, 3 Midnight Cola |
| 3 | cup | Cup index 0–3 |
| 4 | target | Requested settled beverage fraction |
| 5 | capacity | Cup capacity in ml: 280, 360, 460, 330 |
| 6 | liquid | Free liquid volume in ml |
| 7 | foam | Visible foam volume in ml, including trapped beverage |
| 8 | spill | Cumulative visible overflow in ml, including spilled foam |
| 9 | rating | Shop review average, 1–5 |
| 10 | shiftGross | Today's gross receipts, including tips and staff sales |
| 11 | accuracy | Most recent customer's accuracy, 0–100 |
| 12 | stars | Most recent review, 1–5; 0 before the first review |
| 13 | payout | Most recent customer's full payout |
| 14 | reputationMultiplier | Price multiplier locked on arrival |
| 15 | elapsed | Current order time in seconds; no waiting penalty |
| 16 | completed | Player-served customers completed today |
| 17 | averageAccuracy | Average accuracy today |
| 18 | perfectPours | Five-star pours today |
| 19 | flowRate | Current soda flow rate in ml/second |
| 20 | cash | Business balance after purchases and already-paid wages |
| 21 | hardcore | 1 Hardcore, 0 Easy |
| 22 | attempted | Whether this cup has had its first press |
| 23 | holding | Whether the tap is currently held |
| 24 | day | Career day, starting at 1 |
| 25 | orderGoal | Today's player-customer goal, fixed when the day opens |
| 26 | streak | Current consecutive 4/5-star pours |
| 27 | bestStreak | Career best streak |
| 28 | comboMultiplier | Multiplier associated with the current streak |
| 29 | comboBonus | Most recent combo bonus |
| 30 | milestoneBonus | Most recent streak milestone reward |
| 31 | perfectTip | Most recent five-star tip |
| 32 | serviceTip | Most recent combined awning/helper tip |
| 33 | lifetimeGross | Career receipts before purchases/wages |
| 34–39 | upgrade levels | Sign, seating, awning, tap, helper, specialist |
| 40–45 | next upgrade costs | Same item order; 0 means maximum already owned |
| 46 | mayBuyNow | 1 if the current phase/cup allows purchases; affordability is separate |
| 47 | spendableCash | Cash minus committed wages still due |
| 48 | wageReserve | Wages committed for active staff today, 0 after day close |
| 49 | staffSales | Passive specialist sales credited at this day's close |
| 50 | wagesPaid | Wages charged at this day's close |
| 51 | helperActive | Whether the hired helper is working today |
| 52 | specialistActive | Whether the hired specialist is working today |
| 53 | lifetimeCustomers | Career customer count, including passive staff customers |
| 54 | basePayout | Last payment before combo/tips; includes mode/sign/reputation |
| 55 | modeMultiplier | 1.15 Hardcore, 1 Easy |
| 56 | signMultiplier | Sign price multiplier locked for the current order |
| 57 | foamMultiplier | Gas-volume factor from tap equipment: 1, 0.8, 0.6 |
| 58 | lastWasGood | Last customer earned at least 4 stars |
| 59 | shiftNet | Today's gross receipts minus today's paid wages; excludes capital purchases |
| 60 | lifetimePerfect | Career five-star player pours |
| 61 | bestShiftGross | Best completed day's gross receipts |
| 62 | businessLevel | 1 plus all owned upgrade levels |
| 63 | previousRating | Shop rating immediately before the last review |

The `f32` snapshot is for display. Read/write the `f64` checkpoint for exact
money and RNG preservation. Do not persist rounded display values.

## Physics, fair requests, and scoring

Each soda traps part of its beverage in foam. Gas makes that foam occupy more
volume than the trapped beverage alone. Settling returns the beverage to the
free liquid; overflow can discard foam and its entrained beverage. At scoring,
remaining foam settles immediately, so the score measures **free liquid plus
beverage trapped in foam**, never the apparent height of gas bubbles.

The side meter should show free liquid and foam as distinct stacked portions.
The target is the final beverage amount. Foam visibly occupies headroom and can
cause overflow; it is not all liquid. Tap equipment reduces the gas component
without deleting beverage.

Each generated request is selected from 45%, 55%, 60%, 65%, 70%, 75%, and 80%.
Before choosing a request, the engine simulates the exact soda/cup/tap combination
until its first overflow, then keeps only targets at least 1.5 percentage
points below the last safe settled volume. Both modes use this same selection,
so switching mode never changes a request and every request is feasible with
one uninterrupted hold. The first career order remains the gentle 65% orange
soda tutorial.

Accuracy is clamped to 0–100:

```text
100 - 350 × abs(settled_fraction - target_fraction)
    - 200 × visible_spill_ml / capacity_ml
```

The 5/4/3/2-star thresholds are 96/88/72/50; lower accuracy gets one star.
The review average becomes `0.68 × old_rating + 0.32 × stars`. Reputation locks
on arrival as `0.6 + 0.2 × rating`, so a review changes subsequent prices.

Base payout, rounded to cents:

```text
250 × locked_reputation × locked_sign_multiplier
    × mode_multiplier × (0.4 + 0.006 × accuracy)
```

Four- and five-star pours increase the current streak. Lower scores break it.
The current successful pour receives the new streak's multiplier:

| Streak | Base multiplier | Additional milestone tip |
|---:|---:|---:|
| 0–1 | ×1.00 | — |
| 2 | ×1.10 | — |
| 3–4 | ×1.20 | +100c at exactly 3 |
| 5–6 | ×1.30 | +200c at exactly 5 |
| 7+ | ×1.40 | +400c at exactly 8 |

Every five-star pour adds a 25c perfect tip. Awning and helper benefits add
service tips independently. The full payout is base + combo bonus + milestone
reward + perfect tip + service tips; its components are exposed for the review
panel. A day boundary preserves the current streak; changing mode clears it.

## Business upgrades and staff

| Item | Upgrade | Level costs | Effect |
|---:|---|---|---|
| 0 | Store sign | 1200 / 2200 / 3600c | +5% base price per level |
| 1 | Patio seating | 1800 / 3000c | +2 player customers per level, starting next day |
| 2 | Awning | 1600 / 2800c | +15c per level on 4/5-star pours |
| 3 | Tap equipment | 2400 / 4200c | 20% less foam gas per level, conserving beverage |
| 4 | Counter helper | 3500c once | +35c on 3+ stars; 150c wage per active day |
| 5 | Soda specialist | 5500c once | Two passive staff sales per active day; 250c wage |

Purchases are allowed before touching an active cup, on a customer review, and
after day close. The engine checks eligibility, level limits, and affordability.
Purchases deduct actual cash immediately and never alter a completed payout.
New sign/awning benefits can apply to an untouched current order; completed
orders retain their locked values.

Seats change the following day's fixed goal, starting from 12. A newly hired
employee also starts the following day. Owned levels and active-today flags are
separate so the UI can show who is joining tomorrow. Buying both staff reserves
400c on subsequent active days; purchase affordability uses cash after this
reservation.

When the final customer review advances to day close, the specialist credits:

```text
round(2 × 200 × (0.6 + 0.2 × current_rating) × (1 + 0.05 × sign_level))
```

These are two real passive sales, included in gross earnings and lifetime
customers. They do not create player reviews or extend the pouring streak.
The engine then deducts staff wages once, records the day's best gross, and
marks the day closed. Repeated calls and restored closed-day checkpoints
cannot repeat either sales or salaries. Cash cannot go below zero; purchases
reserve wages, and the final wage deduction is additionally capped at cash.

Opening the next day preserves cash, rating, upgrades, staff ownership, best
records, and streak. It clears today's statistics, activates eligible staff,
sets the new customer goal, and generates the first order.

## Checkpoints and local persistence

The engine does not use browser storage. The frontend stores the entire 80-value
array in local storage after a review, purchase, mode change, next order,
new day, or reset. A checkpoint is deliberately separate from the display
snapshot and retains exact integers via `f64`.

```js
function exportCheckpoint() {
  // save_ptr refreshes the buffer. Copy immediately; the returned view is live.
  return Array.from(new Float64Array(
    game.memory.buffer, game.save_ptr(), game.save_len()
  ));
}

function importCheckpoint(values) {
  if (!Array.isArray(values) || values.length !== game.save_len() ||
      !values.every(value => typeof value === 'number' && Number.isFinite(value))) {
    return false;
  }
  const pointer = game.save_ptr();
  new Float64Array(game.memory.buffer, pointer, game.save_len()).set(values);
  // Do not call save_ptr again between writing and restoring: it refreshes.
  return game.restore_save() === 1;
}
```

**Unfinished cup:** checkpoint as an untouched copy of the same order. No partial
liquid, attempt state, or extra payout is saved. This makes refresh/closing safe
without leaving a stuck held tap.

**Paid review:** keep the paid phase, completed count, money, and review. The
engine cannot serve it again. Advancing moves to the next customer once.

**Closed day:** keep staff sales and wages already processed. Opening the next
day is the only progress action.

Restoring always selects Hardcore. If the save was from Easy, its current
streak clears while cash and best streak remain. New days preserve the mode
the player selected during the current session.

Validation checks version 101, finite values, integer ranges, upgrade maxima,
phase/count consistency, money bounds, staff ownership/activation, and reserved
zero fields. Invalid data leaves the current game untouched. This is a robust
local-save format, not anti-cheat encryption; an offline game does not claim
protection against deliberate editing of one's own save file.

### Checkpoint field layout: 80 `f64` values

| Index | Field |
|---:|---|
| 0 | Format version: 101 |
| 1–5 | Phase, order, soda, cup, target |
| 6 | Settled liquid for a paid/closed order; 0 for active checkpoint |
| 7–8 | Reserved foam/entrained-volume slots, always 0 |
| 9–16 | Spill, rating, shift gross, accuracy, stars, payout, reputation multiplier, elapsed |
| 17–21 | Completed, accuracy sum, perfect pours, RNG, cash |
| 22–24 | Saved Hardcore flag, attempted flag, reserved holding slot (0) |
| 25–28 | Day, order goal, current streak, best streak |
| 29–33 | Combo bonus, milestone bonus, perfect tip, service tip, lifetime gross |
| 34–39 | Owned sign, seating, awning, tap, helper, specialist levels |
| 40–44 | Active helper, active specialist, staff sales, wages paid, day closed |
| 45–50 | Lifetime customers, last base payout, lifetime perfect, best shift gross, previous rating, last-was-good flag |
| 51–52 | Sign and awning levels locked for this order |
| 53–79 | Reserved, must be 0 |

The exact name-to-index mapping also ships in `contract.json`. Consumers should
validate array length and numeric element types before writing Wasm memory.
