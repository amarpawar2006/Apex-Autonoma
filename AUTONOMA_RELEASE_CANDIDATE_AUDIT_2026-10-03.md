# Apex Autonoma — Release Candidate Stabilization Audit
Date: 2026-10-03
Scope: integrated UI/UX/accessibility/media/persistence stabilization. Campaign generation is frozen.

## Release principle
This pass intentionally does not change the working campaign synthesis/retry engine or `src/services/campaignService.ts`. The goal is to make the surrounding product reliable and consistent without trading one regression for another.

## Defect register

| # | Defect | Status | Verification |
|---|---|---|---|
| 1 | Create Campaign modal rendered under the sticky header | FIXED / VERIFIED | Modal layer raised to z-[300]; header remains z-[100]/menus z-[120] |
| 2 | More menu could float above the Create Campaign modal | FIXED / VERIFIED | Same stacking hierarchy; modal now dominates all header menus |
| 3 | Create Campaign modal could reopen part-way down the form | FIXED / VERIFIED | Scroll resets to top every open; focus moves into dialog |
| 4 | Campaign example looked like entered text while counter said 0 | FIXED / VERIFIED | Placeholder explicitly says “Example only”; helper clarifies empty state |
| 5 | Two onboarding systems contradicted each other (4/6 vs 6/6) | FIXED / VERIFIED | Main workspace uses one Guided Setup surface; duplicate profile checklist removed |
| 6 | Guided Setup said “Generate first creative image” for carousel/video workflows | FIXED / VERIFIED | Step renamed “Produce first media asset” and covers carousel/post/video |
| 7 | “Needs retry” media status was ambiguous | FIXED / VERIFIED | User-facing state now “Generation failed” |
| 8 | Sapient/other clients displayed `APEX-` asset codes | FIXED / VERIFIED | User-facing codes render as `AUTO-`; storage IDs remain unchanged |
| 9 | Creative Studio ignored saved client Brand System | FIXED / VERIFIED | Studio resolves active company profile/brand on workspace change |
| 10 | Generic renderer leaked `APEX ENGINEERING`, `APEX //`, AES-DS and orange/black | FIXED / VERIFIED | Generic render path is company-aware; hardcoded Apex markers removed |
| 11 | Brand save did not refresh the app-wide active company immediately | FIXED / VERIFIED | Brand save callback updates activeCompany/session state |
| 12 | Brand could remain stale after switching workspaces | FIXED / VERIFIED | Brand/Studio reload against active workspace identity |
| 13 | Company Understanding had white text on light cards | FIXED / VERIFIED | Contrast corrected to dark text on light cards |
| 14 | Structured AI data such as `{Pillar, Description}` could crash React error #31 | FIXED / VERIFIED | Defensive strategy/display normalization added |
| 15 | Main app mixed large dark operational panels with the light application | FIXED / VERIFIED | Global light theme; Publishing, recovery, auth/pending states aligned |
| 16 | Login and approval screens used a separate dark visual system | FIXED / VERIFIED | Light application shell applied; Google button uses outline theme |
| 17 | Publishing screen simulated false “successfully published” claims | FIXED / VERIFIED | Rebuilt as Publishing Readiness; no claim of publishing without connector |
| 18 | Virality screen exposed Apex-specific automation copy and fake reach/lead projections | FIXED / VERIFIED | Rebuilt as generic Growth Mechanics Lab with explicit heuristic limitation |
| 19 | “Virality Score” looked like a predictive performance metric | FIXED / VERIFIED | User-facing terminology standardized to AI Content Score |
| 20 | Missing score/reach data could be replaced with fabricated fallback numbers | FIXED / VERIFIED | UI shows Not available / em dash instead of invented 88/3900/+5 defaults |
| 21 | Header menus lacked expanded/menu semantics | FIXED / VERIFIED | ARIA expanded/haspopup/menu labels added |
| 22 | Icon-only playback/carousel controls lacked accessible names | FIXED / VERIFIED | ARIA labels added to critical Studio/Production controls |
| 23 | Create Campaign did not expose keyboard Escape/focus entry behavior | FIXED / VERIFIED | Escape close + initial dialog focus added |
| 24 | Background could continue scrolling behind dialogs | FIXED / VERIFIED | Global body scroll lock for aria-modal dialogs |
| 25 | Reduced-motion preference was not respected globally | FIXED / VERIFIED | `prefers-reduced-motion` rule added |
| 26 | Keyboard focus could be visually unclear | FIXED / VERIFIED | Global `:focus-visible` treatment added |
| 27 | OpenAI image flow was stale / not wired to selected provider/model context | FIXED / CODE VERIFIED | GPT Image 2 default; selected provider/model/context sent end-to-end |
| 28 | Image UI required base64 even if provider returned file URL | FIXED / VERIFIED | Production accepts `dataUrl || fileUrl` |
| 29 | NVIDIA video returned fake success with no playable video | FIXED / VERIFIED | Fake path removed; NVIDIA is image-only in this build |
| 30 | Video route/frontend response shape disagreed on async operation name | FIXED / VERIFIED | `operationName` is propagated and polled consistently |
| 31 | Veo job polling window was too short | FIXED / VERIFIED | 10-second cadence, up to ~6 minutes, with persisted timeout state |
| 32 | Veo polling/download used inconsistent operation construction | FIXED / VERIFIED | `GenerateVideosOperation` shape matches current async polling pattern |
| 33 | Generated media could disappear after reload/redeploy | FIXED / VERIFIED | Asset schema + Supabase mapping now persist image/video/carousel media state |
| 34 | Generated media was only written to ephemeral local server storage | FIXED / VERIFIED | Durable `generated-media` Supabase Storage bucket added, tenant-scoped paths |
| 35 | Media metadata was loaded but not restored during authoritative bootstrap | FIXED / VERIFIED | Remote `media` is merged into authoritative store |
| 36 | AI provider/model settings were local-only and could be lost on restart | FIXED / VERIFIED | Settings now load/upsert through Supabase and bootstrap restores them |
| 37 | Future campaign strategy fields were not fully persisted to Supabase | FIXED / VERIFIED | Audience/insight/value/pillars/language/generation metadata included in adapter |
| 38 | Local media download endpoint did not require authentication | FIXED / VERIFIED | Authentication + active membership now required |
| 39 | Generated-media object paths had no company namespace | FIXED / VERIFIED | Storage path now begins with sanitized active company id |
| 40 | Workspace switching overlay could sit below header menus | FIXED / VERIFIED | Blocking state raised above app chrome and aligned to light theme |

## Database changes applied to Apex Autonoma Supabase
Project: `rlghcpcfyreipikdiwfh`

### `public.assets` additions
- `generated_image_url`
- `generated_video_url`
- `carousel_visuals_json`
- `production_error`
- `video_operation_name`
- `target_buyer_persona`
- `target_reach`
- `estimated_impressions`
- `expected_leads`

### Storage
Public bucket `generated-media` created for social creative output, with image/video MIME restrictions and 100 MB object limit. Object keys are scoped by company id.

## Regression tests
- TypeScript syntax/transpile: 48 TS/TSX files, 0 errors.
- Static integrated release assertions: 44/44 PASS.
- Campaign server synthesis/retry region: byte-equivalent to pre-release baseline.
- `src/services/campaignService.ts`: byte-equivalent to pre-release baseline.
- Supabase schema verification: new generated-media columns verified present.
- Supabase Storage verification: `generated-media` bucket verified present.

## Campaign generation freeze proof
Campaign server synthesis/retry region SHA-256:
`417f000e1f7df50b0dfb363c609dfe469d7162ab068719b42d90b0508b4adfd5`

`src/services/campaignService.ts` SHA-256:
`4e605d2ddd03c4ed1e6e565e2ac15b5c71017fa42fdc8e1bee1557427ee60267`

Both match the pre-release snapshot used for this stabilization pass.

## Provider status
### Images
- OpenAI: wired to server-side Image API, recommended model `gpt-image-2`.
- NVIDIA: image path retained; user-facing video capability removed.
- Generated image output can persist to Supabase Storage and back to the asset record.

### Video
- Google Veo: async text-to-video path using `veo-3.1-generate-preview`.
- Operation name is stored/polled, completed video is downloaded and persisted to Supabase Storage.
- NVIDIA: not advertised as text-to-video in this build; no fake success response.

## Honest runtime limitations of this audit
1. The sandbox does not contain project `node_modules`, and outbound npm install is unavailable. A full Vite production build could not be executed here. Source transpile validation was run across all TS/TSX files instead.
2. Live OpenAI/NVIDIA/Veo generations were not executed because the AI Studio server secrets are not available in this sandbox. Provider integration was validated statically against the server/client contract and current provider documentation; final secret/quota/network behavior must be confirmed in the deployed runtime.
3. No claim is made that external social publishing is live. The Publishing screen now explicitly presents readiness rather than simulated delivery.

## Final integrated acceptance test after deployment
Run once after the release candidate is deployed:
1. Open Create Campaign: modal begins at top, covers header/More, Escape closes it.
2. Confirm existing campaign generation still produces the same quality/content behavior.
3. Sapient Dynamics → Brand → save one token → Studio: preview immediately follows Sapient branding.
4. Switch company: Brand/Studio use only the new workspace’s values.
5. Open campaign strategy with structured pillars: no React recovery/error #31.
6. Generate one image using the configured image provider; reload page and confirm media remains attached.
7. Generate one Veo video if quota is available; wait for completion, reload and confirm playable media remains attached.
8. Verify Today/Calendar/Content/Publishing/More at desktop and mobile widths for readable light-theme contrast and keyboard focus.


## RC2 Stabilization Addendum — 2026-10-03

Additional defects reported after first RC validation were resolved in the integrated RC2 package:

- Content is now directly accessible in primary navigation on desktop; mobile remains available in the mobile nav drawer.
- Asset Production modal is elevated above the global header/menu stack (`z-[500]`) and closes with Escape, close button, or backdrop click when generation/upload is idle.
- Global header menus and workspace controls are disabled while a blocking dialog is open, preventing More/Account/Workspace menus from appearing above dialogs.
- Excel-origin time values such as `1899-12-30T11:23:50.000Z` are normalized for human display rather than shown raw.
- Image generation now attempts an automatic fallback to another configured image-capable provider when the preferred provider fails.
- Finished external media can be uploaded back into an asset (PNG/JPG/WEBP/MP4 up to 100 MB) and stored durably in Supabase Storage.
- Video workflow explicitly preserves the Veo paid-quota limitation while providing a complete external generation + re-upload fallback.
- New searchable contextual Help drawer added from the global header. It is screen-aware and includes help for Campaigns, Content, Brand, Studio, image generation, video/Veo billing, Calendar, Publishing, company setup and new campaign creation.
- The large onboarding guide is now restricted to Today rather than occupying every workspace screen.

### RC2 regression result

`test/release_candidate_regression.mjs`

- 52 assertions
- 52 PASS
- 0 FAIL

### TypeScript source validation

- 48 TS/TSX files transpile-checked
- 0 syntax/transpile errors

### Production build limitation

The sandbox does not contain project `node_modules`; `npm run build` therefore cannot execute because `vite` is not installed locally. This is an environment limitation, not a passed build claim. Final Vite build must run in AI Studio/deployment environment after sync.
