import { save } from '../../lib/db.js';
import { numOf, parseToggle } from '../../lib/utils.js';

const onoff = v => (v ? 'مفعّل ✅' : 'متوقف ❌');
const usage = n => `💡 اكتب: */${n} تشغيل*  أو  */${n} ايقاف*`;

export default [
  { name: 'معلومات_الجروب', aliases: ['groupinfo', 'ginfo', 'معلومات', 'معلومات_المجموعة'], desc: 'عرض بطاقة تفصيلية عن المجموعة (مخصص للمشرفين)', admin: true, group: true,
    async run({ meta, reply }) {
      const admins = meta.participants.filter(p => p.admin).length;
      const date = new Date(meta.creation * 1000).toLocaleDateString('ar-EG');
      let t = `╭━━━〔 👥 *معلومات المجموعة* 〕━━━╮\n│\n`;
      t += `│ 📌 الاسم: *${meta.subject}*\n`;
      t += `│ 🆔 المعرف: \`${meta.id}\`\n`;
      t += `│ 👤 إجمالي الأعضاء: *${meta.participants.length}*\n`;
      t += `│ 🛡️ عدد المشرفين: *${admins}*\n`;
      t += `│ 📅 تاريخ الإنشاء: *${date}*\n`;
      t += `│ 📝 الوصف:\n${meta.desc || 'لا يوجد وصف محدد'}\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },

  { name: 'الرابط', aliases: ['link', 'invite', 'رابط_الجروب'], desc: 'استخراج رابط دعوة المجموعة الرسمي', botAdmin: true,
    async run({ sock, jid, reply }) {
      const code = await sock.groupInviteCode(jid);
      reply(`╭━━━〔 🔗 *رابط دعوة المجموعة* 〕━━━╮\n│\n│ https://chat.whatsapp.com/${code}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    } },

  { name: 'الادمنية', aliases: ['admins', 'المشرفين'], desc: 'عرض قائمة بمشرفي المجموعة كاملة',
    async run({ meta, reply }) {
      const a = meta.participants.filter(p => p.admin).map(p => p.id);
      let t = `╭━━━〔 🛡️ *مشرفو المجموعة* 〕━━━╮\n│\n`;
      t += a.map(i => `│ ▫️ @${numOf(i)}`).join('\n');
      t += `\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, a);
    } },

  { name: 'القوانين', aliases: ['rules', 'شروط'], desc: 'عرض لائحة قوانين المجموعة',
    async run({ g, reply }) {
      reply(g.rules ? `╭━━━〔 📜 *قوانين المجموعة* 〕━━━╮\n\n${g.rules}\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯` : 'ℹ️ لم يتم تسجيل أي قوانين في هذه المجموعة حتى الآن. (يمكن للأدمن تسجيلها بـ /ضبط_القوانين)');
    } },

  { name: 'ضبط_القوانين', aliases: ['setrules'], desc: 'تسجيل وتحديث قوانين المجموعة', admin: true,
    async run({ g, text, reply }) {
      if (!text) return reply('اكتب القوانين الجديدة بعد الأمر.');
      g.rules = text;
      save();
      reply('✅ تم حفظ وتحديث قوانين المجموعة بنجاح.');
    } },

  { name: 'ترحيب', aliases: ['welcome'], desc: 'تشغيل أو إيقاف رسالة الترحيب بالأعضاء الجدد', admin: true,
    async run({ g, args, reply }) {
      const v = parseToggle(args[0]);
      if (v === null) return reply(usage('ترحيب'));
      g.welcome = v;
      save();
      reply(`👋 رسالة الترحيب بالجدد: *${onoff(v)}*`);
    } },

  { name: 'ضبط_ترحيب', aliases: ['setwelcome'], desc: 'تخصيص نص الترحيب ({user} {group} {count})', admin: true,
    async run({ g, text, reply }) {
      if (!text) return reply('💡 اكتب نص الترحيب. يمكنك استخدام المتغيرات التالية:\n▫️ {user} : اسم العضو مع المنشن\n▫️ {group} : اسم المجموعة\n▫️ {count} : رقم العضو\nمثال: */ضبط_ترحيب أهلاً بك يا {user} في {group}!*');
      g.welcomeMsg = text;
      save();
      reply('✅ تم حفظ نص الترحيب المخصص بنجاح.');
    } },

  { name: 'توديع', aliases: ['goodbye', 'bye'], desc: 'تشغيل أو إيقاف رسالة توديع المغادرين', admin: true,
    async run({ g, args, reply }) {
      const v = parseToggle(args[0]);
      if (v === null) return reply(usage('توديع'));
      g.bye = v;
      save();
      reply(`👋 رسالة توديع المغادرين: *${onoff(v)}*`);
    } },

  { name: 'ضبط_توديع', aliases: ['setbye'], desc: 'تخصيص نص التوديع ({user} {group} {count})', admin: true,
    async run({ g, text, reply }) {
      if (!text) return reply('اكتب نص التوديع بعد الأمر. يمكنك استخدام المتغيرات: {user} {group} {count}');
      g.byeMsg = text;
      save();
      reply('✅ تم حفظ نص التوديع بنجاح.');
    } },

  { name: 'منع_الروابط', aliases: ['antilink'], desc: 'تشغيل أو إيقاف الحماية ضد نشر الروابط', admin: true,
    async run({ g, args, reply, isBotAdmin }) {
      const v = parseToggle(args[0]);
      if (v === null) return reply(usage('منع_الروابط'));
      g.antilink = v;
      save();
      reply(`🔗 نظام منع الروابط: *${onoff(v)}*${v && !isBotAdmin ? '\n⚠️ (تنبيه: يجب ترقية البوت لمشرف ليتمكن من حذف الروابط تلقائياً)' : ''}`);
    } },

  { name: 'حظر_الارقام_الوهمية', aliases: ['antifake', 'ارقام_وهمية', 'منع_الفيك'], desc: 'طرد أي رقم أجنبي/وهمي فور انضمامه للمجموعة', admin: true,
    async run({ g, args, reply, isBotAdmin }) {
      const v = parseToggle(args[0]);
      if (v === null) return reply(usage('حظر_الارقام_الوهمية'));
      g.antifake = v;
      save();
      reply(`🛡️ نظام طرد الأرقام الوهمية والأجنبية: *${onoff(v)}*${v && !isBotAdmin ? '\n⚠️ (يجب أن يكون البوت مشرفاً ليتمكن من الطرد الفوري)' : ''}`);
    } },

  { name: 'منع_كلمة', aliases: ['addbadword'], desc: 'إضافة كلمة أو جملة لقائمة الكلمات الممنوعة', admin: true,
    async run({ g, text, reply }) {
      if (!text) return reply('اكتب الكلمة أو العبارة المراد منعها بعد الأمر.');
      if (!g.badwords.includes(text)) g.badwords.push(text);
      save();
      reply(`🚫 تمت إضافة "*${text}*" إلى قائمة الكلمات المحظورة.`);
    } },

  { name: 'سماح_كلمة', aliases: ['delbadword'], desc: 'إزالة كلمة من قائمة الكلمات الممنوعة', admin: true,
    async run({ g, text, reply }) {
      g.badwords = g.badwords.filter(w => w !== text);
      save();
      reply(`✅ تم السماح بالكلمة "*${text}*" وإزالتها من الحظر.`);
    } },

  { name: 'قائمة_المنع', aliases: ['badwords'], desc: 'عرض الكلمات المحظورة في المجموعة',
    async run({ g, reply }) {
      reply(g.badwords.length ? `╭━━━〔 🚫 *الكلمات المحظورة* 〕━━━╮\n│\n` + g.badwords.map(w => `│ ▫️ ${w}`).join('\n') + `\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯` : '✅ لا توجد كلمات محظورة في هذه المجموعة.');
    } },

  { name: 'اعدادات_الجروب', aliases: ['gsettings'], desc: 'عرض لوحة إعدادات المجموعة الحالية بالكامل',
    async run({ g, reply }) {
      let t = `╭━━━〔 ⚙️ *إعدادات المجموعة* 〕━━━╮\n│\n`;
      t += `│ 👋 الترحيب: *${onoff(g.welcome)}*\n`;
      t += `│ 👋 التوديع: *${onoff(g.bye)}*\n`;
      t += `│ 🔗 منع الروابط: *${onoff(g.antilink)}*\n`;
      t += `│ 🛡️ حظر الأرقام الوهمية: *${onoff(g.antifake)}*\n`;
      t += `│ 🎮 الألعاب: *${onoff(g.games)}*\n`;
      t += `│ 🚫 الكلمات الممنوعة: *${g.badwords.length}*\n`;
      t += `│ 🔇 الأعضاء المكتومين: *${g.muted.length}*\n`;
      t += `│ ⛔ الأعضاء المحظورين: *${g.banned.length}*\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    } },

  { name: 'وضع_الالعاب', aliases: ['gamesmode'], desc: 'تشغيل أو إيقاف تشغيل الألعاب داخل المجموعة', admin: true,
    async run({ g, args, reply }) {
      const v = parseToggle(args[0]);
      if (v === null) return reply(usage('وضع_الالعاب'));
      g.games = v;
      save();
      reply(`🎮 تشغيل الألعاب في المجموعة: *${onoff(v)}*`);
    } },

  { name: 'نداء_الادمن', aliases: ['calladmins', 'استدعاء'], desc: 'إرسال إشعار عاجل لجميع مشرفي المجموعة',
    async run({ meta, text, pushName, reply }) {
      const a = meta.participants.filter(p => p.admin).map(p => p.id);
      let t = `╭━━━〔 🚨 *نداء عاجل للأدمنية* 〕━━━╮\n│\n`;
      t += `│ 👤 المنادي: *${pushName}*\n`;
      if (text) t += `│ 📝 الرسالة: ${text}\n`;
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      t += a.map(i => `@${numOf(i)}`).join(' ');
      reply(t, a);
    } },
];
