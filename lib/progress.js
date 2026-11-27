// ══════════════════════════════════════════════════════════════
// 📊 محرك شريط التقدم الحي (Live Progress Bar)
// ══════════════════════════════════════════════════════════════

import { sleep, bar } from './utils.js';

/**
 * إرسال رسالة وتحديثها حياً ومباشرة عبر تعديل نفس الرسالة بنسب مئوية
 * @param {object} sock - اتصال Baileys
 * @param {string} jid - وجهة الرسالة
 * @param {string} title - العنوان
 * @param {Array<{percent: number, text: string, delay?: number}>} steps - الخطوات
 * @param {object} quoted - رسالة مقتبسة
 */
export async function runLiveProgress(sock, jid, title = 'جاري التحميل', steps = [], quoted = null) {
  let sentMsg = null;
  try {
    const firstStep = steps[0] || { percent: 10, text: 'بدء العملية...' };
    const initialText = `╭━━━〔 ⏳ *${title}* 〕━━━╮\n│\n│ 📊 [${bar(firstStep.percent, 100, 10)}] *${firstStep.percent}%*\n│ 📝 ${firstStep.text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;

    sentMsg = await sock.sendMessage(jid, { text: initialText }, quoted ? { quoted } : {});

    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      await sleep(step.delay || 650);
      const isComplete = step.percent >= 100;
      const progressText = `╭━━━〔 ${isComplete ? '✅' : '⏳'} *${title}* 〕━━━╮\n│\n│ 📊 [${bar(step.percent, 100, 10)}] *${step.percent}%*\n│ ${isComplete ? '🎉' : '📝'} ${step.text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;

      await sock.sendMessage(jid, {
        text: progressText,
        edit: sentMsg.key
      });
    }
  } catch (err) {
    console.log('تحذير شريط التقدم الحي:', err.message);
  }
  return sentMsg;
}
