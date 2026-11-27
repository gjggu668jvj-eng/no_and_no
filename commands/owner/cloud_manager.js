// ══════════════════════════════════════════════════════════════
// 👑 إدارة استضافة ريلواي وميزات المطور الحصرية (Cloud & Pro Manager)
// ══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import os from 'os';
import v8 from 'v8';
import config from '../../config.js';
import { db, save, saveNow } from '../../lib/db.js';
import { fmtDur } from '../../lib/utils.js';
import { sendBackupToOwner } from '../../lib/backup.js';

export default [
  {
    name: 'استهلاك',
    aliases: ['usage', 'موارد', 'ram', 'سيرفر'],
    desc: 'فحص استهلاك الرامات، المعالج، وموارد استضافة Railway',
    owner: true,
    async run({ reply }) {
      const mem = process.memoryUsage();
      const heap = v8.getHeapStatistics();
      const totalRam = (os.totalmem() / 1024 / 1024).toFixed(0);
      const freeRam = (os.freemem() / 1024 / 1024).toFixed(0);
      const usedRss = (mem.rss / 1024 / 1024).toFixed(1);
      const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
      const uptime = fmtDur(process.uptime() * 1000);

      const text = `╭━━━〔 ☁️ *إحصائيات استضافة Railway* 〕━━━╮\n│\n` +
        `│ 💾 *استهلاك البوت (RSS):* ${usedRss} MB\n` +
        `│ 🧠 *ذاكرة الهيب (Heap):* ${heapUsed} MB\n` +
        `│ 🖥️ *رامات السيرفر الكلية:* ${totalRam} MB\n` +
        `│ 🟢 *المساحة الحرة:* ${freeRam} MB\n` +
        `│ ⏱️ *وقت العمل المتواصل:* ${uptime}\n` +
        `│ ⚙️ *نظام التشغيل:* ${os.type()} (${os.arch()})\n` +
        `│ ⚡ *إصدار Node.js:* ${process.version}\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return reply(text);
    }
  },

  {
    name: 'بنق',
    aliases: ['ping', 'سرعة'],
    desc: 'قياس سرعة استجابة البوت وزمن الوصول بالمللي ثانية',
    async run({ m, reply }) {
      const start = Date.now();
      const sent = await reply('⚡ جاري قياس سرعة الاستجابة...');
      const ping = Date.now() - start;
      return reply(`🚀 *سرعة الاستجابة:* *${ping}ms* ⚡`);
    }
  },

  {
    name: 'مسح_الجلسة',
    aliases: ['حذف_الجلسة', 'clear_session', 'clearsession', 'تسجيل_خروج'],
    desc: 'مسح ملفات الجلسة بالكامل وإعادة التشغيل لطلب كود ربط جديد',
    owner: true,
    async run({ reply }) {
      await reply('🧹 *جاري مسح الجلسة القديمة بالكامل...*\nسيتم عمل إعادة تشغيل الآن، وستجد كود الربط الجديد بانتظارك في لوجات ريلواي.');
      try {
        if (fs.existsSync('session')) {
          const files = fs.readdirSync('session');
          for (const file of files) {
            try {
              fs.rmSync(path.join('session', file), { recursive: true, force: true });
            } catch {}
          }
        }
      } catch (e) {
        console.error('خطأ مسح الجلسة:', e.message);
      }
      setTimeout(() => process.exit(0), 1200);
    }
  },

  {
    name: 'ريستارت',
    aliases: ['restart', 'اعادة_تشغيل'],
    desc: 'إعادة تشغيل البوت بسلاسة مع حفظ الجلسة وقاعدة البيانات',
    owner: true,
    async run({ reply }) {
      await reply('🔄 جاري حفظ البيانات وعمل إعادة تشغيل لسيرفر البوت...');
      saveNow();
      setTimeout(() => process.exit(0), 1000);
    }
  },

  {
    name: 'نسخ_احتياطي',
    aliases: ['backup', 'باك_اب', 'نسخة_احتياطية'],
    desc: 'إرسال نسخة احتياطية فورية من قاعدة البيانات إلى رقم المطور في الواتساب',
    owner: true,
    async run({ sock, reply }) {
      await reply('📦 جاري تجهيز النسخة الاحتياطية وإرسالها إلى شاتك الخاص...');
      await sendBackupToOwner(sock);
      return reply('✅ تم إرسال النسخة الاحتياطية بنجاح إلى شاتك الخاص!');
    }
  },

  {
    name: 'توأم_رقمي',
    aliases: ['ghost_twin', 'شبح_الرد', 'المساعد_الشخصي'],
    desc: 'الرد على رسائل الخاص بالذكاء الاصطناعي وبأسلوب المطور أثناء غيابه',
    owner: true,
    async run({ args, reply }) {
      db.settings.ghostTwin ??= false;
      const act = (args[0] || '').toLowerCase();

      if (['تشغيل', 'on', 'تفعيل'].includes(act)) {
        db.settings.ghostTwin = true;
        save();
        return reply('👤 تم *تفعيل* التوأم الرقمي (Ghost Twin) بنجاح!\nسيرد البوت على أصدقائك في الخاص بطريقتك أثناء غيابك.');
      } else if (['ايقاف', 'off', 'تعطيل'].includes(act)) {
        db.settings.ghostTwin = false;
        save();
        return reply('🛑 تم *إيقاف* التوأم الرقمي.');
      }

      const st = db.settings.ghostTwin ? 'مفعّل 🟢' : 'معطّل 🔴';
      return reply(`👤 *التوأم الرقمي للمطور (Ghost Twin)*\n\nالحالة: *${st}*\n\nللتحكم:\n▫️ *.توأم_رقمي تشغيل*\n▫️ *.توأم_رقمي ايقاف*`);
    }
  },

  {
    name: 'توثيق',
    aliases: ['verified', 'رسالة_موثقة'],
    desc: 'إرسال رسالة رسمية تحمل علامة التوثيق الخضراء من واتساب',
    owner: true,
    async run({ sock, jid, args, restText, reply }) {
      const text = restText || args.join(' ');
      if (!text) return reply('اكتب النص المراد إرساله بعلامة التوثيق.\nمثال: *.توثيق بيان رسمي من إدارة البوت*');

      return await sock.sendMessage(jid, {
        text: `🟢 *بيان رسمي موثق* 🟢\n\n${text}`,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363024030403040@newsletter',
            serverMessageId: 1,
            newsletterName: 'NO & NO OFFICIAL ✅'
          }
        }
      });
    }
  },

  {
    name: 'اقتباس_ذكي',
    aliases: ['fake_quote', 'اقتباس_مزيف'],
    desc: 'عمل اقتباس مقلب مضحك باسم أي عضو في الجروب',
    owner: true,
    async run({ sock, jid, target, mentioned, restText, reply }) {
      if (!target && !mentioned[0]) {
        return reply('منشن العضو واكتب الكلام المزيف.\nمثال: *.اقتباس_ذكي @عضو أنا بحب البوت ده جداً*');
      }

      const fakeUser = mentioned[0] || target;
      const fakeMsg = restText.replace(/@\d+/g, '').trim();

      const quoted = {
        key: { remoteJid: jid, fromMe: false, id: 'FAKE' + Date.now(), participant: fakeUser },
        message: { conversation: fakeMsg }
      };

      return await sock.sendMessage(jid, {
        text: `🤔 شفت اللي قاله @${fakeUser.split('@')[0]}؟`,
        mentions: [fakeUser]
      }, { quoted });
    }
  }
];
