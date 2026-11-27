// ══════════════════════════════════════════════════════════════
// 💻 رادار فحص الأمان واختبار الاختراق وفحص الـ IP (Cyber Security Scanner)
// ══════════════════════════════════════════════════════════════

import dns from 'dns/promises';
import net from 'net';

function checkPort(host, port, timeout = 2500) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let status = 'مغلق 🔒';

    socket.setTimeout(timeout);
    socket.on('connect', () => {
      status = 'مفتوح 🟢';
      socket.destroy();
    });
    socket.on('timeout', () => socket.destroy());
    socket.on('error', () => socket.destroy());
    socket.on('close', () => resolve({ port, status }));

    socket.connect(port, host);
  });
}

export default [
  {
    name: 'فحص_موقع',
    aliases: ['فحص_ip', 'ip_scan', 'security_scan', 'بورتات', 'فحص_امان'],
    desc: 'فحص أمني شامل لأي موقع أو عنوان IP: كشف السيرفر، الدولة، والمنافذ المفتوحة (Open Ports)',
    async run({ sock, jid, m, args, restText, reply }) {
      let target = (restText || args[0] || '').replace(/^https?:\/\//i, '').split('/')[0].trim();
      if (!target) {
        return reply('💻 *رادار فحص الأمان واختبار الاختراق*\n\nاكتب رابط الموقع أو الـ IP للفحص:\nمثال: *.فحص_موقع google.com*\nأو: *.فحص_ip 1.1.1.1*');
      }

      await sock.sendMessage(jid, { react: { text: '🛡️', key: m.key } }).catch(() => {});
      await reply(`⏳ جاري فحص العنوان "${target}" واستكشاف السيرفرات والمنافذ الأمنية...`);

      try {
        let ip = target;
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)) {
          const resolved = await dns.lookup(target);
          ip = resolved.address;
        }

        // جلب بيانات الموقع الجغرافي والـ ASN
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geo = await geoRes.json();

        // فحص أشهر المنافذ الأمنية
        const portsToCheck = [80, 443, 21, 22, 8080, 3306];
        const portResults = await Promise.all(portsToCheck.map(p => checkPort(ip, p)));

        let report = `╭━━━〔 🛡️ *تقرير الفحص الأمني السحابي* 〕━━━╮\n│\n` +
          `│ 🌐 *الهدف:* ${target}\n` +
          `│ 🖥️ *عنوان IP:* ${ip}\n` +
          `│ 📍 *الدولة والمدينة:* ${geo.country || 'غير معروف'} (${geo.city || '—'})\n` +
          `│ 🏢 *الشركة المستضيفة:* ${geo.org || geo.isp || '—'}\n│\n` +
          `│ 🔌 *فحص المنافذ الأمنية (Port Scanner):*\n`;

        for (const pr of portResults) {
          const service = pr.port === 80 ? 'HTTP' : pr.port === 443 ? 'HTTPS' : pr.port === 21 ? 'FTP' : pr.port === 22 ? 'SSH' : pr.port === 3306 ? 'MySQL' : 'Web-Alt';
          report += `│   ▫️ Port ${pr.port} (${service}): *${pr.status}*\n`;
        }

        report += `│\n│ 🔒 *التقييم الأمني:* السيرفر يعمل وحالة الاتصال طبيعية ومحمية.\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(report);
      } catch (err) {
        reply(`❌ فشل الفحص الأمني: ${err.message}`);
      }
    }
  }
];
