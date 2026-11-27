// ══════════════════════════════════════════════════════════════
// ⚡ MODERN NEXT-GEN TOOLS & AI INNOVATIONS (2026 LUXURY UPDATE)
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';
import { queryCustomAI } from '../../lib/no_ai_engine.js';
import { isUrl, safeSendAudio } from '../../lib/utils.js';
import { getStoredMessage } from '../../lib/message_store.js';

export default [
  // 1. تلخيص الروابط والمقالات والفيديوهات بالذكاء الاصطناعي
  {
    name: 'لخص',
    aliases: ['تلخيص', 'summary', 'summarize'],
    desc: 'تلخيص أي نص طويل أو مقال أو رابط موقع بالذكاء الاصطناعي بنقاط واضحة',
    usage: ['.لخص <النص أو الرابط المطلوب تلخيصه>'],
    async run({ sock, jid, m, text, quotedText, reply, react }) {
      const q = (text || quotedText || '').trim();
      if (!q) return reply('💡 *طريقة الاستخدام:*\nاكتب بعد الأمر النص أو الرابط المراد تلخيصه:\n*.لخص هذا المقال عن الذكاء الاصطناعي...*');

      await react('📑');
      await reply('⏳ *جاري قراءة المحتوى وتلخيصه بذكاء عبر NO & NO AI...*');

      try {
        const prompt = `قم بتلخيص هذا المحتوى بطريقة احترافية باللغة العربية على شكل نقاط رئيسية مبسطة وخلاصة مركزة:\n\n${q}`;
        const aiRes = await queryCustomAI(jid, prompt, '2');
        const summaryText = aiRes.response || 'تعذر استخراج الخلاصة، يرجى التأكد من وضوح النص.';

        return reply(
          `📑 *[خلاصة وتلخيص الذكاء الاصطناعي • NO & NO]* ⚡\n\n` +
          `${summaryText}\n\n` +
          `✨ *تم التلخيص بواسطة محرك NO & NO AI الذكي.*`
        );
      } catch (e) {
        return reply('❌ تعذر إتمام التلخيص: ' + e.message);
      }
    }
  },

  // 2. تحويل العملات والذهب والعملات الرقمية الحية
  {
    name: 'تحويل_عملة',
    aliases: ['صرف', 'عملات', 'سعر_الصرف', 'exchange'],
    desc: 'تحويل أي مبلغ بين العملات العالمية (مثال: .تحويل_عملة 100 USD EGP)',
    usage: ['.تحويل_عملة 100 USD EGP', '.تحويل_عملة 50 EUR SAR'],
    async run({ args, reply, react }) {
      if (args.length < 3) {
        return reply(
          '💡 *طريقة استخدام محول العملات:*\n' +
          '*.تحويل_عملة <المبلغ> <من> <إلى>*\n\n' +
          '📌 *أمثلة:*\n' +
          '• *.تحويل_عملة 100 USD EGP* (دولار إلى جنيه مصري)\n' +
          '• *.تحويل_عملة 100 USD SAR* (دولار إلى ريال سعودي)\n' +
          '• *.تحويل_عملة 50 EUR AED* (يورو إلى درهم إماراتي)'
        );
      }

      const amount = parseFloat(args[0]);
      const from = args[1].toUpperCase();
      const to = args[2].toUpperCase();

      if (isNaN(amount)) return reply('❌ يرجى إدخال مبلغ رقمي صحيح.');

      await react('💱');

      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
          signal: AbortSignal.timeout(6000)
        });

        if (!res.ok) throw new Error('تعذر جلب سعر الصرف للعملة ' + from);

        const data = await res.json();
        const rate = data.rates[to];

        if (!rate) {
          return reply(`❌ رمز العملة "${to}" غير مدعوم أو غير معروف.`);
        }

        const result = (amount * rate).toLocaleString('en-US', { maximumFractionDigits: 3 });

        return reply(
          `💱 *[محول العملات المالي اللحظي • NO & NO]* 💎\n\n` +
          `💵 *المبلغ المطلوب:* ${amount.toLocaleString()} ${from}\n` +
          `📈 *سعر الصرف اللحظي:* 1 ${from} = ${rate} ${to}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *النتيجة النهائية:* *${result} ${to}*\n` +
          `📅 *تاريخ التحديث:* ${data.date || 'اليوم'}`
        );
      } catch (e) {
        return reply('❌ فشل تحويل العملة: ' + e.message);
      }
    }
  },

  // 3. الاستيكر التلقائي للمجموعات (Auto-Sticker)
  {
    name: 'استيكر_تلقائي',
    aliases: ['ستيكر_تلقائي', 'autosticker'],
    desc: 'تفعيل أو تعطيل تحويل الصور والفيديوهات لملصقات فورية تلقائياً في المجموعة بدون أوامر',
    usage: ['.استيكر_تلقائي تفعيل', '.استيكر_تلقائي تعطيل'],
    admin: true,
    group: true,
    async run({ jid, args, reply, react }) {
      const { group } = await import('../../lib/db.js');
      const g = group(jid);
      const action = (args[0] || '').toLowerCase();

      if (action === 'تفعيل' || action === 'on' || action === '1') {
        g.autosticker = true;
        await react('✨');
        return reply('✨ *تم تفعيل ميزة الاستيكر التلقائي في المجموعة بنجاح!*\n🖼️ الآن أي صورة يتم إرسالها في الشات، سيحولها البوت لملصق واتساب فوراً بدون الحاجة لكتابة أوامر.');
      } else if (action === 'تعطيل' || action === 'off' || action === '0') {
        g.autosticker = false;
        await react('🔒');
        return reply('🔒 *تم تعطيل ميزة الاستيكر التلقائي في المجموعة.*');
      } else {
        const status = g.autosticker ? '🟢 مفعل' : '🔴 معطل';
        return reply(`🖼️ *حالة الاستيكر التلقائي حالياً:* *${status}*\n\n💡 *للتحكم:*\n• للتشغيل: *.استيكر_تلقائي تفعيل*\n• للإيقاف: *.استيكر_تلقائي تعطيل*`);
      }
    }
  },

  // 4. تحويل الكلام والنصوص إلى فويس صوتي نقي واقعي (Smart TTS)
  {
    name: 'انطق',
    aliases: ['نطق', 'فويس', 'صوت', 'tts', 'say'],
    desc: 'تحويل أي نص تكتبه إلى مقطع صوتي وفويس نوت طبيعي',
    usage: ['.انطق أهلاً بكم في منظومة NO & NO'],
    async run({ sock, jid, m, text, quotedText, reply, react }) {
      const q = (text || quotedText || '').trim();
      if (!q) return reply('💡 *طريقة الاستخدام:*\nاكتب الكلام المراد تحويله لصوت بعد الأمر:\n*.انطق مساء الخير يا رجالة*');

      await react('🎙️');

      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q.slice(0, 300))}&tl=ar&client=tw-ob`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

        if (!res.ok) throw new Error('فشل جلب الصوت');

        const audioBuf = Buffer.from(await res.arrayBuffer());

        await sock.sendMessage(jid, {
          audio: audioBuf,
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: m });

        await react('✨');
      } catch (e) {
        return reply('❌ تعذر توليد الصوت: ' + e.message);
      }
    }
  },

  // 5. كاشف الرسائل المحذوفة في الشات
  {
    name: 'كاشف_الحذف',
    aliases: ['المحذوف', 'مسترجع_المحذوف', 'antidelete_check'],
    desc: 'معاينة واسترجاع الرسالة المحذوفة الأخيرة في الشات بالرد عليها',
    usage: ['رد على رسالة ملغية أو محذوفة واكتب: .كاشف_الحذف'],
    async run({ quoted, reply, react }) {
      if (!quoted || !quoted.id) {
        return reply('💡 قم بالرد على إشعار الرسالة المحذوفة لمعرفة محتواها ومن قام بحذفها.');
      }

      await react('🕵️');
      const stored = getStoredMessage(quoted.id);

      if (!stored) {
        return reply('ℹ️ عذراً، هذه الرسالة تم حذفها قبل أن يتمكن السيرفر من أرشفتها في الذاكرة المؤقتة.');
      }

      return reply(
        `🕵️ *[كاشف الرسائل المحذوفة • NO & NO]* 🔍\n\n` +
        `👤 *مرسل الرسالة الأصلي:* @${stored.participant ? stored.participant.split('@')[0] : 'غير معروف'}\n` +
        `📝 *المحتوى المسترجع:* \n"${stored.text || '[ملف وسائط/صورة/صوت]'}"\n` +
        `⏰ *وقت الإرسال:* ${new Date(stored.timestamp).toLocaleTimeString('ar-EG')}`,
        stored.participant ? [stored.participant] : []
      );
    }
  }
];
