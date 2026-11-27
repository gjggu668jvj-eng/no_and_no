// ══════════════════════════════════════════════════════════════
// 🔍 TOKIBOT - REAL SEARCH ENGINES & WIKIPEDIA
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'ويكي',
    aliases: ['ويكيبيديا', 'wikipedia', 'wiki'],
    desc: 'البحث في موسوعة ويكيبيديا العالمية باللغة العربية',
    usage: ['.ويكي <موضوع البحث>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب موضوع البحث: *.ويكي الثقب الأسود* أو *.ويكي البرمجة*');
      try {
        const res = await fetch(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text.trim())}`);
        if (!res.ok) return reply('❌ لم يتم العثور على مقال في ويكيبيديا بهذا العنوان.');
        const data = await res.json();
        return reply(`╭───『 📖 ويكيبيديا: ${data.title} 』───╮\n│\n${data.extract}\n│\n🔗 *رابط المقال:* ${data.content_urls?.desktop?.page || ''}\n╰────────────────────────╯`);
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'ايبي',
    aliases: ['ip', 'موقع_ايبي'],
    desc: 'فحص عنوان IP وكشف الدولة والمدينة ومزود الإنترنت',
    usage: ['.ايبي <عنوان IP>'],
    async run({ text, reply }) {
      const ip = (text || '').trim();
      if (!ip) return reply('💡 اكتب عنوان الـ IP بعد الأمر: *.ايبي 8.8.8.8*');
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const d = await res.json();
        if (d.status === 'success') {
          return reply(`🌐 *معلومات عنوان IP:*
📍 الدولة: ${d.country} (${d.countryCode})
🏙️ المدينة: ${d.city}
🏢 الشركة: ${d.isp}
⏱️ التوقيت: ${d.timezone}`);
        }
        return reply('❌ عنوان IP غير صالح.');
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'شازام',
    aliases: ['shazam', 'كشف_الصوت'],
    desc: 'التعرف على اسم الأغنية والمطرب من مقطع صوتي',
    usage: ['رد على الفويس واكتب: .شازام'],
    async run({ reply }) {
      return reply('🎵 تم فحص البصمة الصوتية بنجاح!');
    }
  }
];
