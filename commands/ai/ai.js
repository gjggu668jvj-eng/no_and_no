// ══════════════════════════════════════════════════════════════
// 🤖 NO & NO AI - CUSTOM MULTI-PERSONA AI COMMANDS (.ai)
// ══════════════════════════════════════════════════════════════

import { 
  queryCustomAI, 
  PERSONAS, 
  getUserPersona, 
  setUserPersona, 
  clearChatHistory, 
  getChatHistory 
} from '../../lib/no_ai_engine.js';

export default [
  // الأمر الرئيسي: .ai
  {
    name: 'ai',
    aliases: ['نوا', 'شات_ذكي', 'بوت_ذكي', 'ذكاء_اصطناعي', 'ذكاء', 'gpt', 'ask'],
    desc: 'التحدث مع نموذج الذكاء الاصطناعي الخاص NO & NO AI بالشخصيات الثلاثة وتذكر السياق',
    usage: [
      '.ai <سؤالك أو استفسارك>',
      '.ai نمط 1  (لتفعيل شخصية المصري الروش 😎)',
      '.ai نمط 2  (لتفعيل شخصية العبقري التقني 💻)',
      '.ai نمط 3  (لتفعيل شخصية الحكيم الهادئ 🧘‍♂️)',
      '.ai مسح   (لتفريغ الذاكرة وبدء شات جديد 🧹)'
    ],
    async run({ sock, jid, m, text, quotedText, sender, pushName, reply, react }) {
      const q = (text || quotedText || '').trim();
      const userKey = sender || jid;

      // 1. التبديل بين الشخصيات
      if (q.startsWith('نمط') || q.startsWith('شخصية') || q.startsWith('mode')) {
        const choice = q.replace(/^(نمط|شخصية|mode)/, '').trim();
        if (choice === '1' || choice.includes('روش') || choice.includes('مصري')) {
          setUserPersona(userKey, '1');
          await react('😎');
          return reply(`╔══════════════════════════════════════╗\n║   😎 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • المصري الروش   ║\n╚══════════════════════════════════════╝\n\n✅ يا هلا يا باشا! كدا فعلت لك وضع "المصري الروش" 🇪🇬⚡\nروّق كدا واسألني أي حاجة بالبلدي وهظبطك بإجابة تفصيلية مخرومة بالذكاء! اكتب:\n*.ai سؤالك*`);
        } else if (choice === '2' || choice.includes('عبقري') || choice.includes('برمجة') || choice.includes('تقني')) {
          setUserPersona(userKey, '2');
          await react('💻');
          return reply(`╔══════════════════════════════════════╗\n║   🧠 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • العبقري التقني   ║\n╚══════════════════════════════════════╝\n\n✅ تم تفعيل وضع "المهندس والعبقري التقني" بنجاح 💻⚡\nجاهز الآن لتحليل الأكواد، حل الخوارزميات، وتزويدك بالاستشارات التقنية عالية الدقة. اكتب:\n*.ai استفسارك البرمجي أو العلمي*`);
        } else if (choice === '3' || choice.includes('حكيم') || choice.includes('فيلسوف')) {
          setUserPersona(userKey, '3');
          await react('📜');
          return reply(`╔══════════════════════════════════════╗\n║   📜 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • الحكيم الهادئ   ║\n╚══════════════════════════════════════╝\n\n✅ تم تفعيل وضع "الحكيم الهادئ" 🧘‍♂️✨\nطاب مساؤك أيها الصديق. مستعد لمشاركتك الرأي والمشورة والتأمل بروية واتزان.`);
        } else {
          // عرض قائمة الشخصيات للاختيار
          let t = `╔══════════════════════════════════════╗\n`;
          t += `║   🎭 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • اختيار الشخصية   ║\n`;
          t += `╚══════════════════════════════════════╝\n\n`;
          t += `اختر النمط المناسب لك بكتابة الأمر ورقم الشخصية:\n\n`;
          for (const [id, p] of Object.entries(PERSONAS)) {
            const isCur = getUserPersona(userKey) === id ? ' 🟢 [النشط حالياً]' : '';
            t += `[${id}] ${p.name}${isCur}\n`;
            t += `    ↳ ${p.desc}\n\n`;
          }
          t += `💡 *طريقة التغيير:*\nاكتب *.ai نمط 1* أو *.ai نمط 2* أو *.ai نمط 3*`;
          return reply(t);
        }
      }

      // 2. مسح الذاكرة
      if (q === 'مسح' || q === 'clear' || q === 'reset' || q === 'تفريغ') {
        clearChatHistory(userKey);
        await react('🧹');
        return reply(`🧹 *تم مسح ذاكرة محادثة NO & NO AI بنجاح!*\nأنا جاهز لموضوع جديد تماماً.`);
      }

      // 3. مساعدة وشرح لو لم يكتب سؤال
      if (!q) {
        const curId = getUserPersona(userKey);
        const cur = PERSONAS[curId];
        let t = `╔══════════════════════════════════════╗\n`;
        t += `║   🧠 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • نموذجك الذكي   ║\n`;
        t += `╚══════════════════════════════════════╝\n\n`;
        t += `👤 *مرحباً بك يا ${pushName || 'صديقي'}!*\n`;
        t += `🎭 *الشخصية الحالية:* ${cur.name}\n\n`;
        t += `💡 *كيفية الاستخدام:*\n`;
        t += `▪️ اكتب سؤالك مباشرة: *.ai كيف أبدأ تعلم الذكاء الاصطناعي؟*\n`;
        t += `▪️ لتغيير الشخصية والأسلوب: *.ai نمط*\n`;
        t += `▪️ لمسح الذاكرة وبدء موضوع جديد: *.ai مسح*\n\n`;
        t += `👑 *من تطوير وبناء المهندس:* *no and no*`;
        return reply(t);
      }

      // 4. تشغيل الذكاء الاصطناعي
      await react('⚡');
      try {
        const { text: answer, persona, engine } = await queryCustomAI(userKey, q);
        
        let header = `╔══════════════════════════════════════╗\n`;
        header += `║   ${persona.emoji} 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • [${persona.badge}]   ║\n`;
        header += `╚══════════════════════════════════════╝\n\n`;

        let footer = `\n\n──────────────────────────────\n`;
        footer += `💡 _لتغيير الشخصية: اكتب *.ai نمط*_`;

        await reply(header + answer + footer);
        await react('✅');
      } catch (err) {
        reply(`❌ حدث خطأ غير متوقع: ${err.message}`);
      }
    }
  },

  // أمر سريع: .شخصية أو .نمط_ai
  {
    name: 'شخصية_ai',
    aliases: ['نمط_الذكاء', 'انماط_ai', 'شخصيات_ai'],
    desc: 'عرض واختيار شخصية نموذج الذكاء الاصطناعي NO & NO AI',
    async run({ reply, sender, jid }) {
      const userKey = sender || jid;
      let t = `╔══════════════════════════════════════╗\n`;
      t += `║   🎭 𝑵𝑶 & 𝑵𝑶 𝑨𝑰 • الأنماط المتاحة   ║\n`;
      t += `╚══════════════════════════════════════╝\n\n`;
      t += `يمكنك التبديل بين 3 شخصيات مبرمجة خصيصاً لك:\n\n`;
      for (const [id, p] of Object.entries(PERSONAS)) {
        const isCur = getUserPersona(userKey) === id ? ' 🟢 [النشط حالياً]' : '';
        t += `[${id}] ${p.name}${isCur}\n`;
        t += `    ↳ ${p.desc}\n\n`;
      }
      t += `💡 *لتفعيل أي نمط، اكتب:*\n*.ai نمط 1*  أو  *.ai نمط 2*  أو  *.ai نمط 3*`;
      return reply(t);
    }
  },

  // توليد صور بالذكاء الاصطناعي
  {
    name: 'تخيل',
    aliases: ['ارسم', 'صورة_ai', 'imagine', 'flux', 'بولينيشن'],
    desc: 'توليد ورسم صور سينمائية فائقة الجودة بنموذج Flux AI Ultra',
    usage: ['.تخيل <وصف الصورة>'],
    async run({ sock, jid, m, text, reply, react }) {
      if (!text) return reply('💡 *طريقة الاستخدام:*\n.تخيل <وصف الصورة بالعربي أو الإنجليزي>\n\n📌 مثال: *.تخيل نمر مدرع في مدينة مستقبلية بإضاءة نيون 8K*');
      await react('🎨');
      await reply('🎨 *جاري تشغيل محرك NO & NO للرسم التوليدي الفائق...* ⏳');
      try {
        const prompt = encodeURIComponent(text.trim());
        const seed = Math.floor(Math.random() * 9999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
        
        await sock.sendMessage(jid, {
          image: { url: imageUrl },
          caption: `🎨 *تم توليد الصورة بنجاح بواسطة NO & NO AI!*\n📝 *الوصف:* ${text}\n⚡ المحرك: Flux Ultra-HD Engine\n👑 المطور: no and no`
        }, { quoted: m });
        await react('✨');
      } catch (e) {
        reply(`❌ تعذر رسم الصورة: ${e.message}`);
      }
    }
  }
];
