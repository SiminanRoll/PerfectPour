# Perfect Pour — repository release instructions

This repository is the standalone browser game **Perfect Pour**, not Mr. Pancake
or an Advantage Technologies application.

## Always target the public production game
- The owner explicitly requires **approved changes merged into `main` and then
  deployed**, in the same task, to the **existing** ChatGPT Site:
  https://perfect-pour.pretty-scarf-0591.chatgpt.site/.
- `.openai/hosting.json` contains the existing ChatGPT Sites project binding.
  Preserve this binding; do not create an alternative/private release site or
  swap the URL unless the owner explicitly requests it.
- Commit and verify native Rust, WASM, UI and offline bundle checks; verify the
  exact pushed `main` SHA and deploy **that artifact** through ChatGPT Sites.
  ChatGPT Sites publishing has separate **save version** and **deploy version**
  actions. A GitHub Action success is source/build verification, **not**
  proof that the hosted site was updated.
- Independently check the public URL's rendered version, input controls, next
  customer/day navigation, and cross-release save migration. Preserve existing
  progress, audio settings and offline export.
- Do not say "published", "deployed" or "complete" unless the production deploy
  and a runtime readback actually succeeded. If the current tool environment
  has no Sites publisher/browser, explicitly label **DEPLOYMENT BLOCKED**;
  provide the verified GitHub commit and the precise remaining step. Do not
  pretend that pushing to `main` auto-deploys to `chatgpt.site`.
- Follow [the release checklist](docs/RELEASE_PROCESS.md). Do not silently use
  GitHub Pages, another origin, or a newly created site as a substitute: that
  would separate browser-local saves.

## Gameplay guardrails
- Preserve the one-hold-per-soda Hardcore control, explicit Easy top-up/serve,
  mixed orders, foam/liquid scoring, physical add-ins, and responsiveness.
- Keep player save compatibility across releases; regression-test partial
  pours, paid cups, next-customer transitions, mobile/touch and five scoops
  / five cherries / five lime wedges / five syrup pumps.
- Track main-branch, CI, site deployment and actual runtime as distinct states.
