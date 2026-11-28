# V1.05 — the photographic soda bar

The graphics update replaces the cartoon customer cast with eight fictional photographic adults and gives the pouring station a realistic bar environment. The intro uses a matching photographic soda hero. Game controls retain concise labels, simple icons, and contextual disclosure.

## The drink and the pour

The live glass remains dynamic. It uses the same four cup shapes and nonlinear volume-to-height mapping as the engine, with translucent soda, fine reflective glass edges, rolled rims, thick bases, condensation, varied carbonation, and a small brass pictorial logo without lettering. Cherry and lime garnishes have richer material shading.

The stream reaches the current liquid or foam surface. Pouring disturbs that surface and throws small droplets. Releasing the tap leaves a short visual trail; that trail never adds beverage, alters a score, or permits an extra pour. Actual new overflow produces outside rivulets, airborne splashes, and a growing countertop puddle. Restoring a spilled cup retains its puddle without replaying the accident. Effects use a bounded particle pool and expire back to an idle frame.

Real foam still settles before the inline review. Perfect cups retain their glint; every finished cup remains visible until explicit Next. A short outgoing-glass animation follows that Next action without delaying the next order's input. The recent touch-capture repair remains intact.

## Customers and shop

Every customer has attentive, pleased, and disappointed expression artwork. All expressions for an identity share a preloaded image atlas. Mood changes select another crop while keeping the same person, image source, and arrival wrapper in the document, preventing the disappearance caused by rebuilding the character on release. These are three photographic expressions with restrained motion, not a continuous facial animation rig.

The storefront receives more dimensional materials and clearly distinct upper upgrade tiers. Build emphasizes the premises and keeps price, measurable benefit, prerequisites, and next-day staffing visible. Selection and purchase highlight the relevant object. The play environment reflects owned equipment and active staff.

## Compatibility and delivery

- Rust/Wasm, prices, difficulty, payouts, recipes, and save format are unchanged.
- Hardcore remains one hold per soda; Easy retains top-ups and its separate service action.
- Existing businesses continue with their cash, upgrades, and current paid or unpaid cup.
- All artwork is embedded in `dist/index.html`. There are no image downloads, image services, external fonts, or frontend dependencies during play.
- Reduced motion removes decorative travel and particle animation while retaining readable levels and static physical feedback.

See [acceptance evidence](qa/V105_ACCEPTANCE.md), [environment and hero provenance](art/V105_ART_DIRECTION.md), and [customer asset provenance](art/CUSTOMER_ASSETS.md). The release PR records the exact tested source commit, CI result, GitHub merge readback, and Sites deployment receipt.
