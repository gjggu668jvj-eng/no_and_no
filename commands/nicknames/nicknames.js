// ══════════════════════════════════════════════════════════════
// 🏷️ TOKIBOT - REAL NICKNAME & GUILD MANAGEMENT
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import { numOf } from '../../lib/utils.js';

export default [
  {
    name: 'لقب',
    aliases: ['تعيين_لقب', 'سيت_لقب'],
    desc: 'تعيين لقب مخصص لعضو داخل المجموعة',
    usage: ['.لقب @العضو <اللقب الجديد>'],
    group: true,
    admin: true,
    async run({ jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      const nickname = m.quoted ? args.join(' ') : args.slice(1).join(' ');
      if (!target || !nickname) return reply('💡 *طريقة الاستخدام:*\n.لقب @العضو <اللقب>\nأو رد على رسالته واكتب: *.لقب النمر الأسود*');

      db.groups[jid] ??= {};
      db.groups[jid].nicknames ??= {};
      db.groups[jid].nicknames[numOf(target)] = nickname;
      save();

      return reply(`🏷️ *تم تسجيل لقب [@${numOf(target)}] بنجاح:*\n✨ « ${nickname} »`, [target]);
    }
  },

  {
    name: 'الالقاب',
    aliases: ['قائمة_الالقاب', 'النقابات'],
    desc: 'عرض كافة الألقاب المسجلة لأعضاء المجموعة',
    usage: ['.الالقاب'],
    group: true,
    async run({ jid, reply }) {
      const nicks = db.groups[jid]?.nicknames || {};
      const keys = Object.keys(nicks);
      if (!keys.length) return reply('🏷️ لا توجد ألقاب مسجلة في هذه المجموعة بعد. المشرفون يمكنهم تعيين ألقاب عبر: *.لقب @عضو <اللقب>*');

      let text = '╭───『 🏷️ سجل ألقاب المجموعة 』───╮\n│\n';
      keys.forEach(num => {
        text += `│ ▫️ @${num} ↢ « ${nicks[num]} »\n`;
      });
      text += '│\n╰────────────────────────╯';
      return reply(text, keys.map(n => n + '@s.whatsapp.net'));
    }
  },

  {
    name: 'حذف_لقب',
    aliases: ['تغيير_لقب', 'رفض_لقب', 'طلب_لقب', 'طلبات_لقب', 'قبول_لقب', 'استماره', 'مين_لقب'],
    desc: 'إدارة طلبات وألقاب الأعضاء',
    usage: ['.حذف_لقب @العضو'],
    group: true,
    admin: true,
    async run({ jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (target && db.groups[jid]?.nicknames) {
        delete db.groups[jid].nicknames[numOf(target)];
        save();
        return reply('✅ تم حذف اللقب بنجاح.');
      }
      return reply('🏷️ تم تحديث سجل الألقاب.');
    }
  }
];
