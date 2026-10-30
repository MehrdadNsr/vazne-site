# vazne.app — the Vazne website

Static website for Vazne (وزنه), the strength-training app. Plain HTML, CSS and JavaScript, published by **GitHub
Pages from the `main` branch, repository root**: a push to `main` is live within about a minute. Rules for anyone
(person or AI) changing it: [AGENTS.md](AGENTS.md). History: [CHANGELOG.md](CHANGELOG.md).

## Pages

| URL | What | Language |
|---|---|---|
| `/`, `/fa/`, `/ar/`, `/es/` | Home page (3D barbell, demo, FAQ, download buttons) | English, Persian, Arabic, Spanish |
| `/test/`, `/fa/test/` | Tester page: small 3D barbell, Android closed testing (3 steps), iPhone TestFlight, QR code on computers. The Persian page alone adds the help for Iran: VPN note, error 403 at step 2, direct APK download. `/test/` sends Iran's time zone (or a saved Persian choice) to `/fa/test/` (`assets/lang.js`, `data-persian-page`; AGENTS.md rule 12) | English, Persian — `noindex` |
| `/guides/…`, `/fa/guides/…` | Three guides: workout log, plan import, reading progress | English + Persian |
| `/privacy/`, `/terms/`, `/delete-account/` | Legal pages; both languages in one file, English is binding. Linked from the app and the stores: never move them | English + Persian (`?lang=fa`) |
| `404.html` | Page not found | English + links to every language |

## Languages and the first visit

Every page has a language menu (globe icon) with the languages that page exists in. On the **English home page only**,
a first-time visitor is sent to their language (`assets/lang.js`):

1. the language they picked before on this site (saved when they click a language link), else
2. their **region**, read from the device's time zone: Iran / Afghanistan → Persian, Arab countries → Arabic, Spain and
   Spanish-speaking America → Spanish (no IP lookup: nothing is sent to a third party, it works on GitHub Pages and it
   stays right for visitors in Iran on a VPN), else
3. their browser's first language if the site has it, else English.

Crawlers, visitors coming from another page of the site and people who already chose are never redirected, so Google
indexes every language at its own URL (hreflang). **To test:** open `https://vazne.app/?tz=Asia/Riyadh` (pretend time
zone; also `Asia/Tehran`, `Europe/Madrid`, `America/Toronto`), or a private window from the real place.

The app itself is in English and Persian; the Arabic and Spanish pages say so.

## Files

```
index.html, fa/ ar/ es/index.html   home pages — GENERATED from src/ (do not edit by hand)
src/home.html                       home page template
src/i18n/{en,fa,ar,es}.json         all home-page text + top bar / footer text (English is the source)
src/partials/poster.svg             drawn barbell shown before / instead of the 3D one
guides/, fa/guides/, privacy/, terms/, delete-account/, 404.html, test/   hand-written pages; their top bar and
                                    footer (between <!-- nav --> and <!-- footer --> markers) are generated
assets/base.css                     colours, fonts, top bar, language menu, footer — every page
assets/experience.css, experience.js   home page
assets/barbell.js                   the 3D barbell (home + the small one on /test/); three.js loads only if the visitor is not saving data
assets/page.css                     guides, legal pages, 404
assets/test.css, testers.js         tester page and the download buttons
assets/links.js                     EVERY download / tester link (see below)
download/vazne-<version>.apk         direct Android download on /test/ (only the newest file; see below)
assets/lang.js                      language menu, saved choice, first-visit language
assets/legal.js                     picks English or Persian on the legal pages
assets/three-0.160.1.min.js         three.js (MIT, assets/THREE-LICENSE.txt)
assets/Estedad.woff2                Persian/Arabic font (OFL, assets/Estedad-OFL.txt); English uses Arial
sitemap.xml                         GENERATED (with hreflang alternates); /test/, /fa/test/ and 404 are left out on purpose
tools/build.py                      builds the generated parts;  tools/check.sh  runs every check
tools/make_qr.py, render_social_card.py   QR code on /test/, social-card.png (link previews)
tests/                              test_site.py (links, SEO, translations), scripts.test.cjs (lang.js, testers.js)
```

## Common changes

- **A download or tester link** (e.g. the App Store link at launch): edit `assets/links.js`. Fill `iosAppStore` and every
  iPhone button switches to the App Store, with TestFlight as a secondary link. Also update the same link in the HTML
  (it is the fallback without JavaScript; `tests/test_site.py` fails until they match). If the tester page's address
  changes, regenerate its QR code: `python3 tools/make_qr.py`.
- **New Android build → new APK on /test/:** in the app repo build the `website-apk` profile too
  (`npx eas-cli@latest build -p android --profile website-apk`; arm64-only APK, channel `production`). Check it (no keys
  inside), put it in `download/` as `vazne-<version>.apk`, delete the old file, update `androidApk` in `assets/links.js`,
  the fallback `href` and the size on the button in `fa/test/index.html` (the English page has no APK). OTA updates reach it on their
  own; only a new build needs a new file.
- **Home page text:** edit `src/i18n/<lang>.json` (keep the same keys in all four), then `python3 tools/build.py`.
- **Home page layout:** `src/home.html` (+ `assets/experience.css`), then build.
- **Top bar / footer / language menu:** `tools/build.py` (`nav()`, `footer()`) + `assets/base.css`, then build.
- **A guide or legal page:** edit the HTML directly (outside the markers). Legal text comes from the owner; keep the
  English and Persian versions saying the same thing and update "Last updated".
- **A new page:** write it in English and Persian (AGENTS.md rule 12): copy a guide pair, add both to `PAGES` (and
  `SITEMAP` if they should be indexed) in `tools/build.py`, put `data-persian-page="/fa/…"` on the English page's lang.js
  tag, add the pair to the twin check in `tests/test_site.py`, build.

## Checking and publishing

```bash
python3 tools/build.py          # regenerate
bash tools/check.sh             # build up to date, links, SEO, translations, script tests
bash tools/check.sh --browser   # + every page in Chromium as Android / iPhone / computer (needs Playwright)
```

Work on a branch or a separate folder, never directly on `main`. When everything passes, push to `main`, wait about a
minute and open the changed pages on https://vazne.app. Website changes never touch the app repository, the app server
or DNS records other than the website's own (the `api` record belongs to the app server).

Search: the sitemap is at https://vazne.app/sitemap.xml (submit it in Google Search Console after big changes). Do not invent prices, ratings,
reviews, store links or download counts in the structured data; the app is in testing.
