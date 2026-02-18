#!/usr/bin/env python3
"""
Process vynr screenshots into journal-page style images.
Warm vignette, papyrus tone wash, softened edges, chrome cropping.
"""

from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import os

INPUT_DIR = "/Users/badday/Downloads/vynr-screen-shots"
OUTPUT_DIR = "/Users/badday/dev/ios/vynr-app/vynr-web/public/journal"

# Papyrus tone for the wash
PAPYRUS = (253, 246, 227)  # #fdf6e3
WARM_BROWN = (139, 115, 85)  # #8B7355


def apply_journal_treatment(img: Image.Image, corner_radius: int = 24) -> Image.Image:
    """Apply warm vignette, papyrus tone wash, and rounded corners."""
    # Work in RGBA
    img = img.convert("RGBA")
    w, h = img.size

    # 1. Slight warmth shift — blend toward papyrus at ~8%
    papyrus_layer = Image.new("RGBA", (w, h), (*PAPYRUS, 255))
    img = Image.blend(img, papyrus_layer, alpha=0.06)

    # 2. Slight desaturation (like an aged print)
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(0.85)

    # 3. Vignette — radial gradient darkening at edges
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)

    # Build vignette as concentric ellipses with increasing opacity
    cx, cy = w // 2, h // 2
    max_radius = max(w, h) * 0.75
    steps = 60
    for i in range(steps, 0, -1):
        # Opacity ramps up at the edges
        t = i / steps  # 1.0 = outermost
        opacity = int(55 * (t ** 2.5))  # Gentle curve, max ~55 alpha
        rx = int(cx + (max_radius * 0.5) * (1 + t * 0.6))
        ry = int(cy + (max_radius * 0.5) * (1 + t * 0.6))
        draw.ellipse(
            [cx - rx, cy - ry, cx + rx, cy + ry],
            fill=(35, 28, 18, opacity)  # Warm dark brown, not black
        )

    img = Image.alpha_composite(img, vignette)

    # 4. Rounded corners with transparent mask
    mask = Image.new("L", (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, w, h], radius=corner_radius, fill=255)
    img.putalpha(mask)

    return img


def crop_phone_chrome(img: Image.Image, crop_top: int = 0, crop_bottom: int = 0) -> Image.Image:
    """Crop away phone status bar and home indicator."""
    w, h = img.size
    return img.crop((0, crop_top, w, h - crop_bottom))


def _fname(time_part: str) -> str:
    """Build macOS screenshot filename with narrow no-break space before AM/PM."""
    return f"Screenshot 2026-02-18 at {time_part}\u202fPM.png"


def process_france_treemap():
    """France regions treemap — hero image. Crop chrome, full treatment."""
    path = os.path.join(INPUT_DIR, _fname("8.19.26"))
    img = Image.open(path)
    # This appears to already be cropped to just the treemap content
    # Apply journal treatment
    result = apply_journal_treatment(img, corner_radius=20)
    result.save(os.path.join(OUTPUT_DIR, "france-treemap.png"), "PNG")
    print(f"france-treemap.png: {result.size}")


def process_savigny_label():
    """Savigny-les-Beaune wine label — the raw capture moment."""
    path = os.path.join(INPUT_DIR, _fname("8.29.17"))
    img = Image.open(path)
    # This is the camera view — keep it dark and moody
    img = img.convert("RGBA")
    w, h = img.size

    # Slightly heavier vignette for the dark label shot
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(0.8)

    # Warm it slightly
    papyrus_layer = Image.new("RGBA", (w, h), (*PAPYRUS, 255))
    img = Image.blend(img, papyrus_layer, alpha=0.04)

    # Vignette
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    cx, cy = w // 2, h // 2
    max_radius = max(w, h) * 0.7
    for i in range(50, 0, -1):
        t = i / 50
        opacity = int(70 * (t ** 2.2))
        rx = int(cx + (max_radius * 0.45) * (1 + t * 0.65))
        ry = int(cy + (max_radius * 0.45) * (1 + t * 0.65))
        draw.ellipse(
            [cx - rx, cy - ry, cx + rx, cy + ry],
            fill=(25, 20, 12, opacity)
        )
    img = Image.alpha_composite(img, vignette)

    # Rounded corners
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=16, fill=255)
    img.putalpha(mask)

    img.save(os.path.join(OUTPUT_DIR, "savigny-label.png"), "PNG")
    print(f"savigny-label.png: {img.size}")


def process_alsace_panel():
    """Alsace education panel — atlas reference detail."""
    path = os.path.join(INPUT_DIR, _fname("8.18.47"))
    img = Image.open(path)
    result = apply_journal_treatment(img, corner_radius=20)
    result.save(os.path.join(OUTPUT_DIR, "alsace-atlas.png"), "PNG")
    print(f"alsace-atlas.png: {result.size}")


def process_bordeaux_appellations():
    """Bordeaux appellations treemap — the depth when you drill in."""
    path = os.path.join(INPUT_DIR, _fname("8.30.14"))
    img = Image.open(path)
    result = apply_journal_treatment(img, corner_radius=20)
    result.save(os.path.join(OUTPUT_DIR, "bordeaux-appellations.png"), "PNG")
    print(f"bordeaux-appellations.png: {result.size}")


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    process_france_treemap()
    process_savigny_label()
    process_alsace_panel()
    process_bordeaux_appellations()
    print("\nAll images processed.")
