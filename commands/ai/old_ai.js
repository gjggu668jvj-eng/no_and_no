import config from '../../config.js';

const CANDIDATE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

// ذاكرة المحادثة المتعددة لكل شات/مستخدم (Multi-turn Memory)
const chatHistories = new Map();
const MAX_HISTORY = 18; // الاحتفاظ بآخر 18 رسالة لتوفير سياق كامل

function getHistory(chatId) {
  if (!chatHistories.has(chatId)) {
    chatHistories.set(chatId, []);
  }
  return chatHistories.get(chatId);
}

function clearHistory(chatId) {
  chatHistories.delete(chatId);
}

function addMessage(chatId, role, content) {
  const h = getHistory(chatId);
  h.push({ role, content, time: Date.now() });
  if (h.length > MAX_HISTORY) {
    h.splice(0, h.length - MAX_HISTORY);
  }
}

async function askFreePollinations(system, prompt, messages = []) {
  try {
    let full = system ? `${system}\n\n` : '';
    if (messages.length) {
      full += messages.map(m => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`).join('\n');
      full += `\nالمستخدم: ${prompt}\nالمساعد:`;
    } else {
      full += prompt;
    }
    const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(full)}?model=openai&seed=${Date.now()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (r.ok) {
      const txt = (await r.text()).trim();
      if (txt && !txt.includes('Rate limit')) return txt;
    }
  } catch {}
  return null;
}

export async function ask(system, prompt, history = []) {
  try {
    const { queryCustomAI } = await import('../../lib/no_ai_engine.js');
    const res = await queryCustomAI('global', prompt);
    if (res && (res.response || res.text)) return res.response || res.text;
  } catch {}

  const { url, key } = config.ai;

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  if (history && history.length) {
    for (const h of history) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: prompt });

  if (key) {
    const modelsToTry = [...new Set([config.ai.model, ...CANDIDATE_MODELS])].filter(Boolean);
    for (const m of modelsToTry) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          const ans = data?.choices?.[0]?.message?.content;
          if (ans) return ans.trim();
        }
      } catch {}
    }
  }

  // المحرك الاحتياطي المجاني الفوري
  const freeResp = await askFreePollinations(system, prompt, history);
  if (freeResp) return freeResp;

  return 'عذراً، لم أتمكن من معالجة الطلب في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.';
}

// دالة احترافية لهندسة وترجمة أوامر الصور وتنقيتها بدقة فائقة
async function enrichPromptForImage(arabicPrompt, style = 'cinematic photorealistic 8k') {
  try {
    const translationSystem = `You are a senior Stable Diffusion and Midjourney prompt engineer.
Convert the user's description into an ultra-precise, evocative English prompt.
Style: ${style}.
Include specific subject details, atmosphere, lighting (volumetric, dramatic), color palette, 8k resolution, masterpiece.
RULES: Output ONLY the English prompt string. No greetings, no intro words, no quotes, no conversational filler.`;

    let enriched = await ask(translationSystem, arabicPrompt);
    if (enriched && enriched.length > 5 && !enriched.includes('عذراً')) {
      enriched = enriched
        .replace(/^(here is|prompt|translation|sure|certainly|image description|the prompt is):?/i, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();
      return enriched;
    }
  } catch {}
  return `${arabicPrompt}, high quality, detailed, 8k`;
}

// جلب صور فائقة الجودة من Lexica Art كفولباك ذكي ومضمون
async function fetchLexicaImage(query) {
  try {
    const res = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.images?.length > 0) {
        const top = data.images[0];
        const dl = await fetch(top.src, { signal: AbortSignal.timeout(25000) });
        if (dl.ok) {
          return {
            buffer: Buffer.from(await dl.arrayBuffer()),
            prompt: top.prompt,
            engine: 'Lexica Masterpiece AI',
          };
        }
      }
    }
  } catch {}
  return null;
}

// دالة توليد موحدة فائقة الذكاء ومتعددة المحركات
async function generateImageUniversal(arabicText, style = 'cinematic photorealistic 8k') {
  const englishPrompt = await enrichPromptForImage(arabicText, style);
  const seed = Math.floor(Math.random() * 99999999);

  // المحاولة الأولى: Pollinations مع Flux
  try {
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;
    const res = await fetch(fluxUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(35000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 5000) {
        return { buffer: buf, prompt: englishPrompt, engine: 'Flux Ultra-HD' };
      }
    }
  } catch {}

  // المحاولة الثانية: Pollinations Turbo
  try {
    const turboUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?model=turbo&width=1024&height=1024&nologo=true&seed=${seed}`;
    const res = await fetch(turboUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 5000) {
        return { buffer: buf, prompt: englishPrompt, engine: 'Turbo Fast Engine' };
      }
    }
  } catch {}

  // المحاولة الثالثة: محرك Lexica الفاخر
  const lexicaResult = await fetchLexicaImage(englishPrompt);
  if (lexicaResult) return lexicaResult;

  throw new Error('تعذر توليد الصورة من كافة الخوادم في الوقت الحالي.');
}

const SYS_DEFAULT = 'أنت مساعد ذكي مدمج داخل بوت واتساب "no and no". تجيب بلباقة وذكاء ودقة وتنسيق جميل وبلهجة مصرية مهذبة أو فصحى حسب رغبة المستخدم.';

const need = (reply, ex) => reply(`💡 اكتب النص أو السؤال بعد الأمر مباشرة، أو قم بالرد على رسالة.\nمثال: *${ex}*`);

export default [
  // 1. شات تفاعلي يتذكر المحادثة السابقة (Multi-turn Chat)
  {
    name: 'شات',
    aliases: ['chat', 'دردشة', 'تكلم', 'سولف'],
    desc: 'محادثة تفاعلية مستمرة مع الذكاء الاصطناعي يتذكر فيها كلامك السابق',
    async run({ jid, text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/شات عامل إيه يا صاحبي؟');
      await react('🧠');

      const chatId = jid;
      const history = getHistory(chatId);

      const persona = 'أنت صديق ذكي وخبير مدمج داخل بوت واتساب "no and no". تذكر ما قاله المستخدم في الرسائل السابقة وتحدث معه كصديق حقيقي بتنسيق مرتب ومرن.';
      const answer = await ask(persona, q, history);

      addMessage(chatId, 'user', q);
      addMessage(chatId, 'assistant', answer);

      await reply(`╭───〔 🧠 *محادثة ذكية بذاكرة مستمرة* 〕───╮\n\n${answer}\n\n╰────────────────────────────╯\n💡 _اكتب *.مسح_الشات* لبدء محادثة جديدة ونسيان السياق._`);
      await react('💬');
    },
  },

  // 2. مسح ذاكرة الشات
  {
    name: 'مسح_الشات',
    aliases: ['clearchat', 'reset_chat', 'نسيان_الشات', 'تفريغ_الشات'],
    desc: 'مسح وتفريغ ذاكرة محادثة الذكاء الاصطناعي وبدء شات جديد',
    async run({ jid, reply, react }) {
      await react('🧹');
      clearHistory(jid);
      reply(`╭───〔 🧹 *تفريغ الذاكرة* 〕───╮\n│\n│ ✅ تم مسح ذاكرة الشات بنجاح!\n│ 🧠 الذكاء الاصطناعي الآن جاهز لموضوع جديد.\n│\n╰────────────────────────────╯`);
    },
  },

  // 3. ذاكرة الشات الحالية
  {
    name: 'ذاكرة_الشات',
    aliases: ['chat_memory', 'حالة_الشات'],
    desc: 'عرض عدد الرسائل المحفوظة في ذاكرة هذا الشات حالياً',
    async run({ jid, reply, react }) {
      await react('📊');
      const h = getHistory(jid);
      reply(`╭───〔 📊 *ذاكرة الشات الحالية* 〕───╮\n│\n│ 💬 عدد الرسائل المخزنة: *${h.length} / ${MAX_HISTORY}*\n│ 🧠 حالة الذاكرة: *${h.length > 0 ? 'نشطة ومتصلة' : 'فارغة'}*\n│ 💡 لمسح الذاكرة: *.مسح_الشات*\n│\n╰────────────────────────────╯`);
    },
  },

  // 4. اسأل (سؤال فوري بدون حفظ ذاكرة)
  {
    name: 'اسأل', aliases: ['ask', 'سؤال'],
    desc: 'اسأل الذكاء الاصطناعي أي سؤال سريع ومباشر',
    async run({ text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/اسأل ما هي نظرية النسبية باختصار؟');
      await react('🤖');
      const answer = await ask(SYS_DEFAULT, q);
      reply(`╭───〔 🤖 *الذكاء الاصطناعي* 〕───╮\n\n${answer}\n\n╰────────────────────────────╯`);
      await react('✅');
    },
  },

  // 5. تخيل الأساسي (توليد الصور بدقة خارقة مع ترجمة وتحسين برومبت احترافي)
  {
    name: 'تخيل',
    aliases: ['imagine', 'dalle', 'رسم', 'صورة_ai'],
    desc: 'توليد ورسم صور بالذكاء الاصطناعي مطابقة تماماً لوصفك بجودة Flux Ultra-HD',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب وصف الصورة التي تريد توليدها بالذكاء الاصطناعي.\nمثال: */تخيل محارب سايبر بانك في شوارع طوكيو الممطرة*');
      await react('🎨');
      await reply('⏳ جاري ترجمة وتحسين الوصف ورسم الصورة بدقة فائقة، انتظر ثوانٍ معدودة...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'cinematic photorealistic 8k octane render');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 🎨 *رسم الذكاء الاصطناعي - NO & NO* 〕───╮\n│\n` +
            `│ 📝 *طلبك:* ${q}\n` +
            `│ ⚡ *البرومبت المحسن:* ${prompt.slice(0, 95)}...\n` +
            `│ 🔮 *المحرك:* ${engine}\n` +
            `│ 👑 *المطور:* no and no\n│\n` +
            `╰────────────────────────────╯`,
        }, { quoted: m });
        await react('✨');
      } catch (e) {
        reply(`❌ تعذر توليد الصورة: ${e.message}`);
      }
    },
  },

  // 6. تخيل برو (سينمائي 4K)
  {
    name: 'تخيل_برو',
    aliases: ['imagine_pro', 'رسم_سينمائي'],
    desc: 'توليد صور سينمائية فائقة الواقعية 4K مع إضاءة احترافية',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب وصف الصورة السينمائية.\nمثال: */تخيل_برو قلعة مظلمة في قمة جبل وقت الغروب*');
      await react('🎬');
      await reply('⏳ جاري الرسم بدقة 4K Cinematic...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'masterpiece, 8k resolution, 35mm lens, cinematic film lighting, highly detailed, photorealistic');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 🎬 *Cinematic AI 4K - NO & NO* 〕───╮\n│\n` +
            `│ 🔮 *الفكرة:* ${q}\n` +
            `│ 💎 *الجودة:* 4K Photorealistic\n` +
            `│ ⚡ *المحرك:* ${engine}\n│\n` +
            `╰────────────────────────────╯`,
        }, { quoted: m });
        await react('🌟');
      } catch (e) {
        reply(`❌ تعذر التوليد: ${e.message}`);
      }
    },
  },

  // 7. تخيل أنمي (Anime / Manga Style)
  {
    name: 'تخيل_انمي',
    aliases: ['anime_art', 'رسم_انمي'],
    desc: 'رسم وتوليد صور بنمط الأنمي والمانجا اليابانية الأسطورية',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب وصف شخصية أو مشهد الأنمي.\nمثال: */تخيل_انمي ساموراي بعينين متوهجتين تحت أزهار الكرز*');
      await react('🌸');
      await reply('⏳ جاري رسم مشهد الأنمي الساحر...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'stunning anime art style, makoto shinkai aesthetic, vibrant colors, studio ghibli lighting, high detailed anime wallpaper');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 🌸 *Anime Otaku Art* 〕───╮\n│\n│ 🎌 *المشهد:* ${q}\n│ ⚡ *النمط:* Japanese Anime Masterpiece\n│\n╰────────────────────────────╯`,
        }, { quoted: m });
        await react('⚔️');
      } catch (e) {
        reply(`❌ فشل التوليد: ${e.message}`);
      }
    },
  },

  // 8. تخيل رعب (Dark Horror Style)
  {
    name: 'تخيل_رعب',
    aliases: ['horror_art', 'رسم_رعب'],
    desc: 'رسم وتوليد صور رعب مظلمة وكابوسية بنمط Gothic Horror',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب وصف المشهد المرعب.\nمثال: */تخيل_رعب شبح ذو قناع عتيق في ممر مهجور ملطخ بالدماء*');
      await react('🩸');
      await reply('⏳ جاري استحضار ورسم الكابوس المرعب...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'dark gothic horror, lovecraftian atmosphere, blood red tones, eerie shadows, ultra-detailed creepy creature, sinister aesthetic');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 💀 *Dark Horror AI Art* 〕───╮\n│\n│ 🩸 *الكابوس:* ${q}\n│ 👁️ *النمط:* Gothic Nightmarish\n│\n╰────────────────────────────╯`,
        }, { quoted: m });
        await react('💀');
      } catch (e) {
        reply(`❌ فشل التوليد: ${e.message}`);
      }
    },
  },

  // 9. تخيل ثلاثي الأبعاد (3D Pixar / Unreal Engine)
  {
    name: 'تخيل_3d',
    aliases: ['رسم_3d', 'pixar_art'],
    desc: 'رسم وتوليد شخصيات ومجسمات ثلاثية الأبعاد 3D بنمط Pixar و Unreal Engine',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب وصف المجسم أو الشخصية ثلاثية الأبعاد.\nمثال: */تخيل_3d تنين صغير لطيف مصنوع من الكريستال*');
      await react('🧊');
      await reply('⏳ جاري عمل ريندر ثلاثي الأبعاد 3D...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'cute 3d character render, pixar disney style, unreal engine 5 render, raytracing, vibrant smooth textures');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 🧊 *3D Render Art* 〕───╮\n│\n│ 💎 *الوصف:* ${q}\n│ ⚡ *النمط:* 3D Unreal Engine / Pixar\n│\n╰────────────────────────────╯`,
        }, { quoted: m });
        await react('✨');
      } catch (e) {
        reply(`❌ فشل التوليد: ${e.message}`);
      }
    },
  },

  // 10. تخيل لوجو (Logo Maker)
  {
    name: 'تخيل_لوجو',
    aliases: ['صمم_لوجو', 'شعار_ai'],
    desc: 'تصميم لوجو وشعار احترافي لشركتك أو قناتك بالذكاء الاصطناعي',
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText;
      if (!q) return reply('💡 اكتب فكرة الشعار.\nمثال: */تخيل_لوجو صقر فضي عصري لفريق ألعاب إلكترونية*');
      await react('💎');
      await reply('⏳ جاري ابتكار الشعار الاحترافي...');

      try {
        const { buffer, prompt, engine } = await generateImageUniversal(q, 'modern minimalist vector logo design, clean lines, professional branding, flat aesthetic, white background');
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `╭───〔 💎 *Logo Design AI* 〕───╮\n│\n│ 🏷️ *الفكرة:* ${q}\n│ ⚡ *النمط:* Minimalist Vector Logo\n│\n╰────────────────────────────╯`,
        }, { quoted: m });
        await react('✅');
      } catch (e) {
        reply(`❌ فشل التوليد: ${e.message}`);
      }
    },
  },

  // 11. مصحح الأكواد البرمجية
  {
    name: 'كود_مصحح',
    aliases: ['fix_code', 'صلح_كود', 'debug'],
    desc: 'فحص وتصحيح الأخطاء في أي كود برمجي (JS, Python, PHP, C++, إلخ)',
    async run({ text, quotedText, reply, react }) {
      const code = text || quotedText;
      if (!code) return need(reply, '/كود_مصحح const x = 5; x = 10;');
      await react('💻');
      const sys = `أنت مهندس برمجيات محترف وخبير تصحيح أخطاء (Senior Software Debugger).
افحص الكود البرمجي التالي، وحدد الأخطاء فيه، واشرح سبب الخطأ، ثم اكتب الكود المصحح كاملاً بطريقة منسقة.`;
      const ans = await ask(sys, code);
      reply(`╭───〔 💻 *مصحح الأكواد البرمجية* 〕───╮\n\n${ans}\n\n╰────────────────────────────╯`);
      await react('✅');
    },
  },

  // 12. مساعد الدراسة والحل
  {
    name: 'مساعد_دراسة',
    aliases: ['study', 'حل_واجب', 'معادلة', 'فيزياء'],
    desc: 'حل المسائل الرياضية والعلمية وشرح الدروس خطوة بخطوة',
    async run({ text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/مساعد_دراسة حل المعادلة: 2x + 10 = 20');
      await react('📚');
      const sys = `أنت معلم وأستاذ متخصص في الرياضيات والعلوم. قم بحل المسألة أو السؤال بطريقة تعليمية مشروحة خطوة بخطوة مع تبسيط الشرح.`;
      const ans = await ask(sys, q);
      reply(`╭───〔 📚 *المعلم الذكي* 〕───╮\n\n${ans}\n\n╰────────────────────────────╯`);
      await react('🎓');
    },
  },

  // 13. تلخيص النصوص والمقالات
  {
    name: 'لخص',
    aliases: ['summarize', 'ملخص', 'تلخيص'],
    desc: 'تلخيص أي مقال أو نص طويل في نقاط رئيسية مركزة ومفيدة',
    async run({ text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/لخص (ضع النص أو المقال الطويل هنا)');
      await react('📝');
      const sys = `أنت خبير تلخيص نصوص ومقالات. لخص النص التالي في نقاط واضحة وأساسية مع الحفاظ على أهم المعلومات دون تفريط.`;
      const ans = await ask(sys, q);
      reply(`╭───〔 📝 *ملخص النص* 〕───╮\n\n${ans}\n\n╰────────────────────────────╯`);
      await react('✅');
    },
  },

  // 14. شاعر الذكاء الاصطناعي
  {
    name: 'شاعر',
    aliases: ['شعر', 'قصيدة', 'ابيات'],
    desc: 'تأليف أبيات شعر وقصائد فصيحة أو عامية حول أي موضوع أو شخص',
    async run({ text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/شاعر الصداقة والوفاء');
      await react('🖋️');
      const sys = `أنت شاعر عربي فصيح وبليغ. ألف أبيات شعرية موزونة ورائعة حول الموضوع المطلوب، واضبط أواخر الكلمات بتنسيق شعري جذاب.`;
      const ans = await ask(sys, q);
      reply(`╭───〔 🖋️ *ديوان الشعر العربي* 〕───╮\n\n${ans}\n\n╰────────────────────────────╯`);
      await react('📜');
    },
  },

  // 15. ترجمة ذكية بسياق احترافي
  {
    name: 'ترجم_ذكي',
    aliases: ['ai_trans', 'ترجمة_سياقية'],
    desc: 'ترجمة احترافية تراعي المعنى البلاغي والسياق الثقافي',
    async run({ text, quotedText, reply, react }) {
      const q = text || quotedText;
      if (!q) return need(reply, '/ترجم_ذكي Break a leg!');
      await react('🌐');
      const sys = `أنت مترجم فوري محترف. ترجم العبارة بدقة وسياق طبيعي، وإذا كانت مثلاً شعبياً أو مصطلحاً idiomatic اشرح معناه المقصود.`;
      const ans = await ask(sys, q);
      reply(`╭───〔 🌐 *الترجمة السياقية الذكية* 〕───╮\n\n${ans}\n\n╰────────────────────────────╯`);
      await react('✅');
    },
  },
];
