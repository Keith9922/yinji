#!/usr/bin/env python3
"""
独立后端 API。

用于前后端分离部署，前端通过 HTTP 调用，不依赖 Gradio。
"""
import base64
import io
import os
from typing import Callable

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from stamp_generator import INK_COLORS, MOCK_GENERATION, get_generation_options, run_pipeline


def _parse_allowed_origins() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "*")
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins or ["*"]


def _encode_png_data_url(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def _color_to_hex(color_name: str, custom_color: str) -> str:
    if color_name == "自定义":
        if not custom_color:
            raise HTTPException(status_code=400, detail="自定义颜色不能为空。")
        return custom_color

    if color_name not in INK_COLORS:
        raise HTTPException(status_code=400, detail=f"不支持的颜色选项: {color_name}")
    return INK_COLORS[color_name]


def _collect_logs() -> tuple[list[str], Callable[[str], None]]:
    logs: list[str] = []

    def _log(message: str) -> None:
        logs.append(message)

    return logs, _log


app = FastAPI(
    title="印迹 API",
    version="0.1.0",
    description="为 Memoseal 前端提供印章生成接口。",
)

origins = _parse_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck() -> dict:
    return {
        "status": "ok",
        "service": "yingji-api",
        "allowedOrigins": origins,
        "mockGeneration": MOCK_GENERATION,
    }


@app.get("/api/options")
def options() -> dict:
    return get_generation_options()


@app.post("/api/stamps/generate")
async def generate_stamp(
    image: UploadFile = File(...),
    engine: str = Form("flash"),
    style: str = Form("复古橡皮章"),
    shape: str = Form("无边框"),
    color_name: str = Form("朱红"),
    custom_color: str = Form(""),
    text: str = Form(""),
    text_position: str = Form("底部横排"),
    texture: str = Form("无"),
    enable_gacha: bool = Form(True),
) -> dict:
    if not image.filename:
        raise HTTPException(status_code=400, detail="缺少上传文件名。")

    payload = await image.read()
    if not payload:
        raise HTTPException(status_code=400, detail="上传图片不能为空。")

    try:
        input_img = Image.open(io.BytesIO(payload))
        if input_img.mode not in ("RGB", "RGBA"):
            input_img = input_img.convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="上传文件不是有效图片。") from exc

    color_hex = _color_to_hex(color_name, custom_color)
    logs, log_fn = _collect_logs()

    try:
        result, rarity = run_pipeline(
            input_img,
            engine=engine,
            style=style,
            color_hex=color_hex,
            log=log_fn,
            shape=shape,
            text=text,
            text_position=text_position,
            texture=texture,
            enable_gacha=enable_gacha,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"生成失败: {exc}") from exc

    return {
        "imageDataUrl": _encode_png_data_url(result),
        "rarity": rarity,
        "logs": logs,
        "meta": {
            "filename": image.filename,
            "engine": engine,
            "style": style,
            "shape": shape,
            "colorName": color_name,
            "texture": texture,
            "textPosition": text_position,
            "enableGacha": enable_gacha,
        },
    }


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("API_HOST", "0.0.0.0")
    port = int(os.environ.get("API_PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=False)
