// ══════════════════════════════════════════════════════════════
// 🎵 مود تعديل ومؤثرات الأصوات (Voice Cloner & Modulator)
// ══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { safeSendAudio } from '../../lib/utils.js';

function applyAudioFilter(inputBuffer, filterStr) {
  return new Promise((resolve, reject) => {
    const tmpIn = path.join(os.tmpdir(), `vin_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
    const tmpOut = path.join(os.tmpdir(), `vout_${Date.now()}_${Math.random().toString(36).slice(2)}.opus`);
    fs.writeFileSync(tmpIn, inputBuffer);

    const args = [
      '-y',
      '-i', tmpIn,
      '-af', filterStr,
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-vbr', 'on',
      '-avoid_negative_ts', 'make_zero',
      '-f', 'ogg',
      tmpOut
    ];

    const proc = spawn('ffmpeg', args);
    proc.on('close', code => {
      try { fs.unlinkSync(tmpIn); } catch {}
      if (code === 0 && fs.existsSync(tmpOut)) {
        const outBuf = fs.readFileSync(tmpOut);
        try { fs.unlinkSync(tmpOut); } catch {}
        resolve(outBuf);
      } else {
        try { fs.unlinkSync(tmpOut); } catch {}
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    proc.on('error', err => {
      try { fs.unlinkSync(tmpIn); } catch {}
      reject(err);
    });
  });
}

const FILTERS = {
  سنجاب: 'asetrate=48000*1.5,aresample=48000',
  عميق: 'asetrate=48000*0.75,aresample=48000',
  رعب: 'asetrate=48000*0.65,aresample=48000,aecho=0.8:0.9:1000:0.4',
  روبوت: 'afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\'',
  تسريع: 'atempo=1.5',
  ابطاء: 'atempo=0.75',
  صدى: 'aecho=0.8:0.88:60:0.4'
};

export default [
  {
    name: 'تأثير_صوت',
    aliases: ['voice_fx', 'تغيير_الصوت', 'فلتر_صوت'],
    desc: 'تطبيق تأثيرات صوتية احترافية على أي ريكورد (سنجاب، عميق، رعب، روبوت، صدى، تسريع، ابطاء)',
    async run({ sock, jid, m, args, getMedia, reply }) {
      const type = (args[0] || '').toLowerCase();
      if (!type || !FILTERS[type]) {
        return reply(`🎵 *مغير ومؤثرات الأصوات*\n\nيرجى الرد على ريكورد صوتي واختيار التأثير:\n\n` +
          `▫️ *.تأثير_صوت سنجاب* (صوت كرتوني سريع)\n` +
          `▫️ *.تأثير_صوت عميق* (صوت ضخم وفخم)\n` +
          `▫️ *.تأثير_صوت رعب* (صوت شياطين مع صدى دارك)\n` +
          `▫️ *.تأثير_صوت روبوت* (صوت آلي مستقبلي)\n` +
          `▫️ *.تأثير_صوت صدى* (صدى استوديو نقي)\n` +
          `▫️ *.تأثير_صوت تسريع* (تسريع الصوت 1.5x)\n` +
          `▫️ *.تأثير_صوت ابطاء* (حركة بطيئة Slow-mo)`);
      }

      const media = await getMedia(['audioMessage']);
      if (!media || !media.buffer) {
        return reply('⚠️ يرجى الرد على رسالة صوتية (ريكورد) لتطبيق التأثير عليها.');
      }

      await sock.sendMessage(jid, { react: { text: '🎛️', key: m.key } }).catch(() => {});

      try {
        const processed = await applyAudioFilter(media.buffer, FILTERS[type]);
        await safeSendAudio(sock, jid, processed, { ptt: true }, m);
      } catch (err) {
        reply(`❌ تعذر معالجة الصوت: ${err.message}`);
      }
    }
  },

  {
    name: 'سنجاب',
    aliases: ['chipmunk'],
    desc: 'تحويل الصوت إلى سنجاب كرتوني سريع ومضحك',
    async run({ sock, jid, m, getMedia, reply }) {
      const media = await getMedia(['audioMessage']);
      if (!media || !media.buffer) return reply('رد على ريكورد صوتي بأمر: *.سنجاب*');
      try {
        const out = await applyAudioFilter(media.buffer, FILTERS.سنجاب);
        await safeSendAudio(sock, jid, out, { ptt: true }, m);
      } catch (e) { reply(`❌ خطأ: ${e.message}`); }
    }
  },

  {
    name: 'عميق',
    aliases: ['صوت_عميق', 'bass_boost'],
    desc: 'تضخيم وتعريض الصوت ليصبح عميق وفخم جداً',
    async run({ sock, jid, m, getMedia, reply }) {
      const media = await getMedia(['audioMessage']);
      if (!media || !media.buffer) return reply('رد على ريكورد صوتي بأمر: *.عميق*');
      try {
        const out = await applyAudioFilter(media.buffer, FILTERS.عميق);
        await safeSendAudio(sock, jid, out, { ptt: true }, m);
      } catch (e) { reply(`❌ خطأ: ${e.message}`); }
    }
  }
];
