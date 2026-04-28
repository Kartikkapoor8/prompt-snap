"""prompt-snap cover — futuristic minimal.
Dark base, soft holographic gradient blob, neon accent, crisp type.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 720
OUT = "cover.png"


def load_font(size, bold=False):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold
        else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def make_holographic_blob(w, h):
    """Big soft gradient blob (cyan → magenta → violet) on a dark base."""
    base = Image.new("RGB", (w, h), (5, 5, 14))

    blob = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blob)
    # three overlapping circles, then heavy blur — gives smooth gradient mesh
    centers = [
        (int(w * 0.30), int(h * 0.55), 460, (88, 212, 255, 220)),    # cyan
        (int(w * 0.65), int(h * 0.40), 420, (220, 80, 255, 200)),    # magenta
        (int(w * 0.55), int(h * 0.78), 380, (110, 80, 255, 180)),    # violet
        (int(w * 0.85), int(h * 0.65), 280, (255, 100, 200, 160)),   # pink
    ]
    for cx, cy, r, color in centers:
        bd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    blob = blob.filter(ImageFilter.GaussianBlur(radius=140))

    # Composite onto base
    out = Image.alpha_composite(base.convert("RGBA"), blob)

    # Subtle vignette
    vig = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vig)
    vd.rectangle((0, 0, w, h), fill=255)
    vd.ellipse(
        (-int(w * 0.1), -int(h * 0.1), int(w * 1.1), int(h * 1.1)),
        fill=140,
    )
    vig = vig.filter(ImageFilter.GaussianBlur(radius=120))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(h):
        # cheap radial-ish darkening on edges
        pass  # vignette omitted; blob already feels balanced

    return out.convert("RGB")


def add_grid(img, color=(255, 255, 255, 14), step=80, line_w=1):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, img.size[0], step):
        d.line([(x, 0), (x, img.size[1])], fill=color, width=line_w)
    for y in range(0, img.size[1], step):
        d.line([(0, y), (img.size[0], y)], fill=color, width=line_w)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_text(img):
    d = ImageDraw.Draw(img)

    # Top rail
    d.text((60, 50), "VISION → HTML",
           font=load_font(22, True), fill=(220, 240, 255))
    idx_font = load_font(22, True)
    idx = "POWERED BY CLAUDE"
    iw = d.textbbox((0, 0), idx, font=idx_font)[2]
    d.text((W - iw - 60, 50), idx, font=idx_font, fill=(220, 240, 255))
    d.line([(60, 92), (W - 60, 92)], fill=(255, 255, 255, 80), width=1)

    # Title — slight glow then crisp white on top
    t_font = load_font(200, True)
    l1, l2 = "PROMPT", "SNAP."
    b1 = d.textbbox((0, 0), l1, font=t_font)
    b2 = d.textbbox((0, 0), l2, font=t_font)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    y1 = 160
    x1 = (W - w1) // 2
    x2 = (W - w2) // 2

    # Glow layer (rendered to its own image then blurred)
    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.text((x1, y1), l1, font=t_font, fill=(120, 220, 255, 180))
    gd.text((x2, y1 + h1 + 10), l2, font=t_font, fill=(220, 130, 255, 180))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=18))
    img = Image.alpha_composite(img.convert("RGBA"), glow_layer).convert("RGB")
    d = ImageDraw.Draw(img)

    # Crisp white on top
    d.text((x1, y1), l1, font=t_font, fill=(255, 255, 255))
    d.text((x2, y1 + h1 + 10), l2, font=t_font, fill=(255, 255, 255))

    # Tagline
    tag_font = load_font(34, False)
    tag = "drop a screenshot. get a working HTML clone."
    tw = d.textbbox((0, 0), tag, font=tag_font)[2]
    d.text(((W - tw) // 2, y1 + h1 + h2 + 50), tag,
           font=tag_font, fill=(210, 220, 240))

    # Bottom rail
    d.line([(60, H - 92), (W - 60, H - 92)], fill=(255, 255, 255, 80), width=1)
    bot_font = load_font(20, True)
    d.text((60, H - 65), "DROP · PASTE · CLICK · COPY · SHIP",
           font=bot_font, fill=(220, 240, 255))
    accent = "kartikkapoor8 / prompt-snap"
    aw = d.textbbox((0, 0), accent, font=bot_font)[2]
    d.text((W - aw - 60, H - 65), accent, font=bot_font, fill=(140, 220, 255))

    return img


def main():
    img = make_holographic_blob(W, H)
    img = add_grid(img)
    img = add_text(img)
    img.save(OUT, "PNG", optimize=True)
    print(f"Saved: {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
