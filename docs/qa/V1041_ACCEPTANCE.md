# Perfect Pour V1.04.1 — acceptance evidence

## Scope and release gate

V1.04.1 removes the Ready confirmation, starts a pour on the first hold, gives Easy a separate Next soda / Serve action, and shows the review automatically beside the settled cup. The finished drink remains until explicit advancement. Optional receipt details return to that same cup. The counter reveals owned recipe choices as needed, selection feedback uses brief local animation, and upgrade explanations and business-management controls use compact disclosures.

**The local native, compiled-Wasm, JavaScript, packaging, and browser checks recorded below passed.** This is a presentation and input update: the Rust engine, save format **104**, **120-value** save buffer, **134-field** snapshot, scoring, recipe costs, and business prices remain unchanged from V1.04.

The required release gate is **GitHub CI on the exact source commit**, including native Rust tests and committed-bundle/source consistency. The [release manifest](../release-manifest.json), PR checks, and deployment records are the authoritative records for final source, CI status, and publication. This document records local acceptance and does not independently establish which version is live. Earlier [V1.04 acceptance evidence](V104_ACCEPTANCE.md) remains a historical record.

## Completed automated checks

| Check | Result | What it establishes |
| --- | --- | --- |
| `cargo test --offline --quiet --manifest-path engine/Cargo.toml` through the existing isolated toolchain | PASS | **52 native tests**, zero failures. This ran the native gate without rebuilding the unchanged Wasm. |
| `node tests/engine/wasm-smoke.mjs` | PASS | The shipped **44,961-byte** Wasm matches the **134-field** snapshot, **120-value** save buffer, and version-104 contract. |
| `node tests/engine/v104-mixtures.mjs` | PASS | **216 mixture mode-parity cases**, per-part attempts, interrupted and paid saves, component accounting, scoring, and legacy migrations. The deterministic progression exercised **240 customers**, including **86 mixed orders**. |
| `node tests/engine/v103-recipes.mjs` | PASS | Existing recipe preparation, ingredient availability, prices, scoring, and migration behavior. |
| `node tests/browser/v101-business-acceptance.mjs` | PASS | Existing business, reserve, single-pour, and payment behavior against the compiled engine. |
| `node tests/engine/v102-balance.mjs` | PASS | **6,048 catalog/mode cases** and the existing synthetic-career checks. These are simulation results, not measured human difficulty. |
| `node tests/browser/v102-ui-contract.mjs` | PASS | V104 UI snapshot aliases and called exports match the shipped Wasm; the save adapter preserves supported legacy and current state. The rendered-element contract includes the separate Easy action and inline review. |
| `node tests/browser/v103-control-flow.mjs` | PASS | Production input, frame, receipt-close, blur, and next-order functions exercise direct first holds, explicit Easy service, per-part ownership, visible settling, inline review, explicit Next, and cross-phase input guards. |
| `node tests/browser/v1032-menu.mjs` | PASS | Boot and Continue boundaries, cancellation, external-save protection, settings return, storage-unavailable behavior, mixed-order restoration, and existing zoom-listener logic. |
| `node tests/audio/music-lifecycle.mjs` | PASS | Music lifecycle and scheduling checks. |
| `node tests/audio/game-sounds.mjs` | PASS | Pour, fizz, and feedback-effect checks. Audio tests do not establish subjective listening quality. |
| `node tests/browser/verify-offline-selftest.mjs` | PASS | **14 offline-verifier regression cases**. |
| `python3 scripts/build.py` | PASS | Final source bundles into one standalone HTML file. |
| `node tests/browser/verify_offline.mjs dist/index.html` | PASS | The final bundle contains **eight scripts**, **one embedded Wasm module**, and **zero Wasm imports**, and passes offline resource/script verification. |

The three changed UI suites were rerun successfully during final integration. After the last storefront artwork adjustment, the standalone file was rebuilt, offline verification passed again, and the compact storefront was inspected again. The production-function harness uses DOM and event boundary shims; it does not establish native browser focus, click synthesis, pointer capture, rendered geometry, or physical touch behavior.

### Input and save regression coverage

The production handlers and shipped Wasm establish that selecting a base makes the first pointer hold or fresh Space press pour immediately. An invalid-base Space press cannot turn into a pour while still held. Even an immediate Hardcore press consumes its attempt; Easy primary presses always pour and pause, with no duration threshold selecting Serve.

Easy service rejects an active hold, a press that began while service was unavailable, and an untouched second mixed-soda part. A mixed Hardcore order still requires two fresh holds and saves the unpaid transition. Extra pointers cannot steal the active pour. Held Enter and Space, delayed clicks, and pointers begun during another input's hold cannot consume a later action. Blur clears a lost Enter-keyup guard, while fresh discrete input and assistive clicks remain available.

The actual frame path waits for visible settling before rendering the inline review and its feedback cue. Receipt details have no background Next action; their close callback returns to the same paid cup without replaying a cue or payment. Explicit Next advances one customer, and the last result closes the day once while leaving the next day's opening explicit.

Menu and save suites cover untouched preparation, either interrupted mixed component, the unpaid component transition, paid cups, and closed days. Genuine 101/102/103 fixtures retain their recorded legacy state through migration. Unsupported saves are rejected, and an externally changed save is protected before New Game, Continue, or reset mutates the engine.

### Final artifact identity

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/index.html` | 432,111 | `b133efdb7bf5d375236bbd3b37b3b61716696f14ed425e7d992e10358ec62fa7` |
| `engine/perfect_pour_engine.wasm` | 44,961 | `f6a5cd045aab69a685544afc130d1d6aefb4ae95288cc343e5efca97ac29fca5` |

A local size/hash check confirmed both identities. The Wasm is byte-identical to V1.04. A subsequent source change requires rebuilding and updating the standalone identity.

## Completed actual browser observations

These checks used the bundled game and its actual Wasm in the managed browser. Interaction checks were performed during V1.04.1 integration; the final storefront sizing received a further inspection after the last visual change. The observations establish the listed states and viewports, not physical-phone certification.

### Desktop direct hold and inline review — 1280 × 720

A fresh New Game began in Hardcore. Clicking Orange and then the requested cherry moved focus to Pour. A native **1,600 ms Space hold** started pouring directly and served on release. The same first customer remained while the cup settled into an inline **three-star** review: **$2.89** earned, with **60%** final fill against a **65%** target.

Opening receipt details and holding Enter on **Back to cup for 1,700 ms** returned to the finished cup without advancing. A fresh mouse click on Next advanced to customer two with cash unchanged. This confirms the automatic review, optional details, and explicit customer advancement in the browser.

### Desktop mixed-soda handoff and stale pointer — 1280 × 720

For customer six, a native **950 ms Space hold** poured Cherry. Release selected Cola while keeping the same customer and **$34.65** cash. A fresh **1,800 ms Space hold** poured the second part and served an underfilled drink; its **$0.45** loss reduced cash to **$34.20**.

A native pointer hold begun on the disabled Settling button lasted **6,000 ms**, spanning the transition to the finished result. Releasing did not activate Next: customer six and **$34.20** remained. This directly exercises the disabled-button transition that a handler-only harness cannot fully establish.

The following rectangles were identical between preparation and the first-part release:

| Element | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Cup canvas | 413.8125 | 206 | 396.125 | 415 |
| Gauge | 896 | 456 | 345 | 87 |
| Main action | 460 | 655 | 360 | 52 |

These are measurements at the compared states, not a claim that decorative button-press effects have no visual movement.

### Compact Easy preparation and release — 320 × 568

A **25/75** mixed order used an **11.25%** first guide and **45%** final guide. After switching to Easy and selecting the requested cherry, a native **300 ms pointer hold** poured the first part directly. Release paused at approximately **6%** without changing parts, advancing the customer, or paying.

After correcting an Easy footer-height collision, preparation and post-release geometry matched:

| Element | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Cup canvas | 85.546875 | 236 | 148.90625 | 156 |
| Gauge | 0 | 414 | 320 | 74 |
| Main action | 10 | 494 | 217 | 48 |
| Easy action | 234 | 494 | 76 | 48 |
| Combo strip | 10 | 545 | 300 | 18 |

The controls and combo remained unobscured. Inspected document overflow was **0 px horizontally and 0 px vertically**. During the integration check, a subsequent **100 ms primary tap** added soda from approximately 6% to 8% without serving. Holding Enter on the separate Next soda action for **1,500 ms** advanced to Cherry once and left its Serve action disabled until an attempt. A **1,700 ms Space hold** poured the second soda and paused on release; the separate Serve action then paid once, increasing cash from **$433.84 to $436.25**. The inline review showed three stars, **$2.41** earned, **82.1%** fill accuracy, and **92%** recipe-plus-mix accuracy. Production-function/Wasm tests cover the additional cross-phase guard branches.

### Fully unlocked recipe layouts

At **320 × 568**, selecting the requested Cola base revealed all three owned ingredient tiles and Light / Regular / Bold. The recipe tray occupied **x 9, y 328, width 302, height 160**. Base and ingredient rows measured **42 px** high and blend choices **36 px**. They stayed above the **48 px** primary action at y 494 with no overlap; the selected base had one decorative check mark.

At **568 × 320**, the same advanced recipe occupied **x 355, y 98, width 192, height 143**. Base and ingredient rows measured **40 px** and blend choices **34 px**. The main action occupied **x 124, y 269, width 320, height 44**. The screenshot showed no overlapping controls or document scroll. These measurements do not claim that every compact recipe option has a 44 px touch target.

### Paid cup restoration and compact storefront

At **320 × 568**, Continue restored a paid five-star fixture with **$46.09** cash. The inline review showed **five stars**, **$11.44** earned, **99.9%** fill accuracy, and **100%** Recipe + mix, with the golden cup treatment visible. This is a restored paid result, not a claim that a perfect drink was poured manually during this check.

In a purchase run, the Neon sign cost **$12** once: cash changed from **$46.09 to $34.09**, the sign reached level one, its illustration changed, and the next price became **$22**. The About information opened and closed. Business tools opened upward with Export, Import, and Reset reachable; the **568 × 320** store layout also showed no document overflow.

The final **320 × 568** storefront inspection confirmed the enlarged illustration at approximately **151.91 × 89 px**, the compact goal, and all financial figures. The upgrade card measured **300 × 152 px** at x 10, y 316. Its optional information stayed in a bounded scroll panel above the visible price, action, and status. The Counter helper card clearly displayed **+$0.30 tip**, **$1.50/day**, **Starts next day**, and **Hire $28** without overlap.

Business tools retained the Export, Import, and Reset accessible labels, with **52 px** action buttons inside the viewport. In a separate paid-fixture return check, Back to Pour restored customer six, **$46.09**, and the same five-star cup without repayment. The inspected final layouts had **0 px horizontal and 0 px vertical document overflow**.

## Verification limits

Browser layout evidence applies to **1280 × 720**, **320 × 568**, and **568 × 320** in the states above. It does not cover every viewport, text-enlargement setting, browser chrome arrangement, or physical device. Long optional settings, upgrade information, and receipt details may scroll inside their own panels.

Physical iOS/Android devices and native multi-touch gestures were not tested. Existing fixed-scale metadata and zoom handlers remain, with their event logic covered by the menu suite. Browser and operating-system accessibility settings can override page restrictions; this patch makes no universal zoom-prevention claim.

The native-browser observations do not independently replay every multi-input race, lost-keyup/blur path, legacy import through a file picker, or menu/settings variant. The production-function and Wasm suites cover those logical boundaries where listed. New Game, paid Continue, receipt return, and store return have the actual-browser evidence above.

There was no new subjective audio listening pass, measured player-balance study, physical-device certification, or broad accessibility audit. Reduced-motion guards remain in source, but this record makes no claim of a fresh full browser pass with that preference enabled. Exact-commit CI and deployment receipts remain separate from these local results.
