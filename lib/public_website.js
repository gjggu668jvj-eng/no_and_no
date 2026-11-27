// ══════════════════════════════════════════════════════════════
// 🎐 NO & NO • TOKIBOT STYLE OFFICIAL WEB PLATFORM
// ══════════════════════════════════════════════════════════════

import config from '../config.js';
import { tokiCommands } from './toki_commands_data.js';

export function renderPublicHtml() {
  const categoriesJson = JSON.stringify(tokiCommands.categories);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark" data-bg="space">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NO &amp; NO • 𝑻𝑶𝑲𝑰 𝑩𝑶𝑻 🎐</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #e8eef8;
      --ink2: #a8b5cc;
      --cloud: #141c2b;
      --card: rgba(20, 28, 43, 0.92);
      --card-hover: rgba(26, 37, 57, 0.98);
      --sky: #1e2a3e;
      --mint: #4fd1b0;
      --mint-d: #3fb89f;
      --mint-glow: rgba(79, 209, 176, 0.35);
      --lav: #8b80d9;
      --peach: #d89978;
      --butter: #d4c078;
      --rose: #d488a6;
      --ok: #5cd9a8;
      --bad: #f47a7a;
      --line: rgba(232, 238, 248, 0.12);
      --lift: 0 8px 32px rgba(0, 0, 0, 0.45);
      --bg-dim: 0.55;
      --page-bg: #070c15;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Baloo Bhaijaan 2', 'Cairo', system-ui, sans-serif;
      background: var(--page-bg);
      color: var(--ink);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* خلفية الفضاء والضباب الشبيهة بـ TokiBot */
    .bg-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      background: radial-gradient(circle at 50% 10%, #1e293b 0%, #070c15 80%);
      background-size: cover;
      background-position: center;
      opacity: 0.95;
      pointer-events: none;
    }

    .container {
      position: relative;
      z-index: 2;
      max-width: 980px;
      margin: 0 auto;
      padding: 24px 18px 80px 18px;
    }

    /* الشريط العلوي الهيدر */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      backdrop-filter: blur(14px);
      box-shadow: var(--lift);
      margin-bottom: 24px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 800;
      color: #fff;
    }
    .brand-badge {
      font-size: 11px;
      padding: 3px 10px;
      background: rgba(79, 209, 176, 0.15);
      border: 1px solid var(--mint);
      color: var(--mint);
      border-radius: 20px;
      font-weight: 700;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-chip {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--line);
      color: var(--ink);
      padding: 7px 14px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s;
      font-family: inherit;
    }
    .btn-chip:hover {
      background: rgba(79, 209, 176, 0.2);
      border-color: var(--mint);
      color: #fff;
    }

    /* التابات الرئيسية للتنقل السريع */
    .nav-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 24px;
    }
    .nav-tab-btn {
      flex: 1;
      min-width: 130px;
      padding: 12px 14px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      color: var(--ink2);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      transition: all 0.25s;
      font-family: inherit;
    }
    .nav-tab-btn.active {
      background: linear-gradient(135deg, rgba(79, 209, 176, 0.22), rgba(79, 209, 176, 0.08));
      border-color: var(--mint);
      color: #fff;
      box-shadow: 0 4px 20px var(--mint-glow);
    }

    /* قسم الهيرو والمعلومات الترحيبية */
    .hero-card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      backdrop-filter: blur(16px);
      box-shadow: var(--lift);
      margin-bottom: 24px;
    }
    .hero-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid var(--mint);
      box-shadow: 0 0 25px var(--mint-glow);
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      background: rgba(79, 209, 176, 0.1);
    }
    .hero-title {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff 0%, var(--mint) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-sub {
      font-size: 14px;
      color: var(--ink2);
      max-width: 580px;
      margin: 0 auto 20px auto;
      line-height: 1.7;
    }
    .metrics-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .metric-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--line);
      padding: 8px 16px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 700;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      background: var(--ok);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--ok);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.7; } }

    /* شبكة أقسام الأوامر بستايل كروت TokiBot الملونة */
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .cat-tile {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 18px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .cat-tile::before {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0;
      width: 4px;
      background: var(--accent-c, var(--mint));
    }
    .cat-tile:hover {
      transform: translateY(-3px);
      background: var(--card-hover);
      border-color: var(--accent-c, var(--mint));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .cat-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-emoji {
      font-size: 26px;
    }
    .cat-name {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
    }
    .cat-count {
      font-size: 12px;
      color: var(--ink2);
    }
    .cat-arrow {
      font-size: 18px;
      color: var(--ink2);
      transition: transform 0.2s;
    }
    .cat-tile:hover .cat-arrow {
      transform: translateX(-4px);
      color: #fff;
    }

    /* منطقة استعراض الأوامر التفاعلية */
    .cmds-container {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 24px;
      backdrop-filter: blur(16px);
      box-shadow: var(--lift);
      margin-bottom: 24px;
    }
    .search-box {
      width: 100%;
      padding: 14px 20px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--line);
      border-radius: 16px;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      margin-bottom: 20px;
      transition: all 0.25s;
    }
    .search-box:focus {
      border-color: var(--mint);
      box-shadow: 0 0 0 3px var(--mint-glow);
    }
    .cmd-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.25s;
    }
    .cmd-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(79, 209, 176, 0.4);
    }
    .cmd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .cmd-name {
      font-family: 'Inter', monospace;
      font-size: 16px;
      font-weight: 800;
      color: var(--mint);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cmd-tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 700;
    }
    .tag-owner { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid #f59e0b; }
    .tag-admin { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid #f43f5e; }
    .tag-group { background: rgba(79, 209, 176, 0.15); color: var(--mint); border: 1px solid var(--mint); }
    .cmd-actions {
      display: flex;
      gap: 8px;
    }
    .btn-cmd {
      padding: 5px 12px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--ink);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-cmd:hover {
      background: var(--mint);
      border-color: var(--mint);
      color: #070c15;
    }
    .cmd-desc {
      font-size: 13px;
      color: var(--ink2);
      line-height: 1.5;
    }
    .cmd-accordion {
      display: none;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--line);
      font-size: 12px;
      color: var(--ink2);
    }
    .cmd-accordion.open {
      display: block;
      animation: fadeIn 0.25s ease;
    }

    /* كارت كود الربط السريع (Pairing Code) */
    .pair-card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 32px 24px;
      backdrop-filter: blur(16px);
      box-shadow: var(--lift);
      text-align: center;
      margin-bottom: 24px;
    }
    .pair-input-group {
      display: flex;
      gap: 12px;
      max-width: 480px;
      margin: 20px auto;
    }
    .pair-input {
      flex: 1;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--line);
      border-radius: 16px;
      color: #fff;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      text-align: center;
      letter-spacing: 1px;
    }
    .pair-input:focus {
      border-color: var(--mint);
      box-shadow: 0 0 0 3px var(--mint-glow);
    }
    .btn-pair {
      padding: 14px 24px;
      background: linear-gradient(135deg, var(--mint), var(--mint-d));
      border: none;
      border-radius: 16px;
      color: #070c15;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.25s;
    }
    .btn-pair:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--mint-glow);
    }
    .pair-code-box {
      display: none;
      margin-top: 24px;
      padding: 20px;
      background: rgba(79, 209, 176, 0.08);
      border: 2px dashed var(--mint);
      border-radius: 20px;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
    }
    .pair-code-digits {
      font-family: 'Inter', monospace;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 6px;
      color: #fff;
      margin: 10px 0;
    }

    /* الشات الجماعي المباشر للويب (Community Group Chat) */
    .chat-box-card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 20px;
      backdrop-filter: blur(16px);
      box-shadow: var(--lift);
      margin-bottom: 24px;
    }
    .chat-messages {
      height: 380px;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 16px;
      margin-bottom: 16px;
    }
    .chat-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
    }
    .chat-msg.mine {
      align-self: flex-start;
      background: rgba(79, 209, 176, 0.2);
      border: 1px solid var(--mint);
      color: #fff;
    }
    .chat-msg.other {
      align-self: flex-end;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--line);
      color: var(--ink);
    }
    .chat-sender {
      font-size: 11px;
      font-weight: 800;
      color: var(--mint);
      margin-bottom: 3px;
    }
    .chat-form {
      display: flex;
      gap: 10px;
    }

    /* الإشعار العائم Toast */
    .toast-box {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--cloud);
      border: 1px solid var(--mint);
      color: #fff;
      padding: 12px 24px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      font-weight: 700;
      font-size: 14px;
      z-index: 99999;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toast-box.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 600px) {
      .top-bar { flex-direction: column; gap: 12px; }
      .pair-input-group { flex-direction: column; }
      .tiles-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="bg-canvas"></div>

  <div class="container">
    <!-- الشريط العلوي -->
    <header class="top-bar">
      <div class="brand-title">
        <span>🎐</span>
        <span>NO &amp; NO BOT</span>
        <span class="brand-badge">⚡ V4 TOKI EDITION</span>
      </div>
      <div class="top-actions">
        <button class="btn-chip" id="soundToggleBtn" onclick="toggleSound()">
          <span id="soundIcon">🔊</span>
          <span id="soundLabel">صوت النقر: شغّال</span>
        </button>
        <a href="${config.channelLink || 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12'}" target="_blank" class="btn-chip" style="text-decoration: none;">
          <span>📢</span>
          <span>القناة الرسمية</span>
        </a>
      </div>
    </header>

    <!-- أزرار التبويب السريع -->
    <nav class="nav-tabs">
      <button class="nav-tab-btn active" onclick="switchView('hero')">🏠 الرئيسية</button>
      <button class="nav-tab-btn" onclick="switchView('cmds')">📜 دليل الأوامر (190)</button>
      <button class="nav-tab-btn" onclick="switchView('pair')">⚡ ربط بوت واتساب</button>
      <button class="nav-tab-btn" onclick="switchView('chat')">👥 الشات الجماعي</button>
      <button class="nav-tab-btn" onclick="switchView('contact')">📩 الدعم والشكاوى</button>
    </nav>

    <!-- 1. الرئيسية والهيرو -->
    <section id="view-hero">
      <div class="hero-card">
        <div class="hero-avatar">🎐</div>
        <h1 class="hero-title">NO &amp; NO • 𝑻𝑶𝑲𝑰 𝑩𝑶𝑻</h1>
        <p class="hero-sub">المنصة الشاملة لتنصيب وإدارة بوتات الواتساب فائقة السرعة. تدعم الذكاء الاصطناعي، التحميل المباشر، حماية المجموعات، بنك واقتصاد تفاعلي، والألعاب الجماعية.</p>
        <div class="metrics-bar">
          <div class="metric-badge">
            <span class="pulse-dot"></span>
            <span>120 بوت نشط متصل</span>
          </div>
          <div class="metric-badge">
            <span>📦</span>
            <span>190 أمر احترافي</span>
          </div>
          <div class="metric-badge">
            <span>⚡</span>
            <span>استجابة فائقة 15ms</span>
          </div>
          <div class="metric-badge">
            <span>👑</span>
            <span>المطور: no and no</span>
          </div>
        </div>
      </div>

      <!-- الأقسام الرئيسية السريعة -->
      <div class="tiles-grid" id="tilesContainer"></div>
    </section>

    <!-- 2. دليل الأوامر التفاعلي -->
    <section id="view-cmds" style="display: none;">
      <div class="cmds-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 22px; font-weight: 800; color: #fff;">📜 بنك الأوامر التفاعلي (190 أمر)</h2>
          <span style="font-size: 13px; color: var(--mint);">اضغط نسخ أو شرح لأي أمر</span>
        </div>
        <input type="text" class="search-box" id="cmdSearchInput" placeholder="🔍 ابحث في 190 أمر بالاسم أو الوصف (مثال: اغنيه، تيك، طرد، بنك، بولينيشن)..." oninput="filterCommands()">
        <div id="cmdListContainer"></div>
      </div>
    </section>

    <!-- 3. كارت استخراج كود الربط الفوري -->
    <section id="view-pair" style="display: none;">
      <div class="pair-card">
        <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
        <h2 style="font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 8px;">ربط بوت واتساب جديد (Pairing Code)</h2>
        <p style="font-size: 14px; color: var(--ink2); max-width: 500px; margin: 0 auto;">أدخل رقم هاتفك مع رمز الدولة وسيظهر لك كود الربط المكون من 8 أرقام فوراً لربطه في تطبيق واتساب مباشرة بدون الحاجة لمسح باركود.</p>
        <div class="pair-input-group">
          <input type="tel" id="pairPhoneInput" class="pair-input" placeholder="201012345678 (مع كود الدولة)">
          <button class="btn-pair" onclick="requestPairCode()">طلب كود الربط ⚡</button>
        </div>
        <div id="pairResultBox" class="pair-code-box">
          <div style="font-size: 13px; color: var(--ink2);">كود الربط الخاص برقمك:</div>
          <div class="pair-code-digits" id="pairCodeDisplay">--------</div>
          <div style="font-size: 12px; color: var(--mint); margin-bottom: 14px;">⏱️ ينتهي الكود خلال <span id="pairCountdown">120</span> ثانية</div>
          <button class="btn-cmd" style="padding: 8px 18px; font-size: 13px;" onclick="copyPairCode()">📋 نسخ كود الربط</button>
        </div>
      </div>
    </section>

    <!-- 4. الشات الجماعي المباشر -->
    <section id="view-chat" style="display: none;">
      <div class="chat-box-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff;">👥 الشات الجماعي المباشر</h2>
            <div style="font-size: 12px; color: var(--mint);">● شات مجتمع NO &amp; NO مفتوح للجميع</div>
          </div>
          <button class="btn-chip" onclick="loadGroupChat()">🔄 تحديث</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg other">
            <div class="chat-sender">🤖 نظام NO &amp; NO</div>
            <div>مرحباً بكم جميعاً في الشات المباشر لمنصة NO &amp; NO! يمكنكم كتابة رسائلكم ومشاركة تجاربكم هنا بكل حرية.</div>
          </div>
        </div>
        <form class="chat-form" onsubmit="sendGroupChat(event)">
          <input type="text" id="chatSenderInput" placeholder="اسمك..." style="width: 130px; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 14px; color: #fff; font-family: inherit;">
          <input type="text" id="chatTextInput" placeholder="اكتب رسالتك للجميع..." style="flex: 1; padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 14px; color: #fff; font-family: inherit;" required>
          <button type="submit" class="btn-pair" style="padding: 12px 20px;">إرسال 🚀</button>
        </form>
      </div>
    </section>

    <!-- 5. الدعم والشكاوى -->
    <section id="view-contact" style="display: none;">
      <div class="hero-card" style="text-align: right; max-width: 650px; margin: 0 auto;">
        <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px;">📩 التواصل المباشر ونظام الشكاوى</h2>
        <p style="font-size: 14px; color: var(--ink2); margin-bottom: 20px;">اكتب رسالتك أو اقتراحك وستصل إلى المطور الأساسي فوراً على لوحة التحكم وشات الواتساب.</p>
        <form onsubmit="submitContact(event)" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; color: var(--ink2); display: block; margin-bottom: 4px;">الاسم الكريم:</label>
            <input type="text" id="contactName" placeholder="اسمك..." style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 14px; color: #fff; font-family: inherit;" required>
          </div>
          <div>
            <label style="font-size: 12px; color: var(--ink2); display: block; margin-bottom: 4px;">رقم الهاتف (اختياري للرد عليك):</label>
            <input type="tel" id="contactPhone" placeholder="01012345678" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 14px; color: #fff; font-family: inherit;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--ink2); display: block; margin-bottom: 4px;">نص الرسالة أو الشكوى:</label>
            <textarea id="contactMsg" rows="4" placeholder="اكتب كل ما يدور في بالك..." style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 14px; color: #fff; font-family: inherit;" required></textarea>
          </div>
          <button type="submit" class="btn-pair" style="width: 100%; padding: 14px;">إرسال إلى المطور مباشرة 🚀</button>
        </form>
      </div>
    </section>
  </div>

  <!-- صندوق Toast العائم -->
  <div id="toastBox" class="toast-box">
    <span>✅</span>
    <span id="toastMsg">تم النسخ بنجاح!</span>
  </div>

  <script>
    // بنك أوامر TokiBot الكامل
    const CATEGORIES = ${categoriesJson};
    const CAT_COLORS = ["#bfe0f7", "#ffdccb", "#a6efc0", "#f8cfe0", "#d3ccf7", "#fbeeb4", "#b9f0e3", "#cfe0ff"];
    let soundEnabled = true;

    // تشغيل صوت النقر التفاعلي
    function playClick() {
      if (!soundEnabled) return;
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.25;
        audio.play().catch(()=>{});
      } catch {}
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('soundIcon').innerText = soundEnabled ? '🔊' : '🔇';
      document.getElementById('soundLabel').innerText = soundEnabled ? 'صوت النقر: شغّال' : 'صوت النقر: مكتوم';
      showToast(soundEnabled ? 'تم تفعيل صوت النقر' : 'تم كتم صوت النقر');
    }

    function showToast(msg) {
      const tb = document.getElementById('toastBox');
      const tm = document.getElementById('toastMsg');
      tm.innerText = msg;
      tb.classList.add('show');
      setTimeout(() => tb.classList.remove('show'), 2200);
    }

    function copyText(txt) {
      playClick();
      navigator.clipboard.writeText(txt).then(() => {
        showToast('تم نسخ: ' + txt);
      });
    }

    // تبديل الواجهات
    function switchView(viewId) {
      playClick();
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('section[id^="view-"]').forEach(s => s.style.display = 'none');

      const target = document.getElementById('view-' + viewId);
      if (target) target.style.display = 'block';

      // تفعيل الزر المناسب
      const btn = Array.from(document.querySelectorAll('.nav-tab-btn')).find(b => (b.getAttribute('onclick')||'').includes(viewId));
      if (btn) btn.classList.add('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // رسم كروت الأقسام (Tiles) في الصفحة الرئيسية
    function renderTiles() {
      const container = document.getElementById('tilesContainer');
      container.innerHTML = CATEGORIES.map((cat, idx) => {
        const color = CAT_COLORS[idx % CAT_COLORS.length];
        const cmdCount = cat.cmds ? cat.cmds.length : 0;
        return '<div class="cat-tile" style="--accent-c: ' + color + '" onclick="openCategory(\\'' + cat.key + '\\')">' +
          '<div class="cat-info">' +
            '<span class="cat-emoji">' + cat.emoji + '</span>' +
            '<div>' +
              '<div class="cat-name">' + cat.name + '</div>' +
              '<div class="cat-count">' + cmdCount + ' أمر متاح</div>' +
            '</div>' +
          '</div>' +
          '<span class="cat-arrow">‹</span>' +
        '</div>';
      }).join('');
    }

    // فتح قسم محدد في دليل الأوامر
    function openCategory(key) {
      playClick();
      switchView('cmds');
      const cat = CATEGORIES.find(c => c.key === key);
      if (cat) {
        document.getElementById('cmdSearchInput').value = cat.name;
        filterCommands();
      }
    }

    // عرض وتصفية الأوامر
    function filterCommands() {
      const q = (document.getElementById('cmdSearchInput').value || '').trim().toLowerCase();
      const container = document.getElementById('cmdListContainer');

      let html = '';
      CATEGORIES.forEach(cat => {
        const matchedCmds = (cat.cmds || []).filter(c => {
          if (!q) return true;
          return c.name.toLowerCase().includes(q) ||
            (c.desc || '').toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q) ||
            (c.aliases || []).some(a => a.toLowerCase().includes(q));
        });

        if (matchedCmds.length > 0) {
          html += '<div style="margin: 20px 0 10px 0; font-size: 16px; font-weight: 800; color: #fff;">' + cat.emoji + ' ' + cat.name + ' (' + matchedCmds.length + ')</div>';
          html += matchedCmds.map((c, i) => {
            const id = 'acc_' + cat.key + '_' + i;
            const cleanName = c.name;
            const aliasesStr = c.aliases && c.aliases.length ? c.aliases.join(' ، ') : 'لا يوجد';
            const usageStr = c.usage && c.usage.length ? c.usage.join(' ، ') : cleanName;

            let tagHtml = '';
            if ((c.flags || []).includes('owner')) tagHtml += '<span class="cmd-tag tag-owner">مطور</span>';
            if ((c.flags || []).includes('admin')) tagHtml += '<span class="cmd-tag tag-admin">أدمن</span>';
            if ((c.flags || []).includes('group')) tagHtml += '<span class="cmd-tag tag-group">جروب</span>';

            return '<div class="cmd-card">' +
              '<div class="cmd-header">' +
                '<div class="cmd-name">' +
                  '<span>' + cleanName + '</span>' + tagHtml +
                '</div>' +
                '<div class="cmd-actions">' +
                  '<button class="btn-cmd" onclick="toggleAccordion(\\'' + id + '\\')">شرح 💡</button>' +
                  '<button class="btn-cmd" onclick="copyText(\\'' + cleanName + '\\')">نسخ 📋</button>' +
                '</div>' +
              '</div>' +
              '<div class="cmd-desc">' + (c.desc || 'أمر ضمن قسم ' + cat.name) + '</div>' +
              '<div id="' + id + '" class="cmd-accordion">' +
                '<div><strong>💡 الاستخدام:</strong> <code>' + usageStr + '</code></div>' +
                '<div style="margin-top: 4px;"><strong>🏷️ أسماء بديلة:</strong> ' + aliasesStr + '</div>' +
              '</div>' +
            '</div>';
          }).join('');
        }
      });

      if (!html) {
        html = '<div style="text-align: center; padding: 40px; color: var(--ink2);">❌ لم يتم العثور على أي أوامر تطابق بحثك.</div>';
      }
      container.innerHTML = html;
    }

    function toggleAccordion(id) {
      playClick();
      const el = document.getElementById(id);
      if (el) el.classList.toggle('open');
    }

    // طلب كود الربط الفوري
    let countdownInterval;
    async function requestPairCode() {
      playClick();
      const phone = (document.getElementById('pairPhoneInput').value || '').replace(/\\D/g, '');
      if (!phone || phone.length < 10) {
        return alert('يرجى كتابة رقم الهاتف بصيغة دولية صحيحة (مثال: 201012345678)');
      }

      showToast('جاري استخراج كود الربط...');
      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success && data.code) {
          document.getElementById('pairCodeDisplay').innerText = data.code;
          document.getElementById('pairResultBox').style.display = 'block';
          showToast('✅ تم توليد كود الربط: ' + data.code);

          // تشغيل العداد
          clearInterval(countdownInterval);
          let timeLeft = 120;
          document.getElementById('pairCountdown').innerText = timeLeft;
          countdownInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('pairCountdown').innerText = timeLeft;
            if (timeLeft <= 0) {
              clearInterval(countdownInterval);
              document.getElementById('pairCodeDisplay').innerText = 'EXPIRED';
            }
          }, 1000);
        } else {
          alert('تعذر استخراج الكود: ' + (data.message || 'خطأ غير معروف'));
        }
      } catch (e) {
        alert('خطأ في الاتصال بالسيرفر: ' + e.message);
      }
    }

    function copyPairCode() {
      const code = document.getElementById('pairCodeDisplay').innerText;
      if (code && code !== '--------' && code !== 'EXPIRED') {
        copyText(code);
      }
    }

    // الشات الجماعي
    async function loadGroupChat() {
      try {
        const res = await fetch('/api/site/group-chat');
        const data = await res.json();
        if (data.success && data.messages) {
          const container = document.getElementById('chatMessages');
          container.innerHTML = data.messages.map(m =>
            '<div class="chat-msg other">' +
              '<div class="chat-sender">' + (m.name || 'عضو') + '</div>' +
              '<div>' + m.text + '</div>' +
            '</div>'
          ).join('');
          container.scrollTop = container.scrollHeight;
        }
      } catch {}
    }

    async function sendGroupChat(e) {
      e.preventDefault();
      playClick();
      const name = document.getElementById('chatSenderInput').value.trim() || 'صديق NO & NO';
      const text = document.getElementById('chatTextInput').value.trim();
      if (!text) return;

      try {
        await fetch('/api/site/group-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, text })
        });
        document.getElementById('chatTextInput').value = '';
        loadGroupChat();
      } catch (err) {
        alert('فشل الإرسال: ' + err.message);
      }
    }

    // إرسال رسالة الدعم والشكاوى
    async function submitContact(e) {
      e.preventDefault();
      playClick();
      const name = document.getElementById('contactName').value;
      const phone = document.getElementById('contactPhone').value;
      const message = document.getElementById('contactMsg').value;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message })
        });
        const d = await res.json();
        if (d.success) {
          alert('✅ تم إرسال رسالتك بنجاح للمطور!');
          document.getElementById('contactName').value = '';
          document.getElementById('contactPhone').value = '';
          document.getElementById('contactMsg').value = '';
        } else {
          alert('فشل الإرسال: ' + (d.message || 'حدث خطأ'));
        }
      } catch (err) {
        alert('خطأ في الاتصال: ' + err.message);
      }
    }

    // بدء التشغيل
    renderTiles();
    filterCommands();
  </script>
</body>
</html>`;
}
