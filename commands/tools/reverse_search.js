// ══════════════════════════════════════════════════════════════
// 🕵️ محقق الصور والبحث العكسي العميق (Reverse Image Search)
// ══════════════════════════════════════════════════════════════

import https from 'https';

async function uploadToCatbox(buffer) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="search.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'User-Agent': 'Mozilla/5.0'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200 && data.startsWith('http')) resolve(data.trim());
        else reject(new Error(data || 'فشل رفع الصورة للبحث'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export default [
  {
    name: 'بحث_عكسي',
    aliases: ['كشف_الصورة', 'من_هذا', 'reverse_image', 'بحث_بالصورة', 'source_image'],
    desc: 'البحث العكسي عن أي شخص، مكان، أو منتج في محركات البحث العالمية (Google Lens & Yandex)',
    async run({ sock, jid, m, getMedia, reply }) {
      const media = await getMedia(['imageMessage']);
      if (!media || !media.buffer) {
        return reply('🕵️ *محقق الصور والبحث العكسي*\n\nيرجى الرد على أي صورة أو إرسال صورة مع أمر: *.بحث_عكسي*');
      }

      await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } }).catch(() => {});
      await reply('⏳ جاري رفع الصورة وفحص البصمة الرقمية ومطابقتها في قواعد بيانات البحث العميقة...');

      try {
        const imgUrl = await uploadToCatbox(media.buffer);

        const googleLens = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`;
        const yandexSearch = `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imgUrl)}`;
        const bingSearch = `https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(imgUrl)}&view=detailv2`;
        const tineyeSearch = `https://tineye.com/search?url=${encodeURIComponent(imgUrl)}`;

        const report = `╭━━━〔 🕵️ *نتائج فحص وبحث الصورة العكسي* 〕━━━╮\n│\n` +
          `│ 🌐 *رابط الصورة المحفوظ:* ${imgUrl}\n│\n` +
          `│ 🔎 *روابط البحث المباشرة (اضغط لفتح المطابقات):*\n` +
          `│ 1️⃣ *Yandex Face Detective (أقوى كاشف وجوه وحسابات):*\n` +
          `│    🔗 ${yandexSearch}\n│\n` +
          `│ 2️⃣ *Google Lens (كشف الأماكن والمنتجات والأشياء):*\n` +
          `│    🔗 ${googleLens}\n│\n` +
          `│ 3️⃣ *Bing Visual Search (محرك مايكروسوفت البصري):*\n` +
          `│    🔗 ${bingSearch}\n│\n` +
          `│ 4️⃣ *TinEye (تاريخ أول ظهور للصورة على الويب):*\n` +
          `│    🔗 ${tineyeSearch}\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(report);
      } catch (err) {
        reply(`❌ فشل البحث العكسي: ${err.message}`);
      }
    }
  }
];
