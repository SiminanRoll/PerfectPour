# Perfect Pour — V1.03

**[Play Perfect Pour online](https://perfect-pour.pretty-scarf-0591.chatgpt.site/)** · [Source repository](https://github.com/SiminanRoll/PerfectPour)

Craft a custom soda, make the pour, earn a review, and grow a neighborhood soda bar. V1.03 adds illustrated recipe requests, visible cherries and lime, syrup, blend choices, and one primary button that follows each customer through service. The cup carries a pictorial brand stamp without lettering.

**`dist/index.html` is the complete game:** a self-contained HTML file with the Rust/WebAssembly engine, interface, graphics, and synthesized music and effects. It is designed for offline play without an account, frontend server, or runtime downloads. Rust, Python, and Node are development tools; players do not need them.

## Play a customer

Read the illustrated ticket, select a soda base, and tap ingredient jars to cycle their quantities. Choose pressure and any requested blend. The starter cherry jar is available immediately; other recipe stations are purchased in Build.

The **same primary button** changes with the current phase:

| Phase | Primary action |
| --- | --- |
| Preparation | Choose a base, then **Ready to pour** |
| Ready | **Hold to pour**, using the button or Space |
| Holding | **Release to serve** in Hardcore; **Release to pause** in Easy |
| Committed | **Settling…**, disabled while the foam falls |
| Finished cup | **See review** |
| Customer review | **Next customer**, or **Close the day** for the last guest |
| Closed day | **Open next day** |

Ready to pour clears the preparation and pressure controls **before aiming starts**. The layout remains stable during the hold. Edit recipe is available before the first pour. Ingredients and pressure lock once pouring begins.

**Hardcore is the default:** one continuous hold, then release automatically commits and serves it. A quick tap still consumes that attempt. Pausing or leaving the window during a hold ends it.

**Easy:** release to pause. The primary button then says Serve drink: a short tap serves, while holding it for 160 ms begins a top-up. Space starts a top-up directly; Enter serves. The same recipe stays locked, and both modes retain the same fizz physics.

The cup visibly settles and then stays until you choose See review. Five-star drinks receive a golden finish; reduced motion keeps a static treatment. Waiting cannot change the score or pay twice. Enter activates the current primary action, except that pouring requires a hold of Space or the button. P, Escape, or Pause controls breaks; Build opens the shop.

## Custom recipes

| Component | Choices | Availability |
| --- | --- | --- |
| Base | Orange, Cherry, Lime, Cola | All four from the start |
| Cherries | 0–2 | Starter jar |
| Lime | 0–1 wedge | $10 citrus tray |
| Cherry syrup | 0–2 pumps | $18 syrup rack |
| Blend | Light / extra soda water, Regular, Bold | $26 mixing dispenser unlocks custom blends |

The first new-business order requests Orange with one cherry. Later requests gradually add combinations, with plain orders between them and at most two add-in types. Customers only request owned ingredients. Buying a station preserves the current ticket; future orders can use it.

The recipe determines flavor and ingredient cost; pressure determines pouring speed. Light, Regular, and Bold use gas multipliers of 1.08, 1, and 0.92. These are game tuning values. Garnishes do not secretly displace liquid or move the target.

Requested cherries add $0.40 each to the menu price, lime $0.35, syrup $0.50 per pump, and a custom blend $0.25. Selected add-ins cost $0.08 per cherry, $0.10 for lime, and $0.12 per pump. Costs apply when the drink commits. Unrequested extras cost money without raising the quote.

Patience starts on the first changed recipe selection or first hold. Reading an untouched ticket is free. Complex requests allow additional preparation time; menus, required settling, and reviews do not consume it.

## Pressure, foam, and reviews

| Pressure | Flow relative to Classic | Tradeoff |
| --- | ---: | --- |
| Gentle | 0.55× | More aiming time, less gas, lower speed tips |
| Classic | 1.00× | Standard timing and carbonation |
| Rush | 1.35× | Faster service, tighter timing, greater foam risk |

Gentle retains visible fizz and a five-star solution for every tested base, cup, target, tap level, and blend when the recipe is correct. Hardcore does not filter out difficult targets or substitute easier physics.

Four cups hold **280, 360, 460, and 330 mL**. Targets are **45%, 55%, 60%, 65%, 70%, 75%, and 80%**. The meter separates liquid and foam. Beverage trapped in foam counts toward the final fill; gas does not.

Fill accuracy is `clamp(100 − 350 × abs(final_fraction − target_fraction), 0, 100)`. Fill thresholds for five through two stars are 96, 88, 72, and 50. Recipe accuracy separately deducts for incorrect base, quantities, or blend. Overall stars use the lower grade: **five stars require the exact recipe and an excellent fill**. A wrong base cannot exceed two stars. Reviews show recipe and pour scores separately, with specific recipe corrections.

Poor pours can lose money through ingredients and cleanup. Severe failures earn no sale; lesser errors and slow service reduce earnings. Costs cannot create debt or consume reserved wages. Four- and five-star reviews extend streaks, with increasing multipliers and recurring milestones. Difficulty changes reset the current streak while preserving separate records. Hardcore retains its 15% base-pay premium.

## Build the business

All twelve upgrade types have implemented effects. Prices are per level.

| Upgrade | Prices | Benefit |
| --- | --- | --- |
| Sign | $12 / $22 / $36 | Higher base prices and demand |
| Patio | $18 / $30 | More staff capacity, demand, and patience |
| Awning | $14 / $24 | More patience and good-service tips |
| Tap | $18 / $30 | Less foam gas and lower cleanup costs |
| Helper | $28 | Half cleanup, extra service tips; $1.50/day |
| Specialist | $42 | Serves a separate queue; $2.50/day |
| Interior | $100 / $180 / $300 | Larger premises, staff capacity, and demand |
| Catering | $140 / $240 / $400 | More demand and higher staff sale values |
| Training | $50 / $85 / $130 | Faster staff, more capacity, better staff prices |
| Citrus tray | $10 | Lime garnish requests |
| Syrup rack | $18 | Cherry syrup requests |
| Mixing dispenser | $26 | Light and Bold blend requests |

The full catalog costs **$1,953**. Employees and capacity investments become operational next day. Catering needs an interior and specialist; training needs a specialist. Each new day has 12 manual customers, with additional orders handled by staff. Menus cannot farm staff income.

Payroll is reserved before purchases and charged once at closing. Receipts and daily ledgers separate sales, ingredients, cleanup, wages, and net earnings. Refund figures describe foregone sales, not another cash deduction. Capital purchases are separate from operating profit. Exact effects and prices are documented in [the engine contract](engine/contract.json).

## Sound, appearance, and saves

Customers keep the same SVG while expressions change, avoiding the disappearance caused by replacing their artwork at release. Pouring and fizz use smoother audio release transitions. Music and effects have independent toggles and volumes.

**Help & settings → Download app icon** exports a **512 × 512 PNG** suitable for a shortcut. It is included in the standalone game; downloading an icon does not install an app automatically.

V1.03 exports version **103** and imports **101, 102, and 103**. Existing cash, upgrades, reputation, and paid cups survive. Earlier current orders stay plain without retroactive recipe costs; custom requests begin with the next customer. Legacy longer days finish their existing goal before returning to 12 customers.

Autosave preserves preparation and active pours. Interrupted Hardcore commits once on restoration; unfinished Easy resumes stopped. Paid cups cannot pay again. A stale second tab pauses rather than overwriting a newer save. Use **Build → Export save** for a portable backup. Browser storage availability may vary, especially for directly opened files.

## Build and verify

Rebundle with `python3 scripts/build.py`. To rebuild Rust, install the `wasm32-unknown-unknown` target and run `python3 engine/build_engine.py` first. The build helper runs native tests and produces the dependency-free Wasm.

```sh
cargo test --manifest-path engine/Cargo.toml
node tests/engine/wasm-smoke.mjs
node tests/engine/v103-recipes.mjs
node tests/engine/v102-balance.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/browser/v102-ui-contract.mjs
node tests/browser/v103-control-flow.mjs
node tests/audio/music-lifecycle.mjs
node tests/audio/game-sounds.mjs
node tests/browser/verify-offline-selftest.mjs
python3 scripts/build.py
node tests/browser/verify_offline.mjs dist/index.html
```

Historical filenames now exercise V1.03. Local checks include 40 native tests, 6,048 catalog/mode fixtures, 48 synthetic careers, 94 UI aliases, and production pointer/keyboard handlers. UI harnesses are not browser playtests, and simulated careers are not measured player performance. Direct-file portability is packaging-verified; narrow browser layouts do not certify physical phones, and audio lifecycle tests are not a subjective listening pass.

See [V1.03 notes](docs/V103_RELEASE.md), [engine integration](engine/README.md), and [release identity](docs/release-manifest.json). [V1.02 notes](docs/V102_RELEASE.md) and [its acceptance history](docs/qa/V102_ACCEPTANCE.md) are retained. These documents describe source and prepublication checks; GitHub CI and deployment records establish subsequent release status.
