// ══════════════════════════════════════════════════════════════
// 🕵️ نظام تخزين الرسائل وكاشف المحذوف وصائد السرية (Message Store)
// ══════════════════════════════════════════════════════════════

import { db } from './db.js';

// تخزين آخر 1000 رسالة في الذاكرة للبحث الفوري
const messageCache = new Map();
const MAX_CACHE_SIZE = 1000;

export function saveMessage(m, mediaBuffer = null, mimeType = '') {
  if (!m?.key?.id) return;
  const id = m.key.id;
  const jid = m.key.remoteJid;
  const participant = m.key.participant || (m.key.fromMe ? null : jid);
  const text = m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption || '';

  const entry = {
    id,
    jid,
    participant,
    fromMe: Boolean(m.key.fromMe),
    pushName: m.pushName || 'عضو',
    text,
    message: m.message,
    media: mediaBuffer,
    mime: mimeType,
    timestamp: Date.now(),
    isViewOnce: Boolean(
      m.message?.viewOnceMessage ||
      m.message?.viewOnceMessageV2 ||
      m.message?.viewOnceMessageV2Extension
    )
  };

  messageCache.set(id, entry);
  if (messageCache.size > MAX_CACHE_SIZE) {
    const oldestKey = messageCache.keys().next().value;
    messageCache.delete(oldestKey);
  }
}

export function getStoredMessage(id) {
  return messageCache.get(id) || null;
}

export const clearMessageStore = () => messageCache.clear();
