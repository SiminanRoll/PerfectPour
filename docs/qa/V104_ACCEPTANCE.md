# Perfect Pour V1.04 — acceptance evidence

## Scope and status

V1.04 adds occasional two-soda ratio orders, two cumulative fill guides, one hold per soda in Hardcore, per-part Easy top-ups, component-aware fizz and cost accounting, proportion scoring, and version-104 saves. The visual integration reuses the current customer ticket, preparation row, meter, primary action, and three review metrics. Existing single-soda orders, the V1.03.2 intro/menu, and mobile zoom controls remain.

**The local native, compiled-Wasm, JavaScript, packaging, and actual browser checks below passed.** Native Rust tests ran through the project's existing isolated toolchain. GitHub CI on the exact source commit is still the final release gate at the time of this record; its outcome and the publication receipt belong to the PR and deployment records.

This is an acceptance record, not a deployment receipt. The [release manifest](../release-manifest.json), exact-commit PR checks, and Sites deployment identify final integration and publication separately. Earlier [V1.03.2 acceptance](V1032_ACCEPTANCE.md) remains historical evidence for the opening screens and zoom checks, rather than a claim that every earlier manual check was repeated here.

## Completed automated checks

| Check | Result | What it establishes |
| --- | --- | --- |
| `python3 engine/build_engine.py` | PASS | The existing isolated toolchain built the Wasm and passed **52 native Rust tests**. Native mixture coverage includes **3,024 Gentle cases** across twelve ordered soda pairs, three proportions, four cups, seven targets, and three tap levels. |
| `node tests/engine/wasm-smoke.mjs` | PASS | The shipped module matches the engine contract, including its **134-field snapshot**, **120-value save buffer**, and save version **104**. |
| `node tests/engine/v104-mixtures.mjs` | PASS | **216 mode-parity pours** exercise every ordered soda pair, all three proportions and pressures, retained beverage, settling, and overflow. Additional checks cover accounting, per-part attempts, interrupted saves, malformed imports, legacy migration, and generated progression. |
| `node tests/engine/v103-recipes.mjs` | PASS | Existing recipe preparation, ingredient availability, prices, scoring, and prior save migration remain compatible. |
| `node tests/browser/v101-business-acceptance.mjs` | PASS | Existing business, single-pour, reserve, and payment behavior remains valid against the compiled engine. |
| `node tests/engine/v102-balance.mjs` | PASS | **6,048 single-soda catalog/mode fixtures** and **48 synthetic careers** pass. The refreshed careers include both single and mixed orders. Their limits are described below. |
| `node tests/browser/v102-ui-contract.mjs` | PASS | **104 UI snapshot aliases** and called exports match the shipped Wasm contract. The production save adapter accepts the supported legacy formats and current mixture state. |
| `node tests/browser/v103-control-flow.mjs` | PASS | Production pointer/keyboard handlers retain single-soda behavior and the per-part mixture action sequence. Input ownership prevents a releasing gesture from consuming the next action. |
| `node tests/browser/v1032-menu.mjs` | PASS | Existing boot, menu, Continue, cancellation, external-save protection, storage-unavailable, and zoom-listener checks pass with the updated save format. |
| `node tests/audio/music-lifecycle.mjs` | PASS | Existing music scheduling and mute lifecycle checks pass. |
| `node tests/audio/game-sounds.mjs` | PASS | Existing pour, fizz, and feedback-effect checks pass. This is not a subjective listening pass. |
| `node tests/browser/verify-offline-selftest.mjs` | PASS | Offline-verifier regression checks pass. |
| `python3 scripts/build.py` | PASS | The final source bundles into one standalone HTML file. |
| `node tests/browser/verify_offline.mjs dist/index.html` | PASS | The final bundle passes offline resource and script verification: **eight scripts**, embedded Wasm, and **zero Wasm imports**. |

The mixture suite is included in GitHub Actions. After the final spoken-feedback wording change, the standalone bundle was rebuilt and its offline verifier, startup/menu suite, and production input-handler suite passed again. Node UI harnesses execute production functions with boundary shims; they do not establish native browser rendering or physical-device behavior.

### Local artifact identity

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/index.html` | 402,319 | `8505abd7f2c868804ecdd2a14a713a007b6643254b1c2ed480c97d8c948b4075` |
| `engine/perfect_pour_engine.wasm` | 44,961 | `f6a5cd045aab69a685544afc130d1d6aefb4ae95288cc343e5efca97ac29fca5` |

These identify the final local artifact inspected for this record. A later source change requires rebuilding and updating the artifact identity before publication.

## Engine, accounting, and migration evidence

The first mixed order is customer six and requests equal shares of distinct sodas. The first base is preselected without starting preparation time. A deterministic 240-customer progression includes both single and mixed orders, introduces quarter shares only after twelve completed manual customers, keeps mixed requests at Regular blend with at most one simple add-in, and retains five-star reachability.

The first guide equals `finalTarget * firstShare`; the second equals the final target. The whole-cup attempt flag keeps recipe, pressure, mode, and purchase locks in force between parts, while a separate per-part flag preserves the remaining hold budget. Duplicate releases cannot consume an untouched second part. Easy top-ups remain on the current part until explicit advancement.

Each soda keeps its own foam and entrained-beverage pool and settling rate. The parity suite confirms identical relevant physics and scores in Hardcore and Easy, including overflow. Proportions use the first soda actually retained in the glass, including beverage trapped in foam. A correct final fill with an incorrect ratio loses mix grade; a correct ratio with underfill loses fill grade. Overall stars take the minimum of fill, recipe, and mix grades.

The first release does not score, charge, pay, increment completed customers, extend a streak, or grant staff income. Final service commits one receipt. Subsequent settling changes visible liquid/foam only; review, cash, and mixture results stay fixed. Repeated paid-save restores cannot replay the sale.

Save migration checks cover supported versions 101, 102, and 103. Five genuine V103 fixtures were exported from the released engine before rebuilding: preparing, interrupted Hardcore, unfinished Easy, already paid, and staffed closed day. Their restore results retain **all 124 original snapshot fields**, current recipes, and ledger state. They do not acquire retroactive two-soda requests or charges.

V104 restores an interrupted first Hardcore part at its untouched second part without payment. Saving and restoring that waiting state does not consume the remaining hold. An interrupted final part commits once. Easy restores stopped on the current part. Validation rejects impossible soda IDs, unsupported ratios, component inconsistencies, nonzero reserved fields, and forged paid grades atomically.

## Completed actual browser observations

The checks used the actual bundled Wasm in the managed browser. They establish observed browser behavior at the listed viewports, not physical-phone certification.

### Desktop Hardcore mixture — 1280 × 720

The inspected order requested **50% Cherry, 50% Cola**, with a final fill target of **75%**.

- A **3,300 ms Space hold** poured the first part. Releasing advanced to Cola only; cash stayed at **$34.65**, and the same customer remained.
- A fresh **3,250 ms Space hold** poured the second part. Final release committed once, with cash then **$41.67**.
- Foam remained visible, settled, and led to the golden finished cup. The game waited for an explicit review action.
- The review reported actual **49/51** versus requested **50/50**, **98.8** fill accuracy, **98%** Recipe + Mix, and five stars.

The cup canvas and primary button retained their layout rectangles through the first-part transition:

| Element | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Cup canvas | 414.3 | 206 | 395.2 | 414 |
| Primary button | 460 | 654 | 360 | 53 |

The button's existing 4 px pressed translation was the only transient position effect. Switching sodas caused no layout jump or customer replacement.

### Compact portrait Easy mixture — 320 × 568

The unequal request used **25% Orange, 75% Cherry**, with a final cup target of **45%**. Its intermediate target was therefore **11.25% of cup capacity**.

- A **500 ms first hold**, followed by a **250 ms top-up**, stayed on the first soda in Easy.
- A quick tap on **Next soda** advanced to part two.
- A **1,400 ms second hold** followed by a serving tap committed the drink.
- The intentionally inaccurate result showed **37/63** against the requested **25/75**, a **75% Recipe + Mix** score, and **three stars**. The incorrect proportion was visible in the review.
- Preparation, active pouring, and review were inspected with **0 px horizontal and 0 px vertical document overflow**. The primary action and visible boxes stayed within the viewport.

### Compact landscape restored part — 568 × 320

Continuing a saved second-part Hardcore order restored the same customer at **$34.65** without consuming another attempt or charging again. The active bottle, second-part target, and primary action were visible. All inspected boxes remained inside the viewport, with **0 px horizontal and 0 px vertical document overflow**.

## Economy sensitivity report

The refreshed [balance report](../../engine/balance-report.json) uses the compiled Wasm, Gentle pressure, and sixteen seeded careers for each timing profile. Each soda component receives an independent Gaussian timing error. The simulated player chooses the correct recipe immediately and buys the cheapest affordable available upgrade after each completed cup until all twelve upgrade types and levels are purchased.

| Timing standard deviation per component | Manual customers to buy the full catalog | In-game days |
| --- | ---: | ---: |
| 0 ms | 88–92 | 8 |
| 70 ms | 91–103 | 8–9 |
| 150 ms | 132–149 | 11–13 |

The full catalog remains **$1,953**, and the first purchase occurred after two or three manual customers in these scenarios. These are reproducible sensitivity results, not forecasts of human skill or play time. Recipe preparation is instantaneous in the simulation; menu and review time is excluded. Classic and Rush catalog values are nominal-hold diagnostics, not searched optimal-score ceilings.

## Release gate and limits

The final release gate is **GitHub CI on the exact source commit**, including native Rust tests and committed-bundle/source consistency. CI completion and publication were pending when this record was written. The PR and deployment receipt establish those outcomes separately; local checks alone do not establish which version is live.

Physical iOS/Android devices and native multi-touch gestures were not tested. Existing fixed-scale metadata and zoom handlers remain, but this update makes no new claim of universal zoom prevention. Browser and operating-system accessibility settings can override page restrictions.

Layout evidence applies to the three inspected sizes. It does not cover every text-enlargement setting, browser chrome configuration, or viewport. Long optional settings and receipt details may scroll within their own panels. This update does not claim a subjective audio-quality pass, measured player balance study, or broad accessibility audit.
