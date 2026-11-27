import sharp from 'sharp';

export async function getDefaultAudioPoster() {
  const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#070c15" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />
  <circle cx="256" cy="210" r="95" fill="rgba(79, 209, 176, 0.12)" stroke="#4fd1b0" stroke-width="4" />
  <text x="256" y="240" font-size="75" text-anchor="middle" fill="#4fd1b0">🎵</text>
  <text x="256" y="370" font-family="sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#ffffff">NO &amp; NO AUDIO</text>
  <text x="256" y="415" font-family="sans-serif" font-size="19" text-anchor="middle" fill="#4fd1b0">SUPPORT NO &amp; NO BOT ⚡</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
