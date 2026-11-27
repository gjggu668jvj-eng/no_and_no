import { group, db } from './db.js';
import { numOf } from './utils.js';
import { clearMeta } from '../handler.js';
import config from '../config.js';

// سجل الإجراءات الدفاعية التي قام بها البوت مؤخراً لمنع تكرار الحدث أو معاقبة نفسه (Anti-Loop Defense)
const recentDefenseActions = new Set();

const fill = (tpl, { user, subject, count }) =>
  tpl
    .replaceAll('{user}', '@' + numOf(user))
    .replaceAll('{group}', subject)
    .replaceAll('{count}', count);

export async function onParticipants(sock, id, participants, action, author) {
  clearMeta(id);
  const g = group(id);
  let meta;
  try {
    meta = await sock.groupMetadata(id);
  } catch {
    return;
  }
  const list = participants.map(p => (typeof p === 'string' ? p : p.phoneNumber || p.id));
  const botNum = numOf(sock.user?.id || '');

  // ══════════════════════════════════════════════════════════════
  // 🛡️ درع حماية الإدارة الفائق (Anti-Demote & Anti-Raid System)
  // حماية ذكية ومحصنة بالكامل: لا يمكن للبوت معاقبة نفسه أو المطورين
  // ══════════════════════════════════════════════════════════════
  if (author && (action === 'demote' || action === 'remove')) {
    const botId = sock.user?.id || '';
    const botLid = sock.user?.lid || '';
    const botNum = numOf(botId);
    const botLidNum = numOf(botLid);
    const configBotNum = (config.botNumber || '').replace(/\D/g, '');
    const actorNum = numOf(author);

    // فحص شامل ومحصن لهوية البوت (بما في ذلك معرفات LID والأرقام وبصمة الجهاز)
    const isBot =
      (botNum && actorNum === botNum) ||
      (botLidNum && actorNum === botLidNum) ||
      (configBotNum && actorNum === configBotNum) ||
      author === botId ||
      author === botLid ||
      (botNum && author.includes(botNum)) ||
      (botLidNum && author.includes(botLidNum));

    // فحص حصانة المطور والمساعدين
    const isOwner = config.owners.some(o => actorNum.includes(numOf(o)));
    const isAssistant = (config.coOwners || []).some(o => actorNum.includes(numOf(o))) ||
      (db.settings.subDevs || []).some(o => actorNum.includes(numOf(o)));

    // إذا كان الحدث نتيجة إجراء دفاعي قام به البوت مؤخراً، نتجاهله فوراً لمنع حلقة تكرار الحدث (Loop Prevention)
    const isRecentDefense = list.some(p => {
      const pNum = numOf(p);
      return recentDefenseActions.has(`${id}:${pNum}`) || recentDefenseActions.has(pNum);
    });

    if (isRecentDefense) {
      console.log(`🛡️ [حماية الإدارة] تم تجاهل هذا الحدث لأنه ناتج عن إجراء تأديبي نفذه البوت.`);
      return;
    }

    // إذا كان الفاعل هو البوت نفسه، أو المطور، أو المساعدين: نخرج فوراً وبشكل قاطع!
    if (isBot || isOwner || isAssistant) {
      return;
    }

    // التحقق مما إذا كانت خاصية حماية الأدمن مفعلة في هذه المجموعة
    const antiDemoteActive = g.antidemote !== false;

    if (antiDemoteActive) {
      let shouldTrigger = false;

      if (action === 'demote') {
        shouldTrigger = true;
      } else if (action === 'remove') {
        // التحقق إذا كان العضو المطرود مشرفاً أو مسجلاً كأدمن
        const victimWasAdmin = (g.knownAdmins || []).some(a => list.some(l => numOf(l) === a));
        if (victimWasAdmin) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        console.log(`🚨 [حماية الإدارة] رصد محاولة تخريب من المشرف: ${author} في الجروب: ${id}`);

        // تسجيل هذا الإجراء في الذاكرة الدفاعية حتى لا ينخدع البوت بالحدث الناتج عنه
        const attackerKey = `${id}:${actorNum}`;
        recentDefenseActions.add(attackerKey);
        recentDefenseActions.add(actorNum);
        setTimeout(() => {
          recentDefenseActions.delete(attackerKey);
          recentDefenseActions.delete(actorNum);
        }, 30000);

        // 1. تنزيل الفاعل المخرب فوراً (مع التأكد القاطع أنه ليس البوت أبداً)
        if (!isBot && !isOwner) {
          await sock.groupParticipantsUpdate(id, [author], 'demote').catch(() => {});
        }

        // 2. قفل المجموعة لحمايتها فوراً (وضع الإعلانات)
        await sock.groupSettingUpdate(id, 'announcement').catch(() => {});

        // 3. إعادة ترقية المشرف المنكوب (المتضرر الحقيقي فقط)
        if (action === 'demote') {
          const victimsToPromote = list.filter(p => numOf(p) !== actorNum && numOf(p) !== botNum);
          if (victimsToPromote.length > 0) {
            await sock.groupParticipantsUpdate(id, victimsToPromote, 'promote').catch(() => {});
          }
        }

        // 4. إرسال إنذار أمني فوري في المجموعة
        const alertMsg = 
          `🚨 *[نظام حماية الإدارة الفائق • NO & NO SECURITY]* 🚨\n\n` +
          `⚠️ *تحذير أمني عاجل:*\n` +
          `قام العضو المشرف @${actorNum} بمحاولة ${action === 'demote' ? 'تنزيل رتبة إشراف' : 'طرد مشرف'} من المجموعة دون إذن رسمي!\n\n` +
          `🛡️ *الإجراءات التأديبية الفورية المتخذة تلقائياً:*\n` +
          `1️⃣ تم سحب وتنزيل رتبة الإشراف من @${actorNum} فوراً! ❌\n` +
          `2️⃣ تم إغلاق المجموعة بالكامل (وضع الإعلانات) لحمايتها من التخريب 🔒\n` +
          `3️⃣ تم تأمين وإعادة صلاحيات المشرفين المتضررين 🛡️\n\n` +
          `👑 *الحصانة الكاملة مفعلة للمطور والمساعدين المعتمدين فقط.*`;

        await sock.sendMessage(id, {
          text: alertMsg,
          mentions: [author, ...list]
        }).catch(() => {});

        return; // تم اتخاذ الإجراء الدفاعي وإنهاء الحدث
      }
    }
  }

  // تحديث قائمة المشرفين المعروفين للمجموعة دورياً
  if (meta?.participants) {
    g.knownAdmins = meta.participants.filter(p => p.admin).map(p => numOf(p.id));
  }

  // ══════════════════════════════════════════════════════════════
  // معالجة باقي الأحداث التقليدية (انضمام / مغادرة / ترحيب)
  // ══════════════════════════════════════════════════════════════
  for (const p of list) {
    if (action === 'add') {
      const k = numOf(p);
      // فحص الحظر
      if (g.banned && g.banned.includes(k)) {
        await sock.groupParticipantsUpdate(id, [p], 'remove').catch(() => {});
        await sock.sendMessage(id, {
          text: `╭━━━〔 🚫 *طرد محظور* 〕━━━╮\n│\n│ ⛔ العضو @${k} محظور مسبقاً من المجموعة وتم طرده تلقائياً.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
          mentions: [p],
        });
        continue;
      }

      // فحص حظر الأرقام الوهمية والأجنبية
      if (g.antifake) {
        const isArab = /^(20|966|971|965|974|973|968|962|961|963|964|212|213|216|218|249|967|970|972)/.test(k);
        if (!isArab) {
          await sock.groupParticipantsUpdate(id, [p], 'remove').catch(() => {});
          await sock.sendMessage(id, {
            text: `╭━━━〔 🛡️ *حماية الأرقام الوهمية* 〕━━━╮\n│\n│ 🚫 تم طرد الرقم الأجنبي @${k} تلقائياً!\n│ 🔒 خاصية حظر الأرقام الوهمية مفعلة في المجموعة.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
            mentions: [p],
          });
          continue;
        }
      }

      // رسالة الترحيب بصورة العضو إن وُجدت
      if (g.welcome) {
        const defaultWelcome = `╭━━━〔 🌹 *أهلاً بك في المجموعة* 〕━━━╮\n│ ✦ • ──────────────────── • ✦\n│ 👋 مرحباً بك يا {user} في مجموعة:\n│ 👥 *{group}*\n│ 🔢 أنت العضو رقم: *{count}*\n│ 📜 يرجى الالتزام بالقوانين واحترام الجميع.\n│ ✦ • ──────────────────── • ✦\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
        const tpl = g.welcomeMsg || defaultWelcome;
        const msgText = fill(tpl, { user: p, subject: meta.subject, count: meta.participants.length });
        let pfp = null;
        try {
          pfp = await sock.profilePictureUrl(p, 'image');
        } catch {}

        if (pfp) {
          await sock.sendMessage(id, { image: { url: pfp }, caption: msgText, mentions: [p] }).catch(async () => {
            await sock.sendMessage(id, { text: msgText, mentions: [p] });
          });
        } else {
          await sock.sendMessage(id, { text: msgText, mentions: [p] });
        }
      }
    }

    if (action === 'remove' && g.bye) {
      const defaultBye = `╭━━━〔 👋 *توديع عضو* 〕━━━╮\n│ ✦ • ──────────────────── • ✦\n│ 🚶‍♂️ غادر {user} مجموعة *{group}*.\n│ 💐 نتمنى له كل التوفيق.\n│ 👥 عدد الأعضاء الحالي: *{count}*\n│ ✦ • ──────────────────── • ✦\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      const tpl = g.byeMsg || defaultBye;
      const msgText = fill(tpl, { user: p, subject: meta.subject, count: meta.participants.length });
      let pfp = null;
      try {
        pfp = await sock.profilePictureUrl(p, 'image');
      } catch {}

      if (pfp) {
        await sock.sendMessage(id, { image: { url: pfp }, caption: msgText, mentions: [p] }).catch(async () => {
          await sock.sendMessage(id, { text: msgText, mentions: [p] });
        });
      } else {
        await sock.sendMessage(id, { text: msgText, mentions: [p] });
      }
    }

    if (action === 'promote') {
      await sock.sendMessage(id, {
        text: `╭━━━〔 🛡️ *ترقية إدارية جديدة* 〕━━━╮\n│ ✦ • ──────────────────── • ✦\n│ 🎖️ مبروك الترقية يا @${numOf(p)}!\n│ 👑 أصبحت الآن مشرفاً (Admin) في المجموعة.\n│ ✦ • ──────────────────── • ✦\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
        mentions: [p],
      }).catch(() => {});
    }

    if (action === 'demote') {
      await sock.sendMessage(id, {
        text: `╭━━━〔 🔻 *تنزيل رتبة إدارية* 〕━━━╮\n│ ✦ • ──────────────────── • ✦\n│ 📉 تم تنزيل العضو @${numOf(p)} من رتبة الإشراف.\n│ ✦ • ──────────────────── • ✦\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
        mentions: [p],
      }).catch(() => {});
    }
  }
}
