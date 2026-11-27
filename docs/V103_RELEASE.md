# Perfect Pour V1.03 — custom sodas and clearer controls

These notes describe the implementation and prepublication verification. The [release manifest](release-manifest.json) identifies the build; remote CI and deployment records separately establish publication.

## Craft their order

Customers now request a base, visible add-ins, and sometimes a soda-water blend. The starter cherry jar is available immediately. A $10 citrus tray unlocks lime, an $18 syrup rack unlocks cherry syrup, and a $26 mixing dispenser unlocks Light and Bold blends alongside Regular. The first fresh-business order is Orange with one cherry.

Illustrated tickets remain visible. Requests gradually expand, use only owned ingredients, and include plain breaks. At most two add-in types appear in an order. Purchases preserve the current request; future customers can ask for the new ingredients.

Selected ingredients appear in the glass, and the cup carries a pictorial brand stamp without lettering. Add-ins have actual costs; unrequested extras do not raise the quoted price. Blend and tap pressure remain distinct. Garnishes do not secretly change cup capacity.

## One primary button

A single physical button follows preparation, Ready to pour, holding, settling, See review, Next customer, and Open next day. Recipe and pressure controls clear before aiming begins, keeping the layout stable during a pour. Ingredients lock at the first hold.

Hardcore remains the default: one continuous hold and release commits the entire drink. Easy uses the same button: a short tap serves, while holding for 160 ms begins a top-up. Space pours directly; Enter serves or activates the current non-pouring action.

The finished cup remains visible until review. Five-star drinks receive a gold treatment. The review separates recipe accuracy from fill accuracy: an exact recipe is required for five stars, and a perfect fill cannot conceal the wrong base. Specific mistakes are identified. Patience starts when preparation begins, with extra allowance for complicated orders; reading untouched tickets, menus, and required settling remain free.

## Polish and continuity

Customer expressions update within a stable SVG instead of replacing the character at release. Smoother pouring and fizz release envelopes address abrupt transitions. Music and effects retain separate controls.

Help & settings includes **Download app icon**, exporting a **512 × 512 PNG** from the standalone game. The actual browser download was verified as a 21,676-byte PNG. This provides a shortcut image; it does not automatically install an application.

Version-103 saves import V101 and V102 businesses. Existing current cups retain their original plain recipe and payments; no garnish costs are applied retroactively. Unpoured preparation restores without spending the attempt. Interrupted Hardcore commits once, unfinished Easy resumes stopped, and stale tabs cannot overwrite newer progress.

## Verification

Local gates passed: **40 Rust tests**, Wasm/business/recipe acceptance, **6,048** catalog and mode cases, **48** synthetic careers, **94** UI aliases, production pointer/keyboard handler checks, audio lifecycle tests, and offline verification. Gentle reached five stars in **1,008/1,008** blend/catalog cases with visible foam and no beverage loss. The full twelve-type catalog costs **$1,953**.

The [engine report](../engine/balance-report.json) records methods and results. Synthetic careers choose recipes instantly and are not human playtests. UI harnesses do not certify real browser behavior; physical phones and subjective audio quality require separate evaluation. The complete game remains one self-contained HTML file.

The [V1.03 acceptance record](qa/V103_ACCEPTANCE.md) distinguishes automated gates from actual browser plays. See the [README](../README.md) for commands and controls. [V1.02 release history](V102_RELEASE.md) remains available.
