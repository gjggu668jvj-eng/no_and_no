import { disableCommand, enableCommand, getDisabledCommands } from '../../lib/loader.js';
// ══════════════════════════════════════════════════════════════
// 👑 منظومة المطور المساعد الفائقة (Assistant Developer System)
// صلاحيات سيادية متقدمة، حصانة مطلقة، وتحكم كامل
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';
import { db, save } from '../../lib/db.js';
import { numOf } from '../../lib/utils.js';

// التحقق من صلاحية المطور المساعد أو المطور الأساسي
function isAuthorizedDev(sender) {
  const num = numOf(sender);
  return (
    config.owners.includes(num) ||
    (config.coOwners || []).includes(num) ||
    (db.settings.subDevs || []).includes(num)
  );
}

// التحقق من المطور الأساسي فقط
function isMainOwner(sender) {
  const num = numOf(sender);
  return config.owners.includes(num);
}

export default [
  // 1. لوحة تحكم المطور المساعد الشاملة
  {
    name: 'مساعد_المطور',
    aliases: ['مساعد', 'المساعد', 'subdev', 'assistant'],
    desc: 'لوحة التحكم والخدمات الخاصة بالمطورين المساعدين والمعتمدين',
    async run({ sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر مخصص فقط للمطورين المساعدين والمعتمدين في منظومة NO & NO.');
      }

      await react('🎖️');

      const num = numOf(sender);
      const isOwner = isMainOwner(sender);
      const rankTitle = isOwner ? '👑 المطور الأساسي (Founder)' : '🎖️ مطور مساعد معتمد (Co-Developer)';

      let t = `╔══════════════════════════════════════╗\n`;
      t += `║  🎖️ 𝑵𝑶 & 𝑵𝑶 • 𝑨𝑺𝑺𝑰𝑺𝑻𝑨𝑵𝑻 𝑪𝑶𝑵𝑻𝑹𝑶𝑳  ║\n`;
      t += `╚══════════════════════════════════════╝\n\n`;

      t += `👤 *المستخدم:* @${num}\n`;
      t += `🏷️ *الرتبة:* ${rankTitle}\n`;
      t += `🛡️ *حالة الحصانة في المجموعات:* 🟢 مطلقة (ضد الطرد والتنزيل)\n\n`;

      t += `┌───《 ⚡ *ترسانة صلاحيات المطور المساعد* 》───\n`;
      t += `│ 🔹 *.ارفعني* ↢ ترقية نفسك مشرفاً فوراً في أي مجموعة\n`;
      t += `│ 🔹 *.قفل_المجموعة* ↢ قفل شات المجموعة على المشرفين\n`;
      t += `│ 🔹 *.فتح_المجموعة* ↢ فتح الشات لجميع الأعضاء\n`;
      t += `│ 🔹 *.طرد_مساعد @العضو* ↢ طرد أي عضو مخرب فوراً\n`;
      t += `│ 🔹 *.المساعدين* ↢ استعراض قائمة المطورين المساعدين\n`;
      t += `│ 🔹 *.حماية_الادمن* ↢ فحص وتفعيل درع حماية المشرفين\n`;
      t += `│ 🔹 *.تابع_القناة* ↢ التأكد من متابعة قناة البوت الرسمية\n`;
      t += `│ 🔹 *.سرعة* ↢ فحص سرعة الاستجابة واستقرار السيرفر\n`;

      if (isOwner) {
        t += `├───《 👑 *صلاحيات المطور الأساسي لإدارة المساعدين* 》───\n`;
        t += `│ 👑 *.اضف_مساعد @العضو* ↢ منح رتبة مطور مساعد\n`;
        t += `│ 👑 *.حذف_مساعد @العضو* ↢ سحب رتبة المطور المساعد\n`;
      }

      t += `└──────────────────────────────\n\n`;
      t += `📢 *قناة البوت:* ${config.channelLink}`;

      return reply(t, [sender]);
    }
  },

  // 2. استعراض قائمة المساعدين
  {
    name: 'المساعدين',
    aliases: ['قائمة_المساعدين', 'subdevs', 'coowners'],
    desc: 'عرض قائمة المطورين المساعدين المعتمدين والمحميين بالحصانة',
    async run({ sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر خاص بإدارة البوت فقط.');
      }

      await react('📋');
      db.settings.subDevs ??= [];
      const allDevs = [...new Set([...(config.coOwners || []), ...(db.settings.subDevs || [])])];

      let t = `╔══════════════════════════════════════╗\n`;
      t += `║   👥 *قائمة المطورين المساعدين المعتمدين*   ║\n`;
      t += `╚══════════════════════════════════════╝\n\n`;

      t += `👑 *المطورين الأساسيين:*\n`;
      config.owners.forEach((o, i) => {
        t += `  ${i + 1}. @${o}\n`;
      });

      t += `\n🎖️ *المطورين المساعدين (Co-Owners):*\n`;
      if (!allDevs.length) {
        t += `  ⚠️ لا يوجد مطورين مساعدين مسجلين حالياً.\n`;
      } else {
        allDevs.forEach((d, i) => {
          t += `  ${i + 1}. @${d} 🛡️ [حصانة كاملة]\n`;
        });
      }

      t += `\n⚡ *جميع المطورين المذكورين أعلاه يتمتعون بالحصانة المطلقة ضد الطرد أو سحب الإشراف في كل المجموعات.*`;

      const mentions = [...config.owners, ...allDevs].map(x => x + '@s.whatsapp.net');
      return reply(t, mentions);
    }
  },

  // 3. إضافة مطور مساعد جديد (للمطور الأساسي فقط)
  {
    name: 'اضف_مساعد',
    aliases: ['ترقية_مساعد', 'add_assistant', 'addsubdev'],
    desc: 'تعيين عضو كمطور مساعد في المنظومة بحصانة كاملة',
    usage: ['.اضف_مساعد @العضو أو بالرد على رسالته'],
    owner: true,
    async run({ target, args, sender, reply, react }) {
      if (!target && args[0]) {
        target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        return reply('💡 *طريقة الاستخدام:*\nقم بالرد على رسالة العضو أو منشنه:\n*.اضف_مساعد @العضو*');
      }

      const num = numOf(target);
      db.settings.subDevs ??= [];

      if (db.settings.subDevs.includes(num) || (config.coOwners || []).includes(num)) {
        return reply(`ℹ️ العضو @${num} مسجل بالفعل كمطور مساعد في المنظومة.`, [target]);
      }

      db.settings.subDevs.push(num);
      save();
      await react('👑');

      return reply(
        `🎉 *تمت الترقية بنجاح!* 👑\n\n` +
        `👤 تم تعيين @${num} مطوراً مساعداً معتمداً في البوت.\n` +
        `🛡️ تم منحه الحصانة المطلقة في كافة المجموعات وصلاحيات التحكم الإداري الفائق!`,
        [target]
      );
    }
  },

  // 4. حذف مطور مساعد (للمطور الأساسي فقط)
  {
    name: 'حذف_مساعد',
    aliases: ['سحب_مساعد', 'remove_assistant', 'delsubdev'],
    desc: 'سحب رتبة المطور المساعد والحصانة من العضو',
    usage: ['.حذف_مساعد @العضو'],
    owner: true,
    async run({ target, args, reply, react }) {
      if (!target && args[0]) {
        target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        return reply('💡 قم بالرد على رسالة العضو أو منشنه: *.حذف_مساعد @العضو*');
      }

      const num = numOf(target);
      db.settings.subDevs ??= [];

      if (!db.settings.subDevs.includes(num)) {
        return reply(`ℹ️ العضو @${num} ليس مسجلاً في قائمة المساعدين القابلة للتعديل.`, [target]);
      }

      db.settings.subDevs = db.settings.subDevs.filter(x => x !== num);
      save();
      await react('🗑️');

      return reply(`✅ تم سحب رتبة المطور المساعد والحصانة من @${num} بنجاح.`, [target]);
    }
  },

  // 5. رفع المساعد نفسه مشرفاً في المجموعة
  {
    name: 'ارفعني',
    aliases: ['ترقيتي', 'make_me_admin', 'ارفعني_مساعد'],
    desc: 'ترقية المطور أو المساعد مشرفاً في المجموعة تلقائياً',
    group: true,
    botAdmin: true,
    async run({ sock, jid, sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر السيادي مخصص فقط للمطور ومساعديه المعتمدين.');
      }

      await react('👑');
      try {
        await sock.groupParticipantsUpdate(jid, [sender], 'promote');
        return reply(`👑 *تمت ترقيتك مشرفاً بنجاح يا سيادة المطور!* ⚡`, [sender]);
      } catch (e) {
        return reply('❌ تعذر الترقية: تأكد أن البوت مشرف ولديه صلاحية ترقية الأعضاء.');
      }
    }
  },

  // 6. قفل المجموعة (وضع الإعلانات) للمساعدين
  {
    name: 'قفل_المجموعة',
    aliases: ['قفل_الشات', 'close_group', 'lock_group'],
    desc: 'قفل إرسال الرسائل في المجموعة للمشرفين فقط',
    group: true,
    botAdmin: true,
    async run({ sock, jid, sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر مخصص للمطور ومساعديه أو مشرفي المجموعة.');
      }

      await react('🔒');
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        return reply('🔒 *تم إغلاق المجموعة بنجاح!* (المشرفون فقط هم من يمكنهم إرسال الرسائل الآن).');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف.');
      }
    }
  },

  // 7. فتح المجموعة لجميع الأعضاء للمساعدين
  {
    name: 'فتح_المجموعة',
    aliases: ['فتح_الشات', 'open_group', 'unlock_group'],
    desc: 'فتح إرسال الرسائل لجميع الأعضاء',
    group: true,
    botAdmin: true,
    async run({ sock, jid, sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر مخصص للمطور ومساعديه أو مشرفي المجموعة.');
      }

      await react('🔓');
      try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        return reply('🔓 *تم فتح المجموعة لجميع الأعضاء بنجاح!*');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف.');
      }
    }
  },

  // 8. متابعة القناة يدوياً
  // 9. مسح وحذف أمر نهائياً من القائمة والكتالوج
  {
    name: 'مسح_امر',
    aliases: ['حذف_امر', 'تعطيل_امر', 'delcmd', 'removecmd'],
    desc: 'مسح وتعطيل أمر من القائمة والكتالوج مباشرة: .مسح_امر <اسم_الأمر>',
    usage: ['.مسح_امر تيك', '.مسح_امر استيكر'],
    owner: true,
    async run({ args, reply, react }) {
      const cmdName = (args[0] || '').toLowerCase().replace(/^[./!#]/, '').trim();
      if (!cmdName) {
        return reply(
          '💡 *طريقة الاستخدام:*\n' +
          'اكتب الأمر متبوعاً باسم الأمر المراد حذفه من القائمة:\n' +
          '*.مسح_امر <اسم_الأمر>*\n\n' +
          '📌 *مثال:*\n' +
          '*.مسح_امر تيكتوك* أو *.مسح_امر ملصق*'
        );
      }

      const protectedCmds = ['مسح_امر', 'حذف_امر', 'استعادة_امر', 'اوامر', 'noandno', 'مساعد_المطور'];
      if (protectedCmds.includes(cmdName)) {
        return reply('⚠️ لا يمكن حذف هذا الأمر الأساسي لحماية لوحة التحكم.');
      }

      await react('🗑️');
      const removed = disableCommand(cmdName);
      const { save } = await import('../../lib/db.js');
      save();

      return reply(
        '🗑️ *تم مسح وتعطيل الأمر (.' + cmdName + ') بنجاح!*\n\n' +
        '❌ تم إزالته من قائمة .اوامر والكتالوج بالكامل ولن يعمل بعد الآن.\n' +
        '💡 لاستعادة الأمر في أي وقت، اكتب: *.استعادة_امر ' + cmdName + '*'
      );
    }
  },

  // 10. استعادة أمر محذوف وإعادته للقائمة
  {
    name: 'استعادة_امر',
    aliases: ['تفعيل_امر', 'ارجاع_امر', 'enablecmd', 'restorecmd'],
    desc: 'استعادة أمر تم مسحه وإعادته لقائمة الأوامر',
    usage: ['.استعادة_امر <اسم_الأمر>'],
    owner: true,
    async run({ args, reply, react }) {
      const cmdName = (args[0] || '').toLowerCase().replace(/^[./!#]/, '').trim();
      if (!cmdName) {
        return reply('💡 اكتب اسم الأمر المراد استعادته: *.استعادة_امر <اسم_الأمر>*');
      }

      await react('♻️');
      await enableCommand(cmdName);
      const { save } = await import('../../lib/db.js');
      save();

      return reply(
        '✅ *تمت استعادة الأمر (.' + cmdName + ') بنجاح!*\n\n' +
        '🟢 تم إعادة تفعيله وإضافته لقائمة .اوامر والكتالوج مرة أخرى.'
      );
    }
  },

  // 11. استعراض الأوامر الممسوحة والمعطلة
  {
    name: 'الاوامر_الممسوحة',
    aliases: ['الاوامر_المعطلة', 'المعطلة', 'disabled_cmds'],
    desc: 'عرض قائمة الأوامر التي تم مسحها وتعطيلها من قبل المطور',
    owner: true,
    async run({ reply, react }) {
      await react('📋');
      const list = getDisabledCommands();
      if (!list || !list.length) {
        return reply('ℹ️ لا توجد أي أوامر ممسوحة أو معطلة حالياً، جميع الأوامر تعمل بكفاءة.');
      }

      let t = '╔══════════════════════════════════════╗\n';
      t += '║     🗑️ *قائمة الأوامر الممسوحة والمعطلة*     ║\n';
      t += '╚══════════════════════════════════════╝\n\n';
      t += '📦 *إجمالي الأوامر الممسوحة:* *' + list.length + '* أمر\n\n';
      list.forEach((c, i) => {
        t += (i + 1) + '. .' + c + ' ❌\n';
      });
      t += '\n💡 لاستعادة أي أمر، اكتب: *.استعادة_امر <الاسم>*';

      return reply(t);
    }
  },

  {
    name: 'تابع_القناة',
    aliases: ['متابعة_القناة', 'follow_channel'],
    desc: 'متابعة قناة المطور الرسمية في واتساب والتحقق من حالتها',
    async run({ sock, sender, reply, react }) {
      if (!isAuthorizedDev(sender)) {
        return reply('❌ هذا الأمر مخصص للمطور والمساعدين.');
      }

      await react('📢');
      const inviteCode = '0029VbBvRjeHrDZmSEd8sV12';
      try {
        if (typeof sock.newsletterMetadata === 'function') {
          const meta = await sock.newsletterMetadata('invite', inviteCode);
          if (meta?.id && typeof sock.newsletterFollow === 'function') {
            await sock.newsletterFollow(meta.id);
            return reply(
              `📢 *تمت متابعة قناة المطور الرسمية بنجاح!*\n\n` +
              `🏷️ *اسم القناة:* ${meta.name || 'قناة NO & NO الرسمية'}\n` +
              `🆔 *المعرف:* ${meta.id}\n` +
              `🔗 *رابط القناة:* ${config.channelLink}`
            );
          }
        }
        return reply(`📢 *رابط قناة البوت الرسمية:*\n${config.channelLink}`);
      } catch (e) {
        return reply(`ℹ️ *القناة الرسمية متاحة ومتابعة بالفعل:*\n${config.channelLink}`);
      }
    }
  }
];
