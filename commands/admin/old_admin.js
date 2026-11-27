import { save } from '../../lib/db.js';
import { numOf } from '../../lib/utils.js';

const NEED = '↩️ يرجى عمل منشن للعضو أو الرد على رسالته.';

export default [
  { name: 'طرد', aliases: ['kick'], desc: 'طرد عضو من المجموعة (منشن/رد)', botAdmin: true,
    async run({ sock, jid, target, partOf, reply }) {
      if (!target) return reply(NEED);
      const p = partOf(target);
      if (!p) return reply('❌ هذا العضو ليس متواجداً في المجموعة.');
      if (p.admin) return reply('⛔ لا يمكن طرد المشرف (الأدمن). يرجى تنزيله لعضو عادي أولاً.');
      await sock.groupParticipantsUpdate(jid, [p.id], 'remove');
      reply(`╭━━━〔 👢 *طرد عضو* 〕━━━╮\n│\n│ ✅ تم طرد @${numOf(target)} بنجاح من المجموعة.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [target]);
    } },

  { name: 'حظر', aliases: ['ban'], desc: 'طرد وحظر عضو من الرجوع للجروب', botAdmin: true,
    async run({ sock, jid, target, partOf, g, reply }) {
      if (!target) return reply(NEED);
      const p = partOf(target);
      if (p?.admin) return reply('⛔ لا يمكن حظر مشرف المجموعة.');
      const k = numOf(target);
      if (!g.banned.includes(k)) g.banned.push(k);
      save();
      if (p) await sock.groupParticipantsUpdate(jid, [p.id], 'remove');
      reply(`╭━━━〔 🚫 *حظر من المجموعة* 〕━━━╮\n│\n│ ⛔ تم طرد وحظر @${k} نهائياً.\n│ 🛡️ لن يتمكن من الانضمام مجدداً عبر الروابط.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [target]);
    } },

  { name: 'الغاء_حظر', aliases: ['unban'], desc: 'الغاء حظر عضو (منشن/رقم)',
    async run({ target, g, reply }) {
      if (!target) return reply('اكتب رقم العضو أو قم بعمل منشن له.');
      const k = numOf(target);
      g.banned = g.banned.filter(n => n !== k);
      save();
      reply(`✅ تم إلغاء حظر العضو *${k}*، يمكنه الآن الانضمام للمجموعة.`);
    } },

  { name: 'اضافة', aliases: ['add'], desc: 'اضافة رقم للجروب مباشرة', botAdmin: true,
    async run({ sock, jid, target, reply }) {
      if (!target) return reply('اكتب الرقم بالصيغة الدولية.\nمثال: */اضافة 201012345678*');
      const res = await sock.groupParticipantsUpdate(jid, [numOf(target) + '@s.whatsapp.net'], 'add');
      const st = res?.[0]?.status;
      if (st === '200') reply('✅ تمت إضافة العضو بنجاح.');
      else if (st === '403') reply('⚠️ خصوصية هذا الرقم تمنع إضافته مباشرة، يرجى إرسال رابط المجموعة له.');
      else if (st === '409') reply('ℹ️ هذا العضو موجود في المجموعة بالفعل.');
      else reply(`❌ تعذر إضافة الرقم (رمز الاستجابة: ${st || 'غير معروف'}).`);
    } },

  { name: 'رفع', aliases: ['promote'], desc: 'ترقية عضو لرتبة مشرف (أدمن)', botAdmin: true,
    async run({ sock, jid, target, partOf, reply }) {
      if (!target) return reply(NEED);
      const p = partOf(target);
      if (!p) return reply('❌ هذا العضو ليس في المجموعة.');
      if (p.admin) return reply('ℹ️ هذا العضو مشرف بالفعل.');
      await sock.groupParticipantsUpdate(jid, [p.id], 'promote');
      reply(`╭━━━〔 🛡️ *ترقية مشرف جديد* 〕━━━╮\n│\n│ 👑 مبروك @${numOf(target)} تم رفعك مشرفاً بالمجموعة!\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [target]);
    } },

  { name: 'تنزيل', aliases: ['demote'], desc: 'تنزيل مشرف لرتبة عضو عادي', botAdmin: true,
    async run({ sock, jid, target, partOf, reply }) {
      if (!target) return reply(NEED);
      const p = partOf(target);
      if (!p?.admin) return reply('ℹ️ هذا الشخص ليس مشرفاً من الأساس.');
      await sock.groupParticipantsUpdate(jid, [p.id], 'demote');
      reply(`╭━━━〔 ⬇️ *تنزيل مشرف* 〕━━━╮\n│\n│ ▫️ تم تنزيل @${numOf(target)} إلى رتبة عضو عادي.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [target]);
    } },

  { name: 'قفل', aliases: ['lock', 'close'], desc: 'قفل الجروب (المشرفون فقط يرسلون)', botAdmin: true,
    async run({ sock, jid, reply }) {
      await sock.groupSettingUpdate(jid, 'announcement');
      reply('🔒 *تم قفل المجموعة:* الآن يمكن للمشرفين فقط إرسال الرسائل.');
    } },

  { name: 'فتح', aliases: ['unlock', 'open'], desc: 'فتح الجروب لجميع الأعضاء', botAdmin: true,
    async run({ sock, jid, reply }) {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      reply('🔓 *تم فتح المجموعة:* الآن يمكن لجميع الأعضاء المشاركة والدردشة.');
    } },

  { name: 'تحذير', aliases: ['warn'], desc: 'تحذير عضو (3 تحذيرات = طرد تلقائي)',
    async run({ sock, jid, target, partOf, g, restText, reply, isBotAdmin }) {
      if (!target) return reply(NEED);
      const p = partOf(target);
      if (p?.admin) return reply('⛔ لا يمكن توجيه تحذيرات لمشرفي المجموعة.');
      const k = numOf(target);
      g.warns[k] = (g.warns[k] || 0) + 1;
      const n = g.warns[k];

      let msg = `╭━━━〔 ⚠️ *تحذير إداري* 〕━━━╮\n│\n│ 👤 العضو: @${k}\n│ 🔢 عدد التحذيرات: *${n} / 3*\n`;
      if (restText) msg += `│ 📝 السبب: ${restText}\n`;

      if (n >= 3) {
        if (isBotAdmin && p) {
          await sock.groupParticipantsUpdate(jid, [p.id], 'remove');
          delete g.warns[k];
          msg += `│\n│ 🚫 وصل العضو للحد الأقصى (3 تحذيرات) وتم طرده تلقائياً!\n`;
        } else {
          msg += `│\n│ 🚫 وصل العضو للحد الأقصى (3 تحذيرات). (يرجى ترقية البوت مشرفاً لتنفيذ الطرد التلقائي).\n`;
        }
      }
      msg += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      save();
      reply(msg, [target]);
    } },

  { name: 'حذف_تحذير', aliases: ['unwarn'], desc: 'إزالة تحذير من العضو (أو كتابة الكل)',
    async run({ target, g, restText, reply }) {
      if (!target) return reply(NEED);
      const k = numOf(target);
      if (restText === 'الكل' || restText === 'all') {
        delete g.warns[k];
      } else {
        g.warns[k] = Math.max(0, (g.warns[k] || 0) - 1);
      }
      save();
      reply(`✅ تم تعديل تحذيرات @${k}. الرصيد الحالي: *${g.warns[k] || 0} / 3*`, [target]);
    } },

  { name: 'التحذيرات', aliases: ['warns'], desc: 'عرض قائمة تحذيرات عضو أو كل الأعضاء',
    async run({ target, g, reply }) {
      if (target) {
        return reply(`⚠️ تحذيرات @${numOf(target)}: *${g.warns[numOf(target)] || 0} / 3*`, [target]);
      }
      const e = Object.entries(g.warns || {}).filter(([, n]) => n > 0);
      if (!e.length) return reply('✅ سجل التحذيرات نظيف، لا توجد أي تحذيرات نشطة بالمجموعة.');
      let msg = `╭━━━〔 ⚠️ *سجل التحذيرات بالمجموعة* 〕━━━╮\n│\n`;
      msg += e.map(([k, n]) => `│ ▫️ @${k} ── (${n} / 3)`).join('\n');
      msg += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(msg, e.map(([k]) => k + '@s.whatsapp.net'));
    } },

  { name: 'كتم', aliases: ['mute'], desc: 'كتم عضو ومنع رسائله في المجموعة', botAdmin: true,
    async run({ target, partOf, g, reply }) {
      if (!target) return reply(NEED);
      if (partOf(target)?.admin) return reply('⛔ لا يمكن كتم مشرف المجموعة.');
      const k = numOf(target);
      if (!g.muted.includes(k)) g.muted.push(k);
      save();
      reply(`🔇 تم كتم @${k} بنجاح، سيتم حذف أي رسالة يرسلها تلقائياً.`, [target]);
    } },

  { name: 'الغاء_كتم', aliases: ['unmute'], desc: 'إلغاء كتم عضو في المجموعة',
    async run({ target, g, reply }) {
      if (!target) return reply(NEED);
      const k = numOf(target);
      g.muted = g.muted.filter(n => n !== k);
      save();
      reply(`🔊 تم إلغاء كتم @${k}، يمكنه المشاركة مجدداً.`, [target]);
    } },

  { name: 'المكتومين', aliases: ['mutedlist'], desc: 'عرض قائمة الأعضاء المكتومين',
    async run({ g, reply }) {
      if (!g.muted.length) return reply('✅ لا يوجد أعضاء مكتومين في هذه المجموعة.');
      reply('🔇 *قائمة الأعضاء المكتومين:*\n' + g.muted.map(k => `▫️ @${k}`).join('\n'), g.muted.map(k => k + '@s.whatsapp.net'));
    } },

  { name: 'حذف', aliases: ['delete', 'del'], desc: 'حذف أي رسالة (بالرد عليها)', botAdmin: true,
    async run({ sock, jid, quoted, reply }) {
      if (!quoted) return reply('↩️ قم بالرد على الرسالة التي ترغب في حذفها.');
      const botNumbers = [sock.user?.id, sock.user?.lid].filter(Boolean).map(numOf);
      const isFromMe = quoted.participant ? botNumbers.includes(numOf(quoted.participant)) : true;
      const key = {
        remoteJid: jid,
        fromMe: isFromMe,
        id: quoted.id,
        participant: quoted.participant || undefined,
      };
      await sock.sendMessage(jid, { delete: key });
    } },

  { name: 'منشن_الكل', aliases: ['tagall'], desc: 'منشن لجميع أعضاء المجموعة',
    async run({ meta, text, reply }) {
      const ps = meta.participants.map(p => p.id);
      let t = `📢 *${text || 'نداء لجميع الأعضاء'}*\n`;
      t += `👥 إجمالي الأعضاء: *${ps.length}*\n━━━━━━━━━━━━━━━━━━━━━\n`;
      t += ps.map(i => `▫️ @${numOf(i)}`).join('\n');
      reply(t, ps);
    } },

  { name: 'اخفاء', aliases: ['hidetag'], desc: 'إرسال رسالة بمنشن مخفي لجميع الأعضاء',
    async run({ sock, jid, meta, text, quotedText }) {
      const msg = text || quotedText || '📢 نداء عاجل لجميع الأعضاء!';
      await sock.sendMessage(jid, { text: msg, mentions: meta.participants.map(p => p.id) });
    } },

  { name: 'تغيير_اسم', aliases: ['setname'], desc: 'تغيير اسم المجموعة', botAdmin: true,
    async run({ sock, jid, text, reply }) {
      if (!text) return reply('اكتب الاسم الجديد للمجموعة بعد الأمر.');
      await sock.groupUpdateSubject(jid, text);
      reply(`✅ تم تغيير اسم المجموعة إلى: *${text}*`);
    } },

  { name: 'تغيير_وصف', aliases: ['setdesc'], desc: 'تغيير وصف المجموعة', botAdmin: true,
    async run({ sock, jid, text, reply }) {
      if (!text) return reply('اكتب الوصف الجديد للمجموعة بعد الأمر.');
      await sock.groupUpdateDescription(jid, text);
      reply('✅ تم تحديث وصف المجموعة بنجاح.');
    } },

  { name: 'تغيير_صورة', aliases: ['setpp'], desc: 'تغيير صورة المجموعة (بالرد على صورة)', botAdmin: true,
    async run({ sock, jid, getMedia, reply }) {
      const media = await getMedia(['imageMessage']);
      if (!media) return reply('↩️ قم بالرد على صورة أو إرسال صورة مع الأمر لتغيير أيقونة المجموعة.');
      await sock.updateProfilePicture(jid, media.buffer);
      reply('✅ تم تغيير صورة المجموعة بنجاح.');
    } },

  { name: 'تصفير_الرابط', aliases: ['revoke'], desc: 'إعادة ضبط رابط دعوة المجموعة القديم', botAdmin: true,
    async run({ sock, jid, reply }) {
      await sock.groupRevokeInvite(jid);
      const newCode = await sock.groupInviteCode(jid);
      reply(`🔄 تم إلغاء الرابط القديم بنجاح.\n🔗 الرابط الجديد للمجموعة:\nhttps://chat.whatsapp.com/${newCode}`);
    } },
];
