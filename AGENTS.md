# Perfect Pour — source, gameplay and release instructions

Perfect Pour is a standalone illustrated soda-pouring and business-growth
browser game in `SiminanRoll/PerfectPour`.

## Public release target: GitHub Pages
- **Owner direction (2026-11-28):** The public game must be served from
  **GitHub Pages**, not ChatGPT Sites. Every approved update should be
  merged to `main`, pass CI, and deploy automatically to the public
  GitHub Pages URL.
- The canonical release is the committed `dist/index.html`. It packages
  Rust/WASM, artwork, sound and controls in one offline-capable document.
- `.github/workflows/ci.yml` validates and rebuilds this artifact.
  `.github/workflows/pages.yml` deploys `dist/` after successful CI
  (and also supports manual redeployment).
- **One-time setup:** Repository **Settings → Pages → Build and deployment →
  Source: GitHub Actions**. This setting cannot be inferred from repository
  source. Publication is unverified until a successful Pages workflow and
  direct live-site check. See `docs/GITHUB_PAGES.md`.
- Do **not** deploy to ChatGPT Sites, create replacement ChatGPT Sites or
  change its legacy project. The prior `.openai/hosting.json` is retained
  only as historical configuration. The GitHub Pages site has a different
  browser origin, so its localStorage cannot see ChatGPT-hosted saves:
  protect player progress via **Export/Import** when switching hosts.
- A successful `main` build alone does not mean the GitHub Pages website
  updated. Distinguish `SOURCE MERGED`, `CI VERIFIED`, `PAGES DEPLOYED`
  and `RUNTIME VERIFIED` in every release. If Pages is disabled or a
  deploy action fails, report the exact blocker and its run URL; never
  claim release success without proof.

## Gameplay regressions to protect
- Keep Hardcore one hold per soda; Easy allows top-ups and separate Serve.
- Preserve mixed drinks, foam/overflow behavior, visual ingredients, ice
  buoyancy with bounded rotation, and 5-per-tray ingredient limit.
- Keep tycoon upgrades, returning regulars, daily specials, one-time pay,
  pause/resume and save migration. Exercise phone/touch layouts where possible.
- Never reset career data or silently rename storage keys; legacy import
  must remain supported.
