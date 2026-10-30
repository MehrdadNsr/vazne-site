"""Build the generated parts of vazne.app. Dependency-free; run from the repo root after editing src/:

    python3 tools/build.py          # write the pages
    python3 tools/build.py --check  # exit 1 if any page is out of date (tests run this)

What it writes:
- The home page in every language (/, /fa/, /ar/, /es/) from src/home.html + src/i18n/<lang>.json.
- The shared top bar and footer of every other page, between the markers <!-- nav --> … <!-- /nav -->
  and <!-- footer --> … <!-- /footer -->. Everything outside the markers is hand-written: edit it in place.
- sitemap.xml (with hreflang alternates).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
SITE = 'https://vazne.app'
VERSION = '20261030'  # bump to make browsers fetch changed CSS/JS

LANGS = ['en', 'fa', 'ar', 'es']  # order of the language menu
RTL = {'fa', 'ar'}
HOME = {'en': '/', 'fa': '/fa/', 'ar': '/ar/', 'es': '/es/'}

# Pages other than the home pages. path -> languages it exists in (language -> URL path).
# 'bilingual' pages hold English and Persian in one HTML (legal.js shows one); their chrome carries both.
PAGES = {
    'guides/workout-tracker/index.html': {'lang': 'en', 'alt': {'en': '/guides/workout-tracker/', 'fa': '/fa/guides/workout-tracker/'}},
    'guides/import-workout-plan/index.html': {'lang': 'en', 'alt': {'en': '/guides/import-workout-plan/', 'fa': '/fa/guides/import-workout-plan/'}},
    'guides/track-workout-progress/index.html': {'lang': 'en', 'alt': {'en': '/guides/track-workout-progress/', 'fa': '/fa/guides/track-workout-progress/'}},
    'fa/guides/workout-tracker/index.html': {'lang': 'fa', 'alt': {'en': '/guides/workout-tracker/', 'fa': '/fa/guides/workout-tracker/'}},
    'fa/guides/import-workout-plan/index.html': {'lang': 'fa', 'alt': {'en': '/guides/import-workout-plan/', 'fa': '/fa/guides/import-workout-plan/'}},
    'fa/guides/track-workout-progress/index.html': {'lang': 'fa', 'alt': {'en': '/guides/track-workout-progress/', 'fa': '/fa/guides/track-workout-progress/'}},
    'privacy/index.html': {'lang': 'bilingual', 'alt': {'en': '/privacy/?lang=en', 'fa': '/privacy/?lang=fa'}},
    'terms/index.html': {'lang': 'bilingual', 'alt': {'en': '/terms/?lang=en', 'fa': '/terms/?lang=fa'}},
    'delete-account/index.html': {'lang': 'bilingual', 'alt': {'en': '/delete-account/?lang=en', 'fa': '/delete-account/?lang=fa'}},
    '404.html': {'lang': 'en', 'alt': HOME},
    'test/index.html': {'lang': 'fa', 'alt': {}, 'tester_page': True},
}
# Pages in the sitemap besides the home pages (the tester page and 404 are left out on purpose).
SITEMAP = [
    {'en': '/guides/workout-tracker/', 'fa': '/fa/guides/workout-tracker/'},
    {'en': '/guides/import-workout-plan/', 'fa': '/fa/guides/import-workout-plan/'},
    {'en': '/guides/track-workout-progress/', 'fa': '/fa/guides/track-workout-progress/'},
    {'en': '/privacy/'}, {'en': '/terms/'}, {'en': '/delete-account/'},
]

ICON = {
    'logo': '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true"><path d="M4 14v12m7-17v22m18-22v22m7-17v12M11 20h18"/></svg>',
    'arrow': '<svg class="icon arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    'check': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
    'globe': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>',
    'android': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 17V12a7 7 0 0 1 14 0v5H5Z"/><path d="m7.5 6.5-1.5-2.5m10.5 2.5 1.5-2.5"/><circle cx="9" cy="11" r=".6" fill="currentColor"/><circle cx="15" cy="11" r=".6" fill="currentColor"/></svg>',
    'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 5h3"/></svg>',
}

STRINGS = {lang: json.loads((SRC / 'i18n' / f'{lang}.json').read_text(encoding='utf-8')) for lang in LANGS}


def get(lang, key):
    value = STRINGS[lang]
    for part in key.split('.'):
        value = value[part]
    return value


def digits(lang, text):
    """Persian pages use Persian digits; the others keep 0-9."""
    text = str(text)
    return text.translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')) if lang == 'fa' else text


def esc(text):
    return text.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


# ---------- shared chrome ----------

def t(lang, key):
    """Chrome string; for bilingual pages, both English and Persian (CSS shows the one in use)."""
    if lang == 'bilingual':
        return f'<span data-only="en">{get("en", key)}</span><span data-only="fa">{get("fa", key)}</span>'
    return get(lang, key)


def legal(lang, path):
    """Links to the legal pages open in the visitor's language when it exists there."""
    return path if lang in ('en', 'bilingual') else f'{path}?lang={"fa" if lang == "fa" else "en"}'


def lang_menu(lang, alternates):
    if not alternates:
        return ''
    current = 'en' if lang == 'bilingual' else lang
    items = []
    for code in LANGS:
        if code not in alternates:
            continue
        here = ' aria-current="true"' if code == current and lang != 'bilingual' else ''
        href = '/?lang=en' if alternates[code] == '/' else alternates[code]
        items.append(f'<li><a href="{href}" hreflang="{code}" lang="{code}" data-set-lang="{code}"{here}>{STRINGS[code]["name"]}</a></li>')
    if lang == 'bilingual':
        summary = f'<span data-only="en">EN</span><span data-only="fa">FA</span>'
        label = 'Language / زبان'
    else:
        summary = f'<span>{STRINGS[lang]["short"]}</span>'
        label = f'{get(lang, "chrome.language")}: {STRINGS[lang]["name"]}'
    return (f'<details class="lang-menu"><summary aria-label="{esc(label)}">{ICON["globe"]}{summary}</summary>'
            f'<ul>{"".join(items)}</ul></details>')


def nav(lang, alternates, home_page=False, tester_page=False):
    base = 'fa' if lang == 'bilingual' else lang
    home = HOME[base] if lang != 'bilingual' else '/'
    if home_page:
        links = (f'<a href="#experience">{t(lang, "chrome.experience")}</a><a href="#progress">{t(lang, "chrome.progress")}</a>'
                 f'<a href="#faq">{t(lang, "chrome.faq")}</a>')
    elif lang == 'bilingual':
        links = ''.join(f'<a href="{HOME[c]}{anchor}" data-only="{c}">{get(c, key)}</a>'
                        for anchor, key in (('', 'chrome.about'), ('#faq', 'chrome.faq')) for c in ('en', 'fa'))
    else:
        links = f'<a href="{home}">{t(lang, "chrome.about")}</a><a href="{home}#faq">{t(lang, "chrome.faq")}</a>'
    tester = '' if tester_page else f'<a class="tag tester-tag" href="/test/">{t(lang, "chrome.tester")}</a>'
    label = get('en' if lang == 'bilingual' else lang, 'chrome.nav_label')
    home_label = get('en' if lang == 'bilingual' else lang, 'chrome.home_label')
    return (f'<nav class="topbar" aria-label="{esc(label)}">'
            f'<a href="{home}" class="brand" aria-label="{esc(home_label)}">{ICON["logo"]}vazne<span class="tagline" lang="en">YOUR GYM BUDDY</span></a>'
            f'<div class="navlinks">{links}</div>'
            f'<div class="navright">{lang_menu(lang, alternates)}{tester}</div></nav>')


def footer(lang, home_page=False):
    base = 'en' if lang == 'bilingual' else lang
    guide = '/fa/guides/workout-tracker/' if lang == 'fa' else '/guides/workout-tracker/'
    guide_attr = ' hreflang="en"' if lang in ('ar', 'es') else ''
    motion = (f'<button class="plain" id="motion" type="button" aria-pressed="true" data-on="{esc(get(lang, "chrome.motion_on"))}" '
              f'data-off="{esc(get(lang, "chrome.motion_off"))}">{get(lang, "chrome.motion_on")}</button>') if home_page else ''
    languages = ''.join(f'<a href="{"/?lang=en" if c == "en" else HOME[c]}" hreflang="{c}" lang="{c}" data-set-lang="{c}">{STRINGS[c]["name"]}</a>' for c in LANGS)
    return (f'<footer class="site-footer"><span lang="en">VAZNE © 2026 &nbsp;/&nbsp; YOUR GYM BUDDY</span>'
            f'<div class="footer-links" aria-label="{esc(get(base, "chrome.footer_label"))}">{motion}'
            f'<a href="{legal(lang, "/privacy/")}">{t(lang, "chrome.privacy")}</a>'
            f'<a href="{legal(lang, "/terms/")}">{t(lang, "chrome.terms")}</a>'
            f'<a href="{legal(lang, "/delete-account/")}">{t(lang, "chrome.delete")}</a>'
            f'<a href="{guide}"{guide_attr}>{t(lang, "chrome.guides")}</a>'
            f'<a href="/test/">{t(lang, "chrome.testers")}</a>'
            f'<a href="mailto:support@vazne.app">support@vazne.app</a>'
            f'<a href="https://mehrdadkhani.com/" rel="author">{t(lang, "chrome.made_by")}</a></div>'
            f'<div class="footer-langs">{languages}</div></footer>')


# ---------- home pages ----------

def head_links(lang):
    url = SITE + HOME[lang]
    out = [f'<link rel="canonical" href="{url}">']
    out += [f'<link rel="alternate" hreflang="{c}" href="{SITE}{HOME[c]}">' for c in LANGS]
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/">')
    out += [f'<meta property="og:locale:alternate" content="{STRINGS[c]["meta"]["og_locale"]}">' for c in LANGS if c != lang]
    return '\n'.join(out)


def json_ld(lang):
    url = SITE + HOME[lang]
    graph = [
        {'@type': 'WebSite', '@id': SITE + '/#website', 'url': SITE + '/', 'name': 'Vazne', 'alternateName': ['وزنه', 'Vazne App'], 'inLanguage': LANGS},
        {'@type': 'SoftwareApplication', '@id': SITE + '/#app', 'name': 'Vazne', 'alternateName': 'وزنه', 'url': SITE + '/',
         'applicationCategory': 'HealthApplication', 'operatingSystem': 'iOS, Android', 'inLanguage': ['en', 'fa'],
         'description': get('en', 'meta.description'), 'image': SITE + '/social-card.png',
         'featureList': ['Workout plan import from photo or text', 'Weight and repetition logging', 'Rest timer', 'Workout history and progress tracking']},
        {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': re.sub('&amp;', '&', get(lang, 'meta.title')),
         'description': get(lang, 'meta.description'), 'inLanguage': lang,
         'isPartOf': {'@id': SITE + '/#website'}, 'about': {'@id': SITE + '/#app'}},
    ]
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)


# Root page only: send a first-time visitor to their region's language (assets/lang.js decides; never for crawlers).
AUTO_LANGUAGE = '<script src="/assets/lang.js?v={v}" data-auto-language></script>'


def render_home(lang):
    template = (SRC / 'home.html').read_text(encoding='utf-8')
    template = re.sub(r'\{\{> ([\w.-]+)\}\}', lambda m: (SRC / 'partials' / m.group(1)).read_text(encoding='utf-8').strip(), template)
    faq = ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in get(lang, 'faq.items'))
    values = {
        'lang': lang, 'dir': 'rtl' if lang in RTL else 'ltr', 'url': SITE + HOME[lang], 'v': VERSION,
        'head_links': head_links(lang), 'json_ld': json_ld(lang), 'faq_items': faq,
        'auto_language': AUTO_LANGUAGE.format(v=VERSION) if lang == 'en' else f'<script src="/assets/lang.js?v={VERSION}"></script>',
        'nav': nav(lang, HOME, home_page=True), 'footer': footer(lang, home_page=True),
        'arrow': ICON['arrow'], 'arrow_icon': ICON['arrow'], 'check_icon': ICON['check'],
        'android_icon': ICON['android'], 'phone_icon': ICON['phone'],
        'hero.plates_4': get(lang, 'hero.plates').replace('{n}', digits(lang, 4)),
    }
    for n in ['01', '02', '03', '8', '10', '20', '50', '60', '100']:
        values['n' + n] = digits(lang, n)

    def fill(match):
        key = match.group(1)
        if key in values:
            return values[key]
        value = get(lang, key)
        if not isinstance(value, str):
            raise KeyError(key)
        return value
    html = re.sub(r'\{\{([\w.]+)\}\}', fill, template)
    leftover = re.findall(r'\{\{[^}]*\}\}', html)
    assert not leftover, leftover
    return html


def home_path(lang):
    return ROOT / ('index.html' if lang == 'en' else f'{lang}/index.html')


# ---------- other pages: replace the marked regions ----------

def render_page(path, spec):
    html = (ROOT / path).read_text(encoding='utf-8')
    lang = spec['lang']
    regions = {
        'nav': nav(lang, spec['alt'], tester_page=spec.get('tester_page', False)),
        'footer': footer('fa' if spec.get('tester_page') else lang),
    }
    for name, content in regions.items():
        pattern = re.compile(rf'<!-- {name} -->.*?<!-- /{name} -->', re.S)
        if not pattern.search(html):
            raise SystemExit(f'{path}: missing <!-- {name} --> … <!-- /{name} --> markers')
        html = pattern.sub(lambda m: f'<!-- {name} -->{content}<!-- /{name} -->', html, count=1)
    return html


def sitemap():
    rows = []
    groups = [dict(HOME)] + SITEMAP
    for group in groups:
        for lang, path in group.items():
            alts = ''
            if len(group) > 1:
                alts = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{c}" href="{SITE}{p}"/>' for c, p in group.items())
                alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{group.get("en", path)}"/>'
            rows.append(f'  <url>\n    <loc>{SITE}{path}</loc>{alts}\n  </url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + '\n'.join(rows) + '\n</urlset>\n')


def outputs():
    out = {home_path(lang): render_home(lang) for lang in LANGS}
    out.update({ROOT / path: render_page(path, spec) for path, spec in PAGES.items()})
    out[ROOT / 'sitemap.xml'] = sitemap()
    return out


def main():
    check = '--check' in sys.argv
    stale = []
    for path, content in outputs().items():
        current = path.read_text(encoding='utf-8') if path.exists() else None
        if current != content:
            stale.append(path.relative_to(ROOT))
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
    if check and stale:
        raise SystemExit('Out of date (run python3 tools/build.py): ' + ', '.join(map(str, stale)))
    print(('Up to date' if check else f'Wrote {len(stale)} file(s)') + (': ' + ', '.join(map(str, stale)) if stale and not check else ''))


if __name__ == '__main__':
    main()
