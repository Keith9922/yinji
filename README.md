# 印迹后端

这是 `印迹 / Memoseal` 项目抽离出来的 Python 后端仓库。

它有两种运行方式：

- `api.py`：FastAPI 独立后端，适合前后端分离部署
- `app.py`：Gradio demo，适合本地验证效果

如果你要运行完整的前后端分离项目，请看相邻仓库 `../Memoseal`。当前这个仓库本身不包含 React 前端。

## 已实现功能

- 10 种印章风格
- 多种印泥颜色、形状、文字位置、纹理
- 盲盒稀有度效果
- `rembg` 去背景输出透明 PNG
- `GET /api/options` 返回前端所需全部枚举和默认值
- `POST /api/stamps/generate` 接收 `multipart/form-data`
- `MOCK_GENERATION=1` 本地 mock 生成，便于无额度联调

## 目录结构

```text
yingji/
├── api.py                  # FastAPI 独立后端
├── app.py                  # Gradio demo
├── stamp_generator.py      # 核心生成逻辑
├── requirements-api.txt    # 纯后端部署依赖
├── requirements-demo.txt   # Demo 依赖
├── requirements.txt        # 默认指向 demo 依赖
└── .env.example            # 环境变量示例
```

## 推荐环境

- Python：建议 `3.11` 或 `3.12`
- 操作系统：macOS、Linux、Windows 11

`rembg` 官方当前要求 Python `>=3.11, <3.14`。因此部署时建议尽量使用 `3.11` 或 `3.12`。

## 安装依赖

### API 模式

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements-api.txt
cp .env.example .env
```

### Demo 模式

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements-demo.txt
cp .env.example .env
```

## 启动方式

### 启动 API

macOS / Linux:

```bash
python api.py
```

默认地址：

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/options`
- `http://127.0.0.1:8000/api/stamps/generate`

### 启动 Demo

macOS / Linux:

```bash
python app.py
```

默认地址：

- `http://127.0.0.1:7860`

如果 `7860` 已被占用：

```bash
GRADIO_PORT=7861 python app.py
```

## Windows 11 启动说明

### 1. PowerShell 初始化虚拟环境

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

如果 PowerShell 不允许激活：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Windows 启动 API

```powershell
pip install -r requirements-api.txt
Copy-Item .env.example .env
python api.py
```

### 3. Windows 启动 Demo

```powershell
pip install -r requirements-demo.txt
Copy-Item .env.example .env
python app.py
```

如果端口被占用：

```powershell
$env:GRADIO_PORT="7861"
python app.py
```

## 环境变量

`.env.example`：

```env
GMI_API_KEY=your_gmi_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
API_HOST=0.0.0.0
API_PORT=8000
GRADIO_HOST=0.0.0.0
GRADIO_PORT=7860
REMBG_MODEL=u2netp
REMBG_MAX_SIDE=768
MOCK_GENERATION=0
```

说明：

- `GMI_API_KEY`：服务端密钥
- `ALLOWED_ORIGINS`：如果前端单独部署，生产环境要改成真实域名
- `REMBG_MODEL=u2netp`：轻量模型，适合小内存机器
- `MOCK_GENERATION=1`：无额度时做本地联调

## API 约定

### `GET /api/health`

返回服务状态与当前是否启用 mock 生成。

### `GET /api/options`

返回：

- `engines`
- `styles`
- `colors`
- `shapes`
- `textures`
- `textPositions`
- `defaults`

### `POST /api/stamps/generate`

使用 `multipart/form-data`：

- `image`
- `engine`
- `style`
- `shape`
- `color_name`
- `custom_color`
- `text`
- `text_position`
- `texture`
- `enable_gacha`

返回 JSON：

```json
{
  "imageDataUrl": "data:image/png;base64,...",
  "rarity": {
    "name": "普通",
    "stars": 1,
    "color": "#888888",
    "roll": 0.12
  },
  "logs": [
    "[1/4] 生成印章风格图像..."
  ],
  "meta": {
    "engine": "flash"
  }
}
```

## 生产部署

### 推荐方式

如果这是前后端分离项目中的后端，建议只部署 `api.py`，不要在服务器上跑 `Gradio demo`。

Linux:

```bash
cd /path/to/yingji
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements-api.txt
cp .env.example .env
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 1
```

### 小服务器建议

如果你的机器是 `2 核 2G`：

- 只跑 API
- `workers=1`
- 使用 `u2netp`
- 关闭 Gradio demo
- 不要与 Nginx 之外的其它重服务混跑

## 当前缺口

如果把这个仓库当成“真正对外”的后端，现在还缺这些能力：

- 没有数据库，无法保存用户、作品、任务、草稿
- 没有对象存储，生成图只能以内嵌 `data URL` 返回
- 没有异步任务队列，长请求会直接占住 API 进程
- 没有登录、配额、限流
- 没有任务日志、监控、告警
- 没有自动化测试与 CI

## 建议的生产化改造顺序

1. 先补数据库和对象存储
2. 再把同步生成接口改成异步任务队列
3. 再补鉴权、配额与限流
4. 最后补监控、日志和测试体系

## 官方参考

- FastAPI 部署：https://fastapi.tiangolo.com/deployment/concepts/
- FastAPI 多进程 workers：https://fastapi.tiangolo.com/deployment/server-workers/
- FastAPI 后台任务：https://fastapi.tiangolo.com/tutorial/background-tasks/
- Python `venv`：https://docs.python.org/3/library/venv.html
- rembg：https://github.com/danielgatis/rembg
