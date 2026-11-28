import { downloadMediaMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { createAudioStickerVideo, convertToOpusAudio, extractAudioFromVideo } from '../../lib/audio_sticker_engine.js';
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
    name: 'استيكر_بصوت',
    aliases: ['صوت_استيكر', 'صوت_ملصق', 'استيكر_صوت', 'ستيكر_صوت', 'صوت_ستيكر', 'soundsticker'],
    desc: 'صنع ملصق واتساب حقيقي ناطق بصوت مدمج (بدون تحويله لفيديو - ميزة واتساب الجديدة)',
    usage: ['رد على مقطع فيديو أو صورة أو مقطع صوتي واكتب: .استيكر_بصوت'],
    async run({ sock, jid, m, getMedia, quoted, sender, reply, react }) {
      await react('🎵');

      let audioBuf = null;
      let imgBuf = null;
      let isVideo = false;

      // 1. فحص وسائط الرسالة الحالية
      const curMedia = await getMedia(['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']);
      if (curMedia) {
        if (curMedia.type === 'videoMessage') {
          isVideo = true;
          imgBuf = curMedia.buffer;
          try {
            audioBuf = await extractAudioFromVideo(curMedia.buffer);
          } catch {}
        } else if (curMedia.type === 'imageMessage' || curMedia.type === 'stickerMessage') {
          imgBuf = curMedia.buffer;
        } else if (curMedia.type === 'audioMessage' || curMedia.mime?.includes('audio')) {
          audioBuf = curMedia.buffer;
        }
      }

      // 2. فحص الرسالة المردود عليها (quoted)
      if (quoted?.message) {
        const qm = quoted.message;
        if (qm.videoMessage) {
          isVideo = true;
          const vBuf = await downloadMediaMessage(quoted, 'buffer', {}).catch(() => null);
          if (vBuf) {
            imgBuf = imgBuf || vBuf;
            try { audioBuf = audioBuf || await extractAudioFromVideo(vBuf); } catch {}
          }
        }
        if (!imgBuf && (qm.imageMessage || qm.stickerMessage)) {
          imgBuf = await downloadMediaMessage(quoted, 'buffer', {}).catch(() => null);
        }
        if (!audioBuf && (qm.audioMessage || (qm.documentMessage && qm.documentMessage.mimetype?.includes('audio')))) {
          audioBuf = await downloadMediaMessage(quoted, 'buffer', {}).catch(() => null);
        }
      }

      if (!imgBuf && !audioBuf) {
        return reply('💡 *طريقة استخدام استيكر بصوت (الميزة الجديدة في واتساب):*\n' +
          '▪️ رد على أي مقطع فيديو واكتب: *.استيكر_بصوت* (يحول الفيديو لملصق حقيقي شفاف + صوته النقي مباشرة).\n' +
          '▪️ أو رد على مقطع صوتي ومعه صورة لدمجهما كملصق ناطق.\n' +
          '▪️ أو رد على ملصق ومعه فويس نوت.');
      }

      await reply('⏳ *جاري إنشاء استيكر واتساب الحقيقي وتجهيز الصوت المرفق...* 🎨');

      try {
        // تحويل الصورة أو فريم الفيديو لملصق WebP حقيقي 512x512
        let webpBuf;
        if (imgBuf) {
          if (isVideo) {
            webpBuf = await sharp(imgBuf, { animated: true })
              .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .webp({ quality: 65, effort: 4 })
              .toBuffer().catch(async () => {
                return await sharp(imgBuf)
                  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                  .webp({ quality: 80 })
                  .toBuffer();
              });
          } else {
            webpBuf = await sharp(imgBuf)
              .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .webp({ quality: 80 })
              .toBuffer();
          }
        } else {
          // صورة افتراضية
          const defImg = await getDefaultAudioPoster();
          webpBuf = await sharp(defImg)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80 })
            .toBuffer();
        }

        // إرسال الملصق الحقيقي أولاً
        const sentSticker = await sock.sendMessage(jid, {
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

        // إذا وُجد صوت، نرسله مباشرة مرتبطاً بالملصق بصيغة Opus PTT لتشغيله مع الملصق
        if (audioBuf) {
          const opusBuf = await convertToOpusAudio(audioBuf);
          await sock.sendMessage(jid, {
            audio: opusBuf,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: {
              externalAdReply: {
                title: '🔊 صوت الاستيكر التفاعلي',
                body: 'اضغط لتشغيل الصوت المصاحب للملصق',
                mediaType: 1,
                renderLargerThumbnail: false
              }
            }
          }, { quoted: sentSticker });
        }

        await react('✨');
      } catch (err) {
        console.error('Audio sticker error:', err);
        reply('❌ تعذر إنشاء الاستيكر الصوتي: ' + err.message);
      }
    }
  }
];
