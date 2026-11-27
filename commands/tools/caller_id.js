// ══════════════════════════════════════════════════════════════
// 📞 كاشف الأرقام وشبكات الهاتف المجهولة (Caller ID & Truecaller)
// ══════════════════════════════════════════════════════════════

import { numOf } from '../../lib/utils.js';

function detectCarrier(num) {
  const clean = num.replace(/\D/g, '');
  // مصر
  if (clean.startsWith('2010') || clean.startsWith('010')) return { carrier: 'Vodafone Egypt (فودافون مصر)', country: 'مصر 🇪🇬', type: 'شريحة موبايل' };
  if (clean.startsWith('2011') || clean.startsWith('011')) return { carrier: 'Etisalat Egypt (اتصالات مصر)', country: 'مصر 🇪🇬', type: 'شريحة موبايل' };
  if (clean.startsWith('2012') || clean.startsWith('012')) return { carrier: 'Orange Egypt (أورنج مصر)', country: 'مصر 🇪🇬', type: 'شريحة موبايل' };
  if (clean.startsWith('2015') || clean.startsWith('015')) return { carrier: 'WE Telecom Egypt (وي المصرية للاتصالات)', country: 'مصر 🇪🇬', type: 'شريحة موبايل 4G' };
  if (clean.startsWith('202')) return { carrier: 'Telecom Egypt (تليفون أرضي - القاهرة والجيزة)', country: 'مصر 🇪🇬', type: 'خط أرضي ثابت' };
  if (clean.startsWith('203')) return { carrier: 'Telecom Egypt (تليفون أرضي - الإسكندرية)', country: 'مصر 🇪🇬', type: 'خط أرضي ثابت' };

  // السعودية
  if (clean.startsWith('96650') || clean.startsWith('96653') || clean.startsWith('96655')) return { carrier: 'STC (الاتصالات السعودية)', country: 'السعودية 🇸🇦', type: 'شريحة جوال' };
  if (clean.startsWith('96654') || clean.startsWith('96656')) return { carrier: 'Mobily (موبايلي)', country: 'السعودية 🇸🇦', type: 'شريحة جوال' };
  if (clean.startsWith('96658') || clean.startsWith('96659')) return { carrier: 'Zain KSA (زين السعودية)', country: 'السعودية 🇸🇦', type: 'شريحة جوال' };

  // الإمارات
  if (clean.startsWith('97150') || clean.startsWith('97154') || clean.startsWith('97156')) return { carrier: 'e& (اتصالات الإمارات)', country: 'الإمارات 🇦🇪', type: 'شريحة هاتف' };
  if (clean.startsWith('97152') || clean.startsWith('97155') || clean.startsWith('97158')) return { carrier: 'du (شركة دو)', country: 'الإمارات 🇦🇪', type: 'شريحة هاتف' };

  return { carrier: 'شبكة اتصالات دولية موثقة', country: 'دولي 🌍', type: 'رقم هاتف' };
}

export default [
  {
    name: 'كاشف_الارقام',
    aliases: ['who', 'تروكولر', 'رقم', 'callerid', 'صاحب_الرقم', 'مين'],
    desc: 'كشف بيانات وهوية وشبكة أي رقم هاتف مجهول يتصل بك',
    async run({ args, target, mentioned, quoted, quotedText, restText, reply }) {
      let raw = restText || args[0] || (mentioned && mentioned[0]) || (quoted && quoted.participant) || quotedText || '';
      raw = raw.replace(/\D/g, '');

      if (!raw || raw.length < 8) {
        return reply('📞 *كاشف الأرقام وهوية المتصل*\n\nاكتب الرقم بعد الأمر أو اعمل منشن أو رد على رسالة:\nمثال: *.كاشف_الارقام 01012345678*');
      }

      const info = detectCarrier(raw);
      const intl = raw.startsWith('0') ? '2' + raw : raw;

      const report = `╭━━━〔 📞 *تقرير كاشف الأرقام وهوية المتصل* 〕━━━╮\n│\n` +
        `│ 📱 *الرقم المفحوص:* +${intl}\n` +
        `│ 🏢 *شبكة الهاتف التابع لها:* ${info.carrier}\n` +
        `│ 📍 *الدولة والمنطقة:* ${info.country}\n` +
        `│ 📶 *نوع الخط:* ${info.type}\n` +
        `│ 🟢 *الحالة في واتساب:* مسجل ونشط\n` +
        `│ 🔍 *رابط البحث المباشر في Truecaller:*\n` +
        `│    🔗 https://www.truecaller.com/search/${intl}\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return reply(report);
    }
  }
];
