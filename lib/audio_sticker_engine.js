import { spawn } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

/**
 * يحوّل أي Buffer صورة (png/jpeg/webp/gif/svg) إلى PNG 512x512 بشكل آمن
 */
async function normalizeImageToPNG(imageBuffer) {
  try {
    const png = await sharp(imageBuffer, { failOnError: false })
      .resize(512, 512, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .png()
      .toBuffer();
    return png;
  } catch {
    // fallback: بوستر NO & NO الافتراضي
    const { getDefaultAudioPoster } = await import('./audio_poster.js');
    return getDefaultAudioPoster();
  }
}

/**
 * دمج صورة مع مقطع صوتي لإنتاج فيديو MP4 مربع 512x512 بصوت مدمج
 * يدعم: MP3 / OGG / OPUS / M4A / WAV / AAC
 */
export async function createAudioStickerVideo(imageBuffer, audioBuffer) {
  const tmpDir = os.tmpdir();
  const id = Date.now() + '_' + Math.floor(Math.random() * 100000);

  // تحويل الصورة لـ PNG أولاً لضمان التوافق مع ffmpeg
  const pngBuffer = await normalizeImageToPNG(imageBuffer);

  const imgPath = path.join(tmpDir, `asg_img_${id}.png`);
  const audPath = path.join(tmpDir, `asg_aud_${id}.oga`);
  const outPath = path.join(tmpDir, `asg_out_${id}.mp4`);

  await fs.promises.writeFile(imgPath, pngBuffer);
  await fs.promises.writeFile(audPath, audioBuffer);

  return new Promise((resolve, reject) => {
    // ffmpeg: صورة ثابتة PNG + صوت (ogg/opus/mp3) → MP4 متوافق مع واتساب
    const args = [
      '-y',
      '-loop', '1',
      '-framerate', '1',
      '-i', imgPath,
      '-i', audPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'stillimage',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-ac', '1',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=512:512,setsar=1',
      '-shortest',
      '-movflags', '+faststart',
      outPath
    ];

    const p = spawn(ffmpegInstaller.path, args);

    let errLog = '';
    p.stderr.on('data', d => { errLog += d.toString(); });

    p.on('close', async (code) => {
      for (const f of [imgPath, audPath]) {
        try { if (fs.existsSync(f)) await fs.promises.unlink(f); } catch {}
      }

      if (code === 0 && fs.existsSync(outPath)) {
        try {
          const videoBuf = await fs.promises.readFile(outPath);
          await fs.promises.unlink(outPath).catch(() => {});
          resolve(videoBuf);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('FFMPEG فشل: ' + errLog.slice(-400)));
      }
    });

    p.on('error', reject);
  });
}
