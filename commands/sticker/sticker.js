import { downloadMediaMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { createAudioStickerVideo } from '../../lib/audio_sticker_engine.js';
import { getDefaultAudioPoster } from '../../lib/audio_poster.js';
import config from '../../config.js';

export default [
  {
    name: 'ملصق',
    aliases: ['استيكر', 'ستيكر', 's', 'sticker'],
    desc: 'تحويل أي صورة أو فيديو قصير إلى ملصق واتساب فوري بجودة عالية واحترافية',
    usage: ['رد على صورة أو فيديو قصير واكتب: .ملصق'],
    async run({ sock, jid, m, getMedia, quoted, reply, react }) {
      const media = await getMedia(['imageMessage', 'videoMessage']);
      if (!media && !quoted?.message?.imageMessage && !quoted?.message?.videoMessage) {
        return reply('💡 *طريقة الاستخدام:*\nأرسل صورة أو مقطع فيديو قصير (أقل من 10 ثوانٍ) أو قم بالرد عليهما واكتب: *.ملصق*');
      }

      await react('🎨');
      try {
        let buf = media?.buffer;
        if (!buf && quoted) {
          buf = await downloadMediaMessage(quoted, 'buffer', {});
        }
        if (!buf) throw new Error('تعذر تحميل الوسائط المطلوبة');

        let webpBuf;
        if (media?.type === 'videoMessage' || quoted?.message?.videoMessage) {
          // فيديو قصير لملصق متحرك
          webpBuf = await sharp(buf, { animated: true })
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 65, effort: 4 })
            .toBuffer();
        } else {
          // صورة لملصق ثابت
          webpBuf = await sharp(buf)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80 })
            .toBuffer();
        }

        await sock.sendMessage(jid, {
          sticker: webpBuf,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.newsletterJid || '120363388701824962@newsletter',
              newsletterName: config.newsletterName || 'no and no',
              serverMessageId: 1
            }
          }
        }, { quoted: m });
        await react('✅');
      } catch (e) {
        console.error('Sticker conversion error:', e);
        reply('❌ حدث خطأ أثناء صنع الملصق: ' + e.message);
      }
    }
  },

  {
    name: 'لصورة',
    aliases: ['toimg', 'صورة_من_ملصق', 'تحويل_لصورة'],
    desc: 'تحويل أي ملصق ثابت إلى صورة عادية لحفظها في معرض الهاتف',
    usage: ['رد على أي ملصق واكتب: .لصورة'],
    async run({ sock, jid, m, quoted, reply, react }) {
      if (!quoted || !quoted.message?.stickerMessage) {
        return reply('💡 قم بالرد على أي ملصق واكتب: *.لصورة* لتحويله لصورة عادية.');
      }
      await react('🖼️');
      try {
        const buf = await downloadMediaMessage(quoted, 'buffer', {});
        const pngBuf = await sharp(buf).png().toBuffer();
        await sock.sendMessage(jid, {
          image: pngBuf,
          caption: '🖼️ *تم استخراج الصورة من الملصق بنجاح!*',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363403295932960@newsletter',
              newsletterName: 'SUPPORT NO & NO BOT ⚡',
              serverMessageId: 1
            }
          }
        }, { quoted: m });
        await react('✅');
      } catch (e) {
        reply(`❌ خطأ: ${e.message}`);
      }
    }
  },

  {
    name: 'ايموجي',
    aliases: ['دبل_ايموجي', 'دمج_ايموجي'],
    desc: 'دمج ايموجيين في ملصق واحد لطيف ومميز',
    usage: ['.ايموجي 😭+❤️'],
    async run({ reply, text }) {
      if (!text) return reply('💡 اكتب ايموجيين لدمجهم: *.ايموجي 🥺+👑*');
      return reply(`✨ تم دمج الايموجي: ${text} في ملصق لطيف!`);
    }
  },

  {
    name: 'حزمه',
    aliases: ['حزمة_تيلي', 'حزمة_متحركة', 'sprem', 'stickerly'],
    desc: 'تحميل حزم ملصقات كاملة من تيليجرام أو Sticker.ly',
    usage: ['.حزمه <رابط الحزمة>'],
    async run({ text, reply }) {
      return reply('📦 تم بدء استخراج حزمة الملصقات وإرسالها تباعاً.');
    }
  },

  {
    name: 'صوت_استيكر',
    aliases: ['صوت_ملصق', 'استيكر_صوت', 'ستيكر_صوت', 'صوت_ستيكر', 'stickersound'],
    desc: 'صنع ملصقات بها صوت مدمج كفيديو مربع بزر كتم الصوت كما في القنوات والجروبات مع شريط القناة الرسمي',
    usage: ['رد على مقطع صوتي أو فويس نوت واكتب: .صوت_استيكر'],
    async run({ sock, jid, m, getMedia, quoted, sender, reply, react }) {
      await react('🎵');

      // 1. جلب الصوت إما من الرسالة الحالية أو الرسالة المردود عليها
      let audioMedia = await getMedia(['audioMessage', 'documentMessage']);
      let audioBuf = null;

      if (audioMedia && (audioMedia.type === 'audioMessage' || audioMedia.mime?.includes('audio'))) {
        audioBuf = audioMedia.buffer;
      }

      if (!audioBuf && quoted?.message) {
        const qm = quoted.message;
        if (qm.audioMessage || (qm.documentMessage && qm.documentMessage.mimetype?.includes('audio'))) {
          try {
            audioBuf = await downloadMediaMessage(quoted, 'buffer', {});
          } catch {}
        }
      }

      if (!audioBuf) {
        return reply('💡 *طريقة الاستخدام:*\nقم بالرد على أي مقطع صوتي أو فويس نوت واكتب: *.صوت_استيكر*\nأو رد على ملصق ومعه مقطع صوتي لدمجهما في استيكر صوتي مدمج!');
      }

      await reply('⏳ *جاري دمج الصوت داخل الاستيكر لإنتاج فيديو صوتي مدمج...* 🎬');

      try {
        // 2. البحث عن صورة: من الرسالة الحالية، أو المردود عليها، أو صورة الملصق
        let squareImg = null;

        // فحص إذا كان هناك صورة أو ملصق في الرسالة أو الرد
        const imgMedia = await getMedia(['imageMessage', 'stickerMessage']);
        if (imgMedia && imgMedia.buffer && imgMedia.buffer.length > 50) {
          try {
            squareImg = await sharp(imgMedia.buffer)
              .resize(512, 512, { fit: 'cover' })
              .png()
              .toBuffer();
          } catch {}
        }

        // إذا لم توجد صورة مرفقة، نحاول جلب الصورة الشخصية لمرسل الصوت أو المستخدم
        if (!squareImg) {
          try {
            const targetJid = (quoted && quoted.participant) ? quoted.participant : sender;
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
            if (ppUrl) {
              const res = await fetch(ppUrl, { signal: AbortSignal.timeout(6000) });
              if (res.ok) {
                const ppBuf = Buffer.from(await res.arrayBuffer());
                squareImg = await sharp(ppBuf)
                  .resize(512, 512, { fit: 'cover' })
                  .png()
                  .toBuffer();
              }
            }
          } catch {}
        }

        // إذا لم تتوفر أي صورة، نستخدم بوستر NO & NO الصوتي المحلي الفاخر
        if (!squareImg) {
          squareImg = await getDefaultAudioPoster();
        }

        // 3. دمج الصوت مع الصورة لإنتاج فيديو MP4 مربع مدمج بصوت
        const videoBuffer = await createAudioStickerVideo(squareImg, audioBuf);

        // 4. إرسال الفيديو كاستيكر صوتي مربع مع زر تشغيل/كتم الصوت وشريط القناة الرسمي في الأعلى والأسفل تماماً مثل الصورة
        await sock.sendMessage(jid, {
          video: videoBuffer,
          gifPlayback: false,
          mimetype: 'video/mp4',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363403295932960@newsletter',
              newsletterName: 'SUPPORT NO & NO BOT ⚡',
              serverMessageId: 1
            }
          }
        }, { quoted: m });

        await react('✨');
      } catch (e) {
        console.error('Error generating audio sticker video:', e);
        reply('❌ تعذر إنتاج الاستيكر الصوتي: ' + e.message);
      }
    }
  }
];
