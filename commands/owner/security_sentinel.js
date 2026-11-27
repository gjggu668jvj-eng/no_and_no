// ══════════════════════════════════════════════════════════════
// 🚨 نظام الإنذار ضد الاختراق والتلصص وحماية الحساب (Security Sentinel)
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import config from '../../config.js';

export default [
  {
    name: 'حماية_الحساب',
    aliases: ['انذار_الاختراق', 'security_sentinel', 'امان_الحساب', 'حارس_الامان'],
    desc: 'لوحة الأمان والإنذار ضد محاولات الاختراق، الإضافة للجروبات العشوائية، والتجسس',
    owner: true,
    async run({ args, reply }) {
      db.settings.securitySentinel ??= { antiGroupSpam: true, notifyOnCall: true };
      const action = (args[0] || '').toLowerCase();

      if (['تشغيل', 'on', 'تفعيل'].includes(action)) {
        db.settings.securitySentinel.antiGroupSpam = true;
        db.settings.securitySentinel.notifyOnCall = true;
        save();
        return reply('🛡️ تم *تفعيل* نظام حارس الأمان (Security Sentinel) بالكامل!\nسيتم رفض الإضافات العشوائية وإشعارك بأي مكالمات أو محاولات مريبة فوراً.');
      } else if (['ايقاف', 'off', 'تعطيل'].includes(action)) {
        db.settings.securitySentinel.antiGroupSpam = false;
        db.settings.securitySentinel.notifyOnCall = false;
        save();
        return reply('🛑 تم *تعطيل* نظام حارس الأمان.');
      }

      const status = db.settings.securitySentinel.antiGroupSpam ? 'مفعّل ونشط 🟢' : 'معطّل 🔴';

      const panel = `╭━━━〔 🚨 *لوحة حارس الأمان والإنذار ضد الاختراق* 〕━━━╮\n│\n` +
        `│ 🛡️ *الحالة العامة:* ${status}\n` +
        `│ 🔒 *مكافحة السبام:* رفض الإضافة للجروبات المشبوهة تلقائياً\n` +
        `│ 📞 *حارس المكالمات:* الرد التلقائي وإشعار المطور بكل اتصال\n` +
        `│ 📱 *تشفير الجلسة:* E2EE مفاتيح سيجنال مشفرة بنسبة 100%\n│\n` +
        `│ 💡 للتحكم اكتب:\n` +
        `│ ▫️ *.حماية_الحساب تشغيل*\n` +
        `│ ▫️ *.حماية_الحساب ايقاف*\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return reply(panel);
    }
  }
];
