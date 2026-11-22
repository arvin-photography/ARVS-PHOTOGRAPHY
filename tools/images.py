"""
Image helpers for the portfolio (requires Python 3 + Pillow:  pip install pillow).

  python tools/images.py thumbs     # (re)build client/public/images/thumbs/*.webp (640px)
  python tools/images.py portrait   # rebuild portrait-blur.webp + portrait-neg.webp from portrait.webp
  python tools/images.py all        # both

Run it after adding or replacing photos in client/public/images/.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps

IMAGES = Path(__file__).resolve().parent.parent / 'client' / 'public' / 'images'
GENERATED = {'portrait-blur.webp', 'portrait-neg.webp'}  # derived files, no thumbnails needed


def thumbs():
    out = IMAGES / 'thumbs'
    out.mkdir(exist_ok=True)
    count = 0
    for src in sorted(IMAGES.glob('*.webp')):
        if src.name in GENERATED:
            continue
        im = Image.open(src).convert('RGB')
        im.thumbnail((640, 640))
        im.save(out / src.name, 'WEBP', quality=74, method=6)
        count += 1
    print(f'thumbs: wrote {count} files to {out}')


def portrait():
    src = Image.open(IMAGES / 'portrait.webp').convert('RGB')

    # out-of-focus copy for the viewfinder focus pull (tiny + blurred; the browser upscales it)
    blur = src.copy()
    blur.thumbnail((160, 160))
    blur = blur.filter(ImageFilter.GaussianBlur(3))
    blur = ImageEnhance.Brightness(blur).enhance(0.7)
    blur = ImageEnhance.Color(blur).enhance(0.6)
    blur.save(IMAGES / 'portrait-blur.webp', 'WEBP', quality=80)

    # colour negative under a red darkroom safelight, for the "develop" effect
    neg = ImageEnhance.Contrast(ImageOps.invert(src)).enhance(1.25)
    neg = Image.blend(neg, ImageOps.colorize(ImageOps.grayscale(neg), '#1a0d05', '#f4e2c4'), 0.5)
    neg = Image.blend(neg, ImageChops.multiply(neg, Image.new('RGB', neg.size, (192, 26, 8))), 0.6)
    neg.thumbnail((1200, 1200))
    neg.save(IMAGES / 'portrait-neg.webp', 'WEBP', quality=72)
    print('portrait: wrote portrait-blur.webp and portrait-neg.webp')


if __name__ == '__main__':
    task = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if task not in ('thumbs', 'portrait', 'all'):
        sys.exit(__doc__)
    if task in ('thumbs', 'all'):
        thumbs()
    if task in ('portrait', 'all'):
        portrait()
