# Perfect Pour V1.06: behind the soda bar

This is a separate playable preview, based on the illustrated V1.04.2 release.
The original Perfect Pour Site is not a publication target for this work.

## Source baseline

- Upstream V1.04.2 revision: `3c9f86a540e1ac446ed2ad20f0141e3f220f2940`.
- Equivalent Sites source mirror: `beb201e64524137dfa1ad318e756fa69e2e04e37`.
- V1.05 photographic artwork is not part of this preview.
- Preview Site: `appgprj_6b0a4da61bdc81919fa009c6651ebaf9`.

## The counter is the interface

Pressure is selected with the machine's three-position knob: Gentle, Classic,
or Rush. Soda buttons are part of the machine. Ingredient choices are physical
containers: a cherry tin, ice bin and scoop, lime tray, and syrup bottle.
Available containers remain on the counter while a drink is being poured;
the recipe and pressure lock at the first hold, as in V1.04.2.

Tapping a container cycles the selected amount. Cherries and ice offer zero,
one or two; an ice scoop is shown as three cubes. Limes and syrup retain their
existing purchase requirements. No additional confirmation is required before
pouring. The original Hardcore and Easy serving rules remain.

## Physical presentation

The canvas drink layer uses the existing cup-volume mapping for liquid and
target positions. Garnishes drop under gravity, contact the bottom and walls,
and respond to the rising drink and the pouring stream. Ice is buoyant;
fruit has its own damping and rotation. These are bounded visual dynamics,
not a general-purpose fluid simulator.

Actual engine liquid, foam and spill values drive the fill, foam surface,
overflow trails and counter puddle. The spill stays with the finished drink
and clears when the next customer receives a fresh cup. Decorative animation
never grants money, advances a customer or changes a score.

## Ice rules

Ice is an optional free preparation choice. It increases actual gas expansion
in the Rust engine in both modes. The multiplier is:

`1 + scoops * (0.08 + 0.12 / (1 + poured_ml / 90))`

This begins at 1.0, 1.2 or 1.4 and declines as the ice is wetted. Pausing or
reloading does not restart the initial burst. Ice is not a new recipe grading
requirement. It does not change beverage input, prices, cup capacity or target
geometry. Melting, temperature, ice displacement and inventory chores are
outside this preview. No-ice engine behavior retains V1.04.2 values.

## Save isolation and compatibility

The preview writes `perfect-pour-preview-v106` and separate preview audio
settings. It does not automatically read or overwrite any original business
key. Existing V101–V104 businesses can be explicitly imported from Business
tools. Imported drinks have no ice; later preparations may add it.

The engine writes save version 106 with the existing 120-double length.
Selected ice uses previously reserved slot 105. Runtime fields 134 and 135
append selected ice and its fizz multiplier; earlier field indices retain
their meaning. V106 exports require this preview or a later compatible
release; the original game cannot read them.

## Validation scope

Engine checks cover ice locking, fizz, both modes, mixtures, legacy imports,
interrupted and paid saves, and no-ice parity with the released engine.
The final acceptance record records UI and browser checks separately.
Desktop browser views and phone-sized layouts do not certify physical
iPhone/Safari, Android performance or subjective audio quality.
