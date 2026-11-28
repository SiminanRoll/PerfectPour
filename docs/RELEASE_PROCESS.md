# Perfect Pour — main-to-GitHub-Pages release contract

**Owner direction:** Publish the existing Perfect Pour source on the public
GitHub Pages site, rather than the separately hosted ChatGPT Site.

## Source and web hosting
- Canonical repo: `SiminanRoll/PerfectPour`, branch `main`.
- Shippable artifact: `dist/index.html` (Wasm, art and all gameplay).
- Publisher: `.github/workflows/pages.yml`, triggered after successful
  `Perfect Pour CI` on `main`; also supports manual run.
- One-time admin setting: **Settings → Pages → Build and deployment → Source:
  GitHub Actions**. A workflow cannot assume or prove this setting exists.
- GitHub Pages will show the verified URL in the `github-pages` deployment
  environment when deployed. The usual project URL is
  `https://siminanroll.github.io/PerfectPour/` unless custom domain
  settings specify otherwise. Do not assert this URL is live without proof.
- Original ChatGPT Site and `.openai/hosting.json` remain unchanged as
  legacy; do not create additional ChatGPT-hosted versions.

## Required release steps
1. Check `main` HEAD and `dist/index.html` before editing.
2. Implement approved work, rebuild Rust/WASM and the standalone release,
   then run tests for recipe/ice physics, input controls, save migration,
   tycoon payouts and offline bundling.
3. Merge to `main` with commit/head checks; confirm successful completed
   `Perfect Pour CI`. The existing CI may auto-commit built artifacts.
4. Wait for `Publish Perfect Pour to GitHub Pages` to complete, verifying
   its `github-pages` deployment environment and page URL. Deployment
   failure is **not** a released build.
5. Visit the **Pages URL** and check the intro version, a real pour, transition
   to the next customer, five-ingredient tray behavior, and current/legacy
   save import. Report any limitations in browser/device coverage.
6. Report separately: `MAIN MERGED`, `CI PASSED`, `PAGES DEPLOYED`,
   `GAMEPLAY VERIFIED`, citing exact SHA and run IDs.

## Save migration across hosts
Both game hosts use browser-local storage. A GitHub Pages site is a **new
origin** relative to `chatgpt.site`. Players need to open the old hosted
game, choose **Build → Business tools → Export**, visit GitHub Pages and
choose **Import**. The V107 engine supports V106 and older career imports
but does not transfer browser storage automatically. Do not tell players
their saves will appear at a new hostname without importing.

## Rollback
Revert or redeploy the last verified GitHub Pages release, retaining the
current save schema and avoiding a hard reset. Never modify the legacy
ChatGPT Site as part of a GitHub Pages rollback.
