import { db, save } from './db.js';

// ══════════════════════════════════════════════════════════════
// 🎭 محرك المودات والثيمات المتقدم لبوت NO & NO
// ══════════════════════════════════════════════════════════════

export const THEMES = {
  // 1. مود الرعب المظلم (Dark Horror Gothic) - الوضع الافتراضي المرعب
  horror: {
    key: 'horror',
    name: 'مود الرعب المظلم (Dark Horror)',
    emoji: '💀',
    title: '💀 NO & NO DARK HORROR 💀',
    subtitle: '🩸 عالم الرعب السادي والسرعة المظلمة 🩸',
    decor: '🩸',
    emojis: ['🩸', '💀', '⛓️', '🌑', '🦇', '👁️', '🗡️', '🕸️', '⚰️', '🕯️', '🔥'],
    banners: [
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&auto=format&fit=crop&q=80', // Spooky dark forest
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', // Gothic neon skull
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80', // Dark mystery mist
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop&q=80', // Dark cyber demon
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80', // Creepy dark red abstract
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', // Blood dark fluid art
      'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&auto=format&fit=crop&q=80', // Dark gothic castle
      'https://images.unsplash.com/photo-1519074069444-1ba4eae16e60?w=1200&auto=format&fit=crop&q=80', // Blood red moon
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80', // Glowing predator eyes
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80', // Cyber horror demon skull
      'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&auto=format&fit=crop&q=80', // Red night eclipse
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', // Grim reaper scythe
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=80', // Dark haunted ruins
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1200&auto=format&fit=crop&q=80', // Bloody horror paint
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', // Mysterious dark galaxy
    ],
  },

  // 2. مود السايبر بانك الهاكر (Neon Cyberpunk)
  cyberpunk: {
    key: 'cyberpunk',
    name: 'مود السايبر بانك (Cyber Matrix)',
    emoji: '⚡',
    title: '⚡ NO & NO CYBER MATRIX 2.0 ⚡',
    subtitle: '💻 نظام المستقبل والاختراق المتقدم 💻',
    decor: '⚡',
    emojis: ['⚡', '💻', '🤖', '🔮', '🛰️', '🌌', '🧬', '👾', '🕹️', '📟'],
    banners: [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=1200&auto=format&fit=crop&q=80', // Cyber neon city
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80', // Matrix code green
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80', // Cyber security neon
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80', // Microchip motherboard
    ],
  },

  // 3. مود الأنمي والأوتاكو (Anime Otaku)
  anime: {
    key: 'anime',
    name: 'مود الأنمي والأوتاكو (Otaku Realm)',
    emoji: '🌸',
    title: '🌸 NO & NO OTAKU REALM 🌸',
    subtitle: '⛩️ بوابة الأنمي والمانجا الخارقة ⛩️',
    decor: '✨',
    emojis: ['🌸', '⚔️', '🔥', '🍙', '⛩️', '✨', '🍥', '🍜', '🎋', '🎏'],
    banners: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    ],
  },

  // 4. مود الفخامة والملكي (Royal Gold VIP)
  royal: {
    key: 'royal',
    name: 'مود الفخامة الذهبي (Royal VIP)',
    emoji: '👑',
    title: '👑 NO & NO ROYAL EMPIRE 👑',
    subtitle: '💎 إصدار الفخامة والأناقة الملكية 💎',
    decor: '⚜️',
    emojis: ['👑', '💎', '⚜️', '🪙', '🏛️', '🏆', '🦅', '🦁', '🌟', '🛡️'],
    banners: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop&q=80',
    ],
  },

  // 5. مود الروبوت الكلاسيكي الميكانيكي (Vintage Iron Robot & Steam Gears)
  robot: {
    key: 'robot',
    name: 'مود الروبوت الكلاسيكي الميكانيكي (Vintage Mecha)',
    emoji: '⚙️',
    title: '⚙️ NO & NO VINTAGE MECHA BOT ⚙️',
    subtitle: '🔩 محركات التروس والأنظمة الميكانيكية العتيقة 🔩',
    decor: '⚙️',
    emojis: ['⚙️', '🔩', '🤖', '🏭', '🔧', '🛠️', '📻', '💡', '🛢️', '⚡'],
    banners: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
    ],
  },
};

let lastBannerIdx = -1;

export function getActiveThemeKey() {
  return db.settings?.activeTheme || 'horror';
}

export function getActiveTheme() {
  const key = getActiveThemeKey();
  return THEMES[key] || THEMES.horror;
}

export function setActiveTheme(key) {
  if (!THEMES[key]) return false;
  db.settings.activeTheme = key;
  save();
  return true;
}

export function getThemeBanner(themeKey = null) {
  const theme = themeKey ? (THEMES[themeKey] || getActiveTheme()) : getActiveTheme();
  const list = theme.banners || THEMES.horror.banners;
  let idx = Math.floor(Math.random() * list.length);
  if (idx === lastBannerIdx && list.length > 1) idx = (idx + 1) % list.length;
  lastBannerIdx = idx;
  return list[idx];
}

export function getThemeReaction(themeKey = null) {
  const theme = themeKey ? (THEMES[themeKey] || getActiveTheme()) : getActiveTheme();
  const list = theme.emojis || THEMES.horror.emojis;
  return list[Math.floor(Math.random() * list.length)];
}

export function isCardImageEnabled() {
  return db.settings?.cardImageEnabled !== false; // افتراضياً مفعّل لعرض الصور المرعبة مع الأوامر
}
