import { db, user, save, cooldown } from '../../lib/db.js';
import { rand, randInt, money, numOf, fmtDur } from '../../lib/utils.js';
import { getMarket, getStock, stockNames, sectorOf, pctChange, sparkline } from '../../lib/market.js';

const JOBS = {
  عامل: { salary: [50, 120], cost: 0, desc: 'وظيفة بدائية براتب فوري' },
  مبرمج: { salary: [150, 300], cost: 2000, desc: 'تطوير بوتات وأنظمة برمجية' },
  طبيب: { salary: [250, 450], cost: 5000, desc: 'رعاية صحية وتطبيب' },
  مستثمر: { salary: [400, 750], cost: 15000, desc: 'إدارة محافظ واستثمارات ضخمة' },
};

export default [
  { name: 'الاسهم', aliases: ['stocks', 'market'], desc: 'عرض أسعار الأسهم المتاحة للتداول',
    async run({ reply }) {
      const m = getMarket();
      const list = stockNames().map(name => {
        const s = m[name];
        const pct = pctChange(s.history);
        const icon = pct > 0 ? '🟢▲' : pct < 0 ? '🔴▼' : '⚪';
        return `│ ${icon} *${name}* (${sectorOf(name)})\n│    💵 السعر: *${money(s.price)}* EGP (${pct >= 0 ? '+' : ''}${pct}%)`;
      }).join('\n│\n');

      let t = `╭━━━〔 📈 *سوق الأسهم المتداول* 〕━━━╮\n│\n`;
      t += list;
      t += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      t += `💡 *أوامر التداول:*\n`;
      t += `▫️ للشراء: */شراء_سهم <الاسم> <العدد>*\n`;
      t += `▫️ للبيع: */بيع_سهم <الاسم> <العدد>*\n`;
      t += `▫️ لمحفظتك: */محفظتي*  |  للرسم الحي: */السوق_الحي*`;
      reply(t);
    } },

  { name: 'شراء_سهم', aliases: ['buystock'], desc: 'شراء أسهم: /شراء_سهم نور 10',
    async run({ u, args, reply }) {
      const name = args[0];
      const qty = parseInt(args[1]) || 1;
      const s = getStock(name);
      if (!s) {
        return reply(`❌ اسم السهم غير صحيح!\nالأسهم المتاحة: *${stockNames().join(', ')}*`);
      }
      if (qty <= 0) return reply('❌ اكتب عدداً صحيحاً وموجباً للأسهم.');
      
      const cost = s.price * qty;
      if (cost > u.money) {
        return reply(`❌ رصيدك لا يكفي لشراء ${qty} سهم في "${name}".\n💰 التكلفة المطلوبة: *${money(cost)}* 💵 | محفظتك: *${money(u.money)}* 💵`);
      }

      u.money -= cost;
      u.stocks ??= {};
      u.stocks[name] = (u.stocks[name] || 0) + qty;
      save();

      reply(`╭━━━〔 📈 *عملية شراء أسهم* 〕━━━╮\n│\n│ ✅ تم شراء: *${qty}* سهم في شركة (*${name}*)\n│ 💰 بسعر إجمالي: *${money(cost)}* 💵\n│ 👛 رصيدك المتبقي: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'بيع_سهم', aliases: ['sellstock'], desc: 'بيع أسهم: /بيع_سهم نور 5',
    async run({ u, args, reply }) {
      const name = args[0];
      const qty = parseInt(args[1]) || 1;
      const s = getStock(name);
      u.stocks ??= {};
      const currentQty = u.stocks[name] || 0;

      if (!s) return reply(`❌ اسم السهم غير صحيح!\nالأسهم المتاحة: *${stockNames().join(', ')}*`);
      if (qty <= 0) return reply('❌ اكتب عدداً صحيحاً للأسهم المراد بيعها.');
      if (currentQty < qty) {
        return reply(`❌ لا تمتلك هذا العدد من أسهم "${name}" (تمتلك حالياً: *${currentQty}* سهم).`);
      }

      const totalGain = s.price * qty;
      u.stocks[name] -= qty;
      if (u.stocks[name] <= 0) delete u.stocks[name];
      u.money += totalGain;
      save();

      reply(`╭━━━〔 📉 *عملية بيع أسهم* 〕━━━╮\n│\n│ ✅ تم بيع: *${qty}* سهم من شركة (*${name}*)\n│ 💰 العائد المالي: *+${money(totalGain)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'محفظتي', aliases: ['portfolio'], desc: 'عرض محفظتك الاستثمارية وقيمتها الحالية',
    async run({ u, reply }) {
      const m = getMarket();
      const owned = Object.entries(u.stocks || {}).filter(([, n]) => n > 0);
      if (!owned.length) {
        return reply('📭 محفظتك الاستثمارية فارغة حالياً.\nتصفح الأسعار بـ */الاسهم* واشترِ بـ */شراء_سهم*');
      }

      let totalVal = 0;
      const lines = owned.map(([n, q]) => {
        const pr = m[n]?.price || 0;
        const val = pr * q;
        totalVal += val;
        return `│ 🏢 *${n}* (${sectorOf(n)}): *${q}* سهم\n│    ↳ القيمة السوقية: *${money(val)}* 💵`;
      }).join('\n│\n');

      let t = `╭━━━〔 💼 *محفظتي الاستثمارية* 〕━━━╮\n│\n`;
      t += lines;
      t += `\n│\n├──────────────────────\n`;
      t += `│ 💰 إجمالي قيمة المحفظة: *${money(totalVal)}* 💵\n`;
      t += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },

  { name: 'وظيفة', aliases: ['job'], desc: 'اختيار وظيفة ثابتة: /وظيفة مبرمج',
    async run({ u, args, reply }) {
      const name = args[0];
      if (!name) {
        let msg = `╭━━━〔 🧑‍💼 *سوق الوظائف المتاحة* 〕━━━╮\n│\n`;
        for (const [jName, jInfo] of Object.entries(JOBS)) {
          msg += `│ ▫️ *${jName}*\n│    💵 الراتب: ${money(jInfo.salary[0])} - ${money(jInfo.salary[1])} EGP\n│    🏷️ رسوم التدريب: ${money(jInfo.cost)} EGP\n`;
        }
        msg += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 للتعيين اكتب: */وظيفة <الاسم>*\nمثال: */وظيفة مبرمج*`;
        return reply(msg);
      }

      const job = JOBS[name];
      if (!job) return reply(`❌ وظيفة غير متاحة. الوظائف المتوفرة: *${Object.keys(JOBS).join(', ')}*`);
      if (job.cost > u.money) {
        return reply(`❌ تحتاج إلى *${money(job.cost)}* 💵 لرسوم التدريب، ورصيدك الحالي: *${money(u.money)}* 💵.`);
      }

      u.money -= job.cost;
      u.job = name;
      save();
      reply(`╭━━━〔 🎉 *مبروك الوظيفة الجديدة!* 〕━━━╮\n│\n│ 🧑‍💼 وظيفتك الحالية: *${name}*\n│ 💼 استلم راتبك كل ساعتين بـ: */راتب*\n│ 👛 رصيدك بعد الرسوم: *${money(u.money)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'راتب', aliases: ['salary'], desc: 'اقبض راتب وظيفتك (كل ساعتين)',
    async run({ u, reply }) {
      if (!u.job) return reply('ℹ️ ليس لديك وظيفة حالياً. اختر وظيفة أولاً بـ */وظيفة*');
      const left = cooldown(u, 'salary', 2 * 3600000);
      if (left) return reply(`⏳ لم يحن موعد استلام الراتب بعد! متبقي: *${fmtDur(left)}*`);
      const job = JOBS[u.job] || JOBS['عامل'];
      const r = randInt(job.salary[0], job.salary[1]);
      u.money += r;
      save();
      reply(`╭━━━〔 💼 *استلام الراتب الدوري* 〕━━━╮\n│\n│ 👤 المهنة: *${u.job}*\n│ 💵 الراتب المستلم: *+${money(r)}* EGP\n│ 👛 رصيدك الحالي: *${money(u.money)}* EGP\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'تأمين', aliases: ['insurance'], desc: 'اشترِ تأمين ضد السرقة ليوم كامل (300)',
    async run({ u, reply }) {
      if (u.insurance && u.insurance > Date.now()) {
        return reply(`✅ لديك وثيقة تأمين فعالة ضد السرقة لمدة *${fmtDur(u.insurance - Date.now())}*.`);
      }
      if (u.money < 300) return reply('❌ تحتاج إلى *300* 💵 لشراء وثيقة التأمين اليومي.');
      u.money -= 300;
      u.insurance = Date.now() + 86400000;
      save();
      reply(`🛡️ *تم تفعيل وثيقة التأمين!*\nأنت محمي الآن بالكامل ضد عمليات السرقة لمدة 24 ساعة.`);
    } },

  { name: 'تبرع', aliases: ['donate'], desc: 'تبرع لصندوق الجروب الجماعي', group: true,
    async run({ jid, u, args, reply }) {
      const n = parseInt(args[0]);
      if (!n || n < 10) return reply('اكتب المبلغ المراد التبرع به (10 على الأقل).\nمثال: */تبرع 100*');
      if (n > u.money) return reply(`❌ رصيدك لا يكفي (معك: *${money(u.money)}* 💵).`);
      u.money -= n;
      db.groups[jid] ??= {};
      db.groups[jid].fund = (db.groups[jid].fund || 0) + n;
      save();
      reply(`╭━━━〔 🤝 *تبرع لصندوق المجموعة* 〕━━━╮\n│\n│ 🎁 شكراً لمساهمتك بمبلغ: *${money(n)}* 💵\n│ 🏦 رصيد الصندوق الإجمالي: *${money(db.groups[jid].fund)}* 💵\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'صندوق_الجروب', aliases: ['groupfund'], desc: 'رصيد صندوق الجروب الجماعي', group: true,
    async run({ jid, reply }) {
      const fund = db.groups[jid]?.fund || 0;
      reply(`🏦 *صندوق المجموعة العام:*\n💰 الرصيد الحالي: *${money(fund)}* 💵`);
    } },

  { name: 'تحويل_جماعي', aliases: ['splitpay'], desc: 'قسّم مبلغ بينك وبين أعضاء: /تحويل_جماعي 300 @a @b', group: true,
    async run({ u, args, mentioned, reply }) {
      const n = parseInt(args[0]);
      if (!n || !mentioned.length) return reply('💡 طريقة الاستخدام:\n*/تحويل_جماعي <المبلغ> @عضو1 @عضو2*\nسيتم تقسيم المبلغ بالتساوي بين الجميع.');
      const share = Math.floor(n / (mentioned.length + 1));
      if (n > u.money) return reply(`❌ رصيدك لا يكفي لتغطية كامل المبلغ (*${money(n)}* 💵).`);
      u.money -= (n - share);
      mentioned.forEach(m => { user(m).money += share; });
      save();
      reply(`✅ تم توزيع *${money(n)}* 💵 بالتساوي على *${mentioned.length + 1}* أشخاص (نصيب كل فرد: *${money(share)}* 💵).`, mentioned);
    } },
];
