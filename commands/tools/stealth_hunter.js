// ══════════════════════════════════════════════════════════════
// 🕵️ مود صائد الرسائل السرية وكاشف المحذوف (Anti-ViewOnce & Anti-Delete)
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import { getStoredMessage } from '../../lib/message_store.js';
import { downloadMediaMessage } from '../../lib/baileys.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

export default [
  {
    name: 'كاشف_المحذوف',
    aliases: ['antidelete', 'كشف_الحذف'],
    desc: 'تشغيل أو إيقاف كاشف الرسائل المحذوفة في الجروب، أو فحص آخر رسالة محذوفة',
    admin: true,
    async run({ isGroup, jid, args, reply }) {
      if (!isGroup) return reply('⛔ هذا الأمر مخصص للمجموعات فقط.');
      const g = db.groups[jid] ??= {};
      const action = (args[0] || '').toLowerCase();

      if (['تشغيل', 'on', 'تفعيل'].includes(action)) {
        g.antidelete = true;
        save();
        return reply('✅ تم *تفعيل* كاشف الرسائل المحذوفة في هذه المجموعة!\nأي رسالة يحذفها عضو سيتم إظهارها فوراً.');
      } else if (['ايقاف', 'إيقاف', 'off', 'تعطيل'].includes(action)) {
        g.antidelete = false;
        save();
        return reply('🛑 تم *إيقاف* كاشف الرسائل المحذوفة في هذه المجموعة.');
      }

      const status = g.antidelete !== false ? 'مفعّل 🟢' : 'معطّل 🔴';
      return reply(`🕵️ *كاشف الرسائل المحذوفة*\n\nالحالة الحالية: *${status}*\n\nللتحكم اكتب:\n▫️ *.كاشف_المحذوف تشغيل*\n▫️ *.كاشف_المحذوف ايقاف*`);
    }
  },

  {
    name: 'صائد_السرية',
    aliases: ['antiviewonce', 'صيد_السرية', 'صائد_الصور', 'فك_تلقائي'],
    desc: 'التحكم في فك تشفير رسائل العرض لمرة واحدة تلقائياً في الشات',
    async run({ args, isOwner, reply }) {
      db.settings ??= {};
      const action = (args[0] || '').toLowerCase();

      if (['تشغيل', 'on', 'تفعيل'].includes(action)) {
        db.settings.autoUnveilViewOnce = true;
        save();
        return reply('👁️ تم *تفعيل* فك تشفير رسائل العرض لمرة واحدة تلقائياً!\nأي شخص يرسل صورة أو فيديو View Once، سيقوم البوت بإعادة إرسالها كصورة عادية في نفس الشات فوراً.');
      } else if (['ايقاف', 'إيقاف', 'off', 'تعطيل'].includes(action)) {
        db.settings.autoUnveilViewOnce = false;
        save();
        return reply('🛑 تم *إيقاف* فك التشفير التلقائي لرسائل العرض لمرة واحدة.');
      }

      const status = db.settings.autoUnveilViewOnce ? 'مفعّل 🟢' : 'معطّل 🔴';
      return reply(`👁️ *صائد رسائل العرض لمرة واحدة (Anti-ViewOnce)*\n\nالحالة التلقائية: *${status}*\n\nللتحكم:\n▫️ *.فك_تلقائي تشغيل*\n▫️ *.فك_تلقائي ايقاف*\n\n💡 يمكنك أيضاً الرد على أي صورة لمرة واحدة بأمر: *.فك* أو *.صورة_عادية*`);
    }
  },

  {
    name: 'فك',
    aliases: ['صورة_عادية', 'عرض', 'هات_الصورة', 'فك_الصورة', 'التقاط', 'كشف_السر', 'readviewonce', 'rvo'],
    desc: 'متاح للجميع: رد على صورة أو فيديو عرض لمرة واحدة (View Once) ليقوم البوت بإرسالها كصورة عادية بدون قيود',
    async run({ sock, jid, m, quoted, reply }) {
      if (!quoted || !quoted.message) {
        return reply('⚠️ يرجى الرد على رسالة صورة أو فيديو معمولة (عرض لمرة واحدة / View Once) لتفكيكها.');
      }

      try {
        // فحص الذاكرة المخزنة لجلب الرسالة الأصلية بمفاتيح التشفير الكاملة
        const stored = getStoredMessage(quoted.id);
        const origMsg = stored?.message || quoted.message;

        if (stored?.media) {
          const senderTag = (stored.participant || quoted.participant || '').split('@')[0];
          const caption = `🔓 *تم فك تشفير وسائط العرض لمرة واحدة بنجاح!* ✨\n\n👤 أرسلها: @${senderTag}\n👁️ تم إظهارها بشكل دائم للجميع!`;
          if (stored.mime?.startsWith('image/')) {
            return await sock.sendMessage(jid, { image: stored.media, caption, mentions: [stored.participant || quoted.participant].filter(Boolean) }, { quoted: m });
          } else if (stored.mime?.startsWith('video/')) {
            return await sock.sendMessage(jid, { video: stored.media, caption, mentions: [stored.participant || quoted.participant].filter(Boolean) }, { quoted: m });
          }
        }

        let inner = origMsg?.viewOnceMessage?.message ||
          origMsg?.viewOnceMessageV2?.message ||
          origMsg?.viewOnceMessageV2Extension?.message ||
          origMsg;

        const isImage = Boolean(inner?.imageMessage);
        const isVideo = Boolean(inner?.videoMessage);

        if (!isImage && !isVideo) {
          return reply('❌ الرسالة التي قمت بالرد عليها ليست صورة أو فيديو View Once.');
        }

        const buffer = await downloadMediaMessage(
          { key: { remoteJid: jid, id: quoted.id, participant: quoted.participant }, message: inner },
          'buffer',
          {},
          { logger, reuploadRequest: sock.updateMediaMessage }
        );

        if (!buffer) return reply('❌ تعذر تحميل الوسائط من الرسالة.');

        const senderTag = (quoted.participant || stored?.participant || '').split('@')[0];
        const caption = `🔓 *تم فك تشفير وسائط العرض لمرة واحدة بنجاح!* ✨\n\n👤 أرسلها: @${senderTag}\n👁️ تم تحويلها لميديا دائمة للجميع.`;

        if (isImage) {
          await sock.sendMessage(jid, { image: buffer, caption, mentions: [quoted.participant || stored?.participant].filter(Boolean) }, { quoted: m });
        } else {
          await sock.sendMessage(jid, { video: buffer, caption, mentions: [quoted.participant || stored?.participant].filter(Boolean) }, { quoted: m });
        }
      } catch (err) {
        reply(`❌ فشل فك وسائط المرة الواحدة: ${err.message}`);
      }
    }
  }
];
