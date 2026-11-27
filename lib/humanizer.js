// ══════════════════════════════════════════════════════════════
// 🛡️ المحاكي البشري لمكافحة الحظر (Anti-Ban Humanizer)
// ══════════════════════════════════════════════════════════════

import { sleep, randInt } from './utils.js';

/**
 * محاكاة السلوك البشري الطبيعي قبل الرد (إظهار "جاري الكتابة..." أو "جاري التسجيل...")
 * مع تأخير زمني بشري عشوائي ذكي لمنع كشف واتساب للأتمتة وحماية الرقم من الحظر
 */
export async function humanize(sock, jid, action = 'composing', minMs = 800, maxMs = 2000) {
  try {
    // إرسال إشعار الحالة (composing أو recording)
    await sock.sendPresenceUpdate(action, jid);
    const delay = randInt(minMs, maxMs);
    await sleep(delay);
    // إيقاف إشعار الحالة
    await sock.sendPresenceUpdate('paused', jid);
  } catch {}
}
