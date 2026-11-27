# Perfect Pour V1.03 — acceptance evidence

## Scope

These checks cover the custom-soda update before publication. The [release manifest](../release-manifest.json) identifies the bundled artifact; the repository's CI and Site deployment records establish publication separately. V1.02's historical evidence remains in [its acceptance record](V102_ACCEPTANCE.md).

## Automated gates — passed

| Area | Evidence |
| --- | --- |
| Native Rust | 40 tests for simulation, scoring, recipes, costs, purchases, progression, and restoration |
| Shipped Wasm | Smoke, business acceptance, and V1.03 recipe suites run against the compiled artifact |
| Catalog and economy | 6,048 catalog/mode fixtures, three blends, and 48 seeded careers |
| UI contract | 94 field aliases, required DOM targets, unique IDs, and one primary button moved among three phase slots |
| Save continuity | Seven genuine V101/V102 fixtures; V102's original 98 snapshot fields match captured legacy-engine restoration results |
| Production input | Exact input functions exercised with clocked events and the shipped Wasm, including the 160 ms Easy hold boundary |
| Audio | Music lifecycle, effects envelopes, quick release, foam tail, suspension, and cleanup |
| Offline release | Eight inline scripts, one embedded Wasm module with zero imports, no runtime dependencies, and 14 verifier regression cases |

Input coverage includes a first Hardcore hold committing once, suppression of its synthesized release click, Easy short-tap submission and held-button top-ups, empty Easy attempts, pointer cancellation, competing pointers, keyboard ownership, and assistive clicks. Space and Enter repeats cannot cross phases. A pointer gesture that starts while settling cannot activate the newly enabled review on release. Native controls, including the receipt disclosure, retain keyboard ownership.

Save checks cover preparation without an attempt, elapsed preparation time, interrupted Hardcore committing once, unfinished Easy restoration, and paid cups not paying twice. V103 writes its own storage key, reads both legacy versions, and leaves their keys untouched. Existing stale-tab and unavailable-storage handling remain exercised through the real persistence adapter.

## Balance findings

The [compiled-engine report](../../engine/balance-report.json) records SHA-256 `faace530dcdcf92e4504ef33ace1bd51c8e28a89d9b26d9f84d35637a7e24c4e`.

At nominal hold times, Gentle achieved five stars in **1,008/1,008** catalog cases across bases, cups, targets, tap levels, and blends. Visible foam ranged from **5.57 to 61.85 mL**, with zero beverage waste. Classic achieved **992/1,008** five-star results and Rush **929/1,008**. Classic and Rush figures are nominal-hold diagnostics, not searched maximum scores. Hardcore and Easy retain matching underlying fizz physics.

All twelve upgrade types cost **$1,953** in total. Seeded careers bought the full catalog in **89–93 pours** at exact timing, **92–101** with 70 ms timing standard deviation, and **127–148** with 150 ms deviation. These simulations select correct recipes instantly; they do not model player reading, ingredient-selection time, or recipe mistakes. An empty-cup career earned zero gross over 120 attempts and ten days.

## Actual browser interaction — local preview

The supported Chromium browser exercised the standalone HTML through the managed HTTP preview. Plays used the visible UI and native pointer/keyboard input; no hidden engine-state injection was used.

- An existing V1.02 Day 3 business restored with its cash, reputation, staff, upgrades, and already-paid cup. Reviewing that cup did not award it again. The next customer received a custom recipe.
- A new Orange order requested one cherry. Preparation began with no base chosen and the primary action disabled. Selecting the base and cherry enabled Ready to pour. Ready hid preparation controls before the pour, while preserving the full-size aiming layout.
- The Orange Hardcore attempt visibly retained foam after release and entered disabled Settling. The customer remained visible. Read-only DOM observations showed arrival-wrapper opacity of 1 before and after release and unchanged static body markup; screenshots showed no disappearing customer. The implementation now updates expression groups within the existing SVG.
- At a 390-pixel frame width, an Easy Cherry order requested two cherries. A 1.5-second pointer hold reached about 27% liquid with visible foam. A second 1.5-second hold raised the fill to about 52%, and its release did not serve. A short tap then served. Holding Space for 4.5 seconds across settling left the finished cup on screen instead of opening its review.
- That Easy review showed **100% recipe**, **91.6% pour**, four stars, and **$4.14 take-home**. Recipe, pour score, reputation change, receipt disclosure, and the same Next customer button fit the compact review.
- Purchasing the **$10 citrus tray** and **$18 syrup rack** changed cash from **$35.62 to $7.62**, leaving **$4.00 protected for payroll**. Both stations became owned. Returning from Build preserved the completed review. The next order requested two cherries and a lime wedge, and the corresponding controls were available.
- A 320-pixel Hardcore Lime pour showed **63% liquid plus 9% foam** immediately after release, then settled to **65% final fill** against a 45% request. A Space hold begun during settling could neither top up nor skip the finished cup. This deliberate overfill lost **$0.65** and reduced reputation from **4.7 to 3.5**. The lime wedge and cherries remained visible.
- Preparation and finished-cup layouts at **320 × 844** had document width equal to viewport width, with no horizontal overflow. The customer, cup, separate foam/liquid meter, and main action were visible together during pouring and after settling. The 390 × 844 preparation and review layouts were also inspected.
- The final rebuilt cup was visually rechecked at 320 pixels: its badge contains only the smiling cup-and-straw symbol, with both lettering lines removed. Raised cherries remain visible beside the badge. Restoring this paid cup retained the same cash and review.
- **Help & settings → Download app icon** produced an actual **512 × 512 RGBA PNG**, **21,676 bytes**, named `Perfect_Pour_App_Icon.png`. The feature uses the bundled artwork and does not require an asset download from another host.

## Limits

Narrow iframe layouts are not physical-phone certification. Direct file launch was verified structurally through the offline package checks, not through a browser `file://` play session. Audio lifecycle and envelope tests do not establish subjective listening quality. No broad accessibility certification or measured player study is claimed. Local preview plays did not reset the public site's saved business.
