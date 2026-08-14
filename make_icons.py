#!/usr/bin/env python3
"""Иконки для «Паузы»: спокойный градиент бирюза → индиго, белая волна и знак паузы."""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))

def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def rounded_mask(size, rad):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=rad, fill=255)
    return m

def make(size):
    ss = 4
    S = size * ss
    img = Image.new("RGB", (S, S), (0, 0, 0))
    top = (0x1F, 0x8C, 0x8A)   # бирюза
    bot = (0x2F, 0x4E, 0x9B)   # индиго
    px = img.load()
    for y in range(S):
        c = lerp(top, bot, y / (S - 1))
        for x in range(S):
            px[x, y] = c
    d = ImageDraw.Draw(img, "RGBA")

    # волна: пик слева, затухание вправо
    def wave_y(t):
        p, a = 0.30, 1.9
        if t <= 0:
            return 0.0
        r = t / p
        return 0.10 + 0.90 * (r ** a) * math.exp(a * (1 - r))

    # рисуем кружками — так линия остаётся гладкой на любом размере
    r = S * 0.020
    steps = 900
    for i in range(steps + 1):
        t = i / steps
        x = 0.13 * S + t * 0.74 * S
        y = 0.82 * S - wave_y(t) * 0.30 * S
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 240))

    # знак паузы над волной
    bw = S * 0.055
    bh = S * 0.21
    gap = S * 0.066
    cx, cy = S * 0.50, S * 0.34
    for sgn in (-1, 1):
        x0 = cx + sgn * gap / 2 - (bw if sgn < 0 else 0)
        d.rounded_rectangle([x0, cy - bh / 2, x0 + bw, cy + bh / 2],
                            radius=bw / 2, fill=(255, 255, 255, 255))

    img = img.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), rounded_mask(size, round(size * 0.22)))
    return out

for s, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png"), (32, "favicon-32.png")]:
    make(s).save(os.path.join(OUT, name))
    print("ok", name)
