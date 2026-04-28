"""prompt-snap cover — brutalist B&W."""
from PIL import Image, ImageDraw, ImageFont

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


def main():
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)

    # top
    d.text((60, 50), "VISION → HTML", font=load_font(22, True),
           fill=(255, 255, 255))
    idx_font = load_font(22, True)
    idx = "POWERED BY CLAUDE"
    iw = d.textbbox((0, 0), idx, font=idx_font)[2]
    d.text((W - iw - 60, 50), idx, font=idx_font, fill=(255, 255, 255))
    d.line([(60, 92), (W - 60, 92)], fill=(255, 255, 255), width=1)

    # title
    t_font = load_font(200, True)
    l1, l2 = "PROMPT", "SNAP."
    b1 = d.textbbox((0, 0), l1, font=t_font)
    b2 = d.textbbox((0, 0), l2, font=t_font)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    y1 = 160
    d.text(((W - w1) // 2, y1), l1, font=t_font, fill=(255, 255, 255))
    d.text(((W - w2) // 2, y1 + h1 + 10), l2, font=t_font,
           fill=(255, 255, 255))

    # tagline
    tag_font = load_font(34, False)
    tag = "drop a screenshot. get a working HTML clone."
    tw = d.textbbox((0, 0), tag, font=tag_font)[2]
    d.text(((W - tw) // 2, y1 + h1 + h2 + 50), tag, font=tag_font,
           fill=(200, 200, 200))

    # bottom
    d.line([(60, H - 92), (W - 60, H - 92)], fill=(255, 255, 255), width=1)
    bot_font = load_font(20, True)
    d.text((60, H - 65),
           "DROP · PASTE · CLICK · COPY · SHIP",
           font=bot_font, fill=(255, 255, 255))
    attr = "BUILT IN A DAY"
    aw = d.textbbox((0, 0), attr, font=bot_font)[2]
    d.text((W - aw - 60, H - 65), attr, font=bot_font, fill=(255, 255, 255))

    img.save(OUT, "PNG", optimize=True)
    print(f"Saved: {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
