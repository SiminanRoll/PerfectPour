# V1.06 production acceptance

This record covers promotion of the reviewed V1.06 counter to the canonical
GitHub main branch and the existing public Perfect Pour Site. The prior
[preview acceptance](V106_PREVIEW_ACCEPTANCE.md) remains the evidence for
the unchanged visual rendering, engine and browser behavior.

## Production migration checks

The current production-function and compiled-Wasm suites passed:

- `node tests/browser/v102-ui-contract.mjs`
- `node tests/browser/v1032-menu.mjs`
- `node tests/browser/v103-control-flow.mjs`

The migration suite contains six genuine V104 saves generated with the
released V1.04.2 Wasm. They cover a funded day-four preparation, unfinished
Easy cup, paid cup, interrupted first and second mixed-soda portions, and a
paid mixture. Restoration compares all 134 original snapshot fields.

Verified behavior:

- Current V106 progress takes precedence over V104, V103, V102 and V101.
- Existing cash, upgrades, orders and payment state survive migration.
- Legacy entries remain unchanged and begin with zero ice.
- Boot, Settings and menu visits do not write a migrated career.
- Continue writes version106 into `perfect-pour-business-v106`.
- Duplicate Continue and paid-cup restoration do not pay twice.
- Replacing existing progress still requires the in-game confirmation.
- Another tab's newer V106 save prevents a stale migration from overwriting it.
- Audio settings use the established `perfect-pour-v1-settings` key.
- Existing primary pointer/keyboard and mixed-order phase guards still pass.

## Build and release

The release removes preview labels, retains the original public Site ID,
and removes obsolete V1.05 photographic runtime assets and tests. The
standalone HTML is rebuilt from the production adapter; the release manifest
records its hash and the unchanged V1.06 engine hash.

Publication uses a normal commit above the existing canonical main head.
The GitHub tree must exactly match the source tree used to package the Site.
GitHub Actions and native Sites deployment records provide the final remote
CI and publication outcome.

No additional visual or physics changes were made during promotion. The
phone-sized browser views in the earlier acceptance record are not physical
phone certification, and audio lifecycle checks are not a listening test.
