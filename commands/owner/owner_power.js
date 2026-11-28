export default [
  { name: 'ادمني', aliases: ['promoteme', 'ترقيني'], desc: 'ترقيتك لأدمن في الجروب', owner: true, group: true, botAdmin: true,
    async run({ sock, jid, sender, partOf, reply }) {
      const p = partOf(sender);
      if (p?.admin) return reply('✅ إنت أدمن بالفعل.');
      await sock.groupParticipantsUpdate(jid, [p?.id || sender], 'promote');
      reply('👑 اتعملت أدمن في الجروب.');
    } },
  { name: 'حالة_الجروب', aliases: ['gstate', 'حاله_الجروب', 'حالة_المجموعة', 'حاله_المجموعة'], desc: 'تقرير سريع عن حالة الجروب والبوت فيه (مخصص للمشرفين)', admin: true, group: true,
    async run({ jid, meta, g, isBotAdmin, reply }) {
      reply(`📊 *حالة الجروب*\n\n🆔 ${jid}\n👥 الأعضاء: ${meta.participants?.length || 0}\n🤖 البوت أدمن: ${isBotAdmin ? 'نعم ✅' : 'لا ❌'}\n` +
        `👋 الترحيب: ${g?.welcome ? 'مفعّل' : 'متوقف'}\n🔗 منع الروابط: ${g?.antilink ? 'مفعّل' : 'متوقف'}\n` +
        `🔇 مكتومين: ${g?.muted?.length || 0}\n⛔ محظورين: ${g?.banned?.length || 0}\n🚫 كلمات ممنوعة: ${g?.badwords?.length || 0}`);
    } },
];
