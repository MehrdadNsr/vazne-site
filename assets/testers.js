/*
 * Download / tester buttons (home pages and /test/). Links come from assets/links.js.
 * - Every element with data-link="<key>" gets its href from window.VAZNE_LINKS[key];
 *   the key "ios" means the App Store link when it is set, otherwise TestFlight.
 * - <html> gets data-device="android|ios|mobile|desktop" (CSS puts the right section first)
 *   and the class "has-appstore" once VAZNE_LINKS.iosAppStore is filled.
 * - On /test/, a step the visitor has opened is marked done (kept in this browser only).
 * Load it after links.js. It is safe to load in <head>: links are applied once the page is parsed.
 */
(function () {
  'use strict';
  var links = window.VAZNE_LINKS || {};
  var root = document.documentElement;
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var mobile = android || ios || /Mobi|Tablet|Silk|KAIOS/i.test(ua) || !!(navigator.userAgentData && navigator.userAgentData.mobile);
  root.setAttribute('data-device', android ? 'android' : ios ? 'ios' : mobile ? 'mobile' : 'desktop');
  if (links.iosAppStore) root.classList.add('has-appstore');

  function resolve(key) {
    if (key === 'ios') return links.iosAppStore || links.iosTestFlight;
    return links[key];
  }

  var STORE = 'vazne-test-steps';
  function readDone() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) { return {}; }
  }
  function saveDone(done) {
    try { localStorage.setItem(STORE, JSON.stringify(done)); } catch (e) { /* private mode: no memory, still works */ }
  }

  function apply() {
    var els = document.querySelectorAll('[data-link]');
    for (var i = 0; i < els.length; i++) {
      var url = resolve(els[i].getAttribute('data-link'));
      if (url) els[i].setAttribute('href', url);
    }
    var steps = document.querySelectorAll('[data-step]');
    if (!steps.length) return;
    var done = readDone();
    function mark() {
      for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('done', !!done[steps[j].getAttribute('data-step')]);
    }
    for (var k = 0; k < steps.length; k++) {
      steps[k].querySelector('a').addEventListener('click', function (event) {
        done[event.currentTarget.closest('[data-step]').getAttribute('data-step')] = 1;
        saveDone(done);
        mark();
      });
    }
    mark();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
