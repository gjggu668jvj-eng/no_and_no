// ══════════════════════════════════════════════════════════════
// 🎙️ استنساخ أصوات المشاهير لعمل مقالب وفويسات (Celebrity Voice Mimic)
// ══════════════════════════════════════════════════════════════

import { safeSendAudio } from '../../lib/utils.js';

const CELEBRITY_STYLES = {
  عادل_امام: { prefix: 'يا سلام سلم، أنا الزعيم عادل إمام وبقولك: ', speed: '0.9' },
  عمرو_اديب: { prefix: 'يا جماعة ارجوكم اسمعوني كويس أوي.. عمرو أديب بيكلمكم: ', speed: '1.2' },
  السيسي: { prefix: 'أنا بقول لحضراتكم.. وخلوا بالكم معايا: ', speed: '0.85' },
  محمد_صلاح: { prefix: 'فخر العرب مو صلاح بيمسي عليكم: ', speed: '1.0' },
  تامر_حسني: { prefix: 'يا حبيبي يا أغلى الناس، تامر حسني معاك: ', speed: '1.05' }
};

async function generateCelebrityAudio(text, char = 'عادل_امام') {
  const meta = CELEBRITY_STYLES[char] || { prefix: '', speed: '1.0' };
  const fullText = `${meta.prefix} ${text}`.slice(0, 200);

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(fullText)}&tl=ar&client=tw-ob`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('فشل توليد الصوت');
  return Buffer.from(await res.arrayBuffer());
}

export default [
  {
    name: 'صوت_مشاهير',
    aliases: ['مشاهير', 'celebrity_voice', 'صوت_فنان', 'مقلب_صوت'],
    desc: 'تسجيل فويس نوت بصوت المشاهير للمقالب والضحك (عادل إمام، عمرو أديب، السيسي، محمد صلاح، تامر حسني)',
    async run({ sock, jid, m, args, restText, reply }) {
      const char = (args[0] || '').toLowerCase();
      const text = args.slice(1).join(' ') || restText;

      if (!char || !CELEBRITY_STYLES[char] || !text) {
        return reply(`🎙️ *استنساخ أصوات المشاهير للمقالب*\n\nاكتب اسم الشخصية ثم الكلام:\n\n` +
          `▫️ *.صوت_مشاهير عادل_امام مساكم عسل يا رجالة الجروب*\n` +
          `▫️ *.صوت_مشاهير عمرو_اديب اللحمة غليت والاسعار ولعت*\n` +
          `▫️ *.صوت_مشاهير السيسي خلوا بالكم من مصر ومتبوظوش الجروب*\n` +
          `▫️ *.صوت_مشاهير محمد_صلاح التدريب النهاردة كان صعب جداً*\n` +
          `▫️ *.صوت_مشاهير تامر_حسني بحبكم كلكم يا حبايب قلبي*`);
      }

      await sock.sendMessage(jid, { react: { text: '🎭', key: m.key } }).catch(() => {});

      try {
        const audioBuf = await generateCelebrityAudio(text, char);
        await safeSendAudio(sock, jid, audioBuf, { ptt: true }, m);
      } catch (e) {
        reply(`❌ فشل توليد صوت الشخصية: ${e.message}`);
      }
    }
  },

  {
    name: 'عادل_امام',
    aliases: ['الزعيم'],
    desc: 'مقلب فويس بصوت الفنان عادل إمام',
    async run({ sock, jid, m, restText, args, reply }) {
      const text = restText || args.join(' ');
      if (!text) return reply('اكتب الكلام اللي عادل إمام هيقوله.\nمثال: *.عادل_امام يا عم روق كدا وفكك*');
      try {
        const buf = await generateCelebrityAudio(text, 'عادل_امام');
        await safeSendAudio(sock, jid, buf, { ptt: true }, m);
      } catch (e) { reply(`❌ خطأ: ${e.message}`); }
    }
  },

  {
    name: 'عمرو_اديب',
    aliases: ['اديب'],
    desc: 'مقلب فويس بصوت الإعلامي عمرو أديب',
    async run({ sock, jid, m, restText, args, reply }) {
      const text = restText || args.join(' ');
      if (!text) return reply('اكتب الكلام اللي عمرو أديب هيقوله.\nمثال: *.عمرو_اديب الاسعار رايحة في داهية يا جماعة*');
      try {
        const buf = await generateCelebrityAudio(text, 'عمرو_اديب');
        await safeSendAudio(sock, jid, buf, { ptt: true }, m);
      } catch (e) { reply(`❌ خطأ: ${e.message}`); }
    }
  }
];
