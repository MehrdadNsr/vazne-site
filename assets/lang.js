/*
 * Language helpers for every page. Load it in <head> (it is small and runs before the page is drawn).
 *
 * - window.vazneLang.detect(): the visitor's language. Order: the choice they made on this site (saved when they
 *   click a language link), else the region of their device's time zone (Iran / Afghanistan → fa, Arab countries → ar,
 *   Spain and Spanish-speaking America → es), else their browser's first language if we have it, else English.
 *   Time zone rather than IP address: no request to a third party, works on GitHub Pages, and stays right for visitors
 *   in Iran who browse through a VPN.
 * - On the English home page only (script tag with data-auto-language): a first-time visitor whose language is not
 *   English is sent to /fa/, /ar/ or /es/. Never for crawlers, never when they came from another page of this site,
 *   never once they have picked a language (links to / carry ?lang=en). Test it with ?tz=Asia/Riyadh (pretend time
 *   zone) or a private window.
 * - On an English page that has a Persian twin (script tag with data-persian-page="/fa/…", e.g. /test/ and the guides):
 *   Iran's time zone (Asia/Tehran) or a visitor who picked Persian on this site goes to the Persian page; everyone else
 *   stays on English (owner, 2026-10-30). Never for crawlers or when the address carries ?lang=. Persian addresses never
 *   move: whoever opens one asked for Persian.
 * - Clicking any [data-set-lang] link saves that choice; language menus close on outside click or Escape.
 */
(function () {
  'use strict';
  var KEY = 'vazne-lang';
  var SUPPORTED = { en: '/', fa: '/fa/', ar: '/ar/', es: '/es/' };
  var FA = /^(Asia\/Tehran|Asia\/Kabul)$/;
  var AR = /^(Asia\/(Riyadh|Dubai|Qatar|Bahrain|Kuwait|Muscat|Aden|Baghdad|Amman|Beirut|Damascus|Gaza|Hebron)|Africa\/(Cairo|Tripoli|Tunis|Algiers|Casablanca|El_Aaiun|Khartoum|Nouakchott|Djibouti|Mogadishu)|Indian\/Comoro)$/;
  var ES = /^(Europe\/Madrid|Atlantic\/Canary|Africa\/(Ceuta|Malabo)|America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana|Bogota|Lima|Santiago|Punta_Arenas|Caracas|Guayaquil|La_Paz|Asuncion|Montevideo|Buenos_Aires|Cordoba|Mendoza|Catamarca|Jujuy|Rosario|Argentina\/.+|Guatemala|El_Salvador|Tegucigalpa|Managua|Costa_Rica|Panama|Havana|Santo_Domingo|Puerto_Rico)|Pacific\/(Galapagos|Easter))$/;

  function saved() {
    try { var v = localStorage.getItem(KEY); return SUPPORTED[v] ? v : null; } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage blocked: the referrer check still prevents loops */ }
  }
  var forced = /[?&]tz=([^&#]+)/.exec(location.search);
  function timeZone() {
    if (forced) return decodeURIComponent(forced[1]);
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }
  function byRegion() {
    var tz = timeZone();
    if (FA.test(tz)) return 'fa';
    if (AR.test(tz)) return 'ar';
    if (ES.test(tz)) return 'es';
    return null;
  }
  function byBrowser() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    var first = String(list[0] || '').toLowerCase().split('-')[0];
    return SUPPORTED[first] ? first : null;
  }
  function detect() {
    if (forced) return byRegion() || 'en'; // ?tz=… is for testing: it ignores the saved choice
    return saved() || byRegion() || byBrowser() || 'en';
  }
  window.vazneLang = { detect: detect, saved: saved, save: save };

  var script = document.currentScript;
  var auto = script && script.hasAttribute('data-auto-language');
  var persianPage = script && script.getAttribute && script.getAttribute('data-persian-page');
  if (auto || persianPage) {
    var bot = /googlebot|google-|googleother|storebot|bingbot|yandex|duckduckbot|applebot|baiduspider|petalbot|semrush|ahrefs|mj12bot|dotbot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|^whatsapp\/|crawler|spider|slurp|archiver|lighthouse|headlesschrome/i
      .test(navigator.userAgent || '');
    var internal = false;
    try { internal = !!document.referrer && new URL(document.referrer).host === location.host; } catch (e) { /* ignore */ }
    var asked = /[?&]lang=(en|fa|ar|es)\b/.exec(location.search);
    if (asked) save(asked[1]); // language links to / carry ?lang=en, so the choice holds even without storage
    if (auto) {
      var lang = asked ? asked[1] : detect();
      if (!bot && !internal && lang !== 'en') location.replace(SUPPORTED[lang] + location.hash);
    } else if (!bot && !asked) {
      var choice = forced ? null : saved();
      if (choice === 'fa' || (!choice && /^Asia\/Tehran$/.test(timeZone()))) location.replace(persianPage + location.hash);
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('[data-set-lang]');
    if (link) save(link.getAttribute('data-set-lang'));
    var menus = document.querySelectorAll('.lang-menu[open]');
    for (var i = 0; i < menus.length; i++) if (!menus[i].contains(event.target)) menus[i].removeAttribute('open');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var menus = document.querySelectorAll('.lang-menu[open]');
    for (var i = 0; i < menus.length; i++) { menus[i].removeAttribute('open'); menus[i].querySelector('summary').focus(); }
  });
})();
