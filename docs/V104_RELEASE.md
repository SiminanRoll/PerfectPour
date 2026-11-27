# Perfect Pour V1.04 — two sodas, one custom drink

V1.04 adds occasional two-soda orders to the existing counter. Customers request half-and-half mixes first, then quarter-and-three-quarter combinations. Two illustrated bottle chips show the recipe, and colored, numbered lines guide both pours without adding another control panel.

## Pour the proportions

The first five customers remain single-soda orders. Customer **six** introduces a 50/50 mix; later mixtures appear roughly one time in three. After twelve completed manual customers, the requested shares can be 25/75, 50/50, or 75/25. Mixed orders use two distinct sodas, Regular water blend, and at most one simple garnish or syrup addition. They require no new upgrade.

The first soda is selected automatically without starting the patience clock. Prepare the garnish, choose Ready to pour, and follow the numbered bottles. The first target is measured against the requested final amount: a half-and-half drink filled to 70% uses lines at **35% and 70%**.

**Hardcore still defaults on.** It allows one hold per soda. Releasing the first hold changes the tap and active target; releasing the second serves the complete drink. The cup and primary button stay in place through the switch. Each part requires a fresh hold, so a repeated release cannot skip the second soda.

**Easy keeps top-ups.** Release pauses the current soda. A short tap or Enter advances to the next soda, or serves after the final part; holding the same button tops up the current part. Space pours directly. Once the next soda begins, the earlier part stays committed.

## Fizz, color, and honest reviews

Both fill guides remain visible, with the active guide emphasized. The stream uses the current soda's color, and the drink blends gradually as the second soda enters. Each soda retains its own flow, foam, entrained beverage, and settling rate. Hardcore and Easy share those physics.

The review now measures recipe, final fill, and retained soda proportions. A perfect fill with the wrong proportions receives a lower grade. **Recipe + Mix** occupies the existing recipe metric, and a compact detail compares the actual mix with the request. Spoken review feedback distinguishes fill accuracy from mixture accuracy as well.

Final foam still settles visibly before the finished cup waits for review. Five-star drinks keep their golden finish. Switching sodas does not replace the customer artwork, award a review, or pay early.

## Business and save continuity

Mixed orders add a **$0.60 menu premium** and weight the base price by the requested shares. Liquid ingredient costs reflect how much of each soda was actually poured, including waste. The cup, add-ins, payment, and staff work are accounted for once when the complete drink is served.

V1.04 exports save version **104** and imports versions 101–104. The save buffer remains 120 values; the runtime snapshot appends ten mixture fields for 134 total. Existing V103 recipes stay single-soda, and older careers retain their progress and paid receipts.

An interrupted first Hardcore part restores at the untouched second soda without payment. An interrupted final part commits once. Easy restores stopped on its current part, and paid cups cannot pay again. Five genuine V103 save fixtures preserve all 124 original snapshot fields under the new engine's restore path.

The illustrated intro, basic main menu, compact layout, icon download, audio controls, and mobile zoom handling remain. The complete game is still the self-contained `dist/index.html` file.

## Verification status

The isolated project toolchain built the dependency-free Wasm and passed **52 native Rust tests**, including 3,024 Gentle mixture cases. The new compiled-Wasm suite passed **216 mixture mode-parity pours**, interrupted-save and accounting checks, malformed-save rejection, and a generated 240-customer progression. All existing engine, input, startup/menu, audio, balance, and offline-verifier suites passed locally.

Actual browser checks covered **1280 × 720, 320 × 568, and 568 × 320**. They exercised a five-star Hardcore mixture, unequal Easy proportions and top-ups, an intentionally incorrect mix review, and a restored second part. The inspected compact views had **0 px document overflow**. Physical phones and native multi-touch were not tested.

The [acceptance record](qa/V104_ACCEPTANCE.md) records the measured results, limits, and final local artifact hashes. GitHub CI on the exact source commit remains the release gate; the PR and deployment receipt establish subsequent integration and publication. This document records the completed local work and does not itself certify that this artifact is live.
