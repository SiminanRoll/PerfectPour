# V1.05 photographic art direction

The game uses generated fictional artwork, bundled locally into the standalone HTML. No image service, network request, or image-generation step runs while playing.

## Environment and title drink

Generated with the built-in image-generation tool on 2026-11-27. The selected outputs were copied into project assets and encoded as WebP for delivery; only proportional downscaling and encoding were applied. The original generation remains unchanged.

- `web/assets/bar-interior.webp`: 1280 × 853; photographic teal-tile / walnut soda-bar background.
- `web/assets/hero-soda.webp`: 800 × 1200; photographic citrus soda hero. The small cup badge contains a pictogram without lettering.

The title drink is a photograph-style decorative illustration. Gameplay uses the existing volume-to-height geometry with a dynamic glass renderer; its liquid, foam, and overflow remain driven by the Rust engine. Customer photo provenance is recorded in `CUSTOMER_ASSETS.md`.

### Bar prompt

Use case: photorealistic-natural. Asset type: background plate for a realistic premium soda-pouring browser game. Primary request: an exceptionally realistic neighborhood soda bar interior photographed from behind the serving counter, warm late afternoon soft light from upper left. Wide landscape composition. Teal glazed ceramic tiled back wall, walnut worktop, brushed steel and brass fixtures, muted cherry and citrus syrup bottles on a high shelf, a softly lit window. Crucial layout: broad quiet uncluttered central portion of tiled wall and countertop, no cup or glass or objects in the central 60% so a dynamic glass and dispenser can be rendered on top; interesting shelf/window details at the edges and upper third only. Worktop occupies the bottom 18% with convincing depth and grain. Photographic material detail, shallow-to-moderate depth of field, calm understated backdrop, natural realistic color and exposure, no outlines or cartoon styling. No people, no visible letters, numbers, logos, menus, words, interface or watermarks. Landscape 1536 by 1024.

### Hero prompt

Use case: product-mockup. Asset type: photorealistic hero drink artwork for the intro screen of Perfect Pour, a soda shop game. Primary request: a beautiful tall clear soda-fountain glass of amber-orange citrus soda, fine effervescent bubbles, a thin naturally uneven foam cap, cold condensation beads, convincing thick rim and base, delicate window reflections, a subtle small round golden medallion on the front bearing only a simple smiling cup pictogram without letters. A fresh lime wheel on the rim, a single maraschino cherry near the glass. Glass stands on a dark walnut soda bar, softly out of focus teal ceramic tile and warm brass highlights behind, warm soft light from upper left and nuanced studio product lighting. Centered single glass fills most of frame height, straight camera at glass midpoint slightly looking down at rim, premium commercial beverage photography, lifelike transparent glass and liquid materials. No cartoon, no thick outline, no typography, no writing, no numbers, no words, no UI, no watermark. Portrait 1024 by 1536; leave modest breathing room around the drink; all fruit entirely in frame.

