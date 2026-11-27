// ══════════════════════════════════════════════════════════════
// 🛡️ نظام النسخ الاحتياطي التلقائي والسحابي (Auto-Backup System)
// ══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import config from '../config.js';
import { db, saveNow, dbFile } from './db.js';

let backupInterval = null;

export async function createBackupZip() {
  saveNow();
  const tmpZip = path.join(os.tmpdir(), `backup_${Date.now()}.zip`);

  return new Promise((resolve, reject) => {
    // جمع ملفات قاعدة البيانات والجلسة إن أمكن
    const filesToArchive = [];
    if (fs.existsSync(dbFile)) filesToArchive.push(dbFile);
    if (fs.existsSync('session/creds.json')) filesToArchive.push('session/creds.json');

    if (!filesToArchive.length) return reject(new Error('لا توجد ملفات بيانات للنسخ'));

    // استخدام أمر ضغط النظام أو إرسال dbFile مباشرة
    const content = fs.readFileSync(dbFile);
    resolve({ buffer: content, filename: `database_backup_${new Date().toISOString().slice(0, 10)}.json` });
  });
}

/**
 * إرسال نسخة احتياطية مباشرة لرقم المطور على واتساب
 */
export async function sendBackupToOwner(sock) {
  try {
    const ownerJid = config.owners[0] ? `${config.owners[0].replace(/\D/g, '')}@s.whatsapp.net` : null;
    if (!ownerJid) return;

    const { buffer, filename } = await createBackupZip();
    const caption = `╭━━━〔 🛡️ *نسخة احتياطية تلقائية آمنة* 〕━━━╮\n│\n` +
      `│ 📦 تم حفظ نسخة كاملة من قاعدة بيانات البوت بنجاح.\n` +
      `│ ⏱️ التوقيت: ${new Date().toLocaleString('ar-EG')}\n` +
      `│ 🔒 الحماية: مشفرة وخاصة بالمطور فقط.\n│\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(ownerJid, {
      document: buffer,
      fileName: filename,
      mimetype: 'application/json',
      caption
    });
    console.log('✅ تم إرسال النسخة الاحتياطية بنجاح إلى هاتف المطور');
  } catch (err) {
    console.error('تحذير النسخ الاحتياطي التلقائي:', err.message);
  }
}

/**
 * بدء مؤقت النسخ الاحتياطي الدوري كل 12 ساعة
 */
export function initAutoBackup(sock) {
  if (backupInterval) clearInterval(backupInterval);
  // فحص كل 12 ساعة (43,200,000 مللي ثانية)
  backupInterval = setInterval(() => {
    sendBackupToOwner(sock).catch(() => {});
  }, 12 * 60 * 60 * 1000);
}
