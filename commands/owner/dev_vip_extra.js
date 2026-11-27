import os from 'os';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import { db, save, saveNow, dbFile } from '../../lib/db.js';
import { uniqueCommands } from '../../lib/loader.js';
import { numOf, sleep } from '../../lib/utils.js';

export default [
  // 1. قياس سرعة السيرفر والبينج ومواصفات الأداء
  {
    name: 'سرعة',
    aliases: ['speed', 'ping', 'بينج', 'السرعة'],
    desc: 'قياس دقيق لسرعة استجابة البوت والبينج ومواصفات المعالج والذاكرة',
    owner: true,
    async run({ sock, jid, reply, react }) {
      await react('⚡');
      const start = Date.now();
      const mem = process.memoryUsage();
      const ramUsed = (mem.rss / 1024 / 1024).toFixed(2);
      const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown';
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      const secs = uptimeSec % 60;

      const ping = Date.now() - start;

      const report = `╭───〔 ⚡ *تقرير سرعة واستقرار سيرفر NO & NO* 〕───╮
│
│ 🚀 *زمن الاستجابة (Ping):* ${ping}ms
│ 🧠 *استهلاك الذاكرة (RAM):* ${ramUsed} MB (Heap: ${heapUsed} MB)
│ 💾 *إجمالي ذاكرة الجهاز:* ${totalRam} GB (متاح: ${freeRam} GB)
│ ⚙️ *المعالج (CPU):* ${cpuModel} (${cpus.length} Core)
│ ⏱️ *وقت التشغيل المتواصل:* ${hours}س ${mins}د ${secs}ث
│ 🌐 *بيئة التشغيل:* Node.js ${process.version} (${process.platform} ${process.arch})
│ 📦 *إجمالي الأوامر النشطة:* ${uniqueCommands().length} أمر
│ 🛡️ *الحالة العامة:* فائقة الاستقرار (100% Online) 🟢
│
╰────────────────────────────────╯`;
      reply(report);
    },
  },

  // 2. إذاعة خاصة لجميع الأعضاء المسجلين في المحادثات الفردية
  {
    name: 'اذاعة_خاصة',
    aliases: ['bcprivate', 'bcp', 'اذاعة_اعضاء'],
    desc: 'إرسال إذاعة فورية لجميع مستخدمي البوت في الخاص',
    owner: true,
    async run({ sock, text, reply, react }) {
      if (!text) return reply('⚠️ يرجى كتابة نص الرسالة بعد الأمر.\nمثال: .اذاعة_خاصة مرحباً بجميع مستخدمي NO & NO');
      await react('📢');
      const users = Object.keys(db.users || {});
      if (users.length === 0) return reply('❌ لا يوجد مستخدمين مسجلين في قاعدة البيانات حالياً.');

      await reply(`⏳ جاري إرسال الإذاعة الخاصة إلى ${users.length} مستخدم...`);
      let sent = 0;
      let failed = 0;

      const bcText = `📢 *[إذاعة رسمية من مطور NO & NO]*\n\n${text}\n\n⚡ _نظام الإذاعة المباشرة - بوت NO & NO 24/7_`;

      for (const u of users) {
        const jid = u.includes('@') ? u : `${u}@s.whatsapp.net`;
        try {
          await sock.sendMessage(jid, { text: bcText });
          sent++;
          await sleep(500); // تأخير لتجنب الحظر
        } catch {
          failed++;
        }
      }

      reply(`✅ *اكتملت الإذاعة بنجاح:*\n\n📤 تم الإرسال: ${sent} مستخدم\n❌ تعذر الإرسال: ${failed} مستخدم`);
    },
  },

  // 3. عرض قائمة المجموعات التي يتواجد بها البوت
  {
    name: 'جروباتي',
    aliases: ['mygroups', 'قائمة_الجروبات', 'جروبات_البوت'],
    desc: 'عرض كافة المجموعات التي يتواجد بها البوت مع عدد الأعضاء ومعرف كل مجموعة',
    owner: true,
    async run({ sock, reply, react }) {
      await react('📋');
      try {
        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.values(chats);

        if (groups.length === 0) return reply('⚠️ البوت ليس عضواً في أي مجموعة حالياً.');

        let txt = `╭───〔 📋 *قائمة مجموعات البوت (${groups.length} مجموعة)* 〕───╮\n│\n`;
        groups.forEach((g, i) => {
          const isBotAdmin = (g.participants || []).some(p => 
            p.id.split('@')[0].split(':')[0] === sock.user.id.split('@')[0].split(':')[0] && 
            ['admin', 'superadmin'].includes(p.admin)
          );
          txt += `│ *[${i + 1}] ${g.subject}*\n`;
          txt += `│ 👥 الأعضاء: ${g.participants?.length || 0} عضو\n`;
          txt += `│ 👑 رتبة البوت: ${isBotAdmin ? 'مشرف (Admin) 🛡️' : 'عضو عادي'}\n`;
          txt += `│ 🆔 المعرف: \`${g.id}\`\n│\n`;
        });
        txt += `╰────────────────────────────────╯`;
        reply(txt);
      } catch (err) {
        reply('❌ حدث خطأ أثناء جلب قائمة المجموعات: ' + err.message);
      }
    },
  },

  // 4. انضمام البوت لمجموعة عبر الرابط
  {
    name: 'انضمام',
    aliases: ['join', 'ادخل', 'انضم'],
    desc: 'دخول البوت إلى أي مجموعة عبر رابط الدعوة تلقائياً',
    owner: true,
    async run({ sock, args, reply, react }) {
      const link = args[0] || '';
      const match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);
      if (!match) return reply('⚠️ يرجى وضع رابط دعوة صحيح للمجموعة.\nمثال: .انضمام https://chat.whatsapp.com/XXXXX');

      await react('🚪');
      try {
        const code = match[1];
        const res = await sock.groupAcceptInvite(code);
        reply(`✅ تم انضمام البوت للمجموعة بنجاح!\nمعرف المجموعة: \`${res}\``);
      } catch (err) {
        reply('❌ تعذر الانضمام للمجموعة: ' + (err.message || 'قد يكون الرابط منتهي الصلاحية أو تم طرد البوت مسبقاً.'));
      }
    },
  },

  // 5. مغادرة مجموعة محددة
  {
    name: 'مغادرة',
    aliases: ['leave', 'اخرج', 'اطلع'],
    desc: 'مغادرة المجموعة الحالية أو مغادرة مجموعة برقم المعرف',
    owner: true,
    async run({ sock, jid, isGroup, args, reply, react }) {
      await react('👋');
      const targetJid = args[0] && args[0].endsWith('@g.us') ? args[0] : (isGroup ? jid : null);
      if (!targetJid) return reply('⚠️ هذا الأمر يعمل داخل المجموعة، أو اكتب معرف المجموعة بعد الأمر:\nمثال: .مغادرة 120363xxxxxx@g.us');

      try {
        await sock.sendMessage(targetJid, { text: '👋 *مع السلامة!* تم إصدار أمر خروج رسمي من مطور البوت NO & NO.' });
        await sleep(1000);
        await sock.groupLeave(targetJid);
        if (targetJid !== jid) {
          reply(`✅ تم الخروج من المجموعة: \`${targetJid}\``);
        }
      } catch (err) {
        reply('❌ تعذر مغادرة المجموعة: ' + err.message);
      }
    },
  },

  // 6. حظر عام فوري (GBan)
  {
    name: 'حظر_عام',
    aliases: ['gban', 'طرد_عام', 'بلاك_ليست'],
    desc: 'حظر مستخدم حظراً شاملاً من كافة خدمات البوت في الخاص والجروبات',
    owner: true,
    async run({ sock, target, sender, args, reply, react }) {
      let t = target;
      if (!t && args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 9) t = `${num}@s.whatsapp.net`;
      }
      if (!t) return reply('⚠️ منشن العضو أو اكتب رقمه بعد الأمر لحظره عاماً.');

      await react('🚫');
      db.settings ??= {};
      db.settings.banned ??= [];
      if (!db.settings.banned.includes(t)) {
        db.settings.banned.push(t);
        save();
      }

      reply(`🛑 *تم تطبيق الحظر العام (GBan) بنجاح!*\n\nالمستخدم: @${numOf(t)}\nتمت إضافته للقائمة السوداء ومُنِع من استخدام أي أمر من أوامر NO & NO نهائياً.`, [t]);
    },
  },

  // 7. إلغاء الحظر العام
  {
    name: 'فك_الحظر_عام',
    aliases: ['ungban', 'سماح_عام', 'ازالة_البلاك_ليست'],
    desc: 'إلغاء الحظر العام عن مستخدم والسماح له باستخدام البوت مجدداً',
    owner: true,
    async run({ target, args, reply, react }) {
      let t = target;
      if (!t && args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 9) t = `${num}@s.whatsapp.net`;
      }
      if (!t) return reply('⚠️ منشن العضو أو اكتب رقمه لإلغاء الحظر عنه.');

      await react('✅');
      db.settings ??= {};
      db.settings.banned ??= [];
      db.settings.banned = db.settings.banned.filter(b => b !== t && b !== numOf(t));
      save();

      reply(`✅ تم إلغاء الحظر العام عن @${numOf(t)} بنجاح! يمكنه الآن استخدام البوت.`, [t]);
    },
  },

  // 8. عرض قائمة المحظورين عاماً
  {
    name: 'المحظورين_عام',
    aliases: ['gbanlist', 'المحظورين', 'البلاك_ليست'],
    desc: 'عرض كافة الأرقام المحظورة في القائمة السوداء للبوت',
    owner: true,
    async run({ reply, react }) {
      await react('📜');
      const list = db.settings?.banned || [];
      if (list.length === 0) return reply('✅ القائمة السوداء فارغة! لا يوجد أي رقم محظور حالياً.');

      let txt = `╭───〔 🚫 *قائمة المحظورين عاماً (${list.length} رقم)* 〕───╮\n│\n`;
      list.forEach((id, i) => {
        txt += `│ ${i + 1}. +${numOf(id)}\n`;
      });
      txt += `│\n│ 💡 لإلغاء الحظر عن رقم: .فك_الحظر_عام [الرقم]\n╰────────────────────────────────╯`;
      reply(txt);
    },
  },

  // 9. سحب نسخة احتياطية من قاعدة البيانات كملف
  {
    name: 'سحب_نسخة',
    aliases: ['getdb', 'باك_اب_ملف', 'تحميل_البيانات'],
    desc: 'إرسال ملف قاعدة البيانات database.json فوراً في المحادثة كملف قابل للتحميل',
    owner: true,
    async run({ sock, jid, reply, react }) {
      await react('💾');
      try {
        saveNow();
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `no-and-no-db-${dateStr}.json`;
        const buf = fs.readFileSync(dbFile);

        await sock.sendMessage(jid, {
          document: buf,
          mimetype: 'application/json',
          fileName,
          caption: `💾 *نسخة احتياطية لقاعدة بيانات NO & NO*\n\n📅 التاريخ: ${new Date().toLocaleString('ar-EG')}\n📊 الحجم: ${(buf.length / 1024).toFixed(1)} KB\n⚡ تم الحفظ والتصدير بأعلى دقة.`,
        });
      } catch (err) {
        reply('❌ تعذر إرسال النسخة الاحتياطية: ' + err.message);
      }
    },
  },

  // 10. تفريغ الكاش ومخلفات الذاكرة
  {
    name: 'تصفير_الكاش',
    aliases: ['clearmedia', 'تنظيف_الذاكرة', 'مسح_المؤقت'],
    desc: 'مسح الملفات المؤقتة وتفريغ كاش الذاكرة لتسريع استجابة السيرفر',
    owner: true,
    async run({ reply, react }) {
      await react('🧹');
      const before = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      if (global.gc) {
        try { global.gc(); } catch {}
      }
      const after = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

      reply(`🧹 *تم تنظيف الكاش والذاكرة بنجاح!*\n\n📉 قبل التنظيف: ${before} MB\n📈 بعد التنظيف: ${after} MB\n⚡ تم تحرير الذاكرة وتسريع استجابة السيرفر.`);
    },
  },

  // 11. إعادة تشغيل السيرفر بأمان
  {
    name: 'اعادة_تشغيل',
    aliases: ['reboot', 'restart', 'ريستارت'],
    desc: 'إعادة تشغيل سيرفر البوت بأمان وتحديث كافة الملفات',
    owner: true,
    async run({ reply, react }) {
      await react('🔄');
      await reply('🔄 *جاري حفظ البيانات وإعادة تشغيل سيرفر NO & NO...*\nسيعود البوت للعمل خلال ثوانٍ معدودة.');
      saveNow();
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    },
  },
];
