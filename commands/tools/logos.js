import config from '../../config.js';
import { getBuffer } from '../../lib/utils.js';

const STYLES = {
  'لوجو': t => `Professional minimalist luxury modern brand vector logo badge with text "${t}", clean design, 8k render, centered`,
  'جليتش': t => `Cyberpunk futuristic 3D glitch text typography saying "${t}", VHS noise, neon chromatic aberration, 8k render`,
  'زجاج': t => `Glossy frosted glass 3D typography text saying "${t}", transparent glass, caustics refraction, studio lighting`,
  'توهج': t => `Ultra bright glowing radiant luminous light typography text saying "${t}", dark background, 8k octane render`,
  'تايبوجرافي': t => `Artistic creative modern 3D bold typography poster art saying "${t}", geometric shapes, studio lighting`,
  'بيكسل': t => `Retro 8-bit arcade pixel art style text logo saying "${t}", video game arcade screen aesthetic`,
  'نيون_جليتش': t => `Cyberpunk neon glitch aesthetic illuminated signage saying "${t}", dark rainy street background`,
  'علم': t => `Waving national silk flag with bold golden typography embossed saying "${t}", realistic cloth folds`,
  'علم_امريكا': t => `American flag themed typography text saying "${t}", patriotic stars and stripes style, 3D render`,
  'ممحاة': t => `Pencil sketch on paper with eraser peeling text art saying "${t}", realistic drawing on desk`,
  'بلاك_بينك': t => `K-pop Blackpink style aesthetic typography saying "${t}", bold black and pastel pink glowing neon`,
  'متوهج': t => `Brilliant glowing magical energy core text typography saying "${t}", particle effects, fantasy lighting`,
  'تحت_الماء': t => `Realistic underwater typography text saying "${t}", bubbles, sunlight rays through ocean water`,
  'دب': t => `Cute 3D fluffy teddy bear holding a wooden carved sign with text "${t}", soft studio lighting`,
  'جرافيتي': t => `Vibrant street urban graffiti wall mural spray paint text saying "${t}", hip hop style, brick wall`,
  'ورق': t => `Origami paper craft cut layered 3D typography text saying "${t}", realistic paper shadows and textures`,
  'ألوان_مائية': t => `Soft artistic watercolor splash painting calligraphy typography text saying "${t}", paper texture`,
  'سحاب': t => `Fluffy realistic white cumulus clouds in bright blue sky forming 3D text saying "${t}"`,
  'لوجو_بلاك_بينك': t => `Luxury K-pop Blackpink inspired official brand logo emblem saying "${t}", pink neon on black marble`,
  'تدرج': t => `Vibrant glossy modern gradient color 3D typography text saying "${t}", abstract fluid shapes`,
  'شاطئ': t => `Tropical sandy beach shore with clear turquoise ocean waves writing text "${t}" in sand and seafoam`,
  'ذهبي': t => `Ultra luxury 3D shiny polished gold metallic embossed typography text saying "${t}", black velvet background`,
  'نيون_ملون': t => `Multicolor vibrant glowing neon tubes sign typography saying "${t}", dark night club wall`,
  'رمل': t => `Realistic text "${t}" deeply carved into warm desert sand dunes, sun casting deep shadows, 4k texture`,
  'مجرة': t => `Cosmic outer space galaxy nebula stars typography text saying "${t}", deep violet and cyan stardust`,
  '1917': t => `Vintage WW1 1917 era sepia toned military stamp letterpress typography text saying "${t}", aged paper`,
  'نيون_مجرة': t => `Futuristic neon cosmic galaxy glowing typography text saying "${t}", starlight and glowing particles`,
  'ملكي': t => `Majestic royal king crown imperial crest luxury gold and ruby typography text saying "${t}"`,
  'هولوجرام': t => `Futuristic sci-fi 3D digital glowing blue laser hologram wireframe text saying "${t}", HUD display`,
  'فلكي': t => `Astronomical constellation star map zodiac typography text saying "${t}", dark night sky observatory`,
  'امونج': t => `Among Us astronaut game character standing next to 3D colorful text saying "${t}", spaceship aesthetic`,
  'مطر': t => `Rainy window glass with raindrops reflecting city night lights, text "${t}" written with finger on foggy glass`,
  'ضوئي': t => `Long exposure light painting trail photography typography text saying "${t}", cinematic night streak`,
};

const createCommand = (styleName, promptBuilder) => ({
  name: styleName,
  aliases: [`تصميم_${styleName}`, `logo_${styleName}`],
  desc: `تصميم لوجو بالذكاء الاصطناعي بنمط [ ${styleName} ]: /${styleName} الاسم`,
  async run({ text, quotedText, send, reply, react }) {
    const q = text || quotedText;
    if (!q) {
      return reply(`💡 اكتب الاسم أو الكلمة المراد تصميمها بعد الأمر.\nمثال: */${styleName} ${config.botName}*`);
    }

    await react('🎨');
    await reply(`⏳ جاري تصميم وتوليد الشعار بنمط *[ ${styleName} ]*، انتظر لحظات...`);

    try {
      const prompt = promptBuilder(q);
      const seed = Math.floor(Math.random() * 1000000);
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=600&nologo=true&seed=${seed}`;
      const { buffer } = await getBuffer(imgUrl, 25 * 1024 * 1024);

      await send({
        image: buffer,
        caption: `╭━━━〔 🎨 *تصميم شعار ${styleName}* 〕━━━╮\n│\n│ 🏷️ النص: *${q}*\n│ ✨ النمط: *${styleName}*\n│ ⚡ المحرك: HD AI Generator\n│ 👑 البوت: *${config.botName}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
      });
      await react('✨');
    } catch (e) {
      reply(`❌ تعذر توليد التصميم حالياً: ${e.message}`);
    }
  },
});

export default Object.entries(STYLES).map(([name, builder]) => createCommand(name, builder));
