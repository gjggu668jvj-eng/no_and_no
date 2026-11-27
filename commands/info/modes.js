import { THEMES, getActiveThemeKey, setActiveTheme, isCardImageEnabled } from '../../lib/theme_engine.js';
import { db, save } from '../../lib/db.js';

export default [
  // 1. عرض المودات وتغييرها
  {
    name: 'مود',
    aliases: ['المودات', 'مودات', 'ستايل', 'ثيم', 'الستايل', 'الثيم'],
    desc: 'عرض كافة مودات وثيمات البوت أو التبديل بينها (رعب، سايبر، أنمي، فخامة)',
    async run({ args, reply, react }) {
      const target = (args[0] || '').toLowerCase();

      // لو كتب اسم المود بعد الأمر مباشرة: .مود رعب
      if (target) {
        let selectedKey = null;
        if (target.includes('رعب') || target.includes('horror')) selectedKey = 'horror';
        else if (target.includes('سايبر') || target.includes('cyber')) selectedKey = 'cyberpunk';
        else if (target.includes('انمي') || target.includes('anime') || target.includes('اوتاكو')) selectedKey = 'anime';
        else if (target.includes('فخام') || target.includes('royal') || target.includes('ملكي')) selectedKey = 'royal';

        if (selectedKey) {
          setActiveTheme(selectedKey);
          const t = THEMES[selectedKey];
          await react(t.emoji);
          return reply(`╭───〔 ${t.emoji} *تم تفعيل ${t.name}* 〕───╮\n│\n` +
            `│ 🎨 تم تحويل كافة واجهات وقوائم البوت إلى: *${t.name}*!\n` +
            `│ 🖼️ البانرات والتفاعلات الآن بنمط ${t.title}\n│\n` +
            `╰────────────────────────────╯`);
        }
      }

      await react('🎭');
      const current = getActiveThemeKey();
      let msg = `╭───〔 🎭 *نظام المودات والثيمات العالمي* 〕───╮\n│\n` +
        `│ 🌟 *المود النشط حالياً:* ${THEMES[current]?.name || 'مود الرعب'}\n` +
        `│ 🖼️ *عرض صور الرعب مع الأوامر:* ${isCardImageEnabled() ? 'مُفعّل 🟢' : 'مُعطّل 🔴'}\n│\n` +
        `│ 📌 *المودات المتاحة للتحويل:*\n` +
        `│ [1] 💀 *.مود_رعب* ─── (Dark Horror Gothic)\n` +
        `│ [2] ⚡ *.مود_سايبر* ─── (Neon Cyberpunk 2.0)\n` +
        `│ [3] 🌸 *.مود_انمي* ─── (Otaku Anime Realm)\n` +
        `│ [4] 👑 *.مود_فخامة* ─── (Royal Gold VIP)\n│\n` +
        `│ 💡 للتحويل السريع اكتب: *.مود <اسم المود>*\n` +
        `│ مثال: *.مود سايبر* أو *.مود رعب*\n` +
        `╰────────────────────────────╯`;
      reply(msg);
    },
  },

  // 2. أوامر التفعيل المباشرة لكل مود
  {
    name: 'مود_رعب',
    aliases: ['ثيم_رعب', 'ستايل_رعب'],
    desc: 'تفعيل مود الرعب المظلم والبانرات الكابوسية مع كل أمر',
    async run({ reply, react }) {
      setActiveTheme('horror');
      await react('🩸');
      reply(`╭───〔 💀 *تم تفعيل مود الرعب المظلم* 💀 〕───╮\n│\n│ 🩸 البوت الآن يعمل بكامل طاقة الرعب السادية والسرعة المظلمة!\n│ 👁️ ستظهر مع كل أمر صورة مرعبة وخلفيات كابوسية.\n│\n╰────────────────────────────╯`);
    },
  },

  {
    name: 'مود_سايبر',
    aliases: ['ثيم_سايبر', 'ستايل_سايبر', 'مود_هاكر'],
    desc: 'تفعيل مود السايبر بانك والنيون التكنولوجي المستقبلي',
    async run({ reply, react }) {
      setActiveTheme('cyberpunk');
      await react('⚡');
      reply(`╭───〔 ⚡ *تم تفعيل مود السايبر بانك 2.0* ⚡ 〕───╮\n│\n│ 💻 نظام المصفوفة والاختراق المتقدم قيد التشغيل الآن!\n│ 🔮 صور نيون رقمية وتقنيات ذكاء اصطناعي مصفوفية.\n│\n╰────────────────────────────╯`);
    },
  },

  {
    name: 'مود_انمي',
    aliases: ['ثيم_انمي', 'ستايل_انمي', 'مود_اوتاكو'],
    desc: 'تفعيل مود الأنمي والأوتاكو الياباني الساحر',
    async run({ reply, react }) {
      setActiveTheme('anime');
      await react('🌸');
      reply(`╭───〔 🌸 *تم تفعيل مود الأنمي والأوتاكو* 🌸 〕───╮\n│\n│ ⛩️ مرحباً بك في بوابة الأنمي والمانجا السحرية!\n│ ✨ تصاميم مستوحاة من عوالم الأنمي والأساطير.\n│\n╰────────────────────────────╯`);
    },
  },

  {
    name: 'مود_فخامة',
    aliases: ['ثيم_فخامة', 'مود_ملكي', 'ستايل_ملكي'],
    desc: 'تفعيل المود الملكي الفاخر الذهبي لكبار الشخصيات',
    async run({ reply, react }) {
      setActiveTheme('royal');
      await react('👑');
      reply(`╭───〔 👑 *تم تفعيل المود الملكي الفاخر VIP* 👑 〕───╮\n│\n│ 💎 تم تفعيل واجهة الفخامة والذهب الإمبراطوري!\n│ 🏛️ أعلى درجات الأناقة والتنسيق الملكي.\n│\n╰────────────────────────────╯`);
    },
  },

  // 3. التحكم في ظهور الصورة مع كل أمر
  {
    name: 'صورة_الاوامر',
    aliases: ['بانر_الاوامر', 'صور_الاوامر'],
    desc: 'تشغيل أو إيقاف إرفاق صورة مع كل رد وأمر: .صورة_الاوامر تشغيل/تعطيل',
    async run({ args, reply, react }) {
      const action = (args[0] || '').toLowerCase();
      if (['تشغيل', 'تفعيل', 'on'].includes(action)) {
        db.settings.cardImageEnabled = true;
        save();
        await react('✅');
        return reply('✅ تم تفعيل إرفاق الصور المخيفة والبانرات مع كل أمر بنجاح!');
      }
      if (['تعطيل', 'ايقاف', 'off'].includes(action)) {
        db.settings.cardImageEnabled = false;
        save();
        await react('⏸️');
        return reply('⏸️ تم تعطيل إرفاق الصور مع الأوامر للرد بنصوص فقط.');
      }
      const current = isCardImageEnabled();
      reply(`💡 *الحالة الحالية:* ${current ? 'مُفعّل 🟢' : 'مُعطّل 🔴'}\nللتغيير اكتب: *.صورة_الاوامر تشغيل* أو *.صورة_الاوامر تعطيل*`);
    },
  },
];
