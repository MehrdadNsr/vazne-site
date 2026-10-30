# Changelog — vazne.app

Newest first. Each entry: what changed, why, how it was checked.

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
