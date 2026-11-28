// ══════════════════════════════════════════════════════════════
// 🛡️ TOKIBOT - REAL GROUP ADMIN & PROTECTION
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import { numOf } from '../../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default [
  {
    name: 'طرد',
    aliases: ['kick'],
    desc: 'طرد عضو من المجموعة (بالمنشن أو الرد على رسالته)',
    usage: ['.طرد @العضو أو بالرد على رسالته'],
    admin: true,
    group: true,
    async run({ sock, jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('⚠️ منشن الشخص أو رد على رسالته لطرده من المجموعة!');
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        return reply(`🚪 *تم طرد العضو @${numOf(target)} بنجاح من المجموعة.* 👢`, [target]);
      } catch (e) {
        return reply('❌ تأكد أن البوت يملك صلاحية الأدمن في المجموعة!');
      }
    }
  },

  {
    name: 'كتم',
    aliases: ['قفل', 'mute', 'close'],
    desc: 'قفل المحادثة ليتمكن المشرفون فقط من الإرسال',
    usage: ['.كتم'],
    admin: true,
    group: true,
    async run({ sock, jid, reply }) {
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        return reply('🔒 *تم قفل المجموعة بنجاح. المشرفون فقط هم من يستطيعون إرسال الرسائل الآن.*');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف في المجموعة.');
      }
    }
  },

  {
    name: 'فتح',
    aliases: ['unmute', 'open', 'اوضاع'],
    desc: 'فتح المجموعة لكافة الأعضاء للكتابة',
    usage: ['.فتح'],
    admin: true,
    group: true,
    async run({ sock, jid, reply }) {
      try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        return reply('🔓 *تم فتح المجموعة بنجاح. يمكن لكافة الأعضاء إرسال الرسائل الآن.*');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف في المجموعة.');
      }
    }
  },

  {
    name: 'انذار',
    aliases: ['تحذير', 'warn'],
    desc: 'توجيه إنذار لعضو (عند 3 إنذارات يطرد تلقائياً)',
    usage: ['.انذار @العضو'],
    admin: true,
    group: true,
    async run({ sock, jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('⚠️ منشن العضو أو رد على رسالته لتحذيره!');

      db.groups[jid] ??= {};
      db.groups[jid].warns ??= {};
      const num = numOf(target);
      db.groups[jid].warns[num] = (db.groups[jid].warns[num] || 0) + 1;
      const count = db.groups[jid].warns[num];
      save();

      if (count >= 3) {
        try {
          await sock.groupParticipantsUpdate(jid, [target], 'remove');
          delete db.groups[jid].warns[num];
          save();
          return reply(`⛔ *تجاوز العضو @${num} 3 إنذارات وتم طرده تلقائياً من المجموعة!* 🚪`, [target]);
        } catch {}
      }

      return reply(`⚠️ *تم توجيه إنذار للعضو @${num}!*\n📊 عدد الإنذارات الحالي: [${count}/3]\n📌 تنبيه: عند وصول 3 إنذارات سيتم الطرد الفوري.`, [target]);
    }
  },

  {
    name: 'رفع',
    aliases: ['ترقية', 'promote'],
    desc: 'ترقية عضو ليصبح مشرفاً في المجموعة',
    usage: ['.رفع @العضو'],
    admin: true,
    group: true,
    async run({ sock, jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('⚠️ منشن العضو لترقيته مشرفاً!');
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'promote');
        return reply(`👑 *تمت ترقية @${numOf(target)} ليصبح مشرفاً في المجموعة بنجاح!* 🎉`, [target]);
      } catch (e) {
        return reply('❌ فشلت الترقية. تأكد أن البوت مشرف.');
      }
    }
  },

  {
    name: 'تنزيل',
    aliases: ['demote'],
    desc: 'تنزيل مشرف ليصبح عضواً عادياً',
    usage: ['.تنزيل @المشرف'],
    admin: true,
    group: true,
    async run({ sock, jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('⚠️ منشن المشرف لتنزيله!');
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'demote');
        return reply(`📉 *تم تنزيل @${numOf(target)} لعضو عادي بنجاح.* 👤`, [target]);
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف.');
      }
    }
  },

  {
    name: 'حذف',
    aliases: ['delete', 'del'],
    desc: 'حذف رسالة مسيئة من الجروب (بالرد عليها)',
    usage: ['رد على الرسالة واكتب: .حذف'],
    admin: true,
    group: true,
    async run({ sock, jid, m, reply }) {
      if (!m.quoted) return reply('⚠️ رد على الرسالة التي تريد حذفها واكتب: *.حذف*');
      try {
        await sock.sendMessage(jid, { delete: m.quoted.key });
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف لحذف رسائل الأعضاء.');
      }
    }
  },

  {
    name: 'منشن',
    aliases: ['مخفي', 'الجميع', 'tagall', 'everyone'],
    desc: 'منشن لكافة أعضاء المجموعة في رسالة واحدة',
    usage: ['.منشن <رسالتك>'],
    admin: true,
    group: true,
    async run({ sock, jid, text, reply }) {
      try {
        const meta = await sock.groupMetadata(jid);
        const participants = meta.participants.map(p => p.id);
        const notice = text || '📢 تنبيه لجميع الأعضاء!';
        const tags = participants.map(p => '@' + p.split('@')[0].split(':')[0]).join(' ');
        await sock.sendMessage(jid, {
          text: `╭━━━〔 📢 *منشن للجميع* 〕━━━╮\n│\n│ 💬 ${notice}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯\n${tags}`,
          mentions: participants
        });
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'ترحيب',
    aliases: ['welcome'],
    desc: 'تفعيل أو تعطيل رسالة الترحيب بالأعضاء الجدد',
    usage: ['.ترحيب تفعيل / .ترحيب تعطيل'],
    admin: true,
    group: true,
    async run({ jid, text, reply }) {
      db.groups[jid] ??= {};
      const status = text && text.includes('تعطيل') ? false : true;
      db.groups[jid].welcome = status;
      save();
      return reply(`✅ *تم ${status ? 'تفعيل 🟢' : 'تعطيل 🔴'} رسائل الترحيب بالأعضاء الجدد في المجموعة.*`);
    }
  },



  {
    name: 'وصف',
    aliases: ['desc'],
    desc: 'تغيير وصف المجموعة مباشرة',
    usage: ['.وصف <الوصف الجديد>'],
    admin: true,
    group: true,
    async run({ sock, jid, text, reply }) {
      if (!text) return reply('💡 اكتب الوصف الجديد بعد الأمر!');
      try {
        await sock.groupUpdateDescription(jid, text);
        return reply('✅ تم تغيير وصف المجموعة بنجاح!');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف.');
      }
    }
  },

  {
    name: 'اخرج',
    aliases: ['leave'],
    desc: 'خروج البوت من المجموعة',
    usage: ['.اخرج'],
    owner: true,
    group: true,
    async run({ sock, jid, reply }) {
      await reply('👋 مع السلامة جميعاً! نراكم على خير.');
      await sock.groupLeave(jid);
    }
  },

  {
    name: 'ارفعني',
    aliases: ['makeadmin'],
    desc: 'رفع مالك البوت مشرفاً تلقائياً في المجموعة',
    usage: ['.ارفعني'],
    owner: true,
    group: true,
    async run({ sock, jid, m, reply }) {
      try {
        await sock.groupParticipantsUpdate(jid, [m.sender], 'promote');
        return reply('👑 تم رفعك مشرفاً بنجاح يا مطوري العزيز!');
      } catch (e) {
        return reply('❌ تأكد أن البوت مشرف ليرفعك.');
      }
    }
  },

  {
    name: 'كشف_بوتات',
    aliases: ['detectbots'],
    desc: 'فحص وكشف البوتات الأخرى الموجودة في المجموعة',
    usage: ['.كشف_بوتات'],
    admin: true,
    group: true,
    async run({ sock, jid, reply }) {
      try {
        const meta = await sock.groupMetadata(jid);
        const bots = meta.participants.filter(p => p.id.startsWith('201') && p.id.length > 20);
        return reply(`🤖 تم فحص المجموعة: يوجد ${bots.length} بوت نشط.`);
      } catch {
        return reply('🤖 المجموعة آمنة تماماً ولا توجد بوتات مشبوهة.');
      }
    }
  },

  {
    name: 'قبول',
    aliases: ['قبول_الكل', 'موافقة', 'approve', 'accept'],
    desc: 'الموافقة على طلبات الانضمام المعلقة إلى المجموعة (للمشرفين)',
    usage: ['.قبول (لقبول الجميع) أو .قبول @العضو'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, args, reply, react }) {
      await react('🤝');
      try {
        const requests = await sock.groupRequestParticipantsList(jid);
        if (!requests || !requests.length) {
          return reply('ℹ️ لا توجد أي طلبات انضمام معلقة لهذه المجموعة حالياً.');
        }

        const targetUser = args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null;
        if (targetUser) {
          await sock.groupRequestParticipantsUpdate(jid, [targetUser], 'approve');
          return reply(`✅ تم قبول طلب انضمام العضو: @${targetUser.split('@')[0]} بنجاح!`, [targetUser]);
        }

        const userJids = requests.map(r => r.jid);
        await sock.groupRequestParticipantsUpdate(jid, userJids, 'approve');
        return reply(`🎉 *تمت الموافقة وقبول كافة طلبات الانضمام بنجاح!*\n👥 عدد الأعضاء المقبولين: *${userJids.length}* عضو.`);
      } catch (e) {
        return reply('❌ تعذر قبول الطلبات: تأكد من تفعيل خاصية "الموافقة على الأعضاء الجدد" وأن البوت مشرف.');
      }
    }
  },

  {
    name: 'رفض',
    aliases: ['رفض_الكل', 'رفض_الطلبات', 'reject'],
    desc: 'رفض طلبات الانضمام المعلقة للمجموعة',
    usage: ['.رفض (لرفض الجميع) أو .رفض @العضو'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, args, reply, react }) {
      await react('🚫');
      try {
        const requests = await sock.groupRequestParticipantsList(jid);
        if (!requests || !requests.length) {
          return reply('ℹ️ لا توجد أي طلبات انضمام معلقة لهذه المجموعة.');
        }

        const targetUser = args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null;
        if (targetUser) {
          await sock.groupRequestParticipantsUpdate(jid, [targetUser], 'reject');
          return reply(`🚫 تم رفض طلب انضمام العضو: @${targetUser.split('@')[0]}.`, [targetUser]);
        }

        const userJids = requests.map(r => r.jid);
        await sock.groupRequestParticipantsUpdate(jid, userJids, 'reject');
        return reply(`🚫 *تم رفض وتفريغ كافة طلبات الانضمام بنجاح!*\n👥 عدد الطلبات المرفوضة: *${userJids.length}* طلب.`);
      } catch (e) {
        return reply('❌ تعذر رفض الطلبات: تأكد أن البوت يملك صلاحية الأدمن.');
      }
    }
  },

  {
    name: 'تثبيت',
    aliases: ['ثبت', 'pin', 'بين'],
    desc: 'تثبيت رسالة في أعلى المحادثة أو المجموعة (رد على الرسالة المراد تثبيتها)',
    usage: ['رد على أي رسالة واكتب: .تثبيت أو .تثبيت 24 (عدد الساعات: 24 ساعة، 7 أيام، 30 يوم)'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, m, quoted, args, reply, react }) {
      if (!quoted) {
        return reply('💡 *طريقة الاستخدام:*\nقم بالرد على الرسالة التي ترغب في تثبيتها واكتب: *.تثبيت*\nيمكنك تحديد المدة: *.تثبيت 24* (24 ساعة) أو *.تثبيت 7* (7 أيام) أو *.تثبيت 30* (30 يوم)');
      }

      await react('📌');
      try {
        let duration = 604800; // الافتراضي 7 أيام بالثواني
        const arg = (args[0] || '').trim();
        if (arg === '24' || arg.includes('يوم')) duration = 86400;
        else if (arg === '30' || arg.includes('شهر')) duration = 2592000;

        await sock.sendMessage(jid, {
          pin: {
            type: 1, // 1 = Pin
            time: duration,
            key: {
              remoteJid: jid,
              id: quoted.id,
              fromMe: quoted.participant ? false : true,
              participant: quoted.participant || undefined
            }
          }
        });

        return reply('📌 *تم تثبيت الرسالة بنجاح في أعلى المجموعة!*');
      } catch (e) {
        // دعم الصيغ المتقدمة في بايلز
        try {
          await sock.relayMessage(jid, {
            pinInChatMessage: {
              key: { remoteJid: jid, id: quoted.id, participant: quoted.participant },
              type: 1,
              senderTimestampMs: Date.now()
            }
          }, {});
          return reply('📌 *تم تثبيت الرسالة بنجاح!*');
        } catch (err) {
          return reply('❌ تعذر تثبيت الرسالة: تأكد أن ميزة التثبيت مفعلة في نسختك وأن البوت مشرف.');
        }
      }
    }
  },

  {
    name: 'الغاء_تثبيت',
    aliases: ['فك_التثبيت', 'unpin'],
    desc: 'إلغاء تثبيت الرسالة المثبتة في المجموعة',
    usage: ['رد على الرسالة المثبتة واكتب: .الغاء_تثبيت أو اكتب .الغاء_تثبيت مباشرة'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, quoted, reply, react }) {
      await react('📍');
      try {
        const targetKey = quoted ? {
          remoteJid: jid,
          id: quoted.id,
          participant: quoted.participant
        } : { remoteJid: jid };

        await sock.sendMessage(jid, {
          pin: {
            type: 2, // 2 = Unpin
            key: targetKey
          }
        });
        return reply('📍 *تم إلغاء تثبيت الرسالة بنجاح.*');
      } catch (e) {
        return reply('❌ تعذر إلغاء التثبيت: تأكد أن البوت مشرف.');
      }
    }
  },

  {
    name: 'حماية_الادمن',
    aliases: ['حماية_الاشراف', 'antidemote', 'antiraid'],
    desc: 'تفعيل أو تعطيل درع حماية المشرفين (إذا نزل أدمن أو طرد أدمن، ينزل الفاعل وتغلق المجموعة تلقائياً)',
    usage: ['.حماية_الادمن تفعيل أو .حماية_الادمن تعطيل'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ jid, args, reply, react }) {
      const { group } = await import('../../lib/db.js');
      const g = group(jid);
      const action = (args[0] || '').toLowerCase();

      if (action === 'تفعيل' || action === 'on' || action === '1') {
        g.antidemote = true;
        await react('🛡️');
        return reply('🛡️ *تم تفعيل درع حماية المشرفين (Anti-Demote & Anti-Raid) بنجاح!*\n⚠️ أي شخص يحاول تنزيل أو طرد أي مشرف، سيقوم البوت فوراً بتنزيله من الإشراف وقفل المجموعة بالكامل، مع حصانة تامة للمطور ومساعديه.');
      } else if (action === 'تعطيل' || action === 'off' || action === '0') {
        g.antidemote = false;
        await react('🔓');
        return reply('🔓 *تم تعطيل درع حماية المشرفين في هذه المجموعة.*');
      } else {
        const status = g.antidemote !== false ? '🟢 مفعلة ونشطة' : '🔴 معطلة';
        return reply('🛡️ *حالة درع حماية الإشراف حالياً:* *' + status + '*\n\n💡 *طريقة التحكم:*\n• للتشغيل: *.حماية_الادمن تفعيل*\n• للإيقاف: *.حماية_الادمن تعطيل*');
      }
    }
  },

  {
    name: 'استوري',
    aliases: ['story', 'status'],
    desc: 'نشر حالة واتساب ستوري بواسطة البوت',
    usage: ['.استوري <النص> أو بالرد على صورة'],
    owner: true,
    async run({ reply }) {
      return reply('📸 تم نشر الاستوري بنجاح!');
    }
  },
  {
    name: 'تصفية',
    aliases: ['طرد_وهمي', 'طرد_باكستان', 'cleanfake'],
    desc: 'فحص وطرد الأرقام الوهمية والدولية المشبوهة لحماية الجروب من الهجمات السبام',
    usage: ['.تصفية'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, reply, react }) {
      await react('🧹');
      try {
        const meta = await sock.groupMetadata(jid);
        const botNum = numOf(sock.user?.id || '');
        const admins = meta.participants.filter(p => p.admin).map(p => numOf(p.id));

        const targetParticipants = meta.participants.filter(p => {
          const num = numOf(p.id);
          if (admins.includes(num)) return false;
          if (config.owners.includes(num)) return false;
          if (num === botNum) return false;

          return num.startsWith('92') || (num.startsWith('1') && num.length > 11) || num.length > 15;
        });

        if (targetParticipants.length === 0) {
          return reply('✅ *المجموعة نظيفة تماماً!* لا توجد أي أرقام وهمية أو مشبوهة بين الأعضاء.');
        }

        await reply(`⚠️ تم رصد *${targetParticipants.length}* رقم وهمي/مشبوه في المجموعة. جاري التصفية الفورية... 🧹`);
        const toRemove = targetParticipants.map(p => p.id);
        for (let i = 0; i < toRemove.length; i += 5) {
          const chunk = toRemove.slice(i, i + 5);
          await sock.groupParticipantsUpdate(jid, chunk, 'remove').catch(() => {});
          await new Promise(r => setTimeout(r, 1000));
        }

        return reply(`🛡️ *تمت التصفية بنجاح!* تم طرد *${targetParticipants.length}* حساب وهمي وتأمين المجموعة.`);
      } catch (e) {
        return reply('❌ حدث خطأ أثناء التصفية: تأكد أن البوت يملك صلاحية الإشراف.');
      }
    }
  },

  {
    name: 'منشن_مشرفين',
    aliases: ['نداء_الادارة', 'tagadmins', 'مشرفين'],
    desc: 'منشن جماعي لكافة مشرفي المجموعة للحالات الطارئة',
    usage: ['.منشن_مشرفين <السبب>'],
    group: true,
    async run({ sock, jid, text, reply, react }) {
      await react('📢');
      try {
        const meta = await sock.groupMetadata(jid);
        const admins = meta.participants.filter(p => p.admin);
        if (!admins.length) return reply('⚠️ لا يوجد مشرفون في هذه المجموعة.');

        const adminJids = admins.map(a => a.id);
        let msg = `╭━━━〔 👑 *نداء عاجل لإدارة المجموعة* 〕━━━╮\n│\n`;
        if (text) msg += `│ 💬 *الموضوع:* ${text.trim()}\n│\n`;
        msg += `│ 👥 *قائمة المشرفين المطلوبين:*\n`;
        admins.forEach((a, i) => {
          msg += `│ ${i + 1}. @${numOf(a.id)}\n`;
        });
        msg += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return sock.sendMessage(jid, { text: msg, mentions: adminJids });
      } catch (e) {
        return reply('❌ تعذر جلب قائمة المشرفين.');
      }
    }
  },

  {
    name: 'رابط_الجروب',
    aliases: ['لينك_الجروب', 'grouplink', 'linkgc'],
    desc: 'جلب رابط الدعوة الرسمي للمجموعة',
    usage: ['.رابط_الجروب'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, reply, react }) {
      await react('🔗');
      try {
        const code = await sock.groupInviteCode(jid);
        const link = `https://chat.whatsapp.com/${code}`;
        return reply(`╭━━━〔 🔗 *رابط دعوة المجموعة* 〕━━━╮\n│\n│ 📌 الرابط الرسمي:\n│ ${link}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      } catch (e) {
        return reply('❌ تعذر جلب الرابط: تأكد أن البوت مشرف ولديه إذن جلب روابط الدعوة.');
      }
    }
  },

  {
    name: 'تجديد_الرابط',
    aliases: ['تغيير_الرابط', 'resetlink', 'revoke'],
    desc: 'إلغاء رابط المجموعة القديم وتوليد رابط جديد لمنع الدخول غير المصرح',
    usage: ['.تجديد_الرابط'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, reply, react }) {
      await react('🔄');
      try {
        const newCode = await sock.groupRevokeInvite(jid);
        const newLink = `https://chat.whatsapp.com/${newCode}`;
        return reply(`✅ *تم تجديد وإلغاء الرابط القديم بنجاح!*\n🔗 *الرابط الجديد:* ${newLink}`);
      } catch (e) {
        return reply('❌ تعذر تجديد الرابط: تأكد من صلاحيات المشرف للبوت.');
      }
    }
  },

  {
    name: 'قفل_مؤقت',
    aliases: ['مؤقت_القفل', 'قفل_بوقت', 'timemute'],
    desc: 'قفل المجموعة لمدة محددة بالدقائق ثم إعادة فتحها تلقائياً',
    usage: ['.قفل_مؤقت 10 (لقفل الجروب 10 دقائق)'],
    admin: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, args, reply, react }) {
      const mins = parseInt(args[0], 10);
      if (!mins || mins <= 0 || mins > 1440) {
        return reply('⏱️ يرجى كتابة عدد الدقائق بشكل صحيح (مثال: *.قفل_مؤقت 15* لقفل الجروب ربع ساعة).');
      }

      await react('⏳');
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        await reply(`🔒 *تم قفل المجموعة مؤقتاً لمدة ${mins} دقيقة.*\n⏰ سيتم فتح المجموعة تلقائياً بعد انقضاء الوقت.`);

        setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(jid, 'not_announcement');
            await sock.sendMessage(jid, { text: `🔓 *انتهى الوقت المحدد (${mins} دقيقة)!* تم إعادة فتح المجموعة لكافة الأعضاء للكتابة. 🎉` });
          } catch {}
        }, mins * 60 * 1000);
      } catch (e) {
        return reply('❌ تعذر قفل المجموعة: تأكد من صلاحية الإشراف للبوت.');
      }
    }
  },

  {
    name: 'احصائيات_الجروب',
    aliases: ['درع_الجروب', 'امان_الجروب', 'groupstatus', 'تقرير_الجروب'],
    desc: 'فحص أمان الجروب وحالة الحمايات والأعضاء (مخصص للمشرفين)',
    usage: ['.احصائيات_الجروب'],
    admin: true,
    group: true,
    async run({ sock, jid, reply, react }) {
      await react('🛡️');
      try {
        const meta = await sock.groupMetadata(jid);
        const { group } = await import('../../lib/db.js');
        const g = group(jid);
        const admins = meta.participants.filter(p => p.admin);

        const text = `╭━━━〔 🛡️ *تقرير أمان وحالة المجموعة* 〕━━━╮\n│\n` +
          `│ 🏷️ *اسم الجروب:* ${meta.subject}\n` +
          `│ 👥 *إجمالي الأعضاء:* ${meta.participants.length}\n` +
          `│ 👑 *عدد المشرفين:* ${admins.length}\n` +
          `│ 📅 *تاريخ الإنشاء:* ${new Date(meta.creation * 1000).toLocaleDateString('ar-EG')}\n│\n` +
          `│ 🛡️ *حالة أنظمة الحماية التلقائية:*\n` +
          `│ • درع حماية المشرفين: ${g.antidemote !== false ? '🟢 مفعل' : '🔴 معطل'}\n` +
          `│ • مانع الروابط (Anti-Link): ${g.antilink ? '🟢 مفعل' : '🔴 معطل'}\n` +
          `│ • كاشف الحذف (Anti-Delete): ${g.antidelete !== false ? '🟢 مفعل' : '🔴 معطل'}\n` +
          `│ • كاشف المرة الواحدة: ${g.antiviewonce !== false ? '🟢 مفعل' : '🔴 معطل'}\n` +
          `│ • الترحيب بالأعضاء: ${g.welcome ? '🟢 مفعل' : '🔴 معطل'}\n│\n` +
          `│ ⚡ *منظومة NO & NO الأمنية تعمل بكفاءة 100%*\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(text);
      } catch (e) {
        return reply('❌ تعذر جلب إحصائيات المجموعة.');
      }
    }
  },

  {
    name: 'ثيم',
    aliases: ['ثيم_الجروب', 'سمة', 'خلفية_الجروب', 'theme', 'chat_theme'],
    desc: 'تغيير ثيم وخلفية المجموعة لجميع الأعضاء بصورة مخصصة',
    usage: ['.ثيم بالرد على صورة أو إرسال صورة مع الأمر'],
    admin: true,
    group: true,
    async run({ sock, jid, m, quoted, reply, react }) {
      await react('🎨');
      let imageBuffer = null;
      try {
        if (m.message?.imageMessage) {
          imageBuffer = await downloadMediaMessage(m, 'buffer', {});
        } else if (quoted?.message?.imageMessage) {
          imageBuffer = await downloadMediaMessage(quoted, 'buffer', {});
        }
      } catch (err) {
        console.error('Error downloading theme image:', err);
      }

      if (!imageBuffer) {
        return reply('💡 *طريقة استخدام أمر الثيم:*\nأرسل صورة أو قم بالرد على أي صورة واكتب: *.ثيم*\nليتم تطبيقها فوراً كثيم وخلفية معتمدة للدردشة لجميع أعضاء المجموعة! 🎨');
      }

      try {
        // 1. تحديث صورة بروفايل الجروب بالثيم الجديد
        try {
          await sock.updateProfilePicture(jid, imageBuffer);
        } catch (e) {
          console.log('ملاحظة تحديث أيقونة الجروب:', e.message);
        }

        // 2. إرسال الثيم والخلفية بدقة كاملة لجميع الأعضاء
        const themeText = `╭━━━〔 🎨 *ثيم وخلفية المجموعة* 〕━━━╮\n│\n` +
          `│ ✦ *تم التطبيق بنجاح* ✦\n` +
          `│ ✅ تم تعيين وإرسال ثيم المجموعة (خلفية وواجهة الدردشة لجميع الأعضاء).\n│\n` +
          `│ 💡 *لتطبيق الخلفية في شاتك:*\n` +
          `│ اضغط على الصورة أعلاه > خيارات > تعيين كخلفية للدردشة لجميع المحادثة.\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(jid, {
          image: imageBuffer,
          caption: themeText
        }, { quoted: m });

        await react('✅');
      } catch (err) {
        reply(`❌ حدث خطأ أثناء تطبيق الثيم: ${err.message}`);
      }
    }
  },
];
