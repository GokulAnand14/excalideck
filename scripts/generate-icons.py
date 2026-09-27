"""
Generate smooth rounded squircle icons with transparent corners for Excalideck.
Usage: python scripts/generate-icons.py
"""
import subprocess
from PIL import Image, ImageDraw

def main():
    src = "src-tauri/icons/icon.png"
    orig = Image.open(src).convert("RGBA")
    w, h = orig.size

    # 4x supersampling for ultra smooth anti-aliased squircle edges
    scale = 4
    sw, sh = w * scale, h * scale
    padding = 10 * scale
    radius = int((sw - 2 * padding) * 0.225)

    mask = Image.new("L", (sw, sh), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [padding, padding, sw - padding, sh - padding],
        radius=radius,
        fill=255
    )

    mask = mask.resize((w, h), Image.Resampling.LANCZOS)
    rounded = orig.copy()
    rounded.putalpha(mask)

    # Save source images
    rounded.save("src-tauri/icons/icon.png", "PNG")
    rounded.save("public/logo.png", "PNG")
    rounded.resize((256, 256), Image.Resampling.LANCZOS).save("public/favicon.png", "PNG")
    print("✅ Created rounded source icons in src-tauri/icons/icon.png and public/")

    # Generate all platform icons via Tauri CLI
    subprocess.run(["bun", "tauri", "icon", "src-tauri/icons/icon.png"], check=True)
    print("✅ Successfully regenerated all platform icons (ICO, ICNS, PNGs)")

if __name__ == "__main__":
    main()
