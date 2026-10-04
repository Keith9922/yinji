#!/usr/bin/env python3
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "deliverables" / "assets"
DOC_IMG_DIR = ROOT / "docs" / "【项目介绍】印迹 Memoseal   -By HaiSnap" / "images"


def ensure_dir() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)


def crop(src_name: str, dest_name: str, box: tuple[int, int, int, int]) -> None:
    src = DOC_IMG_DIR / src_name
    with Image.open(src) as img:
        cropped = img.crop(box)
        cropped.save(OUT_DIR / dest_name)


def main() -> None:
    ensure_dir()

    # 生成页长截图里真正有信息密度的是中段，所以只保留图片预览和风格选择。
    crop(
        "【项目介绍】印迹 Memoseal   -By HaiSnap-微信图片_20260328155314_1150_149.jpg",
        "flow-generate.png",
        (120, 620, 1140, 2840),
    )

    # 编辑页保留手帐画布与编辑面板，避免整张长截图缩小时不可读。
    crop(
        "【项目介绍】印迹 Memoseal   -By HaiSnap-微信图片_20260328155316_1152_149.jpg",
        "flow-editor.png",
        (120, 900, 1140, 3120),
    )


if __name__ == "__main__":
    main()
