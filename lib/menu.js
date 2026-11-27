// ══════════════════════════════════════════════════════════════
// ⚡ NO & NO BOT - ULTRA LUXURY FORMATTER (NEW 2026 DESIGN)
// كل أمر منفصل بكارت منظم وشرح كامل مع شريط القناة في النهاية
// ══════════════════════════════════════════════════════════════

import config from '../config.js';
import sections from './sections.js';
import { uniqueCommands } from './loader.js';
import { money, getRank } from './utils.js';

// تذييل أنيق وفخم مع الاعتماد على زر (عرض القناة) المدمج في الرسالة
const CHANNEL_FOOTER = `\n⚡ *${config.botName}* • الأداء الفائق والسرعة الاستثنائية`;

export function mainMenu(pushName = 'صديقي', userObj = null, speedMs = 12) {
  const all = uniqueCommands();
  const publicCmds = all.filter(c => c.section !== 'owner');
  const u = userObj || { money: 100, bank: 0, level: 1, xp: 0 };
  const rank = getRank(u.level || 1);
  const totalCmds = publicCmds.length;

  let t = `╔══════════════════════════════════════╗\n`;
  t += `║   💎 𝑵𝑶 & 𝑵𝑶 • 𝑼𝑳𝑻𝑹𝑨 𝑽𝑰𝑷 𝑩𝑶𝑻 💎   ║\n`;
  t += `╚══════════════════════════════════════╝\n\n`;

  t += `┌───《 👤 *بيانات المستخدم* 》───\n`;
  t += `│ 🏷️ *الاسم:* ${pushName}\n`;
  t += `│ 🎖️ *الرتبة:* ${rank} (Lv.${u.level || 1})\n`;
  t += `│ 💵 *الكاش:* ${money(u.money || 0)}  |  🏦 *البنك:* ${money(u.bank || 0)}\n`;
  t += `└───《 ⚡ *حالة المنظومة* 》───\n`;
  t += `│ 👑 *المطور:* *${config.developer}*\n`;
  t += `│ 🚀 *الاستجابة:* *${speedMs}ms*  |  💾 *الذاكرة:* *${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)}MB*\n`;
  t += `│ 🌐 *البوتات النشطة:* *120* سيرفر متصل\n`;
  t += `│ 📦 *ترسانة الأوامر الشاملة:* *${totalCmds}* أمر فعلي\n`;
  t += `│ 🔗 *الموقع الرسمي:* https://noandno-production.up.railway.app\n`;
  t += `└──────────────────────────────\n\n`;

  t += `┌───《 📂 *كتالوج الأقسام المتطورة (16)* 》───\n`;
  sections.forEach((s, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const count = all.filter(c => c.section === s.key).length;
    t += `│ ◈ *[${num}]* ${s.emoji} *${s.name.replace(/_/g, ' ')}* ↢ (${count} أمر)\n`;
  });
  t += `└──────────────────────────────\n\n`;

  t += `✨ *كيفية فتح الأقسام والبحث:*\n`;
  t += `🔹 اكتب رقم القسم مباشرة (مثال: *.1* أو *.5* أو *1*)\n`;
  t += `🔹 لشرح تفصيلي لأي أمر: *.شرح <اسم الأمر>*\n`;
  t += `🔹 للبحث السريع عن أمر: *.بحث <كلمة>*\n`;

  t += CHANNEL_FOOTER;
  return t;
}

export function sectionMenu(num) {
  let s = null;
  if (typeof num === 'number') {
    s = sections[num - 1];
  } else {
    const q = String(num).trim().toLowerCase();
    s = sections.find((x, i) => String(i + 1) === q || x.key === q || x.name === q);
  }

  if (!s) {
    return `❌ *عفواً، رقم أو اسم القسم غير موجود!*\nاكتب *.اوامر* للاطلاع على قائمة الأقسام من [01] إلى [${sections.length}].`;
  }

  const sIndex = sections.indexOf(s) + 1;
  const list = uniqueCommands().filter(c => c.section === s.key);

  let t = `╔══════════════════════════════════════╗\n`;
  t += `║   ${s.emoji} *قسم ${s.name.replace(/_/g, ' ')}*  [${String(sIndex).padStart(2, '0')}/${sections.length}]\n`;
  t += `╚══════════════════════════════════════╝\n`;
  t += `📖 *الوصف:* ${s.desc}\n`;
  t += `📦 *إجمالي الأوامر المتاحة:* *${list.length}* أمر منظم\n\n`;

  if (!list.length) {
    t += '⚠️ لا توجد أوامر مسجلة في هذا القسم حالياً.\n';
    t += CHANNEL_FOOTER;
    return t;
  }

  t += `✨ *الأوامر المتوفرة بالتفصيل والشرح:*\n\n`;

  // كل أمر في بطاقة أنيقة ومستقلة مع الشرح والبدائل وطريقة الاستخدام
  list.forEach((c, idx) => {
    const tag = c.admin ? '🛡️ [أدمن]' : c.group ? '👥 [مجموعات]' : '🌐 [عام]';
    const aliases = c.aliases && c.aliases.length ? `\n│ 🏷️ *البدائل:* ${c.aliases.slice(0, 3).map(a => '.' + a).join(' ، ')}` : '';
    const usage = c.usage && c.usage.length ? `\n│ 💡 *الاستخدام:* ${c.usage[0]}` : '';

    t += `╭───《 🔹 *${idx + 1}. .${c.name}* ${tag} 》───\n`;
    t += `│ 💬 *الوظيفة:* ${c.desc || 'أمر ضمن قسم ' + s.name}${aliases}${usage}\n`;
    t += `╰──────────────────────────────\n\n`;
  });

  t += `🔙 *للرجوع للقائمة الرئيسية:* اكتب *.اوامر*\n`;
  t += `💡 *لشرح أمر معين:* اكتب *.شرح ${list[0]?.name || ''}*\n`;
  t += CHANNEL_FOOTER;

  return t;
}

// 👑 لوحة التحكم السرية للمطور
export function secretOwnerMenu(pushName = 'المطور') {
  const all = uniqueCommands();
  const ownerCmds = all.filter(c => c.section === 'owner' || c.owner);

  let t = `╔══════════════════════════════════════╗\n`;
  t += `║   👑 𝑵𝑶 & 𝑵𝑶 • 𝑶𝑾𝑵𝑬𝑹 𝑪𝑶𝑵𝑻𝑹𝑶𝑳 👑   ║\n`;
  t += `╚══════════════════════════════════════╝\n\n`;

  t += `🔐 *غرفة العمليات والسيادة السرية (سري للغاية)*\n`;
  t += `👤 *المطور المصرح له:* ${pushName} (${config.developer})\n`;
  t += `📦 *إجمالي أوامر المطور:* *${ownerCmds.length}* أمر تحكم كامل\n`;
  t += `🛡️ *حالة الحماية:* مشفرة ومحمية بالكامل\n\n`;

  ownerCmds.forEach((c, idx) => {
    const aliases = c.aliases && c.aliases.length ? `\n│ 🏷️ *البدائل:* ${c.aliases.slice(0, 3).map(a => '.' + a).join(' ، ')}` : '';
    t += `╭───《 👑 *${idx + 1}. .${c.name}* 》───\n`;
    t += `│ 💬 *الوظيفة:* ${c.desc || 'أمر سيادة وتحكم'}${aliases}\n`;
    t += `╰──────────────────────────────\n\n`;
  });

  t += `⚡ *هذه القائمة مخفية ولا تظهر لأي مستخدم آخر نهائياً!*\n`;
  t += CHANNEL_FOOTER;
  return t;
}

export function explainCommand(cmdName) {
  if (!cmdName) {
    return `💡 *طريقة استخدام أمر الشرح:*\n*.شرح <اسم الأمر>*\n\n📌 *مثال:*\n*.شرح اغنيه* أو *.شرح تيك* أو *.شرح فك*`;
  }

  const q = cmdName.replace(/^[.!#]/, '').trim().toLowerCase();
  const all = uniqueCommands();
  const cmd = all.find(c => c.name.toLowerCase() === q || (c.aliases || []).some(a => a.toLowerCase() === q));

  if (!cmd) {
    return `❌ لم يتم العثور على أي أمر باسم: *${cmdName}*\nاكتب *.اوامر* لتصفح قائمة الأوامر المتاحة.`;
  }

  if (cmd.owner || cmd.section === 'owner') {
    return `❌ هذا الأمر خاص بالنظام ولا يمكن استعراض تفاصيله.`;
  }

  const flagStr = cmd.admin ? '🛡️ مشرفي المجموعات' : cmd.group ? '👥 داخل المجموعات فقط' : '🌐 متاح للجميع';
  const aliasesStr = cmd.aliases && cmd.aliases.length ? cmd.aliases.map(a => '.' + a).join(' ، ') : 'لا يوجد';
  const usageStr = cmd.usage && cmd.usage.length ? cmd.usage.join('\n│    ↳ ') : `.${cmd.name}`;

  let t = `╔══════════════════════════════════════╗\n`;
  t += `║   📖 *بطاقة شرح الأمر:* .${cmd.name}\n`;
  t += `╚══════════════════════════════════════╝\n\n`;
  t += `│ 🏷️ *اسم الأمر:* .${cmd.name}\n`;
  t += `│ 📂 *القسم التابع له:* ${cmd.section || 'عام'}\n`;
  t += `│ 🔒 *مستوى الصلاحية:* ${flagStr}\n`;
  t += `│ 💬 *الوصف والوظيفة:* ${cmd.desc || 'لا يوجد وصف متاح'}\n`;
  t += `│ 🏷️ *الأسماء البديلة:* ${aliasesStr}\n`;
  t += `│ 💡 *طريقة الاستخدام:*\n`;
  t += `│    ↳ ${usageStr}\n`;

  t += CHANNEL_FOOTER;
  return t;
}

export function botCard() {
  let t = `╔══════════════════════════════════════╗\n`;
  t += `║   ⚡ 𝑵𝑶 & 𝑵𝑶 • 𝑼𝑳𝑻𝑹𝑨 𝑽𝑰𝑷 𝑩𝑶𝑻 ⚡   ║\n`;
  t += `╚══════════════════════════════════════╝\n\n`;
  t += `│ 🎐 أهلاً بك في أقوى منصة ذكاء اصطناعي وأوامر واتساب شاملة!\n`;
  t += `│ 👑 المطور الأساسي: *${config.developer}*\n`;
  t += `│ 📦 أكثر من *500+* أمر فعلي متكامل\n`;
  t += `│ 🌐 الموقع الرسمي:\n`;
  t += `│    https://noandno-production.up.railway.app\n`;
  t += `│ 📢 القناة الرسمية للتحديثات:\n`;
  t += `│    ${config.channelLink}\n\n`;
  t += `💬 اكتب *.اوامر* لعرض لوحة التحكم والأقسام!\n`;

  t += CHANNEL_FOOTER;
  return t;
}
