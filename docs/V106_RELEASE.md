# Perfect Pour V1.06

V1.06 promotes the reviewed illustrated soda-counter build to the canonical
`SiminanRoll/PerfectPour` main branch and existing public Perfect Pour Site.
The earlier preview is no longer the release destination. Future releases use
main and the existing public Site unless a separate preview is explicitly
requested.

## Behind the soda bar

- The dispenser contains the soda buttons and a three-position pressure knob.
- Ingredients appear in physical containers: cherry tin, ice bin and scoop,
  lime tray and syrup bottle. Existing ingredient upgrades still unlock their
  containers.
- Fruit drops into the glass, responds to pouring, and recovers toward a
  floating position. Ice floats mostly submerged and moves with the stream.
- Optional zero, one or two ice scoops increase actual foam gas expansion,
  strongest at the beginning of a pour. Ice does not change recipe grading,
  price, cup capacity or target geometry.
- Glass, bubbles, textured foam, stream impact, condensation, overflow trails
  and a persistent per-cup puddle use the engine's actual drink state.
- The illustration style retains the V1.04.2 personality. Obsolete V1.05
  photographic rendering code and assets are removed from the current source.

Hardcore hold/release, two-soda portions, explicit Easy service, one-time
payments and the repaired pointer-capture behavior are retained. The pressure
knob and recipe lock on the first hold. Spills remain through the finished-cup
review and clear for the next customer. Ice motion is stylized; melting,
temperature and volume displacement are outside this release.

## Existing businesses continue

The production save key is `perfect-pour-business-v106`. When no current save
exists, the adapter reads V104, V103, V102 and V101 production keys in that
order. V1.05 used the V104 format, so its businesses follow the same migration.
The old keys are retained unchanged. Current V106 saves take precedence.

Startup and menu visits inspect saved progress without writing a migrated
save. Continuing writes V106 through the ordinary save flow. Paid results
remain paid, interrupted pours retain their existing mode rules, and stale
tabs cannot overwrite newer V106 progress. The established
`perfect-pour-v1-settings` key preserves audio preferences.

The engine still uses a 120-double save buffer; ice occupies previously
reserved slot 105. The runtime snapshot adds selected ice and its fizz
multiplier at 134–135. The engine accepts formats 101, 102, 103, 104 and 106.
Legacy imports start with zero ice. New V106 exports require V1.06 or a later
compatible release.

## Release evidence

The [preview acceptance record](qa/V106_PREVIEW_ACCEPTANCE.md) records the
engine, rendering and actual browser checks completed before promotion.
It remains historical evidence of that separate build. The
[production acceptance record](qa/V106_ACCEPTANCE.md) records the migration
and release checks. The [release manifest](release-manifest.json) identifies
the final build and the production Site.

Release source retains normal Git history above the existing main head;
promotion does not reset or force-push the branch. The published artifact and
the GitHub release source must have matching content.
