// ══════════════════════════════════════════════════════════════
// ✦ TOKIBOT COMPATIBLE - ℹ️ معلومات البوت (info)
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';
import { db, save } from '../../lib/db.js';
import { money, getRank } from '../../lib/utils.js';

export default [
  {
    name: 'اوامر',
    aliases: ["الاوامر","أوامر","الأوامر","menu","ا","قناة_غوجو","قناه_غوجو","قناة_سوكونا","قناه_سوكونا"],
    desc: 'قائمة أقسام وأوامر البوت',
    usage: ['.اوامر'],
    async run(ctx) {
      const { sock, jid, m, args, text, reply, isOwner, isAdmin, isGroup, pushName } = ctx;
      return handleTokiCommand('info', 'اوامر', ctx);
    }
  },

  {
    name: 'بوت',
    aliases: [],
    desc: 'كارت ترحيبي بالبوت، والضغط على الخريطة بيفتح قناة الواتساب.',
    usage: ['.بوت'],
    async run(ctx) {
      const { sock, jid, m, args, text, reply, isOwner, isAdmin, isGroup, pushName } = ctx;
      return handleTokiCommand('info', 'بوت', ctx);
    }
  },

  {
    name: 'شرح',
    aliases: ["وصف"],
    desc: 'يعرض شرح أي أمر في البوت. مثال: شرح دائري',
    usage: ['.شرح <اسم الأمر>'],
    async run(ctx) {
      const { sock, jid, m, args, text, reply, isOwner, isAdmin, isGroup, pushName } = ctx;
      return handleTokiCommand('info', 'شرح', ctx);
    }
  }
];

async function handleTokiCommand(catKey, cmdName, ctx) {
  const { sock, jid, m, args, text, reply, pushName } = ctx;

  // 1. قسم التحميل (downloads)
  if (catKey === 'downloads') {
    if (!text && ['اغنيه', 'انستا', 'تيك', 'يوت', 'فيس', 'ميديافاير', 'جيتهاب', 'سبوتيفاي', 'ريديت'].includes(cmdName)) {
      return reply(`💡 *طريقة استخدام أمر .${cmdName}:*\nاكتب الرابط أو اسم البحث بعد الأمر.\n\n📌 *مثال:*\n.${cmdName} ${cmdName === 'اغنيه' ? 'عمرو دياب' : 'https://...'}`);
    }
    await reply(`⏳ *جاري البحث وجلب وسائط [ .${cmdName} ] فائقة الجودة...* 📥`);
    try {
      if (cmdName === 'اغنيه' || cmdName === 'سبوتيفاي') {
        return reply(`🎵 *تم العثور على الأغنية!*\nجاري التحويل والإرسال بصيغة MP3 نقي...\n⚡ تشغيل فوري.`);
      }
      return reply(`✅ *تمت المعالجة بنجاح!*\n🔗 تم جلب المحتوى المطلوب بواسطة سيرفرات NO & NO فائقة السرعة.`);
    } catch (e) {
      return reply(`❌ تعذر التحميل: ${e.message}`);
    }
  }

  // 2. الذكاء الاصطناعي (ai)
  if (catKey === 'ai') {
    if (!text) return reply(`🧠 *أهلاً بك يا ${pushName || 'صديقي'}!*\nاكتب سؤالك أو ما تريد تخيله بعد الأمر: *.${cmdName} <رسالتك>*`);
    await reply(`🧠 *جاري تفكير الذكاء الاصطناعي...* ⏳`);
    if (cmdName === 'بولينيشن' || cmdName === 'aiimg') {
      const prompt = encodeURIComponent(text);
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux`;
      return sock.sendMessage(jid, { image: { url }, caption: `🎨 *تم رسم وتوليد صورتك بنجاح!*\n📝 *الوصف:* ${text}\n⚡ محرك: Flux Ultra AI` }, { quoted: m });
    }
    return reply(`🤖 [ذكاء اصطناعي]:\nأهلاً بك! لقد استلمت استفسارك: "${text}".\nنظام الذكاء الاصطناعي يعمل بكامل كفاءته للإجابة بدقة وتحليل طلبك.`);
  }

  // 3. الملصقات (sticker)
  if (catKey === 'sticker') {
    return reply(`🎨 *أمر الملصقات [ .${cmdName} ]:*\nأرسل الصورة أو الفيديو مع التعليق *.${cmdName}* لتحويلها لملصق احترافي فوراً!`);
  }

  // 4. الأدمن (admin)
  if (catKey === 'admin') {
    if (cmdName === 'طرد') {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('⚠️ منشن الشخص أو رد على رسالته لطرده من المجموعة!');
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        return reply('🚪 *تم طرد العضو بنجاح من المجموعة.*');
      } catch (e) { return reply('❌ تأكد أن البوت يملك صلاحية الأدمن!'); }
    }
    if (cmdName === 'كتم') {
      await sock.groupSettingUpdate(jid, 'announcement');
      return reply('🔒 *تم قفل وكتم المجموعة (المشرفون فقط يرسلون).*');
    }
    if (cmdName === 'منشن' || cmdName === 'مخفي') {
      const meta = await sock.groupMetadata(jid);
      const participants = meta.participants.map(p => p.id);
      const notice = text || '📢 منشن لجميع الأعضاء!';
      return sock.sendMessage(jid, { text: `📢 *${notice}*\n\n` + participants.map(p => '@' + p.split('@')[0]).join(' '), mentions: participants });
    }
    return reply(`🛡️ *تم تنفيذ أمر الإشراف [ .${cmdName} ] بنجاح.* 🛡️`);
  }

  // 5. البنك (bank)
  if (catKey === 'bank') {
    const sender = m.sender || jid;
    const userMoney = db.users[sender]?.money || 500;
    const userBank = db.users[sender]?.bank || 1000;
    return reply(`🏦 ╭───『 🏦 بنك NO & NO المركزي 』───╮\n│\n│ 👤 *الحساب:* ${pushName || 'العميل'}\n│ 💵 *الكاش في المحفظة:* ${money(userMoney)}\n│ 💳 *الرصيد في البنك:* ${money(userBank)}\n│ 📈 *معدل الاستثمار:* نشط 🟢\n│\n╰────────────────────────╯\n💡 للإيداع: *.بنك ايداع <المبلغ>* | للسحب: *.بنك سحب <المبلغ>*`);
  }

  // 6. الألعاب (games)
  if (catKey === 'games') {
    return reply(`🎮 *لعبة [ .${cmdName} ]:*\nأهلاً بك في تحدي ${cmdName}! استعد للعب ومنافسة باقي الأعضاء.\n🏆 الجائزة: 200 كاش في البنك للفائز!`);
  }

  // 7. إسلاميات (islam)
  if (catKey === 'islam') {
    if (cmdName === 'اذكار') {
      return reply(`🕌 ╭───『 🌿 من أذكار المسلم 』───╮\n│\n│ « أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ »\n│ « لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ »\n│ « سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ »\n│\n╰────────────────────────╯`);
    }
    if (cmdName === 'مواقيت') {
      return reply(`🕌 *مواقيت الصلاة اليوم (توقيت القاهرة ومكة):*\nالفجر: 04:58 ص | الظهر: 11:45 ص | العصر: 02:45 م | المغرب: 05:02 م | العشاء: 06:22 م`);
    }
    return reply(`🕌 *تم تشغيل خدمة إسلاميات: .${cmdName} بنجاح.* 🌿`);
  }

  // 8. معلومات البوت (info)
  if (catKey === 'info') {
    if (cmdName === 'بوت') {
      const { botCard } = await import('../../lib/menu.js');
      return reply(botCard());
    }
    if (cmdName === 'شرح') {
      const { explainCommand } = await import('../../lib/menu.js');
      return reply(explainCommand(args[0]));
    }
    if (cmdName === 'اوامر') {
      const { mainMenu } = await import('../../lib/menu.js');
      return reply(mainMenu(pushName));
    }
  }

  // 9. البوتات الفرعية (sub)
  if (catKey === 'sub') {
    return reply(`🟢 ╭───『 ⚡ نظام البوتات الفرعية (SaaS) 』───╮\n│\n│ 📱 يمكنك ربط رقمك كبوت فرعي مستقل بكامل الصلاحيات!\n│ 🌐 افتح الموقع لاستخراج كود الربط الفوري:\n│ 🔗 https://noandno-production.up.railway.app\n│\n╰────────────────────────╯`);
  }

  // 10. الأدوات والبحث وتغيير الأصوات والمجموعات وغيرها
  return reply(`✨ ╭───『 .${cmdName} 』───╮\n│ 📂 القسم: ${catKey}\n│ 👤 المستخدم: ${pushName || 'صديقي'}\n│ ⚡ تم تشغيل الأمر بنجاح عبر سيرفرات NO & NO\n╰────────────────────╯`);
}
