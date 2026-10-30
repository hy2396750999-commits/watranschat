# -*- coding: utf-8 -*-
"""WATransChat iOS AppIcon 生成器。
用 Python + Pillow 生成 AppIcon.appiconset 所需各尺寸 PNG（绿色渐变 + 白色「译」）。
重跑：python make-icons.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "WATransChat", "Assets.xcassets", "AppIcon.appiconset"))
FONT_PATH = r"C:\Windows\Fonts\msyh.ttc"

# (文件名, 边长 px)
SIZES = [
    ("icon-20@1x.png", 20),
    ("icon-20@2x.png", 40),
    ("icon-20@3x.png", 60),
    ("icon-29@1x.png", 29),
    ("icon-29@2x.png", 58),
    ("icon-29@3x.png", 87),
    ("icon-40@1x.png", 40),
    ("icon-40@2x.png", 80),
    ("icon-40@3x.png", 120),
    ("icon-60@2x.png", 120),
    ("icon-60@3x.png", 180),
    ("icon-76@1x.png", 76),
    ("icon-76@2x.png", 152),
    ("icon-83.5@2x.png", 167),
    ("icon-1024.png", 1024),
]

TOP = (0x25, 0xD3, 0x66)     # #25D366
MID = (0x00, 0xA8, 0x84)     # #00A884
BOTTOM = (0x07, 0x5E, 0x54)  # #075E54


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_master(size):
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    # 纵向三段渐变 25D366 -> 00A884 -> 075E54
    for y in range(size):
        t = y / (size - 1)
        if t < 0.5:
            color = lerp(TOP, MID, t * 2)
        else:
            color = lerp(MID, BOTTOM, (t - 0.5) * 2)
        d.line([(0, y), (size, y)], fill=color)

    # 白色「译」居中
    font_size = int(size * 0.56)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "译"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    # 轻微阴影增加层次
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.text((x + size * 0.008, y + size * 0.012), text, font=font, fill=(0, 0, 0, 70))
    shadow = shadow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(size * 0.008))
    img = Image.alpha_composite(img.convert("RGBA"), shadow)
    d = ImageDraw.Draw(img)
    d.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    return img.convert("RGB")


def main():
    os.makedirs(OUT, exist_ok=True)
    master = make_master(1024)
    for name, px in SIZES:
        if px == 1024:
            out = master
        else:
            out = master.resize((px, px), Image.LANCZOS)
        out.save(os.path.join(OUT, name), "PNG")
        print("written", name, px)


if __name__ == "__main__":
    main()
