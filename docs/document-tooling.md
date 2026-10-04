# 文档处理工具链

## Python 环境

- 路径: `/Users/ronggang/code/funcode/yingji/.venv-docs`
- 解释器: `/Users/ronggang/code/funcode/yingji/.venv-docs/bin/python`
- 入口脚本: `/Users/ronggang/code/funcode/yingji/scripts/doc-python`

## 已安装的核心库

- PPT: `python-pptx`
- Word: `python-docx`
- Excel: `openpyxl`, `xlsxwriter`
- PDF: `pypdf`, `pdfplumber`, `reportlab`, `pypdfium2`
- 通用处理: `pandas`, `pillow`, `lxml`

完整版本锁定见 `/Users/ronggang/code/funcode/yingji/requirements-docs.txt`。

## 已安装的 WPS skills

- `/Users/ronggang/.codex/skills/wps-office`
- `/Users/ronggang/.codex/skills/wps-ppt`
- `/Users/ronggang/.codex/skills/wps-word`
- `/Users/ronggang/.codex/skills/wps-excel`

这些 skills 已经复制到 `~/.codex/skills`，后续新会话也能直接识别。

## WPS 本体

- App 路径: `/Applications/wpsoffice.app`
- Bundle ID: `com.kingsoft.wpsoffice.mac`

## 当前边界

- 这台机器是 macOS。
- 我已经安装了 WPS 本体和文档处理 Python 工具链。
- 但“直接控制 WPS”的能力并不等于“装了 WPS 就自动有 MCP”。
- 当前可见的主流 Office/WPS MCP 方案主要走 Windows COM 自动化路线，macOS 上不能把它当成完整替代品。
- 所以后续我会优先使用 Python 文档库、本地文件解析、导出/转换链路处理文档；需要打开 WPS 本体预览或人工确认时，再调用本机应用。

## 常用命令

```bash
scripts/doc-python -c "import pptx; print(pptx.__version__)"
scripts/doc-python -c "from docx import Document; print('word-ok')"
scripts/doc-python -c "import openpyxl, pypdf, pdfplumber; print('doc-stack-ok')"
```
