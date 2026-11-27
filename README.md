# Perfect Pour — V1.04

**[Play Perfect Pour online](https://perfect-pour.pretty-scarf-0591.chatgpt.site/)** · [Source repository](https://github.com/SiminanRoll/PerfectPour)

Craft a custom soda, make the pour, earn a review, and grow a neighborhood soda bar. V1.04 adds occasional two-soda orders: follow the numbered bottles, pour the requested proportions, and hit the final fill. The animated intro, New Game / Continue / Settings menu, compact counter, custom garnishes, and single primary action remain. The cup carries a pictorial brand stamp without lettering.

**`dist/index.html` is the complete game:** a self-contained HTML file with the Rust/WebAssembly engine, interface, graphics, and synthesized music and effects. It is designed for offline play without an account, frontend server, or runtime downloads. Rust, Python, and Node are development tools; players do not need them.

## Start your shop

Choose **Start** on the animated intro to open the main menu. **New Game** begins in Hardcore. If a business is already saved, starting over requires confirmation; cancel returns to the menu with the business intact. **Continue** appears disabled until a saved business is available and resumes its current customer or closed day. **Settings** opens the audio controls, app-icon download, and optional instructions, then returns to the menu.

The starting screens have no difficulty selector. Switch between Hardcore and Easy in the game. Continuing an unfinished Easy cup preserves that cup's mode; the existing restore rules return later orders to Hardcore. Simply opening the intro, viewing Settings, or leaving the browser window does not create or replace a saved business before New Game or Continue.

The intro and menu adapt to portrait, landscape, and desktop screens. Reduced-motion preferences replace decorative animation with a static presentation. Longer optional instructions scroll inside Settings while its close action stays visible.

## Play a customer

Read the illustrated ticket, select a soda base, and tap ingredient jars to cycle their quantities. Two-soda orders select their first requested base automatically and show the pouring sequence in the same preparation row. Choose pressure and any requested blend. The starter cherry jar is available immediately; other recipe stations are purchased in Build.

The **same primary button** changes with the current phase:

| Phase | Primary action |
| --- | --- |
| Preparation | Match the recipe, then **Ready to pour** |
| Ready | **Hold to pour**, using the button or Space; a mix identifies the active soda and part |
| Holding | Hardcore releases to switch after the first mixed part, or to serve after the last; Easy releases to pause |
| Easy, paused | Tap **Next soda** or **Serve drink**; hold the same button to top up the current soda |
| Committed | **Settling…**, disabled while the foam falls |
| Finished cup | **See review** |
| Customer review | **Next customer**, or **Close the day** for the last guest |
| Closed day | **Open next day** |

Ready to pour clears the preparation and pressure controls **before aiming starts**. The layout remains stable during the hold. Edit recipe is available before the first pour. Ingredients and pressure lock once pouring begins.

**Hardcore is the default:** one continuous hold per soda. A single-soda release serves the drink. For a two-soda order, the first release switches taps and the final release serves. A quick tap still consumes that part's attempt. Pausing or leaving the window during a hold ends it; the next soda still requires its own new hold.

**Easy:** release to pause. A short tap on the primary button advances from the first soda or serves the final drink; holding it for 160 ms begins a top-up of the current soda. Space starts a top-up directly; Enter advances or serves. After switching sodas, the first part cannot be topped up again. The same recipe stays locked, and both modes retain the same fizz physics.

The cup visibly settles and then stays until you choose See review. Five-star drinks receive a golden finish; reduced motion keeps a static treatment. Waiting cannot change the score or pay twice. Enter activates the current primary action, except that pouring requires a hold of Space or the button. P, Escape, or Pause controls breaks; Build opens the shop.

## Custom recipes

| Component | Choices | Availability |
| --- | --- | --- |
| Base | Orange, Cherry, Lime, Cola | All four from the start |
| Cherries | 0–2 | Starter jar |
| Lime | 0–1 wedge | $10 citrus tray |
| Cherry syrup | 0–2 pumps | $18 syrup rack |
| Blend | Light / extra soda water, Regular, Bold | $26 mixing dispenser unlocks custom blends |

The first new-business order requests Orange with one cherry. Later single-soda requests gradually add combinations, with plain orders between them and at most two add-in types. Customers only request owned ingredients. Buying a station preserves the current ticket; future orders can use it.

The recipe determines flavor and ingredient cost; pressure determines pouring speed. Light, Regular, and Bold use gas multipliers of 1.08, 1, and 0.92. These are game tuning values. Garnishes do not secretly displace liquid or move the target.

Requested cherries add $0.40 each to the menu price, lime $0.35, syrup $0.50 per pump, and a custom blend $0.25. A two-soda order adds $0.60 and weights its base price by the requested soda shares. Selected add-ins cost $0.08 per cherry, $0.10 for lime, and $0.12 per pump. Liquid costs reflect the amount actually poured of each soda, including waste. Costs apply once when the complete drink commits. Unrequested extras cost money without raising the quote.

Patience starts on the first changed recipe selection or first hold. Reading an untouched ticket is free. Complex requests allow additional preparation time; menus, required settling, and reviews do not consume it.

## Two-soda orders

Customer **six** introduces a 50/50 mix. Later mixed requests appear roughly one time in three; after twelve completed manual customers, they can also ask for 25/75 or 75/25. Each uses two distinct sodas, the Regular water blend, and at most one simple garnish or syrup addition. No new purchase is required. Automatic first-base selection does not start the patience clock, and mixed orders allow extra time for the second part.

The two bottle chips show the requested shares and highlight the current part. Both colored, numbered fill lines stay visible on the cup and meter. The first line is a fraction of the **requested drink**, not the whole cup: a 50/50 mix filled to 70% uses a first line at **35%** and a final line at **70%**. Only the active line gets the large cup label. Releasing the first Hardcore pour changes the active bottle and target without moving the cup or main button.

Each soda retains its own flow, foam, and settling rate. The stream changes with the tap, while the drink's color blends as the second soda enters. Liquid trapped in foam counts toward its soda's retained proportion. Spills affect the actual mix. Part one does not pay, charge ingredients, advance the customer, or grant staff income; the complete drink commits once after its final part.

The review keeps the existing three metrics. For a mixed order, **Recipe + Mix** displays the lower of recipe accuracy and proportion accuracy, with the actual and requested proportions shown in the details. Fill accuracy stays separate. The [engine contract](engine/contract.json) defines the volume accounting, scoring, and save fields.

## Pressure, foam, and reviews

| Pressure | Flow relative to Classic | Tradeoff |
| --- | ---: | --- |
| Gentle | 0.55× | More aiming time, less gas, lower speed tips |
| Classic | 1.00× | Standard timing and carbonation |
| Rush | 1.35× | Faster service, tighter timing, greater foam risk |

Gentle retains visible fizz and a five-star solution for every tested base, cup, target, tap level, and blend when the recipe is correct. Hardcore does not filter out difficult targets or substitute easier physics.

Four cups hold **280, 360, 460, and 330 mL**. Targets are **45%, 55%, 60%, 65%, 70%, 75%, and 80%**. The meter separates liquid and foam. Beverage trapped in foam counts toward the final fill; gas does not.

Fill accuracy is `clamp(100 − 350 × abs(final_fraction − target_fraction), 0, 100)`. Fill thresholds for five through two stars are 96, 88, 72, and 50. Recipe accuracy separately deducts for incorrect base, quantities, or blend. Mixed drinks also score `clamp(100 − 200 × abs(retained_first_share − requested_first_share), 0, 100)` using the fill-grade thresholds. Overall stars use the lowest applicable grade: **five stars require the exact recipe, an excellent fill, and accurate proportions when mixed**. A wrong base cannot exceed two stars. A perfect total fill cannot hide an incorrect mix, and correct proportions cannot hide underfill.

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

Customers keep the same SVG while expressions change, avoiding the disappearance caused by replacing their artwork at release. Pouring and fizz use smoother audio release transitions. Music and effects have independent toggles and volumes in **Help & settings**.

**Help & settings → Download app icon** exports a **512 × 512 PNG** suitable for a shortcut. It is included in the standalone game; downloading an icon does not install an app automatically.

V1.04 exports version **104** and imports **101, 102, 103, and 104**. Existing cash, upgrades, reputation, and paid cups survive. V101/V102 current orders stay plain without retroactive recipe costs. V103 current recipes remain single-soda; new mixed requests can begin with later customers. Legacy longer days finish their existing goal before returning to 12 customers. The save buffer remains 120 values; the runtime snapshot expands to 134 fields.

Autosave preserves preparation and active pours. Restoring an interrupted first Hardcore mixed part advances to the untouched second part without payment; restoring an interrupted final part commits once. An interrupted single-soda Hardcore pour retains its one-time commit behavior. Unfinished Easy resumes stopped on its current part. Paid cups cannot pay again. V104 uses a separate browser storage key, and a stale second tab pauses rather than overwriting a newer save. Use **Build → Export save** for a portable backup. Browser storage availability may vary, especially for directly opened files.

## Build and verify

Rebundle with `python3 scripts/build.py`. To rebuild Rust, install the `wasm32-unknown-unknown` target and run `python3 engine/build_engine.py` first. The build helper runs native tests and produces the dependency-free Wasm. It can use the existing isolated toolchain at `engine/.toolchain` when Cargo is not on PATH.

```sh
cargo test --manifest-path engine/Cargo.toml
node tests/engine/wasm-smoke.mjs
node tests/engine/v103-recipes.mjs
node tests/engine/v104-mixtures.mjs
node tests/engine/v102-balance.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/browser/v102-ui-contract.mjs
node tests/browser/v103-control-flow.mjs
node tests/browser/v1032-menu.mjs
node tests/audio/music-lifecycle.mjs
node tests/audio/game-sounds.mjs
node tests/browser/verify-offline-selftest.mjs
python3 scripts/build.py
node tests/browser/verify_offline.mjs dist/index.html
```

Historical filenames also exercise the current game. The suites cover **52 native tests**, 6,048 single-soda catalog/mode fixtures, 3,024 native Gentle mixture cases, 216 compiled-Wasm mixture mode-parity pours, 48 synthetic careers, **104 UI aliases**, production pointer/keyboard handlers, and startup/save/menu behavior against the shipped Wasm. Five genuine V103 fixtures preserve all 124 original snapshot fields when restored by the new engine. UI harnesses are not browser playtests, and simulated careers are not measured player performance. Direct-file portability is packaging-verified; narrow browser layouts do not certify physical phones, and audio lifecycle tests are not a subjective listening pass.

See [V1.04 notes](docs/V104_RELEASE.md), [V1.04 acceptance evidence](docs/qa/V104_ACCEPTANCE.md), [engine integration](engine/README.md), and [release identity](docs/release-manifest.json). [V1.03.2 notes](docs/V1032_RELEASE.md), [V1.03.1 notes](docs/V1031_RELEASE.md), [V1.03 notes](docs/V103_RELEASE.md), [V1.02 notes](docs/V102_RELEASE.md), and their acceptance records are retained. These documents describe source and prepublication checks; GitHub CI and deployment records establish subsequent release status.
