import config from '../../config.js';
import { uniqueCommands } from '../../lib/loader.js';

let cachedNewsletterJid = null;

async function getNewsletterJid(sock) {
  if (cachedNewsletterJid) return cachedNewsletterJid;
  try {
    const code = config.channelInviteCode || '0029VbBvRjeHrDZmSEd8sV12';
    if (typeof sock.newsletterMetadata === 'function') {
      const meta = await sock.newsletterMetadata('invite', code);
      if (meta?.id) {
        cachedNewsletterJid = meta.id;
        return meta.id;
      }
    }
  } catch (e) {
    console.error('خطأ استخراج بيانات القناة:', e.message);
  }
  return null;
}

export default [
  // أمر عام لجميع الأعضاء للحصول على رابط القناة
  {
    name: 'قناة',
    aliases: ['القناة', 'قناة_التحديثات', 'تحديثات', 'قناتنا'],
    desc: 'عرض رابط قناة واتساب الرسمية لمتابعة جديد التحديثات والأوامر',
    section: 'members',
    async run({ reply }) {
      const link = config.channelLink || 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12';
      return reply(
        `📢 *قناة واتساب الرسمية لبوت [ ${config.botName.toUpperCase()} ]*\n\n` +
        `انضم الآن للقناة الرسمية لتكون أول من يعرف:\n` +
        `✨ جميع الأوامر والميزات الجديدة فور إطلاقها\n` +
        `🛠️ مواعيد التحديثات والترقيات وسيرفرات البوت\n` +
        `🎁 الهدايا والمسابقات وأكواد الرتب الحصرية\n\n` +
        `🔗 *رابط القناة المباشر:*\n${link}\n\n` +
        `اضغط على الرابط أعلاه واضغط *متابعة (Follow)* مع تفعيل الجرس 🔔`
      );
    },
  },

  // أمر نشر مخصص للمطور في القناة
  {
    name: 'نشر_في_القناة',
    aliases: ['نشر_قناة', 'بوست_قناة'],
    desc: 'نشر رسالة أو إعلان مخصص مباشرة في قناة الواتساب الرسمية',
    section: 'owner',
    owner: true,
    async run({ sock, text, reply }) {
      if (!text?.trim()) {
        return reply(`⚠️ *اكتب النص الذي تريد نشره في القناة!*\nمثال: *.نشر_في_القناة تم إضافة ميزة جديدة كذا وكذا...*`);
      }

      await reply('⏳ جاري الاتصال بالقناة ونشر البيان...');
      try {
        const jid = await getNewsletterJid(sock);
        if (!jid) {
          return reply(
            `❌ تعذر جلب معرف القناة تلقائياً عبر الكود.\nتأكد من أن الكود صحيح وأن رقم البوت مشرف بالقناة:\n${config.channelLink}`
          );
        }

        const postText = `📢 *إعلان رسمي | ${config.botName.toUpperCase()}*\n\n${text.trim()}\n\n─── • 👑 المطور: ${config.developer} • ───`;
        await sock.sendMessage(jid, { text: postText });

        return reply(`✅ *تم النشر بنجاح في القناة الرسمية!*\n🔗 ${config.channelLink}`);
      } catch (e) {
        return reply(
          `❌ *فشل النشر في القناة!*\nالسبب: ${e.message}\n\n💡 *ملاحظة مهمة:* يجب أن يكون رقم البوت مشرفاً (Admin) في القناة ليتمكن من النشر.`
        );
      }
    },
  },

  // أمر نشر التحديثات والأوامر الجديدة تلقائياً في القناة
  {
    name: 'نشر_تحديث',
    aliases: ['نشر_اوامر_جديدة', 'تحديث_القناة', 'نشر_الجديد'],
    desc: 'صياغة ونشر أحدث الأوامر والميزات الجديدة تلقائياً في قناة الواتساب',
    section: 'owner',
    owner: true,
    async run({ sock, text, reply }) {
      await reply('⏳ جاري تجهيز تقرير الأوامر الجديدة ونشره في القناة...');

      try {
        const allCmds = uniqueCommands();
        const jid = await getNewsletterJid(sock);

        const customNote = text?.trim() ? `\n📝 *ملاحظة المطور:*\n${text.trim()}\n` : '';

        const updatePost =
          `⚡ *تحديث جديد وضخم | ${config.botName.toUpperCase()} V3.0* ⚡\n\n` +
          `تم إطلاق حزمة ميزات وأوامر ثورية جديدة بالكامل للبوت! 🚀\n` +
          customNote +
          `\n🔥 *أبرز الأوامر الجديدة المتاحة الآن:*\n\n` +
          `🤖 *قسم الذكاء الاصطناعي والذاكرة:*\n` +
          `▪️ *.شات <رسالتك>* ↢ ذكاء اصطناعي بذاكرة مستمرة يحفظ كل محادثة بشكل منفصل.\n` +
          `▪️ *.تخيل <الوصف>* ↢ توليد صور سينمائية فائقة الجودة بدقة 4K عبر برومبت ذكي.\n` +
          `▪️ *.تخيل_انمي | .تخيل_رعب | .تخيل_3d* ↢ ستايلات تصوير متخصصة.\n\n` +
          `🎵 *قسم الأصوات والميمز:*\n` +
          `▪️ *.صوت_تيك <الاسم>* ↢ بحث وتشغيل أشهر ريكوردات وترندات التيك توك مباشرة.\n` +
          `▪️ *.صوت_مرعب* ↢ مؤثرات صوتية مرعبة عالية النقاوة.\n` +
          `▪️ *.صوت <النص>* ↢ تحويل أي نص مكتوب إلى ريكورد صوتي بشري واضح.\n\n` +
          `🎭 *قسم المودات والمظهر:*\n` +
          `▪️ *.مود* ↢ التبديل بين 4 مودات أسطورية (رعب 🩸، سايبر ⚡، أنمي 🌸، فخامة 👑).\n` +
          `▪️ *.صورة_الاوامر* ↢ تفعيل صور بنرات مرعبة وفخمة مع كل رد.\n\n` +
          `🌐 *قسم البوتات الفرعية والتنصيب:*\n` +
          `▪️ *.تنصيب* ↢ فتح منصة الويب وربط أي رقم هاتف كبوت فرعي مستقل في ثوانٍ.\n` +
          `▪️ *.البوتات_الفرعية* ↢ عرض وإدارة جميع البوتات التابعة لك.\n\n` +
          `👑 *قسم التحكم والأمان الخارق:*\n` +
          `▪️ *.فحص_التجسس* ↢ رادار كشف الحسابات المشبوهة داخل المجموعات.\n` +
          `▪️ *.تجميد_جروب | .فك_تجميد_جروب* ↢ إيقاف الشات فورياً في حالات الطوارئ.\n` +
          `▪️ *.انضمام <الرابط>* ↢ انضمام البوت لأي جروب بنقرة واحدة.\n\n` +
          `📊 *إجمالي الأوامر النشطة الآن:* *${allCmds.length} أمر*\n\n` +
          `🔔 شارك القناة مع أصدقائك وتابعونا لكل جديد!\n` +
          `🔗 ${config.channelLink}`;

        if (!jid) {
          return reply(
            `⚠️ تعذر العثور على JID القناة مباشرة عبر الكود.\nإليك نص التحديث جاهزاً، ويمكنك تعيين البوت مشرفاً لتفعيل النشر الذاتي:\n\n${updatePost}`
          );
        }

        await sock.sendMessage(jid, { text: updatePost });
        return reply(`✅ *تم نشر التحديث الجديد والأوامر بنجاح في القناة الرسمية!*\n🔗 ${config.channelLink}`);
      } catch (e) {
        return reply(
          `❌ *فشل النشر التلقائي في القناة!*\nالخطأ: ${e.message}\n\n💡 تأكد من أن رقم البوت مسجل كمشرف (Admin) في القناة ليملك صلاحية النشر.`
        );
      }
    },
  },
];
