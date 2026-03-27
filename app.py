#!/usr/bin/env python3
"""
印迹 - AI 印章生成器 Demo
Upload a photo and transform it into a stamp-sticker with transparent background.
Powered by GMI Cloud (Gemini 3.1 Flash / Gemini 3 Pro)
"""
import sys
from pathlib import Path

import gradio as gr
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from stamp_generator import run_pipeline, INK_COLORS, STAMP_PROMPTS

# ── Constants ──────────────────────────────────────────────────────────────────
STYLES = list(STAMP_PROMPTS.keys())
COLOR_NAMES = list(INK_COLORS.keys())

ENGINES = [
    "极速 (Flash ~25s)",
    "高质量 (Pro ~40s)",
]

# ── Core handler ──────────────────────────────────────────────────────────────

def generate_stamp(
    input_image,
    engine: str,
    style: str,
    color_name: str,
    custom_color: str,
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
        result = run_pipeline(img, engine, style, color_hex, log=log_fn)
        return result, "\n".join(logs)
    except Exception as e:
        raise gr.Error(f"生成失败：{e}")


def update_color_visibility(color_name: str):
    return gr.update(visible=(color_name == "自定义"))


# ── UI ─────────────────────────────────────────────────────────────────────────

CSS = """
.stamp-title { text-align: center; font-size: 1.8em; font-weight: bold; color: #8B1A1A; margin: 0.3em 0; }
.stamp-sub   { text-align: center; color: #666; margin-bottom: 1em; font-size: 0.95em; }
footer { display: none !important; }
"""

with gr.Blocks(css=CSS, title="印迹 - AI 印章生成器") as demo:

    gr.HTML('<div class="stamp-title">🖋 印迹 · AI 印章生成器</div>')
    gr.HTML('<div class="stamp-sub">上传照片，AI 自动转化为可收藏的印章贴纸（透明背景 PNG）</div>')

    with gr.Row():
        # ── Left column ───────────────────────────────────────────────
        with gr.Column(scale=1):
            input_img = gr.Image(
                label="① 上传原图",
                type="pil",
                height=300,
            )

            with gr.Group():
                style = gr.Radio(
                    choices=STYLES,
                    value=STYLES[0],
                    label="② 印章风格",
                )
                engine = gr.Radio(
                    choices=ENGINES,
                    value=ENGINES[0],
                    label="③ 生成引擎",
                    info="Flash 速度更快，Pro 质量更高",
                )

            with gr.Group():
                color_name = gr.Radio(
                    choices=COLOR_NAMES + ["自定义"],
                    value="朱红",
                    label="④ 印泥颜色",
                )
                custom_color = gr.ColorPicker(
                    value="#CC2200",
                    label="自定义颜色",
                    visible=False,
                )

            generate_btn = gr.Button("✨ 生成印章", variant="primary", size="lg")

        # ── Right column ──────────────────────────────────────────────
        with gr.Column(scale=1):
            output_img = gr.Image(
                label="⑤ 生成的印章（透明背景 PNG）",
                type="pil",
                height=300,
                format="png",
            )
            log_box = gr.Textbox(
                label="处理进度",
                lines=5,
                interactive=False,
                placeholder="点击「生成印章」开始...\n大约需要 25-40 秒",
            )

    # ── Wiring ────────────────────────────────────────────────────────
    color_name.change(
        fn=update_color_visibility,
        inputs=[color_name],
        outputs=[custom_color],
    )

    generate_btn.click(
        fn=generate_stamp,
        inputs=[input_img, engine, style, color_name, custom_color],
        outputs=[output_img, log_box],
    )

    gr.HTML("""
    <div style="text-align:center;margin-top:1em;color:#aaa;font-size:0.8em;">
        Powered by <b>GMI Cloud</b> · Gemini 3.1 Flash / Gemini 3 Pro · rembg
    </div>
    """)


if __name__ == "__main__":
    import socket
    host = "0.0.0.0"
    port = 7860

    print("\n🖋  印迹 Demo 启动中...")
    print(f"   本地访问: http://localhost:{port}")
    try:
        ip = socket.gethostbyname(socket.gethostname())
        print(f"   局域网访问 (手机): http://{ip}:{port}")
    except Exception:
        pass
    print()

    demo.launch(server_name=host, server_port=port, share=False)
