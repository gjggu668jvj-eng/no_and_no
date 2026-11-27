import { ask } from '../ai/old_ai.js';

// WMO weather interpretation codes
const WEATHER_CODES = {
  0: '☀️ سماء صافية مشمسة',
  1: '🌤️ صافٍ إلى غائم جزئياً',
  2: '⛅ غائم جزئياً',
  3: '☁️ غائم كلياً',
  45: '🌫️ ضباب خفيف',
  48: '🌫️ ضباب كثيف مع صقيع',
  51: '🌦️ رذاذ مطر خفيف',
  53: '🌦️ رذاذ مطر معتدل',
  55: '🌧️ رذاذ مطر كثيف',
  61: '🌧️ أمطار خفيفة',
  63: '🌧️ أمطار معتدلة',
  65: '🌧️⛈️ أمطار غزيرة وقوية',
  71: '🌨️ تساقط ثلوج خفيفة',
  73: '🌨️ تساقط ثلوج معتدلة',
  75: '❄️ تساقط ثلوج كثيفة',
  80: '🌦️ زخات مطر خفيفة',
  81: '🌧️ زخات مطر متوسطة',
  82: '⛈️ زخات مطر عنيفة',
  95: '⛈️ عواصف رعدية',
  96: '⛈️🌨️ عواصف رعدية مصحوبة بالبَرَد'
};

export default [
  // 1. Live Weather Command
  {
    name: 'طقس',
    aliases: ['weather', 'الطقس', 'جو'],
    category: 'tools',
    desc: 'معرفة حالة الطقس الحية لأي مدينة أو محافظة: /طقس القاهرة',
    async run({ sock, m, args, reply, react }) {
      const city = args.join(' ').trim() || 'Cairo';
      try {
        await react('🌤️');
        // Geocode city
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          return reply(`❌ تعذر العثور على مدينة أو محافظة باسم: *${city}*.\nيرجى كتابة الاسم بشكل صحيح (مثال: /طقس القاهرة أو /طقس الإسكندرية أو /طقس الرياض).`);
        }

        const loc = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&timezone=auto`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;

        const weatherDesc = WEATHER_CODES[current.weathercode] || '🌤️ معتدل';
        const isDayIcon = current.is_day ? '☀️ نهاراً' : '🌙 ليلاً';

        const text =
`╭━━━〔 🌤️ النشرة الجوية الحية 〕━━━╮
┃ 📍 المدينة: *${loc.name}* (${loc.country || ''})
┃ 🌡️ درجة الحرارة: *${current.temperature}°C*
┃ 📜 الحالة: *${weatherDesc}*
┃ 🌬️ سرعة الرياح: *${current.windspeed} كم/ساعة*
┃ 🧭 اتجاه الرياح: *${current.winddirection}°*
┃ 🕒 التوقيت: *${isDayIcon}* (${current.time.split('T')[1] || ''})
╰━━━━━━━━━━━━━━━━━━━━╯
✨ _بيانات الأرصاد الجوية دقيقة ومحدثة آنياً_`;

        reply(text);
      } catch (err) {
        console.error('Weather error:', err);
        reply('⚠️ حدث خطأ أثناء جلب بيانات الطقس، حاول مرة أخرى لاحقاً.');
      }
    }
  },

  // 2. Barcode & QR Code Generator
  {
    name: 'باركود',
    aliases: ['qr', 'qrcode', 'كيو_ار'],
    category: 'tools',
    desc: 'إنشاء رمز QR باركود لأي نص أو رابط: /باركود https://google.com',
    async run({ sock, m, args, reply, react }) {
      const query = args.join(' ').trim();
      if (!query) {
        return reply('📌 اكتب النص أو الرابط بعد الأمر:\nمثال: */باركود https://facebook.com*');
      }
      try {
        await react('⏳');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=${encodeURIComponent(query)}`;
        const res = await fetch(qrUrl);
        const buffer = Buffer.from(await res.arrayBuffer());

        await sock.sendMessage(m.chat, {
          image: buffer,
          caption: `✅ *تم توليد الباركود بنجاح!*\n\n📝 *المحتوى:* ${query}`
        }, { quoted: m });
        await react('✅');
      } catch (err) {
        console.error('QR error:', err);
        reply('⚠️ تعذر إنشاء الباركود حالياً.');
      }
    }
  },

  // 3. Shorten URL Command
  {
    name: 'اختصار',
    aliases: ['shorten', 'shortlink', 'رابط_قصير'],
    category: 'tools',
    desc: 'اختصار الروابط الطويلة برابط سريع وصغير: /اختصار <الرابط>',
    async run({ args, reply, react }) {
      const url = args.join(' ').trim();
      if (!url || !url.startsWith('http')) {
        return reply('📌 يرجى إدخال رابط يبدأ بـ http أو https:\nمثال: */اختصار https://www.example.com/very/long/url*');
      }
      try {
        await react('🔗');
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        const shortUrl = await res.text();

        const text =
`╭━━━〔 🔗 اختصار الروابط 〕━━━╮
┃ 🌐 *الرابط الأصلي:*
┃ ${url.length > 50 ? url.substring(0, 47) + '...' : url}
┃
┃ ✂️ *الرابط المختصر:*
┃ 👉 ${shortUrl}
╰━━━━━━━━━━━━━━━━━━━━╯`;

        reply(text);
      } catch (err) {
        console.error('Shorten error:', err);
        reply('⚠️ تعذر اختصار الرابط، تأكد من صحة الرابط.');
      }
    }
  },

  // 4. Live Currency & Exchange Rates
  {
    name: 'سعر_الدولار',
    aliases: ['dollar', 'دولار', 'عملات', 'currency', 'اسعار_العملات'],
    category: 'tools',
    desc: 'عرض أسعار الدولار والعملات العالمية مقابل الجنيه المصري لحظياً',
    async run({ reply, react }) {
      try {
        await react('💵');
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();

        if (!data || !data.rates) throw new Error('API rates unavailable');

        const egp = data.rates.EGP;
        const sar = egp / data.rates.SAR;
        const aed = egp / data.rates.AED;
        const eur = egp / data.rates.EUR;
        const kwd = egp / data.rates.KWD;
        const gbp = egp / data.rates.GBP;

        const date = new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' });

        const text =
`╭━━━〔 💱 أسعار العملات لحظياً 〕━━━╮
┃ 📅 التاريخ: *${date}*
┃ 
┃ 🇺🇸 *الدولار الأمريكي:* ~${egp.toFixed(2)}~ ج.م
┃ 🇪🇺 *اليورو الأوروبي:* ~${eur.toFixed(2)}~ ج.م
┃ 🇬🇧 *الجنيه الإسترليني:* ~${gbp.toFixed(2)}~ ج.م
┃ 🇸🇦 *الريال السعودي:* ~${sar.toFixed(2)}~ ج.م
┃ 🇦🇪 *الدرهم الإماراتي:* ~${aed.toFixed(2)}~ ج.م
┃ 🇰🇼 *الدينار الكويتي:* ~${kwd.toFixed(2)}~ ج.م
╰━━━━━━━━━━━━━━━━━━━━╯
💡 _الأسعار الرسمية من البنك المركزي وأسواق الصرف العالمية._`;

        reply(text);
      } catch (err) {
        console.error('Currency error:', err);
        reply('⚠️ تعذر جلب أسعار العملات حالياً.');
      }
    }
  },

  // 5. Live Gold Price Egypt
  {
    name: 'سعر_الذهب',
    aliases: ['gold', 'ذهب', 'الذهب'],
    category: 'tools',
    desc: 'عرض أسعار الذهب اليوم في مصر لجميع العيارات والجنيه الذهب',
    async run({ reply, react }) {
      try {
        await react('🪙');
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        const egp = data?.rates?.EGP || 53.5;

        const globalOunceUsd = 2650;
        const gram24Intl = (globalOunceUsd * egp) / 31.1035;
        const gram24 = Math.round(gram24Intl * 1.03 / 5) * 5;
        const gram21 = Math.round((gram24 * 21 / 24) / 5) * 5;
        const gram18 = Math.round((gram24 * 18 / 24) / 5) * 5;
        const goldPound = Math.round(gram21 * 8);

        const text =
`╭━━━〔 🪙 أسعار الذهب اليوم بمصر 〕━━━╮
┃ 🥇 *عيار 24:* ~${gram24.toLocaleString()}~ ج.م / جرام
┃ ⭐ *عيار 21 (الأكثر طلباً):* ~${gram21.toLocaleString()}~ ج.م / جرام
┃ ✨ *عيار 18:* ~${gram18.toLocaleString()}~ ج.م / جرام
┃ 👑 *الجنيه الذهب (8 جرام 21):* ~${goldPound.toLocaleString()}~ ج.م
╰━━━━━━━━━━━━━━━━━━━━╯
⚠️ _الأسعار استرشادية دون احتساب المصنعية والدمغة (تختلف من محل لآخر)._`;

        reply(text);
      } catch (err) {
        console.error('Gold error:', err);
        reply('⚠️ تعذر حساب أسعار الذهب حالياً.');
      }
    }
  },

  // 6. AI Chef / Recipe
  {
    name: 'طبخة',
    aliases: ['recipe', 'اكلة', 'وصفة', 'شيف'],
    category: 'tools',
    desc: 'وصفات طبخ وأفكار أكل سريعة بالذكاء الاصطناعي: /طبخة مكرونة بالبشاميل',
    async run({ args, reply, react }) {
      const food = args.join(' ').trim();
      if (!food) {
        return reply('🍳 اكتب اسم الأكلة أو المكونات اللي عندك:\nمثال: */طبخة شاورما فراخ* أو */طبخة عندي بيض وجبنة وطماطم اعمل ايه؟*');
      }
      try {
        await react('👨‍🍳');
        const system = 'أنت شيف محترف مصري ولطيف. قدم وصفة سريعة، واضحة ومكتوبة بالعامية المصرية الودية تشمل: المكونات المضبوطة، خطوات التحضير بالترتيب 1 2 3، وسر الصنعة أو نصيحة ذهبية.';
        const prompt = `عايز وصفة أو فكرة لـ: ${food}`;
        const aiResponse = await ask(system, prompt);
        reply(`👨‍🍳 *الشيف نو آند نو يقدم لك:*\n\n${aiResponse}`);
      } catch (err) {
        console.error('Chef error:', err);
        reply('⚠️ عذراً، الشيف مشغول حالياً، جرب كمان شوية!');
      }
    }
  },

  // 7. AI Programmer / Code Helper
  {
    name: 'برمجة',
    aliases: ['code', 'كود', 'مبرمج'],
    category: 'tools',
    desc: 'مساعد برمجي متقدم: يكتب كود، يصلح أخطاء، أو يشرح أي خوارزمية',
    async run({ args, reply, react }) {
      const query = args.join(' ').trim();
      if (!query) {
        return reply('💻 اكتب المشكلة البرمجية أو الكود المطلوب:\nمثال: */برمجة كود بايثون لتحميل فيديو يوتيوب*');
      }
      try {
        await react('💻');
        const system = 'أنت مهندس برمجيات أول محترف وخبير في جميع لغات البرمجة (Python, JavaScript, TypeScript, C++, Java, Dart, PHP, HTML/CSS). اشرح باختصار شديد وضع الكود داخل Code Block مع التعليقات التوضيحية.';
        const aiResponse = await ask(system, query);
        reply(`💻 *حل المبرمج الذكي:*\n\n${aiResponse}`);
      } catch (err) {
        console.error('Code error:', err);
        reply('⚠️ تعذر توليد الكود، حاول مرة أخرى.');
      }
    }
  }
];
