// ══════════════════════════════════════════════════════════════
// 🏦 TOKIBOT - REAL BANK & ECONOMY SYSTEM
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import { money, numOf } from '../../lib/utils.js';

export default [
  {
    name: 'بنك',
    aliases: ['اوامر_البنك', 'رصيدي', 'رصيد', 'حسابي', 'ثروتي'],
    desc: 'لوحة الحساب البنكي، رصيد المحفظة، الإيداع والسحب والتحويل',
    usage: ['.بنك أو .بنك ايداع <مبلغ> أو .بنك تحويل <مبلغ> @عضو'],
    async run({ sock, jid, m, args, text, reply, pushName }) {
      const sender = m.sender || jid;
      db.users[sender] ??= { money: 1000, bank: 5000, level: 1, xp: 0 };
      const u = db.users[sender];

      const sub = (args[0] || '').toLowerCase();

      // إيداع في البنك
      if (['ايداع', 'deposit'].includes(sub)) {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply('💡 اكتب المبلغ المطلوب إيداعه: *.بنك ايداع 500*');
        if (u.money < amt) return reply(`❌ ليس لديك كاش كافي في محفظتك! رصيد محفظتك: ${money(u.money)} كاش.`);
        u.money -= amt;
        u.bank += amt;
        save();
        return reply(`✅ *تم إيداع ${money(amt)} كاش في حسابك البنكي بنجاح!*\n💳 رصيدك البنكي الجديد: *${money(u.bank)} كاش*`);
      }

      // سحب من البنك
      if (['سحب', 'withdraw'].includes(sub)) {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply('💡 اكتب المبلغ المطلوب سحبه: *.بنك سحب 500*');
        if (u.bank < amt) return reply(`❌ ليس لديك رصيد كافي في البنك! رصيدك البنكي: ${money(u.bank)} كاش.`);
        u.bank -= amt;
        u.money += amt;
        save();
        return reply(`✅ *تم سحب ${money(amt)} كاش إلى محفظتك بنجاح!*\n💵 الكاش في محفظتك الآن: *${money(u.money)} كاش*`);
      }

      // تحويل لعضو آخر
      if (['تحويل', 'transfer'].includes(sub)) {
        const amt = parseInt(args[1]);
        const target = m.quoted ? m.quoted.sender : (args[2] ? args[2].replace(/\D/g, '') + '@s.whatsapp.net' : null);
        if (!amt || amt <= 0 || !target) return reply('💡 *طريقة التحويل:*\n.بنك تحويل <المبلغ> @العضو\nأو بالرد على رسالته مع كتابة: *.بنك تحويل 500*');
        if (u.money < amt) return reply(`❌ ليس لديك كاش كافي للتحويل! محفظتك بها: ${money(u.money)} كاش.`);
        
        db.users[target] ??= { money: 500, bank: 1000 };
        u.money -= amt;
        db.users[target].money += amt;
        save();
        return reply(`💸 *تم تحويل ${money(amt)} كاش بنجاح إلى @${numOf(target)}!* 🎁`, [target]);
      }

      // سرقة / سطو
      if (['سرقة', 'سرقه', 'rob'].includes(sub)) {
        const target = m.quoted ? m.quoted.sender : (args[1] ? args[1].replace(/\D/g, '') + '@s.whatsapp.net' : null);
        if (!target) return reply('💡 منشن الشخص الذي تريد السطو عليه!');
        const success = Math.random() > 0.45;
        if (success) {
          const stolen = Math.floor(Math.random() * 300) + 50;
          u.money += stolen;
          save();
          return reply(`🥷 *نجحت عملية السطو!* سرقت ${money(stolen)} كاش من محفظة @${numOf(target)}! 💰`, [target]);
        } else {
          const fine = 200;
          u.money = Math.max(0, u.money - fine);
          save();
          return reply(`🚨 *أمسكتك الشرطة متلبساً!* تم تغريمك ${money(fine)} كاش!`);
        }
      }

      // عرض البطاقة البنكية
      return reply(`╭───『 🏦 بنك NO & NO المركزي 🏦 』───╮
│
│ 👤 *اسم الحساب:* ${pushName || 'العميل المميز'}
│ 💵 *الكاش في المحفظة:* ${money(u.money)} كاش
│ 💳 *الرصيد في البنك:* ${money(u.bank)} كاش
│ 📈 *إجمالي الثروة:* ${money(u.money + u.bank)} كاش
│ 🏆 *المستوى:* ${u.level || 1}
│
╰────────────────────────╯
💡 *الأوامر السريعة:*
▪️ *.بنك ايداع <المبلغ>* ↢ إيداع في البنك
▪️ *.بنك سحب <المبلغ>* ↢ سحب للمحفظة
▪️ *.بنك تحويل <المبلغ> @عضو* ↢ تحويل فلوس
▪️ *.بنك سرقة @عضو* ↢ تجربة السطو والحظ`);
    }
  }
];
