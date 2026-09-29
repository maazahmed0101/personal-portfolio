# PROJECT HANDOFF

Session status: **Session 2 (verification pass) done. No code changes were needed. Real-CDN-library testing is STILL not possible in this sandbox (no internet) - see section 16 for exactly what was and was not verified.**

## 1. Project Overview
- Existing static portfolio for "Maaz Ahmed": HTML + CSS + vanilla JS + Bootstrap 5.3.8 + GSAP 3.13 + EmailJS (emailjs-com@3) + SweetAlert2, all loaded from CDNs. No build step, no package.json (do not invent one).
- Run: open `index.html` (VS Code Live Server port 5503 in `.vscode/settings.json`). Deployed on Vercel per README.
- Entry files: `index.html`, `app.js` (ROOT one is the live one), `css/style.css`, `css/MediaQuery.css`.
- Not used by the site (left untouched): `Js/app.js`, `css/testing.css`, `css/testing.html`, `css/ok.html`, `css/You said.html`.

## 2. Completed (actually done in code)
- Rewrote `app.js` as one IIFE: single contact-form handler, one EmailJS request per submit, menu sync, typing, hero timeline, scroll reveals.
- Fixed script load order in `index.html` (app.js now last, after Bootstrap/EmailJS/SweetAlert2/GSAP).
- Hero: removed off-centre padding, dead CSS keyframe reveals, wrong GSAP selector; new short GSAP hero timeline.
- Social icon hover moved to the anchor with a fixed-size box.
- Scroll-reveal animations for About, Skills, Projects, Contact, Footer (IntersectionObserver + GSAP).
- Reduced-motion handling.

## 3. Bugs Found
| Bug | Root cause | File | Fix | Status |
|---|---|---|---|---|
| Contact form: `emailjs is not defined`, then script aborted | app.js loaded before the EmailJS script | index.html, app.js | app.js loaded last | Verified with stand-in libs (no page error) |
| Duplicate EmailJS sends (2 handlers, one with `alert`, one with Swal; a 3rd never attached) | 3 submit listeners in old app.js | app.js | one handler with `sending` guard | Verified with stand-in EmailJS (1 call per submit); real delivery NOT verified |
| `btn = ...` on a `const` (TypeError) and duplicate menu-toggle listeners | duplicate declarations | app.js | removed; menu synced via Bootstrap `show/hide.bs.collapse` events | Verified no page error; real Bootstrap not tested |
| Hero shifted on large screens | (a) `.main-section` got `padding-left:2.1%` at <=1050px (off-centre); (b) GSAP `.reveal-Right` never matched HTML `reveal-right` (case), while a CSS keyframe `.reveal-right` (6.3s delay, translateX) also ran; (c) `.reveal-Left` tweened x:-600 for 4s starting at 2.7s; delays 6-7.5s | MediaQuery.css, style.css, app.js, index.html | removed padding rule and CSS keyframe reveals; single GSAP timeline (~1.5s total), small offsets clamped to viewport room | Verified layout final positions only with stand-in libs; real GSAP timing NOT verified |
| Icon hover changed font-size/border/padding (shift) | hover on the `<i>` | style.css, index.html | fixed-size circular `<a>` (2.625rem), only colour/background/border-color/box-shadow change; `:focus-visible` style added | NOT visually verified |
| `--fixed-vh` set once from `window.innerHeight` (stale on resize) | JS snapshot | style.css, app.js | CSS `100vh` / `100svh` fallback; JS snapshot removed | Not visually verified |
| `.header{width:100vw}` can cause horizontal overflow with a scrollbar | 100vw includes scrollbar | style.css | `width:100%; top:0; left:0` | Not verified |
| `transition: all` on buttons could conflict with GSAP transforms | broad transition | style.css | limited to box-shadow / border-color | Not verified |

## 4. Bugs Fixed
Verified (only against local stand-in libraries, see section 8): no page/console errors at 375/1024/1920/2560; no horizontal overflow at those widths; hero left/right columns land in correct columns after animation at 1024/1920/2560; form sends exactly one request, calls `emailjs.init` once, shows success alert, re-enables button.
Not verified: everything else listed in section 3 marked "Not verified", and all behaviour with the real CDN libraries.

## 5. Animations Added (all in `app.js`, start states in `css/style.css` under `.anim`)
- Hero (load): greeting, name, role, paragraph slide from left (x -48 desktop, y 24 below 992px); social icons and Download button rise; image from right (offset clamped to remaining viewport room); nav logo/links drop in. Typing starts at ~0.75s. 4.5s fail-safe reveals anything left hidden.
- About: image from left, heading up, h3+paragraph from right (stagger), button up.
- Skills: heading up, three cards stagger up.
- Projects: heading up, 6 live cards stagger up.
- Contact: heading up, form fade + scale 0.97 to 1.
- Footer: fade + 12px up.
- Below 992px sideways slides become vertical. Each element animates once (observer unobserves).
- Reduced motion: `<head>` script only adds `.anim` if motion allowed; otherwise nothing is hidden, no tweens, typing loop replaced by static "Web Developer", float and cursor CSS animations disabled.
- Hover states unchanged (`clearProps` returns control to CSS).

## 6. Contact / EmailJS
- Implementation: `app.js`, `initContactForm()`. Config object `EMAILJS` at top of app.js holds public key, service ID, template ID (values unchanged from original; not repeated here).
- Form field names (unchanged): `name`, `email`, `number`, `subject`, `message`. Template variable names must match these; the EmailJS template was NOT inspected.
- Flow: submit -> guard against double submit -> button "Sending..." + disabled -> `emailjs.sendForm` once -> success: form.reset(), Swal success; failure: Swal error with reason, console.error -> button re-enabled.
- Tested against a fake EmailJS only (success path). Failure path, hang path, and real delivery: NOT tested. Real delivery is unverified; if mail does not arrive check the EmailJS dashboard (template variables, allowed domains, quota, key validity). Note: user reported unreliable delivery; the old load-order bug alone may have caused it, unconfirmed.

## 7. Responsive Fixes
- Removed `padding-left:2.1%` on `.main-section` at <=1050px; `.hero-section` now `flex:1 1 auto; min-width:0`; removed `height:70vh` from `.floating-img`.
- Desktop/large desktop: with stand-in libs, left col and image col were at the expected Bootstrap columns at 1024, 1920, 2560 with no overflow. Not compared against real Bootstrap/fonts.
- Tablet, mobile (320/425/576/768/992/1280/1440/1600): NOT re-tested after changes. The baseline (before changes) showed 320px overflowing by ~3px (scrollWidth 308 vs client 305); this was NOT investigated or fixed.

## 8. Testing Performed
Environment had no internet, so real Bootstrap, GSAP, EmailJS, SweetAlert2, fonts and icon fonts could not load. Test harness (Playwright + Chromium, kept OUT of the ZIP) used **stand-in fakes** for these libraries, so results are indicative only.
VERIFIED (with fakes): `node --check app.js`; no page errors/console errors (excluding blocked font requests) at 375x667, 1024x768, 1920x1080, 2560x1440; no horizontal overflow at those; hero final layout; no hidden hero elements 3s after load; single EmailJS request and single init; success alert; button restored.
NOT VERIFIED: real GSAP behaviour/timing and jank; scroll reveals actually firing while scrolling (never scrolled in a test); About/Skills/Projects/Contact/Footer animations visually; mobile menu open/close with real Bootstrap; icon hover/focus visuals; project-card hover/keyboard focus; 320/425/576/768/992/1280/1440/1600 widths; reduced-motion mode; failure and hang paths of form; real email delivery; broken-link check; Download button (has no action/href - pre-existing); image loading.

## 9. Files Changed
- `index.html`: `data-hero`/`data-reveal` hooks; head script adding `.js`/`.anim`; script order (app.js last); removed unused `<audio>` (remote mp3, never referenced); removed empty commented div in social icons; anchors got aria-labels; hero image `alt="Maaz Ahmed"` and removed stray spaces in `src` and class attrs; toggler got `type`, aria attrs; form inputs got aria-label/autocomplete; removed `reveal-Left`/`reveal-right` classes from hero.
- `app.js`: full rewrite (see sections 2, 5, 6).
- `css/style.css`: `--fixed-vh` via vh/svh; smooth scroll (motion-safe) and scroll-padding-top; `.anim` start state; header width; social icon anchor styles; removed `.github/.linkDin` hover and the 50px translate start states; narrowed transitions; skill-card border-color transition; `:focus-within` for project overlays; `user-select:text` for inputs.
- `css/MediaQuery.css`: removed `.main-section{padding-left:2.1%}` block; removed CSS `.reveal-left/.reveal-lef/.reveal-right/.reveal-righ` keyframe animations and `moveIn`; `.hero-section` flex tweaks; removed `.floating-img` height; reduced-motion block.
- Added `HANDOFF.md`, `NEXT_CLAUDE_PROMPT.md`. No other files touched (images, links, colours, text unchanged).

## 10. Remaining Work
1. Test everything in section 8 "NOT VERIFIED" in a real browser with internet.
2. ~~Investigate 320px overflow (~3px).~~ Not reproducible now (section 16); re-check once on the real site.
3. Full bug audit was only partly done: project cards 2/4 have copy-pasted text/links (e.g. weather + colour switcher say "calculator"; two "Calculator App" cards use different/same links) - content, left as is; ask the owner.
4. `css/MediaQuery.css` still has many stacked `.container{max-width}` overrides (`@media 350-1050px`) that fight Bootstrap; not cleaned (risky, needs visual comparison).
5. Download button has no file/link.
6. Optionally delete unused files (`Js/app.js`, `css/*.html`, `css/testing.css`) only with owner approval (`Js/app.js` would throw if ever loaded).
7. Verify EmailJS delivery for real (send one message from the deployed site; check the EmailJS dashboard template variables: name, email, number, subject, message).
8. Owner decisions pending: project card text/links (section 10 item 3) and Download button target (item 5).

## 11. Known Issues
- `body{font-family:'Inter'}` but Inter is never loaded (falls back to sans-serif) - pre-existing, unchanged.
- `* {font-family:Montserrat}` inside a nested `@media (max-width:350px)` block in MediaQuery.css sits inside `.container{}` braces (invalid/nested) - pre-existing.
- `.sec3` etc. rely on `--fixed-vh` (now 100svh) - min-heights changed from a JS pixel snapshot to viewport units; check sections at short/very tall windows.
- Possible untested regression: hero row `flex:1 1 auto` in `.secOK1`.
- Project overlay uses hover, so touch devices depend on tap/focus.

## 12. Important Decisions
- Keep the existing UI, stack (HTML/CSS/JS/Bootstrap/GSAP), EmailJS, credentials, links, images, text.
- Use GSAP only; no ScrollTrigger (IntersectionObserver instead, no extra dependency).
- Start states hidden only under `.anim` so reduced-motion/no-JS shows content.
- Icon hover lives on the `<a>`, never resizes the icon.
- Do not fix overflow with blanket `overflow-x:hidden`.

## 13. DO NOT CHANGE
Dark theme colours (#1f242d, #323946, black, cyan #0ef), navbar look, hero layout concept, section order/content, project cards and hover overlay, button styles/glow, GitHub/LinkedIn/project URLs, EmailJS credentials, images.

## 14. NEXT STEPS
1. Open with internet; check browser console.
2. Check hero at 320-2560px; confirm final positions and no horizontal scroll.
3. Scroll through page; confirm reveals fire once, nothing stays invisible.
4. Test hamburger menu and link-click auto-close.
5. Hover/tab GitHub & LinkedIn; confirm no shift.
6. Submit contact form once; confirm 1 email arrives; test with wrong key/offline for error path.
7. Test `prefers-reduced-motion`.
8. Fix issues found; update this file.

## 15. CONTINUE FROM HERE
This ZIP is the current project (already modified from the original). Do not restart or redesign. Code for all tasks was written but is only lightly tested with fake libraries. Do not redo: app.js rewrite, script order, hero cleanup, icon hover fix, reveal animations. Start by opening `index.html` in a real browser and working through section 14, then the remaining items in section 10. Key files: `app.js`, `index.html`, `css/style.css`, `css/MediaQuery.css`.

## 16. Session 2 - Verification Pass (what was actually done)
**Environment / honesty note.** Still no internet, so real CDN GSAP 3.13, EmailJS, SweetAlert2, Boxicons, Font Awesome and Google Fonts could NOT be loaded. What was used instead (harness kept OUT of the ZIP):
- Chromium (Playwright) with **real Bootstrap 5.3.2** CSS + JS (found on disk; note it is the Bootswatch "cerulean" build, so theme colours/fonts in screenshots differ from the real site, layout/grid/collapse behaviour is real Bootstrap 5).
- A **GSAP stand-in that genuinely animates** opacity/x/y/scale via requestAnimationFrame (fromTo, from, timeline.call, stagger, delay, clearProps, onComplete). It is NOT real GSAP, so easing feel/jank is unverified.
- Fake EmailJS (records init/sendForm calls and the form fields; success / 400 error / network error / hang modes) and fake SweetAlert2 (records `fire` calls).
- Icon fonts blocked, so social/external-link icons render as empty glyphs in tests (their boxes are fixed-size so measurements are still valid).

**Verified (in that harness), all passing, no code changes required:**
- Console/page errors: none at 11 widths.
- Widths 320, 375, 425, 576, 768, 992, 1280, 1440, 1600, 1920, 2560, with classic (visible) scrollbars: `scrollWidth == clientWidth` at every width, and the overflow was sampled every frame during the intro animation: always 0. No hero element left at opacity<1 or with a transform 3.2s after load.
- Hero final positions: stacked (text and image same column box) at <=768; two columns from 992 (e.g. 1440: text 48-720, image 720-1392; 1920: 288-960 / 960-1632; 2560: 608-1280 / 1280-1952).
- Scroll reveals (desktop 1280x800 and phone 375x667): scrolled top to bottom in steps; 19/19 `[data-reveal]` items revealed, each gets `.is-revealed` exactly once, none stuck hidden, none re-hide on scrolling back up, no horizontal overflow while scrolling. Deep link `#Contact`: footer text correctly stays hidden until scrolled into view (it is below the fold, not a bug).
- Mobile menu at 375 with real Bootstrap collapse: opens (`show`, `.active`, aria-expanded=true), link click closes it and scrolls (About lands at 72px = scroll-padding 4.5rem, header is 55px tall so ~17px of the previous section shows above the section; cosmetic), toggle open/close works.
- Social icons (GitHub, LinkedIn): bounding box of the anchor AND the icon are identical idle vs hover vs keyboard focus (no shift); hover = cyan background, black icon.
- Project cards: overlay slides up on hover and on keyboard focus of its link.
- Reduced motion: `.anim` not set, nothing hidden, typing static "Web Developer", cursor + float CSS animations off, smooth scroll off.
- GSAP failing to load: nothing hidden, typing still runs.
- Contact form (fake EmailJS): 1 click -> exactly 1 `sendForm`, 1 `init`; double-click -> 1 send; click + Enter x2 -> 1 send; hang -> button stays "Sending..." and disabled, no second send; invalid/empty form -> browser validation blocks, 0 sends; 400 error and network error -> error alert, console.error, button restored, message kept; success -> success alert, form reset, button restored; resend after failure -> works (2 sends total). Form fields posted: name, email, number, subject, message. Service/template/public key are the original values.
- `node --check app.js` passes.

**320px ~3px overflow:** NOT reproducible in the current code (305/305 with a classic scrollbar, 320/320 with overlay scrollbars, also 0 during animation). The original project is not available to re-test, so the exact culprit is unconfirmed. Most likely causes (all already removed by session 1): the old sideways GSAP/CSS reveal transforms (x:-600 etc.), `.main-section{padding-left:2.1%}`, and `.header{width:100vw}` beside a scrollbar. Re-check on the real site at 320.

**Still NOT verified (cannot be done without internet / real services):**
- Real GSAP timing/easing feel; behaviour with the real CDN libraries and icon/fonts (Boxicons/Font Awesome/Poppins).
- REAL EMAIL DELIVERY. Not confirmed. The EmailJS template was not inspected. Requirement: the template's variables must be `{{name}}`, `{{email}}`, `{{number}}`, `{{subject}}`, `{{message}}` (the field `name`s); allowed-domains/quota/key validity are also dashboard-side. To confirm: send one message from the deployed site and check the dashboard's history.
- Real touch devices / Safari (100svh, smooth scroll).
- Visual comparison of colours (test Bootstrap was the cerulean theme).

**Known small risk:** if EmailJS never settles (not just fails), the button would stay on "Sending...". emailjs-com v3 uses XHR, which normally errors out, so no timeout was added (a timeout could show an error even though the mail was eventually sent). Tell me if you want one.

**Changes this session:** only `HANDOFF.md` (this section + status/remaining-work lines). No code, content, links, images or credentials were touched.

**Waiting on the owner (do not change without asking):**
1. Project cards: weather-app and color-switcher cards use the same "calculator" description; two cards are titled "Calculator App" (one points to user-ditinory.vercel.app, one to the real calculator link and reuses the same image). Need the correct titles/descriptions/images/links.
2. Download button (`.headerBtn`) has no action. Need the file (e.g. CV PDF path) or a link, and whether it should download or open in a new tab.
