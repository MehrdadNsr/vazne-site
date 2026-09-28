# Vazne website

Bilingual Persian/English product website for Vazne at https://vazne.app.

Static HTML, CSS and JavaScript. No build step or application backend. Publish with GitHub Pages from the `main` branch, repository root.

- `index.html`: responsive landing page and an ephemeral interactive workout demo.
- `CNAME`: custom website domain.
- `.nojekyll`: serve the static files directly.

The page uses the existing Vazne dumbbell glyph with the owner’s silver/white glass and electric-blue reference direction. Fonts are loaded from Google Fonts (Vazirmatn and Manrope). It does not collect form submissions or persist demo data.

Public app download links have deliberately not been added: both platforms are currently in testing. Replace the availability section with verified public links when available.

Website changes must not modify the `api` DNS record, app repository or app server. Only website apex/www configuration is in scope.
