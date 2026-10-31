# Rules for changing vazne.app

Read [README.md](README.md) first (pages, files, how to build). These rules keep every page on one look and every
language in step.

1. **`main` is the live site.** Never edit or push to `main` mid-work. Work on a branch or a separate folder, run
   `bash tools/check.sh` (and `--browser` for anything visual), then push to `main` once, and check the live pages.
2. **Generated files are not edited by hand:** the home pages (`index.html`, `fa/`, `ar/`, `es/`), the top bar and footer
   regions between `<!-- nav -->` / `<!-- footer -->` markers, and `sitemap.xml`. Edit `src/` or `tools/build.py`, then
   `python3 tools/build.py`. The check fails if they are out of date.
3. **One look.** Colours and fonts live in `assets/base.css` (crimson `--red` for the brand, `--ink` black, `--paper`
   grey). No new colours, fonts or design systems; small additions in the existing style are fine. A redesign needs
   the owner's OK.
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
8. **Indexing:** `/test/`, `/fa/test/` and `404.html` are `noindex` and stay out of the sitemap; never `Disallow` them in
   robots.txt. No redirects by language except in `assets/lang.js`: the first visit on `/`, and rule 12.
9. **Legal pages** (`/privacy/`, `/terms/`, `/delete-account/`) are linked from the app and the store listings: never move
   or rename them. Their wording comes from the owner / the app repository's legal docs; do not change what they mean.
10. **Never publish secrets** (keys, tokens, .env, store or console links). Everything in this repo is public at
    vazne.app/<path>.
11. **Record every change** in `CHANGELOG.md` (date, what, why, how checked), and update README.md when a page, file or
    rule changes.
12. **Persian and English, always (owner, 2026-10-30).** Every page exists in both: write a Persian page and you write its
    English twin too, and the other way round (Arabic and Spanish only where they already exist). Every page has the
    language menu in the top bar. The English address is the one to share: it sends visitors in Iran to the Persian twin
    and everyone else stays on English (`data-persian-page="/fa/…"` on the English page's lang.js tag; Iran = time zone
    `Asia/Tehran` or a saved Persian choice; never crawlers or `?lang=`). Time zone, not IP: GitHub Pages can't see the IP
    without a third-party service (rule 7), and Iranians on a VPN would get English by IP. Persian addresses never move.
    Help that only applies to Iran (VPN, error 403, direct APK) goes on the Persian page only.
13. **A big job: say so in the first seconds (owner, 2026-10-31).** He sends a task and leaves the chat. When a message
    looks like a heavy job (minutes or more, several steps, a push of many pages, anything that will need his OK), the
    very first output, before reading files, is one Persian line, e.g. «کار بزرگیه و احتمالاً تأییدت لازمه؛ چند ثانیه
    صبر کن تا بخونم و بپرسم.» Then read what's needed and ask everything that needs his OK in one message, early.
