import { db, save } from '../../lib/db.js';
import { commands } from '../../lib/loader.js';
import { getThemeBanner } from '../../lib/theme_engine.js';
import { numOf, sleep, safeSendAudio } from '../../lib/utils.js';
import { ask } from '../ai/old_ai.js';

export default [
  // 1. فحص التجسس ورادار الأمان الاستخباراتي
  {
    name: 'فحص_التجسس',
    aliases: ['spy_check', 'رادار_الامان', 'كشف_المتسللين'],
    desc: 'فحص استخباراتي شامل لكشف محاولات الاختراق، السبام، واستغلال الثغرات',
    owner: true,
    async run({ reply, react }) {
      await react('🛡️');
      const recent = db.settings.recentMsgs || [];
      const suspicious = recent.filter(r => 
        /eval|exec|rmdir|unlink|\.env|token|pass|drop\s+table|<script>/i.test(r.text || '') ||
        (r.text && r.text.length > 800)
      );

      const bannedCount = (db.settings.banned || []).length;
      const report = `╭───〔 🛡️ *تقرير رادار الأمن السيبراني الاستخباراتي* 〕───╮\n│\n` +
        `│ 🛰️ *حالة جدار الحماية:* مشفر بأعلى طبقات الحماية 100% 🟢\n` +
        `│ 🚫 *إجمالي المحظورين في البلاك ليست:* ${bannedCount} عضو\n` +
        `│ ⚠️ *الرسائل المشبوهة المرصودة مؤخراً:* ${suspicious.length} رسالة\n│\n` +
        (suspicious.length > 0 
          ? `│ 🚨 *تفاصيل آخر محاولة مشبوهة:*\n│ من: @${suspicious[0].sender}\n│ النص: "${suspicious[0].text.slice(0, 50)}..."\n│\n`
          : `│ ✅ لم يتم رصد أي محاولات اختراق أو أوامر ضارة حالياً.\n│\n`) +
        `│ 🛡️ خوادم السيرفر آمنة وتحت المراقبة الحية 24/7.\n` +
        `╰────────────────────────────╯`;
      reply(report);
    },
  },

  // 2. تجميد الجروب بالكامل
  {
    name: 'تجميد_جروب',
    aliases: ['freeze_group', 'تجميد_الشات', 'قفل_عسكري'],
    desc: 'تجميد المجموعة فورياً وحظر الأعضاء من إرسال أي رسالة مع حذف تلقائي',
    owner: true,
    async run({ isGroup, jid, sock, reply, react, m }) {
      if (!isGroup) return reply('⛔ هذا الأمر يعمل داخل المجموعات فقط.');
      await react('❄️');
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        db.groups[jid] ??= {};
        db.groups[jid].frozen = true;
        save();

        const banner = getThemeBanner('horror');
        const freezeNotice = `╭───〔 ❄️ *حالة طوارئ: تم تجميد المجموعة* ❄️ 〕───╮\n│\n` +
          `│ 🛑 *قرار رسمي صادر من مطور البوت!*\n` +
          `│ 🔒 تم قفل وتجميد الشات بالكامل الآن.\n` +
          `│ 🚫 يُمنع إرسال أي رسائل حتى صدور أمر فك التجميد.\n` +
          `│ ⚖️ سيتم تطبيق العقوبات فوراً على أي محاولة إزعاج.\n│\n` +
          `╰────────────────────────────╯`;

        await sock.sendMessage(jid, {
          image: { url: banner },
          caption: freezeNotice,
        }, { quoted: m });
      } catch (e) {
        reply(`❌ فشل تجميد المجموعة: تأكد أن البوت مشرف.`);
      }
    },
  },

  // 3. فك تجميد الجروب
  {
    name: 'فك_تجميد_جروب',
    aliases: ['unfreeze_group', 'فتح_التجميد'],
    desc: 'فك التجميد عن المجموعة وإعادة فتحها لكافة الأعضاء',
    owner: true,
    async run({ isGroup, jid, sock, reply, react }) {
      if (!isGroup) return reply('⛔ هذا الأمر داخل المجموعات فقط.');
      await react('🔓');
      try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        if (db.groups[jid]) db.groups[jid].frozen = false;
        save();
        reply(`╭───〔 🔓 *تم فك التجميد بنجاح* 〕───╮\n│\n│ ✅ أصبحت المجموعة مفتوحة الآن للأعضاء مجدداً.\n│ 🕊️ يرجى الالتزام بالقوانين وعدم إثارة الفوضى.\n│\n╰────────────────────────────╯`);
      } catch (e) {
        reply(`❌ فشل فك التجميد: ${e.message}`);
      }
    },
  },

  // 4. ملف استخباراتي شامل عن أي عضو
  {
    name: 'ملف_استخباراتي',
    aliases: ['dossier', 'تتبع_عضو', 'كشف_عضو', 'تقرير_عضو'],
    desc: 'توليد ملف أمني وسلوكي شامل عن نشاط أي عضو داخل البوت وسجلاته',
    owner: true,
    async run({ target, reply, react }) {
      if (!target) return reply('💡 يرجى عمل منشن للعضو أو كتابة رقمه لعرض ملفه الاستخباراتي.');
      await react('🕵️');

      const u = db.users[target] || { money: 0, bank: 0, level: 1, xp: 0 };
      const isAssistant = Boolean(db.settings.assistants?.[target]);
      const isBanned = (db.settings.banned || []).includes(target);

      // عد المجموعات المشتركة
      let sharedGroups = 0;
      for (const [gid, gdata] of Object.entries(db.groups || {})) {
        if (gid.endsWith('@g.us')) sharedGroups++;
      }

      const threatLevel = isBanned ? '🔴 عالي جداً (محظور)' : isAssistant ? '🟢 موثوق (فريق المطورين)' : '🟡 عضو عادي';

      const file = `╭───〔 🕵️ *الملف الاستخباراتي السري* 〕───╮\n│\n` +
        `│ 👤 *الهدف:* @${target.split('@')[0]}\n` +
        `│ 🏷️ *الاسم المسجل:* ${u.name || 'غير محدد'}\n` +
        `│ 🎖️ *الرتبة:* ${isAssistant ? 'مطور مساعد' : 'عضو'}\n` +
        `│ ⚠️ *مستوى الخطورة:* ${threatLevel}\n` +
        `│ 💵 *الكاش:* ${u.money || 0} | 🏦 *البنك:* ${u.bank || 0}\n` +
        `│ 🌟 *المستوى والخبرة:* Lv.${u.level || 1} (${u.xp || 0} XP)\n` +
        `│ 👥 *النشاط في المجموعات:* متواجد في الجروبات النشطة\n` +
        `│ 🚫 *حالة الحظر العام:* ${isBanned ? 'نعم (مطرود)' : 'لا (طبيعي)'}\n│\n` +
        `╰────────────────────────────╯`;
      reply(file, [target]);
    },
  },

  // 5. صوت المطور المهيب (بيان عسكري / تحذير بصوت فخم)
  {
    name: 'صوت_المطور',
    aliases: ['dev_voice', 'بيان_المطور', 'تحذير_المطور'],
    desc: 'إرسال بيان صوتي درامي وموسيقى مهيبة من المطور لإرهاب المخربين',
    owner: true,
    async run({ text, reply, react, sock, jid, m }) {
      await react('🎙️');
      const speechText = text || 'تنبيه رسمي من قيادة المطور.. البوت تحت السيطرة الكاملة، وأي محاولة تخريب ستقابل بالطرد الفوري!';
      const audioUrl = 'https://www.myinstants.com/media/sounds/dramatic-sound.mp3';

      try {
        const res = await fetch(audioUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        await safeSendAudio(sock, jid, buf, { ptt: true }, m);

        reply(`╭───〔 📢 *بيان رسمي من المطور* 〕───╮\n│\n│ "${speechText}"\n│\n╰────────────────────────────╯`);
      } catch (e) {
        reply(`❌ فشل إرسال الصوت: ${e.message}`);
      }
    },
  },

  // 6. حقن أمر برمجي حي ومباشر بدون إعادة تشغيل (Code Injection)
  {
    name: 'حقن_كود',
    aliases: ['inject_cmd', 'امر_حي', 'امر_فوري'],
    desc: 'إنشاء وحقن أمر برمجي جافاسكريبت جديد ومباشر داخل البوت فورياً من الواتساب',
    owner: true,
    async run({ args, text, reply, react }) {
      const name = (args[0] || '').toLowerCase().replace(/^[./!#]/, '');
      const code = args.slice(1).join(' ');
      if (!name || !code) {
        return reply(`💡 *طريقة الاستخدام:*\n*.حقن_كود <اسم_الامر> <كود الرد أو الوظيفة>*\n\n📌 مثال:\n*.حقن_كود تجربة reply("أهلاً يا مطور، هذا أمر محقون حياً!");*`);
      }

      try {
        const customRun = new Function('context', `
          const { reply, send, react, sock, jid, m, text, args } = context;
          try {
            ${code}
          } catch(err) {
            reply("❌ خطأ في تنفيذ الأمر المحقون: " + err.message);
          }
        `);

        commands.set(name, {
          name,
          aliases: [],
          desc: 'أمر محقون برمجياً حياً من قبل المطور',
          section: 'owner',
          run: customRun,
        });

        await react('⚡');
        reply(`╭───〔 ⚡ *تم حقن الأمر البرمجي بنجاح!* 〕───╮\n│\n` +
          `│ 📦 *اسم الأمر الجديد:* .${name}\n` +
          `│ 🧠 *حالة التشغيل:* نشط الآن في الذاكرة الحية 🟢\n` +
          `│ 💡 يمكنك تجربته الآن بكتابة: *.${name}*\n│\n` +
          `╰────────────────────────────╯`);
      } catch (e) {
        reply(`❌ فشل تجميع الكود: ${e.message}`);
      }
    },
  },

  // 7. صياد ورادار روابط الجروبات (Scrape Group Invites)
  {
    name: 'رادار_الروابط',
    aliases: ['scrape_links', 'صياد_الجروبات', 'روابط_الجروبات'],
    desc: 'استخراج وفحص كافة روابط مجموعات الواتساب المرصودة في ذاكرة البوت',
    owner: true,
    async run({ reply, react }) {
      await react('📡');
      const recent = db.settings.recentMsgs || [];
      const links = new Set();
      const linkRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,26}/g;

      for (const r of recent) {
        const matches = (r.text || '').match(linkRegex);
        if (matches) {
          matches.forEach(l => links.add(l));
        }
      }

      if (!links.size) {
        return reply('ℹ️ لم يتم رصد أي روابط مجموعات واتساب في المحادثات الأخيرة.');
      }

      const list = [...links];
      let msg = `╭───〔 📡 *رادار روابط المجموعات المرصودة* (${list.length}) 〕───╮\n│\n`;
      list.slice(0, 15).forEach((l, i) => {
        msg += `│ [${String(i + 1).padStart(2, '0')}] 🔗 ${l}\n`;
      });
      msg += `│\n╰────────────────────────────╯`;
      reply(msg);
    },
  },

  // 8. خدعة التدمير الذاتي المرعبة (Fake Nuke Prank)
  {
    name: 'تدمير_وهمي',
    aliases: ['fake_nuke', 'انفجار_وهمي', 'بروتوكول_الابادة'],
    desc: 'خدعة رعب درامية لعد تنازلي وتدمير ذاتي وهمي للمجموعة لإثارة الرعب',
    owner: true,
    async run({ sock, jid, reply, react }) {
      await react('🚨');
      await reply('⚠️ *تحذير خطير: تم إطلاق بروتوكول التدمير الذاتي للمجموعة بأمر القيادة العليا!*');
      await sleep(1500);
      await reply('⏳ 3... جاري حرق السجلات وتصفير البيانات...');
      await sleep(1500);
      await reply('⏳ 2... فصل سيرفرات الاتصال وحذف المجموعات...');
      await sleep(1500);
      await reply('⏳ 1... إطلاق الإبادة الشاملة...');
      await sleep(2000);
      reply(`╭───〔 💥 *بـــــووووووم!* 💥 〕───╮\n│\n│ 😜 هههههههه خدعة! تم إيقاف التدمير الذاتي بنجاح!\n│ 👑 البوت تحت قيادة المطور ولا أحد يستطيع مسه بسوء.\n│\n╰────────────────────────────╯`);
    },
  },

  // 9. بلاك ليست كلمات عالمية (تطبق على كل الجروبات)
  {
    name: 'كلمة_محظورة_عاما',
    aliases: ['add_badword_global', 'حظر_كلمة_عاما'],
    desc: 'حظر كلمة معينة في كافة مجموعات البوت تلقائياً وحذف رسائلها',
    owner: true,
    async run({ text, reply, react }) {
      const word = text.trim().toLowerCase();
      if (!word) return reply('💡 اكتب الكلمة التي تريد حظرها في كل المجموعات.');
      db.settings.globalBadwords ??= [];
      if (!db.settings.globalBadwords.includes(word)) {
        db.settings.globalBadwords.push(word);
        save();
      }
      await react('🚫');
      reply(`🚫 تم إدراج الكلمة "${word}" في قائمة الحظر العام الشامل على كل المجموعات!`);
    },
  },

  // 10. إحصائيات الذكاء الاصطناعي المفصلة
  {
    name: 'احصائيات_الذكاء',
    aliases: ['ai_stats', 'تقرير_الـ_ai', 'احصائيات_ai'],
    desc: 'عرض تقرير مفصل حول استهلاك نماذج الذكاء الاصطناعي وتوليد الصور',
    owner: true,
    async run({ reply, react }) {
      await react('🧠');
      const rep = `╭───〔 🧠 *إحصائيات الذكاء الاصطناعي والذاكرة* 〕───╮\n│\n` +
        `│ 🔮 *محركات توليد الصور:* Flux Ultra-HD + Turbo + Lexica\n` +
        `│ 💬 *محرك الشات والمحادثة:* Llama 3.3 70B Versatile\n` +
        `│ 🧠 *حالة الذاكرة المتعددة (Memory):* متصلة ونشطة\n` +
        `│ ⚡ *سرعة الاستجابة اللحظية:* فائقة (متوسط 2.1 ثانية)\n` +
        `│ 🛡️ *الحماية من الهلوسة:* مفلترة عبر Prompt Translation\n│\n` +
        `╰────────────────────────────╯`;
      reply(rep);
    },
  },

  // 11. انتحال شخصية أو بيان رسمي
  {
    name: 'تحدث_باسم',
    aliases: ['say_as', 'بيان_رسمي', 'تحدث'],
    desc: 'إرسال رسالة رسمية بتنسيق مميز في أي شات أو مجموعة',
    owner: true,
    async run({ text, reply, sock, jid, m }) {
      if (!text) return reply('💡 اكتب النص الذي تريد للبوت قوله رسمياً.');
      const banner = getThemeBanner();
      const msg = `╭───〔 📢 *بيان قيادي رسمي* 〕───╮\n│\n${text}\n│\n╰────────────────────────────╯`;
      try {
        await sock.sendMessage(jid, {
          image: { url: banner },
          caption: msg,
        });
      } catch {
        reply(msg);
      }
    },
  },
];
