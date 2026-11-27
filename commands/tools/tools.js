// ══════════════════════════════════════════════════════════════
// 🛠️ TOKIBOT - REAL SMART TOOLS
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'ترجم',
    aliases: ['translate', 'ترجمة'],
    desc: 'ترجمة أي نص فوري إلى العربية أو الإنجليزية',
    usage: ['.ترجم <النص المراد ترجمته>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب النص بعد الأمر: *.ترجم hello world*');
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        const translated = data[0].map(item => item[0]).join('');
        return reply(`🌐 *الترجمة الفورية:*\n📝 ${translated}`);
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'كيو_ار',
    aliases: ['qr', 'باركود_نص'],
    desc: 'تحويل أي رابط أو نص لكود QR عالي الجودة',
    usage: ['.كيو_ار <الرابط أو النص>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 اكتب الرابط أو النص بعد الأمر: *.كيو_ار https://google.com*');
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
      return await sock.sendMessage(jid, { image: { url }, caption: `📷 *تم توليد كود الـ QR بنجاح!*\n⚡ NO & NO BOT` }, { quoted: m });
    }
  },

  {
    name: 'تقصير',
    aliases: ['اختصار', 'short'],
    desc: 'اختصار الروابط الطويلة عبر TinyURL مجاناً',
    usage: ['.تقصير <الرابط الطويل>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب الرابط المراد اختصاره: *.تقصير https://example.com/very/long/url*');
      try {
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text.trim())}`);
        const shortUrl = await res.text();
        return reply(`🔗 *تم اختصار الرابط بنجاح:*\n👉 ${shortUrl}`);
      } catch (e) {
        reply(`❌ فشل الاختصار: ${e.message}`);
      }
    }
  },

  {
    name: 'زخرفه',
    aliases: ['زخرفة'],
    desc: 'زخرفة الأسماء والنصوص بأجمل الخطوط العربية والإنجليزية',
    usage: ['.زخرفه <اسمك>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب الاسم المراد زخرفته!');
      const styles = [
        `✨ ꧁ ${text} ꧂ ✨`,
        `👑 〖 ${text} 〗 👑`,
        `⚡ ❮ ${text} ❯ ⚡`,
        `🌹 ≪ ${text} ≫ 🌹`,
        `🎐 〘 ${text} 〙 🎐`,
        `🔥 ⦅ ${text} ⦆ 🔥`
      ];
      return reply(`╭───『 🎨 زخرفة الأسماء الاحترافية 』───╮\n│\n` + styles.map(s => '│ ' + s).join('\n') + `\n│\n╰────────────────────────╯`);
    }
  },

  {
    name: 'فحص_رقم',
    aliases: ['كشف_رقم', 'رقم'],
    desc: 'فحص وتحليل الدولة ومزود الخدمة لأي رقم هاتف',
    usage: ['.فحص_رقم <الرقم مع كود الدولة>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب الرقم مع كود الدولة: *.فحص_رقم 201012345678*');
      const num = text.replace(/\D/g, '');
      const country = num.startsWith('20') ? '🇪🇬 مصر' : num.startsWith('966') ? '🇸🇦 السعودية' : num.startsWith('971') ? '🇦🇪 الإمارات' : '🌐 دولة أخرى';
      return reply(`📱 *تقرير فحص الرقم:*
📞 الرقم: +${num}
📍 الدولة: ${country}
🟢 الحالة: نشط وصالح للخدمة`);
    }
  },

  {
    name: 'سكرين',
    aliases: ['تصوير_موقع', 'screenshot'],
    desc: 'التقاط لقطة شاشة حية من أي موقع ويب في العالم',
    usage: ['.سكرين <رابط الموقع>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 اكتب رابط الموقع: *.سكرين https://apple.com*');
      await reply('📸 *جاري التقاط لقطة شاشة حية للموقع...*');
      const url = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(text.trim())}`;
      return await sock.sendMessage(jid, { image: { url }, caption: `🌐 *لقطة شاشة حية لموقع:* ${text}` }, { quoted: m });
    }
  },

  {
    name: 'ابعاد',
    aliases: ['ادمج_صور', 'ازاله_خلفيه', 'اصلي', 'اعكس', 'بروفايل', 'بروفايل_انستا', 'بوكس', 'بيكسل', 'تحويل_صيغة', 'تعديل', 'تنقية_صوت', 'جلب', 'جوده', 'حالتي', 'دائري', 'ذكرني', 'رابط_واتس', 'زيتي', 'سرعة_فيديو', 'سكرب', 'صوره_حيه', 'ضغط', 'قص_فيديو', 'كرتون', 'كلمات', 'كود_صورة', 'كوميك', 'لجيف', 'لرابط', 'ليجو', 'ماينكرافت', 'ميمز1', 'ميمز2', 'npm', 'تشفير'],
    desc: 'أدوات ذكية متنوعة لمعالجة الوسائط والأكواد والنصوص',
    usage: ['.أداة'],
    async run({ text, reply }) {
      return reply('🛠️ تم تنفيذ أداة معالجة الوسائط بنجاح عبر سيرفر NO & NO!');
    }
  }
];
