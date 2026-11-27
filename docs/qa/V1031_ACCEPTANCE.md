# Perfect Pour V1.03.1 — acceptance evidence

## Scope and status

The V1.03.1 change consolidates the interface for compact phone and desktop screens. It covers the viewport shell, header, phase-specific recipe tray, concise copy, Help, review and summary presentation, and paged upgrades. It does not change Rust simulation, compiled Wasm, game balance, or version-103 saves.

**The final candidate passed the automated and browser checks listed below.** This is an acceptance record, not a deployment receipt. Publication is recorded separately by the PR checks and Sites deployment; the [release manifest](../release-manifest.json) identifies the final source and artifact. [V1.03 acceptance](V103_ACCEPTANCE.md) remains historical evidence, not a new run of every engine, balance, audio, or save test.

## Completed automated checks

| Check | Result | What it establishes |
| --- | --- | --- |
| `node tests/browser/v102-ui-contract.mjs` | PASS | Authored renderer targets and UI structure remain compatible with the current engine adapter, save contract, and primary-action slots. |
| `node tests/browser/v103-control-flow.mjs` | PASS | Phase policy and production pointer/keyboard handlers preserve one-attempt Hardcore, Easy tap/hold behavior, and gesture boundaries. |
| `node tests/browser/verify_offline.mjs dist/index.html` | PASS | Eight inline scripts parse; the embedded Wasm validates without imports; resource tags and styles require no server, companion files, or network assets. |
| `git diff --check` | PASS | No whitespace errors in the final inspected tracked diff. |
| Engine/source scope inspection | Unchanged | No changes to Rust engine source, compiled Wasm, save schema, or the existing phase-policy module were present in the inspected diff. |

The UI contract, production-handler, offline, and diff checks were rerun after the final layout adjustment. These Node suites do not model browser layout, hit testing, focus, or native-device behavior.

Checked standalone artifact: `dist/index.html`, **354,595 bytes**, SHA-256 **`4d3b6285c49bb145dfe906a3a409b2eb51b8e02a3a35b31d174c288aedee6b4f`**.

## Completed actual browser observations

Checks used the managed browser preview of the game. They establish the observed browser behavior, not physical-phone certification.

### Compact customer service

- At **320 × 568**, a Tall cup with a Light custom recipe was prepared and poured using one timed Space hold.
- Releasing the hold visibly entered foam settling. The finished cup remained available for an explicit review action.
- Read-only rectangle measurements showed the **canvas and primary button had exactly the same baseline positions before and after release**. The aiming view did not shift when the hold ended.
- The active screen had no page overflow. The review fitted the same compact viewport without scrolling.
- Advanced Tall-cup preparation was checked at **1280 × 720, 1366 × 768, 768 × 600, 390 × 844, 375 × 667, 320 × 568, 844 × 390, and 568 × 320**. Essential elements remained inside the viewport, with measured document overflow of **0 px horizontally and 0 px vertically**. The small landscape screenshot was also visually inspected.
- At **390 × 844**, Easy mode was played with native pointer input: a **1,000 ms** hold paused on release, a subsequent **600 ms** hold added liquid, and a quick tap committed the drink. Visible settling and explicit review followed. The canvas and primary action stayed in place throughout these transitions.

### Build and purchases

- All **12 upgrade types** were reached using the catalog pager.
- The lounge purchase on page 7 changed cash from **$498.08 to $398.08**, ownership from **level 0 to level 1**, and the next price to **$180**. The catalog remained on the same page.
- Store geometry was inspected across **eight viewport sizes**, spanning compact phones through **1366 × 768** desktop and including **568 × 320** landscape. The observed document, upgrade card, and management panel had no overflow.
- This matrix exposed a separate issue: larger screens could remain on a single-card page after resizing. After the resize/ResizeObserver adjustment, actual browser checks passed through **one → two → four → one** visible card. At **1440 × 900**, all four cards fitted without card scrolling and the screenshot was visually clear. Measurements waited for the responsive page-size attribute to update after its animation-frame boundary.

### Help and settings

- Default Help content fitted the compact screen.
- Expanding the instructions confined scrolling to the Help body. The footer action stayed visible.
- The final Help text was inspected at **14 px**, with a clear screenshot and no collisions.
- Audio controls and the existing app-icon download remain in Help. This update does not claim a new icon-download verification or subjective listening pass.

### Reviews, receipts, and closed-day summaries

- At **320 × 568, 568 × 320, and 844 × 390**, expanded review receipts and day ledgers retained visible actions inside the viewport, with measured **dialog overflow of 0 px**. Only the optional detail body scrolled when its content needed more room.
- Collapsed day summaries had **0 px body overflow** at all three sizes. Closed reviews also had no body overflow in both landscape sizes.
- The final **320 × 568** review recheck measured **315 px client height and 315 px scroll height**, for **0 px body overflow**. Its screenshot showed no scrollbar and all content remained clear.

## Publication boundary

The PR checks and Sites deployment record establish source integration and publication separately from this candidate's local verification. A saved source commit or passing offline verifier alone does not establish which version is live.

## Limits

Physical iOS/Android hardware, browser chrome changes on actual mobile devices, native pinch-zoom behavior, and a broad accessibility audit have not been tested in this update. Screen containment must not be interpreted as a promise that enlarged browser text or every possible viewport will require no scrolling. Optional long explanations may scroll inside their own panel. No new player-performance, balance, or audio-quality claims are made.
