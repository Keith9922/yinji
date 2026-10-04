#!/usr/bin/env python3
"""
印迹 - AI 印章生成器 Demo (Enhanced)
Upload a photo and transform it into a stamp-sticker with transparent background.
Now with: 10 styles, shapes, text overlay, textures, and gacha/blind-box surprises!
"""
import os
import sys
from pathlib import Path

import gradio as gr
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from stamp_generator import (
    run_pipeline, INK_COLORS, STAMP_PROMPTS,
    STAMP_SHAPES, STAMP_TEXTURES, ENGINE_OPTIONS,
)

# ── Constants ──────────────────────────────────────────────────────────────────
STYLES = list(STAMP_PROMPTS.keys())
COLOR_NAMES = list(INK_COLORS.keys())
SHAPES = list(STAMP_SHAPES.keys())
TEXTURES = list(STAMP_TEXTURES.keys())

TEXT_POSITIONS = ["上方弧形", "下方弧形", "底部横排"]

ENGINES = list(ENGINE_OPTIONS.values())

RARITY_PLACEHOLDER = '<div style="text-align:center;color:#bbb;padding:8px;font-size:.9em;">🎲 生成后揭晓稀有度</div>'


# ── Rarity HTML Renderer ──────────────────────────────────────────────────────

def _render_rarity_html(rarity: dict) -> str:
    name = rarity["name"]
    stars = "★" * rarity["stars"] + "☆" * (5 - rarity["stars"])
    color = rarity["color"]

    if name == "金色传说":
        return f"""
        <div class="gacha-legendary" style="text-align:center;padding:14px;
                    background:linear-gradient(135deg,#1a1a0a,#3a2a00,#1a1a0a);
                    border:2px solid #FFD700;border-radius:12px;margin-top:8px;">
          <div style="font-size:1.5em;color:#FFD700;font-weight:bold;
                      text-shadow:0 0 10px #FFD700,0 0 20px #FFD70066;">
              ✦ 金 色 传 说 ✦</div>
          <div style="color:#FFD700;font-size:1.8em;letter-spacing:6px;
                      margin:4px 0;">{stars}</div>
          <div style="color:#ccaa44;font-size:.85em;">传说级印章 · 万中无一</div>
        </div>"""

    if name == "史诗":
        return f"""
        <div style="text-align:center;padding:12px;
                    background:linear-gradient(135deg,#1a0a2a,#2a1040);
                    border:2px solid {color};border-radius:10px;margin-top:8px;">
          <div style="color:{color};font-weight:bold;font-size:1.2em;
                      text-shadow:0 0 8px {color};">⚡ {name}</div>
          <div style="color:{color};font-size:1.5em;letter-spacing:4px;">{stars}</div>
        </div>"""

    if name == "普通":
        return f"""
        <div style="text-align:center;padding:8px;color:#999;font-size:.9em;
                    margin-top:8px;">
          {stars} 普通
        </div>"""

    # 精良 / 稀有
    return f"""
    <div style="text-align:center;padding:10px;
                border:1.5px solid {color};border-radius:10px;margin-top:8px;
                background:rgba(0,0,0,0.03);">
      <span style="color:{color};font-weight:bold;font-size:1.1em;">{name}</span>
      <span style="color:{color};margin-left:8px;font-size:1.3em;">{stars}</span>
    </div>"""


# ── Core Handler ──────────────────────────────────────────────────────────────

def generate_stamp(
    input_image,
    engine: str,
    style: str,
    shape: str,
    color_name: str,
    custom_color: str,
    text: str,
    text_position: str,
    texture: str,
    enable_gacha: bool,
    progress=gr.Progress(track_tqdm=True),
):
    if input_image is None:
        raise gr.Error("请先上传一张图片！")

    color_hex = INK_COLORS.get(color_name) if color_name != "自定义" else custom_color

    logs = []
    def log_fn(msg):
        logs.append(msg)
        progress(0, desc=msg)

    try:
        img = input_image if isinstance(input_image, Image.Image) else Image.fromarray(input_image)
        result, rarity = run_pipeline(
            img, engine, style, color_hex,
            log=log_fn,
            shape=shape,
            text=text,
            text_position=text_position,
            texture=texture,
            enable_gacha=enable_gacha,
        )
        rarity_html = _render_rarity_html(rarity)
        return result, "\n".join(logs), rarity_html
    except Exception as e:
        raise gr.Error(f"生成失败：{e}")


def update_color_visibility(color_name: str):
    return gr.update(visible=(color_name == "自定义"))


# ── UI ─────────────────────────────────────────────────────────────────────────

CSS = """
.stamp-title { text-align:center; font-size:1.8em; font-weight:bold; color:#8B1A1A; margin:.3em 0; }
.stamp-sub   { text-align:center; color:#666; margin-bottom:1em; font-size:.95em; }
footer { display:none !important; }
.gacha-legendary {
    animation: goldpulse 2s infinite;
}
@keyframes goldpulse {
    0%   { box-shadow: 0 0 5px #FFD700; }
    50%  { box-shadow: 0 0 20px #FFD700, 0 0 40px #FFD70044; }
    100% { box-shadow: 0 0 5px #FFD700; }
}
"""

with gr.Blocks(title="印迹 - AI 印章生成器") as demo:

    gr.HTML('<div class="stamp-title">🖋 印迹 · AI 印章生成器</div>')
    gr.HTML('<div class="stamp-sub">📸 上传照片 · AI 变身印章贴纸 · 🎰 每次生成都有盲盒惊喜！</div>')

    with gr.Row():
        # ── Left column ───────────────────────────────────────────────
        with gr.Column(scale=1):
            input_img = gr.Image(
                label="① 上传原图",
                type="pil",
                height=280,
            )

            with gr.Group():
                style = gr.Radio(
                    choices=STYLES,
                    value=STYLES[0],
                    label="② 印章风格",
                )

            with gr.Row():
                with gr.Column(scale=1, min_width=140):
                    shape = gr.Radio(
                        choices=SHAPES,
                        value="无边框",
                        label="③ 印章形状",
                    )
                with gr.Column(scale=1, min_width=140):
                    engine = gr.Radio(
                        choices=ENGINES,
                        value=ENGINES[0],
                        label="④ 生成引擎",
                        info="Flash 速度快，Pro 质量高",
                    )

            with gr.Group():
                color_name = gr.Radio(
                    choices=COLOR_NAMES + ["自定义"],
                    value="朱红",
                    label="⑤ 印泥颜色",
                )
                custom_color = gr.ColorPicker(
                    value="#CC2200",
                    label="自定义颜色",
                    visible=False,
                )

            with gr.Accordion("✍ 添加文字（可选）", open=False):
                text_input = gr.Textbox(
                    label="印章文字",
                    placeholder="如：上海 · 2026 / 旅行纪念",
                    max_lines=1,
                )
                text_position = gr.Radio(
                    choices=TEXT_POSITIONS,
                    value="底部横排",
                    label="文字位置",
                )

            with gr.Row():
                texture = gr.Radio(
                    choices=TEXTURES,
                    value="无",
                    label="⑥ 纹理效果",
                )

            gacha_toggle = gr.Checkbox(
                value=True,
                label="🎰 开启盲盒抽卡",
                info="每次生成随机触发稀有度特效，可能开出「金色传说」！",
            )

            generate_btn = gr.Button("✨ 生成印章", variant="primary", size="lg")

        # ── Right column ──────────────────────────────────────────────
        with gr.Column(scale=1):
            output_img = gr.Image(
                label="⑦ 生成的印章（透明背景 PNG）",
                type="pil",
                height=350,
                format="png",
            )
            rarity_display = gr.HTML(value=RARITY_PLACEHOLDER)
            log_box = gr.Textbox(
                label="处理进度",
                lines=6,
                interactive=False,
                placeholder="点击「生成印章」开始...\n大约需要 25-40 秒，等待时盲盒自动揭晓~",
            )

    # ── Wiring ────────────────────────────────────────────────────────
    color_name.change(
        fn=update_color_visibility,
        inputs=[color_name],
        outputs=[custom_color],
    )

    generate_btn.click(
        fn=generate_stamp,
        inputs=[
            input_img, engine, style, shape,
            color_name, custom_color,
            text_input, text_position,
            texture, gacha_toggle,
        ],
        outputs=[output_img, log_box, rarity_display],
    )

    gr.HTML("""
    <div style="text-align:center;margin-top:1em;color:#aaa;font-size:.8em;">
        Powered by <b>GMI Cloud</b> · Gemini 3.1 Flash / Gemini 3 Pro · rembg
        <br>🎰 盲盒概率: 普通75% · 精良13% · 稀有7% · 史诗3.5% · 金色传说1.5%
    </div>
    """)


if __name__ == "__main__":
    import socket
    host = os.environ.get("GRADIO_HOST", "0.0.0.0")
    port = int(os.environ.get("GRADIO_PORT", "7860"))

    print("\n🖋  印迹 Demo 启动中...")
    print(f"   本地访问: http://localhost:{port}")
    try:
        ip = socket.gethostbyname(socket.gethostname())
        print(f"   局域网访问 (手机): http://{ip}:{port}")
    except Exception:
        pass
    print()

    demo.launch(server_name=host, server_port=port, share=False, css=CSS)
