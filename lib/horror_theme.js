// مكتبة المظهر والرعب المتقدمة لبوت no and no - Dark Gothic / Horror Edition

export const HORROR_IMAGES = [
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&auto=format&fit=crop&q=80', // Dark spooky forest
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', // Gothic skull neon
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80', // Dark mystery mist
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop&q=80', // Neon dark cyber demon
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80', // Creepy dark red abstract
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', // Blood dark fluid art
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&auto=format&fit=crop&q=80', // Dark fantasy castle
  'https://images.unsplash.com/photo-1519074069444-1ba4eae16e60?w=1200&auto=format&fit=crop&q=80', // Red moon spooky night
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80', // Creepy glowing eyes
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80', // Dark horror cyber skull
  'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&auto=format&fit=crop&q=80', // Red night eclipse
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', // Dark matter cyber
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', // Neon scythe reaper
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', // Crimson dark glow
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&auto=format&fit=crop&q=80', // Horror fog
];

export const HORROR_EMOJIS = ['🩸', '💀', '⛓️', '🌑', '🦇', '👁️', '🗡️', '🕸️', '🔥', '🕷️', '🕯️', '⚰️'];

let lastIdx = -1;

export function getHorrorBanner() {
  let idx = Math.floor(Math.random() * HORROR_IMAGES.length);
  if (idx === lastIdx) idx = (idx + 1) % HORROR_IMAGES.length;
  lastIdx = idx;
  return HORROR_IMAGES[idx];
}

export function getHorrorReaction() {
  return HORROR_EMOJIS[Math.floor(Math.random() * HORROR_EMOJIS.length)];
}
