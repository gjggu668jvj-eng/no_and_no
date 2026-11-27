// ══════════════════════════════════════════════════════════════
// 📄 مود الفحص الذكي وحل الامتحانات وتلخيص الملفات (Smart Vision)
// ══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function solveWithAI(question, imageBase64 = null) {
  const systemPrompt = 'أنت أستاذ ومعلم ذكي وخبير في كافة المواد (رياضيات، علوم، لغات، برمجة، فيزياء). قم بحل السؤال أو ورقة الامتحان بدقة متناهية مع شرح خطوات الحل بالتفصيل وباللغة العربية المبسطة والواضحة.';

  try {
    if (config.ai?.key) {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (imageBase64) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: question || 'قم بحل المسألة أو الأسئلة الموجودة في هذه الصورة بالتفصيل مع الخطوات.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        });
      } else {
        messages.push({ role: 'user', content: question });
      }

      const res = await fetch(config.ai.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.ai.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview' || config.ai.model,
          messages,
          max_tokens: 1000
        })
      });
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content;
      if (txt) return txt;
    }
  } catch {}

  // بديل نصي مجاني
  try {
    const enc = encodeURIComponent(`${systemPrompt}\n\nالسؤال: ${question}`);
    const res = await fetch(`https://text.pollinations.ai/${enc}`);
    if (res.ok) {
      const txt = await res.text();
      if (txt) return txt;
    }
  } catch {}

  return 'عذراً، لم أتمكن من استخراج الحل في الوقت الحالي، يرجى إعادة المحاولة.';
}

export default [
  {
    name: 'حل',
    aliases: ['امتحان', 'واجب', 'حل_امتحان', 'solve', 'مسألة'],
    desc: 'حل ورقة امتحان، مسألة رياضيات، أو كود برمجي بالتفصيل والخطوات',
    async run({ sock, jid, m, getMedia, quotedText, restText, reply }) {
      await sock.sendMessage(jid, { react: { text: '🧠', key: m.key } }).catch(() => {});

      const media = await getMedia(['imageMessage']);
      let imageBase64 = null;
      if (media && media.buffer) {
        imageBase64 = media.buffer.toString('base64');
      }

      const question = restText || quotedText || '';
      if (!imageBase64 && !question) {
        return reply('📝 *المساعد الذكي لحل الامتحانات والواجبات*\n\n▫️ صور ورقة الامتحان أو المسألة وابعتها أو رد عليها بأمر: *.حل*\n▫️ أو اكتب المسألة مباشرة: *.حل اوجد ناتج تكامل 2x بالنسبة لـ x*');
      }

      await reply('⏳ جاري فحص المسألة وتوليد الحل النموذجي والخطوات...');
      const solution = await solveWithAI(question, imageBase64);

      const header = `╭━━━〔 🎓 *الحل النموذجي والشرح* 〕━━━╮\n│\n`;
      const footer = `\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
      return reply(header + solution + footer);
    }
  },

  {
    name: 'تلخيص',
    aliases: ['لخص', 'ملخص', 'summarize'],
    desc: 'تلخيص نص طويل أو مقال في 3 نقاط جوهرية وأهم الأفكار',
    async run({ sock, jid, m, quotedText, restText, reply }) {
      const text = restText || quotedText || '';
      if (!text || text.length < 20) {
        return reply('📄 يرجى كتابة النص أو الرد على رسالة طويلة تريد تلخيصها.\nمثال: رد على مقال طويل واكتب *.تلخيص*');
      }

      await sock.sendMessage(jid, { react: { text: '📑', key: m.key } }).catch(() => {});

      const prompt = `قم بتلخيص النص التالي تلخيصاً ذكياً في 3 نقاط رئيسية مركزة، متبوعة بأهم الدروس المستفادة باختصار:\n\n${text.slice(0, 3000)}`;

      try {
        const enc = encodeURIComponent(prompt);
        const res = await fetch(`https://text.pollinations.ai/${enc}`);
        if (res.ok) {
          const summary = await res.text();
          return reply(`╭━━━〔 📑 *الملخص التنفيذي الذكي* 〕━━━╮\n│\n${summary}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
        }
      } catch (e) {
        reply(`❌ فشل التلخيص: ${e.message}`);
      }
    }
  }
];
