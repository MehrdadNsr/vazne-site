"""Dependency-free checks for public URLs, static content and search markup."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, xml.etree.ElementTree as ET

ROOT=Path(__file__).parent
BASE='https://vazne.app'
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__(); self.tags=[]; self.feed(text)
    def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))
    def find(self,tag,**attrs):
        return [a for t,a in self.tags if t==tag and all(a.get(k)==v for k,v in attrs.items())]

def local(path):
    p=ROOT/unquote(path).lstrip('/')
    return p/'index.html' if path.endswith('/') or path=='' else p

urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==len(set(urls))==11
pages={url:Page(local(urlsplit(url).path).read_text()) for url in urls}
titles=set(); descriptions=set()
for url,p in pages.items():
    text=local(urlsplit(url).path).read_text()
    assert p.find('link',rel='canonical')==[{'rel':'canonical','href':url}],url
    assert not any('noindex' in a.get('content','') for a in p.find('meta',name='robots')),url
    title=re.search(r'<title>(.*?)</title>',text).group(1)
    desc=p.find('meta',name='description')[0]['content']
    assert title and title not in titles,url
    assert desc and desc not in descriptions,url
    titles.add(title); descriptions.add(desc)
    ids=[a['id'] for _,a in p.tags if 'id' in a]
    assert len(ids)==len(set(ids)),url
    for tag,attrs in p.tags:
        for attr in ['href','src']:
            target=attrs.get(attr,''); u=urlsplit(target)
            if not target or u.scheme or u.netloc: continue
            if u.path:
                dest=local(u.path) if u.path.startswith('/') else local(urlsplit(url).path).parent/u.path
                assert dest.exists(),(url,target)
            elif u.fragment:
                assert u.fragment in ids,(url,target)
    if '/privacy/' in url or '/terms/' in url or '/delete-account/' in url: continue
    assert len(p.find('h1'))==1,url
    alts=p.find('link',rel='alternate')
    assert {a['hreflang'] for a in alts}=={'en','fa','x-default'},url
    for a in alts:
        assert a['href'] in pages,(url,a)
        assert any(b['href']==url for b in pages[a['href']].find('link',rel='alternate')),(url,a)
    assert p.find('meta',property='og:url')[0]['content']==url
    assert p.find('meta',property='og:image')[0]['content']==BASE+'/social-card.png'
    graphs=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)]
    assert graphs,url
    for graph in graphs:
        for node in graph['@graph']:
            assert node['@type'] in ['WebSite','SoftwareApplication','WebPage','BreadcrumbList']
            assert not any(k in node for k in ['aggregateRating','review','offers'])
    if '/guides/' in url:
        assert len(p.find('h2'))>=4 and 'guide-body' in text
    assert len(text)>2000,url

assert 'Sitemap: '+BASE+'/sitemap.xml' in (ROOT/'robots.txt').read_text()
assert 'noindex' in (ROOT/'404.html').read_text()
assert (ROOT/'social-card.png').read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
assert "document.title =" not in (ROOT/'site.js').read_text()
assert 'setLanguage(lang)' in (ROOT/'site.js').read_text()
assert 'میلهٔ ۲۰ کیلویی' in (ROOT/'fa/index.html').read_text()
print(f'PASS: {len(urls)} sitemap pages; unique metadata; local links/assets; reciprocal languages; JSON-LD; 404 and sharing image')
