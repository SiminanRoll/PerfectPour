# Perfect Pour V1.03.2 — a new opening

Perfect Pour now opens with an illustrated soda, rising bubbles, floating garnishes, and an animated Start button. Start leads to a storefront scene with three familiar choices: **New Game**, **Continue**, and **Settings**. Reduced-motion preferences keep a static presentation.

## Straight into the game

Starting screens keep the focus on the artwork and menu. Difficulty controls and mode explanations are removed from the opening. New games always start in **Hardcore**; the existing in-game control still switches to Easy.

Continue becomes available when a saved business loads, with its day and cash shown in the menu. It returns to the current preparation, unfinished pour, finished cup, or day summary. An unfinished Easy cup keeps its mode under the existing restore rules.

New Game asks before replacing an existing business. Cancel returns to the menu and preserves the save. Visiting the intro or Settings, or leaving the window before choosing New Game or Continue, does not write a fresh business over existing progress. A held Enter or Space cannot repeat into the next menu action as focus changes.

## Room for the artwork and controls

The opening adapts to desktop, compact portrait, and landscape screens. The three menu actions have comfortable tap targets, and Settings keeps its close action visible while expanded instructions scroll inside their own panel.

The page now requests a fixed mobile scale and cancels supported pinch/native zoom gestures while preserving ordinary one-finger interaction and panel scrolling. Verification limits for device and browser overrides are recorded in the [acceptance evidence](qa/V1032_ACCEPTANCE.md).

## Your soda bar continues

The Rust simulation, compiled Wasm, version-103 save format, prices, recipes, upgrades, and fizz rules retain their existing behavior. Hardcore still commits a single hold on release, with visible settling before the finished cup and explicit review. The complete game remains the self-contained `dist/index.html` file.

## Verification status

The UI contract, production input-handler suite, and new startup/menu/save suite passed. The menu suite executes the actual boot and menu functions with the shipped Wasm, including save protection, Continue routing, cancellation, and gesture event ownership. Wasm smoke, business, catalog/balance, recipe, music, sound-effect, and offline verifier suites also passed locally. The final standalone build passed offline packaging verification.

Actual browser checks covered **1280 × 720, 320 × 568, 390 × 844, and 568 × 320**. The intro and menu were visually inspected with **0 px document overflow**, and compact menu targets measured at least **44 px**. Native held-key checks, Settings return, contained instruction scrolling, a fresh Hardcore pour, and a saved-business cancel/Continue flow also passed.

Native Rust tests could not run locally because `cargo` is unavailable. The complete release gate is **GitHub CI on the exact source commit**; its final status and the publication receipt are recorded on the PR. The [acceptance record](qa/V1032_ACCEPTANCE.md) lists the local checks and artifact digest. The [release manifest](release-manifest.json), PR checks, and Sites deployment record establish the final artifact and publication separately.
