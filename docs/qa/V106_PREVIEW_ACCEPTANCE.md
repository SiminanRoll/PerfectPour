# V1.06 preview acceptance

This record describes a separate illustrated soda-bar preview. The original
V1.04.2 Site is not its deployment target. It is not a claim of physical-device
certification or a new economy balance release.

## Engine and persistence

- 58 native Rust tests passed, including 448 iced Gentle catalog cases.
- Compiled-Wasm smoke, recipe, mixture, and V1.06 ice suites passed.
- The existing mixture suite includes 216 mode-parity cases.
- Business acceptance and the 6,048-case zero-ice catalog/mode comparison
  also passed against the final V1.06 Wasm.
- Comparing the new engine with the released V1.04.2 engine at zero ice
  preserved all 134 original snapshot fields across 1,624 snapshots from
  288 orders.
- Optional ice increases actual foam gas expansion. Selection locks after the
  first hold, survives save/resume, and resets for the next customer.
- Production save-adapter checks passed for explicit legacy imports,
  interrupted pours, paid cups, stale tabs, and unavailable storage.
- Preview startup and settings never read or overwrite original business
  keys 101–104. The preview has separate career and audio settings keys.

## Controls and presentation

- Production primary-control, startup-menu, UI-contract, and audio cue suites
  passed against the current source and shipped Wasm.
- The range-based pressure knob supports arrow keys. A completed pointer
  adjustment returns focus to Pour; keyboard edits retain slider focus.
- The drink renderer passed 1,200 simulated frames across all four cup
  geometries with finite drawing coordinates and balanced canvas contexts.
- Decorative objects and effects are bounded. Pause and reduced-motion
  rendering were checked for stability by the renderer implementation pass.
- Replaying the observed 3.4-second Gentle Orange and 6-second Rush Cola pours
  exposed an ice-surface overshoot. Ice now settles about 83% submerged;
  rising-liquid transport fades near the surface and collision separation
  cannot lift wetted cubes into an unsupported pile.
- A finished wide-cup observation exposed cherry recovery that was too slow.
  Wet cherries now use damped recovery after the stream stops. A 58%-full
  wide-cup replay places the cherry 23–28 logical pixels below the liquid
  surface after one to two seconds with six ice cubes and lime; without ice,
  it settles about eight pixels below the surface. Dry-drop gravity is retained.
- The standalone HTML bundles all assets and one dependency-free Wasm payload.
  Its nine inline scripts parse, and the offline verifier requires no network
  resources or companion files.

## Actual browser observations

Checked the built artifact in managed Chromium, using the desktop window and
phone-sized iframe views. The disposable saves came from the repository's
genuine test fixtures; no live player data was used.

- Desktop: the illustrated intro/menu load, New Game opens the counter,
  soda and ingredient controls respond, the knob changes pressure, and an iced
  single-soda hold/release commits and settles.
- Portrait 390 × 844: the stocked cherry tin, ice bin, lime tray and syrup
  bottle are visible. A Rush overpour recorded 436 mL of engine waste and
  rendered connected overflow trails and a countertop puddle.
- Portrait 360 × 740: both mixed-soda targets remain visible. Turning the knob
  with a pointer and holding Space pours the first part. Releasing switches
  to the second soda without paying. A second hold/release serves once;
  Next Customer advances while retaining the resulting balance.
- A preparation-only inherited rule initially hid the mobile countertop.
  The new scene now explicitly keeps both counter surfaces visible through
  preparation, pouring, settling and review; the corrected preparation view
  was inspected.
- Landscape 844 × 390: a dedicated compact machine strip leaves more room
  for the glass while retaining soda buttons, pressure knob and primary
  action. The revised layout and a native held pour were inspected.
- Final portrait drink: foam settles to the engine's liquid level, ice returns
  to a mostly submerged floating position, and the inline review leaves the
  cup visible.
- Final Easy-mode check: a held Space pour pauses on release, another hold
  tops up, and the separate Serve control commits once. The final drink
  visibly retains the recovered cherry just beneath its floating ice.

## Scope and limits

Ice is an optional free choice with no new recipe requirement. It does not
displace drink volume, melt, change temperature or require inventory
management. Garnish movement is a bounded visual simulation. Target geometry,
score, payment and progression remain engine-authoritative.

Spills accumulate for the current cup and remain during its review. They clear
with the next customer's fresh serving area. Audio cue/lifecycle checks do not
constitute a subjective listening pass. Browser-size checks do not establish
physical iPhone/Safari or Android performance. Historical acceptance files
remain historical evidence, not tests newly performed for this preview.
