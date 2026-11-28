# Perfect Pour V1.07 — Neighborhood growth

This release builds on V1.06.2's stable five-ingredient counter and bounded ice rotation.
It does not introduce a second game loop or change hold/release controls.

## Daily specials
The chalkboard features one of the four sodas each day, in rotation. A customer
whose requested base matches the board counts toward the challenge only if the
finished drink earns four or five stars. The first two successful specials pay
$0.25 each, and the third pays $1.50. The challenge is capped at three per
day, resets at the next shift, and cannot trigger on staff side-lane orders.
The featured drink and stamp progress appear in the counter scene, with
compact text on phones. Earnings appear separately on the receipt and daily
financial summary, but are included only once in cash/gross.

## Returning regulars
From the second day onward, three customer slots per shift feature recurring
regulars, Ruth, Cleo, Maya and Sasha. The identity is deterministic from the
day and customer slot, without changing existing customer recipe RNG.
Four- or five-star drinks build their individual loyalty from zero to five,
granting a 20¢ + 10¢ per previous stamp tip. Reaching a fifth stamp once
adds 80¢. Lower ratings lose one stamp. Their faces and names remain stable
across visits and their personal loyalty is retained in the business save.

## Visible upgrades
The shop overview continues to show equipment purchases, and the serving
counter now reflects the owner's accumulated investments with stronger
signage, warmer furnishings and finishes, more visible interior details and
staff at their stations. Upgrades remain the existing twelve-item catalog,
with unchanged costs and unlock rules. The starter counter is not dim or empty.

## Business save safety
V1.07 writes `perfect-pour-business-v107`. Existing V106, V104, V103,
V102 and V101 career keys are read-only migration sources. Source keys remain
in storage after a new V107 save is written. V107 keeps 120 floating-point
save fields and appends four loyalty scores, three current-receipt/challenge
values and two shift totals to reserved slots 106–114. Reserved 115–119 remain
zero. Restoring paid cups never re-grants income. Prior purchases and cash
migrate unchanged. No retroactive loyalty or special tips are awarded.

## Verification
Run native Rust tests, all compiled-Wasm gameplay tests, plus
`node tests/engine/v107-tycoon.mjs` and
`node tests/browser/v107-tycoon-ui.mjs`.
The CI pipeline also rebuilds `dist/index.html` from current source.
Visual positioning requires an additional physical-device playtest.
