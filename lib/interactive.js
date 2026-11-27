// ══════════════════════════════════════════════════════════════
// 📱 محرك الرسائل التفاعلية (Carousel Cards, Buttons & Native Lists)
// متوافق 100% مع كافة أجهزة واتساب (موبايل، ويب، كمبيوتر، أندرويد، آيفون)
// ══════════════════════════════════════════════════════════════

import config from '../config.js';
import { generateWAMessageFromContent, proto } from './baileys.js';
import sectionsList from './sections.js';
import { uniqueCommands } from './loader.js';
import { mainMenu, sectionMenu } from './menu.js';
import { getActiveTheme } from './theme_engine.js';

/**
 * إرسال رسالة كروت سلايدر (Carousel Slider) أنيقة ومتوافقة مع كل الأجهزة
 */
export async function sendCarousel(sock, jid, { body = '', footer = config.botName, cards = [] }, quoted = null) {
  let text = `╭━━━〔 📱 *${body || 'القائمة التفاعلية'}* 〕━━━╮\n│\n`;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    text += `│ 🔹 *${c.title}*\n`;
    if (c.body || c.description) {
      text += `│    ${c.body || c.description}\n`;
    }
    if (c.buttons?.length) {
      text += `│    🔘 ${c.buttons.map(b => `[ ${b.display_text} ➔ *${b.id || b.copy_code || b.url || ''}* ]`).join('\n│    🔘 ')}\n`;
    }
    text += `│\n`;
  }
  text += `╰━━━〔 ⚡ ${footer} 〕━━━╯`;

  const quoteOpt = (quoted && !quoted.key?.fromMe) ? { quoted } : {};
  return await sock.sendMessage(jid, { text }, quoteOpt);
}

/**
 * إرسال رسالة أزرار تفاعلية واضحة تعمل على جميع المنصات
 */
export async function sendInteractiveButtons(sock, jid, { title = '', body = '', footer = config.botName, buttons = [] }, quoted = null) {
  let text = `╭━━━〔 ⚡ *${title || 'خيارات التحكم'}* 〕━━━╮\n│\n`;
  if (body) text += `│ 📝 ${body}\n│\n`;
  for (const b of buttons) {
    text += `│ 🔘 *${b.display_text}* ${b.id ? `➔ اكتب: *${b.id}*` : ''} ${b.url ? `➔ [ ${b.url} ]` : ''}\n`;
  }
  text += `│\n╰━━━〔 ${footer} 〕━━━╯`;

  const quoteOpt = (quoted && !quoted.key?.fromMe) ? { quoted } : {};
  return await sock.sendMessage(jid, { text }, quoteOpt);
}

/**
 * إرسال رسالة تفاعلية تحتوي على زر قائمة منسدلة حقيقي (Native Interactive List)
 * مع نص كامل وتنسيق متطور يعمل على جميع الأجهزة
 */
export async function sendNativeFlowList(sock, jid, {
  headerTitle = '',
  body = '',
  footer = config.botName,
  buttonTitle = '📋 اضغط هنا للاختيار',
  sections = []
}, quoted = null) {
  try {
    const interactiveMessage = {
      header: {
        title: headerTitle || config.botName,
        hasMediaAttachment: false,
      },
      body: { text: body },
      footer: { text: footer },
      nativeFlowMessage: {
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: buttonTitle,
              sections: sections.map(s => ({
                title: s.title,
                rows: (s.rows || []).map(r => ({
                  header: r.header || '',
                  title: r.title,
                  description: r.description || '',
                  id: r.id
                }))
              }))
            })
          }
        ]
      }
    };

    const waMsg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create(interactiveMessage)
          }
        }
      },
      {
        userJid: sock.user?.id,
        quoted: (quoted && !quoted.key?.fromMe) ? quoted : undefined
      }
    );

    return await sock.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
  } catch (err) {
    console.error('⚠️ تعذر إرسال القائمة التفاعلية بالأزرار، جاري الإرسال كرسالة عادية:', err.message);
    const quoteOpt = (quoted && !quoted.key?.fromMe) ? { quoted } : {};
    return await sock.sendMessage(jid, { text: `${body}\n\n⚡ ${footer}` }, quoteOpt);
  }
}

export const sendInteractiveList = sendNativeFlowList;

/**
 * إرسال القائمة الرئيسية بالأزرار التفاعلية وقائمة الأقسام
 */
export async function sendMainMenuWithSections(sock, jid, pushName, u, latency, quoted = null) {
  const theme = getActiveTheme();
  const bodyText = mainMenu(pushName, u, latency);

  const sections = [
    {
      title: '📂 جميع أقسام البوت (اضغط لاختيار القسم)',
      rows: sectionsList.map((s, idx) => ({
        header: `القسم [ ${String(idx + 1).padStart(2, '0')} ]`,
        title: `${s.emoji} قسم ${s.name}`,
        description: s.desc,
        id: `.اوامر ${idx + 1}`
      }))
    }
  ];

  return await sendNativeFlowList(sock, jid, {
    headerTitle: `⚡ ${theme.title} ⚡`,
    body: bodyText,
    footer: `⚡ ${config.botName} • المطور: ${config.developer}`,
    buttonTitle: `📂 تصفح الأقسام (${sectionsList.length} قسم) اضغط هنا`,
    sections
  }, quoted);
}

/**
 * إرسال أوامر قسم معين مع زر تفاعلي وقائمة بأوامر ذلك القسم
 */
export async function sendSectionMenuWithCommands(sock, jid, num, quoted = null) {
  const s = sectionsList[num - 1];
  if (!s) {
    const quoteOpt = (quoted && !quoted.key?.fromMe) ? { quoted } : {};
    return sock.sendMessage(jid, { text: `❌ رقم القسم غير صحيح! اختر من 1 إلى ${sectionsList.length}.` }, quoteOpt);
  }

  const list = uniqueCommands().filter(c => c.section === s.key);
  const bodyText = sectionMenu(num);

  const rows = list.slice(0, 10).map(c => ({
    header: c.owner ? '👑 مطور' : c.admin ? '🛡️ أدمن' : '🔹 عام',
    title: `${config.prefix}${c.name}`,
    description: (c.desc || 'تشغيل الأمر مباشرة').slice(0, 60),
    id: `${config.prefix}${c.name}`
  }));

  rows.push({
    header: '🔙 تنقل',
    title: 'القائمة الرئيسية',
    description: 'العودة لجميع أقسام البوت',
    id: '.اوامر'
  });

  const sections = [
    {
      title: `أوامر قسم ${s.name}`,
      rows
    }
  ];

  return await sendNativeFlowList(sock, jid, {
    headerTitle: `${s.emoji} قسم ${s.name}`,
    body: bodyText,
    footer: `⚡ ${config.botName} • إجمالي الأوامر: ${list.length}`,
    buttonTitle: `⚡ اضغط لاختيار أمر من قسم ${s.name}`,
    sections
  }, quoted);
}
