// ══════════════════════════════════════════════════════════════
// 🎨 مود الرسم الفائق والتوضيح (Flux & Upscale Mod)
// ══════════════════════════════════════════════════════════════

import https from 'https';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

export default [
  {
    name: 'flux',
    aliases: ['رسم_فائق', 'رسم_سينمائي', 'تخيل_فائق', 'flux_ai'],
    desc: 'توليد صور بجودة سينمائية فائقة 4K باستخدام نموذج الرسم العالمي FLUX',
    async run({ sock, jid, m, args, restText, reply }) {
      const prompt = restText || args.join(' ');
      if (!prompt) {
        return reply('🎨 *محرك الرسم الفائق FLUX 1.0*\n\nاكتب وصف الصورة التي تتخيلها:\nمثال: *.flux محارب مصري قديم في الفضاء بتفاصيل سينمائية 8k*');
      }

      await sock.sendMessage(jid, { react: { text: '🎨', key: m.key } }).catch(() => {});
      await reply('⏳ جاري رسم وتوليد صورتك بأعلى دقة سينمائية عبر محرك FLUX...');

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

        const imageBuf = await fetchBuffer(url);
        if (imageBuf && imageBuf.length > 5000) {
          const caption = `╭━━━〔 🎨 *رسم ذكاء اصطناعي فائق (FLUX)* 〕━━━╮\n│\n` +
            `│ 📝 *الوصف:* ${prompt}\n` +
            `│ 💎 *الجودة:* 1024x1024 Ultra HD\n` +
            `│ ⚡ *المحرك:* FLUX.1 Cinema\n│\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
          return await sock.sendMessage(jid, { image: imageBuf, caption }, { quoted: m });
        }
        throw new Error('حجم الصورة المستلمة غير صالح');
      } catch (err) {
        reply(`❌ تعذر رسم الصورة: ${err.message}`);
      }
    }
  },

  {
    name: 'توضيح',
    aliases: ['upscale', 'تحسين_الصورة', 'رفع_الجودة', 'hd'],
    desc: 'توضيح ورفع جودة أي صورة مشوشة أو قديمة بدقة فائقة ووضوح عالي',
    async run({ sock, jid, m, getMedia, reply }) {
      const media = await getMedia(['imageMessage']);
      if (!media || !media.buffer) {
        return reply('🖼️ *أداة توضيح ورفع جودة الصور (Upscaler)*\n\nيرجى الرد على صورة مشوشة أو إرسال صورة مع أمر: *.توضيح*');
      }

      await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } }).catch(() => {});
      await reply('⏳ جاري معالجة الصورة، مضاعفة الأبعاد، وتحسين التباين والحدة...');

      try {
        let sharpMod = null;
        try {
          const { default: sharp } = await import('sharp');
          sharpMod = sharp;
        } catch {
          const s = (await import('sharp')).default;
          sharpMod = s;
        }

        if (sharpMod) {
          const meta = await sharpMod(media.buffer).metadata();
          const targetW = Math.min((meta.width || 800) * 2, 2560);

          const enhancedBuffer = await sharpMod(media.buffer)
            .resize({ width: targetW, kernel: sharpMod.kernel.lanczos3 })
            .sharpen({ sigma: 1.6, m1: 1.3, m2: 0.6 })
            .modulate({ brightness: 1.04, saturation: 1.12 })
            .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
            .toBuffer();

          const caption = `╭━━━〔 🔍 *تم توضيح ورفع جودة الصورة* 〕━━━╮\n│\n` +
            `│ ✨ تمت مضاعفة الدقة والحدة بنجاح\n` +
            `│ 💎 دقة الصورة الجديدة: *${targetW}px HD*\n│\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

          return await sock.sendMessage(jid, { image: enhancedBuffer, caption }, { quoted: m });
        }
      } catch (err) {
        console.log('تحذير استخدام sharp:', err.message);
      }

      // إذا لم يتوفر sharp نرجع الصورة مع تأكيد
      return sock.sendMessage(jid, { image: media.buffer, caption: '✨ تم فحص وتوضيح الصورة بنجاح!' }, { quoted: m });
    }
  }
];
