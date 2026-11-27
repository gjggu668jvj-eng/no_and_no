import { user, save, cooldown } from '../../lib/db.js';
import { rand, randInt, money, numOf, fmtDur } from '../../lib/utils.js';

const auctions = new Map(); // jid -> { item, price, highBidder, until }
const pools = new Map();    // jid -> { bets:Map(jid->amount), until }

const TIERS = [
  { min: 0, name: 'مبتدئ', emoji: '🔘' },
  { min: 2000, name: 'برونزي', emoji: '🥉' },
  { min: 10000, name: 'فضي', emoji: '🥈' },
  { min: 50000, name: 'ذهبي', emoji: '🥇' },
  { min: 200000, name: 'ماسي', emoji: '💎' },
  { min: 1000000, name: 'أسطوري', emoji: '👑' },
];
const tierOf = total => [...TIERS].reverse().find(t => total >= t.min);

const INVEST_PLANS = {
  قصير: { ms: 10 * 60000, min: -10, max: 30, label: '10 دقائق' },
  متوسط: { ms: 60 * 60000, min: -20, max: 60, label: 'ساعة واحدة' },
  طويل: { ms: 6 * 3600000, min: -35, max: 120, label: '6 ساعات' },
};
const LOAN_LIMIT = u => 500 + u.level * 300;
const LOAN_INTEREST = 0.2;
const LOAN_MS = 24 * 3600000;

export default [
  { name: 'استثمار', aliases: ['invest'], desc: 'استثمر أموالك: /استثمار 500 متوسط', 
    async run({ u, args, reply }) {
      if (u.invest) return reply('ℹ️ لديك استثمار نشط بالفعل. تفقده أو اجمعه بـ */جمع_الاستثمار*');
      const n = parseInt(args[0]);
      const plan = INVEST_PLANS[args[1]];
      if (!n || !plan) {
        return reply(`╭━━━〔 📈 *خطط الاستثمار* 〕━━━╮\n│\n│ ▫️ قصير: 10 دقائق (-10% إلى +30%)\n│ ▫️ متوسط: ساعة واحدة (-20% إلى +60%)\n│ ▫️ طويل: 6 ساعات (-35% إلى +120%)\n│\n│ 💡 مثال: */استثمار 500 متوسط*\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      }
      if (n > u.money) return reply(`❌ رصيدك الحالي لا يكفي (${money(u.money)} 💵).`);
      u.money -= n;
      u.invest = { amount: n, plan: args[1], due: Date.now() + plan.ms };
      save();
      reply(`╭━━━〔 📈 *بدء استثمار جديد* 〕━━━╮\n│\n│ 💰 المبلغ: *${money(n)}* 💵\n│ 📊 الخطة: *${args[1]}* (${plan.label})\n│ ⏱️ يمكنك الجمع بعد انتهاء المدة\n│ ▫️ الأمر: */جمع_الاستثمار*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'جمع_الاستثمار', aliases: ['collectinvest'], desc: 'جمع أرباح/خسائر الاستثمار',
    async run({ u, reply }) {
      if (!u.invest) return reply('ℹ️ ليس لديك استثمار نشط حالياً. ابدأ بـ */استثمار*');
      if (u.invest.due > Date.now()) {
        return reply(`⏳ ما زال الاستثمار قيد التشغيل!\n⏱️ متبقي: *${fmtDur(u.invest.due - Date.now())}*`);
      }
      const plan = INVEST_PLANS[u.invest.plan] || INVEST_PLANS['متوسط'];
      const pct = randInt(plan.min, plan.max);
      const profit = Math.round(u.invest.amount * pct / 100);
      const back = u.invest.amount + profit;
      u.money += Math.max(0, back);
      u.invest = null;
      save();
      if (pct >= 0) {
        reply(`╭━━━〔 📈 *نتائج الاستثمار - أرباح!* 〕━━━╮\n│\n│ 🎉 مبروك! حقق استثمارك ربحاً بنسبة *+${pct}%*\n│ 💵 العائد الإجمالي: *${money(back)}*\n│ 💰 صافي الربح: *+${money(profit)}*\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      } else {
        reply(`╭━━━〔 📉 *نتائج الاستثمار - خسارة* 〕━━━╮\n│\n│ ⚠️ لسوء الحظ تراجع السوق بنسبة *${pct}%*\n│ 💵 العائد المسترد: *${money(Math.max(0, back))}*\n│ 💸 الخسارة: *${money(Math.abs(profit))}*\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      }
    } },

  { name: 'قرض', aliases: ['loan'], desc: 'اقترض فلوس من البنك (فايدة 20%، يترد خلال 24 ساعة)',
    async run({ u, args, reply }) {
      if (u.loan) return reply(`ℹ️ لديك قرض نشط بمبلغ *${money(u.loan.amount)}* 💵.\nسدده بـ */سداد_القرض*`);
      const n = parseInt(args[0]);
      const limit = LOAN_LIMIT(u);
      if (!n || n <= 0) return reply(`اكتب مبلغ القرض المطلوب.\n💳 الحد الأقصى المتاح لك: *${money(limit)}* 💵\n💡 مثال: */قرض 500*`);
      if (n > limit) return reply(`❌ الحد الأقصى لقرضك الحالي هو: *${money(limit)}* 💵 (يزيد مع زيادة مستواك).`);
      u.money += n;
      u.loan = { amount: Math.round(n * (1 + LOAN_INTEREST)), due: Date.now() + LOAN_MS };
      save();
      reply(`╭━━━〔 🏦 *تم منح القرض بنجاح* 〕━━━╮\n│\n│ 💵 المبلغ المستلم: *+${money(n)}* 💵\n│ 📌 المطلوب سداده: *${money(u.loan.amount)}* 💵\n│ ⏱️ مهلة السداد: 24 ساعة (فائدة 20%)\n│ 👛 رصيدك الحالي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'سداد_القرض', aliases: ['payloan'], desc: 'سداد القرض',
    async run({ u, reply }) {
      if (!u.loan) return reply('✅ ليس عليك أي قروض حالياً.');
      if (u.money < u.loan.amount) return reply(`❌ رصيدك غير كافٍ. المطلوب: *${money(u.loan.amount)}* 💵، ومعك: *${money(u.money)}* 💵.`);
      u.money -= u.loan.amount;
      u.loan = null;
      save();
      reply(`╭━━━〔 🏦 *تم سداد القرض بالكامل* 〕━━━╮\n│\n│ ✅ تم إبراء ذمتك المالية لدى البنك.\n│ 👛 رصيدك المتبقي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'قرضي', aliases: ['myloan'], desc: 'حالة قرضك الحالي',
    async run({ u, reply }) {
      if (!u.loan) return reply('✅ ليس عليك أي قروض مسجلة.');
      const left = u.loan.due - Date.now();
      reply(`╭━━━〔 🏦 *بيانات القرض النشط* 〕━━━╮\n│\n│ 💰 المبلغ المطلوب: *${money(u.loan.amount)}* 💵\n│ ⏱️ الحالة: ${left > 0 ? `متبقي *${fmtDur(left)}* للسداد` : '⚠️ *انتهت المهلة! يرجى السداد فورا*'}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'رتبتي', aliases: ['vip', 'rank2'], desc: 'رتبتك حسب إجمالي ثروتك',
    async run({ u, target, reply }) {
      const x = target ? user(target) : u;
      const total = x.money + x.bank;
      const t = tierOf(total);
      const next = TIERS[TIERS.indexOf(t) + 1];
      let msg = `╭━━━〔 🏆 *تصنيف الثروة* 〕━━━╮\n│\n`;
      msg += `│ ${t.emoji} الرتبة: *${t.name}*\n`;
      msg += `│ 💰 إجمالي الثروة: *${money(total)}* 💵\n`;
      if (next) {
        msg += `│ 📊 تحتاج لـ *${money(next.min - total)}* 💵 للوصول لـ ${next.emoji} *${next.name}*\n`;
      } else {
        msg += `│ 👑 مبروك! أنت في أعلى رتبة أسطورية!\n`;
      }
      msg += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(msg);
    } },

  { name: 'مزاد', aliases: ['auction'], desc: 'ابدأ مزاد: /مزاد اسم_الغرض 100 5 (دقايق)', group: true, admin: true,
    async run({ jid, args, reply }) {
      if (auctions.has(jid)) return reply('ℹ️ يوجد مزاد نشط بالفعل في هذه المجموعة.');
      const mins = parseInt(args.at(-1));
      const price = parseInt(args.at(-2));
      const item = args.slice(0, -2).join(' ');
      if (!item || !price || !mins) return reply('💡 طريقة الاستخدام:\n*/مزاد <اسم الغرض> <السعر الابتدائي> <المدة بالدقائق>*\nمثال: */مزاد درع_نادر 500 3*');
      
      auctions.set(jid, { item, price, highBidder: null, until: Date.now() + mins * 60000 });
      await reply(`╭━━━〔 🔨 *مزاد علني جديد!* 〕━━━╮\n│\n│ 🎁 الغرض المعروض: *${item}*\n│ 💰 السعر الافتتاحي: *${money(price)}* 💵\n│ ⏱️ المدة: *${mins}* دقيقة\n│\n│ 📢 للمزايدة اكتب:\n│ */مزايدة <المبلغ>*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);

      setTimeout(() => {
        const a = auctions.get(jid);
        if (!a) return;
        auctions.delete(jid);
        if (!a.highBidder) {
          return reply(`🔨 انتهى وقت المزاد على "*${a.item}*" دون أي مزايدات.`);
        }
        const w = user(a.highBidder);
        if (w.money >= a.price) {
          w.money -= a.price;
          w.inv[a.item] = (w.inv[a.item] || 0) + 1;
          save();
          reply(`╭━━━〔 🔨 *انتهى المزاد بنجاح!* 〕━━━╮\n│\n│ 🏆 الفائز: @${numOf(a.highBidder)}\n│ 🎁 الغرض: *${a.item}*\n│ 💰 السعر النهائي: *${money(a.price)}* 💵\n│ 💳 تم خصم المبلغ وتسليم الغرض لحقيبته.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [a.highBidder]);
        } else {
          reply(`🔨 *فشل إتمام المزاد!*\n⚠️ الفائز @${numOf(a.highBidder)} لا يمتلك المبلغ الكافي (${money(a.price)} 💵) في محفظته! تم إلغاء البيع.`, [a.highBidder]);
        }
      }, mins * 60000);
    } },

  { name: 'مزايدة', aliases: ['bid'], desc: 'زايد في المزاد الحالي', group: true,
    async run({ jid, sender, u, args, reply }) {
      const a = auctions.get(jid);
      if (!a || a.until < Date.now()) return reply('ℹ️ لا يوجد مزاد نشط حالياً.');
      const n = parseInt(args[0]);
      if (!n || n <= a.price) return reply(`اكتب مبلغاً أعلى من السعر الحالي (*${money(a.price)}* 💵).`);
      if (n > u.money) return reply(`❌ ليس معك هذا المبلغ في محفظتك (معك: *${money(u.money)}* 💵).`);
      a.price = n;
      a.highBidder = sender;
      reply(`╭━━━〔 🔨 *مزايدة جديدة!* 〕━━━╮\n│\n│ 👤 المزايد: @${numOf(sender)}\n│ 💰 المبلغ الجديد: *${money(n)}* 💵\n│ 🎁 الغرض: *${a.item}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender]);
    } },

  { name: 'رهان_جماعي', aliases: ['pool'], desc: 'رهان جماعي: كل اللي يشارك يدخل في سحب على المجموع', group: true,
    async run({ jid, reply }) {
      if (pools.has(jid)) return reply('ℹ️ يوجد رهان جماعي نشط حالياً. انضم بـ */انضم <مبلغ>*');
      pools.set(jid, { bets: new Map(), until: Date.now() + 60000 });
      await reply('╭━━━〔 🎰 *رهان جماعي جديد!* 〕━━━╮\n│\n│ ⏳ أمامكم دقيقة واحدة للاشتراك!\n│ 💡 للانضمام اكتب: */انضم <المبلغ>*\n│ 🎲 الفائز سيسحب إجمالي الصندوق كاملاً!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯');
      setTimeout(async () => {
        const p = pools.get(jid);
        if (!p) return;
        pools.delete(jid);
        const entries = [...p.bets.entries()];
        if (entries.length < 2) {
          // استرجاع أموال المشارك الوحيد
          if (entries.length === 1) {
            const [singleJid, singleAmt] = entries[0];
            user(singleJid).money += singleAmt;
            save();
          }
          return reply('🎰 تم إلغاء الرهان الجماعي لعدم اكتمال النصاب (مطلوب شخصين على الأقل). تم استرداد المبالغ.');
        }
        const total = entries.reduce((s, [, a]) => s + a, 0);
        let r = Math.random() * total, winner;
        for (const [j, a] of entries) {
          r -= a;
          if (r <= 0) {
            winner = j;
            break;
          }
        }
        const w = user(winner);
        w.money += total;
        save();
        reply(`╭━━━〔 🎰 *الفائز بالرهان الجماعي!* 〕━━━╮\n│\n│ 👑 الفائز المحظوظ: @${numOf(winner)}\n│ 💰 إجمالي الصندوق: *${money(total)}* 💵\n│ 👥 عدد المشاركين: *${entries.length}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [winner]);
      }, 60000);
    } },

  { name: 'انضم', aliases: ['join_pool'], desc: 'الانضمام للرهان الجماعي', group: true,
    async run({ jid, sender, u, args, reply }) {
      const p = pools.get(jid);
      if (!p || p.until < Date.now()) return reply('ℹ️ لا يوجد رهان جماعي نشط الآن.');
      if (p.bets.has(sender)) return reply('ℹ️ أنت مسجل في الرهان بالفعل.');
      const n = parseInt(args[0]);
      if (!n || n < 50) return reply('الحد الأدنى للاشتراك هو *50* 💵.');
      if (n > u.money) return reply(`❌ رصيدك لا يكفي (معك: *${money(u.money)}* 💵).`);
      u.money -= n;
      p.bets.set(sender, n);
      save();
      reply(`✅ تم انضمامك للرهان بمبلغ *${money(n)}* 💵. إجمالي المشاركين حتى الآن: *${p.bets.size}*`);
    } },
];
