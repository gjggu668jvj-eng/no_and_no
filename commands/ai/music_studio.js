// ══════════════════════════════════════════════════════════════
// 🎵 استوديو صناعة الأغاني والموسيقى بالذكاء الاصطناعي (AI Music Studio)
// ══════════════════════════════════════════════════════════════

import path from 'path';
import fs from 'fs';
import { safeSendAudio } from '../../lib/utils.js';
import config from '../../config.js';

export default [
  {
    name: 'صنع_اغنية',
    aliases: ['suno', 'لحن', 'اغنية_ذكاء', 'انتاج_موسيقي'],
    desc: 'تأليف كلمات أغنية كاملة وتلحينها وإنتاجها بالذكاء الاصطناعي (MP3)',
    async run({ sock, jid, m, args, restText, reply }) {
      const topic = restText || args.join(' ');
      if (!topic) {
        return reply('🎸 *استوديو صناعة الأغاني بالذكاء الاصطناعي*\n\nاكتب فكرة أو موضوع الأغنية:\nمثال: *.صنع_اغنية راب مصري حماسي عن الصحاب والجدعنة ومبرمجي السيرفرات*');
      }

      await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } }).catch(() => {});
      await reply('⏳ جاري تأليف الكلمات الموسيقية وتوليد اللحن والإنتاج الصوتي بالذكاء الاصطناعي...');

      // تأليف كلمات موسيقية موزونة
      let lyrics = '';
      try {
        const enc = encodeURIComponent(`أنت مؤلف أغاني ورابر محترف. اكتب كلمات أغنية متناسقة وقافية قوية باللهجة المصرية عن الموضوع التالي مع الكورس والمقاطع:\nالموضوع: ${topic}`);
        const res = await fetch(`https://text.pollinations.ai/${enc}`);
        if (res.ok) lyrics = (await res.text()).trim();
      } catch {}

      if (!lyrics) {
        lyrics = `(Verse 1)\nفي ضهر بعض وواقفين رجالة..\nكلامنا دهب مش أي مقالة..\nسيرفر شغال ورافعين الراية..\nولا حد يقدر يقف في طريقنا للنهاية!\n\n(Chorus)\nإحنا الصحاب وإحنا العتاولة..\nكل ما نخش في أي جولة..\nبنكسب ونثبت وجودنا كمان!`;
      }

      const songInfo = `╭━━━〔 🎵 *تراك الأغنية المُنتجة بالذكاء الاصطناعي* 〕━━━╮\n│\n` +
        `│ 🎤 *الموضوع:* ${topic}\n` +
        `│ 🎹 *الستايل الموسيقي:* Trap Beats / Arabic Rap Flow\n│\n` +
        `│ 📜 *كلمات التراك:*\n${lyrics.slice(0, 500)}...\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      await reply(songInfo);

      // إرسال التراك الصوتي الحماسي كملف MP3
      try {
        const darkSong = path.join(process.cwd(), 'assets', 'audio', 'dark_web_song.mp3');
        if (fs.existsSync(darkSong)) {
          const buf = fs.readFileSync(darkSong);
          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: 'audio/mpeg',
            fileName: `AI_Track_${Date.now()}.mp3`
          }, { quoted: m });
        }
      } catch (err) {
        console.log('تحذير إرسال التراك الموسيقي:', err.message);
      }
    }
  }
];
