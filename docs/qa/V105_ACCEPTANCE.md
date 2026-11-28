# V1.05 — photographic customers, glass, and pouring effects

## Scope and baseline

The user requested a full graphics pass, visible pouring and spill effects, and realistic cups and people in place of the cartoon presentation. This release changes artwork, rendering, presentation, and corresponding checks. It preserves the Rust/Wasm rules, prices, recipes, difficulty, current-cup saves, and V1.04.2 touch-capture repair.

The starting GitHub main was `3c9f86a540e1ac446ed2ad20f0141e3f220f2940`, tree `57cb61433fc78993ab93082637696743aa828c9c`. The opened Sites source was `beb201e64524137dfa1ad318e756fa69e2e04e37`, with the same full tree. The published baseline was V1.04.2, Sites version 10. The release PR records the tested candidate, full-tree comparison, CI result, merge readback, and deployment receipt.

## Presentation and performance boundaries

- Eight fictional photographic customers each have attentive, pleased, and disappointed expressions. Mood changes select a crop from a preloaded atlas while retaining the same outer SVG, image element, image URL, and arrival wrapper.
- The intro and serving environment use matching photographic artwork. Gameplay glass, soda, foam, garnishes, and overflow remain dynamic and use the actual engine state and existing four cup geometries.
- Stream impact, ripples, short release drips, spill rivulets, droplets, and a persistent puddle are cosmetic. They neither add liquid nor change scoring. New overflow produces effects; restored waste does not replay an accident.
- The particle pool is capped at 68. Expiring the final particle requests one clean redraw before the scene returns to idle. Each new order resets visual carryover. Reduced motion keeps static physical feedback and removes decorative particle travel and the outgoing-cup animation.
- The outgoing glass animates only after explicit Next. The next order becomes available immediately; no animation completion callback owns input or engine progression.
- Storefront upgrades highlight their corresponding feature. Staff artwork follows active staff, rather than displaying employees merely because they have been hired for a future day.

## Automated verification

| Check | Result and coverage |
| --- | --- |
| Native Rust | 52 tests passed using the existing isolated Rust toolchain; engine source and shipped Wasm unchanged. |
| Wasm smoke and business acceptance | Passed; one-pour behavior, business progression, and saved state retained. |
| Catalog and economy | 6,048 catalog cases passed. Existing balance model and prices unchanged. |
| Recipe and mixture suites | Legacy recipes and migration passed; 216 mode/pressure/pair/ratio cases and a 240-customer career including 86 mixtures passed. |
| Production control flow | Passed actual production handlers against shipped Wasm, including touch/pen capture release, keyboard ownership, mixture transitions, settling, paid-cup continuation, and final particle cleanup. |
| UI and menu contracts | Passed existing saves, migrations, startup, and current-cup safety checks. |
| Physical rendering | 120 render scenarios passed across all four cup geometries and finite-coordinate boundary cases; 1,200 frames of continuous overflow remained bounded; release, expiry, restoration, and reduced motion passed. |
| Photographic customers | All eight identities and 24 expression crops passed; same-person mood changes retain image/DOM identity and repeated moods are no-ops. |
| Audio | Music scheduling/mute lifecycle and pour/fizz/feedback cue suites passed. |
| Offline bundle | All nine inline scripts parse; embedded Wasm validates with zero imports. The verifier's 14 regression cases pass. All images are embedded data URLs. |

The new rendering and customer suites are included in GitHub CI. The standalone output must reproduce byte-for-byte from committed sources before release.

## Browser observations

Managed Chromium loaded the actual built HTML in a viewport wrapper with isolated in-memory storage. Progress fixtures were earned by the shipped Wasm. The wrapper does not call game actions, synthesize click events, or change a live player's save, and is removed from the distribution before publishing.

- Desktop 1280 × 720 and portrait 390 × 844 show the photographic intro, customer portraits, realistic glass materials, target guides, and contextual controls without document overflow.
- A native 6.5-second Hardcore hold produced an actual overflowing cup with 397 mL of waste. Airborne droplets, outside rivulets, and a growing countertop puddle appeared while the aiming stage stayed steady. Settling remained visible, the one-star review selected the disappointed expression, and a fresh Next advanced customer 1 to 2 with an empty glass and no duplicate revenue.
- An advanced recipe on 390 × 844 showed the full base, garnish, syrup, and soda-water controls. A native 2.1-second hold produced 24% liquid and 8% foam; the foam then visibly settled to 7%. The glass and side meter represented the same live state. Canvas and primary-button bounds stayed unchanged between preparation and settling.
- Unequal mixed orders showed the requested 25% Orange / 75% Cherry sequence, an 11.25% first cumulative target, and a 45% final target. The smaller viewport pass identified and corrected redundant prep content and cramped aiming space.
- A visible Neon identity purchase spent exactly $22.00 ($433.84 to $411.84), advanced the sign tier, and updated the next price to $36.00. The narrow storefront pass identified and corrected overlapping secondary statistics.
- Final 375 × 667 Build recheck showed an 8.8px clearance between the upgrade effect and Buy button. Secondary portrait staff text no longer overlaps the centered drink status.
- The corrected 320 × 568 mixed-order canvas is 211px high and stays at the same bounds through preparation, first release, second release, and settling. The 375 × 667 equivalent is 310px high. Active target labels retain a 12 CSS-pixel minimum without changing the target line's height.
- Finished-state views at 844 × 390, 568 × 320, and 768 × 600 remained inside the viewport. The shortest landscape hides the redundant prepared-recipe summary while retaining the gauge.
- The restored five-star final cup on 390 × 844 showed the gold glass effect, pleased customer, and garnish. Close day settled $4.00 of wages exactly once ($811.93 to $807.93); Open next day reached day 7, customer 1, retaining $807.93. Settings opened and returned to the same preparation state.

## Compatibility and limits

Save version 104, 120 saved doubles, and the 134-field snapshot remain unchanged. The 44,961-byte Wasm retains SHA-256 `f6a5cd045aab69a685544afc130d1d6aefb4ae95288cc343e5efca97ac29fca5`. The exact final HTML size and hash are recorded in `docs/release-manifest.json`.

Customers use three photographic expression frames, not a continuous facial rig. Gameplay glass uses a real-time 2D material renderer driven by the simulation, rather than a static photograph or a 3D fluid solver. Browser observations are managed Chromium viewport checks, not physical iOS/Safari or Android testing. Audio lifecycle and cues were tested programmatically; this release does not claim a new subjective listening or device-performance assessment.

Asset origins and prompts are in [environment and hero provenance](../art/V105_ART_DIRECTION.md) and [customer provenance](../art/CUSTOMER_ASSETS.md).
