import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { db } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'commands');
export const commands = new Map(); // الاسم أو الاسم المستعار -> الأمر
export const registeredCommandsList = []; // قائمة الأوامر الفريدة بدون أي تكرار

// صلاحيات افتراضية لكل قسم
const DEFAULTS = {
  admin: { group: true, admin: true },
  groups: { group: true },
  owner: { owner: true },
};

export async function loadCommands() {
  commands.clear();
  registeredCommandsList.length = 0;

  const disabledCmds = (db.settings?.disabledCmds || []).map(x => x.toLowerCase().trim());
  const seenNames = new Set();
  const seenAliases = new Set();

  for (const section of fs.readdirSync(dir)) {
    const sdir = path.join(dir, section);
    if (!fs.statSync(sdir).isDirectory()) continue;
    for (const file of fs.readdirSync(sdir).filter(f => f.endsWith('.js'))) {
      try {
        const imported = (await import(pathToFileURL(path.join(sdir, file)).href)).default;
        for (const mod of [].concat(imported)) {
          if (!mod || !mod.name) continue;

          const mainName = mod.name.toLowerCase().trim();

          // 1. فحص إذا كان الأمر محذوفاً/معطلاً من قبل المطور
          if (disabledCmds.includes(mainName)) {
            continue;
          }

          // 2. منع التكرار التام لأسماء الأوامر
          if (seenNames.has(mainName)) {
            continue; // تم تسجيل الأمر مسبقاً من ملف رئيسي، تجاهل التكرار
          }
          seenNames.add(mainName);

          mod.section = section;
          for (const [k, v] of Object.entries(DEFAULTS[section] || {})) {
            mod[k] ??= v;
          }

          // تسجيل الاسم الأساسي
          commands.set(mainName, mod);
          registeredCommandsList.push(mod);

          // 3. تصفية الأسماء المستعارة لمنع أي تضارب أو تكرار
          const cleanAliases = [];
          if (Array.isArray(mod.aliases)) {
            for (const alias of mod.aliases) {
              const a = alias.toLowerCase().trim();
              if (
                a &&
                !disabledCmds.includes(a) &&
                !seenNames.has(a) &&
                !seenAliases.has(a)
              ) {
                seenAliases.add(a);
                cleanAliases.push(alias);
                commands.set(a, mod);
              }
            }
          }
          mod.aliases = cleanAliases;
        }
      } catch (err) {
        console.error(`⚠️ خطأ في تحميل ملف الأوامر ${file}:`, err.message);
      }
    }
  }

  console.log(`📦 [المحمل الذكي] تم تحميل ${registeredCommandsList.length} أمر فريد بدون أي تكرار نهائياً.`);
}

export const uniqueCommands = () => registeredCommandsList;

/**
 * تعطيل ومسح أمر من القائمة بالكامل وحفظه في الإعدادات
 */
export function disableCommand(cmdName) {
  const q = cmdName.toLowerCase().replace(/^[./!#]/, '').trim();
  db.settings ??= {};
  db.settings.disabledCmds ??= [];
  if (!db.settings.disabledCmds.includes(q)) {
    db.settings.disabledCmds.push(q);
  }

  // إزالة من الخريطة المباشرة
  commands.delete(q);
  const idx = registeredCommandsList.findIndex(c => c.name.toLowerCase() === q || (c.aliases || []).some(a => a.toLowerCase() === q));
  if (idx !== -1) {
    const removed = registeredCommandsList[idx];
    registeredCommandsList.splice(idx, 1);
    commands.delete(removed.name.toLowerCase());
    (removed.aliases || []).forEach(a => commands.delete(a.toLowerCase()));
    return removed;
  }
  return null;
}

/**
 * استعادة أمر محذوف وإعادته للعمل
 */
export async function enableCommand(cmdName) {
  const q = cmdName.toLowerCase().replace(/^[./!#]/, '').trim();
  db.settings ??= {};
  db.settings.disabledCmds ??= [];
  db.settings.disabledCmds = db.settings.disabledCmds.filter(x => x !== q);
  await loadCommands();
  return true;
}

/**
 * جلب قائمة الأوامر المعطلة/الممسوحة
 */
export function getDisabledCommands() {
  return db.settings?.disabledCmds || [];
}
