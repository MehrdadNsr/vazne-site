// Language for the legal pages. Both versions are in the HTML (crawlers and reviewers get the full
// text either way); this only picks which one is shown. Order: ?lang=, the visitor's last choice on
// this site, then the browser language (Persian browsers get Persian, everyone else English).
(function () {
  var root = document.documentElement;
  function saved() { try { return localStorage.getItem('vazne-lang'); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem('vazne-lang', l); } catch (e) {} }
  var q = new URLSearchParams(location.search).get('lang');
  var lang = q === 'fa' || q === 'en' ? q : saved() === 'fa' || saved() === 'en' ? saved() : /^fa\b/i.test(navigator.language || '') ? 'fa' : 'en';
  function apply(l) {
    lang = l;
    root.setAttribute('data-lang', l);
    root.lang = l;
    root.dir = l === 'fa' ? 'rtl' : 'ltr';
    var t = document.querySelector('[lang="' + l + '"].doc h1');
    if (t) document.title = t.textContent + (l === 'fa' ? ' | وزنه' : ' | Vazne');
    var b = document.getElementById('language');
    if (b) {
      b.textContent = l === 'fa' ? 'English ↗' : 'فارسی ↗';
      b.setAttribute('aria-label', l === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی');
    }
  }
  apply(lang);
  document.addEventListener('DOMContentLoaded', function () {
    apply(lang);
    var b = document.getElementById('language');
    if (b) b.addEventListener('click', function () { var n = lang === 'fa' ? 'en' : 'fa'; save(n); apply(n); });
  });
})();
