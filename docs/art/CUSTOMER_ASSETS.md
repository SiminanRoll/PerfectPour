# Perfect Pour V1.05 photographic customer assets

Generated November 27, 2026 with the built-in image-generation tool. These are original, fictional adult customers, not photographs of identified real people or stock assets. The request was to replace the cartoon people with hyperrealistic customers while retaining a standalone game.

## Shipped assets

Each sheet contains two identities (one per row), with attentive neutral, pleased, and disappointed expressions from left to right. All sheets are 1536 × 1024 pixels, arranged in 512 × 512 cells. Pouring and settling retain the attentive expression. Display framing selects a centered 409.6 × 509 crop from each cell to suit the existing 240 × 300 portrait viewport.

| File | Customer indices | Appearance | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| `web/assets/customer-0.webp` | 0, 1 | Cream cap / teal shirt; curls / coral blouse | 235686 | `e5d976408be5255834c9e5f14f273d7b87abcfa376117373d549f098e10913a2` |
| `web/assets/customer-1.webp` | 2, 3 | Dark bob / glasses / sage cardigan; silver hair / glasses / ochre sweater | 271076 | `7fad1fbe2c33a6ed1a23ad91f7ec7d2f65847e1262402ae1791ec04c78041d49` |
| `web/assets/customer-2.webp` | 4, 5 | Teal beanie / terracotta hoodie; natural buns / yellow top | 235602 | `56e4bb308f1546dde1c2a9e3c1e0a420691c0515ba1ea1e8df981bdbb0f9fd11` |
| `web/assets/customer-3.webp` | 6, 7 | Copper shag / striped teal top; dark top knot / sage shirt | 265990 | `c0b28c9d17b9f3503134ab0ada3d5247ef355d6e5de0a050bd9b760850cb7277` |

Total source image payload: 1,008,354 bytes, before base64 embedding. The generated PNGs were converted to WebP at quality 82 with ImageMagick (`-strip -quality 82 -define webp:method=6`). No content, facial features, or alpha masks were edited during conversion. All four sheets retain genuine transparent alpha, checked at the top corners of multiple cells. Each output was visually inspected for identity, pose, expression order, grid placement, and photographic quality.

## Rendering contract

`web/customer-art.js` preserves `PourArt.customer(index, mood)` and `PourArt.setMood(container, index, mood)` and adds `PourArt.image(index, mood, x, y, width, height)` for staff inside the store scene.

The build replaces `__ASSET_CUSTOMER_0__` through `__ASSET_CUSTOMER_3__` with data URLs for the corresponding source assets. All four atlases are predecoded while the intro is visible. The same outer SVG, image element, image source, and arrival wrapper remain in place for an order. Changes of mood select another crop of the already resident atlas; they do not replace the person or repeat an opacity entrance. The restrained expression motion is disabled by the system's reduced-motion preference. Raster cropping uses an explicitly clipped nested SVG so broad scene SVG styling cannot expose adjacent atlas cells.

`node tests/browser/v105-customers.mjs` exercises the actual cast module at its DOM boundary. It verifies all eight identities and 24 expression crops, fixed viewport geometry, unchanged root/arrival/image references and source through pour and result states, repeated-state no-ops, and one rebuild for a new identity. It does not simulate browser painting, CSS or image decoding. The source sheets were visually inspected: the centered portrait crop preserves the full hair silhouette and face; it deliberately crops the outer shoulders to match the portrait framing. These are three photographed expression frames, not a continuously animated facial rig.

## Generation prompt set

All four calls used `transparent_background: true`, without input references. The shared production brief was:

> Use case: photorealistic-natural. Asset type: production photographic character sprite sheet for a family-friendly soda bar game. Create exactly 6 isolated chest-up portraits on a genuinely transparent background, precisely arranged in a 3-column by 2-row grid of equal square cells in a landscape 3:2 canvas. Each row repeats the same fictional adult in an identical eye-level chest-up pose, at exactly the same scale and position, with the same clothes and lighting; only the facial expression changes across columns. First column calm attentive neutral, second column naturally delighted smiling with subtle teeth, third column mildly disappointed with closed mouth. Real human commercial photography, lifelike facial anatomy, natural skin texture and individual hairs, realistic fabric weave; no CGI, no cartoon, no painting. Soft warm light from upper camera-left, natural shadows, crisp faces, eye-level 85mm portrait camera. All portraits are cutouts with transparent pixels outside their silhouettes. Full hair and both shoulders inside each equal square cell; crop at mid chest with a straight baseline at the bottom of each cell. Keep 6% transparent safe margins at the top and sides of each cell, no overlap. No hands, props, lettering, borders, watermark, scenery, grid lines or visible background. Same lighting and camera across all portraits. Fictional ordinary customers, not celebrities.

The identity-specific insert for each sheet was:

### Sheet 0

> Top row: a fictional man about 30 with medium tan skin, short dark hair, a cream baseball cap, open teal overshirt over warm cream t-shirt. Bottom row: a fictional Black woman about 30 with dark brown skin, natural shoulder-length soft curls, a muted coral linen blouse.

Additional first-sheet emphasis: straight-on three-quarter chest-up pose, natural eye catchlights, skin pores, individual hairs and fabric weave. Generated source identifier: `exec-5c15e0f4-518d-44c4-ba93-e12909c7e24f.png`.

### Sheet 1

> Top row: a fictional East Asian woman about 35, fair skin, straight chin-length dark bob haircut, delicate round brass glasses, ivory shirt under a soft sage green cardigan. Bottom row: a fictional older man about 65 with light brown skin, short silver hair, tasteful round eyeglasses, neatly trimmed gray beard, ochre textured sweater over a cream collared shirt.

Additional emphasis: natural age lines and realistic skin pores. Generated source identifier: `exec-eebf2462-2e36-4dd0-870b-ff9434ad196e.png`.

### Sheet 2

> Top row: a fictional white man in his late twenties with a slim face, reddish stubble, brown hair tucked into a muted teal rib-knit beanie, faded warm terracotta hoodie. Bottom row: a fictional Black woman in her twenties with deep brown skin, hair in two high natural textured buns, small gold hoop earrings, textured soft yellow cotton top.

Additional emphasis: realistic knit and cotton weave. Generated source identifier: `exec-9b740305-0140-4f92-af9d-2f5bbed72023.png`.

### Sheet 3

> Top row: a fictional white woman about 30 with a loose copper-red wavy shag haircut, a few realistic freckles, deep teal knit top with two wide cream horizontal stripes. Bottom row: a fictional South Asian man about 32 with medium brown skin, black hair in a small top knot, dark neatly trimmed short beard, light sage green casual collared shirt over a cream crew-neck t-shirt.

Generated source identifier: `exec-6971ed43-7b45-4755-b074-76f783d4dae2.png`.
