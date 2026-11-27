import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import { db, save, saveNow, dbFile } from '../../lib/db.js';
import { numOf, sleep, money, fmtDur, safeSendAudio } from '../../lib/utils.js';
import { commands, loadCommands } from '../../lib/loader.js';
import { ask } from '../ai/old_ai.js';

export default [
  {
    name: 'اضف_امر',
    aliases: ['addcmd'],
    desc: 'إضافة أمر مخصص سريع من الشات: /اضف_امر مرحبا أهلاً بك يا غالي',
    owner: true,
    async run({ args, reply, react }) {
      const name = (args[0] || '').toLowerCase().replace(/^[./!#]/, '');
      const response = args.slice(1).join(' ');
      if (!name || !response) return reply('💡 طريقة الاستخدام:\n*/اضف_امر <الاسم> <الرد>*\nمثال: */اضف_امر مسا مساء الفل يا زعيم*');
      db.settings.customCmds ??= {};
      db.settings.customCmds[name] = response;
      save();
      await react('✅');
      reply(`╭━━━〔 ⚡ *تمت إضافة الأمر المخصص* 〕━━━╮\n│\n│ 📌 اسم الأمر: *${name}*\n│ 💬 الرد التلقائي: "${response}"\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'اعادة_تشغيل',
    aliases: ['restart', 'ريستارت'],
    desc: 'إعادة تشغيل البوت والسيرفر بضغطة زر من واتساب',
    owner: true,
    async run({ reply, react }) {
      await react('🔄');
      await reply('🔄 جاري إعادة تشغيل سيرفر البوت الآن، سيعود للعمل خلال 15 ثانية...');
      saveNow();
      setTimeout(() => process.exit(0), 1000);
    },
  },

  {
    name: 'شوف_رسايل_الناس',
    aliases: ['logs_recent', 'اخر_الرسايل'],
    desc: 'عرض آخر التفاعلات والرسائل الواردة للبوت',
    owner: true,
    async run({ reply, react }) {
      await react('📜');
      const recent = db.settings.recentMsgs || [];
      if (!recent.length) return reply('ℹ️ لا توجد سجلات رسائل حديثة مسجلة بعد.');
      let t = `╭━━━〔 📜 *آخر رسائل المستخدمين* 〕━━━╮\n│\n`;
      recent.slice(-10).reverse().forEach((r, i) => {
        t += `│ [${i + 1}] @${r.sender}: "${r.text}"\n│     ↳ ⏱️ ${new Date(r.time).toLocaleTimeString('ar-EG')}\n`;
      });
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, recent.map(r => r.sender + '@s.whatsapp.net'));
    },
  },

  {
    name: 'وضع_الشبح',
    aliases: ['ghost_mode', 'شبح'],
    desc: 'تفعيل/إلغاء وضع الشبح (البوت خفي تماماً)',
    owner: true,
    async run({ reply, react }) {
      db.settings.ghost = !db.settings.ghost;
      save();
      await react('👻');
      reply(`╭━━━〔 👻 *وضع الشبح* 〕━━━╮\n│\n│ الحالة الآن: *${db.settings.ghost ? 'مُفعّل (خفي)' : 'مُعطّل (عادي)'}*\n│ 📌 في وضع الشبح، يعمل البوت بصمت تام دون إظهار أي مؤشرات.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
    },
  },

  {
    name: 'غير_شخصية_البوت',
    aliases: ['set_personality', 'شخصية_البوت'],
    desc: 'تغيير أسلوب ردود البوت: ساخر، جاد، رومانسي، حكيم',
    owner: true,
    async run({ args, reply, react }) {
      const mode = (args[0] || '').toLowerCase();
      const valid = ['ساخر', 'جاد', 'رومانسي', 'حكيم', 'طبيعي'];
      if (!valid.includes(mode)) {
        return reply(`💡 اختر شخصية البوت:\n*/غير_شخصية_البوت ساخر*\nالمتاح: (${valid.join(' - ')})`);
      }
      db.settings.personality = mode;
      save();
      await react('🎭');
      reply(`✅ تم تعيين شخصية البوت بنجاح إلى: *[ ${mode} ]*!`);
    },
  },

  {
    name: 'وضع_التعلم',
    aliases: ['learning_mode'],
    desc: 'تفعيل/تعطيل ميزة تعلم البوت من إجابات المطور',
    owner: true,
    async run({ reply, react }) {
      db.settings.learning = !db.settings.learning;
      save();
      await react('🧠');
      reply(`🧠 وضع التعلم الذاتي الآن: *${db.settings.learning ? 'مُفعّل 🟢' : 'مُعطّل 🔴'}*`);
    },
  },

  {
    name: 'انسخ_البوت',
    aliases: ['backup_all', 'باك_اب'],
    desc: 'أخذ نسخة احتياطية كاملة من قاعدة البيانات والإعدادات وإرسالها',
    owner: true,
    async run({ send, reply, react }) {
      await react('📦');
      saveNow();
      if (fs.existsSync(dbFile)) {
        const buf = fs.readFileSync(dbFile);
        await send({
          document: buf,
          mimetype: 'application/json',
          fileName: `no_and_no_backup_${Date.now()}.json`,
          caption: `📦 *نسخة احتياطية كاملة للبوت (Backup)*\n📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`,
        });
      } else {
        reply('❌ تعذر العثور على ملف قاعدة البيانات.');
      }
    },
  },

  {
    name: 'زر_الطوارئ',
    aliases: ['emergency', 'طوارئ'],
    desc: 'إيقاف فوري لكافة الأوامر وإعلان وضع الاستراحة',
    owner: true,
    async run({ reply, react }) {
      db.settings.emergency = !db.settings.emergency;
      save();
      await react('🚨');
      if (db.settings.emergency) {
        reply('🚨 *تم تفعيل زر الطوارئ!* البوت الآن في وضع النوم ولن يستجيب لأي عضو حتى يتم إلغاء الطوارئ.');
      } else {
        reply('🟢 *تم إلغاء زر الطوارئ!* البوت يعمل الآن بكامل طاقته لجميع الأعضاء.');
      }
    },
  },

  {
    name: 'مين_بيجرب_يخترقني',
    aliases: ['breach_logs', 'سجل_المتطفلين'],
    desc: 'عرض قائمة الأعضاء الذين حاولوا استخدام أوامر المطورين بدون إذن',
    owner: true,
    async run({ reply, react }) {
      await react('🛡️');
      const attempts = db.settings.hackAttempts || [];
      if (!attempts.length) return reply('✅ لا توجد أي محاولات مشبوهة أو اختراق مسجلة!');
      let t = `╭━━━〔 🚨 *سجل محاولات استخدام أوامر المطور* 〕━━━╮\n│\n`;
      attempts.slice(-10).reverse().forEach((a, i) => {
        t += `│ [${i + 1}] 👤 @${a.user}\n│     ↳ ⌨️ حاول كتابة: *${a.cmd}*\n│     ↳ ⏱️ ${new Date(a.time).toLocaleString('ar-EG')}\n`;
      });
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t, attempts.map(a => a.user + '@s.whatsapp.net'));
    },
  },

  {
    name: 'حولني_لمطور',
    aliases: ['add_dev', 'مطور_جديد'],
    desc: 'إضافة مطور مساعد بصلاحيات: /حولني_لمطور @شخص',
    owner: true,
    async run({ target, args, reply, react }) {
      if (!target) return reply('↩️ منشن الشخص الذي تريد ترقيته لمطور مساعد.');
      const k = numOf(target);
      db.settings.subDevs ??= [];
      if (db.settings.subDevs.includes(k)) return reply('ℹ️ هذا العضو مطور بالفعل.');
      db.settings.subDevs.push(k);
      save();
      await react('👑');
      reply(`👑 تم تعيين @${k} مطوراً مساعداً في البوت بنجاح!`, [target]);
    },
  },

  {
    name: 'اسحب_الصلاحية',
    aliases: ['remove_dev'],
    desc: 'سحب رتبة المطور المساعد: /اسحب_الصلاحية @شخص',
    owner: true,
    async run({ target, reply, react }) {
      if (!target) return reply('↩️ منشن الشخص المراد سحب الصلاحية منه.');
      const k = numOf(target);
      db.settings.subDevs = (db.settings.subDevs || []).filter(x => x !== k);
      save();
      await react('🔻');
      reply(`🔻 تم سحب صلاحيات المطور من @${k} بنجاح.`, [target]);
    },
  },

  {
    name: 'وضع_الترند',
    aliases: ['bot_trend', 'الترند'],
    desc: 'إحصائيات أكثر الأوامر طلباً اليوم والجروبات الأكثر نشاطاً',
    owner: true,
    async run({ reply, react }) {
      await react('📊');
      const counts = db.settings.cmdCounts || {};
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      let t = `╭━━━〔 📈 *تريند أكثر الأوامر استخداماً* 〕━━━╮\n│\n`;
      if (!sorted.length) {
        t += `│ لا توجد إحصائيات كافية مسجلة اليوم.\n`;
      } else {
        sorted.forEach(([cmdName, count], i) => {
          t += `│ [0${i + 1}] ▫️ *${cmdName}* ─── (${count} مرة)\n`;
        });
      }
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    },
  },

  {
    name: 'خلي_البوت_يتصل',
    aliases: ['bot_call', 'اتصال_صوتي'],
    desc: 'إرسال فويس نوت بصوت المطور للجروب أو الشخص',
    owner: true,
    async run({ text, sock, jid, m, reply, react }) {
      if (!text) return reply('💡 اكتب الكلام الذي تريد أن يقوله البوت صوتياً.\nمثال: */خلي_البوت_يتصل السلام عليكم يا شباب منورين الجروب*');
      await react('🎙️');
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=ar&client=tw-ob`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) throw new Error('فشل جلب الصوت');
        const buffer = Buffer.from(await r.arrayBuffer());
        await safeSendAudio(sock, jid, buffer, { ptt: true }, m);
      } catch (e) {
        reply(`❌ فشل الاتصال الصوتي: ${e.message}`);
      }
    },
  },

  {
    name: 'توقع_المشكلة',
    aliases: ['health_check', 'فحص_النظام'],
    desc: 'فحص صحة النظام، الذاكرة، والأخطاء وتوقع المشاكل مسبقاً',
    owner: true,
    async run({ reply, react }) {
      await react('🩺');
      const mem = process.memoryUsage();
      const ramMB = (mem.rss / 1024 / 1024).toFixed(1);
      const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
      const errorsCount = (db.settings.errors || []).length;
      let status = 'ممتازة 🟢';
      let warnings = [];

      if (ramMB > 350) warnings.push('⚠️ استهلاك الرام مرتفع نسبياً.');
      if (errorsCount > 10) warnings.push('⚠️ هناك عدة أخطاء مسجلة في سجل النظام.');
      if (!warnings.length) warnings.push('✨ كل الأنظمة تعمل بكفاءة وثبات 100%.');

      let t = `╭━━━〔 🩺 *تقرير الفحص الصحي للبوت* 〕━━━╮\n│\n`;
      t += `│ 💾 استهلاك الرام: *${ramMB} MB*\n`;
      t += `│ 🗄️ ذاكرة الهيب: *${heapMB} MB*\n`;
      t += `│ 📦 عدد الأوامر الشغالة: *${commands.size}*\n`;
      t += `│ 🚨 الأخطاء المسجلة: *${errorsCount}*\n`;
      t += `│ 🩺 الحالة العامة: *${status}*\n│\n`;
      t += `│ 📌 التوقعات والتوصيات:\n`;
      warnings.forEach(w => t += `│  ${w}\n`);
      t += `│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      reply(t);
    },
  },

  {
    name: 'وضع_الواقع_المعزز',
    aliases: ['ar_mode', 'فلتر_سينمائي'],
    desc: 'تعديل الصور وتحويلها لستايل سينمائي أو كرتوني بالذكاء الاصطناعي',
    owner: true,
    async run({ text, quotedText, reply, react, sock, jid, m }) {
      const q = text || quotedText || 'anime cyberpunk cinematic portrait';
      await react('✨');
      await reply('⏳ جاري إنشاء العمل الفني السينمائي بالواقع المعزز...');
      try {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(q + ', masterpiece, photorealistic, 8k, unreal engine 5')}?width=800&height=800&nologo=true`;
        await sock.sendMessage(jid, {
          image: { url },
          caption: `╭━━━〔 🎬 *وضع الواقع المعزز السينمائي* 〕━━━╮\n│\n│ 🎨 النمط: Cinematic Render\n│ 📝 الفكرة: ${q}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        }, { quoted: m });
      } catch (e) {
        reply(`❌ فشل المعالجة: ${e.message}`);
      }
    },
  },

  {
    name: 'حدث_نفسك',
    aliases: ['update_bot', 'تحديث_البوت', 'git_pull', 'سحب_التحديثات'],
    desc: 'سحب آخر التحديثات البرمجية مباشرة من GitHub (git pull) وإعادة تحميل البوت تلقائياً',
    owner: true,
    async run({ reply, react }) {
      await react('🔄');
      await reply('⏳ جاري فحص المستودع والتحديثات البرمجية...');
      try {
        if (!fs.existsSync('.git')) {
          return reply(`╭───〔 ⚡ *تحديث البوت البرمجي* 〕───╮\n│\n` +
            `│ 📦 *حالة الاستضافة:* السيرفر يعمل بنظام الحزم المباشرة (Zip Archive) بدون Git.\n` +
            `│ 🚀 *لتحديث البوت فوراً وبأحدث إصدار:*\n` +
            `│    قم برفع ملف *[ bot_update.zip ]* الأخير على ريلواي، وسيعاد تشغيل السيرفر تلقائياً بأحدث الأوامر!\n│\n` +
            `╰────────────────────────────╯`);
        }
        let gitOutput = '';
        try {
          const { execSync } = await import('child_process');
          gitOutput = execSync('git pull --no-rebase', { encoding: 'utf8', timeout: 35000 }).trim();
        } catch (gitErr) {
          gitOutput = gitErr.stdout || gitErr.message;
        }

        await loadCommands();

        const isUpToDate = /Already up to date|Already up-to-date/i.test(gitOutput);
        const msg = `╭───〔 ⚡ *تحديث البوت البرمجي* 〕───╮\n│\n` +
          `│ 📡 *حالة المستودع:* ${isUpToDate ? '✅ البوت على أحدث إصدار بالفعل!' : '🚀 تم سحب كود جديد بنجاح!'}\n` +
          `│ 📝 *تقرير Git:*\n│ ${gitOutput.slice(0, 300).replace(/\n/g, '\n│ ')}\n` +
          `│\n│ 📦 *الأوامر النشطة:* ${commands.size} أمر جاهز\n` +
          `│ 💡 _${isUpToDate ? 'لم تكن هناك ملفات جديدة للتحديث.' : 'تم تحديث الملفات وسيعاد تشغيل السيرفر لتطبيق التغييرات الجوهرية...'}\n` +
          `╰────────────────────────────╯`;
        await reply(msg);

        if (!isUpToDate) {
          setTimeout(() => process.exit(0), 2000);
        }
      } catch (e) {
        reply(`❌ فشل التحديث التلقائي: ${e.message}`);
      }
    },
  },

  {
    name: 'نقل_الملكية',
    aliases: ['transfer_owner'],
    desc: 'نقل ملكية البوت الأساسية لرقم جديد: /نقل_الملكية 2010...',
    owner: true,
    async run({ args, reply, react }) {
      const newNum = (args[0] || '').replace(/\D/g, '');
      if (newNum.length < 8) return reply('💡 اكتب رقم المطور الجديد كاملاً بالصيغة الدولية.\nمثال: */نقل_الملكية 201123456789*');
      db.settings.primaryOwner = newNum;
      save();
      await react('👑');
      reply(`👑 تم نقل ملكية البوت بالكامل للرقم: *+${newNum}*!`);
    },
  },

  {
    name: 'اعادة_ضبط_المصنع',
    aliases: ['factory_reset'],
    desc: 'تصفير كافة الإعدادات والبيانات بالكامل (حذر!)',
    owner: true,
    async run({ args, reply, react }) {
      if (args[0] !== 'تاكيد') {
        return reply('⚠️ *تحذير خطير جداً!*\nهذا الأمر سيمسح كل بيانات البوت ويرجعه كأول يوم.\nللتأكيد اكتب: */اعادة_ضبط_المصنع تاكيد*');
      }
      db.users = {};
      db.groups = {};
      db.settings = { banned: [], disabled: [] };
      saveNow();
      await react('💥');
      reply('💥 تم إعادة ضبط المصنع للبوت بنجاح! تم تصفير كافة السجلات.');
    },
  },

  {
    name: 'اقفل_البوت_للابد',
    aliases: ['lock_bot'],
    desc: 'قفل البوت بالكامل برمز سري لا يفتحه غيرك',
    owner: true,
    async run({ args, reply, react }) {
      const pin = args[0];
      if (!pin) return reply('💡 اكتب الرمز السري للقفل.\nمثال: */اقفل_البوت_للابد 1234*');
      db.settings.lockPin = pin;
      db.settings.locked = true;
      save();
      await react('🔒');
      reply(`🔒 تم قفل البوت برمز سري بنجاح! لن يستجيب البوت لأي أمر حتى كتابة: */افتح_البوت ${pin}*`);
    },
  },

  {
    name: 'افتح_البوت',
    aliases: ['unlock_bot'],
    desc: 'فتح قفل البوت بالرمز السري',
    owner: true,
    async run({ args, reply, react }) {
      const pin = args[0];
      if (pin !== db.settings.lockPin) return reply('❌ رمز PIN غير صحيح!');
      db.settings.locked = false;
      delete db.settings.lockPin;
      save();
      await react('🔓');
      reply('🔓 تم فك قفل البوت بنجاح! البوت يعمل الآن بشكل طبيعي.');
    },
  },

  {
    name: 'وضع_المالك_الوحيد',
    aliases: ['sole_owner'],
    desc: 'إلغاء كافة المطورين المساعدين وحصر التحكم بك وحدك',
    owner: true,
    async run({ reply, react }) {
      db.settings.subDevs = [];
      save();
      await react('👑');
      reply('👑 تم تفعيل وضع المالك الوحيد! تم عزل كافة المطورين المساعدين وحصر الصلاحيات بالكامل فيك وحدك.');
    },
  },

  {
    name: 'غير_اسم_البوت_في_كل_مكان',
    aliases: ['set_all_botname'],
    desc: 'تغيير اسم البوت الرسمي في كافة القوائم: /غير_اسم_البوت_في_كل_مكان الاسم',
    owner: true,
    async run({ text, reply, react }) {
      if (!text) return reply('💡 اكتب الاسم الجديد للبوت.');
      config.botName = text.trim();
      config.developer = text.trim();
      db.settings.customBotName = text.trim();
      save();
      await react('🏷️');
      reply(`✅ تم تحديث اسم البوت في كل مكان بنجاح إلى: *${text.trim()}*!`);
    },
  },

  {
    name: 'سجل_كل_حاجة',
    aliases: ['full_logger'],
    desc: 'تفعيل/إلغاء تسجيل كل رسالة وأمر في ملف تقرير يومي',
    owner: true,
    async run({ reply, react }) {
      db.settings.fullLogging = !db.settings.fullLogging;
      save();
      await react('📝');
      reply(`📝 وضع تسجيل كل حركة الآن: *${db.settings.fullLogging ? 'مُفعّل 🟢' : 'مُعطّل 🔴'}*`);
    },
  },

  {
    name: 'استدعاء_طارئ',
    aliases: ['emergency_call'],
    desc: 'إرسال بيانات البوت والنسخة الاحتياطية لرقمك الاحتياطي',
    owner: true,
    async run({ text, sock, reply, react }) {
      const targetPhone = (text || '').replace(/\D/g, '');
      if (targetPhone.length < 8) return reply('💡 اكتب الرقم الاحتياطي لاستلام البيانات.\nمثال: */استدعاء_طارئ 201123456789*');
      await react('📡');
      try {
        saveNow();
        const jid = targetPhone + '@s.whatsapp.net';
        await sock.sendMessage(jid, {
          text: `🚨 *استدعاء طارئ من مطور البوت!*\n📦 تم طلب إرسال النسخة الاحتياطية لبيانات السيرفر الآن.`,
        });
        if (fs.existsSync(dbFile)) {
          const buf = fs.readFileSync(dbFile);
          await sock.sendMessage(jid, {
            document: buf,
            mimetype: 'application/json',
            fileName: 'emergency_backup.json',
          });
        }
        reply(`✅ تم إرسال بيانات الاستدعاء الطارئ إلى الرقم: *+${targetPhone}* بنجاح!`);
      } catch (e) {
        reply(`❌ فشل الإرسال للرقم الاحتياطي: ${e.message}`);
      }
    },
  },

  // ══════════════════════════════════════════════════════
  // 👑 نظام المطورين المساعدين المتقدم (مع إلزامية تحديد الصلاحيات أولاً)
  // ══════════════════════════════════════════════════════
  {
    name: 'رفع_مساعد',
    aliases: ['add_assistant', 'ترقية_مساعد', 'تعيين_مساعد'],
    desc: 'رفع مطور مساعد مع إلزامية تحديد الصلاحيات الممنوحة له أولاً',
    owner: true,
    async run({ args, target, reply, react }) {
      const validPerms = ['بث', 'طرد', 'حظر', 'قفل', 'ريستارت', 'تحديث', 'كاملة'];
      if (!target) {
        return reply(`⚠️ *يرجى عمل منشن للمستخدم أو الرد على رسالته أو كتابة رقمه.*\n\n💡 مثال:\n*.رفع_مساعد @user بث طرد*\nأو\n*.رفع_مساعد 2010... كاملة*`);
      }

      // استخراج الصلاحيات المكتوبة بعد المنشن أو الرقم
      const givenPerms = args.filter(a => !a.startsWith('@') && !/^\d{7,15}$/.test(a.replace(/\D/g, ''))).map(p => p.toLowerCase());

      // إذا لم يحدد الصلاحيات، يتم الرفض فوراً مع شرح الصلاحيات المتاحة
      if (!givenPerms.length || !givenPerms.some(p => validPerms.includes(p))) {
        return reply(`⛔ *خطأ: لا يمكن رفع المساعد بدون تحديد الصلاحيات أولاً!*\n\n` +
          `📌 *الصلاحيات المتاحة للاختيار:*\n` +
          `▫️ *بث* : إرسال رسائل إذاعية لكافة الجروبات\n` +
          `▫️ *طرد* : طرد الأعضاء من المجموعات\n` +
          `▫️ *حظر* : حظر المستخدمين من استخدام البوت\n` +
          `▫️ *قفل* : قفل وفتح المجموعات\n` +
          `▫️ *ريستارت* : إعادة تشغيل سيرفر البوت\n` +
          `▫️ *تحديث* : سحب وتحديث الأوامر من جيت هاب\n` +
          `▫️ *كاملة* : منح كافة الصلاحيات بدون قيود\n\n` +
          `💡 *طريقة الاستخدام الصحيحة:*\n` +
          `*/رفع_مساعد @user بث طرد*\n` +
          `*/رفع_مساعد @user كاملة*`);
      }

      const assignedPerms = givenPerms.includes('كاملة') ? ['كاملة'] : [...new Set(givenPerms.filter(p => validPerms.includes(p)))];

      db.settings.assistants ??= {};
      db.settings.assistants[target] = {
        perms: assignedPerms,
        addedAt: Date.now(),
      };
      save();

      await react('🎖️');
      reply(`╭───〔 🎖️ *ترقية مطور مساعد جديد* 〕───╮\n│\n` +
        `│ 👤 *المساعد:* @${target.split('@')[0]}\n` +
        `│ 🔑 *الصلاحيات المحددة:* ${assignedPerms.map(p => `[${p}]`).join(' ')}\n` +
        `│ 👑 *المُرقِّي:* مالك البوت\n│\n` +
        `│ ⚡ أصبح للمساعد حق استخدام الأوامر المخصصة لصلاحياته فقط.\n` +
        `╰────────────────────────────╯`, [target]);
    },
  },

  {
    name: 'سحب_مساعد',
    aliases: ['remove_assistant', 'تنزيل_مساعد', 'طرد_مساعد'],
    desc: 'سحب رتبة المطور المساعد وإلغاء كافة صلاحياته فوراً',
    owner: true,
    async run({ target, reply, react }) {
      if (!target) return reply('💡 يرجى عمل منشن للمساعد أو كتابة رقمه لسحب الرتبة منه.');
      if (!db.settings.assistants || !db.settings.assistants[target]) {
        return reply('ℹ️ هذا المستخدم ليس مطوراً مساعداً في البوت أصلاً.');
      }

      delete db.settings.assistants[target];
      save();

      await react('🗑️');
      reply(`╭───〔 🗑️ *سحب رتبة المساعد* 〕───╮\n│\n` +
        `│ 👤 *المستخدم:* @${target.split('@')[0]}\n` +
        `│ ❌ *الحالة:* تم تجريده من كافة الصلاحيات بنجاح.\n│\n` +
        `╰────────────────────────────╯`, [target]);
    },
  },

  {
    name: 'المساعدين',
    aliases: ['assistants', 'قائمة_المساعدين', 'مطورين_مساعدين'],
    desc: 'عرض قائمة كافة المطورين المساعدين المعينين وصلاحيات كل منهم',
    owner: true,
    async run({ reply, react }) {
      await react('📋');
      const list = Object.entries(db.settings.assistants || {});
      if (!list.length) return reply('ℹ️ لا يوجد أي مطورين مساعدين مسجلين حالياً.\n💡 لرفع مساعد استخدم أمر: *.رفع_مساعد @user [صلاحيات]*');

      let msg = `╭───〔 🎖️ *فريق المطورين المساعدين* 〕───╮\n│\n`;
      list.forEach(([jid, data], i) => {
        const num = jid.split('@')[0];
        const perms = (data.perms || []).join('، ');
        msg += `│ [0${i + 1}] 👤 @${num}\n│     🔑 الصلاحيات: *${perms}*\n│\n`;
      });
      msg += `╰────────────────────────────╯`;
      reply(msg, list.map(([jid]) => jid));
    },
  },

  {
    name: 'تقرير_النظام',
    aliases: ['sys_report', 'حالة_السيرفر', 'معلومات_السيرفر'],
    desc: 'تقرير شامل ومفصل عن حالة السيرفر، الرام، المعالج، والأوامر',
    owner: true,
    async run({ reply, react }) {
      await react('🖥️');
      const os = await import('os');
      const uptimeSec = process.uptime();
      const mem = process.memoryUsage();

      const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
      const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

      const d = Math.floor(uptimeSec / 86400);
      const h = Math.floor((uptimeSec % 86400) / 3600);
      const m = Math.floor((uptimeSec % 3600) / 60);
      const s = Math.floor(uptimeSec % 60);

      const totalUsers = Object.keys(db.users || {}).length;
      const totalGroups = Object.keys(db.groups || {}).length;

      const report = `╭───〔 🖥️ *تقرير أداء السيرفر والنظام* 〕───╮\n│\n` +
        `│ ⚙️ *النظام:* ${os.platform()} (${os.arch()})\n` +
        `│ 🟢 *إصدار Node.js:* ${process.version}\n` +
        `│ ⏱️ *مدة التشغيل المتواصل:* ${d} يوم، ${h} ساعة، ${m} دقيقة، ${s} ثانية\n` +
        `│ 💾 *استهلاك الرام (RSS):* ${rssMB} MB\n` +
        `│ 🧠 *استهلاك Heap:* ${heapMB} MB\n` +
        `│ 🖥️ *ذاكرة السيرفر الكلية:* ${totalMem} GB (المتاح: ${freeMem} GB)\n` +
        `│ 📦 *إجمالي الأوامر النشطة:* ${commands.size} أمر\n` +
        `│ 👥 *المستخدمين في القاعدة:* ${totalUsers} عضو\n` +
        `│ 👥 *المجموعات المسجلة:* ${totalGroups} مجموعة\n│\n` +
        `╰────────────────────────────╯`;
      reply(report);
    },
  },

  {
    name: 'تنظيف_الذاكرة',
    aliases: ['clean_ram', 'تفريغ_الكاش', 'تفريغ_الرام'],
    desc: 'تفريغ الذاكرة المؤقتة ومسح الملفات المؤقتة لتسريع البوت فورياً',
    owner: true,
    async run({ reply, react }) {
      await react('🧹');
      const os = await import('os');
      const tmp = os.tmpdir();
      let cleaned = 0;
      try {
        if (global.gc) {
          global.gc();
        }
      } catch {}

      try {
        const botTmp = path.join(tmp, 'no-and-no-bot');
        if (fs.existsSync(botTmp)) {
          const files = fs.readdirSync(botTmp);
          for (const f of files) {
            try {
              fs.rmSync(path.join(botTmp, f), { force: true });
              cleaned++;
            } catch {}
          }
        }
      } catch {}

      const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      reply(`╭───〔 🧹 *تنظيف الذاكرة المؤقتة* 〕───╮\n│\n│ ✅ تم تنظيف الملفات المؤقتة (${cleaned} ملف)!\n│ ⚡ استهلاك الرام الحالي: *${mem} MB*\n│ 🚀 البوت يعمل الآن بأعلى استقرار وسرعة.\n│\n╰────────────────────────────╯`);
    },
  },

  {
    name: 'حظر_عام',
    aliases: ['gban', 'حظر_شامل', 'طرد_عام'],
    desc: 'حظر مستخدم حظراً عاماً من التفاعل مع البوت في كافة الجروبات والخاص',
    owner: true,
    async run({ target, args, reply, react }) {
      if (!target) return reply('💡 يرجى عمل منشن للمستخدم أو كتابة رقمه لحظره عاماً.');
      db.settings.banned ??= [];
      if (db.settings.banned.includes(target)) {
        return reply('ℹ️ هذا المستخدم محظور عاماً بالفعل.');
      }
      db.settings.banned.push(target);
      save();
      await react('🚫');
      const reason = args.slice(1).join(' ') || 'مخالفة القوانين';
      reply(`╭───〔 🚫 *حظر عام شامل* 〕───╮\n│\n│ 👤 *المحظور:* @${target.split('@')[0]}\n│ 📝 *السبب:* ${reason}\n│ 🔒 تم منعه من استخدام أي أمر في البوت نهائياً.\n│\n╰────────────────────────────╯`, [target]);
    },
  },

  {
    name: 'فك_حظر_عام',
    aliases: ['ungban', 'الغاء_حظر_عام'],
    desc: 'فك الحظر العام عن مستخدم وإعادة صلاحيته لاستخدام البوت',
    owner: true,
    async run({ target, reply, react }) {
      if (!target) return reply('💡 يرجى منشن المستخدم أو كتابة رقمه لفك الحظر عنه.');
      db.settings.banned ??= [];
      db.settings.banned = db.settings.banned.filter(x => x !== target);
      save();
      await react('✅');
      reply(`✅ تم فك الحظر العام عن @${target.split('@')[0]} بنجاح!`, [target]);
    },
  },

  {
    name: 'المحظورين_عاما',
    aliases: ['banned_list', 'قائمة_المحظورين'],
    desc: 'عرض قائمة كافة المستخدمين المحظورين عاماً من البوت',
    owner: true,
    async run({ reply, react }) {
      await react('📜');
      const list = db.settings.banned || [];
      if (!list.length) return reply('ℹ️ لا يوجد أي مستخدم محظور عاماً حالياً.');
      let t = `╭───〔 🚫 *قائمة المحظورين عاماً* (${list.length}) 〕───╮\n│\n`;
      list.forEach((jid, i) => {
        t += `│ [0${i + 1}] @${jid.split('@')[0]}\n`;
      });
      t += `│\n╰────────────────────────────╯`;
      reply(t, list);
    },
  },

  // ══════════════════════════════════════════════════════
  // 🎛️ أدوات التحكم الشامل والسيادة الكاملة للمطور
  // ══════════════════════════════════════════════════════
  {
    name: 'تحكم_شامل',
    aliases: ['dashboard', 'لوحة_التحكم', 'كنترول'],
    desc: 'لوحة التحكم والسيادة الشاملة على كافة وظائف ومودات وسيرفر البوت',
    owner: true,
    async run({ reply, react }) {
      await react('🎛️');
      const activeTheme = db.settings.activeTheme || 'horror';
      const assistantsCount = Object.keys(db.settings.assistants || {}).length;
      const bannedCount = (db.settings.banned || []).length;
      const disabledCmds = (db.settings.disabled || []).length;
      const usersCount = Object.keys(db.users || {}).length;
      const groupsCount = Object.keys(db.groups || {}).length;

      const panel = `╭───〔 🎛️ *لوحة القيادة والتحكم الشامل* 〕───╮\n│\n` +
        `│ 👑 *المطور الأساسي:* ${config.developer}\n` +
        `│ 🎭 *المود الحالي:* *${activeTheme.toUpperCase()}*\n` +
        `│ 🖼️ *عرض صور الرعب مع الأوامر:* ${db.settings.cardImageEnabled !== false ? 'مُفعّل 🟢' : 'مُعطّل 🔴'}\n` +
        `│ 🎖️ *المطورين المساعدين:* ${assistantsCount} مساعد\n` +
        `│ 🚫 *المحظورين عاماً:* ${bannedCount} عضو\n` +
        `│ 🔒 *الأوامر المعطلة:* ${disabledCmds} أمر\n` +
        `│ 👥 *إجمالي المستخدمين:* ${usersCount}\n` +
        `│ 👥 *إجمالي المجموعات:* ${groupsCount}\n│\n` +
        `│ 📌 *أوامر التحكم السريع:*\n` +
        `│ ▫️ *.حدث_نفسك* (سحب تحديثات Git فورياً)\n` +
        `│ ▫️ *.مود <اسم المود>* (تبديل ثيم البوت)\n` +
        `│ ▫️ *.صورة_الاوامر تشغيل/تعطيل*\n` +
        `│ ▫️ *.رفع_مساعد @user [صلاحيات]*\n` +
        `│ ▫️ *.قفل_الاوامر <اسم الأمر>*\n` +
        `│ ▫️ *.تعديل_رصيد @user <المبلغ>*\n` +
        `│ ▫️ *.تنظيف_الذاكرة* (تسريع فوري)\n│\n` +
        `╰────────────────────────────╯`;
      reply(panel);
    },
  },

  {
    name: 'قفل_الاوامر',
    aliases: ['disable_cmd', 'تعطيل_امر'],
    desc: 'تعطيل أمر معين مؤقتاً ومنع الأعضاء من استخدامه: .قفل_الاوامر بنك',
    owner: true,
    async run({ args, reply, react }) {
      const cmdName = (args[0] || '').toLowerCase().replace(/^[./!#]/, '');
      if (!cmdName) return reply('💡 اكتب اسم الأمر الذي تريد تعطيله.\nمثال: *.قفل_الاوامر سرقة*');
      db.settings.disabled ??= [];
      if (!db.settings.disabled.includes(cmdName)) {
        db.settings.disabled.push(cmdName);
        save();
      }
      await react('🔒');
      reply(`🔒 تم تعطيل الأمر *${cmdName}* بنجاح! لن يتمكن الأعضاء من استخدامه حتى يتم فتحه.`);
    },
  },

  {
    name: 'فتح_الاوامر',
    aliases: ['enable_cmd', 'تفعيل_امر'],
    desc: 'إعادة تفعيل أمر كان معطلاً',
    owner: true,
    async run({ args, reply, react }) {
      const cmdName = (args[0] || '').toLowerCase().replace(/^[./!#]/, '');
      if (!cmdName) return reply('💡 اكتب اسم الأمر لإلغاء تعطيله.');
      db.settings.disabled ??= [];
      db.settings.disabled = db.settings.disabled.filter(c => c !== cmdName);
      save();
      await react('🔓');
      reply(`🔓 تم إعادة تفعيل الأمر *${cmdName}* بنجاح! أصبح متاحاً الآن.`);
    },
  },

  {
    name: 'تعديل_رصيد',
    aliases: ['set_money', 'اعطاء_فلوس', 'خصم_فلوس'],
    desc: 'تعديل رصيد كاش أي عضو مباشرة بالزيادة أو النقصان: .تعديل_رصيد @user 5000',
    owner: true,
    async run({ target, args, reply, react }) {
      if (!target) return reply('💡 اعمل منشن للمستخدم وحدد المبلغ.\nمثال: *.تعديل_رصيد @user 5000*');
      const amount = parseInt(args.find(a => /^-?\d+$/.test(a))) || 0;
      if (!amount) return reply('💡 حدد المبلغ رقماً صحيحاً (موجب للإضافة أو سالب للخصم).');
      db.users[target] ??= { money: 100, bank: 0, level: 1, xp: 0 };
      db.users[target].money = Math.max(0, (db.users[target].money || 0) + amount);
      save();
      await react('💰');
      reply(`💰 تم تعديل رصيد @${target.split('@')[0]} بمقدار *${amount > 0 ? '+' : ''}${amount}* كاش!\n💵 الرصيد الحالي الآن: *${db.users[target].money}* كاش.`, [target]);
    },
  },

  {
    name: 'بث_مساعدين',
    aliases: ['bc_assistants', 'نداء_المساعدين'],
    desc: 'إرسال رسالة بث وتوجيه خاص لكافة المطورين المساعدين فقط',
    owner: true,
    async run({ text, reply, react, sock }) {
      if (!text) return reply('💡 اكتب نص الرسالة التي تريد إرسالها لفريق المساعدين.');
      const assistants = Object.keys(db.settings.assistants || {});
      if (!assistants.length) return reply('ℹ️ لا يوجد أي مطورين مساعدين مسجلين لإرسال البث لهم.');
      await react('📢');
      let sentCount = 0;
      for (const jid of assistants) {
        try {
          await sock.sendMessage(jid, {
            text: `╭───〔 📢 *تعميم رسمي من المطور الأساسي* 〕───╮\n│\n${text}\n│\n╰────────────────────────────╯`,
          });
          sentCount++;
        } catch {}
      }
      reply(`✅ تم إرسال البث بنجاح إلى *${sentCount}* مطور مساعد.`);
    },
  },
];
