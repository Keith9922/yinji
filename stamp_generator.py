#!/usr/bin/env python3
"""
Core stamp generation logic using GMI Cloud APIs — Enhanced version.
Pipeline: photo → gacha roll → AI style → enhance → rembg → shape → text → color → texture → gacha fx
"""
import base64
import io
import math
import os
import random
import time
from typing import Any

import numpy as np
import requests
from dotenv import load_dotenv
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

# ── Configuration ─────────────────────────────────────────────────────────────

load_dotenv()

GMI_API_KEY = os.environ.get("GMI_API_KEY", "")
GMI_QUEUE_URL = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey"

GEMINI_MODEL = "gemini-3.1-flash-image-preview"
GEMINI_MODEL_PRO = "gemini-3-pro-image-preview"
REMBG_MODEL = os.environ.get("REMBG_MODEL", "u2netp")
REMBG_MAX_SIDE = max(256, int(os.environ.get("REMBG_MAX_SIDE", "768")))
MOCK_GENERATION = os.environ.get("MOCK_GENERATION", "").strip().lower() in {"1", "true", "yes", "on"}
_REMBG_SESSION: Any | None = None

# ── Stamp Styles (Prompts) ────────────────────────────────────────────────────

STAMP_PROMPTS = {
    "复古橡皮章": (
        "Transform this photo into a vintage rubber stamp design. "
        "Pure black ink on pure white background only. High contrast monochrome. "
        "Rough distressed ink texture, slightly uneven ink pressure on edges. "
        "Bold outlines, simplified details. The main subject must be clearly visible. "
        "Output must look like an actual rubber stamp imprint on paper."
    ),
    "现代极简": (
        "Convert this photo into a clean minimalist stamp design. "
        "Very clean crisp black lines on pure white background only. "
        "Simple silhouette contours, no shading or gradients whatsoever. "
        "Flat monochrome line art. Japanese eki stamp (駅スタンプ) aesthetic. "
        "Minimal details, bold shapes."
    ),
    "金石篆刻": (
        "Transform this image into a traditional East Asian seal engraving style. "
        "Strong bold carved lines on white background. Ancient hanko/chop seal art. "
        "Rough stone-carved texture. Monochrome black and white only. "
        "Bold composition, simplified and stylized like a Chinese seal impression."
    ),
    "涂鸦线描": (
        "Transform this image into a hand-drawn sketch stamp style. "
        "Rough sketchy black pen strokes on white background. "
        "Expressive line art, slight imperfections, hand-crafted feel. "
        "Like an artist's quick stamp impression. Monochrome only."
    ),
    "水墨山水": (
        "Transform this photo into a Chinese ink wash painting stamp. "
        "Pure black sumi ink brushstrokes on white background only. "
        "Soft diffused ink edges, varying stroke weights from thin to broad sweeps. "
        "Atmospheric misty aesthetic. Monochrome only. "
        "Output must look like a hand-painted ink stamp impression."
    ),
    "版画木刻": (
        "Transform this photo into a woodblock print stamp design. "
        "Bold carved black lines on pure white background. "
        "Deliberate knife-cut marks, parallel hatching for texture. "
        "Hard geometric edges, Japanese ukiyo-e woodblock aesthetic. "
        "Strong contrast, no gradients. Monochrome black and white only."
    ),
    "波普艺术": (
        "Convert this photo into a pop art stamp design. "
        "Bold black outlines, halftone dot pattern fills on white background only. "
        "Graphic and punchy like a Lichtenstein comic panel. "
        "Simplified shapes, high contrast. Monochrome black and white only."
    ),
    "像素复古": (
        "Transform this photo into a pixel art stamp design. "
        "8-bit retro video game style. Hard pixel edges, no anti-aliasing. "
        "Black pixels on pure white background only. "
        "Like a classic Game Boy sprite converted to stamp format. "
        "Chunky blocky shapes with deliberate pixelation."
    ),
    "水彩速写": (
        "Convert this photo into a quick watercolor sketch stamp design. "
        "Loose gestural black ink outline on white background only. "
        "Slightly trembling hand-drawn lines, spontaneous sketch quality. "
        "Minimal details, expressive contours. Like a travel sketchbook stamp. "
        "Monochrome black and white."
    ),
    "铜版雕刻": (
        "Transform this photo into a copperplate engraving stamp design. "
        "Ultra-fine parallel line hatching, cross-hatching for shadows. "
        "Precise mechanical-looking lines on pure white background only. "
        "Dense intricate line work like 19th century currency engravings. "
        "Monochrome black and white only. High detail."
    ),
}

# ── Ink Colors ────────────────────────────────────────────────────────────────

INK_COLORS = {
    "朱红": "#CC2200",
    "墨黑": "#1A1A1A",
    "藏青": "#003366",
    "深绿": "#1A5C3A",
    "古紫": "#5C1A5C",
    "橙金": "#CC6600",
}

# ── Stamp Shapes ──────────────────────────────────────────────────────────────

STAMP_SHAPES = {
    "无边框": None,
    "圆形": "circle",
    "方形圆角": "rounded_rect",
    "邮票齿边": "perforated",
    "菱形": "diamond",
    "六边形": "hexagon",
}

# ── Texture Options ───────────────────────────────────────────────────────────

STAMP_TEXTURES = {
    "无": None,
    "印泥晕染": "ink_bleed",
    "边缘磨损": "worn_edges",
    "做旧效果": "vintage",
}

ENGINE_OPTIONS = {
    "flash": "极速 (Flash ~25s)",
    "pro": "高质量 (Pro ~40s)",
}

# ── Gacha / Blind-box System ──────────────────────────────────────────────────

# (name, cumulative_prob, stars, badge_color)
GACHA_TABLE = [
    ("普通",     0.750, 1, "#888888"),
    ("精良",     0.130, 2, "#44AA44"),
    ("稀有",     0.070, 3, "#4488FF"),
    ("史诗",     0.035, 4, "#AA44FF"),
    ("金色传说", 0.015, 5, "#FFD700"),
]

GOLDEN_PROMPT_SUFFIX = (
    " ULTRA DETAILED: maximum intricacy, museum-quality engraving richness, "
    "microscopic fine detail lines, exceptional clarity and complexity."
)

RARE_GRADIENT_PAIRS = [
    ("#CC2200", "#003366"),
    ("#1A5C3A", "#5C1A5C"),
    ("#CC6600", "#003366"),
    ("#CC2200", "#1A5C3A"),
    ("#5C1A5C", "#CC6600"),
]


def roll_gacha() -> dict:
    """Roll a random rarity."""
    r = random.random()
    cumulative = 0.0
    for name, prob, stars, color in GACHA_TABLE:
        cumulative += prob
        if r < cumulative:
            return {"name": name, "stars": stars, "color": color, "roll": r}
    # fallback (rounding)
    return {"name": "金色传说", "stars": 5, "color": "#FFD700", "roll": r}


# ── GMI API Helpers ───────────────────────────────────────────────────────────

def _gmi_headers() -> dict:
    return {"Authorization": f"Bearer {GMI_API_KEY}", "Content-Type": "application/json"}


def _image_to_base64(img: Image.Image, max_size: int = 1024) -> str:
    """Resize and encode PIL image to raw base64 JPEG string."""
    img = img.copy()
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    if img.mode in ("RGBA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


def _submit_and_poll(model: str, payload: dict, timeout: int = 180) -> dict:
    """Submit a job and poll until complete."""
    resp = requests.post(
        f"{GMI_QUEUE_URL}/requests",
        headers=_gmi_headers(),
        json={"model": model, "payload": payload},
        timeout=120,
    )
    if not resp.ok:
        raise RuntimeError(f"GMI submit failed [{resp.status_code}]: {resp.text[:300]}")
    data = resp.json()

    if data.get("status") == "success" and data.get("outcome"):
        return data["outcome"]

    request_id = data["request_id"]
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(2)
        resp2 = requests.get(
            f"{GMI_QUEUE_URL}/requests/{request_id}",
            headers=_gmi_headers(),
            timeout=15,
        )
        if not resp2.ok:
            raise RuntimeError(f"GMI poll failed [{resp2.status_code}]: {resp2.text[:200]}")
        d = resp2.json()
        status = d.get("status", "")
        if status == "success":
            return d.get("outcome") or {}
        if status in ("failed", "error", "cancelled"):
            raise RuntimeError(f"GMI job failed: {d.get('outcome', d)}")
    raise TimeoutError(f"GMI job timed out after {timeout}s")


def _extract_image_url(outcome: dict) -> str:
    """Find the result image URL from an outcome dict."""
    if "media_urls" in outcome:
        media = outcome["media_urls"]
        if isinstance(media, list) and media:
            item = media[0]
            if isinstance(item, dict) and "url" in item:
                return item["url"]

    if "thumbnail_image_url" in outcome:
        url = outcome["thumbnail_image_url"]
        if isinstance(url, str) and url.startswith("http"):
            return url

    for key in ("image_url", "output_url", "url", "result_url", "image", "output"):
        val = outcome.get(key)
        if isinstance(val, str) and val.startswith("http"):
            return val

    for key in ("images", "outputs", "results"):
        val = outcome.get(key)
        if isinstance(val, list) and val:
            item = val[0]
            if isinstance(item, str) and item.startswith("http"):
                return item
            if isinstance(item, dict):
                for sub in ("url", "image_url", "output_url"):
                    if isinstance(item.get(sub), str):
                        return item[sub]

    raise ValueError(f"Cannot find image URL in GMI outcome. Keys: {list(outcome.keys())}")


def _download_image(url: str) -> Image.Image:
    resp = requests.get(url, timeout=60)
    if not resp.ok:
        raise RuntimeError(f"Failed to download result image [{resp.status_code}]")
    return Image.open(io.BytesIO(resp.content)).convert("RGB")


def _mock_generate_stamp(img: Image.Image, style: str) -> Image.Image:
    """Local fallback used for integration testing when GMI is unavailable."""
    working = img.copy()
    working.thumbnail((1024, 1024), Image.LANCZOS)
    gray = ImageOps.grayscale(working)
    softened = gray.filter(ImageFilter.GaussianBlur(radius=1.2))
    edges = softened.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.invert(edges)
    poster = ImageOps.posterize(softened.convert("RGB"), 2).convert("L")
    combined = ImageChops.darker(poster, edges)

    if style in {"版画木刻", "铜版雕刻", "金石篆刻"}:
        combined = combined.filter(ImageFilter.EDGE_ENHANCE_MORE)
    elif style in {"水墨山水", "水彩速写"}:
        combined = combined.filter(ImageFilter.GaussianBlur(radius=0.8))
    elif style == "像素复古":
        reduced = combined.resize((160, 160), Image.Resampling.NEAREST)
        combined = reduced.resize(working.size, Image.Resampling.NEAREST)

    threshold = 170 if style in {"现代极简", "像素复古"} else 185
    stamped = combined.point(lambda value: 255 if value > threshold else 0, mode="1")
    return stamped.convert("RGB")


def _normalize_engine(engine: str) -> str:
    value = (engine or "").strip().lower()
    if value in {"pro", "high", "高质量"}:
        return "pro"
    if "pro" in value or "高质量" in engine:
        return "pro"
    return "flash"


def get_generation_options() -> dict:
    return {
        "engines": [
            {"value": key, "label": label}
            for key, label in ENGINE_OPTIONS.items()
        ],
        "styles": list(STAMP_PROMPTS.keys()),
        "colors": INK_COLORS,
        "shapes": list(STAMP_SHAPES.keys()),
        "textures": list(STAMP_TEXTURES.keys()),
        "textPositions": ["上方弧形", "下方弧形", "底部横排"],
        "defaults": {
            "engine": "flash",
            "style": list(STAMP_PROMPTS.keys())[0],
            "shape": "无边框",
            "colorName": "朱红",
            "texture": "无",
            "textPosition": "底部横排",
            "enableGacha": True,
        },
    }


# ── Font Helper ───────────────────────────────────────────────────────────────

_FONT_CACHE: dict[tuple[int, str], ImageFont.FreeTypeFont] = {}

_FONT_PATHS_SERIF = [
    ("/System/Library/Fonts/Supplemental/Songti.ttc", 0),
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
]
_FONT_PATHS_SANS = [
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
    ("/System/Library/Fonts/Supplemental/Songti.ttc", 0),
]


def _get_cjk_font(size: int = 28, style: str = "serif") -> ImageFont.FreeTypeFont:
    key = (size, style)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    candidates = _FONT_PATHS_SERIF if style == "serif" else _FONT_PATHS_SANS
    for path, index in candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, size, index=index)
                _FONT_CACHE[key] = font
                return font
            except Exception:
                continue
    font = ImageFont.load_default()
    _FONT_CACHE[key] = font
    return font


# ── AI Stamp Generation ──────────────────────────────────────────────────────

def generate_with_gemini(
    img: Image.Image,
    style: str,
    quality: str = "standard",
    extra_prompt_suffix: str = "",
) -> Image.Image:
    """Use Gemini to convert photo to stamp style via GMI Cloud."""
    if MOCK_GENERATION:
        return _mock_generate_stamp(img, style)

    prompt = STAMP_PROMPTS.get(style, STAMP_PROMPTS["复古橡皮章"]) + extra_prompt_suffix
    model = GEMINI_MODEL_PRO if quality == "high" else GEMINI_MODEL
    img_b64 = _image_to_base64(img)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": "image/jpeg", "data": img_b64}},
                ],
            }
        ],
        "aspect_ratio": "1:1",
        "image_size": "1K",
    }

    outcome = _submit_and_poll(model, payload)
    url = _extract_image_url(outcome)
    return _download_image(url)


# ── Post-Processing: Contrast ─────────────────────────────────────────────────

def enhance_stamp_contrast(img: Image.Image) -> Image.Image:
    """Boost contrast to sharpen stamp lines."""
    gray = img.convert("L")
    arr = np.array(gray, dtype=float)
    p2, p98 = np.percentile(arr, 2), np.percentile(arr, 98)
    if p98 > p2:
        arr = np.clip((arr - p2) / (p98 - p2) * 255, 0, 255).astype(np.uint8)
        gray = Image.fromarray(arr)
    rgb = gray.convert("RGB")
    return ImageEnhance.Contrast(rgb).enhance(2.0)


# ── Post-Processing: Background Removal ───────────────────────────────────────

def _get_rembg_session():
    global _REMBG_SESSION
    if _REMBG_SESSION is None:
        from rembg import new_session
        _REMBG_SESSION = new_session(REMBG_MODEL)
    return _REMBG_SESSION


def _resize_for_rembg(img: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    original_size = img.size
    if max(original_size) <= REMBG_MAX_SIDE:
        return img.copy(), original_size

    resized = img.copy()
    resized.thumbnail((REMBG_MAX_SIDE, REMBG_MAX_SIDE), Image.LANCZOS)
    return resized, original_size


def remove_background(img: Image.Image) -> Image.Image:
    """Remove background using rembg, return RGBA transparent image."""
    from rembg import remove as rembg_remove

    session = _get_rembg_session()
    working_img, original_size = _resize_for_rembg(img)
    buf = io.BytesIO()
    working_img.save(buf, format="PNG")
    result_bytes = rembg_remove(buf.getvalue(), session=session)
    result = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    if result.size != original_size:
        result = result.resize(original_size, Image.LANCZOS)
    return result


# ── Post-Processing: Shape Masks ──────────────────────────────────────────────

def _create_shape_mask(w: int, h: int, shape: str) -> Image.Image:
    """Create an L-mode mask (255=keep, 0=cut)."""
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    s = min(w, h)

    if shape == "circle":
        cx, cy = w // 2, h // 2
        r = s // 2 - s // 30
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)

    elif shape == "rounded_rect":
        margin = s // 20
        radius = s // 8
        draw.rounded_rectangle(
            [margin, margin, w - 1 - margin, h - 1 - margin],
            radius=radius, fill=255,
        )

    elif shape == "perforated":
        # Postage stamp look: rectangle with scalloped edges
        margin = s // 12
        draw.rectangle([margin, margin, w - 1 - margin, h - 1 - margin], fill=255)
        hole_r = max(5, s // 50)
        spacing = hole_r * 3
        # Top and bottom edges
        x = margin + spacing // 2
        while x < w - margin:
            draw.ellipse([x - hole_r, margin - hole_r, x + hole_r, margin + hole_r], fill=0)
            draw.ellipse([x - hole_r, h - 1 - margin - hole_r, x + hole_r, h - 1 - margin + hole_r], fill=0)
            x += spacing
        # Left and right edges
        y = margin + spacing // 2
        while y < h - margin:
            draw.ellipse([margin - hole_r, y - hole_r, margin + hole_r, y + hole_r], fill=0)
            draw.ellipse([w - 1 - margin - hole_r, y - hole_r, w - 1 - margin + hole_r, y + hole_r], fill=0)
            y += spacing

    elif shape == "diamond":
        cx, cy = w // 2, h // 2
        pad = s // 12
        draw.polygon([(cx, pad), (w - pad, cy), (cx, h - pad), (pad, cy)], fill=255)

    elif shape == "hexagon":
        cx, cy = w // 2, h // 2
        r = s // 2 - s // 15
        pts = []
        for i in range(6):
            angle = math.radians(60 * i - 30)
            pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        draw.polygon(pts, fill=255)

    return mask


def apply_shape_mask(img_rgba: Image.Image, shape_key: str) -> Image.Image:
    """Apply a shape mask to an RGBA image."""
    shape = STAMP_SHAPES.get(shape_key)
    if shape is None:
        return img_rgba
    w, h = img_rgba.size
    mask = _create_shape_mask(w, h, shape)
    arr = np.array(img_rgba)
    mask_arr = np.array(mask)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.uint16) * mask_arr // 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


# ── Post-Processing: Text Overlay ─────────────────────────────────────────────

def _draw_arc_text(
    base: Image.Image, text: str, font: ImageFont.FreeTypeFont,
    cx: float, cy: float, radius: float, start_deg: float, direction: int,
) -> Image.Image:
    """
    Render text along an arc onto base (RGBA).
    start_deg: starting angle in degrees (0=top, clockwise)
    direction: 1=clockwise, -1=counterclockwise
    """
    result = base.copy()

    # Calculate per-char angular width
    char_widths = []
    for ch in text:
        bbox = font.getbbox(ch)
        char_widths.append(bbox[2] - bbox[0])

    avg_w = sum(char_widths) / len(char_widths) if char_widths else 20
    # Angular spacing per character (radians)
    char_angle = avg_w / radius
    gap_angle = char_angle * 0.25  # 25% gap between chars
    total_angle = len(text) * char_angle + (len(text) - 1) * gap_angle

    # Starting angle offset so text is centered
    angle = start_deg - direction * total_angle / 2 * (180 / math.pi)
    step_deg = direction * (char_angle + gap_angle) * (180 / math.pi)

    tile_size = int(font.size * 3)

    for ch in text:
        # Position on circle (0°=top, clockwise)
        angle_rad = math.radians(angle)
        x = cx + radius * math.sin(angle_rad)
        y = cy - radius * math.cos(angle_rad)

        # Render char on a tile
        tile = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))
        d = ImageDraw.Draw(tile)
        d.text((tile_size // 2, tile_size // 2), ch, font=font, fill=(0, 0, 0, 255), anchor="mm")

        # Rotation: character bottom points to circle center
        # For top arc (direction=1): rotate by -angle degrees
        # For bottom arc (direction=1, start_deg=180): same formula works
        rot = -angle
        if start_deg > 90:
            rot = 180 - angle
        rotated = tile.rotate(rot, expand=True, resample=Image.BICUBIC)

        # Paste centered at (x, y)
        px = int(x - rotated.width / 2)
        py = int(y - rotated.height / 2)
        result.paste(rotated, (px, py), rotated)

        angle += step_deg

    return result


def apply_text_overlay(
    img_rgba: Image.Image, text: str, position: str,
) -> Image.Image:
    """Add text to stamp as dark pixels (before ink coloring)."""
    if not text.strip():
        return img_rgba

    w, h = img_rgba.size
    s = min(w, h)
    font_size = max(16, s // 18)
    font = _get_cjk_font(font_size, "serif")
    cx, cy = w / 2, h / 2

    if position == "上方弧形":
        radius = s * 0.38
        return _draw_arc_text(img_rgba, text, font, cx, cy, radius, start_deg=0, direction=1)

    elif position == "下方弧形":
        radius = s * 0.38
        return _draw_arc_text(img_rgba, text, font, cx, cy, radius, start_deg=180, direction=-1)

    else:  # 底部横排
        result = img_rgba.copy()
        d = ImageDraw.Draw(result)
        text_w = d.textlength(text, font=font)
        x = (w - text_w) / 2
        y = h * 0.85 - font_size / 2
        d.text((x, y), text, font=font, fill=(0, 0, 0, 255))
        return result


# ── Post-Processing: Ink Coloring ─────────────────────────────────────────────

def _parse_hex(color_hex: str) -> tuple[int, int, int]:
    c = color_hex.lstrip("#")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def apply_ink_color(img_rgba: Image.Image, color_hex: str) -> Image.Image:
    """Replace dark non-transparent pixels with the selected ink color."""
    r, g, b = _parse_hex(color_hex)

    arr = np.array(img_rgba.convert("RGBA"), dtype=np.float32)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    alpha = arr[:, :, 3]

    ink_mask = (lum < 150) & (alpha > 30)

    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    if np.any(ink_mask):
        darkness = np.clip((150 - lum[ink_mask]) / 150, 0, 1)
        out[ink_mask, 0] = r
        out[ink_mask, 1] = g
        out[ink_mask, 2] = b
        out[ink_mask, 3] = np.clip(darkness * 220 + 35, 35, 255).astype(np.uint8)

    return Image.fromarray(out, "RGBA")


def _apply_ink_color_gradient(img_rgba: Image.Image, hex1: str, hex2: str) -> Image.Image:
    """Dual-color horizontal gradient coloring (for 稀有 gacha)."""
    r1, g1, b1 = _parse_hex(hex1)
    r2, g2, b2 = _parse_hex(hex2)

    arr = np.array(img_rgba.convert("RGBA"), dtype=np.float32)
    h, w = arr.shape[:2]
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    alpha = arr[:, :, 3]
    ink_mask = (lum < 150) & (alpha > 30)

    # Horizontal gradient interpolation factor
    t = np.linspace(0, 1, w).reshape(1, w)
    t = np.broadcast_to(t, (h, w))

    out = np.zeros((h, w, 4), dtype=np.uint8)
    if np.any(ink_mask):
        darkness = np.clip((150 - lum[ink_mask]) / 150, 0, 1)
        t_ink = t[ink_mask]
        out[ink_mask, 0] = np.clip(r1 * (1 - t_ink) + r2 * t_ink, 0, 255).astype(np.uint8)
        out[ink_mask, 1] = np.clip(g1 * (1 - t_ink) + g2 * t_ink, 0, 255).astype(np.uint8)
        out[ink_mask, 2] = np.clip(b1 * (1 - t_ink) + b2 * t_ink, 0, 255).astype(np.uint8)
        out[ink_mask, 3] = np.clip(darkness * 220 + 35, 35, 255).astype(np.uint8)

    return Image.fromarray(out, "RGBA")


# ── Post-Processing: Textures ─────────────────────────────────────────────────

def apply_texture(img_rgba: Image.Image, texture_key: str) -> Image.Image:
    """Apply a texture effect to the stamp."""
    tex = STAMP_TEXTURES.get(texture_key)
    if tex is None:
        return img_rgba
    if tex == "ink_bleed":
        return _tex_ink_bleed(img_rgba)
    elif tex == "worn_edges":
        return _tex_worn_edges(img_rgba)
    elif tex == "vintage":
        return _tex_vintage(img_rgba)
    return img_rgba


def _tex_ink_bleed(img_rgba: Image.Image) -> Image.Image:
    """Ink bleed: blur edges + noise for ink spreading effect."""
    blurred = img_rgba.filter(ImageFilter.GaussianBlur(radius=1.2))
    arr = np.array(img_rgba, dtype=np.float32)
    b_arr = np.array(blurred, dtype=np.float32)
    # Mix original 70% with blurred 30%
    arr = arr * 0.7 + b_arr * 0.3
    # Add noise to alpha on ink pixels
    ink_mask = arr[:, :, 3] > 30
    noise = np.random.normal(0, 12, arr.shape[:2])
    arr[:, :, 3] = np.where(ink_mask, np.clip(arr[:, :, 3] + noise, 0, 255), arr[:, :, 3])
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def _tex_worn_edges(img_rgba: Image.Image) -> Image.Image:
    """Worn edges: erode alpha channel to simulate physical wear."""
    arr = np.array(img_rgba)
    alpha_img = Image.fromarray(arr[:, :, 3])
    # Two passes of minimum filter = morphological erosion
    eroded = alpha_img.filter(ImageFilter.MinFilter(3))
    eroded = eroded.filter(ImageFilter.MinFilter(3))
    eroded_arr = np.array(eroded)
    # Random dropout of ~8% ink pixels
    ink_mask = eroded_arr > 30
    dropout = np.random.random(eroded_arr.shape) < 0.08
    eroded_arr[ink_mask & dropout] = 0
    arr[:, :, 3] = eroded_arr
    return Image.fromarray(arr, "RGBA")


def _tex_vintage(img_rgba: Image.Image) -> Image.Image:
    """Vintage aging: reduce opacity + scratch lines + grain."""
    arr = np.array(img_rgba, dtype=np.float32)
    h, w = arr.shape[:2]
    # Reduce alpha by ~15%
    arr[:, :, 3] *= 0.85
    # Random scratch lines
    n_scratches = random.randint(3, 8)
    for _ in range(n_scratches):
        y = random.randint(0, h - 1)
        x_start = random.randint(0, w // 3)
        x_end = random.randint(w // 2, w - 1)
        length = x_end - x_start
        if length > 0:
            arr[y, x_start:x_end, 3] *= np.random.uniform(0.1, 0.5, length)
            if y + 1 < h:
                arr[y + 1, x_start:x_end, 3] *= np.random.uniform(0.4, 0.8, length)
    # Grain noise
    grain = np.random.normal(0, 8, (h, w))
    arr[:, :, 3] = np.clip(arr[:, :, 3] + grain, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


# ── Gacha Visual Effects ──────────────────────────────────────────────────────

def apply_gacha_effect(img_rgba: Image.Image, rarity: dict, color_hex: str) -> Image.Image:
    """Apply rarity-specific visual effects."""
    name = rarity["name"]
    if name == "普通":
        return img_rgba
    elif name == "精良":
        return _gacha_fine(img_rgba)
    elif name == "稀有":
        # Gradient was already applied during coloring, just add a subtle border
        return _gacha_rare_border(img_rgba)
    elif name == "史诗":
        return _gacha_epic_sparkles(img_rgba)
    elif name == "金色传说":
        return _gacha_golden_legendary(img_rgba)
    return img_rgba


def _gacha_fine(img_rgba: Image.Image) -> Image.Image:
    """精良: gentle ink bleed for a slightly richer look."""
    blurred = img_rgba.filter(ImageFilter.GaussianBlur(radius=0.8))
    arr = np.array(img_rgba, dtype=np.float32)
    b_arr = np.array(blurred, dtype=np.float32)
    result = arr * 0.85 + b_arr * 0.15
    return Image.fromarray(result.astype(np.uint8), "RGBA")


def _gacha_rare_border(img_rgba: Image.Image) -> Image.Image:
    """稀有: add a thin inner glow/border to the ink."""
    # Dilate alpha slightly to create a glow halo
    arr = np.array(img_rgba)
    alpha_img = Image.fromarray(arr[:, :, 3])
    dilated = alpha_img.filter(ImageFilter.MaxFilter(5))
    dilated_arr = np.array(dilated, dtype=np.float32)
    orig_arr = arr[:, :, 3].astype(np.float32)
    # The halo = dilated minus original, at low opacity
    halo = np.clip(dilated_arr - orig_arr, 0, 255) * 0.3
    arr[:, :, 3] = np.clip(orig_arr + halo, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def _gacha_epic_sparkles(img_rgba: Image.Image, n_sparkles: int = 180) -> Image.Image:
    """史诗: scatter rainbow sparkle dots across the stamp."""
    bright_colors = [
        (255, 80, 80, 255), (255, 165, 0, 255), (255, 240, 0, 255),
        (80, 255, 80, 255), (0, 191, 255, 255), (180, 80, 255, 255),
        (255, 255, 255, 240),
    ]
    arr = np.array(img_rgba).copy()
    ink_ys, ink_xs = np.where(arr[:, :, 3] > 50)
    if len(ink_ys) == 0:
        return img_rgba
    n = min(n_sparkles, len(ink_ys))
    idx = np.random.choice(len(ink_ys), n, replace=False)
    for i, j in enumerate(idx):
        y, x = ink_ys[j], ink_xs[j]
        c = bright_colors[i % len(bright_colors)]
        arr[y, x] = c
        # Small cross sparkle for ~20% of dots
        if i < n // 5:
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < arr.shape[0] and 0 <= nx < arr.shape[1]:
                    arr[ny, nx] = (255, 255, 255, 200)
    return Image.fromarray(arr, "RGBA")


def _gacha_golden_legendary(img_rgba: Image.Image) -> Image.Image:
    """金色传说: full gold treatment with metallic sheen and sparkles."""
    # Step 1: Recolor everything to gold
    gold_img = apply_ink_color(img_rgba, "#FFD700")

    # Step 2: Metallic sheen — sine wave brightness across horizontal axis
    arr = np.array(gold_img, dtype=np.float32)
    h, w = arr.shape[:2]
    sheen = np.sin(np.linspace(0, math.pi, w)) * 50
    sheen_2d = np.broadcast_to(sheen.reshape(1, w), (h, w))
    ink_mask = arr[:, :, 3] > 30
    # Boost red channel for warm highlight
    arr[:, :, 0] = np.where(ink_mask, np.clip(arr[:, :, 0] + sheen_2d * 0.4, 0, 255), arr[:, :, 0])
    # Boost alpha for brighter center
    arr[:, :, 3] = np.where(ink_mask, np.clip(arr[:, :, 3] + sheen_2d * 0.5, 0, 255), arr[:, :, 3])

    result = Image.fromarray(arr.astype(np.uint8), "RGBA")

    # Step 3: Gold sparkles
    sparkle_colors = [
        (255, 215, 0, 255), (255, 235, 100, 255), (255, 255, 200, 255),
        (255, 200, 50, 255), (255, 255, 255, 255),
    ]
    arr2 = np.array(result).copy()
    ink_ys, ink_xs = np.where(arr2[:, :, 3] > 50)
    if len(ink_ys) > 0:
        n = min(250, len(ink_ys))
        idx = np.random.choice(len(ink_ys), n, replace=False)
        for i, j in enumerate(idx):
            y, x = ink_ys[j], ink_xs[j]
            c = sparkle_colors[i % len(sparkle_colors)]
            arr2[y, x] = c
            if i < n // 4:
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < arr2.shape[0] and 0 <= nx < arr2.shape[1]:
                        arr2[ny, nx] = (255, 255, 220, 220)
    return Image.fromarray(arr2, "RGBA")


# ── Main Pipeline ─────────────────────────────────────────────────────────────

def run_pipeline(
    original_img: Image.Image,
    engine: str,
    style: str,
    color_hex: str,
    log=None,
    shape: str = "无边框",
    text: str = "",
    text_position: str = "底部横排",
    texture: str = "无",
    enable_gacha: bool = True,
) -> tuple[Image.Image, dict]:
    """
    Full stamp generation pipeline.

    Returns:
        (RGBA PIL image, rarity dict)
    """
    def _log(msg: str):
        print(msg)
        if log:
            log(msg)

    if not GMI_API_KEY and not MOCK_GENERATION:
        raise RuntimeError("GMI_API_KEY is not set.")

    quality = "high" if _normalize_engine(engine) == "pro" else "standard"

    # ── Step 0: Gacha Roll ──
    if enable_gacha:
        rarity = roll_gacha()
        name = rarity["name"]
        stars_str = "★" * rarity["stars"] + "☆" * (5 - rarity["stars"])
        if name == "金色传说":
            _log("🎲 盲盒鉴定中...")
            _log("╔═══════════════════════════╗")
            _log("║  ✦ 金 色 传 说 ！✦  ║")
            _log(f"║     {stars_str}      ║")
            _log("╚═══════════════════════════╝")
            _log("金光耀世！传说级印章正在诞生...")
        elif name != "普通":
            _log(f"🎲 盲盒鉴定: {name} {stars_str}")
        else:
            _log(f"🎲 {stars_str}")
    else:
        rarity = {"name": "普通", "stars": 1, "color": "#888888", "roll": 0.0}

    prompt_suffix = GOLDEN_PROMPT_SUFFIX if rarity["name"] == "金色传说" else ""

    # ── Step 1: AI Generation ──
    _log(f"[1/4] 生成印章风格图像 (风格: {style})...")
    try:
        styled = generate_with_gemini(original_img, style, quality=quality,
                                       extra_prompt_suffix=prompt_suffix)
    except Exception as e:
        raise RuntimeError(f"印章生成失败: {e}") from e

    # ── Step 2: Enhance + Remove BG ──
    _log("[2/4] 增强对比度并去除背景...")
    try:
        enhanced = enhance_stamp_contrast(styled)
        transparent = remove_background(enhanced)
    except Exception as e:
        raise RuntimeError(f"背景去除失败: {e}") from e

    # ── Step 3: Shape + Text ──
    if shape != "无边框":
        _log(f"[3/4] 形状裁切: {shape} + 文字...")
        transparent = apply_shape_mask(transparent, shape)
    else:
        _log("[3/4] 处理文字...")

    if text.strip():
        transparent = apply_text_overlay(transparent, text.strip(), text_position)

    # ── Step 4: Color + Texture + Gacha FX ──
    rarity_name = rarity["name"]
    if rarity_name == "金色传说":
        _log("[4/4] 施加金色传说特效...")
        result = apply_ink_color(transparent, "#FFD700")
    elif rarity_name == "稀有":
        pair = RARE_GRADIENT_PAIRS[int(rarity["roll"] * 1000) % len(RARE_GRADIENT_PAIRS)]
        _log(f"[4/4] 应用稀有双色渐变 {pair[0]} → {pair[1]}...")
        result = _apply_ink_color_gradient(transparent, pair[0], pair[1])
    else:
        _log(f"[4/4] 应用印泥颜色 {color_hex}...")
        result = apply_ink_color(transparent, color_hex)

    # Texture
    if texture != "无":
        _log(f"  [+] 纹理: {texture}")
        result = apply_texture(result, texture)

    # Gacha visual effects
    if rarity_name != "普通":
        _log(f"  [+] 稀有特效: {rarity_name}")
        result = apply_gacha_effect(result, rarity, color_hex)

    _log(f"✓ 印章生成完成！{'★' * rarity['stars']}")
    return result, rarity
