"""Print the inline SVG QR code used on /test/ (pip install segno).

Usage: python3 tools/make_qr.py [url]  → paste the output over the <svg class="qr"> in test/index.html.
"""
import io
import sys

import segno

url = sys.argv[1] if len(sys.argv) > 1 else 'https://vazne.app/test/'
buf = io.BytesIO()
segno.make(url, error='m', micro=False).save(
    buf, kind='svg', xmldecl=False, svgns=True, nl=False, border=2, dark='#191d26', omitsize=True, svgclass='qr', lineclass=None
)
print(buf.getvalue().decode().replace('<svg ', '<svg role="img" aria-label="QR code: ' + url + '" ', 1))
