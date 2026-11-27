# Perfect Pour — V1.02

**[Play Perfect Pour online](https://perfect-pour.pretty-scarf-0591.chatgpt.site/)** · [Source repository](https://github.com/SiminanRoll/PerfectPour)

Fill the cup, earn a review, and build a neighborhood soda bar. V1.02 combines a larger illustrated pouring station, expressive customers, visible staff, and a growing storefront with pressure choices, meaningful operating costs, and a longer business progression.

The distributable is **`dist/index.html`**: one self-contained HTML file containing the compiled Rust/WebAssembly engine, interface, vector graphics, and synthesized music and effects. It is designed for offline play without an account, installation, frontend server, or runtime downloads. Rust, Python, and Node are development tools; players do not need them.

## Play a customer

Choose a pressure before touching the cup. Hold **Space**, or hold the **Pour** button with a mouse or touch. Watch the liquid, foam, and target marker.

**Hardcore is the default:** releasing commits and automatically serves that single hold. No second attempt or top-up is available. Even a very quick tap consumes the attempt. Pausing or leaving the window during a hold ends it.

**Easy:** release to stop, allow the foam to settle, and hold again to top up. Press **Enter** or **Serve Drink** when ready. Both modes use exactly the same fizz physics. Difficulty and pressure lock once the cup has been attempted.

After serving, the cup visibly settles. The finished drink stays until you select **See Review** or press **Enter**. Five-star cups receive a golden finish; reduced motion uses a static highlight. Waiting during this review cannot change the score or pay twice.

| Action | Control |
| --- | --- |
| Pour | Hold Space or the Pour button |
| Commit Hardcore / stop Easy | Release the same control |
| Serve Easy / review a ready cup | Enter or the displayed button |
| Pause / resume | P, Escape, or Pause |
| Shop | Build; Escape returns to the counter |
| Settings and help | Persistent speaker, music-note, and Help buttons |
| Keyboard navigation | Tab, then Enter on a focused button |

Music and effects have independent toggles and volume controls. The original background music, pouring sounds, fading fizz, reviews, purchases, and streak cues use browser audio synthesis.

## Pressure, foam, and skill

| Pressure | Flow compared with Classic | Tradeoff |
| --- | ---: | --- |
| Gentle | 0.55× | More time to judge the fill; less gas expansion; smaller speed tips |
| Classic | 1.00× | Standard timing and carbonation |
| Rush | 1.35× | Faster service, narrower timing, more foam and mess risk |

Gentle retains visible fizz. Every ordinary recipe/cup/target request has a five-star Gentle solution with starter equipment. The game does **not** filter out harder targets or give Hardcore different physics.

Four sodas have different carbonation. Four cups hold **280, 360, 460, and 330 mL**, so apparent height is misleading. Targets remain **45%, 55%, 60%, 65%, 70%, 75%, and 80%**. The side meter shows free liquid and foam separately; the target measures beverage, including soda trapped inside bubbles. Gas occupies headroom but is not soda.

The customer’s fill score is:

```text
clamp(100 − 350 × abs(final_beverage_fraction − target_fraction), 0, 100)
```

Five-, four-, three-, and two-star thresholds are **96, 88, 72, and 50**. Lower scores receive one star. Gas overflow does not masquerade as missing beverage: the game tracks actual beverage waste separately, charges ingredients, and charges bounded cleanup costs for mess.

Empty or severely failed drinks receive no sale. Other errors reduce the sale value. Operating costs can make a bad pour lose money, but cannot create debt or consume reserved payroll. A broke shop can still recover with a good next pour.

Customer patience begins with the **first hold**, so reading and preparation are free. Menus, mandatory settling, and review do not consume it. Speed tips decline during service; excessive delay also reduces sale value and loses secondary demand.

## Reviews and streaks

The shop starts at 3.5 stars. Each review updates reputation using **68% previous rating + 32% new review**. Reputation affects subsequent prices. Recipe and requested quantity determine menu price; signs and Hardcore increase base earnings. Hardcore adds **15% to base pay**, before fixed tips and milestone rewards.

Four- and five-star pours extend the streak; lower grades break it. Combo multipliers rise through **1.10×, 1.20×, 1.30×, 1.45×, 1.60×, 1.75×, and 1.90×**. Milestones pay **$0.75 at 3, $1.25 at 5, $2 at 8, $3 at 12, $4 at 16**, then **$5 every four good pours from 20 onward**. Five stars also earn a $0.25 perfect tip.

Streaks continue across days. Switching difficulty resets the current streak while retaining separate Hardcore and Easy records. Sustained good play earns more than repeatedly resetting early milestones.

## Build the business

Purchases use earned cash. Prices below are per level, not cumulative. All nine upgrade types change gameplay as well as the illustrated shop.

| Upgrade | Level prices | Actual benefit |
| --- | --- | --- |
| Sign | $12 / $22 / $36 | +8% base price and +2 daily secondary demand per level |
| Patio | $18 / $30 | +2 specialist capacity, +3 demand, +1 second patience per level |
| Awning | $14 / $24 | +2 seconds patience and +$0.10 on good pours per level |
| Tap | $18 / $30 | 20% less foam **gas** and 15% lower cleanup cost per level |
| Helper | $28 | Half cleanup work/cost; +$0.30 on good pours; $1.50 daily wage |
| Specialist | $42 | Serves separate queued orders; $2.50 daily wage |
| Interior | $100 / $180 / $300 | +4 specialist capacity and demand per level; larger premises |
| Catering | $140 / $240 / $400 | +8 demand and +12% staff sale value per level |
| Training | $50 / $85 / $130 | +2 specialist capacity, +20% service rate, +6% staff sale value per level |

Sign prices, awning, and tap effects can apply to an untouched current cup. Additional demand, patio, employees, interior, catering, and training become operational next day. Catering requires an interior and specialist; training requires a specialist. Purchases cannot change an already committed receipt.

The specialist works a separate lane during player service, up to daily capacity and demand. Staff never top up your cup. Training speeds their work; seating and premises give them more capacity. Menus and idle order reading do not produce staff sales. Each new day contains **12 manual customers**, with additional customers handled by staff.

Wages are reserved before purchases and deducted once at closing. The ledger separates sales, ingredients, cleanup, wages, and net earnings. Refunds show foregone sale value, **not another deduction from cash**. Capital purchases are separate from operating net. All upgrades together cost $1,899.

## Save and move your business

V1.02 keeps a separate browser save and automatically imports the earlier V1.01 business. Older game tabs cannot replace the new save. If another V1.02 tab updates the same business, the older tab pauses and offers **Load latest save**.

Autosave records business checkpoints and active pours. Use **Build → Export save** for a portable JSON backup; **Import save** validates it before replacing the current business. Browser storage availability can vary, particularly for directly opened files.

V1.02 exports version **102** and imports versions **101 and 102**. Existing cash, upgrades, reviews, and completed payments survive migration. Older 14/16-customer days finish with their existing goal; the following day uses 12 manual customers.

A restored attempted V1.02 Hardcore cup commits its saved contents once, without a fresh attempt. An unfinished Easy cup resumes stopped in Easy, then returns to Hardcore after that customer. Other restored saves default to Hardcore. Paid reviews cannot pay again. Legacy V1.01 unfinished saves retain their original untouched-checkpoint behavior.

## Build and verify

Rebundle the included Wasm with Python 3:

```sh
python3 scripts/build.py
```

To rebuild Rust first:

```sh
rustup target add wasm32-unknown-unknown
python3 engine/build_engine.py
python3 scripts/build.py
```

The helper runs native tests and builds the dependency-free Rust crate. The interface uses no frontend package manager. Run the included checks from the repository root:

```sh
cargo test --manifest-path engine/Cargo.toml
node tests/engine/wasm-smoke.mjs
node tests/engine/v102-balance.mjs
node tests/browser/v101-business-acceptance.mjs
node tests/browser/v102-ui-contract.mjs
node tests/audio/music-lifecycle.mjs
node tests/audio/game-sounds.mjs
node tests/browser/verify-offline-selftest.mjs
node tests/browser/verify_offline.mjs dist/index.html
```

The inherited `v101-business-acceptance` filename now tests V1.02 through actual Wasm. It and the UI contract checks are **not browser playtests**. Balance evidence covers 2,016 mode/pressure/recipe/cup/target/tap fixtures and seeded career simulations; synthetic timing profiles are not measured player performance.

See [release notes](docs/V102_RELEASE.md), [acceptance evidence](docs/qa/V102_ACCEPTANCE.md), [engine integration](engine/README.md), and [machine-readable contract](engine/contract.json). Direct `file://` portability is packaging-verified rather than browser-playtested. Narrow phone-layout checks do not certify physical devices. The release record identifies the exact published build; pushing source to GitHub does not itself deploy the Sites game.
