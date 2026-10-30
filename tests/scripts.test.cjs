// Unit tests for assets/lang.js and assets/testers.js. No browser needed: node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const LANG_JS = read('assets/lang.js');
const LINKS_JS = read('assets/links.js');
const TESTERS_JS = read('assets/testers.js');

function storage(initial = {}, blocked = false) {
  const data = { ...initial };
  return {
    getItem: (k) => { if (blocked) throw new Error('blocked'); return k in data ? data[k] : null; },
    setItem: (k, v) => { if (blocked) throw new Error('blocked'); data[k] = String(v); },
    data,
  };
}

// Runs lang.js the way a page does; returns where it redirected (or null) and the vazneLang API.
function runLang({ tz = 'America/Toronto', languages = ['en-US'], ua = 'Mozilla/5.0 Chrome/140 Mobile', saved, blocked = false,
  referrer = '', search = '', auto = true } = {}) {
  let redirected = null;
  const localStorage = storage(saved ? { 'vazne-lang': saved } : {}, blocked);
  const ctx = {
    navigator: { userAgent: ua, languages, language: languages[0] },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: tz }) }) },
    location: { search, hash: '', host: 'vazne.app', replace: (u) => { redirected = u; } },
    localStorage,
    URL,
    document: {
      currentScript: { hasAttribute: (name) => auto && name === 'data-auto-language' },
      referrer,
      addEventListener() {},
      querySelectorAll: () => [],
    },
    window: {},
  };
  vm.runInNewContext(LANG_JS, ctx);
  return { redirected, api: ctx.window.vazneLang, localStorage };
}

test('first visit goes to the region language', () => {
  assert.strictEqual(runLang({ tz: 'Asia/Tehran' }).redirected, '/fa/');
  assert.strictEqual(runLang({ tz: 'Asia/Kabul' }).redirected, '/fa/');
  assert.strictEqual(runLang({ tz: 'Asia/Riyadh' }).redirected, '/ar/');
  assert.strictEqual(runLang({ tz: 'Africa/Casablanca' }).redirected, '/ar/');
  assert.strictEqual(runLang({ tz: 'Europe/Madrid' }).redirected, '/es/');
  assert.strictEqual(runLang({ tz: 'America/Mexico_City' }).redirected, '/es/');
  assert.strictEqual(runLang({ tz: 'America/Cordoba' }).redirected, '/es/');
  assert.strictEqual(runLang({ tz: 'America/Toronto' }).redirected, null);
  assert.strictEqual(runLang({ tz: 'Europe/London' }).redirected, null);
});

test('outside those regions the browser language decides, else English', () => {
  assert.strictEqual(runLang({ tz: 'America/Toronto', languages: ['fa-IR', 'en'] }).redirected, '/fa/');
  assert.strictEqual(runLang({ tz: 'America/Los_Angeles', languages: ['es-US'] }).redirected, '/es/');
  assert.strictEqual(runLang({ tz: 'Europe/Berlin', languages: ['de-DE', 'fa'] }).redirected, null);
});

test('a saved choice wins over the region; English choice is respected', () => {
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', saved: 'en' }).redirected, null);
  assert.strictEqual(runLang({ tz: 'America/Toronto', saved: 'ar' }).redirected, '/ar/');
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', saved: 'xx' }).redirected, '/fa/');
});

test('never redirects crawlers, internal navigation, or pages without the attribute', () => {
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }).redirected, null);
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', ua: 'TelegramBot (like TwitterBot)' }).redirected, null);
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', referrer: 'https://vazne.app/guides/workout-tracker/' }).redirected, null);
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', referrer: 'https://www.google.com/' }).redirected, '/fa/');
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', auto: false }).redirected, null);
});

test('?tz= pretends a time zone (for testing) and ignores the saved choice', () => {
  assert.strictEqual(runLang({ tz: 'America/Toronto', search: '?tz=Asia/Riyadh', saved: 'en' }).redirected, '/ar/');
  assert.strictEqual(runLang({ tz: 'Asia/Tehran', search: '?tz=Europe/London' }).redirected, null);
});

test('blocked storage does not break anything', () => {
  const r = runLang({ tz: 'Asia/Tehran', blocked: true });
  assert.strictEqual(r.redirected, '/fa/');
  assert.doesNotThrow(() => r.api.save('en'));
  assert.strictEqual(r.api.saved(), null);
});

// testers.js
function runTesters({ ua, touch = 0, appStore = '' }) {
  const attrs = {};
  const classes = new Set();
  const anchors = ['ios', 'androidGroup', 'iosTestFlight'].map((key) => ({ key, href: null, getAttribute: () => key, setAttribute(_, v) { this.href = v; } }));
  const ctx = {
    window: {},
    navigator: { userAgent: ua, maxTouchPoints: touch },
    localStorage: storage(),
    document: {
      readyState: 'complete',
      documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, classList: { add: (c) => classes.add(c) } },
      querySelectorAll: (sel) => (sel === '[data-link]' ? anchors : []),
    },
  };
  vm.runInNewContext(LINKS_JS.replace("iosAppStore: ''", `iosAppStore: '${appStore}'`), ctx);
  ctx.window.VAZNE_LINKS = ctx.window.VAZNE_LINKS;
  vm.runInNewContext(TESTERS_JS, ctx);
  return { device: attrs['data-device'], appstore: classes.has('has-appstore'), hrefs: Object.fromEntries(anchors.map((a) => [a.key, a.href])) };
}

test('testers.js detects the platform', () => {
  assert.strictEqual(runTesters({ ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile' }).device, 'android');
  assert.strictEqual(runTesters({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }).device, 'ios');
  assert.strictEqual(runTesters({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', touch: 5 }).device, 'ios'); // iPad
  assert.strictEqual(runTesters({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }).device, 'desktop');
  assert.strictEqual(runTesters({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }).device, 'desktop');
});

test('iPhone buttons use TestFlight until the App Store link is set', () => {
  const before = runTesters({ ua: 'x' });
  assert.strictEqual(before.hrefs.ios, 'https://testflight.apple.com/join/9g8auNhk');
  assert.strictEqual(before.appstore, false);
  const after = runTesters({ ua: 'x', appStore: 'https://apps.apple.com/app/id1' });
  assert.strictEqual(after.hrefs.ios, 'https://apps.apple.com/app/id1');
  assert.strictEqual(after.hrefs.iosTestFlight, 'https://testflight.apple.com/join/9g8auNhk');
  assert.strictEqual(after.appstore, true);
  assert.strictEqual(after.hrefs.androidGroup, 'https://groups.google.com/g/vazne-pre-release-testing');
});
