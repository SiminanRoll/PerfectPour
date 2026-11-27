# Perfect Pour V1.01 — acceptance matrix

This checklist defines release acceptance. Results belong in the release record; an unchecked item is not a passing result.

## Hardcore and Easy

- A fresh launch defaults to **Hardcore**. The selected mode and its rule are visible before pouring.
- Hold Space or the pour button once, then release: the drink is automatically served and one review/payout is recorded.
- Pointer release followed by lost-pointer-capture cannot award two payouts or start another attempt.
- A second input source (pointer plus keyboard) cannot extend or restart the same Hardcore pour.
- A very short click is still one attempt; a second click cannot top it off.
- Mode changes are rejected after the current pour has started. The UI explains a disabled mode control.
- Pause, blur, storefront entry, and restart follow one consistent interruption rule without granting another attempt.
- **Easy** permits repeated hold/release/top-up cycles and requires manual Serve.
- Enter/Space on focused utility buttons perform their native button action instead of pouring or serving accidentally.

## Meter and rewards

- The side bar stacks liquid and foam separately, with both values and the requested target marked.
- The meter's total fill agrees with the visible cup and remains bounded by its capacity after spills.
- The marker and cup use the same volume mapping for every cup shape.
- Good pours grow a streak; a poor pour breaks it. The displayed combo and reward match credited cash.
- Milestone bonuses pay once per qualifying milestone. Reopening a review never pays again.

## Business progression

- Cash can buy a real upgrade, decreases by its quoted cost, and cannot go negative.
- Unaffordable and maximum-level purchases are disabled and rejected by the engine.
- Purchased signage, seating, awning, and equipment visibly change the storefront and affect the advertised game rule.
- Employee recruitment changes the staff roster and the storefront. Benefits begin on the documented day.
- Customer-count changes take effect at the next day boundary, not partway through an already established shift.
- Staff sales and wages appear in the day summary and are applied exactly once.
- Starting another day retains cash, shop rating, upgrades, staff, and career records while resetting day-only counters.

## Save and standalone delivery

- Review and purchase checkpoints survive reopening without duplicate rewards or purchases.
- A malformed, truncated, negative, or non-finite save fails safely without corrupting the playable game.
- Storage denial leaves a playable session and a truthful save-status message.
- Exported progress can be imported into the new downloaded release when that feature is present.
- Desktop controls, a narrow layout, full-shift completion, and the storefront purchase flow are checked through the supported browser route.
- The final HTML passes the offline-package verifier and contains its compiled Rust engine and all assets.
- Direct `file://` launch is not claimed as browser-tested: the cloud browser prohibits that protocol. Do not attempt an alternative browser or execution path to bypass the block.

