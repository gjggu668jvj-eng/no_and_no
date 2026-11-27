import config from '../../config.js';
import { db, save } from '../../lib/db.js';
import { numOf } from '../../lib/utils.js';
import { activeSubBots, createSubBot } from '../../lib/subbot_server.js';
import fs from 'fs';
import path from 'path';

export default [
  // 1. أمر التنصيب الأساسي (عبر الموقع أو بالرقم مباشرة في الشات)
  {
    name: 'تنصيب',
    aliases: ['موقع', 'رابط_التنصيب', 'منصة', 'pair', 'subbot', 'بوت_فرعي', 'استضافة'],
    desc: 'الحصول على رابط موقع التنصيب أو ربط رقمك كبوت فرعي مستقل في ثواني',
    async run({ sock, sender, args, reply, react, isGroup }) {
      const senderNum = numOf(sender);
      const isOwner = config.owners.includes(senderNum);
      const action = (args[0] || '').toLowerCase();

      // تحكم المطور في تشغيل/إيقاف ميزة التنصيب
      if (isOwner && ['فتح', 'قفل', 'enable', 'disable'].includes(action)) {
        const enable = ['فتح', 'enable'].includes(action);
        db.settings.subbotEnabled = enable;
        save();
        await react('⚙️');
        return reply(`⚙️ تم ${enable ? 'تفعيل 🟢' : 'إيقاف 🔴'} ميزة تنصيب البوتات الفرعية العامة.`);
      }

      const isSubbotEnabled = db.settings.subbotEnabled ?? true;
      if (!isSubbotEnabled && !isOwner) {
        return reply('⛔ ميزة تنصيب البوتات الفرعية مغلقة حالياً من قِبل إدارة البوت.');
      }

      // استخراج رقم الهاتف لو كتبه المستخدم
      const targetNumber = args[0] ? args[0].replace(/\D/g, '') : '';

      // لو لم يكتب الرقم: نعرض له رابط الموقع وطريقة الاستخدام
      if (!targetNumber || targetNumber.length < 10) {
        await react('🌐');
        const webUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
          : 'http://localhost:3000';

        const info = `╭───〔 🌐 *منصة تنصيب البوتات الفرعية* 〕───╮\n│\n` +
          `│ 🤖 *هل تريد نسخة بوت خاصة برقمك تعمل 24/7؟*\n` +
          `│ يمكنك الآن تشغيل بوت فرعي على رقمك بكل سهولة!\n│\n` +
          `│ 🌐 *الطريقة الأولى (عبر الموقع الإلكتروني):*\n` +
          `│ افتح الرابط التالي، واكتب رقمك وستحصل على الكود فوراً:\n` +
          `│ 🔗 ${webUrl}\n│\n` +
          `│ 📱 *الطريقة الثانية (من داخل الواتساب مباشرة):*\n` +
          `│ اكتب الأمر متبوعاً برقمك بالصيغة الدولية:\n` +
          `│ 📌 مثال: *.تنصيب 201012345678*\n` +
          `│ وسيرسل لك البوت كود الربط في الخاص فوراً!\n│\n` +
          `│ 💡 بعد الحصول على الكود:\n` +
          `│ واتساب > الأجهزة المرتبطة > ربط برقم الهاتف.\n` +
          `╰────────────────────────────╯`;
        return reply(info);
      }

      // لو كتب رقمه: نبدأ عملية التوليد الفورية
      await react('⏳');
      await reply(`⏳ جاري تأسيس الاتصال وتوليد كود الربط لرقمك: *+${targetNumber}*...\nانتظر لحظات معدودة وسيصلك الكود.`);

      try {
        const result = await createSubBot(targetNumber);
        if (result.status === 'already_connected') {
          return reply('ℹ️ هذا الرقم متصل ويعمل بالفعل كبوت فرعي حالياً!');
        }

        const formattedCode = result.code;
        await react('🔑');

        const codeMsg = `╭───〔 🔑 *كود ربط البوت الفرعي* 〕───╮\n│\n` +
          `│ 📱 *الرقم:* +${targetNumber}\n` +
          `│ 🔑 *الكود:* *${formattedCode}*\n│\n` +
          `│ 📌 *خطوات التفعيل:*\n` +
          `│ 1. افتح واتساب على هاتفك.\n` +
          `│ 2. الإعدادات > الأجهزة المرتبطة > ربط جهاز.\n` +
          `│ 3. اختر: *الربط برقم الهاتف بدلاً من ذلك*.\n` +
          `│ 4. أدخل الكود أعلاه وسيعمل البوت على رقمك فوراً!\n` +
          `╰────────────────────────────╯`;

        // إرسال الكود في الخاص للمستخدم وفي الشات
        await sock.sendMessage(sender, { text: codeMsg }).catch(() => {});
        await sock.sendMessage(sender, { text: `${formattedCode}` }).catch(() => {});

        if (isGroup) {
          reply(`✅ تم توليد كود الربط بنجاح! تم إرسال الكود إلى محادثتك الخاصة 📩`);
        }
      } catch (err) {
        reply(`❌ فشل توليد كود الربط: ${err.message}`);
      }
    },
  },

  // 2. قائمة البوتات الفرعية النشطة
  {
    name: 'البوتات_الفرعية',
    aliases: ['subbots', 'قائمة_الفرعي', 'بوتات_فرعية'],
    desc: 'عرض كافة البوتات الفرعية المتصلة حالياً بالسيرفر',
    async run({ reply, react }) {
      await react('🤖');
      const list = [...activeSubBots.values()];
      if (!list.length) {
        return reply('ℹ️ لا توجد أي بوتات فرعية متصلة حالياً.\n💡 لتنصيب بوتك الخاص اكتب: *.تنصيب*');
      }

      let msg = `╭───〔 🤖 *البوتات الفرعية النشطة* (${list.length}) 〕───╮\n│\n`;
      list.forEach((b, i) => {
        const status = b.connected ? '🟢 متصل' : '🟡 جاري الربط';
        msg += `│ [${String(i + 1).padStart(2, '0')}] 📱 *+${b.phone}* ─── ${status}\n`;
      });
      msg += `│\n╰────────────────────────────╯`;
      reply(msg);
    },
  },

  // 3. إيقاف بوت فرعي
  {
    name: 'ايقاف_فرعي',
    aliases: ['stop_subbot', 'فصل_فرعي'],
    desc: 'إيقاف وفصل جلسة بوت فرعي: .ايقاف_فرعي 2010...',
    async run({ sender, args, reply, react }) {
      const senderNum = numOf(sender);
      const isOwner = config.owners.includes(senderNum);
      const targetPhone = (args[0] || '').replace(/\D/g, '') || (isOwner ? '' : senderNum);

      if (!targetPhone) return reply('💡 اكتب رقم البوت الفرعي الذي تريد إيقافه.');
      if (!isOwner && targetPhone !== senderNum) {
        return reply('⛔ لا يمكنك إيقاف بوت فرعي لا يخص رقمك.');
      }

      const bot = activeSubBots.get(targetPhone);
      if (!bot) return reply('ℹ️ هذا البوت الفرعي ليس متصلاً حالياً.');

      try {
        bot.sock.end(new Error('Manual shutdown by owner/user'));
        activeSubBots.delete(targetPhone);
        await react('🛑');
        reply(`🛑 تم إيقاف وفصل البوت الفرعي للرقم: *+${targetPhone}* بنجاح.`);
      } catch (e) {
        reply(`❌ فشل الإيقاف: ${e.message}`);
      }
    },
  },

  // 4. حذف بوت فرعي ومسح ملفاته
  {
    name: 'حذف_فرعي',
    aliases: ['delete_subbot', 'تصفير_فرعي'],
    desc: 'حذف جلسة بوت فرعي نهائياً من السيرفر',
    owner: true,
    async run({ args, reply, react }) {
      const targetPhone = (args[0] || '').replace(/\D/g, '');
      if (!targetPhone) return reply('💡 اكتب رقم البوت الفرعي المراد حذف ملفاته نهائياً.');

      const sessionPath = path.join(process.cwd(), 'sessions', `sub_${targetPhone}`);
      if (activeSubBots.has(targetPhone)) {
        try { activeSubBots.get(targetPhone).sock.end(); } catch {}
        activeSubBots.delete(targetPhone);
      }

      if (fs.existsSync(sessionPath)) {
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch {}
      }

      await react('🗑️');
      reply(`🗑️ تم مسح وحذف جلسة البوت الفرعي للرقم: *+${targetPhone}* بالكامل.`);
    },
  },
];
