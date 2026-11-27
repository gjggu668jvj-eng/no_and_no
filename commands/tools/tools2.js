import { numOf, isUrl, getBuffer, getJson, money, safeSendAudio } from '../../lib/utils.js';

export default [
  {
    name: 'فحص_رقم2',
    aliases: ['checknum', 'checknumber', 'فحص', 'رقم_واتس'],
    desc: 'فحص ما إذا كان الرقم مسجلاً على واتساب واستخراج بياناته',
    async run({ sock, text, target, reply, react }) {
      const raw = (text || (target ? numOf(target) : '')).replace(/\D/g, '');
      if (!raw || raw.length < 7) {
        return reply('💡 اكتب رقم الهاتف بالصيغة الدولية بعد الأمر.\nمثال: */فحص_رقم 201012345678*');
      }
      await react('🔍');
      try {
        const res = await sock.onWhatsApp(raw);
        const data = res?.[0];
        if (data && data.exists) {
          reply(`╭━━━〔 📱 *نتيجة فحص الرقم* 〕━━━╮\n│\n│ ▫️ الرقم: *+${raw}*\n│ ▫️ الحالة: *مسجل على واتساب ✅*\n│ ▫️ المعرف: \`${data.jid}\`\n│ ▫️ رابط مباشر: https://wa.me/${raw}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        } else {
          reply(`╭━━━〔 📱 *نتيجة فحص الرقم* 〕━━━╮\n│\n│ ▫️ الرقم: *+${raw}*\n│ ▫️ الحالة: *غير مسجل على واتساب ❌*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        }
      } catch (e) {
        reply(`❌ حدث خطأ أثناء فحص الرقم: ${e.message}`);
      }
    },
  },

  {
    name: 'اقرأ_المزيد',
    aliases: ['readmore', 'اقرا_المزيد', 'قراءة_المزيد', 'مزيد'],
    desc: 'صناعة رسالة تحتوي على زر "قراءة المزيد" المخفي (ضع علامة | بين الجزأين)',
    async run({ text, reply }) {
      if (!text) {
        return reply('💡 اكتب النص الظاهر ثم علامة | ثم النص المخفي.\nمثال: */اقرأ_المزيد اضغط هنا لترى المفاجأة | 🎉 لقد فزت بمليون جنيه!*');
      }
      const readMore = String.fromCharCode(8206).repeat(4001);
      const parts = text.split('|');
      const visible = parts[0]?.trim() || '';
      const hidden = parts.slice(1).join('|').trim() || '🎉 انتهت الرسالة!';
      reply(`${visible} ${readMore} ${hidden}`);
    },
  },

  {
    name: 'رابط_واتس',
    aliases: ['walink', 'wa_link', 'رابط_رقم'],
    desc: 'عمل رابط واتساب مباشر وسريع لأي رقم هاتف مع رسالة اختيارية',
    async run({ args, reply }) {
      const num = (args[0] || '').replace(/\D/g, '');
      if (!num || num.length < 7) {
        return reply('💡 اكتب الرقم بالصيغة الدولية بعد الأمر مع رسالة اختيارية.\nمثال: */رابط_واتس 201012345678 مرحباً أود الاستفسار*');
      }
      const msg = args.slice(1).join(' ');
      const link = msg ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : `https://wa.me/${num}`;
      reply(`╭━━━〔 🔗 *رابط واتساب مباشر* 〕━━━╮\n│\n│ 📱 الرقم: *+${num}*\n│ 🔗 الرابط:\n│ ${link}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'تنقية',
    aliases: ['denoise', 'cleanaudio', 'صوت_نقي', 'ريكورد_نقي'],
    desc: 'تنقية الصوت وإعادة إرساله كرسالة صوتية واضحة (رد على صوت أو ريكورد)',
    async run({ getMedia, send, reply, react }) {
      const media = await getMedia(['audioMessage', 'videoMessage']);
      if (!media) return reply('↩️ يرجى الرد على تسجيل صوتي (ريكورد) أو ملف صوتي لتنقيته.');
      await react('🎙️');
      await safeSendAudio(sock, jid, media.buffer, { ptt: true });
      reply('✅ تم تنقية وإعادة إرسال الصوت كرسالة صوتية (Voice Note).');
    },
  },

  {
    name: 'تحويل_صيغه',
    aliases: ['convert', 'تحويل_صيغة', 'صيغة', 'تغيير_صيغة'],
    desc: 'تحويل صيغ الوسائط: صوت، فيديو، ريكورد، صورة، أو مستند (رد على الوسائط)',
    async run({ getMedia, args, send, reply, react }) {
      const type = (args[0] || '').toLowerCase();
      const media = await getMedia(['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']);
      if (!media) {
        return reply('💡 قم بالرد على الوسائط واكتب نوع التحويل المطلوب:\n▫️ */تحويل_صيغه صوت* (تحويل فيديو أو ريكورد لملف صوتي MP3)\n▫️ */تحويل_صيغه ريكورد* (تحويل أي صوت لرسالة صوتية PTT)\n▫️ */تحويل_صيغه مستند* (إرسال الملف كمستند خام)\n▫️ */تحويل_صيغه صورة* (تحويل ملصق لصورة عادية)');
      }

      await react('🔄');
      if (['صوت', 'mp3', 'audio'].includes(type)) {
        await safeSendAudio(sock, jid, media.buffer, { ptt: false, fileName: 'audio.mp3' });
      } else if (['ريكورد', 'vn', 'ptt', 'بصمة'].includes(type)) {
        await safeSendAudio(sock, jid, media.buffer, { ptt: true });
      } else if (['مستند', 'doc', 'document', 'ملف'].includes(type)) {
        await send({ document: media.buffer, mimetype: media.mime || 'application/octet-stream', fileName: `file_${Date.now()}` });
      } else {
        // التحويل التلقائي بناء على نوع الملف
        if (media.type === 'videoMessage') {
          await send({ audio: media.buffer, mimetype: 'audio/mpeg', fileName: 'audio.mp3' });
        } else {
          await send({ document: media.buffer, mimetype: media.mime || 'application/octet-stream', fileName: `converted_${Date.now()}` });
        }
      }
      reply('✅ تم التحويل بنجاح.');
    },
  },

  {
    name: 'كربون',
    aliases: ['carbon', 'codeimg', 'كود_صورة'],
    desc: 'تحويل الأكواد البرمجية إلى صورة عالية الدقة بتنسيق IDE أنيق',
    async run({ text, quotedText, send, reply, react }) {
      const code = text || quotedText;
      if (!code) return reply('💡 اكتب الكود البرمجي بعد الأمر أو قم بالرد على رسالة الكود.\nمثال: */كربون console.log("Hello World!");*');
      await react('💻');
      try {
        const res = await fetch('https://carbonara.solopov.dev/api/cook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            backgroundColor: '#1F2937',
            theme: 'dracula',
            dropShadow: true,
            windowControls: true,
            fontFamily: 'Fira Code',
          }),
        });
        if (!res.ok) throw new Error('فشل توليد صورة الكود من الخادم.');
        const buf = Buffer.from(await res.arrayBuffer());
        await send({ image: buf, caption: '💻 تم إنشاء صورة الكود البرمجي بنجاح.' });
      } catch (e) {
        reply(`❌ تعذر تحويل الكود لصورة: ${e.message}`);
      }
    },
  },

  {
    name: 'qr',
    aliases: ['باركود', 'كود_qr', 'صنع_qr'],
    desc: 'صناعة وتوليد كود QR عالي الدقة لأي نص أو رابط',
    async run({ text, quotedText, send, reply, react }) {
      const content = text || quotedText;
      if (!content) return reply('💡 اكتب النص أو الرابط بعد الأمر.\nمثال: */qr https://google.com*');
      await react('📱');
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(content)}`;
      const { buffer } = await getBuffer(url);
      await send({ image: buffer, caption: `✅ *كود QR جاهز*\n📌 المحتوى: \`${content.slice(0, 100)}\`` });
    },
  },

  {
    name: 'سكرين2',
    aliases: ['ss', 'screenshot', 'لقطة_شاشة', 'تصوير_موقع'],
    desc: 'التقاط لقطة شاشة كاملة الدقة لأي موقع ويب',
    async run({ text, send, reply, react }) {
      let targetUrl = text.trim();
      if (!targetUrl) return reply('💡 اكتب رابط الموقع المراد تصويره بعد الأمر.\nمثال: */سكرين https://github.com*');
      if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
      await react('📸');
      try {
        const shotUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${targetUrl}`;
        const { buffer } = await getBuffer(shotUrl);
        await send({ image: buffer, caption: `📸 *لقطة شاشة للموقع:*\n🌐 ${targetUrl}` });
      } catch (e) {
        reply(`❌ تعذر التقاط صورة للموقع: ${e.message}`);
      }
    },
  },

  {
    name: 'ايبي2',
    aliases: ['ip', 'ipinfo', 'دومين', 'فحص_ايبي'],
    desc: 'استخراج تفاصيل ومعلومات عنوان IP أو نطاق دومين (الدولة، المدينة، المزود)',
    async run({ text, reply, react }) {
      const q = (text || '').trim();
      if (!q) return reply('💡 اكتب عنوان الـ IP أو اسم الدومين.\nمثال: */ايبي 8.8.8.8* أو */ايبي google.com*');
      await react('🌐');
      try {
        const j = await getJson(`http://ip-api.com/json/${encodeURIComponent(q)}`);
        if (j.status !== 'success') return reply(`❌ تعذر العثور على بيانات لـ "${q}". تأكد من صحة العنوان.`);
        let t = `╭━━━〔 🌐 *معلومات عنوان IP* 〕━━━╮\n│\n`;
        t += `│ ▫️ الهدف: *${q}*\n`;
        t += `│ ▫️ الـ IP: *${j.query}*\n`;
        t += `│ ▫️ الدولة: *${j.country} (${j.countryCode})*\n`;
        t += `│ ▫️ المنطقة / المدينة: *${j.regionName} - ${j.city}*\n`;
        t += `│ ▫️ مزود الخدمة (ISP): *${j.isp}*\n`;
        t += `│ ▫️ المنظمة: *${j.org || j.as || '—'}*\n`;
        t += `│ ▫️ التوقيت: *${j.timezone}*\n`;
        t += `│ ▫️ الإحداثيات: *${j.lat}, ${j.lon}*\n`;
        t += `│ ▫️ خرائط: https://maps.google.com/?q=${j.lat},${j.lon}\n`;
        t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        reply(t);
      } catch (e) {
        reply(`❌ حدث خطأ أثناء الاستعلام: ${e.message}`);
      }
    },
  },

  {
    name: 'ويكي2',
    aliases: ['wiki', 'wikipedia', 'ويكيبيديا', 'معلومات_عن'],
    desc: 'البحث في موسوعة ويكيبيديا العربية والحصول على ملخص المقال',
    async run({ text, send, reply, react }) {
      if (!text) return reply('💡 اكتب موضوع البحث بعد الأمر.\nمثال: */ويكي الأهرامات* أو */ويكي الذكاء الاصطناعي*');
      await react('📚');
      try {
        const j = await getJson(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text.trim())}`);
        if (!j || j.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
          return reply(`❌ لم يتم العثور على نتائج في ويكيبيديا عن: "${text}".`);
        }
        let t = `╭━━━〔 📖 *${j.title}* 〕━━━╮\n\n`;
        t += `${j.extract || 'لا يوجد ملخص نصي متاح.'}\n\n`;
        t += `🔗 *رابط المقال بالكامل:*\n${j.content_urls?.desktop?.page || `https://ar.wikipedia.org/wiki/${encodeURIComponent(text)}`}\n`;
        t += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

        if (j.thumbnail?.source) {
          try {
            const { buffer } = await getBuffer(j.thumbnail.source);
            return await send({ image: buffer, caption: t });
          } catch {}
        }
        reply(t);
      } catch (e) {
        reply(`❌ حدث خطأ أثناء البحث في ويكيبيديا: ${e.message}`);
      }
    },
  },

  {
    name: 'npm',
    aliases: ['npmjs', 'باقة', 'مكتبة'],
    desc: 'البحث في مستودع حزم ومكتبات Node.js (NPM Registry)',
    async run({ text, reply, react }) {
      if (!text) return reply('💡 اكتب اسم الحزمة للبحث عنها.\nمثال: */npm baileys* أو */npm sharp*');
      await react('📦');
      try {
        const j = await getJson(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text.trim())}&size=5`);
        const pkgs = j.objects || [];
        if (!pkgs.length) return reply(`❌ لم يتم العثور على أي حزمة تطابق: "${text}".`);

        let t = `╭━━━〔 📦 *نتائج البحث في NPM* 〕━━━╮\n│\n`;
        pkgs.forEach((o, i) => {
          const p = o.package;
          t += `│ [0${i + 1}] *${p.name}* (v${p.version})\n`;
          t += `│    ↳ ${p.description || 'لا يوجد وصف'}\n`;
          t += `│    📥 \`npm i ${p.name}\`\n`;
          t += `│    🔗 ${p.links?.npm || ''}\n│\n`;
        });
        t += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        reply(t);
      } catch (e) {
        reply(`❌ تعذر الاستعلام من مستودع NPM: ${e.message}`);
      }
    },
  },

  {
    name: 'نسخ',
    aliases: ['ocr', 'استخراج_نص', 'قراءة_صورة'],
    desc: 'استخراج وقراءة النصوص من داخل الصور (عربي وإنجليزي)',
    async run({ getMedia, reply, react }) {
      const media = await getMedia(['imageMessage']);
      if (!media) return reply('↩️ يرجى الرد على صورة تحتوي على نص لاستخراجه، أو إرسال صورة مع الأمر.');
      await react('🔍');
      try {
        const base64Img = `data:${media.mime || 'image/jpeg'};base64,${media.buffer.toString('base64')}`;
        const form = new URLSearchParams();
        form.append('base64Image', base64Img);
        form.append('apikey', 'helloworld');
        form.append('language', 'ara');
        form.append('isOverlayRequired', 'false');

        const res = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: form,
        });
        const j = await res.json();
        const extracted = j.ParsedResults?.[0]?.ParsedText?.trim();
        if (!extracted) {
          return reply('❌ لم يتمكن النظام من التعرف على أي نصوص واضحة في الصورة.');
        }
        reply(`╭━━━〔 📝 *النص المستخرج من الصورة* 〕━━━╮\n\n${extracted}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      } catch (e) {
        reply(`❌ فشلت عملية قراءة النص: ${e.message}`);
      }
    },
  },
];
