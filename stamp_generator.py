#!/usr/bin/env python3
"""
Core stamp generation logic using GMI Cloud APIs.
Pipeline: original image → stamp-style (Gemini) → remove background → color tinting
Image is passed inline as base64 via the 'contents' parameter to avoid external hosting.
"""
import base64
import io
import os
import time
import requests
from PIL import Image, ImageOps, ImageEnhance
import numpy as np

# ── Configuration ─────────────────────────────────────────────────────────────

GMI_API_KEY = os.environ.get("GMI_API_KEY", "")
GMI_QUEUE_URL = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey"

# Primary model: gemini-3.1-flash-image-preview (~23s, works with inline base64)
# Secondary model: gemini-3-pro-image-preview (~38s, higher quality)
GEMINI_MODEL = "gemini-3.1-flash-image-preview"
GEMINI_MODEL_PRO = "gemini-3-pro-image-preview"

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
}

INK_COLORS = {
    "朱红": "#CC2200",
    "墨黑": "#1A1A1A",
    "藏青": "#003366",
    "深绿": "#1A5C3A",
    "古紫": "#5C1A5C",
    "橙金": "#CC6600",
}


# ── GMI API Helpers ────────────────────────────────────────────────────────────

def _gmi_headers() -> dict:
    return {"Authorization": f"Bearer {GMI_API_KEY}", "Content-Type": "application/json"}


def _image_to_base64(img: Image.Image, max_size: int = 1024) -> str:
    """Resize and encode PIL image to raw base64 JPEG string (no data URI prefix)."""
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
    """Submit a job and poll until complete. Returns outcome dict."""
    resp = requests.post(
        f"{GMI_QUEUE_URL}/requests",
        headers=_gmi_headers(),
        json={"model": model, "payload": payload},
        timeout=120,  # Gemini may process synchronously (up to ~40s)
    )
    if not resp.ok:
        raise RuntimeError(f"GMI submit failed [{resp.status_code}]: {resp.text[:300]}")
    data = resp.json()

    # Gemini often returns status=success immediately in the submit response
    if data.get("status") == "success" and data.get("outcome"):
        return data["outcome"]

    # Otherwise poll
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
    # Gemini format: {"media_urls": [{"id": "0", "url": "https://..."}]}
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


# ── Stamp Generation ───────────────────────────────────────────────────────────

def generate_with_gemini(img: Image.Image, style: str, quality: str = "standard") -> Image.Image:
    """
    Use Gemini to convert photo to stamp style.
    Uses 'contents' with inline base64 to avoid external image hosting.
    quality: "standard" (gemini-3.1-flash) or "high" (gemini-3-pro)
    """
    prompt = STAMP_PROMPTS.get(style, STAMP_PROMPTS["复古橡皮章"])
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


# ── Post-Processing ────────────────────────────────────────────────────────────

def enhance_stamp_contrast(img: Image.Image) -> Image.Image:
    """Boost contrast to sharpen stamp lines before background removal."""
    gray = img.convert("L")
    arr = np.array(gray, dtype=float)
    p2, p98 = np.percentile(arr, 2), np.percentile(arr, 98)
    if p98 > p2:
        arr = np.clip((arr - p2) / (p98 - p2) * 255, 0, 255).astype(np.uint8)
        gray = Image.fromarray(arr)
    rgb = gray.convert("RGB")
    return ImageEnhance.Contrast(rgb).enhance(2.0)


def remove_background(img: Image.Image) -> Image.Image:
    """Remove background using rembg, return RGBA transparent image."""
    from rembg import remove as rembg_remove
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    result_bytes = rembg_remove(buf.getvalue())
    return Image.open(io.BytesIO(result_bytes)).convert("RGBA")


def apply_ink_color(img_rgba: Image.Image, color_hex: str) -> Image.Image:
    """
    Replace all non-transparent pixels with the selected ink color.
    Dark pixels → ink, light pixels → transparent.
    """
    color_hex = color_hex.lstrip("#")
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)

    arr = np.array(img_rgba.convert("RGBA"), dtype=np.float32)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    alpha = arr[:, :, 3]

    # Dark non-transparent pixels = ink
    ink_mask = (lum < 150) & (alpha > 30)

    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    if np.any(ink_mask):
        darkness = np.clip((150 - lum[ink_mask]) / 150, 0, 1)
        out[ink_mask, 0] = r
        out[ink_mask, 1] = g
        out[ink_mask, 2] = b
        out[ink_mask, 3] = np.clip(darkness * 220 + 35, 35, 255).astype(np.uint8)

    return Image.fromarray(out, "RGBA")


# ── Main Pipeline ──────────────────────────────────────────────────────────────

def run_pipeline(
    original_img: Image.Image,
    engine: str,
    style: str,
    color_hex: str,
    log=None,
) -> Image.Image:
    """
    Full stamp generation pipeline.

    Args:
        original_img: Input PIL image
        engine: "极速 (Flash)" or "高质量 (Pro)"
        style: Style name matching STAMP_PROMPTS keys
        color_hex: Ink color hex string, e.g. "#CC2200"
        log: Optional callable(str) for progress messages

    Returns:
        RGBA PIL image (transparent background, colored ink)
    """
    def _log(msg: str):
        print(msg)
        if log:
            log(msg)

    if not GMI_API_KEY:
        raise RuntimeError("GMI_API_KEY is not set.")

    quality = "high" if "Pro" in engine or "高质量" in engine else "standard"

    _log(f"[1/3] 生成印章风格图像 (风格: {style}, 引擎: {engine})...")
    try:
        styled = generate_with_gemini(original_img, style, quality=quality)
    except Exception as e:
        raise RuntimeError(f"印章生成失败: {e}") from e

    _log("[2/3] 增强对比度并去除背景...")
    try:
        enhanced = enhance_stamp_contrast(styled)
        transparent = remove_background(enhanced)
    except Exception as e:
        raise RuntimeError(f"背景去除失败: {e}") from e

    _log(f"[3/3] 应用印泥颜色 {color_hex}...")
    result = apply_ink_color(transparent, color_hex)
    _log("✓ 印章生成完成！")
    return result
