# Changelog — vazne.app

Newest first. Each entry: what changed, why, how it was checked.

## 2026-10-30 — Tester page: what to do on error 403 at step 2

- `/test/` (owner, 2026-10-30): under step 2, a closed «خطای ۴۰۳ دیدی؟» box with the owner's steps: VPN on with a server
  outside Iran (Europe or Canada), restart the browser or use a private tab so the cached 403 page isn't shown, open the
  testing link again (`data-link="androidOptIn"`), install with the VPN still on; still 403 → change the server or VPN.
  Same steps in the English summary. Cache version `20261030c`.
- Checked: `tools/check.sh --browser` (all passed); screenshots with the box open at 390 px and 1280 px; the extra link does
  not mark step 2 as done.

## 2026-10-30 — Tester page: VPN note for Android testers in Iran

- `/test/` (owner, 2026-10-30): a note at the top of the Android steps: from Iran, without a VPN you can't join the Google
  group and Google Play doesn't open, so turn a VPN on first and then do all three steps. Same sentence added to the
  English summary. New `.notice` style in `assets/test.css` (existing crimson tint and `--red`), cache version `20261030b`.
- Checked: `tools/check.sh --browser` (all passed); screenshots of the Android section at 390 px and 1280 px.

## 2026-10-30 — Tester page step 3; who is who in the terms

- `/test/`: «۳. نصب از Google Play» stays grey until steps 1 and 2 were opened in this browser, with «اول مرحله‌ی ۱ و ۲ رو بزن…» and
  a «قبلاً انجامشون دادم» link past it (not a lock: Google Play itself refuses non-testers). New line under it: without joining
  the group and turning the test on, Google Play won't install.
- Terms §8 (owner, 2026-10-30): Vazne is a product of TrAfactor AI Studio, owned by Mehrdad Khani; presented in collaboration
  with IFA Group (CEO Seyed Abbas Nazari), advice and consultation only, no rights in the app. One name, no brackets.

## 2026-10-30 — Terms: TrAfactor AI Studio

- Terms §8 (owner, 2026-10-30): Vazne is presented by TrAfactor AI Studio («استودیو هوش مصنوعی ترافکتور») in collaboration
  with IFA Tech Group; the collaboration is not direct, only advice and consultation on general matters. Same wording as
  the app's new credit line (app OTA 1.1.7).

## 2026-10-30 — IFA in the terms, barbell on the tester page

- Terms: new section 8 «Ownership and partners» / «مالکیت و همکاران» (owner's wording, 2026-10-30): Vazne is owned by
  Mehrdad Khani (Mehrdad Nasrollah Khani); IFA Tech Group (گروه ایفاتک) and its CEO are an indirect partner that advises
  on general matters, with no ownership or official/legal rights in the app. Sections 8–13 became 9–14; updated date.
- `/test/`: a small 3D barbell at the top (slowly turning, can be dragged) with a «وزنه چیه؟» link to the home page.
  The barbell code moved to `assets/barbell.js`, shared with the home page (home verified pixel-identical).
- Checked: `tools/check.sh --browser`, home before/after style and pixel comparison, barbell framing at 320–1920 px.

## 2026-10-30 — Cleanup, Arabic and Spanish, first-visit language

- **One look for every page.** Guides, privacy, terms, delete-account and 404 now share the home page's top bar,
  footer, colours and fonts (before: four different designs, Google Fonts on some pages, a blue favicon and social card
  left from an old theme). Shared styles in `assets/base.css`; `assets/page.css` for content pages.
- **Home page in four languages** (`/`, `/fa/`, `/ar/`, `/es/`) generated from one template (`src/home.html` +
  `src/i18n/*.json`, `tools/build.py`), so a layout change can no longer drift between languages.
- **Persian page fixed:** it had no `dir="rtl"`, English labels (nav, footer, demo, links), monospace Persian text with
  broken letters and arrows pointing the wrong way.
- **Mobile bug fixed:** on phones the hero's "Explore the experience" button and status line were pushed off-screen
  (a later CSS layer overrode the mobile one-column layout). The home CSS is now one clean layer; every other
  computed style was verified identical to before at 390–1600 px.
- **Language menu** on every page; **first visit to `/`** goes to the visitor's language by device time zone (Iran →
  Persian, Arab countries → Arabic, Spain/Latin America → Spanish), never for crawlers or after a manual choice.
  Legal pages open in Persian for Persian readers.
- Guides: the "try the demo" links (`#demo`) work again; each guide has a "become a tester" button.
- Data: three.js (the 3D barbell) is skipped for visitors in data-saver mode or on 2G; the drawn barbell stays.
- Sitemap generated with hreflang alternates (13 URLs). Removed dead files (old `style.css`, `motion.css`, `seo.css`,
  `legal.css`, `site.js` and its stale tests, unused `barbell.webp`). New checks: `tools/check.sh`, `tests/`.
- Docs: README rewritten, rules in AGENTS.md (CLAUDE.md points to it), this changelog.
- Review fixes: Arabic / Spanish / Persian wording, no letter-spacing on Persian or Arabic anywhere, crawler list
  narrowed (Telegram's in-app browser is a person), language links to `/` carry `?lang=en` so the choice holds even
  without browser storage, link-preview text localised.
- Checked: `bash tools/check.sh --browser` (33 page loads, Android / iPhone / desktop), region tests in Chromium
  (Tehran, Kabul, Riyadh, Cairo, Madrid, Mexico City, Toronto, Berlin, Googlebot), independent review before deploy.

## 2026-10-30 — Tester page

- `/test/` (Persian, `noindex`): Android closed-testing steps (Google group → Become a tester → Google Play), iPhone
  TestFlight, visitor's platform first, QR code on computers, opened steps ticked. All links in `assets/links.js`
  (App Store slot empty until launch).
- Home: the "beta access" email button became Android (→ `/test/`) and iPhone (→ TestFlight) buttons plus a tester link.
- Checked: Playwright on Android / iPhone / desktop, QR decoded, independent review; deployed and verified live.
