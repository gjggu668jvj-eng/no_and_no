import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import { db, user, group, save, saveNow } from '../../lib/db.js';
import { numOf, money, fmtDur } from '../../lib/utils.js';
import { commands, loadCommands } from '../../lib/loader.js';

export default [
  {
    name: 'شل',
    aliases: ['cmd', 'exec', 'terminal', 'تيرمنال'],
    desc: 'تشغيل أوامر النظام التيرمنال مباشرة على السيرفر (للمطور فقط)',
    owner: true,
    async run({ text, reply, react }) {
      if (!text) return reply('💡 اكتب الأمر المراد تنفيذه في سطر الأوامر.\nمثال: */شل dir* أو */شل git status*');
      await react('⚡');
      exec(text, { timeout: 30000, windowsHide: true }, (err, stdout, stderr) => {
        let out = '';
        if (stdout) out += `📋 *المخرجات:*\n\`\`\`\n${stdout.trim()}\n\`\`\`\n`;
        if (stderr) out += `⚠️ *الأخطاء:*\n\`\`\`\n${stderr.trim()}\n\`\`\`\n`;
        if (err && !stderr) out += `❌ *فشل الأمر:* ${err.message}\n`;
        if (!out.trim()) out = '✅ تم تنفيذ الأمر بنجاح بدون مخرجات نصية.';
        reply(out.slice(0, 4000));
      });
    },
  },

  {
    name: 'ملف',
    aliases: ['getfile', 'ارسل_ملف', 'قراءة_ملف'],
    desc: 'سحب وإرسال أي ملف من مجلد البوت إلى المحادثة (للمطور)',
    owner: true,
    async run({ text, send, reply, react }) {
      if (!text) return reply('💡 اكتب مسار الملف المراد سحبه.\nمثال: */ملف package.json* أو */ملف database/db.json*');
      const targetPath = path.resolve(process.cwd(), text.trim());
      if (!fs.existsSync(targetPath)) return reply(`❌ الملف غير موجود في المسار: ${text}`);
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) return reply('❌ هذا مجلد وليس ملفاً، استخدم أمر */مجلد* لعرض محتوياته.');
      if (stat.size > 90 * 1024 * 1024) return reply('❌ حجم الملف يتجاوز 90 ميجابايت.');

      await react('📥');
      const buf = fs.readFileSync(targetPath);
      await send({
        document: buf,
        mimetype: 'application/octet-stream',
        fileName: path.basename(targetPath),
        caption: `📄 *ملف:* \`${text}\`\n📦 *الحجم:* ${(stat.size / 1024).toFixed(1)} KB`,
      });
    },
  },

  {
    name: 'حفظ_ملف',
    aliases: ['savefile', 'كتابة_ملف'],
    desc: 'كتابة وتعديل كود أو ملف في البوت مباشرة من واتساب (للمطور)',
    owner: true,
    async run({ args, quoted, reply, react }) {
      const filePath = args[0];
      if (!filePath) return reply('💡 طريقة الاستخدام:\nرد على رسالة الكود واكتب: */حفظ_ملف <المسار>*\nمثال: */حفظ_ملف config.js*');
      const code = quoted?.message?.conversation || quoted?.message?.extendedTextMessage?.text || args.slice(1).join(' ');
      if (!code) return reply('❌ لا يوجد كود أو نص لكتابته في الملف.');

      const targetPath = path.resolve(process.cwd(), filePath.trim());
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, code, 'utf8');
      await react('💾');
      reply(`✅ تم حفظ الملف بنجاح في:\n\`${filePath}\``);
    },
  },

  {
    name: 'حذف_ملف',
    aliases: ['delfile', 'rmfile'],
    desc: 'حذف أي ملف من مجلد البوت (للمطور)',
    owner: true,
    async run({ text, reply, react }) {
      if (!text) return reply('اكتب مسار الملف المراد حذفه.\nمثال: */حذف_ملف test.js*');
      const targetPath = path.resolve(process.cwd(), text.trim());
      if (!fs.existsSync(targetPath)) return reply('❌ الملف غير موجود.');
      fs.rmSync(targetPath, { recursive: true, force: true });
      await react('🗑️');
      reply(`🗑️ تم حذف: \`${text}\` بنجاح.`);
    },
  },

  {
    name: 'مجلد',
    aliases: ['ls', 'dir', 'استعراض'],
    desc: 'استعراض الملفات داخل أي مجلد على السيرفر (للمطور)',
    owner: true,
    async run({ text, reply }) {
      const dirPath = path.resolve(process.cwd(), (text || '.').trim());
      if (!fs.existsSync(dirPath)) return reply('❌ المجلد غير موجود.');
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      let out = `📁 *محتويات المجلد:* \`${text || '.'}\`\n━━━━━━━━━━━━━━━━━━━━━\n`;
      items.forEach(item => {
        const icon = item.isDirectory() ? '📂' : '📄';
        out += `${icon} ${item.name}\n`;
      });
      reply(out);
    },
  },

  {
    name: 'تعيين_مفتاح_ai',
    aliases: ['setaikey', 'مفتاح_ai'],
    desc: 'تحديث وتعيين مفتاح Groq AI مباشرة من الشات وحفظه في .env',
    owner: true,
    async run({ text, reply, react }) {
      const key = (text || '').trim();
      if (!key) return reply('💡 اكتب مفتاح Groq بعد الأمر.\nمثال: */تعيين_مفتاح_ai gsk_xxxxxx*\nاحصل عليه مجاناً من: https://console.groq.com/keys');
      
      config.ai.key = key;
      process.env.GROQ_API_KEY = key;

      // تحديث ملف .env
      const envPath = path.resolve(process.cwd(), '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (envContent.includes('GROQ_API_KEY=')) {
        envContent = envContent.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${key}`);
      } else {
        envContent += `\nGROQ_API_KEY=${key}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');

      await react('🤖');
      reply(`╭━━━〔 🤖 *تم تفعيل الذكاء الاصطناعي* 〕━━━╮\n│\n│ ✅ تم حفظ المفتاح وتفعيله فوراً بنجاح!\n│ 🚀 يمكنك الآن استخدام أوامر:\n│ ▫️ */اسأل*\n│ ▫️ */لخص*\n│ ▫️ */ترجم_ذكي*\n│ ▫️ */صحح*\n│ ▫️ */اكتب*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'انضمام',
    aliases: ['join', 'دخول', 'ادخل'],
    desc: 'إجبار البوت على الانضمام لأي مجموعة عبر رابط الدعوة (بالرابط أو بالرد على رابط)',
    owner: true,
    async run({ sock, text, quotedText, reply, react }) {
      const raw = (text || quotedText || '').trim();
      const match = raw.match(/(?:chat\.whatsapp\.com\/(?:invite\/)?)([0-9A-Za-z]{18,30})/i);
      const code = match ? match[1] : raw.replace(/^https?:\/\/chat\.whatsapp\.com\/(?:invite\/)?/i, '').replace(/[^0-9A-Za-z]/g, '');

      if (!code || code.length < 15) {
        return reply(`💡 *يرجى وضع رابط الجروب بعد الأمر أو الرد على رسالة تحتوي على الرابط!*\n\n📌 مثال:\n*.انضمام https://chat.whatsapp.com/ABC123xyz*\nأو قم بالرد على رابط الدعوة واكتب: *.انضمام*`);
      }

      await react('🚪');

      let groupInfo = null;
      try {
        groupInfo = await sock.groupGetInviteInfo(code);
      } catch (infoErr) {
        const errStr = String(infoErr?.message || infoErr);
        if (errStr.includes('404') || errStr.includes('not-authorized') || errStr.includes('gone') || errStr.includes('410')) {
          return reply('❌ رابط الدعوة غير صالح، أو ربما قام مشرف الجروب بإلغاء وإعادة تعيين الرابط.');
        }
      }

      try {
        const res = await sock.groupAcceptInvite(code);
        const groupName = groupInfo?.subject || 'المجموعة الجديدة';
        const membersCount = groupInfo?.size || groupInfo?.participants?.length || 'عدة';

        reply(`╭───〔 🚪 *تم الانضمام بنجاح!* 〕───╮\n│\n` +
          `│ 🏷️ *اسم المجموعة:* ${groupName}\n` +
          `│ 👥 *عدد الأعضاء:* ${membersCount} عضو\n` +
          `│ 🆔 *المعرف:* ${res || groupInfo?.id || 'تم'}\n│\n` +
          `│ ⚡ البوت متواجد الآن في الشات وجاهز لتلقي الأوامر!\n` +
          `╰────────────────────────────╯`);
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('409') || msg.includes('conflict')) {
          return reply('ℹ️ البوت متواجد بالفعل في هذه المجموعة مسبقاً!');
        }
        if (msg.includes('401') || msg.includes('403') || msg.includes('approval') || msg.includes('not-authorized')) {
          return reply('⏳ تم إرسال طلب الانضمام بنجاح! المجموعة تتطلب موافقة المشرفين لدخول الأعضاء الجدد.');
        }
        if (msg.includes('410') || msg.includes('gone')) {
          return reply('❌ رابط الدعوة منتهي الصلاحية أو تم إعادة تعيينه.');
        }
        reply(`❌ تعذر الانضمام: ${msg}`);
      }
    },
  },

  {
    name: 'طرد_الكل',
    aliases: ['kickall', 'تطهير'],
    desc: 'طرد جميع الأعضاء غير المشرفين من المجموعة (أمر خطير يتطلب تأكيد)',
    owner: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, meta, text, reply }) {
      if (text !== 'تأكيد' && text !== 'confirm') {
        return reply('⚠️ *تحذير خطير جداً!*\nهذا الأمر سيقوم بطرد جميع أعضاء المجموعة العاديين فوراً!\nإذا كنت متأكداً تماماً، اكتب:\n*/طرد_الكل تأكيد*');
      }
      const members = meta.participants.filter(p => !p.admin).map(p => p.id);
      if (!members.length) return reply('ℹ️ لا يوجد أعضاء عاديين لطردهم.');
      await reply(`🚨 جاري طرد *${members.length}* عضواً من المجموعة...`);
      for (const m of members) {
        await sock.groupParticipantsUpdate(jid, [m], 'remove').catch(() => {});
        await new Promise(r => setTimeout(r, 600)); // تأخير خفيف لتجنب حظر التيليمتري
      }
      reply('🧹 تم تطهير المجموعة وطرد جميع الأعضاء بنجاح.');
    },
  },

  {
    name: 'ترقية_الكل',
    aliases: ['promoteall', 'ادمن_الكل'],
    desc: 'ترقية جميع أعضاء المجموعة لمشرفين (أدمن) دفعة واحدة',
    owner: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, meta, reply }) {
      const nonAdmins = meta.participants.filter(p => !p.admin).map(p => p.id);
      if (!nonAdmins.length) return reply('✅ جميع الأعضاء في المجموعة مشرفون بالفعل.');
      await reply(`👑 جاري ترقية *${nonAdmins.length}* عضواً إلى رتبة مشرف...`);
      for (const m of nonAdmins) {
        await sock.groupParticipantsUpdate(jid, [m], 'promote').catch(() => {});
        await new Promise(r => setTimeout(r, 500));
      }
      reply('👑 تمت ترقية جميع الأعضاء لمشرفين بنجاح!');
    },
  },

  {
    name: 'تنزيل_الكل',
    aliases: ['demoteall', 'سحب_الاشراف'],
    desc: 'تنزيل جميع المشرفين بالمجموعة إلى أعضاء عاديين (عدا المطور)',
    owner: true,
    group: true,
    botAdmin: true,
    async run({ sock, jid, meta, reply }) {
      const myNumber = numOf(sock.user?.id);
      const admins = meta.participants
        .filter(p => p.admin && !config.owners.includes(numOf(p.id)) && numOf(p.id) !== myNumber)
        .map(p => p.id);
      if (!admins.length) return reply('ℹ️ لا يوجد مشرفين يمكن تنزيلهم.');
      await reply(`⬇️ جاري تنزيل *${admins.length}* مشرفاً إلى أعضاء عاديين...`);
      for (const m of admins) {
        await sock.groupParticipantsUpdate(jid, [m], 'demote').catch(() => {});
        await new Promise(r => setTimeout(r, 500));
      }
      reply('✅ تم تنزيل جميع المشرفين إلى رتبة أعضاء عاديين.');
    },
  },

  {
    name: 'تعديل_رصيد_الكل',
    aliases: ['giveall', 'مكافأة_للجميع'],
    desc: 'توزيع مبلغ مالي على جميع المستخدمين المسجلين في البوت دفعة واحدة',
    owner: true,
    async run({ text, reply, react }) {
      const n = parseInt(text);
      if (!n || n <= 0) return reply('💡 اكتب المبلغ المطلوب توزيعه على الجميع.\nمثال: */تعديل_رصيد_الكل 500*');
      const users = Object.values(db.users);
      users.forEach(u => {
        u.money = (u.money || 0) + n;
      });
      save();
      await react('🎁');
      reply(`╭━━━〔 🎁 *مكافأة جماعية عامة* 〕━━━╮\n│\n│ 💰 تم منح: *+${money(n)}* 💵 لكل مستخدم!\n│ 👥 شمل التوزيع: *${users.length}* حساباً مسجلاً.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'تصفير_جروب',
    aliases: ['resetgroup', 'تصفير_المجموعة'],
    desc: 'إعادة ضبط وحذف كافة بيانات الجروب في البوت (التحذيرات، القوانين، الإعدادات)',
    owner: true,
    group: true,
    async run({ jid, reply }) {
      delete db.groups[jid];
      save();
      reply('🔄 تم تصفير وإعادة تعيين كافة إعدادات وسجلات هذه المجموعة بالكامل.');
    },
  },

  {
    name: 'تحكم_عن_بعد',
    aliases: ['remote', 'ارسل_لـ'],
    desc: 'إرسال رسالة من البوت إلى أي رقم أو مجموعة محددة: /تحكم_عن_بعد <id/رقم> <الرسالة>',
    owner: true,
    async run({ sock, args, reply }) {
      const target = args[0];
      const message = args.slice(1).join(' ');
      if (!target || !message) {
        return reply('💡 طريقة الاستخدام:\n*/تحكم_عن_بعد <الرقم أو ID الجروب> <نص الرسالة>*');
      }
      const targetJid = target.includes('@') ? target : `${target.replace(/\D/g, '')}@s.whatsapp.net`;
      await sock.sendMessage(targetJid, { text: message });
      reply(`✅ تم إرسال الرسالة بنجاح إلى: \`${targetJid}\``);
    },
  },
];
