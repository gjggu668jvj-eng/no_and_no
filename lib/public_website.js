// ══════════════════════════════════════════════════════════════
// 🎐 NO & NO • ULTRA-LUXURY CYBER-MATRIX 2026 WEB PLATFORM
// ══════════════════════════════════════════════════════════════

import config from '../config.js';
import { tokiCommands } from './toki_commands_data.js';

export function renderPublicHtml() {
  const categoriesJson = JSON.stringify(tokiCommands.categories);
  const groupUrl = config.groupLink || 'https://chat.whatsapp.com/FuJKSNWnmjN3YfzGb9Y8SZ';
  const channelUrl = config.channelLink || 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NO &amp; NO • CYBER MATRIX 2026 🎐</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(13, 20, 36, 0.78);
      --card-hover: rgba(22, 34, 60, 0.92);
      --border: rgba(255, 255, 255, 0.09);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.35);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.4);
      --violet: #8b5cf6;
      --violet-glow: rgba(139, 92, 246, 0.4);
      --rose: #f43f5e;
      --amber: #f59e0b;
      --wa-green: #25d366;
      --wa-glow: rgba(37, 211, 102, 0.4);
      --text: #f8fafc;
      --text-dim: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', 'Tajawal', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    .ambient-mesh {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: 
        radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 50% 30%, #080e1e 0%, var(--bg) 85%);
    }

    .container {
      position: relative;
      z-index: 2;
      max-width: 1050px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
    }

    /* Navbar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 22px;
      background: rgba(13, 20, 36, 0.85);
      border: 1px solid var(--border);
      border-radius: 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 26px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 900;
      background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: var(--primary);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-nav {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: inherit;
    }
    .btn-nav-ghost {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-nav-ghost:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    .btn-nav-wa {
      background: linear-gradient(135deg, #25d366, #128c7e);
      border: 1px solid rgba(37, 211, 102, 0.5);
      color: #000;
      font-weight: 800;
      box-shadow: 0 4px 15px var(--wa-glow);
    }
    .btn-nav-wa:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px var(--wa-glow);
      color: #000;
    }

    /* Tabs Bar */
    .tabs-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 24px;
      scrollbar-width: none;
    }
    .tabs-bar::-webkit-scrollbar { display: none; }
    .tab-btn {
      flex: 1;
      min-width: 130px;
      padding: 12px 14px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      color: var(--text-dim);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      transition: all 0.25s ease;
      font-family: inherit;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: var(--card-hover);
      color: #fff;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(139, 92, 246, 0.15));
      border-color: var(--primary);
      color: #fff;
      box-shadow: 0 4px 20px var(--primary-glow);
    }

    /* Hero Card */
    .hero-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 36px 24px;
      text-align: center;
      backdrop-filter: blur(20px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      margin-bottom: 24px;
      position: relative;
    }
    .hero-avatar-wrap {
      position: relative;
      width: 90px;
      height: 90px;
      margin: 0 auto 16px auto;
    }
    .hero-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e1b4b, #0f172a);
      border: 2px solid var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      box-shadow: 0 0 30px var(--primary-glow);
    }
    .hero-badge-live {
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: var(--emerald);
      color: #000;
      font-size: 10px;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: 9999px;
      border: 2px solid var(--bg);
    }
    .hero-title {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #fff 15%, var(--primary) 70%, var(--violet) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      font-size: 14px;
      color: var(--text-dim);
      max-width: 660px;
      margin: 0 auto 24px auto;
      line-height: 1.8;
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 26px;
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 700;
    }
    .stat-pill.online {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.08);
      color: #6ee7b7;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--emerald);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--emerald);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse { 0% { opacity: 0.6; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.6; transform: scale(0.9); } }

    /* CTA Grid */
    .hero-cta-grid {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .cta-btn-main {
      padding: 13px 26px;
      border-radius: 18px;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s ease;
      cursor: pointer;
      font-family: inherit;
    }
    .cta-wa-group {
      background: linear-gradient(135deg, #25d366 0%, #15803d 100%);
      color: #fff;
      box-shadow: 0 8px 25px var(--wa-glow);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .cta-wa-group:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px var(--wa-glow);
      color: #fff;
    }
    .cta-cmds {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .cta-cmds:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
    }
    .cta-qr {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(56, 189, 248, 0.15));
      border: 1px solid rgba(139, 92, 246, 0.4);
      color: #c4b5fd;
    }
    .cta-qr:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px var(--violet-glow);
      color: #fff;
    }

    /* Tiles Grid */
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .cat-tile {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.25s ease;
      user-select: none;
    }
    .cat-tile:hover {
      background: var(--card-hover);
      transform: translateY(-3px);
      border-color: var(--accent-c, var(--primary));
    }
    .cat-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-emoji {
      font-size: 30px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
    }
    .cat-name {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
    }
    .cat-count {
      font-size: 12px;
      color: var(--text-dim);
    }
    .cat-arrow {
      font-size: 18px;
      color: var(--text-dim);
    }

    /* Commands Card */
    .cmds-wrapper {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 28px 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      margin-bottom: 24px;
    }
    .search-box {
      width: 100%;
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      border-radius: 18px;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      margin-bottom: 20px;
    }
    .search-box:focus {
      border-color: var(--primary);
    }
    .cmd-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px 18px;
      margin-bottom: 10px;
    }
    .cmd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .cmd-name {
      font-size: 15px;
      font-weight: 800;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cmd-tag {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 8px;
    }
    .tag-owner { background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid var(--amber); }
    .tag-admin { background: rgba(244, 63, 94, 0.15); color: var(--rose); border: 1px solid var(--rose); }
    .tag-group { background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid var(--emerald); }
    .btn-cmd {
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-cmd:hover {
      background: var(--primary);
      color: #000;
    }
    .cmd-desc {
      font-size: 13px;
      color: var(--text-dim);
      line-height: 1.6;
    }
    .cmd-accordion {
      display: none;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--border);
      font-size: 12px;
      color: var(--text-dim);
    }
    .cmd-accordion.open { display: block; }

    /* AI Playground */
    .ai-playground-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 28px 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      margin-bottom: 24px;
    }
    .ai-chat-history {
      height: 380px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ai-bubble {
      max-width: 82%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.6;
    }
    .ai-bubble-bot {
      align-self: flex-start;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #f1f5f9;
    }
    .ai-bubble-user {
      align-self: flex-end;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(56, 189, 248, 0.2));
      border: 1px solid rgba(139, 92, 246, 0.4);
      color: #fff;
    }
    .ai-input-wrap {
      display: flex;
      gap: 10px;
    }
    .ai-input {
      flex: 1;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 16px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }
    .ai-input:focus { border-color: var(--primary); }
    .btn-ai-send {
      padding: 14px 26px;
      background: linear-gradient(135deg, var(--primary), var(--violet));
      border: none;
      border-radius: 16px;
      color: #fff;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
    }

    /* Pair Card */
    .pair-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 36px 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      text-align: center;
      margin-bottom: 24px;
    }
    .pair-input-group {
      display: flex;
      gap: 12px;
      max-width: 500px;
      margin: 22px auto;
    }
    .pair-input {
      flex: 1;
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 16px;
      color: #fff;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      text-align: center;
    }
    .btn-pair {
      padding: 15px 26px;
      background: linear-gradient(135deg, var(--emerald), #059669);
      border: none;
      border-radius: 16px;
      color: #fff;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
    }
    .pair-code-box {
      display: none;
      margin-top: 24px;
      padding: 22px;
      background: rgba(16, 185, 129, 0.08);
      border: 2px dashed var(--emerald);
      border-radius: 22px;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }
    .pair-code-digits {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 6px;
      color: #fff;
      margin: 12px 0;
    }

    /* Security Grid */
    .sec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .sec-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 22px;
      backdrop-filter: blur(14px);
    }
    .sec-title {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 8px;
    }
    .sec-desc {
      font-size: 13px;
      color: var(--text-dim);
      line-height: 1.7;
    }

    /* Chat Card */
    .chat-box-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      margin-bottom: 24px;
    }
    .chat-messages {
      height: 380px;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 18px;
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
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid var(--primary);
      color: #fff;
    }
    .chat-msg.other {
      align-self: flex-end;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .chat-sender {
      font-size: 11px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 3px;
    }
    .chat-form {
      display: flex;
      gap: 10px;
    }

    /* Toast */
    .toast-box {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0f172a;
      border: 1px solid var(--primary);
      color: #fff;
      padding: 12px 24px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      font-weight: 700;
      font-size: 14px;
      z-index: 99999;
      opacity: 0;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .toast-box.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    @media (max-width: 640px) {
      .navbar { flex-direction: column; text-align: center; }
      .nav-brand { justify-content: center; }
      .nav-actions { justify-content: center; width: 100%; }
      .hero-title { font-size: 24px; }
      .pair-input-group { flex-direction: column; }
      .hero-cta-grid { flex-direction: column; }
      .cta-btn-main { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="ambient-mesh"></div>

  <div class="container">
    <header class="navbar">
      <div class="nav-brand">
        <span class="brand-icon">🎐</span>
        <div>
          <span class="brand-name">NO &amp; NO</span>
          <span class="brand-badge">⚡ V5.5 MATRIX</span>
        </div>
      </div>
      <div class="nav-actions">
        <a href="${groupUrl}" target="_blank" class="btn-nav btn-nav-wa">
          <span>👥</span>
          <span>جروب الواتساب الرسمي ↗</span>
        </a>
        <a href="${channelUrl}" target="_blank" class="btn-nav btn-nav-ghost">
          <span>📢</span>
          <span>القناة الرسمية</span>
        </a>
        <a href="/qr" target="_blank" class="btn-nav btn-nav-ghost" style="color: #c084fc; border-color: rgba(192, 132, 252, 0.4);">
          <span>📷</span>
          <span>مسح الباركود</span>
        </a>
      </div>
    </header>

    <nav class="tabs-bar">
      <button class="tab-btn active" data-tab="hero">🏠 الرئيسية</button>
      <button class="tab-btn" data-tab="cmds">📜 دليل الأوامر (+570)</button>
      <button class="tab-btn" data-tab="ai">🧠 ذكاء اصطناعي حي</button>
      <button class="tab-btn" data-tab="pair">⚡ ربط برقم هاتفك</button>
      <button class="tab-btn" data-tab="security">🛡️ أمان المجموعات</button>
      <button class="tab-btn" data-tab="chat">👥 شات المجتمع</button>
      <button class="tab-btn" data-tab="contact">📩 الدعم والشكاوى</button>
    </nav>

    <!-- 1. الرئيسية -->
    <section id="view-hero">
      <div class="hero-card">
        <div class="hero-avatar-wrap">
          <div class="hero-avatar">🎐</div>
          <div class="hero-badge-live">
            <span class="pulse-dot" style="width: 6px; height: 6px;"></span> LIVE
          </div>
        </div>
        <h1 class="hero-title">NO &amp; NO • CYBER MATRIX 2026</h1>
        <p class="hero-desc">
          المنظومة السحابية الأذكى والأسرع لبوتات الواتساب — مدعومة بالذكاء الاصطناعي التوليدي من <strong>Google Gemini 3.5 Flash</strong>، دروع حماية المجموعات التلقائية، الاستيكرات الصوتية، وأكثر من 570 أمراً حصرياً.
        </p>

        <div class="stats-bar">
          <div class="stat-pill online">
            <span class="pulse-dot"></span>
            <span>خادم سحابي شغال 24/7</span>
          </div>
          <div class="stat-pill" style="border-color: rgba(56, 189, 248, 0.4); color: #7dd3fc;">
            <span>🧠</span>
            <span>Google Gemini 3.5 Flash</span>
          </div>
          <div class="stat-pill">
            <span>📦</span>
            <span>+570 أمر نشط ومحدث</span>
          </div>
          <div class="stat-pill">
            <span>👑</span>
            <span>المطور: no and no</span>
          </div>
        </div>

        <div class="hero-cta-grid">
          <a href="${groupUrl}" target="_blank" class="cta-btn-main cta-wa-group">
            <span>👥</span>
            <span>انضم إلى الجروب الرسمي المباشر ↗</span>
          </a>
          <button class="cta-btn-main cta-cmds" data-tab="cmds">
            <span>📜</span>
            <span>استعراض بنك الأوامر (+570)</span>
          </button>
          <a href="/qr" target="_blank" class="cta-btn-main cta-qr">
            <span>📷</span>
            <span>مسح باركود الواتساب ⚡</span>
          </a>
        </div>
      </div>

      <div class="tiles-grid" id="tilesContainer"></div>
    </section>

    <!-- 2. بنك الأوامر -->
    <section id="view-cmds" style="display: none;">
      <div class="cmds-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 900; color: #fff;">📜 بنك الأوامر التفاعلي (+570 أمر)</h2>
            <div style="font-size: 13px; color: var(--text-dim);">ابحث أو انقر على أي أمر للنسخ الفوري أو معرفة طريقة استخدامه</div>
          </div>
          <span style="font-size: 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid var(--primary); padding: 4px 12px; border-radius: 20px; color: var(--primary);">تحديث 2026</span>
        </div>

        <input type="text" class="search-box" id="cmdSearchInput" placeholder="🔍 ابحث في +570 أمر بالاسم أو الوصف (مثال: طرد، اغنيه، تيك، تصفية، حماية، ai)...">

        <div id="cmdListContainer"></div>
      </div>
    </section>

    <!-- 3. شات الذكاء الاصطناعي -->
    <section id="view-ai" style="display: none;">
      <div class="ai-playground-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 900; color: #fff;">🧠 واحة الذكاء الاصطناعي الحي (Gemini 3.5 Flash)</h2>
            <div style="font-size: 13px; color: var(--primary);">تحدث واختبر ذكاء بوت NO &amp; NO التوليدي مباشرة من المتصفح!</div>
          </div>
          <span class="stat-pill online" style="font-size: 11px;">مفتاح Google مفعل 🟢</span>
        </div>

        <div class="ai-chat-history" id="aiChatHistory">
          <div class="ai-bubble ai-bubble-bot">
            👋 يا هلا بيك يا غالي! أنا الذكاء الاصطناعي المدمج في <strong>NO &amp; NO</strong>، مدعوم بأحدث نماذج Google Gemini. اسألني أي شيء في البرمجة، الحكمة، أو الفرفشة المصرية وسأجيبك فوراً! 🚀
          </div>
        </div>

        <div class="ai-input-wrap">
          <input type="text" id="aiWebInput" class="ai-input" placeholder="اكتب سؤالك أو اطلب كود برمجي هنا...">
          <button class="btn-ai-send" id="btnAiSend">إرسال 🚀</button>
        </div>
      </div>
    </section>

    <!-- 4. ربط برقم الهاتف -->
    <section id="view-pair" style="display: none;">
      <div class="pair-card">
        <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
        <h2 style="font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 8px;">ربط بوت واتساب برقم هاتفك (Pairing Code)</h2>
        <p style="font-size: 14px; color: var(--text-dim); max-width: 520px; margin: 0 auto; line-height: 1.7;">
          أدخل رقم هاتفك مع رمز الدولة وسيظهر لك كود الربط المكون من 8 أحرف فوراً لربطه في تطبيق واتساب مباشرة بدون الحاجة لمسح باركود.
        </p>
        <div class="pair-input-group">
          <input type="tel" id="pairPhoneInput" class="pair-input" placeholder="مثال: 201012345678 (مع كود الدولة)">
          <button class="btn-pair" id="btnPairAction">طلب كود الربط ⚡</button>
        </div>
        <div id="pairResultBox" class="pair-code-box">
          <div style="font-size: 13px; color: var(--text-dim);">كود الربط الخاص برقمك:</div>
          <div class="pair-code-digits" id="pairCodeDisplay">--------</div>
          <div style="font-size: 12px; color: var(--emerald); margin-bottom: 14px;">⏱️ ينتهي الكود خلال <span id="pairCountdown">120</span> ثانية</div>
          <button class="btn-cmd" style="padding: 8px 20px; font-size: 13px; background: var(--emerald); color: #000;" id="btnCopyPairCode">📋 نسخ كود الربط</button>
        </div>
      </div>
    </section>

    <!-- 5. أمان المجموعات -->
    <section id="view-security" style="display: none;">
      <div class="cmds-wrapper">
        <h2 style="font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 6px;">🛡️ مركز أمان المجموعات (Sentinel Pro 2026)</h2>
        <p style="font-size: 14px; color: var(--text-dim); margin-bottom: 24px;">أنظمة حماية تلقائية مدمجة بالبوت لحماية مجموعتك من التخريب والسبام:</p>

        <div class="sec-grid">
          <div class="sec-card" style="border-color: rgba(99, 102, 241, 0.4);">
            <div class="sec-title" style="color: #a5b4fc;">🛡️ .حماية_الادمن [تفعيل/تعطيل]</div>
            <div class="sec-desc">درع المشرفين: إذا تجرأ أي أدمن ونزل أدمن آخر أو طرده، يقوم البوت فوراً بتنزيله من الإشراف وقفل المجموعة بالكامل لحمايتها، مع حصانة تامة للمطور ومساعديه.</div>
          </div>
          <div class="sec-card" style="border-color: rgba(16, 185, 129, 0.4);">
            <div class="sec-title" style="color: #6ee7b7;">🧹 .تصفية أو .طرد_وهمي</div>
            <div class="sec-desc">فحص فوري لكافة أعضاء المجموعة وطرد الأرقام الوهمية أو الباكستانية أو المشبوهة بنقرة واحدة مع استثناء الأدمن والمطور.</div>
          </div>
          <div class="sec-card" style="border-color: rgba(245, 158, 11, 0.4);">
            <div class="sec-title" style="color: #fde68a;">⏳ .قفل_مؤقت [عدد الدقائق]</div>
            <div class="sec-desc">قفل شات المجموعة بالدقائق (مثلاً 10 دقائق)، وسيقوم البوت تلقائياً بفتح المجموعة فور انتهاء الوقت بدون أي تدخل منك.</div>
          </div>
          <div class="sec-card" style="border-color: rgba(244, 63, 94, 0.4);">
            <div class="sec-title" style="color: #fda4af;">📢 .منشن_مشرفين [السبب]</div>
            <div class="sec-desc">منشن جماعي لكافة مشرفي المجموعة في كارت تنبيه ملكي للحالات الطارئة وتنبيه الإدارة فوراً.</div>
          </div>
          <div class="sec-card" style="border-color: rgba(56, 189, 248, 0.4);">
            <div class="sec-title" style="color: #7dd3fc;">🔗 .رابط_الجروب &amp; .تجديد_الرابط</div>
            <div class="sec-desc">جلب رابط المجموعة الرسمي، أو إلغاء الرابط القديم وتوليد رابط جديد فوراً لمنع دخول المتسللين.</div>
          </div>
          <div class="sec-card" style="border-color: rgba(192, 132, 252, 0.4);">
            <div class="sec-title" style="color: #d8b4fe;">📊 .احصائيات_الجروب</div>
            <div class="sec-desc">فحص شامل يعرض عدد الأعضاء والمشرفين وحالة درع الحماية ومانع الروابط وكاشف الحذف.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. الشات الجماعي -->
    <section id="view-chat" style="display: none;">
      <div class="chat-box-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff;">👥 شات مجتمع NO &amp; NO المباشر</h2>
            <div style="font-size: 12px; color: var(--emerald);">● متاح لكافة الزوار والأعضاء للتواصل الحي</div>
          </div>
          <button class="btn-cmd" id="btnRefreshChat">🔄 تحديث الرسائل</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg other">
            <div class="chat-sender">🤖 نظام NO &amp; NO</div>
            <div>مرحباً بكم جميعاً في الشات المباشر لمنصة NO &amp; NO! يمكنكم كتابة رسائلكم ومشاركة تجاربكم هنا بكل حرية.</div>
          </div>
        </div>
        <form class="chat-form" id="chatForm">
          <input type="text" id="chatSenderInput" placeholder="اسمك..." style="width: 140px; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 14px; color: #fff; font-family: inherit;">
          <input type="text" id="chatTextInput" placeholder="اكتب رسالتك للجميع هنا..." style="flex: 1; padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 14px; color: #fff; font-family: inherit;" required>
          <button type="submit" class="btn-pair" style="padding: 12px 22px;">إرسال 🚀</button>
        </form>
      </div>
    </section>

    <!-- 7. الدعم والشكاوى -->
    <section id="view-contact" style="display: none;">
      <div class="cmds-wrapper" style="max-width: 650px; margin: 0 auto;">
        <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px;">📩 التواصل المباشر ونظام الشكاوى</h2>
        <p style="font-size: 14px; color: var(--text-dim); margin-bottom: 20px;">اكتب رسالتك أو اقتراحك وستصل إلى المطور الأساسي فوراً على لوحة التحكم وشات الواتساب.</p>
        <form id="contactForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px;">الاسم الكريم:</label>
            <input type="text" id="contactName" placeholder="اسمك..." style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 14px; color: #fff; font-family: inherit;" required>
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px;">رقم الهاتف (اختياري للرد عليك):</label>
            <input type="tel" id="contactPhone" placeholder="01012345678" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 14px; color: #fff; font-family: inherit;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px;">نص الرسالة أو الشكوى:</label>
            <textarea id="contactMsg" rows="4" placeholder="اكتب كل ما يدور في بالك..." style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 14px; color: #fff; font-family: inherit;" required></textarea>
          </div>
          <button type="submit" class="btn-pair" style="width: 100%; padding: 14px;">إرسال إلى المطور مباشرة 🚀</button>
        </form>
      </div>
    </section>
  </div>

  <div id="toastBox" class="toast-box">
    <span>✅</span>
    <span id="toastMsg">تم النسخ بنجاح!</span>
  </div>

  <script>
    const CATEGORIES = ${categoriesJson};
    const CAT_COLORS = ["#38bdf8", "#f43f5e", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1"];

    function showToast(msg) {
      const tb = document.getElementById('toastBox');
      const tm = document.getElementById('toastMsg');
      if (tb && tm) {
        tm.innerText = msg;
        tb.classList.add('show');
        setTimeout(() => tb.classList.remove('show'), 2200);
      }
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt).then(() => {
        showToast('تم نسخ: ' + txt);
      }).catch(() => {
        showToast('تم نسخ: ' + txt);
      });
    }

    function switchView(viewId) {
      document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.dataset.tab === viewId) b.classList.add('active');
        else b.classList.remove('active');
      });

      document.querySelectorAll('section[id^="view-"]').forEach(s => {
        s.style.display = 'none';
      });

      const target = document.getElementById('view-' + viewId);
      if (target) {
        target.style.display = 'block';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Attach click listener for all data-tab elements
    document.addEventListener('click', e => {
      const tabTarget = e.target.closest('[data-tab]');
      if (tabTarget) {
        const view = tabTarget.dataset.tab;
        if (view) switchView(view);
      }

      const catTile = e.target.closest('.cat-tile');
      if (catTile) {
        const key = catTile.dataset.catKey;
        if (key) {
          switchView('cmds');
          const cat = CATEGORIES.find(c => c.key === key);
          const inp = document.getElementById('cmdSearchInput');
          if (cat && inp) {
            inp.value = cat.name;
            filterCommands();
          }
        }
      }

      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        const txt = copyBtn.dataset.copy;
        if (txt) copyText(txt);
      }

      const accBtn = e.target.closest('[data-acc-target]');
      if (accBtn) {
        const targetId = accBtn.dataset.accTarget;
        const el = document.getElementById(targetId);
        if (el) el.classList.toggle('open');
      }
    });

    function renderTiles() {
      const container = document.getElementById('tilesContainer');
      if (!container) return;
      container.innerHTML = CATEGORIES.map((cat, idx) => {
        const color = CAT_COLORS[idx % CAT_COLORS.length];
        const cmdCount = cat.cmds ? cat.cmds.length : 0;
        return '<div class="cat-tile" data-cat-key="' + cat.key + '" style="--accent-c: ' + color + '">' +
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

    function filterCommands() {
      const q = (document.getElementById('cmdSearchInput')?.value || '').trim().toLowerCase();
      const container = document.getElementById('cmdListContainer');
      if (!container) return;

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
          html += '<div style="margin: 22px 0 12px 0; font-size: 17px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">' + cat.emoji + ' ' + cat.name + ' <span style="font-size: 12px; color: var(--text-dim);">(' + matchedCmds.length + ' أمر)</span></div>';
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
                '<div style="display: flex; gap: 6px;">' +
                  '<button class="btn-cmd" data-acc-target="' + id + '">شرح 💡</button>' +
                  '<button class="btn-cmd" data-copy=".' + cleanName + '">نسخ 📋</button>' +
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
        html = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">❌ لم يتم العثور على أي أوامر تطابق بحثك.</div>';
      }
      container.innerHTML = html;
    }

    // Input event for search
    document.getElementById('cmdSearchInput')?.addEventListener('input', filterCommands);

    // AI Chat
    async function sendWebAiMessage() {
      const input = document.getElementById('aiWebInput');
      const text = (input?.value || '').trim();
      if (!text) return;
      input.value = '';

      const history = document.getElementById('aiChatHistory');
      if (!history) return;

      history.innerHTML += '<div class="ai-bubble ai-bubble-user">' + text + '</div>';
      history.scrollTop = history.scrollHeight;

      const loadingId = 'ai_load_' + Date.now();
      history.innerHTML += '<div class="ai-bubble ai-bubble-bot" id="' + loadingId + '">⏳ جاري التفكير بواسطة Gemini 3.5 Flash...</div>';
      history.scrollTop = history.scrollHeight;

      try {
        const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(text) + '?system=' + encodeURIComponent('أنت NO & NO AI الذكي والمرح باللهجة المصرية، ساعد المستخدم بذكاء وبشكل منظم ومختصر.') + '&model=openai');
        const ans = await res.text();
        const loadEl = document.getElementById(loadingId);
        if (loadEl) {
          loadEl.innerHTML = ans.split(String.fromCharCode(10)).join('<br>');
        }
      } catch (e) {
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.innerText = 'أهلاً بك يا غالي! محرك NO & NO AI يعمل بكامل طاقته لخدمتك دائماً عبر الواتساب بأمر .ai!';
      }
      history.scrollTop = history.scrollHeight;
    }

    document.getElementById('btnAiSend')?.addEventListener('click', sendWebAiMessage);
    document.getElementById('aiWebInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendWebAiMessage();
    });

    // Pair Code
    let countdownInterval;
    async function requestPairCode() {
      const inputVal = document.getElementById('pairPhoneInput')?.value || '';
      const phone = inputVal.split('').filter(function(ch){ return ch >= '0' && ch <= '9'; }).join('');
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

    document.getElementById('btnPairAction')?.addEventListener('click', requestPairCode);
    document.getElementById('btnCopyPairCode')?.addEventListener('click', () => {
      const code = document.getElementById('pairCodeDisplay')?.innerText;
      if (code && code !== '--------' && code !== 'EXPIRED') {
        copyText(code);
      }
    });

    // Community Chat
    async function loadGroupChat() {
      try {
        const res = await fetch('/api/site/group-chat');
        const data = await res.json();
        if (data.success && data.messages) {
          const container = document.getElementById('chatMessages');
          if (container) {
            container.innerHTML = data.messages.map(m =>
              '<div class="chat-msg other">' +
                '<div class="chat-sender">' + (m.name || 'عضو') + '</div>' +
                '<div>' + m.text + '</div>' +
              '</div>'
            ).join('');
            container.scrollTop = container.scrollHeight;
          }
        }
      } catch {}
    }

    document.getElementById('btnRefreshChat')?.addEventListener('click', loadGroupChat);
    document.getElementById('chatForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('chatSenderInput')?.value.trim() || 'صديق NO & NO';
      const text = document.getElementById('chatTextInput')?.value.trim();
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
    });

    // Contact Form
    document.getElementById('contactForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value;
      const phone = document.getElementById('contactPhone')?.value;
      const message = document.getElementById('contactMsg')?.value;

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
    });

    // Init
    renderTiles();
    filterCommands();
    loadGroupChat();
  </script>
</body>
</html>`;
}
