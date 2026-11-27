import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import config from '../../config.js';
import { getBuffer, isUrl, money } from '../../lib/utils.js';

const TMP = path.join(os.tmpdir(), 'no-and-no-bot');
fs.mkdirSync(TMP, { recursive: true });

// دعم Windows (yt-dlp.exe) و Linux (yt-dlp) تلقائياً
const IS_WIN = process.platform === 'win32';
const BIN = () => {
  if (IS_WIN && fs.existsSync('./yt-dlp.exe')) return './yt-dlp.exe';
  if (!IS_WIN && fs.existsSync('./yt-dlp')) return './yt-dlp';
  return IS_WIN ? (config.ytdlp || 'yt-dlp.exe') : 'yt-dlp';
};
const MAX = 95 * 1024 * 1024;
const COOKIES_PATH = path.join(process.cwd(), 'cookies.txt');

function ensureCookies() {
  if (process.env.YOUTUBE_COOKIES && (!fs.existsSync(COOKIES_PATH) || fs.statSync(COOKIES_PATH).size < 10)) {
    try {
      fs.writeFileSync(COOKIES_PATH, process.env.YOUTUBE_COOKIES.trim(), 'utf8');
      console.log('✅ تم تفعيل ملف cookies.txt من متغير البيئة YOUTUBE_COOKIES بنجاح');
    } catch (e) {
      console.error('❌ خطأ في كتابة ملف الكوكيز:', e.message);
    }
  }
  return fs.existsSync(COOKIES_PATH) && fs.statSync(COOKIES_PATH).size > 10 ? COOKIES_PATH : null;
}

function ytdlp(args, timeout = 300000) {
  const cookieFile = ensureCookies();
  const baseArgs = ['--no-check-certificates', '--geo-bypass'];
  if (cookieFile) {
    baseArgs.push('--cookies', cookieFile);
  } else {
    baseArgs.push('--extractor-args', 'youtube:player_client=android,mweb');
  }
  args = [...baseArgs, ...args];
  return new Promise((res, rej) => {
    execFile(BIN(), args, { timeout, maxBuffer: 50 * 1024 * 1024, windowsHide: true }, (err, out, errout) => {
      if (!err) return res(out);
      if (err.code === 'ENOENT') return rej(new Error('أداة yt-dlp غير مثبتة في النظام.'));
      const msg = String(errout || err.message).split('\n').filter(Boolean).slice(-1)[0]?.slice(0, 300) || err.message;
      rej(new Error(msg));
    });
  });
}

// ═══════════════════════════════════════════════════
// ⚡ بديل تيك توك فائق السرعة وبدون علامة مائية: TikWM API
// ═══════════════════════════════════════════════════
async function fetchTikWM(url) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.play) {
        const videoRes = await fetch(data.data.play, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(60000),
        });
        if (videoRes.ok) {
          const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const filePath = path.join(TMP, `${stamp}.mp4`);
          const buf = Buffer.from(await videoRes.arrayBuffer());
          fs.writeFileSync(filePath, buf);
          return filePath;
        }
      }
    }
  } catch (e) {
    console.error('TikWM API error:', e.message);
  }
  return null;
}

// ═══════════════════════════════════════════════════
// 🔄 بديل يوتيوب: Invidious API (لما yt-dlp يتحجب)
// ═══════════════════════════════════════════════════
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.jing.rocks',
  'https://invidious.privacyredirect.com',
  'https://iv.datura.network',
];

async function fetchFromInvidious(query, kind) {
  let videoId = null;

  // لو رابط يوتيوب → استخرج الـ ID
  const urlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (urlMatch) {
    videoId = urlMatch[1];
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      // لو مش رابط → ابحث الأول
      if (!videoId) {
        const searchRes = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, { signal: AbortSignal.timeout(15000) });
        if (!searchRes.ok) continue;
        const results = await searchRes.json();
        if (!results.length) continue;
        videoId = results[0].videoId;
      }

      // جيب بيانات الفيديو
      const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(15000) });
      if (!infoRes.ok) { videoId = null; continue; }
      const info = await infoRes.json();

      let streamUrl = null;
      if (kind === 'audio') {
        // اختار أفضل صوت
        const audio = info.adaptiveFormats
          ?.filter(f => f.type?.startsWith('audio/'))
          ?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))?.[0];
        streamUrl = audio?.url;
      } else {
        // اختار أفضل فيديو بحجم معقول
        const video = info.formatStreams
          ?.filter(f => f.type?.startsWith('video/'))
          ?.sort((a, b) => parseInt(b.qualityLabel || '0') - parseInt(a.qualityLabel || '0'))?.[0];
        streamUrl = video?.url;
      }

      if (streamUrl) {
        const ext = kind === 'audio' ? 'm4a' : 'mp4';
        const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const filePath = path.join(TMP, `${stamp}.${ext}`);

        const dlRes = await fetch(streamUrl, { signal: AbortSignal.timeout(120000) });
        if (!dlRes.ok) { videoId = null; continue; }
        const arrayBuf = await dlRes.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuf));
        return { filePath, title: info.title || 'بدون عنوان' };
      }
      videoId = null;
    } catch {
      videoId = null;
      continue;
    }
  }
  return null;
}

const pick = (kind, q) => {
  if (isUrl(q)) return q;
  if (kind === 'audio') return `scsearch1:${q}`;
  return `ytsearch1:${q}`;
};

async function fetchFile(kind, query) {
  if (kind !== 'audio' && /tiktok\.com/i.test(query)) {
    const tik = await fetchTikWM(query);
    if (tik) return tik;
  }

  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const fmt = kind === 'audio'
    ? 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio/best'
    : 'best[ext=mp4][filesize<80M]/best[ext=mp4]/best[filesize<80M]/best';

  try {
    const target = pick(kind, query);
    await ytdlp(['-f', fmt, '--no-playlist', '--max-filesize', '90M', '--no-warnings', '-o', path.join(TMP, `${stamp}.%(ext)s`), target]);
    const f = fs.readdirSync(TMP).find(x => x.startsWith(stamp));
    if (!f) throw new Error('فشل التحميل');
    return path.join(TMP, f);
  } catch (e) {
    // لو فشل البحث عن الصوت، جرب يوتيوب كاحتياطي
    if (kind === 'audio' && !isUrl(query) && !query.startsWith('ytsearch')) {
      try {
        console.log('🔄 جاري المحاولة من مصدر يوتيوب...');
        await ytdlp(['-f', fmt, '--no-playlist', '--max-filesize', '90M', '--no-warnings', '-o', path.join(TMP, `${stamp}.%(ext)s`), `ytsearch1:${query}`]);
        const f = fs.readdirSync(TMP).find(x => x.startsWith(stamp));
        if (f) return path.join(TMP, f);
      } catch {}
    }
    throw new Error('تعذر تحميل الأغنية حالياً. يرجى تجربة اسم آخر أو إرسال رابط مباشر.');
  }
}

async function sendDownloaded(c, kind, query, label) {
  const { send, reply, react } = c;
  if (!query) return reply(`💡 اكتب رابط${kind === 'audio' || label === 'يوتيوب' ? ' أو اسم' : ''} بعد الأمر.`);
  await react('⏳');
  const file = await fetchFile(kind, query);
  try {
    const buf = fs.readFileSync(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    if (buf.length > MAX) return reply('❌ حجم الملف يتجاوز الحد الأقصى لواتساب (95MB).');
    if (kind === 'audio') {
      if (ext === 'm4a' || ext === 'mp4') await send({ audio: buf, mimetype: 'audio/mp4' });
      else if (ext === 'mp3') await send({ audio: buf, mimetype: 'audio/mpeg' });
      else await send({ document: buf, mimetype: 'audio/' + ext, fileName: path.basename(file) });
    } else if (buf.length > 60 * 1024 * 1024 || ext !== 'mp4') {
      await send({ document: buf, mimetype: 'video/' + (ext || 'mp4'), fileName: path.basename(file) });
    } else {
      await send({ video: buf, caption: `╭━━━〔 📥 *تم التحميل بنجاح* 〕━━━╮\n│\n│ 🎬 المصدر: *${label}*\n│ ⚡ *${config.botName}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯` });
    }
    await react('✅');
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const site = (name, regex, kind = 'video') => ({
  name: name.ar,
  aliases: [name.en],
  desc: `تحميل مباشر من ${name.ar}`,
  async run(c) {
    if (!regex.test(c.text)) return c.reply(`اكتب رابط ${name.ar} بعد الأمر.`);
    await sendDownloaded(c, kind, c.text, name.ar);
  },
});

export default [
  {
    name: 'ميديا',
    aliases: ['media', 'alldl', 'تحميل_ميديا', 'سوشيال', 'تنزيل'],
    desc: 'التحميل الشامل من إنستجرام، تيك توك، فيسبوك، تويتر، ثريدز، ويوتيوب',
    async run(c) {
      const url = c.text.trim();
      if (!isUrl(url)) {
        return c.reply('💡 اكتب أو الصق رابط الفيديو بعد الأمر.\nمثال: */ميديا https://www.instagram.com/reel/xxx*');
      }
      let label = 'سوشيال ميديا';
      if (/instagram\.com/i.test(url)) label = 'إنستجرام';
      else if (/tiktok\.com/i.test(url)) label = 'تيك توك';
      else if (/facebook\.com|fb\.watch/i.test(url)) label = 'فيسبوك';
      else if (/twitter\.com|x\.com/i.test(url)) label = 'تويتر (X)';
      else if (/threads\.net/i.test(url)) label = 'ثريدز';
      else if (/youtube\.com|youtu\.be/i.test(url)) label = 'يوتيوب';
      else if (/pinterest\.com/i.test(url)) label = 'بينترست';

      await sendDownloaded(c, 'video', url, label);
    },
  },

  {
    name: 'تحميل',
    aliases: ['dl', 'download'],
    desc: 'تحميل أي ملف من رابط مباشر (صور، فيديوهات، مستندات)',
    async run({ text, send, reply, react }) {
      if (!isUrl(text)) return reply('اكتب رابط مباشر لملف.\nمثال: */تحميل https://site.com/file.pdf*');
      await react('⏳');
      const { buffer, mime } = await getBuffer(text);
      const name = decodeURIComponent(new URL(text).pathname.split('/').pop() || 'file');
      if (mime.startsWith('image/')) await send({ image: buffer });
      else if (mime.startsWith('video/')) await send({ video: buffer });
      else if (mime.startsWith('audio/')) await send({ audio: buffer, mimetype: mime });
      else await send({ document: buffer, mimetype: mime || 'application/octet-stream', fileName: name });
      await react('✅');
    },
  },

  { name: 'يوتيوب_بلس', aliases: ['yt', 'ytv'], desc: 'تحميل فيديو من يوتيوب (رابط أو اسم)',
    async run(c) { await sendDownloaded(c, 'video', c.text, 'يوتيوب'); } },

  { name: 'اغنية', aliases: ['play', 'song', 'شيلة'], desc: 'تحميل أغنية/صوت من يوتيوب (اسم أو رابط)',
    async run(c) { await sendDownloaded(c, 'audio', c.text, 'يوتيوب'); } },

  { name: 'فيديو', aliases: ['video'], desc: 'تحميل فيديو من أي رابط مدعوم',
    async run(c) {
      if (!isUrl(c.text)) return c.reply('اكتب رابط الفيديو المراد تحميله.');
      await sendDownloaded(c, 'video', c.text, 'فيديو');
    } },

  { name: 'صوت_فيديو', aliases: ['tomp3', 'استخراج_صوت', 'صوتية'], desc: 'استخراج وتحميل الصوت من أي رابط فيديو',
    async run(c) {
      if (!isUrl(c.text)) return c.reply('اكتب رابط الفيديو لاستخراج الصوت منه.');
      await sendDownloaded(c, 'audio', c.text, 'صوت');
    } },

  site({ ar: 'تيك', en: 'tiktok' }, /tiktok\.com/i),
  site({ ar: 'انستا', en: 'instagram' }, /instagram\.com/i),
  site({ ar: 'فيسبوك', en: 'facebook' }, /(facebook\.com|fb\.watch)/i),
  site({ ar: 'تويتر', en: 'twitter' }, /(twitter\.com|x\.com)/i),
  site({ ar: 'ساوند', en: 'soundcloud' }, /soundcloud\.com/i, 'audio'),
  site({ ar: 'ثريدز', en: 'threads' }, /threads\.net/i),

  {
    name: 'بحث_يوتيوب',
    aliases: ['yts'],
    desc: 'البحث في يوتيوب وعرض أول 5 نتائج مع الروابط والمدد',
    async run({ text, reply }) {
      if (!text) return reply('اكتب كلمة البحث.');
      try {
        const out = await ytdlp(['--flat-playlist', '--no-warnings', '--print', '%(title)s | %(duration_string)s | https://youtu.be/%(id)s', `ytsearch5:${text}`], 60000);
        reply('╭━━━〔 🔎 *نتائج بحث يوتيوب* 〕━━━╮\n\n' + out.trim().split('\n').map((l, i) => `[0${i + 1}] ${l}`).join('\n\n') + '\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯');
      } catch {
        // فولباك: Invidious API
        for (const inst of INVIDIOUS_INSTANCES) {
          try {
            const r = await fetch(`${inst}/api/v1/search?q=${encodeURIComponent(text)}&type=video`, { signal: AbortSignal.timeout(10000) });
            if (!r.ok) continue;
            const results = (await r.json()).slice(0, 5);
            const lines = results.map((v, i) => `[0${i + 1}] ${v.title} | ${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, '0')} | https://youtu.be/${v.videoId}`);
            return reply('╭━━━〔 🔎 *نتائج بحث يوتيوب* 〕━━━╮\n\n' + lines.join('\n\n') + '\n\n╰━━━━━━━━━━━━━━━━━━━━━━╯');
          } catch { continue; }
        }
        reply('❌ تعذر البحث في يوتيوب حالياً.');
      }
    },
  },

  {
    name: 'معلومات_فيديو',
    aliases: ['vinfo'],
    desc: 'استخراج تفاصيل وإحصائيات أي فيديو عبر الرابط',
    async run({ text, reply }) {
      if (!isUrl(text)) return reply('اكتب رابط الفيديو.');
      try {
        const j = JSON.parse(await ytdlp(['--dump-single-json', '--no-playlist', '--skip-download', '--no-warnings', text], 90000));
        reply(`╭━━━〔 🎬 *بيانات الفيديو* 〕━━━╮\n│\n│ 📌 العنوان: *${j.title}*\n│ 👤 القناة: *${j.uploader || '-'}*\n│ ⏱️ المدة: *${j.duration_string || '-'}*\n│ 👁️ المشاهدات: *${money(j.view_count)}*\n│ 📅 التاريخ: *${j.upload_date || '-'}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      } catch {
        // فولباك: Invidious
        const urlMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
        if (!urlMatch) return reply('❌ رابط يوتيوب غير صالح.');
        for (const inst of INVIDIOUS_INSTANCES) {
          try {
            const r = await fetch(`${inst}/api/v1/videos/${urlMatch[1]}`, { signal: AbortSignal.timeout(10000) });
            if (!r.ok) continue;
            const j = await r.json();
            return reply(`╭━━━〔 🎬 *بيانات الفيديو* 〕━━━╮\n│\n│ 📌 العنوان: *${j.title}*\n│ 👤 القناة: *${j.author || '-'}*\n│ ⏱️ المدة: *${Math.floor(j.lengthSeconds / 60)}:${String(j.lengthSeconds % 60).padStart(2, '0')}*\n│ 👁️ المشاهدات: *${money(j.viewCount)}*\n│ 📅 التاريخ: *${j.publishedText || '-'}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
          } catch { continue; }
        }
        reply('❌ تعذر جلب معلومات الفيديو.');
      }
    },
  },
];
