/*
 * Download / tester buttons (home pages and /test/). Links come from assets/links.js.
 * - Every element with data-link="<key>" gets its href from window.VAZNE_LINKS[key];
 *   the key "ios" means the App Store link when it is set, otherwise TestFlight.
 * - <html> gets data-device="android|ios|mobile|desktop" (CSS puts the right section first)
 *   and the class "has-appstore" once VAZNE_LINKS.iosAppStore is filled.
 * - On /test/, a step the visitor has opened is marked done (kept in this browser only); step 3 stays grey until
 *   steps 1 and 2 were opened (data-after), with a «done them already» way past it. After the direct APK download,
 *   its box shows the next steps.
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
    // TestFlight code (for TestFlight's «Redeem» box): the end of the TestFlight link in links.js, with a copy button
    var code = (links.iosTestFlight || '').split('/').pop();
    var codes = document.querySelectorAll('[data-tf-code]');
    for (var c = 0; c < codes.length; c++) if (code) codes[c].textContent = code;
    // Selecting the whole code: a long press on iPhone picked only part of it (owner, 2026-11-10).
    function selectCode(el) {
      try { var range = document.createRange(); range.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); } catch (e) { /* ignore */ }
    }
    // Older iPhones and in-app browsers (Telegram, Instagram) have no navigator.clipboard: copy through a hidden field.
    function copyByField() {
      var field = document.createElement('textarea');
      field.value = code;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.appendChild(field);
      field.focus();
      field.setSelectionRange(0, code.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(field);
      return ok;
    }
    for (var c2 = 0; c2 < codes.length; c2++) codes[c2].addEventListener('click', function (event) { selectCode(event.currentTarget); });
    var copies = document.querySelectorAll('[data-copy-tf]');
    for (var b = 0; b < copies.length; b++) copies[b].addEventListener('click', function (event) {
      var button = event.currentTarget, label = button.textContent;
      var box = button.parentNode.querySelector('[data-tf-code]');
      function shown(key) {
        button.textContent = button.getAttribute(key);
        setTimeout(function () { button.textContent = label; }, 2200);
      }
      function fallback() {
        if (copyByField()) return shown('data-done');
        if (box) selectCode(box); // the whole code stays selected: the phone's own «Copy» takes all of it
        shown('data-select');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { shown('data-done'); }, fallback);
      else fallback();
    });
    var done = readDone();
    // Direct APK: once downloaded, the box shows what to do next (install, come back for new versions).
    var apk = document.querySelector('.apk');
    if (apk) {
      apk.classList.toggle('opened', !!done.apk);
      apk.querySelector('.btn').addEventListener('click', function () {
        done.apk = 1;
        saveDone(done);
        apk.classList.add('opened');
      });
    }
    var steps = document.querySelectorAll('[data-step]');
    if (!steps.length) return;
    function mark() {
      for (var j = 0; j < steps.length; j++) {
        var step = steps[j], link = step.querySelector('a');
        step.classList.toggle('done', !!done[step.getAttribute('data-step')]);
        // data-after="1 2": grey until steps 1 and 2 were opened, so nobody jumps straight to installing. Not a lock:
        // «قبلاً انجامشون دادم» opens it (they may have done them on another phone). Google Play checks the rest.
        var after = (step.getAttribute('data-after') || '').split(' ').filter(Boolean);
        var locked = !done['open' + step.getAttribute('data-step')] && after.some(function (n) { return !done[n]; });
        step.classList.toggle('locked', locked);
        if (locked) { link.setAttribute('aria-disabled', 'true'); link.setAttribute('tabindex', '-1'); }
        else { link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex'); }
      }
    }
    for (var k = 0; k < steps.length; k++) {
      steps[k].querySelector('a').addEventListener('click', function (event) {
        var step = event.currentTarget.closest('[data-step]');
        if (step.classList.contains('locked')) { event.preventDefault(); return; }
        done[step.getAttribute('data-step')] = 1;
        saveDone(done);
        mark();
      });
      var unlock = steps[k].querySelector('.unlock');
      if (unlock) unlock.addEventListener('click', function (event) {
        done['open' + event.currentTarget.closest('[data-step]').getAttribute('data-step')] = 1;
        saveDone(done);
        mark();
      });
    }
    mark();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
