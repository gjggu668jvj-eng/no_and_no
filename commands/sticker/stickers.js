import sharp from 'sharp';
import config from '../../config.js';
import { getBuffer, isUrl } from '../../lib/utils.js';

const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

function addExif(webpBuf, pack = config.botName, author = config.developer) {
  try {
    const json = JSON.stringify({
      'sticker-pack-id': 'com.noandno.bot.' + Date.now(),
      'sticker-pack-name': pack,
      'sticker-pack-publisher': author,
      'emojis': ['🤖', '✨'],
    });
    const jsonBuf = Buffer.from(json, 'utf8');
    const exif = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    exif.writeUInt32LE(jsonBuf.length, 14);
    const exifPayload = Buffer.concat([exif, jsonBuf]);
    const exifLen = exifPayload.length;
    const exifChunkHeader = Buffer.from([0x45, 0x58, 0x49, 0x46, 0x00, 0x00, 0x00, 0x00]);
    exifChunkHeader.writeUInt32LE(exifLen, 4);
    const paddedPayload = exifLen % 2 !== 0 ? Buffer.concat([exifPayload, Buffer.alloc(1)]) : exifPayload;
    const chunk = Buffer.concat([exifChunkHeader, paddedPayload]);

    if (webpBuf.length > 12 && webpBuf.toString('ascii', 0, 4) === 'RIFF' && webpBuf.toString('ascii', 8, 12) === 'WEBP') {
      if (webpBuf.indexOf('EXIF') !== -1) return webpBuf;
      const riffSize = webpBuf.readUInt32LE(4) + chunk.length;
      const newHeader = Buffer.alloc(8);
      newHeader.write('RIFF', 0);
      newHeader.writeUInt32LE(riffSize, 4);
      return Buffer.concat([newHeader, webpBuf.subarray(8), chunk]);
    }
  } catch (e) {
    console.error('exif injection error:', e);
  }
  return webpBuf;
}

const toSticker = async (buf) => {
  const webp = await sharp(buf).resize(512, 512, { fit: 'contain', background: CLEAR }).webp().toBuffer();
  return addExif(webp);
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function image(getMedia, reply, types = ['imageMessage', 'stickerMessage']) {
  const media = await getMedia(types);
  if (!media) {
    reply('↩️ يرجى الرد على صورة/ملصق أو إرسال صورة مع كتابة الأمر.');
    return null;
  }
  return media.buffer;
}

export default [
  { name: 'ملصق_احترافي', aliases: ['sticker', 's', 'استيكر'], desc: 'تحويل أي صورة لملصق (حقوق مخصصة: /ملصق البكج | المطور)',
    async run({ text, getMedia, send, reply, react }) {
      const b = await image(getMedia, reply);
      if (!b) return;
      await react('🎨');
      let pack = config.botName, author = config.developer;
      if (text && text.includes('|')) {
        const parts = text.split('|').map(s => s.trim());
        if (parts[0]) pack = parts[0];
        if (parts[1]) author = parts[1];
      }
      const webp = await sharp(b).resize(512, 512, { fit: 'contain', background: CLEAR }).webp().toBuffer();
      await send({ sticker: addExif(webp, pack, author) });
    } },

  { name: 'لصورة', aliases: ['toimg'], desc: 'تحويل ملصق إلى صورة عادية (ارد على ملصق)',
    async run({ getMedia, send, reply, react }) {
      const media = await getMedia(['stickerMessage']);
      if (!media) return reply('↩️ قم بالرد على ملصق لتحويله إلى صورة عادية.');
      await react('🖼️');
      const imgBuf = await sharp(media.buffer).png().toBuffer();
      await send({ image: imgBuf, caption: '✅ تم استخراج الصورة بجودة عالية.' });
    } },

  { name: 'ملصق_نص', aliases: ['ttp', 'attp'], desc: 'تحويل نص مكتوب لملصق احترافي',
    async run({ text, send, reply, react }) {
      if (!text) return reply('اكتب النص بعد الأمر.\nمثال: */ملصق_نص صباح الخير يا غالي*');
      await react('✍️');
      const words = text.split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > 14) {
          lines.push(cur);
          cur = w;
        } else {
          cur = (cur + ' ' + w).trim();
        }
      }
      if (cur) lines.push(cur);

      const L = lines.slice(0, 6);
      const size = Math.min(100, Math.floor(440 / L.length));
      const top = 256 - ((L.length - 1) * size) / 2;
      const tspans = L.map((l, i) =>
        `<text x="256" y="${top + i * size}" font-size="${size * 0.8}" text-anchor="middle" dominant-baseline="middle" font-family="Tahoma, Arial, sans-serif" font-weight="bold" fill="#ffffff" stroke="#111111" stroke-width="${size / 12}" paint-order="stroke fill">${esc(l)}</text>`
      ).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${tspans}</svg>`;
      const webp = await sharp(Buffer.from(svg)).webp().toBuffer();
      await send({ sticker: addExif(webp) });
    } },

  { name: 'ملصق_دائري', aliases: ['round'], desc: 'صناعة ملصق دائري مقصوص باحترافية من صورة',
    async run({ getMedia, send, reply, react }) {
      const b = await image(getMedia, reply);
      if (!b) return;
      await react('⭕');
      const img = await sharp(b).resize(512, 512, { fit: 'cover' }).toBuffer();
      const mask = Buffer.from('<svg width="512" height="512"><circle cx="256" cy="256" r="256"/></svg>');
      const webp = await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).webp().toBuffer();
      await send({ sticker: addExif(webp) });
    } },

  { name: 'ملصق_رابط', aliases: ['urlsticker'], desc: 'تحويل صورة من رابط مباشر لملصق',
    async run({ text, send, reply, react }) {
      if (!isUrl(text)) return reply('اكتب رابط صورة مباشر صالح.\nمثال: */ملصق_رابط https://site.com/image.jpg*');
      await react('⏳');
      const { buffer } = await getBuffer(text);
      await send({ sticker: await toSticker(buffer) });
    } },

  { name: 'ابيض_واسود', aliases: ['gray', 'bw'], desc: 'تحويل الصورة إلى الأبيض والأسود الكلاسيكي',
    async run({ getMedia, send, reply, react }) {
      const b = await image(getMedia, reply, ['imageMessage']);
      if (!b) return;
      await react('⚫');
      const res = await sharp(b).grayscale().jpeg().toBuffer();
      await send({ image: res, caption: '⚫⚪ تم تحويل الصورة للأبيض والأسود.' });
    } },

  { name: 'تغبيش', aliases: ['blur'], desc: 'تطبيق تأثير التغبيش/الضبابية على الصورة (قوة 1-30)',
    async run({ getMedia, args, send, reply, react }) {
      const b = await image(getMedia, reply, ['imageMessage']);
      if (!b) return;
      await react('🌫️');
      const s = Math.min(30, Math.max(1, parseInt(args[0]) || 8));
      const res = await sharp(b).blur(s).jpeg().toBuffer();
      await send({ image: res, caption: `🌫️ تم تطبيق تغبيش بقوة (${s}).` });
    } },

  { name: 'قلب', aliases: ['mirror'], desc: 'عكس/قلب الصورة أفقياً كمرآة',
    async run({ getMedia, send, reply, react }) {
      const b = await image(getMedia, reply, ['imageMessage']);
      if (!b) return;
      await react('🪞');
      const res = await sharp(b).flop().jpeg().toBuffer();
      await send({ image: res, caption: '🪞 تم قلب الصورة أفقياً.' });
    } },
];
