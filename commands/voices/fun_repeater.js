// ══════════════════════════════════════════════════════════════
// 🔁 أمر تكرار الكلام للترفيه والضحك (Fun Text Repeater)
// ══════════════════════════════════════════════════════════════

import { sleep } from '../../lib/utils.js';

export default [
  {
    name: 'كرر',
    aliases: ['تكرار', 'ردد', 'repeat', 'تكرار_الكلام'],
    desc: 'تكرار أي جملة أو كلمة بعدد محدد بحد أقصى 20 مرة للترفيه',
    async run({ sock, jid, args, quotedText, reply }) {
      const countRaw = parseInt(args[0]);
      let count = 5;
      let textToRepeat = '';

      if (!isNaN(countRaw) && countRaw > 0) {
        count = Math.min(20, countRaw);
        textToRepeat = args.slice(1).join(' ') || quotedText || '';
      } else {
        textToRepeat = args.join(' ') || quotedText || '';
      }

      if (!textToRepeat) {
        return reply('🔁 *أمر تكرار الكلام للترفيه*\n\nاكتب العدد ثم الجملة التي تريد تكرارها (بحد أقصى 20 مرة):\nمثال: *.كرر 5 السلام عليكم يا شباب*\nأو رد على رسالة واكتب: *.كرر 10*');
      }

      for (let i = 0; i < count; i++) {
        await sock.sendMessage(jid, { text: textToRepeat });
        if (i < count - 1) await sleep(250); // تأخير زمني خفيف لضمان وصول الرسائل بالترتيب
      }
    }
  }
];
