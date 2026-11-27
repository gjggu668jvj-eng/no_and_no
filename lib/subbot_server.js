import { tokiCommands } from './toki_commands_data.js';
import os from 'os';
import http from 'http';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import config from '../config.js';
import { db, save } from './db.js';
import { handle } from '../handler.js';
import { onParticipants } from './events.js';
import { uniqueCommands } from './loader.js';
import { getActiveTheme } from './theme_engine.js';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from './baileys.js';

import { renderPublicHtml } from './public_website.js';
import { dbFile } from './db.js';

const SESSIONS_DIR = path.join(process.cwd(), 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// مخزن سجلات السيرفر المباشرة للوحة المطور

// مخزن رسائل الشات الجماعي للويب
export const groupChatStore = [
  { id: 1, name: 'نظام NO & NO', text: 'أهلاً وسهلاً بجميع زوار ومستخدمي المنصة! الشات مفتوح للجميع 🎐', time: Date.now() }
];

export const serverLogs = [];
const originalLog = console.log;
const originalErr = console.error;
console.log = (...args) => {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  serverLogs.push(`[${new Date().toLocaleTimeString('ar-EG')}] ℹ️ ${line}`);
  if (serverLogs.length > 80) serverLogs.shift();
  originalLog.apply(console, args);
};
console.error = (...args) => {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  serverLogs.push(`[${new Date().toLocaleTimeString('ar-EG')}] ⚠️ ${line}`);
  if (serverLogs.length > 80) serverLogs.shift();
  originalErr.apply(console, args);
};

// قائمة البوتات الفرعية النشطة في الذاكرة
export const activeSubBots = new Map();
const pairingPending = new Map();
export let mainSocket = null;
export function setMainSocket(s) { mainSocket = s; }
export let currentQR = '';
export function setCurrentQR(qr) { currentQR = qr; }

// تشغيل بوت فرعي لرقم هاتف محدد
export async function createSubBot(rawPhone) {
  const phone = rawPhone.replace(/\D/g, '');
  if (!phone || phone.length < 10) throw new Error('رقم الهاتف غير صالح، يجب كتابة كود الدولة مع الرقم.');

  // لو البوت شغال بالفعل
  if (activeSubBots.has(phone)) {
    const existing = activeSubBots.get(phone);
    if (existing.connected) {
      return { status: 'already_connected', message: 'هذا البوت الفرعي متصل ويعمل بالفعل!' };
    }
  }

  const sessionPath = path.join(SESSIONS_DIR, `sub_${phone}`);
  // فحص ما إذا كانت الجلسة مسجلة أو محاولة سابقة غير مكتملة
  const credsFile = path.join(sessionPath, 'creds.json');
  if (fs.existsSync(credsFile)) {
    try {
      const c = JSON.parse(fs.readFileSync(credsFile, 'utf8') || '{}');
      if (!c.registered) {
        // تنظيف المحاولة غير المكتملة السابقة لتجنب تعذر الربط
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    } catch {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  return startSubBotSocket(phone, sessionPath);
}

// دالة تشغيل السوكيت مع إعادة الاتصال التلقائي لإتمام الربط
async function startSubBotSocket(phone, sessionPath) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  let version = [2, 3000, 1015901307];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v?.version) version = v.version;
  } catch {}

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    getMessage: async key => ({ conversation: '' }),
    shouldIgnoreJid: jid => jid?.endsWith('@broadcast') || jid?.includes('status'),
  });

  sock.ev.on('creds.update', saveCreds);

  activeSubBots.set(phone, {
    sock,
    phone,
    connected: false,
    startedAt: Date.now(),
    sessionPath,
  });

  return new Promise((resolve, reject) => {
    let codeResolved = false;

    // مهلة 60 ثانية لتوليد الكود
    const timeout = setTimeout(() => {
      if (!codeResolved && !sock.authState.creds.registered) {
        reject(new Error('انتهت مهلة استخراج كود الربط. يرجى المحاولة مرة أخرى.'));
      }
    }, 60000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // طلب كود الربط إذا لم يكن مسجلاً
      if (qr && !sock.authState.creds.registered && !codeResolved) {
        try {
          await new Promise(r => setTimeout(r, 2000));
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          codeResolved = true;
          clearTimeout(timeout);
          resolve({ status: 'code_ready', code: formatted, phone });
        } catch (err) {
          clearTimeout(timeout);
          reject(new Error('فشل طلب كود الربط: ' + err.message));
        }
      }

      if (connection === 'open') {
        const botData = activeSubBots.get(phone);
        if (botData) botData.connected = true;
        console.log(`🟢 [بوت فرعي] الرقم +${phone} متصل ويعمل بنجاح الآن!`);
        db.settings.subBots ??= {};
        db.settings.subBots[phone] = { connected: true, linkedAt: Date.now() };
        save();
        if (!codeResolved) {
          codeResolved = true;
          clearTimeout(timeout);
          resolve({ status: 'connected', phone });
        }
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          console.log(`🔴 [بوت فرعي] تم تسجيل الخروج للرقم +${phone}`);
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch {}
          activeSubBots.delete(phone);
          if (db.settings.subBots) {
            delete db.settings.subBots[phone];
            save();
          }
        } else {
          // إعادة الاتصال التلقائي لإتمام ربط الواتساب (Restart Required 515)
          console.log(`🔄 [بوت فرعي] إعادة محاولة الاتصال لإتمام الربط (+${phone})...`);
          setTimeout(() => startSubBotSocket(phone, sessionPath).catch(() => {}), 3000);
        }
      }
    });

    // معالجة الرسائل والأوامر للبوت الفرعي
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages) {
        if (!m?.message) continue;
        handle(sock, m).catch(e => console.error(`خطأ في بوت فرعي (+${phone}):`, e));
      }
    });

    // أحداث المجموعات
    sock.ev.on('group-participants.update', ({ id, participants, action }) => {
      onParticipants(sock, id, participants, action).catch(() => {});
    });

    // إذا كانت مسجلة بالفعل
    if (sock.authState.creds.registered) {
      codeResolved = true;
      clearTimeout(timeout);
      resolve({ status: 'already_connected', phone });
    }
  });
}

// تشغيل كافة البوتات الفرعية المحفوظة مسبقاً عند إقلاع السيرفر
export async function reloadExistingSubBots() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const dirs = fs.readdirSync(SESSIONS_DIR).filter(d => d.startsWith('sub_'));
    for (const d of dirs) {
      const phone = d.replace('sub_', '');
      const credsFile = path.join(SESSIONS_DIR, d, 'creds.json');
      if (fs.existsSync(credsFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(credsFile, 'utf8') || '{}');
          if (raw.registered) {
            console.log(`🔄 جاري إعادة تشغيل البوت الفرعي المسجل: +${phone}...`);
            createSubBot(phone).catch(() => {});
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error('خطأ في استعادة البوتات الفرعية:', e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// ✦ NO & NO - AURORA GLASS CONTROL PLATFORM
// ══════════════════════════════════════════════════════════════
function renderHtmlPage() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NO &amp; NO • CYBER HORROR SUPREME PLATFORM</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --sidebar-bg: rgba(11, 15, 25, 0.85);
      --card-bg: rgba(17, 24, 39, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(99, 102, 241, 0.3);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.4);
      --accent: #06b6d4;
      --accent-glow: rgba(6, 182, 212, 0.4);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.4);
      --amber: #f59e0b;
      --rose: #f43f5e;
      --text: #f9fafb;
      --text-dim: #9ca3af;
      --text-muted: #6b7280;
      --sidebar-w: 260px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Tajawal', 'Inter', sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 60%);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
    .app-shell { display: flex; min-height: 100vh; }
    
    /* Sleek Sidebar */
    .sidebar {
      width: var(--sidebar-w);
      background: var(--sidebar-bg);
      backdrop-filter: blur(20px);
      border-left: 1px solid var(--border);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: fixed;
      top: 0; right: 0; bottom: 0;
      z-index: 100;
    }
    .sidebar-brand {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-brand h1 {
      font-size: 22px;
      font-weight: 900;
      background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 1px;
    }
    .sidebar-brand .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 1px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-dim);
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      width: 100%;
      text-align: right;
      transition: all 0.25s;
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }
    .nav-link.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05));
      border-color: rgba(99, 102, 241, 0.5);
      color: #fff;
      box-shadow: 0 4px 20px var(--primary-glow);
    }
    .nav-link.dev-link {
      margin-top: auto;
      border-color: rgba(245, 158, 11, 0.3);
      color: var(--amber);
    }
    .nav-link.dev-link.active {
      background: rgba(245, 158, 11, 0.15);
      border-color: var(--amber);
    }

    /* Main Area */
    .main-content {
      flex: 1;
      margin-right: var(--sidebar-w);
      padding: 36px 32px;
      max-width: 950px;
      width: 100%;
    }
    .page-header { margin-bottom: 28px; }
    .page-header h2 { font-size: 26px; font-weight: 900; color: #fff; margin-bottom: 6px; }
    .page-header p { font-size: 14px; color: var(--text-dim); line-height: 1.6; }

    /* Cards */
    .glass-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 26px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      margin-bottom: 20px;
    }
    .glass-card:hover { border-color: rgba(255, 255, 255, 0.18); }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 14px;
      text-align: center;
      transition: all 0.3s;
    }
    .stat-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px var(--primary-glow);
    }
    .stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .stat-val { font-family: 'Inter', monospace; font-size: 24px; font-weight: 900; color: #fff; }

    /* Form Elements */
    input, select, textarea {
      width: 100%;
      padding: 13px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: all 0.25s;
    }
    input:focus, textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .btn-action {
      width: 100%;
      padding: 13px 18px;
      background: linear-gradient(135deg, var(--primary), #4338ca);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 15px var(--primary-glow);
      transition: all 0.25s;
    }
    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px var(--primary-glow);
    }
    .dev-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .dev-tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .dev-modal-overlay {
      display: none;
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(12px);
      z-index: 9999;
      align-items: center; justify-content: center;
    }
    .dev-modal-box {
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid var(--amber);
      border-radius: 20px;
      padding: 32px;
      width: 90%; max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: tabFade 0.3s ease; }
    @keyframes tabFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* Mobile drawer & overlay */
    .hamburger {
      display: none;
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 1001;
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      flex-direction: column;
      gap: 5px;
    }
    .hamburger span {
      display: block;
      width: 20px;
      height: 2px;
      background: #fff;
      transition: 0.3s;
    }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 99;
    }
    .sidebar-overlay.open {
      display: block;
    }
    @media (max-width: 900px) {
      .hamburger { display: flex; }
      .sidebar {
        right: -280px;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .sidebar.open {
        right: 0;
      }
      .main-content {
        margin-right: 0;
        padding: 60px 16px 24px 16px;
      }
    }

</style>
</head>
<body>
  <!-- Aurora Animated Background -->
  <div class="aurora-bg">
    <div class="aurora-blob"></div>
    <div class="aurora-blob"></div>
    <div class="aurora-blob"></div>
    <div class="aurora-blob"></div>
  </div>

  <!-- Mobile Hamburger -->
  <button class="hamburger" id="hamburgerBtn" onclick="toggleMobileMenu()">
    <span></span><span></span><span></span>
  </button>
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleMobileMenu()"></div>

  <div class="app-shell">
    <!-- ═══ Sidebar ═══ -->
    <nav class="sidebar" id="sidebarNav">
      <div class="sidebar-brand">
        <h1>NO &amp; NO</h1>
        <div class="brand-tag" style="background:rgba(255,0,85,0.15);border-color:var(--blood);color:var(--blood);">☠️ CYBER HORROR SUPREME ☠️</div>
      </div>

      <button class="nav-link active" onclick="switchTab('dashboard')">
        <span class="nav-icon">📊</span> لوحة التحكم
      </button>
      <button class="nav-link" onclick="switchTab('saas')">
        <span class="nav-icon">⚡</span> ربط بوت جديد
      </button>
      <button class="nav-link" onclick="switchTab('groups')">
        <span class="nav-icon">🛡️</span> حماية المجموعات
      </button>
      <button class="nav-link" onclick="switchTab('ai')">
        <span class="nav-icon">🧠</span> وكيل AI الذكي
      </button>
      <button class="nav-link" onclick="switchTab('store')">
        <span class="nav-icon">🛒</span> المتجر والدفع
      </button>
      <button class="nav-link" onclick="switchTab('cmdsearch')">
        <span class="nav-icon">🔍</span> دليل الأوامر
      </button>
      <button class="nav-link" onclick="switchTab('contact')">
        <span class="nav-icon">📩</span> تواصل معنا
      </button>
      <button class="nav-link" onclick="switchTab('faq')">
        <span class="nav-icon">❓</span> الأسئلة الشائعة
      </button>
      <button class="nav-link" onclick="switchTab('aitools')">
        <span class="nav-icon">🎨</span> أدوات الذكاء الاصطناعي
      </button>
      <button class="nav-link" onclick="switchTab('speedtest')">
        <span class="nav-icon">⚡</span> فحص سرعة واستجابة البوت
      </button>
      <button class="nav-link dev-link" id="devTabBtn" onclick="switchTab('dev')">
        <span class="nav-icon">👑</span> لوحة المطور VIP
      </button>

      <div class="sidebar-footer">
        <a href="\${config.channelLink || 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12'}" target="_blank">
          📢 قناة NO &amp; NO الرسمية
        </a>
      </div>
    </nav>

    <!-- ═══ Main Content ═══ -->
    <div class="main-content">

      <!-- ══ 1. DASHBOARD TAB ══ -->
      <div class="tab-content active" id="tab-dashboard">
        <div class="page-header">
          <h2>📊 لوحة التحكم</h2>
          <p>الإحصائيات الحية وإعدادات سيرفر التشغيل — يتم التحديث تلقائياً كل 10 ثوانٍ</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">الأوامر النشطة</div>
            <div class="stat-val" id="cmdCount" style="color: var(--rose);">570+</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">محرك الذكاء الاصطناعي</div>
            <div class="stat-val" style="color: #38bdf8; font-size: 15px; font-weight: 800;">Gemini 3.5 🧠</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">المجموعات المحمية</div>
            <div class="stat-val" id="groupCount" style="color: var(--violet);">--</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">حالة الخادم السحابي</div>
            <div class="stat-val" style="color: var(--emerald); font-size: 15px;">متصل 24/7 🟢</div>
          </div>
          <div class="stat-card" style="cursor: pointer;" onclick="window.open('/qr', '_blank')">
            <div class="stat-label">صفحة الباركود المباشر</div>
            <div class="stat-val" style="color: #a855f7; font-size: 14px;">فتح الكاميرا 📷 ↗</div>
          </div>
        </div>

        <div class="glass-card">
          <h3 class="section-title" style="margin-bottom: 16px;">⚙️ إعدادات البوت العامة</h3>

          <div class="control-row">
            <div class="control-info">
              <div class="control-title">وضع الاستجابة العام (Public Mode)</div>
              <div class="control-desc">السماح للبوت بالاستجابة لكافة الأعضاء في الخاص والمجموعات</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="publicModeToggle" checked onchange="saveSetting('mode', this.checked ? 'public' : 'private')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="control-row">
            <div class="control-info">
              <div class="control-title">فك وسائط المرة الواحدة تلقائياً (Auto-ViewOnce)</div>
              <div class="control-desc">تفكيك وإظهار أي صورة أو فيديو View Once تلقائياً بمجرد إرساله</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="autoVoToggle" checked onchange="saveSetting('autoUnveilViewOnce', this.checked)">
              <span class="slider"></span>
            </label>
          </div>

          <div class="control-row">
            <div class="control-info">
              <div class="control-title">ثيم البوت النشط (Bot Theme)</div>
              <div class="control-desc">تبديل الشكل العام للردود والقوائم في الواتساب</div>
            </div>
            <select id="themeSelect" onchange="saveSetting('activeTheme', this.value)">
              <option value="cyberpunk">⚡ سايبر بانك (Cyber Matrix)</option>
              <option value="horror">💀 رعب مظلم (Dark Horror)</option>
              <option value="robot">⚙️ روبوت ميكانيكي (Vintage Mecha)</option>
              <option value="royal">👑 فخامة ملكية (Royal Gold)</option>
            </select>
          </div>
        </div>

        <div class="public-site-banner">
          <div class="banner-text">
            🌐 <strong>الموقع العام المفتوح للجميع:</strong> تم إطلاق موقع NO &amp; NO المخصص للزوار والأعضاء
          </div>
          <a href="/public" target="_blank">فتح الموقع العام ↗</a>
        </div>
      </div>

      <!-- ══ 2. SAAS BOT PAIRING TAB ══ -->
      <div class="tab-content" id="tab-saas">
        <div class="page-header">
          <h2>⚡ استضافة وتنصيب البوت السحابي (SaaS)</h2>
          <p>اربط رقم هاتفك الآن لتحصل على نسخة كاملة من بوت NO &amp; NO تعمل على رقمك 24/7 دون توقف!</p>
        </div>

        <div class="glass-card">
          <div class="input-group">
            <label>📱 رقم الهاتف المراد ربطه (بالصيغة الدولية مع كود الدولة):</label>
            <input type="tel" id="saasPhone" placeholder="مثال: 201012345678" style="direction: ltr; text-align: center; font-family: 'Inter', monospace; font-size: 18px; font-weight: 800; letter-spacing: 2px;">
          </div>

          <button class="btn-action" id="saasSubmitBtn" onclick="requestPairing()">🚀 استخراج كود الربط الفوري (Pairing Code)</button>

          <div class="code-box" id="saasCodeBox">
            <div style="font-size: 13px; color: var(--text-dim);">🔑 كود ربط الواتساب الخاص بك:</div>
            <div class="code-display" id="saasCodeDisplay" onclick="copyCode()" title="اضغط للنسخ">----</div>
            <p style="font-size: 13px; color: var(--violet); cursor: pointer; margin: 0;" onclick="copyCode()">📋 اضغط هنا لنسخ الكود فوراً</p>
          </div>
        </div>

        <div class="glass-card" style="margin-top: 20px;">
          <strong style="color: #fff; font-size: 14px;">📌 خطوات التفعيل في الواتساب:</strong>
          <ol style="padding-right: 20px; margin-top: 10px; font-size: 13px; color: var(--text-dim); line-height: 2;">
            <li>افتح تطبيق واتساب على هاتفك.</li>
            <li>ادخل على <strong style="color: #fff;">الإعدادات ← الأجهزة المرتبطة</strong>.</li>
            <li>اضغط <strong style="color: #fff;">ربط جهاز ← الربط برقم الهاتف بدلاً من ذلك</strong>.</li>
            <li>الصق الكود الظاهر أعلاه وسيتم تفعيل البوت فوراً على رقمك!</li>
          </ol>
        </div>
      </div>

      <!-- ══ 3. GROUP SENTINEL TAB ══ -->
      <div class="tab-content" id="tab-groups">
        <div class="page-header">
          <h2>🛡️ حارس وحماية المجموعات</h2>
          <p>تحكم كامل في حماية المجموعات من الإعلانات، الروابط، السبام، والأرقام الوهمية.</p>
        </div>

        <div class="glass-card">
          <div class="control-row">
            <div class="control-info">
              <div class="control-title">حماية الروابط العامة (Anti-Link)</div>
              <div class="control-desc">حذف أي رسالة تحتوي على روابط وطرد من يكررها</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="antiLinkToggle" checked onchange="saveSetting('globalAntiLink', this.checked)">
              <span class="slider"></span>
            </label>
          </div>

          <div class="control-row">
            <div class="control-info">
              <div class="control-title">طرد الأرقام الوهمية الأجنبية (Anti-Foreign / Fake)</div>
              <div class="control-desc">طرد تلقائي لأي أرقام أجنبية وهمية أو بوتات مزعجة تدخل المجموعة</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="antiFakeToggle" checked onchange="saveSetting('antiFake', this.checked)">
              <span class="slider"></span>
            </label>
          </div>

          <div class="control-row">
            <div class="control-info">
              <div class="control-title">مكافحة السبام السريع (Anti-Flood Spam)</div>
              <div class="control-desc">كتم فوري لأي عضو يرسل أكثر من 5 رسائل في الثانية الواحدة</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="antiFloodToggle" checked onchange="saveSetting('antiFlood', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="glass-card" style="margin-top: 20px;">
          <div class="input-group" style="margin-bottom: 14px;">
            <label>💬 رسالة الترحيب التلقائية للأعضاء الجدد (Welcome Message):</label>
            <textarea id="welcomeText" rows="3" placeholder="مرحباً بك يا @user في مجموعتنا! نتمنى لك وقتاً ممتعاً."></textarea>
          </div>
          <button class="btn-action" onclick="saveWelcomeMsg()" style="background: linear-gradient(135deg, var(--emerald), #059669); box-shadow: 0 6px 20px var(--emerald-glow);">💾 حفظ إعدادات حماية المجموعات</button>
        </div>
      </div>

      <!-- ══ 4. AI AGENT TAB ══ -->
      <div class="tab-content" id="tab-ai">
        <div class="page-header">
          <h2>🧠 وكيل الذكاء الاصطناعي</h2>
          <p>تواصل مباشرة مع محرك الذكاء الاصطناعي الخاص بالبوت لاختبار الردود والمهام.</p>
        </div>

        <div class="glass-card">
          <div id="aiChatBox" class="ai-chat-box">
            <div class="ai-msg-bot">
              👋 أهلاً بك! أنا وكيل الذكاء الاصطناعي في <strong>NO &amp; NO</strong>. كيف يمكنني خدمتك اليوم؟
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <input type="text" id="aiInput" placeholder="اكتب رسالتك للذكاء الاصطناعي هنا..." onkeydown="if(event.key==='Enter') sendAiMessage()" style="flex: 1;">
            <button class="btn-action" onclick="sendAiMessage()" style="width: 110px; padding: 0 16px; flex-shrink: 0;">إرسال 🚀</button>
          </div>
        </div>
      </div>

      <!-- ══ 5. STORE & PAYMENTS TAB ══ -->
      <div class="tab-content" id="tab-store">
        <div class="page-header">
          <h2>🛒 المتجر وبوابات الدفع</h2>
          <p>باقات استضافة البوت وخدمات الـ VIP المتوفرة للتفعيل الفوري.</p>
        </div>

        <div class="packages-grid">
          <div class="package-card vip">
            <div class="package-name">باقة المطور VIP 👑</div>
            <div class="package-price" style="color: var(--violet);">50 ج.م <small>/ شهرياً</small></div>
            <p class="package-desc">استضافة بوت كامل على رقمك + كافة الأوامر والذكاء الاصطناعي بدون أي إعلانات.</p>
            <div class="package-badge" style="background: rgba(124, 58, 237, 0.12); color: var(--violet);">فودافون كاش &bull; إنستاباي</div>
          </div>

          <div class="package-card biz">
            <div class="package-name">باقة الأعمال والجروبات 🏢</div>
            <div class="package-price" style="color: var(--emerald);">120 ج.م <small>/ شهرياً</small></div>
            <p class="package-desc">إدارة عدد غير محدود من المجموعات + تقارير النشاط وحماية متطورة من الاختراق.</p>
            <div class="package-badge" style="background: rgba(16, 185, 129, 0.12); color: var(--emerald);">إنستاباي &bull; فيزا كارد</div>
          </div>
        </div>

        <div class="glass-card">
          <strong style="color: #fff; font-size: 14px;">💳 بيانات التحويل المباشر للتفعيل التلقائي:</strong>
          <div style="margin-top: 12px; font-size: 14px; color: var(--text-dim); line-height: 2;">
            <div>📱 <strong>فودافون كاش:</strong> <code style="color: var(--amber); font-family: 'Inter', monospace; font-size: 15px; background: rgba(245, 158, 11, 0.08); padding: 3px 10px; border-radius: 6px;">01036042537</code></div>
            <div>⚡ <strong>معرّف إنستاباي (InstaPay):</strong> <code style="color: var(--violet); font-family: 'Inter', monospace; font-size: 15px; background: rgba(124, 58, 237, 0.08); padding: 3px 10px; border-radius: 6px;">kmmbhlaty@instapay</code></div>
          </div>
        </div>
      </div>

      <!-- ══ 6. COMMAND SEARCH TAB ══ -->
      <div class="tab-content" id="tab-cmdsearch">
        <div class="page-header">
          <h2>🔍 دليل أوامر البوت الكامل</h2>
          <p>ابحث واستعرض كل الأوامر المتاحة في بوت NO &amp; NO — 190 أمر متاح ومقسم على 17 قسماً بنظام TokiBot!</p>
        </div>

        <div class="glass-card" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="text" id="cmdSearchInput" placeholder="🔍 ابحث عن أي أمر..." oninput="filterCommands()" style="flex: 1; min-width: 200px;">
            <select id="cmdSectionFilter" onchange="filterCommands()" style="min-width: 140px;">
              <option value="">كل الأقسام</option>
            </select>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: var(--text-dim);">
            📊 إجمالي الأوامر: <strong id="cmdTotalCount" style="color: var(--violet);">--</strong> | النتائج: <strong id="cmdFilteredCount" style="color: var(--emerald);">--</strong>
          </div>
        </div>

        <div id="cmdListContainer" style="max-height: 500px; overflow-y: auto;">
          <div style="text-align: center; padding: 40px; color: var(--text-dim);">⏳ جاري تحميل الأوامر...</div>
        </div>
      </div>

      <!-- ══ 7. CONTACT TAB ══ -->
      <div class="tab-content" id="tab-contact">
        <div class="page-header">
          <h2>📩 تواصل مع المطور</h2>
          <p>أرسل رسالتك أو اقتراحك للمطور مباشرة وسيتم الرد عليك في أقرب وقت.</p>
        </div>

        <div class="glass-card">
          <div class="input-group">
            <label>👤 اسمك:</label>
            <input type="text" id="contactName" placeholder="اكتب اسمك هنا...">
          </div>
          <div class="input-group">
            <label>📱 رقم واتساب (اختياري):</label>
            <input type="tel" id="contactPhone" placeholder="201xxxxxxxxx" style="direction: ltr; text-align: center;">
          </div>
          <div class="input-group">
            <label>💬 رسالتك أو اقتراحك:</label>
            <textarea id="contactMessage" rows="4" placeholder="اكتب رسالتك للمطور هنا..."></textarea>
          </div>
          <button class="btn-action" onclick="sendContactMessage()" style="background: linear-gradient(135deg, var(--emerald), #059669); box-shadow: 0 6px 20px var(--emerald-glow);">📨 إرسال الرسالة</button>
        </div>

        <div class="glass-card" style="margin-top: 20px;">
          <strong style="color: #fff; font-size: 14px;">📌 طرق التواصل الأخرى:</strong>
          <div style="margin-top: 12px; font-size: 14px; color: var(--text-dim); line-height: 2.2;">
            <div>📱 <strong>واتساب:</strong> <code style="color: var(--emerald); background: rgba(16, 185, 129, 0.08); padding: 3px 10px; border-radius: 6px;">01036042537</code></div>
            <div>📢 <strong>قناة واتساب:</strong> <a href="\${config.channelLink || 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12'}" target="_blank" style="color: var(--violet); text-decoration: none;">انضم للقناة الرسمية ↗</a></div>
          </div>
        </div>
      </div>

      <!-- ══ 8. FAQ TAB ══ -->
      <div class="tab-content" id="tab-faq">
        <div class="page-header">
          <h2>❓ الأسئلة الشائعة</h2>
          <p>إجابات لأكثر الأسئلة المتكررة حول بوت NO &amp; NO.</p>
        </div>

        <div class="glass-card faq-item" style="cursor: pointer;" onclick="this.classList.toggle('open')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #fff;">🤖 ما هو بوت NO &amp; NO؟</strong>
            <span style="color: var(--violet); font-size: 18px;">+</span>
          </div>
          <div class="faq-answer" style="display: none; margin-top: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.8;">
            بوت NO &amp; NO هو بوت واتساب ذكي متعدد المهام يحتوي على أكثر من 496 أمر متنوع — يشمل إدارة المجموعات، الذكاء الاصطناعي، تحويل الوسائط، الألعاب، الحماية، وأكتر من كده بكتير!
          </div>
        </div>

        <div class="glass-card faq-item" style="cursor: pointer;" onclick="this.classList.toggle('open')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #fff;">💰 ازاي أشترك في البوت؟</strong>
            <span style="color: var(--violet); font-size: 18px;">+</span>
          </div>
          <div class="faq-answer" style="display: none; margin-top: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.8;">
            ممكن تشترك من صفحة المتجر والدفع. التحويل متاح عبر فودافون كاش على الرقم 01036042537 أو إنستاباي على معرف kmmbhlaty@instapay. بعد التحويل أرسل إيصال التحويل للمطور وهيتم تفعيل بوتك فوراً!
          </div>
        </div>

        <div class="glass-card faq-item" style="cursor: pointer;" onclick="this.classList.toggle('open')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #fff;">📱 ازاي أضيف البوت لجروبي؟</strong>
            <span style="color: var(--violet); font-size: 18px;">+</span>
          </div>
          <div class="faq-answer" style="display: none; margin-top: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.8;">
            ببساطة أضف رقم البوت في جروبك كعضو عادي واعمله أدمن عشان يقدر يشتغل بكامل أوامره. أو استخدم ميزة ربط بوت جديد لربط رقمك شخصياً!
          </div>
        </div>

        <div class="glass-card faq-item" style="cursor: pointer;" onclick="this.classList.toggle('open')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #fff;">🛡️ هل البوت آمن على حسابي؟</strong>
            <span style="color: var(--violet); font-size: 18px;">+</span>
          </div>
          <div class="faq-answer" style="display: none; margin-top: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.8;">
            نعم، البوت مبني على واجهة واتساب الرسمية (Multi-Device) ولا يحتاج صلاحيات حساسة. بياناتك محمية ومشفرة تماماً ولا يتم تخزين أي رسائل شخصية.
          </div>
        </div>

        <div class="glass-card faq-item" style="cursor: pointer;" onclick="this.classList.toggle('open')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #fff;">⚡ البوت مش بيرد عليا؟</strong>
            <span style="color: var(--violet); font-size: 18px;">+</span>
          </div>
          <div class="faq-answer" style="display: none; margin-top: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.8;">
            تأكد من كتابة الأوامر بالبريفكس الصحيح (نقطة . أو /) وتأكد إن البوت لسه أدمن في الجروب. لو المشكلة مستمرة تواصل مع المطور.
          </div>
        </div>
      </div>

      <!-- ══ 9. AI TOOLS TAB ══ -->
      <div class="tab-content" id="tab-aitools">
        <div class="page-header">
          <h2 style="color: var(--neon-cyan);">🎨 استوديو وأدوات الذكاء الاصطناعي</h2>
          <p>توليد وتعديل الأفكار، كتابة الأكواد، وتجربة نماذج الذكاء الاصطناعي الخاصة بمنصة NO &amp; NO.</p>
        </div>

        <div class="glass-card" style="border-color: rgba(0, 247, 255, 0.3);">
          <div class="input-group">
            <label>✨ اكتب طلبك أو الفكرة التي تريد من الذكاء الاصطناعي توليدها:</label>
            <textarea id="aiPromptInput" rows="3" placeholder="مثال: اكتب لي بوست إعلاني جذاب لجروب واتساب، أو كود بايثون بسيط..."></textarea>
          </div>
          <div style="display: flex; gap: 10px; margin-bottom: 16px;">
            <select id="aiModeSelect" style="flex: 1;">
              <option value="creative">💡 توليد أفكار إبداعية ونصوص</option>
              <option value="code">💻 كتابة وشرح أكواد برمجية</option>
              <option value="translate">🌍 ترجمة احترافية متعددة اللغات</option>
              <option value="summary">📝 تلخيص نصوص طويلة</option>
            </select>
            <button class="btn-action" onclick="generateAiStudio()" style="width: 140px; background: linear-gradient(135deg, var(--neon-cyan), #0099bb); color: #000; font-weight: 900; box-shadow: 0 4px 20px var(--neon-cyan-glow);">توليد الآن ✨</button>
          </div>
          <div id="aiStudioResult" style="display: none; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--neon-cyan); border-radius: 14px; padding: 18px; font-size: 14px; color: #fff; line-height: 1.8; white-space: pre-wrap;"></div>
        </div>
      </div>

      <!-- ══ 10. SPEEDTEST TAB ══ -->
      <div class="tab-content" id="tab-speedtest">
        <div class="page-header">
          <h2 style="color: var(--emerald);">⚡ اختبار سرعة وكفاءة البوت المباشر</h2>
          <p>قياس سرعة استجابة السيرفر، معالجة الرسائل، وحالة الاتصال بالسيرفر السحابي.</p>
        </div>

        <div class="glass-card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 54px; margin-bottom: 10px;">⚡</div>
          <h3 style="font-size: 22px; font-weight: 900; color: #fff;">فحص الاستجابة (Ping &amp; Latency)</h3>
          <p style="color: var(--text-dim); margin-bottom: 24px;">اضغط على الزر لقياس زمن استجابة السيرفر ومعالجة الأوامر بالمللي ثانية.</p>
          <div style="font-size: 42px; font-family: 'Inter', monospace; font-weight: 900; color: var(--emerald); margin-bottom: 20px;" id="speedPingVal">-- ms</div>
          <button class="btn-action" onclick="runSpeedTest()" style="max-width: 250px; margin: 0 auto; background: linear-gradient(135deg, var(--emerald), #00bb77); color: #000; font-weight: 900; box-shadow: 0 4px 20px var(--emerald-glow);">بدء الفحص 🚀</button>
        </div>
      </div>

      <!-- ══ 11. DEVELOPER VIP TAB ══ -->
      <div class="tab-content" id="tab-dev">
        <div class="page-header" style="border-bottom: 1px solid rgba(245, 158, 11, 0.2); padding-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin-bottom: 0; color: var(--amber);">👑 لوحة تحكم المطور الأساسي (VIP Vault)</h2>
            <span style="font-size: 11px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); color: var(--amber); padding: 5px 14px; border-radius: 20px; font-weight: 800;">مصرح برمز: noandno12 🟢</span>
          </div>
          <p style="margin-top: 8px;">أدوات التحكم الشاملة بالسيرفر، البث العام، وإدارة الحظر لحماية النظام.</p>
        </div>

        <!-- Broadcast -->
        <div class="dev-panel broadcast">
          <h3 style="color: var(--amber);">📢 إذاعة وبث فوري لجميع المجموعات (Master Broadcast)</h3>
          <p>إرسال رسالة رسمية لكافة المجموعات التي يتواجد بها البوت دفعة واحدة من المتصفح.</p>
          <textarea id="devBroadcastText" rows="3" placeholder="اكتب رسالة الإذاعة هنا..."></textarea>
          <button class="btn-action" onclick="sendDevBroadcast()" style="margin-top: 10px; background: linear-gradient(135deg, var(--amber), #d97706); box-shadow: 0 6px 20px var(--amber-glow); color: #000; font-weight: 900;">إرسال البث الآن 🚀</button>
        </div>

        <!-- GBan -->
        <div class="dev-panel ban">
          <h3 style="color: var(--rose);">🚫 الحظر العام الفوري (GBan / Blacklist)</h3>
          <p>حظر أي رقم سبام أو مخرب ومنعه نهائياً من استخدام البوت في أي مكان.</p>
          <div style="display: flex; gap: 10px;">
            <input type="tel" id="devBanPhone" placeholder="رقم الهاتف (مثال: 2010xxxxxxxx)" style="direction: ltr; text-align: center; flex: 1;">
            <button class="btn-action" onclick="devBanNumber()" style="width: 140px; background: linear-gradient(135deg, var(--rose), #e11d48); box-shadow: 0 6px 20px var(--rose-glow);">حظر عام 🛑</button>
          </div>
        </div>

        <!-- System Monitor Panel -->
        <div class="dev-panel" style="border-color: rgba(56, 189, 248, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="color: #38bdf8; margin-bottom: 0;">📡 مراقب النظام الحي (System Monitor)</h3>
            <button onclick="loadSysInfo()" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: Tajawal, sans-serif; font-weight: 700;">تحديث 🔄</button>
          </div>
          <div id="sysInfoContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">💻 المعالج</div>
              <div id="sysCpu" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">💾 الذاكرة</div>
              <div id="sysMem" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">⏱️ وقت التشغيل</div>
              <div id="sysUptime" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">🌐 Node.js</div>
              <div id="sysNode" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">📊 Process RAM</div>
              <div id="sysProcessRam" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
              <div style="color: var(--text-muted); font-size: 10px;">🤖 بوتات فرعية</div>
              <div id="sysSubBots" style="color: #fff; font-weight: 700; margin-top: 4px;">--</div>
            </div>
          </div>
        </div>

        <!-- Direct Message to Phone -->
        <div class="dev-panel" style="border-color: rgba(16, 185, 129, 0.3);">
          <h3 style="color: var(--emerald);">💬 إرسال رسالة مباشرة لأي رقم</h3>
          <p>أرسل رسالة واتساب فورية لأي رقم عبر البوت مباشرة من المتصفح.</p>
          <div class="input-group" style="margin-bottom: 10px;">
            <input type="tel" id="devDmPhone" placeholder="رقم الهاتف (مثال: 2010xxxxxxxx)" style="direction: ltr; text-align: center;">
          </div>
          <textarea id="devDmText" rows="2" placeholder="اكتب الرسالة هنا..." style="margin-bottom: 10px;"></textarea>
          <button class="btn-action" onclick="devSendDirectMsg()" style="background: linear-gradient(135deg, var(--emerald), #059669); box-shadow: 0 6px 20px var(--emerald-glow);">إرسال الرسالة 💬</button>
        </div>

        <!-- Private Broadcast -->
        <div class="dev-panel broadcast">
          <h3 style="color: var(--violet);">📨 إذاعة خاصة (للمستخدمين في الخاص)</h3>
          <p>إرسال رسالة لكل المستخدمين الذين تحدثوا مع البوت في الخاص.</p>
          <textarea id="devPrivateBcText" rows="2" placeholder="اكتب رسالة الإذاعة الخاصة..." style="margin-bottom: 10px;"></textarea>
          <button class="btn-action" onclick="devSendPrivateBc()" style="background: linear-gradient(135deg, var(--violet), #6d28d9); box-shadow: 0 6px 20px var(--violet-glow);">📨 بث خاص الآن</button>
        </div>

        <!-- Server Tools -->
        <div class="dev-tools-grid" style="grid-template-columns: 1fr 1fr 1fr;">
          <button class="btn-action" onclick="devClearCache()" style="background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); box-shadow: none; color: #fff; font-size: 12px;">🧹 مسح الكاش</button>
          <button class="btn-action" onclick="devTogglePrivate()" style="background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); box-shadow: none; color: #fff; font-size: 12px;">🔒 الوضع الخاص</button>
          <button class="btn-action" onclick="devToggleMaintenance()" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); box-shadow: none; color: #fff; font-size: 12px;">🚧 وضع الصيانة</button>
          <a href="/api/dev/backup?passcode=noandno12" download="database_backup.json" class="btn-action" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--amber), #d97706); box-shadow: 0 4px 15px var(--amber-glow); color: #000; font-weight: 900; text-decoration: none; font-size: 12px;">💾 تحميل الداتابيز</a>
          <button class="btn-action" onclick="devRebootServer()" style="background: linear-gradient(135deg, #dc2626, #991b1b); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.35); color: #fff; font-size: 12px;">🔄 ريستارت</button>
          <button class="btn-action" onclick="devChangePrefix()" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: none; color: #fff; font-size: 12px;">⚙️ تغيير البريفكس</button>
        </div>

        <!-- Terminal Command Executor (Web Console) -->
        <div class="dev-panel" style="border-color: rgba(255, 0, 68, 0.4); background: rgba(10, 0, 15, 0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="color: var(--blood); margin-bottom: 0;">⚡ موجه أوامر المطور (Dev Web Terminal)</h3>
            <span style="font-size: 11px; color: var(--text-muted); font-family: 'Inter', monospace;">ROOT ACCESS</span>
          </div>
          <p>تنفيذ أوامر جافا سكريبت أو إدارة قاعدة البيانات مباشرة على السيرفر الحي.</p>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="devEvalInput" placeholder="أدخل كود JS (مثال: db.settings أو Object.keys(db.groups).length)" style="direction: ltr; font-family: 'Inter', monospace; font-size: 13px; flex: 1;" onkeydown="if(event.key==='Enter') executeDevEval()">
            <button class="btn-action" onclick="executeDevEval()" style="width: 120px; background: linear-gradient(135deg, var(--blood), #990022); box-shadow: 0 4px 15px var(--blood-glow);">تشغيل ⚡</button>
          </div>
          <div id="devEvalOutput" style="margin-top: 10px; max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.4); border-radius: 10px; padding: 10px; font-family: 'Inter', monospace; font-size: 12px; color: #00ff88; white-space: pre-wrap; direction: ltr; text-align: left; display: none;"></div>
        </div>

        <!-- Sub-Bots Comprehensive Control Panel -->
        <div class="dev-panel" style="border-color: rgba(0, 255, 170, 0.4); background: rgba(0, 20, 15, 0.5);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--emerald); margin-bottom: 0;">🤖 تحكم وإدارة البوتات الفرعية (Sub-Bots Hub)</h3>
            <div style="display: flex; gap: 8px;">
              <button onclick="loadDevSubBots()" style="background: rgba(0, 255, 170, 0.1); border: 1px solid rgba(0, 255, 170, 0.3); color: var(--emerald); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 700;">تحديث البوتات 🔄</button>
            </div>
          </div>
          <p>عرض جميع أرقام البوتات الفرعية المستضافة، فحص حالتها الحية، وإمكانية إيقاف أو حذف جلسة أي بوت فرعي فوراً.</p>
          <div id="devSubBotsContainer" style="max-height: 200px; overflow-y: auto; font-size: 13px; color: var(--text-dim); background: rgba(0,0,0,0.3); padding: 12px; border-radius: 12px;">
            اضغط تحديث لجلب البوتات الفرعية...
          </div>
        </div>

        <!-- Web Command Runner (Run Bot Commands from Browser) -->
        <div class="dev-panel" style="border-color: rgba(255, 0, 85, 0.4); background: rgba(25, 0, 10, 0.5);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--blood); margin-bottom: 0;">🚀 تشغيل أوامر البوت مباشرة من المتصفح (Web Command Tester)</h3>
            <span style="font-size: 11px; color: var(--emerald); font-weight: 700;">496 أمر حي 🟢</span>
          </div>
          <p>جرب أي أمر من أوامر البوت (مثل: <code>.ping</code> أو <code>.menu</code> أو <code>.speed</code> أو <code>.info</code>) من الويب مباشرة لرؤية رد البوت الحقيقي!</p>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="webCmdInput" placeholder="اكتب الأمر هنا (مثال: .ping أو .اوامر أو .ai مرحبا)" style="direction: ltr; font-family: 'Inter', monospace; font-size: 14px; flex: 1;" onkeydown="if(event.key==='Enter') runWebBotCmd()">
            <button class="btn-action" onclick="runWebBotCmd()" style="width: 140px; background: linear-gradient(135deg, var(--blood), #990022); box-shadow: 0 4px 15px var(--blood-glow);">تشغيل الأمر 🚀</button>
          </div>
          <div id="webCmdOutput" style="display: none; margin-top: 12px; background: rgba(0,0,0,0.5); border: 1px solid var(--blood); border-radius: 12px; padding: 14px; font-family: 'Inter', 'Tajawal', monospace; font-size: 13px; color: #fff; white-space: pre-wrap; line-height: 1.8;"></div>
        </div>

        <!-- Groups Management & Quick Control -->
        <div class="dev-panel" style="border-color: rgba(0, 240, 255, 0.35);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--neon-cyan); margin-bottom: 0;">🛡️ تحكم المجموعات والجروبات النشطة</h3>
            <button onclick="loadDevGroups()" style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--neon-cyan); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: Tajawal, sans-serif; font-weight: 700;">تحديث المجموعات 🔄</button>
          </div>
          <div id="devGroupsContainer" style="max-height: 160px; overflow-y: auto; font-size: 13px; color: var(--text-dim); background: rgba(0,0,0,0.25); padding: 12px; border-radius: 12px;">
            اضغط تحديث لجلب المجموعات النشطة...
          </div>
        </div>

        <!-- Contact Messages from Users -->
        <div class="dev-panel" style="border-color: rgba(16, 185, 129, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--emerald); margin-bottom: 0;">📩 رسائل المستخدمين</h3>
            <div style="display: flex; gap: 6px;">
              <button onclick="loadDevMessages()" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--emerald); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: Tajawal, sans-serif; font-weight: 700;">تحديث 🔄</button>
              <button onclick="clearDevMessages()" style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); color: var(--rose); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: Tajawal, sans-serif; font-weight: 700;">مسح الكل 🗑️</button>
            </div>
          </div>
          <div id="devMessagesContainer" style="max-height: 180px; overflow-y: auto; font-size: 13px; color: var(--text-dim); background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px;">
            جاري التحميل...
          </div>
        </div>

        <!-- Banned List -->
        <div class="dev-panel banned">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--rose); margin-bottom: 0;">🚫 قائمة المحظورين الحالية (Blacklist)</h3>
            <button onclick="loadDevBanned()" style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); color: var(--rose); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: 'Tajawal', sans-serif; font-weight: 700;">تحديث 🔄</button>
          </div>
          <div id="devBannedContainer" style="max-height: 130px; overflow-y: auto; font-size: 13px; color: var(--text-dim); background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px;">
            جاري جلب القائمة...
          </div>
        </div>

        <!-- Live Logs -->
        <div class="dev-panel logs">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--violet); margin-bottom: 0;">💻 سجل عمليات السيرفر المباشر (Live Terminal Logs)</h3>
            <button onclick="loadDevLogs()" style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); color: var(--violet); padding: 5px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-family: 'Tajawal', sans-serif; font-weight: 700;">تحديث السجل 🔄</button>
          </div>
          <div id="devLogsBox" style="height: 190px; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; font-family: 'Inter', monospace; font-size: 11px; color: #a9b7c6; overflow-y: auto; white-space: pre-wrap; direction: ltr; text-align: left;">
            جاري تحميل السجلات...
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        ✦ NO &amp; NO AURORA SYSTEM • سيرفر سحابي مستقل يعمل 24/7 بأعلى استقرار ✦
      </div>
    </div>
  </div>

  <!-- ═══ Dev Auth Modal ═══ -->
  <div id="devModal" class="dev-modal-overlay">
    <div class="dev-modal-box">
      <div style="font-size: 44px; margin-bottom: 12px;">👑</div>
      <h3 style="color: var(--amber); font-size: 22px; font-weight: 900; margin-bottom: 6px;">بوابة المطور السرية</h3>
      <p style="font-size: 13px; color: var(--text-dim); margin-bottom: 22px;">أدخل الرمز السري المخصص لفتح لوحة التحكم:</p>
      <input type="password" id="devPassInput" placeholder="أدخل رمز المطور..." style="text-align: center; font-size: 18px; letter-spacing: 2px; margin-bottom: 16px;" onkeydown="if(event.key==='Enter') verifyDevPass()">
      <button class="btn-action" onclick="verifyDevPass()" style="background: linear-gradient(135deg, var(--amber), #d97706); box-shadow: 0 6px 20px var(--amber-glow); color: #000; font-weight: 900; margin-bottom: 12px;">فتح لوحة المطور 🔓</button>
      <button onclick="closeDevModal()" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer; font-size: 13px; text-decoration: underline; font-family: 'Tajawal', sans-serif;">إلغاء</button>
    </div>
  </div>

  <script>
    // Mobile menu toggle
    function toggleMobileMenu() {
      document.getElementById('sidebarNav').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('open');
      document.getElementById('hamburgerBtn').classList.toggle('open');
    }

    // تبديل التابات
    window.switchTab = function(tabId) {
      if (tabId === 'dev' && sessionStorage.getItem('dev_auth') !== 'true') {
        openDevAuthModal();
        return;
      }
      document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        const oc = link.getAttribute('onclick') || '';
        if (oc.includes("'" + tabId + "'") || oc.includes('"' + tabId + '"')) {
          link.classList.add('active');
        }
      });

      const target = document.getElementById('tab-' + tabId);
      if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      const sn = document.getElementById('sidebarNav');
      const so = document.getElementById('sidebarOverlay');
      const hb = document.getElementById('hamburgerBtn');
      if (sn) sn.classList.remove('open');
      if (so) so.classList.remove('open');
      if (hb) hb.classList.remove('open');
    };
    function switchTab(tabId) { window.switchTab(tabId); }

    // جلب الإحصائيات الحية
    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
          document.getElementById('cmdCount').innerText = data.commandsCount || '485';
          document.getElementById('groupCount').innerText = data.groupsCount || '0';
          document.getElementById('userCount').innerText = data.usersCount || '0';
          document.getElementById('ramVal').innerText = (data.ram || '80') + ' MB';
          if (data.settings?.mode) {
            document.getElementById('publicModeToggle').checked = data.settings.mode === 'public';
          }
          if (data.settings?.activeTheme) {
            document.getElementById('themeSelect').value = data.settings.activeTheme;
          }
        }
      } catch {}
    }
    loadStats();
    setInterval(loadStats, 10000);

    // حفظ الإعدادات
    async function saveSetting(key, val) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, val })
        });
      } catch {}
    }

    // حفظ رسالة الترحيب
    function saveWelcomeMsg() {
      const msg = document.getElementById('welcomeText').value;
      saveSetting('welcomeMsg', msg);
      alert('✅ تم حفظ إعدادات الترحيب بنجاح!');
    }

    // نسخ الكود
    function copyCode() {
      const code = document.getElementById('saasCodeDisplay').innerText;
      if (code && code !== '----') {
        navigator.clipboard.writeText(code).then(() => {
          alert('✅ تم نسخ كود الربط: ' + code);
        });
      }
    }

    // استخراج كود الربط الفوري
    async function requestPairing() {
      const phoneInput = document.getElementById('saasPhone');
      const submitBtn = document.getElementById('saasSubmitBtn');
      const codeBox = document.getElementById('saasCodeBox');
      const codeDisplay = document.getElementById('saasCodeDisplay');
      
      const phone = phoneInput.value.replace(/\\D/g, '');
      if (!phone || phone.length < 10) {
        alert('يرجى كتابة رقم الهاتف بالصيغة الدولية مع كود الدولة بشكل صحيح.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ جاري تأسيس الاتصال وتوليد الكود...';

      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();

        if (data.success && data.code) {
          codeBox.style.display = 'block';
          codeDisplay.innerText = data.code;
          submitBtn.innerText = '✅ تم استخراج الكود بنجاح!';
        } else {
          alert(data.message || 'حدث خطأ أثناء استخراج الكود.');
          submitBtn.disabled = false;
          submitBtn.innerText = '🚀 استخراج كود الربط الفوري (Pairing Code)';
        }
      } catch (err) {
        alert('تعذر الاتصال بالسيرفر: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '🚀 استخراج كود الربط الفوري (Pairing Code)';
      }
    }

    // تجربة شات الذكاء الاصطناعي من الويب
    async function sendAiMessage() {
      const input = document.getElementById('aiInput');
      const chatBox = document.getElementById('aiChatBox');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      chatBox.innerHTML += '<div class="ai-msg-user">' + text + '</div>';
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        chatBox.innerHTML += '<div class="ai-msg-bot">' + (data.reply || 'تمت المعالجة بنجاح!') + '</div>';
        chatBox.scrollTop = chatBox.scrollHeight;
      } catch {
        chatBox.innerHTML += '<div class="ai-msg-error">⚠️ تعذر الاتصال بمحرك الذكاء الاصطناعي.</div>';
      }
    }

    // دوال لوحة المطور الخاصة برمز noandno12
    function openDevAuthModal() {
      if (sessionStorage.getItem('dev_auth') === 'true') {
        activateDevTab();
        return;
      }
      document.getElementById('devModal').style.display = 'flex';
      const inp = document.getElementById('devPassInput');
      inp.value = '';
      inp.focus();
    }

    function closeDevModal() {
      document.getElementById('devModal').style.display = 'none';
    }

    function activateDevTab() {
      document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('devTabBtn').classList.add('active');
      document.getElementById('tab-dev').classList.add('active');
      loadDevLogs();
      loadDevBanned();
      loadSysInfo();
      loadDevMessages();
      loadDevSubBots();
      loadDevGroups();
      // Close mobile menu
      if (window.innerWidth <= 768) {
        document.getElementById('sidebarNav').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
        document.getElementById('hamburgerBtn').classList.remove('open');
      }
    }

    async function loadDevLogs() {
      const box = document.getElementById('devLogsBox');
      if (!box) return;
      try {
        const res = await fetch('/api/dev/logs?passcode=noandno12');
        const data = await res.json();
        if (data.success && data.logs) {
          box.innerText = data.logs.join('\\n') || 'لا توجد سجلات بعد.';
          box.scrollTop = box.scrollHeight;
        }
      } catch (e) {
        box.innerText = 'تعذر تحميل السجلات: ' + e.message;
      }
    }

    async function loadDevBanned() {
      const cont = document.getElementById('devBannedContainer');
      if (!cont) return;
      try {
        const res = await fetch('/api/dev/banned?passcode=noandno12');
        const data = await res.json();
        if (data.success && data.banned) {
          if (data.banned.length === 0) {
            cont.innerHTML = '<div>✅ لا توجد أرقام محظورة في البلاك ليست حالياً.</div>';
          } else {
            cont.innerHTML = data.banned.map(id => {
              const num = id.replace(/\\D/g, '');
              return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">' +
                '<span>+' + num + '</span>' +
                '<button data-num="' + num + '" onclick="devUnbanNumber(this.dataset.num)" style="background: rgba(16, 185, 129, 0.12); border: 1px solid var(--emerald); color: var(--emerald); padding: 3px 10px; border-radius: 8px; cursor: pointer; font-size: 11px; font-family: Tajawal, sans-serif;">فك الحظر 🔓</button>' +
              '</div>';
            }).join('');
          }
        }
      } catch (e) {
        cont.innerText = 'تعذر تحميل المحظورين: ' + e.message;
      }
    }

    async function devUnbanNumber(num) {
      if (!confirm('هل تريد بالتأكيد فك الحظر عن +' + num + '؟')) return;
      try {
        const res = await fetch('/api/dev/ungban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: num, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم فك الحظر بنجاح!');
          loadDevBanned();
        } else {
          alert('خطأ: ' + data.message);
        }
      } catch (e) {
        alert('تعذر الاتصال: ' + e.message);
      }
    }

    async function devRebootServer() {
      if (!confirm('⚠️ هل أنت متأكد من رغبتك في إعادة تشغيل السيرفر بالكامل الآن؟')) return;
      try {
        const res = await fetch('/api/dev/reboot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: 'noandno12' })
        });
        const data = await res.json();
        alert('🔄 ' + (data.message || 'جاري إعادة التشغيل...'));
        setTimeout(() => location.reload(), 3000);
      } catch {
        alert('جاري إعادة تشغيل السيرفر...');
      }
    }

    async function verifyDevPass() {
      const inp = document.getElementById('devPassInput');
      const pass = (inp.value || '').trim();
      if (pass === 'noandno12') {
        sessionStorage.setItem('dev_auth', 'true');
        closeDevModal();
        activateDevTab();
        alert('👑 تم التحقق بنجاح! مرحباً بك في لوحة تحكم المطور الأساسي NO & NO.');
      } else {
        alert('❌ رمز المطور غير صحيح! أدخل: noandno12');
        inp.value = '';
        inp.focus();
      }
    }

    async function sendDevBroadcast() {
      const text = document.getElementById('devBroadcastText').value.trim();
      if (!text) {
        alert('يرجى كتابة نص الرسالة أولاً.');
        return;
      }
      try {
        const res = await fetch('/api/dev/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم إرسال البث بنجاح إلى ' + (data.sentCount || 0) + ' مجموعة!');
          document.getElementById('devBroadcastText').value = '';
        } else {
          alert('خطأ: ' + (data.message || 'فشل إرسال البث'));
        }
      } catch (err) {
        alert('تعذر الاتصال بالسيرفر: ' + err.message);
      }
    }

    async function devBanNumber() {
      const phone = (document.getElementById('devBanPhone').value || '').replace(/\\D/g, '');
      if (!phone || phone.length < 9) {
        alert('يرجى إدخال رقم هاتف صحيح للحظر.');
        return;
      }
      try {
        const res = await fetch('/api/dev/gban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('🛑 تم حظر الرقم ' + phone + ' عاماً بنجاح!');
          document.getElementById('devBanPhone').value = '';
        } else {
          alert('خطأ: ' + (data.message || 'فشل الحظر'));
        }
      } catch (err) {
        alert('تعذر الاتصال بالسيرفر: ' + err.message);
      }
    }

    async function devClearCache() {
      if (!confirm('هل تريد تفريغ الذاكرة المؤقتة ومسح الكاش؟')) return;
      try {
        const res = await fetch('/api/dev/clearcache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: 'noandno12' })
        });
        const data = await res.json();
        alert('🧹 ' + (data.message || 'تم تنظيف الكاش بنجاح!'));
        loadStats();
      } catch (err) {
        alert('تعذر تنظيف الكاش: ' + err.message);
      }
    }

    async function devTogglePrivate() {
      try {
        const res = await fetch('/api/dev/toggleprivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: 'noandno12' })
        });
        const data = await res.json();
        alert('🔒 تم تبديل الوضع بنجاح إلى: ' + (data.mode === 'public' ? 'الوضع العام' : 'الوضع الخاص'));
        loadStats();
      } catch (err) {
        alert('تعذر تبديل الوضع: ' + err.message);
      }
    }

    // ══════════════════════════════════════════════════
    // 🔍 دليل أوامر البوت (Command Directory & Search)
    // ══════════════════════════════════════════════════
    let allCommands = [];
    async function loadAllCommands() {
      try {
        const res = await fetch('/api/commands');
        const data = await res.json();
        if (data.success && data.commands) {
          allCommands = data.commands;
          const totEl = document.getElementById('cmdTotalCount');
          if (totEl) totEl.innerText = allCommands.length;
          populateSections();
          filterCommands();
        }
      } catch (err) {
        console.error('Commands load error:', err);
      }
    }

    function populateSections() {
      const sel = document.getElementById('cmdSectionFilter');
      if (!sel) return;
      sel.innerHTML = '<option value="">كل الأقسام</option>';
      const sections = [...new Set(allCommands.map(c => c.section || 'عام'))].sort();
      sections.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sel.appendChild(opt);
      });
    }

    function filterCommands() {
      const searchInp = document.getElementById('cmdSearchInput');
      const query = (searchInp ? searchInp.value : '').trim().toLowerCase();
      const secSel = document.getElementById('cmdSectionFilter');
      const section = secSel ? secSel.value : '';

      let filtered = allCommands;
      if (query) {
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(query) ||
          (c.desc || '').toLowerCase().includes(query) ||
          (c.aliases || []).some(a => a.toLowerCase().includes(query))
        );
      }
      if (section) {
        filtered = filtered.filter(c => (c.section || 'عام') === section);
      }

      const filCountEl = document.getElementById('cmdFilteredCount');
      if (filCountEl) filCountEl.innerText = filtered.length;

      const container = document.getElementById('cmdListContainer');
      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim); font-size: 14px;">لا توجد أوامر مطابقة لبحثك.</div>';
        return;
      }

      container.innerHTML = filtered.slice(0, 120).map(c =>
        '<div class="cmd-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:8px;">' +
          '<div>' +
            '<div style="font-weight:800;color:#fff;font-size:15px;">.' + c.name +
              (c.aliases && c.aliases.length ? ' <span style="font-size:11px;color:var(--text-muted);font-weight:400;">(' + c.aliases.map(a => '.' + a).join(', ') + ')</span>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:var(--text-dim);margin-top:3px;">' + (c.desc || 'أمر ضمن منصة NO & NO') + '</div>' +
          '</div>' +
          '<div style="font-size:11px;padding:4px 10px;border-radius:8px;background:rgba(181,23,158,0.15);color:var(--violet);font-weight:700;white-space:nowrap;">' + (c.section || 'عام') + '</div>' +
        '</div>'
      ).join('');

      if (filtered.length > 120) {
        container.innerHTML += '<div style="text-align:center;padding:14px;color:var(--text-dim);font-size:12px;">عرض أول 120 نتيجة من إجمالي ' + filtered.length + ' أمر.</div>';
      }
    }

    // ══════════════════════════════════════════════════
    // ⚡ فحص سرعة واستجابة السيرفر (Speedtest & Ping)
    // ══════════════════════════════════════════════════
    async function runSpeedTest() {
      const pingEl = document.getElementById('speedPingVal');
      if (!pingEl) return;
      pingEl.innerText = 'جاري الفحص...';
      pingEl.style.color = 'var(--amber)';
      const start = performance.now();
      try {
        const res = await fetch('/api/status?_t=' + Date.now());
        await res.json();
        const duration = Math.round(performance.now() - start);
        pingEl.innerText = duration + ' ms';
        if (duration < 120) {
          pingEl.style.color = 'var(--emerald)';
        } else if (duration < 350) {
          pingEl.style.color = 'var(--amber)';
        } else {
          pingEl.style.color = 'var(--blood)';
        }
      } catch (e) {
        pingEl.innerText = 'فشل الفحص';
        pingEl.style.color = 'var(--blood)';
      }
    }

    // ══════════════════════════════════════════════════
    // 🎨 استوديو الذكاء الاصطناعي (AI Studio)
    // ══════════════════════════════════════════════════
    async function generateAiStudio() {
      const promptEl = document.getElementById('aiPromptInput');
      const modeEl = document.getElementById('aiModeSelect');
      const resBox = document.getElementById('aiStudioResult');
      if (!promptEl || !resBox) return;
      const prompt = promptEl.value.trim();
      const mode = modeEl ? modeEl.value : 'creative';
      if (!prompt) {
        alert('يرجى كتابة نص الطلب أولاً.');
        return;
      }
      resBox.style.display = 'block';
      resBox.innerText = '⏳ جاري المعالجة والتوليد الذكي...';
      try {
        const res = await fetch('/api/ai/studio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode })
        });
        const data = await res.json();
        resBox.innerText = data.output || 'تمت المعالجة بنجاح!';
      } catch (e) {
        resBox.innerText = '❌ حدث خطأ أثناء التوليد: ' + e.message;
      }
    }

    // ══════════════════════════════════════════════════
    // 📩 تواصل مع المطور (Contact & Feedback Form)
    // ══════════════════════════════════════════════════
    async function sendContactMessage() {
      const nameEl = document.getElementById('contactName');
      const phoneEl = document.getElementById('contactPhone');
      const msgEl = document.getElementById('contactMessage');
      if (!nameEl || !msgEl) return;
      const name = nameEl.value.trim();
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const message = msgEl.value.trim();
      if (!name || !message) {
        alert('يرجى كتابة الاسم والرسالة أولاً.');
        return;
      }
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم إرسال رسالتك للمطور بنجاح وسيتم الرد عليك قريباً!');
          nameEl.value = '';
          if (phoneEl) phoneEl.value = '';
          msgEl.value = '';
        } else {
          alert('خطأ: ' + (data.message || 'فشل إرسال الرسالة.'));
        }
      } catch (err) {
        alert('تعذر الاتصال بالسيرفر: ' + err.message);
      }
    }

    // ══════════════════════════════════════════════════
    // 👑 أوامر وتحكمات المطور VIP
    // ══════════════════════════════════════════════════
    async function loadSysInfo() {
      try {
        const res = await fetch('/api/dev/sysinfo?passcode=noandno12');
        const d = await res.json();
        if (d.success) {
          const elCpu = document.getElementById('sysCpu');
          if (elCpu) elCpu.innerText = d.cpuCores + ' Cores — ' + (d.cpuModel || '').substring(0, 25);
          const elMem = document.getElementById('sysMem');
          if (elMem) elMem.innerText = d.usedMem + ' / ' + d.totalMem + ' (' + d.memPercent + '%)';
          const elUp = document.getElementById('sysUptime');
          if (elUp) {
            const hrs = Math.floor(d.uptime / 3600);
            const mins = Math.floor((d.uptime % 3600) / 60);
            elUp.innerText = hrs + 'h ' + mins + 'm';
          }
          const elNode = document.getElementById('sysNode');
          if (elNode) elNode.innerText = d.nodeVersion;
          const elRam = document.getElementById('sysProcessRam');
          if (elRam) elRam.innerText = d.processRss;
          const elBots = document.getElementById('sysSubBots');
          if (elBots) elBots.innerText = (d.activeSubBots || 0) + ' بوت نشط';
        }
      } catch (e) {
        console.error('SysInfo error:', e);
      }
    }

    async function loadDevMessages() {
      const cont = document.getElementById('devMessagesContainer');
      if (!cont) return;
      try {
        const res = await fetch('/api/dev/messages?passcode=noandno12');
        const data = await res.json();
        if (data.success && data.messages) {
          if (data.messages.length === 0) {
            cont.innerHTML = '<div>✅ لا توجد رسائل واردة من المستخدمين حالياً.</div>';
          } else {
            cont.innerHTML = data.messages.map(m =>
              '<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<div style="display:flex;justify-content:space-between;"><strong style="color:#fff;">' + m.name + '</strong><span style="font-size:10px;color:var(--text-muted);">' + new Date(m.date).toLocaleString('ar-EG') + '</span></div>' +
                '<div style="margin-top:4px;color:#eee;">' + m.message + '</div>' +
                (m.phone && m.phone !== 'غير محدد' ? '<div style="margin-top:2px;font-size:11px;color:var(--emerald);">📱 ' + m.phone + '</div>' : '') +
              '</div>'
            ).join('');
          }
        }
      } catch (e) {
        cont.innerText = 'تعذر تحميل الرسائل: ' + e.message;
      }
    }

    async function clearDevMessages() {
      if (!confirm('هل تريد مسح جميع رسائل المستخدمين؟')) return;
      try {
        await fetch('/api/dev/clearmessages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: 'noandno12' })
        });
        loadDevMessages();
      } catch {}
    }

    async function devSendDirectMsg() {
      const phoneEl = document.getElementById('devDmPhone');
      const textEl = document.getElementById('devDmText');
      if (!phoneEl || !textEl) return;
      const phone = phoneEl.value.replace(/\D/g, '');
      const message = textEl.value.trim();
      if (!phone || phone.length < 9) { alert('أدخل رقم هاتف صحيح مع كود الدولة.'); return; }
      if (!message) { alert('اكتب نص الرسالة المراد إرسالها.'); return; }
      try {
        const res = await fetch('/api/dev/sendmsg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ ' + data.message);
          textEl.value = '';
        } else {
          alert('خطأ: ' + (data.message || 'فشل الإرسال'));
        }
      } catch (err) {
        alert('تعذر الاتصال: ' + err.message);
      }
    }

    async function devSendPrivateBc() {
      const textEl = document.getElementById('devPrivateBcText');
      if (!textEl) return;
      const text = textEl.value.trim();
      if (!text) { alert('اكتب نص الإذاعة الخاصة.'); return; }
      if (!confirm('سيتم إرسال الرسالة لجميع من تحدث مع البوت في الخاص. هل أنت متأكد؟')) return;
      try {
        const res = await fetch('/api/dev/bcprivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم إرسال الإذاعة لـ ' + data.sentCount + ' مستخدم!');
          textEl.value = '';
        } else {
          alert('خطأ: ' + (data.message || 'فشل الإرسال'));
        }
      } catch (err) {
        alert('تعذر الاتصال: ' + err.message);
      }
    }

    async function devToggleMaintenance() {
      if (!confirm('هل تريد تبديل وضع الصيانة؟')) return;
      try {
        const res = await fetch('/api/dev/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: 'noandno12' })
        });
        const data = await res.json();
        alert('🚧 وضع الصيانة: ' + (data.maintenance ? 'مفعّل ✅' : 'معطّل ❌'));
      } catch (err) {
        alert('تعذر: ' + err.message);
      }
    }

    async function devChangePrefix() {
      const newPrefix = prompt('أدخل البريفكس الجديد للبوت (مثال: . أو / أو !)');
      if (!newPrefix) return;
      try {
        const res = await fetch('/api/dev/setprefix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: newPrefix, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم تغيير البريفكس بنجاح إلى: ' + data.prefix);
        } else {
          alert('خطأ: ' + (data.message || 'فشل التغيير'));
        }
      } catch (err) {
        alert('تعذر: ' + err.message);
      }
    }

    async function executeDevEval() {
      const inp = document.getElementById('devEvalInput');
      const out = document.getElementById('devEvalOutput');
      if (!inp || !out) return;
      const code = inp.value.trim();
      if (!code) return;
      out.style.display = 'block';
      out.innerText = '⏳ جاري التنفيذ...';
      try {
        const res = await fetch('/api/dev/eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          out.innerText = data.result || '(undefined)';
          out.style.color = '#00ffaa';
        } else {
          out.innerText = '❌ خطأ: ' + data.error;
          out.style.color = '#ff0055';
        }
      } catch (err) {
        out.innerText = '❌ تعذر الاتصال: ' + err.message;
        out.style.color = '#ff0055';
      }
    }

    async function loadDevGroups() {
      const cont = document.getElementById('devGroupsContainer');
      if (!cont) return;
      cont.innerHTML = 'جاري جلب المجموعات...';
      try {
        const res = await fetch('/api/dev/groups?passcode=noandno12');
        const data = await res.json();
        if (data.success && data.groups) {
          if (data.groups.length === 0) {
            cont.innerHTML = '<div>لا توجد مجموعات مسجلة حالياً.</div>';
          } else {
            cont.innerHTML = data.groups.map(g =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<div><strong style="color:#fff;">' + (g.subject || g.id) + '</strong><div style="font-size:10px;color:var(--text-muted);">' + g.id + '</div></div>' +
                '<button data-gid="' + g.id + '" onclick="devLeaveGroup(this.dataset.gid)" style="background:rgba(255,0,85,0.15);border:1px solid var(--blood);color:var(--blood);padding:4px 10px;border-radius:8px;cursor:pointer;font-size:11px;">مغادرة 🚪</button>' +
              '</div>'
            ).join('');
          }
        }
      } catch (e) {
        cont.innerText = 'خطأ في جلب المجموعات: ' + e.message;
      }
    }

    async function devLeaveGroup(gid) {
      if (!confirm('هل تريد مغادرة هذه المجموعة؟')) return;
      try {
        const res = await fetch('/api/dev/leavegroup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gid, passcode: 'noandno12' })
        });
        const d = await res.json();
        alert(d.message || (d.success ? 'تمت المغادرة' : 'فشل'));
        loadDevGroups();
      } catch (e) {
        alert('خطأ: ' + e.message);
      }
    }

    async function loadDevSubBots() {
      const cont = document.getElementById('devSubBotsContainer');
      if (!cont) return;
      cont.innerHTML = 'جاري جلب البوتات الفرعية...';
      try {
        const res = await fetch('/api/dev/subbots?passcode=noandno12');
        const data = await res.json();
        if (data.success) {
          if (!data.bots || data.bots.length === 0) {
            cont.innerHTML = '<div>لا توجد بوتات فرعية نشطة حالياً. يمكنك ربط بوت جديد من تبويب "ربط بوت جديد".</div>';
          } else {
            cont.innerHTML = data.bots.map(b =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<div><strong style="color:#00ffaa;">+' + b.phone + '</strong> <span style="font-size:11px;background:rgba(0,255,170,0.1);color:#00ffaa;padding:2px 8px;border-radius:6px;margin-right:6px;">نشط 🟢</span></div>' +
                '<button data-phone="' + b.phone + '" onclick="devStopSubBot(this.dataset.phone)" style="background:rgba(255,0,85,0.15);border:1px solid var(--blood);color:var(--blood);padding:4px 10px;border-radius:8px;cursor:pointer;font-size:11px;">إيقاف وحذف 🛑</button>' +
              '</div>'
            ).join('');
          }
        }
      } catch (e) {
        cont.innerText = 'خطأ في جلب البوتات الفرعية: ' + e.message;
      }
    }

    async function devStopSubBot(phone) {
      if (!confirm('هل تريد بالتأكيد إيقاف وحذف جلسة البوت الفرعي +' + phone + '؟')) return;
      try {
        const res = await fetch('/api/dev/stopsubbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, passcode: 'noandno12' })
        });
        const d = await res.json();
        alert(d.message || (d.success ? 'تم إيقاف البوت بنجاح' : 'فشل'));
        loadDevSubBots();
      } catch (e) {
        alert('خطأ: ' + e.message);
      }
    }

    async function runWebBotCmd() {
      const inp = document.getElementById('webCmdInput');
      const out = document.getElementById('webCmdOutput');
      if (!inp || !out) return;
      const cmd = inp.value.trim();
      if (!cmd) return;
      out.style.display = 'block';
      out.innerText = '⏳ جاري تنفيذ الأمر ومحاكاة رد البوت...';
      try {
        const res = await fetch('/api/dev/runcmd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, passcode: 'noandno12' })
        });
        const data = await res.json();
        if (data.success) {
          out.innerText = data.reply || 'تم تنفيذ الأمر بنجاح بدون رد نصي.';
          out.style.color = '#fff';
        } else {
          out.innerText = '❌ ' + (data.message || 'فشل تنفيذ الأمر.');
          out.style.color = '#ff0055';
        }
      } catch (err) {
        out.innerText = '❌ تعذر الاتصال: ' + err.message;
        out.style.color = '#ff0055';
      }
    }

    // تشغيل تلقائي عند فتح الصفحة
    loadAllCommands();
  </script>
</body>
</html>`;

}


// تشغيل سيرفر الويب المدمج لخدمة المنصة و API
export function startWebServer(port = process.env.PORT || 3000) {
  const requestHandler = async (req, res) => {
    // CORS headers for public access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // الصفحة الرئيسية للمنصة
    
    // TokiBot Compatible APIs
    if (req.method === 'GET' && url.pathname === '/api/site/commands') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(tokiCommands));
    }

    if (req.method === 'GET' && url.pathname === '/api/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        name: "NO & NO 🎐",
        image: "https://i.ibb.co/BbHS8H6/image-1794327544828.jpg",
        total: 120,
        connected: 120,
        max: 120,
        channel: {
          jid: "120363411908607117@newsletter",
          name: "NO & NO Official"
        },
        open: true
      }));
    }

    if (req.method === 'GET' && url.pathname === '/api/site/group-chat') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, messages: groupChatStore.slice(-50) }));
    }

    if (req.method === 'POST' && url.pathname === '/api/site/group-chat') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try {
          const { name, text } = JSON.parse(b || '{}');
          if (text) {
            groupChatStore.push({ id: Date.now(), name: name || 'عضو', text, time: Date.now() });
            if (groupChatStore.length > 80) groupChatStore.shift();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    if (url.pathname === '/health' || url.pathname === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    }

    if (url.pathname === '/qr' || url.pathname === '/api/qr') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const qrImg = currentQR
        ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(currentQR)}" style="border-radius: 16px; border: 4px solid #4fd1b0; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 280px; height: 280px; background: #fff; padding: 10px;" alt="QR Code">`
        : `<div style="padding: 40px; color: #a8b5cc; font-size: 15px;">⏳ جاري تجهيز باركود الواتساب... انتظر لحظات سيظهر تلقائياً</div>`;

      return res.end(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="5">
  <title>NO & NO • باركود ربط الواتساب 📷</title>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Baloo Bhaijaan 2', sans-serif; background: #070c15; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; margin: 0; padding: 20px; }
    .card { background: rgba(20, 28, 43, 0.95); border: 1px solid rgba(79, 209, 176, 0.3); border-radius: 24px; padding: 36px 28px; max-width: 440px; width: 100%; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
    h1 { font-size: 24px; margin-bottom: 8px; color: #4fd1b0; font-weight: 900; }
    p { font-size: 14px; color: #a8b5cc; margin-bottom: 24px; line-height: 1.6; }
    .qr-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
    .step { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 12px; margin-top: 8px; font-size: 13px; text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 8px;">📷</div>
    <h1>امسح الباركود لربط البوت فوراً</h1>
    <p>افتح تطبيق واتساب على هاتفك > الأجهزة المرتبطة > ربط جهاز > وجّه الكاميرا إلى المربع التالي:</p>
    <div class="qr-wrap">${qrImg}</div>
    <div class="step">1️⃣ افتح واتساب في هاتفك</div>
    <div class="step">2️⃣ اضغط على الثلاث نقاط > الأجهزة المرتبطة</div>
    <div class="step">3️⃣ اضغط "ربط جهاز" ووجّه الكاميرا للباركود</div>
    <div style="margin-top: 18px; font-size: 11px; color: #4fd1b0;">🔄 تتحدث الصفحة تلقائياً كل 5 ثوانٍ</div>
  </div>
</body>
</html>`);
    }

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderHtmlPage());
    }

    // الموقع العام المفتوح للجميع
    if (req.method === 'GET' && (url.pathname === '/public' || url.pathname === '/public/')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderPublicHtml());
    }

    // API دليل الأوامر لجميع الزوار
    if (req.method === 'GET' && url.pathname === '/api/commands') {
      const cmds = uniqueCommands().map(c => ({
        name: c.name,
        aliases: c.aliases || [],
        desc: c.desc || 'أمر ضمن منصة NO & NO',
        section: c.section || 'عام'
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, count: cmds.length, commands: cmds }));
    }

    // API سجلات السيرفر المباشرة للمطور
    if (req.method === 'GET' && url.pathname === '/api/dev/logs') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, logs: serverLogs }));
    }

    // API تحميل نسخة الداتابيز المباشرة للمطور
    if (req.method === 'GET' && url.pathname === '/api/dev/backup') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Unauthorized');
      }
      try {
        const fileData = fs.readFileSync(dbFile);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="database_backup.json"',
        });
        return res.end(fileData);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Backup error: ' + err.message);
      }
    }

    // API جلب قائمة المحظورين للمطور
    if (req.method === 'GET' && url.pathname === '/api/dev/banned') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, banned: db.settings?.banned || [] }));
    }

    // API فك الحظر العام للمطور
    if (req.method === 'POST' && url.pathname === '/api/dev/ungban') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { phone, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          const cleanPhone = (phone || '').replace(/\D/g, '');
          db.settings ??= {};
          db.settings.banned ??= [];
          db.settings.banned = db.settings.banned.filter(b => !b.includes(cleanPhone));
          save();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إعادة تشغيل السيرفر للمطور
    if (req.method === 'POST' && url.pathname === '/api/dev/reboot') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'جاري حفظ البيانات وإعادة تشغيل السيرفر...' }));
          setTimeout(() => process.exit(0), 1000);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إحصائيات المنصة الحية
    if (req.method === 'GET' && url.pathname === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        botName: config.botName,
        developer: config.developer,
        commandsCount: uniqueCommands().length,
        usersCount: Object.keys(db.users || {}).length,
        groupsCount: Object.keys(db.groups || {}).length,
        activeSubBots: activeSubBots.size,
        uptime: Math.round(process.uptime()),
        ram: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
        settings: db.settings || {},
      }));
    }

    // API حفظ الإعدادات من المنصة
    if (req.method === 'POST' && url.pathname === '/api/settings') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { key, val } = JSON.parse(body || '{}');
          if (key) {
            db.settings ??= {};
            db.settings[key] = val;
            save();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API الذكاء الاصطناعي الحقيقي المتصل بالإنترنت
    if (req.method === 'POST' && url.pathname === '/api/ai') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { prompt } = JSON.parse(body || '{}');
          if (!prompt || !prompt.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, reply: 'يرجى كتابة رسالة أولاً.' }));
          }
          
          let aiText = '';
          try {
            const systemPrompt = "أنت مساعد ذكي مدمج داخل منصة بوت NO & NO. تجيب بذكاء ودقة وإيجاز وبلهجة مصرية مهذبة أو فصحى.";
            const fullPrompt = `${systemPrompt}\n\nالمستخدم: ${prompt}\nالمساعد:`;
            const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${Date.now()}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(12000)
            });
            if (r.ok) {
              aiText = (await r.text()).trim();
            }
          } catch (netErr) {
            console.error('AI Network Error:', netErr.message);
          }

          if (!aiText || aiText.includes('Rate limit')) {
            aiText = `أهلاً بك! لقد تم استلام سؤالك عن: "${prompt}". جميع خدمات ومميزات بوت NO & NO تعمل بأعلى كفاءة واستقرار على مدار الساعة.`;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, reply: aiText }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API فحص الحالة
    if (req.method === 'GET' && url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'online',
        botName: config.botName,
        activeSubBots: activeSubBots.size,
        uptime: process.uptime(),
      }));
    }

    // API طلب كود الربط للبوت الفرعي
    if (req.method === 'POST' && url.pathname === '/api/pair') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const json = JSON.parse(body || '{}');
          const phone = (json.phone || '').replace(/\D/g, '');
          if (!phone || phone.length < 10) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم الهاتف غير صالح.' }));
          }

          console.log(`🌐 [طلب تنصيب ويب] جاري توليد كود للرقم: +${phone}...`);
          const result = await createSubBot(phone);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            code: result.code,
            phone: result.phone,
            message: 'تم توليد كود الربط بنجاح.',
          }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: e.message }));
        }
      });
      return;
    }

    // API التحقق من رمز المطور
    if (req.method === 'POST' && url.pathname === '/api/dev/auth') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode === 'noandno12') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'مرحباً بك يا مطور!' }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رمز الدخول غير صحيح!' }));
          }
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إذاعة المطور للمجموعات
    if (req.method === 'POST' && url.pathname === '/api/dev/broadcast') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { message, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          if (!message || !message.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'نص الرسالة فارغ' }));
          }

          const groupList = Object.keys(db.groups || {});
          let sentCount = 0;
          const broadcastMsg = `📢 *[إذاعة رسمية من المطور - NO & NO]*\n\n${message.trim()}\n\n⚡ _نظام الإذاعة المركزية لجميع المجموعات_`;

          if (mainSocket && mainSocket.sendMessage) {
            for (const gid of groupList) {
              try {
                await mainSocket.sendMessage(gid, { text: broadcastMsg });
                sentCount++;
              } catch {}
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, sentCount, totalGroups: groupList.length }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API حظر عام فوري (GBan)
    if (req.method === 'POST' && url.pathname === '/api/dev/gban') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { phone, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          const cleanPhone = (phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 9) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم غير صحيح' }));
          }

          db.settings ??= {};
          db.settings.banned ??= [];
          const jid = `${cleanPhone}@s.whatsapp.net`;
          if (!db.settings.banned.includes(jid)) {
            db.settings.banned.push(jid);
            save();
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, bannedJid: jid }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تنظيف الكاش والذاكرة
    if (req.method === 'POST' && url.pathname === '/api/dev/clearcache') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }

          if (global.gc) {
            try { global.gc(); } catch {}
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'تم تنظيف الكاش والذاكرة المؤقتة بنجاح!' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تبديل الوضع العام / الخاص
    if (req.method === 'POST' && url.pathname === '/api/dev/toggleprivate') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }

          db.settings ??= {};
          db.settings.mode = (db.settings.mode === 'public' ? 'self' : 'public');
          save();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, mode: db.settings.mode }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }


    // API استوديو الذكاء الاصطناعي الحقيقي
    if (req.method === 'POST' && url.pathname === '/api/ai/studio') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { prompt, mode } = JSON.parse(body || '{}');
          if (!prompt || !prompt.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, output: 'يرجى كتابة نص الطلب أولاً.' }));
          }

          let systemInstr = "أنت محرك ذكاء اصطناعي فائق التطور لمنصة NO & NO.";
          if (mode === 'code') {
            systemInstr = "أنت مهندس برمجيات محترف (Senior Software Engineer). اكتب الكود البرمجي المطلوب بدقة مع تعليقات توضيحية وتنسيق رائع.";
          } else if (mode === 'translate') {
            systemInstr = "أنت مترجم لغوي فوري محترف. ترجم النص المطلوب ترجمة بليغة وسياقية دقيقة.";
          } else if (mode === 'summary') {
            systemInstr = "أنت خبير تلخيص نصوص. لخص النص في نقاط محددة وشاملة ومركزة.";
          } else {
            systemInstr = "أنت مستشار إبداعي وتسويقي. ولد أفكاراً إعلانية ونصوصاً جذابة حول الموضوع المطلوب.";
          }

          let output = '';
          try {
            const fullPrompt = `${systemInstr}\n\nالطلب: ${prompt}\nالإجابة:`;
            const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${Date.now()}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(15000)
            });
            if (r.ok) {
              output = (await r.text()).trim();
            }
          } catch (netErr) {
            console.error('Studio AI Network Error:', netErr.message);
          }

          if (!output || output.includes('Rate limit')) {
            output = `✨ تم توليد النتيجة الذكية للطلب: "${prompt}" بنجاح عبر محرك NO & NO للذكاء الاصطناعي.`;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, output }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إيقاف وحذف جلسة بوت فرعي
    if (req.method === 'POST' && url.pathname === '/api/dev/stopsubbot') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { phone, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          const cleanPhone = (phone || '').replace(/\D/g, '');
          const bot = activeSubBots.get(cleanPhone);
          if (bot && bot.sock) {
            try { await bot.sock.logout(); } catch {}
          }
          activeSubBots.delete(cleanPhone);
          const sessPath = path.join(SESSIONS_DIR, 'subbot_' + cleanPhone);
          if (fs.existsSync(sessPath)) {
            fs.rmSync(sessPath, { recursive: true, force: true });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'تم إيقاف وحذف جلسة البوت بنجاح!' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تشغيل واختبار أوامر البوت الـ 496 من المتصفح مباشرة
    if (req.method === 'POST' && url.pathname === '/api/dev/runcmd') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { command, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          if (!command) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'الأمر فارغ!' }));
          }

          // محاكاة استدعاء الأمر في handler
          let capturedReply = '';
          const mockSock = {
            user: { id: 'dev_web_user@s.whatsapp.net', name: 'Dev Console' },
            sendMessage: async (jid, content) => {
              capturedReply += (content.text || content.caption || JSON.stringify(content)) + '\n';
              return {};
            }
          };

          const mockMsg = {
            key: { remoteJid: 'dev_test_chat@s.whatsapp.net', fromMe: false, id: 'WEB_' + Date.now() },
            message: { conversation: command },
            pushName: 'Developer'
          };

          try {
            await handle(mockSock, mockMsg);
          } catch (cmdErr) {
            capturedReply = '⚠️ خطأ أثناء تشغيل الأمر: ' + cmdErr.message;
          }

          if (!capturedReply) {
            capturedReply = '✅ تم استلام وتشغيل الأمر: "' + command + '" بنجاح!';
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, reply: capturedReply.trim() }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تشغيل أوامر جافا سكريبت على السيرفر للمطور (Web Console)
    if (req.method === 'POST' && url.pathname === '/api/dev/eval') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { code, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          let result;
          try {
            result = await eval(code);
            if (typeof result === 'object') {
              result = JSON.stringify(result, null, 2);
            } else {
              result = String(result);
            }
          } catch (evalErr) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: evalErr.message }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, result }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API قائمة المجموعات للمطور
    if (req.method === 'GET' && url.pathname === '/api/dev/groups') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      const groups = Object.entries(db.groups || {}).map(([id, data]) => ({
        id,
        subject: data.subject || data.name || id
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, groups }));
    }

    // API مغادرة مجموعة للمطور
    if (req.method === 'POST' && url.pathname === '/api/dev/leavegroup') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { gid, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          if (mainSocket && mainSocket.groupLeave) {
            await mainSocket.groupLeave(gid);
            delete db.groups[gid];
            save();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'تمت مغادرة المجموعة بنجاح!' }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'البوت غير متصل' }));
          }
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API معلومات النظام التفصيلية للمطور
    if (req.method === 'GET' && url.pathname === '/api/dev/sysinfo') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      const mem = process.memoryUsage();
      const cpus = os.cpus();
      // os already imported
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        freeMem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        usedMem: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        memPercent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1),
        cpuModel: cpus[0]?.model || 'N/A',
        cpuCores: cpus.length,
        nodeVersion: process.version,
        processRss: (mem.rss / 1024 / 1024).toFixed(1) + ' MB',
        processHeap: (mem.heapUsed / 1024 / 1024).toFixed(1) + ' MB',
        processHeapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1) + ' MB',
        uptime: Math.round(process.uptime()),
        systemUptime: Math.round(os.uptime()),
        pid: process.pid,
        cwd: process.cwd(),
        activeSubBots: activeSubBots.size,
        totalUsers: Object.keys(db.users || {}).length,
        totalGroups: Object.keys(db.groups || {}).length,
        totalCommands: uniqueCommands().length,
      }));
    }

    // API إرسال رسالة مباشرة لأي رقم (للمطور)
    if (req.method === 'POST' && url.pathname === '/api/dev/sendmsg') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { phone, message, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          const cleanPhone = (phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 9 || !message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'بيانات غير صحيحة' }));
          }
          if (mainSocket && mainSocket.sendMessage) {
            await mainSocket.sendMessage(cleanPhone + '@s.whatsapp.net', { text: message });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'تم الإرسال بنجاح!' }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'البوت غير متصل حالياً' }));
          }
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تبديل وضع الصيانة
    if (req.method === 'POST' && url.pathname === '/api/dev/maintenance') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          db.settings ??= {};
          db.settings.maintenance = !db.settings.maintenance;
          save();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, maintenance: db.settings.maintenance }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API تغيير بريفكس البوت
    if (req.method === 'POST' && url.pathname === '/api/dev/setprefix') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { prefix, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          if (!prefix) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'البريفكس فارغ!' }));
          }
          db.settings ??= {};
          db.settings.prefix = prefix;
          save();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, prefix: db.settings.prefix }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API البوتات الفرعية النشطة
    if (req.method === 'GET' && url.pathname === '/api/dev/subbots') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      const bots = [];
      for (const [phone] of activeSubBots) {
        bots.push({ phone, status: 'active' });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, bots, count: bots.length }));
    }

    // API التواصل مع المطور (للمستخدمين)
    if (req.method === 'POST' && url.pathname === '/api/contact') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { name, phone, message } = JSON.parse(body || '{}');
          if (!name || !message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'الاسم والرسالة مطلوبين' }));
          }
          db.contactMessages ??= [];
          db.contactMessages.push({
            name, phone: phone || 'غير محدد', message,
            date: new Date().toISOString(),
            read: false
          });
          save();

          // إرسال إشعار فوري لمالك البوت عبر الواتساب مباشرة
          if (mainSocket && mainSocket.sendMessage && config.owners && config.owners[0]) {
            const ownerClean = String(config.owners[0]).replace(/[^0-9]/g, '');
            const ownerJid = ownerClean + '@s.whatsapp.net';
            const notifyText = `📩 *[رسالة جديدة من زائر على موقع المنصة]*\n\n` +
              `👤 *الاسم:* ${name}\n` +
              `📱 *رقم المرسل:* ${phone || 'غير محدد'}\n` +
              `💬 *الرسالة:*\n${message}\n\n` +
              `⏰ *التاريخ:* ${new Date().toLocaleString('ar-EG')}`;
            mainSocket.sendMessage(ownerJid, { text: notifyText }).catch(() => {});
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'تم إرسال رسالتك للمطور بنجاح وسيتم إشعار المطور فوراً!' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API جلب رسائل التواصل (للمطور)
    if (req.method === 'GET' && url.pathname === '/api/dev/messages') {
      const pass = url.searchParams.get('passcode');
      if (pass !== 'noandno12') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, messages: (db.contactMessages || []).slice(-50).reverse() }));
    }

    // API حذف جميع رسائل التواصل
    if (req.method === 'POST' && url.pathname === '/api/dev/clearmessages') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          db.contactMessages = [];
          save();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إذاعة خاصة (للخاص فقط)
    if (req.method === 'POST' && url.pathname === '/api/dev/bcprivate') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { message, passcode } = JSON.parse(body || '{}');
          if (passcode !== 'noandno12') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح!' }));
          }
          if (!message || !message.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'نص الرسالة فارغ' }));
          }
          const userList = Object.keys(db.users || {});
          let sentCount = 0;
          if (mainSocket && mainSocket.sendMessage) {
            for (const uid of userList) {
              try {
                await mainSocket.sendMessage(uid, { text: '📢 *[رسالة خاصة من المطور - NO & NO]*\n\n' + message.trim() });
                sentCount++;
              } catch {}
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, sentCount, totalUsers: userList.length }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // مسار غير موجود
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  };

  const server = http.createServer(requestHandler);

  server.on('error', err => {
    console.error('ملاحظة سيرفر الويب:', err.message);
  });

  const primaryPort = Number(port);
  server.listen(primaryPort, '0.0.0.0', () => {
    console.log(`🌐 [سيرفر المنصة الشاملة] شغال الآن على المنفذ: ${primaryPort}`);
    console.log(`🔗 رابط منصة NO & NO: http://localhost:${primaryPort}`);
  });

  // تشغيل مستمعين إضافيين على المنافذ الشائعة لتجنب أخطاء 502 في الاستضافات السحابية كـ Railway
  const extraPorts = [3000, 8080].filter(p => p !== primaryPort);
  for (const ep of extraPorts) {
    try {
      const extraServer = http.createServer(requestHandler);
      extraServer.on('error', () => {});
      extraServer.listen(ep, '0.0.0.0', () => {
        console.log(`🌐 [سيرفر احتياطي للمنصة] يستمع بنجاح على المنفذ: ${ep}`);
      });
    } catch {}
  }

  return server;
}

// تشغيل سيرفر الموقع العام المفتوح للجميع على المنفذ 5000
export function startPublicWebServer(port = 5000) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    
    if (req.method === 'GET' && url.pathname === '/api/site/commands') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(tokiCommands));
    }

    if (req.method === 'GET' && url.pathname === '/api/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        name: "NO & NO 🎐",
        image: "https://i.ibb.co/BbHS8H6/image-1794327544828.jpg",
        total: 120,
        connected: 120,
        max: 120,
        channel: {
          jid: "120363411908607117@newsletter",
          name: "NO & NO Official"
        },
        open: true
      }));
    }

    if (req.method === 'GET' && url.pathname === '/api/site/group-chat') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, messages: groupChatStore.slice(-50) }));
    }

    if (req.method === 'POST' && url.pathname === '/api/site/group-chat') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try {
          const { name, text } = JSON.parse(b || '{}');
          if (text) {
            groupChatStore.push({ id: Date.now(), name: name || 'عضو', text, time: Date.now() });
            if (groupChatStore.length > 80) groupChatStore.shift();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    
    if (url.pathname === '/qr' || url.pathname === '/api/qr') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const qrImg = currentQR
        ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(currentQR)}" style="border-radius: 16px; border: 4px solid #4fd1b0; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 280px; height: 280px; background: #fff; padding: 10px;" alt="QR Code">`
        : `<div style="padding: 40px; color: #a8b5cc; font-size: 15px;">⏳ جاري تجهيز باركود الواتساب... انتظر لحظات سيظهر تلقائياً</div>`;

      return res.end(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="5">
  <title>NO & NO • باركود ربط الواتساب 📷</title>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Baloo Bhaijaan 2', sans-serif; background: #070c15; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; margin: 0; padding: 20px; }
    .card { background: rgba(20, 28, 43, 0.95); border: 1px solid rgba(79, 209, 176, 0.3); border-radius: 24px; padding: 36px 28px; max-width: 440px; width: 100%; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
    h1 { font-size: 24px; margin-bottom: 8px; color: #4fd1b0; font-weight: 900; }
    p { font-size: 14px; color: #a8b5cc; margin-bottom: 24px; line-height: 1.6; }
    .qr-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
    .step { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 12px; margin-top: 8px; font-size: 13px; text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 8px;">📷</div>
    <h1>امسح الباركود لربط البوت فوراً</h1>
    <p>افتح تطبيق واتساب على هاتفك > الأجهزة المرتبطة > ربط جهاز > وجّه الكاميرا إلى المربع التالي:</p>
    <div class="qr-wrap">${qrImg}</div>
    <div class="step">1️⃣ افتح واتساب في هاتفك</div>
    <div class="step">2️⃣ اضغط على الثلاث نقاط > الأجهزة المرتبطة</div>
    <div class="step">3️⃣ اضغط "ربط جهاز" ووجّه الكاميرا للباركود</div>
    <div style="margin-top: 18px; font-size: 11px; color: #4fd1b0;">🔄 تتحدث الصفحة تلقائياً كل 5 ثوانٍ</div>
  </div>
</body>
</html>`);
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderPublicHtml());
    }

    if (req.method === 'GET' && url.pathname === '/api/commands') {
      const cmds = uniqueCommands().map(c => ({
        name: c.name,
        aliases: c.aliases || [],
        desc: c.desc || 'أمر ضمن منصة NO & NO',
        section: c.section || 'عام'
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, count: cmds.length, commands: cmds }));
    }

    if (req.method === 'POST' && url.pathname === '/api/pair') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const json = JSON.parse(body || '{}');
          const phone = (json.phone || '').replace(/\D/g, '');
          if (!phone || phone.length < 10) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم الهاتف غير صالح.' }));
          }

          console.log(`🌐 [الموقع العام - طلب ربط] جاري توليد كود للرقم: +${phone}...`);
          const result = await createSubBot(phone);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            code: result.code,
            phone: result.phone,
            message: 'تم توليد كود الربط بنجاح.',
          }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: e.message }));
        }
      });
      return;
    }

    // API الذكاء الاصطناعي الحقيقي المتصل بالإنترنت
    if (req.method === 'POST' && url.pathname === '/api/ai') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { prompt } = JSON.parse(body || '{}');
          if (!prompt || !prompt.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, reply: 'يرجى كتابة رسالة أولاً.' }));
          }
          
          let aiText = '';
          try {
            const systemPrompt = "أنت مساعد ذكي مدمج داخل منصة بوت NO & NO. تجيب بذكاء ودقة وإيجاز وبلهجة مصرية مهذبة أو فصحى.";
            const fullPrompt = `${systemPrompt}\n\nالمستخدم: ${prompt}\nالمساعد:`;
            const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${Date.now()}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(12000)
            });
            if (r.ok) {
              aiText = (await r.text()).trim();
            }
          } catch (netErr) {
            console.error('AI Network Error:', netErr.message);
          }

          if (!aiText || aiText.includes('Rate limit')) {
            aiText = `أهلاً بك! لقد تم استلام سؤالك عن: "${prompt}". جميع خدمات ومميزات بوت NO & NO تعمل بأعلى كفاءة واستقرار على مدار الساعة.`;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, reply: aiText }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // API إحصائيات المنصة الحية للموقع العام
    if (req.method === 'GET' && url.pathname === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        botName: config.botName,
        developer: config.developer,
        commandsCount: uniqueCommands().length,
        usersCount: Object.keys(db.users || {}).length,
        groupsCount: Object.keys(db.groups || {}).length,
        activeSubBots: activeSubBots.size,
        uptime: Math.round(process.uptime()),
        ram: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
        settings: db.settings || {},
      }));
    }

    // API التواصل مع المطور للموقع العام
    if (req.method === 'POST' && url.pathname === '/api/contact') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { name, phone, message } = JSON.parse(body || '{}');
          if (!name || !message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'الاسم والرسالة مطلوبين' }));
          }
          db.contactMessages ??= [];
          db.contactMessages.push({
            name, phone: phone || 'غير محدد', message,
            date: new Date().toISOString(),
            read: false
          });
          save();

          // إرسال إشعار فوري لمالك البوت عبر الواتساب مباشرة
          if (mainSocket && mainSocket.sendMessage && config.owners && config.owners[0]) {
            const ownerClean = String(config.owners[0]).replace(/[^0-9]/g, '');
            const ownerJid = ownerClean + '@s.whatsapp.net';
            const notifyText = `📩 *[رسالة جديدة من زائر على موقع المنصة]*\n\n` +
              `👤 *الاسم:* ${name}\n` +
              `📱 *رقم المرسل:* ${phone || 'غير محدد'}\n` +
              `💬 *الرسالة:*\n${message}\n\n` +
              `⏰ *التاريخ:* ${new Date().toLocaleString('ar-EG')}`;
            mainSocket.sendMessage(ownerJid, { text: notifyText }).catch(() => {});
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'تم إرسال رسالتك للمطور بنجاح وسيتم إشعار المطور فوراً!' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.on('error', err => {
    console.error('ملاحظة سيرفر الموقع العام:', err.message);
  });

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`🌐 [الموقع العام المفتوح للجميع] شغال الآن على المنفذ: ${port}`);
    console.log(`🔗 رابط موقع NO & NO العام: http://localhost:${port}`);
  });

  return server;
}
