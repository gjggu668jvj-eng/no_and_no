export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rand = a => a[Math.floor(Math.random() * a.length)];
export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// خريطة تحويل معرفات LID إلى أرقام الهواتف الدولية الحقيقية للمستخدمين
export const lidToPhoneMap = new Map([
  ['279981150236798', '201016842557'],
  ['201924162879501', '201016842557'],
]);

export const rememberLid = (lid, phone) => {
  if (!lid || !phone) return;
  const lNum = String(lid).split('@')[0].split(':')[0].replace(/\D/g, '');
  const pNum = String(phone).split('@')[0].split(':')[0].replace(/\D/g, '');
  // نحفظ فقط تحويل الـ LID (الذي يكون عادة 14 أو 15 رقماً) إلى رقم الهاتف الحقيقي
  if (lNum && pNum && lNum !== pNum && lNum.length >= 14 && pNum.length <= 13) {
    lidToPhoneMap.set(lNum, pNum);
  }
};

export const resolvePhone = j => {
  const str = String(j || '');
  const rawNum = str.split('@')[0].split(':')[0].replace(/\D/g, '');
  if (['279981150236798', '201924162879501'].includes(rawNum)) return '201016842557';
  if (lidToPhoneMap.has(rawNum)) {
    return lidToPhoneMap.get(rawNum);
  }
  return rawNum;
};

export const numOf = j => {
  const str = String(j || '');
  const rawNum = str.split('@')[0].split(':')[0].replace(/\D/g, '');
  if (['279981150236798', '201924162879501'].includes(rawNum)) return '201016842557';
  if (lidToPhoneMap.has(rawNum)) {
    return lidToPhoneMap.get(rawNum);
  }
  return rawNum;
};

export const lidMap = lidToPhoneMap;

export const ids = p => [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean);
export const money = n => Math.floor(Number(n) || 0).toLocaleString('en-US');
export const isUrl = s => /^https?:\/\/\S+$/i.test(s || '');
export const bar = (v, max, len = 10) => {
  const f = Math.max(0, Math.min(len, Math.round((v / max) * len)));
  return '█'.repeat(f) + '░'.repeat(len - f);
};

export const getRank = lv => {
  if (lv >= 50) return '⚡ إلهي (Immortal)';
  if (lv >= 35) return '👑 أسطوري (Master)';
  if (lv >= 20) return '💎 ألماسي (Diamond)';
  if (lv >= 10) return '🥇 فارس (Gold)';
  if (lv >= 5) return '🥈 محارب (Silver)';
  return '🥉 مبتدئ (Bronze)';
};

export function parseToggle(a) {
  a = String(a || '').toLowerCase();
  if (['on', 'تشغيل', 'تفعيل', 'فتح', '1', 'نعم'].includes(a)) return true;
  if (['off', 'ايقاف', 'إيقاف', 'تعطيل', 'قفل', '0', 'لا'].includes(a)) return false;
  return null;
}

export function fmtDur(ms) {
  let s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const out = [];
  if (d) out.push(`${d} يوم`);
  if (h) out.push(`${h} ساعة`);
  if (m) out.push(`${m} دقيقة`);
  if (s || !out.length) out.push(`${s} ثانية`);
  return out.join(' و');
}

// توحيد النص العربي للمقارنة
export const normAr = s => String(s).toLowerCase()
  .replace(/[\u064B-\u0652\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/\s+/g, ' ').trim();

export async function getBuffer(url, max = 95 * 1024 * 1024) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const len = Number(r.headers.get('content-length') || 0);
  if (len > max) throw new Error('الملف كبير جدًا (أكتر من 95MB)');
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > max) throw new Error('الملف كبير جدًا (أكتر من 95MB)');
  return { buffer: buf, mime: (r.headers.get('content-type') || '').split(';')[0], headers: r.headers };
}

export async function getJson(url, opts) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, ...opts });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

import { spawn } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

export function getFfmpegPath() {
  return ffmpegInstaller?.path || 'ffmpeg';
}

// تحويل أي ملف صوتي أو فيديو إلى OGG Opus نقي متوافق 100% مع مشغل واتساب Voice Note
export async function toOpusAudio(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const ffmpegBin = getFfmpegPath();
      const ffmpeg = spawn(ffmpegBin, [
        '-i', 'pipe:0',
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '48k',
        '-vbr', 'on',
        '-ac', '1',
        '-ar', '48000',
        '-f', 'opus',
        'pipe:1',
      ]);
      const chunks = [];
      ffmpeg.stdout.on('data', c => chunks.push(c));
      ffmpeg.on('close', code => {
        if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
        else reject(new Error('ffmpeg failed with code ' + code));
      });
      ffmpeg.on('error', reject);
      ffmpeg.stdin.end(buffer);
    } catch (e) {
      reject(e);
    }
  });
}

// دالة ذكية لإرسال أي صوت بشكل موثوق بدون خطأ "المقطع الصوتي غير متوفر بسبب وجود خلل"
export async function safeSendAudio(sock, jid, buffer, opts = {}, quoted = null) {
  const isPttRequested = opts.ptt ?? true;
  let audioBuffer = buffer;
  let mimetype = 'audio/ogg; codecs=opus';
  let ptt = false;

  // فحص صيغة الـ Buffer عبر البايتات السحرية (Magic Bytes)
  const isOgg = buffer.length > 4 && buffer.slice(0, 4).toString('ascii') === 'OggS';
  const isMp3 = buffer.length > 3 && (buffer.slice(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0));

  if (isOgg) {
    mimetype = 'audio/ogg; codecs=opus';
    ptt = isPttRequested;
  } else if (isPttRequested) {
    try {
      const opus = await toOpusAudio(buffer);
      if (opus && opus.length > 50) {
        audioBuffer = opus;
        mimetype = 'audio/ogg; codecs=opus';
        ptt = true;
      }
    } catch {
      // إذا فشل التحويل إلى Opus، يتم الإرسال بصيغة الملف الأصلية لتجنب خطأ تشفير واتساب
      mimetype = isMp3 ? 'audio/mpeg' : 'audio/mp4';
      ptt = false;
    }
  } else {
    mimetype = isMp3 ? 'audio/mpeg' : 'audio/mp4';
    ptt = false;
  }

  const quoteOpt = (quoted && !quoted.key?.fromMe) ? { quoted } : {};
  return sock.sendMessage(jid, {
    audio: audioBuffer,
    mimetype,
    ptt,
    ...opts,
  }, quoteOpt);
}
