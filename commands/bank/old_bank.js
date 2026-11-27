import { db, save, cooldown } from '../../lib/db.js';
import { user } from '../../lib/db.js';
import { rand, randInt, money, fmtDur, numOf } from '../../lib/utils.js';

const ITEMS = {
  'صنارة': { price: 300, emoji: '🎣', desc: 'تضاعف أرباح الصيد البحري' },
  'معول': { price: 400, emoji: '⛏️', desc: 'تضاعف أرباح التعدين' },
  'درع': { price: 500, emoji: '🛡️', desc: 'يصد محاولة سرقة واحدة بالكامل' },
  'ماسة': { price: 2000, emoji: '💎', desc: 'جوهرة ثمينة للتجميع والفخر' },
  'بيت': { price: 10000, emoji: '🏠', desc: 'عقار فاخر يرفع مكانتك وهيبتك' },
};
const JOBS = ['مبرمج محترف', 'سائق تاكسي', 'مهندس معماري', 'مصمم جرافيك', 'طباخ ماهر', 'معلم', 'ميكانيكي سيارات', 'كاتب سيناريو'];
const FISH = ['🐟 سمكة بلطي', '🐠 سمكة زينة ملونة', '🦐 جمبري طازج', '🦑 حبّار عملاق', '🐡 سمكة منتفخة نادرة'];
const ORES = ['🪨 حجر عادي', '🥉 خام نحاس', '🥈 سبيكة فضة', '🥇 قطعة ذهب خالص'];
const SLOTS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];

function amt(str, max) {
  if (['الكل', 'all'].includes(String(str || '').toLowerCase())) return max;
  const n = parseInt(str);
  return n > 0 ? n : 0;
}

const wait = (reply, ms) => reply(`⏳ *يرجى الانتظار:*\nمتبقي: *${fmtDur(ms)}* قبل تكرار هذه العملية.`);

export default [
  { name: 'رصيد', aliases: ['balance', 'bal', 'فلوسي'], desc: 'عرض رصيدك في المحفظة والبنك',
    async run({ u, target, sender, reply }) {
      const who = target || sender;
      const x = target ? user(target) : u;
      const total = x.money + x.bank;
      reply(`╭━━━〔 💳 *كشف الحساب المالي* 〕━━━╮\n│\n│ 👤 العميل: @${numOf(who)}\n│ 👛 في المحفظة: *${money(x.money)}* 💵\n│ 🏦 في البنك: *${money(x.bank)}* 🪙\n│ ───────────────────\n│ 💰 الإجمالي: *${money(total)}* EGP\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [who]);
    } },

  { name: 'يومي', aliases: ['daily'], desc: 'المكافأة اليومية المجانية',
    async run({ u, reply }) {
      const left = cooldown(u, 'daily', 86400000);
      if (left) return wait(reply, left);
      const r = randInt(250, 600);
      u.money += r;
      save();
      reply(`╭━━━〔 🎁 *المكافأة اليومية* 〕━━━╮\n│\n│ 🎉 مبروك! استلمت اليوم: *+${money(r)}* 💵\n│ 👛 رصيدك في المحفظة: *${money(u.money)}* 💵\n│ ⏰ عُد غداً للحصول على مكافأة جديدة!\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'اسبوعي', aliases: ['weekly'], desc: 'المكافأة الأسبوعية الضخمة',
    async run({ u, reply }) {
      const left = cooldown(u, 'weekly', 7 * 86400000);
      if (left) return wait(reply, left);
      const r = randInt(2000, 4000);
      u.money += r;
      save();
      reply(`╭━━━〔 👑 *المكافأة الأسبوعية* 〕━━━╮\n│\n│ 🌟 مكافأة ولاء ضخمة: *+${money(r)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'عمل', aliases: ['work'], desc: 'اشتغل واكسب فلوس (كل ساعة)',
    async run({ u, reply }) {
      const left = cooldown(u, 'work', 3600000);
      if (left) return wait(reply, left);
      const r = randInt(80, 250);
      const j = rand(JOBS);
      u.money += r;
      save();
      reply(`╭━━━〔 👷 *إتمام مهمة عمل* 〕━━━╮\n│\n│ 💼 عملت اليوم كـ: *${j}*\n│ 💵 العائد المكتسب: *+${money(r)}* 💵\n│ 👛 رصيدك: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'صيد', aliases: ['fish'], desc: 'اصطاد سمك وبعه (كل 30 دقيقة)',
    async run({ u, reply }) {
      const left = cooldown(u, 'fish', 1800000);
      if (left) return wait(reply, left);
      let r = randInt(40, 180);
      const hasRod = (u.inv['صنارة'] || 0) > 0;
      if (hasRod) r *= 2;
      u.money += r;
      save();
      reply(`╭━━━〔 🎣 *رحلة صيد بحري* 〕━━━╮\n│\n│ 🐟 الصيد: *${rand(FISH)}*\n│ 💵 تم البيع مقابل: *+${money(r)}* 💵${hasRod ? '\n│ 🎣 (صنارتك المحترفة ضاعفت الربح!)' : ''}\n│ 👛 محفظتك: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'تعدين', aliases: ['mine'], desc: 'نقّب عن معادن نفيسة (كل 45 دقيقة)',
    async run({ u, reply }) {
      const left = cooldown(u, 'mine', 2700000);
      if (left) return wait(reply, left);
      let r = randInt(60, 300);
      const hasPick = (u.inv['معول'] || 0) > 0;
      if (hasPick) r *= 2;
      u.money += r;
      save();
      reply(`╭━━━〔 ⛏️ *عمليات التعدين* 〕━━━╮\n│\n│ 🪨 النتيجة: *${rand(ORES)}*\n│ 💵 قيمة البيع: *+${money(r)}* 💵${hasPick ? '\n│ ⛏️ (المعول ضاعف أرباحك!)' : ''}\n│ 👛 محفظتك: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'ايداع', aliases: ['deposit', 'dep'], desc: 'ايداع فلوس في البنك: /ايداع 500 أو الكل',
    async run({ u, args, reply }) {
      const n = amt(args[0], u.money);
      if (!n || n <= 0) return reply('💡 اكتب المبلغ المطلوب إيداعه.\nمثال: */ايداع 500* أو */ايداع الكل*');
      if (n > u.money) return reply(`❌ رصيد محفظتك غير كافٍ (معك: *${money(u.money)}* 💵).`);
      u.money -= n;
      u.bank += n;
      save();
      reply(`╭━━━〔 🏦 *إيداع بنكي ناجح* 〕━━━╮\n│\n│ 📥 المبلغ المودع: *${money(n)}* 💵\n│ 👛 المحفظة المتبقية: *${money(u.money)}* 💵\n│ 🏦 رصيد البنك: *${money(u.bank)}* 🪙\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'سحب', aliases: ['withdraw'], desc: 'سحب فلوس من البنك لمحفظتك',
    async run({ u, args, reply }) {
      const n = amt(args[0], u.bank);
      if (!n || n <= 0) return reply('💡 اكتب المبلغ المطلوب سحبه.\nمثال: */سحب 500* أو */سحب الكل*');
      if (n > u.bank) return reply(`❌ رصيدك في البنك غير كافٍ (رصيدك البنكي: *${money(u.bank)}* 🪙).`);
      u.bank -= n;
      u.money += n;
      save();
      reply(`╭━━━〔 🏧 *سحب نقدي ناجح* 〕━━━╮\n│\n│ 📤 المبلغ المسحوب: *${money(n)}* 💵\n│ 👛 المحفظة الآن: *${money(u.money)}* 💵\n│ 🏦 رصيد البنك المتبقي: *${money(u.bank)}* 🪙\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'تحويل_فلوس', aliases: ['transfer', 'pay'], desc: 'تحويل فلوس لعضو: /تحويل_فلوس @user 500',
    async run({ u, sender, target, rest, reply }) {
      if (!target) return reply('💡 طريقة التحويل:\n*/تحويل_فلوس @عضو <المبلغ>*\nمثال: */تحويل_فلوس @user 500*');
      if (numOf(target) === numOf(sender)) return reply('😅 لا يمكنك تحويل الأموال لنفسك.');
      const n = amt(rest[0], u.money);
      if (!n || n <= 0) return reply('اكتب المبلغ المراد تحويله.');
      if (n > u.money) return reply(`❌ رصيد محفظتك لا يكفي (معك: *${money(u.money)}* 💵).`);
      u.money -= n;
      user(target).money += n;
      save();
      reply(`╭━━━〔 💸 *تحويل مالي ناجح* 〕━━━╮\n│\n│ 📤 المحوّل: @${numOf(sender)}\n│ 📥 المستلم: @${numOf(target)}\n│ 💰 المبلغ: *${money(n)}* 💵\n│ 👛 رصيدك المتبقي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    } },

  { name: 'سرقة', aliases: ['rob'], desc: 'حاول تسرق عضو (كل ساعة، فيها مخاطرة!)', group: true,
    async run({ u, sender, target, reply }) {
      if (!target) return reply('↩️ منشن العضو المستهدف بالسرقة.');
      if (numOf(target) === numOf(sender)) return reply('😅 لا يمكنك سرقة نفسك.');
      const t = user(target);
      if (t.money < 100) return reply('😢 هذا العضو لا يمتلك ما يكفي من المال للسرقة (أقل من 100 💵).');
      const left = cooldown(u, 'rob', 3600000);
      if (left) return wait(reply, left);

      // فحص وثيقة التأمين أولاً
      if (t.insurance && t.insurance > Date.now()) {
        return reply(`🛡️ فشلت السرقة! @${numOf(target)} يمتلك وثيقة تأمين مصرفية سارية المفعول تحميه بالكامل!`, [target]);
      }

      // فحص الدرع ثانياً
      if ((t.inv['درع'] || 0) > 0) {
        t.inv['درع']--;
        save();
        return reply(`🛡️ تصدى @${numOf(target)} لمحاولتك! الدرع الخاص به تحطم وحمى أمواله!`, [target]);
      }

      if (Math.random() < 0.45) {
        const s = Math.min(5000, Math.floor(t.money * randInt(15, 35) / 100));
        t.money -= s;
        u.money += s;
        save();
        return reply(`╭━━━〔 🥷 *عملية سرقة ناجحة!* 〕━━━╮\n│\n│ 😈 اللص: @${numOf(sender)}\n│ 🎯 الضحية: @${numOf(target)}\n│ 💰 الغنيمة: *+${money(s)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
      }

      const fine = Math.min(u.money, 200);
      u.money -= fine;
      save();
      reply(`╭━━━〔 🚔 *تم القبض عليك!* 〕━━━╮\n│\n│ 👮 أمسكت بك الشرطة متلبساً!\n│ 💸 تم تغريمك: *-${money(fine)}* 💵\n│ 👛 رصيدك الحالي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'قمار', aliases: ['gamble', 'bet'], desc: 'راهن بفلوسك (فرصة 45%)',
    async run({ u, args, reply }) {
      const n = amt(args[0], u.money);
      if (!n || n < 10) return reply('💡 اكتب مبلغ الرهان (10 💵 على الأقل).\nمثال: */قمار 200*');
      if (n > u.money) return reply(`❌ رصيد محفظتك لا يكفي (معك: *${money(u.money)}* 💵).`);
      if (Math.random() < 0.45) {
        u.money += n;
        save();
        return reply(`╭━━━〔 🎲 *فوز بالرهان!* 〕━━━╮\n│\n│ 🎉 مبروك! ضاعفت رهانك: *+${money(n)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
      }
      u.money -= n;
      save();
      reply(`╭━━━〔 💸 *خسارة بالرهان!* 〕━━━╮\n│\n│ 😢 خسرت رهانك بمبلغ: *-${money(n)}* 💵\n│ 👛 رصيدك المتبقي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'سلوت', aliases: ['slots'], desc: 'ماكينة الحظ: /سلوت 100',
    async run({ u, args, reply }) {
      const n = amt(args[0], u.money);
      if (!n || n < 10) return reply('💡 اكتب مبلغ الدخول في ماكينة السلوت.\nمثال: */سلوت 100*');
      if (n > u.money) return reply(`❌ ليس معك هذا المبلغ (معك: *${money(u.money)}* 💵).`);

      const r = [rand(SLOTS), rand(SLOTS), rand(SLOTS)];
      const same = new Set(r).size;
      let mult = 0;
      if (same === 1) mult = 5;
      else if (same === 2) mult = 1.5;

      const win = Math.floor(n * mult) - n;
      u.money += win;
      save();

      let resMsg = mult > 0 ? `🎉 ربحت معنا: *+${money(win)}* 💵 (مضاعف x${mult})` : `💸 لم يحالفك الحظ، خسرت *${money(n)}* 💵`;
      reply(`╭━━━〔 🎰 *ماكينة السلوت* 〕━━━╮\n│\n│ [ ${r.join('  |  ')} ]\n│\n│ ${resMsg}\n│ 👛 رصيدك الحالي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'الاغنياء', aliases: ['richest', 'baltop'], desc: 'قائمة أغنى 10 أعضاء في البوت',
    async run({ reply }) {
      const top = Object.entries(db.users)
        .sort((a, b) => (b[1].money + b[1].bank) - (a[1].money + a[1].bank))
        .slice(0, 10);
      if (!top.length) return reply('لسه مفيش بيانات مسجلة.');
      const medals = ['🥇', '🥈', '🥉'];
      let msg = `╭━━━〔 💎 *أثرياء البوت (TOP 10)* 〕━━━╮\n│\n`;
      msg += top.map(([k, u], i) => `│ ${medals[i] || '▫️'} @${k} ── *${money(u.money + u.bank)}* EGP`).join('\n');
      msg += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(msg, top.map(([k]) => k + '@s.whatsapp.net'));
    } },

  { name: 'متجر', aliases: ['shop', 'store'], desc: 'عرض المتجر وشراء الأغراض',
    async run({ reply }) {
      let t = `╭━━━〔 🏪 *متجر الأغراض والمعدات* 〕━━━╮\n│\n`;
      t += Object.entries(ITEMS).map(([n, i]) => `│ ${i.emoji} *${n}* ── *${money(i.price)}* 💵\n│    ↳ ${i.desc}`).join('\n│\n');
      t += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 للشراء اكتب: */شراء <اسم الغرض> [العدد]*\nمثال: */شراء صنارة*`;
      reply(t);
    } },

  { name: 'شراء', aliases: ['buy'], desc: 'شراء غرض من المتجر: /شراء صنارة',
    async run({ u, args, reply }) {
      const name = args[0];
      const item = ITEMS[name];
      if (!item) return reply('❌ غرض غير موجود بالمتجر. تصفح الأغراض بـ */متجر*');
      const q = Math.min(50, Math.max(1, parseInt(args[1]) || 1));
      const cost = item.price * q;
      if (u.money < cost) {
        return reply(`❌ لا تمتلك المبلغ الكافي (*${money(cost)}* 💵)، ومعك: *${money(u.money)}* 💵.`);
      }
      u.money -= cost;
      u.inv[name] = (u.inv[name] || 0) + q;
      save();
      reply(`╭━━━〔 🛍️ *فاتورة شراء ناجحة* 〕━━━╮\n│\n│ ✅ تم شراء: *${q}* × ${item.emoji} (*${name}*)\n│ 💰 الإجمالي المدفوع: *${money(cost)}* 💵\n│ 👛 المتبقي بمحفظتك: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'حقيبة', aliases: ['inventory', 'inv'], desc: 'عرض الأغراض والمعدات التي تمتلكها',
    async run({ u, reply }) {
      const e = Object.entries(u.inv || {}).filter(([, n]) => n > 0);
      if (!e.length) {
        return reply('🎒 حقيبتك فارغة حالياً.\nتصفح المتجر واشترِ معدات بـ */متجر*');
      }
      let t = `╭━━━〔 🎒 *حقيبة مقتنياتك* 〕━━━╮\n│\n`;
      t += e.map(([n, c]) => `│ ${ITEMS[n]?.emoji || '▫️'} *${n}* × ${c} قطعة`).join('\n');
      t += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },
];
