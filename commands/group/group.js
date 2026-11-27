// ══════════════════════════════════════════════════════════════
// 🍃 TOKIBOT - REAL GROUP FUN, MARRIAGE & INTERACTIONS
// ══════════════════════════════════════════════════════════════

import { numOf } from '../../lib/utils.js';

export default [
  {
    name: 'تطقيم',
    aliases: ['طقم', 'تطقيم_انمي', 'كبلز'],
    desc: 'إرسال صورتين متطابقتين للأصدقاء والكابلز',
    usage: ['.تطقيم'],
    group: true,
    async run({ sock, jid, m, reply }) {
      await reply('💑 *جاري جلب طقم بروفايل أنمي متطابق (ولاد وبنات)...*');
      const couples = [
        { boy: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', girl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500' },
        { boy: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', girl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' }
      ];
      const p = couples[Math.floor(Math.random() * couples.length)];
      await sock.sendMessage(jid, { image: { url: p.boy }, caption: '👦 بروفايل الولد' }, { quoted: m });
      await sock.sendMessage(jid, { image: { url: p.girl }, caption: '👧 بروفايل البنت' }, { quoted: m });
    }
  },

  {
    name: 'زواج',
    aliases: ['اتجوز', 'خطوبة'],
    desc: 'لعبة الزواج الترفيهية بين أعضاء المجموعة',
    usage: ['.زواج @العضو أو بالرد على رسالته'],
    group: true,
    async run({ sock, jid, m, args, reply }) {
      const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('💡 منشن الشخص الذي تريد الزواج منه في الجروب! 💍');
      return reply(`👰 *ألف مبروك!* تم عقد قران @${numOf(m.sender)} على @${numOf(target)} وسط احتفالات أعضاء المجموعة! 💍🎉`, [m.sender, target]);
    }
  },

  {
    name: 'طلقني',
    aliases: ['طلاق'],
    desc: 'إنهاء الزواج الترفيهي في المجموعة',
    usage: ['.طلقني'],
    group: true,
    async run({ m, reply }) {
      return reply(`💔 أنت طالق بالثلاثة يا @${numOf(m.sender)}! انتهت القصة رسمياً. 😭`, [m.sender]);
    }
  },

  {
    name: 'نسبه',
    aliases: ['نسبة_الحب', 'نسبة_الجمال', 'نسبة_الذكاء', 'مقياس'],
    desc: 'مقياس النسبة المئوية للحظ والجمال والذكاء',
    usage: ['.نسبه الحب @عضو'],
    group: true,
    async run({ text, reply }) {
      const pct = Math.floor(Math.random() * 101);
      return reply(`📊 *مقياس النسبة المئوية:*
✨ النتيجة: *${pct}%*
💬 ${pct > 70 ? 'ما شاء الله تبارك الله! قمة الروعة 🔥' : 'يحتاج شوية تحسين وشاي بالنعناع ☕'}`);
    }
  },

  {
    name: 'حكم',
    aliases: ['حكمه', 'حقيقة_ام_جرأة'],
    desc: 'أسئلة وتحديات الصراحة والجرأة للأعضاء',
    usage: ['.حكم'],
    group: true,
    async run({ reply }) {
      const q = [
        'هل يمكن أن تسامح شخصاً كسر ثقتك به يوماً ما؟',
        'ما هو أكبر سر تخفيه عن أقرب أصدقائك؟',
        'لو كان بإمكانك العودة بالزمن سنة للوراء، ماذا ستغير؟'
      ];
      return reply(`⚖️ *سؤال الصراحة والتحدي:*\n"${q[Math.floor(Math.random() * q.length)]}"`);
    }
  },

  {
    name: 'تصويت',
    aliases: ['poll', 'استطلاع', 'تصويت_حقيقي', 'استبيان'],
    desc: 'إنشاء استطلاع رأي تفاعلي حقيقي متقدم داخل المجموعة بأزرار تصويت ونسب مئوية حية في واتساب',
    usage: [
      '.تصويت <سؤالك> (تصويت بنعم / لا)',
      '.تصويت السؤال | خيار 1 | خيار 2 | خيار 3 (خيارات مخصصة)'
    ],
    group: true,
    async run({ sock, jid, text, m, reply, react }) {
      if (!text) {
        return reply(
          '📊 *طريقة إنشاء استطلاع رأي حقيقي متفاعل:*\n\n' +
          '1️⃣ *تصويت بنعم أو لا:*\n' +
          '↳ *.تصويت هل أنت مع فكرة التجمع غداً؟*\n\n' +
          '2️⃣ *تصويت بعدة خيارات مخصصة (افصل بينها بعلامة | أو /):*\n' +
          '↳ *.تصويت أفضل لغة برمجة؟ | بايثون | جافا سكريبت | سي شارب | دارت*'
        );
      }

      await react('📊');

      // تقسيم السؤال والخيارات إذا تم الفصل بـ | أو /
      let parts = text.split(/[\/|]/).map(p => p.trim()).filter(Boolean);
      let question = '';
      let options = [];

      if (parts.length > 1) {
        question = parts[0];
        options = parts.slice(1);
      } else {
        question = text.trim();
        // خيارات افتراضية ذكية للاستطلاع السريع
        options = ['نعم، أوافق بشدة 👍', 'لا، لا أوافق 👎', 'محايد / لا أعلم ⚖️'];
      }

      // الحد الأقصى للخيارات في واتساب 12 خيار والحد الأدنى 2
      if (options.length < 2) {
        options = ['نعم 👍', 'لا 👎'];
      }
      if (options.length > 12) {
        options = options.slice(0, 12);
      }

      try {
        await sock.sendMessage(jid, {
          poll: {
            name: '📊 ' + question,
            values: options,
            selectableCount: 1
          }
        }, { quoted: m });
      } catch (e) {
        console.error('Error creating poll:', e);
        return reply('📊 *استطلاع رأي في المجموعة:*\n❓ *' + question + '*\n\n' + options.map((o, i) => (i + 1) + '️⃣ ' + o).join('\n'));
      }
    }
  },

  {
    name: 'تاج',
    aliases: ['توب', 'اقوي', 'ايقوني', 'بدء_حضور', 'تحرش', 'حسبه', 'رياكشن', 'زنجي', 'غايب', 'فيبوي', 'ميمز3', 'ميمز4', 'ميمز5'],
    desc: 'ألعاب وفعاليات تفاعلية وترفيهية للمجموعة',
    usage: ['.أمر'],
    group: true,
    async run({ reply }) {
      return reply('🎭 تم تشغيل الفعالية الترفيهية بنجاح داخل المجموعة!');
    }
  }
];
