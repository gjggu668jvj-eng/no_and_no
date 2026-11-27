import config from '../../config.js';
import { getBuffer, getJson, rand } from '../../lib/utils.js';
import { ask } from '../ai/old_ai.js';

export default [
  {
    name: 'بنترست',
    aliases: ['pinterest', 'بنت'],
    desc: 'البحث عن صور وخلفيات بنترست عالية الجودة: /بنترست انمي فخم',
    async run({ text, quotedText, send, reply, react }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب الكلمة المراد البحث عن صور لها في بنترست.\nمثال: */بنترست سيارات نيون* أو */بنترست طبيعة ساحرة*');
      await react('📌');
      await reply(`⏳ جاري البحث في بنترست وجلب أجمل صورة لـ *"${q}"*...`);

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q + ', aesthetic pinterest wallpaper photography, ultra detailed, 4k')}?width=800&height=1000&nologo=true&seed=${seed}`;
        const { buffer } = await getBuffer(imgUrl, 25 * 1024 * 1024);

        await send({
          image: buffer,
          caption: `╭━━━〔 📌 *صور بنترست (Pinterest)* 〕━━━╮\n│\n│ 🔍 البحث: *${q}*\n│ 🌟 الجودة: Ultra HD Wallpaper\n│ 👑 البوت: *${config.botName}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        });
        await react('✨');
      } catch (e) {
        reply(`❌ تعذر جلب الصورة: ${e.message}`);
      }
    },
  },

  {
    name: 'كلمات',
    aliases: ['lyrics', 'كلمات_اغنية'],
    desc: 'جلب كلمات أي أغنية عربية أو أجنبية كاملة ومكتوبة',
    async run({ text, reply, react }) {
      if (!text) return reply('💡 اكتب اسم الأغنية أو جزء منها.\nمثال: */كلمات تملي معاك عمرو دياب*');
      await react('🎵');
      const prompt = `اكتب الكلمات الكاملة والموثقة لهذه الأغنية: "${text}".\nاذكر اسم المطرب واسم الأغنية في البداية، ثم اكتب الكلمات منسقة في فقرات شعرية مرتبة دون أي تعليقات جانبية زائدة.`;
      const res = await ask('أنت خبير أرشيف موسيقي وكلمات الأغاني العربية والعالمية.', prompt);
      reply(`╭━━━〔 🎵 *كلمات الأغنية* 〕━━━╮\n\n${res}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'فيلم',
    aliases: ['اقتراح_فيلم', 'افلام', 'movie'],
    desc: 'ترشيح فيلم سينمائي أسطوري مع القصة والتقييم والبوستر',
    async run({ text, reply, send, react }) {
      const genre = text || 'غموض وتشويق عالي';
      await react('🎬');
      const prompt = `اقترح فيلماً سينمائياً عالمياً يستحق المشاهدة 10/10 في تصنيف: "${genre}".\nوضح:\n1. اسم الفيلم (بالإنجليزي والعربي) وسنة الإنتاج\n2. التقييم على IMDb\n3. التصنيف (Genre)\n4. ملخص القصة المشوق بدون حرق الأحداث\n5. نصيحة للمشاهدة.`;
      const res = await ask('أنت ناقد سينمائي وموسوعة ترشيحات أفلام عالمية.', prompt);

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const posterUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('cinematic movie poster of ' + genre + ', official studio poster')}?width=700&height=1000&nologo=true&seed=${seed}`;
        const { buffer } = await getBuffer(posterUrl, 20 * 1024 * 1024);
        await send({
          image: buffer,
          caption: `╭━━━〔 🎬 *ترشيح فيلم اليوم* 〕━━━╮\n\n${res}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        });
      } catch {
        reply(`╭━━━〔 🎬 *ترشيح فيلم اليوم* 〕━━━╮\n\n${res}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      }
    },
  },

  {
    name: 'انمي_بحث',
    aliases: ['اقتراح_انمي', 'anime'],
    desc: 'ترشيح مسلسل أنمي ياباني ممتاز مع التصنيف وعدد الحلقات',
    async run({ text, reply, send, react }) {
      const genre = text || 'شخصية ذكية وأكشن نفسي';
      await react('⛩️');
      const prompt = `اقترح أنمي ياباني أسطوري ومكتمل أو مشوق في تصنيف: "${genre}".\nوضح:\n1. اسم الأنمي بالياباني والإنجليزي والعربي\n2. عدد الحلقات والأجزاء\n3. التقييم على MyAnimeList\n4. قصة الأنمي بإيجاز جذاب بدون حرق\n5. لمين الأنمي ده مناسب.`;
      const res = await ask('أنت أوتاكو خبير وموسوعة ترشيحات أنمي يابانية.', prompt);

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const posterUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('anime official wallpaper poster ' + genre + ', makoto shinkai aesthetic')}?width=700&height=1000&nologo=true&seed=${seed}`;
        const { buffer } = await getBuffer(posterUrl, 20 * 1024 * 1024);
        await send({
          image: buffer,
          caption: `╭━━━〔 ⛩️ *ترشيح أنمي أسطوري* 〕━━━╮\n\n${res}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        });
      } catch {
        reply(`╭━━━〔 ⛩️ *ترشيح أنمي أسطوري* 〕━━━╮\n\n${res}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      }
    },
  },
];
