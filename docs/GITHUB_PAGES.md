# Optional GitHub Pages deployment

Perfect Pour can be published through Sites while the complete source stays in the private [SiminanRoll/PerfectPour repository](https://github.com/SiminanRoll/PerfectPour). The active `.github/workflows/ci.yml` validates the project. This guide describes an optional GitHub Pages publishing workflow that can be enabled later.

The deployment artifact is `dist/index.html`, the same standalone game that opens offline. It contains the Rust WebAssembly engine, interface, artwork, and sound generation. Deploy the `dist` directory so the game's entry file is at the artifact root.

## Private repository eligibility

GitHub Pages supports private repositories on GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. GitHub Free requires a public source repository. An eligible private repository can publish a publicly accessible Pages site while keeping its source repository private. Organization policy can also restrict publication.

Check the owning account's plan and publication settings before enabling this route. Repository admin or push access does not establish plan eligibility. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [organization Pages policy](https://docs.github.com/en/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization).

## One-time setup

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Add the workflow below as `.github/workflows/pages.yml` after Pages is enabled.
4. Push to `main`, or run **Publish Perfect Pour** from the Actions tab.
5. After a successful deployment, open the URL shown by the `github-pages` deployment environment.

GitHub can create the `github-pages` environment automatically. Creating that environment does not enable the Pages site. The setup steps are documented in [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

### Why the workflow does not enable Pages automatically

The ordinary workflow `GITHUB_TOKEN` can deploy an artifact to an enabled Pages site. It cannot perform the initial enablement through `configure-pages` with `enablement: true`: that action requires a separate token for this operation. Current REST documentation specifies **Pages: write** and **Administration: write** for fine-grained tokens creating or configuring the site.

Use the one-time repository settings flow above. See the official [configure-pages inputs](https://github.com/actions/configure-pages/blob/main/action.yml) and [Create a GitHub Pages site API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).

## Proposed publishing workflow

This example publishes the committed standalone release. It checks the offline package before uploading it. CI separately verifies the native Rust engine, compiled Wasm, business rules, and reproducibility of the bundled HTML.

```yaml
name: Publish Perfect Pour

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: perfect-pour-pages
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Check out source
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Verify standalone release
        run: node tests/browser/verify_offline.mjs dist/index.html

      - name: Configure Pages
        uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0

      - name: Upload game
        uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with:
          path: dist

      - name: Deploy game
        id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1
```

`contents: read` allows checkout. `pages: write` authorizes deployment, and `id-token: write` allows GitHub to verify the deployment's workflow identity. The `github-pages` environment exposes the deployed URL and can restrict which branches deploy. See [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verified action versions

The workflow pins the official release commits verified on 2026-11-27:

| Action | Release | Official source |
|---|---|---|
| `actions/checkout` | `v7.0.1` | [Release](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| `actions/configure-pages` | `v6.0.0` | [Releases](https://github.com/actions/configure-pages/releases) |
| `actions/upload-pages-artifact` | `v5.0.0` | [Releases](https://github.com/actions/upload-pages-artifact/releases) |
| `actions/deploy-pages` | `v5.0.1` | [Releases](https://github.com/actions/deploy-pages/releases) |

When updating these actions, verify their current official releases and replace the corresponding pinned commit. The public Pages URL is available only after site configuration and a successful deployment.
