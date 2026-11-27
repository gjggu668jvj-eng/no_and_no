import { rand, randInt, numOf, money } from '../../lib/utils.js';

const SLAP_TEXTS = [
  'ضرب @TARGET كف ثلاثي الأبعاد خلا وشه يلف 360 درجة! 👋💥',
  'نزل على قفا @TARGET قلم تاريخي سمع في الجروبات المجاورة! 😂🖐️',
  'إدا لـ @TARGET كف خلاه يشوف نجوم الضهر في عز الليل! ⭐😵',
];

const HUG_TEXTS = [
  'أعطى لـ @TARGET حضن دافئ جداً ومريح للأعصاب 🫂💖',
  'حضن @TARGET بقوة وقال له: متزعلش يا غالي كل حاجة هتعدي! 🤗✨',
  'أرسل حضن أخوي عملاق لـ @TARGET مليان طاقة إيجابية! 🌸🤍',
];

const KISS_TEXTS = [
  'طبع بوسة لطيفة على خد @TARGET وقال له: منور الشات يا عسل! 😘💋',
  'بعت لـ @TARGET بوسة هوائية مليانة محبة وتقدير! 😚💖',
];

const KILL_TEXTS = [
  'اغتال @TARGET بمسدس كاتم للصوت ودفنه ورا الجروب في سرية تامة! 🔫💀',
  'رمى قنبلة يدوية تحت رجل @TARGET ونسفه من الوجود! 💣💥',
  'استأجر قناص محترف صفّى @TARGET بطلقة واحدة في منتصف الجبهة! 🎯🩸',
];

const WYR_QUESTIONS = [
  ['تقدر تطير في السما 🦅', 'تكون مخفي ومحدش يشوفك 👻'],
  ['تاكل أكلتك المفضلة كل يوم ببلاش 🍕', 'تسافر أي بلد في العالم مجاناً ✈️'],
  ['تعرف المستقبل اللي هيحصل 🔮', 'ترجع للماضي وتصلح غلطة ندمت عليها ⏳'],
  ['تكون غني جداً بس مشهور ومفيش خصوصية 💰', 'تكون مرتاح مادياً ومحدش يعرفك خالص 🏝️'],
  ['تعيش من غير إنترنت لمدة سنة كاملة 📵', 'تعيش من غير أصحابك المقربين لمدة سنة 💔'],
  ['تقرأ أفكار الناس اللي حواليك 🧠', 'تتحكم في عقول الناس 🎮'],
  ['تكون أذكى إنسان في العالم 🎓', 'تكون أسعد إنسان في العالم 😊'],
];

export default [
  {
    name: 'صفعة',
    aliases: ['كف', 'قلم', 'slap'],
    desc: 'إعطاء كف مضحك لعضو في الجروب: /صفعة @شخص',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('↩️ منشن الشخص اللي يستاهل الكف!\nمثال: */صفعة @عضو*');
      if (numOf(target) === numOf(sender)) return reply('😅 هتضرب نفسك بالقلم ليه يا غالي؟ استهدى بالله!');
      await react('👋');
      const msg = rand(SLAP_TEXTS).replace('@TARGET', `@${numOf(target)}`);
      reply(`╭━━━〔 💥 *كف ثلاثي الأبعاد* 〕━━━╮\n│\n│ 👤 الفاعل: @${numOf(sender)}\n│ 🎯 الضحية: @${numOf(target)}\n│\n│ 🗯️ ${msg}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    },
  },

  {
    name: 'حضن',
    aliases: ['hug', 'احضن'],
    desc: 'إعطاء حضن دافئ وتفاعل لطيف لعضو: /حضن @شخص',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('↩️ منشن الشخص اللي عايز تحضنه!\nمثال: */حضن @عضو*');
      await react('🫂');
      const msg = rand(HUG_TEXTS).replace('@TARGET', `@${numOf(target)}`);
      reply(`╭━━━〔 🫂 *حضن المحبة* 〕━━━╮\n│\n│ 👤 من: @${numOf(sender)}\n│ 💖 إلى: @${numOf(target)}\n│\n│ 🌸 ${msg}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    },
  },

  {
    name: 'بوسة',
    aliases: ['kiss', 'بوس'],
    desc: 'إرسال قبلة لطيفة لعضو في الجروب: /بوسة @شخص',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('↩️ منشن الشخص!\nمثال: */بوسة @عضو*');
      await react('💋');
      const msg = rand(KISS_TEXTS).replace('@TARGET', `@${numOf(target)}`);
      reply(`╭━━━〔 💋 *قبلة لطيفة* 〕━━━╮\n│\n│ 👤 من: @${numOf(sender)}\n│ 🎯 إلى: @${numOf(target)}\n│\n│ ✨ ${msg}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    },
  },

  {
    name: 'قتل',
    aliases: ['kill', 'اغتيال', 'اعدام'],
    desc: 'اغتيال كوميدي لأحد أعضاء الجروب: /قتل @شخص',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('↩️ منشن العضو المستهدف بالاغتيال!\nمثال: */قتل @عضو*');
      if (numOf(target) === numOf(sender)) return reply('🤦‍♂️ الانتحار حرام يا صديقي، عيش واستمتع بالحياة!');
      await react('💀');
      const msg = rand(KILL_TEXTS).replace('@TARGET', `@${numOf(target)}`);
      reply(`╭━━━〔 💀 *عملية اغتيال سرية* 〕━━━╮\n│\n│ 🥷 القاتل المأجور: @${numOf(sender)}\n│ ⚰️ الضحية المرحوم: @${numOf(target)}\n│\n│ 🩸 ${msg}\n│ 💐 نتمنى له الجنة في العالم الآخر!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    },
  },

  {
    name: 'غمزة',
    aliases: ['wink', 'اغمز'],
    desc: 'غمزة شقاوة لعضو في الجروب',
    group: true,
    async run({ sender, target, reply, react }) {
      await react('😉');
      const to = target ? `@${numOf(target)}` : 'للجروب كله';
      reply(`😉 غمز @${numOf(sender)} لـ ${to} وقال: "إيه يا سيدي القمر، الجمال ده كله طالع لمين؟" ✨`, target ? [sender, target] : [sender]);
    },
  },

  {
    name: 'تطبيط',
    aliases: ['pat', 'طبطب'],
    desc: 'تطبيط ومواساة لعضو زعلان',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('منشن الشخص الزعلان تطبطب عليه!');
      await react('🥰');
      reply(`🥰 يطبطب @${numOf(sender)} على رأس @${numOf(target)} بحنية ويقول: "حقك عليا يا بطل، كله هيهون!" 🌸`, [sender, target]);
    },
  },

  {
    name: 'لوخيروك',
    aliases: ['wyr', 'لو_خيروك'],
    desc: 'سؤال لو خيروك محرج ومحير جداً',
    async run({ reply, react }) {
      await react('🤔');
      const [optA, optB] = rand(WYR_QUESTIONS);
      let t = `╭━━━〔 🤔 *تحدي لو خيّروك* 〕━━━╮\n│\n`;
      t += `│ لو خيّروك تختار إيه من دول:\n│\n`;
      t += `│ 🅰️ *[ ${optA} ]*\n│      أم\n│ 🅱️ *[ ${optB} ]*\n│\n`;
      t += `│ 💡 اكتب اختيارك في الشات وقول السبب!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    },
  },
];
