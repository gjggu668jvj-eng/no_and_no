import 'dotenv/config';

export default {
  botName: 'NO & NO',
  developer: 'no and no',
  prefix: '/',
  botNumber: process.env.BOT_NUMBER || '',
  owners: (process.env.OWNERS || '201036042537,201225622948,201924162879501').split(','),
  coOwners: (process.env.CO_OWNERS || '201558446307').split(','),

  // قناة واتساب الرسمية للتحديثات والأوامر الجديدة
  channelLink: 'https://whatsapp.com/channel/0029VbBvRjeHrDZmSEd8sV12',
  channelInviteCode: '0029VbBvRjeHrDZmSEd8sV12',
  newsletterJid: '120363402690998648@newsletter',
  newsletterName: 'no and no',

  // صورة البنر لقائمة الأوامر (يمكن تغييرها برابط صورتك المفضلة)
  menuBanner: process.env.MENU_BANNER || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',

  // أوامر الذكاء الاصطناعي: المفتاح يقرأ من متغيرات البيئة فقط
  ai: {
    url: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },

  ytdlp: 'yt-dlp',
};
