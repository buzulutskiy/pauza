#!/usr/bin/env python3
"""Иконки для «Паузы» — тот же знак, что стоит в шапке приложения:
скруглённый квадрат с градиентом бирюза → синий и белый знак паузы.

Геометрия повторяет разметку: логотип в шапке — квадрат 30 px, внутри
svg 18 px с двумя линиями (x = 9 и 15, y от 6 до 18, толщина 2.2,
круглые концы). Значит содержимое занимает 60% стороны, и все размеры
здесь считаются от этой доли — иконка получается той же, только крупнее.
"""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))

ACCENT = (0x16, 0x6E, 0x70)    # --accent светлой темы
ACCENT2 = (0x3E, 0x6F, 0xB8)   # --accent-2
ANGLE = 155                    # linear-gradient(155deg, …) из .logo


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def rounded_mask(size, rad):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=rad, fill=255)
    return m


def make(size):
    ss = 4                     # рисуем крупнее и ужимаем: края выходят гладкими
    S = size * ss

    # градиент вдоль направления CSS: 0deg — вверх, отсчёт по часовой стрелке
    rad = math.radians(ANGLE)
    dx, dy = math.sin(rad), -math.cos(rad)
    img = Image.new("RGB", (S, S))
    px = img.load()
    half = (abs(dx) + abs(dy)) * S / 2      # длина проекции квадрата на ось градиента
    for y in range(S):
        for x in range(S):
            p = ((x - S / 2) * dx + (y - S / 2) * dy + half) / (2 * half)
            px[x, y] = lerp(ACCENT, ACCENT2, min(1.0, max(0.0, p)))

    d = ImageDraw.Draw(img)
    k = 0.6 * S / 24           # svg 18 внутри квадрата 30 → та же доля, что в шапке
    w = 2.2 * k                # толщина линии
    h = 6.0 * k                # половина длины (y от 6 до 18)
    cx, cy = S / 2, S / 2
    for sign in (-1, 1):
        bx = cx + sign * 3.0 * k       #x = 9 и 15 при центре 12
        d.rounded_rectangle([bx - w / 2, cy - h, bx + w / 2, cy + h],
                            radius=w / 2, fill=(255, 255, 255))

    img = img.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), rounded_mask(size, round(size * 0.22)))
    return out


for s, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png"), (32, "favicon-32.png")]:
    make(s).save(os.path.join(OUT, name))
    print("ok", name)
