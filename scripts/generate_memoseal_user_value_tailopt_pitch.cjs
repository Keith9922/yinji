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
  "印迹-Memoseal-用户价值版-尾页优化版.pptx",
);
const OUTPUT_NOTES = path.join(
  DELIVERABLES_DIR,
  "印迹-Memoseal-用户价值版-尾页优化版讲稿.md",
);
const OUTPUT_SOURCES = path.join(
  DELIVERABLES_DIR,
  "印迹-Memoseal-用户价值版-尾页优化版-参考来源.md",
);

const IMG = {
  coverBrand: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-7.png",
  ),
  coverHome: path.join(ROOT, "home-mobile-lan.png"),
  homeUpload: path.join(ROOT, "home-upload-smaller.png"),
  homeList: path.join(ROOT, "home-final-check.png"),
  map: path.join(ROOT, "mobile-map-check.png"),
  preview: path.join(ROOT, "preview-readonly-safe-layout.png"),
  notebooks: path.join(ROOT, "notebook-shelf-redesigned.png"),
  appendixEditor: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-4.png",
  ),
  webGenerator: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-2.png",
  ),
  webResult: path.join(
    ROOT,
    "docs",
    "【项目介绍】印迹 Memoseal   -By HaiSnap",
    "images",
    "【项目介绍】印迹 Memoseal   -By HaiSnap-image-3.png",
  ),
  flowGenerate: path.join(ASSET_DIR, "flow-generate.png"),
  flowEditor: path.join(ASSET_DIR, "flow-editor.png"),
};

const C = {
  bg: "F7F0E8",
  card: "FFFDF9",
  cardSoft: "FBF5EF",
  ink: "5B4338",
  sub: "866F63",
  accent: "C46467",
  accentDark: "88504C",
  accentSoft: "F0D7D2",
  accentSoft2: "E9C8C0",
  line: "E9DBD0",
  gold: "CDA86C",
  white: "FFFFFF",
  green: "5E7D68",
  blue: "667E98",
};

const FONT = {
  title: "Songti SC",
  body: "Hiragino Sans GB",
  en: "Avenir Next",
};

const W = 13.333;
const H = 7.5;

function runAssetPrep() {
  const prep = spawnSync("python3", [path.join(__dirname, "prepare_pitch_assets.py")], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  if (prep.status !== 0) {
    throw new Error(prep.stderr || prep.stdout || "prepare_pitch_assets.py 执行失败");
  }
}

function ensureDirs() {
  fs.mkdirSync(DELIVERABLES_DIR, { recursive: true });
  fs.mkdirSync(ASSET_DIR, { recursive: true });
}

function addBackground(slide) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: W,
    h: H,
    line: { color: C.bg, transparency: 100 },
    fill: { color: C.bg },
  });
  slide.addShape("ellipse", {
    x: 10.7,
    y: -0.9,
    w: 3.8,
    h: 2.7,
    line: { color: C.bg, transparency: 100 },
    fill: { color: C.accentSoft, transparency: 58 },
  });
  slide.addShape("ellipse", {
    x: -0.8,
    y: 6.1,
    w: 3.0,
    h: 2.1,
    line: { color: C.bg, transparency: 100 },
    fill: { color: C.accentSoft2, transparency: 72 },
  });
}

function addTopChrome(slide, index, kicker) {
  slide.addShape("line", {
    x: 0.78,
    y: 0.67,
    w: 0.34,
    h: 0,
    line: { color: C.accent, pt: 1.5 },
  });
  slide.addText(kicker, {
    x: 1.17,
    y: 0.47,
    w: 4.6,
    h: 0.22,
    fontFace: FONT.en,
    fontSize: 9,
    color: C.sub,
    bold: true,
    charSpace: 1.4,
  });
  slide.addText(String(index).padStart(2, "0"), {
    x: 12.2,
    y: 0.42,
    w: 0.36,
    h: 0.24,
    fontFace: FONT.en,
    fontSize: 10,
    color: C.accent,
    bold: true,
    align: "right",
  });
}

function addTitle(slide, title, subtitle, opts = {}) {
  slide.addText(title, {
    x: opts.x || 0.9,
    y: opts.y || 0.95,
    w: opts.w || 7.6,
    h: opts.h || 0.68,
    fontFace: FONT.title,
    fontSize: opts.size || 23,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: opts.x || 0.9,
      y: (opts.y || 0.95) + 0.72,
      w: opts.subW || 8.2,
      h: 0.46,
      fontFace: FONT.body,
      fontSize: 10.5,
      color: C.sub,
      margin: 0,
    });
  }
}

function addPill(slide, text, x, y, w, options = {}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h: options.h || 0.38,
    rectRadius: 0.08,
    line: {
      color: options.line || C.line,
      pt: options.pt || 0.8,
      transparency: options.lineTransparency || 0,
    },
    fill: { color: options.fill || C.card },
  });
  slide.addText(text, {
    x,
    y: y + 0.075,
    w,
    h: 0.2,
    fontFace: options.fontFace || FONT.body,
    fontSize: options.size || 9,
    color: options.color || C.ink,
    bold: options.bold !== false,
    align: "center",
    margin: 0,
  });
}

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: opts.radius || 0.12,
    line: { color: opts.line || C.line, pt: opts.pt || 1 },
    fill: { color: opts.fill || C.card },
  });
}

function addBullet(slide, text, x, y, w, options = {}) {
  slide.addShape("ellipse", {
    x,
    y: y + 0.12,
    w: 0.1,
    h: 0.1,
    line: { color: options.dot || C.accent, transparency: 100 },
    fill: { color: options.dot || C.accent },
  });
  slide.addText(text, {
    x: x + 0.18,
    y,
    w,
    h: options.h || 0.48,
    fontFace: FONT.body,
    fontSize: options.size || 11,
    color: options.color || C.ink,
    margin: 0,
    breakLine: false,
  });
}

function addMiniPhone(slide, imgPath, x, y, label, options = {}) {
  const w = options.w || 2.32;
  const h = options.h || 4.08;
  addCard(slide, x, y, w, h, {
    fill: C.card,
    line: options.line || C.line,
  });
  slide.addImage({
    path: imgPath,
    x: x + 0.08,
    y: y + 0.08,
    w: w - 0.16,
    h: h - 0.54,
    sizing: {
      type: "contain",
      w: w - 0.16,
      h: h - 0.54,
    },
  });
  slide.addText(label, {
    x,
    y: y + h - 0.37,
    w,
    h: 0.16,
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

function makeDeck() {
  ensureDirs();
  runAssetPrep();

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "OpenAI Codex";
  pptx.company = "Memoseal";
  pptx.subject = "印迹 Memoseal 用户价值版 尾页优化版";
  pptx.title = "印迹 Memoseal 用户价值版 尾页优化版";
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: FONT.title,
    bodyFontFace: FONT.body,
    lang: "zh-CN",
  };

  // Slide 1
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 1, "USER VALUE DECK");
    addPill(slide, "旅行记忆与表达", 0.94, 1.06, 1.7, {
      fill: C.cardSoft,
      line: C.accentSoft2,
      color: C.accentDark,
      size: 8.6,
      fontFace: FONT.en,
    });
    addTitle(slide, "印迹 Memoseal", "把每一段旅行，盖成一枚能被保存、回看和分享的数字印章", {
      x: 0.92,
      y: 1.5,
      w: 5.55,
      size: 26,
      subW: 5.55,
    });

    slide.addText(
      "很多旅行最后只留下散落在相册里的照片。印迹想做的，是把那些容易散掉的瞬间重新组织起来，让地点、情绪和表达方式一起被留下，变成一份更完整的旅行记忆。",
      {
        x: 0.94,
        y: 2.95,
        w: 5.25,
        h: 1.18,
        fontFace: FONT.body,
        fontSize: 12,
        color: C.sub,
        margin: 0,
      },
    );

    addCard(slide, 0.94, 4.35, 5.15, 0.68, { fill: C.cardSoft });
    slide.addText("照片 → 印章 → 手帐页 → 足迹地图 → 回忆与分享", {
      x: 1.18,
      y: 4.59,
      w: 4.66,
      h: 0.14,
      fontFace: FONT.body,
      fontSize: 11,
      color: C.accentDark,
      bold: true,
      margin: 0,
      align: "center",
    });

    addPill(slide, "AI 印章生成", 0.95, 5.28, 1.45, {
      fill: C.card,
      line: C.line,
    });
    addPill(slide, "数字手帐编排", 2.52, 5.28, 1.62, {
      fill: C.card,
      line: C.line,
    });
    addPill(slide, "共享足迹地图", 4.27, 5.28, 1.62, {
      fill: C.card,
      line: C.line,
    });

    addCard(slide, 0.94, 6.02, 5.08, 0.72, { fill: C.cardSoft });
    slide.addText("当前阶段", {
      x: 1.18,
      y: 6.18,
      w: 0.7,
      h: 0.18,
      fontFace: FONT.en,
      fontSize: 8.5,
      color: C.sub,
      bold: true,
      charSpace: 1.2,
      margin: 0,
    });
    slide.addText("PoC 已验证，MVP 主流程已跑通", {
      x: 1.18,
      y: 6.41,
      w: 3.4,
      h: 0.24,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.ink,
      bold: true,
      margin: 0,
    });

    slide.addImage({
      path: IMG.coverBrand,
      x: 7.0,
      y: 0.96,
      w: 5.18,
      h: 1.98,
      sizing: { type: "contain", w: 5.18, h: 1.98 },
    });
    addCard(slide, 7.8, 2.55, 2.55, 4.32);
    slide.addImage({
      path: IMG.coverHome,
      x: 7.89,
      y: 2.64,
      w: 2.37,
      h: 4.14,
      sizing: { type: "contain", w: 2.37, h: 4.14 },
    });
    addCard(slide, 10.1, 3.22, 2.05, 1.78, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.preview,
      x: 10.2,
      y: 3.32,
      w: 1.86,
      h: 1.58,
      sizing: { type: "contain", w: 1.86, h: 1.58 },
    });
    addCard(slide, 10.02, 5.18, 2.18, 1.52, { fill: C.card });
    slide.addImage({
      path: IMG.notebooks,
      x: 10.14,
      y: 5.27,
      w: 1.96,
      h: 1.28,
      sizing: { type: "contain", w: 1.96, h: 1.28 },
    });

    slide.addNotes(
      remember(
        "Slide 1 封面与一句话价值",
        "30 秒",
        "这一页先回答“印迹为什么值得做”。它不是给照片加一层效果，而是想把一段旅行里真正值得留下的感觉，整理成一枚数字印章，再进一步沉淀为手帐页和足迹地图。它解决的不是好不好看，而是旅行结束以后，记忆还能不能被好好留住。",
      ),
    );
  }

  // Slide 2
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 2, "WHY IT MATTERS");
    addTitle(
      slide,
      "为什么这件产品有意义：旅行里最有感觉的东西，往往最难被好好留下",
      "今天最常见的几种保存方式，要么有仪式感但不易沉淀，要么容易发布却不够完整。",
      { w: 10.7, size: 22 },
    );

    const cards = [
      {
        x: 0.95,
        title: "线下集章",
        tag: "有仪式感 / 难整理",
        body: "盖章会让旅程更有参与感，但它常常停留在现场和纸本里，之后很少被系统整理和再次回看。",
        color: C.accent,
      },
      {
        x: 4.45,
        title: "手机相册",
        tag: "拍得很多 / 回看很少",
        body: "旅行会留下大量照片，但它们通常散在相册里，难以变成一段有结构、有故事的个人记忆。",
        color: C.gold,
      },
      {
        x: 7.95,
        title: "社交分享",
        tag: "容易发布 / 不够完整",
        body: "朋友圈或笔记更像即时表达，能分享片段，但不一定能长期保留地点、情绪和个人视角。",
        color: C.green,
      },
    ];

    cards.forEach((item, idx) => {
      addCard(slide, item.x, 2.18, 3.02, 2.95, { fill: C.card });
      slide.addShape("ellipse", {
        x: item.x + 0.25,
        y: 2.46,
        w: 0.46,
        h: 0.46,
        line: { color: item.color, transparency: 100 },
        fill: { color: item.color },
      });
      slide.addText(`0${idx + 1}`, {
        x: item.x + 0.25,
        y: 2.58,
        w: 0.46,
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
        y: 2.42,
        w: 1.5,
        h: 0.2,
        fontFace: FONT.body,
        fontSize: 15,
        color: C.ink,
        bold: true,
        margin: 0,
      });
      addPill(slide, item.tag, item.x + 0.25, 3.03, 1.5, {
        fill: C.cardSoft,
        line: C.line,
        color: C.sub,
        size: 8.5,
      });
      slide.addText(item.body, {
        x: item.x + 0.25,
        y: 3.55,
        w: 2.48,
        h: 1.06,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 0.95, 5.62, 11.4, 0.95, { fill: C.accentSoft });
    slide.addText("意义：把“拍过、走过、感受过”的碎片，整合成一条能长期保留、愿意回看的个人记忆链路。", {
      x: 1.25,
      y: 5.93,
      w: 10.8,
      h: 0.22,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.accentDark,
      bold: true,
      margin: 0,
      align: "center",
    });

    slide.addNotes(
      remember(
        "Slide 2 问题与机会",
        "30 秒",
        "这一页讲的是普通用户真正遇到的问题。线下集章很有仪式感，但很难被再次整理；手机里照片很多，但很少真的回看；社交平台方便发布，却不一定能完整保留当时的地点、情绪和个人视角。印迹的意义，就是把这些分散的保存方式重新串起来。",
      ),
    );
  }

  // Slide 3
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 3, "PRODUCT");
    addTitle(
      slide,
      "印迹把旅行照片加工成可被收藏、可被传播、可被再次编辑的内容单元",
      "核心链路是：照片 → 印章 → 手帐页 → 足迹地图 → 共享内容。",
      { w: 10.4, size: 22 },
    );

    addCard(slide, 0.95, 1.78, 11.4, 0.68, { fill: C.cardSoft });
    slide.addText("照片", {
      x: 1.4,
      y: 2.01,
      w: 0.5,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });
    slide.addText("→", {
      x: 2.15,
      y: 1.92,
      w: 0.3,
      h: 0.2,
      fontFace: FONT.en,
      fontSize: 18,
      color: C.sub,
      bold: true,
      margin: 0,
    });
    slide.addText("风格化印章", {
      x: 2.62,
      y: 2.01,
      w: 1.25,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });
    slide.addText("→", {
      x: 4.13,
      y: 1.92,
      w: 0.3,
      h: 0.2,
      fontFace: FONT.en,
      fontSize: 18,
      color: C.sub,
      bold: true,
      margin: 0,
    });
    slide.addText("数字手帐页", {
      x: 4.58,
      y: 2.01,
      w: 1.2,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });
    slide.addText("→", {
      x: 6.1,
      y: 1.92,
      w: 0.3,
      h: 0.2,
      fontFace: FONT.en,
      fontSize: 18,
      color: C.sub,
      bold: true,
      margin: 0,
    });
    slide.addText("足迹地图", {
      x: 6.56,
      y: 2.01,
      w: 0.95,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });
    slide.addText("→", {
      x: 7.78,
      y: 1.92,
      w: 0.3,
      h: 0.2,
      fontFace: FONT.en,
      fontSize: 18,
      color: C.sub,
      bold: true,
      margin: 0,
    });
    slide.addText("共享内容", {
      x: 8.24,
      y: 2.01,
      w: 0.95,
      h: 0.1,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });

    addMiniPhone(slide, IMG.homeUpload, 0.95, 2.78, "01 上传照片");
    addMiniPhone(slide, IMG.flowGenerate, 3.7, 2.78, "02 生成印章");
    addMiniPhone(slide, IMG.flowEditor, 6.45, 2.78, "03 编辑成页");
    addMiniPhone(slide, IMG.map, 9.2, 2.78, "04 落点地图", { line: C.accentSoft2 });

    slide.addNotes(
      remember(
        "Slide 3 产品方案",
        "35 秒",
        "产品方案非常直接。用户先上传旅行照片，AI 把这张照片提炼成一枚带风格的数字印章。接着，印章和地点、日期、文案一起被排进一页数字手帐。每次创作完成后，内容自动落到地图上，成为一条可回顾、可分享、可再编辑的足迹。也就是说，印迹不是停在“生成一张图”，而是把一张图变成完整的内容单元。",
      ),
    );
  }

  // Slide 4
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 4, "EXECUTION / TECH READINESS");
    addTitle(
      slide,
      "主流程已经在本地全栈跑通，底层技术链路也足够支撑下一阶段验证",
      "当前阶段应被定义为 PoC + 高保真 MVP：产品可演示，技术可复用，下一步重点是验证真实用户与场景。",
      { w: 10.95, size: 21.6 },
    );

    addCard(slide, 0.95, 1.88, 4.22, 4.92, { fill: C.card });
    addPill(slide, "PROOF OF EXECUTION", 1.18, 2.12, 1.75, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
      fontFace: FONT.en,
    });
    slide.addText("主流程已跑通", {
      x: 1.18,
      y: 2.55,
      w: 2.2,
      h: 0.24,
      fontFace: FONT.body,
      fontSize: 18,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    addBullet(slide, "后端 PoC 已支持 10 种风格、颜色 / 形状 / 纹理、透明 PNG、去背景与盲盒效果。", 1.18, 3.08, 3.45, { h: 0.68 });
    addBullet(slide, "相邻全栈项目已跑通“上传 → 生成 → 编辑 → 预览 → 保存 → 首页展示 → 地图展示”主链路。", 1.18, 3.92, 3.45, { h: 0.8 });
    addBullet(slide, "技术实现采用 React 前端 + FastAPI 后端，配合 GMI、rembg 与 SQLite 完成生成、编辑和持久化。", 1.18, 4.95, 3.34, { h: 0.78 });

    addMiniPhone(slide, IMG.coverHome, 5.7, 2.1, "首页入口", { w: 1.95, h: 3.55 });
    addMiniPhone(slide, IMG.homeList, 7.95, 1.9, "印迹列表", { w: 2.05, h: 3.78 });
    addMiniPhone(slide, IMG.map, 10.33, 2.15, "地图页", { w: 1.92, h: 3.48 });
    addCard(slide, 5.62, 5.9, 6.62, 0.8, { fill: C.cardSoft });
    addPill(slide, "React 18 + Vite", 5.82, 6.12, 1.55, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "FastAPI", 7.55, 6.12, 1.12, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "GMI + rembg", 8.86, 6.12, 1.35, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "SQLite 持久化", 10.38, 6.12, 1.55, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });

    slide.addNotes(
      remember(
        "Slide 4 当前进展与完成度",
        "35 秒",
        "这一页是为了建立可信度。项目不是只有概念稿。后端 PoC 已经支持多风格、多形状、多纹理和透明 PNG 输出；相邻全栈项目也已经把上传、生成、编辑、保存、首页展示和地图展示整条链路跑通。同时，技术实现采用 React 前端、FastAPI 后端，配合 GMI、rembg 和 SQLite 形成了可复用的基础链路。所以现在面对的问题，不是能不能做，而是怎么继续把它验证成真实产品。",
      ),
    );
  }

  // Slide 5
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 5, "USER VALUE");
    addTitle(
      slide,
      "这件产品对用户最直接的价值，是让旅行从“拍过”变成“留下过”",
      "它不只解决好不好看，而是解决记忆能不能被保存、整理和再次分享。",
      { w: 10.9, size: 22 },
    );

    const valueCards = [
      {
        x: 0.95,
        tone: C.accentSoft,
        code: "01",
        title: "留住体验",
        body: "把照片、地点、日期和一句话放在一起，回看时更容易想起当时的心情、现场感和旅程脉络。",
      },
      {
        x: 4.45,
        tone: C.cardSoft,
        code: "02",
        title: "降低表达门槛",
        body: "不需要会设计，也能把普通照片整理成一页更有风格、更像作品的旅行手帐内容。",
      },
      {
        x: 7.95,
        tone: "F4F0EA",
        code: "03",
        title: "形成可回看的旅程",
        body: "一次次生成的印迹会沉淀成集册和足迹地图，让旅行不是发完就结束，而是能持续回看。",
      },
    ];

    valueCards.forEach((item) => {
      addCard(slide, item.x, 2.12, 3.02, 3.18, { fill: item.tone });
      slide.addText(item.code, {
        x: item.x + 0.24,
        y: 2.38,
        w: 0.5,
        h: 0.2,
        fontFace: FONT.en,
        fontSize: 15,
        color: C.accent,
        bold: true,
        margin: 0,
      });
      slide.addText(item.title, {
        x: item.x + 0.24,
        y: 2.78,
        w: 2.4,
        h: 0.45,
        fontFace: FONT.body,
        fontSize: 15,
        color: C.ink,
        bold: true,
        margin: 0,
      });
      slide.addText(item.body, {
        x: item.x + 0.24,
        y: 3.55,
        w: 2.48,
        h: 1.2,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 0.95, 5.56, 11.43, 1.08, { fill: C.card });
    addCard(slide, 1.22, 5.72, 3.0, 0.76, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.preview,
      x: 1.36,
      y: 5.8,
      w: 2.72,
      h: 0.42,
      sizing: { type: "contain", w: 2.72, h: 0.42 },
    });
    slide.addText("成页预览", {
      x: 1.22,
      y: 6.27,
      w: 3.0,
      h: 0.12,
      fontFace: FONT.body,
      fontSize: 8.8,
      color: C.sub,
      bold: true,
      align: "center",
      margin: 0,
    });
    addCard(slide, 4.67, 5.72, 3.0, 0.76, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.homeList,
      x: 5.05,
      y: 5.78,
      w: 2.24,
      h: 0.42,
      sizing: { type: "contain", w: 2.24, h: 0.42 },
    });
    slide.addText("保存后的印迹列表", {
      x: 4.67,
      y: 6.27,
      w: 3.0,
      h: 0.12,
      fontFace: FONT.body,
      fontSize: 8.8,
      color: C.sub,
      bold: true,
      align: "center",
      margin: 0,
    });
    addCard(slide, 8.12, 5.72, 3.0, 0.76, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.notebooks,
      x: 8.26,
      y: 5.8,
      w: 2.72,
      h: 0.42,
      sizing: { type: "contain", w: 2.72, h: 0.42 },
    });
    slide.addText("沉淀成可回看的集册", {
      x: 8.12,
      y: 6.27,
      w: 3.0,
      h: 0.12,
      fontFace: FONT.body,
      fontSize: 8.8,
      color: C.sub,
      bold: true,
      align: "center",
      margin: 0,
    });

    addCard(slide, 0.95, 6.74, 11.43, 0.5, { fill: C.accentSoft });
    slide.addText("用户得到的不只是 1 张图，而是一种更完整的旅行回忆方式。", {
      x: 1.32,
      y: 6.89,
      w: 10.65,
      h: 0.14,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
      align: "center",
    });

    slide.addNotes(
      remember(
        "Slide 5 对用户的直接价值",
        "35 秒",
        "这一页不谈商业，而是直接回答用户能得到什么。第一，它能把地点、日期、图像和一句话放在一起，让一段旅行更容易被想起来。第二，它降低了表达门槛，不会设计的人也能做出像样的旅行手帐。第三，它让旅行内容从一次发完就结束，变成可以在集册和地图里继续回看的个人记忆。",
      ),
    );
  }

  // Slide 6
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 6, "PUBLIC SIGNALS");
    addTitle(
      slide,
      "公开资料里的几个观察，与印迹想解决的问题是对得上的",
      "这不是凭空想象出来的需求，而是已经存在于旅行行为里的三个信号。",
      { w: 10.75, size: 22 },
    );

    const cols = [
      {
        x: 0.95,
        tone: C.accentSoft,
        code: "澎湃 / 2024.03.16",
        title: "集章已经成为新的旅行仪式",
        body: "公开报道把集章描述成更完整、更有参与感的保留方式。它不只是打卡，还会让人更沉浸式地去了解城市。",
      },
      {
        x: 4.45,
        tone: "F2ECE5",
        code: "National Geographic / 2022.08.08",
        title: "记录能保留更真实的旅行感受",
        body: "与只发社交媒体相比，旅行日记更能留下时间、地点、气味和情绪，像给未来的自己留一份现场快照。",
      },
      {
        x: 7.95,
        tone: "F4F0EA",
        code: "El Periplo / 2014",
        title: "真实经历本身也能帮助别人",
        body: "旅行中的用户生成内容，不只是在表达自己，也能把基于亲身经验的建议和感受传递给其他旅行者。",
      },
    ];

    cols.forEach((item) => {
      addCard(slide, item.x, 2.12, 3.02, 3.3, { fill: item.tone });
      slide.addText(item.code, {
        x: item.x + 0.24,
        y: 2.38,
        w: 2.4,
        h: 0.2,
        fontFace: FONT.en,
        fontSize: 8.8,
        color: C.accent,
        bold: true,
        margin: 0,
      });
      slide.addText(item.title, {
        x: item.x + 0.24,
        y: 2.78,
        w: 2.4,
        h: 0.52,
        fontFace: FONT.body,
        fontSize: 14.5,
        color: C.ink,
        bold: true,
        margin: 0,
      });
      slide.addText(item.body, {
        x: item.x + 0.24,
        y: 3.55,
        w: 2.48,
        h: 1.32,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 0.95, 5.82, 11.43, 0.78, { fill: C.cardSoft });
    slide.addText("这几条公开观察最终都指向同一件事：用户并不缺照片，缺的是一种更有仪式感、更容易回看、也更愿意分享的旅行记录方式。", {
      x: 1.18,
      y: 6.08,
      w: 10.95,
      h: 0.22,
      fontFace: FONT.body,
      fontSize: 12,
      color: C.accentDark,
      bold: true,
      margin: 0,
      align: "center",
    });

    slide.addNotes(
      remember(
        "Slide 6 公开资料验证",
        "35 秒",
        "这一页用外部资料做验证。第一，关于集章，公开报道已经把它当成一种新的旅行仪式来看待。第二，关于记录，National Geographic 提到旅行日记比单纯发社交媒体更能留下真实体验。第三，关于分享，旅行相关的用户生成内容本身就能帮助别人获取基于真实经验的建议。也就是说，印迹想串起来的“仪式感、记录、分享”三件事，本来就真实存在。",
      ),
    );
  }

  // Slide 7
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 7, "ROADMAP / PRODUCT DIRECTION");
    addTitle(
      slide,
      "最后要验证的，不是功能能不能做，而是用户会不会把它变成一种记录习惯",
      "当用户愿意在旅途中多次留下印迹，并在旅行结束后回来整理它，产品价值才真正成立。",
      { w: 11.25, size: 20.8 },
    );

    addCard(slide, 0.95, 2.08, 11.43, 1.08, { fill: C.cardSoft });
    addPill(slide, "核心结论", 5.48, 2.3, 1.3, {
      fill: C.accentSoft,
      line: C.accentSoft2,
      color: C.accentDark,
      size: 8.5,
    });
    slide.addText("印迹想变成的不是一次性的生成工具，而是一种让旅行被重新整理、被再次回看的方式。", {
      x: 1.48,
      y: 2.62,
      w: 10.38,
      h: 0.26,
      fontFace: FONT.body,
      fontSize: 15,
      color: C.ink,
      bold: true,
      align: "center",
      margin: 0,
    });

    const verifyCards = [
      {
        x: 0.95,
        tone: C.accentSoft,
        code: "01",
        title: "旅途中会不会连续使用",
        body: "用户在一次旅行里，是否愿意不只生成一次，而是把多个地点和多个瞬间都留下来。",
      },
      {
        x: 4.45,
        tone: C.card,
        code: "02",
        title: "结束后会不会回来整理",
        body: "旅行结束以后，用户是否愿意补写文案、回看页面，并把印迹继续沉淀成自己的集册。",
      },
      {
        x: 7.95,
        tone: "F4F0EA",
        code: "03",
        title: "什么机制会推动再次记录",
        body: "模板、时间轴、分享卡或主题活动，哪些能力最能推动再次使用和再次分享。",
      },
    ];

    verifyCards.forEach((item) => {
      addCard(slide, item.x, 3.52, 3.02, 2.44, { fill: item.tone });
      slide.addText(item.code, {
        x: item.x + 0.24,
        y: 3.78,
        w: 0.45,
        h: 0.18,
        fontFace: FONT.en,
        fontSize: 15,
        color: C.accent,
        bold: true,
        margin: 0,
      });
      slide.addText(item.title, {
        x: item.x + 0.24,
        y: 4.17,
        w: 2.48,
        h: 0.44,
        fontFace: FONT.body,
        fontSize: 14.5,
        color: C.ink,
        bold: true,
        margin: 0,
      });
      slide.addText(item.body, {
        x: item.x + 0.24,
        y: 4.86,
        w: 2.48,
        h: 0.8,
        fontFace: FONT.body,
        fontSize: 10.8,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 0.95, 6.18, 11.43, 0.72, { fill: C.card });
    const roadmap = [
      {
        title: "近期",
        body: "打磨生成、集册和地图主链路",
      },
      {
        title: "中期",
        body: "补齐分享卡、模板和时间轴",
      },
      {
        title: "长期方向",
        body: "沉淀成个人旅行集册与地图档案",
      },
    ];
    const roadmapXs = [1.15, 4.9, 8.65];
    roadmap.forEach((item, idx) => {
      addCard(slide, roadmapXs[idx], 6.31, 2.95, 0.46, { fill: idx === 0 ? C.cardSoft : C.white });
      slide.addText(item.title, {
        x: roadmapXs[idx] + 0.16,
        y: 6.4,
        w: 0.72,
        h: 0.12,
        fontFace: FONT.body,
        fontSize: 9.5,
        color: C.accentDark,
        bold: true,
        margin: 0,
      });
      slide.addText(item.body, {
        x: roadmapXs[idx] + 0.68,
        y: 6.39,
        w: 2.05,
        h: 0.14,
        fontFace: FONT.body,
        fontSize: 8.8,
        color: C.sub,
        margin: 0,
      });
      if (idx < roadmap.length - 1) {
        slide.addText("→", {
          x: roadmapXs[idx] + 3.13,
          y: 6.37,
          w: 0.16,
          h: 0.14,
          fontFace: FONT.en,
          fontSize: 14,
          color: C.sub,
          bold: true,
          margin: 0,
          align: "center",
        });
      }
    });

    addCard(slide, 0.95, 7.0, 11.43, 0.34, { fill: C.accentSoft });
    slide.addText("真正值得追踪的信号只有一个：用户是否愿意在旅行结束后，再回来打开它。", {
      x: 1.15,
      y: 7.1,
      w: 11.0,
      h: 0.12,
      fontFace: FONT.body,
      fontSize: 11.4,
      color: C.accentDark,
      bold: true,
      align: "center",
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 7 路线图与验证重点",
        "40 秒",
        "这一页不用讲得太满，只要收住。先给出一句核心判断：印迹要验证的，不是功能能不能做，而是用户会不会把它当成一种旅行记录习惯。然后讲三个验证方向，分别是旅途中会不会连续使用、旅行后会不会回来整理，以及什么机制能推动再次记录。最后再落到一句话：如果用户旅行结束后还愿意回来打开它，产品价值就站住了。",
      ),
    );
  }

  // Appendix
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 8, "APPENDIX");
    addTitle(
      slide,
      "附录｜Web 手帐编辑器",
      "旅行结束后，Web 端更适合做更重的版式编辑，补足移动端轻创作之外的生产力场景。",
      { w: 9.2, size: 22 },
    );

    addCard(slide, 0.95, 2.02, 4.1, 4.72, { fill: C.card });
    slide.addText("为什么保留 Web 端", {
      x: 1.18,
      y: 2.38,
      w: 1.7,
      h: 0.2,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    addBullet(slide, "适合在旅程结束后做更精细的拖拽排版与内容整理。", 1.18, 3.0, 3.0, { h: 0.62 });
    addBullet(slide, "能承接长文本、更多页面和更完整的纪念册整理需求。", 1.18, 3.9, 3.0, { h: 0.62 });
    addBullet(slide, "主讲时可不展开，只在被追问“后续生产力场景”时使用。", 1.18, 4.8, 3.0, { h: 0.68 });

    addCard(slide, 5.35, 2.08, 6.99, 4.58, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.appendixEditor,
      x: 5.57,
      y: 2.32,
      w: 6.55,
      h: 4.1,
      sizing: { type: "contain", w: 6.55, h: 4.1 },
    });

    slide.addNotes(
      remember(
        "附录 Web 手帐编辑器",
        "20 秒，可选",
        "这一页是备选附录，不一定在 4 分钟主讲里使用。它主要回答一个问题：如果用户回到家以后，还想把旅行内容做得更完整怎么办。答案是用 Web 端承接更重度的编辑和排版，让移动端负责轻创作、Web 端负责深编辑，两者一起把旅行记忆沉淀得更完整。",
      ),
    );
  }

  return pptx.writeFile({ fileName: OUTPUT_PPTX, compression: true });
}

function writeNotes() {
  const lines = [
    "# 印迹 Memoseal 用户价值版尾页优化版讲稿",
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
}

function writeSources() {
  const lines = [
    "# 印迹 Memoseal 用户价值版参考来源",
    "",
    "以下来源用于第 6 页“公开资料验证”，页面中均为转述与归纳，不使用长段直接引用。",
    "",
    "1. 澎湃新闻《这种快乐谁懂啊！这届年轻人真的很有胜负欲……》",
    "   - 发布时间：2024-03-16",
    "   - 链接：https://www.thepaper.cn/newsDetail_forward_26706948",
    "   - 用途：支撑“集章已成为年轻人的新旅行仪式，并带来更强参与感与情绪价值”。",
    "",
    "2. National Geographic《Don’t rely on social media: Here’s why you should keep a travel journal》",
    "   - 发布时间：2022-08-08",
    "   - 链接：https://www.nationalgeographic.com/travel/article/dont-rely-on-social-media-heres-why-you-should-keep-a-travel-journal",
    "   - 用途：支撑“记录比单纯发社交媒体更能保留真实体验与回忆细节”。",
    "",
    "3. El Periplo Sustentable《Conceptualizing Empowerment in the context of User-Generated Content in the Travel Industry》",
    "   - 发表时间：2014 年第 27 期",
    "   - 链接：https://rperiplo.uaemex.mx/article/view/4951",
    "   - 用途：支撑“旅行中的用户生成内容具有表达与传递经验的价值”。",
    "",
    "4. 厦门兴起集章打卡游",
    "   - 发布时间：2024-07-19",
    "   - 链接：https://www.fj.chinanews.com.cn/news/2024/2024-07-19/550987.html",
    "   - 用途：辅助验证“集章打卡已成为具体城市旅行中的真实玩法”。",
  ];

  fs.writeFileSync(OUTPUT_SOURCES, lines.join("\n"), "utf8");
}

makeDeck()
  .then(() => {
    writeNotes();
    writeSources();
    console.log(`PPT 已生成：${OUTPUT_PPTX}`);
    console.log(`讲稿已生成：${OUTPUT_NOTES}`);
    console.log(`参考来源已生成：${OUTPUT_SOURCES}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
