"""Static checks for the whole site. Dependency-free: python3 tests/test_site.py (tools/check.sh runs it).

Covers: generated pages up to date, sitemap, canonical/hreflang, robots rules, every local link and asset,
download links in sync with assets/links.js, translations complete, no third-party fonts or trackers.
"""
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://vazne.app'
LANGS = ['en', 'fa', 'ar', 'es']
HOMES = {'en': '/', 'fa': '/fa/', 'ar': '/ar/', 'es': '/es/'}
failures = []


def check(condition, message):
    if not condition:
        failures.append(message)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


def local(path):
    p = ROOT / unquote(path).lstrip('/')
    return p / 'index.html' if path.endswith('/') or path == '' else p


html_files = sorted(p for p in ROOT.rglob('*.html') if not any(part in ('src', 'node_modules', '.git') for part in p.relative_to(ROOT).parts))
texts = {p: p.read_text(encoding='utf-8') for p in html_files}
pages = {p: Page(t) for p, t in texts.items()}

# 1. Generated parts are up to date
build = subprocess.run([sys.executable, str(ROOT / 'tools' / 'build.py'), '--check'], capture_output=True, text=True)
check(build.returncode == 0, 'tools/build.py --check: ' + (build.stdout + build.stderr).strip())

# 2. Sitemap: canonical URLs only, each page self-canonical and indexable, hreflang reciprocal
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
urls = [u.find('s:loc', ns).text for u in sitemap.findall('s:url', ns)]
check(len(urls) == len(set(urls)), 'sitemap has duplicates')
for home in HOMES.values():
    check(SITE + home in urls, f'sitemap misses {home}')
check(not any('/test' in u for u in urls), 'the tester page must stay out of the sitemap')
titles, descriptions = {}, {}
for url in urls:
    path = local(urlsplit(url).path)
    check(path.exists(), f'sitemap URL without a file: {url}')
    if not path.exists():
        continue
    page, text = pages[path], texts[path]
    check(page.find('link', rel='canonical') == [{'rel': 'canonical', 'href': url}], f'{url}: canonical must be itself')
    check(not any('noindex' in a.get('content', '') for a in page.find('meta', name='robots')), f'{url}: indexed page has noindex')
    title = re.search(r'<title>(.*?)</title>', text, re.S).group(1)
    desc = page.find('meta', name='description')[0]['content']
    check(title not in titles, f'{url}: duplicate title with {titles.get(title)}')
    check(desc not in descriptions, f'{url}: duplicate description with {descriptions.get(desc)}')
    titles[title], descriptions[desc] = url, url
    check(page.find('meta', property='og:url') == [] or page.find('meta', property='og:url')[0]['content'] == url, f'{url}: og:url')
    alternates = {a['hreflang']: a['href'] for a in page.find('link', rel='alternate') if 'hreflang' in a}
    for lang, href in alternates.items():
        if lang == 'x-default':
            continue
        other = local(urlsplit(href).path)
        check(other.exists() and any(a.get('href') == url for a in pages[other].find('link', rel='alternate')), f'{url}: hreflang {lang} not reciprocal')
    for graph in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
        for node in json.loads(graph)['@graph']:
            check(node['@type'] in ['WebSite', 'SoftwareApplication', 'WebPage', 'BreadcrumbList'], f'{url}: unexpected JSON-LD {node["@type"]}')
            check(not any(k in node for k in ['aggregateRating', 'review', 'offers']), f'{url}: no invented ratings/prices')
for home_lang, home in HOMES.items():
    page = pages[local(home)]
    langs = {a['hreflang'] for a in page.find('link', rel='alternate') if 'hreflang' in a}
    check(langs == set(LANGS) | {'x-default'}, f'{home}: hreflang set {langs}')
    html_tag = page.find('html')[0]
    check(html_tag.get('lang') == home_lang and html_tag.get('dir') == ('rtl' if home_lang in ('fa', 'ar') else 'ltr'), f'{home}: lang/dir')

# 3. Robots rules
robots = (ROOT / 'robots.txt').read_text()
check('Sitemap: ' + SITE + '/sitemap.xml' in robots, 'robots.txt must point to the sitemap')
check('Disallow: /test' not in robots, 'do not Disallow /test (crawlers must see its noindex)')
for path in ['test/index.html', '404.html']:
    check(any('noindex' in a.get('content', '') for a in pages[ROOT / path].find('meta', name='robots')), f'{path} needs noindex')

# 4. Every local link and asset exists; fragments exist; external new tabs are safe
for path, page in pages.items():
    rel = path.relative_to(ROOT)
    ids = {a['id'] for _, a in page.tags if 'id' in a}
    check(len(ids) == len([a for _, a in page.tags if 'id' in a]), f'{rel}: duplicate id')
    for tag, attrs in page.tags:
        if tag == 'a' and attrs.get('target') == '_blank':
            check('noopener' in attrs.get('rel', ''), f'{rel}: target=_blank without rel=noopener: {attrs.get("href")}')
        for attr in ('href', 'src'):
            target = attrs.get(attr, '')
            u = urlsplit(target)
            if not target or u.scheme or u.netloc:
                continue
            if u.path:
                dest = local(u.path) if u.path.startswith('/') else local(str(path.parent.relative_to(ROOT) / u.path))
                check(dest.exists(), f'{rel}: broken link {target}')
                if u.fragment and dest.exists() and dest.suffix == '.html':
                    check(f'id="{u.fragment}"' in texts.get(dest, ''), f'{rel}: missing #{u.fragment} in {u.path}')
            elif u.fragment:
                check(u.fragment in ids, f'{rel}: missing #{u.fragment}')
    text = texts[path]
    check('fonts.googleapis' not in text and 'googletagmanager' not in text and 'http://' not in re.sub(r'xmlns(:\w+)?="http://[^"]*"', '', text),
          f'{rel}: third-party font, tracker or plain http')
    check('GPSBu6Jz' not in text, f'{rel}: old TestFlight link')

for css in (ROOT / 'assets').glob('*.css'):
    for url in re.findall(r'url\((/[^)]+)\)', css.read_text()):
        check(local(url.strip('"\'')).exists(), f'{css.name}: missing {url}')

# 5. Download links: the HTML fallbacks match assets/links.js
links = dict(re.findall(r"(\w+): '([^']*)'", (ROOT / 'assets' / 'links.js').read_text()))
for path, page in pages.items():
    for tag, attrs in page.tags:
        key = attrs.get('data-link')
        if not key or key == 'iosAppStore':
            continue
        expected = links['iosAppStore'] or links['iosTestFlight'] if key == 'ios' else links.get(key)
        check(attrs.get('href') == expected, f'{path.relative_to(ROOT)}: data-link={key} href {attrs.get("href")} != links.js {expected}')
for home in HOMES.values():
    text = texts[local(home)]
    check('class="store" href="/test/"' in text, f'{home}: Android button must go to /test/')
    check('class="store" data-link="ios"' in text, f'{home}: iPhone button must use the ios link')

# 6. Translations complete (same keys in every language)
def keys(d, prefix=''):
    out = set()
    for k, v in d.items():
        out |= keys(v, prefix + k + '.') if isinstance(v, dict) else {prefix + k}
    return out
strings = {lang: json.loads((ROOT / 'src' / 'i18n' / f'{lang}.json').read_text(encoding='utf-8')) for lang in LANGS}
for lang in LANGS[1:]:
    check(keys(strings[lang]) - {'_note'} == keys(strings['en']) - {'_note'}, f'src/i18n/{lang}.json keys differ from en.json')
    check(len(strings[lang]['faq']['items']) == len(strings['en']['faq']['items']), f'{lang}: FAQ count')

# 7. Repository hygiene: nothing published that should not be
for bad in ['.env', 'node_modules', 'secrets', '.pem', '.p8', 'service-account']:
    check(not any(bad in str(p) for p in ROOT.rglob('*') if '.git' not in p.parts), f'unexpected file matching {bad}')

if failures:
    print('FAIL\n- ' + '\n- '.join(failures))
    sys.exit(1)
print(f'PASS: {len(html_files)} pages, {len(urls)} sitemap URLs, links, hreflang, robots, download links, translations')
