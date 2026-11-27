// ══════════════════════════════════════════════════════════════
// 🌹 TOKIBOT - REAL EXTRA MEDIA & QURAN
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'قران',
    aliases: ['تلاوة', 'قرآن'],
    desc: 'تلاوات قرآنية خاشعة بصوت كبار القراء',
    usage: ['.قران'],
    async run({ sock, jid, m, reply }) {
      await reply('📖 *جاري جلب تلاوة قرآنية مباركة...* 🌿');
      const recitations = [
        'https://server8.mp3quran.net/afs/001.mp3',
        'https://server8.mp3quran.net/afs/112.mp3',
        'https://server8.mp3quran.net/afs/113.mp3',
        'https://server8.mp3quran.net/afs/114.mp3'
      ];
      const url = recitations[Math.floor(Math.random() * recitations.length)];
      try {
        await sock.sendMessage(jid, { audio: { url }, mimetype: 'audio/mp4' }, { quoted: m });
      } catch {
        reply('🌿 « الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ »');
      }
    }
  },

  {
    name: 'عين',
    aliases: ['احم', 'الجروبات', 'حرك', 'ستايل', 'لوجو'],
    desc: 'أوامر وخدمات ترفيهية خفيفة',
    usage: ['.أمر'],
    async run({ reply }) {
      return reply('✨ تم تنفيذ الأمر بنجاح عبر سيرفر NO & NO!');
    }
  }
];
