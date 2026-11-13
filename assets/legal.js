// Legal pages (privacy, terms, delete-account) hold English and Persian in one HTML: crawlers and store reviewers get
// both. This picks which one is shown: ?lang=en|fa, else the visitor's language (assets/lang.js: their choice on this
// site, else their region), Persian only for Persian readers, English for everyone else. Load it after lang.js, in <head>.
(function () {
  var root = document.documentElement;
  var q = new URLSearchParams(location.search).get('lang');
  var detected = window.vazneLang ? window.vazneLang.detect() : 'en';
  var lang = q === 'fa' || q === 'en' ? q : detected === 'fa' ? 'fa' : 'en';
  root.setAttribute('data-lang', lang);
  root.lang = lang;
  root.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.addEventListener('DOMContentLoaded', function () {
    var title = document.querySelector('.doc[lang="' + lang + '"] h1');
    if (title) document.title = title.textContent + (lang === 'fa' ? ' | وزنه' : ' | Vazne');
  });
})();
