# Perfect Pour V1.03.1 — a cleaner counter

This update gives the game more room to breathe on phones and desktops. The interface uses the available screen height, keeps the pour action close at hand, and replaces repeated explanations with concise labels and illustrated controls.

## Less clutter, more game

- A smaller header uses icons for the business statistics. Pause and Help stay easy to reach; music and effects controls live in Help & settings.
- The recipe tray appears when preparing a drink and clears before pouring. The customer, cup, target, and separate soda/foam meter remain the focus.
- Shorter status messages, compact streak indicators, and quieter decoration make the counter easier to scan. Large HUD values use compact notation while exact amounts remain available through their accessible labels and detailed business displays.
- Reviews keep the scores and next action prominent. Receipt details and the day ledger open only when wanted.
- Help opens with audio settings and the app-icon download. How-to-play instructions are folded away, and the close button stays available when the explanation is expanded.

## A shop that fits

Build now pages through all **12 upgrade types** instead of presenting one long catalog. Phones show one upgrade at a time; larger viewports are designed to show two or four. A purchase updates the displayed upgrade without sending the player back to the beginning. Prices, effects, ownership, and save tools remain available.

## Your business continues

This is an interface update. The Rust engine, compiled Wasm, save format **103**, pouring rules, fizz, recipes, prices, and upgrade effects are unchanged. Hardcore still commits one hold on release. The soda visibly settles, and the finished cup waits for the player to open its review.

The complete game remains the self-contained `dist/index.html` file. Previous [V1.03 release notes](V103_RELEASE.md) describe custom sodas, save compatibility, and the existing game rules.

## Verification status

Actual preview checks completed during this update include a **320 × 568** custom-soda pour, visible settling, a stable cup and action position across release, all twelve upgrade pages, an actual lounge purchase, and Help with contained expanded content. Easy mode was also played at **390 × 844**, including a paused pour, held top-up, and tap to serve.

Advanced recipe preparation fitted eight phone, landscape, and desktop viewports without page overflow. Store checks confirmed transitions through one, two, four, and back to one card. Reviews and day summaries fitted compact portrait and landscape screens; expanding a receipt or ledger kept the actions visible while only the optional detail body scrolled.

The final UI contract, production input-handler suite, offline verifier, and diff checks passed. The [acceptance record](qa/V1031_ACCEPTANCE.md) records the tested artifact and limits. Publication is recorded separately by the PR checks and Sites deployment; the [release manifest](release-manifest.json) identifies the bundle. Narrow browser viewports do not certify physical phones.
