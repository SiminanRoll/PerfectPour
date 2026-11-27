# Perfect Pour V1.02 — acceptance evidence

## Scope and release gates

These results cover the V1.02 build before publication. [The manifest](../release-manifest.json) identifies the exact artifact; remote CI and deployment history provide the subsequent release evidence.

## Automated checks — passed

| Check | Evidence |
| --- | --- |
| Native Rust suite | 31 tests covering attempts, physics, scoring, business accounting, progression, and restoration |
| Wasm smoke and business acceptance | Shipped compiled engine exercised through its exported API; the inherited `v101-business-acceptance.mjs` filename now checks V1.02 |
| Balance matrix | 2,016 fixtures across recipes, cups, targets, tap levels, pressures, and modes; matching physics between Hardcore and Easy |
| UI/engine contract | 68 snapshot aliases, required DOM targets, real Wasm save adapter, score-boundary labels, and actual persistence functions |
| Save protection | Separate write key, legacy fallback, stale-tab conflict handling, explicit reload, and playable storage-denial behavior |
| Music and effects | Clocked lifecycle tests, distinct cue structures, foam-tail decay, suspension, and source/timer cleanup |
| Offline packaging | Embedded resources verified; 14 regression cases exercise the verifier |

Commands and integration details are in [the README](../../README.md#build-and-verify). UI-contract checks are not browser interaction tests or an accessibility audit. Audio tests do not establish the subjective quality of the audible mix.

### Balance results

The [machine-readable report](../../engine/balance-report.json) records engine SHA-256 `cd1c87f18c753019aeccf37a638d12e1eee1f93e1a9ca901e32fdb8db61dbb0f`.

At nominal hold times, Gentle achieved five stars in **336/336** catalog cases, with visible foam ranging from **5.87 to 57.91 mL** and no beverage loss. Classic achieved **331/336** five-star results and had 17 spill cases; Rush achieved **308/336** and had 51 spill cases. Classic/Rush results are nominal-hold diagnostics, not searched optimal score ceilings.

Forty-eight seeded Gentle careers bought the complete catalog in **97–101 pours** with exact timing, **103–109** with 70 ms timing standard deviation, and **139–155** with 150 ms deviation. First purchases occurred after 3–4 pours. These are synthetic sensitivity scenarios, not measured player completion times. An empty-cup career earned zero gross across 120 cups and ten days.

## Actual browser play — observed locally

The supported Chromium browser exercised the embedded HTML through the managed HTTP preview. No hidden engine-state injection was used for these plays.

- A Hardcore Cola pour visibly settled from 43% liquid plus 16% foam to a 45% final fill, earned 99.7% and five stars, and retained its golden cup until manual review. The receipt reconciled to **$8.31 net**.
- A 250 ms phone-pointer attempt severely underfilled an Orange order, broke the streak, reduced reputation from 5.0 to 3.7, and lost **$0.17**. Holding Space across settling neither restarted the pour nor skipped the finished cup.
- Easy accepted two holds and explicit Serve. Its 98.1% five-star cup earned **$2.80 net**; a service-related price reduction was correctly distinguished from a full refund. Effects could be muted during settling independently of music.
- Navigating toward Build during a held Hardcore pour committed it and kept settling visible. It did not hide or replace the committed cup.
- A full legacy 14-customer day closed with **$112.54 sales − $3.43 ingredients − $1.50 wages = $107.61 operating profit**. The next day used 12 manual customers.
- A specialist completed a real side order. **$68.93 + $7.49 + $10.36 + $4.64 − $0.55 = $90.87 cash** reconciled player net, staff gross, and staff ingredients. Training, tap, and awning purchases left the **$4.00 payroll reserve** protected and changed visible artwork.
- Two simultaneous tabs demonstrated conflict protection: advancing the primary tab paused the stale tab; **Load latest save** restored the newer guest and cash without overwrite.
- Constrained 320- and 390-pixel layouts showed the cup, foam meter, and primary controls together. The final 320-pixel recheck confirmed 14-pixel difficulty labels, an unobstructed customer card, and review controls within the 844-pixel frame. Scrolled desktop Build retained its header, navigation, and utility controls. Help and independent volume controls were exercised.

## Limits

Narrow iframe layouts do not certify physical phones. Direct `file://` launch was packaging-verified, not browser-playtested. No human listening session, broad device/accessibility audit, or measured player study is claimed. Local preview play did not reset or modify the public site's saved business.
