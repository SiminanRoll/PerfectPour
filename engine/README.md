# Perfect Pour engine — V1.03

The dependency-free Rust crate owns recipe preparation, physics, input attempts, scoring, money, staff, progression, and save validation. The compiled Wasm has zero imports. JavaScript supplies input, rendering, audio, and persistence. [contract.json](contract.json) is the authoritative index/export mapping; [the game README](../README.md) describes the player-facing controls.

## Build and tests

From the repository root:

```sh
rustup target add wasm32-unknown-unknown
python3 engine/build_engine.py
node tests/engine/wasm-smoke.mjs
node tests/engine/v103-recipes.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/engine/v102-balance.mjs
```

The build helper runs native Cargo tests, compiles an optimized `wasm32-unknown-unknown` module, and copies it to `engine/perfect_pour_engine.wasm`. It uses Cargo from PATH or the isolated project toolchain when available. `python3 scripts/build.py` embeds that module in `dist/index.html`.

The retained `v101-business-acceptance.mjs` and `v102-balance.mjs` filenames now check the current V1.03 engine. Balance `--write` refreshes [balance-report.json](balance-report.json), including the engine hash and method. The 6,048 catalog fixtures exercise four bases, four cups, seven targets, three tap levels, three pressures, three blends, and two modes. Career simulations choose correct recipes instantly, then apply seeded timing errors. They are sensitivity scenarios, not measured player performance. These checks do not simulate browser focus, rendering, mobile hardware, or audio.

## Recipe preparation

`reset(seed)` creates a Hardcore career with Classic pressure. The first order is Orange with one cherry. The selected base starts at `4`, meaning unchosen; `begin_pour()` refuses until the player chooses a base from `0..3`.

Call `set_recipe(soda, cherries, lime, syrup, blend)` before the first hold. Changes are atomic and validated:

| Ingredient | Values | Availability |
| --- | --- | --- |
| Base | `0..3`; `4` clears selection | Existing four soda bases |
| Cherries | `0..2` | Starter jar |
| Lime | `0..1` | Citrus tray, item 9, $10 |
| Cherry syrup | `0..2` pumps | Syrup rack, item 10, $18 |
| Blend | `0` light/extra water, `1` regular, `2` bold | Nonregular blends require mixing dispenser, item 11, $26 |

The setter accepts base `4` so garnish can be prepared before base selection. The first actual change starts preparation time. Repeating the unchanged selection does not start the clock. Recipe edits lock on the first accepted hold in both modes. Easy can subsequently add liquid, but cannot replace a poured recipe.

Each later order consumes one deterministic recipe RNG value regardless of pressure or mode. Roughly one in four is plain. Requests use only owned ingredients, ramp from one simple addition to at most two add-in types, and introduce blends after the first few customers. Buying a station never rewrites the current request. Selected extras can exceed the requested types; they still cost money and lower recipe accuracy.

The ordered recipe sets the quoted premium: 40 cents per cherry, 35 cents for lime, 50 cents per syrup pump, and 25 cents for a nonregular blend. Selected add-ins cost 8, 10, and 12 cents respectively, charged at commitment rather than per edit. The selected base controls physical flow and liquid ingredient cost. Blend gas multipliers are 1.08 / 1 / 0.92 and liquid ingredient cost multipliers are 0.9 / 1 / 1.15. These are game tuning values. Garnishes do not displace liquid or secretly change the fill target.

## Input and simulation

`set_pressure(0|1|2)` selects Gentle, Classic, or Rush before the first hold. `begin_pour()` returns 1 only when input is accepted. `end_pour()` releases and scores immediately in Hardcore. Easy uses `serve()` after releasing or topping up. `set_mode(0|1)` changes difficulty between attempts and clears the current streak.

Advance with `step(dt, 0)`. The legacy second argument is ignored. Invalid time is ignored, each call is capped at 0.25 seconds, and substeps are no larger than 1/240 second. Do not advance active service behind menus. End held input on cancellation or lost focus.

Phase 0 includes preparation and active service; phase 1 is a committed cup; phase 2 is a closed day. Phase-1 steps only settle existing liquid and foam. They cannot alter payment, reviews, patience, or staff work. `next_order()` advances phase 1 or closes the day; `next_day(seed)` requires phase 2. `buy(item)` validates items 0–11, affordability, prerequisites, and cup eligibility.

Patience starts at the first changed recipe selection or first hold. New requests allow two seconds for base selection plus 1.5 seconds per requested garnish/syrup action or nonregular blend. Reading an untouched ticket is free; the adapter also excludes menus and paid settling. Staff work still uses at most ten seconds per nonempty committed player cup, bounded by queue demand and capacity.

## Scores and accounting

Read **124 `f32` values** from `state_ptr()`. Indices 0–97 retain their locations. The contract names recipe fields 98–123, including both ordered and selected recipes, station ownership/costs, preparation status, grade, and mistake mask.

`accuracy` is still fill accuracy only. Recipe accuracy starts at 100 and deducts 60 for a wrong base, 15 per cherry difference, 20 for lime, 20 per syrup difference, and 20 per blend step, clamped to zero. Overall stars are the lower of the fill grade and recipe grade: exact recipe = 5, 80+ = 4, 60+ = 3, 40+ = 2, lower = 1. Therefore a perfect fill cannot hide the wrong drink. `fillStars` lets the UI format fill accuracy independently of the customer’s overall review.

`recipeMistakes` uses bits: base 1, cherries 2, lime 4, syrup 8, blend 16. These provide specific visual feedback after commitment.

Operating costs never create debt or spend reserved payroll. Current and cumulative refund values represent foregone sale value, not another cash debit. `lastNet` is the player cup’s actual net; simultaneous staff sales are separate. Shift net includes ingredients, cleanup, and wages but excludes capital purchases. Use the `f64` save for exact money and RNG; snapshots may round large integers.

## Save compatibility

The writable save buffer contains **120 `f64` values**, version **103**. Version 101 uses its original 80 values, zero-padded to 120. Version 102 uses 120 values. Call `save_ptr()` once before writing, since each call refreshes the buffer from the live game.

```js
const pointer = game.save_ptr();
const destination = new Float64Array(game.memory.buffer, pointer, game.save_len());
destination.fill(0);
destination.set(validatedValues);
const accepted = game.restore_save() === 1;
```

Restoration validates atomically. V101/V102 current orders become plain recipes with the original base selected and no retroactive garnish costs. Their existing scores and payments survive; custom requests begin with the next customer. Genuine V102 fixtures include an exact restore snapshot captured from the shipped old engine, allowing all original 98 display fields to be checked independently.

Unpoured V103 preparation preserves its selections and elapsed time without consuming a pour. Interrupted Hardcore attempts commit once on restore. Interrupted Easy attempts resume stopped and may finish their existing cup before returning to Hardcore. Paid saves never replay sales. Ordinary restored saves default to Hardcore; separate records survive. Recipe data uses indices 83–96; reserved 97–119 must remain zero.

This local save format prevents accidental duplicate payments and malformed imports. It is not server authentication or anti-cheat protection.
