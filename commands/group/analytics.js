// ══════════════════════════════════════════════════════════════
// 📊 تقرير الجروب اليومي وإحصائيات الأعضاء (Group Analytics)
// ══════════════════════════════════════════════════════════════

import { db } from '../../lib/db.js';
import { numOf, money } from '../../lib/utils.js';

export default [
  {
    name: 'تقرير_اليوم',
    aliases: ['احصائيات_الجروب', 'تفاعل_اليوم', 'analytics', 'تقرير_الجروب'],
    desc: 'تقرير شامل عن تفاعل الجروب اليومي: ملك التفاعل، الشبح، والأعضاء النشطين',
    group: true,
    async run({ sock, jid, meta, reply }) {
      const participants = meta?.participants || [];
      if (!participants.length) return reply('⚠️ تعذر جلب قائمة أعضاء المجموعة.');

      // حساب ترتيب الأعضاء حسب عدد الرسائل والنقاط
      const usersList = participants.map(p => {
        const num = numOf(p.id);
        const u = db.users[num] || {};
        return {
          id: p.id,
          num,
          msgs: u.msgs || 0,
          xp: u.xp || 0,
          money: u.money || 0,
          level: u.level || 1
        };
      });

      usersList.sort((a, b) => b.msgs - a.msgs);

      const topUser = usersList[0] || null;
      const ghostUser = [...usersList].reverse().find(u => u.msgs === 0) || usersList[usersList.length - 1];

      const totalMsgs = usersList.reduce((acc, u) => acc + u.msgs, 0);

      let text = `╭━━━〔 📊 *تقرير الجروب اليومي الشامل* 〕━━━╮\n│\n`;
      text += `│ 👥 *إجمالي الأعضاء:* ${participants.length} عضو\n`;
      text += `│ 💬 *إجمالي التفاعل:* ${money(totalMsgs)} رسالة\n│\n`;

      if (topUser && topUser.msgs > 0) {
        text += `│ 👑 *ملك التفاعل اليومي:* @${topUser.num}\n`;
        text += `│    ↳ أرسل *${topUser.msgs}* رسالة (المستوى: Lv.${topUser.level})\n│\n`;
      }

      if (ghostUser) {
        text += `│ 👻 *شبح الجروب (الخامل):* @${ghostUser.num}\n`;
        text += `│    ↳ يحتاج ينشط شوية ويثبت وجوده!\n│\n`;
      }

      text += `│ 🏆 *أكثر 5 أعضاء تفاعلاً:* \n`;
      usersList.slice(0, 5).forEach((u, i) => {
        text += `│    ${i + 1}. @${u.num} ─── (*${u.msgs}* رسالة)\n`;
      });

      text += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      const mentions = [topUser?.id, ghostUser?.id, ...usersList.slice(0, 5).map(u => u.id)].filter(Boolean);
      return reply(text, mentions);
    }
  }
];
