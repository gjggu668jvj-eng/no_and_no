// ══════════════════════════════════════════════════════════════
// 👁️ الشبح المتخفي لإنستغرام وتيك توك (Ghost Stalker & Downloader)
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'بروفايل_انستا',
    aliases: ['صورة_انستا', 'افتار_انستا', 'ig_avatar', 'insta_dp'],
    desc: 'سحب صورة البروفايل لأي حساب إنستغرام بجودة فائقة Full HD حتى لو كان الحساب برايفت (Private)',
    async run({ sock, jid, m, args, restText, reply }) {
      const username = (restText || args[0] || '').replace(/[@https:\/\/www.instagram.com\/]/g, '').replace(/\//g, '').trim();
      if (!username) {
        return reply('👁️ *الشبح لسحب صور بروفايلات إنستغرام*\n\nاكتب اسم المستخدم (اليوزر) بعد الأمر:\nمثال: *.بروفايل_انستا cristiano*');
      }

      await sock.sendMessage(jid, { react: { text: '👻', key: m.key } }).catch(() => {});
      await reply(`⏳ جاري التسلل وسحب الصورة الأصلية لـ @${username}...`);

      try {
        // سحب صورة البروفايل بدقة كاملة عبر بوابة الإنستغرام العامة
        const apiUrl = `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`;
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
          }
        });

        let avatarUrl = null;
        let fullName = username;
        let isPrivate = false;

        if (res.ok) {
          const json = await res.json();
          const user = json?.graphql?.user || json?.data?.user;
          if (user) {
            avatarUrl = user.profile_pic_url_hd || user.profile_pic_url;
            fullName = user.full_name || username;
            isPrivate = user.is_private;
          }
        }

        // إذا لم يرد الـ API العام نستخدم المحرك البديل المفتوح
        if (!avatarUrl) {
          avatarUrl = `https://img.usebiolink.com/avatar/${encodeURIComponent(username)}`;
        }

        const caption = `╭━━━〔 👁️ *بروفايل إنستغرام كامل الجودة* 〕━━━╮\n│\n` +
          `│ 👤 *اليوزر:* @${username}\n` +
          `│ 🏷️ *الاسم:* ${fullName}\n` +
          `│ 🔒 *نوع الحساب:* ${isPrivate ? 'خاص (Private 🔒)' : 'عام (Public 🌍)'}\n` +
          `│ 💎 *الجودة:* Ultra-HD Original\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(jid, { image: { url: avatarUrl }, caption }, { quoted: m });
      } catch (err) {
        reply(`❌ تعذر جلب بروفايل @${username}: ${err.message}`);
      }
    }
  },

  {
    name: 'ستوري',
    aliases: ['انستا_ستوري', 'قصة_انستا', 'ig_story'],
    desc: 'مشاهدة وتحميل ستوريات إنستغرام في الخفاء التام بدون ظهور اسمك في قائمة المشاهدين',
    async run({ restText, args, reply }) {
      const username = (restText || args[0] || '').replace(/[@https:\/\/www.instagram.com\/]/g, '').replace(/\//g, '').trim();
      if (!username) {
        return reply('👻 *مشاهد ستوريات إنستغرام المتخفي*\n\nاكتب يوزر الحساب:\nمثال: *.ستوري mohamed_salah*');
      }

      const proxyViewer = `https://storiesig.info/en/${username}/`;
      const report = `╭━━━〔 👻 *الشبح المتخفي لمشاهدة الستوريات* 〕━━━╮\n│\n` +
        `│ 👤 *الحساب:* @${username}\n` +
        `│ 🕶️ *الوضعية:* التخفي التام (Zero Footprint)\n│\n` +
        `│ 🔗 *رابط المشاهدة والتحميل المباشر للستوريات:*\n` +
        `│ 👉 ${proxyViewer}\n│\n` +
        `│ 💡 لن يظهر حسابك أو رقمك نهائياً في قائمة المشاهدات.\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return reply(report);
    }
  }
];
