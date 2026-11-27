import os from 'os';
import config from '../../config.js';
import { uniqueCommands } from '../../lib/loader.js';
import { db } from '../../lib/db.js';
import { fmtDur, money } from '../../lib/utils.js';

export default [
  { name: 'وقت_التشغيل', aliases: ['runtime', 'uptime'], desc: 'مدة تشغيل البوت منذ آخر إعادة تشغيل',
    async run({ reply }) {
      reply(`╭━━━〔 ⏱️ *مدة التشغيل* 〕━━━╮\n│\n│ 🚀 البوت يعمل بدون انقطاع منذ:\n│ ⌛ *${fmtDur(process.uptime() * 1000)}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'معلومات_البوت', aliases: ['botinfo', 'عن_البوت'], desc: 'معلومات تقنية شاملة عن البوت والنظام',
    async run({ reply }) {
      const mem = (process.memoryUsage().rss / 1048576).toFixed(0);
      let t = `╭━━━〔 🤖 *معلومات النظام* 〕━━━╮\n│\n`;
      t += `│ 🤖 اسم البوت: *${config.botName}*\n`;
      t += `│ 👑 المطور الأساسي: *${config.developer}*\n`;
      t += `│ ⚡ البادئة: [ *${config.prefix}* ]\n`;
      t += `│ 🎯 إجمالي الأوامر: *${uniqueCommands().length}* أمر\n`;
      t += `│ ⏱️ التشغيل: *${fmtDur(process.uptime() * 1000)}*\n`;
      t += `│ 💾 استهلاك الذاكرة: *${mem} MB*\n`;
      t += `│ 🟢 محرك Node: *${process.version}*\n`;
      t += `│ 🖥️ نظام التشغيل: *${os.platform()} (${os.arch()})*\n`;
      t += `│ 👥 المستخدمين المسجلين: *${Object.keys(db.users).length}*\n`;
      t += `│ 💬 المجموعات النشطة: *${Object.keys(db.groups).length}*\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },

  { name: 'المطور', aliases: ['owner', 'dev', 'صاحب_البوت'], desc: 'الحصول على بطاقة اتصال المطور المباشرة',
    async run({ send, reply }) {
      const num = config.owners[0];
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${config.developer}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD`;
      await send({ contacts: { displayName: config.developer, contacts: [{ vcard }] } });
      reply(`👑 *مطور البوت:* ${config.developer}\n📱 رقم الهاتف: wa.me/${num}`);
    } },

  { name: 'عدد_الاوامر', aliases: ['cmdcount'], desc: 'عرض عدد الأوامر المفعلة',
    async run({ reply }) {
      reply(`🎯 عدد أوامر البوت المتاحة للتشغيل: *${uniqueCommands().length}* أمر.`);
    } },

  { name: 'ابلاغ', aliases: ['report'], desc: 'إرسال تقرير عن عطل أو مشكلة للمطور',
    async run({ sock, text, sender, reply }) {
      if (!text) return reply('اكتب وصف المشكلة بالتفصيل بعد الأمر.\nمثال: */ابلاغ أمر اليوتيوب لا يعمل بشكل صحيح*');
      const num = config.owners[0];
      await sock.sendMessage(num + '@s.whatsapp.net', {
        text: `🐞 *تقرير عن مشكلة*\n👤 من: wa.me/${sender.split('@')[0]}\n📝 البلاغ:\n${text}`,
      });
      reply('╭━━━〔 ✅ *تم إرسال البلاغ* 〕━━━╮\n│\n│ 📬 تم إيصال بلاغك مباشرة للمطور.\n│ 🌹 شكراً لمساعدتنا في تحسين البوت!\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯');
    } },

  { name: 'اقتراح', aliases: ['suggest'], desc: 'إرسال اقتراح ميزة جديدة للمطور',
    async run({ sock, text, sender, reply }) {
      if (!text) return reply('اكتب فكرة الاقتراح بعد الأمر.\nمثال: */اقتراح إضافة لعبة xo بين الأعضاء*');
      const num = config.owners[0];
      await sock.sendMessage(num + '@s.whatsapp.net', {
        text: `💡 *اقتراح تطويري جديد*\n👤 من: wa.me/${sender.split('@')[0]}\n💡 الفكرة:\n${text}`,
      });
      reply('╭━━━〔 💡 *تم إرسال اقتراحك* 〕━━━╮\n│\n│ 📬 وصل اقتراحك للمطور بنجاح.\n│ ✨ نقدر أفكارك ومشاركتك في تطوير البوت!\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯');
    } },

  { name: 'احصائيات', aliases: ['stats'], desc: 'إحصائيات استخدام البوت والتفاعل',
    async run({ reply }) {
      const users = Object.values(db.users);
      const totalMsgs = users.reduce((s, u) => s + (u.msgs || 0), 0);
      let t = `╭━━━〔 📊 *إحصائيات عامة* 〕━━━╮\n│\n`;
      t += `│ 👥 إجمالي المستخدمين: *${users.length}*\n`;
      t += `│ 💬 إجمالي الرسائل المسجلة: *${money(totalMsgs)}*\n`;
      t += `│ 🏘️ المجموعات: *${Object.keys(db.groups).length}*\n`;
      t += `│ 🚫 المحظورين من البوت: *${db.settings.banned.length}*\n`;
      t += `│ ⏱️ مدة التشغيل: *${fmtDur(process.uptime() * 1000)}*\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },
];
