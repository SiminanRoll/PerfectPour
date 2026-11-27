# Perfect Pour V1.01 — release record

## Deliverable

**`Perfect_Pour_V1_01.html`** is the standalone playable release. The source bundle contains the identical built document at `dist/index.html`. Download the HTML and open it in a modern browser; players need no server, frontend hosting, runtime installation, account, or internet connection.

The original V1 release remains preserved separately. V1.01 adds a persistent business without overwriting the original game's artifact or source directory.

## What changed

### A single, decisive pour

Hardcore is the default: hold Space or the Pour button once, then release to automatically serve. The Rust engine enforces a single attempt and rejects a second pour. Even a very short tap counts. Hardcore adds 15% to base earnings.

Easy restores repeated pours, foam-settling time, top-ups, and manual serving with Enter or Serve Drink. Mode selection locks after a cup begins; switching modes between customers resets the streak. Pausing or leaving the window during a Hardcore hold ends and serves the current pour.

### Foam in the side meter

The ticket now displays stacked liquid and foam, a distinct cream hatch for foam, both percentages, and the requested target. The cup and meter reflect occupied volume. Serving scores settled beverage: entrained soda counts, gas does not, and spills still reduce accuracy. The meter stays visible in the phone layout.

### Combo rewards

Four- and five-star pours extend the streak. The base-pay multipliers are 1.10× from two consecutive good pours, 1.20× from three, 1.30× from five, and 1.40× from seven. Exact milestones at three, five, and eight add $1, $2, and $4. Every five-star pour adds a $0.25 perfect tip. Result screens separate base pay, combo earnings, milestone bonuses, and service/perfect tips.

### A storefront and a continuing business

The new storefront view depicts the same shop growing from a modest neighborhood bar into an equipped, decorated business with a patio and employees. Purchases visibly change its sign, awning, patio, taps, and staff.

| Purchase | Additional level prices | Gameplay effect |
| --- | --- | --- |
| Sign, three levels | $12 / $22 / $36 | +5% base order price per level |
| Patio seating, two levels | $18 / $30 | +2 player customers per level beginning next day |
| Awning, two levels | $16 / $28 | +$0.15 per level on four- and five-star pours |
| Tap equipment, two levels | $24 / $42 | 20% less foam gas per level, preserving beverage |
| Counter helper | $35 | +$0.35 on three-star-or-better pours; $1.50 wage per active day |
| Soda specialist | $55 | Two passive staff sales per active day; $2.50 wage per active day |

Hires and seating take effect next day. Other upgrades apply to the next untouched order, including a customer already waiting whose pour has not begun. Purchases are blocked during an attempted cup.

Shop rating, cash, owned upgrades, employees, streaks, and career records continue across days. Daily counters reset. The helper and specialist are recruited once and paid on each day they work. The game reserves the current shift's owed wages when calculating spendable cash; closing records passive sales and deducts wages once. The specialist's sales depend on closing reputation and signage, with no player combo or Hardcore premium.

### Business saves

Browser autosave checkpoints preserve the business when storage is available. The UI reports storage failure instead of claiming a save succeeded. Export and import provide portable JSON backups in `perfect-pour-business` format, version **101**.

Restoring selects Hardcore. An unfinished cup restarts empty without awarding a payout; a completed review remains paid. Restoring a saved Easy session clears its streak when returning to Hardcore. Import validates the file and engine data before replacing the playable state. Browser local storage for downloaded HTML files varies, so exported backups are the reliable way to move progress between files, browsers, or computers.

## Implementation and packaging

- Dependency-free Rust engine compiled to embedded WebAssembly; Rust crate version `1.0.1`, public game version **V1.01**.
- Engine-owned single-attempt enforcement, mode lock, rewards, upgrades, wage accounting, day closure, and save validation.
- `engine/contract.json` defines the V1.01 API, 65 `f32` snapshot fields, 80 `f64` save slots, units, and upgrade costs.
- Canvas cup/foam rendering and self-contained SVG customer/storefront illustrations.
- Embedded styles, scripts, Wasm, and synthesized audio; no remote assets, external fonts, analytics, or required runtime services.
- `python3 scripts/build.py` rebuilds `dist/index.html` from the included precompiled engine.
- `python3 engine/build_engine.py` runs native tests and rebuilds the engine with an installed `wasm32-unknown-unknown` Rust target.

## Fizz and music correction — November 26, 2026

Hardcore now leaves real foam in the served cup. The committed-pour view shows the same settling physics as Easy in both the cup and meter until the foam falls below the drawing threshold. The finished cup then remains on screen until the player chooses **See customer review**; there is no timed jump to the receipt. Five-star cups receive a golden rim, glass glint, and subtle sparkles, with a static reduced-motion alternative. The release has already locked and paid the cup: further presses cannot top it up, change its result, or pay again. The receipt uses the final beverage amount, including soda trapped in foam while excluding gas.

The target filter has been removed. All seven existing targets from 45% to 80% remain available with every soda, cup, and tap level. High-fill, high-fizz orders can require a tradeoff between underfilling and overflow; a perfect uninterrupted pour is not guaranteed on every order. Easy retains stop/settle/top-up play. Physics and spill penalties are identical between modes, and equipment reduces foam rather than changing the request.

A quiet original 16-bar instrumental loop adds warm chords, soft bass, and a lightly swung melody. A separate music-note button controls it independently from the speaker button for sound effects. Settings survive reload; music stops for pause/help, hidden documents, or window blur. The loop is synthesized locally with no external files or requests.

The live snapshot adds `beverageMl` at index 64. The 80-number version 101 save format is retained. Paid reviews save an already settled cup, preserving cash, upgrades, staff, ratings, and duplicate-payment protection.

### Correction checks

| Check | Result |
| --- | --- |
| Native Rust engine | PASS — 32 tests, including complete target availability, mode parity, stop timing, high-fizz overflow, compatible saves, and business rules |
| Actual compiled Wasm | PASS — both integration scripts; 384 generated orders in the smoke run, all soda/cup pairs, equipment comparisons, Easy top-up advantage, and no duplicate payment |
| Hardcore interface | PASS — real Space hold/release retained 8% foam on Cherry and 30% foam on Cola after release; a second press during the committed view left cash and served count unchanged |
| Finished cup and manual review | PASS — an actual Lime pour moved from 42% liquid/19% foam to 45% liquid/0% visible foam; a second Space held for 5.5 seconds did not skip the cup or alter cash/count. Golden five-star cup observed; Enter opened the review; help returned to the same cup |
| Easy interface | PASS — two holds and explicit Serve produced a 100% review, with visible foam retained at service |
| Old save compatibility | PASS — prior Day 2 business, $3.32, sign, patio, helper, and 14-customer shift loaded; later paid review restored without paying twice |
| Audio controls | PASS — music and effects toggled independently; preferences survived reload; narrow-layout music control and pause/resume worked |
| Music lifecycle regression | PASS — mocked Web Audio checks for no autoplay, one scheduler, fading/cancellation, rapid toggles, context suspension, and bounded looping/cleanup; not an auditory listening check |
| Responsive layout | PASS — 390 × 844 iframe, music control, foam meter, pause, and pointer hold/release checked |
| Standalone package | PASS — five embedded scripts, self-contained Wasm with zero imports, and 14 verifier regression cases |

Current artifact sizes and hashes are recorded in `docs/release-manifest.json`. The earlier verification table below is historical and is not the checksum for this corrected build.

## Original V1.01 verification record

Results below were recorded before the fizz and music correction. The former one-hold fairness requirement has been removed because it filtered out the difficult orders the player wanted. The acceptance matrix is `docs/qa/V101_ACCEPTANCE.md`; its checklist alone is not proof of a pass.

| Check | Final result |
| --- | --- |
| Native Rust simulation and economy tests | PASS — 28 tests, including 4,608 one-hold fairness simulations |
| Actual compiled-Wasm smoke and invariants | PASS — engine smoke and independent business acceptance; all 16 soda/cup pairs and all tap levels |
| Embedded module and offline dependency verifier | PASS — 28,762-byte Wasm, zero imports; styles, SVG art, scripts, and audio embedded |
| Offline verifier regression/self-tests | PASS — 14 lexical and dependency cases |
| Hardcore one-attempt, auto-serve, and interruption behavior | PASS — actual Space hold/release, mouse+Space overlap, and pause during a hold produce one review |
| Easy repeated pours and manual serving | PASS — two mouse holds increased the same cup, followed by explicit Serve |
| Meter, rewards, and mode locking | PASS — separate live foam segment; mode controls locked after pour; 10-pour browser streak paid milestones at 3, 5, 8 |
| Purchases, employee activation, wages, and next day | PASS — browser bought sign, patio, helper; Day 2 had 14 customers and $1.50 wage reserve. All 11 upgrade levels bought through UI in an engine-earned fixture |
| Save/export/import, reload, and malformed-data behavior | PASS — browser export/import round trip restored Day 2, $3.32, upgrades and helper; reloaded paid review did not pay again; malformed data covered by engine tests |
| Desktop and narrow-layout actual interface checks | PASS — desktop and 390×844 wrapper; tallest rim clears foam meter; storefront and controls remain usable |
| Final HTML byte count and SHA-256 | 174,133 bytes · `247c37e97c35e2b00d519765d474757aeaa8f3b7be75c98ecbb7abb907dac6d1` |

### Test-environment limit

The available preview browser blocks direct `file://` URLs. Direct local-file launch is therefore not represented as browser-tested. Static offline/package checks establish that the release embeds its runtime and assets; actual interface checks use that same HTML through an HTTP preview. A responsive viewport check does not certify a physical phone or every browser's downloaded-file storage behavior.

## Player-facing limits

This version has one soda-bar location, four sodas, four cup shapes, six upgrade categories, and two employee roles. Progression is local; there is no account or cloud sync. Employees produce the effects stated in the shop, rather than simulating autonomous visible pours. Days contain 12 player customers initially, up to 16 with seating; the specialist's two sales settle separately at closing.

There is no time limit, rent system, debt, stock purchasing, or additional branch management in this release. New businesses begin at 3.5 stars. Poor reviews lower later prices but good service can rebuild them.

## Online publication

The user subsequently authorized online publication and supplied `SiminanRoll/PerfectPour`, then made that repository public. The same self-contained build is published with Sites. Source pushes and live publishing are separate operations; the optional GitHub Pages guide explains a future Pages deployment.

The live game was verified at https://perfect-pour.pretty-scarf-0591.chatgpt.site/ with a real Hardcore hold/release: 99% accuracy, five stars, and one $3.97 payment. GitHub CI passed for the release upload.
