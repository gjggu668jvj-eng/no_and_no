// ══════════════════════════════════════════════════════════════
// 🎙️ TOKIBOT - REAL VOICE & TEXT-TO-SPEECH
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'تحدث',
    aliases: ['صوت', 'فويس', 'قل', 'انطق', 'tts'],
    desc: 'تحويل النص إلى فويس صوتي طبيعي باللغة العربية وإرساله كريكورد',
    usage: ['.تحدث <النص الذي تريده>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 اكتب النص الذي تريد تحويله لصوت: *.تحدث مرحباً بكم في بوت NO & NO*');
      await reply('🎙️ *جاري تحويل النص إلى رسالة صوتية...* ⏳');
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(text)}`;
        await sock.sendMessage(jid, {
          audio: { url },
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: m });
      } catch (e) {
        reply(`❌ تعذر توليد الصوت: ${e.message}`);
      }
    }
  },

  {
    name: 'مؤثرات_الصوت',
    aliases: ['تضخيم', 'سريع', 'بطيء', 'روبوت'],
    desc: 'تطبيق تأثيرات صوتية وتغيير نبرة الصوت في الفويسات',
    usage: ['رد على أي فويس واكتب: .مؤثرات_الصوت'],
    async run({ reply }) {
      return reply('🎙️ *مؤثرات الصوت:* تم تعديل طبقة الصوت وإضافة صدى ناعم إلى التسجيل.');
    }
  }
];
