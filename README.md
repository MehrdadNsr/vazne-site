# Vazne website

Bilingual Persian/English product website for Vazne at https://vazne.app.

Static HTML, CSS and JavaScript. No build step or application backend. Publish with GitHub Pages from the `main` branch, repository root.

- `index.html`: responsive landing page, inline SVG barbell and English copy. `fa/index.html` is the independently crawlable Persian version.
- `site.js`: animated plate stacks, pointer/touch/keyboard slider and scroll reveals.
- `motion.css`: glass controls, vector icons and reduced-motion-aware animation.
- `Estedad.woff2` / `Estedad-OFL.txt`: self-hosted Persian variable font and its OFL license.
- `CNAME`: custom website domain.
- `.nojekyll`: serve the static files directly.
- `privacy/`, `terms/`, `delete-account/`: legal pages (Persian and English in the same HTML; `legal.css`, `legal.js`). The English text is the source. Linked from every page's footer.
- `sitemap.xml`: canonical public page URLs for search engines. Update it when adding, removing or changing a public page URL; omit fragments and language-toggle variants that share the same URL.
- `robots.txt`: permits crawling and advertises the sitemap at `https://vazne.app/sitemap.xml`.

The page uses the existing Vazne dumbbell glyph with the owner’s silver/white glass and electric-blue reference direction. `style.css` holds shared layout styles and `seo.css` styles the guide and FAQ content. Persian uses self-hosted Estedad; Manrope and the Vazirmatn fallback are loaded from Google Fonts. Icons and the animated barbell are local SVG, with no animation library or external icon service. It does not collect form submissions or persist demo data.

The demo ranges from 20 to 100 kg in 2.5 kg steps. A 20 kg bar carries equal stacks of 2.5 kg plates, plus a 1.25 kg plate on each side for half steps. Plate count never decreases when total weight increases. The whole ruler supports horizontal pointer dragging; vertical touch gestures remain available for page scrolling. Native range semantics support keyboard and screen readers. Scroll reveals run once and respect `prefers-reduced-motion`; content stays visible without JavaScript or IntersectionObserver.

Run logic and DOM checks with `node --test site.test.cjs`.

Public app download links have deliberately not been added: both platforms are currently in testing. The Google Play badge in the download section is a disabled placeholder: set `PLAY_STORE_URL` in `index.html` to the store link to turn it into a real link (and swap in Google's official badge artwork at launch).

Website changes must not modify the `api` DNS record, app repository or app server. Only website apex/www configuration is in scope.

## Search and localization

English lives at `/`; Persian lives at `/fa/`. Language links navigate to the matching static URL. Keep each language page self-canonical and keep reciprocal `en`, `fa` and `x-default` alternate links. Never redirect based on browser language.

Three paired guides live under `/guides/` and `/fa/guides/`: workout tracking, plan import and progress tracking. Keep translations, internal links and sitemap entries in sync when editing them. All public content is present in the initial HTML without JavaScript.

Home pages contain WebSite, WebPage and SoftwareApplication JSON-LD. Guides contain WebPage and BreadcrumbList JSON-LD. Do not invent prices, reviews, ratings, store links or download counts. The app remains in testing until verified launch information is supplied. `social-card.png` is the 1200 × 630 sharing card; `favicon.svg` is the crawlable site icon. The 404 page is excluded from indexing.

Run `python seo.test.py` and `node --test site.test.cjs` before publishing. After publishing, verify canonical URLs return 200 and unknown URLs return 404. Submit `https://vazne.app/sitemap.xml` in the verified Search Console property and inspect `/` and `/fa/`. Track brand queries Vazne and وزنه, indexed URLs, impressions and clicks; a sitemap does not guarantee indexing or rankings.
