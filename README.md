# Perfect Pour — V1.01

**[Play Perfect Pour online](https://perfect-pour.pretty-scarf-0591.chatgpt.site/)** · [Source repository](https://github.com/SiminanRoll/PerfectPour)


One good pour can make someone's day. A whole streak can build your soda bar.

**Perfect Pour** is a standalone browser game about filling customers' cups to the right level, earning better reviews, and investing the proceeds in a neighborhood soda business. V1.01 adds a default one-attempt Hardcore mode, a visible foam meter, combo rewards, a growing storefront, upgrades, employees, and a business that continues across days.

## Download and play

Download **Perfect_Pour_V1_01.html** and open it in a modern browser. On Windows, double-click the downloaded file; if it opens in an editor, use **Open with → Microsoft Edge** or **Google Chrome**. The source bundle also includes the same playable build as `dist/index.html`.

The entire game is inside that HTML file: its compiled Rust/WebAssembly engine, code, styles, illustrations, and synthesized audio. Playing requires **no frontend hosting, local server, account, installation, or internet connection**. You do not need Rust, Python, or Node to play. Keep the HTML file wherever you keep your games.

This is a separate V1.01 release. The original V1 release remains separate; its HTML and original source have not been replaced.

## The two pour modes

### Hardcore — the default

Hold **Space** or the yellow **Pour** button to begin pouring. **Release once, and the drink automatically serves.** That is the entire attempt: no second press, no topping up, and no separate Serve step. A quick tap still uses the attempt.

Hardcore pays **15% extra base order earnings**. This premium is included before combo rewards; fixed tips and milestone bonuses are added separately.

Pausing, opening the storefront, or leaving the game window while holding a Hardcore pour ends that pour and serves it. The game will not keep pouring in the background or grant a fresh attempt after an interruption.

### Easy — room to practice

Choose **Easy** before beginning a cup. Hold to pour, release to stop, let the foam settle, and top up as often as you like. Click **Serve Drink** or press **Enter** when ready. Easy uses normal base pay.

The mode is locked once a cup has been started. Changing modes between customers resets the current streak. Fresh launches and restored saves always select Hardcore; you can choose Easy again before the next untouched cup.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Pour | Hold the yellow Pour button | Hold Space |
| Release in Hardcore | Release to commit the drink and watch it settle | Release Space |
| View the finished cup’s review | See customer review, after foam settles | Enter |
| Release in Easy | Release to stop; another hold can top up | Release Space |
| Serve in Easy | Serve Drink | Enter |
| Change mode before pouring | Hardcore / Easy above the counter | Tab to the mode button, then Enter |
| Visit the storefront | Your soda bar | Tab to the tab, then Enter |
| Return from the storefront | At the counter / Back to the counter | Escape |
| Pause / resume | Pause / Back to the counter | P or Escape |
| Mute / unmute | Speaker button | Tab to the speaker, then Enter |
| Next customer or next day | Continue button on the result screen | Tab to the button, then Enter |

Space and Enter activate a focused menu or utility button normally. They do not also pour a drink behind that button. There is no countdown or waiting penalty.

## Reading the cup and foam meter

The dotted line on the cup marks the requested **beverage volume**. Different cup shapes have different capacities, so their apparent height is not a reliable guide to how much soda they hold.

The ticket's side meter now stacks two separate quantities:

- **Liquid** is the free soda currently in the cup.
- **Foam** is the volume occupied by bubbles and the small amount of beverage trapped in them. It has a cream-colored hatch pattern and a separate percentage.

The target marker remains visible on the meter. Foam takes up real space and can spill before the liquid alone reaches the rim. Both modes use the same foaming, settling, and overflow physics. The final fill counts soda trapped in the foam; gas does not count toward the customer's requested fill.

In Hardcore, release commits and automatically serves your one pour. The cup and meter remain visible until the foam settles out of view. The finished cup then stays on screen until you choose **See customer review** or press **Enter**. A five-star pour gets a golden rim, gentle glass glint, and small sparkles; reduced-motion settings use a static highlight. Foam keeps settling naturally instead of disappearing on release, and the receipt reports **Settled fill**. The pour is already locked and paid: waiting cannot change its score or award another payment.

Every existing target from 45% to 80% can appear with any soda or cup. Requests are no longer filtered to guarantee a spill-free uninterrupted pour. High-fill, high-fizz orders can force a tradeoff between underfilling and overflowing; tap upgrades reduce the foam pressure. Easy retains the option to pause, settle, and top up.

## Music and sound

A quiet original instrumental loop plays while the shop is open: warm chords, soft bass, and a lightly swung melody. It starts after you open the shop, pauses with the game or when you leave the window, and uses no external audio files or network connection.

The **music-note button** toggles background music. The **speaker button** controls pouring and review sounds separately. Both settings are remembered on this device, so you can keep either one on independently.

Four sodas have distinct carbonation: **Sunset Orange, Cherry Pop, Lime Lift, and Midnight Cola**. Four illustrated cup shapes hold **280, 360, 460, and 330 mL**. The game chooses target levels that its one-pour physics can reach without requiring an overflow.

## Reviews, pay, and combos

Accuracy depends on the difference between requested and served beverage, plus a spill penalty:

```text
accuracy = clamp(100 − 350 × abs(served_fraction − target_fraction)
                    − 200 × spilled_volume / cup_capacity, 0, 100)
```

| Accuracy | Review |
| ---: | --- |
| 96–100 | 5 stars; perfect-pour tip |
| 88–less than 96 | 4 stars |
| 72–less than 88 | 3 stars |
| 50–less than 72 | 2 stars |
| Below 50 | 1 star |

The shop starts at **3.5 stars**. Each customer updates it using `68% previous shop rating + 32% new review`. A poor review can be recovered through later good service. The next customer's reputation multiplier is `0.6 + 0.2 × shop rating`: 0.80× at one star and 1.60× at five stars.

Each order locks its reputation multiplier when that customer arrives. The current pour's accuracy affects that customer's payout; its review changes later customers' prices. Upgraded signage and Hardcore also increase base earnings.

### Consecutive good pours

Four- and five-star reviews extend the streak. A lower review breaks it. Combo rewards increase the base portion of the payout:

| Current streak | Base-pay multiplier | Extra cash at this exact milestone |
| ---: | ---: | ---: |
| 0–1 | 1.00× | — |
| 2 | 1.10× | — |
| 3 | 1.20× | $1.00 |
| 4 | 1.20× | — |
| 5 | 1.30× | $2.00 |
| 6 | 1.30× | — |
| 7 | 1.40× | — |
| 8 | 1.40× | $4.00 |
| 9+ | 1.40× | — |

Each five-star pour also earns a **$0.25 perfect-pour tip**. Milestone bonuses pay once when a streak reaches 3, 5, or 8; reopening the result does not pay again. A new streak can earn those milestones again. Streaks can continue across day boundaries, but changing modes resets them.

For developers, base payout is rounded to cents from:

```text
250 × locked_reputation_multiplier × (1 + 0.05 × sign_level)
    × mode_multiplier × (0.4 + 0.006 × accuracy)
```

The mode multiplier is 1.15 for Hardcore or 1.00 for Easy. Combo earnings, milestone bonuses, perfect tips, and service tips appear separately in the result breakdown.

## Build your soda bar

Open **Your soda bar** between pours. The illustrated storefront changes as you upgrade the sign, add patio seating, improve the awning, install taps, and hire staff. Upgrades have actual gameplay effects as well as visible changes.

Prices below are the cost of each additional level, not cumulative totals.

| Upgrade | Purchase cost | Effect | When it begins |
| --- | --- | --- | --- |
| Sign | $12 → $22 → $36 | +5% base order price per level, up to +15%; improves the storefront sign | Next untouched order |
| Patio seating | $18 → $30 | +2 player customers per day per level: 12 → 14 → 16 | Next day |
| Awning | $16 → $28 | +$0.15 tip per level on four- or five-star pours, up to +$0.30 | Next untouched order |
| Tap equipment | $24 → $42 | 20% less foam gas per level, up to 40%; preserves the beverage amount | Next untouched order |
| Counter helper | $35 recruitment | +$0.35 on three-, four-, or five-star pours; $1.50 wage per active day | Next day |
| Soda specialist | $55 recruitment | Two passive staff sales per active day; $2.50 wage per active day | Next day |

An order that has arrived but has not been poured is still untouched: eligible purchases can apply to it. Purchases are blocked once that cup's attempt begins. Buying from a result screen affects subsequent orders; it does not alter a payout already awarded.

The specialist's two sales are settled at closing. Their combined gross revenue is calculated from two $2 base sales, the closing shop rating, and the current sign level. They do not use the player's pour combo or Hardcore premium.

### Cash, wage reserves, and day boundaries

**Available to spend** is cash after reserving wages owed for the current open shift. The reserve prevents you from spending money already set aside for active employees. It is not an extra fee: wages are deducted **once**, at closing. Staff sales and wages are itemized in the day summary.

New hires appear in the storefront immediately but begin working the next day. Newly purchased seating also changes the next day's customer count rather than extending the current shift halfway through. Employees remain hired on later days and receive their stated wage each active day.

Starting another day keeps your **cash, shop rating, upgrades, staff, streak, and career records**. Day earnings, average accuracy, and the count of that day's completed customers start fresh. The initial day has 12 player customers; fully upgraded seating raises later days to 16, with the specialist's two sales handled separately.

## Save, export, and restore

The game attempts to save business progress in the current browser after customers, purchases, and other business checkpoints. The storefront reports whether saving succeeded. Sound preference is also stored locally.

Browser autosave is **best effort**, especially when an HTML file is opened directly from disk. Private browsing, storage restrictions, clearing browser data, and moving or renaming the HTML file can affect it. A session remains playable if browser storage is unavailable.

For a portable backup:

1. Open **Your soda bar → Export save**.
2. Keep the downloaded `Perfect_Pour_Day_…_Save.json` file.
3. Open this V1.01 game on another browser or computer and choose **Import save**.
4. Select the JSON file and confirm replacement of the currently open business.

The save format is `perfect-pour-business`, version **101**. Import validates the file and engine state; incompatible or damaged saves are rejected. These are V1.01 business saves, not V1's older personal-best records.

Restoring always selects **Hardcore**. A cup that was unfinished restarts empty with no payout for that unfinished attempt. Completed reviews stay completed and do not pay twice. An Easy-mode streak resets when restored into Hardcore; other saved business progress is retained. Use **Start a new business** only when you intend to reset the current business; the game asks for confirmation.

## Rust, WebAssembly, and source builds

The dependency-free Rust crate in `engine/src/lib.rs` owns pouring physics, single-attempt enforcement, scoring, reviews, earnings, combos, purchases, employees, day progression, and save-state validation. JavaScript handles input, rendering, synthesized sound, browser storage, and the interface. There is no JavaScript substitute for the gameplay engine.

`scripts/build.py` embeds the compiled module, both stylesheets, character and storefront SVG code, and browser code into one HTML file. It does not require a frontend package manager or development server.

### Rebuild only the HTML

With Python 3 installed, run from the project root:

```sh
python3 scripts/build.py
```

This uses the included precompiled `engine/perfect_pour_engine.wasm` and writes `dist/index.html`. That file can be renamed to `Perfect_Pour_V1_01.html` for distribution.

### Rebuild the Rust engine and HTML

With Rust installed through rustup, add the WebAssembly target once and run:

```sh
rustup target add wasm32-unknown-unknown
python3 engine/build_engine.py
python3 scripts/build.py
```

The engine helper runs native Cargo tests, builds the optimized `wasm32-unknown-unknown` release, and copies it to `engine/perfect_pour_engine.wasm`. It uses Cargo from `PATH`, or the isolated `engine/.toolchain` development installation when that fallback exists. The compiler and build directory are not needed to play or distribute the HTML.

The crate uses Rust edition 2021 and no third-party Rust crates. V1.01's exported API, 65-number live snapshot, 80-number save buffer, units, and upgrade definitions are documented in **`engine/contract.json`**, with explanatory material in `engine/README.md`. Snapshot index 64 reports the final beverage volume; existing snapshot indices and version 101 saves remain compatible.

### Run the included checks

From the project root, with Node and Rust installed as applicable:

```sh
cargo test --manifest-path engine/Cargo.toml
node tests/engine/wasm-smoke.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/audio/music-lifecycle.mjs
node tests/browser/verify_offline.mjs dist/index.html
node tests/browser/verify-offline-selftest.mjs
```

Release acceptance is described in `docs/qa/V101_ACCEPTANCE.md`; the V1.01 release record is `docs/V101_RELEASE.md`. The preview browser available during development blocks direct `file://` URLs, so direct local-file launch is not claimed as browser-tested. Offline portability is checked from the packaged artifact, while actual interface checks use the same HTML through an HTTP preview. A narrow browser viewport check is not a physical-phone certification.

## Project layout

```text
engine/                  Rust source, API contract, build helper, and compiled Wasm
web/                     HTML, styles, input, canvas rendering, and vector artwork
scripts/build.py         Single-file offline release bundler
tests/                   Native/Wasm, packaging, and acceptance checks
docs/                    Release notes and QA records
dist/index.html          Ready-to-play self-contained build
```

**Perfect Pour V1.01** · Single-file offline soda-bar game

## Repository and online publishing

The source repository is [SiminanRoll/PerfectPour](https://github.com/SiminanRoll/PerfectPour). The repository is public. Its CI validates Rust, the compiled Wasm, and the bundled HTML on each push. The public game is published with Sites; the exact Site identity is in `.openai/hosting.json`. The standalone HTML at `dist/index.html` is the same build used online. Download that file from GitHub for offline play.

For an optional future move to GitHub Pages, see [the setup guide](docs/GITHUB_PAGES.md). Publishing to GitHub source does not by itself trigger a Sites deployment.
