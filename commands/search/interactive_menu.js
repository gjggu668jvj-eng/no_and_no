// ══════════════════════════════════════════════════════════════
// 📱 أوامر واجهة المستخدم التفاعلية (Carousel & Native UI)
// ══════════════════════════════════════════════════════════════

import { sendCarousel, sendInteractiveButtons, sendInteractiveList } from '../../lib/interactive.js';
import config from '../../config.js';

export default [
  {
    name: 'سلايدر',
    aliases: ['كاروسيل', 'كروت', 'carousel', 'cards'],
    desc: 'عرض أقسام البوت بنظام السلايدر التفاعلي الحديث (كروت تقليب)',
    async run({ sock, jid, m, pushName }) {
      const cards = [
        {
          title: '💀 قسم الرعب والدارك ويب',
          body: 'قصص رعب واقعية، أصوات مرعبة، تريندات وأغاني الدارك ويب الحماسية.',
          buttons: [
            { type: 'quick_reply', display_text: '💀 فتح قسم الرعب', id: '.اوامر 4' },
            { type: 'quick_reply', display_text: '🎵 أغنية الدارك ويب', id: '.اغنية_دارك_ويب' },
            { type: 'cta_url', display_text: '📢 قناة التحديثات', url: config.channelLink }
          ]
        },
        {
          title: '🧠 قسم الذكاء الاصطناعي',
          body: 'مساعد صوتي ذكي، حل الامتحانات والواجبات، رسم فائق بجودة Flux، وتلخيص الملفات.',
          buttons: [
            { type: 'quick_reply', display_text: '🤖 فتح قسم الذكاء', id: '.اوامر 11' },
            { type: 'quick_reply', display_text: '🎙️ مساعد صوتي', id: '.صوت مرحبا يا بوت' },
            { type: 'cta_copy', display_text: '📋 نسخ أمر الرسم', copy_code: '.flux رسم ذكاء اصطناعي احترافي' }
          ]
        },
        {
          title: '🎮 قسم الألعاب والتحديات',
          body: 'تخمين الأرقام، عواصم الدول، بنك وثراء، روليت، وحروب بين الأعضاء.',
          buttons: [
            { type: 'quick_reply', display_text: '🎯 فتح الألعاب', id: '.اوامر 1' },
            { type: 'quick_reply', display_text: '💰 حساب البنك', id: '.بنك' }
          ]
        },
        {
          title: '📥 قسم التحميل والوسائط',
          body: 'تحميل مباشر بدون علامة مائية من تيك توك، يوتيوب، ساوند كلاود، وفيسبوك.',
          buttons: [
            { type: 'quick_reply', display_text: '📥 فتح قسم التحميل', id: '.اوامر 2' },
            { type: 'quick_reply', display_text: '🎵 تيك توك', id: '.تيك' }
          ]
        },
        {
          title: '🛡️ الحماية والأمان المتقدم',
          body: 'كاشف الرسائل المحذوفة، صائد رسائل العرض لمرة واحدة، ومنع الروابط التلقائي.',
          buttons: [
            { type: 'quick_reply', display_text: '🕵️ كاشف المحذوف', id: '.كاشف_المحذوف' },
            { type: 'quick_reply', display_text: '👁️ صائد السرية', id: '.صائد_السرية' }
          ]
        }
      ];

      await sendCarousel(sock, jid, {
        body: `👋 أهلاً بك يا *${pushName}* في واجهة البوت التفاعلية الحديثة!\nقلّب الكروت يمين وشمال واضغط على أي زر للتنفيذ الفوري:`,
        footer: `⚡ ${config.botName} - الجيل الجديد`,
        cards
      }, m);
    }
  },

  {
    name: 'قائمة_تفاعلية',
    aliases: ['منيو_تفاعلي', 'اقسام_تفاعلية', 'listmenu'],
    desc: 'عرض قائمة الأقسام المنسدلة التفاعلية (Native List)',
    async run({ sock, jid, m, pushName }) {
      const sections = [
        {
          title: '🌟 الأقسام الترفيهية والتحديات',
          highlight_label: 'رائج 🔥',
          rows: [
            { title: '🎮 قسم الألعاب', description: 'تخمين، روليت، مسابقات، وجوائز كاش', id: '.اوامر 1' },
            { title: '💀 قسم الرعب والدارك ويب', description: 'أغاني، قصص، طقوس، وأصوات مرعبة', id: '.اوامر 4' },
            { title: '💰 بنك واقتصاد البوت', description: 'تحويل فلوس، سرقة، استثمار، وحظ', id: '.اوامر 3' },
            { title: '🎭 الأنمي والميمز', description: 'ردود مضحكة وميمز جاهزة', id: '.اوامر 5' }
          ]
        },
        {
          title: '⚡ الذكاء الاصطناعي والأدوات',
          highlight_label: 'جديد 🧠',
          rows: [
            { title: '🧠 الذكاء الاصطناعي المتقدم', description: 'شات GPT، حل امتحانات، ومساعد صوتي', id: '.اوامر 11' },
            { title: '🎨 توليد الصور ورسم Flux', description: 'توليد صور واقعية وتوضيح الصور HD', id: '.اوامر 12' },
            { title: '📥 التحميل من المنصات', description: 'يوتيوب، تيك توك، ساوند، وفيسبوك', id: '.اوامر 2' },
            { title: '🛠️ أدوات وملصقات', description: 'صنع استيكرات، باركود، ومؤثرات صوتية', id: '.اوامر 7' }
          ]
        },
        {
          title: '🛡️ الإدارة وحماية الجروب',
          rows: [
            { title: '👑 مشرفي المجموعات', description: 'طرد، كتم، قفل، ومنع الروابط', id: '.اوامر 6' },
            { title: '🕵️ كاشف المحذوف والسرية', description: 'صيد ViewOnce وكشف ما تم حذفه', id: '.كاشف_المحذوف' }
          ]
        }
      ];

      await sendInteractiveList(sock, jid, {
        title: `📜 دليل أقسام ${config.botName}`,
        body: `مرحباً بك يا *${pushName}*! اضغط على الزر بالأسفل لاختيار القسم الذي تريده مباشرة بدون كتابة أوامر.`,
        footer: 'اضغط لاختيار القسم ⬇️',
        buttonText: 'تصفح كافة الأقسام 📜',
        sections
      }, m);
    }
  }
];
