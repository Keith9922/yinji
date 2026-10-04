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
  "印迹-Memoseal-4分钟投资人路演.pptx",
);
const OUTPUT_NOTES = path.join(
  DELIVERABLES_DIR,
  "印迹-Memoseal-4分钟投资人路演讲稿.md",
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
  pptx.subject = "印迹 Memoseal 4 分钟投资人路演";
  pptx.title = "印迹 Memoseal 4 分钟投资人路演";
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
    addTopChrome(slide, 1, "EARLY-STAGE INVESTOR EDITION");
    addTitle(slide, "印迹 Memoseal", "把每一段旅行，盖成一枚可收藏、可分享、可传播的数字印章", {
      x: 0.92,
      y: 1.15,
      w: 5.4,
      size: 26,
      subW: 5.5,
    });

    slide.addText(
      "我们不是在做一个单点图片特效工具，而是在把旅行记忆加工成可持续流动的内容单元：从照片出发，沉淀为印章、手帐页、足迹地图，再进入传播与消费场景。",
      {
        x: 0.94,
        y: 2.62,
        w: 5.15,
        h: 1.34,
        fontFace: FONT.body,
        fontSize: 12,
        color: C.sub,
        margin: 0,
      },
    );

    addPill(slide, "AI 印章生成", 0.95, 4.35, 1.45, {
      fill: C.card,
      line: C.line,
    });
    addPill(slide, "数字手帐编排", 2.52, 4.35, 1.62, {
      fill: C.card,
      line: C.line,
    });
    addPill(slide, "共享足迹地图", 4.27, 4.35, 1.62, {
      fill: C.card,
      line: C.line,
    });

    addCard(slide, 0.94, 5.18, 4.95, 1.05, { fill: C.cardSoft });
    slide.addText("当前阶段", {
      x: 1.18,
      y: 5.45,
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
      y: 5.72,
      w: 3.4,
      h: 0.24,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    slide.addText("现在要验证的不是“能不能做”，而是“能不能长成平台”。", {
      x: 1.18,
      y: 5.98,
      w: 3.35,
      h: 0.2,
      fontFace: FONT.body,
      fontSize: 10,
      color: C.sub,
      margin: 0,
    });

    slide.addImage({
      path: IMG.coverBrand,
      x: 7.05,
      y: 0.95,
      w: 5.28,
      h: 2.05,
      sizing: { type: "contain", w: 5.28, h: 2.05 },
    });
    addCard(slide, 8.25, 2.82, 2.42, 4.23);
    slide.addImage({
      path: IMG.coverHome,
      x: 8.33,
      y: 2.9,
      w: 2.26,
      h: 4.07,
      sizing: { type: "contain", w: 2.26, h: 4.07 },
    });
    addCard(slide, 10.32, 3.36, 1.85, 3.22, { fill: C.cardSoft });
    slide.addImage({
      path: IMG.homeList,
      x: 10.39,
      y: 3.43,
      w: 1.71,
      h: 3.05,
      sizing: { type: "contain", w: 1.71, h: 3.05 },
    });
    slide.addText("旅行记忆内容化入口", {
      x: 7.16,
      y: 6.55,
      w: 5,
      h: 0.18,
      fontFace: FONT.en,
      fontSize: 8.5,
      color: C.sub,
      align: "center",
      charSpace: 1.2,
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 1 封面与一句话价值",
        "30 秒",
        "这一页先回答“印迹是什么”。它不是给照片加滤镜，而是把一段旅行加工成一枚数字印章，再进一步进入手帐页、足迹地图和内容传播。现在项目已经完成 PoC 验证和 MVP 主流程打通，接下来要验证的是，它能不能从一个好看的创作工具，长成一个有商业闭环的旅行记忆平台。",
      ),
    );
  }

  // Slide 2
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 2, "PROBLEM / OPPORTUNITY");
    addTitle(
      slide,
      "传统集章有仪式感，但缺少流动性；旅行内容能传播，却缺少纪念形态",
      "机会不在于再做一个打卡工具，而在于把“值得留下来”的旅行记忆做成可以持续流通的内容单元。",
      { w: 10.7, size: 22 },
    );

    const cards = [
      {
        x: 0.95,
        title: "线下集章",
        tag: "强情绪 / 弱传播",
        body: "纸质印章很有纪念意义，但停留在个人手册里，难以再次被看到、分享和扩散。",
        color: C.accent,
      },
      {
        x: 4.45,
        title: "旅行照片",
        tag: "高频拍摄 / 低留存",
        body: "旅行中会产生大量照片，但很少被整理成能反复翻看、愿意分享的纪念内容。",
        color: C.gold,
      },
      {
        x: 7.95,
        title: "文旅传播",
        tag: "缺少真实游客视角",
        body: "景点介绍常常标准化，真正能打动人的，是游客亲身留下的内容和故事。",
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
    slide.addText("机会：把“景点打卡”升级成“旅行记忆内容化”，让纪念价值、传播价值和消费转化同时成立。", {
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
        "我们观察到三件事同时存在。第一，线下集章很有情绪价值，但传播性很弱。第二，旅行照片虽然拍得很多，却很少沉淀成愿意反复翻看的纪念内容。第三，文旅传播真正缺少的是游客自己的故事，而不是标准化介绍。所以印迹抓住的机会，不是做一个更方便的打卡，而是把旅行记忆做成能收藏、能分享、还能进一步转化的内容单元。",
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
    addTopChrome(slide, 4, "EXECUTION STATUS");
    addTitle(
      slide,
      "这不是概念图，主流程已经在本地全栈跑通",
      "当前阶段应被定义为 PoC + 高保真 MVP，而不是已经规模化上线的成熟产品。",
      { w: 10.3, size: 22 },
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
    addBullet(slide, "因此现在讨论的是产品化和验证路径，不是基础可行性。", 1.18, 4.88, 3.3, { h: 0.56 });
    addCard(slide, 1.18, 5.85, 3.55, 0.58, { fill: C.accentSoft });
    slide.addText("当前阶段：PoC 已验证 / MVP 主流程已跑通", {
      x: 1.36,
      y: 6.04,
      w: 3.2,
      h: 0.16,
      fontFace: FONT.body,
      fontSize: 10.5,
      color: C.accentDark,
      bold: true,
      margin: 0,
    });

    addMiniPhone(slide, IMG.coverHome, 5.7, 2.1, "首页入口", { w: 1.95, h: 3.55 });
    addMiniPhone(slide, IMG.homeList, 7.95, 1.9, "印迹列表", { w: 2.05, h: 3.78 });
    addMiniPhone(slide, IMG.map, 10.33, 2.15, "地图页", { w: 1.92, h: 3.48 });
    addPill(slide, "FastAPI + React + SQLite", 5.86, 6.02, 2.2, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "异步生成任务链路", 8.18, 6.02, 1.9, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "首页 / 地图数据持久化", 10.2, 6.02, 2.0, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });

    slide.addNotes(
      remember(
        "Slide 4 当前进展与完成度",
        "35 秒",
        "这一页是为了建立可信度。项目不是只有概念稿。后端 PoC 已经支持多风格、多形状、多纹理和透明 PNG 输出；相邻全栈项目也已经把上传、生成、编辑、保存、首页展示和地图展示整条链路跑通。所以我们现在面对的问题，不是‘这个产品能不能做出来’，而是‘这条产品链路能不能被真实用户使用，并形成传播和合作价值’。",
      ),
    );
  }

  // Slide 5
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 5, "BUSINESS LOOP");
    addTitle(
      slide,
      "印迹不是只卖生成次数，而是具备从内容到消费的延展路径",
      "先形成内容，再形成传播，再进入消费与合作，这是它和普通工具型产品最大的区别。",
      { w: 10.6, size: 22 },
    );

    addCard(slide, 0.95, 2.1, 3.7, 3.75);
    slide.addText("C 端收入方向", {
      x: 1.18,
      y: 2.42,
      w: 1.6,
      h: 0.2,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    addBullet(slide, "高级模板、字体、导出能力和更完整的手帐创作工具。", 1.18, 3.0, 2.95, { h: 0.62 });
    addBullet(slide, "电子印章向贴纸、明信片、徽章、定制橡皮章等实体周边转化。", 1.18, 3.86, 2.95, { h: 0.74 });
    addBullet(slide, "创作者上传印章模板或样式，形成模板交易与激励生态。", 1.18, 4.88, 2.95, { h: 0.64 });

    addCard(slide, 4.98, 2.12, 3.38, 3.72, { fill: C.cardSoft });
    addPill(slide, "内容循环", 5.93, 2.38, 1.45, {
      fill: C.accentSoft,
      line: C.accentSoft2,
      color: C.accentDark,
      size: 9,
    });
    const loopItems = ["生成印迹", "沉淀地图内容", "触发浏览 / 种草", "进入合作与消费"];
    loopItems.forEach((text, idx) => {
      addCard(slide, 5.52, 2.88 + idx * 0.63, 2.28, 0.44, {
        fill: idx === 0 ? C.card : C.white,
      });
      slide.addText(text, {
        x: 5.52,
        y: 3.03 + idx * 0.63,
        w: 2.28,
        h: 0.1,
        fontFace: FONT.body,
        fontSize: 10.5,
        color: idx === 0 ? C.accentDark : C.ink,
        bold: true,
        align: "center",
        margin: 0,
      });
      if (idx < loopItems.length - 1) {
        slide.addText("↓", {
          x: 6.59,
          y: 3.31 + idx * 0.63,
          w: 0.15,
          h: 0.12,
          fontFace: FONT.en,
          fontSize: 14,
          color: C.sub,
          bold: true,
          margin: 0,
          align: "center",
        });
      }
    });

    addCard(slide, 8.68, 2.1, 3.7, 3.75);
    slide.addText("B 端合作方向", {
      x: 8.93,
      y: 2.42,
      w: 1.65,
      h: 0.2,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    addBullet(slide, "景区 / 文旅局发起数字集章活动，把平台变成线上互动载体。", 8.93, 3.0, 2.9, { h: 0.7 });
    addBullet(slide, "线下商家发布专属印章样式，用户到店打卡生成并收集。", 8.93, 3.95, 2.9, { h: 0.68 });
    addBullet(slide, "平台沉淀的真实游客足迹与内容，可反向服务目的地传播。", 8.93, 4.94, 2.9, { h: 0.64 });

    addCard(slide, 0.95, 6.1, 11.43, 0.62, { fill: C.accentSoft });
    slide.addText("平台真正积累的不是单纯图片，而是“地点 + 记忆 + 审美表达”的内容资产。", {
      x: 1.32,
      y: 6.31,
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
        "Slide 5 商业化闭环",
        "35 秒",
        "印迹的商业化不应该只停留在按次生成收费。更合理的路径是，先把旅行内容做出来，再把内容带入消费。C 端可以承接高级模板、导出和实体周边，B 端可以承接景区数字集章、商家打卡合作和目的地传播内容供给。它的关键不是‘卖一张图’，而是持续积累地点、记忆和审美表达叠加在一起的内容资产。",
      ),
    );
  }

  // Slide 6
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 6, "WHY NOW");
    addTitle(
      slide,
      "为什么是现在，为什么这件事值得继续投",
      "AI 能力、用户文化和已有执行基础，在这个时间点叠到了一起。",
      { w: 9.6, size: 22 },
    );

    const cols = [
      {
        x: 0.95,
        tone: C.accentSoft,
        code: "01",
        title: "AI 生成已足够成熟",
        body: "风格化生成、去背景、轻量后处理与异步任务链路已经能稳定支撑 MVP 体验。",
      },
      {
        x: 4.45,
        tone: "F2ECE5",
        code: "02",
        title: "集章文化自带情绪基础",
        body: "集章、手帐、旅行分享本来就是天然相连的行为，产品不是在创造需求，而是在重组表达方式。",
      },
      {
        x: 7.95,
        tone: "F4F0EA",
        code: "03",
        title: "项目已完成主链路验证",
        body: "从原型、后端生成到首页与地图展示都已有实现基础，进入的是产品验证阶段，而非技术探索阶段。",
      },
    ];

    cols.forEach((item) => {
      addCard(slide, item.x, 2.12, 3.02, 3.12, { fill: item.tone });
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
        h: 1.15,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 0.95, 5.75, 11.43, 0.84, { fill: C.card });
    addPill(slide, "原型与视觉语言已形成", 1.2, 6.0, 2.05, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "后端生成能力可复用", 3.45, 6.0, 2.0, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "首页 / 地图链路已打通", 5.66, 6.0, 2.06, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "早期产品定位清晰", 7.94, 6.0, 1.78, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });
    addPill(slide, "验证目标可拆解", 9.9, 6.0, 1.92, {
      fill: C.cardSoft,
      line: C.line,
      color: C.sub,
      size: 8.5,
    });

    slide.addNotes(
      remember(
        "Slide 6 为什么是现在",
        "30 秒",
        "我们认为现在值得继续投，原因有三个。第一，AI 生成和轻量后处理已经足够成熟，不需要再等待技术窗口。第二，集章文化、手帐表达和旅行分享天然可以叠加，这不是生造需求。第三，项目已经完成了从原型到主流程的初步执行，所以现在进入的是产品验证和场景验证，而不是单纯的技术实验。",
      ),
    );
  }

  // Slide 7
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addTopChrome(slide, 7, "ROADMAP / ASK");
    addTitle(
      slide,
      "下一步不是继续做 Demo，而是验证“内容传播 + 场景合作”的真实转化",
      "路线图会围绕移动端体验、传播工具和场景试点三件事展开。",
      { w: 10.9, size: 21.5 },
    );

    addCard(slide, 0.95, 2.02, 7.12, 4.72);
    slide.addShape("line", {
      x: 1.5,
      y: 2.66,
      w: 0,
      h: 3.26,
      line: { color: C.accentSoft2, pt: 1.4 },
    });

    const roadmap = [
      {
        y: 2.46,
        title: "近期",
        body: "完善移动端生成、集册和地图核心体验，让主链路更稳定、更顺滑。",
      },
      {
        y: 3.62,
        title: "中期",
        body: "上线分享卡、模板、时间轴等传播工具，提升留存与二次分享动力。",
      },
      {
        y: 4.78,
        title: "验证方向",
        body: "寻找文旅试点、线下商家合作与种子用户冷启动，验证内容到场景的闭环。",
      },
    ];
    roadmap.forEach((item) => {
      slide.addShape("ellipse", {
        x: 1.34,
        y: item.y + 0.06,
        w: 0.32,
        h: 0.32,
        line: { color: C.accent, transparency: 100 },
        fill: { color: C.accent },
      });
      slide.addText(item.title, {
        x: 1.95,
        y: item.y,
        w: 1.0,
        h: 0.18,
        fontFace: FONT.body,
        fontSize: 15,
        color: C.ink,
        bold: true,
        margin: 0,
      });
      slide.addText(item.body, {
        x: 3.0,
        y: item.y,
        w: 3.75,
        h: 0.52,
        fontFace: FONT.body,
        fontSize: 11,
        color: C.sub,
        margin: 0,
      });
    });

    addCard(slide, 8.45, 2.02, 3.93, 4.12, { fill: C.cardSoft });
    addPill(slide, "本轮诉求", 9.55, 2.32, 1.05, {
      fill: C.accentSoft,
      line: C.accentSoft2,
      color: C.accentDark,
      size: 8.5,
    });
    addBullet(slide, "打磨移动端核心体验，减少从上传到保存的流失。", 8.82, 2.92, 2.8, { h: 0.62 });
    addBullet(slide, "启动内容冷启动，找到愿意持续留下印迹的种子用户。", 8.82, 3.78, 2.8, { h: 0.68 });
    addBullet(slide, "拿下文旅或商家试点，验证场景合作是否真实成立。", 8.82, 4.74, 2.8, { h: 0.62 });

    addCard(slide, 0.95, 6.28, 11.43, 0.58, { fill: C.accentSoft });
    slide.addText("寻找早期资金与场景合作资源，用于移动端产品打磨、内容冷启动和文旅试点验证。", {
      x: 1.15,
      y: 6.47,
      w: 11.0,
      h: 0.16,
      fontFace: FONT.body,
      fontSize: 12.5,
      color: C.accentDark,
      bold: true,
      align: "center",
      margin: 0,
    });

    slide.addNotes(
      remember(
        "Slide 7 路线图与本轮诉求",
        "40 秒",
        "最后一页讲清楚下一步做什么。我们不会继续停留在做更多 demo，而是进入真实验证阶段。近期先把移动端生成、集册和地图体验做扎实，中期补齐分享卡、模板和时间轴，真正要验证的是能不能跑出种子用户与场景合作。我们本轮需要的，不只是早期资金，也包括文旅和线下商家合作资源，用来验证从内容传播到场景转化的闭环。",
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
    "# 印迹 Memoseal 4 分钟投资人路演讲稿",
    "",
    "总时长建议：约 3 分 55 秒，附录不计入主讲时长。",
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

makeDeck()
  .then(() => {
    writeNotes();
    console.log(`PPT 已生成：${OUTPUT_PPTX}`);
    console.log(`讲稿已生成：${OUTPUT_NOTES}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
