# Vazne website

Bilingual Persian/English product website for Vazne at https://vazne.app.

Static HTML, CSS and JavaScript. No build step or application backend. Publish with GitHub Pages from the `main` branch, repository root.

- `index.html`: responsive landing page, inline SVG barbell and bilingual copy.
- `site.js`: animated plate stacks, pointer/touch/keyboard slider and scroll reveals.
- `motion.css`: glass controls, vector icons and reduced-motion-aware animation.
- `Estedad.woff2` / `Estedad-OFL.txt`: self-hosted Persian variable font and its OFL license.
- `CNAME`: custom website domain.
- `.nojekyll`: serve the static files directly.

The page uses the existing Vazne dumbbell glyph with the owner’s silver/white glass and electric-blue reference direction. Persian uses self-hosted Estedad; Manrope and the Vazirmatn fallback are loaded from Google Fonts. Icons and the animated barbell are local SVG, with no animation library or external icon service. It does not collect form submissions or persist demo data.

The demo ranges from 20 to 100 kg in 2.5 kg steps. A 20 kg bar carries equal stacks of 2.5 kg plates, plus a 1.25 kg plate on each side for half steps. Plate count never decreases when total weight increases. The whole ruler supports horizontal pointer dragging; vertical touch gestures remain available for page scrolling. Native range semantics support keyboard and screen readers. Scroll reveals run once and respect `prefers-reduced-motion`; content stays visible without JavaScript or IntersectionObserver.

Run logic and DOM checks with `node --test site.test.cjs`.

Public app download links have deliberately not been added: both platforms are currently in testing. Replace the availability section with verified public links when available.

Website changes must not modify the `api` DNS record, app repository or app server. Only website apex/www configuration is in scope.
