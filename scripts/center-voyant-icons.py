#!/usr/bin/env python3
"""Découpe et centre les icônes voyants depuis l'infographie source."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/assets/lessons/voyants-tableau-de-bord.png"
OUT_DIR = ROOT / "src/assets/lessons/voyants"

CAPTURE = 128
FINAL = 128
WHITE = (255, 255, 255)

# (fichier, colonne x, détecteur couleur)
ICON_SPECS = [
    ("voyant-01-pression-huile.png", 102, "red"),
    ("voyant-02-batterie.png", 307, "red"),
    ("voyant-03-moteur.png", 512, "orange"),
    ("voyant-04-frein.png", 717, "red"),
    ("voyant-05-pneus.png", 906, "orange"),
    ("voyant-06-ceinture.png", 102, "red"),
    ("voyant-07-feux-route.png", 307, "blue"),
    ("voyant-08-feux-croisement.png", 512, "green"),
    ("voyant-09-abs.png", 717, "orange"),
    ("voyant-10-temperature.png", 922, "red"),
]

ROW_RANGES = [(70, 250), (300, 560)]


def matches_color(px: tuple[int, int, int, int], kind: str) -> bool:
    r, g, b, a = px
    if a < 20:
        return False
    if kind == "red":
        return r > 170 and g < 110 and b < 110
    if kind == "orange":
        return r > 190 and 70 < g < 190 and b < 100
    if kind == "green":
        return g > 135 and r < 90 and b < 90
    if kind == "blue":
        return b > 110 and r < 120 and g < 200
    return False


def find_icon_center(sheet: Image.Image, col_x: int, color: str, y_min: int, y_max: int) -> tuple[int, int]:
    """Centre de masse des pixels de l'icône (évite les lignes horizontales du symbole)."""
    px = sheet.load()
    x0, x1 = col_x - 65, col_x + 65
    xs: list[int] = []
    ys: list[int] = []
    for y in range(y_min, y_max):
        for x in range(x0, x1):
            if matches_color(px[x, y], color):
                xs.append(x)
                ys.append(y)
    if not xs:
        return col_x, (y_min + y_max) // 2
    return round(sum(xs) / len(xs)), round(sum(ys) / len(ys))


def trim_icon(crop: Image.Image) -> Image.Image:
    pixels = crop.load()
    w, h = crop.size
    bbox = None
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 20 or (r > 242 and g > 242 and b > 242):
                continue
            if max(r, g, b) < 100:
                continue
            spread = max(r, g, b) - min(r, g, b)
            if spread < 18 and max(r, g, b) < 160:
                continue
            if r > 170 and g < 110 and b < 110:
                pass
            elif r > 190 and 70 < g < 190 and b < 100:
                pass
            elif g > 135 and r < 90 and b < 90:
                pass
            elif b > 110 and r < 120 and g < 200:
                pass
            else:
                continue
            if bbox is None:
                bbox = [x, y, x, y]
            else:
                bbox[0] = min(bbox[0], x)
                bbox[1] = min(bbox[1], y)
                bbox[2] = max(bbox[2], x)
                bbox[3] = max(bbox[3], y)
    if not bbox:
        return crop
    pad = 8
    return crop.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad + 1),
            min(h, bbox[3] + pad + 1),
        )
    )


def center_on_square(icon: Image.Image, size: int = FINAL) -> Image.Image:
    iw, ih = icon.size
    max_side = max(iw, ih, 1)
    margin = 14
    scale = min(1.0, (size - margin) / max_side)
    nw = max(1, round(iw * scale))
    nh = max(1, round(ih * scale))
    icon = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (*WHITE, 255))
    out.paste(icon, ((size - nw) // 2, (size - nh) // 2), icon)
    return out.convert("RGB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGBA")
    half = CAPTURE // 2

    for index, (filename, col_x, color) in enumerate(ICON_SPECS):
        y_min, y_max = ROW_RANGES[index // 5]
        cx, cy = find_icon_center(sheet, col_x, color, y_min, y_max)
        left = max(0, cx - half)
        top = max(0, cy - half)
        right = min(sheet.width, cx + half)
        bottom = min(sheet.height, cy + half)
        crop = sheet.crop((left, top, right, bottom))
        icon = trim_icon(crop)
        out = center_on_square(icon)
        out.save(OUT_DIR / filename, "PNG", optimize=True)
        print(f"{filename}: centre ({cx},{cy}) trim {icon.size}")

    print("Terminé.")


if __name__ == "__main__":
    main()
