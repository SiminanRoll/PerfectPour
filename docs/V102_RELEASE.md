# Perfect Pour V1.02 — release notes

**V1.02 implementation and local acceptance are complete.** Build identity and verification scope are recorded in [the release manifest](release-manifest.json). Publication is separately verifiable through the public game and repository history.

## A more visual soda bar

The pouring station is larger, with an illustrated shop interior, expressive customers, visible employees, and a growing storefront. Nine illustrated upgrade cards replace much of the explanatory interface with recognizable objects and short benefit labels. Purchased equipment, seating, signage, staff, premises, catering, and training change the shop artwork as well as its rules.

The cup, target, liquid, and foam remain the focus. The meter updates with the physical animation, while textual updates are limited to avoid constant visual churn. Finished five-star cups receive a golden highlight; reduced motion retains a static treatment. The settled cup stays visible until **See Review** is selected.

## One hold, real fizz, meaningful choices

Hardcore still defaults to one continuous hold: release commits the drink, with no second attempt or top-up. Easy retains repeated pours and manual serving. Both modes use the same physics and full target catalog.

Choose **Gentle, Classic, or Rush** pressure before starting. Gentle gives more aiming time and less gas expansion while keeping visible foam. Classic is the default; Rush trades shorter service for tighter timing and greater spill risk. Pressure and difficulty lock when the first attempt begins.

Scoring measures retained beverage against the order. Gas is not soda; soda trapped in foam still counts. Actual beverage waste and foamy mess are tracked separately. Ingredients and cleanup now cost money, poor service can reduce the sale, and empty or severely failed cups earn no sale. Bad pours can lose cash without creating debt or spending protected wages.

Patience starts with the first hold. Reading an order, menus, mandatory settling, and reviews are free. Slow service first loses speed tips, then sale value and secondary demand. Long streaks earn increasing multipliers and recurring milestones, with separate Hardcore and Easy records.

## A business that develops

The catalog adds interior expansion, catering, and team training. All nine upgrade types have implemented effects; the complete catalog costs **$1,899**. Current and next benefits, prerequisites, affordability, and next-day activation are shown in Build. See [the README](../README.md#build-the-business) for exact prices and effects.

New days contain 12 manual customers. The specialist serves an actual secondary queue during attempted player service, bounded by demand and capacity. Training improves capacity, speed, and staff prices; seating and larger premises support more orders. Idle menus cannot generate staff sales.

Payroll is reserved before purchases and charged once at closing. Receipts separate actual sales, tips, ingredients, cleanup, and net earnings. Price reductions are disclosed without being deducted twice. The closing ledger separates operating profit from capital purchases.

## Sound, saves, and delivery

Original quiet music is joined by recipe-sensitive pouring, fading fizz, and distinct review, spill, purchase, streak, and closing cues. Music and effects have independent toggles and volume controls, available during settling and dialogs.

V1.01 businesses migrate to a separate V1.02 save key. Cash, upgrades, records, and completed payments survive. Interrupted V1.02 Hardcore cups commit once on restoration; unfinished Easy cups resume stopped. A stale second tab pauses and offers **Load latest save** instead of overwriting newer progress.

The deliverable remains `dist/index.html`: one file containing the Rust/Wasm engine, interface, vector artwork, and synthesized audio, with no required runtime downloads. Acceptance evidence and its limits are documented [here](qa/V102_ACCEPTANCE.md).
