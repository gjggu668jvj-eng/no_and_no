// ══════════════════════════════════════════════════════════════
// ✉️ خدمة البريد المؤقت وكود التفعيل داخل الواتساب (Temp Mail)
// ══════════════════════════════════════════════════════════════

import { db, save } from '../../lib/db.js';

export default [
  {
    name: 'tempmail',
    aliases: ['ايميل_مؤقت', 'بريد_مؤقت', 'بريد', 'ايميل'],
    desc: 'إنشاء بريد إلكتروني مؤقت وسريع للتسجيل في المواقع واستلام كود التفعيل داخل الواتساب',
    async run({ sender, reply }) {
      try {
        const res = await fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
        if (!res.ok) throw new Error('فشل الاتصال بسيرفر البريد');
        const [email] = await res.json();
        if (!email) throw new Error('لم يتم إنشاء الإيميل');

        const [login, domain] = email.split('@');
        db.users[sender] ??= {};
        db.users[sender].tempmail = { login, domain, email, created: Date.now() };
        save();

        const msg = `╭━━━〔 ✉️ *بريدك المؤقت جاهز الآن* 〕━━━╮\n│\n` +
          `│ 📧 *الإيميل:* ${email}\n` +
          `│\n` +
          `│ 💡 سجل به في أي موقع أو تطبيق.\n` +
          `│ 📬 لاستلام كود التفعيل أو قراءة الرسائل، اكتب:\n` +
          `│    *${'.'}كود_التفعيل* أو *${'.'}رسائل_الايميل*\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(msg);
      } catch (err) {
        reply(`❌ فشل إنشاء البريد المؤقت: ${err.message}`);
      }
    }
  },

  {
    name: 'كود_التفعيل',
    aliases: ['رسائل_الايميل', 'صندوق_الوارد', 'inbox', 'checkmail'],
    desc: 'فحص صندوق الوارد للبريد المؤقت واستخراج كود التفعيل والرسائل الجديدة فوراً',
    async run({ sender, reply }) {
      const tm = db.users[sender]?.tempmail;
      if (!tm || !tm.login || !tm.domain) {
        return reply('⚠️ ليس لديك بريد مؤقت نشط حالياً. أنشئ إيميل جديد أولاً عبر أمر: *.tempmail*');
      }

      try {
        const checkUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${tm.login}&domain=${tm.domain}`;
        const res = await fetch(checkUrl);
        if (!res.ok) throw new Error('تعذر فحص الصندوق');
        const messages = await res.json();

        if (!messages || !messages.length) {
          return reply(`📭 *صندوق الوارد فارغ*\n\nالبريد: ${tm.email}\nلم تصل أي رسائل أو أكواد تفعيل بعد، انتظر ثوانٍ وأعد المحاولة بـ *.كود_التفعيل*.`);
        }

        // قراءة أحدث رسالة بالتفصيل
        const latest = messages[0];
        const readUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${tm.login}&domain=${tm.domain}&id=${latest.id}`;
        const rRes = await fetch(readUrl);
        const rData = await rRes.json();

        const bodyText = (rData.textBody || rData.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        // استخراج كود التفعيل إذا وجد (4 إلى 8 أرقام)
        const otpMatch = bodyText.match(/\b\d{4,8}\b/) || latest.subject.match(/\b\d{4,8}\b/);
        const otp = otpMatch ? otpMatch[0] : null;

        let replyMsg = `╭━━━〔 📬 *وصلت رسالة جديدة!* 〕━━━╮\n│\n` +
          `│ 📧 *المرسل:* ${rData.from}\n` +
          `│ 📌 *الموضوع:* ${rData.subject}\n` +
          `│ 🕒 *التاريخ:* ${rData.date}\n│\n`;

        if (otp) {
          replyMsg += `│ 🔑 *كود التفعيل هو:* 👉 *[ ${otp} ]* 👈\n│\n`;
        }

        replyMsg += `│ 📝 *نص الرسالة:*\n│ ${bodyText.slice(0, 400)}...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(replyMsg);
      } catch (e) {
        reply(`❌ فشل فحص الرسائل: ${e.message}`);
      }
    }
  }
];
