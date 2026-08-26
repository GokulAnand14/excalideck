import math
from PIL import Image, ImageDraw, ImageFilter

def create_excalideck_icon(size=1024):
    # Render at 2x for ultra-sharp supersampled anti-aliasing
    scale = 2
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Margins and squircle dimensions
    margin = 80 * scale
    box = (margin, margin, canvas_size - margin, canvas_size - margin)
    radius = 360 * scale  # Modern continuous-curvature rounded squircle

    # 1. Soft Ambient Drop Shadow
    shadow_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_offset = 35 * scale
    shadow_box = (margin, margin + shadow_offset, canvas_size - margin, canvas_size - margin + shadow_offset)
    shadow_draw.rounded_rectangle(shadow_box, radius=radius, fill=(0, 0, 0, 160))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=40 * scale))
    img.alpha_composite(shadow_img)

    # 2. Main Squircle Body with Gradient
    squircle_mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(squircle_mask)
    mask_draw.rounded_rectangle(box, radius=radius, fill=255)

    # Gradient background: deep midnight navy -> rich indigo -> electric violet
    grad_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad_img)
    for y in range(int(margin), int(canvas_size - margin)):
        t = (y - margin) / (canvas_size - 2 * margin)
        # Deep space violet to electric indigo gradient
        r = int(14 * (1 - t) + 99 * t)
        g = int(16 * (1 - t) + 102 * t)
        b = int(42 * (1 - t) + 241 * t)
        grad_draw.line([(margin, y), (canvas_size - margin, y)], fill=(r, g, b, 255))

    # Radial highlight near top-center for premium 3D lighting
    glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center_x = canvas_size // 2
    center_y = int(canvas_size * 0.35)
    glow_radius = int(canvas_size * 0.45)
    for r_cur in range(glow_radius, 0, -6):
        alpha = int(70 * (1 - (r_cur / glow_radius) ** 2))
        glow_draw.ellipse(
            (center_x - r_cur, center_y - r_cur, center_x + r_cur, center_y + r_cur),
            fill=(168, 85, 247, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=25 * scale))
    grad_img.alpha_composite(glow)

    # Clip to squircle
    base_card = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    base_card.paste(grad_img, (0, 0), squircle_mask)
    img.alpha_composite(base_card)

    # 3. Inner Border Stroke (Glass highlight on top, subtle dark border on bottom)
    border_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_img)
    border_width = 4 * scale
    border_draw.rounded_rectangle(
        (margin + border_width//2, margin + border_width//2, canvas_size - margin - border_width//2, canvas_size - margin - border_width//2),
        radius=radius - border_width,
        outline=(255, 255, 255, 75),
        width=border_width
    )
    img.alpha_composite(border_img)

    # 4. Central Graphic: Glowing Modern Stylized Pen & Infinite Sketch Ribbon
    symbol_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    symbol_draw = ImageDraw.Draw(symbol_img)

    # Floating curved dynamic stroke / canvas ribbon behind the pen
    curve_points = []
    num_pts = 200
    for i in range(num_pts):
        t = i / (num_pts - 1)
        # Smooth S-curve / infinity ribbon
        cx = canvas_size * (0.28 + 0.44 * t)
        cy = canvas_size * (0.65 - 0.28 * math.sin(t * math.pi) + 0.12 * math.cos(t * math.pi * 2))
        curve_points.append((cx, cy))

    # Draw neon stroke glow
    for width, alpha in [(48 * scale, 30), (32 * scale, 70), (18 * scale, 160), (10 * scale, 240)]:
        glow_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        glow_d = ImageDraw.Draw(glow_layer)
        glow_d.line(curve_points, fill=(56, 189, 248, alpha), width=width, joint="curve")
        if width > 18 * scale:
            glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=8 * scale))
        symbol_img.alpha_composite(glow_layer)

    # 5. Crisp Angled Minimalist Stylus / Pencil
    # Diagonal at ~45 degrees pointing towards bottom-left
    pen_len = 380 * scale
    pen_w = 34 * scale
    tip_len = 54 * scale

    center_pen_x = canvas_size * 0.54
    center_pen_y = canvas_size * 0.44
    angle = math.radians(45)

    cos_a = math.cos(angle)
    sin_a = math.sin(angle)

    # Tip point
    p_tip = (center_pen_x - (pen_len/2) * cos_a, center_pen_y + (pen_len/2) * sin_a)
    
    # Body base and cap points
    p_body_start = (p_tip[0] + tip_len * cos_a, p_tip[1] - tip_len * sin_a)
    p_cap = (p_tip[0] + pen_len * cos_a, p_tip[1] - pen_len * sin_a)

    perp_x = -sin_a * (pen_w / 2)
    perp_y = -cos_a * (pen_w / 2)

    # Body Polygon
    body_poly = [
        (p_body_start[0] + perp_x, p_body_start[1] + perp_y),
        (p_cap[0] + perp_x, p_cap[1] + perp_y),
        (p_cap[0] - perp_x, p_cap[1] - perp_y),
        (p_body_start[0] - perp_x, p_body_start[1] - perp_y),
    ]

    # Tip Polygon (Triangle)
    tip_poly = [
        (p_body_start[0] + perp_x, p_body_start[1] + perp_y),
        p_tip,
        (p_body_start[0] - perp_x, p_body_start[1] - perp_y),
    ]

    # Pen Shadow
    pen_shadow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    ps_draw = ImageDraw.Draw(pen_shadow)
    sh_ox, sh_oy = 15 * scale, 22 * scale
    sh_body = [(x + sh_ox, y + sh_oy) for x, y in body_poly]
    sh_tip = [(x + sh_ox, y + sh_oy) for x, y in tip_poly]
    ps_draw.polygon(sh_body, fill=(0, 0, 0, 140))
    ps_draw.polygon(sh_tip, fill=(0, 0, 0, 140))
    pen_shadow = pen_shadow.filter(ImageFilter.GaussianBlur(radius=12 * scale))
    symbol_img.alpha_composite(pen_shadow)

    # Draw Pen Body (Clean pure white with subtle glass lighting)
    pen_draw = ImageDraw.Draw(symbol_img)
    pen_draw.polygon(body_poly, fill=(255, 255, 255, 245))
    
    # Cap accent band (Electric purple)
    band_len = 45 * scale
    p_band_start = (p_cap[0] - band_len * cos_a, p_cap[1] + band_len * sin_a)
    band_poly = [
        (p_band_start[0] + perp_x, p_band_start[1] + perp_y),
        (p_cap[0] + perp_x, p_cap[1] + perp_y),
        (p_cap[0] - perp_x, p_cap[1] - perp_y),
        (p_band_start[0] - perp_x, p_band_start[1] - perp_y),
    ]
    pen_draw.polygon(band_poly, fill=(168, 85, 247, 255))

    # Draw Pen Tip (Frosted steel / graphite)
    pen_draw.polygon(tip_poly, fill=(224, 231, 255, 255))
    
    # Nib point
    nib_len = 16 * scale
    p_nib_base = (p_tip[0] + nib_len * cos_a, p_tip[1] - nib_len * sin_a)
    nib_poly = [
        (p_nib_base[0] + perp_x * 0.4, p_nib_base[1] + perp_y * 0.4),
        p_tip,
        (p_nib_base[0] - perp_x * 0.4, p_nib_base[1] - perp_y * 0.4),
    ]
    pen_draw.polygon(nib_poly, fill=(30, 41, 59, 255))

    # Sparkle at nib tip
    spark_radius = 28 * scale
    spark_glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sg_draw = ImageDraw.Draw(spark_glow)
    sg_draw.ellipse(
        (p_tip[0] - spark_radius, p_tip[1] - spark_radius, p_tip[0] + spark_radius, p_tip[1] + spark_radius),
        fill=(255, 255, 255, 220)
    )
    spark_glow = spark_glow.filter(ImageFilter.GaussianBlur(radius=6 * scale))
    symbol_img.alpha_composite(spark_glow)

    img.alpha_composite(symbol_img)

    # Downsample from 2048 to 1024 with high quality Lanczos filter
    final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_icon

if __name__ == "__main__":
    icon = create_excalideck_icon(1024)
    icon.save("src-tauri/icons/icon.png", "PNG")
    icon.save("public/logo.png", "PNG")
    print("Master 1024x1024 icon generated successfully.")
