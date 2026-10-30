"""Render social-card.png, the 1200 × 630 link preview (og:image). Brand colours: crimson + ink on paper. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
image = Image.new('RGB', (1200, 630), '#f3f4f6')
draw = ImageDraw.Draw(image)
for y in range(630):
    t=y/630
    draw.line((0,y,1200,y), fill=(int(243-10*t),int(244-8*t),int(246-5*t)))
draw.rounded_rectangle((44,44,1156,586),radius=42,fill='#fafbfc',outline='white',width=3)
red='#c52235'; ink='#191d26'; muted='#535a67'
fontroot=Path('/usr/share/fonts/truetype/dejavu')
def font(size,bold=False):
    return ImageFont.truetype(str(fontroot/('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),size)
draw.text((95,87),'VAZNE',font=font(26,True),fill=red)
draw.text((90,170),'Your gym buddy.',font=font(65,True),fill=ink)
draw.text((95,280),'Your plan. Every set. Your progress.',font=font(29),fill=muted)
draw.rounded_rectangle((95,372,602,434),radius=31,fill='#faedf0')
draw.text((120,387),'Workout tracker  /  iOS + Android',font=font(23),fill='#a91e31')
draw.text((95,503),'vazne.app',font=font(24,True),fill=ink)
# The same geometric dumbbell mark used in the website, redrawn at card size.
for x,top,bottom in [(858,211,329),(900,176,364),(1050,176,364),(1092,211,329)]:
    draw.rounded_rectangle((x-10,top,x+10,bottom),radius=10,fill=red)
draw.rounded_rectangle((900,260,1050,280),radius=10,fill=red)
image.save(root/'social-card.png',optimize=True)
