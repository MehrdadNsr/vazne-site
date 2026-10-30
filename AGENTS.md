# Rules for changing vazne.app

Read [README.md](README.md) first (pages, files, how to build). Maintainer: Claude, on the owner's decision of
2026-10-30 (owner: Mehrdad). Several agents edited this site before and left four different looks, dead files and
English text on Persian pages; these rules exist so that does not happen again.

1. **`main` is the live site.** Never edit or push to `main` mid-work. Work on a branch or a separate folder, run
   `bash tools/check.sh` (and `--browser` for anything visual), then push to `main` once, and check the live pages.
2. **Generated files are not edited by hand:** the home pages (`index.html`, `fa/`, `ar/`, `es/`), the top bar and footer
   regions between `<!-- nav -->` / `<!-- footer -->` markers, and `sitemap.xml`. Edit `src/` or `tools/build.py`, then
   `python3 tools/build.py`. The check fails if they are out of date.
3. **One look.** Colours and fonts live in `assets/base.css` (crimson `--red` for the brand, `--ink` black, `--paper`
   grey). No new colours, fonts or design systems; small additions in the existing style are fine. The owner allows
   changes up to about 30% of the look; bigger redesigns need the owner.
4. **Every language, every time.** A text change in one language is made in all four (`src/i18n/*.json` keep the same
   keys). English is the source. Persian: the site's warm spoken tone on the home page, standard written Persian in
   the FAQ, guides and legal pages; Persian digits. Arabic: Modern Standard Arabic, Western digits. Spanish: neutral,
   «tú». Do not claim the app speaks Arabic or Spanish until it does.
5. **Right to left.** Persian and Arabic pages are `dir="rtl"`. Use logical CSS (`inset-inline-*`, `margin-inline-*`,
   `text-align: start/end`). Never put `letter-spacing` or a monospace font on Persian/Arabic text (it breaks the
   joined letters). Arrows flip with `.arrow`. Charts and the weight slider stay left-to-right.
6. **Links in one place:** download and tester links only in `assets/links.js` (+ the same link as the HTML fallback).
7. **Light and private.** No third-party scripts, trackers, analytics or web fonts (mobile data is expensive in Iran and
   the privacy policy promises no tracking). New images: compressed, with width/height. Big things load only when
   needed (three.js is skipped when the visitor saves data).
8. **Indexing:** `/test/` and `404.html` are `noindex` and stay out of the sitemap; never `Disallow` them in robots.txt.
   No redirects by language except the first-visit rule on `/` in `assets/lang.js`.
9. **Legal pages** (`/privacy/`, `/terms/`, `/delete-account/`) are linked from the app and the store listings: never move
   or rename them. Their wording comes from the owner / the app repository's legal docs; do not change what they mean.
10. **Never publish secrets** (keys, tokens, .env, store or console links). Everything in this repo is public at
    vazne.app/<path>.
11. **Record every change** in `CHANGELOG.md` (date, what, why, how checked), and update README.md when a page, file or
    rule changes.
