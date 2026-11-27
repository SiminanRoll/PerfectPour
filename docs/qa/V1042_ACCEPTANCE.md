# V1.04.2 — touch capture release repair

## Report and baseline

The user reported that **Next customer** did nothing after a completed cup on iPhone Safari. The supplied screenshot showed customer 1/12, $4.12, a settled cup, and an enabled Next customer button.

The source baseline was GitHub main `b99fa4dafd77c79e50c6961fcf1a9283ee6cee29`, tree `1776350bf7e7046ac72e044f37ad68863bfec31e`. The opened Sites source was `25c46de2de831f1fcf15d32501bcced49e19392b`, with the same tree. The currently published release was V1.04.1, Sites version 9. The local EVO router selected Perfect Pour and the shared Mr. Pancake engineering skill but could not contact GitHub; authoritative source freshness was independently verified through the GitHub connector and Sites source helper.

## Cause and bounded repair

V1.04.1 bound both `pointercancel` and `lostpointercapture` to the same cancellation handler. The normal touch sequence is `pointerdown` → `pointerup` → `lostpointercapture` → `click`. The capture-loss callback cleared the completed primary press, so the click guard rejected Next. This affects the same button's Close day and Open next day roles as well.

The [Pointer Events specification](https://www.w3.org/TR/pointerevents3/#implicit-release-of-pointer-capture) describes implicit capture for direct-manipulation pointers and its release after pointerup. The bug was also reproduced in the current production handlers and in native browser events; the diagnosis does not depend only on the specification.

The matching pointerup now marks its primary press released. A separate capture-loss callback retains that completed press until click. Capture loss before pointerup and actual pointercancel still invalidate the gesture. Pour interruption, phase ownership, stale-click blocking, keyboard activation, and assistive activation retain their existing rules.

This release changes JavaScript input handling, the displayed version, tests, documentation, and the generated standalone bundle. It does not change Rust/Wasm, save format 104, scoring, recipes, prices, graphics, audio, or layout.

## Reproduced failure and automated verification

Before the production patch, `node tests/browser/v103-control-flow.mjs` failed with:

```text
AssertionError: touch Next survives normal implicit capture loss between pointerup and click
actual: 0
expected: 1
```

The same suite passes after the patch. It derives the callback actually bound to `lostpointercapture`, extracts the production input functions, and runs them against the shipped Wasm. New coverage includes:

- Touch and pen Next from restored, already-paid cups; customer advances exactly once, cash and completed-sale counters do not change.
- Touch and pen Close day followed by Open next day, using the production day-opening function and engine.
- Duplicate clicks, unrelated pointers, early capture loss, real cancellation, and a fresh valid tap after cancellation.
- Interrupted Hardcore pours, normal Easy releases, and late events carried over from settling or a Space-owned pour.

Existing keyboard, mixture, direct-pour, minimum-settling, receipt, and input-ownership cases continue to pass.

Other local checks passed:

```text
node tests/browser/v102-ui-contract.mjs
node tests/browser/v1032-menu.mjs
node tests/engine/wasm-smoke.mjs
python3 scripts/build.py
node tests/browser/verify_offline.mjs dist/index.html
git diff --check
```

The UI/menu suites verify existing save migrations and paid-cup Continue without duplicate payment. The offline verifier confirms eight inline scripts parse and the embedded Wasm validates without imports. The complete existing CI remains the release gate; its exact tested SHA, result, merge readback, and deployment receipt are recorded in the release PR.

## Native browser observations

Managed Chromium loaded the actual standalone bundle inside a 390 × 844 iframe. An unshipped QA wrapper used isolated earned-progress saves and requested native pointer capture on a primary-button pointerdown. This reproduces the capture sequence normally implicit on a touchscreen while retaining native browser pointerup, capture-loss, and click dispatch. It neither calls game actions nor synthesizes click events.

| Scenario | Observed result |
| --- | --- |
| V1.04.1 paid mixed cup, customer 6, $46.09 | A native captured click logged `pointerdown:finished → pointerup:finished → lostpointercapture:finished → click:finished`. The customer remained stuck. |
| V1.04.2, the same restored cup and captured click | Trace ended `click:preparing`. Customer advanced from 6 to 7; cash remained $46.09 and the six-pour streak remained. The next recipe was visible. |
| V1.04.2 final paid cup of day 6, $811.93 | Captured Close day reached the day summary once. Existing $4.00 wages settled to $807.93. |
| V1.04.2 day summary | A fresh captured Open next day reached day 7, customer 1/12, with $807.93. The gesture did not start a pour. |

The inspected portrait finished, preparation, and summary states had zero document overflow. The temporary wrapper was removed before packaging.

## Artifact and evidence limits

The standalone HTML is **432,535 bytes**, SHA-256 `689a06f9c1a37d64664a487e87a928df0e0c3c9c7780854df7c8a79dac1655c8`.

The unchanged Wasm is **44,961 bytes**, SHA-256 `f6a5cd045aab69a685544afc130d1d6aefb4ae95288cc343e5efca97ac29fca5`.

The source and native-event reproduction establish the repaired event boundary. They do not constitute a physical iPhone/Safari, Android, stylus, or multitouch test. No new visual redesign, subjective listening assessment, direct-file play session, or broad accessibility audit was performed. Existing presentation evidence remains in [V1.04.1 acceptance](V1041_ACCEPTANCE.md).

Existing saves remain compatible. Reloading the updated game and choosing Continue restores the paid cup, from which a fresh Next customer gesture can advance. Resetting the business or clearing browser storage is unnecessary.
