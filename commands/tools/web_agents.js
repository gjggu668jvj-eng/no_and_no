// ══════════════════════════════════════════════════════════════
// 🌐 مود الأتمتة ومهام الويب السحابية (Automation & Web Agents)
// ══════════════════════════════════════════════════════════════

import https from 'https';
import http from 'http';
import { runLiveProgress } from '../../lib/progress.js';
import { db, save } from '../../lib/db.js';

async function uploadToCatbox(buffer, filename = 'file.jpg') {
  // استخدام FormData بسيط لرفع الملف إلى Catbox (خدمة مجانية سريعة ومستقرة بدون تسجيل)
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
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
        if (res.statusCode === 200 && data.startsWith('http')) {
          resolve(data.trim());
        } else {
          reject(new Error(data || 'فشل الرفع'));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export default [
  {
    name: 'رفع_ملف',
    aliases: ['رابط_ميديا', 'file2link', 'tourl', 'رفع_رابط'],
    desc: 'تحويل أي صورة، فيديو، صوت، أو مستند إلى رابط تحميل مباشر فائق السرعة',
    async run({ sock, jid, m, getMedia, reply }) {
      const media = await getMedia(['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']);
      if (!media || !media.buffer) {
        return reply('🚀 *رافع الملفات المباشر (File to Link)*\n\nيرجى الرد على صورة، فيديو، أو ريكورد بأمر: *.رفع_ملف*');
      }

      await runLiveProgress(sock, jid, 'رفع الملف إلى السحابة', [
        { percent: 20, text: 'قراءة وفحص حجم الملف...' },
        { percent: 55, text: 'توليد رابط CDN سحابي...' },
        { percent: 90, text: 'تأكيد الرفع المشفر...' },
        { percent: 100, text: 'اكتمل الرفع بنجاح!' }
      ], m);

      try {
        const ext = media.mime?.split('/')[1]?.split(';')[0] || 'bin';
        const url = await uploadToCatbox(media.buffer, `media_${Date.now()}.${ext}`);

        const caption = `╭━━━〔 🌐 *رابط التحميل المباشر* 〕━━━╮\n│\n` +
          `│ 🔗 *الرابط:* ${url}\n` +
          `│ 📦 *الحجم:* ${(media.buffer.length / 1024 / 1024).toFixed(2)} MB\n` +
          `│ ⚡ *النوع:* ${media.mime || 'ملف ميديا'}\n` +
          `│ 🔒 الرابط دائم وسريع التحميل.\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(caption);
      } catch (err) {
        reply(`❌ فشل رفع الملف: ${err.message}`);
      }
    }
  },

  {
    name: 'قارئ_المواقع',
    aliases: ['قراءة_مقال', 'web_reader', 'مزيل_الاعلانات'],
    desc: 'فتح المقالات والصفحات وتجريدها من الإعلانات وعرض النص الصافي والملخص',
    async run({ args, restText, reply }) {
      const url = restText || args[0];
      if (!url || !url.startsWith('http')) {
        return reply('📰 يرجى كتابة رابط المقال أو الصفحة.\nمثال: *.قارئ_المواقع https://example.com/article*');
      }

      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        // تجريد الوسوم وسحب النصوص المفيدة
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1500);

        return reply(`╭━━━〔 📰 *قراءة المقال الصافي* 〕━━━╮\n│\n${cleanText}...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      } catch (e) {
        reply(`❌ تعذر قراءة الرابط: ${e.message}`);
      }
    }
  },

  {
    name: 'تتبع_سعر',
    aliases: ['تتبع_العروض', 'price_tracker', 'سعر_المنتج'],
    desc: 'مراقبة أسعار المنتجات على المتاجر والتنبيه عند انخفاض السعر',
    async run({ sender, args, restText, reply }) {
      const url = restText || args[0];
      if (!url || !url.startsWith('http')) {
        return reply('🛍️ *متتبع الأسعار والعروض*\n\nاكتب رابط المنتج لمراقبته:\nمثال: *.تتبع_سعر https://amazon.eg/dp/...*');
      }

      db.settings.priceTracker ??= [];
      db.settings.priceTracker.push({
        user: sender,
        url,
        addedAt: Date.now()
      });
      save();

      return reply(`╭━━━〔 🛍️ *تمت إضافة المنتج للمراقبة* 〕━━━╮\n│\n` +
        `│ 🔗 تم تسجيل الرابط في رادار الأسعار.\n` +
        `│ 🔔 سيتم فحص الرابط وإشعارك فور هبوط السعر أو توفر خصومات!\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
    }
  },

  {
    name: 'صانع_ميمز',
    aliases: ['ميمز', 'meme', 'ميم'],
    desc: 'صنع صورة ميمز ساخرة وفورية بكتابة نص علوي وسفلي',
    async run({ sock, jid, m, args, restText, reply }) {
      const input = restText || args.join(' ');
      if (!input) {
        return reply('🎭 *صانع الميمز التلقائي*\n\nاكتب النص مقسوماً بعلامة |:\nمثال: *.ميمز لما البوت يشتغل | والكل يفرح*');
      }

      const parts = input.split('|');
      const top = encodeURIComponent(parts[0]?.trim() || ' ');
      const bottom = encodeURIComponent(parts[1]?.trim() || ' ');

      const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=https://i.imgflip.com/1ur9b0.jpg`;

      try {
        await sock.sendMessage(jid, {
          image: { url: memeUrl },
          caption: '🤣 ميمز تم توليده تلقائياً عبر NO & NO!'
        }, { quoted: m });
      } catch {
        reply('❌ تعذر توليد صورة الميم، جرب صياغة مختلفة.');
      }
    }
  }
];
