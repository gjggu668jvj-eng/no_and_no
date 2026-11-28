import { db, user, save } from '../../lib/db.js';
import { proposals } from '../../lib/state.js';
import { numOf, money, bar, getRank, resolvePhone } from '../../lib/utils.js';

const need = lv => Math.pow(lv, 2) * 50; // XP اللازم للوصول للمستوى التالي

export default [
  { name: 'بروفايل', aliases: ['profile', 'me'], desc: 'عرض بطاقة الملف الشخصي بالكامل',
    async run({ target, sender, g, reply }) {
      const who = target || sender;
      const u = user(who);
      const w = g?.warns?.[numOf(who)] || 0;
      const nextXp = need(u.level);
      const xpBar = bar(u.xp, nextXp, 12);
      const totalWealth = (u.money || 0) + (u.bank || 0);

      let t = `╭━━━〔 💳 *بطاقة الهوية الشخصية* 〕━━━╮\n│\n`;
      t += `│ 👤 العضو: @${numOf(who)}\n`;
      if (u.nick) t += `│ 🏷️ اللقب: *${u.nick}*\n`;
      t += `│ 📝 النبذة: ${u.bio || 'لا توجد نبذة شخصية'}\n│\n`;
      t += `│ ⭐ المستوى: *Lv.${u.level}*\n`;
      t += `│ 🎖️ الرتبة: *${getRank(u.level)}*\n`;
      t += `│ ✨ الخبرة: *${u.xp} / ${nextXp} XP*\n`;
      t += `│    [${xpBar}]\n│\n`;
      t += `│ 👛 المحفظة: *${money(u.money)}* 💵\n`;
      t += `│ 🏦 البنك: *${money(u.bank)}* 🪙\n`;
      t += `│ 💰 إجمالي الثروة: *${money(totalWealth)}* EGP\n│\n`;
      if (u.job) t += `│ 💼 المهنة: *${u.job}*\n`;
      if (u.pet) t += `│ 🐾 الأليف: *${u.pet}*\n`;
      t += `│ 💬 التفاعل: *${u.msgs || 0}* رسالة\n`;
      t += `│ 💍 الحالة: ${u.married ? `متزوج من @${u.married} 💖` : 'أعزب 🤍'}\n`;
      t += `│ ⚠️ سجل التحذيرات: *${w} / 3*\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;

      const mentions = [who];
      if (u.married) mentions.push(u.married + '@s.whatsapp.net');
      reply(t, mentions);
    } },

  { name: 'ايدي', aliases: ['id'], desc: 'معلومات المعرف الرقمي الخاص بك والشات',
    async run({ target, sender, jid, reply }) {
      reply(`╭━━━〔 🆔 *معرفات الحساب* 〕━━━╮\n│\n│ 👤 معرف الشخص: *${numOf(target || sender)}*\n│ 💬 معرف المحادثة: *${jid}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'صورة', aliases: ['pp', 'avatar'], desc: 'عرض الصورة الشخصية للعضو بجودة كاملة',
    async run({ sock, target, sender, send, reply }) {
      try {
        const url = await sock.profilePictureUrl(target || sender, 'image');
        await send({ image: { url }, caption: `🖼️ الصورة الشخصية لـ @${numOf(target || sender)}`, mentions: [target || sender] });
      } catch {
        reply('❌ تعذر جلب الصورة، إما بسبب إعدادات الخصوصية أو عدم وجود صورة حساب.');
      }
    } },

  { name: 'بايو', aliases: ['setbio'], desc: 'كتابة وتحديث نبذتك الشخصية',
    async run({ u, text, reply }) {
      if (!text) return reply('اكتب النبذة الجديدة بعد الأمر.\nمثال: */بايو اللهم صل وسلم على نبينا محمد*');
      if (text.length > 120) return reply('❌ الحد الأقصى لطول النبذة هو 120 حرفاً.');
      u.bio = text;
      save();
      reply(`✅ تم حفظ النبذة الشخصية في ملفك:\n"${text}"`);
    } },

  { name: 'مستوى', aliases: ['level', 'rank'], desc: 'عرض مستواك وشريط التقدم للترقية',
    async run({ u, sender, reply }) {
      const nxt = need(u.level);
      const progressBar = bar(u.xp, nxt, 14);
      reply(`╭━━━〔 ⭐ *مستوى التقدم* 〕━━━╮\n│\n│ 👤 العضو: @${numOf(sender)}\n│ 🆙 المستوى الحالي: *Lv.${u.level}*\n│ 📊 نقاط الخبرة: *${u.xp} / ${nxt} XP*\n│ 📈 التقدم: [${progressBar}]\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [sender]);
    } },

  { name: 'المتصدرين', aliases: ['top', 'leaderboard'], desc: 'أعلى 10 أعضاء نشاطاً وخبرة',
    async run({ reply }) {
      const top = Object.entries(db.users)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10);
      if (!top.length) return reply('لا توجد بيانات تفاعل مسجلة بعد.');
      const medals = ['🥇', '🥈', '🥉'];
      let msg = `╭━━━〔 🏆 *المتصدرين في النشاط* 〕━━━╮\n│\n`;
      msg += top.map(([k, u], i) => `│ ${medals[i] || '▫️'} @${k} ── Lv.${u.level} (${money(u.xp)} XP)`).join('\n');
      msg += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(msg, top.map(([k]) => k + '@s.whatsapp.net'));
    } },

  { name: 'غياب', aliases: ['afk'], desc: 'تفعيل وضع الغياب عن المجموعة',
    async run({ u, text, sender, reply }) {
      u.afk = { reason: text || 'مشغول حالياً', since: Date.now() };
      save();
      reply(`╭━━━〔 💤 *تفعيل وضع الغياب* 〕━━━╮\n│\n│ 👤 @${numOf(sender)} دخل في وضع الغياب.\n│ 📝 السبب: *${u.afk.reason}*\n│ 🔔 سأقوم بإخبار أي شخص يذكرك بغيابك.\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [sender]);
    } },

  { name: 'لقب', aliases: ['nick'], desc: 'تعيين لقب مخصص يظهر في بروفايلك',
    async run({ u, text, reply }) {
      if (!text) return reply('اكتب اللقب المراد اختياره بعد الأمر.\nمثال: */لقب القائد*');
      if (text.length > 25) return reply('❌ أقصى طول للقب هو 25 حرفاً.');
      u.nick = text;
      save();
      reply(`🏷️ تم تعيين لقبك الجديد بنجاح: *${text}*`);
    } },

  { name: 'زواج_عادي', aliases: ['marry'], desc: 'طلب الزواج من عضو في المجموعة', group: true,
    async run({ sender, target, u, jid, reply }) {
      if (!target) return reply('↩️ قم بعمل منشن للشخص الذي تود طلب يده للزواج.');
      if (numOf(target) === numOf(sender)) return reply('😅 لا يمكنك الزواج من نفسك!');
      if (u.married) return reply('💍 أنت متزوج بالفعل! لا يُسمح بتعدد الأزواج هنا.');
      if (user(target).married) return reply('💔 للأسف، هذا الشخص متزوج بالفعل!');

      proposals.set(jid + numOf(target), { from: sender, until: Date.now() + 120000 });
      reply(`╭━━━〔 💍 *طلب زواج رومانسي!* 〕━━━╮\n│\n│ 🤵 العريس: @${numOf(sender)}\n│ 👰 العروس: @${numOf(target)}\n│\n│ 💌 يتقدم لطلب يدك على سنة الله ورسوله!\n│ ⏳ لديك دقيقتان للرد بـ: */موافقة*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [sender, target]);
    } },

  { name: 'موافقة', aliases: ['accept'], desc: 'قبول طلب الزواج المقدم إليك', group: true,
    async run({ sender, jid, u, reply }) {
      const p = proposals.get(jid + numOf(sender));
      if (!p || p.until < Date.now()) return reply('ℹ️ ليس لديك أي طلبات زواج معلقة حالياً.');
      const other = user(p.from);
      u.married = numOf(p.from);
      other.married = numOf(sender);
      proposals.delete(jid + numOf(sender));
      save();
      reply(`╭━━━〔 🎊💍 *عقد قران مبارك!* 〕━━━╮\n│\n│ 💐 بارك الله لكما وبارك عليكما وجمع بينكما في خير!\n│ 🤵 الزوج: @${numOf(p.from)}\n│ 👰 الزوجة: @${numOf(sender)}\n│ 💖 نتمنى لكما حياة زوجية سعيدة مليئة بالفرح!\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`, [p.from, sender]);
    } },

  { name: 'طلاق', aliases: ['divorce'], desc: 'إنهاء عقد الزواج الحالي',
    async run({ u, sender, reply }) {
      if (!u.married) return reply('ℹ️ أنت لست متزوجاً من الأساس.');
      const ex = u.married;
      const o = db.users[ex];
      if (o) o.married = null;
      u.married = null;
      save();
      reply(`💔 تم الطلاق رسمياً بين @${numOf(sender)} و @${ex}. كل شخص في طريقه الآن!`, [sender, ex + '@s.whatsapp.net']);
    } },

  { name: 'ميلادي', aliases: ['setbirthday'], desc: 'تسجيل تاريخ ميلادك (يوم/شهر/سنة)',
    async run({ u, text, reply }) {
      const m = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (!m) return reply('💡 اكتب التاريخ بالشكل التالي:\n*/ميلادي 15/6/2000*');
      const [, d, mo, y] = m.map(Number);
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1940 || y > new Date().getFullYear()) {
        return reply('❌ تاريخ غير منطقي أو غير صالح.');
      }
      u.birthday = { d, m: mo, y };
      save();
      reply(`🎂 تم حفظ تاريخ ميلادك بنجاح: *${d}/${mo}/${y}*`);
    } },

  { name: 'عمري', aliases: ['age'], desc: 'حساب عمرك بدقة والوقت المتبقي ليوم ميلادك',
    async run({ u, reply }) {
      if (!u.birthday) return reply('سجل تاريخ ميلادك أولاً بـ: */ميلادي يوم/شهر/سنة*');
      const { d, m, y } = u.birthday, now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisYear = new Date(now.getFullYear(), m - 1, d);
      let age = now.getFullYear() - y;
      if (thisYear > today) age--;
      const next = thisYear < today ? new Date(now.getFullYear() + 1, m - 1, d) : thisYear;
      const days = Math.round((next - today) / 86400000);
      reply(`╭━━━〔 🎂 *حساب العمر والميلاد* 〕━━━╮\n│\n│ 🎈 عمرك الحالي: *${age}* سنة\n│ 🎉 متبقي على عيد ميلادك القادم: *${days}* يوم\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'رقمي', aliases: ['mynumber', 'فحص_رقمي', 'رقم'], desc: 'عرض رقم هاتفك بالصيغة الدولية',
    async run({ sender, reply }) {
      const num = resolvePhone(sender) || numOf(sender);
      reply(`📱 رقم هاتفك المسجل: *+${num}*`);
    } },

  { name: 'توب_المستويات', aliases: ['toplv', 'topxp', 'المستويات'], desc: 'عرض أعلى 10 أعضاء في المستوى والخبرة',
    async run({ reply }) {
      const top = Object.entries(db.users)
        .sort((a, b) => ((b[1].level || 1) - (a[1].level || 1)) || ((b[1].xp || 0) - (a[1].xp || 0)))
        .slice(0, 10);
      if (!top.length) return reply('لا توجد بيانات مسجلة بعد.');
      const medals = ['🥇', '🥈', '🥉'];
      let t = `╭━━━〔 🏆 *قائمة أساطير المستويات* 〕━━━╮\n│\n`;
      top.forEach(([k, u], i) => {
        const tag = medals[i] || `[#${i + 1}]`;
        t += `│ ${tag} @${k} ─── *Lv.${u.level || 1}* (${u.xp || 0} XP)\n`;
      });
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, top.map(([k]) => k + '@s.whatsapp.net'));
    } },
];
