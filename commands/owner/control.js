import { db, user, save } from '../../lib/db.js';
import { money, numOf, fmtDur } from '../../lib/utils.js';
import { uniqueCommands } from '../../lib/loader.js';
import config from '../../config.js';

export default [
  { name: 'احصائيات_شامل', aliases: ['fullstats'], desc: 'تقرير شامل عن اقتصاد البوت وكل المستخدمين',
    async run({ reply }) {
      const users = Object.values(db.users);
      const totalMoney = users.reduce((s, u) => s + u.money + u.bank, 0);
      const avgLevel = users.length ? (users.reduce((s, u) => s + u.level, 0) / users.length).toFixed(1) : 0;
      const richest = [...users].sort((a, b) => (b.money + b.bank) - (a.money + a.bank))[0];
      const jobs = users.filter(u => u.job).length;
      reply(`📊 *تقرير شامل*\n\n👥 المستخدمين: ${users.length}\n🏘️ الجروبات: ${Object.keys(db.groups).length}\n` +
        `💰 إجمالي الفلوس في الاقتصاد: ${money(totalMoney)}\n⭐ متوسط المستوى: ${avgLevel}\n` +
        `💼 عندهم وظيفة: ${jobs}\n🚫 محظورين: ${db.settings.banned.length}\n` +
        `👑 أغنى واحد: ${richest ? money(richest.money + richest.bank) : '-'}\n🎯 إجمالي الأوامر: ${uniqueCommands().length}`);
    } },

  { name: 'بحث_مستخدم', aliases: ['finduser'], desc: 'تفاصيل كاملة عن أي مستخدم: /بحث_مستخدم @شخص',
    async run({ target, reply }) {
      if (!target) return reply('↩️ منشن الشخص أو اكتب رقمه.');
      const u = user(target); const k = numOf(target);
      reply(`🔎 *بيانات @${k}*\n\n👛 المحفظة: ${money(u.money)}\n🏦 البنك: ${money(u.bank)}\n⭐ المستوى: ${u.level} (${u.xp} XP)\n` +
        `💼 الوظيفة: ${u.job || '-'}\n🐾 الحيوان: ${u.pet || '-'}\n💍 متزوج: ${u.married ? '@' + u.married : 'لا'}\n` +
        `💬 الرسائل: ${u.msgs}\n🏦 قرض حالي: ${u.loan ? money(u.loan.amount) : 'لا يوجد'}`, [target]);
    } },

  { name: 'تعديل_مستخدم', aliases: ['edituser'], desc: 'تعديل مباشر: /تعديل_مستخدم @شخص money 5000',
    async run({ target, args, reply }) {
      if (!target) return reply('↩️ منشن الشخص.\nمثال: /تعديل_مستخدم @شخص money 5000');
      const field = args[0], val = args[1];
      const u = user(target);
      const allowed = ['money', 'bank', 'level', 'xp'];
      if (!allowed.includes(field)) return reply(`الحقول المسموحة: ${allowed.join(', ')}`);
      const n = parseInt(val);
      if (isNaN(n)) return reply('اكتب رقم صحيح.');
      u[field] = n; save();
      reply(`✅ اتعدّل ${field} لـ @${numOf(target)} = ${n}`, [target]);
    } },

  { name: 'تعطيل_امر', aliases: ['disablecmd'], desc: 'تعطيل أمر مؤقتًا للجميع: /تعطيل_امر نرد',
    async run({ args, reply }) {
      const name = (args[0] || '').toLowerCase();
      if (!name) return reply('اكتب اسم الأمر. مثال: /تعطيل_امر نرد');
      db.settings.disabled ??= [];
      if (!db.settings.disabled.includes(name)) db.settings.disabled.push(name);
      save(); reply(`🚫 الأمر "${name}" اتعطل مؤقتًا.`);
    } },

  { name: 'تفعيل_امر', aliases: ['enablecmd'], desc: 'إعادة تفعيل أمر معطّل',
    async run({ args, reply }) {
      const name = (args[0] || '').toLowerCase();
      db.settings.disabled = (db.settings.disabled || []).filter(n => n !== name);
      save(); reply(`✅ الأمر "${name}" اشتغل تاني.`);
    } },

  { name: 'الاوامر_المعطلة', aliases: ['disabledlist'], desc: 'عرض الأوامر المعطّلة حاليًا',
    async run({ reply }) {
      const d = db.settings.disabled || [];
      reply(d.length ? '🚫 *الأوامر المعطّلة*\n\n' + d.map(n => `▫️ /${n}`).join('\n') : '✅ مفيش أوامر معطّلة.');
    } },

  { name: 'لوحة_التحكم', aliases: ['dashboard', 'panel'], desc: 'ملخص سريع لحالة البوت',
    async run({ reply }) {
      const users = Object.values(db.users);
      reply(`🎛️ *لوحة تحكم ${config.botName}*\n\n` +
        `🟢 البوت شغال\n👥 ${users.length} مستخدم  ·  🏘️ ${Object.keys(db.groups).length} جروب\n` +
        `🚫 ${db.settings.banned.length} محظور من البوت  ·  🔧 الوضع: ${db.settings.mode === 'private' ? 'صيانة' : 'عام'}\n` +
        `🎯 ${uniqueCommands().length} أمر متاح\n\n` +
        `أوامر سريعة:\n/احصائيات_شامل  /جلب_لوج  /صيانة  /إعادة_تشغيل`);
    } },

  { name: 'تصفير_الكل', aliases: ['resetall'], desc: 'تصفير بيانات كل المستخدمين (خطير! تأكيد مطلوب)',
    async run({ args, reply }) {
      if ((args[0] || '') !== 'تأكيد') return reply('⚠️ ده هيمسح بيانات كل المستخدمين (فلوس، مستويات، كل حاجة).\nلو متأكد: /تصفير_الكل تأكيد');
      db.users = {}; save();
      reply('🗑️ تم تصفير بيانات كل المستخدمين.');
    } },
];
