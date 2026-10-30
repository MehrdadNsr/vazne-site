// Load every page as an Android phone, an iPhone and a computer: no script errors, no sideways scroll, the right
// tester section first. Screenshots go to /tmp/vazne-shots/. Needs Playwright (require('playwright')).
// Usage: node tools/browser_check.cjs  (serves the repo itself on a free port)
const { chromium, devices } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(ROOT, '404.html'))); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
const PAGES = ['/', '/fa/', '/ar/', '/es/', '/test/', '/fa/test/', '/guides/workout-tracker/', '/fa/guides/import-workout-plan/', '/privacy/', '/terms/?lang=fa', '/delete-account/', '/missing-page'];
const SETUPS = { android: devices['Pixel 7'], iphone: devices['iPhone 14'], desktop: { viewport: { width: 1440, height: 900 } } };

server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const out = '/tmp/vazne-shots';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;
  for (const [name, setup] of Object.entries(SETUPS)) {
    // America/Toronto + saved English so the home page does not move to another language during the check
    const ctx = await browser.newContext({ ...setup, timezoneId: 'America/Toronto', locale: 'en-CA' });
    await ctx.addInitScript(() => { try { localStorage.setItem('vazne-lang', 'en'); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const url of PAGES) {
      errors.length = 0;
      await page.goto(base + url, { waitUntil: 'networkidle' });
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        first: document.querySelector('.platforms > section') && [...document.querySelectorAll('.platforms > section')].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0].id,
      }));
      const bad = [];
      if (errors.length) bad.push('errors: ' + errors.join(' | '));
      if (info.overflow > 0) bad.push(`scrolls sideways by ${info.overflow}px`);
      if (url.endsWith('/test/') && name !== 'desktop' && info.first !== (name === 'iphone' ? 'iphone' : 'android')) bad.push('wrong section first: ' + info.first);
      await page.screenshot({ path: `${out}/${name}${url.replace(/[/?=]/g, '_')}.png`, fullPage: true });
      console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name.padEnd(8)} ${url}${bad.length ? '  ' + bad.join('; ') : ''}`);
      problems += bad.length;
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(problems ? `${problems} problem(s)` : `Screenshots in ${out}`);
  process.exitCode = problems ? 1 : 0;
});
