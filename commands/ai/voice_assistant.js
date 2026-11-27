// ══════════════════════════════════════════════════════════════
// 🎙️ مود المساعد الصوتي الواقعي (AI Voice Assistant)
// ══════════════════════════════════════════════════════════════

import https from 'https';
import http from 'http';
import { safeSendAudio } from '../../lib/utils.js';
import config from '../../config.js';

async function fetchAIText(prompt) {
  try {
    if (config.ai?.key) {
      const res = await fetch(config.ai.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.ai.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.ai.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'أنت مساعد صوتي ذكي ومرح باللهجة المصرية واللغة العربية، أجب باختصار شديد (في حدود 2-3 جمل كحد أقصى) وبشكل عفوي ومباشر لتناسب الرسائل الصوتية.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150
        })
      });
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content?.trim();
      if (txt) return txt;
    }
  } catch {}

  // بديل مجاني فوري
  try {
    const enc = encodeURIComponent(`أجب باختصار في سطرين باللهجة المصرية كرسالة صوتية: ${prompt}`);
    const res = await fetch(`https://text.pollinations.ai/${enc}`);
    if (res.ok) {
      const txt = await res.text();
      if (txt && txt.length < 500) return txt.trim();
    }
  } catch {}

  return 'أهلاً بك! أنا أسمعك وفهمت سؤالك، كل الأمور تحت السيطرة يا صديقي.';
}

function getGoogleTTS(text, lang = 'ar') {
  return new Promise((resolve, reject) => {
    // تقطيع النص إلى أجزاء لتجنب حدود Google TTS (أقل من 200 حرف)
    const clean = text.replace(/[*_~`]/g, '').slice(0, 200);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=${lang}&client=tw-ob`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, r2 => {
          const chunks = [];
          r2.on('data', c => chunks.push(c));
          r2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

export default [
  {
    name: 'صوت',
    aliases: ['فويس_ذكي', 'تكلم', 'voice_ai', 'رد_صوتي'],
    desc: 'مساعد صوتي ذكي: يجاوب على سؤالك برسالة صوتية واقعية (Voice Note PTT)',
    async run({ sock, jid, m, args, restText, reply }) {
      const prompt = restText || args.join(' ');
      if (!prompt) {
        return reply('🎙️ *المساعد الصوتي الواقعي*\n\nاكتب سؤالك بعد الأمر ليرد عليك البوت بريكورد صوتي واقعي!\nمثال: *.صوت كيف حالك يا بوت وما هي آخر الأخبار؟*');
      }

      await sock.sendMessage(jid, { react: { text: '🎙️', key: m.key } }).catch(() => {});
      const aiReply = await fetchAIText(prompt);

      try {
        const audioBuf = await getGoogleTTS(aiReply, 'ar');
        if (audioBuf && audioBuf.length > 500) {
          await safeSendAudio(sock, jid, audioBuf, { ptt: true }, m);
          return;
        }
      } catch (err) {
        console.log('تحذير توليد الصوت:', err.message);
      }

      // إذا تعذر إرسال الصوت يتم الرد نصياً
      return reply(`🎙️ *رد المساعد:*\n\n${aiReply}`);
    }
  },

  {
    name: 'انطق',
    aliases: ['نطق', 'tts', 'قول'],
    desc: 'تحويل أي نص تكتبه إلى رسالة صوتية (PTT) بصوت نقي',
    async run({ sock, jid, m, args, restText, reply }) {
      const text = restText || args.join(' ');
      if (!text) return reply('اكتب النص المراد نطقه.\nمثال: *.انطق مرحباً بكم في بوت نو اند نو*');

      try {
        const audioBuf = await getGoogleTTS(text, 'ar');
        await safeSendAudio(sock, jid, audioBuf, { ptt: true }, m);
      } catch (e) {
        reply(`❌ فشل تحويل النص لصوت: ${e.message}`);
      }
    }
  }
];
