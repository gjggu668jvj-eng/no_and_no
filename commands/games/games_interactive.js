import { rand, randInt, numOf, money, fmtDur, bar } from '../../lib/utils.js';
import { save, cooldown } from '../../lib/db.js';
import { games } from '../../lib/state.js';

const WORDS_TO_UNSCRAMBLE = [
  'مستشفى', 'تليفزيون', 'كمبيوتر', 'إسكندرية', 'أهرامات',
  'ميكانيكي', 'فراولة', 'صيدلية', 'موسوعة', 'تلسكوب',
  'جامعة', 'مهندس', 'طائرة', 'غواصة', 'صاروخ'
];

const EMOJI_PUZZLES = [
  { emojis: '🦁 👑 🌴', answers: ['الاسد الملك', 'سمبا', 'الأسد الملك'] },
  { emojis: '🚢 🧊 🌊', answers: ['تيتانيك', 'تايتانك'] },
  { emojis: '🕷️ 🕸️ 🧑', answers: ['سبايدرمان', 'سبايدر مان', 'الرجل العنكبوت'] },
  { emojis: '🧙‍♂️ ⚡ 👓', answers: ['هاري بوتر'] },
  { emojis: '🐟 🔍 🌊', answers: ['البحث عن نيمو', 'نيمو'] },
  { emojis: '🦇 🌃 🚗', answers: ['باتمان', 'بات مان', 'فارس الظلام'] },
  { emojis: '🕌 🕋 🌴', answers: ['السعودية', 'مكة'] },
  { emojis: '🏛️ 🇪🇬 🐫', answers: ['مصر', 'الاهرامات', 'الأهرامات'] },
  { emojis: '🗼 🥖 🥐', answers: ['فرنسا', 'باريس'] },
  { emojis: '🍣 🗾 ⛩️', answers: ['اليابان', 'طوكيو'] },
  { emojis: '🍕 🍝 🏛️', answers: ['ايطاليا', 'إيطاليا', 'روما'] },
  { emojis: '🍫 🏭 👦', answers: ['تشارلي ومصنع الشوكولاتة', 'مصنع الشوكولاتة'] },
  { emojis: '🐼 🥋 🍜', answers: ['كونغ فو باندا', 'كونج فو باندا'] },
];

const TRUTH_QUESTIONS = [
  'ما هو أكثر سر تخفيه عن أهلك وأصدقائك؟',
  'من هو الشخص الذي لا تستطيع رفض أي طلب له؟',
  'ما هو أكبر موقف محرج تعرضت له في حياتك؟',
  'هل سبق وأن تظاهرت بالإعجاب بشخص وأنت لا تطيقه؟',
  'ما هي أكبر كذبة قلتها في حياتك وما زال الجميع يصدقها؟',
  'من هو الشخص في هذا الجروب الذي تتمنى مقابلته في الواقع؟',
  'ما هو الشيء الذي ندمت على فعله طوال حياتك؟',
];

const DARE_CHALLENGES = [
  'أرسل رسالة صوتية (فويس) تغني فيها مقطعاً من أغنية للجروب!',
  'ضع صورة مضحكة أو كرتونية كصورة بروفايلك لمدة نصف ساعة!',
  'أرسل رسالة لأول شخص في الشات الخاص عندك واكتب له: "أنا بحبك من زمان"!',
  'اكتب في نبذة حسابك (البايو): "أنا مجنون رسمي" لمدة ساعة كاملة!',
  'أرسل آخر صورة التقطتها بكاميرا هاتفك في الجروب فوراً!',
  'اكتب جملة مدح طويلة لأدمن الجروب دون استخدام حرف الألف!',
];

export default [
  {
    name: 'عجلة_الحظ',
    aliases: ['wheel', 'عجلة', 'دولاب'],
    desc: 'تدوير عجلة الحظ لكسب جوائز مالية ونقاط خبرة (كل 6 ساعات)',
    async run({ u, reply, react }) {
      const left = cooldown(u, 'lucky_wheel', 6 * 3600000);
      if (left) return reply(`⏳ عجلة الحظ قيد الانتظار! عُد بعد: *${fmtDur(left)}*`);
      await react('🎡');
      const PRIZES = [
        { label: '💰 500 كاش', money: 500, xp: 20 },
        { label: '💰 1,000 كاش', money: 1000, xp: 50 },
        { label: '🌟 100 XP خبرة', money: 100, xp: 100 },
        { label: '🔥 2,500 كاش كبرى!', money: 2500, xp: 150 },
        { label: '💎 5,000 الجائزة الذهبية!', money: 5000, xp: 300 },
        { label: '😢 حظ أوفر في المرة القادمة', money: 0, xp: 5 },
      ];
      const win = rand(PRIZES);
      u.money += win.money;
      u.xp += win.xp;
      save();
      reply(`╭━━━〔 🎡 *عجلة الحظ الكبرى* 〕━━━╮\n│\n│ 🎯 استقرت العجلة على:\n│ ✨ *${win.label}*\n│\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│ 🌟 خبرتك الآن: *${u.xp}* XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'تفكيك',
    aliases: ['unscramble', 'فكك'],
    desc: 'لعبة تفكيك الكلمة إلى حروف منفصلة',
    group: true,
    async run({ jid, reply, react }) {
      const word = rand(WORDS_TO_UNSCRAMBLE);
      const broken = word.split('').join(' ');
      games.set(jid, {
        type: 'trivia',
        answers: [broken, word.split('').join('-'), word.split('').join(',')],
        until: Date.now() + 60000,
        prize: randInt(150, 300),
      });
      await react('🧩');
      reply(`╭━━━〔 🧩 *لعبة تفكيك الكلمات* 〕━━━╮\n│\n│ 🔤 فكك الكلمة التالية بحروف مفصولة بمسافة:\n│ 👉 *[ ${word} ]*\n│\n│ 💡 اكتب الحروف مفصولة في الشات، مثال: "ك ت ا ب"\n│ 💰 الجائزة: *150 - 300* 💵\n│ ⏳ الوقت: دقيقة واحدة\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'خمن_الايموجي',
    aliases: ['guess_emoji', 'ايموجي', 'emoji'],
    desc: 'تخمين اسم فيلم أو دولة أو شخصية من الإيموجيز',
    group: true,
    async run({ jid, reply, react }) {
      const p = rand(EMOJI_PUZZLES);
      games.set(jid, {
        type: 'trivia',
        answers: p.answers,
        until: Date.now() + 90000,
        prize: randInt(200, 400),
      });
      await react('🤔');
      reply(`╭━━━〔 🎭 *خمن من الإيموجي* 〕━━━╮\n│\n│ ❓ ما هو العمل أو الدولة التي ترمز لها هذه الرموز:\n│ 👉 *[ ${p.emojis} ]*\n│\n│ 💡 اكتب الإجابة فوراً في الشات!\n│ 💰 الجائزة: *200 - 400* 💵\n│ ⏳ الوقت: دقيقة ونصف\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'حب',
    aliases: ['love', 'نسبة_الحب', 'توافق'],
    desc: 'قياس نسبة التوافق والحب بين شخصين في الجروب',
    group: true,
    async run({ sender, target, reply, react }) {
      if (!target) return reply('↩️ قم بالإشارة (منشن) للشخص الذي تريد قياس نسبة التوافق معه!\nمثال: */حب @شخص*');
      if (numOf(target) === numOf(sender)) return reply('❤️ حب النفس فضيلة! نسبتك مع نفسك 100% بلا شك! 😉');
      await react('💘');
      const s1 = parseInt(numOf(sender).slice(-4)) || 10;
      const s2 = parseInt(numOf(target).slice(-4)) || 20;
      const percent = Math.max(15, Math.min(100, ((s1 * 7 + s2 * 13) % 86) + 15));
      let comment = '';
      if (percent >= 90) comment = '💍 زواج حتمي وقصة حب أسطورية لا تتكرر!';
      else if (percent >= 75) comment = '💖 توافق عالي وتفاهم كبير جداً بينكما!';
      else if (percent >= 50) comment = '🤝 صداقة جميلة وممكن تتحول لحب مع الوقت!';
      else if (percent >= 30) comment = '🤔 محتاجين تفهموا بعض أكتر، الأمور متذبذبة.';
      else comment = '🏃‍♂️ اهرب بجلدك! علاقة توكسيك ومفيش أمل 😂';

      const progress = bar(percent, 100, 10);
      let t = `╭━━━〔 💘 *مقياس التوافق والحب* 〕━━━╮\n│\n`;
      t += `│ 👤 الأول: @${numOf(sender)}\n`;
      t += `│ 👤 الثاني: @${numOf(target)}\n│\n`;
      t += `│ 📊 النسبة: *${percent}%*\n`;
      t += `│    [${progress}]\n│\n`;
      t += `│ 💬 التقييم: *${comment}*\n│\n`;
      t += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, [sender, target]);
    },
  },

  {
    name: 'صراحة',
    aliases: ['truth', 'سؤال_محرج'],
    desc: 'سؤال صراحة شخصي وقوي ومحرج',
    async run({ reply, react }) {
      await react('🤐');
      reply(`╭━━━〔 🤐 *سؤال صراحة* 〕━━━╮\n\n❓ *${rand(TRUTH_QUESTIONS)}*\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'جرأة',
    aliases: ['dare', 'تحدي_جرأة'],
    desc: 'تحدي جرأة ناري للأقوياء فقط',
    async run({ reply, react }) {
      await react('🔥');
      reply(`╭━━━〔 🔥 *تحدي جرأة ناري* 〕━━━╮\n\n🎯 *${rand(DARE_CHALLENGES)}*\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'روليت',
    aliases: ['roulette', 'رصاصة'],
    desc: 'لعبة الروليت الروسية: جرب حظك مع المسدس (6 طلقات)',
    async run({ u, reply, react }) {
      await react('🔫');
      const chamber = randInt(1, 6);
      if (chamber === 6) {
        const loss = Math.min(u.money, 300);
        u.money -= loss;
        save();
        reply(`╭━━━〔 💥 *طااااخ!* 〕━━━╮\n│\n│ 💀 خرجت الرصاصة وأصابتك!\n│ 💸 دفعت تكاليف علاج بالمستشفى: *-${money(loss)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
      } else {
        const reward = 200;
        u.money += reward;
        save();
        reply(`╭━━━〔 🎯 *كلييييك!* 〕━━━╮\n│\n│ 😅 الحجرة كانت فارغة ونجوت بحياتك!\n│ 💰 مكافأة شجاعة: *+${money(reward)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
      }
    },
  },
];
