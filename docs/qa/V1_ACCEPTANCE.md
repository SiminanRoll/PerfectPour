# Perfect Pour V1 acceptance

The release is a single offline HTML file. Static packaging, Rust engine checks,
and actual browser interaction prove different parts of the result. Record what
was exercised; do not treat this checklist itself as a completed test.

## Required release checks

| Area | Observable acceptance |
| --- | --- |
| Offline package | Open the delivered HTML directly from local storage. No companion files, CDN, fonts, image requests, backend, or hosted frontend are required. The embedded Wasm validates and inline scripts parse. |
| First play | Start instructions explain hold to pour, release to settle, and serve. Target level, soda identity, customer number, money, and review rating are readable. The first pour is approachable. |
| Pointer input | Hold the pour control to fill, release to stop. Release outside the control, pointer cancellation, window blur, and opening pause all stop pouring. |
| Keyboard | Space pours and releasing Space stops. Repeated keydown does not create duplicate actions. Navigating to a new customer while Space was held does not silently pour into their cup. |
| Touch | The pour control is a comfortable touch target. A touch drag/release does not keep pouring or scroll the page into a stuck state. Serve and pause remain reachable on a narrow screen. |
| Foam | High-carbonation soda produces visibly more foam. Foam settles when the control is released. Foam is visually distinct from actual liquid; the order's target marker remains visible. |
| Cup geometry | The drawn liquid level and target use the same capacity-to-height mapping. A visually wider cup does not simply inherit the other cup's fill percentage. |
| Accuracy | An accurate liquid level earns a better score than a major underfill or overfill. Overflow is visible and penalized. A cup appearing full only because of foam does not earn perfect accuracy. |
| Order transaction | Serve is accepted once per customer. Holding the pour button while serving cannot continue filling the result or the next customer's cup. Rapid clicks cannot duplicate payout or skip customers. |
| Reputation | The customer's review updates the shop rating. The updated rating changes the next customer's quoted earning opportunity, rather than retroactively changing the just-served order. |
| Recovery | Good service after a bad review improves the rating. A low rating never locks the player out of continuing the shift. |
| Shift completion | Exactly 12 customers lead to a summary showing total earnings and performance. A new shift resets shift statistics and retains only the intended saved records/settings. |
| Persistence | Reload restores only documented records/settings. Missing, corrupted, or blocked local storage does not prevent play. |
| Pause/resume | Pause and backgrounding freeze the active simulation. Resuming after a long gap does not create a huge pour or foam/spill jump. |
| Sound | Sound can be muted. Audio activation respects a user gesture. Disabling audio or an unavailable AudioContext never prevents gameplay. |
| Layout | Desktop and a narrow portrait viewport show readable order text and usable controls without horizontal overflow. Result and shift-summary overlays fit or scroll cleanly. |

## Static verification command

Run from the source root after building:

```sh
node tests/browser/verify_offline.mjs dist/index.html
```

The verifier checks the actual release HTML. It rejects companion-file/network
resources, script syntax errors, unbundled imports, and missing/invalid embedded
Wasm. It intentionally ignores ordinary hyperlinks and SVG namespace declarations.

## Balancing guidance for V1

- Use a moderate target and lower carbonation for the first customer.
- Keep the game untimed so stopping, settling, and topping up is a useful strategy.
- Make the liquid/foam boundary obvious. Use both labels and visuals to explain
  that customer accuracy is based on liquid.
- Base future pricing on the rating at order creation, then update the review at
  serving. Keep the next customer's displayed earning opportunity consistent.
- Smooth the overall rating so one mistake has a cost while recovery remains
  achievable within a 12-customer shift.

## Evidence log

Fill this section with actual commands, screenshots, and interactions at release.
Keep browser limitations explicit. A local static server preview is useful
interaction evidence but is not independently proof of direct file:// opening.
