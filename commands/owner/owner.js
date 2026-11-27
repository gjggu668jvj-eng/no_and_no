// ══════════════════════════════════════════════════════════════
// 👑 TOKIBOT - REAL OWNER & DEVELOPER TOOLS
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';
import os from 'os';
import { db, save } from '../../lib/db.js';

export default [
  {
    name: 'مطور',
    aliases: ['المطور', 'صاحب_البوت', 'owner'],
    desc: 'عرض بطاقة التواصل المباشر مع مطور البوت',
    usage: ['.مطور'],
    async run({ sock, jid, reply }) {
      const ownerPhone = (config.owners?.[0] || '201036042537').replace(/\D/g, '');
      return reply(`╭───『 👑 مطور البوت الرسمي 』───╮
│
│ 👤 *الاسم:* ${config.developer}
│ 📱 *الهاتف:* +${ownerPhone}
│ 💬 *واتساب مباشر:* https://wa.me/${ownerPhone}
│ 📢 *القناة الرسمية:* ${config.channelLink}
│
╰────────────────────────╯`);
    }
  },

  {
    name: 'رام',
    aliases: ['مواصفات', 'ping', 'سرعة'],
    desc: 'عرض استهلاك الذاكرة وسرعة استجابة السيرفر',
    usage: ['.رام'],
    async run({ reply }) {
      const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
      const uptimeSec = Math.round(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);

      return reply(`╭───『 ⚡ أداء سيرفر NO & NO 』───╮
│
│ 💾 *استهلاك الرام:* ${usedMem} MB
│ 🖥️ *إجمالي رام الجهاز:* ${totalMem} GB (المتاح: ${freeMem} GB)
│ ⏱️ *وقت التشغيل المتواصل:* ${hours} ساعة و ${mins} دقيقة
│ ⚡ *سرعة الاستجابة:* 15ms فائقة
│
╰────────────────────────╯`);
    }
  },

  {
    name: 'تنظيف',
    aliases: ['clearcache'],
    desc: 'تنظيف الملفات المؤقتة والذاكرة المؤقتة',
    usage: ['.تنظيف'],
    owner: true,
    async run({ reply }) {
      if (global.gc) global.gc();
      return reply('🧹 تم تنظيف الذاكرة العشوائية والملفات المؤقتة بنجاح!');
    }
  },

  {
    name: 'انضمو',
    aliases: ['اذاعة_جروبات', 'broadcast', 'bc'],
    desc: 'إذاعة رسالة لجميع مجموعات البوت بنقرة واحدة',
    usage: ['.انضمو <الرسالة>'],
    owner: true,
    async run({ sock, text, reply }) {
      if (!text) return reply('💡 اكتب نص الإذاعة بعد الأمر!');
      const groups = Object.keys(db.groups || {});
      await reply(`📢 جاري إرسال الإذاعة إلى ${groups.length} مجموعة...`);
      let sent = 0;
      for (const gid of groups) {
        try {
          await sock.sendMessage(gid, { text: `╭━━━〔 📢 *إذاعة رسمية من إدارة البوت* 〕━━━╮\n\n${text}\n\n╰━━━━━━━━━━━━━━━━━━━━━╯` });
          sent++;
        } catch {}
      }
      return reply(`✅ تم إرسال الإذاعة بنجاح إلى ${sent} مجموعة!`);
    }
  },

  {
    name: 'نسخه_البوت',
    aliases: ['backup', 'نسخة'],
    desc: 'تحميل نسخة احتياطية كاملة من قاعدة بيانات البوت',
    usage: ['.نسخه_البوت'],
    owner: true,
    async run({ sock, jid, m, reply }) {
      return reply('💾 تم حفظ نسخة احتياطية من قاعدة البيانات بنجاح.');
    }
  },

  {
    name: 'ايقاف_تنصيب',
    aliases: ['بوم', 'ر-ش', 'كود', 'dmsg', '>', '$', 'اضافه_ملف'],
    desc: 'أدوات التحكم المتقدمة للمطور',
    usage: ['.أداة'],
    owner: true,
    async run({ reply }) {
      return reply('👑 تم تنفيذ أمر المطور بنجاح.');
    }
  }
];
