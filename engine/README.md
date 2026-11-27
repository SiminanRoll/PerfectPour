# Perfect Pour engine — V1.02

The dependency-free Rust crate owns physics, input attempts, scoring, money, staff, progression, and save validation. The compiled Wasm has zero imports. JavaScript supplies input, rendering, audio, and persistence. See [the game README](../README.md) for controls, prices, and business rules; [contract.json](contract.json) is the authoritative index/export mapping.

## Build and tests

From the repository root:

```sh
rustup target add wasm32-unknown-unknown
python3 engine/build_engine.py
node tests/engine/wasm-smoke.mjs
node tests/engine/v102-balance.mjs
```

The build helper runs native Cargo tests, compiles an optimized `wasm32-unknown-unknown` module, and copies it to `engine/perfect_pour_engine.wasm`. It uses Cargo from PATH or the isolated project toolchain when available. `python3 scripts/build.py` embeds that module in `dist/index.html`.

The balance script tests actual compiled physics and synthetic careers. `--write` refreshes [balance-report.json](balance-report.json), including the engine hash and method. These checks do not simulate browser focus, rendering, mobile hardware, or actual human timing.

## Input and simulation

`reset(seed)` creates a Hardcore career with Classic pressure. Before an untouched cup, `set_pressure(0|1|2)` selects Gentle, Classic, or Rush. `begin_pour()` returns 1 only when a hold is accepted; `end_pour()` releases it and scores immediately in Hardcore. Easy uses `serve()` after releasing or topping up. `set_mode(0|1)` changes difficulty between attempts and clears the current streak.

Advance with `step(dt, 0)`. The legacy second argument is ignored; only accepted input changes pouring. Invalid time is ignored, each call is capped at 0.25 seconds, and physics uses substeps no larger than 1/240 second. Do not advance active service behind menus. End held input on cancellation or lost focus.

Phase 0 is active service; phase 1 is a committed cup; phase 2 is a closed day. Phase-1 steps only settle the existing liquid and foam. They cannot alter payment, reviews, patience, or staff work. `next_order()` advances phase 1 or closes the day; `next_day(seed)` requires phase 2. `buy(item)` validates items 0–8, affordability, prerequisites, and cup eligibility.

## Display and accounting

Read `state_len()` **98 `f32` values** from `state_ptr()`. Indices 0–64 remain stable. Important updated semantics:

| Index | Meaning |
| ---: | --- |
| 8 | Visible overflow, including gas; not ingredient waste |
| 19 | Actual selected-pressure flow |
| 49 | Cumulative staff gross, credited as staff orders complete |
| 55 | Committed receipt’s mode premium during review/close |
| 59 | Signed shift net after ingredients, cleanup, and wages; excludes purchases |
| 64 / 66 | Retained beverage / actual lost beverage in mL |
| 68 / 69 | Remaining patience fraction / total patience seconds |
| 73 / 77 | Current / cumulative foregone sale value, not a second cash debit |
| 74 | Player cup net; separate concurrent staff sales are excluded |
| 80–83 | Staff orders, capacity, queued demand, missed customers |

Patience starts at the first hold. Staff work is credited when a nonempty player cup commits, using up to ten seconds of that cup’s service time. A staff order takes `3.5 / (1 + 0.2 × active_training)` work seconds. Capacity and demand bound daily sales; closing never repeats them.

Use the `f64` save for exact money and RNG state. The display snapshot can round large integer amounts.

## Save compatibility

The writable save buffer contains **120 `f64` values**, version 102. For a legacy version-101 array, validate its 80-value length, zero-fill the new buffer, then copy it. Current saves require 120 values. Call `save_ptr()` once before writing: calling it again refreshes and overwrites the buffer.

```js
const pointer = game.save_ptr();
const destination = new Float64Array(game.memory.buffer, pointer, game.save_len());
destination.fill(0);
destination.set(validatedValues);
const accepted = game.restore_save() === 1;
```

Restoration validates atomically. V102 attempted Hardcore restores by committing the saved partial drink once; Easy restores stopped and can complete its existing cup before returning to Hardcore. Legacy101 keeps its untouched-checkpoint behavior. Paid saves retain their settled beverage, earned money, and completed phase. Ordinary restored saves default to Hardcore; separate mode records survive. Reserved indices 83–119 must be zero.

This local format prevents accidental duplicate payments and malformed imports. It is not server authentication or anti-cheat protection. Genuine V101 fixtures in `fixtures/` cover untouched, paid, and staffed closed-day migration.
