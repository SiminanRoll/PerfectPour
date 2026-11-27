# Perfect Pour V1 release record

## Authorized result

A simple standalone browser game, Rust preferred, in which a customer requests a cup fill level. Different cup shapes and soda carbonation make the pour challenging. The player's accuracy and spills determine the customer's review; the shop's resulting rating changes earnings from later customers. The user authorized completion through V1.

## Delivered scope

V1.0.0 implements a 12-customer shift, four cups and sodas, Rust/WebAssembly simulation, actual-liquid scoring, review-weighted future pricing, illustrated customers, responsive pointer/keyboard controls, pause, optional synthesized sound, a final summary, and local best-shift storage. The game is delivered as one self-contained HTML file with a complete source bundle. No hosted application or external repository was created.

## Verification evidence

| Check | Result |
| --- | --- |
| Native Rust simulation suite | PASS: 12 tests |
| Real compiled-Wasm smoke | PASS: no imports; foam, spills, price feedback, 12 reachable targets, shift completion |
| Engine perfect-shift simulation | PASS: 12 perfect pours, 4.985 final rating, $45.68 |
| Actual HTML package | PASS: 2 inline scripts; valid embedded Wasm; no companion resources or network calls |
| Desktop browser interaction | PASS: mouse/keyboard holds, serve, 5-star result at 99% accuracy/$3.23, rating 3.5 to 4.0, next price 1.40× |
| Poor-pour and spill path | PASS: bad reviews and lower next-customer multiplier observed |
| Browser full shift | PASS: all 12 customers, result screens, final summary, best-shift notice |
| Pause/resume and restart confirmation | PASS in browser |
| 390 × 844 narrow layout | PASS: inspected and played through a customer review |
| Direct file URL browser launch | NOT TESTED: cloud-browser URL policy permits HTTP/HTTPS only |
| Physical touch device / Safari / Firefox | NOT TESTED in this environment |

The desktop browser full-shift acceptance intentionally included poor pours to exercise downward reputation and completion. It is distinct from the engine's successful perfect-shift simulation.

## Corrections made during acceptance

- Input elapsed time is processed at both animation frames and input transitions, preventing a throttled renderer from shortening a held pour.
- The target marker uses the same volume-to-height mapping as the actual liquid for all cup shapes.
- Opening a modal stops pouring and makes the background inert; keyboard focus remains in the active dialog.
- Review payouts occur once, and a held key cannot automatically continue into a new order.
- Focused utility buttons preserve native Enter/Space activation instead of triggering the game's pour/serve shortcuts.
- The desktop playfield fills the available height; the narrow-layout fizz ticket stays clear of the liquid level.

## Persistence and rollback

The release HTML and full source bundle are the V1 checkpoint. The included precompiled WebAssembly allows HTML regeneration without reinstalling Rust. Revert an edit by restoring these V1 files. Browser best-score data is optional and independent of the source. No live service, account, infrastructure, or production game was changed.

## Next development boundary

V1 is complete at the local deliverable stage. Further levels, shop upgrades, native executables, cloud saves, and distribution channels require a later requested scope. They are not necessary to play this V1.
