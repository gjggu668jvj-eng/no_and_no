import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// نظام حماية متقدم ضد أخطاء تشفير الواتساب (Bad MAC / SessionError) لمنع انهيار البوت تلقائياً
const isIgnorableError = (err) => {
  const msg = err?.message || String(err || '');
  const stack = err?.stack || '';
  return (
    msg.includes('Bad MAC') ||
    msg.includes('decryption') ||
    msg.includes('SessionError') ||
    msg.includes('No matching sessions') ||
    msg.includes('Session error') ||
    msg.includes('PreKey') ||
    msg.includes('Closing session') ||
    stack.includes('session_cipher') ||
    stack.includes('libsignal')
  );
};

process.on('uncaughtException', err => {
  if (isIgnorableError(err)) return;
  console.error('UncaughtException:', err?.message || err);
});
process.on('unhandledRejection', err => {
  const stack = err?.stack || '';
  const match = stack.match(/session-([0-9.]+)\.json/) || stack.match(/([0-9]{10,}\.[0-9]+)/);
  if (match && match[1]) {
    try {
      const badFile = path.join('session', `session-${match[1]}.json`);
      if (fs.existsSync(badFile)) {
        fs.unlinkSync(badFile);
        console.log(`🧹 تم إزالة ملف الجلسة التالف تلقائياً لتجديد التشفير: ${badFile}`);
      }
    } catch {}
  }
  if (isIgnorableError(err)) return;
  console.error('UnhandledRejection:', err?.message || err);
});

// اعتراض console.error و console.log لمنع سيل رسائل أخطاء وتفريغ تشفير الجلسات الداخلية من libsignal من إغراق الشاشة
const originalConsoleError = console.error;
console.error = function (...args) {
  const fullText = args.map(a => String(a?.stack || a?.message || a || '')).join(' ');
  if (
    fullText.includes('Session error') ||
    fullText.includes('MessageCounterError') ||
    fullText.includes('Key used already') ||
    fullText.includes('Bad MAC') ||
    fullText.includes('Failed to decrypt message') ||
    fullText.includes('No matching sessions') ||
    fullText.includes('Closing session') ||
    fullText.includes('session_cipher') ||
    fullText.includes('خطأ في الجلسة') ||
    fullText.includes('خطأ في عداد الرسائل')
  ) {
    return; // كتم رسائل تشفير الواتساب الداخلية لمنع إغراق السجلات
  }
  originalConsoleError.apply(console, args);
};

const originalConsoleLog = console.log;
console.log = function (...args) {
  const fullText = args.map(a => String(a?.stack || a?.message || a || '')).join(' ');
  if (
    fullText.includes('Closing open session') ||
    fullText.includes('Closing session:') ||
    fullText.includes('SessionEntry') ||
    fullText.includes('incoming prekey bundle') ||
    fullText.includes('_chains:') ||
    fullText.includes('ephemeralKeyPair:')
  ) {
    return; // كتم تفريغ الجلسات المشفرة لتبقى الشاشة نظيفة ومنظمة
  }
  originalConsoleLog.apply(console, args);
};

// دالة لتنظيف الملفات التالفة فقط في الجلسة إن وجدت دون حذف جلسات التشفير النشطة
function cleanStaleRatchets() {
  try {
    if (fs.existsSync('session')) {
      const files = fs.readdirSync('session');
      for (const f of files) {
        if (f.endsWith('.tmp') || f.endsWith('.corrupt')) {
          try {
            fs.unlinkSync(path.join('session', f));
          } catch {}
        }
      }
    }
  } catch {}
}
import { loadCommands, uniqueCommands } from './lib/loader.js';
import { handle } from './handler.js';
import { onParticipants } from './lib/events.js';
import config from './config.js';
import { db } from './lib/db.js';
import { saveMessage, getStoredMessage } from './lib/message_store.js';
import { initAutoBackup } from './lib/backup.js';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from './lib/baileys.js';
import qrcode from 'qrcode-terminal';
import { startWebServer, startPublicWebServer, reloadExistingSubBots, setMainSocket, setCurrentQR } from './lib/subbot_server.js';

let webServerStarted = false;
function ensureWebServer() {
  if (!webServerStarted) {
    webServerStarted = true;
    try {
      startWebServer();
      startPublicWebServer(5000);
      reloadExistingSubBots().catch(() => {});
    } catch (e) {
      console.error('تحذير تشغيل سيرفر الويب:', e.message);
    }
  }
}

// دالة آمنة لمسح محتويات الجلسة دون حذف مجلد الـ Volume لتجنب خطأ EBUSY
function clearSessionFiles() {
  try {
    if (fs.existsSync('session')) {
      const files = fs.readdirSync('session');
      for (const file of files) {
        try {
          fs.rmSync(path.join('session', file), { recursive: true, force: true });
        } catch {}
      }
      console.log('🧹 تم مسح ملفات الجلسة القديمة بنجاح');
    }
  } catch (e) {
    console.error('تحذير مسح الجلسة:', e.message);
  }
}

// ✅ استعادة الجلسة من متغير البيئة (للنشر على Railway/Heroku)
if (process.env.SESSION_CREDS) {
  try {
    fs.mkdirSync('session', { recursive: true });
    const creds = Buffer.from(process.env.SESSION_CREDS, 'base64').toString('utf8');
    fs.writeFileSync(path.join('session', 'creds.json'), creds);
    console.log('✅ تم استعادة الجلسة من متغير البيئة');
  } catch (e) {
    console.error('❌ فشل استعادة الجلسة:', e.message);
  }
}

// ✅ تفعيل كوكيز يوتيوب من متغير البيئة
if (process.env.YOUTUBE_COOKIES && !fs.existsSync('cookies.txt')) {
  try {
    fs.writeFileSync('cookies.txt', process.env.YOUTUBE_COOKIES.trim(), 'utf8');
    console.log('✅ تم تفعيل ملف cookies.txt من متغيرات البيئة بنجاح');
  } catch (e) {
    console.error('❌ فشل حفظ كوكيز يوتيوب:', e.message);
  }
}

const ask = q => new Promise(r => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, a => {
    rl.close();
    r(a.trim());
  });
});

let isConnecting = false;
let pairingRequested = false;

async function start() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    await loadCommands();
    ensureWebServer();
    console.log(`\n========================================`);
    console.log(`🚀 [${config.botName.toUpperCase()}] - جاري بدء التشغيل...`);
    console.log(`📦 تم تحميل ${uniqueCommands().length} أمر بنجاح`);
    console.log(`👑 المطور: ${config.developer}`);
    console.log(`========================================\n`);

    // مسح الجلسة إجبارياً إذا تم طلب ذلك عبر متغير البيئة
    if (process.env.CLEAR_SESSION === 'true') {
      clearSessionFiles();
    }

    // فحص ما إذا كانت الجلسة مسجلة أو في مرحلة إتمام الربط لنفس الرقم
    let hasRegisteredSession = false;
    if (fs.existsSync('session/creds.json')) {
      try {
        const raw = JSON.parse(fs.readFileSync('session/creds.json', 'utf8') || '{}');
        if (raw.me?.id || raw.registered) {
          const credPhone = raw.me?.id ? raw.me.id.split(':')[0].split('@')[0].replace(/\D/g, '') : '';
          const targetPhone = config.botNumber ? config.botNumber.replace(/\D/g, '') : '';
          if (!credPhone || !targetPhone || credPhone === targetPhone) {
            hasRegisteredSession = true;
          }
        }
      } catch {}
    }

        // لا نمسح الجلسة إلا إذا تغير الرقم المستهدف فقط لمنع مسح المفاتيح أثناء الربط
    if (fs.existsSync('session/creds.json')) {
      try {
        const raw = JSON.parse(fs.readFileSync('session/creds.json', 'utf8') || '{}');
        const credPhone = raw.me?.id ? raw.me.id.split(':')[0].split('@')[0].replace(/\D/g, '') : '';
        const targetPhone = config.botNumber ? config.botNumber.replace(/\D/g, '') : '';
        if (credPhone && targetPhone && credPhone !== targetPhone) {
          console.log('🔄 تغير رقم الهاتف المستهدف. جاري تنظيف الجلسة القديمة...');
          clearSessionFiles();
        }
      } catch {}
    }

    // تنظيف مفاتيح الشاتات القديمة التي تسبب تعليق التشفير (Bad MAC / Key used already) مع الاحتفاظ بالجلسة المسجلة
    cleanStaleRatchets();

    const { state, saveCreds } = await useMultiFileAuthState('session');

    let version = [2, 3000, 1043857760];
    try {
      const v = await fetchLatestBaileysVersion();
      if (v?.version) version = v.version;
    } catch {}

    const msgRetryCounterCache = new Map();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers ? Browsers.macOS('Desktop') : ['Mac OS', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      msgRetryCounterCache,
      getMessage: async key => ({ conversation: '' }),
      shouldIgnoreJid: jid => jid?.endsWith('@broadcast') || jid?.includes('status'),
    });
    setMainSocket(sock);

    sock.ev.on('creds.update', saveCreds);

    let lastPrintedQr = '';

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) { setCurrentQR(qr); }
      const rawPhone = (config.botNumber || '').replace(/\D/g, '');

      // إذا كان الربط بكود الهاتف مفعلاً، يتم إظهار كود رقمي واحد فقط وثابت دون تكرار أو تشويش
      if (rawPhone && !sock.authState.creds.registered) {
        if (!pairingRequested) {
          pairingRequested = true;
          setTimeout(async () => {
            try {
              if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(rawPhone);
                console.log('\n======================================================================');
                console.log('            🚀 [NO AND NO] - كود ربط الواتساب المباشر');
                console.log('======================================================================');
                console.log(`📱 رقم الهاتف المستهدف: [ +${rawPhone} ]`);
                console.log(`🔑 كود الربط (Pairing Code): [  ${code}  ]`);
                console.log('\n👉 خطوات الربط بهاتفك:');
                console.log('   1. افتح تطبيق واتساب في هاتفك > الإعدادات > الأجهزة المرتبطة');
                console.log('   2. اضغط "ربط جهاز" ثم اضغط بالأسفل "الربط باستخدام رقم الهاتف بدلاً من ذلك"');
                console.log(`   3. أدخل الكود الموضح أعلاه المكون من 8 أحرف: [ ${code} ]`);
                console.log('⏳ الكود ثابت ومستقر الآن، ولن يتكرر أو يتغير حتى تدخله بهدوء.');
                console.log('======================================================================\n');
              }
            } catch (e) {
              console.log('ملاحظة كود الربط:', e?.message || e);
            }
          }, 2500);
        }
      } else if (!rawPhone && qr && !sock.authState.creds.registered && qr !== lastPrintedQr) {
        // في حال عدم وجود رقم هاتف، يظهر باركود الكاميرا فقط
        lastPrintedQr = qr;
        try {
          console.log('\n======================================================================');
          console.log('            🚀 [NO AND NO] - امسح الباركود للربط');
          console.log('======================================================================\n');
          qrcode.generate(qr, { small: true });
          console.log('\n📷 افتح واتساب > الأجهزة المرتبطة > ربط جهاز > وجّه الكاميرا للباركود');
          console.log('======================================================================\n');
        } catch (e) {}
      }

      if (connection === 'open') {
        isConnecting = false;
        pairingRequested = false;
        console.log(`\n========================================`);
        console.log(`🟢 [${config.botName}] متصل وشغال بنجاح الآن!`);
        console.log(`========================================\n`);
        initAutoBackup(sock);

        // 📢 جلب وحفظ بيانات قناة المطور الرسمية الحقيقية وتحديثها فورياً
        (async () => {
          try {
            const inviteCode = '0029VbBvRjeHrDZmSEd8sV12';
            if (typeof sock.newsletterMetadata === 'function') {
              const meta = await sock.newsletterMetadata('INVITE', inviteCode);
              console.log('📢 [بيانات القناة الرسمية الحقيقية]:', JSON.stringify({ id: meta?.id, name: meta?.name }));
              if (meta?.id) {
                config.newsletterJid = meta.id;
                config.newsletterName = meta.name || 'no and no';
                // حفظ معرف القناة في ملف الإعدادات ليظل دائماً محدثاً
                try {
                  const cfgPath = path.resolve('config.js');
                  let cfgText = fs.readFileSync(cfgPath, 'utf8');
                  cfgText = cfgText.replace(/newsletterJid:s*['"][^'"]*['"]/, `newsletterJid: '${meta.id}'`);
                  cfgText = cfgText.replace(/newsletterName:s*['"][^'"]*['"]/, `newsletterName: '${meta.name || 'no and no'}'`);
                  fs.writeFileSync(cfgPath, cfgText, 'utf8');
                } catch {}
              }
            }
          } catch (e) {
            console.log('ℹ️ إشعار جلب بيانات القناة:', e.message);
          }
        })();
      }

      if (connection === 'close') {
        isConnecting = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          pairingRequested = false;
          if (sock.authState.creds.registered) {
            console.log('🔴 تم تسجيل الخروج من الهاتف. جاري مسح الجلسة القديمة...');
            clearSessionFiles();
          } else {
            console.log('⚠️ خطأ مؤقت في مصافحة الربط، جاري إعادة المحاولة بحفاظ على المفاتيح...');
          }
          setTimeout(start, 3000);
        } else if (code === DisconnectReason.restartRequired || code === 515) {
          console.log('⚡ تم تأكيد الربط بنجاح! جاري تثبيت الجلسة والاتصال...');
          setTimeout(start, 2000);
        } else {
          const waitTime = sock.authState.creds.registered ? 2000 : 15000;
          setTimeout(start, waitTime);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const m of messages) {
        if (!m?.message) continue;

        // كاشف الرسائل المحذوفة (Anti-Delete)
        const protoMsg = m.message?.protocolMessage;
        if (protoMsg && (protoMsg.type === 0 || protoMsg.type === 5)) {
          const deletedId = protoMsg.key?.id;
          const jid = m.key.remoteJid;
          if (deletedId && jid?.endsWith('@g.us')) {
            const g = db.groups[jid] || {};
            if (g.antidelete !== false) {
              const old = getStoredMessage(deletedId);
              if (old && !old.fromMe) {
                const senderNum = (old.participant || m.key.participant || '').split('@')[0];
                let alert = `╭━━━〔 🕵️ *كاشف الرسائل المحذوفة* 〕━━━╮\n│\n` +
                  `│ 👤 العضو: @${senderNum}\n` +
                  `│ 🕒 الوقت: ${new Date(old.timestamp).toLocaleTimeString('ar-EG')}\n` +
                  `│ 🗑️ قام بحذف الرسالة التالية:\n`;
                if (old.text) alert += `│ 💬 "${old.text}"\n`;
                alert += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

                if (old.media && old.mime?.startsWith('image/')) {
                  sock.sendMessage(jid, { image: old.media, caption: alert, mentions: [old.participant].filter(Boolean) }).catch(() => {});
                } else if (old.media && old.mime?.startsWith('video/')) {
                  sock.sendMessage(jid, { video: old.media, caption: alert, mentions: [old.participant].filter(Boolean) }).catch(() => {});
                } else {
                  sock.sendMessage(jid, { text: alert, mentions: [old.participant].filter(Boolean) }).catch(() => {});
                }
              }
            }
          }
          continue;
        }

        // صائد رسائل العرض لمرة واحدة تلقائياً وتخزينها للفك الفوري (Auto-Unveil ViewOnce)
        const isVO = Boolean(m.message?.viewOnceMessage || m.message?.viewOnceMessageV2 || m.message?.viewOnceMessageV2Extension);
        if (isVO && !m.key.fromMe) {
          try {
            const voMsg = m.message?.viewOnceMessage?.message || m.message?.viewOnceMessageV2?.message || m.message?.viewOnceMessageV2Extension?.message;
            if (voMsg?.imageMessage || voMsg?.videoMessage) {
              const buf = await downloadMediaMessage(
                { key: m.key, message: voMsg },
                'buffer',
                {},
                { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
              );
              if (buf) {
                saveMessage(m, buf, voMsg?.imageMessage ? 'image/jpeg' : 'video/mp4');
                const isAutoOn = db.settings?.autoUnveilViewOnce !== false;
                if (isAutoOn) {
                  const senderNum = (m.key.participant || m.key.remoteJid || '').split('@')[0];
                  const caption = `🔓 *صائد رسائل العرض لمرة واحدة (Anti-ViewOnce)* ✨\n\n👤 أرسلها: @${senderNum}\n👁️ تم فك التشفير وإظهارها للجميع بشكل دائم!`;
                  if (voMsg?.imageMessage) {
                    sock.sendMessage(m.key.remoteJid, { image: buf, caption, mentions: [m.key.participant || m.key.remoteJid] }, { quoted: m }).catch(() => {});
                  } else {
                    sock.sendMessage(m.key.remoteJid, { video: buf, caption, mentions: [m.key.participant || m.key.remoteJid] }, { quoted: m }).catch(() => {});
                  }
                }
              }
            }
          } catch (e) {
            console.error('ملاحظة فك وسائط المرة الواحدة:', e.message);
          }
        }

        // تخزين الرسالة للرجوع إليها عند الحذف (إذا لم تكن مخزنة مع الوسائط بالفعل)
        if (!isVO) {
          saveMessage(m);
        }

        console.log(`📩 [رسالة جديدة] من: ${m.key.remoteJid} | fromMe: ${m.key.fromMe}`);
        handle(sock, m).catch(e => console.error('❌ خطأ في معالجة الرسالة:', e));
      }
    });

    sock.ev.on('group-participants.update', ({ id, participants, action, author }) => {
      onParticipants(sock, id, participants, action, author).catch(e => console.error('Error in participant update:', e));
    });

    // 📞 حارس المكالمات التلقائي والرد الصوتي المباشر (AI Live Call Responder)
    sock.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer') {
          console.log(`📞 مكالمة واردة من: ${call.from} | جاري الرفض اللبق والرد...`);
          try {
            await sock.rejectCall(call.id, call.from);
          } catch {}

          const callerNum = call.from.split('@')[0];
          const callerJid = call.from;
          const msg = 'أهلاً بك يا فندم! أنا المساعد الذكي الخاص بالمطور. المطور غير متاح حالياً للرد على المكالمات الهاتفية، يرجى ترك رسالتك هنا وسيراها فور عودته. شكراً لتفهمك!';

          try {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=ar&client=tw-ob`;
            const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (r.ok) {
              const buf = Buffer.from(await r.arrayBuffer());
              await sock.sendMessage(callerJid, { audio: buf, mimetype: 'audio/mp4', ptt: true });
            }
          } catch {
            await sock.sendMessage(callerJid, { text: `📞 *المساعد الشخصي للمطور:*\n\n${msg}` });
          }

          // إرسال إشعار فوري لرقم المطور
          const ownerJid = config.owners[0] ? `${config.owners[0].replace(/\D/g, '')}@s.whatsapp.net` : null;
          if (ownerJid) {
            const timeStr = new Date().toLocaleTimeString('ar-EG');
            const alert = `╭━━━〔 📞 *تنبيه مكالمة هاتفية واردة* 〕━━━╮\n│\n` +
              `│ 👤 *المتصل:* @${callerNum}\n` +
              `│ 🕒 *الوقت:* ${timeStr}\n` +
              `│ 🤖 تم الرفض اللبق وإرسال تسجيل صوتي موجه له.\n│\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            await sock.sendMessage(ownerJid, { text: alert, mentions: [call.from] }).catch(() => {});
          }
        }
      }
    });

  } catch (err) {
    isConnecting = false;
    console.error('❌ خطأ أثناء بدء البوت:', err);
    setTimeout(start, 5000);
  }
}

start();
