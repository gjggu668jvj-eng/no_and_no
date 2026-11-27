import { ask } from '../ai/old_ai.js';
import { save } from '../../lib/db.js';
import { money, numOf } from '../../lib/utils.js';

// In-memory state for marriages and active emoji movie games
const marriages = new Map(); // userId -> spouseId
const activeMovieGames = new Map(); // chatId -> { movie: string, rawName: string, emojis: string, hint: string, reward: number, timeout: NodeJS.Timeout }

// Egyptian & Arab movie emojis dataset
const MOVIES = [
  { emojis: '🥔 👑 🦁', name: 'اللمبي', hint: 'محمد سعد - أصل الكوميديا' },
  { emojis: '👨‍✈️ 🏝️ 🔫', name: 'الجزيرة', hint: 'أحمد السقا ومحمود ياسين' },
  { emojis: '🧟‍♂️ 🏛️ ⏳', name: 'الحرب العالمية الثالثة', hint: 'شيكو وهشام ماجد وفهمي' },
  { emojis: '🕶️ 🔪 🩸', name: 'ابراهيم الابيض', hint: 'أحمد السقا ومحمود عبد العزيز' },
  { emojis: '🎓 ⚽ 🤑', name: 'مرجان احمد مرجان', hint: 'عادل إمام' },
  { emojis: '🚗 🍜 🥊', name: 'فول الصين العظيم', hint: 'محمد هنيدي في الصين' },
  { emojis: '👰‍♀️ 🚢 🏴‍☠️', name: 'امير البحار', hint: 'محمد هنيدي وقراصنة البحر' },
  { emojis: '👨‍👩‍👧‍👦 👴 🇪🇬', name: 'عسل اسود', hint: 'أحمد حلمي راجع من أمريكا' },
  { emojis: '👮‍♂️ 🚔 💔', name: 'تيتو', hint: 'أحمد السقا وحنان ترك' },
  { emojis: '🧳 ✈️ 🍳', name: 'همام في امستردام', hint: 'محمد هنيدي وأحمد السقا' },
  { emojis: '🍳 👨‍🍳 🏛️', name: 'طباخ الريس', hint: 'طلعت زكريا وخالد زكي' },
  { emojis: '🏃‍♂️ 🔥 🚓', name: 'الهروب', hint: 'أحمد زكي والمطاردة' },
  { emojis: '🦁 👑 👶', name: 'الاسد الملك', hint: 'سيمبا وموفاسا' },
  { emojis: '🚢 🧊 💔', name: 'تايتانيك', hint: 'سفينة وجبل جليد' },
  { emojis: '🧙‍♂️ ⚡ 🦉', name: 'هاري بوتر', hint: 'عالم السحر' },
  { emojis: '🦇 🦸‍♂️ 🃏', name: 'باتمان', hint: 'فارس الظلام والجوكر' },
  { emojis: '🕷️ 🕸️ 🏙️', name: 'سبايدرمان', hint: 'الرجل العنكبوت' }
];

const CONFESSIONS = [
  'لو معاك مليون جنيه دلوقتي حالاً، أول حاجة هتشتريها إيه ومين أول شخص هتديله فلوس؟',
  'إيه أكتر موقف محرج حصلك في حياتك ولسه فاكره وبتتكسف منه لحد دلوقتي؟',
  'لو اضطريت تقول سر ميعرفوش عنك غير اتنين في الدنيا.. هتقول إيه؟',
  'مين في الجروب هنا تحس إنك مستحيل تخرج معاه لوحدك؟ وبدون مجاملة!',
  'لو خيروك ترجع بالزمن وتصلح غلطة واحدة بس عملتها، هتكون إيه؟',
  'إيه أغرب أو أسوأ صفة فيك ونفسك تتخلص منها بس مش عارف؟',
  'لو صحيت لقيت نفسك مختفي ومحدش شايفك لمدة 24 ساعة، هتعمل إيه؟',
  'مين أول شخص بتفكر فيه لما تكون مضايق أو في مشكلة؟',
  'إيه أكتر كدبة كدبتها على أهلك وعمرهم ما اكتشفوها لحد دلوقتي؟',
  'لو طلبوا منك تمسح رقم شخص من موبايلك للأبد، هيكون رقم مين؟'
];

export default [
  // 1. Marry Command
  {
    name: 'زواج_لعبة',
    aliases: ['party_marry', 'جواز_حفلة'],
    category: 'games',
    group: true,
    desc: 'طلب زواج من عضو في الجروب: /زواج @عضو',
    async run({ sender, target, reply, react }) {
      if (!target) {
        return reply('💍 منشن الشخص أو رد على رسالته عشان تطلب إيده للجواز!\nمثال: */زواج @عضو*');
      }

      if (target === sender) {
        return reply('😂 عايز تتجوز نفسك؟! النرجسية ملهاش حل عندك!');
      }

      const senderSpouse = marriages.get(sender);
      if (senderSpouse) {
        return reply(`⚠️ أنت متزوج بالفعل من @${numOf(senderSpouse)}! اطلب الطلاق الأول بـ */طلاق*.`, [senderSpouse]);
      }

      const targetSpouse = marriages.get(target);
      if (targetSpouse) {
        return reply(`💔 للأسف @${numOf(target)} متزوج بالفعل من @${numOf(targetSpouse)}!`, [target, targetSpouse]);
      }

      // Marry them!
      marriages.set(sender, target);
      marriages.set(target, sender);

      const contract =
`💒 ━━━〔 عقد قران رسمي 〕━━━ 💍
بارك الله لهما وجمع بينهما في خير! 🎉

🤵 *العريس / الشريك الأول:* @${numOf(sender)}
👰 *العروس / الشريك الثاني:* @${numOf(target)}

📜 *الشروط المتفق عليها:*
1. ممنوع الخيانة أو التكلم في الخاص مع حد تاني!
2. المصاريف والفلوس في البنك بالنص.
3. النكد متبادل بالتساوي 50/50.

مبروك للعروسين ولولولولولييييي! 🥳💃🕺
(لإنهاء العلاقة اكتب */طلاق*)`;

      await react('💍');
      reply(contract, [sender, target]);
    }
  },

  // 2. Divorce Command
  {
    name: 'طلاق_لعبة',
    aliases: ['party_divorce'],
    category: 'games',
    group: true,
    desc: 'إنهاء الزواج والطلاق في الجروب: /طلاق',
    async run({ sender, reply, react }) {
      const spouse = marriages.get(sender);

      if (!spouse) {
        return reply('🤷‍♂️ أنت مش متجوز أصلاً يا سينجل يا بائس!');
      }

      marriages.delete(sender);
      marriages.delete(spouse);

      const text =
`💔 ━━━〔 وثيقة الطلاق الرسمية 〕━━━ ⚖️
تم الانفصال والطلاق بين:
🥀 @${numOf(sender)}
🥀 @${numOf(spouse)}

يا ريت محدش يجيب سيرة التاني في الجروب، وكل واحد يشوف حاله! 🚪🏃‍♂️💨`;

      await react('💔');
      reply(text, [sender, spouse]);
    }
  },

  // 3. Spouse Status Command
  {
    name: 'شريكي',
    aliases: ['spouse', 'زوجي', 'زوجتي', 'حبيبي'],
    category: 'games',
    group: true,
    desc: 'معرفة مين شريك حياتك في الجروب',
    async run({ sender, reply }) {
      const spouse = marriages.get(sender);
      if (!spouse) {
        return reply('🥀 أنت لسه سينجل لحد دلوقتي، دور على نصك الحلو واكتب */زواج @عضو*!');
      }
      return reply(`❤️ أنت متزوج سعيد من: @${numOf(spouse)}`, [spouse]);
    }
  },

  // 4. Hot Seat / Confession Command
  {
    name: 'كرسي_الاعتراف',
    aliases: ['hotseat', 'اعتراف', 'الكرسي'],
    category: 'games',
    group: true,
    desc: 'توجيه سؤال اعتراف قوي لعضو عشوائي أو محدد: /كرسي_الاعتراف',
    async run({ sock, m, target: inputTarget, sender, reply, react }) {
      let chosen = inputTarget;

      if (!chosen) {
        try {
          const groupMetadata = await sock.groupMetadata(m.chat);
          const participants = groupMetadata.participants.map(p => p.id).filter(id => id !== sock.user.id);
          chosen = participants[Math.floor(Math.random() * participants.length)];
        } catch {
          chosen = sender;
        }
      }

      const q = CONFESSIONS[Math.floor(Math.random() * CONFESSIONS.length)];
      await react('🔥');

      const text =
`╭━━━〔 🔥 كرسي الاعتراف الصاعق 🔥 〕━━━╮
┃ 🎯 الضحية المختارة: @${numOf(chosen)}
┃
┃ ❓ *سؤالك الصعب هو:*
┃ "${q}"
╰━━━━━━━━━━━━━━━━━━━━╯
⚡ _ممنوع الهروب أو اللف والدوران.. مستنيين ردك هنا في الجروب حالا!_`;

      reply(text, [chosen]);
    }
  },

  // 5. Guess The Movie From Emojis
  {
    name: 'خمن_الفيلم',
    aliases: ['emojimovie', 'فيلم_ايموجي', 'فيلم'],
    category: 'games',
    group: true,
    desc: 'خمن اسم الفيلم المصري/العالمي من الإيموجيات واكسب 500 جنيه!',
    async run({ sock, m, reply, react }) {
      if (activeMovieGames.has(m.chat)) {
        const game = activeMovieGames.get(m.chat);
        return reply(`⚠️ فيه مسابقة شغالة بالفعل!\nالإيموجيات: ${game.emojis}\nاكتب: */جاوب_فيلم <اسم الفيلم>*`);
      }

      const movie = MOVIES[Math.floor(Math.random() * MOVIES.length)];
      const reward = 500;

      const timeout = setTimeout(async () => {
        if (activeMovieGames.has(m.chat)) {
          activeMovieGames.delete(m.chat);
          await sock.sendMessage(m.chat, {
            text: `⏰ انتهى الوقت ولم يعرف أحد الإجابة!\n🎬 كان الفيلم: *${movie.name}*`
          });
        }
      }, 60000); // 1 minute limit

      activeMovieGames.set(m.chat, {
        movie: movie.name.toLowerCase().replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه'),
        rawName: movie.name,
        emojis: movie.emojis,
        hint: movie.hint,
        reward,
        timeout
      });

      await react('🎬');
      const text =
`╭━━━〔 🎬 مسابقة خمن الفيلم 〕━━━╮
┃ 🎭 الإيموجيات: *${movie.emojis}*
┃ 💡 تلميح: _${movie.hint}_
┃ 💰 الجائزة: *${reward} ج.م* في المحفظة!
╰━━━━━━━━━━━━━━━━━━━━╯
👉 أسرع واحد يكتب:
*/جاوب_فيلم <اسم الفيلم>*
⏳ معاك دقيقة واحدة فقط!`;

      reply(text);
    }
  },

  // 6. Answer Guess The Movie
  {
    name: 'جاوب_فيلم',
    aliases: ['ansmovie', 'حل_فيلم'],
    category: 'games',
    group: true,
    desc: 'إجابة مسابقة خمن الفيلم الشغالة: /جاوب_فيلم <الاسم>',
    async run({ m, args, u, reply, react }) {
      if (!activeMovieGames.has(m.chat)) {
        return reply('❌ مفيش لعبة خمن الفيلم شغالة دلوقتي! اكتب */خمن_الفيلم* عشان تبدأ.');
      }

      const input = args.join(' ').trim().toLowerCase().replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه');
      if (!input) {
        return reply('📌 اكتب اسم الفيلم بعد الأمر، مثال: */جاوب_فيلم اللمبي*');
      }

      const game = activeMovieGames.get(m.chat);
      if (input === game.movie || input.includes(game.movie) || game.movie.includes(input)) {
        clearTimeout(game.timeout);
        activeMovieGames.delete(m.chat);

        u.money += game.reward;
        save();

        await react('🎉');
        const text =
`🎉🥳 *إجابة صحيحة يا بطل!*
🎬 اسم الفيلم هو: *${game.rawName}*
💰 مبروك كسبت *${game.reward} ج.م* تمت إضافتها لمحفظتك!
💳 رصيدك الحالي: *${money(u.money)}*`;

        reply(text);
      } else {
        await react('❌');
        reply('❌ إجابة خاطئة! حاول تاني قبل ما الوقت يخلص.');
      }
    }
  },

  // 7. Psychological Personality Roast / Analysis
  {
    name: 'تحليل_نفسي',
    aliases: ['psych', 'شخصيتي', 'حللني'],
    category: 'games',
    desc: 'تحليل شخصية كوميدي ودقيق بالذكاء الاصطناعي لأي عضو: /تحليل_نفسي @عضو',
    async run({ target, sender, args, reply, react }) {
      const chosen = target || sender;
      const targetTag = `@${numOf(chosen)}`;
      const context = args.join(' ').trim();

      try {
        await react('🧠');
        const system = 'أنت دكتور علم نفس وخبير لغة جسد مصري ساخر جداً ومحبوب. اكتب تحليلاً نفسياً كوميدياً ومضحكاً جداً عن الشخص المذكور بناء على طريقة كلامه بالجروب: 1- البرج الطاقي المزعوم، 2- نقطة ضعفه لما يعصب، 3- أكبر كدبة بيقولها لنفسه كل يوم، 4- نصيحة دكتور مجانين.';
        const prompt = `حلل شخصية العضو ${targetTag} ${context ? `مع العلم إنه قال: "${context}"` : ''}`;
        const aiResponse = await ask(system, prompt);

        const text =
`╭━━━〔 🧠 تقرير العيادة النفسية 〕━━━╮
┃ 👤 المفحوص: ${targetTag}
┃ 🩺 الطبيب المعالج: د. نو آند نو
╰━━━━━━━━━━━━━━━━━━━━╯\n\n${aiResponse}`;

        reply(text, [chosen]);
      } catch (err) {
        console.error('Psych error:', err);
        reply('⚠️ الدكتور في إجازة دلوقتي، جرب كمان شوية!');
      }
    }
  },

  // 8. Fake Tweet Generator
  {
    name: 'تغريدة',
    aliases: ['tweet', 'تويتة', 'تويتر'],
    category: 'tools',
    desc: 'توليد بطاقة تغريدة تويتر احترافية باسمك ونصك: /تغريدة النص',
    async run({ sock, m, args, reply, react }) {
      const text = args.join(' ').trim();
      if (!text) {
        return reply('🐦 اكتب نص التغريدة بعد الأمر:\nمثال: */تغريدة مساء الخير على أحسن ناس في الجروب*');
      }

      try {
        await react('⏳');
        const userName = m.pushName || 'User';
        const userHandle = (m.sender || '').split('@')[0].slice(-6);

        // High-definition Twitter card prompt
        const prompt = `A realistic elegant dark mode Twitter post screenshot, verified blue checkmark next to username "${userName}", handle "@user_${userHandle}", tweet body text "${text}", high resolution crisp typography, realistic UI with like and retweet counters.`;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=600&model=flux&nologo=true`;

        const res = await fetch(imageUrl);
        const buffer = Buffer.from(await res.arrayBuffer());

        await sock.sendMessage(m.chat, {
          image: buffer,
          caption: `🐦 *تغريدة رسمية من:* ${userName}\n💬 "${text}"`
        }, { quoted: m });
        await react('✅');
      } catch (err) {
        console.error('Tweet error:', err);
        reply('⚠️ تعذر توليد التغريدة حالياً.');
      }
    }
  }
];
