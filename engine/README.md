# Perfect Pour engine — V1.06

The dependency-free Rust crate owns recipe preparation, single- and two-soda physics, input attempts, scoring, money, staff, progression, and save validation. The compiled Wasm has zero imports. JavaScript supplies input, rendering, audio, and persistence. [contract.json](contract.json) is the authoritative index/export mapping; [the game README](../README.md) describes the player-facing controls.

## Build and tests

From the repository root:

```sh
rustup target add wasm32-unknown-unknown
python3 engine/build_engine.py
node tests/engine/wasm-smoke.mjs
node tests/engine/v103-recipes.mjs
node tests/engine/v104-mixtures.mjs
node tests/engine/v106-ice.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/engine/v102-balance.mjs
```

The build helper runs native Cargo tests, compiles an optimized `wasm32-unknown-unknown` module, and copies it to `engine/perfect_pour_engine.wasm`. It uses Cargo from PATH or the isolated project toolchain at `engine/.toolchain` when available, configuring that toolchain's Cargo/Rustup directories itself. A missing `cargo` command on PATH does not imply that this fallback is unavailable. The current workspace's existing isolated Rust 1.100.0 toolchain includes the Wasm target; V1.06 was built with it and all **58 native tests passed**, including 448 iced catalog cases. `python3 scripts/build.py` embeds the compiled module in `dist/index.html`.

The retained `v101-business-acceptance.mjs`, `v102-balance.mjs`, and `v103-recipes.mjs` filenames check the current engine. Balance `--write` refreshes [balance-report.json](balance-report.json), including the engine hash and method. The existing 6,048 single-soda catalog/mode fixtures exercise four bases, four cups, seven targets, three tap levels, three pressures, three blends, and two modes. Native mixture coverage adds **3,024 Gentle cases**: twelve ordered base pairs, three proportions, four cups, seven targets, and three tap levels. Each retains a five-star fill and mix solution with visible foam. Career simulations use synthetic timing errors; they are sensitivity scenarios, not measured player performance. These checks do not simulate browser focus, rendering, mobile hardware, or audio.

## Recipe preparation

`reset(seed)` creates a Hardcore career with Classic pressure. The first order is Orange with one cherry. A single-soda order starts with selected base `4`, meaning unchosen; `begin_pour()` refuses until the player chooses a base from `0..3`. A generated mixed order preselects its first requested base without starting preparation time, and routes the second soda automatically after the first part.

Call `set_recipe(soda, cherries, lime, syrup, blend)` before the first hold. Changes are atomic and validated:

| Ingredient | Values | Availability |
| --- | --- | --- |
| Base | `0..3`; `4` clears selection | Existing four soda bases |
| Cherries | `0..2` | Starter jar |
| Lime | `0..1` | Citrus tray, item 9, $10 |
| Cherry syrup | `0..2` pumps | Syrup rack, item 10, $18 |
| Blend | `0` light/extra water, `1` regular, `2` bold | Nonregular blends require mixing dispenser, item 11, $26 |

The setter accepts base `4` so garnish can be prepared before base selection. The first actual change starts preparation time. Repeating the unchanged selection does not start the clock. Recipe edits lock on the first accepted hold in both modes. Easy can subsequently add liquid, but cannot replace a poured recipe.

Each later order consumes one deterministic recipe RNG value regardless of pressure or mode. Single-soda requests retain plain breaks, use only owned ingredients, ramp from one simple addition to at most two add-in types, and introduce water blends after the first few customers. Buying a station never rewrites the current request. Selected extras can exceed the requested types; they still cost money and lower recipe accuracy.

Customer **six** is the first mixed order and requests half of each soda. Subsequent orders mix roughly one time in three. After twelve completed manual customers, mixtures may request first shares of **one quarter, one half, or three quarters**. The ordered bases are distinct. Mixed requests contain at most one simple garnish/syrup addition and request the regular water blend. They require no new station or upgrade.

The ordered recipe sets the quoted premium: 40 cents per cherry, 35 cents for lime, 50 cents per syrup pump, 25 cents for a nonregular water blend, and **60 cents for a two-soda mix**. A mix's base price weights the two requested soda prices by their requested shares. Selected add-ins cost 8, 10, and 12 cents respectively, charged once at final service. Each soda's actual poured volume sets its liquid ingredient cost, including wasted beverage; the 15-cent cup/supply charge also occurs only once. Water-blend gas multipliers remain 1.08 / 1 / 0.92 and liquid cost multipliers remain 0.9 / 1 / 1.15. These are game tuning values. Garnishes do not displace liquid or secretly change the fill target.

## Optional ice

`set_ice(0|1|2)` chooses zero, one or two free scoops before the first accepted hold. A scoop renders three cubes. Ice is an optional player choice, not a new requested ingredient: it does not affect recipe accuracy, price, ingredient costs, capacity or target geometry. There is no melting, temperature or stock-management system in this release. The first changed ice choice starts the existing preparation clock; a repeated unchanged selection does not. Ice locks for the complete cup in both modes, including between mixed-soda parts. New orders and legacy imports default to zero ice.

Ice multiplies actual foam **gas expansion** by `1 + scoops * (0.08 + 0.12 / (1 + pouredMl / 90))`. The initial 1.2/1.4 response declines as poured volume wets the cubes, while remaining visibly fizzy. The same actual liquid and entrained beverage enter the cup; only gas expansion changes. No-ice follows the released calculations exactly. Cumulative poured volume makes the response deterministic across pauses, top-ups and saved-game restoration.

V106 stores the selected scoop count at formerly reserved save index 105. Save length stays 120 doubles; V101–104 imports are accepted with their original reserved ranges intact. V106 exports need V1.06 to resume them. The browser adapter migrates existing production saves into its V106 key while retaining the original V104–V101 keys unchanged.

## Input and simulation

`set_pressure(0|1|2)` selects Gentle, Classic, or Rush before the first hold. `begin_pour()` returns 1 only when input is accepted. Single-soda `end_pour()` still releases and scores immediately in Hardcore. Easy uses `serve()` after releasing or topping up. `set_mode(0|1)` changes difficulty between cups and clears the current streak; mode changes remain allowed before a cup's first attempt.

Mixed drinks use the same exports. Hardcore permits **one hold per soda**: the first `end_pour()` moves to part 1 without scoring, charging, or paying; the final release serves. Easy can top up the current part and uses `serve()` to advance it explicitly, with final `serve()` committing the customer. Every part needs an attempted hold, even if that hold is zero duration. A repeated release or serve cannot skip an untouched second part. `attempted` locks ingredients, pressure, difficulty, and purchases for the entire cup; `partAttempted` independently tracks the active soda's hold budget.

`activeTarget` is cumulative cup fill: `target * firstShare` for the first soda and `target` for the second. `selectedSoda` remains the first chosen base; `activeSoda` identifies the flowing tap. Each soda keeps its own foam and entrained-beverage pool and its own settling rate. Overflow removes proportional shares from those pools, then from liquid. The mix score therefore uses the first soda actually retained in the glass, rather than its volume at the instant of switching taps. Single-soda physics retain their original calculation path.

Advance with `step(dt, 0)`. The legacy second argument is ignored. Invalid time is ignored, each call is capped at 0.25 seconds, and substeps are no larger than 1/240 second. Do not advance active service behind menus. End held input on cancellation or lost focus.

Phase 0 includes preparation and active service; phase 1 is a committed cup; phase 2 is a closed day. Phase-1 steps only settle existing liquid and foam. They cannot alter payment, reviews, patience, or staff work. `next_order()` advances phase 1 or closes the day; `next_day(seed)` requires phase 2. `buy(item)` validates items 0–11, affordability, prerequisites, and cup eligibility.

Patience starts at the first changed recipe selection or first hold. New requests allow two seconds for base selection plus 1.5 seconds per requested garnish/syrup action or nonregular blend. Mixed orders add two seconds for their extra part. Reading an untouched ticket is free, including its preselected mixed base; the adapter also excludes menus and paid settling. Staff work still uses at most ten seconds per nonempty committed player cup, bounded by queue demand and capacity. The first part alone grants no staff work or income.

## Scores and accounting

Read **136 `f32` values** from `state_ptr()`. Indices 0–123 retain their locations and meanings. The appended fields describe the two-part pour:

| Index | Field | Meaning |
| --- | --- | --- |
| 124 | `orderedSecondSoda` | `0..3` for a mix; `4` for a single soda |
| 125 | `firstShare` | `0.25`, `0.5`, or `0.75`; `1` for a single soda |
| 126 | `pourPart` | `0` first; `1` second |
| 127 | `partAttempted` | The active part has consumed its first hold |
| 128 | `activeSoda` | Base for the current tap and physics |
| 129 | `activeTarget` | Current cumulative target as a fraction of cup capacity |
| 130 | `firstBeverageMl` | First soda retained, including beverage inside foam; frozen after scoring |
| 131 | `mixAccuracy` | Proportion score; `100` for a single soda |
| 132 | `mixStars` | Mix grade using the fill-grade thresholds |
| 133 | `isMix` | Whether this order has two sodas |
| 134 | `selectedIce` | Optional scoops: 0, 1, 2, rendered as 0, 3, 6 cubes |
| 135 | `iceFizzMultiplier` | Current ice gas-expansion multiplier, initially 1, 1.2, 1.4 |

`accuracy` is still fill accuracy only. Recipe accuracy starts at 100 and deducts 60 for a wrong first base, 15 per cherry difference, 20 for lime, 20 per syrup difference, and 20 per water-blend step, clamped to zero. Recipe grade is exact recipe = 5, 80+ = 4, 60+ = 3, 40+ = 2, lower = 1.

For a mixed drink, `mixAccuracy = clamp(100 - 200 * abs(firstBeverageMl / beverageMl - firstShare), 0, 100)`. Empty mixed cups receive zero mix accuracy. Mix grade uses the existing fill thresholds: 96, 88, 72, and 50. Overall stars are the minimum of **fill, recipe, and mix** grades, so a perfect final fill cannot conceal an incorrect proportion. Single-soda mix grade is always five and leaves its original scoring unchanged. `fillStars` and `mixStars` let the UI display the separate measurements truthfully.

`recipeMistakes` uses bits: base 1, cherries 2, lime 4, syrup 8, blend 16. These provide specific visual feedback after commitment.

Operating costs never create debt or spend reserved payroll. Current and cumulative refund values represent foregone sale value, not another cash debit. `lastNet` is the player cup’s actual net; simultaneous staff sales are separate. Shift net includes ingredients, cleanup, and wages but excludes capital purchases. Use the `f64` save for exact money and RNG; snapshots may round large integers.

## Save compatibility

The writable save buffer contains **120 `f64` values**, version **106**. Slot 105 stores ice, and slots 106–119 remain reserved zero. V104 imports keep their original reserved 105–119 validation and default to no ice. Version 101 uses its original 80 values, zero-padded to 120. Versions 102, 103 and 104 use their original 120 values. Call `save_ptr()` once before writing, since each call refreshes the buffer from the live game.

```js
const pointer = game.save_ptr();
const destination = new Float64Array(game.memory.buffer, pointer, game.save_len());
destination.fill(0);
destination.set(validatedValues);
const accepted = game.restore_save() === 1;
```

Restoration validates atomically. V101/V102 current orders become plain single-soda recipes with the original base selected and no retroactive garnish costs. V103 current recipes remain single-soda. Existing scores and payments survive, and new request generation begins with the next customer. Genuine V102 fixtures preserve independently captured original 98-field restore snapshots. Five genuine V103 fixtures were exported from the released Wasm before rebuilding: preparation, interrupted Hardcore, unfinished Easy, paid, and staffed closed day. All **124 original snapshot fields** match the released engine's restore results.

Unpoured preparation preserves its selections and elapsed time without consuming a pour. Interrupted single-soda Hardcore commits once on restore. For mixed Hardcore, an interrupted first part advances to the untouched second part without payment; saving and restoring that waiting state does not consume the second hold. An interrupted second part commits once. Easy restores stopped on its current part, can finish the whole cup, and then returns to Hardcore. Paid saves never replay sales. Ordinary restored saves default to Hardcore; separate records survive.

V104 keeps recipe data at indices 83–96 and uses eight formerly reserved values:

| Save index | Field |
| --- | --- |
| 97 | `secondSoda` |
| 98 | `firstShare` |
| 99 | `pourPart` |
| 100 | `partAttempted` |
| 101 | `firstLiquid` |
| 102 | `firstFoam` |
| 103 | `firstFoamBeverage` |
| 104 | `firstPouredMl` |

V106 stores optional ice at **105**. Reserved **106–119** must remain zero; V104 imports still require **105–119** to be zero. Legacy versions retain their original reserved-range validation. Current-part state, total/first-component consistency, volume bounds, owned ingredients, and paid grades are checked before any live state changes. Paid mixed saves canonicalize first and total beverage to their committed settled amounts, keeping ratio, fill, and receipts fixed during the final foam animation. The production adapter writes V106 to `perfect-pour-business-v106`. It may read older production keys for migration but never modifies them. Importing an older export does not modify the original file.

This local save format prevents accidental duplicate payments and malformed imports. It is not server authentication or anti-cheat protection.
