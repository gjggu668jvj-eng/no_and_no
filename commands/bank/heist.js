import { rand, randInt, numOf, money, fmtDur } from '../../lib/utils.js';
import { db, user, save, cooldown } from '../../lib/db.js';

export default [
  {
    name: 'سطو_مسلح',
    aliases: ['heist', 'سرقة_البنك', 'سطو'],
    desc: 'عملية سطو مسلح كبرى على بنك البوت المركزي (غنيمة ضخمة أو سجن!)',
    group: true,
    async run({ u, sender, reply, react }) {
      if (u.jail && u.jail > Date.now()) {
        const left = u.jail - Date.now();
        return reply(`⛓️ أنت في السجن حالياً! متبقي على خروجك: *${fmtDur(left)}*.\n💡 يمكنك دفع كفالة بـ: */كفالة* للخروج فوراً.`);
      }

      const cd = cooldown(u, 'heist', 3 * 3600000);
      if (cd) return reply(`⏳ خطة السطو القادمة قيد التجهيز! عُد بعد: *${fmtDur(cd)}*`);

      await react('🏦');
      await reply('🚨 *إنذار أمني مشدد!* عملية سطو مسلح جارية الآن على خزينة البنك المركزي...');

      const success = Math.random() < 0.42;

      if (success) {
        const loot = randInt(15000, 35000);
        u.money = (u.money || 0) + loot;
        save();
        reply(`╭━━━〔 💰 *نجاح عملية السطو الكبرى!* 〕━━━╮\n│\n│ 🎭 المنفذ العبقري: @${numOf(sender)}\n│ 💎 الغنيمة المسروقة: *+${money(loot)}* 💵\n│ 👛 رصيدك الآن: *${money(u.money)}* 💵\n│ 🚓 هربت بنجاح قبل وصول دوريات الشرطة!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender]);
      } else {
        const jailTime = 20 * 60000;
        const fine = Math.min(u.money || 0, 2000);
        u.money = Math.max(0, (u.money || 0) - fine);
        u.jail = Date.now() + jailTime;
        save();
        reply(`╭━━━〔 🚓 *فشلت العملية وتم القبض عليك!* 〕━━━╮\n│\n│ 👮‍♂️ حاصرتك قوات التدخل السريع أثناء فتح الخزينة!\n│ 💸 غرامة فورية: *-${money(fine)}* 💵\n│ ⛓️ تم تحويلك إلى السجن لمدة: *20 دقيقة*!\n│ 💡 للخروج الفوري ادفع الكفالة: */كفالة*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender]);
      }
    },
  },

  {
    name: 'سجن',
    aliases: ['jail', 'المسجونين', 'حبس'],
    desc: 'عرض قائمة السجناء المحبوسين حالياً في سجن البوت',
    async run({ reply, react }) {
      await react('⛓️');
      const prisoners = Object.entries(db.users).filter(([, d]) => d.jail && d.jail > Date.now());
      if (!prisoners.length) {
        return reply('🕊️ سجن البوت فارغ تماماً! لا يوجد أي مسجون حالياً.');
      }

      let t = `╭━━━〔 ⛓️ *نزلاء سجن البوت المركزي* 〕━━━╮\n│\n`;
      prisoners.forEach(([id, d], i) => {
        const left = d.jail - Date.now();
        t += `│ [${i + 1}] 👤 @${id} ─── متبقي: *${fmtDur(left)}*\n`;
      });
      t += `│\n│ 💡 لإخراج نفسك أو صديقك اكتب: */كفالة @الشخص*\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, prisoners.map(([id]) => id + '@s.whatsapp.net'));
    },
  },

  {
    name: 'كفالة',
    aliases: ['bail', 'تهريب'],
    desc: 'دفع كفالة (1,500 💵) للخروج من السجن فوراً',
    async run({ u, sender, target, reply, react }) {
      const who = target || sender;
      const targetUser = target ? user(target) : u;

      if (!targetUser.jail || targetUser.jail <= Date.now()) {
        return reply(target ? 'ℹ️ هذا العضو ليس في السجن أصلاً!' : 'ℹ️ أنت حر طليق ولست في السجن!');
      }

      const BAIL_COST = 1500;
      if ((u.money || 0) < BAIL_COST) {
        return reply(`❌ ليس معك مبلغ الكفالة المطلوب (*${money(BAIL_COST)}* 💵). رصيدك: *${money(u.money)}* 💵`);
      }

      u.money -= BAIL_COST;
      targetUser.jail = null;
      save();

      await react('🕊️');
      reply(`╭━━━〔 🕊️ *إفراج بكفالة مالية* 〕━━━╮\n│\n│ 💸 تم دفع كفالة قدرها: *${money(BAIL_COST)}* 💵\n│ 👤 خرج العضو @${numOf(who)} من السجن فوراً واستعاد حريته!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [who]);
    },
  },

  {
    name: 'حرب_العصابات',
    aliases: ['gangwar', 'معركة_عصابات'],
    desc: 'تحدي حرب عصابات مسلحة بين عضوين على مبالغ مالية',
    group: true,
    async run({ u, sender, target, args, reply, react }) {
      if (!target) return reply('↩️ منشن زعيم العصابة المنافسة!\nمثال: */حرب_العصابات @شخص 500*');
      if (numOf(target) === numOf(sender)) return reply('😅 مش هتحارب نفسك يا زعيم!');

      const bet = parseInt(args.find(a => /^\d+$/.test(a))) || 500;
      if (bet < 100) return reply('❌ أقل رهان في حرب العصابات هو 100 💵.');
      if ((u.money || 0) < bet) return reply(`❌ ليس معك مبلغ الرهان (*${money(bet)}* 💵).`);

      const tUser = user(target);
      if ((tUser.money || 0) < bet) return reply(`❌ الخصم @${numOf(target)} لا يمتلك مبلغ الرهان.`);

      await react('🔫');
      const myRoll = randInt(1, 100);
      const enemyRoll = randInt(1, 100);

      if (myRoll > enemyRoll) {
        u.money += bet;
        tUser.money -= bet;
        save();
        reply(`╭━━━〔 💥 *انتصار عصابة @${numOf(sender)}!* 〕━━━╮\n│\n│ 🔫 دارت اشتباكات مسلحة عنيفة بين الطرفين!\n│ 🏆 انتصرت عصابة @${numOf(sender)} بقوة نيران ساحقة (${myRoll} مقابل ${enemyRoll})!\n│ 💰 الغنيمة: *+${money(bet)}* 💵 من الخصم!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
      } else {
        u.money -= bet;
        tUser.money += bet;
        save();
        reply(`╭━━━〔 💥 *انتصار عصابة @${numOf(target)}!* 〕━━━╮\n│\n│ 🔫 تفوقت عصابة @${numOf(target)} في التكتيك (${enemyRoll} مقابل ${myRoll})!\n│ 💸 خسرت المعركة وتم نهب: *-${money(bet)}* 💵 من خزينتك!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
      }
    },
  },
];
