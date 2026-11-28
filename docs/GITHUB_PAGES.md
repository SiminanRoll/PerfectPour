# Publishing Perfect Pour on GitHub Pages

**GitHub Pages is the intended public game host.** This repository is public,
and its built game lives in `dist/index.html`, including the Rust/WASM engine,
visuals, music, ingredient physics and tycoon progression.

## One-time setup
1. Open [PerfectPour → Settings → Pages](https://github.com/SiminanRoll/PerfectPour/settings/pages).
2. Under **Build and deployment**, change **Source** to **GitHub Actions**.
   A repository owner/admin needs to do this once if not already enabled.
3. GitHub Actions → **Publish Perfect Pour to GitHub Pages** → **Run workflow**
   if you want to deploy immediately without editing source again, or push
   approved changes to `main` and let the CI-success trigger publish.
4. Open the link displayed by the successful **github-pages** deployment.
   The default repository address is
   `https://siminanroll.github.io/PerfectPour/`, but verify the actual
   URL before sharing; custom domains can alter it.

## Automatic deployment
- `.github/workflows/ci.yml` builds and tests the full game, including
  Rust, Wasm, the save adapter and the offline HTML.
- `.github/workflows/pages.yml` starts only after that main-branch CI
  completes successfully, or via manual dispatch. It checks the committed
  `dist/index.html`, uploads the `dist/` directory as the Pages artifact,
  and deploys using the GitHub Pages actions and `github-pages` environment.
- The CI workflow may commit regenerated `dist/index.html` through its
  workflow token. The Pages workflow checks out current `main` **after**
  CI succeeds, so it uses the latest committed standalone bundle. GitHub's
  special `GITHUB_TOKEN` auto-commits do not themselves trigger ordinary
  new push workflows.
- A green CI badge alone is not proof of publication. Confirm a completed
  Pages workflow, actual deployment URL and live gameplay.

## Existing player progress
The old public ChatGPT Site is a different web origin. Browser storage from
that site will not automatically appear at the GitHub Pages address. Export
the prior career in the older game under **Build → Business tools → Export**,
then import the downloaded JSON in the GitHub Pages game. The V107 engine
preserves historical 101/102/103/104/106 progress via its supported migration.
Do not delete the older Site or tell players their saves were copied.

## GitHub Pages errors
If the workflow says **Get Pages site failed / Pages not enabled / Resource
not accessible**, first check Settings → Pages → Source = GitHub Actions.
Do not create a different host or paste personal access tokens into code.
The Pages environment can be created automatically, but that does not
enable the Pages site. See [GitHub's publishing-source setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
and [custom Actions deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
