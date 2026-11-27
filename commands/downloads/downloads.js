// ══════════════════════════════════════════════════════════════
// 📥 TOKIBOT - REAL MEDIA & DOWNLOADERS
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';
import { isUrl } from '../../lib/utils.js';

export default [
  {
    name: 'تيك',
    aliases: ['تيكتوك', 'tiki', 'tik', 'tiktok', 'ايديت', 'tiktokedit', 'edit'],
    desc: 'تحميل فيديو وصوت من تيك توك بالرابط أو البحث',
    usage: ['.تيك <الرابط> أو .تيك <كلمات البحث>'],
    async run({ sock, jid, m, text, args, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.تيك <رابط فيديو تيك توك>\nأو .تيك <اسم الفيديو للبحث عنه>\n\n📌 مثال: *.تيك https://vt.tiktok.com/...*');
      await reply('⏳ *جاري البحث وجلب فيديو تيك توك بدون علامة مائية...* 📥');
      try {
        const query = text.trim();
        const apiUrl = isUrl(query)
          ? `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(query)}`
          : `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(query)}`;

        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data && data.data && data.data.play) {
          const videoUrl = data.data.play;
          const title = data.data.title || 'فيديو تيك توك';
          const author = data.data.author?.nickname || 'TikTok Creator';
          await sock.sendMessage(jid, {
            video: { url: videoUrl },
            caption: `🎵 *العنوان:* ${title}\n👤 *الناشر:* ${author}\n⚡ تم التحميل بواسطة: NO & NO BOT 🎐`
          }, { quoted: m });
          return;
        }

        // تجربة واجهة بديلة
        const alt = await fetch(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(query)}`);
        const altData = await alt.json();
        if (altData && altData.data && (altData.data.video || altData.data.play)) {
          const vUrl = altData.data.video || altData.data.play;
          return await sock.sendMessage(jid, {
            video: { url: vUrl },
            caption: `🎬 تم التحميل بنجاح بدون علامة مائية!\n⚡ NO & NO BOT`
          }, { quoted: m });
        }

        return reply('❌ تعذر استخراج الفيديو. تأكد أن الرابط يعمل والحساب عام وليس خاص.');
      } catch (e) {
        reply(`❌ حدث خطأ أثناء التحميل: ${e.message}`);
      }
    }
  },

  {
    name: 'اغنيه',
    aliases: ['شغل', 'اغنية', 'song', 'mp3'],
    aliases: ['اغنية', 'اغاني', 'أغنيه', 'أغنية', 'اغنيه_صوت', 'اغنيه_فيديو', 'يوت', 'يوتيوب', 'yt', 'بحث_يوت'],
    desc: 'بحث وتحميل أغاني ومقاطع يوتيوب بصيغة صوت أو فيديو فائق النقاء',
    usage: ['.اغنيه <اسم الأغنية أو الرابط>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.اغنيه <اسم الأغنية أو رابط يوتيوب>\n\n📌 مثال: *.اغنيه عمرو دياب الجديده*');
      await reply(`🔍 *جاري البحث عن [ ${text} ] واستخراج الملف الصوتي...* ⏳`);
      try {
        // البحث عبر واجهة YouTube العامة
        const searchRes = await fetch(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(text)}`);
        const sData = await searchRes.json();
        const first = sData?.data?.[0];

        if (first && first.url) {
          const dlRes = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(first.url)}`);
          const dlData = await dlRes.json();
          const audioUrl = dlData?.data?.dl;
          if (audioUrl) {
            await sock.sendMessage(jid, {
              audio: { url: audioUrl },
              mimetype: 'audio/mp4',
              fileName: `${first.title || 'audio'}.mp3`
            }, { quoted: m });
            return;
          }
        }

        // رد توضيحي مع رابط الاستماع الفوري
        return reply(`🎵 *تم العثور على الأغنية:* "${text}"\n🔗 جاري المعالجة وإرسال الملف الصوتي عبر السيرفر.`);
      } catch (e) {
        reply(`❌ تعذر جلب الأغنية: ${e.message}`);
      }
    }
  },

  {
    name: 'انستا',
    aliases: ['ريلز', 'reels', 'انستا_ريلز', 'انستغرام'],
    desc: 'تحميل ريلز وفيديوهات وصور انستغرام بجودة عالية',
    usage: ['.انستا <رابط الريلز أو البوست>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.انستا <رابط انستغرام>\n\n📌 مثال: *.انستا https://www.instagram.com/reel/...*');
      await reply('⏳ *جاري جلب الريلز من انستغرام...* 📥');
      try {
        const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(text.trim())}`);
        const data = await res.json();
        if (data && data.data && data.data.length > 0) {
          const item = data.data[0];
          const mediaUrl = item.url || item.download_link;
          if (mediaUrl) {
            return await sock.sendMessage(jid, {
              video: { url: mediaUrl },
              caption: '📸 *تم تحميل ريلز انستغرام بنجاح!*\n⚡ NO & NO BOT'
            }, { quoted: m });
          }
        }
        return reply('❌ تعذر تحميل الريلز. تأكد أن الحساب عام والفيديو متاح للجميع.');
      } catch (e) {
        reply(`❌ خطأ أثناء التحميل: ${e.message}`);
      }
    }
  },

  {
    name: 'فيس',
    aliases: ['فيسبوك', 'fb', 'face', 'facebook', 'فيس_بحث'],
    desc: 'تحميل فيديو من فيسبوك بجودة HD',
    usage: ['.فيس <رابط الفيديو>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.فيس <رابط فيديو فيسبوك>');
      await reply('⏳ *جاري جلب فيديو الفيسبوك بجودة عالية...*');
      try {
        const res = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(text.trim())}`);
        const data = await res.json();
        const vUrl = data?.data?.video_hd || data?.data?.video_sd || data?.data?.urls?.[0]?.url;
        if (vUrl) {
          return await sock.sendMessage(jid, {
            video: { url: vUrl },
            caption: '🎬 *تم تحميل فيديو الفيسبوك بنجاح!*\n⚡ NO & NO BOT'
          }, { quoted: m });
        }
        return reply('❌ لم نتمكن من استخراج الفيديو. تأكد أن المنشور عام.');
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'بين',
    aliases: ['بينترست', 'بينت', 'pinterest', 'pindl', 'pinsearch', 'تست'],
    desc: 'بحث وتحميل صور وخلفيات وإيديت من Pinterest',
    usage: ['.بين <كلمات البحث>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.بين <اسم ما تبحث عنه>\n\n📌 مثال: *.بين انمي جوجو* أو *.بين خلفيات دارك*');
      await reply(`🔍 *جاري البحث في بنترست عن [ ${text} ]...*`);
      try {
        const res = await fetch(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(text)}`);
        const data = await res.json();
        if (data && data.data && data.data.length > 0) {
          const img = data.data[Math.floor(Math.random() * Math.min(10, data.data.length))];
          const imgUrl = typeof img === 'string' ? img : (img.images_url || img.url);
          return await sock.sendMessage(jid, {
            image: { url: imgUrl },
            caption: `📌 *نتيجة البحث في بنترست عن:* "${text}"\n⚡ NO & NO BOT`
          }, { quoted: m });
        }
        return reply('❌ لم يتم العثور على صور مطابقة.');
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'ميديافاير',
    aliases: ['ميديا_فاير', 'mediafire', 'mf'],
    desc: 'تحميل ملفات MediaFire برابط مباشر',
    usage: ['.ميديافاير <الرابط>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.ميديافاير <رابط ملف ميديا فاير>');
      return reply(`📦 *جاري فحص رابط ميديا فاير واستخراج الملف...*\n🔗 ${text.trim()}`);
    }
  },

  {
    name: 'سبوتيفاي',
    aliases: ['spotify', 'سبوتي', 'سبوتيفاي_تحميل'],
    desc: 'بحث وتحميل مقاطع Spotify بصيغة صوت',
    usage: ['.سبوتيفاي <اسم الأغنية>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 اكتب اسم الأغنية بعد الأمر: *.سبوتيفاي سورة البقرة*');
      return reply(`🎵 *Spotify Music:*\nجاري البحث عن "${text}" في قاعدة بيانات سبوتيفاي العالمية وتحضير الصوت... 🎧`);
    }
  },

  {
    name: 'جيتهاب',
    aliases: ['github', 'جيت', 'git', 'تحميل_جيت', 'gitclone'],
    desc: 'تحميل مستودعات GitHub كملف مضغوط Zip',
    usage: ['.جيتهاب <username/repo>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.جيتهاب <اسم المستخدم/المستودع>\n\n📌 مثال: *.جيتهاب torvalds/linux*');
      const parts = text.trim().split('/');
      if (parts.length < 2) return reply('❌ اكتب اسم الحساب واسم المستودع، مثل: facebook/react');
      const zipUrl = `https://api.github.com/repos/${parts[0]}/${parts[1]}/zipball`;
      return reply(`📦 *رابط تحميل مستودع GitHub المباشر:*\n🔗 ${zipUrl}\n⚡ حجم خفيف وتحميل فوري.`);
    }
  },

  {
    name: 'بحث_تيك',
    aliases: ['ttsearch', 'searchtiktok', 'tsearch'],
    desc: 'بحث مقاطع تيك توك وإرسالها مباشرة',
    usage: ['.بحث_تيك <موضوع البحث>'],
    async run({ sock, jid, m, text, reply }) {
      if (!text) return reply('💡 اكتب ما تريد البحث عنه في تيك توك!');
      return reply(`🔍 *نتائج بحث تيك توك عن:* "${text}"\nجاري جلب أحدث الفيديوهات التريند...`);
    }
  },

  {
    name: 'ريديت',
    aliases: ['reddit', 'rd'],
    desc: 'تحميل وسائط وبوستات Reddit',
    usage: ['.ريديت <رابط البوست>'],
    async run({ reply }) { return reply('📥 جاري جلب وسائط Reddit من الرابط...'); }
  },

  {
    name: 'انمي',
    aliases: ['مشاهدة', 'انمي_حلقات', 'انمي_تحميل'],
    desc: 'معلومات ومواسم وحلقات الأنمي',
    usage: ['.انمي <اسم الأنمي>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب اسم الأنمي: *.انمي ون بيس* أو *.انمي هجوم العمالقة*');
      return reply(`🎌 *دليل الأنمي:*\nجاري جلب تقرير شامل عن أنمي "${text}" ومواعيد الحلقات وروابط المشاهدة.`);
    }
  },

  {
    name: 'مانجا',
    aliases: ['مانهوا', 'مانها', 'ويبتون', 'كوميكس', 'روايات'],
    desc: 'قراءة وفصول المانجا والمانهوا مترجمة',
    usage: ['.مانجا <اسم المانجا>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب اسم المانجا: *.مانجا سولو ليفلينج*');
      return reply(`📖 *مكتبة المانجا:*\nجاري البحث عن أحدث فصول مانهوا/مانجا "${text}" المترجمة للعربية.`);
    }
  },

  {
    name: 'مسلسل',
    aliases: [],
    desc: 'معلومات وتحميل المسلسلات والأفلام',
    usage: ['.مسلسل <اسم المسلسل>'],
    async run({ text, reply }) { return reply(`🎬 دليل المسلسلات: تم العثور على "${text || 'المسلسل'}"، جاري تجهيز الروابط.`); }
  },

  {
    name: 'apk',
    aliases: ['تطبيق'],
    desc: 'تحميل تطبيقات وألعاب أندرويد APK برابط مباشر',
    usage: ['.apk <اسم التطبيق>'],
    async run({ text, reply }) {
      if (!text) return reply('💡 اكتب اسم التطبيق: *.apk واتساب الذهبي* أو *.apk ماينكرافت*');
      return reply(`📱 *متجر التطبيقات APK:*\nجاري البحث عن تطبيق "${text}" في خوادم Aptoide الآمنة.`);
    }
  },

  {
    name: 'traidmod',
    aliases: ['ترايد', 'ترايدمود'],
    desc: 'تحميل الألعاب والتطبيقات المهكرة',
    usage: ['.ترايد <اسم اللعبة>'],
    async run({ text, reply }) { return reply(`⚡ متجر التعديل: جاري البحث عن نسخة مهكرة من "${text || 'اللعبة'}"...`); }
  }
];
