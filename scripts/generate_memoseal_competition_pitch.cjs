#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function resolvePptxGen() {
  try {
    return require("pptxgenjs");
  } catch (err) {
    return require("/tmp/memoseal-pptgen/node_modules/pptxgenjs");
  }
}

const PptxGenJS = resolvePptxGen();

const ROOT = path.resolve(__dirname, "..");
const DELIVERABLES_DIR = path.join(ROOT, "deliverables");
const ASSET_DIR = path.join(DELIVERABLES_DIR, "assets");
const OUTPUT_PPTX = path.join(
  DELIVERABLES_DIR,
  "印迹-Memoseal-4分钟比赛答辩版.pptx",
);
const OUTPUT_NOTES = path.join(
  DELIVERABLES_DIR,
  "印迹-Memoseal-4分钟比赛答辩讲稿.md",
);

const IMG = {
  brand: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-7.png",
  ),
  homeHero: path.join(ROOT, "memoseal-home-after.png"),
  homeUpload: path.join(ROOT, "home-upload-smaller.png"),
  homeList: path.join(ROOT, "home-final-check.png"),
  notebooks: path.join(ROOT, "notebook-shelf-redesigned.png"),
  preview: path.join(ROOT, "preview-readonly-showcase-layout.png"),
  map: path.join(ROOT, "mobile-map-check.png"),
  flowGenerate: path.join(ASSET_DIR, "flow-generate.png"),
  flowEditor: path.join(ASSET_DIR, "flow-editor.png"),
  webEditor: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-4.png",
  ),
};

const C = {
  bg: "F7F0E8",
  panel: "FFFDF9",
  panelWarm: "FBF4ED",
  line: "E9DDD2",
  text: "5B4338",
  sub: "8C776C",
  accent: "C8656A",
  accentDark: "8A5352",
  accentSoft: "F1D8D3",
  accentSoft2: "F7E8E2",
  gold: "D8B06A",
  green: "5E7D68",
  blue: "6F859F",
  brown: "8F6B57",
  white: "FFFFFF",
};

const FONT = {
  title: "Songti SC",
  body: "Hiragino Sans GB",
  en: "Avenir Next",
};

const W = 13.333;
const H = 7.5;

function ensureAssets() {
  fs.mkdirSync(DELIVERABLES_DIR, { recursive: true });
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const prep = spawnSync("python3", [path.join(__dirname, "prepare_pitch_assets.py")], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  if (prep.status !== 0) {
    throw new Error(prep.stderr || prep.stdout || "prepare_pitch_assets.py 执行失败");
  }
}

function bg(slide) {
  slide.background = { color: C.bg };
  slide.addShape("ellipse", {
    x: 10.75,
    y: -0.75,
    w: 3.2,
    h: 2.4,
    line: { color: C.bg, transparency: 100 },
    fill: { color: C.accentSoft, transparency: 62 },
  });
  slide.addShape("ellipse", {
    x: -0.75,
    y: 6.05,
    w: 2.45,
    h: 1.95,
    line: { color: C.bg, transparency: 100 },
    fill: { color: C.accentSoft, transparency: 78 },
  });
}

function chrome(slide, no, label) {
  slide.addShape("line", {
    x: 0.8,
    y: 0.68,
    w: 0.33,
    h: 0,
    line: { color: C.accent, pt: 1.4 },
  });
  slide.addText(label, {
    x: 1.18,
    y: 0.49,
    w: 4.3,
    h: 0.18,
    fontFace: FONT.en,
    fontSize: 9,
    color: C.sub,
    bold: true,
    charSpace: 1.3,
    margin: 0,
  });
  slide.addText(String(no).padStart(2, "0"), {
    x: 12.15,
    y: 0.43,
    w: 0.42,
    h: 0.22,
    fontFace: FONT.en,
    fontSize: 10,
    color: C.accent,
    bold: true,
    align: "right",
    margin: 0,
  });
}

function title(slide, main, sub, options = {}) {
  const x = options.x || 0.92;
  const y = options.y || 0.95;
  slide.addText(main, {
    x,
    y,
    w: options.w || 10.2,
    h: options.h || 0.72,
    fontFace: FONT.title,
    fontSize: options.size || 24,
    color: C.text,
    bold: true,
    margin: 0,
  });
  if (sub) {
    slide.addText(sub, {
      x,
      y: y + 0.74,
      w: options.subW || 10.6,
      h: 0.34,
      fontFace: FONT.body,
      fontSize: options.subSize || 10.5,
      color: C.sub,
      margin: 0,
    });
  }
}

function panel(slide, x, y, w, h, options = {}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: options.radius || 0.12,
    line: { color: options.line || C.line, pt: options.pt || 1 },
    fill: { color: options.fill || C.panel },
  });
}

function pill(slide, txt, x, y, w, options = {}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h: options.h || 0.38,
    rectRadius: 0.08,
    line: { color: options.line || C.line, pt: options.pt || 0.8 },
    fill: { color: options.fill || C.panelWarm },
  });
  slide.addText(txt, {
    x,
    y: y + 0.075,
    w,
    h: 0.16,
    fontFace: options.fontFace || FONT.body,
    fontSize: options.size || 8.7,
    color: options.color || C.sub,
    bold: options.bold !== false,
    align: "center",
    margin: 0,
  });
}

function bullet(slide, txt, x, y, w, options = {}) {
  slide.addShape("ellipse", {
    x,
    y: y + 0.12,
    w: 0.1,
    h: 0.1,
    line: { color: options.dot || C.accent, transparency: 100 },
    fill: { color: options.dot || C.accent },
  });
  slide.addText(txt, {
    x: x + 0.18,
    y,
    w,
    h: options.h || 0.54,
    fontFace: FONT.body,
    fontSize: options.size || 11,
    color: options.color || C.text,
    margin: 0,
  });
}

function statBox(slide, x, y, w, num, label) {
  panel(slide, x, y, w, 1.0, { fill: C.panelWarm });
  slide.addText(num, {
    x,
    y: y + 0.2,
    w,
    h: 0.22,
    fontFace: FONT.en,
    fontSize: 22,
    color: C.accent,
    bold: true,
    align: "center",
    margin: 0,
  });
  slide.addText(label, {
    x,
    y: y + 0.58,
    w,
    h: 0.14,
    fontFace: FONT.body,
    fontSize: 9.5,
    color: C.sub,
    bold: true,
    align: "center",
    margin: 0,
  });
}

function phone(slide, imgPath, x, y, w, h, label) {
  panel(slide, x, y, w, h, { fill: C.panel, line: C.line });
  slide.addImage({
    path: imgPath,
    x: x + 0.08,
    y: y + 0.08,
    w: w - 0.16,
    h: h - 0.44,
    sizing: { type: "contain", w: w - 0.16, h: h - 0.44 },
  });
  slide.addText(label, {
    x,
    y: y + h - 0.27,
    w,
    h: 0.12,
    fontFace: FONT.body,
    fontSize: 9,
    color: C.sub,
    bold: true,
    align: "center",
    margin: 0,
  });
}

const notes = [];
function remember(slideTitle, duration, script) {
  notes.push({ slideTitle, duration, script });
  return `建议时长：${duration}\n${script}`;
}

async function main() {
  ensureAssets();

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "OpenAI Codex";
  pptx.company = "Memoseal";
  pptx.subject = "印迹 Memoseal 4 分钟比赛答辩版";
  pptx.title = "印迹 Memoseal 4 分钟比赛答辩版";
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: FONT.title,
    bodyFontFace: FONT.body,
    lang: "zh-CN",
  };

  // Slide 1
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 1, "COMPETITION DEFENSE EDITION");
    title(
      slide,
      "印迹 Memoseal",
      "把旅行照片变成专属印章，再排进一页真正可回看的数字手帐",
      { x: 0.9, y: 1.02, w: 5.5, size: 26, subW: 5.45 },
    );
    slide.addText(
      "印迹是一款以 AI 生成专属电子印章为核心的旅行记录应用。它希望把线下集章的仪式感带到线上，并进一步形成手帐页、足迹地图和可传播的旅行内容。",
      {
        x: 0.92,
        y: 2.5,
        w: 5.2,
        h: 1.3,
        fontFace: FONT.body,
        fontSize: 12,
        color: C.sub,
        margin: 0,
      },
    );
    pill(slide, "AI 印章生成", 0.94, 4.18, 1.45, {
      fill: C.panel,
      line: C.line,
      color: C.text,
    });
    pill(slide, "数字手帐编排", 2.54, 4.18, 1.62, {
      fill: C.panel,
      line: C.line,
      color: C.text,
    });
    pill(slide, "足迹地图沉淀", 4.31, 4.18, 1.62, {
      fill: C.panel,
      line: C.line,
      color: C.text,
    });
    panel(slide, 0.94, 5.08, 4.98, 1.12, { fill: C.panelWarm });
    slide.addText("答辩主线", {
      x: 1.18,
      y: 5.34,
      w: 0.72,
      h: 0.12,
      fontFace: FONT.en,
      fontSize: 8.5,
      color: C.sub,
      bold: true,
      margin: 0,
      charSpace: 1.2,
    });
    slide.addText("问题清晰、方案完整、技术可落地、产品已做出原型", {
      x: 1.18,
      y: 5.68,
      w: 3.98,
      h: 0.22,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.text,
      bold: true,
      margin: 0,
    });

    slide.addImage({
      path: IMG.brand,
      x: 7.08,
      y: 0.95,
      w: 4.95,
      h: 1.86,
      sizing: { type: "contain", w: 4.95, h: 1.86 },
    });
    phone(slide, IMG.homeHero, 7.52, 2.55, 2.34, 4.0, "首页与创作入口");
    phone(slide, IMG.notebooks, 10.02, 3.1, 2.0, 3.45, "印迹本集合");
    slide.addNotes(
      remember(
        "Slide 1 封面",
        "25 秒",
        "大家好，我们的项目叫印迹 Memoseal。它聚焦旅行记录场景，希望把线下集章的仪式感数字化：用户上传旅行照片，AI 生成专属印章，再把它排进一页数字手帐，并沉淀为地图足迹。今天的答辩我主要从问题、方案、技术实现和当前完成度四个部分来讲。",
      ),
    );
  }

  // Slide 2
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 2, "BACKGROUND / PAIN POINTS");
    title(
      slide,
      "我们想解决的不是“怎么拍更多照片”，而是“怎么让旅行记忆留下来”",
      "线下集章、旅行拍照和社交分享都存在，但它们之间还没有被真正打通。",
      { w: 10.8, size: 22.5 },
    );

    const cards = [
      {
        x: 0.95,
        c: C.accent,
        no: "01",
        title: "线下印章很有纪念意义",
        tag: "有情绪价值",
        body: "但它依赖纸质载体，停留在手册里，很难被长期保存、检索和传播。",
      },
      {
        x: 4.44,
        c: C.gold,
        no: "02",
        title: "旅行照片拍得很多",
        tag: "难以整理回看",
        body: "照片往往分散在相册里，缺少一种能承载地点、时间与故事的纪念形式。",
      },
      {
        x: 7.93,
        c: C.green,
        no: "03",
        title: "文旅传播需要真实内容",
        tag: "游客视角稀缺",
        body: "景点标准介绍很多，但真正能打动人的，是游客留下的记忆与表达。",
      },
    ];
    cards.forEach((item) => {
      panel(slide, item.x, 2.08, 3.02, 3.12);
      slide.addShape("ellipse", {
        x: item.x + 0.24,
        y: 2.38,
        w: 0.48,
        h: 0.48,
        line: { color: item.c, transparency: 100 },
        fill: { color: item.c },
      });
      slide.addText(item.no, {
        x: item.x + 0.24,
        y: 2.5,
        w: 0.48,
        h: 0.12,
        fontFace: FONT.en,
        fontSize: 8.5,
        color: C.white,
        bold: true,
        align: "center",
        margin: 0,
      });
      slide.addText(item.title, {
        x: item.x + 0.85,
        y: 2.4,
        w: 1.95,
        h: 0.48,
        fontFace: FONT.body,
        fontSize: 16,
        color: C.text,
        bold: true,
        margin: 0,
      });
      pill(slide, item.tag, item.x + 0.24, 3.15, 1.42, {
        fill: C.panelWarm,
        line: C.line,
        color: C.sub,
      });
      slide.addText(item.body, {
        x: item.x + 0.24,
        y: 3.82,
        w: 2.42,
        h: 0.94,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    panel(slide, 0.95, 5.72, 11.43, 0.88, { fill: C.accentSoft });
    slide.addText("因此，印迹要做的是把“照片、印章、文字、地点”整合成一份可以回看、可以分享、可以沉淀的旅行纪念。", {
      x: 1.23,
      y: 6.02,
      w: 10.9,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.accentDark,
      bold: true,
      align: "center",
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 2 背景与痛点",
        "30 秒",
        "项目的出发点很简单。第一，线下印章很有纪念意义，但传播性很弱。第二，旅行照片拍得很多，却很难整理成值得反复回看的内容。第三，文旅传播真正缺的是游客自己的故事。所以我们不是单纯做相册，也不是单纯做滤镜，而是想把旅行记忆组织成一种更完整的数字纪念形式。",
      ),
    );
  }

  // Slide 3
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 3, "SOLUTION / INNOVATION");
    title(
      slide,
      "印迹的核心创新：把“生成一枚印章”升级成“沉淀一份旅行内容”",
      "同一条链路里同时完成个性化创作、纪念表达和地图化沉淀。",
      { w: 10.9, size: 22.2 },
    );

    panel(slide, 0.95, 1.95, 7.28, 4.78);
    slide.addText("产品主流程", {
      x: 1.2,
      y: 2.22,
      w: 1.0,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
    phone(slide, IMG.homeUpload, 1.18, 2.65, 1.6, 3.45, "上传照片");
    phone(slide, IMG.flowGenerate, 2.98, 2.65, 1.6, 3.45, "生成印章");
    phone(slide, IMG.flowEditor, 4.78, 2.65, 1.6, 3.45, "编辑成页");
    phone(slide, IMG.map, 6.58, 2.65, 1.42, 3.45, "沉淀地图");
    ["→", "→", "→"].forEach((arrow, idx) => {
      slide.addText(arrow, {
        x: 2.68 + idx * 1.8,
        y: 4.18,
        w: 0.2,
        h: 0.2,
        fontFace: FONT.en,
        fontSize: 18,
        color: C.sub,
        bold: true,
        margin: 0,
        align: "center",
      });
    });

    panel(slide, 8.55, 1.95, 3.83, 4.78, { fill: C.panelWarm });
    slide.addText("方案创新点", {
      x: 8.82,
      y: 2.22,
      w: 1.35,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "从“官方统一印章”变成“用户照片生成的专属印章”。", 8.82, 2.84, 2.95, { h: 0.64 });
    bullet(slide, "从“单个图案”变成“印章 + 文案 + 地点 + 日期”的手帐页面。", 8.82, 3.75, 2.95, { h: 0.7 });
    bullet(slide, "从“本地收藏”变成“地图化足迹”，让记忆能够持续回看和分享。", 8.82, 4.78, 2.95, { h: 0.72 });
    panel(slide, 8.82, 5.98, 2.95, 0.44, { fill: C.panel });
    slide.addText("创作工具 + 内容载体 + 地图沉淀", {
      x: 8.82,
      y: 6.13,
      w: 2.95,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 10,
      color: C.accentDark,
      bold: true,
      align: "center",
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 3 解决方案与创新点",
        "35 秒",
        "我们的方案不是只让用户得到一枚印章，而是让用户走完一条完整的内容链路：先上传照片，AI 生成风格化印章，再排版成一页数字手帐，最后沉淀到地图里。创新点有三层。第一层是把官方统一印章变成用户专属印章；第二层是把单个图案升级成图文页面；第三层是把本地收藏升级成地图化内容沉淀。",
      ),
    );
  }

  // Slide 4
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 4, "TECHNICAL IMPLEMENTATION");
    title(
      slide,
      "技术实现：前后端分离 + AI 生成流水线，保证可迭代、可扩展、可验证",
      "技术设计的目标不是炫技，而是让生成、编辑、保存和展示形成一条稳定主链路。",
      { w: 11.0, size: 21.5 },
    );

    panel(slide, 0.95, 1.95, 5.8, 4.95);
    slide.addText("印章生成流水线", {
      x: 1.2,
      y: 2.2,
      w: 1.5,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
    const steps = [
      { y: 2.78, title: "1. AI 风格化生成", tag: "远程", desc: "GMI Gemini API 根据预设提示词生成黑白印章风格图。" },
      { y: 3.48, title: "2. 对比度增强", tag: "本地", desc: "对生成结果做锐化与层次增强，让印章线条更清晰。" },
      { y: 4.18, title: "3. 去背景与形状遮罩", tag: "本地", desc: "通过 rembg 去背景，再叠加圆形、齿边等印章外形。" },
      { y: 4.88, title: "4. 文字、纹理与颜色", tag: "本地", desc: "补充地点文字、印泥颜色、做旧纹理与视觉细节。" },
      { y: 5.58, title: "5. 导出与保存", tag: "链路", desc: "输出透明 PNG，并进入预览、保存到首页和地图展示。" },
    ];
    steps.forEach((s, idx) => {
      panel(slide, 1.18, s.y, 5.34, 0.54, { fill: idx % 2 === 0 ? C.panelWarm : C.panel });
      slide.addText(s.title, {
        x: 1.36,
        y: s.y + 0.13,
        w: 1.7,
        h: 0.12,
        fontFace: FONT.body,
        fontSize: 10.5,
        color: C.text,
        bold: true,
        margin: 0,
      });
      pill(slide, s.tag, 3.02, s.y + 0.1, 0.62, {
        fill: s.tag === "远程" ? C.accentSoft : C.panel,
        line: C.line,
        color: s.tag === "远程" ? C.accentDark : C.sub,
        size: 8,
      });
      slide.addText(s.desc, {
        x: 3.8,
        y: s.y + 0.12,
        w: 2.45,
        h: 0.12,
        fontFace: FONT.body,
        fontSize: 9.3,
        color: C.sub,
        margin: 0,
      });
    });

    panel(slide, 7.0, 1.95, 5.38, 4.95, { fill: C.panelWarm });
    slide.addText("系统架构与选型", {
      x: 7.25,
      y: 2.2,
      w: 1.55,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
    const layers = [
      { y: 2.86, label: "前端", value: "React 18 + Vite 5", fill: C.panel },
      { y: 3.56, label: "后端", value: "FastAPI + 异步生成任务", fill: C.panel },
      { y: 4.26, label: "数据", value: "SQLite / Impression Store", fill: C.panel },
      { y: 4.96, label: "外部能力", value: "GMI Gemini API + 高德地图 + rembg", fill: C.panel },
    ];
    layers.forEach((layer) => {
      panel(slide, 7.25, layer.y, 4.86, 0.52, { fill: layer.fill });
      pill(slide, layer.label, 7.45, layer.y + 0.09, 0.82, {
        fill: C.accentSoft,
        line: C.accentSoft,
        color: C.accentDark,
        size: 8.3,
      });
      slide.addText(layer.value, {
        x: 8.55,
        y: layer.y + 0.14,
        w: 3.22,
        h: 0.1,
        fontFace: FONT.body,
        fontSize: 10,
        color: C.text,
        margin: 0,
      });
    });
    pill(slide, "支持 MOCK_GENERATION 本地联调", 7.28, 5.95, 2.1, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
    });
    pill(slide, "主流程前后端已打通", 9.58, 5.95, 1.86, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
    });

    slide.addNotes(
      remember(
        "Slide 4 技术实现",
        "40 秒",
        "这一页主要说明项目不是停留在想法层面。我们采用前后端分离架构，前端负责上传、编辑、展示，后端负责印章生成和数据持久化。生成链路里，先通过 GMI Gemini API 做风格化生成，再经过本地增强、去背景、形状遮罩、文字纹理和颜色处理，最后输出透明 PNG 并回到首页和地图展示。这样设计的好处是链路清晰、模块可替换，也方便后续继续迭代。",
      ),
    );
  }

  // Slide 5
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 5, "PROGRESS / DEMO");
    title(
      slide,
      "当前完成度：PoC 已验证，高保真 MVP 主流程已跑通",
      "答辩里最重要的一点，是证明项目已经从概念进入可演示状态。",
      { w: 10.5, size: 22.3 },
    );

    statBox(slide, 0.95, 1.98, 1.65, "10", "已实现印章风格");
    statBox(slide, 2.8, 1.98, 1.65, "6", "印泥颜色");
    statBox(slide, 4.65, 1.98, 1.65, "6", "形状选项");
    statBox(slide, 6.5, 1.98, 1.65, "1", "主流程已贯通");

    panel(slide, 0.95, 3.15, 4.22, 3.56);
    slide.addText("已完成的关键能力", {
      x: 1.18,
      y: 3.42,
      w: 1.42,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "后端支持多风格、多形状、多纹理、透明 PNG 输出和盲盒效果。", 1.18, 4.05, 3.22, { h: 0.7 });
    bullet(slide, "前端已打通上传、生成、编辑、预览、保存、首页展示、地图展示链路。", 1.18, 5.03, 3.22, { h: 0.76 });
    bullet(slide, "当前可以稳定演示“创作一枚印迹并沉淀到地图”的核心流程。", 1.18, 6.08, 3.22, { h: 0.68 });

    phone(slide, IMG.homeList, 5.6, 3.22, 2.02, 3.36, "首页列表");
    phone(slide, IMG.preview, 7.82, 3.22, 2.02, 3.36, "手帐预览");
    phone(slide, IMG.map, 10.04, 3.22, 1.96, 3.36, "足迹地图");

    slide.addNotes(
      remember(
        "Slide 5 当前完成度与演示结果",
        "35 秒",
        "这一页是答辩非常关键的证据页。我们已经实现了 10 种风格、6 种颜色和 6 类形状选项，后端能稳定输出透明 PNG。更重要的是，前端已经把上传、生成、编辑、预览、保存以及首页和地图展示全部打通。所以现在这个项目不是只有思路，而是已经能够被完整演示的高保真 MVP。",
      ),
    );
  }

  // Slide 6
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 6, "VALUE / APPLICATION");
    title(
      slide,
      "项目价值不只在“生成好看”，而在于把记忆、内容和场景连接起来",
      "比赛答辩里，我们更强调这个项目为什么有意义、为什么值得继续做。",
      { w: 10.9, size: 21.8 },
    );

    panel(slide, 0.95, 1.98, 3.55, 4.8);
    slide.addText("对个人用户", {
      x: 1.22,
      y: 2.28,
      w: 1.2,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "任何值得纪念的地点，都能被做成自己的专属印章。", 1.22, 2.95, 2.75, { h: 0.66 });
    bullet(slide, "照片、文案、地点与日期被组织成完整的数字纪念页。", 1.22, 3.9, 2.75, { h: 0.66 });
    bullet(slide, "地图化沉淀让旅行不再只是拍过，而是留下可回看的足迹。", 1.22, 4.86, 2.75, { h: 0.76 });

    panel(slide, 4.9, 1.98, 3.55, 4.8, { fill: C.panelWarm });
    slide.addText("对内容传播", {
      x: 5.17,
      y: 2.28,
      w: 1.2,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "用户留下的不只是照片，而是带故事的旅行内容。", 5.17, 2.95, 2.75, { h: 0.66 });
    bullet(slide, "共享地图让真实游客视角成为一种天然可浏览的内容。", 5.17, 3.9, 2.75, { h: 0.7 });
    bullet(slide, "相比标准化景点介绍，这种内容更具种草和传播潜力。", 5.17, 4.9, 2.75, { h: 0.72 });

    panel(slide, 8.85, 1.98, 3.5, 4.8);
    slide.addText("后续延展空间", {
      x: 9.12,
      y: 2.28,
      w: 1.4,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "电子印章可以进一步转化为贴纸、明信片、徽章等实体周边。", 9.12, 2.95, 2.6, { h: 0.78 });
    bullet(slide, "景区、文旅局或商家可以联合发起数字集章与打卡活动。", 9.12, 4.02, 2.6, { h: 0.78 });
    bullet(slide, "创作者可以提供模板和样式，逐步形成内容生态。", 9.12, 5.1, 2.6, { h: 0.7 });

    panel(slide, 0.95, 6.18, 11.4, 0.58, { fill: C.accentSoft });
    slide.addText("比赛阶段我们最想证明的是：印迹不仅能做出来，而且有明确的用户价值、内容价值和场景价值。", {
      x: 1.12,
      y: 6.37,
      w: 11.02,
      h: 0.16,
      fontFace: FONT.body,
      fontSize: 12.4,
      color: C.accentDark,
      bold: true,
      align: "center",
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 6 业务价值与应用场景",
        "35 秒",
        "从比赛答辩角度，这个项目的价值体现在三层。对个人用户，它解决了旅行记忆如何被留下来的问题；对内容传播，它提供了游客视角的真实内容；对后续应用，它还具备文旅活动、商家打卡和数字转实体的延展空间。所以印迹并不是一个孤立的小功能，而是一条可以继续扩展的产品方向。",
      ),
    );
  }

  // Slide 7
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 7, "ROADMAP / CONCLUSION");
    title(
      slide,
      "从比赛作品走向真实产品，下一步重点是体验打磨、内容传播和场景验证",
      "我们已经完成了第一阶段验证，后续将继续把项目做实、做深、做成可试点的产品。",
      { w: 11.0, size: 21.5 },
    );

    panel(slide, 0.95, 2.02, 6.55, 4.7);
    slide.addShape("line", {
      x: 1.5,
      y: 2.72,
      w: 0,
      h: 3.0,
      line: { color: C.accentSoft, pt: 1.5 },
    });
    const items = [
      { y: 2.55, title: "近期", desc: "继续优化移动端生成、编辑与保存流程，提升交互稳定性和完成度。" },
      { y: 3.72, title: "中期", desc: "补齐分享卡、模板、时间轴等功能，提高内容的传播性和回看价值。" },
      { y: 4.89, title: "后续", desc: "探索文旅试点和线下场景合作，让印迹从作品走向真实使用场景。" },
    ];
    items.forEach((item) => {
      slide.addShape("ellipse", {
        x: 1.34,
        y: item.y + 0.05,
        w: 0.32,
        h: 0.32,
        line: { color: C.accent, transparency: 100 },
        fill: { color: C.accent },
      });
      slide.addText(item.title, {
        x: 1.96,
        y: item.y,
        w: 0.8,
        h: 0.14,
        fontFace: FONT.body,
        fontSize: 15,
        color: C.text,
        bold: true,
        margin: 0,
      });
      slide.addText(item.desc, {
        x: 3.03,
        y: item.y,
        w: 3.95,
        h: 0.52,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    panel(slide, 7.8, 2.02, 4.55, 4.7, { fill: C.panelWarm });
    slide.addText("答辩总结", {
      x: 8.08,
      y: 2.3,
      w: 1.15,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "问题明确：旅行记忆缺少一种兼具仪式感与传播力的表达方式。", 8.08, 2.95, 3.4, { h: 0.74 });
    bullet(slide, "方案完整：照片、印章、手帐页和地图足迹形成闭环。", 8.08, 3.98, 3.4, { h: 0.72 });
    bullet(slide, "实现可信：PoC 与高保真 MVP 已完成，核心链路可演示。", 8.08, 5.02, 3.4, { h: 0.72 });
    pill(slide, "问题清晰", 8.1, 5.98, 0.95, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
    });
    pill(slide, "方案完整", 9.18, 5.98, 0.95, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
    });
    pill(slide, "技术落地", 10.26, 5.98, 0.95, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
    });
    pill(slide, "具备延展性", 11.34, 5.98, 0.85, {
      fill: C.panel,
      line: C.line,
      color: C.sub,
      size: 8.3,
    });

    slide.addNotes(
      remember(
        "Slide 7 路线图与答辩总结",
        "35 秒",
        "最后总结一下。印迹已经完成了第一阶段验证，下一步会重点继续打磨移动端体验，补齐分享传播工具，并尝试把项目放进真实场景中验证。从答辩角度看，我们希望传达三点：这个问题是明确存在的，我们给出的方案是完整的，而且核心链路已经可以被真实演示。也就是说，它不仅是一个创意，更是一个已经被做出来的产品方向。",
      ),
    );
  }

  // Slide 8 appendix
  {
    const slide = pptx.addSlide();
    bg(slide);
    chrome(slide, 8, "APPENDIX");
    title(
      slide,
      "附录｜Web 手帐编辑器",
      "如果用户在旅行结束后需要更重度的排版编辑，Web 端可以承接更完整的生产力场景。",
      { w: 9.8, size: 22 },
    );
    panel(slide, 0.95, 2.02, 4.12, 4.72);
    slide.addText("补充说明", {
      x: 1.2,
      y: 2.32,
      w: 1.0,
      h: 0.18,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.text,
      bold: true,
      margin: 0,
    });
    bullet(slide, "移动端更适合轻创作，Web 端更适合细节排版与长内容整理。", 1.2, 2.96, 3.05, { h: 0.72 });
    bullet(slide, "这意味着印迹后续可以同时覆盖记录、回看和深度编辑三类行为。", 1.2, 4.0, 3.05, { h: 0.74 });
    bullet(slide, "本页为备选附录，答辩主讲时可根据时间决定是否展开。", 1.2, 5.06, 3.05, { h: 0.72 });
    panel(slide, 5.42, 2.02, 6.92, 4.72, { fill: C.panelWarm });
    slide.addImage({
      path: IMG.webEditor,
      x: 5.66,
      y: 2.28,
      w: 6.44,
      h: 4.18,
      sizing: { type: "contain", w: 6.44, h: 4.18 },
    });
    slide.addNotes(
      remember(
        "附录 Web 手帐编辑器",
        "15 秒，可选",
        "这页附录主要说明后续延展方向。移动端解决的是随时记录，Web 端解决的是更完整的整理与排版。如果评委追问“后续还能怎么做深”，这一页可以作为补充回答。",
      ),
    );
  }

  await pptx.writeFile({ fileName: OUTPUT_PPTX, compression: true });

  const lines = [
    "# 印迹 Memoseal 4 分钟比赛答辩讲稿",
    "",
    "总时长建议：约 4 分钟，附录不计入主讲时长。",
    "",
  ];
  notes.forEach((item, idx) => {
    lines.push(`## ${idx + 1}. ${item.slideTitle}`);
    lines.push("");
    lines.push(`建议时长：${item.duration}`);
    lines.push("");
    lines.push(item.script);
    lines.push("");
  });
  fs.writeFileSync(OUTPUT_NOTES, lines.join("\n"), "utf8");
  console.log(`PPT 已生成：${OUTPUT_PPTX}`);
  console.log(`讲稿已生成：${OUTPUT_NOTES}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
