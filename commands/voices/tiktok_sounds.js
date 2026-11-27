import { spawn } from 'child_process';
import { safeSendAudio } from '../../lib/utils.js';

// قائمة غنية بأشهر أصوات التيك توك والميمز المصرية والعربية بروابط صوتية فورية
const VIRAL_SOUNDS = {
  'حقي ناشف': 'https://www.myinstants.com/media/sounds/3ayez-7a2y-nashef.mp3',
  'عايز حقي': 'https://www.myinstants.com/media/sounds/3ayez-7a2y-nashef.mp3',
  'يا فايق': 'https://www.myinstants.com/media/sounds/ya-fayeq.mp3',
  'فايق': 'https://www.myinstants.com/media/sounds/ya-fayeq.mp3',
  'عادل امام': 'https://www.myinstants.com/media/sounds/adel-emam-laugh.mp3',
  'ضحكة عادل امام': 'https://www.myinstants.com/media/sounds/adel-emam-laugh.mp3',
  'يا لهوي': 'https://www.myinstants.com/media/sounds/ya-lahwy.mp3',
  'مرعب': 'https://www.myinstants.com/media/sounds/creepy-lullaby.mp3',
  'صوت مرعب': 'https://www.myinstants.com/media/sounds/scary-sound-effect.mp3',
  'صرخة': 'https://www.myinstants.com/media/sounds/screaming-man.mp3',
  'انا بابا': 'https://www.myinstants.com/media/sounds/ana-baba-yala.mp3',
  'بابا جه': 'https://www.myinstants.com/media/sounds/baba-geh.mp3',
  'ما تيجي نشوف': 'https://www.myinstants.com/media/sounds/ma-tegy-nshoof.mp3',
  'فاهم يا غبي': 'https://www.myinstants.com/media/sounds/fahem-ya-ghaby.mp3',
  'اسفخس': 'https://www.myinstants.com/media/sounds/esfakhs-3aleek.mp3',
  'يا ختي': 'https://www.myinstants.com/media/sounds/ya-khety.mp3',
  'ترا تا تا': 'https://www.myinstants.com/media/sounds/tra-ta-ta.mp3',
  'احيه': 'https://www.myinstants.com/media/sounds/a7eeh.mp3',
  'شخير': 'https://www.myinstants.com/media/sounds/snore-meme.mp3',
  'صدمة': 'https://www.myinstants.com/media/sounds/dramatic-sound.mp3',
  'نعم يا اخويا': 'https://www.myinstants.com/media/sounds/na3am-ya-khoia.mp3',
  'لا يا راجل': 'https://www.myinstants.com/media/sounds/la-ya-ragel.mp3',
  'حبيبي يا ربنا': 'https://www.myinstants.com/media/sounds/7abiby-ya-rabena.mp3',
  'يا ابن المحظوظة': 'https://www.myinstants.com/media/sounds/ya-ebn-el-ma7zoza.mp3',
  'ضحكة شريرة': 'https://www.myinstants.com/media/sounds/evil-laugh.mp3',
  'سيد الناس': 'https://www.myinstants.com/media/sounds/sayed-el-nas.mp3',
  'ساعة الموت': 'https://www.myinstants.com/media/sounds/death-clock.mp3',
  'اوعى': 'https://www.myinstants.com/media/sounds/ew3a.mp3',
  'بص يا باشا': 'https://www.myinstants.com/media/sounds/bos-ya-basha.mp3',
  'يا عم اقعد': 'https://www.myinstants.com/media/sounds/ya-3am-o23od.mp3',
};

// دالة تحويل الصوت إلى صيغة Ogg Opus لتشغيله كريكورد حقيقي
async function toOpus(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '32k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-f', 'opus',
        'pipe:1',
      ]);
      const chunks = [];
      ffmpeg.stdout.on('data', c => chunks.push(c));
      ffmpeg.on('close', code => {
        if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
        else reject(new Error('ffmpeg failed code ' + code));
      });
      ffmpeg.on('error', reject);
      ffmpeg.stdin.end(buffer);
    } catch (e) {
      reject(e);
    }
  });
}

// دالة البحث التلقائي عن أي صوت في Myinstants للتريندات الجديدة
async function searchMyinstants(query) {
  try {
    const res = await fetch(`https://www.myinstants.com/api/v1/instants/?name=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.length > 0) {
        return {
          title: data.results[0].name,
          url: data.results[0].sound,
        };
      }
    }
  } catch {}
  return null;
}

export default [
  // 1. أمر صوت التيك توك والميمز
  {
    name: 'صوت_تيك',
    aliases: ['ميم_صوت', 'ترند_صوت', 'ريكورد_تيك', 'صوت_ميم'],
    desc: 'إرسال أي صوت أو جملة مشهورة على التيك توك كرسالة صوتية (فويس نوت)',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = (text || quotedText || '').trim().toLowerCase();
      if (!q) {
        return reply(`💡 *اكتب اسم الجملة أو الترند بعد الأمر مباشرة!*\n\n` +
          `📌 أمثلة شهيرة:\n` +
          `▫️ *.صوت_تيك عايز حقي ناشف*\n` +
          `▫️ *.صوت_تيك يا فايق*\n` +
          `▫️ *.صوت_تيك ضحكة عادل امام*\n` +
          `▫️ *.صوت_تيك انا بابا يالا*\n` +
          `▫️ *.صوت_تيك يا لهوي*\n` +
          `▫️ *.صوت_تيك صوت مرعب*\n\n` +
          `📜 لعرض كافة الأصوات المتاحة اكتب: *.قائمة_الاصوات*`);
      }

      await react('🎙️');

      let audioUrl = null;
      let soundName = q;

      // 1. البحث في القائمة الجاهزة
      for (const [key, url] of Object.entries(VIRAL_SOUNDS)) {
        if (q.includes(key) || key.includes(q)) {
          audioUrl = url;
          soundName = key;
          break;
        }
      }

      // 2. إذا لم يكن بالقائمة، ابحث فورياً في خوادم أصوات التيك توك العالمية
      if (!audioUrl) {
        await reply(`🔍 جاري البحث عن ريكورد "${q}" في ترندات التيك توك...`);
        const result = await searchMyinstants(q);
        if (result?.url) {
          audioUrl = result.url;
          soundName = result.title;
        }
      }

      if (!audioUrl) {
        return reply(`❌ تعذر العثور على ريكورد مطابق لـ "${q}".\n💡 اكتب *.قائمة_الاصوات* لرؤية أشهر الأصوات المتوفرة أو جرب اسماً آخر.`);
      }

      try {
        const res = await fetch(audioUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error('فشل تحميل الملف الصوتي');
        const buffer = Buffer.from(await res.arrayBuffer());

        await safeSendAudio(sock, jid, buffer, { ptt: true }, m);
        await react('🔥');
      } catch (e) {
        reply(`❌ حدث خطأ أثناء إرسال الصوت: ${e.message}`);
      }
    },
  },

  // 2. قائمة الأصوات المتاحة
  {
    name: 'قائمة_الاصوات',
    aliases: ['اصوات_تيك', 'ترندات_الصوت', 'كتالوج_الاصوات'],
    desc: 'عرض الكتالوج الكامل لأشهر الأصوات وريكوردات التيك توك المدمجة',
    async run({ reply, react }) {
      await react('📜');
      const keys = Object.keys(VIRAL_SOUNDS);
      let msg = `╭───〔 🎙️ *كتالوج ريكوردات وترندات التيك توك* 〕───╮\n│\n`;
      msg += `│ 💡 للاستخدام اكتب: *.صوت_تيك <الاسم>*\n│\n`;
      keys.forEach((k, i) => {
        msg += `│ [${String(i + 1).padStart(2, '0')}] 🔊 *${k}*\n`;
      });
      msg += `│\n│ 🌟 يمكنك أيضاً كتابة أي جملة أو ميم حتى لو لم تكن بالقائمة، وسيبحث عنها البوت فورياً!\n`;
      msg += `╰────────────────────────────╯`;
      reply(msg);
    },
  },

  // 3. صوت عشوائي
  {
    name: 'صوت_عشوائي',
    aliases: ['ميم_عشوائي', 'فويس_عشوائي'],
    desc: 'إرسال ريكورد أو صوت ميمز عشوائي مضحك من التيك توك',
    async run({ reply, react, sock, jid, m }) {
      await react('🎲');
      const keys = Object.keys(VIRAL_SOUNDS);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const audioUrl = VIRAL_SOUNDS[randomKey];

      try {
        const res = await fetch(audioUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const buffer = Buffer.from(await res.arrayBuffer());
        await safeSendAudio(sock, jid, buffer, { ptt: true }, m);
      } catch (e) {
        reply(`❌ فشل جلب الصوت: ${e.message}`);
      }
    },
  },
];
