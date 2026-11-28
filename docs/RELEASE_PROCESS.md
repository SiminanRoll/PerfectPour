# Perfect Pour — release and production deployment gate

**Owner-approved standing rule:** Every approved game release must be merged
into GitHub `main` and then deployed to the **existing public game** at
https://perfect-pour.pretty-scarf-0591.chatgpt.site/. No replacement
private Site or different host by default.

## The authoritative project
- Source repository: `SiminanRoll/PerfectPour`, branch `main`.
- Static artifact: `dist/index.html` (Rust/WASM + art + controls embedded).
- ChatGPT Sites config: `.openai/hosting.json` with existing `project_id`
  `appgprj_6b0908af5d34819183b47b403fbcb98b`.
- Existing production URL: https://perfect-pour.pretty-scarf-0591.chatgpt.site/.
  **Do not change the origin**: existing careers are stored in browser
  localStorage, and shifting the hostname can make them appear missing.

## Required release sequence
1. **Inspect:** identify current `main` HEAD, site project identity and
   active save schema. Preserve existing functionality and data.
2. **Implement:** make the requested change, build WASM if engine changes,
   rebuild `dist/index.html`, and run native Rust + browser/source-contract,
   gameplay, save-migration and offline checks.
3. **Merge:** merge approved changes to `main` with the current-HEAD guard;
   read back the merged SHA. Wait for the **completed** main CI success.
4. **Deploy the correct site:** use ChatGPT **Sites in Work mode** (or a
   purpose-built authorized Sites publisher) to select the **existing** Perfect
   Pour Site. Save a version associated with the verified source commit and
   **deploy that saved version** to the original production URL. Publishing
   is a separate action from saving a version; git push alone does not do it.
5. **Verify production:** open the exact production URL as a visitor; read the
   actual release version, check the first customer, ice/fruit behavior and
   next-customer transition, and verify existing progress can be continued
   without being overwritten. Check target phone layout where possible.
6. **Report four separate states:** `MERGED` (GitHub SHA), `CI PASSED`
   (run URL), `DEPLOYED` (Sites version/URL) and `RUNTIME VERIFIED`
   (actual live behavior). If the Sites publisher is unavailable, report
   `DEPLOYMENT BLOCKED` rather than calling the operation finished.

## Why this gate exists
The GitHub CI regenerates and commits the standalone artifact on `main`.
It does **not** invoke ChatGPT Sites publication. The existing Site can
continue serving a previous release after GitHub tests pass. Browser-local
save data is not shared between unrelated hostnames.

## No private preview release
Use a local preview, test runner or a saved, undeployed Sites version for
verification as appropriate. Do **not** publish a second private site as
a replacement for the existing production game.
