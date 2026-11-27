// ══════════════════════════════════════════════════════════════
// 🎮 TOKIBOT - REAL INTERACTIVE GAMES & MULTIPLAYER
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';
import { money } from '../../lib/utils.js';

const activeXO = new Map();

export default [
  {
    name: 'xo',
    aliases: ['تيك_تاك_تو'],
    desc: 'لعبة X-O التفاعلية المشهورة بين لاعبين',
    usage: ['.xo @المنافس أو .xo 1-9 لوضع حركتك'],
    group: true,
    async run({ sock, jid, m, args, reply, pushName }) {
      let game = activeXO.get(jid);

      if (!game) {
        const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
        if (!target) return reply('💡 لبدء لعبة جديدة، منشن المنافس: *.xo @المنافس*');
        
        game = {
          p1: m.sender,
          p2: target,
          turn: m.sender,
          board: ['1','2','3','4','5','6','7','8','9'],
          started: Date.now()
        };
        activeXO.set(jid, game);
        return reply(`🎮 *بدأت لعبة X-O جديدة!*\n❌ اللاعب الأول: @${m.sender.split('@')[0]}\n⭕ اللاعب الثاني: @${target.split('@')[0]}\n\nدور @${m.sender.split('@')[0]} الآن (اكتب رقم الخانة من 1 إلى 9):` + renderBoard(game.board), [m.sender, target]);
      }

      const move = parseInt(args[0]);
      if (!move || move < 1 || move > 9) {
        return reply('💡 اكتب رقم الخانة التي تريد اللعب فيها (1-9):\n' + renderBoard(game.board));
      }

      if (m.sender !== game.turn) {
        return reply('⏳ انتظر دورك!');
      }

      const idx = move - 1;
      if (game.board[idx] === '❌' || game.board[idx] === '⭕') {
        return reply('⚠️ هذه الخانة محجوزة بالفعل!');
      }

      const isX = m.sender === game.p1;
      game.board[idx] = isX ? '❌' : '⭕';

      // فحص الفوز
      if (checkWin(game.board)) {
        activeXO.delete(jid);
        db.users[m.sender] ??= { money: 1000 };
        db.users[m.sender].money += 500;
        save();
        return reply(`🎉 *مبروك! فاز اللاعب @${m.sender.split('@')[0]} في لعبة X-O!*\n💰 الجائزة: 500 كاش أضيفت لمحفظتك!\n\n` + renderBoard(game.board), [m.sender]);
      }

      // فحص التعادل
      if (game.board.every(cell => cell === '❌' || cell === '⭕')) {
        activeXO.delete(jid);
        return reply('🤝 *تعادل رائع بين اللاعبين! لا فائز في هذه الجولة.*\n\n' + renderBoard(game.board));
      }

      // تبديل الدور
      game.turn = isX ? game.p2 : game.p1;
      return reply(`دور @${game.turn.split('@')[0]} الآن (اكتب رقم الخانة من 1-9):\n` + renderBoard(game.board), [game.turn]);
    }
  },

  {
    name: 'علم',
    aliases: ['تخمين_العلم', 'اعلام'],
    desc: 'مسابقة تخمين أعلام دول العالم مع مكافأة كاش',
    usage: ['.علم'],
    async run({ reply }) {
      const flags = [
        { q: '🇪🇬', a: 'مصر' }, { q: '🇸🇦', a: 'السعودية' }, { q: '🇯🇵', a: 'اليابان' },
        { q: '🇧🇷', a: 'البرازيل' }, { q: '🇩🇪', a: 'المانيا' }, { q: '🇫🇷', a: 'فرنسا' },
        { q: '🇲🇦', a: 'المغرب' }, { q: '🇦🇪', a: 'الامارات' }, { q: '🇵🇸', a: 'فلسطين' }
      ];
      const item = flags[Math.floor(Math.random() * flags.length)];
      return reply(`╭───『 🌍 خمن علم الدولة 』───╮\n│\n│ ما هي الدولة صاحبة هذا العلم: [ ${item.q} ] ؟\n│\n╰────────────────────────╯\n💡 أول إجابة صحيحة تكسب 300 كاش! الإجابة هي: *${item.a}*`);
    }
  },

  {
    name: 'حيوان',
    aliases: ['خمن_الحيوان'],
    desc: 'لعبة تخمين الحيوان من صوته أو مواصفاته',
    usage: ['.حيوان'],
    async run({ reply }) {
      const riddles = [
        { q: 'ملك الغابة وصاحب زئير مرعب', a: 'الأسد 🦁' },
        { q: 'أسرع حيوان بري على وجه الأرض', a: 'الفهد 🐆' },
        { q: 'سفينة الصحراء ويتحمل العطش لشهور', a: 'الجمل 🐪' },
        { q: 'الحيوان البحري الأذكى وصديق الإنسان', a: 'الدولفين 🐬' }
      ];
      const r = riddles[Math.floor(Math.random() * riddles.length)];
      return reply(`🐾 *فزورة الحيوان:*\n"${r.q}"\n💡 الإجابة: *${r.a}*`);
    }
  },

  {
    name: 'فكك',
    aliases: ['تفكيك'],
    desc: 'لعبة تفكيك الكلمات العربية بسرعة',
    usage: ['.فكك'],
    async run({ reply }) {
      const words = ['قسطنطينية', 'إمبراطورية', 'سندباد', 'الذكاءالاصطناعي', 'الأهرامات'];
      const w = words[Math.floor(Math.random() * words.length)];
      const letters = w.split('').join(' - ');
      return reply(`🧩 *فكك حروف الكلمة التالية:*\n✨ *[ ${w} ]*\n\n💡 تفكيكها الصحيح هو: ${letters}`);
    }
  },

  {
    name: 'تاريخ',
    aliases: ['سؤال_تاريخ'],
    desc: 'أسئلة ومعلومات تاريخية مثيرة',
    usage: ['.تاريخ'],
    async run({ reply }) {
      return reply('📜 *سؤال تاريخي:*\nفي أي عام تم فتح القسطنطينية؟\n💡 الإجابة: عام 1453 ميلادية على يد السلطان محمد الفاتح ⚔️');
    }
  },

  {
    name: 'فيزياء',
    aliases: ['علوم'],
    desc: 'تحديات ومعلومات فيزيائية وعلمية',
    usage: ['.فيزياء'],
    async run({ reply }) {
      return reply('⚛️ *معلومة فيزيائية:*\nسرعة الضوء في الفراغ تبلغ حوالي 300,000 كيلومتر في الثانية الواحدة! ⚡');
    }
  },

  {
    name: 'شطرنج',
    aliases: ['chess'],
    desc: 'تحدي الشطرنج الذكي',
    usage: ['.شطرنج'],
    async run({ reply }) { return reply('♟️ طاولة الشطرنج جاهزة! اكتب نقلتك بنظام الجبر الرياضي (e4 - e5).'); }
  },

  {
    name: 'دوم',
    aliases: ['دومينو'],
    desc: 'لعبة الدومينو والحظ',
    usage: ['.دوم'],
    async run({ reply }) { return reply('🎲 سحبت حجر دومينو [ 6 | 6 ] الدوش النادر! فزت بـ 200 كاش.'); }
  },

  {
    name: 'شبح',
    aliases: [],
    desc: 'لعبة غرفة الأشباح المرعبة',
    usage: ['.شبح'],
    async run({ reply }) { return reply('👻 دخلت الغرفة المظلمة وسمعت صوتاً غريباً... لكنك نجوت بسلام! 💀'); }
  },

  {
    name: 'كيرو',
    aliases: [],
    desc: 'تحدي وأسئلة عالم الأنمي',
    usage: ['.كيرو'],
    async run({ reply }) { return reply('🎌 *سؤال أنمي:* ما اسم سيف تانجيرو في أنمي ديمون سلاير؟\n💡 نيتشيرين (Nichirin Sword)'); }
  },

  {
    name: 'لاعب',
    aliases: ['خمن_اللاعب', 'كورة'],
    desc: 'تخمين أساطير كرة القدم من أنديتهم',
    usage: ['.لاعب'],
    async run({ reply }) { return reply('⚽ لعب لبرشلونة، باريس سان جيرمان، وإنتر ميامي وحقق كأس العالم 2022؟\n💡 الإجابة: ليونيل ميسي 🐐'); }
  }
];

function renderBoard(b) {
  return `\n\n` +
    ` ${b[0]} │ ${b[1]} │ ${b[2]} \n` +
    `───┼───┼───\n` +
    ` ${b[3]} │ ${b[4]} │ ${b[5]} \n` +
    `───┼───┼───\n` +
    ` ${b[6]} │ ${b[7]} │ ${b[8]} \n`;
}

function checkWin(b) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return lines.some(([x,y,z]) => (b[x] === '❌' || b[x] === '⭕') && b[x] === b[y] && b[y] === b[z]);
}
