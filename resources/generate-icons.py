#!/usr/bin/env python3
"""Генератор иконок. Запускать НЕ обязательно — готовые PNG уже лежат в android/app/src/main/res.
Нужен только если захотите поменять рисунок иконки:
    pip install cairosvg pillow
    python resources/generate-icons.py
Источники: icon-background.svg и icon-foreground.svg (холст 108x108, как у adaptive icon).
"""
import io, os
import cairosvg
from PIL import Image, ImageDraw, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res')
SPLASH_BG = '#000000'


def render(svg_text_or_path, px):
    if svg_text_or_path.lstrip().startswith('<'):
        data = cairosvg.svg2png(bytestring=svg_text_or_path.encode(), output_width=px, output_height=px)
    else:
        data = cairosvg.svg2png(url=svg_text_or_path, output_width=px, output_height=px)
    return Image.open(io.BytesIO(data)).convert('RGBA')


def alpha_of(svg_body, px):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">{svg_body}</svg>'
    return render(svg, px).split()[3]


def monochrome(px):
    """Однотонный силуэт для тематических иконок Android 13+ (слои add/cut без <mask>)."""
    card = ('<rect x="30" y="29" width="44" height="44" rx="8" fill="#000"/>'
            '<rect x="39" y="25.5" width="3.6" height="8.4" rx="1.8" fill="#000"/>'
            '<rect x="61.4" y="25.5" width="3.6" height="8.4" rx="1.8" fill="#000"/>')
    cuts = ('<rect x="30" y="41.6" width="44" height="1.6" fill="#000"/>'
            '<rect x="34.4" y="46" width="7.2" height="6.4" rx="1.9" fill="#000"/>'
            '<rect x="43.9" y="46" width="7.2" height="6.4" rx="1.9" fill="#000"/>'
            '<rect x="43.9" y="54.6" width="7.2" height="6.4" rx="1.9" fill="#000"/>'
            '<rect x="53.4" y="54.6" width="7.2" height="6.4" rx="1.9" fill="#000"/>'
            '<circle cx="69" cy="68.5" r="13.8" fill="#000"/>')
    badge = '<circle cx="69" cy="68.5" r="12" fill="#000"/>'
    face_cut = '<circle cx="69" cy="68.5" r="9.4" fill="#000"/>'
    hands = ('<path d="M69 62.2V68.5l4.4 2.7" fill="none" stroke="#000" stroke-width="2.4" '
             'stroke-linecap="round" stroke-linejoin="round"/>')
    a = alpha_of(card, px)
    a = ImageChops.multiply(a, ImageChops.invert(alpha_of(cuts, px)))
    a = ImageChops.lighter(a, alpha_of(badge, px))
    a = ImageChops.multiply(a, ImageChops.invert(alpha_of(face_cut, px)))
    a = ImageChops.lighter(a, alpha_of(hands, px))
    img = Image.new('RGBA', (px, px), (255, 255, 255, 0))
    img.putalpha(a)
    return img


def legacy(px, shape):
    bg = render(os.path.join(HERE, 'icon-background.svg'), px * 3)
    fg = render(os.path.join(HERE, 'icon-foreground.svg'), px * 3)
    comp = Image.alpha_composite(bg, fg)
    s = px * 3
    crop = int(s * 0.10)                       # убираем «поля» adaptive-холста
    comp = comp.crop((crop, crop, s - crop, s - crop)).resize((px * 3, px * 3), Image.LANCZOS)
    mask = Image.new('L', comp.size, 0)
    d = ImageDraw.Draw(mask)
    if shape == 'round':
        d.ellipse((0, 0, comp.size[0] - 1, comp.size[1] - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, comp.size[0] - 1, comp.size[1] - 1), radius=int(comp.size[0] * 0.22), fill=255)
    comp.putalpha(mask)
    return comp.resize((px, px), Image.LANCZOS)


def save(img, *parts):
    path = os.path.join(RES, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)


layers = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
legacy_sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

for dpi, px in layers.items():
    save(render(os.path.join(HERE, 'icon-background.svg'), px), f'mipmap-{dpi}', 'ic_launcher_background.png')
    save(render(os.path.join(HERE, 'icon-foreground.svg'), px), f'mipmap-{dpi}', 'ic_launcher_foreground.png')
    save(monochrome(px), f'mipmap-{dpi}', 'ic_launcher_monochrome.png')
    lp = legacy_sizes[dpi]
    save(legacy(lp, 'square'), f'mipmap-{dpi}', 'ic_launcher.png')
    save(legacy(lp, 'round'), f'mipmap-{dpi}', 'ic_launcher_round.png')

# сплэш-логотип (Android 12+ рисует его в круге 2/3 холста; на старых — по центру окна)
save(render(os.path.join(HERE, 'icon-foreground.svg'), 560), 'drawable-xxhdpi', 'splash_logo.png')

# иконка для магазина / README (1024x1024)
full = Image.alpha_composite(render(os.path.join(HERE, 'icon-background.svg'), 1024),
                             render(os.path.join(HERE, 'icon-foreground.svg'), 1024))
m = Image.new('L', full.size, 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, 1023, 1023), radius=230, fill=255)
full.putalpha(m)
full.save(os.path.join(HERE, 'icon-1024.png'), optimize=True)
print('icons generated')
