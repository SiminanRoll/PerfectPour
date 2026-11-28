# Perfect Pour — V1.07

An illustrated soda-counter game, evolving the V1.04.2 gameplay. Turn the machine's
pressure knob, choose a soda at the dispenser, and take ingredients from the
counter. Fruit drops into the cup and reacts to the drink; ice floats and adds
an extra burst of fizz. Overflow leaves a visible mess beneath the glass.

The original hold/release controls, Easy serving action, business economy and
customer progression remain. Existing V1.01–V1.05 businesses continue through
a read-only migration into the new V106 save key. Read [the V1.07 release notes](docs/V107_RELEASE.md)
for ice rules, the counter presentation and save compatibility.

`dist/index.html` is the self-contained offline game, including Rust/WebAssembly,
illustrated artwork, UI, music and sound effects. Build it with
`python3 scripts/build.py`.

## Start your shop

Choose **Start** on the animated intro to open the main menu. **New Game** begins in Hardcore. If a business is already saved, starting over requires confirmation; cancel returns to the menu with the business intact. **Continue** appears disabled until a saved business is available and resumes its current customer or closed day. **Settings** opens the audio controls, app-icon download, and optional instructions, then returns to the menu.

The starting screens have no difficulty selector. Switch between Hardcore and Easy in the game. Continuing an unfinished Easy cup preserves that cup's mode; the existing restore rules return later orders to Hardcore. Simply opening the intro, viewing Settings, or leaving the browser window does not create or replace a saved business before New Game or Continue.

The intro and menu adapt to portrait, landscape, and desktop screens. Reduced-motion preferences replace decorative animation with a static presentation. Longer optional instructions scroll inside Settings while its close action stays visible.

## Play a customer

Read the illustrated ticket and select a soda base. Your owned ingredient jars then appear; tap them to cycle their quantities. Two-soda orders select their first requested base automatically and show the pouring sequence in the same preparation row. Choose pressure and any requested blend before your first hold. The starter cherry jar is available immediately; other recipe stations are purchased in Build and appear at the counter once owned. A selection briefly animates its icon or quantity, with a persistent selected state and a reduced-motion alternative.

**Hold always pours.** Once the base is selected, hold the main button or Space to begin directly. There is no Ready confirmation. Easy uses a separate small action for advancing or serving:

| Phase | Main button | Easy's separate action |
| --- | --- | --- |
| No base selected | **Choose a base**, disabled | Unavailable |
| Recipe selected | **Hold to pour**; a mix identifies the active soda and part | Unavailable until a pour is released |
| Holding | **Pouring…**; release switches or serves in Hardcore, and pauses in Easy | Unavailable while holding |
| Easy, paused | **Hold to pour** again to top up the current soda | **Next soda** for part one, or **Serve** for the final part |
| Committed | **Settling…**, disabled while the foam falls | Unavailable |
| Finished cup and inline review | **Next customer**, or **Close the day** for the last guest | Unavailable |
| Closed day | **Open next day** | Unavailable |

Recipe and pressure controls stay editable until pouring actually starts. The first hold clears preparation controls and locks the recipe, pressure, and difficulty for that customer. The cup, target guides, and main action retain their aiming positions during the hold and between mixed-soda parts. Mode and recipe choices return when the next customer needs them.

**Hardcore is the default:** one continuous hold per soda. A single-soda release serves the drink. For a two-soda order, the first release switches taps and the final release serves. A quick tap still consumes that part's attempt. Pausing or leaving the window during a hold ends it; the next soda still requires its own new hold.

**Easy:** release to pause, then hold again to top up. The primary button has no tap-duration threshold and never doubles as Serve. When ready, choose the separate **Next soda** or **Serve** button; Enter also advances or serves when the pour control has focus. After switching sodas, the first part cannot be topped up again. The same recipe stays locked, and both modes retain the same fizz physics.

After the final release, the cup visibly settles. Its review appears automatically beside it: stars, net earnings, fill accuracy, and recipe accuracy. Five-star drinks receive a golden finish; reduced motion keeps a static treatment. The cup stays until you explicitly choose **Next customer**. The receipt icon opens optional details and the itemized receipt; **Back to cup** returns to the same finished drink. Waiting, viewing details, or returning from Build cannot pay again.

Enter activates discrete actions; pouring requires a hold of Space or the button. Recipe, menu, and settings controls retain their normal keyboard activation. P, Escape, or Pause controls breaks; Build opens the shop.

## Custom recipes

| Component | Choices | Availability |
| --- | --- | --- |
| Base | Orange, Cherry, Lime, Cola | All four from the start |
| Cherries | 0–5 | Starter tin; tray dims at five |
| Ice | 0–5 scoops | Ice bin; tray dims at five and boosts fizz |
| Lime | 0–5 wedges | $10 citrus tray; dims at five |
| Cherry syrup | 0–5 pumps | $18 syrup rack; dims at five |
| Blend | Light / extra soda water, Regular, Bold | $26 mixing dispenser unlocks custom blends |

The first new-business order requests Orange with one cherry. Later single-soda requests gradually add combinations, with plain orders between them and at most two add-in types. Customers only request owned ingredients. Buying a station preserves the current ticket; future orders can use it.

The recipe determines flavor and ingredient cost; pressure determines pouring speed. Light, Regular, and Bold use gas multipliers of 1.08, 1, and 0.92. These are game tuning values. Garnishes do not secretly displace liquid or move the target.

Requested cherries add $0.40 each to the menu price, lime $0.35, syrup $0.50 per pump, and a custom blend $0.25. A two-soda order adds $0.60 and weights its base price by the requested soda shares. Selected add-ins cost $0.08 per cherry, $0.10 for lime, and $0.12 per pump. Liquid costs reflect the amount actually poured of each soda, including waste. Costs apply once when the complete drink commits. Unrequested extras cost money without raising the quote.

Patience starts on the first changed recipe selection or first hold. Reading an untouched ticket is free. Complex requests allow additional preparation time; menus, required settling, and reviews do not consume it.

## Two-soda orders

Customer **six** introduces a 50/50 mix. Later mixed requests appear roughly one time in three; after twelve completed manual customers, they can also ask for 25/75 or 75/25. Each uses two distinct sodas, the Regular water blend, and at most one simple garnish or syrup addition. No new purchase is required. Automatic first-base selection does not start the patience clock, and mixed orders allow extra time for the second part.

The two bottle chips show the requested shares and highlight the current part. Both colored, numbered fill lines stay visible on the cup and meter. The first line is a fraction of the **requested drink**, not the whole cup: a 50/50 mix filled to 70% uses a first line at **35%** and a final line at **70%**. Only the active line gets the large cup label. Releasing the first Hardcore pour changes the active bottle and target without moving the cup or main button.

Each soda retains its own flow, foam, and settling rate. The stream changes with the tap, while the drink's color blends as the second soda enters. Liquid trapped in foam counts toward its soda's retained proportion. Spills affect the actual mix. Part one does not pay, charge ingredients, advance the customer, or grant staff income; the complete drink commits once after its final part.

The inline review shows fill accuracy separately from **Recipe + mix**, which displays the lower of recipe accuracy and proportion accuracy. The receipt icon opens the actual and requested proportions along with the complete breakdown. The [engine contract](engine/contract.json) defines the volume accounting, scoring, and save fields.

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

## Neighborhood tycoon progression (V1.07)

The built soda bar now feels more established in the active serving scene as you buy sign, tap, patio, awning, lounge, catering and staffing upgrades. Those upgrades retain their **existing real economic effects**, but their illustrations, colors, lamps and equipment are more visible during service. The starter shop remains welcoming.

A small physical chalkboard announces a **daily featured soda**. Each shift rotates to the next soda in the four-drink lineup. The first three drinks ordered with that featured base and served to a 4-star or better standard earn 25¢, 25¢ and a $1.50 finishing bonus. The 0/3 → 3/3 board is visible during play, with a compact progress label on phones. The daily bonus contributes to cash, gross and shift profit; it cannot be claimed twice by reloading a paid cup.

From day 2, guests 3, 7 and 11 are **returning regulars**, drawn from Ruth, Cleo, Maya and Sasha. Their names and illustrated faces stay consistent across visits. Excellent service (4+ stars) earns them one loyalty stamp (max five) and a thank-you tip that grows with loyalty; one poor review loses a stamp. A fifth stamp earns a one-time celebratory bonus. Loyalty survives day changes, imported previous businesses start with no stamps, and result receipts show both loyalty tips and special payouts.

These additions are **between-customer motivation**, not more steps to make a drink. Hardcore/Easy behavior, cup physics, scoring targets, and ingredient controls are unchanged.

## Build the business

The storefront illustrates the business as it grows. Upgrade cards lead with an illustration, the next measurable benefit, and the price. An information control opens the longer description and current effect. Prerequisites, wages, and next-day activation stay visible where they affect the purchase. A successful purchase briefly highlights the storefront; reduced-motion preferences suppress that animation. **Business tools** opens Export, Import, and Reset while the autosave status remains visible.

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

V1.07 writes save version **107**, the **120-value** save buffer, and a
**148-field** runtime snapshot. It explicitly imports **101, 102, 103, 104,
106, and 107**. Existing money, upgrades, reputation and paid cups survive.
Older businesses begin with zero ice; original recipe and mixture migration
rules remain. Ice adds optional foam behavior to the Rust engine while
zero-ice pours preserve the released physics and economy.

Autosave preserves preparation and active pours. Restoring an interrupted first Hardcore mixed part advances to the untouched second part without payment; restoring an interrupted final part commits once. An interrupted single-soda Hardcore pour retains its one-time commit behavior. Unfinished Easy resumes stopped on its current part. Paid cups return to settling or the inline review without paying again. V1.07 writes `perfect-pour-business-v107` and restores existing V106, V104, V103, V102 or V101 businesses when no current save exists. Legacy keys are retained unchanged; a stale second tab pauses rather than overwriting a newer save. Use **Build → Business tools → Export** for a portable backup. Browser storage availability may vary, especially for directly opened files.

## Build and verify

Rebundle with `python3 scripts/build.py`. To rebuild Rust, install the `wasm32-unknown-unknown` target and run `python3 engine/build_engine.py` first. The build helper runs native tests and produces the dependency-free Wasm. It can use the existing isolated toolchain at `engine/.toolchain` when Cargo is not on PATH.

```sh
cargo test --manifest-path engine/Cargo.toml
node tests/engine/wasm-smoke.mjs
node tests/engine/v103-recipes.mjs
node tests/engine/v104-mixtures.mjs
node tests/engine/v106-ice.mjs
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

Historical filenames also exercise the current game. The V1.06 engine passes **58 native tests**, including 448 iced Gentle catalog cases, plus the compiled-Wasm recipe, mixture, and ice suites. A direct comparison with the V1.04.2 engine preserved all original 134 fields across **1,624 snapshots from 288 zero-ice orders**. The release also checks production pointer/keyboard handlers, one-time payments, interrupted pours, legacy migration, stale-tab protection, and audio lifecycle. UI harnesses are not browser playtests, and simulated careers are not measured player performance. Direct-file portability is packaging-verified; narrow browser layouts do not certify physical phones, and audio lifecycle tests are not a subjective listening pass.

See [V1.07 release notes](docs/V107_RELEASE.md), [engine integration](engine/README.md), and [release identity](docs/release-manifest.json). [V1.04.1 acceptance evidence](docs/qa/V1041_ACCEPTANCE.md), [V1.04 notes](docs/V104_RELEASE.md), [V1.04 acceptance evidence](docs/qa/V104_ACCEPTANCE.md), and the earlier release records are retained as historical evidence. The prior V1.06 preview acceptance record is retained as historical visual evidence. Production migration and publication are documented separately.

## Release workflow

Approved releases go to `SiminanRoll/PerfectPour` on `main` and the existing
public Perfect Pour Site at https://perfect-pour.pretty-scarf-0591.chatgpt.site/.
Use local/internal previews for verification. Do not create separate private
release Sites unless the user explicitly requests one. Keep the production
Site ID in `.openai/hosting.json` and preserve existing player saves.
