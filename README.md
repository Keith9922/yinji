# 印迹 · AI 印章生成器 Demo

> 将普通照片 AI 转化为印章风格贴纸（透明背景 PNG），用于"印迹"手账 App 的核心功能验证。

---

## 一、实现思路

### 核心问题

将一张真实照片转化为"印章贴纸"，需要解决三件事：
1. **风格化**：把照片变成高对比度、黑白线条的印章风格
2. **去背景**：去掉白色/彩色背景，只保留印章主体，输出透明 PNG
3. **上色**：将黑白印章替换为用户选择的印泥颜色（朱红、墨黑等）

### 解决方案

```
原始照片
  │
  ▼ [步骤1] Gemini 图像生成（GMI Cloud API）
  │  将照片 + 印章风格提示词 → 生成高对比度黑白印章图
  │
  ▼ [步骤2] 对比度增强（本地 PIL/NumPy）
  │  拉伸直方图，让线条更清晰
  │
  ▼ [步骤3] 背景去除（本地 rembg）
  │  AI 模型自动识别主体，去除背景 → RGBA 透明 PNG
  │
  ▼ [步骤4] 印泥上色（本地 PIL/NumPy）
     深色像素 → 目标颜色（如朱红 #CC2200）
     浅色像素 → 透明
     输出最终印章贴纸
```

### 关键技术决策

| 问题 | 方案 | 原因 |
|------|------|------|
| 图像传参方式 | `contents/inlineData` Base64 内嵌 | 外部图床 URL（catbox.moe 等）会被 GMI 下载超时阻断 |
| 图像模型选择 | `gemini-3.1-flash-image-preview` | gemini-2.5-flash 计费异常；BRIA 系列同样计费错误 |
| 背景去除 | 本地 `rembg` + u2net 模型 | 无 API 费用，首次下载 176MB 后永久缓存 |
| 提示词策略 | 中文选项映射英文专业提示词 | 精确描述"印章风格"比用户自由输入效果更稳定 |

---

## 二、技术框架

### 后端核心（`stamp_generator.py`）

| 组件 | 技术 | 版本 |
|------|------|------|
| AI 生成 | GMI Cloud API（Gemini 3.1 Flash / Pro） | REST API |
| 背景去除 | rembg + u2net.onnx 模型 | 2.0.74 |
| 图像处理 | Pillow + NumPy | PIL 12.x |
| HTTP 请求 | requests | 2.32.x |

### 前端（`app.py`）

| 组件 | 技术 | 版本 |
|------|------|------|
| Web 界面 | Gradio Blocks | 5.49.1 |
| Python 环境 | `/opt/miniconda3/bin/python3` | 3.13.x |

### GMI Cloud API 调用模式

```
POST https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests
Body:
{
  "model": "gemini-3.1-flash-image-preview",
  "payload": {
    "contents": [
      {
        "role": "user",
        "parts": [
          {"text": "印章风格提示词..."},
          {"inlineData": {"mimeType": "image/jpeg", "data": "<base64>"}}
        ]
      }
    ],
    "aspect_ratio": "1:1",
    "image_size": "1K"
  }
}

→ 返回：status=success，outcome.media_urls[0].url = GCS 图片链接
→ 响应时间：约 23-40 秒（同步处理，不需要轮询）
```

---

## 三、最终效果

### 支持的印章风格

| 风格名 | 视觉效果 |
|--------|---------|
| 复古橡皮章 | 黑墨粗线条，边缘有印泥晕染感，仿旧纹理 |
| 现代极简 | 干净细线条，类日本车站集章（駅スタンプ）风格 |
| 金石篆刻 | 粗犷刻痕感，仿中国石刻印章 |
| 涂鸦线描 | 手绘素描风格，线条有自然抖动感 |

### 支持的印泥颜色

朱红 `#CC2200` · 墨黑 `#1A1A1A` · 藏青 `#003366` · 深绿 `#1A5C3A` · 古紫 `#5C1A5C` · 橙金 `#CC6600` · 自定义颜色

### 输出规格

- 格式：PNG，RGBA（透明背景）
- 尺寸：1024 × 1024 像素
- 可直接用于手账排版、贴纸制作

---

## 四、Demo 架构

```
yingji/
├── app.py              # Gradio Web 界面，处理用户交互
├── stamp_generator.py  # 核心生成逻辑（API 调用 + 后处理）
├── requirements.txt    # Python 依赖列表
└── .env.example        # 环境变量说明
```

### 关键函数

```python
# stamp_generator.py

generate_with_gemini(img, style, quality)
# 调用 GMI Gemini API，传入 base64 图片 + 提示词，返回印章风格 PIL Image

enhance_stamp_contrast(img)
# 直方图拉伸 + 对比度增强，让线条更清晰

remove_background(img)
# rembg 去除背景，返回 RGBA 透明图

apply_ink_color(img_rgba, color_hex)
# 深色像素 → 指定颜色；浅色像素 → 透明

run_pipeline(original_img, engine, style, color_hex, log)
# 主流水线，串联以上所有步骤
```

---

## 五、使用方法

### 启动服务

```bash
/opt/miniconda3/bin/python3 app.py
```

首次运行会自动下载 rembg 模型（~176MB），之后启动即用。

### 访问地址

| 设备 | 地址 |
|------|------|
| 本机浏览器 | http://localhost:7860 |
| 同局域网手机 | http://192.168.0.108:7860 |

### 操作步骤

1. **上传原图** — 支持 JPG/PNG，建议主体清晰、背景简单
2. **选择风格** — 复古橡皮章 / 现代极简 / 金石篆刻 / 涂鸦线描
3. **选择引擎** — Flash（约 25 秒）/ Pro（约 40 秒，质量更高）
4. **选择颜色** — 预设 6 种印泥颜色，或自定义取色
5. **点击「✨ 生成印章」** — 等待生成
6. **下载 PNG** — 点击结果图右上角下载按钮，获得透明背景贴纸

### 环境要求

```
GMI_API_KEY=<your_key>  # 已在系统环境变量中配置
Python: /opt/miniconda3/bin/python3
依赖包: gradio, rembg, Pillow, requests, numpy（均已安装）
```

---

## 六、已知问题 & 后续优化方向

| 问题 | 说明 |
|------|------|
| gemini-2.5-flash 不可用 | 当前 GMI 账户有计费限制，已切换到 3.1-flash |
| BRIA 艺术风格不可用 | 同上，需要账户开通对应权限 |
| 生成时间较长 | 25-40 秒，正式产品可加入骨架屏/进度条优化体验 |
| rembg 效果依赖图片质量 | 背景复杂的图片去除效果可能不理想，可尝试多次生成 |

### 下一步可探索

- 加入印章形状遮罩（圆形/方形/不规则边框）
- 支持在印章上自动添加文字（地名、日期）
- 批量生成多种风格供用户选择
- 接入 BRIA 系列模型（需要开通账户权限）后提供更多艺术风格
