# Perfect Pour V1.03.2 — acceptance evidence

## Scope and status

V1.03.2 adds the animated intro, illustrated main menu, New Game / Continue / Settings flow, startup save guards, held-key protection across menu transitions, and mobile zoom controls. Starting screens no longer offer difficulty selection. New games default to Hardcore; the in-game switch and existing restore rules remain available.

**The available local automated checks and actual browser checks below passed.** Native Rust tests could not run locally because `cargo` is unavailable. The complete release gate is GitHub CI on the exact source commit; its final status and the publication receipt are recorded on the PR. This is an acceptance record, not a deployment receipt. The [release manifest](../release-manifest.json), PR checks, and Sites deployment identify the final artifact and publication separately.

The engine source, compiled Wasm, save format, balance, prices, and upgrade effects are outside this update's change scope. [V1.03.1 acceptance](V1031_ACCEPTANCE.md) and [V1.03 acceptance](V103_ACCEPTANCE.md) remain historical evidence, not new runs of every prior check.

## Completed automated checks

| Check | Result | What it establishes |
| --- | --- | --- |
| `node tests/engine/wasm-smoke.mjs` | PASS | The shipped Wasm passes its engine smoke and contract checks. |
| `node tests/browser/v101-business-acceptance.mjs` | PASS | Existing business and one-pour acceptance remains valid against the compiled engine. |
| `node tests/engine/v102-balance.mjs` | PASS | Catalog/mode reachability, economy checks, and synthetic-career checks pass. These are not measured player performance. |
| `node tests/engine/v103-recipes.mjs` | PASS | Custom recipe behavior and legacy save migration remain compatible. |
| `node tests/browser/v102-ui-contract.mjs` | PASS | All 94 snapshot aliases and called Wasm exports match the engine contract. New startup controls exist outside the inert game background, removed welcome difficulty controls are absent, and save migration/conflict checks still pass. |
| `node tests/browser/v103-control-flow.mjs` | PASS | Intro/menu phases expose no pour or mode-selection action. Actual production input handlers retain Hardcore/Easy behavior and consume held native Enter/Space repeats across startup transitions without suppressing the first activation. |
| `node tests/browser/v1032-menu.mjs` | PASS | Actual boot/menu/storage functions with shipped Wasm protect saves before starting, restore the correct Continue phase, preserve cancellation, reject external conflicts before reset, and retain gameplay when storage is unavailable. Actual zoom listeners preserve single-touch/ordinary-wheel events while canceling supported zoom gestures. |
| `node tests/audio/music-lifecycle.mjs` | PASS | Music scheduling and mute lifecycle checks pass. |
| `node tests/audio/game-sounds.mjs` | PASS | Pour, fizz, and feedback-effect checks pass. This is not a subjective listening pass. |
| `node tests/browser/verify-offline-selftest.mjs` | PASS | Offline-verifier regression checks pass. |
| `python3 scripts/build.py` | PASS | Source builds into the standalone HTML bundle. |
| `node tests/browser/verify_offline.mjs dist/index.html` | PASS | The final bundle passes script/Wasm and offline resource verification. |
| `node --check tests/browser/v1032-menu.mjs` | PASS | The new acceptance suite parses in Node. |
| `git diff --check` | PASS | No whitespace errors in the inspected tracked diff. |

The new menu suite is included in the GitHub Actions workflow. These Node suites execute production functions with boundary shims; they do not simulate browser layout, focus, native click synthesis, or physical-device zoom behavior.

Checked standalone artifact: `dist/index.html`, **379,757 bytes**, SHA-256 **`6d05daf15b4f6f711248ae09048191a622c4f43a39d330295f1293773d6c775a`**.

### Save and phase evidence

- Boot, menu navigation, Settings, blur, and pagehide do not create or rewrite a career before the player chooses New Game or Continue.
- Fresh starts and confirmed resets begin at day 1, zero cash, an unselected recipe, and Hardcore.
- Continue covers untouched/preparing orders, unfinished Easy, interrupted Hardcore, paid cups, and closed days. It does not advance the customer or award another payment.
- The existing engine serializes an already-paid cup as settled liquid. Reloading a paid cup from its settling animation therefore resumes at Finished. A saved interrupted Hardcore hold commits once on restore and can resume through Settling.
- A V1.02 unfinished Easy fixture migrates only after Continue; the legacy storage entry is preserved.
- New Game cancellation preserves both the engine state and backing save, returning to the menu. Store restart cancellation still returns to the store.
- New Game, Continue, and confirmed reset check for a newer backing save before modifying engine state. Storage denial permits a fresh offline game and reports unavailable saving without a false conflict lock.

## Completed actual browser observations

Checks used the actual bundled Wasm in the managed browser. They establish observed browser behavior rather than physical-phone certification.

### Intro and main menu

- The intro and menu were visually inspected at **1280 × 720, 320 × 568, 390 × 844, and 568 × 320**. Artwork, menu controls, and text remained clear, with measured document overflow of **0 px horizontally and 0 px vertically**.
- Menu targets on the smallest inspected screen measured at least **44 px**.
- Native **Enter held for 1,100 ms** and **Space held for 1,100 ms** each moved from Intro to the main menu only. Neither held key activated the newly focused New Game/Continue control.
- Settings opened from the menu and returned to the menu.

### Settings and contained scrolling

- On the small phone viewport, expanding Controls kept scrolling inside the Settings body.
- An ordinary native wheel gesture moved that body's scroll position from **0 to 405 px**, while the close button remained visible.
- This checks the normal panel-scroll path with zoom guards present. It does not establish physical touch or pinch behavior on a phone.

### New and continuing businesses

- Fresh New Game entered **Hardcore, day 1, $0.00**.
- A recipe was prepared and poured using **one 2,300 ms Space hold**. Releasing it entered visible settling.
- A saved-business fixture showed **day 5 and $497.51**. Choosing New Game and canceling returned to the menu. Continue preserved that day and cash and allowed recipe preparation to advance.

## Release gate and publication boundary

The local environment reported `cargo: command not found`, so this record does not claim a local native Rust pass. The complete release gate is **GitHub CI on the exact source commit**, including native Rust tests and the committed-bundle/source consistency check. Its final status and the publication receipt are recorded on the PR.

PR checks and the Sites deployment record establish integration and publication separately. A saved source commit or a local test result alone does not establish which version is live.

## Limits

Native multi-touch gestures and physical iOS/Android hardware were not tested. The fixed-scale viewport and cancelable gesture handlers are implemented, but browser or operating-system accessibility settings can override zoom restrictions. This record does not certify universal zoom prevention.

The viewport measurements apply to the four sizes listed above. They do not guarantee containment under every text-enlargement setting, mobile browser chrome configuration, or viewport. Optional long instructions intentionally scroll within their own panel. This update makes no new subjective audio-quality, player-performance, or balance claims, and does not claim a broad accessibility audit.
